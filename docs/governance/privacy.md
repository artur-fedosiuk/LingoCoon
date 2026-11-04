# LingoCoon Privacy Baseline

## Status

Engineering privacy baseline; not legal advice or a final public privacy notice.

- Version: 1.0
- Last reviewed: 2026-09-02

## Principles

- Collect the minimum data needed for a defined learning or operational purpose.
- Keep user-provided facts, observed evidence, AI inference, and learner overrides distinct.
- Do not retain raw audio by default.
- Do not send unrelated profile or database identifiers to providers.
- Give learners understandable controls for correction, export, deletion, recommendation dismissal, and retention choices.
- Reverify provider terms, processing locations, retention, training use, and sub-processors before release.

## Current processing map

| Data | Purpose | Current location/recipient | Retention status |
| --- | --- | --- | --- |
| Account identity and session | Authentication | Supabase Auth and browser auth cookies | Controlled by Supabase/live settings; not fully documented |
| Profile/onboarding | Personalize language practice | Supabase `profiles`; pending onboarding in expiring browser storage | Pending draft expires after 24 hours; database retention lacks an executable deletion contract |
| Decks/cards/progress | Learner-created study and spaced repetition | Supabase PostgreSQL with owner RLS | Until deletion; product deletion/export flows not implemented |
| AI prompts/context/results | Tutor, dictionary, generation, translation | Application server and Gemini | Provider retention/training settings require current verification |
| TTS text/audio | Speech generation | Application server and Google Cloud Text-to-Speech; audio returned to browser | Owner-scoped generated audio in private Supabase Storage, 30-day expiry with scheduled cleanup; provider retention and hosted cleanup require verification before release |
| STT audio/transcript | Speech recognition | Application server and configured STT provider; transcript returned to browser | Application route does not persist raw audio; provider/log retention requires verification |
| Operational errors | Reliability and abuse investigation | Server/provider/deployment logs | No centralized minimization or retention contract |

## Target learning data

Mission events, confirmed transcripts, error signals, recommendations, and usage reservations are approved concepts but not implemented current tables. Before migration, define field purpose, confidence, consent where needed, access, retention, export, deletion, and provider minimization.

## User rights and controls

The target product must support access, correction, portable export, account deletion, and explanation/override of recommendations. Deletion must cover Auth identity, profile, decks/cards/progress, future learning sessions/events/signals/recommendations, stored transcripts, usage metadata where legally deletable, and provider-side requests where supported.

The current application does not provide a complete export or deletion flow. The public privacy page contains a hard-coded contact address; the operator should confirm it is an intentional role-based public contact without exposing a personal address unnecessarily.

## Provider and legal gates

Before sending learner content to a provider or changing retention:

1. verify purpose, necessity, contract/terms, training use, retention, location, sub-processors, security, deletion, and zero-budget constraints;
2. determine consent or other legal-basis questions and international-transfer mechanism;
3. update the processing map, public notice, user controls, and deletion/export behavior;
4. assess GDPR obligations and whether the EU AI Act applies to the specific feature;
5. obtain professional legal review where the decision affects minors, profiling, special-category data, cross-border transfer, or high-impact automated decisions.

## Prohibited defaults

- Permanent raw audio storage.
- Hidden attention or emotion inference.
- Selling or reusing learner content for unrelated purposes.
- Treating low-confidence model output as a permanent learner weakness.
- Logging credentials, full prompts, transcripts, audio, or unnecessary personal identifiers.
- Dark patterns that make privacy controls harder than data collection.
