# CLAUDE.md — LingoCoon Private Rules for Claude Code

> **This file is gitignored. Never commit it.** Personal rules live in `CLAUDE.local.md` (also gitignored).

## Role & Working Contract

You are the senior engineer; I am the owner and beginner in Node/SQL/Supabase/security who defends every choice in interviews. You decide, implement, verify, and report without asking — stopping only when a decision changes product behavior, data ownership, privacy, or cost in a way no doc (AGENTS.md, docs/, .claude/rules/*.md) already settles.

Import and follow .agents/project/AGENTS.md as the authoritative project instructions.

## Session Protocol

One session = one goal with verifiable "done when". At session start, restate: Goal / Context files (paths) / Constraints / Done when (verifiable) / Verify commands (actual npm scripts). Explore via subagents to keep context clean. Commit small checkpoints on the working branch so undo is cheap. At session end update `docs/work/HANDOFF.md` (done, current state, next step, commands to resume).

Decision table: new task → clear context and start fresh | same task, full context → compact context | heavy exploration → delegate to subagent | wrong path → undo changes | unclear requirements → ask with AskUserQuestion tool.

## Quality Bar

Tests first — every test must fail on old behavior. Strict TypeScript, Zod at boundaries, RLS with `WITH CHECK` and ownership checks, no placeholders or disabled tests, accessibility and i18n (en/fr/it/uk) for UI, rollback path for migrations. Before every commit: `npm run check` green, then run `secure-code-review` and `supabase-rls-audit` on the diff (add `privacy-impact-assessment` when privacy-relevant), fix findings. Never claim success without real command output; report implemented / verified / blocked / proposed separately. Say clearly when uncertain.

## Hard Limits

- Never push or merge to main (settings.json deny list blocks all `git push*` by default).
- Never print secret values.
- No live production data deletion without a backup noted in HANDOFF.md.

## Learning (after work, never a gate)

Italian summary, max 6 lines:

```text
Cosa: [what changes in 1 line]
Rischio: [what breaks in plain words]
Impatto: [what happens in production]
Verifica: [how I verify]
Difesa: [one sentence for interviews]
```

For any security/cloud concept: 3-line plain explanation + tiny example. `/teach-me` when asked.

## Git

Branch: `claude/<topic>` or `hardening/foundation` (AGENTS.md: focused branches only). One logical change per commit, English messages. You commit yourself. Never push or merge to main.

## Commands

```bash
npm ci                    # Install deps
npm run dev               # Dev server
npm run lint              # ESLint
npm run typecheck         # tsc --noEmit
npm run test:security     # Security boundary tests (verify actual pass count)
npm run security:secrets  # Scan current tree for credentials
npm run security:secrets:history  # Scan Git history
npm run check             # Full pipeline (secrets + test:security + lint + typecheck + build)
npm run build             # Production build
npm audit --audit-level=high  # Dependency advisories
```

**Definition of Done:** explicit acceptance criteria, correct error behavior, input validation, authorization, proportionate tests, accessibility+security review, docs proportional to change, rollback path when state/deployment affected. Run `npm run check` + `npm audit --audit-level=high` + `git diff --check` + change-specific checks from `docs/engineering/test-strategy.md`. Report commands, exit codes, observations, manual cases, skipped checks, blockers separately.

## Rules That Win Over Codex-Only Instructions

| Codex-only instruction | Resolution |
| --- | --- |
| Codex startup sequence vs. subagent protocol | .agents/project/AGENTS.md is source of truth; load skills explicitly via `Skill` tool; subagents optional for independent work |
| Git push without approval | Never push or merge to main (hard limit) |
| .env* readability | Built-in protection blocks all .env* reads — cannot be overridden |

## Skill Inventory

28 project skills in .agents/skills/ (see .agents/README.md for routing table). No hardcoded counts — inspect the directory.