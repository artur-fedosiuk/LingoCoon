import type { TracesSamplerSamplingContext } from '@sentry/core';

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