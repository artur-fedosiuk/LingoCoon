# LingoCoon — Complete Enterprise Setup State

> **Definitive project state document — no unverified claims, no omissions.**
>
> **Supersedes:** Consolidates status from `docs/work/HANDOFF.md` and `docs/engineering/hardening-backlog.md` into a single authoritative reference.
>
> **Linked from:** User's explicit prompt instruction to create `docs/work/ENTERPRISE-STATUS.md` and update `docs/work/HANDOFF.md`.
>
> **User's verbatim instruction:** "Crea un documento definitivo e aggiornato che descriva tutto il lavoro completato finora, senza omettere dettagli e senza dichiarare attività non verificate."

---

## General State

```text
Enterprise setup: IN PROGRESS
Phase 1 governance: COMPLETE
Phase 2 CI/configuration hardening: COMPLETE
Phase 3 observability: NOT CONFIRMED / PENDING
Phase 4 privacy/compliance: NOT STARTED
Phase 5 performance/capacity: NOT STARTED
P0-2 get_deck_stats code: COMPLETE
P0-2 live database verification: BLOCKED / CI PENDING
P0-2 production migration: NOT STARTED
Production readiness: NOT CLAIMED
```

**Do not use unverified claims:**
```text
fully secure
production-ready
zero risk
40 million users supported
all quality gates pass
```

---

## 1. Project Context

```text
Project: LingoCoon
Branch: hardening/foundation
Application: Next.js App Router
Language: TypeScript strict
React: React 19
Database: Supabase/PostgreSQL
Authentication: Supabase SSR
Validation: Zod
Internationalization: en/fr/it/uk
Testing: Vitest/security boundary tests
Deployment target: Vercel
CI: GitHub Actions
```

**Scale requirement (not yet validated):**
```text
load test
stress test
capacity planning
provider quota analysis
database capacity analysis
observability
```

---

## 2. Permanent Governance

**Canonical source:** `.agents/project/AGENTS.md`

### Five Governance Documents

| Document | Purpose | Content | Relation to AGENTS.md | Versioning |
|----------|---------|---------|----------------------|------------|
| `docs/governance/AGENTS-INDEX.md` | Agent/skill registry | 18 agents, 28 skills, routing, workflow, coordination, validation rules | Referenced by AGENTS.md as agent/skill index | Created, cross-referenced, linked to canonical, versioned |
| `docs/governance/SKILLS-REGISTRY.md` | Skill registry detail | 28 skills with routing metadata, loading rules, agent mapping | Referenced by AGENTS.md for skill discovery | Created, cross-referenced, linked to canonical, versioned |
| `docs/governance/WORKFLOW-CATALOG.md` | Workflow patterns | Agent protocol, coordination rules, handoff contracts, standard workflow patterns | Referenced by AGENTS.md for workflow execution | Created, cross-referenced, linked to canonical, versioned |
| `docs/governance/SECURITY-GOVERNANCE.md` | Security governance | Security baseline, threat model, hardening backlog, P0–P5 priorities | Referenced by AGENTS.md for security workflow | Created, cross-referenced, linked to canonical, versioned |
| `docs/governance/GOVERNANCE-OVERVIEW.md` | Top-level map | Governance overview, configuration ownership, approval boundaries, operational responsibilities | Referenced by AGENTS.md as entry point | Created, cross-referenced, linked to canonical, versioned |

**Status:** All five created, cross-referenced, linked to canonical source, prepared for versioning.

---

## 3. Tool and Agent Role Assignment

```text
Superpowers:       Primary workflow — requirements, planning, TDD, debugging, review
ECC:               Repository exploration, quality gates, lint, typecheck, build, dependency checks
Trail of Bits:     Threat modeling, static analysis, insecure defaults, supply-chain review, CI/CD review, differential review, agentic action audit
wshobson/agents:   Second opinion on TypeScript, JavaScript, React, Next.js, Node.js
Claude Security:   Independent security review for sensitive changes
Sentry:            Production error triage — no automatic production changes
GDPRGard:          Privacy drafts, checklists, documentation — not legal advice
Semgrep Guardian:  Automated file scanning per authorized OAuth config
```

