# LingoCoon Learning Profile v1

## Status

Approved product foundation.

- Version: 1.1
- Last reviewed: 2026-08-30

This document is the initial source of truth for LingoCoon's personalized learning system. It defines the product behavior before implementation begins.

## Product thesis

LingoCoon is a personalized language-learning coach, not a flashcard collection.

The app must combine:

- a structured path for learners who do not know what to study;
- a free path where learners can request whatever they need;
- an AI learning engine that connects both paths to one evolving learner profile;
- frequent practice of reading, writing, listening, and especially speaking.

The central product promise is:

> LingoCoon notices what each learner needs and creates the next useful practice activity.

## Personalization principles

1. Personalization is based on evidence, not only on onboarding preferences.
2. Every meaningful activity can update the learner profile.
3. A single mistake is a signal, not automatically a permanent weakness.
4. Repeated errors increase priority and trigger targeted practice.
5. The learner can inspect, correct, ignore, or prioritize recommendations.
6. The AI should propose the next action, but the learner remains in control.
7. Practice must move from recognition to independent production.
8. Speaking attempts should be treated as first-class learning events.
9. The system should prefer short, contextual activities over isolated drills.
10. The product must degrade gracefully when AI, speech recognition, or audio is unavailable.

## Learner profile

The profile contains only information needed to personalize learning.

### Onboarding data

- native language;
- target language(s);
- current self-assessed level;
- learning goals;
- preferred topics and interests;
- real-life situations the learner wants to handle;
- available time and preferred session length;
- preferred difficulty and feedback style;
- accessibility and interaction preferences.

Onboarding creates initial hypotheses. It must not permanently define the learner's ability.

### Evolving learning data

- skill progress for reading, writing, listening, and speaking;
- vocabulary familiarity and recall strength;
- grammar patterns and recurring errors;
- pronunciation and comprehensibility signals;
- comprehension difficulties;
- successful use of new language in context;
- hints and translations requested;
- retry and self-correction behavior;
- completed sessions and abandoned sessions;
- learner feedback on recommendations.

## Learning event model

Each activity should produce a normalized learning event where possible.

An event may contain:

- learner identifier;
- session identifier;
- activity type;
- target language;
- skill(s) involved;
- source content identifier;
- learner input;
- expected outcome, when applicable;
- detected error(s);
- confidence of the evaluation;
- hints used;
- retry result;
- timestamp;
- retention and privacy classification.

Raw audio and full transcripts must not be retained by default. Storage needs a defined purpose, retention period, and deletion path.

## Error model

Errors should be classified rather than stored as unstructured AI notes.

Initial categories:

- vocabulary meaning;
- vocabulary retrieval;
- word choice;
- grammar form;
- grammar agreement;
- sentence structure;
- spelling;
- listening comprehension;
- pronunciation;
- fluency or hesitation;
- task misunderstanding.

Each error should have:

- normalized concept or pattern;
- evidence references;
- occurrence count;
- recent occurrence count;
- last seen timestamp;
- confidence;
- current status: emerging, practicing, improving, or stable;
- next recommended review date;
- learner override, if provided.

The system must avoid overcorrecting dialect, acceptable variants, or stylistic choices. Uncertain evaluations should be presented as suggestions, not facts.

## AI learning engine

The AI engine has five responsibilities:

1. Understand the learner request or activity result.
2. Extract structured learning signals.
3. Update the learner profile using validated data.
4. Select or generate the next useful activity.
5. Explain the recommendation in clear language.

The AI must not directly write arbitrary profile data without schema validation, authorization, and bounded values.

### Recommendation inputs

- onboarding goals;
- recent performance;
- repeated errors;
- neglected skills;
- available time;
- desired difficulty;
- learner interests;
- previous activity variety;
- confidence and uncertainty of prior evaluations.

### Recommendation output

Every recommendation should include:

- activity type;
- purpose;
- target skill;
- target language items or patterns;
- estimated duration;
- difficulty;
- why it was selected;
- fallback activity;
- completion criteria.

The AI should generate activities from reusable learning primitives rather than returning an uncontrolled block of content.

## Structured path

The structured path is a personalized sequence of goals, not a fixed course.

