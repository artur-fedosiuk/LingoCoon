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
const { ttsInputSchema, TtsError, readNdjson, ttsStatus } = await import('../src/lib/reading-tts/contract.ts');
const { getReadingTtsConfig } = await import('../src/lib/server/reading-tts/config.ts');
const { ttsCacheKey } = await import('../src/lib/server/reading-tts/cache-key.ts');
const { createTtsService } = await import('../src/lib/server/reading-tts/service.ts');
const { createTtsHandler } = await import('../src/lib/server/reading-tts/handler.ts');
const input = ttsInputSchema.parse({ text: 'I read it yesterday.', language: 'en', mode: 'sentence' });
const providerId = { id: 'google', model: 'chirp3-hd-plain-v1', voice: 'test-voice' };
const signal = () => new AbortController().signal;
const pcm = Buffer.alloc(4800).toString('base64');
const events = [{ type: 'start', sampleRate: 24000 }, { type: 'audio', pcm }, { type: 'complete', duration: 0.1 }];
const encoded = (value) => new TextEncoder().encode(JSON.stringify(value) + '\n');
function streamValues(values) { return new ReadableStream({ start(controller) { for (const value of values) controller.enqueue(encoded(value)); controller.close(); } }); }
async function collect(stream) { const values = []; for await (const event of readNdjson(stream)) values.push(event); return values; }