**Quality precedence:** Quality gates take precedence over speed and token savings.

---

## 4. Permanent Operational Policies

### Required Change Sequence

```text
requirements
repository analysis
impact analysis
technical plan
threat model (when needed)
test plan
implementation
unit/integration tests
security review
lint
typecheck
build
regression check
differential review
residual risks
approval
merge/deploy separately
```

### Definition of Done

```text
requirements verified
edge cases evaluated
input validation
authentication
authorization
tests
security
accessibility
i18n
performance
logging
observability
database/RLS
rollback path
lint
typecheck
build
review
```

### Explicit Approval Required For

```text
deploy
push
merge
production
production migrations
Supabase production changes
Vercel production changes
secret rotation
OAuth changes
MCP changes
Semgrep Guardian changes
Sentry production changes
hook changes
permission rule changes
irreversible actions
```

---

## 5. Phase 1 — Governance

**Status:** `COMPLETE`

**Deliverables:**
```text
5 governance documents created
documents cross-referenced
canonical source configured
repository hygiene executed
HANDOFF.md updated
no application code modified
```

### Repository Hygiene (removed)

```text
src/gitDeff.ts                  removed
src/lint-hook-clean.ts          removed
src/lint-hook-error.ts          removed
src/generateCommitMessage.ts    removed
src/gitDiff.ts                  backed up externally, not part of project
```

**Note:** `gitDiff.ts` had no consumers, tests, or references and was not integrated.

---

## 6. Phase 2 — CI and Configuration Hardening

**Status:** `COMPLETE`

### `.github/dependabot.yml`

```text
weekly npm updates
weekly GitHub Actions updates
7-day cooldown
dev dependency grouping
```

### `.github/workflows/ci.yml`

**Added:**
```text
npm audit --audit-level=high
```
after build step.

### `.github/workflows/database.yml`

**PostgreSQL pinned by digest:**
```text
sha256:3518071376d0b6156b02e1db2747a78511b5b9dc3763cc79c506ebe2dc2ee71c
```

**Rationale:**
```text
CI reproducibility
avoid mutable postgres:17 tag
```

### Not Applied

```text
vercel.json → vercel.ts
Prettier
eslint-plugin-security
eslint-plugin-unicorn
Sentry SDK
health endpoint
Supabase changes
database changes
.env* changes
guard.mjs changes
deploy
commit
push
merge
```

---

## 7. OpenAI Dependency Removal

```text
openai removed from package.json
package-lock.json updated
no openai import or require found
Gemini uses Google OpenAI-compatible endpoint: generativelanguage.googleapis.com/v1beta/openai
npm audit: 0 vulnerabilities
```

**Policy:** Do not re-add without analysis and approval.

---

## 8. Quality Gates

Results with explicit environment.

### Test Suite

```text
npm run test:security
PASS
309 tests passed
0 failures
includes P0-2 tests
```

**History:**
```text
302 tests before P0-2 tests
309 tests after adding tests 13–15
```

### Lint

```text
npm run lint
PASS
clean
```

### TypeScript

```text
npm run typecheck
PASS
clean
```

### Dependency Audit

```text
npm audit --audit-level=high
PASS
0 vulnerabilities
```

### Build

**In sandbox:**
```text
BLOCKED
EPERM on .env.local
Turbopack port binding blocked
```

**Outside sandbox (historical macOS Terminal):**
```text
PASS
```

### Secret Scan

**In sandbox:**
```text
BLOCKED
EPERM on .env.local.example
```

**Outside sandbox (historical macOS Terminal):**
```text
PASS
```

### Git Diff Check

```text
PASS when diff accessible
BLOCKED when sandbox prevents .env.local.example access
```

### Correct Conclusion

