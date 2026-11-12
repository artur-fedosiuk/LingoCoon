import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = resolve(fileURLToPath(import.meta.url), "..");
const ROOT = resolve(__dirname, "..");

test("Phase 3 hostile audit — 6 bypass attempts against observability stack", async () => {
  // 1. Verify health endpoint exposes no secrets or sensitive config
  await test("health endpoint does not expose secrets, API keys, or PII in response", () => {
    const healthRoute = readFileSync(resolve(ROOT, "src/app/api/health/route.ts"), "utf8");

    // Should not contain actual secret VALUES (not variable names)
    assert.ok(!/sk_live_|gh[pousr]_|github_pat_|AIza|GOCSPX-|xox[baprs]-|AKIA|ASIA|-----BEGIN.*PRIVATE KEY-----/.test(healthRoute), "health route contains actual secret values");

    // Should not log full request bodies or headers
    assert.ok(!/console\.log|console\.error/.test(healthRoute), "health route contains console.log/error");

    // Health endpoint is liveness-only: returns ONLY { status: "ok" } with Cache-Control no-store
    // No timestamp, latencyMs, checks, version, environment fields (they would leak info)
    assert.ok(/status\s*:\s*"ok"/.test(healthRoute), "health route missing status ok");
    assert.ok(/Cache-Control.*no-store/.test(healthRoute), "health route missing Cache-Control no-store");
    // Verify NO extra fields in the JSON response that would leak database/provider/environment details
    // Use a regex that matches field definitions in the response object, not comments
    assert.ok(!/return\s+NextResponse\.json\(\s*\{[^}]*timestamp/.test(healthRoute), "health route must not include timestamp in response (leaks timing)");
    assert.ok(!/return\s+NextResponse\.json\(\s*\{[^}]*latencyMs/.test(healthRoute), "health route must not include latencyMs in response (leaks internals)");
    assert.ok(!/return\s+NextResponse\.json\(\s*\{[^}]*checks/.test(healthRoute), "health route must not include checks in response (leaks DB/provider status)");
    assert.ok(!/return\s+NextResponse\.json\(\s*\{[^}]*version/.test(healthRoute), "health route must not include version in response (leaks build info)");
    assert.ok(!/return\s+NextResponse\.json\(\s*\{[^}]*environment/.test(healthRoute), "health route must not include environment in response (leaks deployment)");
  });

  // 2. Verify Sentry beforeSend scrubs auth, cookies, and sensitive fields
  await test("Sentry beforeSend scrubs authorization, cookie, x-forwarded-for, and sensitive frame vars", () => {
    const clientConfig = readFileSync(resolve(ROOT, "src/instrumentation-client.ts"), "utf8");
    const serverConfig = readFileSync(resolve(ROOT, "src/sentry.server.config.ts"), "utf8");
    const edgeConfig = readFileSync(resolve(ROOT, "src/sentry.edge.config.ts"), "utf8");

    const configs = [clientConfig, serverConfig, edgeConfig];

    for (const config of configs) {
      // Scrubs headers (exact pattern used in code)
      assert.ok(/headers\.authorization\s*=\s*"\[REDACTED\]"/.test(config), "missing authorization scrub");
      assert.ok(/headers\.cookie\s*=\s*"\[REDACTED\]"/.test(config), "missing cookie scrub");
      assert.ok(/headers\["x-forwarded-for"\]\s*=\s*"\[REDACTED\]"/.test(config), "missing x-forwarded-for scrub");

      // Scrubs cookies
      assert.ok(/event\.request\.cookies\s*=\s*\{\s*"\[REDACTED\]"\s*:\s*"\[REDACTED\]"\s*\}/.test(config), "missing cookies scrub");

      // Scrubs sensitive frame variables (password, secret, token, key, authorization, cookie, credit_card, api_key)
      assert.ok(/lowerKey\.includes\("password"\)/.test(config), "missing password scrub");
      assert.ok(/lowerKey\.includes\("secret"\)/.test(config), "missing secret scrub");
      assert.ok(/lowerKey\.includes\("token"\)/.test(config), "missing token scrub");
      assert.ok(/lowerKey\.includes\("key"\)/.test(config), "missing key scrub");
      assert.ok(/lowerKey\.includes\("authorization"\)/.test(config), "missing authorization scrub");
      assert.ok(/lowerKey\.includes\("cookie"\)/.test(config), "missing cookie scrub");
      assert.ok(/lowerKey\.includes\("credit_card"\)/.test(config), "missing credit_card scrub");
      assert.ok(/lowerKey\.includes\("api_key"\)/.test(config), "missing api_key scrub");
    }
  });

  // 3. Verify no secrets in Sentry DSN configuration (must come from env only)
  await test("Sentry DSN configured only from environment variables, no hardcoded values", () => {
    const clientConfig = readFileSync(resolve(ROOT, "src/instrumentation-client.ts"), "utf8");
    const serverConfig = readFileSync(resolve(ROOT, "src/sentry.server.config.ts"), "utf8");
    const edgeConfig = readFileSync(resolve(ROOT, "src/sentry.edge.config.ts"), "utf8");

    const configs = [clientConfig, serverConfig, edgeConfig];

    for (const config of configs) {
      // No hardcoded DSN strings
      assert.ok(!/dsn:\s*["']https?:\/\/[^"']+["']/.test(config), "found hardcoded DSN string");
      assert.ok(!/dsn:\s*\`https?:\/\/[^`]+\`/.test(config), "found hardcoded DSN template string");

      // Must use process.env
      assert.ok(/process\.env\.(SENTRY_DSN|NEXT_PUBLIC_SENTRY_DSN)/.test(config), "DSN not from process.env");
    }
  });

  // 4. Verify Session Replay is DISABLED (privacy review + user consent required before enable)
  await test("Session Replay is disabled until privacy review and user consent flow exist", () => {
    const clientConfig = readFileSync(resolve(ROOT, "src/instrumentation-client.ts"), "utf8");
    const serverConfig = readFileSync(resolve(ROOT, "src/sentry.server.config.ts"), "utf8");
    const edgeConfig = readFileSync(resolve(ROOT, "src/sentry.edge.config.ts"), "utf8");

    // Client should have integrations: [] (empty), NO replayIntegration, NO sample rates
    assert.ok(/integrations:\s*\[\s*\]/.test(clientConfig), "client must have empty integrations array (replay disabled)");
    assert.ok(!/replayIntegration/.test(clientConfig), "client must not have replayIntegration (replay disabled)");
    assert.ok(!/replaysSessionSampleRate/.test(clientConfig), "client must not have replaysSessionSampleRate (replay disabled)");
    assert.ok(!/replaysOnErrorSampleRate/.test(clientConfig), "client must not have replaysOnErrorSampleRate (replay disabled)");

    // Server should NOT have replayIntegration (not available in Node.js SDK)
    assert.ok(!/replayIntegration/.test(serverConfig), "server should not have replayIntegration (Node.js SDK doesn't support it)");

    // Server should NOT have sample rates (replay not supported) - check for uncommented active config
    assert.ok(!/^[^/\n]*replaysSessionSampleRate:\s*0\.1/m.test(serverConfig), "server should not have active replaysSessionSampleRate");
    assert.ok(!/^[^/\n]*replaysOnErrorSampleRate:\s*1\.0/m.test(serverConfig), "server should not have active replaysOnErrorSampleRate");

    // Edge should NOT have replay (not supported in edge runtime) - check for uncommented active config
    assert.ok(!/^[^/\n]*replaysSessionSampleRate:\s*0\.1/m.test(edgeConfig), "edge should not have active replaysSessionSampleRate");
    assert.ok(!/^[^/\n]*replaysOnErrorSampleRate:\s*1\.0/m.test(edgeConfig), "edge should not have active replaysOnErrorSampleRate");
    assert.ok(!/^[^/\n]*replayIntegration\(\)/m.test(edgeConfig), "edge should not have replayIntegration");

    // Verify comment documents the privacy rationale
    assert.ok(/Session Replay is disabled until a privacy review and a user-consent flow exist/.test(clientConfig), "client missing privacy rationale comment for disabled replay");
  });

  // 5. Verify error boundaries capture to Sentry without exposing sensitive data
  await test("Error boundaries use Sentry.captureException and do not log sensitive data", () => {
    const globalError = readFileSync(resolve(ROOT, "src/app/global-error.tsx"), "utf8");
    const errorBoundary = readFileSync(resolve(ROOT, "src/app/error.tsx"), "utf8");

    // Should import Sentry and captureException
    assert.ok(/import.*Sentry.*from.*@sentry\/nextjs/.test(globalError), "global-error missing Sentry import");
    assert.ok(/import.*Sentry.*from.*@sentry\/nextjs/.test(errorBoundary), "error.tsx missing Sentry import");
    assert.ok(/Sentry\.captureException\(error\)/.test(globalError), "global-error missing captureException");
    assert.ok(/Sentry\.captureException\(error\)/.test(errorBoundary), "error.tsx missing captureException");

    // Should NOT log error details to console
    assert.ok(!/console\.(log|error|warn)/.test(globalError), "global-error contains console logging");
    assert.ok(!/console\.(log|error|warn)/.test(errorBoundary), "error.tsx contains console logging");

    // Should have reset/recovery UI
    assert.ok(/reset|retry|reload/i.test(globalError), "global-error missing reset UI");
    assert.ok(/reset|retry|reload/i.test(errorBoundary), "error.tsx missing reset UI");
  });

  // 6. Verify next.config.ts uses v11.9.0 API correctly (no deprecated options)
  await test("next.config.ts uses @sentry/nextjs v11.9.0 API (bundleSizeOptimizations, _experimental.vercelCronsMonitoring)", () => {
    const nextConfig = readFileSync(resolve(ROOT, "next.config.ts"), "utf8");

    // Import from correct module
    assert.ok(/from\s*['"]@sentry\/nextjs\/config['"]/.test(nextConfig), "next.config.ts missing correct import");

    // Uses bundleSizeOptimizations (replaces treeshake) - multi-line object
    assert.ok(/bundleSizeOptimizations:/.test(nextConfig), "missing bundleSizeOptimizations");
    assert.ok(/excludeDebugStatements:\s*true/.test(nextConfig), "missing excludeDebugStatements in bundleSizeOptimizations");

    // Uses _experimental.vercelCronsMonitoring (replaces automaticVercelMonitors)
    assert.ok(/_experimental:/.test(nextConfig), "missing _experimental");
    assert.ok(/vercelCronsMonitoring:\s*true/.test(nextConfig), "missing vercelCronsMonitoring in _experimental");

    // Does NOT use deprecated options
    assert.ok(!/treeshake/.test(nextConfig), "next.config.ts uses deprecated treeshake");
    assert.ok(!/automaticVercelMonitors/.test(nextConfig), "next.config.ts uses deprecated automaticVercelMonitors");

    // Security headers maintained
    assert.ok(/Content-Security-Policy/.test(nextConfig), "missing Content-Security-Policy");
    assert.ok(/Permissions-Policy/.test(nextConfig), "missing Permissions-Policy");
    assert.ok(/X-Content-Type-Options/.test(nextConfig), "missing X-Content-Type-Options");
    assert.ok(/X-Frame-Options/.test(nextConfig), "missing X-Frame-Options");
  });
});