# LingoCoon Repository AS-IS Audit

## Scope and evidence

- Snapshot date: 2026-09-01
- Scope: local repository, reachable Git history, tracked configuration, source, tests, and private project instructions.
- Excluded: secret values, live provider dashboards, live Vercel settings, GitHub security settings, and live Supabase state.
- Commands: `git status --short --branch`, `npm ls --depth=0`, secret scanner self-test and history scan, `npm run check`, and `npm audit --audit-level=high`.

## Already professional

- The application uses a current Next.js App Router stack with strict TypeScript and a locked npm dependency graph.
- Authentication is handled through Supabase SSR clients; protected application actions derive identity server-side.
- AI, TTS, and STT credentials are referenced server-side rather than through `NEXT_PUBLIC_*` variables.
- Tutor input has bounded Zod contracts and explicit prompt-injection separation.
- OAuth callback redirects are normalized to internal paths.
- The repository contains a Supabase production-schema snapshot, ordered hardening migrations, owner-scoped RLS policies, and a transactional database-security test.
- CI has read-only repository permissions and runs pinned actions, secret scanning, security tests, lint, type-check, and build.
- Local verification passed: secret scanner self-test, reachable-history scan, 11 Node security tests, lint, strict type-check, production build, and dependency audit with zero reported vulnerabilities.
- Product, learning, UX, architecture, and decision documents already form a strong foundation.

## Incomplete or unverified

- Existing automated tests cover security boundaries and expiring storage, but not feature behavior, components, authentication flows, API integration, browser E2E, accessibility, or performance.
- `supabase/tests/database_security.sql` exists but was not executed in this audit because no local or isolated database was selected.
- Runtime AI, TTS, and STT controls do not have durable per-user and global usage reservations. STT's in-memory limiter is process-local; TTS has no equivalent local limiter.
- Provider error bodies are written to server logs in the STT and TTS routes. Their content and retention are not controlled by a shared redaction policy.
- Environment-variable names are documented, but local, preview, and production ownership and verification were not centralized.
- Live Vercel, GitHub, Supabase, OAuth, and provider settings cannot be inferred from repository source.
- There is no automated formatting command, browser test runner, accessibility runner, performance budget, observability contract, account export flow, or account deletion flow.
- The public privacy page contains a hard-coded contact address; whether it is an intended role address requires operator review.

## Risks and hypotheses

- **Medium risk, verified design gap:** serverless/process restarts and parallel instances can bypass process-local provider limits; a public provider-backed release needs persistent atomic quotas and a global hard stop.
- **Low risk, verified policy gap:** `study_progress` policies constrain `user_id` but do not require the referenced card to belong to the same owner; exploitation also requires a foreign card UUID, and current data-disclosure impact is constrained by card RLS.
- **Medium risk, verified code behavior:** provider error details may place unnecessary external response data in logs.
- **Medium privacy risk, verified code behavior:** the Gemini request receives the stable Supabase subject identifier even though a provider-specific pseudonym or omission would be sufficient.
- **Medium risk, external-state unknown:** preview and production secrets, OAuth redirect allowlists, provider retention, and live RLS drift require authorized dashboard or API verification.
- **Medium risk, product/privacy gap:** retention, export, deletion, and provider-transfer decisions are not yet executable contracts.
- **Low operational risk:** the retained `security-enforcement` branch and local `main` were not synchronized to the squash-merged `origin/main` snapshot at audit time; inspect ancestry before the next public commit.
- No new critical vulnerability was validated by this configuration audit.

## Duplications and inconsistencies

- The roadmap still described CI, tests, Supabase versioning, and onboarding expiry as missing even though they now exist.
- The requested flat `docs/*.md` names overlap the established topic-based documentation. One authoritative topic file should be kept and mapped from the index instead of copied.
- Six existing skills describe LingoCoon domains. New skills must remain procedures so they do not duplicate those roles.

## Authorized local changes from this audit

- Add project-scoped Codex configuration and custom agents.
- Expand the private documentation map with current architecture, environments, testing, security, threat model, privacy, agent directory, and chat starters.
- Add narrow procedural skills and validate their frontmatter and discovery paths.
- Correct stale documentation facts and record the operating-system decision.
- Add `.codex/` to the private publication boundary.

## Requires separate approval

- API or credential rotation and revocation.
- Any live Supabase, Vercel, GitHub, OAuth, DNS, provider, billing, or production change.
- Dependency changes, new test tooling, persistent quota schema, account export/deletion implementation, logging changes, or product rebuild code.
- Commit, branch synchronization, push, pull request, merge, release, or deployment.

## Operating-system verification — 2026-09-02

- Parsed `.codex/config.toml` and all 18 custom-agent TOML files; names, required fields, sandboxes, directory inventory, and 16 chat-starter titles are consistent.
- The official skill validator could not start because its Python environment lacks PyYAML. An equivalent Ruby safe-YAML/structure check passed for 28 skills and six optional UI metadata files; this is not recorded as official-validator success.
- Relative-link validation passed across 54 Markdown files. No unfinished placeholders or stale audit identifiers were found.
- Codex CLI runtime validation was unavailable because the machine's global wrapper points to a missing native executable. The desktop session discovered all local skills; agent TOML runtime loading should be rechecked in a fresh trusted-project task after repairing the CLI installation.
- Current-tree scanning passed for 198 files; a separate filename-only check found no private-key, Google, GitHub, AWS, or OpenAI credential-shaped candidates in `AGENTS.md`, `.agents/`, `.codex/`, or `docs/`.
- Secret-scanner self-test passed, and the reachable-history scan passed for four revisions.
- The 11 security/storage tests, ESLint, and strict TypeScript passed. The default Turbopack build was blocked by the execution environment while binding a local port; `next build --webpack` completed and generated all 17 pages. This is an environment limitation, not full equivalence with the default CI build.
- The current dependency advisory query returned zero vulnerabilities.
- `git diff --check` and relative-link validation passed. The only tracked worktree change is the `.gitignore` entry for `.codex/`; the operating-system files remain private and ignored.
- Database SQL, browser E2E, live Supabase/Vercel/GitHub/OAuth/provider checks, and production behavior were not run because no isolated database or external-mutation authorization was in scope.
- Two independent read-only repository audits informed the foundation. A further independent review of the final private-document diff was unavailable, so final reconciliation was performed sequentially and that limitation remains disclosed.