```text
Quality gates: VERIFIED WHERE EXECUTABLE
Build and secret scan: VERIFIED OUTSIDE SANDBOX OR SANDBOX-BLOCKED
```

**Do not write:** "All quality gates pass"

---

## 9. P0-2 — get_deck_stats Ownership Guard

**Current State:**
```text
Code implementation: COMPLETE
Live database verification: BLOCKED
CI verification: PENDING
Production migration: NOT STARTED
Overall P0-2: BLOCKED — AWAITING CI
```

### Migration

```text
supabase/migrations/20261026010000_get_deck_stats_ownership.sql
```

### Implementation

```text
SECURITY DEFINER
SET search_path TO public
ownership check at function entry
auth.uid() compared to decks.user_id
non-owner and anon receive zero values
owner receives real statistics
```

### Primary Protection

```text
explicit auth.uid() = decks.user_id check
```

**Do not claim:** RLS protects the function when SECURITY DEFINER owner is `postgres` and can bypass RLS.

### Tests Added

```text
supabase/tests/database_security.sql
```

| Test | Description |
|------|-------------|
| Test 13 | anon: zero stats |
| Test 14 | authenticated non-owner: zero stats |
| Test 15 | owner: real stats, total_cards >= 1, cards_to_review >= 1 |

### Code-Level Results

```text
309 security tests pass locally
```

### Missing Live Verifications

```text
migration applied to real test PostgreSQL
tests 13–15 executed on real database
supabase-rls-audit on applied schema
actual function owner
rolsuper status
rolbypassrls status
EXECUTE grants
FORCE ROW LEVEL SECURITY
schema drift
```

### Residual Risks

**MEDIUM:**
```text
returning zero instead of error leaves small enumeration signal
intentional choice for API stability
UUIDs non-predictable
```

**LOW:**
```text
verify migration trailing newline
```

### Blockers

```text
NO production migration
NO deploy
until CI/database test passes AND explicit approval exists
```

---

## 10. CI Database Verification

**State:** `PENDING`

**Blocked by missing tooling:**
```text
docker unavailable
psql unavailable
pg_isready unavailable
Postgres.app unavailable
Supabase CLI unavailable
```

**Workflow must verify:**
```text
disposable PostgreSQL
migrations applied in order
database_security.sql executed
tests 13–15 included
job fails if tests fail
no production access
```

**Do not invent CI results not yet available.**

---

## 11. Phase 3 — Observability

**State:** `NOT CONFIRMED / PENDING`

**Not implemented (do not claim complete):**
```text
Sentry SDK
Vercel Observability
health endpoint
OpenTelemetry
structured log aggregation
```

---

## 12. Phase 4 — Privacy and Compliance

**State:** `NOT STARTED`

### Documented Gaps

```text
ROPA
DPA
DSAR
deletion workflow
data retention
consent granularity
subprocessor inventory
breach escalation
```

**DSAR/delete endpoints require analysis of:**
```text
database
storage
cache
external providers
backup
audit log
```

**Every privacy document must be marked:**
```text
bozza informativa — non consulenza legale
```

---

## 13. Phase 5 — Performance and Capacity

**State:** `NOT STARTED`

**Capacity for 40M users NOT proven.**

### Required Test Plan

```text
baseline
load test
stress test
spike test
soak test
failure recovery
```

### Required Metrics

```text
p50 latency
p95 latency
p99 latency
requests per second
concurrent users
error rate
database connections
provider quotas
CPU
memory
cold starts
cache hit rate
queue depth
TTS/STT budget behavior
```

**Do not run load tests against production.**

---

## 14. Security and Protections

**Current verified perimeters:**

```text
Supabase RLS ownership chain present
Zod boundary validation present
auth checks on mutations present
security headers present
TTS budget reservation present
provider errors sanitized
secret scanner present
guard.mjs active
lint hook active
stop-gate active
Git push protected
gh pr merge protected
.env* protected
```

**Do not claim complete security — report only verified perimeters.**

---

## 15. Git and Commit State

