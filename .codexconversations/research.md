# LingoCoon — Product, Research & Learning

> You are the Product, Research, and Learning Strategy department for LingoCoon. This is a dedicated planning and evidence task, not an implementation task.
>
> Start by reading the complete project AGENTS instruction chain, docs/README.md, the authoritative product and learning documents, docs/agents/agent-directory.md, and docs/agents/chat-starters.md. Load and follow $lingocoon-product, $feature-discovery, $lingocoon-research, $learning-feature-design, and $adaptive-path-evaluation.
>
> Use the product_strategist as the primary custom agent. For bounded independent questions, it may coordinate the idea_creator and learning_scientist custom agents. Keep delegation read-only, use no more than three specialists concurrently, and reconcile disagreements before returning a recommendation.
>
> Responsibilities:
> - define learner problems, target users, desired outcomes, product principles, MVP boundaries, roadmap, metrics, and non-goals;
> - verify competitor, pedagogy, market, and technology claims using current primary or authoritative sources;
> - design the speaking-first learning loop across speaking, listening, reading, and writing;
> - define how onboarding, learner profiles, observed mistakes, confidence, review, adaptation, and learner control should work;
> - convert promising ideas into cheap, falsifiable experiments;
> - keep flashcards as supporting reinforcement rather than the product core;
> - preserve accessibility, privacy, originality, and the zero-budget constraint.
>
> For every assignment, return: decision or recommendation; verified evidence; assumptions; alternatives; learning and product risks; measurable acceptance criteria; dependencies; unresolved questions; and a concise HANDOFF TO COMMAND CENTER.
>
> Do not edit code, documents, configuration, Git, data, or external services unless I explicitly approve an exact file boundary. Do not assume other tasks can read this conversation automatically. Communicate through the HANDOFF TO COMMAND CENTER, which I or the Command Center will relay.

<details><summary>4 previous messages</summary>

> Avvio il reparto Product, Research e Learning Strategy in un task separato, mantenendo il lavoro in sola lettura e senza modifiche al repository. Prima verifico il progetto disponibile e poi attendo il suo handoff strutturato.
>
> <details><summary>Called 2 tools</summary>
>
> Tool call
>
> Tool: list_projects
> Status: completed
>
> Tool call
>
> Tool: create_thread
> Status: completed
>
> </details>
>
> La prima creazione non è passata per un identificativo progetto troncato; correggo il riferimento e mantengo invariati i vincoli di sola lettura.
>
> <details><summary>Called a tool</summary>
>
> Tool call
>
> Tool: create_thread
> Status: completed
>
> </details>
</details>

Non riesco ad avviare il task delegato: il servizio rifiuta gli argomenti di `create_thread`, anche dopo aver corretto l’ID del progetto. Nessuna modifica è stata effettuata al repository.

> Coordination correction from LingoCoon Command Center:
>
> This existing task is already your department workspace. Do not call create_thread, fork_thread, or create another department task. Perform future assignments directly in this task.
>
> At the start of every assignment:
> 1. Read the current AGENTS instruction chain and the explicitly assigned skills.
> 2. Inspect git status and the relevant authoritative documents and decision log.
> 3. Treat other task histories as unavailable unless the Command Center provides a handoff.
> 4. Restate scope, acceptance criteria, permission boundary, and whether you are read-only.
> 5. Do not begin broad unsolicited work; wait for a concrete assignment.
>
> You may use a configured custom subagent only when a callable subagent mechanism is actually available and independent analysis materially helps. If unavailable, report that limitation and perform the bounded work directly with the assigned skills. Never create another user-visible task as a substitute.
>
> Communication protocol:
> - Send all cross-department information as a concise section titled HANDOFF TO COMMAND CENTER.
> - Include evidence, decisions, assumptions, dependencies, conflicts, risks, verification, and the exact next action.
> - The Command Center will relay approved inputs between departments.
> - Shared files are not communication: never infer approval merely because another task changed a file.
> - Remain read-only unless the Command Center explicitly assigns this task one exact file set as the sole writer.
> - Before writing, re-check git status; after writing, report every changed file and validation result.
> - Never commit, push, merge, deploy, or mutate external services without separate explicit authorization.
>
> Acknowledge this protocol briefly, report any work or nested task already started, and then wait for a concrete assignment.

Protocol acknowledged.

No repository or external changes were made. I attempted to start a nested task twice, but both calls were rejected; no nested task was created.

I will remain read-only in this existing department task and wait for a concrete assignment.

> TASK ID: LC-PLAN-001
>
> Outcome:
> Produce the definitive product rebuild brief for LingoCoon and define the first complete vertical slice. This is a product and learning decision, not an implementation task.
>
> Why it matters:
> The current deck, flashcard, and AI-chat application represents only a small prototype. We need to determine what should be preserved, adapted, replaced, or removed before spending engineering effort.
>
> Scope:
>
> 1. Define the primary learner segment and highest-value learner problem.
> 2. Define the complete product promise and core learning loop.
> 3. Specify how the guided path and learner-created activities coexist.
> 4. Define the minimum useful personalization available after onboarding.
> 5. Define how observed mistakes, uncertain AI inferences, learner corrections, and recommendations differ.
> 6. Confirm the role of speaking, listening, reading, and writing.
> 7. Define the role of decks, flashcards, LexiCoon, AI chat, gamification, and the raccoon.
> 8. Define the first workplace self-introduction vertical slice.
> 9. Classify current product capabilities as Preserve, Adapt, Replace, Remove, or Defer.
> 10. Produce a small phased rebuild roadmap with explicit dependencies and non-goals.
>
> Authoritative inputs:
>
> - docs/product/vision-and-principles.md
> - docs/product/learning-profile-v1.md
> - docs/product/first-learning-mission.md
> - docs/product/roadmap.md
> - docs/decisions/decision-log.md
> - current repository behavior
>
> Required skills:
> $lingocoon-product
> $feature-discovery
> $lingocoon-research
> $learning-feature-design
> $adaptive-path-evaluation
>
> Working rules:
>
> - Work directly in this existing department task.
> - Remain read-only.
> - Do not create another task or modify files.
> - Reuse existing verified research. Browse only when a missing current fact materially changes the decision.
> - Separate verified evidence, assumptions, proposals, and unresolved decisions.
> - Keep the output concise and decision-oriented.
> - Preserve the zero-budget, accessibility, privacy, security, and speaking-first requirements.
> - Do not copy proprietary competitor mechanics or visual assets.
>
> Required output:
>
> 1. Product problem and target learner.
> 2. Product promise.
> 3. Core learning loop.
> 4. Personalization model.
> 5. First vertical slice.
> 6. Preserve/Adapt/Replace/Remove/Defer table.
> 7. Prioritized rebuild phases.
> 8. Success and guardrail metrics.
> 9. Risks and alternatives.
> 10. Decisions requiring owner approval.
> 11. HANDOFF TO COMMAND CENTER.
>
> Acceptance criteria:
>
> - The brief is specific enough for UX, AI, and Architecture to work independently from the same approved scope.
> - The first slice connects all four skills and produces reusable personalization evidence.
> - Flashcards are supporting practice rather than the main product.
> - Multiplayer, browser extensions, large content libraries, and complex rewards remain deferred.
> - No implementation or external-system change is performed.

<details><summary>2 previous messages</summary>

> Scope confermato: produrrò un brief decisionale read-only, senza modificare file o sistemi. Verificherò istruzioni, documenti autorevoli e comportamento corrente; distinguerò fatti osservati, assunzioni e proposte, poi consegnerò l’handoff al Command Center.
>
> <details><summary>Explored a search, a list, ran 3 commands</summary>
>
> - Ran `git status --short --branch && sed -n '1,240p' .agents/project/AGENTS.md && sed -n '1,200p' .agents/README.md && sed -n '1,180p' docs/README.md`
>
> - Ran `for f in docs/product/vision-and-principles.md docs/product/learning-profile-v1.md docs/product/first-learning-mission.md docs/product/roadmap.md docs/decisions/decision-log.md docs/architecture/learning-engine.md docs/architecture/system-overview.md docs/agents/agent-directory.md docs/agents/chat-starters.md; do echo "--- $f"; sed -n '1,260p' "$f"; done`
>
> <details><summary>Explored a search, a list</summary>
>
> - Listed files in `app`
> - Searched for `deck|flashcard|LexiCoon|chat|generate|speech|transcri|tts|stt|onboard|review|study` in `app`
>
> </details>
>
> - Ran `rg --files src | rg 'app/.*/page|app/page|components/(deck|chat|lex|study|dashboard)' | head -100; rg -n "export default|LexiCoon|flashcard|AI study|general chat|SpeechInputButton|useSpeechToText" src/app src/components src/lib 2>/dev/null | head -180`
>
> </details>
</details>

# LingoCoon Product Rebuild Brief — LC-PLAN-001

Status: decision brief, read-only
Scope: product, learning, prioritization, and first vertical slice
Evidence date: 3 September 2026

## 1. Product problem and target learner

Primary segment: adults at beginner or early-intermediate English level who need to communicate in recurring real-life or workplace situations, but do not know exactly what to practise next.

Highest-value problem:

> Learners can recognize words and complete drills, but struggle to produce understandable language spontaneously in realistic situations.

The product must therefore optimize for independent, useful production—not deck size, chat volume, streak length, or isolated recall.

This is consistent with the approved [vision](<./docs/product/vision-and-principles.md>) and [first-mission baseline](<./docs/product/first-learning-mission.md>).

## 2. Product promise

> LingoCoon understands what the learner needs next and creates a useful way to practise it.

Operationally, every recommended activity must state:

