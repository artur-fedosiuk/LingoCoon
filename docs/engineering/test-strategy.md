# LingoCoon Test Strategy

## Status

Current coverage and target verification contract.

- Version: 1.1
- Last reviewed: 2026-09-08

## Current automated evidence

| Layer | Current evidence | Command |
| --- | --- | --- |
| Secret rules | Worktree/index/history scanner and scanner self-test | `npm run security:secrets`; history/self-test scripts when applicable |
| Node tests | Tests under `tests/*.test.mjs` for security/storage and imported application helpers; the legacy script name is broader than its contents | `npm run test:security` |
| Static quality | ESLint and strict TypeScript | `npm run lint`; `npm run typecheck` |
| Production compilation | Next.js production build and route generation | `npm run build` |
| Dependency advisories | npm audit | `npm audit --audit-level=high` |
| Database security | Transactional SQL checks for functions, grants, future-table RLS, and Data API defaults | `supabase/tests/database_security.sql` in a local/isolated/approved database |
| CI | Secret scan, security tests, lint, type-check, build | `.github/workflows/ci.yml` |

The database test is not currently run by `npm run check` or CI. Node's existing runner can test imported pure TypeScript modules without a new dependency. Inspect current scripts before claiming a missing runner. There is no configured component/browser E2E runner, automated accessibility suite, or performance budget in the inspected package scripts. Unit tests alone cannot verify React wiring, Server Actions, authentication, or provider quality.

Tests must import or exercise shipped code. Fixture-only assertions and copied implementations do not count as behavioral coverage. For async work, cover obsolete responses, cache hits, reset/edit, and rejection. At least one concrete regression should demonstrate why a new test would fail on the old behavior.

The current secret scanner's worktree mode enumerates tracked/indexed paths (`git ls-files`), not untracked additions. Review new files explicitly and do not describe its green result as coverage of the entire dirty workspace.

## Risk-based layers

- Unit: deterministic validators, parsers, schedulers, state transitions, quotas, and recommendation rules.
- Integration: Server Actions/Route Handlers with mocked providers and authenticated Supabase fixtures.
- Database/RLS: anonymous, owner, other user, constraints, idempotency, quotas, deletion, and migration upgrade/rollback.
- Component: interaction states, forms, focus, async feedback, audio/transcript, and error recovery.
- E2E: signup/login/OAuth fixture, onboarding, ownership, primary mission, provider failure, save/resume, export/delete when implemented.
- Accessibility: semantics plus keyboard, screen reader, 320px, zoom, contrast, reduced motion, transcript/caption, and permission denial.
- Performance: route/client bundle, rendering, query count/index use, provider p50/p95, Core Web Vitals, and failure timeout.
- Security: scoped code review, negative authorization tests, abuse limits, dependency/secret scan, and threat-model update when boundaries change.

## Change matrix

| Change | Minimum additional evidence |
| --- | --- |
| Documentation/skills/agents | Changed links, relevant TOML/YAML parsing, inventory consistency, one bounded behavioral review of revised instructions |
| UI behavior | Unit/component where available, browser success and failure flow, keyboard, 320px, reduced motion |
| Server Action/API | Anonymous/owner/other-user, invalid/oversized/repeated input, timeout/provider failure, log review |
| Supabase migration | Upgrade, RLS role matrix, constraints, existing-data compatibility, rollback, generated type update |
| AI/TTS/STT | Schema rejection, prompt injection, persistent limits, retry accounting, budget exhaustion, privacy/fallback |
| CI/deployment | Local parse/build, least privilege, pinned actions, preview smoke test, rollback/readback |

## Required final gate

For application changes run `npm run check`, `npm audit --audit-level=high`, `git diff --check`, diff/new-file review, and the change-specific checks above. Documentation-only changes need the validation in their matrix row, not an unrelated app build. Run history scanning only when history/publication is relevant and scanner self-test only after scanner changes.

Report commands, exit codes, meaningful observations, manual cases, skipped checks, unavailable environments, and release blockers. A login redirect verifies the boundary, not the reader. UI changes need actual rendered reference comparisons at desktop and narrow widths. Mocked provider results verify only the local flow; record live-provider verification separately. A critical unverified behavior prevents an unqualified completion claim.

## Tooling decisions still required

Before adding dev dependencies, approve a minimal runner strategy for application unit/integration tests, browser E2E, automated accessibility, and performance. Choose tools from actual feature needs; do not add a large testing stack merely to fill categories.