```text
branch: hardening/foundation
commit: not created unless approved
push: not executed
merge: not executed
deploy: not executed
```

**Commit separation policy:**
```text
governance
CI/configuration
database security
observability
privacy
capacity
```

**No unauthorized files included.**

---

## 16. Required Next Actions

**Mandatory order:**

```text
1. execute CI database workflow
2. confirm P0-2 tests 13–15 pass
3. run supabase-rls-audit on applied schema
4. update P0-2 as COMPLETE only after live evidence
5. review and commit approved phase files
6. evaluate observability separately
7. evaluate privacy/compliance separately
8. execute capacity planning
9. only after approval evaluate production migration
```

---

## Final Report Summary

### Executive Summary

LingoCoon enterprise hardening is in progress. Governance (Phase 1) and CI/configuration hardening (Phase 2) are complete with verified quality gates. P0-2 database security fix (get_deck_stats ownership guard) is implemented at code level with 309 security tests passing locally, but live database verification is blocked awaiting CI execution. Observability (Phase 3), privacy/compliance (Phase 4), and capacity/performance (Phase 5) have not started. No production changes have been made or approved.

### Project Context

```text
Project: LingoCoon
Branch: hardening/foundation
Application: Next.js App Router, TypeScript strict, React 19
Database: Supabase/PostgreSQL
Auth: Supabase SSR
Validation: Zod
i18n: en/fr/it/uk
Deployment: Vercel
CI: GitHub Actions
```

### Canonical Governance

```text
Source: .agents/project/AGENTS.md
5 governance documents: AGENTS-INDEX.md, SKILLS-REGISTRY.md, WORKFLOW-CATALOG.md, SECURITY-GOVERNANCE.md, GOVERNANCE-OVERVIEW.md
All created, cross-referenced, linked, versioned
```

### Agent/Skill Responsibilities

```text
Superpowers: workflow, planning, TDD, debugging, review
ECC: exploration, quality gates, lint, typecheck, build
Trail of Bits: threat modeling, static analysis, supply-chain
wshobson: TypeScript/JavaScript/React/Next.js/Node.js second opinion
Claude Security: independent security review
Sentry: production error triage only
GDPRGard: privacy docs/drafts only
Semgrep Guardian: automated scanning per OAuth
```

### Permanent Policies

```text
Change sequence: requirements → analysis → plan → threat model → test plan → impl → tests → security → lint → typecheck → build → regression → diff review → risks → approval → merge/deploy
DoD: requirements, edges, validation, auth, authz, tests, security, a11y, i18n, perf, logging, observability, DB/RLS, rollback, lint, typecheck, build, review
Explicit approval: deploy, push, merge, production, prod migrations, Supabase/Vercel prod, secrets, OAuth, MCP, Semgrep, Sentry prod, hooks, permissions, irreversible
```

### Phase Status

```text
Phase 1 (Governance): COMPLETE — 5 docs, repo hygiene, no app code changes
Phase 2 (CI/Config): COMPLETE — dependabot, npm audit in CI, Postgres digest pinned
Phase 3 (Observability): NOT CONFIRMED / PENDING
Phase 4 (Privacy/Compliance): NOT STARTED
Phase 5 (Capacity/Performance): NOT STARTED
```

### Quality Gates

```text
test:security: 309 pass / 0 fail (local)
lint: PASS
typecheck: PASS
npm audit --audit-level=high: 0 vulnerabilities
build: PASS (outside sandbox), BLOCKED in sandbox (EPERM)
security:secrets: PASS (outside sandbox), BLOCKED in sandbox (EPERM)
git diff --check: PASS (when accessible)
Conclusion: VERIFIED WHERE EXECUTABLE
```

### Security Posture

```text
RLS ownership chain, Zod boundaries, auth on mutations, security headers, TTS budget, provider error sanitization, secret scanner, guard.mjs, lint hook, stop-gate, Git push/merge protection, .env* protection — all verified perimeters
No claim of complete security
```

