import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

registerHooks({ resolve(specifier, context, next) {
  if (specifier.startsWith('.') && context.parentURL?.includes('/src/')) {
    const candidate = new URL(specifier + '.ts', context.parentURL);
    if (existsSync(fileURLToPath(candidate))) return next(candidate.href, context);
  }
  return next(specifier, context);
} });
const { cleanupExpiredTts, drainTtsCleanupQueue, createSupabaseTtsStore } = await import('../src/lib/server/reading-tts/store.ts');
const owner = '00000000-0000-4000-8000-000000000001';
const lease = '00000000-0000-4000-8000-000000000002';
const key = 'a'.repeat(64);
const path = `${owner}/${key}/${lease}.ndjson`;
const entry = { owner_id: owner, cache_key: key, lease_id: lease, status: 'ready', object_path: path, expires_at: '2020-01-01T00:00:00Z', lease_expires_at: null };

// Protocol double only: database transactions/RLS and physical Storage deletion
// still require the isolated SQL suite and authenticated Storage HTTP tests.
function storageFixture({ rows = [entry], storageError = null, rpcResult = true } = {}) {
  const calls = [];
  const client = {
    storage: { from(bucket) {
      assert.equal(bucket, 'reading-audio');
      return {
        async remove(paths) { calls.push(['remove', paths]); return { error: storageError }; },
        async upload(objectPath, _body, options) { calls.push(['upload', objectPath, options]); return { error: null }; },
      };
    } },
    async rpc(name, args) { calls.push(['rpc', name, args]); return { data: rpcResult, error: null }; },
    from(table) {
      const chain = { operation: 'select', filters: [] };
      for (const method of ['select', 'delete', 'eq', 'in', 'lte', 'or', 'order', 'limit']) {
        chain[method] = (...args) => {
          if (method === 'select' || method === 'delete') chain.operation = method;
          else chain.filters.push([method, ...args]);
          return chain;
        };
      }
      chain.then = (resolve) => {
        calls.push([chain.operation, table, chain.filters]);
        resolve({ data: chain.operation === 'select' ? rows : null, error: null });
      };
      return chain;
    },
  };
  return { client, calls };
}

test('expired audio is removed before owner/lease-fenced metadata deletion', async () => {
  const { client, calls } = storageFixture();
  assert.equal(await cleanupExpiredTts(client, key, owner), 1);
  assert.deepEqual(calls.map((call) => call[0]), ['select', 'remove', 'delete']);
  assert.deepEqual(calls[1], ['remove', [path]]);
  const filters = calls[2][2];
  for (const filter of [['eq', 'cache_key', key], ['eq', 'owner_id', owner], ['eq', 'lease_id', lease]]) assert.ok(filters.some((item) => JSON.stringify(item) === JSON.stringify(filter)));
  assert.match(filters.find((item) => item[0] === 'or')[1], /expires_at.lte.*lease_expires_at.lte/);
});
test('Storage deletion failure retains metadata and its reserved capacity', async () => {
  const { client, calls } = storageFixture({ storageError: { message: 'private diagnostic' } });
  await assert.rejects(cleanupExpiredTts(client), { code: 'storage_failure' });
  assert.equal(calls.some((call) => call[0] === 'delete'), false);
});
test('cleanup refuses unsafe paths and does not delete an active lease', async () => {
  const unsafe = storageFixture({ rows: [{ ...entry, object_path: '../private' }] });
  await assert.rejects(cleanupExpiredTts(unsafe.client), { code: 'storage_failure' });
  assert.equal(unsafe.calls.some((call) => call[0] === 'remove'), false);
  const active = storageFixture({ rows: [{ ...entry, status: 'pending', lease_expires_at: new Date(Date.now() + 60_000).toISOString() }] });
  assert.equal(await cleanupExpiredTts(active.client), 0);
  assert.equal(active.calls.some((call) => call[0] === 'remove'), false);
});
test('deletion outbox drains physical objects before releasing due queue rows', async () => {
  const { client, calls } = storageFixture({ rows: [{ object_path: path }] });
  assert.equal(await drainTtsCleanupQueue(client), 1);
  assert.deepEqual(calls.map((call) => call[0]), ['select', 'remove', 'delete']);
  assert.equal(calls[2][1], 'reading_tts_cleanup_queue');
  assert.ok(calls[2][2].some((filter) => filter[0] === 'lte' && filter[1] === 'not_before'));
});
test('failed outbox deletion retains the retryable queue record', async () => {
  const { client, calls } = storageFixture({ rows: [{ object_path: path }], storageError: {} });
  await assert.rejects(drainTtsCleanupQueue(client), { code: 'storage_failure' });
  assert.equal(calls.some((call) => call[0] === 'delete'), false);
});
test('a lost completion lease removes only that worker upload without overwriting a replacement', async () => {
  const { client, calls } = storageFixture({ rpcResult: false });
  await assert.rejects(createSupabaseTtsStore(client).save(owner, key, lease, Uint8Array.of(1)), { code: 'storage_failure' });
  assert.equal(calls[0][2].upsert, false);
  assert.deepEqual(calls.at(-1), ['remove', [path]]);
});
