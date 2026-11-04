# LingoCoon Agent Directory

## Status

Authoritative map for project-scoped Codex agents and skills.

- Version: 1.2
- Last reviewed: 2026-09-08

## Runtime contract

When a task starts in this repository, Codex loads the root `AGENTS.md` instruction chain. It discovers skill names and descriptions from `.agents/skills/*/SKILL.md`, then loads a skill's complete instructions only when that skill is invoked. Custom roles in `.codex/agents/*.toml` configure spawned subagent sessions; they do not automatically replace the main chat persona.

The project configuration:

- uses `on-request` approval and a workspace-write main sandbox;
- enables subagents with at most four concurrent threads;
- inherits the user's selected model and provider instead of pinning them;
- contains no credentials, external integrations, telemetry override, or global preference;
- does not expand the approval boundaries in `.agents/project/AGENTS.md`.

An agent's TOML sandbox is its configured default, not an absolute barrier: the active parent runtime may reapply its current permission overrides when spawning a subagent. The behavioral restrictions remain mandatory regardless of runtime mode. Read-only roles inspect and recommend; workspace-writer roles may edit only an explicitly approved local file set they own. No role may mutate Git history, commit, push, deploy, change a dashboard, rotate credentials, or spend money without exact authorization.

Required-skill contract:

1. The user may describe an outcome without naming skills. Codex selects the smallest matching set; a skill's availability is not evidence that its instructions were followed.
2. Delegation prompts name the custom agent and required `$skill-name` values.
3. Each custom agent reads the applicable AGENTS chain, loads every assigned skill completely, and states the loaded names before acting.
4. If no skill is assigned, the agent selects the narrowest option from its role defaults.
5. Missing or conflicting skills are reported; they are never silently skipped.

## Agent inventory

| Agent | Configured mode | Responsibility | Default skills |
| --- | --- | --- | --- |
| `lingocoon_orchestrator` | Read-only | Scope complex work, delegate independent reads, reconcile evidence, and return one decision | `feature-discovery`, `test-plan-and-coverage`, `documentation-sync` |
| `product_strategist` | Read-only | Learner value, MVP boundaries, prioritization, metrics, and roadmap | `lingocoon-product`, `feature-discovery` |
| `learning_scientist` | Read-only | Learning outcomes, CEFR fit, retrieval, feedback, adaptation, and evidence quality | `learning-feature-design`, `adaptive-path-evaluation`, `lingocoon-ai-learning` |
| `idea_creator` | Read-only | Bounded brainstorming and falsifiable experiments | `feature-discovery`, `lingocoon-research` |
| `ux_ui_designer` | Read-only | Flows, information architecture, states, accessibility, and original visual direction | `lingocoon-ux`, `design-system-review`, `accessibility-audit` |
| `software_architect` | Read-only | Module boundaries, data flow, trust boundaries, dependencies, and scalability | `threat-model-update`, `performance-budget-review`, `test-plan-and-coverage` |
| `fullstack_engineer` | Workspace writer | One approved end-to-end feature or fix | `feature-delivery`, `lingocoon-engineering`, `post-change-quality-gate` |
| `frontend_engineer` | Workspace writer | Approved Next.js/React interaction, responsive, motion, and accessibility work | `lingocoon-engineering`, `design-system-review`, `accessibility-audit`, `browser-e2e-validation` |
| `supabase_engineer` | Workspace writer | Approved PostgreSQL/Supabase schema, migration, query, Auth, Storage, and RLS source | `supabase-rls-audit`, `safe-database-migration`, `post-change-quality-gate` |
| `security_architect` | Read-only | Threat modeling and exploitability-focused application security review | `secure-code-review`, `threat-model-update`, `server-action-security` |
| `red_team_tester` | Read-only | Explicitly authorized defensive abuse plans or tests in local/preview scope | `authorized-red-team-test`, `dependency-and-secret-scan` |
| `qa_test_engineer` | Read-only | Risk-based unit, integration, API, RLS, component, and E2E coverage | `test-plan-and-coverage`, `browser-e2e-validation`, `post-change-quality-gate` |
| `devops_vercel_engineer` | Workspace writer | Approved CI, build, preview, observability, caching, and rollback source | `vercel-preview-release`, `performance-budget-review`, `post-change-quality-gate` |
| `git_release_manager` | Read-only | Safe branch, worktree, commit, merge, release, and history planning | `git-safe-workflow`, `dependency-and-secret-scan` |
| `ai_safety_engineer` | Read-only | Prompt injection, provider privacy, schemas, abuse, limits, cost, and fallback | `lingocoon-ai-learning`, `ai-abuse-and-cost-review`, `privacy-impact-assessment` |
| `privacy_compliance_reviewer` | Read-only | Data minimization, consent, retention, rights, GDPR, and possible EU AI Act scope | `privacy-impact-assessment`, `documentation-sync` |
| `performance_accessibility_engineer` | Read-only | Web/server/database/provider budgets plus WCAG, keyboard, screen reader, and motion | `performance-budget-review`, `accessibility-audit` |
| `documentation_keeper` | Workspace writer | Synchronize approved documents, decisions, diagrams, agents, and skill inventories | `documentation-sync`, `post-change-quality-gate` |

