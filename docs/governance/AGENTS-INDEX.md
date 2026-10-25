# LingoCoon Agents & Skills Index

## Status

Canonical index of all agents, skills, and workflows. Derived from `.agents/project/AGENTS.md`, `.agents/README.md`, `.agents/skills/`, and `docs/agents/agent-directory.md`. This is the single source of truth — do not duplicate in other documents.

- Version: 1.0
- Last reviewed: 2026-10-25

---

## Agent Inventory (18 roles)

| Agent | Mode | Responsibility | Default Skills |
| --- | --- | --- | --- |
| `lingocoon_orchestrator` | Read-only | Scope complex work, delegate independent reads, reconcile evidence, return one decision | `feature-discovery`, `test-plan-and-coverage`, `documentation-sync` |
| `product_strategist` | Read-only | Learner value, MVP boundaries, prioritization, metrics, roadmap | `lingocoon-product`, `feature-discovery` |
| `learning_scientist` | Read-only | Learning outcomes, CEFR fit, retrieval, feedback, adaptation, evidence quality | `learning-feature-design`, `adaptive-path-evaluation`, `lingocoon-ai-learning` |
| `idea_creator` | Read-only | Bounded brainstorming and falsifiable experiments | `feature-discovery`, `lingocoon-research` |
| `ux_ui_designer` | Read-only | Flows, information architecture, states, accessibility, visual direction | `lingocoon-ux`, `design-system-review`, `accessibility-audit` |
| `software_architect` | Read-only | Module boundaries, data flow, trust boundaries, dependencies, scalability | `threat-model-update`, `performance-budget-review`, `test-plan-and-coverage` |
| `fullstack_engineer` | Workspace writer | One approved end-to-end feature or fix | `feature-delivery`, `lingocoon-engineering`, `post-change-quality-gate` |
| `frontend_engineer` | Workspace writer | Approved Next.js/React interaction, responsive, motion, accessibility | `lingocoon-engineering`, `design-system-review`, `accessibility-audit`, `browser-e2e-validation` |
| `supabase_engineer` | Workspace writer | Approved PostgreSQL/Supabase schema, migration, query, Auth, Storage, RLS | `supabase-rls-audit`, `safe-database-migration`, `post-change-quality-gate` |
| `security_architect` | Read-only | Threat modeling and exploitability-focused application security review | `secure-code-review`, `threat-model-update`, `server-action-security` |
| `red_team_tester` | Read-only | Explicitly authorized defensive abuse plans/tests in local/preview scope | `authorized-red-team-test`, `dependency-and-secret-scan` |
| `qa_test_engineer` | Read-only | Risk-based unit, integration, API, RLS, component, E2E coverage | `test-plan-and-coverage`, `browser-e2e-validation`, `post-change-quality-gate` |
| `devops_vercel_engineer` | Workspace writer | Approved CI, build, preview, observability, caching, rollback | `vercel-preview-release`, `performance-budget-review`, `post-change-quality-gate` |
| `git_release_manager` | Read-only | Safe branch, worktree, commit, merge, release, history planning | `git-safe-workflow`, `dependency-and-secret-scan` |
| `ai_safety_engineer` | Read-only | Prompt injection, provider privacy, schemas, abuse, limits, cost, fallback | `lingocoon-ai-learning`, `ai-abuse-and-cost-review`, `privacy-impact-assessment` |
| `privacy_compliance_reviewer` | Read-only | Data minimization, consent, retention, rights, GDPR, EU AI Act | `privacy-impact-assessment`, `documentation-sync` |
| `performance_accessibility_engineer` | Read-only | Web/server/database/provider budgets + WCAG, keyboard, screen reader, motion | `performance-budget-review`, `accessibility-audit` |
| `documentation_keeper` | Workspace writer | Synchronize approved documents, decisions, diagrams, agents, skill inventories | `documentation-sync`, `post-change-quality-gate` |

**Runtime contract** (from `.agents/project/AGENTS.md` §50–66):
- Use subagents only when independent work materially improves a complex task
- Orchestrator defines outcome, scope, acceptance criteria, file ownership, permission boundary
- Delegation prompts **must** name custom agent and each required skill using `$skill-name`
- Subagent states loaded skills in first update; reports unavailable/conflicting skills
- Read-only agents may inspect in parallel
- Delivery owner reads specialist result and folds accepted requirements into feature's owning document
- One writer owns each file set; overlapping writers prohibited
- Request one bounded independent review when it materially reduces risk
- Documentation changes only when behavior or an approved decision changed
- Default to one delivery owner who plans, implements, verifies, reconciles reviews

---

## Skill Inventory (28 skills)

### Domain Skills (6)

| Skill | Use For |
| --- | --- |
| `lingocoon-product` | Product strategy, personalization, priorities, gamification, learner outcomes |
| `lingocoon-research` | Verified product, competitor, learning, UX, technology, repository research |
| `lingocoon-ux` | Learner flows, information architecture, interaction states, interface behavior |
| `lingocoon-minimal` | Visual-system rules, component styling, monochrome migration |
| `lingocoon-ai-learning` | Bounded AI learning workflows, evaluation, privacy, limits, fallback |
| `lingocoon-engineering` | Explicitly approved code, refactor, test, integration, dependency, migration |

