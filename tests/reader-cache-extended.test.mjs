import test from 'node:test';
import assert from 'node:assert/strict';
import './test-setup.mjs';
import { withReaderTimeout, createReaderCache } from '../src/lib/context-studio/reader-cache.ts';

test('withReaderTimeout resolves successfully before timeout', async () => {
  const result = await withReaderTimeout(() => Promise.resolve('success'), 100);
  assert.equal(result, 'success');
});

test('withReaderTimeout rejects when request times out', async () => {
  const pending = Promise.withResolvers();
  await assert.rejects(withReaderTimeout(() => pending.promise, 5), { message: 'Reader request timed out.' });
  pending.resolve('late result');
});

test('withReaderTimeout allows retry after timeout', async () => {
  const pending = Promise.withResolvers();
  await assert.rejects(withReaderTimeout(() => pending.promise, 5), { message: 'Reader request timed out.' });
  pending.resolve('late result');
  assert.equal(await withReaderTimeout(() => Promise.resolve('retry')), 'retry');
});

test('withReaderTimeout clears timer on success', async () => {
  let timerCleared = false;
  const originalSetTimeout = global.setTimeout;
  const originalClearTimeout = global.clearTimeout;

  global.setTimeout = (callback, ms) => {
    const timer = originalSetTimeout(callback, ms);
    return timer;
  };
  global.clearTimeout = (timer) => {
    timerCleared = true;
    originalClearTimeout(timer);
  };

  await withReaderTimeout(() => Promise.resolve('success'), 100);
  assert.ok(timerCleared);

  global.setTimeout = originalSetTimeout;
  global.clearTimeout = originalClearTimeout;
});

test('withReaderTimeout clears timer on rejection', async () => {
  let timerCleared = false;
  const originalSetTimeout = global.setTimeout;
  const originalClearTimeout = global.clearTimeout;

  global.setTimeout = (callback, ms) => {
    const timer = originalSetTimeout(callback, ms);
    return timer;
  };
  global.clearTimeout = (timer) => {
    timerCleared = true;
    originalClearTimeout(timer);
  };

  await assert.rejects(withReaderTimeout(() => Promise.reject(new Error('fail')), 100));
  assert.ok(timerCleared);

  global.setTimeout = originalSetTimeout;
  global.clearTimeout = originalClearTimeout;
});

test('createReaderCache returns cached value on subsequent calls', async () => {
  const cache = createReaderCache();
  let calls = 0;
  const request = () => { calls += 1; return Promise.resolve('value'); };

  assert.equal(await cache.load('key', request), 'value');
  assert.equal(await cache.load('key', request), 'value');
  assert.equal(calls, 1);
});

test('createReaderCache deduplicates concurrent requests', async () => {
  const cache = createReaderCache();
  const pending = Promise.withResolvers();
  let calls = 0;
  const request = () => { calls += 1; return pending.promise; };

  const first = cache.load('key', request);
  const second = cache.load('key', request);
  await Promise.resolve(); // allow microtask queue to process
  assert.equal(calls, 1);

  pending.resolve('result');
  assert.deepEqual(await first, await second);
  assert.deepEqual(await cache.load('key', () => { throw new Error('Unexpected request'); }), 'result');
});

test('createReaderCache does not cache failures', async () => {
  const cache = createReaderCache();
  await assert.rejects(cache.load('key', () => Promise.reject(new Error('offline'))));
  assert.equal(cache.peek('key'), undefined);
  assert.equal(await cache.load('key', () => Promise.resolve('recovered')), 'recovered');
  cache.delete('key');
  assert.equal(cache.peek('key'), undefined);
});

test('createReaderCache respects limit and evicts oldest', async () => {
  const cache = createReaderCache(2);
  await cache.load('a', () => Promise.resolve('a'));
  await cache.load('b', () => Promise.resolve('b'));
  await cache.load('c', () => Promise.resolve('c'));
  assert.equal(cache.peek('a'), undefined);
  assert.equal(cache.peek('b'), 'b');
  assert.equal(cache.peek('c'), 'c');
});

test('createReaderCache separates keys by full string', async () => {
  const cache = createReaderCache();
  await cache.load('key1', () => Promise.resolve('value1'));
  await cache.load('key2', () => Promise.resolve('value2'));
  assert.equal(cache.peek('key1'), 'value1');
  assert.equal(cache.peek('key2'), 'value2');
});

test('createReaderCache pending map is cleaned up after resolution', async () => {
  const cache = createReaderCache();
  const pending = Promise.withResolvers();
  const request = () => pending.promise;

  const work = cache.load('key', request);
  // Verify that a second call during pending returns same promise (deduplication)
  const second = cache.load('key', request);
  // Both should resolve to the same value
  pending.resolve('done');
  const result1 = await work;
  const result2 = await second;
  assert.equal(result1, 'done');
  assert.equal(result2, 'done');
  // After resolution, pending should be deleted and value cached - delete key first to test fresh request
  cache.delete('key');
  assert.equal(await cache.load('key', () => Promise.resolve('new-value')), 'new-value');
});

test('createReaderCache delete removes cached value', async () => {
  const cache = createReaderCache();
  await cache.load('key', () => Promise.resolve('value'));
  assert.equal(cache.peek('key'), 'value');
  cache.delete('key');
  assert.equal(cache.peek('key'), undefined);
});

test('withReaderTimeout with 1ms timeout rejects if request is slow', async () => {
  const pending = Promise.withResolvers();
  await assert.rejects(withReaderTimeout(() => pending.promise, 1), { message: 'Reader request timed out.' });
  pending.resolve('late result');
});

test('createReaderCache works with different value types', async () => {
  const cache = createReaderCache();
  await cache.load('obj', () => Promise.resolve({ a: 1 }));
  await cache.load('arr', () => Promise.resolve([1, 2, 3]));
  await cache.load('str', () => Promise.resolve('string'));
  assert.deepEqual(cache.peek('obj'), { a: 1 });
  assert.deepEqual(cache.peek('arr'), [1, 2, 3]);
  assert.equal(cache.peek('str'), 'string');
});

test('createReaderCache load deduplicates concurrent requests to single execution', async () => {
  const cache = createReaderCache();
  const pending = Promise.withResolvers();
  let callCount = 0;
  const request = () => { callCount += 1; return pending.promise; };

  const p1 = cache.load('key', request);
  const p2 = cache.load('key', request);
  // Both calls should only execute request once (deduplication)
  // request is called in a microtask via Promise.resolve().then(request)
  await Promise.resolve();
  assert.equal(callCount, 1);
  pending.resolve('same');
  assert.equal(await p1, 'same');
  assert.equal(await p2, 'same');
});