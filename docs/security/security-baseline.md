# LingoCoon Security Baseline

## Status

Repository-verified controls and open security requirements. This is not a claim that production is vulnerability-free.

- Version: 1.1
- Last reviewed: 2026-09-14 (Reading TTS delta; older findings are not re-audited)

## Security objectives

- Only the authenticated owner can read or mutate learner-owned data.
- Anonymous users cannot access private product data or invoke privileged database helpers.
- Client input, learner content, model output, and provider responses remain untrusted.
- Provider and database credentials stay server-side and out of Git, logs, prompts, and browser bundles.
- AI/TTS/STT abuse cannot create unbounded cost or deny service to all learners.
- Personal data has a defined purpose, recipient, retention period, export path, and deletion path.
- Pull requests and preview builds cannot obtain unnecessary production authority.

## Repository-verified controls

| Control | Evidence | Scope limit |
| --- | --- | --- |
| Server identity | Supabase SSR clients and server-side `getUser`/`getClaims` helpers | Live cookie/OAuth settings not inspected |
| Redirect containment | OAuth callback normalizes `next` to an internal path; site URL parsing restricts HTTP(S) origins | External OAuth allowlists not inspected |
| AI input boundary | Strict Zod tutor union, bounded history/context, client system fields rejected, all history mapped as untrusted user data | Other AI operations need operation-specific review |
| API input bounds | STT authenticates and bounds audio; all TTS routes authenticate and share bounded input plus durable reservations | TTS SQL/live deployment remains unverified; STT limiter is process-local |
| Database authorization | RLS policies for four current tables, least-privilege grants, invoker functions, pinned search paths, future-table RLS trigger | Source may drift from live state |
| Security headers | CSP baseline, frame denial, MIME sniffing prevention, referrer and permissions policies | CSP is a minimal baseline, not a complete script/style policy |
| Secrets | Public example contains names/safe comments; scanner covers worktree/index/history patterns; CI runs current-tree scan | Pattern scanners cannot prove universal absence |
| Supply chain | Locked npm graph, pinned GitHub actions, read-only CI contents permission, npm audit | Live GitHub settings and future advisories change |
| Onboarding storage | Validated envelope with 24-hour expiry | Other browser storage has separate purposes |

## Mandatory review checklist

- Authentication/session validation at every server entry point.
- Object ownership and IDOR resistance in code plus RLS.
- `SELECT`, `INSERT WITH CHECK`, `UPDATE`, and `DELETE` policy coverage.
- CSRF applicability, open redirects, XSS, SSRF, SQL/command injection, unsafe parsing, file/upload handling, and error disclosure.
- Public versus server-only key separation and absence of secret-bearing logs.
- Persistent per-user and global AI/TTS/STT limits, retries, concurrency, and no paid overage.
- Dependency advisories, action pinning, preview permissions, migration safety, and rollback.
- Data minimization, retention, provider transfer, export, deletion, and incident evidence.

## Open risks

1. General AI/STT durable reservations remain absent. All TTS routes now share fail-closed reservations, but isolated SQL, Storage HTTP, live migration and billing verification are outstanding; do not treat source preparation as deployed enforcement.
2. `study_progress` INSERT/UPDATE policies verify `user_id` but not ownership of the referenced card.
3. AI/TTS/STT provider error bodies are logged without a shared redaction/retention contract, and the Gemini path receives a stable Supabase subject identifier.
4. Google OAuth requests offline access and repeated consent without a repository consumer that requires a refresh token.
5. Account export and deletion are not implemented across current and target data.
6. Preview/production secret scoping, OAuth settings, provider retention, and live Supabase drift are external unknowns.
7. Functional authorization, browser, accessibility, and performance coverage is incomplete.
8. A public vulnerability-reporting policy (`SECURITY.md`) is absent; adding one is a separate public-repository decision.

## Verification commands

Reading's added service-role boundary, private audio retention/outbox, default-zero
allowance and remaining processor/cross-browser acceptance are documented in the
[threat-model delta](threat-model.md#reading-tts-boundary-delta--2026-09-14) and
[Reading delivery record](../product/context-studio.md). This update does not
revalidate the historical unrelated risks above.

```bash
npm run security:secrets
npm run test:security
npm run lint
npm run typecheck
npm run build
npm audit --audit-level=high
```

Use `npm run security:secrets:history` for publication/history investigations and run `supabase/tests/database_security.sql` only against a local, isolated, or explicitly approved database.

## Finding standard

Every finding must state attacker prerequisites, capability gain, impact, source or observed evidence, existing controls, confidence, mitigation, and regression test. Framework presence or a keyword match is not proof. See `threat-model.md` for prioritized hypotheses and trust boundaries.
