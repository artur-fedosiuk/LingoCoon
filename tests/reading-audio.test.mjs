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
const { createSpeechPlayer, pairsAudioRequest, wordAudioRequest } = await import('../src/lib/context-studio/speech-player.ts');
const { decodePcm16, createWebAudioDriver } = await import('../src/lib/reading-tts/web-audio-driver.ts');
const { buildSentencePairs, selectReaderToken } = await import('../src/lib/context-studio/reader-tokens.ts');
const { TTS_ERROR_CODES } = await import('../src/lib/reading-tts/contract.ts');
const sampleRate = 24_000;
const session = { sourceText: '😀 We read, then read again.\n\nThe bank is near the river.', sourceLanguage: 'en', nativeLanguage: 'it', revision: 1 };
const pairs = buildSentencePairs(session, null);
const documentRequest = pairsAudioRequest(session, pairs, 'source', 'document');
const selected = selectReaderToken(pairs[0], pairs[0].sourceTokens.filter((token) => token.text === 'read')[1]);
const standaloneWordRequest = wordAudioRequest(session, selected);
// Alignment-engine fixtures remain separate from the unaligned Chirp UI adapter.
const wordRequest = {
  ...documentRequest,
  input: { ...documentRequest.input, text: pairs[0].text, mode: 'word',
    selection: { start: selected.start - pairs[0].start, end: selected.end - pairs[0].start } },
  spans: [documentRequest.spans[0]],
};
const pcm = (seconds) => Buffer.alloc(Math.round(seconds * sampleRate) * 2, 1).toString('base64');
const audio = (seconds) => ({ type: 'audio', pcm: pcm(seconds) });
const start = { type: 'start', sampleRate };
const complete = (duration) => ({ type: 'complete', duration });
const alignment = (start, end, startTime, endTime) => ({ type: 'alignment', words: [{ start, end, startTime, endTime }] });
const flush = () => new Promise((resolve) => setImmediate(resolve));
const closeTo = (actual, expected, tolerance = 0.002) => assert.ok(Math.abs(actual - expected) < tolerance, `${actual} != ${expected}`);

function harness(t, options = {}) {
  const calls = [];
  const requests = [];
  const driver = {
    currentTime: 0, running: false, disposed: false,
    async activate() { this.running = true; },
    schedule(samples, sampleRate, when, offsetFrames, frames, rate) { calls.push({ samples, sampleRate, when, offsetFrames, frames, rate, stopped: false }); },
    stop() { calls.forEach((call) => { call.stopped = true; }); },
    dispose() { this.stop(); this.disposed = true; },
  };
  const fetch = async (url, init) => {
    let controller;
    const request = { url, init, cancelled: false };
    const stream = new ReadableStream({ start(value) { controller = value; }, cancel() { request.cancelled = true; } });
    request.send = (...events) => controller.enqueue(new TextEncoder().encode(events.map((event) => JSON.stringify(event)).join('\n') + '\n'));
    request.bytes = (bytes) => controller.enqueue(bytes);
    request.end = () => controller.close();
    request.fail = () => controller.error(new TypeError('network interrupted'));
    requests.push(request);
    return new Response(stream, { headers: { 'content-type': 'application/x-ndjson' } });
  };
  const player = createSpeechPlayer({ driver, fetch, autoTick: false, ...options });
  t.after(() => player.dispose());
  return { player, driver, calls, requests,
    async play(request = documentRequest) { player.play(request); await flush(); return requests.at(-1); },
    advance(seconds) { driver.currentTime += seconds; player.tick(); },
  };
}

test('PCM decoder reads signed little-endian mono samples and rejects containers/odd payloads', () => {
  const bytes = Buffer.alloc(10);
  [-32768, -1, 0, 1, 32767].forEach((value, index) => bytes.writeInt16LE(value, index * 2));
  assert.deepEqual([...decodePcm16(bytes.toString('base64'))], [-1, -1 / 32768, 0, 1 / 32768, 32767 / 32768]);
  for (const payload of ['', '!!', Buffer.from([1]).toString('base64'), Buffer.from('RIFF0000').toString('base64')]) assert.throws(() => decodePcm16(payload), { code: 'invalid_audio' });
});

