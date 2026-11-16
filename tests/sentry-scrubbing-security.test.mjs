import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  SENSITIVE_QUERY_PARAMS,
  scrubQueryString,
  scrubQueryParams,
  scrubRequestData,
  scrubStreamedSpanAttributes,
  scrubStreamedSpan,
  scrubErrorEvent,
  traceSampleRate,
} from '../src/lib/sentry-scrub.ts';

describe('Sentry Scrubbing Security - Sensitive params redacted', () => {
  test('SENSITIVE_QUERY_PARAMS includes all required params', () => {
    assert.deepStrictEqual(SENSITIVE_QUERY_PARAMS, [
      'code',
      'token',
      'token_hash',
      'access_token',
      'refresh_token',
      'email',
      'state',
    ]);
  });

  test('scrubQueryString redacts code, token, token_hash, access_token, refresh_token, email, state', () => {
    const url = 'https://example.com/auth/callback?code=abc123&token=xyz789&token_hash=hash123&access_token=at456&refresh_token=rt789&email=user%40example.com&state=xyz123&safe=keep';
    const result = scrubQueryString(url);

    assert.ok(!result.includes('abc123'), 'code should be redacted');
    assert.ok(!result.includes('xyz789'), 'token should be redacted');
    assert.ok(!result.includes('hash123'), 'token_hash should be redacted');
    assert.ok(!result.includes('at456'), 'access_token should be redacted');
    assert.ok(!result.includes('rt789'), 'refresh_token should be redacted');
    assert.ok(!result.includes('user%40example.com'), 'email should be redacted');
    assert.ok(!result.includes('xyz123'), 'state should be redacted');
    // URLSearchParams encodes [REDACTED] as %5BREDACTED%5D
    assert.ok(result.includes('%5BREDACTED%5D'), 'should contain encoded [REDACTED]');
    assert.ok(result.includes('safe=keep'), 'safe params should be preserved');
  });

  test('scrubQueryString handles URLs without query string', () => {
    const url = 'https://example.com/path';
    const result = scrubQueryString(url);
    assert.strictEqual(result, url);
  });

  test('scrubQueryString handles invalid URLs gracefully', () => {
    const url = 'not-a-valid-url';
    const result = scrubQueryString(url);
    assert.strictEqual(result, url);
  });

  test('scrubQueryParams string form redacts sensitive params', () => {
    const qs = 'code=abc123&token=xyz789&email=user%40example.com&state=xyz123&safe=keep';
    const result = scrubQueryParams(qs);

    assert.ok(!result.includes('abc123'));
    assert.ok(!result.includes('xyz789'));
    assert.ok(!result.includes('user%40example.com'));
    assert.ok(!result.includes('xyz123'));
    // URLSearchParams encodes [REDACTED] as %5BREDACTED%5D
    assert.ok(result.includes('%5BREDACTED%5D'));
    assert.ok(result.includes('safe=keep'));
  });

  test('scrubQueryParams object form redacts sensitive params', () => {
    const qs = { code: 'abc123', token: 'xyz789', email: 'user@example.com', state: 'xyz123', safe: 'keep' };
    const result = scrubQueryParams(qs);

    assert.strictEqual(result.code, '[REDACTED]');
    assert.strictEqual(result.token, '[REDACTED]');
    assert.strictEqual(result.email, '[REDACTED]');
    assert.strictEqual(result.state, '[REDACTED]');
    assert.strictEqual(result.safe, 'keep');
  });

  test('scrubQueryParams array form redacts sensitive params', () => {
    const qs = [['code', 'abc123'], ['token', 'xyz789'], ['email', 'user@example.com'], ['state', 'xyz123'], ['safe', 'keep']];
    const result = scrubQueryParams(qs);

    assert.strictEqual(result[0][0], 'code');
    assert.strictEqual(result[0][1], '[REDACTED]');
    assert.strictEqual(result[1][0], 'token');
    assert.strictEqual(result[1][1], '[REDACTED]');
    assert.strictEqual(result[2][0], 'email');
    assert.strictEqual(result[2][1], '[REDACTED]');
    assert.strictEqual(result[3][0], 'state');
    assert.strictEqual(result[3][1], '[REDACTED]');
    assert.strictEqual(result[4][0], 'safe');
    assert.strictEqual(result[4][1], 'keep');
  });

  test('scrubRequestData scrubs event.request.url', () => {
    const event = {
      request: {
        url: 'https://example.com/auth/callback?code=secret123&token=secret456',
        query_string: 'code=secret123&token=secret456',
      },
    };

    scrubRequestData(event);

    assert.ok(!event.request.url.includes('secret123'));
    assert.ok(!event.request.url.includes('secret456'));
    // URLSearchParams encodes [REDACTED] as %5BREDACTED%5D
    assert.ok(event.request.url.includes('%5BREDACTED%5D'));
  });

  test('scrubRequestData scrubs event.request.query_string string form', () => {
    const event = {
      request: {
        url: 'https://example.com/',
        query_string: 'code=secret123&token=secret456',
      },
    };

    scrubRequestData(event);

    assert.ok(!event.request.query_string.includes('secret123'));
    assert.ok(!event.request.query_string.includes('secret456'));
    // URLSearchParams encodes [REDACTED] as %5BREDACTED%5D
    assert.ok(event.request.query_string.includes('%5BREDACTED%5D'));
  });

  test('scrubRequestData scrubs event.request.query_string object form', () => {
    const event = {
      request: {
        url: 'https://example.com/',
        query_string: { code: 'secret123', token: 'secret456', safe: 'keep' },
      },
    };

    scrubRequestData(event);

    assert.strictEqual(event.request.query_string.code, '[REDACTED]');
    assert.strictEqual(event.request.query_string.token, '[REDACTED]');
    assert.strictEqual(event.request.query_string.safe, 'keep');
  });

  test('scrubRequestData handles missing request gracefully', () => {
    const event = {};
    assert.doesNotThrow(() => scrubRequestData(event));
  });

  test('scrubRequestData handles missing query_string gracefully', () => {
    const event = { request: { url: 'https://example.com/' } };
    assert.doesNotThrow(() => scrubRequestData(event));
  });

  test('scrubStreamedSpanAttributes redacts sensitive span attributes', () => {
    const attributes = {
      'url.full': 'https://example.com/auth/callback?code=secret123',
      'url.query': 'code=secret123&token=secret456',
      'http.url': 'https://example.com/auth/callback?code=secret123',
      'http.query': 'code=secret123',
      'http.target': '/auth/callback?code=secret123',
      'safe.attr': 'keep',
    };

    scrubStreamedSpanAttributes(attributes);

    assert.ok(!attributes['url.full'].includes('secret123'));
    assert.ok(!attributes['url.query'].includes('secret123'));
    assert.ok(!attributes['http.url'].includes('secret123'));
    assert.ok(!attributes['http.query'].includes('secret123'));
    assert.ok(!attributes['http.target'].includes('secret123'));
    assert.strictEqual(attributes['safe.attr'], 'keep');
  });

  test('scrubStreamedSpanAttributes preserves non-sensitive http.target with query', () => {
    const attributes = {
      'http.target': '/dashboard?tab=1',
    };

    scrubStreamedSpanAttributes(attributes);

    // Non-sensitive query params should be preserved exactly
    assert.strictEqual(attributes['http.target'], '/dashboard?tab=1');
  });

  test('scrubStreamedSpanAttributes redacts sensitive params but keeps non-sensitive in http.target', () => {
    const attributes = {
      'http.target': '/auth/callback?code=secret123&tab=1',
    };

    scrubStreamedSpanAttributes(attributes);

    assert.ok(!attributes['http.target'].includes('secret123'));
    assert.ok(attributes['http.target'].includes('tab=1'));
    assert.ok(attributes['http.target'].startsWith('/auth/callback?'));
  });

  test('scrubStreamedSpan scrubs streamed span fully', () => {
    const span = {
      trace_id: 'abc123',
      span_id: 'def456',
      name: 'GET /auth/callback?code=spansecret&token=spantoken',
      start_timestamp: Date.now() / 1000,
      status: 'ok',
      is_segment: true,
      attributes: {
        'url.full': 'https://example.com/auth/callback?code=spansecret',
        'http.url': 'https://example.com/api?token=spantoken',
        'http.target': '/auth/callback?code=spansecret',
      },
    };

    const result = scrubStreamedSpan(span);

    // Name scrubbed
    assert.ok(!result.name.includes('spansecret'));
    assert.ok(!result.name.includes('spantoken'));
    // Attributes scrubbed
    assert.ok(!result.attributes['url.full'].includes('spansecret'));
    assert.ok(!result.attributes['http.url'].includes('spantoken'));
    assert.ok(!result.attributes['http.target'].includes('spansecret'));
  });

  test('scrubStreamedSpan handles span without sensitive data', () => {
    const span = {
      trace_id: 'abc123',
      span_id: 'def456',
      name: 'GET /dashboard',
      start_timestamp: Date.now() / 1000,
      status: 'ok',
      is_segment: true,
      attributes: {
        'url.full': 'https://example.com/dashboard',
        'http.target': '/dashboard',
      },
    };

    const result = scrubStreamedSpan(span);

    assert.strictEqual(result.name, 'GET /dashboard');
    assert.strictEqual(result.attributes['url.full'], 'https://example.com/dashboard');
    assert.strictEqual(result.attributes['http.target'], '/dashboard');
  });

  test('scrubStreamedSpan handles missing attributes gracefully', () => {
    const span = {
      trace_id: 'abc123',
      span_id: 'def456',
      name: 'GET /auth/callback?code=secret',
      start_timestamp: Date.now() / 1000,
      status: 'ok',
      is_segment: true,
      attributes: undefined,
    };

    const result = scrubStreamedSpan(span);

    assert.ok(!result.name.includes('secret'));
  });

  test('scrubStreamedSpan preserves non-sensitive query in span name', () => {
    const span = {
      trace_id: 'abc123',
      span_id: 'def456',
      name: 'GET /dashboard?tab=1',
      start_timestamp: Date.now() / 1000,
      status: 'ok',
      is_segment: true,
      attributes: {},
    };

    const result = scrubStreamedSpan(span);

    assert.strictEqual(result.name, 'GET /dashboard?tab=1');
  });

  test('scrubErrorEvent scrubs error event fully', () => {
    const event = {
      request: {
        url: 'https://example.com/auth/callback?code=secret123',
        headers: {
          authorization: 'Bearer token123',
          cookie: 'session=abc',
        },
        cookies: { session: 'abc' },
      },
      exception: {
        values: [
          {
            stacktrace: {
              frames: [
                {
                  vars: {
                    password: 'secret',
                    api_key: 'key123',
                    normalVar: 'keep',
                  },
                },
              ],
            },
          },
        ],
      },
    };

    scrubErrorEvent(event);

    assert.ok(!event.request.url.includes('secret123'));
    assert.strictEqual(event.request.headers.authorization, '[REDACTED]');
    assert.strictEqual(event.request.headers.cookie, '[REDACTED]');
    assert.deepStrictEqual(event.request.cookies, { '[REDACTED]': '[REDACTED]' });
    assert.strictEqual(event.exception.values[0].stacktrace.frames[0].vars.password, '[REDACTED]');
    assert.strictEqual(event.exception.values[0].stacktrace.frames[0].vars.api_key, '[REDACTED]');
    assert.strictEqual(event.exception.values[0].stacktrace.frames[0].vars.normalVar, 'keep');
  });

  test('traceSampleRate returns 0 for /auth/ routes via normalizedRequest.url', () => {
    const ctx = {
      name: 'GET /auth/callback',
      normalizedRequest: { url: 'https://example.com/auth/callback?code=abc' },
      location: { pathname: '/dashboard' },
      attributes: {},
      inheritOrSampleWith: (rate) => rate,
    };

    const result = traceSampleRate(ctx, 0.1);
    assert.strictEqual(result, 0, '/auth/ routes via normalizedRequest.url should return 0 sample rate');
  });

  test('traceSampleRate returns 0 for /auth/ routes via location.pathname', () => {
    const ctx = {
      name: 'GET /dashboard',
      normalizedRequest: { url: 'https://example.com/dashboard' },
      location: { pathname: '/auth/login' },
      attributes: {},
      inheritOrSampleWith: (rate) => rate,
    };

    const result = traceSampleRate(ctx, 0.1);
    assert.strictEqual(result, 0, '/auth/ routes via location.pathname should return 0 sample rate');
  });

  test('traceSampleRate returns 0 for /auth/ routes via span name', () => {
    const ctx = {
      name: 'GET /auth/callback',
      normalizedRequest: { url: 'https://example.com/other' },
      location: { pathname: '/other' },
      attributes: {},
      inheritOrSampleWith: (rate) => rate,
    };

    const result = traceSampleRate(ctx, 0.1);
    assert.strictEqual(result, 0, '/auth/ routes via span name should return 0 sample rate');
  });

  test('traceSampleRate returns fallback rate for non-auth routes', () => {
    const ctx = {
      name: 'GET /dashboard',
      normalizedRequest: { url: 'https://example.com/dashboard' },
      location: { pathname: '/dashboard' },
      attributes: {},
      inheritOrSampleWith: (rate) => rate,
    };

    const result = traceSampleRate(ctx, 0.1);
    assert.strictEqual(result, 0.1, 'non-auth routes should return fallback rate');
  });

  test('traceSampleRate uses inheritOrSampleWith for non-auth routes', () => {
    let inheritedRate = 0;
    const ctx = {
      name: 'GET /dashboard',
      normalizedRequest: { url: 'https://example.com/dashboard' },
      location: { pathname: '/dashboard' },
      attributes: {},
      inheritOrSampleWith: (rate) => {
        inheritedRate = rate;
        return rate;
      },
    };

    traceSampleRate(ctx, 0.1);
    assert.strictEqual(inheritedRate, 0.1, 'should call inheritOrSampleWith with fallback rate');
  });

  test('traceSampleRate handles missing normalizedRequest and location gracefully', () => {
    const ctx = {
      name: 'GET /dashboard',
      attributes: {},
      inheritOrSampleWith: (rate) => rate,
    };

    const result = traceSampleRate(ctx, 0.1);
    assert.strictEqual(result, 0.1, 'should default to fallback rate when context is minimal');
  });

  test('traceSampleRate returns 0 when normalizedRequest.url has sensitive param code', () => {
    const ctx = {
      name: 'GET /',
      normalizedRequest: { url: 'https://example.com/?code=abc123' },
      location: { pathname: '/', search: '' },
      attributes: {},
      inheritOrSampleWith: (rate) => rate,
    };

    const result = traceSampleRate(ctx, 0.1);
    assert.strictEqual(result, 0, 'should return 0 when URL has sensitive param code');
  });

  test('traceSampleRate returns 0 when normalizedRequest.url has sensitive param state', () => {
    const ctx = {
      name: 'GET /',
      normalizedRequest: { url: 'https://example.com/?state=xyz789' },
      location: { pathname: '/', search: '' },
      attributes: {},
      inheritOrSampleWith: (rate) => rate,
    };

    const result = traceSampleRate(ctx, 0.1);
    assert.strictEqual(result, 0, 'should return 0 when URL has sensitive param state');
  });

  test('traceSampleRate returns 0 when location.search has sensitive param email', () => {
    const ctx = {
      name: 'GET /',
      normalizedRequest: { url: 'https://example.com/' },
      location: { pathname: '/', search: '?email=user%40example.com' },
      attributes: {},
      inheritOrSampleWith: (rate) => rate,
    };

    const result = traceSampleRate(ctx, 0.1);
    assert.strictEqual(result, 0, 'should return 0 when location.search has sensitive param email');
  });

  test('traceSampleRate returns fallback when location.search has non-sensitive param', () => {
    const ctx = {
      name: 'GET /',
      normalizedRequest: { url: 'https://example.com/' },
      location: { pathname: '/', search: '?tab=1' },
      attributes: {},
      inheritOrSampleWith: (rate) => rate,
    };

    const result = traceSampleRate(ctx, 0.1);
    assert.strictEqual(result, 0.1, 'should return fallback when location.search has non-sensitive param');
  });

  test('traceSampleRate returns fallback when normalizedRequest.url has non-sensitive param', () => {
    const ctx = {
      name: 'GET /',
      normalizedRequest: { url: 'https://example.com/?tab=1' },
      location: { pathname: '/', search: '' },
      attributes: {},
      inheritOrSampleWith: (rate) => rate,
    };

    const result = traceSampleRate(ctx, 0.1);
    assert.strictEqual(result, 0.1, 'should return fallback when URL has non-sensitive param');
  });
});