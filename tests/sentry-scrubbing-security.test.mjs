import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  SENSITIVE_QUERY_PARAMS,
  traceSampleRate,
} from '../src/lib/sentry-scrub.ts';
import {
  scrubErrorEvent,
  scrubStreamedSpan,
} from '../src/lib/observability/scrub-event.ts';

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

  test('scrubErrorEvent scrubs error event fully - removes query string entirely', () => {
    const event = {
      request: {
        url: 'https://example.com/auth/callback?code=secret123',
        headers: {
          authorization: 'Bearer token123',
          cookie: 'session=abc',
          'x-forwarded-for': '1.2.3.4',
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

    // URL should have query string removed entirely (not just redacted)
    assert.strictEqual(event.request.url, 'https://example.com/auth/callback');
    assert.strictEqual(event.request.headers.authorization, '[REDACTED]');
    assert.strictEqual(event.request.headers.cookie, '[REDACTED]');
    assert.strictEqual(event.request.headers['x-forwarded-for'], '[REDACTED]');
    assert.deepStrictEqual(event.request.cookies, { '[REDACTED]': '[REDACTED]' });
    // query_string should be deleted
    assert.ok(!('query_string' in event.request));
    // frame.vars are NOT scrubbed (intentionally removed - not needed in JS)
    assert.strictEqual(event.exception.values[0].stacktrace.frames[0].vars.password, 'secret');
    assert.strictEqual(event.exception.values[0].stacktrace.frames[0].vars.api_key, 'key123');
    assert.strictEqual(event.exception.values[0].stacktrace.frames[0].vars.normalVar, 'keep');
  });

  test('scrubErrorEvent handles missing request gracefully', () => {
    const event = {};
    assert.doesNotThrow(() => scrubErrorEvent(event));
  });

  test('scrubErrorEvent handles invalid URL gracefully', () => {
    const event = {
      request: {
        url: 'not-a-valid-url?code=secret123',
        headers: {},
        cookies: {},
      },
    };
    assert.doesNotThrow(() => scrubErrorEvent(event));
    // Invalid URL should be left as-is
    assert.strictEqual(event.request.url, 'not-a-valid-url?code=secret123');
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
        'url.query': 'code=spansecret&token=spantoken',
        'http.query': 'code=spansecret',
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
    assert.ok(!result.attributes['url.query'].includes('spansecret'));
    assert.ok(!result.attributes['http.query'].includes('spantoken'));
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