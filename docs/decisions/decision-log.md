# Decision Log

## Status

Active decision record. Pending proposals are not approved decisions.

- Version: 2.4
- Last reviewed: 2026-09-15

## 2026-09-15 — Adopt auditioned Chirp 3 HD and remove legacy speech providers

- **Decision:** The owner accepted Achernar and authorized Google-only product speech and ElevenLabs source removal. Preserve the male Charon preset. All endpoints use the same durable reservation service; remove the local bypass.
- **Consequences:** Adapt the cap to 999,700 for Chirp's listed 1M allowance, not WaveNet's 4M. Disable old allowances without resetting counters. Chirp supplies no word timestamps here: pronounce selected words separately and remove false follow controls. Remote activation, SQL verification and hosted acceptance remain gated; see [Context Studio](../product/context-studio.md). No obsolete remote credential is revoked by this source change.

## 2026-09-15 — Stage Google WaveNet; preserve ElevenLabs until acceptance (superseded)

- **Decision:** Implement the owner's approved Google WaveNet direction with a shared cap not exceeding 3,999,700 billed characters. Preserve ElevenLabs until Google passes functional/budget/live-audio checks; no local-Mac runtime dependency or automatic paid fallback.
- **Reason:** The published recurring WaveNet allowance is a better budget candidate than Inworld's promotional credit, but billing still charges overage and word timestamps differ.
- **Consequences:** Stage an explicitly disabled Reading adapter and reconciled-period budget RPC. Keep exact SSML/WAV/UTF-16 boundaries and refuse guessed alignment. No billing allowance or automatic renewal is authorized by source changes. Account usage, isolated SQL, real audio/timings, privacy/hosting and legacy caller migration remain gates in [Context Studio](../product/context-studio.md).

## 2026-09-14 — Integrate managed Reading TTS; gate free-credit activation

- **Decision:** Implement the owner's requested Inworld TTS-2 Flash integration through a provider-independent backend and browser audio controller. The deployed runtime must work without the owner's Mac. Replace Reading's local speech controller, preserve dictionary/selection and unrelated legacy TTS callers.
- **Reason:** Contextual pronunciation, streaming, exact word alignment and seekable playback require one audio state machine; durable reservations and private cache metadata are necessary across serverless instances.
- **Consequences:** Prepare a service-only Supabase migration and daily cleanup outbox, not an applied remote change. Default lifetime credits to zero and credit expiry to expired. Require verified credit/billing/processor/hosting terms and voices before any activation. No perpetual free renewal, live quality, browser compatibility or completed production release is implied. Per-owner private single-flight is implemented; cross-owner/static sharing remains an explicit gap. [Context Studio](../product/context-studio.md) owns current evidence and activation gates.

## 2026-09-12 — Replace the local Reading interaction with explicit tokens

- **Decision:** The owner's complete Reading rebuild specification and subsequent continuation requests authorize replacing the uncommitted reader interaction with stable word tokens, sentence-paired translation, independent hover/selection/playback, a contextual dictionary and centralized browser speech. This supersedes the earlier hold and phrase-range inspector direction for this local experiment.
- **Reason:** Repeated occurrences, hover previews and spoken-word synchronization require exact token identities and offsets; a second parallel reader or incremental retention of the old caret/inspector logic would not meet the requested behavior.
- **Consequences:** Preserve normal authentication and the development-only gate; no deployment, dependency/provider changes, remote data mutations or persistent vocabulary are included. Reuse installed Radix positioning and the server provider abstraction. Hover makes no AI calls. The small editorial glossary and AI lexical entry are explicitly not a complete licensed dictionary. Current files, observed browser evidence and unresolved release gates are maintained only in [Context Studio](../product/context-studio.md).

## 2026-09-08 — Repair delivery ownership and evidence

- **Decision:** In response to the owner's workflow-repair request, replace the mandatory department-starter relay with one accountable delivery owner and optional bounded specialists. Keep accepted scope, handoff, and evidence in the existing feature document.
- **Reason:** The reader had useful UX recommendations, but key requirements were not implemented or visually verified. Its four original tests did not execute application logic; prior research decisions were missing from the receiving UX task's local sources.
- **Consequences:** Retain specialist skills/roles as optional capabilities; do not create more standing tasks. Real implementation tests and rendered acceptance comparisons gate visible delivery. Authentication/provider blockers remain explicit and never justify a bypass or completion claim. Current work and unresolved quality criteria are recorded in [Context Studio](../product/context-studio.md); future feature proposals are not blanket-approved by this workflow decision.

## Pending implementation decisions

The Stage 0 audit supports these recommendations, but each remains approval-gated:

