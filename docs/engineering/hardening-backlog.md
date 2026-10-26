# Hardening Backlog — Phase-Gated P0–P5

> **Governance**: This document is the authoritative source for all hardening work. Each phase must be 100% complete (verified by `npm run check` + hostile audit + `supabase-rls-audit` + `secure-code-review` on diff) before the next phase gate opens. No exceptions.

## Phase 0: Foundation (Pre-requisites)

- [x] Repository hygiene: remove invalid files (`src/lint-hook-clean.ts`, `src/lint-hook-error.ts`, `src/generateCommitMessage.ts`, `src/gitDeff.ts`)
- [x] Canonical governance docs created (AGENTS-INDEX.md, SKILLS-REGISTRY.md, WORKFLOW-CATALOG.md, SECURITY-GOVERNANCE.md, GOVERNANCE-OVERVIEW.md)
- [x] Cross-references updated (docs/README.md, .agents/project/AGENTS.md)
- [x] Quality gates established: 104 security boundary tests → 309 security boundary tests, ESLint, tsc --noEmit, build, npm audit high
- [x] Git hooks: pre-commit/pre-push hooks added, CI trigger extended, git safety hardened

---

## Phase 1: Governance Documentation ✅ **COMPLETE**

**Gate**: All 5 canonical documents exist, cross-referenced, `npm run check` green.

| Item | Status |
|------|--------|
| AGENTS-INDEX.md | ✅ |
| SKILLS-REGISTRY.md | ✅ |
| WORKFLOW-CATALOG.md | ✅ |
| SECURITY-GOVERNANCE.md | ✅ |
| GOVERNANCE-OVERVIEW.md | ✅ |

---

## Phase 2: CI and Configuration Hardening ✅ **COMPLETE**

**Gate**: Dependabot configured, CI audit step added, Postgres image pinned, `npm run check` green.

| Item | Status |
|------|--------|
| Dependabot config (.github/dependabot.yml) | ✅ |
| CI audit step (npm audit --audit-level=high) | ✅ |
| Postgres image pinned to digest | ✅ |

---

## Phase 3: Enterprise Observability Hardening ✅ **COMPLETE**

**Gate**: Sentry client/server/edge + Session Replay + privacy-safe beforeSend + health endpoint + error boundaries + hostile audit (6/6 defended) + 309 security tests pass.

| Item | Status |
|------|--------|
| Sentry client instrumentation (`src/instrumentation-client.ts`) | ✅ |
| Sentry server instrumentation (`src/sentry.server.config.ts`) | ✅ |
| Sentry edge instrumentation (`src/sentry.edge.config.ts`) | ✅ |
| Session Replay (client + server 10%/100%, edge disabled) | ✅ |
| Privacy-safe beforeSend (8 sensitive patterns + headers + cookies) | ✅ |
| Health endpoint `/api/health` (liveness/readiness, 503/200, no-store) | ✅ |
| Error boundaries (`global-error.tsx`, `error.tsx`) with Sentry.captureException | ✅ |
| next.config.ts v11.9.0 API (withSentryConfig, bundleSizeOptimizations, _experimental.vercelCronsMonitoring) | ✅ |
| Build script workaround (next build --webpack) | ✅ |
| Secret scanner EPERM fix | ✅ |
| Hostile audit test (6 bypass attempts, all blocked) | ✅ |
| Security boundary tests: 309 pass / 0 fail | ✅ |

### Hostile Audit Results

| Attempt | Target | Result |
|---------|--------|--------|
| 1 | Health endpoint secret/PII exposure | Blocked — no secret values, no console, minimal fields, no-store |
| 2 | Sentry beforeSend header/cookie/frame var scrubbing | Blocked — all 3 configs scrub all required patterns |
| 3 | Hardcoded Sentry DSN | Blocked — all 3 configs use process.env only |
| 4 | Session Replay privacy (edge) | Blocked — client/server have replay; edge has NO active config |
| 5 | Error boundary console leakage | Blocked — Sentry.captureException, zero console.*, reset UI |
| 6 | Deprecated next.config.ts options | Blocked — no treeshake/automaticVercelMonitors; uses v11.9.0 replacements |