test('validation preserves exact text/UTF-16 and requires a contextual word range', () => {
  const text = '😀  I read it yesterday.\n';
  assert.equal(ttsInputSchema.parse({ ...input, text }).text, text);
  const start = text.indexOf('read');
  assert.equal(ttsInputSchema.safeParse({ ...input, text, mode: 'word', selection: { start, end: start + 4 } }).success, true);
  for (const change of [{ text: '' }, { text: '   ' }, { text: 'a'.repeat(6001) }, { text: 'x\u0000' }, { language: 'xx' }, { voice: 'arbitrary-provider-voice' }, { speed: 0 }, { model: 'evil' }, { mode: 'word' }, { mode: 'word', selection: { start: 0, end: 999 } }]) {
    assert.equal(ttsInputSchema.safeParse({ ...input, ...change }).success, false);
  }
});
test('cache identity isolates owners, context, voice, speed, language and model; clips reuse sentence audio', () => {
  const key = ttsCacheKey('owner', input, providerId, 'test-hmac');
  assert.match(key, /^[0-9a-f]{64}$/);
  assert.equal(ttsCacheKey('owner', { ...input, mode: 'word', selection: { start: 2, end: 6 } }, providerId, 'test-hmac'), key);
  for (const change of [{ text: 'I read it every day.' }, { language: 'it' }, { speed: 1.2 }]) assert.notEqual(ttsCacheKey('owner', { ...input, ...change }, providerId, 'test-hmac'), key);
  assert.notEqual(ttsCacheKey('other', input, providerId, 'test-hmac'), key);
  assert.notEqual(ttsCacheKey('owner', input, { ...providerId, voice: 'other' }, 'test-hmac'), key);
  assert.notEqual(ttsCacheKey('owner', input, { ...providerId, model: 'next-version' }, 'test-hmac'), key);
});
test('environment failure never exposes secrets or Zod validation details', () => {
  assert.throws(() => getReadingTtsConfig({ GOOGLE_TTS_API_KEY: 'private-test-value' }), (error) => error.code === 'unavailable' && !String(error).includes('private-test-value'));
});
test('NDJSON parser preserves fragmented UTF-8 and rejects oversized responses', async () => {
  const bytes = encoded({ word: 'perché😀' });
  const stream = new ReadableStream({ start(controller) { for (const byte of bytes) controller.enqueue(Uint8Array.of(byte)); controller.close(); } });
  assert.deepEqual(await collect(stream), [{ word: 'perché😀' }]);
  await assert.rejects(async () => { for await (const value of readNdjson(streamValues([{ word: 'long' }]), 3)) void value; }, /invalid_audio/);
});
function fixtureStore() {
  let reserved = false; let body = null; let saved = 0; let failed = 0;
  return { get saved() { return saved; }, get failed() { return failed; },
    async reserve() { if (body) return { status: 'hit', objectPath: 'cached' }; if (reserved) return { status: 'wait' }; reserved = true; return { status: 'reserved' }; },
    async find() { return { status: body ? 'ready' : 'pending', objectPath: body ? 'cached' : null }; },
    async read() { return new ReadableStream({ start(controller) { controller.enqueue(body); controller.close(); } }); },
    async save(_owner, _key, _lease, value) { body = value; saved += 1; }, async fail() { failed += 1; },
  };
}
test('20 simultaneous identical requests fan out one live generation and the next request is a durable cache hit', async () => {
  const store = fixtureStore(); let calls = 0;
  const service = createTtsService(store, { ...providerId, async *stream() { calls += 1; for (const event of events) { yield event; await new Promise((resolve) => setTimeout(resolve, 1)); } } });
  const streams = await Promise.all(Array.from({ length: 20 }, (_, index) => service.open(input, 'owner', 'key', 'ip', `lease${index}`, signal())));
  const results = await Promise.all(streams.map(collect));
  for (const result of results) assert.deepEqual(result, events);
  assert.equal(calls, 1); assert.equal(store.saved, 1);
  assert.deepEqual(await collect(await service.open(input, 'owner', 'key', 'ip', 'next', signal())), events);
  assert.equal(calls, 1);
});
test('streamed audio is observable before completion or persistent upload', async () => {
  const store = fixtureStore(); let release;
  const latch = new Promise((resolve) => { release = resolve; });
  const service = createTtsService(store, { ...providerId, async *stream() { yield events[0]; yield events[1]; await latch; yield events[2]; } });
  const reader = (await service.open(input, 'owner', 'key', 'ip', 'lease', signal())).getReader();
  await reader.read(); const chunk = await reader.read();
  assert.match(new TextDecoder().decode(chunk.value), /"audio"/); assert.equal(store.saved, 0);
  release(); while (!(await reader.read()).done) {} assert.equal(store.saved, 1);
});
for (const failure of ['timeout', 'rate_limited', 'provider_failure']) {
  test(`generation ${failure} emits a recoverable terminal error and does not cache`, async () => {
    const store = fixtureStore();
    const service = createTtsService(store, { ...providerId, async *stream() { yield events[0]; throw new TtsError(failure); } });
    const result = await collect(await service.open(input, 'owner', 'key', 'ip', 'lease', signal()));
    assert.deepEqual(result.at(-1), { type: 'error', code: failure }); assert.equal(store.saved, 0); assert.equal(store.failed, 1);
  });
}
test('canceling the only consumer aborts upstream synthesis', async () => {
  const store = fixtureStore(); let aborted = false;
  const service = createTtsService(store, { ...providerId, async *stream(_input, abortSignal) { yield events[0]; await new Promise((_, reject) => { const fail = () => { aborted = true; reject(new TtsError('interrupted')); }; if (abortSignal.aborted) fail(); else abortSignal.addEventListener('abort', fail, { once: true }); }); } });
  const stream = await service.open(input, 'owner', 'key', 'ip', 'lease', signal());
  const reader = stream.getReader(); await reader.read();
  await new Promise((resolve) => setTimeout(resolve, 0));
  await reader.cancel(); await new Promise((resolve) => setTimeout(resolve, 5)); assert.equal(aborted, true);
});
test('an actual deadline aborts a stalled provider, charges conservatively, and never saves partial audio', async () => {
  const store = fixtureStore();
  const service = createTtsService(store, { ...providerId, async *stream(_input, abortSignal) {
    yield events[0];
    await new Promise((_, reject) => {
      const keepAlive = setTimeout(() => reject(new Error('deadline failed')), 1000);
      const abort = () => { clearTimeout(keepAlive); reject(abortSignal.reason); };
      if (abortSignal.aborted) abort(); else abortSignal.addEventListener('abort', abort, { once: true });
    });
  } }, { timeoutMs: 10 });
  assert.deepEqual((await collect(await service.open(input, 'owner', 'key', 'ip', 'lease', signal()))).at(-1), { type: 'error', code: 'timeout' });
  assert.equal(store.saved, 0); assert.equal(store.failed, 1);
});
test('two service instances share a database reservation without calling the provider twice', async () => {
  const store = fixtureStore(); let calls = 0;
  const provider = { ...providerId, async *stream() {
    calls += 1; yield events[0];
    await new Promise((resolve) => setTimeout(resolve, 10));
    yield events[1]; yield events[2];
  } };
  const one = createTtsService(store, provider, { waitMs: 1 });
  const two = createTtsService(store, provider, { waitMs: 1 });
  const results = await Promise.all([one, two].map(async (service, index) => collect(await service.open(input, 'owner', 'key', 'ip', `lease${index}`, signal()))));
  assert.equal(calls, 1); assert.equal(store.saved, 1);
  assert.deepEqual(results, [events, events]);
});
test('an early complete followed by another event is never persisted', async () => {
  const store = fixtureStore();
  const service = createTtsService(store, { ...providerId, async *stream() { yield* events; yield events[1]; } });
  const result = await collect(await service.open(input, 'owner', 'key', 'ip', 'lease', signal()));
  assert.equal(result.some((event) => event.type === 'complete'), false);
  assert.equal(result.at(-1).code, 'invalid_audio'); assert.equal(store.saved, 0);
});
test('cancellation during reservation prevents provider dispatch and conservatively counts Unicode', async () => {
  const abort = new AbortController(); let dispatched = false; let failed = false;
  const text = '😀 read';
  const store = { async reserve(_owner, _key, characters) { assert.equal(characters, text.length); abort.abort(); return { status: 'reserved' }; }, async fail() { failed = true; } };
  const service = createTtsService(store, { ...providerId, async *stream() { dispatched = true; yield* events; } });
  await assert.rejects(service.open({ ...input, text }, 'owner', 'key', 'ip', 'lease', abort.signal), { code: 'interrupted' });
  assert.equal(dispatched, false); assert.equal(failed, true);
});
const request = (value = input, headers = {}) => new Request('https://example.test/api/tts', { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(value) });
test('API enforces authentication, same-origin, validation and safe errors before provider dispatch', async () => {
  let calls = 0; let signedIn = false;
  const handler = createTtsHandler({ async authenticate() { if (!signedIn) throw new TtsError('authentication_required'); return 'owner'; }, async open() { calls += 1; return streamValues(events); } });
  assert.equal((await handler(request())).status, 401); signedIn = true;
  assert.equal((await handler(request(input, { Origin: 'https://evil.test' }))).status, 403);
  assert.equal((await handler(request({ ...input, text: 'x'.repeat(6001) }))).status, 400);
  assert.equal((await handler(request(input, { 'Content-Type': 'text/plain' }))).status, 400); assert.equal(calls, 0);
  const response = await handler(request()); assert.equal(response.status, 200); assert.equal(response.headers.get('Cache-Control'), 'private, no-store');
  assert.deepEqual(await collect(response.body), events); assert.equal(calls, 1);
});
test('API budget exhaustion prevents dispatch and status mappings hide provider credentials', async () => {
  const handler = createTtsHandler({ async authenticate() { return 'owner'; }, async open() { throw new TtsError('quota_exceeded'); } });
  const response = await handler(request()); assert.equal(response.status, 429); assert.deepEqual(await response.json(), { code: 'quota_exceeded' });
  assert.equal(ttsStatus('provider_auth'), 502); assert.equal(ttsStatus('timeout'), 504);
});
