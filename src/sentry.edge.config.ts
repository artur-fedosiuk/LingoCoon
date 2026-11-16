import * as Sentry from "@sentry/nextjs";
import type { ErrorEvent } from "@sentry/core";
import type { StreamedSpanJSON } from "@sentry/core";
import {
  traceSampleRate,
  scrubErrorEvent,
  scrubStreamedSpan,
} from "@/lib/sentry-scrub";

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  dataCollection: {
    userInfo: false,
    cookies: false,
    httpBodies: [],
    urlQueryParams: false,
    stackFrameVariables: false,
  },

  // 0% for /auth/* routes to never leak tokens in transactions; otherwise inherit or use fallback
  tracesSampler: (ctx) => traceSampleRate(ctx, process.env.NODE_ENV === "development" ? 1.0 : 0.1),

  // Session Replay not available in edge runtime
  // replaysSessionSampleRate: 0.1,
  // replaysOnErrorSampleRate: 1.0,

  // Drop console breadcrumbs entirely — never leak tokens, codes, or PII via Sentry breadcrumbs
  beforeBreadcrumb: (breadcrumb) => {
    if (breadcrumb.category === 'console') {
      return null;
    }
    return breadcrumb;
  },

  // Filter streamed spans before sending - scrub sensitive data from span attributes and name
  beforeSendSpan: (span: StreamedSpanJSON) => {
    return scrubStreamedSpan(span);
  },

  // Filter events before sending - scrub sensitive data
  beforeSend: (event: ErrorEvent) => {
    scrubErrorEvent(event);
    return event;
  },
});