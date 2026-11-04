# Learning Data Model

## Status

Approved conceptual data baseline. The first-mission contract below is recommended for implementation approval; migrations remain separately approval-gated.

- Version: 1.1
- Last reviewed: 2026-08-30

## Entities

- **Learner profile:** languages, goals, interests, preferences, accessibility choices, and current hypotheses.
- **Skill progress:** progress and confidence for reading, writing, listening, and speaking.
- **Learning concept:** a vocabulary item, grammar pattern, pronunciation target, comprehension concept, or communication function.
- **Learning event:** normalized evidence produced by an activity or learner action.
- **Error signal:** a classified, confidence-scored observation linked to one or more concepts.
- **Learning session:** bounded group of activities with a goal and outcome.
- **Activity definition:** the purpose, skill, content, difficulty, and completion criteria for an activity.
- **Recommendation:** a proposed next activity with reason, priority, and learner response.

## Relationships

```text
Learner
  ├── Profile
  ├── Sessions
  ├── Skill progress
  ├── Learning events
  ├── Error signals ── Learning concepts
  └── Recommendations ── Activity definitions
```

## Evidence rules

- Store structured evidence before derived scores.
- Keep source activity and session references for explainability.
- Store confidence and evaluation method for AI-derived signals.
- Keep learner overrides separate from model inference.
- Do not merge acceptable variants into errors without evidence.
- Design identifiers and ownership rules before exposing data through actions or APIs.

## Privacy rules

- Collect only data needed for personalization, safety, or product operation.
- Define retention for transcripts, audio, prompts, and derived signals separately.
- Do not retain raw audio by default.
- Provide deletion and export paths in the final data design.
- Keep provider payloads minimal and document when data leaves the application.

## First-mission storage contract

The first vertical slice adds only four persistent resource families. Existing `profiles`, `decks`, `cards`, and `study_progress` remain unchanged until a migration plan is approved.

### Learning session

```ts
interface LearningSession {
  id: string; // UUID
  userId: string;
  missionKey: 'workplace-self-introduction-v1';
  status: 'active' | 'completed' | 'abandoned';
  targetLanguage: string;
  nativeLanguage: string;
  startedAt: string;
  completedAt: string | null;
  lastActivityKey: MissionActivityKey;
  contractVersion: 1;
}
```

Only one active session for the same user and mission key is required in v1. Resume and completion writes must be idempotent.

### Learning event

```ts
type MissionActivityKey =
  | 'orientation'
  | 'reading'
  | 'listening'
  | 'writing'
  | 'speaking'
  | 'retry'
  | 'review';

type LearningEventType =
  | 'activity_started'
  | 'activity_completed'
  | 'help_requested'
  | 'response_submitted'
  | 'evaluation_completed'
  | 'retry_completed'
  | 'recommendation_responded';

interface LearningEvent {
  id: string; // UUID
  userId: string;
  sessionId: string;
  activityKey: MissionActivityKey;
  eventType: LearningEventType;
  skill: 'reading' | 'listening' | 'writing' | 'speaking' | null;
  occurredAt: string;
  idempotencyKey: string;
  payload: LearningEventPayload;
  contractVersion: 1;
}

type LearningEventPayload =
  | {
      kind: 'activity_started';
      source: 'recommended' | 'free' | 'resume';
    }
  | {
      kind: 'activity_completed';
      outcome: 'completed' | 'skipped';
      elapsedMs: number;
    }
  | {
      kind: 'help_requested';
      helpType: 'hint' | 'translation' | 'replay' | 'slower_audio' | 'transcript';
      count: number;
    }
  | {
      kind: 'response_submitted';
      response:
        | { mode: 'choice'; selectedAnswerIds: string[] }
        | { mode: 'text'; text: string; retained: boolean }
        | { mode: 'voice'; confirmedTranscript: string; retained: boolean };
    }
  | {
      kind: 'evaluation_completed';
      evaluationId: string;
      method: 'deterministic' | 'ai' | 'hybrid';
      confidence: number;
    }
  | {
      kind: 'retry_completed';
      previousResponseEventId: string;
      improvement: 'improved' | 'unchanged' | 'uncertain';
    }
  | {
      kind: 'recommendation_responded';
      recommendationId: string;
      response: 'saved' | 'dismissed' | 'edited' | 'started';
    };
```