test('Chirp word request validates the occurrence and pronounces only the selected word', () => {
  assert.equal(standaloneWordRequest.input.text, 'read');
  assert.equal(standaloneWordRequest.input.mode, 'sentence');
  assert.equal(standaloneWordRequest.input.selection, undefined);
  assert.throws(() => wordAudioRequest(session, { ...selected, start: selected.start - 1 }));
  assert.throws(() => wordAudioRequest(session, { ...selected, tokenId: 'forged' }));
});

test('document request joins existing sentence text and maps both sides without cross-language word assumptions', () => {
  const translation = { sourceLanguage: 'en', nativeLanguage: 'it', units: pairs.map((pair, index) => ({ id: pair.id, translation: index ? 'La riva è vicina.' : 'Leggiamo, poi leggiamo ancora.' })) };
  const translatedPairs = buildSentencePairs(session, translation);
  for (const side of ['source', 'translation']) {
    const request = pairsAudioRequest(session, translatedPairs, side, 'document');
    assert.equal(request.input.language, side === 'source' ? 'en' : 'it');
    assert.equal(request.input.text, translatedPairs.map((pair) => side === 'source' ? pair.text : pair.translatedText).join('\n'));
    request.spans.forEach((span, index) => {
      assert.equal(span.sentenceId, translatedPairs[index].id);
      const original = side === 'source' ? translatedPairs[index].sourceTokens : translatedPairs[index].translatedTokens;
      for (const token of span.tokens) assert.equal(request.input.text.slice(token.start, token.end), original.find((item) => item.id === token.id).text);
    });
  }
});

test('first PCM chunk starts before completion; later chunks are scheduled seamlessly on the audio clock', async (t) => {
  const h = harness(t);
  const request = await h.play();
  assert.equal(request.url, '/api/tts');
  assert.equal(request.init.credentials, 'same-origin');
  assert.equal(request.init.mode, 'same-origin');
  assert.equal(request.init.redirect, 'error');
  assert.deepEqual(JSON.parse(request.init.body), documentRequest.input);
  assert.equal(h.player.getSnapshot().status, 'loading');
  request.send(start, audio(1));
  await flush();
  assert.equal(h.calls.length, 1);
  assert.equal(h.player.getSnapshot().duration, null);
  h.advance(0.4);
  closeTo(h.player.getSnapshot().currentTime, 0.385);
  closeTo(h.player.getSnapshot().bufferedDuration, 1);
  request.send(audio(1));
  await flush();
  assert.equal(h.calls.length, 2);
  closeTo(h.calls[1].when, h.calls[0].when + 1);
  request.send(complete(2)); request.end(); await flush();
  assert.equal(h.player.getSnapshot().duration, 2);
});

test('pause stops all queued sources; resume and rates retain position and use actual audio time', async (t) => {
  const h = harness(t);
  const request = await h.play();
  request.send(start, audio(4), complete(4)); request.end(); await flush();
  h.advance(0.515);
  h.player.pause();
  closeTo(h.player.getSnapshot().currentTime, 0.5);
  assert.ok(h.calls.every((call) => call.stopped));
  h.advance(20);
  assert.equal(h.player.getSnapshot().status, 'paused');
  closeTo(h.player.getSnapshot().currentTime, 0.5);
  h.player.setRate(1.5);
  h.player.resume(); await flush();
  assert.equal(h.calls.at(-1).offsetFrames, 0.5 * sampleRate);
  assert.equal(h.calls.at(-1).rate, 1.5);
  h.advance(0.515);
  closeTo(h.player.getSnapshot().currentTime, 1.25);
  h.player.setRate(0.2);
  assert.equal(h.player.getSnapshot().playbackRate, 0.75);
  h.player.setRate(8);
  assert.equal(h.player.getSnapshot().playbackRate, 1.5);
});

