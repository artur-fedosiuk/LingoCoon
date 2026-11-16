import type { TracesSamplerSamplingContext } from '@sentry/core';
import type { ErrorEvent } from '@sentry/core';
import type { StreamedSpanJSON } from '@sentry/core';

export const SENSITIVE_QUERY_PARAMS = [
  'code',
  'token',
  'token_hash',
  'access_token',
  'refresh_token',
  'email',
  'state',
] as const;

/**
 * Scrubs sensitive query parameters from a URL string.
 */
export function scrubQueryString(url: string): string {
  try {
    const urlObj = new URL(url);
    let changed = false;
    for (const param of SENSITIVE_QUERY_PARAMS) {
      if (urlObj.searchParams.has(param)) {
        urlObj.searchParams.set(param, "[REDACTED]");
        changed = true;
      }
    }
    return changed ? urlObj.toString() : url;
  } catch {
    return url;
  }
}

/**
 * Scrubs sensitive query parameters from various query string formats.
 */
export function scrubQueryParams(
  queryString: string | Record<string, string> | ReadonlyArray<[string, string]>
): string | Record<string, string> | ReadonlyArray<[string, string]> {
  if (typeof queryString === 'string') {
    const qs = new URLSearchParams(queryString);
    let changed = false;
    for (const param of SENSITIVE_QUERY_PARAMS) {
      if (qs.has(param)) {
        qs.set(param, "[REDACTED]");
        changed = true;
      }
    }
    return changed ? qs.toString() : queryString;
  }
  if (Array.isArray(queryString)) {
    return queryString.map(([key, value]) => [
      key,
      SENSITIVE_QUERY_PARAMS.includes(key as (typeof SENSITIVE_QUERY_PARAMS)[number]) ? "[REDACTED]" : value,
    ]) as ReadonlyArray<[string, string]>;
  }
  const result: Record<string, string> = {};
  let changed = false;
  for (const [key, value] of Object.entries(queryString)) {
    if (SENSITIVE_QUERY_PARAMS.includes(key as (typeof SENSITIVE_QUERY_PARAMS)[number])) {
      result[key] = "[REDACTED]";
      changed = true;
    } else {
      result[key] = value;
    }
  }
  return changed ? result : queryString;
}

/**
 * Scrubs sensitive data from Sentry request data (url and query_string).
 */
export function scrubRequestData(
  event: { request?: { url?: string; query_string?: string | Record<string, string> | ReadonlyArray<[string, string]> } }
): void {
  if (event.request?.url) {
    event.request.url = scrubQueryString(event.request.url);
  }
  if (event.request?.query_string) {
    event.request.query_string = scrubQueryParams(event.request.query_string);
  }
}

/**
 * Scrubs sensitive query params from a path-with-query string like "/path?foo=1&code=secret".
 * Keeps the path unchanged, only redacts sensitive params in the query string.
 */
function scrubPathWithQuery(pathWithQuery: string): string {
  const qIndex = pathWithQuery.indexOf('?');
  if (qIndex === -1) return pathWithQuery;
  const path = pathWithQuery.slice(0, qIndex);
  const query = pathWithQuery.slice(qIndex + 1);
  const scrubbedQuery = scrubQueryParams(query);
  return typeof scrubbedQuery === 'string' ? path + '?' + scrubbedQuery : pathWithQuery;
}

/**
 * Scrubs sensitive data from streamed span attributes (url.full, url.query, http.url, http.query, http.target).
 */
export function scrubStreamedSpanAttributes(
  attributes: Record<string, unknown> | undefined
): void {
  if (!attributes) return;

  // Keys that contain full URLs (use scrubQueryString)
  const urlKeys = ['url.full', 'http.url'];
  // Keys that contain only query strings (use scrubQueryParams)
  const queryStringKeys = ['url.query', 'http.query'];
  // http.target can be a path with query string like "/auth/callback?code=secret"
  const pathWithQueryKeys = ['http.target'];

  for (const key of urlKeys) {
    if (key in attributes && typeof attributes[key] === 'string') {
      attributes[key] = scrubQueryString(attributes[key] as string);
    }
  }

  for (const key of queryStringKeys) {
    if (key in attributes && typeof attributes[key] === 'string') {
      attributes[key] = scrubQueryParams(attributes[key] as string);
    }
  }

  for (const key of pathWithQueryKeys) {
    if (key in attributes && typeof attributes[key] === 'string') {
      attributes[key] = scrubPathWithQuery(attributes[key] as string);
    }
  }
}