`idempotencyKey` is unique per user. `eventType` must equal `payload.kind`; the server rejects mismatches. The payload is a schema-validated discriminated union and may contain only:

- completion outcome and elapsed milliseconds;
- selected comprehension answer identifiers, never answer HTML;
- help type and count;
- bounded writing text or confirmed speech transcript when retention is allowed;
- evaluation identifier, method, and confidence;
- retry relation and improvement outcome;
- recommendation response.

Unknown keys are rejected. Payloads are capped before database insertion.

### Error signal

```ts
interface ErrorSignal {
  id: string; // UUID
  userId: string;
  sessionId: string;
  sourceEventId: string;
  conceptKey: string;
  category: 'vocabulary' | 'grammar' | 'pronunciation' | 'comprehension' | 'communication';
  observation: string;
  suggestedImprovement: string;
  confidence: number; // 0..1
  evaluator: 'deterministic' | 'ai' | 'learner';
  status: 'active' | 'resolved' | 'dismissed' | 'corrected_by_learner';
  createdAt: string;
  updatedAt: string;
  contractVersion: 1;
}
```

One evaluation creates at most one active priority signal in the first mission. The learner can dismiss or correct it. Repeated evidence may update priority later but must not silently change the original observation.

### Recommendation

```ts
interface Recommendation {
  id: string; // UUID
  userId: string;
  sourceSessionId: string;
  sourceSignalId: string | null;
  activityKey: string;
  reasonCode: 'retry_priority_error' | 'practice_weak_skill' | 'continue_goal' | 'complete_profile';
  reasonText: string;
  priority: number; // 1..100
  status: 'proposed' | 'saved' | 'dismissed' | 'completed' | 'replaced';
  createdAt: string;
  expiresAt: string | null;
  contractVersion: 1;
}
```

The recommendation builder, not the AI model, owns status, priority, persistence, and replacement behavior.

## Ownership and database invariants

- Every row carries `user_id`; callers never choose another user's identifier.
- Every table enables RLS and denies access by default.
- `SELECT`, `UPDATE`, and `DELETE` require `auth.uid() = user_id`.
- Every `INSERT` policy uses `WITH CHECK (auth.uid() = user_id)`.
- Child references must resolve to a parent owned by the same user.
- Foreign keys, uniqueness constraints, bounded text checks, and cascade behavior are versioned in migrations.
- Browser access is allowed only where the same invariant is enforced by RLS; privileged lifecycle operations remain server-side.

## Retention classes

| Data | Recommended v1 handling |
| --- | --- |
| Raw audio | Process in memory and do not persist by default. |
| Unconfirmed STT transcript | Keep in client/session memory only. |
| Confirmed transcript and writing response | Retain only when needed for learner review; exact duration requires approval before migration. |
| Structured learning events | Retain until account deletion or learner deletion unless a shorter legal/product limit is approved. |
| Error signals and recommendations | Retain until resolved, dismissed, deleted, or account deletion. |
| Provider request metadata | Retain only request ID, operation, latency, usage units, result, and timestamps; never prompt, audio, or transcript by default. |
| Pending onboarding data | Add a short expiry or use session storage; exact recovery window requires approval. |

## Required migration evidence

Before this contract becomes executable, the migration plan must include:

- generated database types rather than handwritten schema guesses;
- RLS tests for owner, different authenticated user, and anonymous user;
- concurrent idempotency and quota tests;
- deletion and export coverage for every new table;
- rollback behavior and existing-data compatibility;
- proof that no raw audio or unnecessary provider payload is persisted.
