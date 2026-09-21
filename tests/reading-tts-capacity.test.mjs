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

const { createTtsService, encodeTtsEvent } = await import('../src/lib/server/reading-tts/service.ts');
const { readNdjson } = await import('../src/lib/reading-tts/contract.ts');
const input = { text: 'A short practice sentence.', language: 'en', voice: 'female', speed: 1, mode: 'sentence' };
const events = [
  { type: 'start', sampleRate: 24000 },
  { type: 'audio', pcm: Buffer.alloc(4800).toString('base64') },
  { type: 'complete', duration: 0.1 },
];
const providerId = { id: 'google', model: 'capacity-test', voice: 'test-voice' };
const users = Array.from({ length: 100 }, (_, index) => `owner-${index}`);
const signal = () => new AbortController().signal;
async function collect(stream) {
  const result = [];
  for await (const event of readNdjson(stream)) result.push(event);
  return result;
}

// Contract doubles exercise the shipped service, not PostgreSQL, Google quotas,
// browser playback or hosted throughput. These are NOT production load evidence.
test('100 distinct owners can consume their own cached audio across service instances without synthesis', async () => {
  let reads = 0;
  let dispatches = 0;
  const store = {
    async reserve(owner, key) {
      assert.equal(key, `key-${owner}`);
      return { status: 'hit', objectPath: `cache-${owner}` };
    },
    async read(path) {
      assert.ok(users.some((owner) => path === `cache-${owner}`));
      reads += 1;
      return new ReadableStream({ start(controller) {
        for (const event of events) controller.enqueue(encodeTtsEvent(event));
        controller.close();
      } });
    },
  };
  const provider = { ...providerId, async *stream() { dispatches += 1; yield* events; } };
  const services = Array.from({ length: 4 }, () => createTtsService(store, provider));
  const results = await Promise.all(users.map(async (owner, index) => collect(await services[index % services.length].open(
    input, owner, `key-${owner}`, 'shared-classroom-ip', `lease-${index}`, signal(),
  ))));
  assert.equal(reads, 100);
  assert.equal(dispatches, 0);
  for (const result of results) assert.deepEqual(result, events);
});

test('capacity baseline: two admitted generations leave 98 of 100 cold requests busy, with no unsafe dispatch', async () => {
  let admitted = 0;
  let dispatches = 0;
  let saved = 0;
  let release;
  const gate = new Promise((resolve) => { release = resolve; });
  const store = {
    async reserve() {
      if (admitted === 2) return { status: 'busy' };
      admitted += 1;
      return { status: 'reserved' };
    },
    async save() { saved += 1; },
    async fail() { assert.fail('Unexpected provider failure'); },
  };
  const provider = { ...providerId, async *stream() {
    dispatches += 1;
    yield events[0];
    await gate;
    yield events[1];
    yield events[2];
  } };
  const services = Array.from({ length: 4 }, () => createTtsService(store, provider));
  const attempts = await Promise.allSettled(users.map((owner, index) => services[index % services.length].open(
    input, owner, `key-${owner}`, 'shared-classroom-ip', `lease-${index}`, signal(),
  )));
  // Always release the mocked provider, including when a baseline assertion fails.
  release();
  const accepted = attempts.filter((result) => result.status === 'fulfilled');
  await Promise.all(accepted.map((result) => collect(result.value)));
  const rejected = attempts.filter((result) => result.status === 'rejected');
  assert.equal(accepted.length, 2);
  assert.equal(rejected.length, 98);
  assert.ok(rejected.every((result) => result.reason.code === 'busy'));
  assert.equal(dispatches, 2);
  assert.equal(saved, 2);
});

test('100 exhausted-budget requests never dispatch a provider call', async () => {
  let dispatches = 0;
  const store = { async reserve() { return { status: 'quota_exceeded' }; } };
  const service = createTtsService(store, { ...providerId, async *stream() { dispatches += 1; yield* events; } });
  await Promise.all(users.map((owner, index) => assert.rejects(service.open(
    input, owner, `key-${owner}`, 'shared-classroom-ip', `lease-${index}`, signal(),
  ), { code: 'quota_exceeded' })));
  assert.equal(dispatches, 0);
});
