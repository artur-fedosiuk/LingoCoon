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
const { fetchAdmittedAudio } = await import('../src/lib/reading-tts/admission-client.ts');
const { createTtsService } = await import('../src/lib/server/reading-tts/service.ts');
const { createTtsHandler } = await import('../src/lib/server/reading-tts/handler.ts');
const { createWavTtsHandler } = await import('../src/lib/server/reading-tts/compatibility.ts');
const { TtsError } = await import('../src/lib/reading-tts/contract.ts');
const input = { text: 'Practice.', language: 'en', voice: 'female', speed: 1, mode: 'sentence' };
const init = () => ({ method: 'POST', body: JSON.stringify(input), signal: new AbortController().signal });
const queued = () => Response.json({ code: 'queued' }, { status: 202, headers: { 'Retry-After': '4' } });

test('100 separate clients wait for explicit admission and preserve their request bodies', async () => {
  // HTTP protocol fixture, not a substitute for the PostgreSQL load test.
  const results = await Promise.all(Array.from({ length: 100 }, async (_, user) => {
    let calls = 0; let clock = 0;
    const request = { ...init(), body: JSON.stringify({ user }) };
    const response = await fetchAdmittedAudio('/api/tts', request, {
      now: () => clock, random: () => 0,
      wait: async (ms) => { clock += ms; },
      fetch: async (_url, options) => {
        assert.equal(options.body, request.body);
        calls += 1;
        return calls < 3 ? queued() : new Response(`audio-${user}`);
      },
    });
    assert.equal(calls, 3);
    return response.text();
  }));
  assert.equal(new Set(results).size, 100);
});
test('queue wait is bounded and only 202 queued is retried', async () => {
  let clock = 0; let calls = 0;
  await assert.rejects(fetchAdmittedAudio('/api/tts', init(), {
    maxWaitMs: 9000, now: () => clock, random: () => 0,
    wait: async (ms) => { clock += ms; },
    fetch: async () => { calls += 1; return queued(); },
  }), { code: 'busy' });
  assert.equal(calls, 3);
  for (const status of [401, 429, 500, 502, 503]) {
    let count = 0;
    const response = await fetchAdmittedAudio('/api/tts', init(), {
      fetch: async () => { count += 1; return Response.json({ error: 'provider_failure' }, { status }); },
    });
    assert.equal(response.status, status); assert.equal(count, 1);
  }
  await assert.rejects(fetchAdmittedAudio('/api/tts', init(), {
    fetch: async () => { throw new TypeError('network'); },
  }), /network/);
});
test('cancel while queued prevents the next HTTP attempt', async () => {
  const controller = new AbortController(); let calls = 0;
  const pending = fetchAdmittedAudio('/api/tts', { ...init(), signal: controller.signal }, {
    fetch: async () => { calls += 1; return queued(); },
    onQueued: () => controller.abort(),
  });
  await assert.rejects(pending, { name: 'AbortError' });
  assert.equal(calls, 1);
});
test('unexpected 202 data cannot become an unbounded retry', async () => {
  await assert.rejects(fetchAdmittedAudio('/api/tts', init(), {
    fetch: async () => Response.json({ code: 'provider_failure' }, { status: 202 }),
  }), { code: 'invalid_audio' });
});
test('queued admission dispatches no audio and both endpoints expose safe 202 responses', async () => {
  let dispatches = 0;
  const service = createTtsService({ async reserve() { return { status: 'queued' }; } }, {
    id: 'google', model: 'test', voice: 'test',
    async *stream() { dispatches += 1; throw new Error('Unexpected synthesis'); },
  });
  await assert.rejects(service.open(input, 'owner', 'key', 'ip', 'lease', new AbortController().signal), { code: 'queued' });
  assert.equal(dispatches, 0);
  for (const handler of [createTtsHandler, createWavTtsHandler]) {
    const endpoint = handler({ authenticate: async () => 'owner', open: async () => { throw new TtsError('queued'); } });
    const body = handler === createTtsHandler ? input : { text: input.text, languageCode: 'en' };
    const response = await endpoint(new Request('https://example.test/api/tts', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    }));
    assert.equal(response.status, 202);
    assert.equal(response.headers.get('Retry-After'), '4');
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
  }
});
