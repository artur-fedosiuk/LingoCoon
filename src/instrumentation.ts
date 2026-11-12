import { captureRequestError } from "@sentry/nextjs";

export const onRequestError = captureRequestError;

// Initialize Sentry only for the runtime that is actually starting.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}
