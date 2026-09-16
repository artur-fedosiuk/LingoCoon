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
const { GoogleTtsProvider, decodeGoogleWav } = await import('../src/lib/server/reading-tts/google.ts');
const { googleVoice, planGoogleSpeech } = await import('../src/lib/server/reading-tts/google-plan.ts');
const { getReadingTtsConfig } = await import('../src/lib/server/reading-tts/config.ts');
const { createTtsService } = await import('../src/lib/server/reading-tts/service.ts');
const { createSupabaseTtsStore } = await import('../src/lib/server/reading-tts/store.ts');
const { readNdjson } = await import('../src/lib/reading-tts/contract.ts');
const { createWavTtsHandler } = await import('../src/lib/server/reading-tts/compatibility.ts');
const input = { text: 'To to.', language: 'en', voice: 'female', speed: 1, mode: 'sentence' };
const signal = () => new AbortController().signal;
test('HTMLAudio endpoint shares validated input and only returns complete WAV', async () => {
  const request = (body, headers = {}) => new Request('https://example.test/api/tts/synthesize', {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body),
  });
  const calls = [];
  let events = [{ type: 'start', sampleRate: 24000 }, { type: 'audio', pcm: Buffer.alloc(48).toString('base64') }, { type: 'complete', duration: 0.001 }];
  const handler = createWavTtsHandler({
    authenticate: async () => 'owner',
    open: async (_request, parsed, owner) => {
      calls.push({ parsed, owner });
      return new ReadableStream({ start(controller) {
        controller.enqueue(new TextEncoder().encode(events.map(event => JSON.stringify(event)).join('\n') + '\n'));
        controller.close();
      } });
    },
  });
  const result = await handler(request({ text: 'Ciao', languageCode: 'it' }));
  assert.equal(result.status, 200);
  assert.equal(result.headers.get('content-type'), 'audio/wav');
  assert.equal(decodeGoogleWav(Buffer.from(await result.arrayBuffer())).length, 48);
  assert.equal(calls[0].parsed.voice, 'female');
  assert.equal(calls[0].parsed.language, 'it');
  assert.equal(calls[0].owner, 'owner');
  assert.equal((await handler(request({ text: 'Ciao' }))).status, 400);
  assert.equal((await handler(request({ text: 'Ciao', languageCode: 'it' }, { origin: 'https://other.test' }))).status, 403);
  assert.equal(calls.length, 1);
  events = events.slice(0, 2);
  assert.notEqual((await handler(request({ text: 'Ciao', languageCode: 'it' }))).status, 200);
});
const collect = async (events) => { const result = []; for await (const event of events) result.push(event); return result; };
function wav(frames = 24000) {
  const result = Buffer.alloc(44 + frames * 2);
  result.write('RIFF'); result.writeUInt32LE(result.length - 8, 4); result.write('WAVEfmt ', 8);
  result.writeUInt32LE(16, 16); result.writeUInt16LE(1, 20); result.writeUInt16LE(1, 22);
  result.writeUInt32LE(24000, 24); result.writeUInt32LE(48000, 28);
  result.writeUInt16LE(2, 32); result.writeUInt16LE(16, 34); result.write('data', 36); result.writeUInt32LE(frames * 2, 40);
  return result;
}
const points = [{ markName: 's0', timeSeconds: 0.1 }, { markName: 'e2', timeSeconds: 0.3 }, { markName: 's3', timeSeconds: 0.4 }, { markName: 'e5', timeSeconds: 0.6 }];
const response = (timepoints = points) => Response.json({ audioContent: wav().toString('base64'), timepoints });