### Procedure Skills (22)

| Skill | Repeatable Procedure |
| --- | --- |
| `feature-discovery` | Convert unapproved problem into decision-ready brief |
| `feature-delivery` | Deliver one approved feature from contract through verification |
| `learning-feature-design` | Specify measurable learning activity or mission |
| `adaptive-path-evaluation` | Review adaptive recommendation policy for evidence, fairness, control |
| `design-system-review` | Review UI diff/spec against approved visual system |
| `accessibility-audit` | Audit semantics, keyboard, screen reader, motion, audio, responsive barriers |
| `secure-code-review` | Review bounded code path/diff for exploitable security regressions |
| `threat-model-update` | Update assets, boundaries, attack paths, mitigations, residual risk |
| `supabase-rls-audit` | Audit versioned grants, functions, ownership, RLS |
| `safe-database-migration` | Prepare one forward migration with rollback and RLS evidence |
| `server-action-security` | Review Server Action/Route Handler trust boundary |
| `authorized-red-team-test` | Run one explicitly authorized defensive abuse test |
| `dependency-and-secret-scan` | Check dependencies and reachable Git content without printing secrets |
| `test-plan-and-coverage` | Build risk-based test and coverage map |
| `browser-e2e-validation` | Validate approved local/preview flow with reproducible evidence |
| `git-safe-workflow` | Plan or perform explicitly authorized Git workflow |
| `vercel-preview-release` | Prepare and verify preview/release handoff without implicit deployment |
| `performance-budget-review` | Review explicit web/server/database/provider budgets |
| `ai-abuse-and-cost-review` | Review AI/TTS/STT abuse, privacy, retries, cost, fallback |
| `privacy-impact-assessment` | Assess collection, retention, provider transfer, user rights |
| `documentation-sync` | Update authoritative docs after verified behavior or decisions change |
| `post-change-quality-gate` | Run and interpret proportionate final verification |

**Loading rules** (from `.agents/project/AGENTS.md` §4–9, `.agents/README.md` §5–12):
1. Root `AGENTS.md` discovered automatically by Codex
2. Read `.agents/project/AGENTS.md` completely before project work
3. Read `.agents/project/configuration-map.md` for config/tooling/Git/CI/deployment/publication
4. Read relevant authoritative document in `../docs/`
5. Load **every skill explicitly named by user or assigned agent prompt**
6. Add only the narrow additional skills required by the active task
7. Skill discovery exposes routing metadata; selecting a skill requires reading its full `SKILL.md`
8. Codex can select matching skills implicitly; user does not need to name them in every request
9. Delegation prompts must name required skills explicitly; recipient must confirm loading them
10. A skill list or task name alone proves neither invocation nor correct execution
11. Every skill preserves the approval boundaries in `.agents/project/AGENTS.md`

---

## Workflow Inventory

No standalone workflows defined. Workflows are orchestrated through the agent protocol above. See `docs/agents/chat-starters.md` for handoff contracts and dedicated-chat starters.

---

## Coordination Rules (from `docs/agents/agent-directory.md` §95–107)

1. Use one main agent for simple tasks
2. Current delivery owner coordinates directly. Use separate read-only orchestrator only for explicitly bounded planning question, not as mandatory layer above a writer
3. Give read-only agents bounded questions and exact evidence expectations
4. Reconcile conflicting recommendations before any implementation
5. Assign one writer sole ownership of each modified file set. Never run overlapping writers
6. Select one relevant independent reviewer for a risky change. Add security/architecture reviews only for affected boundaries, not automatically for every change
7. Main agent remains accountable for instructions, evidence, final synthesis, and disclosure of skipped checks
8. Recommended maximum concurrency: four (one orchestrator/main + up to three independent read-only specialists). Sequential work preferred when tasks share files or decisions
9. 18 roles and 28 skills are a retained capability inventory, not 18 active team members or mandatory task stages
10. Named dedicated task does not synchronize conversation with other tasks. Use owning feature document's delivery record and handoff contract; delivery owner must read and integrate specialist results

---

## Publication & Portability (from `docs/agents/agent-directory.md` §109–111)

This operating system is intentionally ignored by Git through the current private-workspace policy:
- `AGENTS.md`, `.agents/`, `.codex/`, and `docs/` are local to this checkout
- Available to Codex on this Mac but not protected, reviewed, or propagated by Git
- A future decision may publish a sanitized subset; until then, another clone will not receive these agents, skills, or documents

---

## Cross-References

| Source | Location |
| --- | --- |
| Authoritative project instructions | `.agents/project/AGENTS.md` |
| Agent workspace routing | `.agents/README.md` |
| Human-readable agent matrix | `docs/agents/agent-directory.md` |
| Skill routing table | `.agents/README.md` §29–38 |
| Configuration ownership map | `.agents/project/configuration-map.md` |
| Documentation index | `docs/README.md` |

---

## Validation

- Confirm all listed skill directories exist under `.agents/skills/`
- Confirm all listed agents have corresponding TOML in `.codex/agents/`
- Confirm all cross-references resolve to existing files
- Run skill validator when available; otherwise validate YAML and paths and disclose limitation