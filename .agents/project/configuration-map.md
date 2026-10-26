# LingoCoon Repository Configuration Map

## Purpose

This document explains where each project configuration belongs, who consumes it, whether it is public, and how to validate it. It is operational guidance, not permission to change configuration.

- Version: 1.4
- Last reviewed: 2026-09-14

## Publication boundary

| Path | Visibility | Rule |
| --- | --- | --- |
| `AGENTS.md` | Private and ignored | Keep the minimal Codex discovery entrypoint at the Git root. Do not move it into `.agents/`. |
| `.agents/` | Private and ignored | Store Codex operating instructions, routing, and local skills here. |
| `.codex/` | Private and ignored | Store trusted project-scoped Codex configuration and custom agents. Never place credentials or global preferences here. |
| `docs/` | Private and ignored | Store authoritative product, architecture, design, engineering, and decision documents here. |
| `security_report/` | Private and ignored | Treat reports as sensitive work products. Never store live or historical credentials in them. |
| Application source and standard tool configuration | Public and tracked | Publish only files required to build, test, deploy, understand, or legally operate the application. |

Ignored files are not encrypted. They remain local filesystem data and must not contain credentials unless they are designed secret stores such as `.env.local` with appropriate local protections.

## Codex configuration

| Path | Consumer | Required behavior | Validation |
| --- | --- | --- | --- |
| `AGENTS.md` | Codex project instruction discovery | Read `.agents/project/AGENTS.md` first, then relevant documents and skills. Keep concise. | Confirm the file exists at the Git root and every referenced path exists. |
| `.agents/project/AGENTS.md` | Codex | Define project purpose, standards, approvals, documentation rules, verification, and source-of-truth references. | Read completely after material changes and verify references. |
| `.agents/README.md` | Codex and maintainers | Index the private agent workspace and route tasks to the narrowest matching skill. | Confirm all listed skill directories exist. |
| `.agents/skills/<name>/SKILL.md` | Codex skill loader | Provide a precise trigger, narrow workflow, domain constraints, validation, and explicit authorization boundaries. Directory and frontmatter names must match. | Run the official skill validator when available; otherwise validate YAML and paths and disclose the limitation. |
| `.agents/skills/<name>/agents/openai.yaml` | Codex UI and invocation policy | Keep display metadata aligned with `SKILL.md`; explicitly allow implicit invocation unless the user requests explicit-only use. | Parse YAML and confirm the default prompt names the same `$skill-name`. |
| `.codex/config.toml` | Trusted Codex clients | Set only supported project overrides. Keep model/provider/auth/global telemetry settings out. | Parse TOML and run a local Codex configuration command from the trusted repository. |
| `.codex/agents/<name>.toml` | Codex subagent loader | Define one narrow role with `name`, `description`, `developer_instructions`, and the minimum sandbox. Do not pin models without a verified need. | Parse TOML; confirm names are unique and read-only roles set `sandbox_mode = "read-only"`. |

Codex discovers repository skill metadata and can select a matching skill implicitly; the user need not activate every skill manually. Delegation prompts explicitly name required skills and the recipient confirms full reads. Custom-agent TOML applies to spawned subagent sessions, not automatically to the main task. Restart the task/Codex when project instructions or skill discovery appears stale. No amount of configuration guarantees that an agent followed a procedure: verify the resulting behavior and evidence.

## Product documentation

| Path | Responsibility | Update rule |
| --- | --- | --- |
| `docs/product/` | Product promise, learner model, first mission, and roadmap | Update only when the underlying product or learning decision changes. |
| `docs/architecture/` | Learning engine, data contracts, and bounded AI behavior | Update before implementing an approved architectural change. |
| `docs/design/` | UX behavior and visual-system rules | Update when an approved interaction or visual rule changes. |
| `docs/engineering/` | Repeatable development and verification workflow | Update when repository commands or engineering procedures change. |
| `docs/security/` | Repository-backed security baseline and threat model | Update when boundaries, controls, attack surface, or verified gaps change. |
| `docs/governance/` | Privacy, retention, and compliance operating decisions | Update only after product/data/provider behavior changes or legal review. |
| `docs/agents/` | Custom-agent inventory, permissions, routing, and chat starters | Keep synchronized with `.codex/agents/` and `.agents/skills/`. |
| `docs/decisions/decision-log.md` | Approved material decisions and consequences | Record decisions, not informal ideas or unresolved discussion. |
| `docs/archive/` | Non-authoritative historical material | Never treat archived content as current direction without a new recorded decision. |

