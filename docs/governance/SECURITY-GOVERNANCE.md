# LingoCoon Security Governance

## Status

Canonical security governance document consolidating verified controls, threat model, and phase-gated hardening backlog. Derived from `docs/security/security-baseline.md`, `docs/security/threat-model.md`, and `docs/engineering/hardening-backlog.md`. This is the single source of truth for security governance — do not duplicate in other documents.

- Version: 1.0
- Last reviewed: 2026-10-25

---

## Security Objectives (from `security-baseline.md` §10–19)

1. Only the authenticated owner can read or mutate learner-owned data
2. Anonymous users cannot access private product data or invoke privileged database helpers
3. Client input, learner content, model output, and provider responses remain untrusted
4. Provider and database credentials stay server-side and out of Git, logs, prompts, and browser bundles
5. AI/TTS/STT abuse cannot create unbounded cost or deny service to all learners
6. Personal data has a defined purpose, recipient, retention period, export path, and deletion path
7. Pull requests and preview builds cannot obtain unnecessary production authority

---

## Repository-Verified Controls (from `security-baseline.md` §20–33)

| Control | Evidence | Scope Limit |
| --- | --- | --- |
| Server identity | Supabase SSR clients and server-side `getUser`/`getClaims` helpers | Live cookie/OAuth settings not inspected |
| Redirect containment | OAuth callback normalizes `next` to internal path; site URL parsing restricts HTTP(S) origins | External OAuth allowlists not inspected |
| AI input boundary | Strict Zod tutor union, bounded history/context, client system fields rejected, all history mapped as untrusted user data | Other AI operations need operation-specific review |
| API input bounds | STT authenticates and bounds audio; all TTS routes authenticate and share bounded input plus durable reservations | TTS SQL/live deployment remains unverified; STT limiter is process-local |
| Database authorization | RLS policies for four current tables, least-privilege grants, invoker functions, pinned search paths, future-table RLS trigger | Source may drift from live state |
| Security headers | CSP baseline, frame denial, MIME sniffing prevention, referrer and permissions policies | CSP is a minimal baseline, not a complete script/style policy |
| Secrets | Public example contains names/safe comments; scanner covers worktree/index/history patterns; CI runs current-tree scan | Pattern scanners cannot prove universal absence |
| Supply chain | Locked npm graph, pinned GitHub actions, read-only CI contents permission, npm audit | Live GitHub settings and future advisories change |
| Onboarding storage | Validated envelope with 24-hour expiry | Other browser storage has separate purposes |

---

## Mandatory Review Checklist (from `security-baseline.md` §34–44)

- Authentication/session validation at every server entry point
- Object ownership and IDOR resistance in code plus RLS
- `SELECT`, `INSERT WITH CHECK`, `UPDATE`, and `DELETE` policy coverage
- CSRF applicability, open redirects, XSS, SSRF, SQL/command injection, unsafe parsing, file/upload handling, and error disclosure
- Public versus server-only key separation and absence of secret-bearing logs
- Persistent per-user and global AI/TTS/STT limits, retries, concurrency, and no paid overage
- Dependency advisories, action pinning, preview permissions, migration safety, and rollback
- Data minimization, retention, provider transfer, export, deletion, and incident evidence

---

## Open Risks (from `security-baseline.md` §45–55)

1. **General AI/STT durable reservations remain absent** — TTS routes share fail-closed reservations, but isolated SQL, Storage HTTP, live migration and billing verification outstanding
2. **`study_progress` INSERT/UPDATE policies verify `user_id` but not ownership of referenced card** — P0-1 addressed via migration `20261022010000_study_progress_ownership.sql` (commit a0636c6)
3. **AI/TTS/STT provider error bodies logged without shared redaction/retention contract** — Gemini path receives stable Supabase subject identifier (P0-3, P0-4, P0-5)
4. **Google OAuth requests offline access and repeated consent without repository consumer** — P0-6
5. **Account export and deletion not implemented across current and target data** — P0-8, P0-9
6. **Preview/production secret scoping, OAuth settings, provider retention, live Supabase drift are external unknowns** — P0-2, P0-6
7. **Functional authorization, browser, accessibility, and performance coverage incomplete** — P2-2, P2-3
8. **Public vulnerability-reporting policy (`SECURITY.md`) absent** — separate public-repository decision

---