/**
 * Scrubs sensitive params from a span name like "METHOD /path?query".
 * Keeps the method and path unchanged, only redacts sensitive params in the query string.
 */
function scrubSpanName(name: string): string {
  // Find the first space (method/path separator)
  const spaceIndex = name.indexOf(' ');
  if (spaceIndex === -1) {
    // No method prefix, treat as path-with-query
    return scrubPathWithQuery(name);
  }
  const method = name.slice(0, spaceIndex + 1); // includes trailing space
  const pathWithQuery = name.slice(spaceIndex + 1);
  return method + scrubPathWithQuery(pathWithQuery);
}

/**
 * Scrubs sensitive data from a streamed span before sending.
 * Redacts sensitive params in span.name and span.attributes.
 */
export function scrubStreamedSpan(span: StreamedSpanJSON): StreamedSpanJSON {
  // Scrub span name if it contains sensitive params
  if (span.name) {
    const hasSensitiveParam = SENSITIVE_QUERY_PARAMS.some(param => span.name?.includes(param + '='));
    if (span.name.includes('?') && hasSensitiveParam) {
      span.name = scrubSpanName(span.name);
    }
  }

  // Scrub span attributes
  if (span.attributes) {
    scrubStreamedSpanAttributes(span.attributes as Record<string, unknown>);
  }

  return span;
}

/**
 * Scrubs sensitive data from an ErrorEvent.
 */
export function scrubErrorEvent(event: ErrorEvent): void {
  scrubRequestData(event);

  // Scrub headers and cookies
  if (event.request?.headers) {
    const headers = event.request.headers as Record<string, string>;
    if (headers.authorization) headers.authorization = "[REDACTED]";
    if (headers.cookie) headers.cookie = "[REDACTED]";
    if (headers['x-forwarded-for']) headers['x-forwarded-for'] = "[REDACTED]";
  }
  if (event.request?.cookies) {
    event.request.cookies = { "[REDACTED]": "[REDACTED]" };
  }

  // Scrub sensitive data in exception contexts
  if (event.exception?.values) {
    for (const exception of event.exception.values) {
      if (exception.stacktrace?.frames) {
        for (const frame of exception.stacktrace.frames) {
          if (frame.vars) {
            for (const key of Object.keys(frame.vars)) {
              const lowerKey = key.toLowerCase();
              if (
                lowerKey.includes('password') ||
                lowerKey.includes('secret') ||
                lowerKey.includes('token') ||
                lowerKey.includes('key') ||
                lowerKey.includes('authorization') ||
                lowerKey.includes('cookie') ||
                lowerKey.includes('credit_card') ||
                lowerKey.includes('api_key')
              ) {
                frame.vars[key] = "[REDACTED]";
              }
            }
          }
        }
      }
    }
  }
}

/**
 * Checks if a URL string contains any sensitive query parameter.
 */
function urlHasSensitiveParam(url: string): boolean {
  try {
    const urlObj = new URL(url);
    for (const param of SENSITIVE_QUERY_PARAMS) {
      if (urlObj.searchParams.has(param)) {
        return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Traces sampler that returns 0 for /auth/ routes OR when URL contains sensitive query params,
 * otherwise uses inheritOrSampleWith.
 * Uses correct Sentry v11 TracesSamplerSamplingContext fields:
 * - name: string
 * - normalizedRequest?: RequestEventData (has .url)
 * - location?: WorkerLocation (has .pathname, .search)
 * - attributes: RawAttributes
 * - inheritOrSampleWith: (fallbackSampleRate: number) => number
 */
export function traceSampleRate(
  ctx: TracesSamplerSamplingContext,
  fallbackRate: number
): number {
  // Check normalizedRequest.url (Node.js server)
  const requestUrl = ctx.normalizedRequest?.url;
  if (requestUrl) {
    if (requestUrl.includes('/auth/') || urlHasSensitiveParam(requestUrl)) {
      return 0;
    }
  }

  // Check location.pathname + location.search (Browser)
  const locationPath = ctx.location?.pathname;
  const locationSearch = ctx.location?.search;
  if (locationPath) {
    if (locationPath.includes('/auth/')) {
      return 0;
    }
    // Check search string for sensitive params
    if (locationSearch && locationSearch.startsWith('?')) {
      // Build a fake URL to use urlHasSensitiveParam
      if (urlHasSensitiveParam('http://dummy' + locationSearch)) {
        return 0;
      }
    }
  }

  // Check span name (fallback) - check for /auth/ in name
  if (ctx.name && ctx.name.includes('/auth/')) {
    return 0;
  }

  return ctx.inheritOrSampleWith(fallbackRate);
}