- what the learner will be able to do;
- why it was selected;
- which skill or pattern it targets;
- how long it takes;
- what happens if AI, audio, or speech recognition is unavailable;
- how the learner can accept, edit, dismiss, or replace it.

## 3. Core learning loop

The canonical loop is:

**Context → Attempt → Selective feedback → Changed retry → Delayed review → Recommendation**

The four skills share one outcome:

1. Reading supplies context and useful language.
2. Listening tests comprehension at natural and slower speed.
3. Writing rehearses the learner’s own meaning.
4. Speaking tests independent, relevant production.
5. Feedback identifies one high-value improvement.
6. Retry requires changed production, not sentence copying.
7. Review revisits the target after a delay.
8. Evidence informs the next recommendation.

Flashcards support retention after the meaningful task; they are not the main loop.

## 4. Guided path and learner-created activities

The two paths use the same profile and event model:

| Path | Purpose | Product behavior |
|---|---|---|
| Guided path | Reduce decision fatigue | Recommend one next activity from goals, evidence, time, skill balance, and repeated needs |
| Learner-created path | Preserve agency and real-world relevance | Let the learner request a topic, situation, correction, explanation, or format |
| Shared layer | Avoid fragmented learning | Both paths may create structured events and recommendations with learner consent |

The guided path proposes; the learner controls. A learner-created activity may become a reusable activity only after validation and clear learning metadata.

## 5. Minimum useful personalization after onboarding

Onboarding should create hypotheses, not diagnoses.

Minimum profile:

- native and target language;
- self-assessed level;
- practical goal;
- preferred situations or interests;
- available session duration;
- feedback language and intensity;
- accessibility and interaction preferences.

After one completed mission, personalization should additionally know:

- at least one skill-level signal;
- one successful language use signal;
- one observed difficulty or uncertain signal;
- hint and retry behavior;
- learner acceptance or dismissal of a recommendation;
- a provisional next activity.

No recommendation should rely permanently on a single onboarding answer or isolated mistake.

## 6. Evidence, inference, correction, and recommendation

These concepts must remain separate:

| Concept | Meaning | Authority |
|---|---|---|
| Observed mistake | A concrete issue detected in a learner attempt, with input and context | Evidence, not permanent truth |
| AI inference | Probabilistic interpretation such as possible grammar or pronunciation difficulty | Uncertain suggestion |
| Learner correction | The learner accepts, edits, ignores, or dismisses a signal | Learner-controlled decision |
| Recommendation | A proposed next activity derived from evidence, profile, constraints, and variety | Deterministic application decision |

Policy:

- repeated evidence outweighs one error;
- acceptable variants, dialects, accents, and stylistic choices are not automatically errors;
- uncertain AI evaluations are labelled as suggestions;
- learners can inspect, override, dismiss, and later revisit recommendations;
- profile updates require validated schemas and explicit provenance;
- raw audio and full transcripts are not retained by default.

## 7. Role of the product elements

| Element | Decision |
|---|---|
| Speaking | Primary capability; must appear in the first complete mission |
| Listening | Context and comprehension support for speaking |
| Reading | Comprehensible input and phrase discovery |
| Writing | Low-pressure rehearsal and diagnostic evidence |
| Decks | Supporting learner-created or system-generated review material |
| Flashcards | Delayed retrieval and reinforcement only |
| LexiCoon | Bounded dictionary and explanation tool connected to current learning context |
| AI chat | Guided practice and activity generation, not unrestricted companionship |
| Gamification | Reward meaningful attempts, improvement, delayed review, and balanced practice |
| Raccoon | Helpful guide, feedback character, and progress metaphor; never the task itself |
| Multiplayer | Deferred until the individual loop is effective |
| Browser extension | Deferred |
| Large content library | Deferred |
| Complex reward economy | Deferred |

Current repository evidence confirms that decks, spaced repetition, AI chat/study, LexiCoon, TTS, STT, onboarding, and authenticated routes exist. The normalized mission/event/profile-recommendation loop does not yet exist as the target product architecture. See [roadmap](<./docs/product/roadmap.md>) and current source under `src/app`, `src/components`, and `src/lib`.

## 8. First vertical slice: workplace self-introduction

Target: adult beginner or early-intermediate learner, English, 5–10 minutes, 3–5 speaking turns.

Independent outcome:

> Deliver a short understandable self-introduction and answer one relevant follow-up question without reading a model sentence.

Activity contract:

1. Orientation: situation, outcome, duration, difficulty control.
2. Reading: short workplace dialogue; optional phrase meaning and pronunciation help.
3. Listening: natural-speed audio, slower replay, comprehension questions.
4. Writing: learner drafts a short introduction using optional prompts.
5. Speaking: learner responds by voice to a contextual prompt.
6. Evaluation: task relevance, comprehensibility, target language use, and one priority correction, each with confidence.
7. Retry: changed prompt or added detail; learner may use a hint or skip correction.
8. Follow-up: one question requiring a relevant answer.
9. Review: strength, priority improvement, useful item, and explainable next recommendation.
10. Controls: save, edit, dismiss, replace, replay, retry, continue without correction.
11. Fallbacks: typed response, transcript-based evaluation, static audio/transcript, or deterministic non-AI practice.

Required structured events:

`mission_started`, `reading_completed`, `help_requested`, `listening_played`, `comprehension_answered`, `writing_submitted`, `speaking_attempted`, `evaluation_created`, `retry_submitted`, `recommendation_shown`, `recommendation_accepted`, `recommendation_dismissed`, `recommendation_edited`, `mission_completed`.

## 9. Current capability classification

| Capability | Decision | Rationale |
|---|---|---|
| Onboarding | Adapt | Extend from preferences into provisional learner hypotheses and accessibility controls |
| Deck CRUD | Adapt | Reposition as learner-created supporting practice |
| AI deck generation | Adapt | Generate bounded mission support or review items, not the product destination |
| FSRS/spaced repetition | Preserve and adapt | Retain as delayed review behind meaningful activities |
| Classic flashcard study | Adapt | Keep as optional reinforcement, not primary navigation |
| AI study/chat | Adapt | Convert from generic deck chat into bounded contextual practice |
| General AI chat | Replace | Replace unrestricted conversation with structured learner-created activities |
| LexiCoon dictionary | Preserve and adapt | Connect lookups to context, evidence, and optional review |
| TTS | Preserve | Needed for listening, replay, and pronunciation support; requires durable quotas/fallback |
| STT | Preserve and adapt | Move from auxiliary input to explicit speaking attempts with privacy controls |
| Current dashboard | Replace | Replace with personalized home showing one next useful activity |
| Current navigation centred on flashcards | Replace | Re-centre on missions, evidence, and four-skill progress |
| Gamification | Defer/adapt later | Add only after useful behavior and learning signals are measurable |
| Raccoon UI presence | Adapt | Use meaningful states and feedback; avoid decorative interruption |
| Multiplayer | Defer | Requires validated individual loop, moderation, identity, and safety model |
| Browser extension | Defer | Not needed to validate the core promise |
| Large content library | Defer | One mission must prove value first |

## 10. Prioritized rebuild phases

### Phase 0 — Safety and foundation

Dependencies: existing security and quality baseline.

Complete persistent AI/TTS/STT quotas, logging redaction, profile/schema reconciliation, isolated database authorization tests, privacy export/deletion foundations, and critical application test coverage.

### Phase 1 — Learning data foundation

Dependencies: approved data model and architecture.

Add sessions, immutable learning events, normalized error signals, provenance/confidence, recommendation records, idempotency, retention, and owner-only operations.

Exit criterion: a deterministic fixture can complete one mission, produce signals, and accept/edit/dismiss a recommendation without cross-user access.

### Phase 2 — First personalized loop

Dependencies: Phase 1 plus bounded AI/audio/speech contracts.

Deliver the workplace self-introduction mission, personalized home, all four skills, retry, review, fallback, accessible states, and useful raccoon feedback.

Exit criterion: a new learner can complete the mission and receive one explainable, overridable next recommendation.

### Phase 3 — Learner-created practice

Dependencies: stable event and recommendation contracts.

Allow requests for contextual activities, corrections, explanations, and review. Reuse the same profile and evidence boundary.

### Phase 4 — Evidence-led expansion

Dependencies: representative evaluation data and positive learning signals.

Add more workplace and daily-life scenarios, improved adaptation, and carefully scoped gamification.

Explicitly outside the rebuild:

- multiplayer;
- browser extension;
- large content catalogue;
- complex rewards;
- unrestricted AI autonomy;
- paid providers or recurring costs without approval.

## 11. Success and guardrail metrics

Learning metrics:

- first speaking attempt rate;
- mission completion rate;
- independent answer rate;
- retry improvement rate;
- delayed-review retrieval;
- repeated errors resolved;
- four-skill activity balance;
- learner-reported usefulness.

Product metrics:

- recommendation acceptance rate;
- recommendation override and dismissal rate;
- seven-day return rate;
- median mission duration;
- abandonment by step;
- fallback completion rate.

Guardrails:

- false-priority rate: recommendation targets a weakness the learner cannot reproduce in evidence;
- correction dismissal rate;
- percentage of evaluations with explicit confidence;
- provider failure and fallback success rate;
- AI/TTS/STT quota rejection rate;
- raw audio/transcript retention compliance;
- cross-user authorization failures;
- accessibility completion rate by keyboard and touch;
- repeated-activity and meaningless-submission rate.

No engagement metric alone proves learning efficacy.

## 12. Risks and alternatives

Main risks:

- AI overcorrects acceptable language or accents;
- speech recognition quality biases evaluation;
- provider latency or quotas break the core experience;
- recommendations become repetitive or opaque;
- collecting transcripts/audio creates unnecessary privacy exposure;
- onboarding labels learners too aggressively;
- gamification shifts attention from production to completion;
- current flashcard abstractions constrain the target model.

