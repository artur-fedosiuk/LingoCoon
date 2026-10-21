# Rules for src/app/api/** and src/lib/actions/**

## Security-Critical Path
This directory contains:
- Next.js Route Handlers (API routes)
- Server Actions (mutations)
- Authentication endpoints
- Provider integrations (Gemini, ElevenLabs, Whisper)

## Rules
- **Always validate input with Zod** — never trust client data
- **Check authentication & ownership** — use Supabase SSR auth
- **Rate limit expensive operations** — TTS, AI, STT have budgets
- **Sanitize errors** — never leak provider details, stack traces, or credentials
- **Use server-action-security skill** for review
- **No `any` types** — strict TypeScript required

## Validation
```bash
npm run lint
npm run typecheck
npm run test:security
```