# LingoCoon Environments

## Status

Repository-owned environment contract. Live dashboard values are external and unverified in this document.

- Version: 1.1
- Last reviewed: 2026-09-14 (Reading TTS delta)

## Environment matrix

| Environment | Purpose | Source | Data/provider rule | Deployment authority |
| --- | --- | --- | --- | --- |
| Local | Development and safe manual checks | Local checkout and `.env.local` | Use development/test resources where available; never copy production secrets into reports or fixtures | Developer machine |
| Preview | Pull-request verification | GitHub revision through external Vercel integration | Must use preview-scoped values and non-production test data; production secrets must not be exposed to untrusted changes | Vercel/GitHub external settings |
| Production | Public service | Approved `main` revision and production Vercel project | Production Supabase/OAuth/providers only; migrations and secret changes require explicit approval and readback | Operator-controlled external settings |

No separate staging environment is proven by source. Do not invent one.

## Repository environment contract

Public browser configuration:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_READING_ENABLED` (navigation visibility; false until release approval)

Server-only provider configuration:

- `GEMINI_API_KEY`
- `GEMINI_BASE_URL` (optional override)
- `GEMINI_CHAT_MODEL_ID`
- `GEMINI_STRUCTURED_MODEL_ID`
- `ELEVENLABS_API_KEY`
- `ELEVENLABS_MODEL_ID`
- `ELEVENLABS_VOICE_ID_FEMALE`
- `ELEVENLABS_VOICE_ID_MALE`
- `STT_API_KEY`
- `STT_ENDPOINT`
- `STT_MODEL_ID`
- `INWORLD_API_KEY`, `INWORLD_TTS_MODEL`
- `INWORLD_TTS_VOICE_FEMALE`, `INWORLD_TTS_VOICE_MALE`
- `READING_TTS_CACHE_SECRET` (at least 32 characters)
- `SUPABASE_SERVICE_ROLE_KEY` (Reading server adapter only)
- `CRON_SECRET` (at least 32 characters; authenticates hosted cache cleanup)

Reading server flags: `READING_ENABLED` for approved hosted access, or
`CONTEXT_STUDIO_LOCAL_ENABLED` combined with development mode for verification.
The new TTS runtime is hosted, not a personal-computer service. Setting flags
does not establish a free allowance: PostgreSQL starts with `lifetime_limit=0`
and expired `credit_expires_at`. Provider account/billing and these limits must
be reconciled before activation. See the [Reading handoff](../product/context-studio.md#activation-handoff-and-outstanding-acceptance).

Platform-provided URL context:

- `VERCEL`
- `VERCEL_URL`
- `VERCEL_BRANCH_URL`
- `VERCEL_PROJECT_PRODUCTION_URL`

This list contains names only. `.env.local.example` is the public contract; `.env.local` is ignored and must never be read into reports, prompts, logs, or commits.

## Separation rules

- Never prefix a secret with `NEXT_PUBLIC_`.
- Never put service-role or provider credentials in browser code, public fixtures, GitHub pull-request workflows, or preview logs.
- Site URLs and OAuth redirect allowlists must match each environment and reject arbitrary external redirects.
- Preview must not mutate production data or consume an uncontrolled production provider budget.
- Production migrations are separate from application deployment and require backup/recovery, exact SQL review, apply authorization, and readback.
- Environment variables are configuration, not authorization. Server identity, RLS, and usage controls still apply.

## Verification before release

1. Resolve the exact Git revision and target environment.
2. Compare required variable names with the target dashboard without displaying values.
3. Verify Supabase project, OAuth redirect origins, site origin, and provider mode are environment-correct.
4. Run repository and environment-specific quality gates.
5. Smoke-test authentication, ownership, provider fallback, security headers, and rollback.
6. Record revision and readback; never infer success from a bot comment alone.

## Open gaps

- Preview/production variable assignment and secret scoping have not been inspected in this local audit.
- There is no repository-owned staging environment or synthetic monitoring. `vercel.json` now declares one daily authenticated Reading cleanup cron, not a complete deployment manifest. Its live assignment/run history is unverified. The Reading migration describes a conservative disable/drain rollback; no automated rollout/rollback was executed.
- Provider quotas and retention controls are not versioned and must be verified at decision time.