Alternatives:

1. Fully authored missions: more predictable and cheaper, but less personalized.
2. AI-generated missions: more flexible, but higher quality, privacy, and abuse risk.
3. Hybrid approach — recommended: authored mission structure plus bounded AI generation/evaluation and deterministic recommendation policy.
4. Text-first fallback: strongest zero-budget reliability, but temporarily reduces speaking richness.

The hybrid approach best satisfies learning value, learner control, safety, and zero-budget constraints.

## 13. Decisions requiring owner approval

1. Approve the workplace self-introduction mission as the only first-slice scope.
2. Approve the hybrid architecture: authored activity primitives, bounded AI, deterministic profile/recommendation policy.
3. Approve the evidence boundary: structured signals retained by purpose; raw audio/full transcripts deleted by default.
4. Approve replacing the flashcard-centred home with a personalized next-activity home.
5. Approve the Preserve/Adapt/Replace/Remove/Defer classifications above.
6. Approve Phase 0 security/privacy work before public provider-backed missions.
7. Approve the success and guardrail metrics, including false-priority rate and fallback completion.
8. Defer multiplayer, extensions, large libraries, and complex rewards.

## HANDOFF TO COMMAND CENTER

Decision: rebuild LingoCoon around one hybrid, speaking-first, four-skill mission loop. Preserve decks, spaced repetition, LexiCoon, TTS, and STT as supporting infrastructure; adapt AI chat and onboarding; replace the flashcard-centred home and unrestricted chat model; defer multiplayer, extensions, large libraries, and complex rewards.

Evidence: approved vision, learner-profile, first-mission, roadmap, and learning-engine documents; repository inspection confirms the current prototype is centred on onboarding, decks/cards, FSRS, AI chat/generation, LexiCoon, TTS, and STT, while the target normalized mission/event/recommendation loop is not implemented.

Dependencies: Phase 0 security, privacy, quotas, schema reconciliation, database authorization, and test foundations precede provider-backed implementation. Phase 1 event/profile/recommendation contracts precede UX, AI, and architecture delivery.

Next exact action: owner approval of the first-slice scope, hybrid learning architecture, evidence-retention boundary, capability classifications, and Phase 0 → Phase 1 sequence.

> User context
>
> Attachments:
> - TASK ID: LC-PRODUCT-002 Title: Context Learning Workspace — first personally te…: `~/.codex/attachments/44121f1a-c369-4183-a6de-eac8c119e2ee/pasted-text.txt`

<details><summary>6 previous messages</summary>

> Leggo la richiesta allegata e ne ricavo scope, competenze obbligatorie e confine di autorizzazione prima di procedere. Se è un nuovo incarico LingoCoon, resterò in sola lettura finché il testo non autorizza esplicitamente altro.
>
> <details><summary>Explored a file</summary>
>
> - Read `~/.codex/attachments/44121f1a-c369-4183-a6de-eac8c119e2ee/pasted-text.txt`
>
> </details>
>
> Userò, nell’ordine, `$lingocoon-product`, `$feature-discovery`, `$learning-feature-design`, `$adaptive-path-evaluation` e `$lingocoon-research`: servono rispettivamente a fissare la direzione, confrontare gli MVP, definire il ciclo didattico, verificare l’adattamento e separare le evidenze dalle proposte. Il lavoro resta interamente read-only; l’output sarà una decisione di prodotto con tre brief downstream, senza schemi tecnici definitivi.
>
> <details><summary>Explored a file, a search, ran a command</summary>
>
> - Ran `git status --short --branch && sed -n '1,260p' AGENTS.md && sed -n '1,320p' .agents/project/AGENTS.md && sed -n '1,260p' .agents/README.md && for f in .agents/skills/lingocoon-product/SKILL.md .agents/skills/feature-discovery/SKILL.md .agents/skills/learning-feature-design/SKILL.md .agents/skills/adaptive-path-evaluation/SKILL.md .agents/skills/lingocoon-research/SKILL.md; do sed -n '1,320p' "$f"; done`
>
> <details><summary>Explored a file, a search</summary>
>
> - Searched for `LingoCoon product foundation|first mission|learning-profile|speaking-first|flashcards|workplace self-introduction|personalization` in `MEMORY.md`
> - Read `~/.codex/memories/MEMORY.md`
>
> </details>
>
> </details>
>
> Le skill impongono due verifiche specifiche: il ciclo deve produrre evidenze strutturate senza trasformare inferenze AI in verità, e il percorso adattivo deve coprire cold start, ritorno, incertezza, rifiuto e indisponibilità dei provider. Ora confronto queste regole con i documenti autorevoli e con le superfici effettivamente presenti nel repository.
>
> <details><summary>Explored 6 files, 2 searches, a list, ran a command</summary>
>
> - Ran `for f in docs/README.md docs/product/vision-and-principles.md docs/product/learning-profile-v1.md docs/product/first-learning-mission.md docs/product/roadmap.md docs/architecture/learning-engine.md docs/architecture/system-overview.md docs/architecture/ai-contracts.md docs/design/ux-principles.md docs/decisions/decision-log.md; do printf '\n--- %s\n' "$f"; sed -n '1,360p' "$f"; done`
>
> <details><summary>Explored 6 files, 2 searches, a list</summary>
>
> - Listed files in `app`
> - Searched for `GeneralChat|Lexicoon|SpeechInputButton|generateFlashcardDeckWithAi|appendTranscript|rateCard|ONBOARDING_PURPOSES|navigation\.flashcards|operation: z\.literal` in `app`
> - Searched for `session|event|signal|recommendation|retention|transcript|raw audio|confidence|learner decision|observation` in `data-model.md`
> - Read `./docs/architecture/learning-engine.md`
> - Read `./docs/architecture/data-model.md`
> - Read `./docs/architecture/ai-contracts.md`
> - Read `./src/components/ai/GeneralChat.tsx`
> - Read `./src/components/lexicoon/LexicoonPage.tsx`
> - Read `./src/lib/tutor-security.ts`
>
> </details>
>
> </details>
</details>

# LC-PRODUCT-002 — Context Learning Workspace

Decision: build **LingoCoon Context Studio** as a small dogfooding slice before the full workplace mission. It should validate contextual phrase learning, bounded conversation, learner-controlled memory, and recommendations without replacing the approved four-skill mission.

Recommended MVP: **Option C — Integrated thin slice**.

No files, code, data, configuration, Git state, providers, or external systems were changed.

## Evidence and assumptions

### Verified evidence

| Observation | Evidence | Implication |
|---|---|---|
| LingoCoon must move from context toward independent production | [Vision and principles](./docs/product/vision-and-principles.md) | Reading cannot end in passive highlighting |
| Personalization must distinguish evidence, inference, preference, and learner decisions | [Learning profile v1](./docs/product/learning-profile-v1.md) | AI cannot silently label vocabulary as known or unknown |
| Recommendations are application decisions, not model decisions | [Learning engine](./docs/architecture/learning-engine.md) | AI proposes content and observations; deterministic policy selects next actions |
| Raw audio is not retained by default; transcript retention requires approval | [Data model](./docs/architecture/data-model.md) | Context Studio needs explicit save and deletion controls |
| The current product already has AI chat, LexiCoon, decks, TTS, STT, and review scheduling | [GeneralChat.tsx](./src/components/ai/GeneralChat.tsx), [LexicoonPage.tsx](./src/components/lexicoon/LexicoonPage.tsx) | Existing capabilities can be adapted, but they are currently disconnected |
| The workplace self-introduction is already the approved complete mission | [Decision log](./docs/decisions/decision-log.md) | This experiment should precede it, not silently supersede it |

No live research was required: current provider pricing or availability does not change this product decision. Provider selection and limits remain unverified implementation decisions.

### Assumptions

- The owner will initially test authenticated English-learning sessions with personally relevant material.
- Context Studio measures usability and evidence quality, not language-learning efficacy.
- Typed conversation is required in v1; speaking is available when the current speech path works but never blocks completion.
- Proposed numeric limits are pilot constraints requiring owner approval.

## 1. Problem statement

Traditional flashcards separate vocabulary from the sentences, intentions, and situations that give it meaning. The learner must move among a reader, dictionary, chat, and review tool, while none reliably understands what was merely opened, actually understood, recalled, or independently used.

The hypothesis is:

> A single contextual workspace can help a learner understand meaningful material, use a few valuable phrases actively, and obtain a trustworthy next action without creating an uncontrolled vocabulary collection.

## 2. Recommended concept

Working name: **LingoCoon Context Studio**

Promise:

> Bring something you want to understand. LingoCoon helps you notice the useful language, discuss it, practise using it, and decide what should be remembered.

Context Studio is a learner-created entry point into the same future profile and recommendation system as guided missions. It is not a separate learning model.

## 3. MVP comparison

| Criterion | A — Reader first | B — Conversation first | C — Integrated thin slice |
|---|---:|---:|---:|
| Immediate usefulness | Medium | Medium–high | High |
| Contextual learning value | Medium | High | High |
| Personalization evidence | Low | Medium | High |
| Implementation complexity | Low | Medium | Medium–high |
| Accessibility risk | Low | Medium | Medium |
| Privacy exposure | Low | High | Medium |
| AI dependency | Low | High | Medium |
| Owner feedback value | Medium | Medium | High |
| Validates the product promise | Partially | Partially | Yes |

### Recommendation

Select **Option C**, tightly bounded to:

- one pasted, written, generated, or adapted text;
- approximately 150–500 words;
- no more than five visible focus phrases or patterns;
- a three-to-five-turn contextual conversation;
- one selective correction;
- one changed retry;
- one end-of-session recommendation;
- a target session length of 10–15 minutes.