test('seek and +/-10 clamp to available frames while streaming, and to duration after completion', async (t) => {
  const h = harness(t);
  const request = await h.play();
  request.send(start, audio(3)); await flush();
  h.player.pause(); h.player.skip(10);
  assert.equal(h.player.getSnapshot().currentTime, 3);
  h.player.skip(-10);
  assert.equal(h.player.getSnapshot().currentTime, 0);
  h.player.seek(1.25);
  assert.equal(h.player.getSnapshot().currentTime, 1.25);
  request.send(audio(2), complete(5)); request.end(); await flush();
  h.player.skip(10);
  assert.equal(h.player.getSnapshot().currentTime, 5);
  assert.equal(h.player.getSnapshot().status, 'paused');
  h.player.resume(); await flush();
  assert.equal(h.calls.at(-2).offsetFrames, 0);
});

test('buffer starvation freezes media position and starts newly available audio without skipping', async (t) => {
  const h = harness(t);
  const request = await h.play();
  request.send(start, audio(1)); await flush();
  h.advance(2);
  assert.equal(h.player.getSnapshot().status, 'loading');
  assert.equal(h.player.getSnapshot().currentTime, 1);
  h.advance(10);
  assert.equal(h.player.getSnapshot().currentTime, 1);
  request.send(audio(1), complete(2)); request.end(); await flush();
  closeTo(h.calls.at(-1).when, h.driver.currentTime + 0.015);
  h.advance(0.515);
  closeTo(h.player.getSnapshot().currentTime, 1.5);
});

test('real alignment changes only on spoken boundaries and preserves sentence/side mapping', async (t) => {
  const h = harness(t);
  const request = await h.play();
  const first = documentRequest.spans[0].tokens[0];
  const second = documentRequest.spans[1].tokens[0];
  request.send(start, alignment(first.start, first.end, 0.2, 0.4), alignment(second.start, second.end, 0.6, 0.9), audio(1), complete(1)); request.end(); await flush();
  assert.equal(h.player.getSpeechSnapshot().tokenId, null);
  h.advance(0.265);
  assert.equal(h.player.getSpeechSnapshot().tokenId, first.id);
  h.advance(0.2);
  assert.equal(h.player.getSpeechSnapshot().tokenId, null);
  h.advance(0.2);
  assert.equal(h.player.getSpeechSnapshot().tokenId, second.id);
  assert.equal(h.player.getSpeechSnapshot().sentenceId, documentRequest.spans[1].sentenceId);
});

test('word preview clips exact alignment samples and restores reading PAUSED at the saved position', async (t) => {
  const h = harness(t);
  const reading = await h.play();
  reading.send(start, audio(5)); await flush();
  h.advance(0.515);
  const preview = await h.play(wordRequest);
  assert.ok(h.calls.every((call) => call.stopped));
  assert.equal(h.player.getSnapshot().hasPausedReading, true);
  assert.equal(reading.init.signal.aborted, false);
  const range = wordRequest.input.selection;
  preview.send(start, audio(1));
  await flush();
  assert.equal(h.calls.length, 1, 'full sentence must not play before alignment');
  preview.send(alignment(range.start, range.end, 1.25, 1.75));
  await flush();
  assert.equal(h.calls.length, 1, 'wait until the exact word is buffered');
  preview.send(audio(1)); await flush();
  assert.equal(h.calls.length, 2);
  assert.equal(h.calls[1].offsetFrames, 0.25 * sampleRate);
  assert.equal(h.calls[1].frames, 0.5 * sampleRate);
  h.advance(0.2);
  assert.equal(h.player.getSpeechSnapshot().tokenId, selected.tokenId);
  h.advance(0.4);
  assert.equal(h.player.getSnapshot().mode, 'reading');
  assert.equal(h.player.getSnapshot().status, 'paused');
  closeTo(h.player.getSnapshot().currentTime, 0.5);
  assert.equal(preview.init.signal.aborted, true);
  reading.send(complete(5)); reading.end(); await flush();
  h.player.resume(); await flush();
  closeTo(h.calls.at(-1).offsetFrames / sampleRate, 0.5);
});