## Threat Model Summary (from `threat-model.md`)

### Trust Boundaries

```
Browser (Untrusted) → Next.js Server (Application Trust) ↔ Supabase Auth/PostgreSQL (Data Trust) → External Processors (Gemini, Google Cloud TTS, STT)
```

### Prioritized Threat Hypotheses

| Priority | Threat Path | Status |
| --- | --- | --- |
| P1 | Authenticated user exhausts shared provider quota/budget (TTS/STT/AI) | P0-1 done; P1-1 open (STT in-memory); P3-2 open (AI/deck) |
| P1 | Learner creates/updates `study_progress` for foreign card (IDOR) | **P0-1 DONE** (migration a0636c6) |
| P1 | Sensitive learner/provider data reaches logs/providers unnecessarily | P0-3, P0-4, P0-5 open |
| P2 | Preview/PR code obtains production data/credentials | External verification needed |
| P2 | OAuth grants more durable access than needed | P0-6 open |
| P2 | Prompt injection changes authorization/leaks secrets/writes state | Low exploitability in reviewed tutor path; operation-specific review needed |
| P2 | Live database state drifts from versioned policies | P2-1 open (DB tests not in CI) |
| P3 | Script/style injection via missing CSP directive | CSP minimal baseline only |
| P3 | Credential-shaped value evades repository scanner | Residual limitation of pattern matching |

### Change Triggers (from `threat-model.md` §187–190)

Update this model before merging a change that adds:
- A provider, file upload, service-role operation, privileged database function
- New user-owned table, background job, analytics pipeline, cross-user sharing
- Moderation, multiplayer, raw-audio retention, new deployment environment, model tool access

Recalibrate threats after incidents, provider-term changes, or material architecture changes.

---

## Hardening Backlog (from `hardening-backlog.md`)

### Phase P0 — Immediate (0–2 weeks): Stop data exposure & unauthorized access

| ID | Title | Severity | Status |
| --- | --- | --- | --- |
| P0-1 | `study_progress` RLS lacks card-ownership check (IDOR) | Critical | ✅ **DONE** (a0636c6) |
| P0-2 | `get_deck_stats` leaks deck stats for any deck UUID (IDOR) | Critical | ⬜ Open |
| P0-3 | STT logs unredacted provider error body (error disclosure) | High | ⬜ Open |
| P0-4 | AI action logs raw error object (error disclosure) | High | ⬜ Open |
| P0-5 | AI sends stable Supabase subject ID to Gemini (privacy leak) | High | ⬜ Open |
| P0-6 | Google OAuth requests unnecessary offline access | Medium | ⬜ Open |
| P0-7 | Cookie consent banner lacks granularity (GDPR Art. 7/ePrivacy) | High | ⬜ Open |
| P0-8 | No data export endpoint (GDPR Art. 15/20) | High | ⬜ Open |
| P0-9 | No account deletion endpoint (GDPR Art. 17) | High | ⬜ Open |
| P0-10 | npm audit: 5 high-severity transitive vulnerabilities | High | ⬜ Open |
| P0-11 | eslint-config-next pinned to vulnerable version via overrides | High | ⬜ Open |

### Phase P1 — Short-term (2–6 weeks): Privacy compliance & durable limits

| ID | Title | Severity | Status |
| --- | --- | --- | --- |
| P1-1 | STT rate limit is in-memory and non-durable | High | ⬜ Open |
| P1-2 | AI-generated content not labeled (EU AI Act Art. 50) | High | ⬜ Open |
| P1-3 | AI tutor interaction not disclosed (EU AI Act Art. 50) | High | ⬜ Open |
| P1-4 | Onboarding PII stored in localStorage without consent | Medium | ⬜ Open |
| P1-5 | Language preference cached in localStorage pre-consent | Medium | ⬜ Open |
| P1-6 | No retention schedule or automated deletion for user personal data | Medium | ⬜ Open |
| P1-7 | Consent record lacks granularity, timestamp, withdrawal | Medium | ⬜ Open |

### Phase P2 — Medium-term (6–12 weeks): Observability, testing, supply chain

| ID | Title | Severity | Status |
| --- | --- | --- | --- |
| P2-1 | Database security tests not run in CI | Medium | ⬜ Open |
| P2-2 | No component/browser E2E runner | Medium | ⬜ Open |
| P2-3 | No automated accessibility suite | Medium | ⬜ Open |
| P2-4 | Add `npm audit` to CI | Medium | ⬜ Open |

