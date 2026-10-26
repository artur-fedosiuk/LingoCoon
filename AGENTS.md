# LingoCoon Agent Entry Point

LingoCoon is a public, personalized language-learning product. Its target loop connects reading, listening, writing, and speaking; flashcards are supporting practice, not the product core.

## Start every task

1. Read `.agents/project/AGENTS.md` completely.
2. Read `.agents/README.md` to route the request to the narrowest matching skill or agent.
3. Read `.agents/project/configuration-map.md` for configuration, tooling, Git, CI, deployment, or publication work.
4. Read the relevant source-of-truth document in `docs/`. For current reader work, start with `docs/product/context-studio.md`, including its delivery status; do not infer approval or completion from a task title.
5. Load every skill explicitly named in the request or assigned agent prompt, then load any additional narrow skill required by the task. Read each selected `SKILL.md` completely before acting.
6. Check `git status --short --branch` and confirm the write boundary before editing.

For delegated work, the parent prompt must name the custom agent and required skills explicitly using `$skill-name`. A directory table or “default skills” label is routing guidance, not proof that a skill was loaded.

## Verified repository baseline

- Next.js 16 App Router, React 19, strict TypeScript, Tailwind CSS 4, Radix UI, Supabase/PostgreSQL, Zod, i18next, Framer Motion, and `ts-fsrs`.
- GitHub Actions runs secret scanning, security tests, lint, type-check, and production build on pull requests and `main`.
- Supabase schema, forward migrations, and database-security checks live under `supabase/`.
- Runtime provider integrations are server-side; their live configuration is external and must never be inferred from source.

## Commands

```bash
npm ci
npm run dev
npm run check
npm run security:secrets:history
npm audit --audit-level=high
```

Run only checks relevant to the change, and disclose anything skipped. Database, browser, accessibility, performance, and provider checks need their documented environment; a green build does not prove them.

## Non-negotiable rules

- Use English for code, identifiers, comments, and technical documentation.
- Keep strict TypeScript; do not introduce `any`, `eval`, `dangerouslySetInnerHTML`, security bypasses, or unvalidated untrusted input without an approved, documented reason.
- Preserve authentication, ownership, RLS, privacy, accessibility, and zero-budget boundaries.
- Do not read or print secret values. Do not modify production, Supabase remote, Vercel, DNS, GitHub settings, providers, dependencies, or Git history without explicit authorization.
- Do not commit, push, merge, rebase, release, or deploy unless the user explicitly asks for that exact action.
- Use read-only subagents for independent exploration. Give one bounded writer sole ownership of every modified file set.
- Require each subagent to state which assigned skills it loaded; unavailable or conflicting skills must be reported rather than silently skipped.
- A skill routes work; it never grants modification authority.

Detailed operating rules, definitions of done, agent routing, and authoritative references are in `.agents/project/AGENTS.md`, `.agents/README.md`, and `docs/README.md`.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