test('rapid word replacement cancels old preview but retains the held document and explicit resume', async (t) => {
  const h = harness(t);
  const reading = await h.play();
  reading.send(start, audio(5), complete(5)); reading.end(); await flush();
  h.advance(0.515);
  const first = await h.play(wordRequest);
  const second = await h.play(wordRequest);
  assert.equal(first.init.signal.aborted, true);
  assert.equal(h.player.getSnapshot().hasPausedReading, true);
  h.player.resumeReading(); await flush();
  assert.equal(second.init.signal.aborted, true);
  assert.equal(h.player.getSnapshot().mode, 'reading');
  assert.equal(h.player.getSnapshot().status, 'playing');
  closeTo(h.player.getSnapshot().currentTime, 0.5);
});

test('word with missing or overly broad alignment fails safely, without playing a sentence', async (t) => {
  for (const broad of [false, true]) {
    const h = harness(t);
    const request = await h.play(wordRequest);
    request.send(start, ...(broad ? [alignment(0, wordRequest.input.text.length, 0, 1)] : []), audio(1), complete(1));
    request.end(); await flush();
    assert.equal(h.player.getSnapshot().error, 'alignment_unavailable');
    assert.equal(h.calls.length, 0);
  }
});

test('HTTP allowlisted codes survive transport and failed attempts support a fresh retry', async (t) => {
  for (const code of TTS_ERROR_CODES) {
    let count = 0;
    const h = harness(t, { fetch: async () => { count += 1; return Response.json({ code, private: 'must not surface' }, { status: 503 }); } });
    h.player.play(documentRequest); await flush();
    assert.equal(h.player.getSnapshot().error, code);
    assert.equal(h.player.getSnapshot().status, 'error');
    h.player.retry(); await flush();
    assert.equal(count, 2);
  }
});

test('EOF without complete, broken networks, timeouts and stream errors stop audio and expose recovery', async (t) => {
  for (const failure of ['eof', 'network', 'provider', 'timeout']) {
    const h = harness(t, { streamTimeoutMs: failure === 'timeout' ? 15 : 45_000 });
    const request = await h.play();
    request.send(start, audio(1)); await flush();
    if (failure === 'eof') request.end();
    if (failure === 'network') request.fail();
    if (failure === 'provider') request.send({ type: 'error', code: 'provider_auth' });
    if (failure === 'timeout') await new Promise((resolve) => setTimeout(resolve, 30));
    await flush();
    assert.equal(h.player.getSnapshot().error, failure === 'provider' ? 'provider_auth' : failure === 'timeout' ? 'timeout' : 'interrupted');
    assert.ok(h.calls.every((call) => call.stopped));
    assert.equal(h.player.getSpeechSnapshot().tokenId, null);
  }
});

test('malformed stream ordering, PCM, offsets, duration and content type cannot drive playback', async (t) => {
  for (const events of [
    [audio(1)], [start, start], [start, { type: 'audio', pcm: 'AQ==' }],
    [start, alignment(0, 9000, 0, 1)], [start, audio(1), complete(2)],
    [start, alignment(0, 1, 0.5, 0.9), alignment(2, 3, 0.1, 0.3)],
    [start, { type: 'arbitrary', value: true }],
  ]) {
    const h = harness(t);
    const request = await h.play();
    request.send(...events); request.end(); await flush();
    assert.equal(h.player.getSnapshot().error, 'invalid_audio');
    assert.ok(h.calls.every((call) => call.stopped));
  }
  const h = harness(t, { fetch: async () => new Response('<html>login</html>', { headers: { 'content-type': 'text/html' } }) });
  h.player.play(documentRequest); await flush();
  assert.equal(h.player.getSnapshot().error, 'invalid_audio');
});

test('fragmented NDJSON bytes are decoded; stop cancels the reader and ignores late fetch completion', async (t) => {
  const h = harness(t);
  const request = await h.play();
  const data = new TextEncoder().encode([start, audio(0.01), complete(0.01)].map((event) => JSON.stringify(event)).join('\n'));
  request.bytes(data.slice(0, 7)); request.bytes(data.slice(7, 55)); request.bytes(data.slice(55)); request.end(); await flush();
  assert.equal(h.player.getSnapshot().duration, 0.01);
  h.player.stop();
  assert.equal(h.player.getSnapshot().status, 'idle');
  let resolve;
  const late = harness(t, { fetch: () => new Promise((value) => { resolve = value; }) });
  late.player.play(documentRequest);
  late.player.stop();
  resolve(new Response([start, audio(1), complete(1)].map((event) => JSON.stringify(event)).join('\n'), { headers: { 'content-type': 'application/x-ndjson' } }));
  await flush();
  assert.equal(late.player.getSnapshot().status, 'idle');
  assert.equal(late.calls.length, 0);
});