## Skill inventory

### Domain skills

| Skill | Use for |
| --- | --- |
| `lingocoon-product` | Product strategy, personalization, priorities, gamification, and learner outcomes |
| `lingocoon-research` | Verified product, learning, UX, technology, repository, or competitor research |
| `lingocoon-ux` | Learner flows, information architecture, interaction states, and interface behavior |
| `lingocoon-minimal` | Visual-system rules, component styling, and monochrome migration |
| `lingocoon-ai-learning` | Bounded AI learning workflows, evaluation, privacy, limits, and fallback |
| `lingocoon-engineering` | Explicitly approved implementation, refactor, test, integration, or migration |

### Procedure skills

| Skill | Repeatable procedure |
| --- | --- |
| `feature-discovery` | Convert an unapproved problem into a decision-ready brief |
| `feature-delivery` | Deliver one approved feature from contract through verification |
| `learning-feature-design` | Specify a measurable learning activity or mission |
| `adaptive-path-evaluation` | Review an adaptive recommendation policy for evidence, fairness, and control |
| `design-system-review` | Review a UI diff/spec against the approved visual system |
| `accessibility-audit` | Audit semantics, keyboard, screen reader, motion, audio, and responsive barriers |
| `secure-code-review` | Review a bounded code path or diff for exploitable security regressions |
| `threat-model-update` | Update assets, boundaries, attack paths, mitigations, and residual risk |
| `supabase-rls-audit` | Audit versioned grants, functions, ownership, and RLS |
| `safe-database-migration` | Prepare one forward migration with rollback and RLS evidence |
| `server-action-security` | Review a Server Action/Route Handler trust boundary |
| `authorized-red-team-test` | Run one explicitly authorized defensive abuse test |
| `dependency-and-secret-scan` | Check dependencies and reachable Git content without printing secrets |
| `test-plan-and-coverage` | Build a risk-based test and coverage map |
| `browser-e2e-validation` | Validate an approved local/preview flow with reproducible evidence |
| `git-safe-workflow` | Plan or perform an explicitly authorized Git workflow |
| `vercel-preview-release` | Prepare and verify a preview/release handoff without implicit deployment |
| `performance-budget-review` | Review explicit web/server/database/provider budgets |
| `ai-abuse-and-cost-review` | Review AI/TTS/STT abuse, privacy, retries, cost, and fallback |
| `privacy-impact-assessment` | Assess collection, retention, provider transfer, and user rights |
| `documentation-sync` | Update authoritative docs after verified behavior or decisions change |
| `post-change-quality-gate` | Run and interpret proportionate final verification |

## Coordination rules

1. Use one main agent for simple tasks.
2. The current delivery owner coordinates directly. Use a separate read-only orchestrator only for an explicitly bounded planning question, not as a mandatory layer above a writer.
3. Give read-only agents bounded questions and exact evidence expectations.
4. Reconcile conflicting recommendations before any implementation.
5. Assign one writer sole ownership of each modified file set. Never run overlapping writers.
6. Select one relevant independent reviewer for a risky change. Add security/architecture reviews only when those boundaries change; do not run all roles as a checklist.
7. The main agent remains accountable for instructions, evidence, final synthesis, and disclosure of skipped checks.

Recommended maximum concurrency is four: one orchestrator/main agent plus up to three independent read-only specialists. Sequential work is preferred when tasks share files or decisions.

The 18 roles and 28 skills listed here are a retained capability inventory, not 18 active team members or mandatory task stages. A named dedicated task does not synchronize its conversation with other tasks. Use the owning feature document's delivery record and the [handoff contract](chat-starters.md); the delivery owner must read and integrate specialist results.

## Publication and portability

This operating system is intentionally ignored by Git through the current private-workspace policy: `AGENTS.md`, `.agents/`, `.codex/`, and `docs/` are local to this checkout. They are available to Codex on this Mac but are not protected, reviewed, or propagated by Git. A future decision may publish a sanitized subset; until then, another clone will not receive these agents, skills, or documents.

## Daily use

- Start ordinary work in the main LingoCoon task and describe the outcome; the AGENTS chain routes the task.
- Name a skill with `$skill-name` whenever that procedure is mandatory. Otherwise Codex may select the narrowest matching skill automatically from its name and description.
- Open a dedicated task from [chat starters](chat-starters.md) only for a large independent area.
- Before edits, approve the exact local change. Before external action, approve the exact service, target, and mutation separately.
- End with changed behavior, evidence, unverified criteria, remaining risk, and the next authorized action. Request another approval only for a material new decision or scope boundary, not routine continuation of an accepted change.

Official configuration references: [Codex config reference](https://learn.chatgpt.com/docs/config-file/config-reference), [subagents](https://learn.chatgpt.com/docs/agent-configuration/subagents), [skills](https://learn.chatgpt.com/docs/build-skills), and [AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md).
