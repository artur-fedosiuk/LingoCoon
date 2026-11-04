# LingoCoon UX Principles

## Status

Approved UX foundation. The first-mission flow below is recommended for implementation approval.

- Version: 1.1
- Last reviewed: 2026-08-30

## Core experience

- Make the next useful action obvious.
- Explain why the activity was recommended.
- Keep guided and free practice available from the same home.
- Make speaking visible as a core path, not a secondary control.
- Preserve learner agency: skip, retry, change difficulty, change topic, and dismiss recommendations.
- Use the raccoon to orient, encourage, and explain; never use it as decoration without purpose.

## Activity design

- Start with a realistic context.
- Use one primary task per screen.
- Give immediate feedback without interrupting every attempt.
- Prefer one high-value correction and a retry.
- Show progress by skill and goal, not only by points or completed cards.
- Keep loading, errors, and unavailable services understandable and recoverable.

## Accessibility

- Use semantic HTML before ARIA.
- Preserve visible focus states.
- Provide keyboard access to every action.
- Use labels and text in addition to color or icons.
- Target at least `44px` touch areas where practical.
- Support reduced motion and clear audio controls.
- Make transcripts, captions, replay, and speed controls available for listening activities.

## Personalization controls

The learner should be able to see and change:

- goals;
- topics;
- target skills;
- difficulty;
- feedback intensity;
- session duration;
- saved recommendations and error priorities.

Personalization must feel helpful rather than invasive. Explain recommendations without exposing unnecessary internal model details.

## First-release information architecture

The primary product hierarchy is:

```text
Home
├── Recommended mission
├── Continue active session
├── Review one priority
└── Create practice

Practice
├── Guided missions
├── Learner-created practice
├── Decks
└── LexiCoon

Progress
├── Reading
├── Listening
├── Writing
├── Speaking
└── Saved recommendations

Settings
├── Profile and goals
├── Learning preferences
├── Accessibility and audio
└── Privacy, export, and deletion
```

AI chat is not a top-level destination. AI appears inside a learning task with a visible purpose and bounded behavior.

## Personalized home specification

### Learner goal

Within five seconds, the learner should understand what to do next, why it was selected, how long it takes, and which skill or goal it supports.

### Content order

1. active-session resume card, when present;
2. one primary recommended mission with reason, duration, difficulty, and skills;
3. one priority review item, when useful;
4. four-skill progress summary using evidence and confidence rather than invented percentages;
5. guided and create-your-own practice entry points;
6. supporting tools such as decks and LexiCoon.

The page must not show several equal primary calls to action.

### Home states

| State | Primary behavior |
| --- | --- |
| New learner with completed onboarding | Recommend the first workplace-introduction mission and explain which profile answers shaped it. |
| Onboarding incomplete | Resume onboarding; do not fabricate a personalized recommendation. |
| Active mission | Resume at the last confirmed activity and offer restart or discard. |
| Returning learner with evidence | Recommend one next action tied to a visible goal or active signal. |
| No reliable recommendation | Offer the guided path and learner-created practice; explain that more evidence is needed. |
| Provider unavailable or budget exhausted | Offer a deterministic mission variant and state which feedback will be limited. |
| Load failure | Preserve navigation, show retry, and never replace the whole page with an indefinite spinner. |

### Recommendation card requirements

- outcome-focused title;
- one-sentence reason in learner language;
- duration, difficulty, and covered skills;
- primary `Start` or `Continue` action;
- secondary `Change` action for topic, skill, duration, or difficulty;
- `Why this?`, `Save`, and `Dismiss` controls where applicable;
- no reward claim before the learning outcome is completed.

## First-mission flow specification

### Shared shell

Every activity uses the same shell:

- mission title and current outcome;
- text-labelled progress, for example `Step 3 of 7: Writing`;
- one primary task region;
- contextual help that does not complete the task automatically;
- explicit back, exit, and save-state behavior;
- persistent transcript/audio controls where relevant;
- recoverable loading, offline, provider-failure, and save-failure states.

Back navigation must not silently submit, score, or lose a response. Exiting asks whether to save or discard only when unsaved evidence exists.

### Step 1 — Orientation

- Raccoon pose: guide.
- Show the workplace situation, outcome, estimated 5–10 minutes, four covered skills, and privacy note for voice.
- Allow difficulty and feedback-language adjustment before starting.
- Primary action: `Start mission`.

### Step 2 — Context reading

