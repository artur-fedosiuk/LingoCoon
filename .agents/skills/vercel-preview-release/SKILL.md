---
name: vercel-preview-release
description: Prepare and verify a LingoCoon Vercel preview or release handoff after local gates pass; do not deploy, promote, or change Vercel without explicit approval.
---

# Vercel Preview Release

## Procedure

1. Resolve revision, target environment, expected domain, environment-variable names, migration needs, and rollback owner.
2. Run `npm run check`, `npm audit --audit-level=high`, and the relevant browser/security/database gates.
3. Verify repository CI is green and that preview workflows do not expose production secrets to untrusted pull requests.
4. Prepare a smoke-test matrix for auth, onboarding, core route, AI/TTS/STT fallbacks, headers, caching, and narrow/mobile access.
5. Present the exact external deploy or promotion action and wait for approval.
6. After authorized deployment, read back the revision, environment, health checks, and rollback readiness.

Return release candidate, evidence, external steps, risks, rollback, and go/no-go decision. Never infer live Vercel settings or execute deployment changes from repository access alone.
