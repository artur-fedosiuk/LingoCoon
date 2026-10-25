import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs/config';

const projectRoot = process.cwd();
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: "base-uri 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'",
  },
  { key: 'Permissions-Policy', value: 'camera=(), geolocation=(), microphone=(self)' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
] as const;

const nextConfig: NextConfig = {
  // A parent package-lock.json exists on this machine, so auto-detection picks the wrong root.
  outputFileTracingRoot: projectRoot,
  poweredByHeader: false,
  turbopack: {
    root: projectRoot,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [...securityHeaders],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match your Next.js middleware, otherwise reporting will not work.
  tunnelRoute: "/monitoring",

  // Bundle size optimizations to reduce bundle size
  bundleSizeOptimizations: {
    // Removes Sentry SDK logger statements from the bundle
    excludeDebugStatements: true,
  },

  // Enables automatic instrumentation of Vercel Cron Jobs (Turbopack)
  _experimental: {
    vercelCronsMonitoring: true,
  },
});