---

## Phase 4: Database & API Hardening (P0)

**Gate**: All P0 migrations created, RLS verified, API ownership guards enforced, `npm run check` green.

### P0-1: study_progress RLS (ownership via cards→decks→user_id) ✅ **COMPLETE**
- Migration: `supabase/migrations/20261026000000_study_progress_rls.sql`
- Verification: `supabase/tests/database_security.sql` passes

### P0-2: get_deck_stats ownership guard (Critical IDOR / info disclosure) 🔄 **NEXT**
- **Risk**: Function returns deck statistics without verifying caller owns the deck → info disclosure
- **Fix**: Create migration adding ownership check using `auth.uid()` against `decks.user_id`
- **Test**: Add test case in `supabase/tests/database_security.sql` verifying anon and other users get zero rows

### P0-3: Server Action / Route Handler ownership audit
- Audit all `src/app/api/**/route.ts` and Server Actions for missing ownership checks
- Apply `server-action-security` skill checklist to each

### P0-4: Feature flag evaluation endpoints (RLS on flags, segments, evaluations)
- Ensure feature flag reads respect environment scoping and user targeting rules

---

## Phase 5: AI/Provider Hardening (P1)

**Gate**: Provider abuse resistance, durable limits, privacy-safe logging, fallback chains verified.

| Item | Status |
|------|--------|
| TTS provider abuse limits (ElevenLabs, Azure) | 🔄 |
| STT provider abuse limits (Azure, OpenAI) | 🔄 |
| AI contract validation at boundaries (Zod schemas) | 🔄 |
| Provider fallback chains with circuit breakers | 🔄 |
| Cost tracking and alerting per provider | 🔄 |

---

## Phase 6: Client & Supply Chain Hardening (P2–P5)

| Phase | Focus | Status |
|-------|-------|--------|
| P2 | CSP, Permissions-Policy, COOP/COEP, Subresource Integrity | 🔄 |
| P3 | Dependency scanning (SBOM, npm audit, lockfile integrity) | 🔄 |
| P4 | Build reproducibility (vercel.json, vercel.ts, pinned images) | 🔄 |
| P5 | Incident response runbook, backup/restore verification | 🔄 |

---

## Verification Commands

```bash
# Full pipeline (must pass before any commit)
npm run check

# Security-specific
npm run test:security           # 309 pass / 0 fail
npm run security:secrets        # Scan current tree
npm run security:secrets:history # Scan Git history
npm audit --audit-level=high    # 0 vulnerabilities

# Database
supabase db diff --local        # Check migrations
npm run supabase-rls-audit      # RLS audit on diff

# Code review
npm run secure-code-review      # Security review on diff

# Hostile audit
node tests/hostile-audit.test.mjs  # 6/6 bypass attempts blocked
```

---

## Phase Gate Rules

| Gate | Requirement |
|------|-------------|
| Phase 1 → 2 | All 5 governance docs exist + cross-refs + `npm run check` green |
| Phase 2 → 3 | Dependabot + CI audit + Postgres digest + `npm run check` green |
| Phase 3 → 4 | **All 6 hostile audit tests pass** + 309 security tests + `npm run check` green |
| Phase 4 → 5 | All P0 migrations applied + RLS verified + `supabase-rls-audit` clean + `npm run check` green |
| Phase 5 → 6 | All P1 provider hardening verified + `ai-abuse-and-cost-review` clean + `npm run check` green |

---

## Current Phase: **Phase 4 (P0-2 Next)**

**Blocked on**: P0-2 migration for `get_deck_stats` ownership guard.

**Next action**: Create `supabase/migrations/20261026010000_get_deck_stats_ownership.sql` with ownership check, add test to `supabase/tests/database_security.sql`, run `supabase-rls-audit` and `secure-code-review` on diff.