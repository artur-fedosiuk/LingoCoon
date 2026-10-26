# Context Studio — Active Delivery Record

- Version: 4.5
- Reviewed: 2026-09-25
- Status: Queue-aware TTS implementation prepared locally; new migration and hosted acceptance pending. The owner declined installing PostgreSQL or performing a 100-user load test and will push personally.

## Text-first Reader redesign — 2026-09-25

Local implementation follows the owner-approved UX brief with two explicit
clarifications: Gemini supplies translations, contextual hover and explanations;
Google TTS and the existing backend remain. No dependencies, remote settings,
provider configuration, migrations, commits or deployment were changed.

The reader removes table borders, repeated language labels and permanent sentence
numbers. Source/translation columns use 60/40 proportions with subdued translation,
a persistent visibility preference, a compact header and a persistent audio player.
The desktop player is 64 px; narrow screens use two rows (105 px at 320 px).
A small hover preview waits 350 ms and shares occurrence-aware cached work with
the dictionary. Selecting a word opens a 380 px desktop sidebar or a 55%-height
native modal sheet that can expand or drag to 40–90%. Selection preserves the
reading anchor; Escape restores focus. The sidebar has context, lexical senses,
examples, pronunciation and one save action. The existing three-item session-only
focus limit remains; this is not a new persistent vocabulary system.

Client audio requests existing sentence endpoints progressively, starts with the
first available PCM, and prepares a bounded lookahead (20 seconds before dispatch,
possibly exceeded by one long sentence). Requests are paced at least one second
apart and respect existing backend admission/cache/budget rules. Pausing prevents
future sentence dispatch; stopping aborts active and undispatched work. Word
pronunciation preserves the reading buffer and position for explicit resume.
Sentence navigation/highlighting derives boundaries from actual PCM frames.
Google provides no word timestamps: no synthetic word-follow timing is claimed.
Cold audio can still pause between sentences. No claim of minimum achievable
latency or hosted p50/p95 is made.

ReaderHeader and useReaderFollow are new. ContextReader, reading surface,
selection panel, quick popup, player and stylesheet were redesigned; the client
speech adapter/audio session, lookup hook, four locales and focused tests changed.
Server actions, API routes, provider adapters and database source are unchanged.

Verification: 104 automated tests pass, including an incomplete-sequence word
preview/resume regression. Lint, strict type-check and Webpack production build
pass. The standard check reaches Turbopack and fails on the existing local
process/port permission error; it is not a green standard build gate.
Authenticated browser checks verified sentence translation, contextual bank
explanation and dictionary results, actual Google playback progression with a
38-second sample, pause and previous-sentence navigation, 1440/1024/390/320 px
layout without horizontal overflow, sheet drag height retention, Escape/focus,
translation visibility, and disabled audio shortcuts while editing. Browser testing
found and fixed menu/player hit-test overlap and mobile drag-click toggling.
The follow control also observes page scroll events, beyond wheel/touch/keys.

Observed Google service first-audio logs ranged from 742 to 1463 ms for seven
successful syntheses; these exclude some route/auth/client overhead and are not
end-to-end latency percentiles. Subsequent cached requests returned without new
synthesis logs. One earlier Gemini hover failed with provider HTTP 503; the UI
showed an explicit retry state. Later translation and context calls succeeded.
No assertion of audible quality, exhaustive screen-reader coverage, hosted
capacity, remote queue migration status or full cross-browser compatibility.
Existing release/production gates below remain open.

## Gemini contextual hover — 2026-09-21

The owner approved using Gemini for word previews as well as translations and
explanations. Hover now waits 350 ms, then calls the existing authenticated
context-explanation action. The popup shows the contextual translation with
Gemini attribution, loading, error and explicit retry states. It no longer
falls back to the small offline glossary. That glossary remains a labelled
fallback in the full dictionary only.

Hover and selected-word explanations share the session-local bounded cache,
including in-flight requests, keyed by language pair and exact occurrence/context.
Leaving a word suppresses obsolete UI updates; it does not cancel provider work
already dispatched. The existing server validation/authentication and provider
configuration are unchanged. Production translation/dictionary quotas remain
an existing open gate; debounce and cache are not durable budget controls.