Option A would validate reading ergonomics but not the transition to active use. Option B would risk reproducing the current disconnected chat experience. Option C tests the important relationship between context, production, evidence, and memory.

### Relationship to the workplace mission

Context Studio should be an **exploratory Phase 1A dogfood slice**, not the new canonical first mission.

It validates reusable primitives:

- source content;
- contextual concepts;
- learner-controlled familiarity;
- bounded conversation;
- selective feedback;
- independent-use evidence;
- recommendations.

The workplace self-introduction remains the first complete guided mission connecting reading, listening, writing, and speaking.

## 4. End-to-end flow

1. **Choose material**
   - Paste or write text.
   - Alternatively request bounded generation by topic, goal, level, situation, and length.
   - Adaptation creates a separate version and never overwrites the original.
   - Generated or adapted text remains editable before starting.

2. **Preview the session**
   - Show text length, estimated duration, level assumption, and learning goal.
   - The learner can change difficulty or continue without AI analysis.

3. **Read**
   - Begin with a clean, mostly unhighlighted text.
   - Reveal at most three to five suggested phrases or patterns.
   - The learner can disable all highlighting.

4. **Explore**
   - Selecting an item opens the context panel without losing reading position.
   - The learner may save, ignore, classify, hear, or ask about it.

5. **Choose focus items**
   - Select up to three items for active use.
   - The system may suggest items but must explain why.

6. **Discuss**
   - AI asks one question at a time about meaning, opinion, application, or comparison.
   - Responses are typed first; voice input is optional.
   - Hints and changed questions remain available.

7. **Receive selective feedback**
   - Show one strength and at most one priority suggestion.
   - Distinguish contextual relevance, meaningful phrase use, and language correction.
   - Display confidence and learner correction controls.

8. **Changed retry**
   - Ask a related but different question requiring adaptation rather than copying.
   - Compare only the priority target and task completion.

9. **Review**
   - Show understood material, independent phrase use, one difficulty, saved items, and one next action.
   - Allow edit, dismiss, postpone, replace, or start.

10. **Retention choice**
   - Clearly show what will be saved.
   - The learner can delete the source, conversation-derived evidence, individual items, or the entire session.

## 5. Workspace information architecture

Recommended structure: **one primary reading area with secondary tools revealed on demand**.

### Desktop

- Top bar: source title, goal, progress, save state, exit.
- Main area: focused reader.
- Right contextual panel: opened item and familiarity controls.
- Collapsible conversation panel: opens beside or below the reader.
- Compact focus-item tray: maximum three active items.
- End review replaces the main task area without navigating to an unrelated product section.

A permanently equal reader/chat split is not recommended: it reduces reading width and creates two competing primary tasks.

### Mobile

- Single-column reader.
- Context information opens as a labelled bottom sheet or full-height panel.
- Conversation becomes a sequential activity while preserving the reading position.
- Returning to the reader restores the previous scroll anchor and selected phrase.

Only one visually dominant action should appear at a time.

## 6. Familiarity model

Familiarity applies primarily to **phrases and patterns**, and secondarily to isolated words selected by the learner or repeatedly relevant to comprehension.

| State | Meaning | Assignment |
|---|---|---|
| Unclassified | No reliable evidence yet | Default |
| Learning | Learner wants active practice | Learner-controlled; system may suggest |
| Familiar | Learner reports recognition or contextual understanding | Learner-controlled |
| Reliable in context | Repeated evidence shows independent use or delayed retrieval | Evidence-backed proposal, editable |
| Uncertain | Evidence conflicts or AI confidence is insufficient | System or learner may propose |
| Ignored | Not relevant for current goals or recommendations | Learner-controlled |

Recognition, understanding, prompted recall, and independent use remain separate evidence dimensions. A single status must not conceal those distinctions.

Rules:

- Opening an item does not mean it is unknown.
- Requesting a meaning creates a help event, not a permanent weakness.
- One correct response cannot produce “reliable in context.”
- “Reliable” requires repeated independent evidence in varied or delayed contexts.
- AI cannot automatically assign “familiar” or “reliable.”
- Low-confidence classifications remain session-level suggestions unless confirmed.
- Dismissed or corrected classifications stop affecting recommendations until new evidence or an explicit reset.

### Highlighting

Do not use the proposed green/red binary.

- Show no highlighting for ordinary unclassified text.
- Display only selected or high-priority items by default.
- Use underline style, small markers, labels, and panel text—not color alone.
- Keep familiar and ignored items visually quiet.
- Use a dotted indicator for uncertain suggestions.
- Provide `Show focus items`, `Show all detected items`, and `Hide highlights`.
- When candidates overlap, visually select the longest useful expression; expose nested words inside the panel.

## 7. Phrase and pattern model

Supported concept types:

- multi-word expression;
- collocation;
- phrasal verb;
- sentence frame;
- grammar pattern;
- recurring structure;
- isolated word when independently useful.

Every candidate should answer:

- What does it mean here?
- Why is the whole expression more useful than its individual words?
- What function does it serve?
- Is it appropriate for the learner’s goal and level?
- What evidence exists for recognition, understanding, recall, or independent use?
- Is the segmentation certain enough to show as a suggestion?

Automatic detection creates candidates, not trusted profile items. Only selected, saved, practised, or repeatedly evidenced items affect later recommendations.

Meaningless repetition is not independent use. Evidence requires a response that is relevant to the conversational question and semantically appropriate.

## 8. Context-panel hierarchy

First visible portion:

1. selected phrase or pattern in its original sentence;
2. concise contextual meaning;
3. meaning of the complete expression;
4. simple explanation in the preferred feedback language;
5. audio and pronunciation action;
6. familiarity state with `Learn`, `Familiar`, `Ignore`, and `Save`;
7. one natural level-appropriate example;
8. a short “Why this is useful here” explanation.

Expandable details:

- grammar role or sentence frame;
- common variations and word forms;
- collocations and related phrases;
- register and nuance;
- synonyms;
- frequency or etymology only when genuinely helpful.

The panel must never begin with an exhaustive dictionary entry.

## 9. AI conversation contract

AI behavior:

- Operates only within the selected text, learner goal, level, focus items, and recent session evidence.
- States the conversation objective before beginning.
- Asks one question at a time.
- Moves from comprehension to interpretation or personal application.
- Encourages natural use of up to three focus items without demanding exact repetition.
- Recognizes appropriate paraphrases.
- Distinguishes avoidance from a legitimate alternative response.
- Provides one strength and at most one priority correction.
- Offers explanation, translation, hint, example, or a changed question on request.
- Ends after a declared number of turns.
- Produces structured observations with confidence but does not mutate the learner profile.

Speaking:

- May be selected for any response after the conversation starts.
- Recording never begins automatically.
- The learner reviews and edits the transcript before evaluation.
- Transcript-only evaluation cannot claim pronunciation or accent assessment.
- Typed input always remains available.

### Without AI

The learner can still:

- paste or write material;
- read without automatic highlights;
- select text manually;
- enter or edit a meaning;
- mark familiarity;
- save or ignore items;
- play available static/browser audio;
- respond to deterministic prompts such as summary, opinion, and personal application;
- complete a manual review;
- receive a deterministic recommendation based on selected items and explicit actions.

AI generation, adaptation, segmentation, explanations, evaluation, and dynamic conversation become clearly labelled unavailable enhancements. Their failure cannot invalidate the session.

## 10. Learning memory and learner control

### Session-only by default

- unsaved source text;
- full conversation;
- raw AI notes;
- automatic phrase candidates;
- unconfirmed speech transcript;
- raw audio;
- temporary highlights.

Raw audio should be discarded after transcription processing.

### Persist only with explicit purpose and consent

- saved source or both original and adapted versions;
- selected phrases and patterns;
- learner familiarity decisions;
- help, hint, retry, and independent-use evidence;
- learner-confirmed response excerpts where needed for review;
- one accepted priority signal;
- recommendation and learner response;
- minimal provider-operation metadata without content.

If the learner saves an adapted source, both versions remain visibly linked and independently deletable.

Controls must support:

- inspect;
- edit;
- confirm;
- dismiss;
- postpone;
- reset;
- delete an item;
- delete session evidence;
- delete the source;
- replace a recommendation.

Full source and transcript retention periods remain owner and privacy decisions. “Save progress” cannot silently mean “retain the entire conversation.”

## 11. Structured evidence and recommendation effects

These are product semantics, not final schemas.

| Event | Meaning | Profile/recommendation effect |
|---|---|---|
| `text_created` | Learner wrote a source | Provenance only |
| `text_pasted` | Learner supplied external text | Provenance only |
| `text_generated` | AI generated bounded editable text | No competence inference |
| `text_adapted` | Derived version created; original preserved | Records chosen difficulty, not ability |
| `item_opened` | Item panel opened | Weak session-interest signal only |
| `meaning_requested` | Learner requested contextual help | Help evidence; never automatic “unknown” |
| `audio_played` | Item or sentence audio played | Help evidence; no pronunciation claim |
| `familiarity_changed` | Learner changed an item state | Authoritative learner decision |
| `phrase_saved` | Learner wants future access or practice | Eligible for review |
| `phrase_ignored` | Item is currently irrelevant | Suppress unless learner resets |
| `conversation_started` | Bounded discussion began | Session progress only |
| `learner_response_submitted` | Typed or confirmed-transcript response | Potential production evidence |
| `phrase_used_independently` | Relevant, unprompted contextual use | Strong evidence; still confidence-scored |
| `hint_requested` | Assistance requested before an attempt | Attempt was supported, not failed |
| `feedback_shown` | AI or deterministic observation displayed | No persistent truth by itself |
| `learner_corrected_inference` | Learner rejected or edited an inference | Override retained separately |
| `recommendation_created` | Application policy selected a next action | Must include reason and evidence link |
| `session_completed` | Declared session outcome finished | Completion, not mastery |

