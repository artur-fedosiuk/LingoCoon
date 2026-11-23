import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  SENSITIVE_QUERY_PARAMS,
  traceSampleRate,
} from '../src/lib/sentry-scrub.ts';
import {
  scrubErrorEvent,
  scrubStreamedSpan,
} from '../src/lib/observability/scrub-event.ts';

const __dirname = resolve(fileURLToPath(import.meta.url), '..');
const ROOT = resolve(__dirname, '..');

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
    // cookies should be deleted entirely
    assert.ok(!('cookies' in event.request));
    // query_string should be deleted
    assert.ok(!('query_string' in event.request));
    // frame.vars are NOT scrubbed (stackFrameVariables: false in config)
    assert.strictEqual(event.exception.values[0].stacktrace.frames[0].vars.password, 'secret');
    assert.strictEqual(event.exception.values[0].stacktrace.frames[0].vars.api_key, 'key123');
    assert.strictEqual(event.exception.values[0].stacktrace.frames[0].vars.normalVar, 'keep');
  });

  test('scrubErrorEvent handles missing request gracefully', () => {
    const event = {};
    assert.doesNotThrow(() => scrubErrorEvent(event));
  });

  test('scrubErrorEvent handles relative URL gracefully (try/catch fallback)', () => {
    const event = {
      request: {
        url: '/auth/callback?code=secret123',
        headers: {},
        cookies: {},
      },
    };
    assert.doesNotThrow(() => scrubErrorEvent(event));
    // Relative URL: split fallback should work
    assert.strictEqual(event.request.url, '/auth/callback');
  });

  test('scrubErrorEvent handles malformed URL gracefully (try/catch fallback)', () => {
    const event = {
      request: {
        url: 'not-a-valid-url?code=secret123',
        headers: {},
        cookies: {},
      },
    };
    assert.doesNotThrow(() => scrubErrorEvent(event));
    // Malformed URL: split fallback should work
    assert.strictEqual(event.request.url, 'not-a-valid-url');
  });

  test('scrubErrorEvent scrubs breadcrumbs with URLs containing sensitive params', () => {
    const event = {
      request: { url: 'https://example.com/', headers: {}, cookies: {} },
      breadcrumbs: [
        { category: 'navigation', data: { to: '/dashboard?code=abc123' } },
        { category: 'fetch', data: { url: 'https://api.example.com/auth?token=xyz789' } },
        { category: 'xhr', data: { target: '/api/user?access_token=at456' } },
        { category: 'console', data: { message: 'log' } }, // console breadcrumbs already dropped in beforeBreadcrumb
      ],
    };

    scrubErrorEvent(event);

    assert.strictEqual(event.breadcrumbs[0].data.to, '/dashboard?code=[REDACTED]');
    assert.strictEqual(event.breadcrumbs[1].data.url, 'https://api.example.com/auth?token=[REDACTED]');
    assert.strictEqual(event.breadcrumbs[2].data.target, '/api/user?access_token=[REDACTED]');
  });

  test('scrubErrorEvent scrubs request body (POST data)', () => {
    const event = {
      request: {
        url: 'https://example.com/api/login',
        headers: { 'content-type': 'application/json' },
        cookies: {},
        data: {
          code: 'auth_code_123',
          token: 'user_token_456',
          email: 'user@example.com',
          safeField: 'keep_this',
          nested: {
            refresh_token: 'refresh_789',
            normal: 'value',
          },
        },
      },
    };

    scrubErrorEvent(event);

    assert.strictEqual(event.request.data.code, '[REDACTED]');
    assert.strictEqual(event.request.data.token, '[REDACTED]');
    assert.strictEqual(event.request.data.email, '[REDACTED]');
    assert.strictEqual(event.request.data.safeField, 'keep_this');
    assert.strictEqual(event.request.data.nested.refresh_token, '[REDACTED]');
    assert.strictEqual(event.request.data.nested.normal, 'value');
  });

  test('scrubErrorEvent scrubs request body as string (form data)', () => {
    const event = {
      request: {
        url: 'https://example.com/api/login',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        cookies: {},
        data: 'code=auth123&token=tok456&safe=keep',
      },
    };

    scrubErrorEvent(event);

    assert.ok(!event.request.data.includes('auth123'));
    assert.ok(!event.request.data.includes('tok456'));
    assert.ok(event.request.data.includes('safe=keep'));
    // URLSearchParams encodes [REDACTED] as %5BREDACTED%5D
    assert.ok(event.request.data.includes('%5BREDACTED%5D'));
  });

  test('scrubErrorEvent scrubs error message values containing tokens', () => {
    const event = {
      request: { url: 'https://example.com/', headers: {}, cookies: {} },
      exception: {
        values: [
          {
            value: 'Error: Invalid code=abc123 token=xyz789',
            type: 'Error',
            stacktrace: { frames: [] },
          },
        ],
      },
    };

    scrubErrorEvent(event);

    assert.ok(!event.exception.values[0].value.includes('abc123'));
    assert.ok(!event.exception.values[0].value.includes('xyz789'));
    assert.ok(event.exception.values[0].value.includes('[REDACTED]'));
  });

  test('scrubErrorEvent scrubs pathname tokens in stacktrace frame filenames', () => {
    const event = {
      request: { url: 'https://example.com/', headers: {}, cookies: {} },
      exception: {
        values: [
          {
            value: 'Error',
            type: 'Error',
            stacktrace: {
              frames: [
                { filename: '/app/src/auth/reset/abc123/handler.ts', lineno: 10 },
                { filename: '/app/src/invite/xyz789/accept.ts', lineno: 20 },
                { filename: '/app/src/dashboard/page.tsx', lineno: 30 },
              ],
            },
          },
        ],
      },
    };

    scrubErrorEvent(event);

    assert.ok(event.exception.values[0].stacktrace.frames[0].filename.includes('[REDACTED]'));
    assert.ok(event.exception.values[0].stacktrace.frames[1].filename.includes('[REDACTED]'));
    assert.strictEqual(event.exception.values[0].stacktrace.frames[2].filename, '/app/src/dashboard/page.tsx');
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

  test('scrubStreamedSpan scrubs pathname tokens in span name and attributes', () => {
    const span = {
      trace_id: 'abc123',
      span_id: 'def456',
      name: 'GET /reset/abc123?tab=1',
      start_timestamp: Date.now() / 1000,
      status: 'ok',
      is_segment: true,
      attributes: {
        'http.target': '/invite/xyz789?code=secret',
        'url.full': 'https://example.com/verify/token123',
      },
    };

    const result = scrubStreamedSpan(span);

    // Pathname tokens redacted
    assert.ok(result.name.includes('[REDACTED]'));
    assert.ok(!result.name.includes('abc123'));
    assert.ok(result.attributes['http.target'].includes('[REDACTED]'));
    assert.ok(!result.attributes['http.target'].includes('xyz789'));
    assert.ok(result.attributes['url.full'].includes('[REDACTED]'));
    assert.ok(!result.attributes['url.full'].includes('token123'));
  });

  // Verify server config has stackFrameVariables: false
  test('sentry.server.config.ts has stackFrameVariables: false', () => {
    const config = readFileSync(resolve(ROOT, 'src/sentry.server.config.ts'), 'utf8');
    assert.ok(/stackFrameVariables:\s*false/.test(config), 'server config must have stackFrameVariables: false');
  });

  // Verify edge config has stackFrameVariables: false
  test('sentry.edge.config.ts has stackFrameVariables: false', () => {
    const config = readFileSync(resolve(ROOT, 'src/sentry.edge.config.ts'), 'utf8');
    assert.ok(/stackFrameVariables:\s*false/.test(config), 'edge config must have stackFrameVariables: false');
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
});