Verified locally through normal authenticated access on the existing port 3000:
English-to-Italian sentence translation and Gemini hover results `before` →
`prima di`, financial `bank` → `banca`, river `bank` → `riva`. The popup fits
at a measured 320 CSS-pixel viewport with no horizontal page overflow; Escape
closes it. This is live-provider evidence for these examples, not exhaustive
language or accessibility validation. Browser provider-failure/retry and rapid
pointer races were not injected; cache, failure and stale-result mechanisms
have automated coverage.

The baseline 97 tests, lint, type-check and secret scan passed. The added
context-cache regression and focused reader suite passed (28 tests). Dependency
audit reported zero vulnerabilities. Default Turbopack build failed with the
local process/port `Operation not permitted` error; Webpack build passed.
No new server, dependency, remote configuration, commit or deployment.

## Queue implementation — 2026-09-20

Supersedes the diagnostic-only capacity section below. Both audio clients now
handle explicit `202 queued` responses with bounded, jittered polling and abort.
No network/provider/quota failures are automatically retried. Reading displays
queue state; HTMLAudio callers display a cancellable localized notice and safe
error messages. PostgreSQL admission supports 100 waiting owners, one ticket
per owner, 20-second abandoned-ticket expiry and a small oldest-ticket batch.
The new migration updates old defaults to five generation slots, 999,000 global
daily units and 10,000 per-user daily units without changing the period/lifetime
allowance or usage. All text chunks participate in conservative rolling provider
pacing. Shared-IP access allows 1,200/minute; individual access remains 90.

Migration `20260920010000_tts_admission_queue.sql` is NOT applied remotely.
New builds require it. Follow the release, readback and rollback instructions in
`supabase/README.md`. No new cloud service or dependency was added. The existing
32 MiB in-flight reservation and 256 MiB total storage guard remain; waiting
does not reserve audio bytes. This is bounded admission, not a background worker
that continues processing after every client disconnects, and not a claim of
100 instantaneous syntheses. Cancellation stops polling; the ticket expires.

Application unit/protocol tests, lint, type-check and Webpack build passed.
The full `npm run check` reached the default Turbopack build and failed on the
local OS port/process permission error; it is not a passing full gate. Keep the
default CI build as a required release check; do not mask it with local evidence.
SQL fixtures are wired into the existing disposable-database CI but were not
executed locally: no PostgreSQL server is installed, and the owner declined an
installation/load test. Authenticated browser, hosted queue/cleanup and real
100-user capacity are not certified by these checks. No push or external writes.

## Capacity requirement — 2026-09-19

The owner requires 100 concurrent learners, not 100 monthly active users, and
authorized starting the capacity repair. The current cold-audio path does not
meet that requirement: two generations are admitted and excess work returns busy.
Raising only concurrency is insufficient: pending jobs reserve 32 MiB each
against 256 MiB; daily global generation is 10,000 characters; the 180 requests
per IP/minute limit also matters for learners sharing a classroom connection.

`tests/reading-tts-capacity.test.mjs` exercises the shipped service with 100
distinct owners across four instances using protocol doubles. It verifies warm
cache delivery without synthesis, characterizes 2 admitted / 98 busy cold
requests under a two-slot store, and verifies zero dispatch for 100 budget-denied
requests. All 92 application tests and focused ESLint passed. These are contract
tests, not PostgreSQL, browser, provider or hosted load evidence. No runtime
admission behavior was changed in this first diagnostic increment.

Remaining work: durable bounded admission, cancellation/fairness, provider pacing
across text chunks, revised daily allocations and storage/memory accounting.
Do not use blind browser retries: they multiply database and rate-window load.
Do not remove the global budget boundary. Hosted acceptance must include 100
authenticated owners, cold/warm caches, shared IPs, exhaustion, cancellation,
recovery and measured p50/p95 audio latency. Google's official quotas page,
checked on 2026-09-19, lists 200 Chirp requests/minute/project; actual project
quota and hosted capacity remain separate verification steps.

## Latest local acceptance — 2026-09-19

After the remote schema work, the September period was enabled with a 999,000
limit, 20,000 conservative units for four historical calls and 979,000 new units,
ending 2026-10-01 00:00 UTC. The historical reserve is not measured consumption.
Renewal is not automatic. Authenticated local `/ai` playback returned 200, saved
a ready private cache entry and reserved 137 units. Playback after reload
returned 200 without increasing the counter. The owner confirmed audible output.
The temporary Next server was stopped. Earlier missing-activation/local-playback
statements below are superseded; Vercel and hosted cleanup remain unverified.

## Current Google migration — supersedes historical sections below