Recommendation order:

1. Resume an unfinished session.
2. Offer a changed retry for an accepted priority signal.
3. Review a saved item due for delayed retrieval.
4. Address repeated—not isolated—difficulty.
5. Balance neglected production or comprehension modes.
6. Continue the chosen topic with a varied activity.
7. If evidence is insufficient, let the learner choose and explain why.

### Adaptive-path scenarios

| Scenario | Required behavior |
|---|---|
| New learner | Start unclassified; ask goal and level; avoid automatic known/unknown labels |
| Returning learner | Resume or offer one due saved item before proposing more collection |
| Inactive learner | Offer a short restart; do not treat inactivity as skill loss |
| Conflicting evidence | Use `uncertain`, explain the conflict, request confirmation or another attempt |
| Dismissed inference | Suppress until new independent evidence or learner reset |
| Repeated content | Vary task or context; do not repeatedly recommend the same phrase |
| Provider unavailable | Complete deterministic flow and disclose missing evaluation |
| Duplicate action | Return the last accepted state rather than duplicate evidence |

## 12. Accessibility and fallback requirements

- Highlights have text labels and distinct non-color styling.
- Reader remains understandable with all styling removed.
- Text selection and item opening work by keyboard, touch, and assistive technology.
- Highlighted phrases must not create fragmented or nested interactive controls.
- Context panel has a labelled heading, predictable focus entry, close action, and focus return.
- Conversation updates use concise live-region announcements.
- Audio always has text; speaking always has typed fallback.
- No timed reading or response requirement.
- Reduced-motion preference is respected.
- At 320 CSS pixels, the experience uses one column without horizontal page scrolling.
- AI, generation, adaptation, TTS, STT, or persistence failure cannot prevent completion.
- A save failure must never claim that memory was updated.

## 13. Existing functionality assessment

| Capability | Decision | Direction |
|---|---|---|
| Authentication and owner boundaries | Preserve | Reuse for private sessions and saved learning items |
| Onboarding languages, level, and purpose | Adapt | Add session goal, feedback, and accessibility context |
| General AI chat | Replace as destination | Reuse bounded conversation plumbing inside Context Studio |
| AI deck-study chat | Adapt | Reuse selective tutor interaction, not deck-centred behavior |
| LexiCoon | Adapt | Convert from standalone lookup into contextual phrase panel |
| AI deck generation | Adapt | Reuse bounded generation infrastructure for source text, not automatic deck creation |
| Deck/card CRUD | Defer in this slice | Keep available as supporting tools |
| FSRS review scheduling | Preserve and adapt later | Use only for learner-selected delayed review |
| TTS | Adapt | Sentence and phrase audio with deterministic fallback |
| STT and transcript input | Adapt | Optional conversation input with transcript confirmation |
| Current flashcard-first navigation | Replace | Context Studio and missions become primary practice entries |
| Existing dashboard | Replace later | Personalized next-action home remains roadmap work |
| Gamification | Defer | Do not add rewards before meaningful evidence exists |
| Raccoon | Defer to minimal state feedback | Guide, help, and completion states only |

## 14. Success metrics and guardrails

### Pilot metrics

- session completion;
- demonstrated text comprehension;
- focus phrases understood in context;
- phrases used independently;
- learner corrections to familiarity states;
- accepted/saved/started versus dismissed recommendations;
- conversation completion;
- hints per completed attempt;
- changed-retry improvement;
- return to saved phrases;
- perceived usefulness;
- highlight disable or reduction rate.

### Eight-session owner pilot threshold

Continue toward implementation expansion if:

- at least six sessions are completed;
- at least five sessions produce one relevant independent phrase use;
- at least six sessions receive usefulness of 4/5 or higher;
- the resulting next action is accepted or saved in at least five sessions;
- no AI or audio failure blocks completion;
- no more than two sessions require highlights to be disabled because of overload.

These thresholds test usefulness and usability, not learning efficacy.

### Guardrails

- Zero irreversible automatic known/unknown decisions.
- Maximum five visible suggested items by default.
- Zero reliance on color alone.
- Zero pronunciation claims from transcript-only evidence.
- Zero persistent raw audio by default.
- Zero full-conversation retention without explicit consent.
- Every AI inference is distinguishable from learner-confirmed knowledge.
- Incorrect phrase segmentation is correctable.
- Repeating a phrase without contextual relevance does not count as independent use.
- Saving vocabulary without later active use does not count as learning success.
- Provider budget exhaustion activates fallback rather than paid overage.

## 15. Explicit v1 non-goals

- Replacing the approved workplace self-introduction mission.
- Full web-page, PDF, subtitle, video, or URL import.
- Automatic analysis of every word.
- Exhaustive dictionary information.
- Permanent automatic vocabulary levels.
- Pronunciation or accent scoring.
- Fully adaptive curriculum sequencing.
- Multiple simultaneous source documents.
- Shared texts, public libraries, social features, or multiplayer.
- Complex rewards, streak economies, or collectible systems.
- Automatic deck creation from every selected phrase.
- Long-term storage of complete texts or conversations by default.
- Offline AI generation or unrestricted chatbot behavior.

## 16. Decisions requiring owner approval

1. Approve Context Studio as a dogfood precursor, not a replacement for the workplace mission.
2. Approve Option C and the proposed 10–15 minute scope.
3. Approve phrases and patterns as primary tracked concepts, with words secondary.
4. Approve the six familiarity states and evidence dimensions.
5. Approve a default maximum of five highlights and three active focus items.
6. Approve typed-first conversation with optional voice and mandatory typed fallback.
7. Approve session-only source and conversation data by default.
8. Decide whether explicitly saved source texts retain both original and adapted versions.
9. Approve the eight-session pilot and continue/stop thresholds.
10. Approve preparation of UX, AI, and architecture specifications; this approval would still not authorize implementation.

## 17. Downstream brief — UX/UI

### Objective

Design one coherent responsive workspace that preserves reading focus while making contextual help, conversation, selected phrases, and review immediately reachable.

### Fixed product decisions

- Primary reader with contextual secondary tools.
- Maximum five default highlights.
- Phrase-first interaction.
- Six familiarity states.
- Collapsible conversation.
- Desktop contextual side panel; mobile bottom sheet or sequential panel.
- No color-only communication.
- No more than one dominant action.

### Required states

- empty source;
- pasted/written source;
- generating;
- adapting;
- source-editing;
- ready;
- reading;
- item selected;
- panel loading/error;
- conversation active;
- AI unavailable;
- audio unavailable;
- speech denied/unsupported;
- save failure;
- review;
- deletion confirmation.

### UX acceptance criteria

- Opening and closing a phrase restores focus and reading position.
- A learner can complete the whole flow by keyboard at 320px width.
- The first panel viewport contains contextual meaning, phrase meaning, explanation, audio, and learner controls.
- Disabling highlighting does not remove access to saved focus items.
- AI and audio failures produce understandable continuation paths.
- Original and adapted text cannot be confused or overwritten.

## 18. Downstream brief — AI Learning and Safety

### Bounded operations

- text generation;
- text adaptation;
- phrase/pattern candidate extraction;
- contextual explanation;
- conversation turn generation;
- response evaluation;
- independent-use suggestion.

### Required boundaries

- Learner text is untrusted content.
- Source text cannot change system behavior.
- Every output is bounded, schema-validated, and rejectable.
- AI returns candidates and confidence, not profile mutations.
- Conversation receives only the required source excerpt, goal, level, selected items, and recent evidence.
- One response produces at most one priority correction.
- Recommendation policy remains deterministic.
- Provider usage requires persistent per-user and global limits before public exposure.
- Prompts, full texts, transcripts, and raw provider bodies are excluded from operational logs.

### Evaluation fixtures

Include:

- correct target phrase use;
- relevant paraphrase;
- meaningless repetition;
- acceptable variant;
- phrase omitted but response valid;
- ambiguous segmentation;
- learner challenges AI;
- low-confidence correction;
- prompt injection inside pasted text;
- provider timeout;
- malformed model output;
- transcript edited by learner.

### Release gates

- No high-confidence incorrect classification in the initial owner fixture set.
- Malformed output always enters fallback.
- Transcript-only input never creates pronunciation evidence.
- The learner can correct every inference.
- Conversation can finish after provider failure.

## 19. Downstream brief — Architecture and Engineering

### Required conceptual boundaries

- `Source Workspace`: original and adapted content lifecycle.
- `Concept Candidate Service`: phrase/pattern candidates and confidence.
- `Context Explanation Service`: bounded contextual help.
- `Conversation Session`: turn limits, goals, focus items, and completion.
- `Evidence Service`: immutable observed events.
- `Learner Decision Service`: familiarity, save, ignore, correct, and delete.
- `Signal Service`: accepted or repeated evidence only.
- `Recommendation Service`: deterministic next-action policy.
- `Provider Gateway`: reservations, limits, retry reconciliation, redacted metadata, fallback.
- `Retention Service`: session cleanup, consented persistence, export, and deletion.

### Implementation dependencies

1. Approve product scope and retention policy.
2. Reconcile target concepts with the existing learning-event model.
3. Define owner-only source/session/evidence boundaries and RLS tests.
4. Implement durable provider reservations and hard stops.
5. Define idempotent session transitions.
6. Build deterministic non-AI completion before provider enhancements.
7. Add bounded generation, adaptation, explanation, and conversation individually.
8. Validate desktop/mobile accessibility and the owner pilot.

