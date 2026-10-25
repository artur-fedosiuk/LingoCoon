import { captureRequestError } from "@sentry/nextjs";

export const onRequestError = captureRequestError;

// Server-side error hooks are handled by Next.js instrumentation
// These are no-ops that let Sentry capture via the SDK init
export const onUncaughtException = () => {};
export const onUnhandledRejection = () => {};

// Register the server-side Sentry configuration
export function register() {
  // Dynamic imports to initialize Sentry configs
  import("./sentry.server.config");
  import("./sentry.edge.config");
}