The owner accepted the auditioned voice and authorized removing ElevenLabs.
The actual Reading preset was female **Achernar**, not Charon as previously
reported. Achernar remains the default; the existing male choice maps to Charon.
English, Italian, French and Ukrainian use explicit server-side Chirp 3 HD IDs.
Both `/api/tts` and `/api/tts/synthesize` share authentication, provider,
durable quota reservations and owner-scoped cache. No ElevenLabs/Inworld runtime,
paid fallback or local quota bypass remains. Existing provider accounts and
remote credentials have not been revoked or modified.

### Contract and limitations

- Plain-text bounded chunk synthesis, validated 24 kHz mono PCM; Reading receives progressive events, HTMLAudio callers receive a complete WAV. This is not native Google streaming.
- No word timestamps are available in this integration. Word clicks synthesize the selected word independently; sentence/document playback has no fabricated word tracking or follow control. Contextual homograph pronunciation and seamless resume after a word click are not guaranteed.
- General Chat uses the native language (then target language); Study uses the deck source language. Mixed-language responses are not split into language-specific synthesis spans.
- Every cache miss reserves conservative UTF-16 text units before dispatch. Failed or uncertain calls retain reservations. Cache hits incur no new synthesis charge. No automatic provider retries.
- Cap: **999,000 characters per explicitly reconciled billing period**, 1,000 below Chirp's listed 1M allowance, not the former WaveNet 4M allowance. Prior and external use must be deducted. This is a shared total, not per language or per user.
- Missing/disabled/expired allowance, missing service credentials, or mismatched voice tier deny synthesis. Periods are not automatically renewed.
- Existing lifetime, daily, user, concurrency and storage gates remain. Defaults include zero lifetime allowance, expired credit, 10K global/day, 3K/user/day, concurrency two and 256 MiB storage. No claim of verified 100-MAU capacity.
- Generated audio is owner-scoped in private Storage with 30-day expiry and scheduled cleanup. Expiry is not proof that a cleanup job ran. Provider retention and hosting costs still require review.

### Verified and pending evidence

- 89 automated repository tests passed, including mocked Google requests, reservation-before-dispatch, cancellation, malformed WAV, HTMLAudio compatibility, cache isolation and reader behavior.
- Lint and strict type-check passed. Webpack production build passed locally. Default Turbopack failed locally on process/port permissions, but the unchanged default build passed on GitHub CI run 35125213219 for commit 54028cb, together with tests, lint, type-check and secret scanning.
- Dependency audit: zero reported vulnerabilities. No dependencies added.
- The owner auditioned and accepted Achernar before this cleanup through the former local direct path. That audition does not validate the newly mandatory durable quota path.
- Isolated PostgreSQL 17 verification passed in GitHub Actions run 35125213360: ordered migrations, ACL/RLS SQL checks, cache behavior, historical budget preservation, two concurrent quota reservations and idempotent cache migration replay. Minimal Auth/Storage schema fixtures do not prove managed Storage HTTP authorization or physical deletion.
- Authenticated post-change playback, mobile/browser compatibility, hosted cleanup and latency remain unverified. The local machine has a libpq client but no PostgreSQL server; CI uses a disposable service without project credentials.
- The owner authorized commit/push. Commit 54028cb was pushed to codex/google-chirp-tts for verification; main was not changed. No remote Supabase migration, provider billing or production configuration was performed. The existing Vercel integration reported successful branch deployment 9LCcKHpsbrWFub5BG4fgEfMe2xkF. Deployment success is not authenticated audio acceptance. Unrelated .gitignore changes and output images remain local and uncommitted.

### Activation handoff — approval required for remote actions