Do not force this workspace into the existing `deck/card` model. Deck review may consume learner-selected concepts later, but source content, evidence, and conversation require separate product semantics.

## HANDOFF TO COMMAND CENTER

**Decision:** Approve “LingoCoon Context Studio,” Option C, as an eight-session owner dogfood slice before—but not instead of—the approved workplace mission.

**Evidence:** Current documentation requires contextual production, bounded AI, structured evidence, learner control, deterministic recommendations, four-skill progression, and privacy-aware retention. Current source provides reusable chat, LexiCoon, TTS, STT, authentication, and review infrastructure but no unified contextual learning workspace.

**Dependencies:** retention decision, event/concept alignment, owner-only data boundaries, durable provider limits, deterministic fallback, and UX accessibility contract.

**Conflicts resolved:** typed-first Context Studio does not weaken the speaking-first strategy because it is an exploratory learner-created activity, while the workplace mission remains the first complete four-skill slice. Voice remains optional and testable inside Context Studio.

**Risks:** feature detour, visual overload, false familiarity, incorrect segmentation, uncontrolled retention, provider dependency, and reproducing a generic chatbot. The bounded scope and pilot thresholds are intended to expose these risks early.

**Verification:** documentary/source inspection only; no implementation tests were applicable. Git status showed branch `security-enforcement` with no reported working-tree changes.

**Exact next action:** owner approves or rejects decisions 1–10 above. On approval, Command Center may commission the three downstream specifications while keeping implementation separately approval-gated.

> User context
>
> Attachments:
> - TASK ID: LC-RESEARCH-003 Title: Evidence review for Context Studio — contextual…: `~/.codex/attachments/18440d3c-f228-484b-ab9a-0df66af0eb96/pasted-text.txt`

<details><summary>11 previous messages</summary>

> Leggo l’incarico allegato e verifico subito competenze richieste, fonti ammesse e confine read-only. Poi imposterò la ricerca solo sulle decisioni che possono cambiare concretamente il design di Context Studio.
>
> <details><summary>Explored a file</summary>
>
> - Read `~/.codex/attachments/18440d3c-f228-484b-ab9a-0df66af0eb96/pasted-text.txt`
>
> </details>
>
> La correzione è fondata: qui il comportamento attuale dei concorrenti e le evidenze sull’interazione possono cambiare la decisione. Userò `$lingocoon-research` come metodo principale, poi `$lingocoon-product`, `$learning-feature-design`, `$adaptive-path-evaluation` e `$lingocoon-ux` per trasformare le fonti in un MVP verificabile. Rimango read-only e non valuterò prezzi salvo quando incidono direttamente sulla fattibilità del prototipo.
>
> <details><summary>Ran a command</summary>
>
> - Ran `git status --short --branch && sed -n '1,260p' AGENTS.md && sed -n '1,320p' .agents/project/AGENTS.md && sed -n '1,260p' .agents/README.md && for f in .agents/skills/lingocoon-research/SKILL.md .agents/skills/lingocoon-product/SKILL.md .agents/skills/learning-feature-design/SKILL.md .agents/skills/adaptive-path-evaluation/SKILL.md .agents/skills/lingocoon-ux/SKILL.md; do sed -n '1,360p' "$f"; done`
>
> </details>
>
> `$lingocoon-ux` aggiunge un vincolo concreto: prima di confrontare i pattern visivi devo leggere il sistema visuale LingoCoon e valutare focus, layout a 320 px, semantica e alternative al colore. Carico quindi quel riferimento e le decisioni prodotto correnti prima della ricerca esterna.
>
> <details><summary>Explored a search, ran a command</summary>
>
> - Ran `sed -n '1,280p' .agents/skills/lingocoon-minimal/SKILL.md && for f in docs/product/vision-and-principles.md docs/product/learning-profile-v1.md docs/product/first-learning-mission.md docs/product/roadmap.md docs/architecture/learning-engine.md docs/design/ux-principles.md docs/design/visual-system.md docs/decisions/decision-log.md; do printf '\n--- %s\n' "$f"; sed -n '1,360p' "$f"; done`
>
> <details><summary>Explored a search</summary>
>
> - Searched for `Competitor cues|Duolingo|Praktika|Language Reactor|DuoCards|LingQ|Readlang|contextual|flashcards` in `MEMORY.md`
>
> </details>
>
> </details>
>
> La ricerca sarà divisa in tre blocchi: prodotti di lettura contestuale, passaggio lettura→conversazione, e letteratura su glosses/formulaic language/retrieval-feedback. Considererò le pagine ufficiali come prova del comportamento dichiarato; recensioni e discussioni serviranno solo per individuare problemi ricorrenti, mai per confermare una funzionalità.
>
> <details><summary>Searched the web</summary>
>
> Searched the web for `site:lingq.com official import lessons click words known words vocabulary review LingQ ...`
>
> Searched the web for `Readlang official web reader translate words phrases flashcards import text features ...`
>
> Searched the web for `VocabTracker official website reader known words learning status features ...`
>
> Searched the web for `site:blog.duolingo.com video call roleplay AI conversation feedback official ...`
>
> Searched the web for `Praktika official AI language tutor personalized conversations feedback scenarios site:praktika.ai ...`
>
> </details>
>
> Le prime fonti mostrano già una tensione importante: i reader maturi rendono il testo interattivo, ma spesso comprimono “conoscenza” in stati parola-colore; i tutor AI maturi, invece, ottengono coerenza attraverso obiettivi, turni limitati e prompt separati, non attraverso chat libera. Verifico ora se la letteratura sostiene glosses, unità multi-parola, produzione e feedback selettivo, senza estendere le conclusioni oltre gli studi.
>
> <details><summary>Searched the web</summary>
>
> Searched the web for `meta-analysis glosses second language reading vocabulary acquisition DOI paper ...`
>
> Searched the web for `input enhancement highlighting second language reading meta analysis visual input enhancement study ...`
>
> Searched the web for `site:reddit.com/r/languagelearning LingQ too many blue words known unknown highlighting clutter ...`
>
> Searched the web for `LingQ forum too many highlighted words blue known automatically issue ...`
>
> Searched the web for `site:w3.org/WAI WCAG use of color 1.4.1 text selection highlights non color ...`
>
> Searched the web for `site:lingq.com pricing free plan official LingQ 2026 ...`
>
> Searched the web for `site:cambridge.org core second language vocabulary retrieval practice production recall study ...`
>
> </details>
>
> Context compaction
>
> Source: automatic
> Status: completed
</details>

# LC-RESEARCH-003 — Context Studio Evidence Review

## Executive decision

**Build Context Studio, but narrow LC-PRODUCT-002 to a manual-first integrated thin slice.**

Recommended first sequence:

> Paste or write text → manually select a phrase → inspect a concise contextual explanation → choose up to three focus phrases → complete a three-turn source-grounded discussion → review evidence and choose what to retain.

Do not begin with automatic whole-text analysis, persistent colored familiarity states, AI-generated learner memory, or automatic known/unknown inference. Those features add classification errors, visual noise, accessibility risk, and AI cost before the core learning bridge has been validated.

This slice should precede—but not replace—the approved workplace self-introduction mission. It tests whether learner-owned context can produce useful four-skill practice and reusable learning evidence.

Evidence status:

- **Verified:** Repository decisions, documented competitor behavior, learning research, accessibility standards.
- **Secondary evidence:** Recurring user-reported problems across forums and public discussions.
- **Proposal:** The narrowed product sequence and evidence model below.
- **Unresolved:** Exact thresholds, text limits, and whether automatic phrase suggestions improve the experience.

---

## 1. Research question and decision

The relevant product gap is not another reader, vocabulary highlighter, or open AI chat. It is the transition from:

> “I encountered a useful expression in something I care about”

to:

> “I understood it, heard it, used it, received focused feedback, and generated evidence that can improve later practice.”

The verified market patterns split into two groups:

- Contextual readers connect source material to translation, vocabulary collection, and review.
- AI-speaking products connect scenarios to bounded conversation and corrective feedback.

The bridge between a learner-selected source phrase and immediate, controlled spoken production is underrepresented in the reviewed primary evidence. That is the credible differentiation opportunity.

---

## 2. Competitive evidence matrix

Official documentation confirms product behavior, not independent efficacy. “Not verified” means the reviewed primary sources did not substantiate the capability.

