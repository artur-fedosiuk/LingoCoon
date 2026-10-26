# Learning Engine

## Status

Approved conceptual architecture baseline. The first-mission state model below is recommended for implementation approval.

- Version: 1.1
- Last reviewed: 2026-08-30

## Responsibility

The learning engine connects learner intent and activity evidence to the next useful practice activity.

## Main flow

```text
Learner intent or activity result
        ↓
Normalize and validate input
        ↓
Extract learning signals
        ↓
Update learner profile
        ↓
Select or generate bounded activity
        ↓
Present activity and feedback
        ↓
Record outcome and schedule review
```

## Core responsibilities

- interpret onboarding data and free-form learner requests;
- classify evidence by skill and learning concept;
- distinguish emerging signals from repeated weaknesses;
- select a suitable activity type and difficulty;
- generate content from reusable learning primitives;
- evaluate learner responses with confidence;
- explain recommendations;
- schedule delayed review;
- expose learner controls for correction, dismissal, and customization.

## Recommendation policy

Recommendations should balance:

- learner goal relevance;
- repeated errors;
- neglected skills;
- recent activity variety;
- available time;
- difficulty and confidence;
- learner interests;
- review timing.

The engine must avoid recommending the same activity or phrase repeatedly without new evidence.

## Boundaries

- The AI cannot directly write arbitrary database fields.
- All model output is validated before profile updates.
- The engine must preserve the distinction between observed evidence, model inference, and learner preference.
- Uncertain evaluations remain uncertain in storage and presentation.
- Provider failures return a safe fallback activity where possible.

## Initial vertical slice

Implement only the flow needed for the first learning mission. Do not build a general autonomous agent before the event model, recommendation contract, and evaluation behavior are tested.

## First-mission state model

```text
not_started
  → orientation
  → reading
  → listening
  → writing_draft
  → writing_feedback
  → speaking_ready
  → speaking_recording
  → transcript_review
  → speaking_feedback
  → retry_ready
  → retry_feedback
  → review
  → completed
```

From every active state, the learner can move to `saved`, `abandoned`, or a recoverable `service_fallback` state. Only validated transitions are persisted. Refresh and duplicate submission return the last accepted state instead of creating duplicate evidence.

## First-mission responsibilities

| Component | Owns | Must not own |
| --- | --- | --- |
| Mission definition | Step order, content keys, target concepts, completion rules, fallback content. | User state, provider calls, or database access. |
| Mission service | Authorization, transition validation, idempotency, event writes, and session lifecycle. | Unvalidated AI interpretation. |
| Evaluation service | Bounded provider request, output validation, confidence, and usage reservation. | Recommendation persistence or profile mutation. |
| Signal service | Convert accepted evidence into zero or one priority signal for v1. | Raw audio retention or hidden learner scoring. |
| Recommendation service | Apply deterministic priority rules and learner preferences. | Inventing evidence or overriding learner dismissal. |
| UI | Collect consent, present state, and emit declared actions. | Authorization, quota decisions, or trusted progress calculation. |

## Deterministic v1 recommendation policy

Evaluate these rules in order and return one result:

1. if onboarding is incomplete, recommend profile completion;
2. if an active mission exists, recommend resuming it;
3. if the last mission produced a learner-accepted priority signal, recommend a changed retry focused on that concept;
4. if one core skill has materially less reliable evidence, recommend the matching guided activity;
5. otherwise recommend continuing the learner's selected goal with a varied activity type;
6. if evidence is insufficient, recommend the approved first mission and say why.

Dismissed signals and recommendations are excluded until new evidence or an explicit learner reset. AI may generate bounded activity content after a rule selects the purpose; it does not choose the rule outcome.

## Failure invariants

- A provider failure cannot advance an evaluated step as successful.
- A persistence failure cannot display progress as saved.
- A low-confidence evaluation cannot create an active error signal without learner confirmation.
- A skipped activity records the skip but does not fabricate evidence.
- A fallback completion remains a valid session outcome and explains which evaluation was unavailable.
- A deleted learner removes or anonymizes every owned session, event, signal, recommendation, and usage record according to the approved deletion contract.