### Phase P3 — Longer-term (12+ weeks): Architecture hardening

| ID | Title | Severity | Status |
| --- | --- | --- | --- |
| P3-1 | Middleware auth migration (proxy.ts → middleware.ts) | Medium | ⬜ Open |
| P3-2 | Durable rate limiting for AI and deck actions | Medium | ⬜ Open |
| P3-3 | Threat model update | Low | ⬜ Open |

### Phase P4 — Governance & documentation (ongoing)

| ID | Title | Severity | Status |
| --- | --- | --- | --- |
| P4-1 | Privacy policy & DPA (Supabase + Google Gemini + STT provider) | High (compliance) | ⬜ Open |
| P4-2 | Data processing record (ROPA) | Medium (compliance) | ⬜ Open |

### Phase P5 — Maintenance (ongoing)

| ID | Title | Severity | Status |
| --- | --- | --- | --- |
| P5-1 | Regular dependency audit cadence | Low | ⬜ Open |
| P5-2 | Quarterly RLS audit | Low | ⬜ Open |

---

## Verification Commands (from `security-baseline.md` §56–71)

```bash
npm run security:secrets
npm run test:security
npm run lint
npm run typecheck
npm run build
npm audit --audit-level=high
```

Use `npm run security:secrets:history` for publication/history investigations and run `supabase/tests/database_security.sql` only against a local, isolated, or explicitly approved database.

---

## Testing Options Comparison (from `hardening-backlog.md` §351–393)

### For P0-1/P0-2 (SQL / RLS regression tests)
- **Recommended**: `pgTAP` — native SQL assertions, designed for RLS/policy testing, transactional rollback
- **Acceptable**: `node-postgres` + `node:test` — runs in existing Node test runner
- **Fallback**: Supabase CLI `db test`

### For P0-3/P0-4 (error-log sanitization unit tests)
- **Recommended**: `node:test` — already used, no new dependency, deterministic
- **Not recommended**: Vitest (new dependency), Jest (heavy)

### For P1-2/P1-3 (AI disclosure UI tests)
- **Recommended**: React Testing Library + `node:test` — accessibility-focused, tests rendered output, i18n keys
- **Fallback**: Playwright — real browser, catches CSS/layout issues

### For P1-1 (durable rate limiting)
- **Recommended**: Supabase RPC + row-level counters — durable, shared across instances, fail-closed, mirrors TTS pattern
- **Alternative**: Redis (Upstash) — fast, purpose-built; new infrastructure dependency

### For P2-2 (E2E / component runner)
- **Recommended**: Playwright — real browser, auto-wait, good Next.js/Vercel integration
- **Alternative**: Cypress — easy setup; heavier
- **Supplement**: `@testing-library/react` + jsdom — fast, not real browser

---

## Definition of Done (per phase, from `hardening-backlog.md` §395–405)

- [ ] `npm run check` green (exit 0)
- [ ] `npm run test:security` → pass 302 / fail 0 (updated from 104)
- [ ] `npm audit --audit-level=high` → 0 high (or documented override)
- [ ] `git diff --check` clean
- [ ] Every finding has source-backed evidence (file:line) marked CONFIRMED
- [ ] Live-state unknowns resolved via authorized readback or documented as external-state unknown
- [ ] HANDOFF.md updated with phase outcome and next step
- [ ] Italian summary (max 6 lines) appended to phase commit

---

## Cross-References

| Source | Location |
| --- | --- |
| Security baseline (controls, risks, verification) | `docs/security/security-baseline.md` |
| Threat model (assets, boundaries, hypotheses) | `docs/security/threat-model.md` |
| Hardening backlog (phase-gated remediation) | `docs/engineering/hardening-backlog.md` |
| Privacy baseline | `docs/governance/privacy.md` |
| Test strategy | `docs/engineering/test-strategy.md` |
| AI contracts | `docs/architecture/ai-contracts.md` |

---

## Validation

- All finding IDs traceable to source file:line evidence
- Phase gate: no P0 work begins until hostile audit completes and baseline `npm run check` is green
- Test count baseline updated: 302 security tests (was 104)
- CV claims verified against source
- Cross-references resolve to existing files