- Present a short workplace dialogue with a clear speaker structure.
- Optional phrase actions: meaning, pronunciation, and one example.
- Do not turn every word into an interactive control.
- Completion action confirms the learner is ready; opening help records a help event without penalty.

### Step 3 — Listening

- Use curated static dialogue audio for the first playback; slower replay remains available.
- Transcript is hidden initially but always accessible.
- Ask a small number of meaning questions using labelled controls.
- Missing static audio falls back to browser TTS; unavailable TTS falls back to transcript and reading-aloud guidance without blocking progress.

### Step 4 — Guided writing

- Prompt for a short self-introduction in one text area.
- Optional prompts are collapsed and never prefill a complete answer.
- Preserve the draft locally during the active session.
- Feedback shows one strength, one priority correction at most, confidence language, and `Accept`, `Dismiss`, or `Edit` controls.

### Step 5 — Speaking

- Primary action: `Start speaking`; recording never begins automatically.
- Show microphone state, elapsed time, stop, cancel, and privacy status.
- After transcription, the learner reviews and edits the transcript before evaluation.
- Ask one relevant follow-up question after the introduction.
- Provide replay, hint, retry, and typed speaking-mode fallback.
- Transcript-only evaluation never claims to measure pronunciation or accent.

### Step 6 — Retry

- Change one contextual detail so the learner must respond rather than repeat mechanically.
- Show the selected improvement target before the attempt.
- Compare only the priority target and task completion, not a long score table.
- Raccoon pose: coach before retry and encouragement after a meaningful attempt.

### Step 7 — Review

- Show one strength, one priority improvement, and one recommended next action.
- Explain the recommendation and offer `Start`, `Save`, `Change`, and `Dismiss`.
- Show what was saved and provide links to privacy controls.
- Celebration reflects completed communication, not AI confidence or raw activity count.

## Component and state requirements

- `MissionCard`: default, recommended, active, unavailable, loading, and error.
- `MissionProgress`: semantic ordered progress with current and completed labels.
- `ActivityPanel`: default, validating, submitting, feedback, and save-failed.
- `AudioPlayer`: play, pause, replay, slower speed, transcript, loading, and unavailable.
- `VoiceRecorder`: permission-prompt, ready, recording, processing, transcript-review, denied, unsupported, and failed.
- `PriorityFeedback`: strength, suggestion, confidence, accept, edit, dismiss, and retry.
- `RecommendationCard`: proposed, saved, dismissed, replaced, completed, and expired.
- `RaccoonFeedback`: guide, listening, thinking, coach, success, and recoverable-failure poses; it never contains the only explanation.

## Accessibility and responsive requirements

- Use headings and landmarks that preserve reading order without CSS.
- Announce recording and asynchronous result changes through concise live regions.
- Never place a destructive exit next to the primary continue action without separation.
- Keep focus on the triggering control during loading and move it to feedback only when the learner requests submission.
- Provide keyboard equivalents for recording, audio, hints, transcript, feedback, and navigation.
- Use captions/transcripts and labels in addition to icons, color, animation, and sound.
- At 320 CSS pixels, use one content column with no horizontal page scroll.
- The cookie notice must not obscure the primary task or trap focus.
- Respect reduced motion and avoid time-limited task completion.

## Learning and product events

Record only events defined in `docs/architecture/data-model.md`. The UX must emit:

- activity start and completion;
- help, transcript, replay, and slower-audio use;
- writing or confirmed-transcript submission;
- evaluation completion and confidence;
- retry result;
- recommendation response;
- recoverable provider and persistence failure categories without learner content.

Do not use attention tracking, hidden engagement scoring, or raw audio analytics.

## Acceptance criteria

- A new learner can identify the next action and its reason without opening a menu.
- All seven steps remain usable by keyboard and at 320px width.
- Speaking has transcript review, retry, permission-denied, unsupported-browser, and typed fallback states.
- AI, TTS, STT, and persistence failures never block mission completion.
- The learner can challenge or dismiss the priority correction and recommendation.
- No screen has more than one visually dominant primary action.
- Raccoon artwork communicates a state but never replaces instructions or feedback text.
- Automated accessibility checks and a manual screen-reader, keyboard, mobile, and reduced-motion pass are included in implementation verification.

## Open design decisions

Before UI implementation, approve:

1. desktop and mobile navigation labels;
2. whether progress displays evidence counts, confidence bands, or both in v1;
3. the exact transcript-retention consent control;
4. the original raccoon pose brief and asset production method;
5. whether the first release supports a fully offline deterministic mission or only provider-failure fallback.
