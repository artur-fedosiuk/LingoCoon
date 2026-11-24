import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { AiQuotaExceededError, consumeAiQuota } from '../src/lib/server/ai-quota.ts';

function createFakeClient(results) {
  const calls = [];
  const queue = [...results];
  const client = {
    rpc: async (name, args) => {
      calls.push({ name, args });
      return queue.shift() ?? { data: true, error: null };
    },
  };
  return { calls, client };
}

describe('consumeAiQuota', () => {
  test('consumes the feature burst bucket, then the daily bucket', async () => {
    const fake = createFakeClient([]);
    await consumeAiQuota(fake.client, 'tutor');

    assert.equal(fake.calls.length, 2);
    assert.deepEqual(fake.calls[0], {
      name: 'consume_ai_quota',
      args: { p_bucket: 'tutor', p_limit: 20, p_window_seconds: 60 },
    });
    assert.deepEqual(fake.calls[1], {
      name: 'consume_ai_quota',
      args: { p_bucket: 'ai_daily', p_limit: 1000, p_window_seconds: 86400 },
    });
  });

  test('throws AiQuotaExceededError when the burst limit is exceeded and skips the daily bucket', async () => {
    const fake = createFakeClient([{ data: false, error: null }]);

    await assert.rejects(
      consumeAiQuota(fake.client, 'stt'),
      (error) => error instanceof AiQuotaExceededError,
    );
    assert.equal(fake.calls.length, 1);
  });

  test('throws AiQuotaExceededError when the daily limit is exceeded', async () => {
    const fake = createFakeClient([
      { data: true, error: null },
      { data: false, error: null },
    ]);

    await assert.rejects(
      consumeAiQuota(fake.client, 'lexicoon'),
      (error) => error instanceof AiQuotaExceededError,
    );
    assert.equal(fake.calls.length, 2);
  });

  test('fails closed on a database error', async () => {
    const fake = createFakeClient([{ data: null, error: { message: 'boom' } }]);

    await assert.rejects(
      consumeAiQuota(fake.client, 'tutor'),
      (error) => error instanceof Error && !(error instanceof AiQuotaExceededError),
    );
  });

  test('fails closed when the database returns a non-boolean value', async () => {
    const fake = createFakeClient([{ data: 'yes', error: null }]);

    await assert.rejects(
      consumeAiQuota(fake.client, 'tutor'),
      (error) => error instanceof Error && !(error instanceof AiQuotaExceededError),
    );
  });
});