1. On an isolated database, apply the existing baseline/migrations in order, including `20260913010000_reading_tts.sql`, `20260914010000_google_tts_budget.sql`, then `20260915010000_chirp_tts.sql`. Run `supabase/tests/reading_tts.sql` and `supabase/tests/google_tts_budget.sql`; these are isolated test fixtures, never production scripts.
2. The Chirp migration disables existing allowances and preserves consumption counters. Reconcile current billing-period boundaries and all prior/outside Chirp use before enabling a `chirp3-hd` period with a limit no greater than 999000. Reconcile the cumulative lifetime allowance and credit expiry as well; never reset usage counters to activate.
3. Configure server-only `GOOGLE_TTS_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `READING_TTS_CACHE_SECRET`, valid Supabase URL, `READING_TTS_PROVIDER=google`, and `GOOGLE_TTS_ENABLED=true`, using the environment template. Local credentials and cache-secret presence were verified on 2026-09-18; hosted configuration needs separate verification. Restrict the Google key to Text-to-Speech. Never place secrets in public environment variables or chat.
4. Verify private Storage/RLS, authorized cleanup cron, quota exhaustion, concurrent requests, cache miss/hit and all language presets in the authenticated preview before release. Record click-to-first-audio p50/p95, storage and egress costs. Keep the Mac-independent hosted flow; shut down temporary local Next servers after tests.
5. Only after acceptance, separately authorize remote rollout and removal/revocation of obsolete provider credentials. Source cleanup alone does not revoke a key.

Official [pricing](https://cloud.google.com/text-to-speech/pricing) and
[voice catalog](https://docs.cloud.google.com/text-to-speech/docs/list-voices-and-types)
were checked on 2026-09-15. Chirp lists 1M monthly free characters and $30/M
overage. Billing is required; the application cap cannot cover other clients,
leaked credentials, changed provider terms, or hosting/Storage charges.

### Remote schema activation — 2026-09-18

The owner approved the remote TTS migrations and a 1,000-character margin.
The four versioned TTS migrations (20260913 through 20260918) were applied
atomically to project `iebqipdhewqkiwyscwkm` as management migration
`20260918170722`, named `reading_google_tts_20260913_to_20260918`.
Do not replay the individual non-idempotent migrations against that project.
The historical baseline and unrelated learner tables were not applied or changed.
Readback confirmed all six TTS tables have RLS and no anon/authenticated SELECT,
the bucket is private, and the database maximum is 999000. Local service-role
REST reads now return 200 and Storage bucket lookup succeeds, fixing the observed
missing-table/bucket failure. The lifetime allowance remains zero with no billing
period: provider usage reconciliation is still required before synthesis.
All 89 application tests passed. The updated SQL/concurrency fixtures were not
rerun on an isolated PostgreSQL instance in this turn. Successful Google synthesis,
authenticated playback and hosted cleanup remain unverified. No push or merge.

## Historical delivery evidence

Everything below records superseded reader/provider stages, not current runtime
configuration or current release instructions.

## Approved scope and ownership

The owner's Inworld TTS-2 Flash specification, explicit rejection of a Mac-hosted runtime, and continuation requests supersede the local-only audio direction. This task owns the TTS integration and its release preparation. Bounded frontend/database writers contributed disjoint files; the main agent reviewed and continued their work after interruption. The branch is `main`; existing reader, navigation, localization and image assets were already uncommitted. Preserve unrelated changes.

The requested interaction is now word-based: hover for a compact preview; one click for selection, pronunciation and dictionary; exact global occurrence highlighting; sentence-aligned source/translation; sentence and document audio; current-text examples. Native phrase-range lookup, the old inspector/find UI, independent bilingual blocks and placeholder reader fallback were removed, not kept as a second mode.

This experiment remains a precursor to the [first mission](first-learning-mission.md), not an implementation of the entire [roadmap](roadmap.md). It uses the existing [visual system](../design/visual-system.md) and server provider abstraction. The installed framework is Next.js 16.3.3, not the older version named in the attachment.

The implementation adds a forward database migration after inspecting existing schema and identifying the need for cross-instance quotas/cache reservations. No remote SQL, provider account/configuration, dependencies, Git history, commit, push or deployment was changed. Remote activation remains gated by the checks below. Authentication and unrelated ElevenLabs callers remain intact.

## Runtime and verification environments

The intended runtime is browser → deployed LingoCoon API → Inworld, with Supabase PostgreSQL/private Storage and a hosted cleanup cron. It has no dependency on an owner-operated computer. The source supports `/context-studio`, never `/context-studio/page.tsx`; production availability has not been verified or changed.

Start from the repository with:

```bash
INWORLD_API_KEY= NEXT_PUBLIC_SITE_URL=http://localhost:3000 CONTEXT_STUDIO_LOCAL_ENABLED=true npm run dev -- --hostname 127.0.0.1
```

This command is for development verification, not product hosting. Empty `INWORLD_API_KEY` deliberately prevents provider dispatch. The server gate accepts `READING_ENABLED=true`, or the previous development-only flag. Navigation uses `NEXT_PUBLIC_READING_ENABLED=true` outside development. Both online flags default false in the example. Normal sign-in remains required; OAuth origin/allowlists are environment-specific and incognito cannot fix them. Never copy tokens or bypass login.

Choose **English → Italian**, select **Try a sample text / Prova un testo di esempio**, then start reading. Click `bank` in the bank/deposit sentence and then in the river sentence. Text and at most three explicitly saved words live only in session memory and disappear on refresh/reset. Source limits remain 100–400 whitespace-delimited words and 3,000 UTF-16 code units; this delivery does not claim book-length acceptance.

## Architecture and behavior

- `reader-tokens.ts` owns stable sentence/side/token IDs, Unicode normalization and UTF-16 offsets. Punctuation and whitespace are rendered from explicit tokens; no raw HTML insertion or DOM caret reconstruction.
- `ContextReader` owns one selected occurrence, a separate hovered occurrence, translation state and the temporary focus list. `useContextSpeech` owns one playback controller. Token visual states are derived: spoken > selected occurrence > exact other occurrence > hover.
- Each memoized sentence row contains source and matching translated tokens. Translation results are validated against the complete sentence-ID set rather than array position. At narrow widths the two members stack within the same row.
- Hover opens after 150 ms, with a 250 ms exit bridge into the portal popup. Existing Radix positioning handles clipping/collisions. Hover uses only the session lexical cache or the small editorial glossary; it never requests AI.
- Clicking a source word immediately selects it, cancels conflicting audio, pronounces it and opens the dictionary. Matching uses normalized whole tokens, so `to` does not match `today`, `together` or `towards`.
- The dictionary is a 400 px sticky sidebar on wide screens and a native modal drawer below 1200 px. Context explanation, paired current sentence, lexical senses, external source links and current-document examples are distinct sections. Initially at most eight example sentences render. No scraped providers, fabricated difficulty, tags or familiarity records were added.
- `speech-player.ts` adapts exact reader selections to the provider-independent audio session. Web Audio plays streamed 24 kHz signed 16-bit mono PCM; timestamps drive UTF-16 token offsets. A word request synthesizes its original sentence and clips the selected occurrence using real alignment. Ambiguous/missing alignment disables clipping instead of pronouncing the wrong word. Opposite-language emphasis remains sentence-level.
- The sticky player supports pause/resume, seek and ±10 seconds within buffered audio, speed and close. A word preview pauses a document and offers explicit resume. Playback rate currently changes pitch too; the UI discloses this. A separate clock subscription updates only the toolbar at <=4 Hz; memoized rows receive word/segment changes. Route/unmount cleanup cancels playback and active streams.
- Document following scrolls only when the spoken token leaves the usable viewport, accounting for the sticky player's height. Wheel/touch scrolling disables following; the learner can re-enable it. Reduced-motion preferences avoid smooth scrolling. Live-provider auto-follow acceptance remains pending.
- Lexical cache identity is source language + normalized word + native language. Context cache identity additionally includes the source sentence, selected offset and translated sentence. In-flight requests deduplicate; successful results are bounded to 128 per cache; failures are not cached. Stable request closures and latest-request guards prevent obsolete responses from replacing the current selection. Client waiting ends after 45 seconds; the server provider request has a 30-second timeout. Timing out does not cancel already-started provider work.
- Server Actions retain the feature gate, authenticated claims, strict bounded Zod inputs/outputs and server-owned language instructions. Reader calls omit account identifiers from provider payloads. The shared transport discards raw non-OK response bodies; diagnostic logging emits allowlisted operation/error codes only. Translation/dictionary production quotas remain a separate open gate.
- Source language remains explicit; a profile's unrelated target language never supplies it. Reader controls now have matching English, Italian, French and Ukrainian key sets. Recognizable provider grammar tags are localized deterministically; free-form quotations are not rewritten.

## File manifest

Paths below are relative to the repository, and describe this rebuild against the pre-existing uncommitted prototype.

| Change | Files |
| --- | --- |
| Removed obsolete files | `src/lib/context-studio/selection-dom.ts`; `src/lib/server/context-studio-schema.ts`; `src/lib/server/context-studio-fallback.ts` |
| Replaced reader interaction/UI | `src/components/context-studio/ContextReader.tsx`, `ContextReadingSurface.tsx`, `ContextSelectionPanel.tsx`, `ContextFocusSet.tsx`, `useContextSpeech.ts`; `src/lib/context-studio/speech-player.ts` |
| New token/cache/dictionary model | `src/lib/context-studio/reader-tokens.ts`, `reader-dictionary.ts`, `reader-cache.ts` |
| New UI/hook/style | `src/components/context-studio/InteractiveSentence.tsx`, `WordQuickPopover.tsx`, `useReaderDictionary.ts`, `reader.module.css` |
| New safe diagnostics | `src/lib/server/context-studio-errors.ts` |
| Updated integration/contracts | `src/components/context-studio/ContextStudio.tsx`, `ContextSourceEditor.tsx`; `src/lib/context-studio/reader-contract.ts`; `src/types/context-studio.ts`; `src/lib/actions/context-studio-actions.ts`; `src/lib/server/context-studio-ai.ts`; bounded privacy change in `src/lib/server/ai-client.ts` |
| Replaced tests / updated copy | `tests/context-studio.test.mjs`, `tests/context-studio-immersive.test.mjs`; `public/locales/{en,it,fr,uk}/translation.json` (reader keys only; obsolete interaction copy removed) |
| Entry / infrastructure | `src/app/context-studio/page.tsx`, `src/lib/context-studio/latest-request.ts`; Reading online flags extend `src/lib/server/context-studio-feature-flag.ts`, dashboard/AppShell and `.env.local.example`; existing `output/` assets left intact |
| Online TTS backend | `src/app/api/tts/route.ts`, `src/app/api/tts/cleanup/route.ts`, `src/lib/server/reading-tts/{provider,config,cache-key,inworld,handler,service,store,database-types}.ts` |
| Online audio domain / player | `src/lib/reading-tts/{contract,audio-session,web-audio-driver}.ts`, `src/components/context-studio/ReadingAudioPlayer.tsx`; replaced `speech-player.ts` and `useContextSpeech.ts` |
| Durable controls / cleanup source | `supabase/migrations/20260913010000_reading_tts.sql`, `supabase/tests/reading_tts.sql`, `vercel.json` |
| Online TTS tests | `tests/reading-tts.test.mjs`, `tests/reading-tts-storage.test.mjs`, `tests/reading-audio.test.mjs` |

Removed untracked prototype files are not recoverable with a Git checkout unless previously saved elsewhere. The replacement is the only active reader; existing unrelated work was not deleted.

## Verification evidence

### Earlier reader evidence — 2026-09-12 (historical)

The following evidence predates the Inworld replacement. In particular, browser-generated audio observations do not validate the new provider or player. Current TTS evidence and release gates follow below.

### Automated (previous reader)

- `npm run test:security`: **43 passing**, including 32 reader/transport tests that import shipped modules. Coverage includes token normalization/reconstruction, repeated occurrences, punctuation/apostrophes/UTF-16, source bounds, language isolation, sentence IDs, contextual/lexical contracts, focus limits, speech events/queues/cancellation, async races, cache/retry/timeout, localization parity/grammar tags and provider payload/error privacy.
- Speech tests use an injected driver; transport tests mock HTTP/configuration and the unused Next-context error re-export. These tests are not authenticated browser or live-provider evidence.
- `npm run lint` and `npm run typecheck`: passed.
- `npm run build -- --webpack`: passed. `npm run check` did **not** fully pass: its default Turbopack build failed with process/port-binding `Operation not permitted`, including an escalated retry. Build settings were not changed.
- `npm audit --audit-level=high`: zero reported vulnerabilities at this run.
- Built-in secret scanner: 198 tracked/indexed paths passed. A separate pass of the same eight credential-shape patterns checked all 25 untracked reader/test files without printing matched values: zero findings. This is not an exhaustive security audit.
- `git diff --check` and whitespace checks for untracked reader files passed. Removed helper names, placeholder audio copy, old caret utilities, raw HTML insertion and debug `console.log` were searched in the reader scope.

### Authenticated browser and live provider

The in-app browser reached the normally protected local page with its existing signed-in session; no authentication bypass was used. Tests used only synthetic/sample text.

| Check | Observation |
| --- | --- |
| Hover preview and pointer bridge | `To` opened a positioned popup with local translations; moving the pointer to its save control kept it open. Secondary-button pointer positioning was used because the automation interface lacks a hover-only command. |
| Exact matching / selection replacement | Six `To/to` tokens highlighted in a 145-word test, while `Today/together/towards` remained normal. Selecting `success` cleared old matches and updated the header/context immediately. |
| Paired translation / dictionary | Live English→Italian translation populated matching rows. Context explanation and separate lexical senses rendered for selected words; current-text examples worked independently of AI. Deliberately ordered async completions are covered by unit tests, not network interception. |
| Audio runtime | Observed actual browser-generated spoken tokens (including `clerk`, `already`, `Oggi`), pause/resume state, document advance from sentence 1 to a later sentence and stop clearing all active rows/tokens. Italian playback produced zero spoken source tokens. This verifies browser callbacks/UI, not a human judgment of audible voice quality. |
| Desktop | 1440 px viewport, 400 px sidebar, paired columns; document width equaled viewport width. |
| Mobile / keyboard | At 320×740 the drawer opened, document width stayed 320 px and drawer content width was 318 px. Esc restored focus to the original word; Right moved to the next word and Enter opened its dictionary. Seven word Tab stops for the 125-word sample, not 125. |
| Failure / recovery | Initial live calls failed or remained pending with the previous development process; original text, local glossary and examples remained usable. Calls succeeded after restarting the local server. The exact earlier process/network cause was not established. Explicit retry and bounded waiting remain available. |
| Console | No application console errors observed during the tested normal interactions. Development recompilation/restarts are separate from that observation. |

## Online TTS contract — 2026-09-14

- Provider: server-only `InworldTtsProvider`, native HTTPS streaming endpoint, `inworld-tts-2-flash`, Basic API-key authentication, PCM with SYNC word timestamps. Browser code knows only `/api/tts` and the shared event contract; it does not receive credentials or private signed Storage URLs.
- Input: strict Zod, en/it/fr/uk, allowlisted female/male server-configured voice IDs, speed 0.75–1.5, <=6,000 UTF-16 units (existing Reading source remains 100–400 words / 3,000 units). Segments are <=3,900 units without splitting surrogate pairs. Provider timeout 30 seconds, client inactivity timeout 45 seconds, stream <=32 MiB / 600 seconds.
- Cache: HMAC(owner + exact text + language + resolved voice + speed + provider/model + format version). Exact text is retained to preserve offsets, not normalized destructively. Word selection reuses sentence synthesis. Owner-private entries expire after 30 days; physical deletion is scheduled daily. Deletion failures retain a durable outbox and capacity accounting, with backlog logged and a 503 cleanup response. Account-delete cascades enqueue in-flight/ready objects without losing cleanup metadata. This is not yet an end-user account-deletion workflow.
- Distributed reservations: PostgreSQL singleton lock atomically enforces lifetime and UTC daily/user character budgets, user/IP access windows, 90-second leases, maximum two active generations by default and 256 MiB reserved cache capacity. Failed generations retain their character charges. New generations start disabled (`lifetime_limit=0` and expired `credit_expires_at`). Approval must establish both a conservative limit and expiry, including lease headroom; no automatic monthly reset of lifetime credits.
- Cache hits consume an access-rate slot, not generation characters. Default windows are 90 requests/user/minute and 180/IP/minute; daily generation defaults are 3,000/user and 10,000 globally, subordinate to the disabled lifetime/expiry gates. Raw IP addresses are not persisted; only day-scoped HMACs from the trusted Vercel header. Missing trusted IPs share a restrictive bucket.
- Single-flight works within an instance and through a durable reservation between instances for the SAME owner/key. Cross-owner private-content deduplication and a separately authorized public/static audio catalog are **not delivered**. No public cache exposes another learner's content. This is an explicit remaining gap against the 20-different-users example, not evidence that example passed.
- The private `reading-audio` bucket, five service-only tables, RPC ACLs/RLS and deletion outbox are prepared in `supabase/migrations/20260913010000_reading_tts.sql`. `supabase/tests/reading_tts.sql` is an isolated rollback test script, NOT executed in this environment. `vercel.json` schedules authenticated daily cleanup; no cron is deployed by writing this file.
- Structured synthesis logs contain outcome, first-audio latency, elapsed time and bytes, never text/keys/provider bodies. These are server metrics, not measured end-user latency. Cross-instance waiters receive the completed private cache, not another instance's live stream. PCM is broadly supported through Web Audio but costs about 3.84 MB/minute in base64 before alignment/JSON overhead; compressed streaming and pitch-preserving speed remain improvements requiring browser acceptance.

### Current TTS verification

- Provider/controller/service/storage-adapter tests execute shipped modules with mocked HTTP, database/Storage protocol and an injected audio clock. They cover real timer expiry, 429/500/auth errors, stream/cancel/order/format validation, contextual word clipping, repeated occurrences, no estimated timestamps, seek/rate/resume, same-owner 20-request single-flight, two service instances sharing a mocked durable reservation, private cache identity, fenced upload/cleanup and retained deletion outbox on failure.
- Repository suite: **88 tests passed**. Lint/typecheck and the final Webpack production build passed. Default Turbopack build failed on environment process/port binding (`Operation not permitted`), not a passing `npm run check`. Dependency audit reported zero vulnerabilities. The scanner passed 198 tracked paths; a separate pass of its eight patterns found zero candidates in 45 untracked source/test/migration/config files. No dependencies were added.
- Authenticated in-app browser: English→Italian sample translated through the existing text provider, audio controls appeared, deliberately disabled Inworld produced the localized unavailable/retry state, closing returned focus, and clicking `bank` still opened its contextual dictionary. At an actual 320×740 CSS viewport the document and drawer were 320 px wide; after scrolling, the audio bar stayed at top=0. Reloading loaded the final localized buffered label. These are disabled-provider interaction checks, not successful audio or Safari/iOS proof. The temporary verification server is not the product runtime.
- Actual local HTTP checks: anonymous `POST /api/tts` returned 401 with only `authentication_required`; unauthorized cleanup returned 401. No Inworld call was made, no remote migration was applied and no production setting was changed.

### Activation handoff and outstanding acceptance

1. Verify Inworld account credit, expiry, selected stock voices, commercial/privacy terms and billing hard stops with the owner; never paste a key into chat. [Pricing](https://inworld.ai/pricing), checked 2026-09-14, lists Flash at $15/1M characters, up to 70 minutes included and a commercial license on On-Demand. It does not establish a perpetual free monthly allowance. Other use of the account must not consume the same reserved credits. Account expiry/automatic billing are unverified; no allowance is enabled.
2. Review processor retention/transfer obligations and hosting/storage/egress free-plan eligibility before processing private production text. App cache TTL is not a claim about provider retention or backup deletion. Do not promise zero cost or indefinite availability from a free tier.
3. Inspect the exact target Supabase project, earlier migration history and bucket/policy collisions. Run baseline/forward migrations and both SQL security suites on an isolated project, including concurrent reservations, 20 distinct authenticated users, expiry, role/HTTP Storage denial, deletion during upload and cron recovery. No database test runner is installed here; source tests do not prove SQL execution.
4. Only after the gates pass, configure server-only secrets and explicit voices from `.env.local.example`, a reviewed nonzero budget/credit expiry, and the authenticated cleanup cron in the intended hosting environment. Verify flags, normal OAuth callback, streaming behavior, storage/egress limits and live rollback. Deploy/push/configuration/migration application requires explicit external authorization and readback.
5. Benchmark real voices before acceptance: English `read/live/record/present/though/through/world`; French `bonjour/beaucoup/fille/plus/est/les amis`; Italian `ancora/principi/pesca/subito/perché`. Test contextual ambiguity and liaison, long multi-chunk timestamp origin, Chrome/Firefox/Safari/iOS, VoiceOver/keyboard, seeks, speed, background suspension, page exit and mobile sticky controls. Record cache-miss/hit p50/p95 click-to-first-audio, bytes/character, alignment correctness and provider concurrency. No live Inworld voice quality, latency or timing accuracy result exists yet.

## Other remaining reader limits

- The offline glossary contains ten English entries, translated into Italian/French/Ukrainian. Unknown hover words require opening the dictionary or a prior cache hit; there is no licensed general-purpose offline dataset.
- AI lexical output is not dictionary-grade evidence. A live response proposed a questionable extra sense for `success`; the prompt was tightened to common contemporary source meanings, but this is not proof that hallucinations are eliminated. AI provenance remains visible. An approved dictionary dataset/API and broader language-quality evaluation are needed before a public dictionary claim.
- Only the observed English→Italian browser flow has live-provider evidence. All four locale key sets and language contracts have automated coverage, not exhaustive linguistic validation.
- New word alignment and voice quality require the live Inworld/browser acceptance above. Missing timestamps do not trigger local-device speech or fabricated tracking.
- Book-length reading, translation/dictionary production quotas, approved processor settings, persistent vocabulary, external example APIs and real cross-language word alignment remain undelivered. Keep public activation disabled until the relevant gates pass; the intended hosted runtime must work with the owner's Mac off.