## Standard root configuration

These files remain at the Git root because their tools discover them there. Moving them only to reduce visual clutter would make the repository less conventional and may break tooling.

| Path | Consumer and purpose | Change rule | Validation |
| --- | --- | --- | --- |
| `package.json` | npm scripts and direct dependency declarations | Dependency or script changes require explicit approval. | `npm install --package-lock-only --ignore-scripts` when appropriate, followed by relevant checks. |
| `package-lock.json` | npm reproducible dependency graph | Change only with `package.json` or an approved security/dependency update. Never edit manually. | `npm ci` and `npm audit`. |
| `next.config.ts` | Next.js build and runtime configuration | Keep only justified framework settings; deployment-impacting changes require approval. | `npm run build`. |
| `tsconfig.json` | TypeScript compiler and path aliases | Preserve strict mode; treat broader includes, JavaScript allowance, or skipped checks as explicit decisions. | `npx tsc --noEmit`. |
| `eslint.config.mjs` | ESLint and Next.js static analysis | Keep framework presets and explicit ignores reviewable. | `npm run lint`. |
| `postcss.config.mjs` | PostCSS and Tailwind integration | Keep minimal and aligned with installed packages. | `npm run build`. |
| `components.json` | shadcn component generator aliases and style metadata | Treat generator changes as UI-tooling configuration, not product design approval. | Validate JSON and confirm aliases resolve through `tsconfig.json`. |
| `.gitignore` | Git publication and local-artifact boundary | Never use ignore rules as secret revocation or history cleanup. Review exceptions carefully. | `git check-ignore -v <path>` and `git status --short --ignored`. |
| `.env.local.example` | Public environment-variable contract without values | Include names and safe comments only; never real credentials. | Run the current-tree secret scan before publishing. |
| `vercel.json` | Hosted daily Reading audio cleanup cron | Changes prepare configuration only; deployment and CRON_SECRET assignment remain externally approval-gated. | Validate JSON and authenticated cleanup behavior, then verify target plan support and deployed run history. |

## Repository automation and external configuration

| Configuration | Location | Behavior | Authority boundary |
| --- | --- | --- | --- |
| Secret scanner | `scripts/check-secrets.mjs` and `package.json` scripts | Detect credential-shaped values in the worktree, index, or reachable Git history. | Scanner changes require approved engineering work and self-test validation. |
| Continuous integration | `.github/workflows/ci.yml` | Runs install, current-tree secret scanning, security boundary tests, lint, type-check, and build for pull requests and `main`. | Keep permissions read-only, pin external actions to immutable full commit SHAs, and never expose provider or production secrets to untrusted pull requests. |
| Dependabot security updates | GitHub repository settings; optional `.github/dependabot.yml` for scheduled version updates | Opens pull requests for vulnerable dependency versions when GitHub can resolve an update. | Reading alerts is diagnostic; enabling, disabling, merging, or changing policy is an external configuration change requiring approval. |
| CodeQL default setup | GitHub repository settings | Runs GitHub-managed code scanning and reports findings under Security. | Treat setup changes and alert dismissal as external changes requiring approval. |
| Vercel Git integration | Vercel project and GitHub app settings | Builds preview deployments for pull requests and production deployments according to project policy. | Do not redeploy, relink, promote, or change environment variables without explicit approval. |
| Git author identity | Repository-local Git config and commit metadata | Use the GitHub `users.noreply.github.com` address for future public commits when privacy is desired. Existing commit metadata does not change automatically. | Classify author emails without printing them, then inspect GitHub attribution. |

## Change procedure

For a configuration change, state the objective, affected file or external setting, expected behavior, risks, rollback, and validation before editing. After approval, change the smallest surface, run the listed validation plus relevant application checks, and report evidence and remaining limitations.