### P0-2 Detailed Status

```text
Code: COMPLETE (migration + Tests 13-15)
Live DB verification: BLOCKED (no local PostgreSQL)
CI verification: PENDING (waiting for GitHub Actions)
Production migration: NOT STARTED
Overall: BLOCKED — AWAITING CI
Residual MEDIUM: zero-return enumeration signal (intentional for API stability)
Residual LOW: migration trailing newline
```

### CI Database Status

```text
State: PENDING
Blocked by: no docker/psql/pg_isready/Postgres.app/Supabase CLI locally
Workflow: disposable PostgreSQL, migrations in order, database_security.sql, Tests 13-15, fail on test failure, no prod access
```

### Privacy Status

```text
NOT STARTED
Gaps: ROPA, DPA, DSAR, deletion workflow, retention, consent, subprocessors, breach escalation
DSAR/delete requires analysis of: DB, storage, cache, providers, backup, audit log
All docs must be marked: "bozza informativa — non consulenza legale"
```

### Observability Status

```text
NOT CONFIRMED / PENDING
Sentry SDK, Vercel Observability, health endpoint, OpenTelemetry, structured logging — NOT IMPLEMENTED
```

### Capacity Status

```text
NOT STARTED
40M user capacity NOT PROVEN
Required: baseline, load, stress, spike, soak, failure recovery tests
Metrics: p50/p95/p99 latency, RPS, concurrent users, error rate, DB connections, provider quotas, CPU, memory, cold starts, cache hit rate, queue depth, TTS/STT budget
No production load testing
```

### Git/Commit Status

```text
Branch: hardening/foundation
Commit: NOT CREATED
Push: NOT EXECUTED
Merge: NOT EXECUTED
Deploy: NOT EXECUTED
Commit separation: governance, CI/config, DB security, observability, privacy, capacity
```

### Risks

```text
P0-2: CI may fail if migration has undetected bugs
Phase 3: observability not started — production blind spots
Phase 4: privacy gaps — regulatory exposure if launched
Phase 5: capacity unknown — no scaling evidence for target scale
Sandbox: EPERM blocks local build/secret verification — must verify outside
```

### Rollback Principles

```text
Migrations: forward-only, no replay of baseline
App: revert release first, retain DB changes
TTS: preserve consumption counters during rollback
DB: PITR 7 days, manual snapshots 30 days, logical backup 90 days
Legal hold: suspends auto-cleanup on tagged resources
```

### Next Actions

```text
1. Execute CI database workflow on hardening/foundation
2. Confirm Tests 13-15 pass in CI output
3. Run supabase-rls-audit on applied schema
4. Update P0-2 = COMPLETE only after live CI evidence
5. Review and commit approved phase files
6. Evaluate observability (Phase 3) separately
7. Evaluate privacy/compliance (Phase 4) separately
8. Execute capacity planning (Phase 5)
9. Only after explicit approval evaluate production migration
```

### Approval Boundaries

```text
This document: no approval needed (status documentation only)
P0-2 migration production: EXPLICIT APPROVAL REQUIRED
Phase 3 implementation: EXPLICIT APPROVAL REQUIRED
Phase 4 implementation: EXPLICIT APPROVAL REQUIRED
Phase 5 implementation: EXPLICIT APPROVAL REQUIRED
Any deploy/push/merge: EXPLICIT APPROVAL REQUIRED
```

---

## Mandatory Conclusion

```text
Governance: COMPLETE
Phase 2: COMPLETE
P0-2 code implementation: COMPLETE
P0-2 live database verification: BLOCKED — CI PENDING
P0-2 production migration: NOT STARTED
Phase 3 observability: NOT CONFIRMED
Phase 4 privacy/compliance: NOT STARTED
Phase 5 capacity testing: NOT STARTED
Production readiness: NOT CLAIMED
Commit: NOT CREATED unless explicitly approved
Push: NOT EXECUTED
Deploy: NOT EXECUTED
```