test('stop/dispose abort active and held streams, release all output and ignore old activation callbacks', async (t) => {
  const h = harness(t);
  const reading = await h.play();
  reading.send(start, audio(5)); await flush();
  const preview = await h.play(wordRequest);
  h.player.dispose(); await flush();
  assert.equal(reading.init.signal.aborted, true);
  assert.equal(preview.init.signal.aborted, true);
  assert.equal(h.driver.disposed, true);
  assert.equal(h.player.getSnapshot().status, 'idle');
  assert.ok(h.calls.every((call) => call.stopped));
  const late = harness(t);
  let activate;
  late.driver.activate = () => new Promise((resolve) => { activate = resolve; });
  const pending = await late.play();
  pending.send(start, audio(1)); await flush();
  late.player.stop();
  activate(); await flush();
  assert.equal(late.calls.length, 0);
});

test('position subscriptions are <=4Hz and word subscribers stay idle between true boundaries', async (t) => {
  const h = harness(t);
  const request = await h.play();
  const word = documentRequest.spans[0].tokens[0];
  request.send(start, alignment(word.start, word.end, 0, 4), audio(5), complete(5)); request.end(); await flush();
  let positions = 0; let words = 0;
  h.player.subscribe(() => { positions += 1; });
  h.player.subscribeWords(() => { words += 1; });
  for (let index = 0; index < 20; index += 1) h.advance(0.05);
  assert.ok(positions <= 4, `${positions} position notifications`);
  assert.equal(words, 0);
});

test('device audio suspension pauses instead of advancing a fake timeline', async (t) => {
  const h = harness(t);
  const request = await h.play();
  request.send(start, audio(5), complete(5)); request.end(); await flush();
  h.advance(0.515);
  h.driver.running = false;
  h.player.tick();
  assert.equal(h.player.getSnapshot().status, 'paused');
  assert.ok(h.calls.every((call) => call.stopped));
});

test('Web Audio driver creates one context, schedules decoded PCM and disconnects cancelled/ended nodes', async (t) => {
  const contexts = []; const nodes = [];
  class Context {
    constructor() { this.currentTime = 7; this.state = 'running'; this.destination = {}; contexts.push(this); }
    async resume() { this.state = 'running'; }
    async close() { this.state = 'closed'; }
    createBuffer(channels, frames, rate) { assert.equal(channels, 1); assert.equal(rate, sampleRate); const data = new Float32Array(frames); return { getChannelData: () => data }; }
    createBufferSource() {
      const node = { playbackRate: {}, connect() {}, disconnect() { this.disconnected = true; }, start(...args) { this.args = args; }, stop() { this.stopped = true; } };
      nodes.push(node); return node;
    }
  }
  const original = Object.getOwnPropertyDescriptor(globalThis, 'AudioContext');
  Object.defineProperty(globalThis, 'AudioContext', { configurable: true, value: Context });
  t.after(() => { if (original) Object.defineProperty(globalThis, 'AudioContext', original); else delete globalThis.AudioContext; });
  const driver = createWebAudioDriver();
  assert.equal(contexts.length, 0);
  await driver.activate(); await driver.activate();
  assert.equal(contexts.length, 1);
  driver.schedule(new Float32Array(sampleRate), sampleRate, 7.015, 12000, 6000, 1.25);
  assert.deepEqual(nodes[0].args, [7.015, 0.5, 0.25]);
  assert.equal(nodes[0].playbackRate.value, 1.25);
  const oldEnd = nodes[0].onended;
  driver.stop();
  assert.equal(nodes[0].onended, null);
  assert.equal(nodes[0].stopped, true);
  assert.equal(nodes[0].disconnected, true);
  oldEnd();
  driver.dispose();
  assert.equal(contexts[0].state, 'closed');
});
