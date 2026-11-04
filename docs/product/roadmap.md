# LingoCoon Product Roadmap

## Status

Approved foundation and recommended rebuild sequence. Every implementation stage remains bounded by an explicit approval gate.

- Version: 2.1
- Last reviewed: 2026-09-08

## Active local delivery

The user has prioritized the [Context Studio reader experiment](context-studio.md) before the complete first mission. Its current implementation is a local prototype with unresolved interaction, visual, and provider-verification gaps. Use that document for current ownership, scope, evidence, and next action. The ordered interventions below remain the public-readiness backlog, not an instruction to restart all planning or ignore the reader request. Live security/provider state has not been re-audited by this documentation update.

## Verified current state

LingoCoon is a functioning Next.js prototype centered on onboarding, decks/cards, spaced repetition, AI chat/generation, dictionary practice, TTS, and STT. It is not yet the intended personalized four-skill product.

Repository verification currently includes:

- strict TypeScript, lint, production build, and a locked dependency graph;
- current-tree/index/history secret scanning and scanner self-tests;
- Node tests for security/storage boundaries (read the current test output for counts and coverage);
- read-only GitHub CI for scan, tests, lint, type-check, and build;
- a versioned Supabase public-schema baseline, forward security migrations, and transactional database-security SQL;
- owner-oriented RLS, least-privilege grants, pinned function search paths, and automatic RLS for future public tables;
- bounded tutor inputs, server-owned AI instructions, authenticated TTS/STT routes, security headers, and 24-hour onboarding-draft expiry.

The target mission model, normalized learning-event store, error-signal lifecycle, adaptive recommendation engine, personalized home, integrated reading/listening/writing/speaking mission, complete test pyramid, and original raccoon illustration system are not implemented.

Treat the current application as evidence and reusable infrastructure, not a product constraint. Preserve only behavior and boundaries that earn their place in the approved vertical slice; avoid expensive polish of code expected to be replaced.

## Stage 0 — Operating and safety foundation

- [x] Establish authoritative product, learning, UX, architecture, design, engineering, security, privacy, and decision documents.
- [x] Establish project-scoped Codex instructions, 18 bounded agents, 28 focused skills, and dedicated-task starters.
- [x] Define the learner profile, learning-event vocabulary, first mission, and acceptance criteria.
- [x] Audit the application and record current/target architecture, environments, tests, controls, and threats.
- [x] Establish CI, secret scanning, security tests, Supabase baseline/migrations, database-security checks, and expiring onboarding storage.
- [ ] Synchronize the retained feature branch with the squash-merged `main` before any new commit.
- [ ] Decide whether a sanitized agent/document foundation should become Git-tracked and portable; it is currently private and local-only.

## Next ten interventions

These are ordered by reusable risk reduction and dependency value, not by visual excitement. Each requires its own implementation approval.

1. Add atomic persistent per-user and global reservations for AI, TTS, and STT, including concurrency, retries, hard stops, and fallback.
2. ~~Strengthen `study_progress` INSERT/UPDATE RLS so the referenced card belongs to the same authenticated owner; add negative role-matrix tests.~~ **DONE** — migration `supabase/migrations/20261022000000_strengthen_study_progress_rls.sql`, 12 negative tests in `supabase/tests/database_security.sql`.
3. Replace raw provider-error logging with structured redaction and retention rules; omit or pseudonymize external user identifiers.
4. Reconcile handwritten Supabase TypeScript types with the versioned schema and define a repeatable generated-type workflow.
5. Add an isolated Supabase test pipeline that applies migrations and runs owner/other-user/anonymous authorization tests in CI.
6. Harden Auth/OAuth contracts: remove unused Google offline access/forced consent and add callback, session, ownership, and failure tests.
7. Implement privacy foundations for export, account deletion, provider retention, transcript/audio handling, and operational-log deletion.
8. Approve a minimal application test stack and cover critical validators, Server Actions/Route Handlers, components, and one authenticated E2E flow.
9. Implement the first-mission data foundation: sessions, immutable events, error signals, recommendations, idempotency, retention, and owner-only operations.
10. Deliver the first 5–10 minute workplace self-introduction vertical slice with four skills, transcript review, useful raccoon states, accessibility, performance budgets, and provider fallback.