1. extend the current Next.js application through the first complete vertical slice instead of restarting from an empty repository;
2. complete the security, RLS, quota, privacy, and test baseline before provider-backed mission features;
3. keep decks and LexiCoon as supporting practice while the mission loop becomes the primary experience;
4. evaluate first-release speaking from a learner-confirmed transcript and do not claim pronunciation scoring without an approved audio-evaluation contract;
5. use deterministic application rules to select recommendations and bounded AI only to evaluate or generate task content;
6. approve current provider choices, numeric zero-budget limits, transcript retention, navigation labels, and the raccoon asset method before implementation.

### Provider evidence snapshot — 2026-08-30

This evidence is time-sensitive and must be reverified before implementation:

- Google documents `gemini-3.5-flash-lite` as stable and offers free input/output access, but its [pricing page](https://ai.google.dev/gemini-api/docs/pricing) states that free-tier content may be used to improve Google products. Active limits are project-specific and must be read from AI Studio.
- ElevenLabs advertises [10,000 free TTS characters per month](https://elevenlabs.io/text-to-speech), while commercial usage is presented as a paid-plan benefit. Runtime ElevenLabs TTS is therefore not the recommended zero-budget foundation for a public product.
- Groq documents free Whisper limits of 2,000 requests and 28,800 audio seconds per day at the organization level in its [rate-limit reference](https://console.groq.com/docs/rate-limits). Its [data documentation](https://console.groq.com/docs/your-data) says inference data is not retained by default, may be logged for up to 30 days for reliability or abuse, and is eligible for Zero Data Retention; retained data is located in the United States.
- Browser `speechSynthesis` is [widely available](https://developer.mozilla.org/en-US/docs/Web/API/Window/speechSynthesis), but voice quality and availability vary. On-device speech recognition remains compatibility-sensitive and requires a fallback.
- Supabase Free currently includes a [500 MB database limit](https://supabase.com/pricing), enters read-only mode above that limit, has no automatic backups, and may pause after inactivity. It is suitable for a capped pilot, not a production reliability promise.

Recommended first-mission direction: use curated static dialogue audio with browser TTS fallback; evaluate Groq Whisper with Zero Data Retention for a capped speech pilot and always provide typed fallback; benchmark text evaluators on the approved quality set before choosing one. Do not send learner content to a free provider until its data terms, transfer mechanism, consent or legal basis, and retention controls are approved.

## 2026-09-02 — Adopt the project-scoped Codex operating system

- **Decision:** Use one concise root entrypoint, authoritative structured documents, project-scoped `.codex/config.toml`, 18 narrow custom agents, six domain skills, 22 procedure skills, a maximum of four concurrent agent threads, inherited model/provider settings, and one writer per file set.
- **Reason:** LingoCoon needs repeatable product, engineering, security, learning, design, QA, privacy, and operations workflows without global Codex changes, plugin packaging, or uncontrolled multi-agent writes.
- **Consequences:** Agents and skills route work but never grant mutation authority; read-only roles perform analysis and workspace writers require explicit local scope; external and Git actions remain separately approval-gated. Required skills are named explicitly with `$skill-name` in chat starters and delegation prompts, and each custom agent reports which assigned skills it loaded. The operating system is currently ignored/private, so it works in this checkout but is not Git-reviewed or portable to another clone. Publishing a sanitized subset requires a later decision.

## 2026-09-02 — Keep one structured source of truth per subject

- **Decision:** Retain the existing `docs/<area>/` hierarchy and map requested flat names to authoritative documents in `docs/README.md` instead of creating duplicate aliases.
- **Reason:** Duplicate project briefs, architecture, security, privacy, and roadmap files would drift and make agent behavior ambiguous.
- **Consequences:** Every task starts from the index; material behavior or direction updates the owning document and this log, while archived material remains non-authoritative.

## 2026-09-01 — Establish the Supabase security baseline

- **Decision:** Version the observed production schema, apply least-privilege grants, make public helper functions invoker-safe, pin their search paths, and automatically enable RLS on future `public` tables.
- **Reason:** Database authorization must remain reviewable and fail closed when new tables or functions are added.
- **Consequences:** Existing policies remain the authoritative owner boundaries; new tables receive RLS but still require explicit policies before Data API access; remote changes must be represented by ordered migrations and verified by `supabase/tests/database_security.sql`.

## 2026-08-31 — Establish the public continuous-integration baseline

- **Decision:** Add one read-only GitHub Actions workflow that installs the locked dependency graph and runs current-tree secret scanning, lint, TypeScript checking, and the production build for pull requests and `main`.
- **Reason:** Every published change needs repeatable evidence without relying on one developer's machine or exposing production credentials.
- **Consequences:** GitHub checks become part of completion evidence; external actions remain pinned to immutable commit SHAs, the workflow receives only read access, and provider-backed runtime behavior still requires separate authorized testing.

## 2026-08-30 — Contain repository credential exposure locally

- **Decision:** Redact the current tracked report copy and add zero-dependency checks for worktree, staged, and Git-history secret candidates.
- **Reason:** The rebuild must not propagate a known credential, and ignore rules do not protect values copied into tracked files.
- **Consequences:** The scanner currently passes for the worktree, index, and four reachable revisions after history replacement. This proves only the repository state the scanner can reach; provider-side rotation/revocation and third-party caches remain operator-owned external concerns, and scanners cannot prove universal absence.

## 2026-08-29 — Approve documentation and skill foundation

- **Decision:** Adopt the repository documents and six local domain skills as the v1 operating foundation for future product work.
- **Reason:** Product, UX, AI, engineering, research, and visual decisions need concise, versioned sources of truth before the rebuild begins.
- **Consequences:** Future work must use the relevant document and narrowest skill, and material direction changes must update this log. The 2026-09-02 operating-system decision extends this foundation with procedural skills and custom agents.

## 2026-08-29 — Select the first learning mission

- **Decision:** Use an English workplace self-introduction for an adult beginner or early-intermediate learner as the first end-to-end mission.
- **Reason:** The scenario is realistic, compact, and supports reading, listening, writing, speaking, personalization, feedback, retry, and recommendation in one vertical slice.
- **Consequences:** The first implementation plan covers this scenario only. New scenarios follow evidence from the completed slice and a recorded decision.

## 2026-08-29 — Keep architecture conceptual until implementation planning

- **Decision:** Approve the learning engine, data model, and AI contracts as conceptual baselines rather than final schemas or migrations.
- **Reason:** Final technical contracts must be grounded in the inspected codebase and the accepted first-mission implementation plan.
- **Consequences:** Architecture guides planning now; code, schema, dependency, and service changes still require explicit approval.

## 2026-08-30 — Organize the private agent workspace

- **Decision:** Keep the complete project instructions under `.agents/project/AGENTS.md`, retain a minimal root `AGENTS.md` only for automatic Codex discovery, index private agent resources in `.agents/README.md`, and maintain an explicit configuration map under `.agents/project/configuration-map.md`.
- **Reason:** Codex requires root-level instruction discovery, while detailed operating guidance belongs with the private skills and should not clutter the public project surface.
- **Consequences:** The root entrypoint must remain short and stable; detailed changes belong in the private agent workspace, all skill references must target the authoritative project instructions, and each configuration must document its owner, location, publication boundary, and validation.

## 2026-10-22 — Strengthen study_progress RLS with card ownership verification (backlog item #2)

- **Decision:** Add forward migration `supabase/migrations/20261022000000_strengthen_study_progress_rls.sql` that replaces `study_progress` INSERT/UPDATE policies which only checked `auth.uid() = user_id` with policies that additionally verify the referenced card belongs to a deck owned by `auth.uid()` (via cards -> decks -> user_id chain). SELECT/DELETE policies remain `auth.uid() = user_id`. Add 12 negative role-matrix tests (owner/other/anon x INSERT/UPDATE/SELECT/DELETE) to `supabase/tests/database_security.sql`.
- **Reason:** The existing RLS only checks the logged-in user's ID matches study_progress.user_id — any authenticated user can create/update study progress for any card. This lets a user tamper with another user's study progress via the card_id foreign key.
- **Consequences:** INSERT/UPDATE now require card ownership; a forward-only migration (no edits to applied migrations); tests verify owner pass + cross-user/anon fail for all four operations; rollback path is `DROP POLICY` + recreate original policies.

## 2026-08-29 — Establish repository-local Codex foundation

- **Decision:** Keep LingoCoon instructions and skills in the repository under the root agent entrypoint and `.agents/skills/`.
- **Reason:** The project needs reviewable guidance that evolves with the product and remains scoped to LingoCoon.
- **Consequences:** Skills remain local and focused; no plugin packaging or external distribution is required. Under the later private-workspace decision these paths are intentionally ignored, so “repository-local” means colocated with this checkout, not currently committed.

## 2026-08-29 — Use documentation before implementation

- **Decision:** Define product, learning, UX, architecture, and AI contracts before rebuilding application code.
- **Reason:** The current application represents only a small part of the intended product, and implementation-first work would create disconnected features.
- **Consequences:** Product-code changes require an approved implementation plan grounded in the first mission and target architecture.

## 2026-08-29 — Personalization is the product core

- **Decision:** Treat the learner profile, learning events, error signals, and recommendations as the central product model.
- **Reason:** LingoCoon must adapt to each learner while retaining a useful guided path.
- **Consequences:** Flashcards become supporting practice rather than the primary product loop.

## 2026-08-29 — Speaking is a first-class skill

- **Decision:** The first complete mission must include reading, listening, writing, and speaking.
- **Reason:** Real language ability requires production and interaction, not only recognition.
- **Consequences:** Speech input, evaluation confidence, privacy, latency, and fallback behavior are core design concerns.
