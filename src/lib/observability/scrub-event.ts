import type { ErrorEvent } from '@sentry/core';
import type { StreamedSpanJSON } from '@sentry/core';

const SENSITIVE_QUERY_PARAMS = [
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
function scrubQueryString(url: string): string {
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
function scrubQueryParams(
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
function scrubStreamedSpanAttributes(
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
 * Removes query string and cookies from request entirely to prevent leakage.
 */
export function scrubErrorEvent(event: ErrorEvent): void {
  // Completely remove URL query string and cookies to prevent ?code= leaks
  if (event.request?.url) {
    // Keep only the origin + pathname, strip query string entirely
    try {
      const urlObj = new URL(event.request.url);
      event.request.url = urlObj.origin + urlObj.pathname;
    } catch {
      // If URL parsing fails, leave as-is
    }
  }

  // Remove query_string entirely
  if (event.request) {
    delete event.request.query_string;
  }

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
}