Credential/API rotation is an operator-owned external action. Repository scans cannot prove provider-side revocation or deletion from third-party caches; record rotation/readback without storing values.

## Stage 1 — Reusable security and quality baseline

Complete interventions 1–8 before exposing new provider-backed learning flows to public traffic. Work may be grouped only when file ownership, rollback, and verification remain clear.

Exit evidence:

- anonymous, owner, and other-user authorization tests pass in an isolated database;
- provider usage cannot exceed approved persistent user/global limits;
- logs contain no credentials, raw provider bodies, transcripts, or unnecessary identifiers;
- Auth, critical APIs, components, and one browser journey have reproducible tests;
- export/deletion and retention behavior are documented and exercised;
- preview and production separation has authorized metadata-only readback.

## Stage 2 — First personalized loop

### 2.1 Learning data foundation

- introduce first-mission sessions, normalized events, error signals, recommendations, and usage reservations;
- keep user facts, observations, AI inference, and learner decisions separate;
- add idempotent writes, confidence, provenance, retention, and owner-only operations;
- derive deterministic recommendations from evidence; use bounded AI only for generation/evaluation.

Exit evidence: one deterministic fixture creates a session, records required events, derives one signal, and saves, edits, dismisses, or replaces one recommendation without cross-user access.

### 2.2 Personalized home

- show one recommended mission and a plain-language reason;
- show reading, listening, writing, and speaking as first-class skills;
- preserve structured and learner-created entry points;
- move decks and LexiCoon into supporting practice.

Exit evidence: new, returning, no-recommendation, and provider-unavailable learners each receive a useful next action.

### 2.3 First mission shell

- add orientation, progress, navigation, save/resume, cancel, and fallback states;
- implement the workplace self-introduction reading/listening setup with curated static audio and browser TTS fallback;
- record structured completion and help events.

Exit evidence: keyboard, touch, screen-reader, reduced-motion, unavailable-audio, and narrow-screen flows work through the first half.

### 2.4 Writing, speaking, feedback, and retry

- add bounded writing with one-priority-correction feedback;
- add voice capture, transcript review/correction, task-level speaking evaluation, and typed fallback;
- add a changed retry prompt and evidence-based improvement comparison;
- do not retain raw audio by default or claim pronunciation scoring without an approved audio contract.

Exit evidence: the learner can complete the mission without accepting every correction and can finish when AI, TTS, or STT is unavailable.

### 2.5 Recommendation and visual completion

- derive one explainable next action from mission evidence;
- allow save, dismiss, edit, and replace;
- add original raccoon poses for orientation, feedback, retry, success, and recoverable failure;
- complete responsive, accessibility, performance, privacy, security, and observability verification.

Exit evidence: the complete mission meets `first-learning-mission.md`, stays inside approved budgets, and produces useful learner-controlled evidence.

## Stage 3 — Adaptive practice

- recurring vocabulary and grammar recommendations;
- skill-specific progress across reading, listening, writing, and speaking;
- confidence-aware error review and learner overrides;
- reusable mission primitives and additional real-world scenarios;
- raccoon feedback tied to meaningful progress rather than arbitrary rewards.

## Stage 4 — Real-world content

- graded short texts and dialogues;
- synchronized transcripts, replay, and contextual vocabulary capture;
- learner-created practice from a topic, text, or situation;
- stronger listening, speaking, and pronunciation workflows with validated claims.

## Stage 5 — Social practice discovery

- validate asynchronous peer activities before live interaction;
- design moderation, reporting, privacy, safety, and anti-abuse controls;
- measure whether competition improves independent production rather than repetition;
- consider live multiplayer only after the individual loop is effective and operational safeguards exist.

## Prioritization and approval

Prefer work that improves independent language production, creates reliable personalization evidence, reduces learner or operator risk, fits the zero-budget constraint, and can be verified end to end. Defer surface complexity without learning value.

Before every code, schema, dependency, external-provider, or production change, approve the objective, exact scope, recommended option, alternatives, risks/cost, rollback, verification, and next external action. A green build alone is never release evidence.
