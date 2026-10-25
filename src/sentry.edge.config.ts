import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  dataCollection: {
    userInfo: false,
    httpBodies: [],
  },

  // 100% in dev, 10% in production
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,

  // Session Replay not available in edge runtime
  // replaysSessionSampleRate: 0.1,
  // replaysOnErrorSampleRate: 1.0,

  integrations: [],

  // Filter events before sending - scrub sensitive data
  beforeSend: (event) => {
    // Scrub request data
    if (event.request?.headers) {
      const headers = event.request.headers as Record<string, string>;
      if (headers.authorization) headers.authorization = "[REDACTED]";
      if (headers.cookie) headers.cookie = "[REDACTED]";
      if (headers["x-forwarded-for"]) headers["x-forwarded-for"] = "[REDACTED]";
    }

    // Scrub cookies if present
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
                  lowerKey.includes("password") ||
                  lowerKey.includes("secret") ||
                  lowerKey.includes("token") ||
                  lowerKey.includes("key") ||
                  lowerKey.includes("authorization") ||
                  lowerKey.includes("cookie") ||
                  lowerKey.includes("credit_card") ||
                  lowerKey.includes("api_key")
                ) {
                  frame.vars[key] = "[REDACTED]";
                }
              }
            }
          }
        }
      }
    }

    return event;
  },
});