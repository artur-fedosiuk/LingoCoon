import test from 'node:test';
import assert from 'node:assert/strict';
import { createLatestRequest } from '../src/lib/context-studio/latest-request.ts';
import { createReaderCache, withReaderTimeout } from '../src/lib/context-studio/reader-cache.ts';
import { contextFailureCode } from '../src/lib/server/context-studio-errors.ts';

test('reader diagnostics expose allowlisted codes, never arbitrary provider or learner content', () => {
  assert.equal(contextFailureCode(new Error('Gemini API request failed (429).')), 'provider_http_429');
  assert.equal(contextFailureCode(new Error('Invalid Context Studio response.')), 'invalid_response');
  assert.equal(contextFailureCode(new DOMException('private request payload', 'TimeoutError')), 'timeout');
  assert.equal(contextFailureCode(new Error('private learner text')), 'service_unavailable');
  assert.equal(contextFailureCode({ message: 'private' }), 'unknown');
});

test('interrupted reader requests time out and discard results arriving after the deadline', async () => {
  const pending = Promise.withResolvers();
  await assert.rejects(withReaderTimeout(() => pending.promise, 5), { message: 'Reader request timed out.' });
  pending.resolve('late result');
  assert.equal(await withReaderTimeout(() => Promise.resolve('retry')), 'retry');
});

test('cache deduplicates concurrent work and reuses successful results', async () => {
  const cache = createReaderCache();
  const pending = Promise.withResolvers();
  let calls = 0;
  const request = () => { calls += 1; return pending.promise; };
  const first = cache.load('to', request);
  const second = cache.load('to', request);
  await Promise.resolve();
  assert.equal(calls, 1);
  pending.resolve({ translation: 'a' });
  assert.deepEqual(await first, await second);
  assert.deepEqual(await cache.load('to', () => { throw new Error('Unexpected request'); }), { translation: 'a' });
});

test('cache never keeps failures and retries only when requested', async () => {
  const cache = createReaderCache();
  await assert.rejects(cache.load('word', () => Promise.reject(new Error('offline'))));
  assert.equal(cache.peek('word'), undefined);
  assert.equal(await cache.load('word', () => Promise.resolve('recovered')), 'recovered');
  cache.delete('word');
  assert.equal(cache.peek('word'), undefined);
});

test('cache has bounded successful entries and separates languages/contexts', async () => {
  const cache = createReaderCache(2);
  await cache.load('en:to:it', () => Promise.resolve('a'));
  await cache.load('en:to:fr', () => Promise.resolve('à'));
  await cache.load('en:read:it', () => Promise.resolve('leggere'));
  assert.equal(cache.peek('en:to:it'), undefined);
  assert.equal(cache.peek('en:to:fr'), 'à');
  assert.equal(cache.peek('en:read:it'), 'leggere');
});

test('a cached new selection also invalidates an older pending response', async () => {
  const cache = createReaderCache();
  const gate = createLatestRequest();
  const observed = observer();
  const old = Promise.withResolvers();
  await cache.load('success', () => Promise.resolve('successo'));
  const first = gate.run(() => cache.load('to', () => old.promise), observed.handlers);
  await gate.run(() => cache.load('success', () => Promise.reject(new Error('unexpected'))), observed.handlers);
  old.resolve('a');
  await first;
  assert.deepEqual(observed.events, [['result', 'successo'], ['settled']]);
  assert.equal(cache.peek('to'), 'a');
});

function deferred() {
  return Promise.withResolvers();
}

function observer() {
  const events = [];
  return {
    events,
    handlers: {
      onResult: (value) => events.push(['result', value]),
      onError: () => events.push(['error']),
      onSettled: () => events.push(['settled']),
    },
  };
}

test('only the latest request can deliver a result or finish the loading state', async () => {
  const gate = createLatestRequest();
  const old = deferred();
  const fresh = deferred();
  const observed = observer();
  const first = gate.run(() => old.promise, observed.handlers);
  const second = gate.run(() => fresh.promise, observed.handlers);
  old.resolve('obsolete explanation');
  await first;
  assert.deepEqual(observed.events, []);
  fresh.resolve('current explanation');
  await second;
  assert.deepEqual(observed.events, [['result', 'current explanation'], ['settled']]);
});

test('invalidating a pending request suppresses its result and settled callbacks', async () => {
  const gate = createLatestRequest();
  const pending = deferred();
  const observed = observer();
  const request = gate.run(() => pending.promise, observed.handlers);
  gate.invalidate();
  pending.resolve('obsolete explanation');
  await request;
  assert.deepEqual(observed.events, []);
});

test('an invalidated gate accepts a new request and discards the old result', async () => {
  const gate = createLatestRequest();
  const pending = deferred();
  const observed = observer();
  const request = gate.run(() => pending.promise, observed.handlers);
  gate.invalidate();
  await gate.run(() => Promise.resolve('new source translation'), observed.handlers);
  pending.resolve('old source translation');
  await request;
  assert.deepEqual(observed.events, [['result', 'new source translation'], ['settled']]);
});

test('current transport failure reports an error and settles loading', async () => {
  const gate = createLatestRequest();
  const observed = observer();
  await gate.run(() => Promise.reject(new Error('synthetic transport failure')), observed.handlers);
  assert.deepEqual(observed.events, [['error'], ['settled']]);
});

test('a rejected obsolete request cannot set an error on the new selection', async () => {
  const gate = createLatestRequest();
  const pending = deferred();
  const observed = observer();
  const old = gate.run(() => pending.promise, observed.handlers);
  await gate.run(() => Promise.resolve('new selection'), observed.handlers);
  pending.reject(new Error('synthetic obsolete failure'));
  await old;
  assert.deepEqual(observed.events, [['result', 'new selection'], ['settled']]);
});