Example goal:

> Handle a restaurant order in English at A2 level.

The AI can fill that goal with:

1. useful phrases in context;
2. a short reading dialogue;
3. listening comprehension;
4. guided writing;
5. a speaking response;
6. targeted correction;
7. a retry;
8. a delayed review.

The next activity should change according to evidence. A learner who already understands the dialogue should spend less time on recognition and more time speaking.

## Free path

The learner can request:

- a conversation about a topic;
- pronunciation practice;
- grammar explanation;
- correction of a text;
- preparation for a real situation;
- a listening exercise;
- vocabulary from an article or video;
- a custom lesson;
- a review of recent mistakes.

The free path must still produce structured events and recommendations when the learner consents to saving them.

## Speaking-first direction

Speaking is a primary product capability, not an optional microphone button.

The first AI speaking experience should be short and bounded:

1. The raccoon introduces a situation.
2. The AI asks one level-appropriate question.
3. The learner answers by voice.
4. Speech is transcribed.
5. The system evaluates meaning, target language use, and one priority correction.
6. The learner retries or continues.
7. The session ends after a defined number of turns.
8. The learner receives a concise review and one next step.

Evaluation must distinguish:

- linguistic correctness;
- comprehensibility;
- relevance to the task;
- vocabulary use;
- fluency signals.

It must not reward repeating a memorized sentence without responding to the conversational context.

## Gamification

Gamification should reward useful learning behavior:

- completing a meaningful task;
- speaking independently;
- improving after feedback;
- retrieving language after a delay;
- practicing a weak skill;
- returning consistently.

It should not reward:

- repeated meaningless submissions;
- excessive hint usage;
- speed alone;
- generating large amounts of content without practice.

The raccoon represents progress through expressions, reactions, small celebrations, and unlockable cosmetic elements. It must support the learning experience rather than distract from it.

## Initial product metrics

The first version should measure:

- first speaking attempt rate;
- completed learning missions;
- retry improvement rate;
- independent answer rate;
- repeated errors resolved;
- skill activity balance;
- seven-day return rate;
- recommendation acceptance rate;
- learner-reported usefulness;
- AI/STT latency and failure rate;
- AI usage per completed session.

The primary learning question is:

> Can the learner produce more useful language independently after repeated practice?

## Non-goals for v1

- live multiplayer;
- public profiles;
- competitive leaderboards;
- browser extension;
- large content marketplace;
- unrestricted AI agent behavior;
- storing all raw audio permanently;
- replacing expert review of learning design.

## Risks to resolve before implementation

- AI evaluations may be inaccurate or overconfident.
- Speech recognition may penalize accents or hesitant speech.
- Personalized content may become inconsistent without a curriculum model.
- Saving every error may create noisy or intimidating dashboards.
- AI generation can increase cost and latency.
- Voice and transcript data require strong privacy controls.
- Gamification can optimize activity instead of learning.
- A free-form AI experience can become entertaining but pedagogically weak.

## Definition of a successful first milestone

One complete mission works end to end:

- it starts from a learner goal;
- includes reading, listening, writing, and speaking;
- evaluates at least one response;
- records structured learning events;
- identifies one useful improvement target;
- recommends the next activity;
- allows the learner to override the recommendation;
- provides a clear, fast, accessible interface;
- works with a safe fallback when an AI dependency fails.

## Approved first mission

The first target is an adult beginner or early-intermediate learner practicing English through a 5–10 minute workplace self-introduction with 3–5 speaking turns. The canonical learning design and acceptance criteria are defined in [First Learning Mission](first-learning-mission.md).

Before product-code changes, complete:

- [x] audit the current application against the approved mission;
- [x] specify the event, error, recommendation, and AI contracts needed by that vertical slice;
- [x] specify the personalized home and mission-flow UX;
- [x] prepare a bounded technical implementation and verification sequence.

These planning artifacts are now defined in `docs/product/roadmap.md`, `docs/architecture/learning-engine.md`, `docs/architecture/data-model.md`, `docs/architecture/ai-contracts.md`, and `docs/design/ux-principles.md`. Their implementation choices remain subject to the approval gates recorded in those documents.