test('Google requires activation and durable storage; obsolete bypass cannot enable it', () => {
  const env = { NEXT_PUBLIC_SUPABASE_URL: 'https://example.test', SUPABASE_SERVICE_ROLE_KEY: 'test-only', READING_TTS_CACHE_SECRET: 'x'.repeat(32), GOOGLE_TTS_API_KEY: 'test-only' };
  for (const change of [{}, { GOOGLE_TTS_ENABLED: 'false' }, { GOOGLE_TTS_ENABLED: 'true', READING_TTS_PROVIDER: 'unknown' }]) assert.throws(() => getReadingTtsConfig({ ...env, ...change }), { code: 'unavailable' });
  assert.equal(getReadingTtsConfig({ ...env, GOOGLE_TTS_ENABLED: 'true' }).READING_TTS_PROVIDER, 'google');
  assert.throws(() => getReadingTtsConfig({ GOOGLE_TTS_ENABLED: 'true', GOOGLE_TTS_API_KEY: 'test-only', READING_TTS_LOCAL_DIRECT: 'true' }), { code: 'unavailable' });
});
test('Chirp allowlist preserves accepted female voice and language', () => {
  for (const language of ['en', 'fr', 'it', 'uk']) assert.match(googleVoice({ language, voice: 'female' }), /Chirp3-HD-Achernar$/);
  assert.equal(googleVoice({ language: 'it', voice: 'male' }), 'it-IT-Chirp3-HD-Charon');
});
test('plain text chunks preserve exact Unicode and bound provider bytes', () => {
  for (const text of ['Perché 😀? '.repeat(200), 'І ще слова '.repeat(350), 'word '.repeat(1100)]) {
    const plan = planGoogleSpeech({ ...input, text });
    assert.equal(plan.map(part => part.text).join(''), text);
    assert.equal(plan.reduce((sum, part) => sum + part.characters, 0), text.length);
    for (const part of plan) assert.ok(Buffer.byteLength(part.text) <= 4800);
  }
  assert.throws(() => planGoogleSpeech({ ...input, text: 'a'.repeat(6000) }), { code: 'invalid_input' });
});
test('WAV decoding validates format, container boundaries and raw PCM framing', () => {
  assert.equal(decodeGoogleWav(wav()).length, 48000);
  for (const [position, value] of [[20, 3], [22, 2], [24, 16000], [28, 96000], [32, 4], [34, 8], [40, 999999]]) {
    const bytes = wav(); bytes.writeUInt32LE(value, position);
    assert.throws(() => decodeGoogleWav(bytes), { code: 'invalid_audio' });
  }
  assert.throws(() => decodeGoogleWav(Buffer.alloc(4000)), { code: 'invalid_audio' });
  assert.throws(() => decodeGoogleWav(wav().subarray(0, 40)), { code: 'invalid_audio' });
});
test('Google sends plain text, exact Chirp voice and server header; strips WAV', async () => {
  const calls = [];
  const provider = new GoogleTtsProvider(input, 'test-only', async (url, options) => { calls.push([url, options]); return response(); });
  const events = await collect(provider.stream(input, signal()));
  assert.equal(calls.length, 1);
  const [url, options] = calls[0];
  assert.equal(url, 'https://texttospeech.googleapis.com/v1beta1/text:synthesize');
  assert.ok(!url.includes('test-only')); assert.equal(options.headers['X-Goog-Api-Key'], 'test-only');
  assert.equal(options.redirect, 'error'); assert.equal(options.cache, 'no-store');
  const body = JSON.parse(options.body);
  assert.equal(body.voice.name, 'en-US-Chirp3-HD-Achernar'); assert.equal(body.voice.languageCode, 'en-US');
  assert.equal(body.enableTimePointing, undefined); assert.equal(body.input.text, input.text); assert.equal(body.audioConfig.audioEncoding, 'LINEAR16');
  assert.deepEqual(Object.keys(body).sort(), ['audioConfig', 'input', 'voice']);
  assert.equal(events.at(-1).duration, 1);
  assert.equal(Buffer.from(events.find((event) => event.type === 'audio').pcm, 'base64').length, 48000);
  assert.equal(events.some((event) => event.type === 'alignment'), false);
});
test('HTTP errors are sanitized and never trigger retries or a paid fallback', async () => {
  for (const [status, code] of [[401, 'provider_auth'], [403, 'provider_auth'], [429, 'rate_limited'], [500, 'provider_failure']]) {
    let calls = 0;
    const provider = new GoogleTtsProvider(input, 'test-only', async () => { calls++; return new Response('private error text', { status }); });
    await assert.rejects(collect(provider.stream(input, signal())), { code });
    assert.equal(calls, 1);
  }
});
test('Google cancellation prevents dispatch; mismatched language cannot reuse a provider', async () => {
  let calls = 0;
  const provider = new GoogleTtsProvider(input, 'test-only', async () => { calls++; return response(); });
  const abort = new AbortController(); abort.abort();
  await assert.rejects(collect(provider.stream(input, abort.signal)));
  await assert.rejects(collect(provider.stream({ ...input, language: 'it' }, signal())), { code: 'invalid_input' });
  assert.equal(calls, 0);
});
test('service reserves plain-text billable characters BEFORE any Google call and quota rejection dispatches nothing', async () => {
  const sequence = []; const textInput = { ...input, text: 'To & to.' };
  const provider = new GoogleTtsProvider(textInput, 'test-only', async () => { sequence.push('google'); return response([]); });
  let units;
  const store = { async reserve(...args) { units = args[5]; sequence.push('reserve'); return { status: 'reserved' }; }, async save() {}, async fail() {} };
  await collect(readNdjson(await createTtsService(store, provider).open(textInput, 'owner', 'key', 'ip', 'lease', signal())));
  assert.deepEqual(sequence, ['reserve', 'google']); assert.equal(units, provider.billableCharacters(textInput)); assert.equal(units, textInput.text.length);
  sequence.length = 0;
  store.reserve = async () => ({ status: 'quota_exceeded' });
  await assert.rejects(createTtsService(store, provider).open(textInput, 'owner', 'key', 'ip', 'lease', signal()), { code: 'quota_exceeded' });
  assert.deepEqual(sequence, []);
});
test('Google store uses the shared-budget RPC with billable units, never legacy-only reservations', async () => {
  let recorded;
  const chain = { select() { return this; }, or() { return this; }, order() { return this; }, limit() { return this; }, eq() { return this; }, then(resolve) { resolve({ data: [], error: null }); } };
  const client = { storage: { from() { return {}; } }, from() { return chain; }, async rpc(name, args) { recorded = [name, args]; return { data: { status: 'reserved' }, error: null }; } };
  const result = await createSupabaseTtsStore(client).reserve('owner', 'a'.repeat(64), 10, 'ip', 'lease', 30);
  assert.equal(result.status, 'reserved'); assert.equal(recorded[0], 'reading_tts_reserve_google'); assert.equal(recorded[1].p_billable_characters, 30); assert.equal(recorded[1].p_characters, 10);
});