| Product | Input / AI generation | Phrase and context support | Familiarity / highlighting | Conversation and speaking | Memory, review, control | Accessibility / free access | Strongest pattern / main weakness / confidence |
|---|---|---|---|---|---|---|---|
| **LingQ** | Imports web content, text and supported media; no relevant AI generation verified | Words and phrases up to eight words; sentence view, contextual translation, audio | Unseen words blue; saved items use learning states; untouched words may become known on page change | No source-grounded conversation verified | Editable states, vocabulary review and SRS; automatic advancement exists | Color-heavy model requires non-color redundancy; free tier limits saved words and imports | Strong contextual reading and repeated encounters. Weakness: dense word-state model and possible false “known” classifications. **High confidence.** [Official guide](https://www.lingq.com/how-to-use-lingq/) · [iOS documentation](https://www.lingq.com/en/ios-app-support/) · [pricing](https://www.lingq.com/en/signup/) |
| **Readlang** | Plain-text/web reading; AI contextual explanations | Inline word or phrase translation; contextual explanation; editable vocabulary | Selected items are highlighted and collected | Separate Ami AI conversation and mistake practice; source-text continuity not verified | Vocabulary edit, delete, star and export; SRS flashcards | Relatively clean reader; free limits apply to phrases, explanations and highlights | Strong low-friction lookup. Weakness: lookup-to-flashcard funnel and saved meanings can become wrong in a different context. **High confidence.** [Features](https://readlang.com/features) · [pricing](https://readlang.com/pricing) |
| **Language Reactor** | Streaming media and web-text interaction; contextual AI explanations | Sentence-aligned subtitles, dictionary, examples and context-preserving exports | Optional learning-stage underlines; previous multi-color system was simplified and can be disabled | Sentence review exists; source-grounded AI conversation not verified | Saves phrases and words with or without context; exports to Anki | Optional coloring helps reduce clutter; mobile reading support remains limited in reviewed evidence | Strong source/audio alignment and optional visual states. Weakness: text-to-production bridge and phrase handling remain incomplete. **High confidence.** [Product](https://www.languagereactor.com/?pubDate=20250511) · [word-state documentation](https://www.languagereactor.com/help/saving-words-transition) · [exports](https://www.languagereactor.com/help/export) |
| **Migaku** | Imports sites, media, subtitles and clipboard text; AI translation and explanation | Interactive text, sentence mining, dictionaries, images and audio | Tracks known vocabulary and estimates comprehension | No verified source-derived conversation flow | Rich one-click cards and SRS; custom dictionaries | Feature-dense interface; free access is primarily a trial | Strong media-to-rich-card capture. Weakness: complexity and a card-production orientation unsuitable as LingoCoon’s core. **High confidence.** [Official features](https://migaku.com/faq/features) |
| **VocabTracker** | Analyses web pages through an extension | Words, phrases, lemmas, variants and custom dictionaries | Colors vocabulary by familiarity | No conversation or speaking verified | Flashcards, SRS and CSV export; vocabulary learning data retained for statistics | Sparse accessibility documentation; current pricing not verified | Strong lemma and phrase tracking across sites. Weakness: colored word-state tracker rather than an integrated four-skill loop. **Medium confidence.** [Extension listing](https://chromewebstore.google.com/detail/vocab-tracker/dmnblpfefmpaflamlfgmimhkmdmhlcda?hl=en-GB) · [privacy](https://www.vocabtracker.com/privacy.html) |
| **Learning With Texts** | Local/self-hosted text import with optional audio | Words and multiword expressions; translation and sentence context | Explicit unknown, learning, learned, well-known and ignored states | No AI conversation | Manual editing, contextual tests, exports and review | Free and local, but legacy frame-based interaction and dense coloring create usability concerns | Strong transparent, editable, zero-budget vocabulary model. Weakness: setup burden, dated interaction and no production bridge. **High confidence.** [Official documentation](https://hapepo23.github.io/lwt/info.htm) · [current project](https://github.com/HugoFara/lwt/blob/main/README.md) |
| **Duolingo** | Platform-created scenarios and AI-generated turns | Not based on learner-imported source material | Not applicable to the reviewed conversation flow | Bounded opening, prompt, finite conversation and closing; roleplay follows scenario constraints | Describes extracting learner facts from transcripts; reviewed source does not demonstrate granular learner controls | Advanced AI conversation is associated with paid Max access | Strong bounded conversation orchestration. Weakness: opaque memory and no learner-source bridge. **Medium-high confidence.** [Video Call design](https://blog.duolingo.com/ai-and-video-call/) · [Roleplay design](https://blog.duolingo.com/chatbot-language-practice/) |
| **Speak** | Prepared lessons and goal-based roleplays | Scenario context rather than imported text | Not applicable | Voice or typed roleplay, hints, translation, formative correction and immediate retry | Tracks course progress; detailed learner-memory controls not verified | Voice architecture is comparatively costly; advanced access varies | Strong objective–hint–retry interaction. Weakness: real-time voice complexity and no verified source-text workflow. **High confidence.** [Roleplay help](https://help.speak.com/en/articles/13182402-free-talk-immersive-roleplay) · [roleplay design](https://www.speak.com/blog/live-roleplays) |
| **Praktika** | AI-personalized lessons and scenarios | Learner interests and goals inform practice; imported-source support not verified | Not applicable | Speaking-oriented AI tutors and roleplay | Describes persistent memory of goals, preferences and mistakes; evidence comes from product and partner case studies | Free entry is advertised; accessible interaction and durable free limits not established | Strong contextual personalization timing. Weakness: AI dependence and opaque inferred memory. **Medium confidence.** [Praktika 4.0](https://praktika.ai/blog/praktika-4-0) · [OpenAI case study](https://openai.com/index/praktika/) |

### Competitive conclusion

Patterns worth retaining:

- On-demand meaning close to the original source.
- Manual phrase selection.
- Saving the complete phrase with its sentence context.
- Optional audio and one concise example.
- Bounded conversation with a clear objective and finite ending.
- Formative correction that does not punish exploration.
- Immediate retry with a changed prompt.
- Learner ability to edit, ignore, or remove saved material.

Patterns requiring modification:

- Replace global word status with evidence attached to a phrase in a particular context.
- Replace automatic collection after lookup with explicit “Focus” selection.
- Make highlighting optional and sparse.
- Separate correction from recommendation and durable learning-state changes.
- Make any AI-generated explanation or inference visibly uncertain and editable.

Patterns to reject:

- Treating every unseen word as unknown.
- Automatically marking untouched words as known.
- Whole-text red/amber/green classification.
- Saving every lookup.
- Open-ended generic chat.
- Extracting durable personal facts from transcripts without explicit controls.
- Promoting an item to “known” after one correct answer.
- Requiring AI, voice recognition, or rich media for session completion.

---

## 3. Learning evidence matrix

| Claim | Evidence | Important limitation | Context Studio implication |
|---|---|---|---|
| Contextual glosses can improve incidental vocabulary learning | Meta-analyses report better vocabulary outcomes for glossed than non-glossed reading. [Yanagisawa et al., 2020](https://eric.ed.gov/?id=EJ1251024) · [Frontiers meta-analysis, 2026](https://www.frontiersin.org/journals/language-sciences/articles/10.3389/flang.2026.1815571/full) | Effects vary by format, prior knowledge, exposure and assessment | Offer an on-demand contextual explanation; do not equate opening it with learning |
| More media is not automatically better | Multimodal-gloss research found benefits from adding modes, but more than two modes was not necessarily useful. [Ramezanali et al., 2021](https://onlinelibrary.wiley.com/doi/abs/10.1002/tesq.579) | Results do not prescribe a specific UI | Default to meaning plus optional audio; collapse grammar, register and additional examples |
| Multiword units are meaningful learning targets | Review evidence treats multiword units as important building blocks. [Schulz, 2023](https://bera-journals.onlinelibrary.wiley.com/doi/10.1002/rev3.3413) | Evidence does not prove that every product should be phrase-first | Allow phrases and patterns as first-class items while retaining word lookup as support |
| Active need, search, evaluation and use matter | Involvement Load research associates task engagement characteristics with vocabulary outcomes. [Meta-analysis](https://onlinelibrary.wiley.com/doi/10.1111/lang.12444) | The construct does not validate one exact product sequence | Manual selection and meaningful phrase use are stronger evidence than passive exposure |
| Reading should not be interrupted continuously | Extensive-reading evidence supports broad benefits while showing substantial implementation variation. [Meta-analysis, 2025](https://link.springer.com/article/10.1007/s10648-025-10068-6) | Context Studio is intensive practice, not an extensive-reading programme | Keep the source readable and explanations learner-triggered |
| Corrective feedback is useful when focused | Corrective-feedback research generally supports feedback, including selective approaches. [Meta-analysis, 2024](https://doi.org/10.1016/j.learninstruc.2024.101961) | Most evidence does not validate unconstrained AI correction | Give one high-value correction and one changed retry, not an exhaustive error list |

The research supports contextual assistance, phrase-level learning, active use and focused feedback. It does **not** justify automated whole-text classification, an elaborate mastery score, or autonomous AI learner-memory writes.

---

## 4. Secondary user evidence

Recurring reports across product communities identify four risks. These are useful signals, not representative prevalence estimates.

1. **Saved meanings become wrong outside their original context.** Readlang and Language Reactor users request editable or context-specific meanings. [Readlang report](https://forum.readlang.com/t/tapping-on-a-word-overwrites-custom-definitions-translations/1200) · [Language Reactor report](https://forum.languagelearningwithnetflix.com/t/premium-feature-editing-definitions-of-saved-items-to-allow-for-human-translation-text-reader-mode-uses-machine-translation-more-accurate-translations/14400)

2. **Automatic known-word accounting creates mistrust.** LingQ users report unwanted classification when changing pages and inflated counts from names or irrelevant tokens. [Example discussion](https://forum.lingq.com/t/can-i-switch-pages-while-listening-to-lessonspodcasts-without-the-blue-highlighted-words-being-added-to-my-vocabulary/484518)

3. **Saving and phrase boundaries are difficult to understand.** Users report ambiguity about whether multiword selections were actually retained. [Readlang phrase report](https://forum.readlang.com/t/multi-word-phrases-are-not-automatically-saved-to-word-list/3187)

4. **AI conversation can overcorrect, forget context, or present stylistic preferences as errors.** This appears repeatedly in language-learning discussions, but remains anecdotal. [Example discussion](https://www.reddit.com/r/languagelearning/comments/1bfbgf6)

Product implication: every durable state must be visible, reversible and attributable to either learner action or specific observed evidence.

---

## 5. Recommended Context Studio thin slice

### Entry and source

- Learner pastes or writes approximately 100–400 words.
- Original text remains visually dominant and is not rewritten automatically.
- AI generation or level adaptation is absent from the first dogfood build.
- Text is session-only by default; retaining it requires an explicit save action.

### Phrase selection and context panel

The learner manually selects a word or phrase. The panel shows:

1. Selected phrase.
2. Original sentence.
3. Concise contextual meaning.
4. Whole-phrase explanation rather than isolated token meanings.
5. Optional audio.
6. Actions: **Focus**, **Familiar here**, **Ignore**, **Edit**.
7. Grammar, register and additional examples behind progressive disclosure.

Opening the panel records an observation such as `meaning_viewed`; it does not automatically save the phrase or classify competence.

### Focus set

- Maximum three focus phrases per session.
- Selection remains learner-controlled.
- Word-level lookup is allowed, but productive practice uses the complete phrase or pattern.
- The source visibly identifies focused phrases using an underline plus icon or label—not color alone.

### Three-turn grounded discussion

The conversation remains bounded by the source and focus phrases:

1. **Comprehension:** respond to something stated or implied by the source.
2. **Personal application:** connect the idea to the learner’s experience or opinion.
3. **Transfer:** answer a changed question where one focus phrase could be useful.

The learner is not required to reproduce an exact phrase. A valid paraphrase remains successful; phrase use is captured separately.

Each turn can provide:

- Replay or text fallback.
- A concise hint.
- Translation on request.
- “Change question.”
- Typed response when speaking is unavailable.

Feedback after the sequence:

- One demonstrated strength.
- One high-value correction.
- One changed retry.
- No broad personality, proficiency, or mastery inference.

### Four-skill connection

- **Reading:** original source and contextual rereading.
- **Listening:** optional phrase audio plus spoken discussion prompts; transcript always available.
- **Speaking:** preferred response mode for the three turns.
- **Writing:** typed fallback and short final reformulation.

A learner can complete the session without microphone access or external AI availability.

---

## 6. Familiarity and evidence model

Do not launch with a single “known/unknown” field.

Store or display distinct evidence:

| Evidence | Source | Meaning |
|---|---|---|
| `meaning_viewed` | Observed action | Learner requested support |
| `focus_selected` | Explicit learner decision | Learner wants active practice |
| `learner_marked_familiar_here` | Explicit learner decision | Phrase felt familiar in this source |
| `used_with_support` | Observed performance | Used after a hint, model or visible phrase |
| `used_independently` | Observed performance | Used appropriately without direct support |
| `recalled_later` | Observed delayed performance | Produced or recognized in a later context |
| `learner_correction` | Explicit correction | Learner corrected meaning, phrase boundary or recommendation |
| `ignored` | Explicit learner decision | Exclude from current recommendations |

An AI interpretation—such as “appropriate phrase use”—must retain its confidence and evidence reference. It cannot overwrite learner-entered information.

“Reliable in context” should remain a future derived recommendation requiring repeated and preferably delayed independent evidence. It should not be a first-slice button or color.

---

## 7. Reassessment of the three MVP shapes

| Option | What it validates | Main limitation | Decision |
|---|---|---|---|
| **Reader-first** | Selection, explanations and low-distraction reading | Does not validate the reading-to-production promise | Reject as the complete slice; preserve its reader interaction inside the integrated slice |
| **Conversation-first** | Prompt quality and speaking interaction | Recreates the existing chat problem without learner-owned context | Reject |
| **Original integrated slice** | Complete loop, including automatic analysis and familiarity | Too many coupled hypotheses; high AI, accessibility and state-model risk | Narrow |
| **Manual-first integrated micro-slice** | Whether one learner-selected phrase can travel from source to supported use and reusable evidence | Less initial automation; may feel effortful | **Recommended** |

Automatic text-wide phrase detection and colored familiarity should be postponed until manual sessions reveal:

- What learners actually select.
- How often proposed boundaries need correction.
- Whether selection effort causes abandonment.
- Which evidence is meaningful enough to support later recommendations.

This is a narrower, safer version of LC-PRODUCT-002, not a reversal of its integrated direction.

---

## 8. Accessibility, privacy and zero-budget constraints

Accessibility requirements:

- Never communicate familiarity through color alone. WCAG requires another perceptual cue. [WCAG 2.2: Use of Color](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html)
- At 320 CSS pixels, move from reader-plus-panel to a sequential single-column view without losing the selected source position. [WCAG: Reflow](https://www.w3.org/WAI/WCAG21/Understanding/reflow)
- Return keyboard focus to the selected phrase when the panel closes.
- Provide visible focus, semantic buttons, screen-reader descriptions, reduced motion and complete text alternatives for audio.
- Do not render every word as an interactive element.
- Keep conversation controls and correction announcements keyboard and screen-reader accessible.

Privacy and cost:

- Source text, raw audio and full conversation remain session-only by default.
- Persist only explicitly saved source material, learner decisions and minimal structured evidence.
- Do not derive interests, employment details or personal facts from conversations.
- Do not require STT, TTS or generative AI to complete a session.
- Deterministic fallback: manual note, source text, written prompts, self-review and explicit evidence controls.
- Cap AI calls per selection and conversation turn; repeated opening of a panel should reuse an existing session result.

---

## 9. Patterns by disposition

### Retain

- Learner-controlled source import.
- On-demand contextual meaning.
- First-class phrase selection.
- Source sentence preserved with saved material.
- Bounded roleplay structure.
- Hint, translation and changed retry.
- Editable and removable learning records.

### Modify

- Familiarity becomes multi-dimensional evidence.
- Highlighting becomes sparse, optional and non-color-dependent.
- Conversation becomes source-grounded and finite.
- Correction becomes selective and visibly distinct from recommendations.
- AI memory becomes evidence proposals requiring constrained validation or learner confirmation.

### Reject

- Automatic known-word promotion.
- Full-document vocabulary coloring.
- Lookup-equals-save.
- Single exposure as mastery evidence.
- Unrestricted chat as the primary learning activity.
- Hidden transcript-derived personal memory.
- Pronunciation judgments based only on uncertain transcription.
- AI-only completion paths.

### Prototype experimentally

- Zero versus up to three AI phrase suggestions.
- AI contextual explanation compared with learner-edited meaning.
- Suggested phrase-boundary correction.
- Independent-use detection.
- Later “reliable in context” thresholds.
- AI text generation and level adaptation.
- Voice mode after typed and browser-speech fallbacks work.

---

## 10. Dogfood and verification plan

Run five to eight owner sessions across varied texts and at least two difficulty levels.

Record:

- Session completion.
- Time to first phrase selection.
- Number of phrase-boundary corrections.
- Explanations edited or rejected.
- Focus phrases independently used.
- Hints requested.
- Reading-position losses.
- Unclear save/familiarity states.
- AI versus deterministic fallback completion.
- Whether the three-turn discussion felt grounded in the source.

Proceed to suggested phrase detection only if manual selection causes clear friction in at least two sessions. Do not create permanent automatic-analysis architecture before that test.

Initial directional success criteria:

- At least 80% of sessions reach review.
- At least one focus phrase is used independently in most completed sessions.
- No participant mistakes a lookup for a durable save.
- Every AI interpretation can be corrected or ignored.
- Full completion remains possible with typing and deterministic fallbacks.
- Original source position survives panel and conversation transitions.

These are pilot decision thresholds, not validated product KPIs.

---

## 11. Remaining uncertainty

Owner decisions still required:

1. Whether user-pasted copyrighted material may be persistently stored at all.
2. Which dictionary or lexical data can legally and sustainably support a zero-budget fallback.
3. Initial text-length ceiling.
4. Whether optional phrase audio belongs in the first dogfood build.
5. Whether learner edits become personal overrides only or reusable product feedback.
6. Minimum repeated evidence required before recommending “review later.”
7. Which target language and level should constrain the first evaluation.
8. Whether Context Studio remains an experimental workspace after the workplace mission or becomes one of its content-entry modes.

---

## Source authority and access record

All sources were accessed **2026-09-03**.

- **Primary product evidence:** official product sites, help centres, first-party feature documentation and first-party privacy pages linked in the competitor matrix.
- **Research evidence:** peer-reviewed meta-analyses and systematic reviews linked in the learning evidence matrix.
- **Standards:** W3C WCAG understanding documents.
- **Secondary evidence:** product support forums and public user discussions. These establish recurring failure patterns, not prevalence or efficacy.
- **Repository evidence:** current vision, learning profile, first mission, roadmap, learning-engine specification, decision log and documented repository behavior.
- No new external-system behavior, implementation, file modification or product efficacy claim was produced.

# HANDOFF TO COMMAND CENTER

**Decision:** Approve a manual-first integrated Context Studio dogfood slice.

**Scope:** Paste/write one short text; manual word/phrase selection; concise editable contextual explanation; up to three focus phrases; three-turn source-grounded discussion; one focused correction and changed retry; explicit structured evidence; typed and deterministic fallback.

**Preserved product decisions:** Speaking-first four-skill loop, workplace self-introduction as the first complete mission, flashcards as supporting practice, learner control, bounded AI, privacy by default, accessibility and zero budget.

**Deferred:** Whole-text analysis, colored familiarity maps, automatic phrase detection, AI text adaptation/generation, SRS scheduling, persistent AI learner memory, advanced pronunciation assessment, content library and complex rewards.

**Dependencies:** A UX interaction contract, AI input/output boundaries, evidence-event schema, retention rules, fallback dictionary decision and accessible responsive behavior.

**Key risk:** Expanding the first slice into an automated reader would create unvalidated state, cost and UI architecture before proving that source-to-speaking transfer is valuable.

**Verification:** Five to eight read-only-design-informed dogfood sessions using the metrics above, followed by a decision on phrase suggestions and persistent source storage.

**Next owner approval:** Approve or reject the narrowed manual-first integrated scope before UX, AI and Architecture produce implementation contracts.
