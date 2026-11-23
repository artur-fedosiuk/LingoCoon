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

/** Path patterns that contain tokens in the pathname itself (e.g., /reset/<token>, /invite/<token>) */
const SENSITIVE_PATH_PATTERNS = [
  /\/reset\/[^/?#]+/i,
  /\/invite\/[^/?#]+/i,
  /\/verify\/[^/?#]+/i,
  /\/confirm\/[^/?#]+/i,
  /\/magic-link\/[^/?#]+/i,
  /\/password-reset\/[^/?#]+/i,
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
 * When `encode` is false (default for breadcrumb paths), keeps literal [REDACTED] without URL encoding.
 */
function scrubQueryParams(
  queryString: string | Record<string, string> | ReadonlyArray<[string, string]>,
  encode = true
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
    if (!changed) return queryString;
    // If encode=false, manually rebuild without URL encoding for breadcrumb-style paths
    if (!encode) {
      const parts: string[] = [];
      for (const [key, value] of qs.entries()) {
        parts.push(`${key}=${value}`);
      }
      return parts.join('&');
    }
    return qs.toString();
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
 * Uses encode=false to keep literal [REDACTED] for breadcrumb-style paths.
 */
function scrubPathWithQuery(pathWithQuery: string): string {
  const qIndex = pathWithQuery.indexOf('?');
  if (qIndex === -1) {
    // No query string, but check for sensitive tokens in pathname
    return scrubPathname(pathWithQuery);
  }
  const path = pathWithQuery.slice(0, qIndex);
  const query = pathWithQuery.slice(qIndex + 1);
  const scrubbedQuery = scrubQueryParams(query, false);
  const scrubbedPath = scrubPathname(path);
  return typeof scrubbedQuery === 'string' ? scrubbedPath + '?' + scrubbedQuery : pathWithQuery;
}

/**
 * Scrubs sensitive tokens from pathname patterns (e.g., /reset/abc123 -> /reset/[REDACTED])
 */
function scrubPathname(pathname: string): string {
  let result = pathname;
  for (const pattern of SENSITIVE_PATH_PATTERNS) {
    result = result.replace(pattern, (match) => {
      const prefix = match.split('/').slice(0, -1).join('/') + '/';
      return prefix + '[REDACTED]';
    });
  }
  return result;
}

/**
 * Safely strips query string from a URL, handling relative/malformed URLs.
 * Returns origin + pathname only.
 */
function stripQueryString(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.origin + urlObj.pathname;
  } catch {
    // Relative URL or malformed: split on ? or #
    return url.split(/[?#]/)[0];
  }
}

/**
 * Scrubs sensitive data from streamed span attributes (url.full, url.query, http.url, http.query, http.target).
 */
function scrubStreamedSpanAttributes(
  attributes: Record<string, unknown> | undefined
): void {
  if (!attributes) return;

  // Keys that contain full URLs (use scrubQueryString + scrubPathname)
  const urlKeys = ['url.full', 'http.url'];
  // Keys that contain only query strings (use scrubQueryParams)
  const queryStringKeys = ['url.query', 'http.query'];
  // http.target can be a path with query string like "/auth/callback?code=secret"
  const pathWithQueryKeys = ['http.target'];

  for (const key of urlKeys) {
    if (key in attributes && typeof attributes[key] === 'string') {
      // Scrub both query params and pathname tokens
      attributes[key] = scrubPathWithQuery(attributes[key] as string);
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
    } else {
      // Still scrub pathname tokens even without query string
      span.name = scrubPathWithQuery(span.name);
    }
  }

  // Scrub span attributes
  if (span.attributes) {
    scrubStreamedSpanAttributes(span.attributes as Record<string, unknown>);
  }

  return span;
}

/**
 * Scrubs sensitive data from breadcrumb URLs (navigation, fetch, xhr).
 * Breadcrumbs can contain relative paths with query strings (e.g., "/dashboard?code=abc123")
 * so we use scrubPathWithQuery which handles both full URLs and path-with-query strings.
 */
function scrubBreadcrumb(breadcrumb: Record<string, unknown>): void {
  // Breadcrumb.data can contain URLs in various fields
  if (breadcrumb.data && typeof breadcrumb.data === 'object') {
    const data = breadcrumb.data as Record<string, unknown>;
    // Common breadcrumb data fields with URLs
    const urlFields = ['url', 'to', 'from', 'target', 'location'];
    for (const field of urlFields) {
      if (field in data && typeof data[field] === 'string') {
        data[field] = scrubPathWithQuery(data[field] as string);
      }
    }
    // Also check for 'data.url' which some integrations use
    if ('url' in data && typeof data.url === 'string') {
      data.url = scrubPathWithQuery(data.url as string);
    }
  }
}

/**
 * Scrubs sensitive data from request body (event.request.data).
 */
function scrubRequestBody(data: unknown): unknown {
  if (typeof data === 'string') {
    // Could be form data, JSON string, etc.
    return scrubQueryParams(data);
  }
  if (data && typeof data === 'object') {
    if (Array.isArray(data)) {
      return data.map(scrubRequestBody);
    }
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      if (SENSITIVE_QUERY_PARAMS.includes(key as (typeof SENSITIVE_QUERY_PARAMS)[number])) {
        result[key] = "[REDACTED]";
      } else {
        result[key] = scrubRequestBody(value);
      }
    }
    return result;
  }
  return data;
}

/**
 * Scrubs sensitive data from error message strings.
 */
function scrubErrorMessage(message: string): string {
  let result = message;
  // Redact common token patterns in error messages
  for (const param of SENSITIVE_QUERY_PARAMS) {
    // Match patterns like "code=abc123", "token=xyz", "access_token: abc", etc.
    const regex = new RegExp(`(${param}[\\s:=]+)([^\\s&]+)`, 'gi');
    result = result.replace(regex, '$1[REDACTED]');
  }
  return result;
}

/**
 * Scrubs sensitive data from an ErrorEvent.
 * Removes query string and cookies from request entirely to prevent leakage.
 */
export function scrubErrorEvent(event: ErrorEvent): void {
  // Completely remove URL query string and cookies to prevent ?code= leaks
  if (event.request?.url) {
    // Keep only the origin + pathname, strip query string entirely
    event.request.url = stripQueryString(event.request.url);
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
  // Delete cookies entirely instead of redacting
  if (event.request?.cookies) {
    delete event.request.cookies;
  }

  // Scrub request body (POST data)
  if (event.request?.data) {
    event.request.data = scrubRequestBody(event.request.data);
  }

  // Scrub breadcrumbs (navigation, fetch, xhr URLs)
  if (event.breadcrumbs) {
    for (const breadcrumb of event.breadcrumbs) {
      scrubBreadcrumb(breadcrumb as Record<string, unknown>);
    }
  }

  // Scrub error message values (exception messages can contain tokens)
  if (event.exception?.values) {
    for (const exception of event.exception.values) {
      if (exception.value && typeof exception.value === 'string') {
        exception.value = scrubErrorMessage(exception.value);
      }
      // Also scrub stacktrace frame filenames/paths if they contain tokens
      if (exception.stacktrace?.frames) {
        for (const frame of exception.stacktrace.frames) {
          if (frame.filename && typeof frame.filename === 'string') {
            frame.filename = scrubPathname(frame.filename);
          }
          if (frame.abs_path && typeof frame.abs_path === 'string') {
            frame.abs_path = scrubPathname(frame.abs_path);
          }
        }
      }
    }
  }
}