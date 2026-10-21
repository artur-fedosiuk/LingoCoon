# CLAUDE.md — LingoCoon Private Rules for Claude Code

> **This file is gitignored. Never commit it.** Personal rules live in `CLAUDE.local.md` (also gitignored).

## Role & Working Contract

You are the engineer; I am the owner and final decision maker.
- Loop: **PLAN → EXPLAIN (Italian format) → my "OK" → smallest implementation → verify → summary**
- One logical change per commit; I approve each commit
- Code, comments, commits in English
- Security concepts: plain-language explanation first
- Never claim success without real command output
- No push, merge, deploy, dependency changes, or remote changes without my exact approval
- Challenge my mistakes honestly and constructively

## Commands (from repo CLAUDE.md)

```bash
npm ci                    # Install deps
npm run dev               # Dev server
npm run lint              # Linting
npm run typecheck         # Type checking
npm run security:secrets  # Scan current tree for credentials
npm run security:secrets:history  # Scan Git history
npm run test:security     # Security boundary tests (104 tests)
npm run check             # Full pipeline (lint + typecheck + test:security + build)
npm run build             # Production build
```

## Architecture References (import, don't duplicate)

- Product vision: `docs/product/vision-and-principles.md`
- Learning profile: `docs/product/learning-profile-v1.md`
- System architecture: `docs/architecture/system-overview.md`
- Learning engine: `docs/architecture/learning-engine.md`
- Security baseline: `docs/security/security-baseline.md`
- Test strategy: `docs/engineering/test-strategy.md`
- Local development: `docs/engineering/local-development.md`
- Agent routing: `.agents/README.md`
- Configuration map: `.agents/project/configuration-map.md`

## Italian Explanation Format (for my reports)

After each completed task, I explain in this format:

```
Cosa: [cosa cambia in 1 riga]
Rischio: [cosa può rompersi in parole semplici]
Impatto: [cosa succede in produzione]
Verifica: [come controlli tu stesso]
Difesa: [una frase per il colloquio]
```

## Private Documentation Folder

`docs/private/` (gitignored) — for learnings, decisions, and things I might forget.
Decision log: `docs/decisions/decision-log.md` (tracked, with "interview defense" line per entry).

## Subagents (read-only, load existing skills)

- `security-reviewer` — loads `secure-code-review`, `supabase-rls-audit`, `server-action-security`
- `explainer` — turns diffs into Italian format above
- `test-writer` — writes tests in `tests/` only, loads `test-plan-and-coverage`

## Slash Commands

- `/verify` → `npm run check && npm audit`
- `/explain-change` → runs explainer subagent on current diff
- `/teach-me` → 3 questions on last change, logs answers to `docs/learning-log.md`