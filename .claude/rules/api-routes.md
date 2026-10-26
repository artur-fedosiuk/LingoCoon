---
paths:
  - src/app/api/**
  - src/lib/actions/**
---

# Rules for src/app/api/** and src/lib/actions/**

## Security-Critical Path
- Next.js Route Handlers (API routes)
- Server Actions (mutations)
- Authentication endpoints
- Provider integrations (Gemini, ElevenLabs, Whisper)

## Rules
- **Authentication first** — validate session with Supabase SSR auth before any logic
- **Validate input with Zod** — never trust client data; reject unknown fields
- **Ownership check on every mutation** — verify `auth.uid()` owns the target record
- **Rate limit expensive operations** — TTS, AI, STT have durable budgets; fail-closed when exhausted
- **Sanitize errors** — never leak provider details, stack traces, or credentials to the client
- **No `any` types** — strict TypeScript required
- **No provider bodies or secrets in logs** — redact provider error responses before logging

## Validation
```bash
npm run lint
npm run typecheck
npm run test:security
```