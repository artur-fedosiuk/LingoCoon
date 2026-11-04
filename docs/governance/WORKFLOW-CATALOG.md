# LingoCoon Workflow Catalog

## Status

Canonical catalog of all workflows, orchestration patterns, and multi-agent coordination procedures. Derived from `.agents/project/AGENTS.md`, `docs/agents/agent-directory.md`, `.agents/skills/`, and `docs/agents/chat-starters.md`. This is the single source of truth for workflow governance — do not duplicate in other documents.

- Version: 1.0
- Last reviewed: 2026-10-25

---

## Current Workflow Inventory

No standalone workflow scripts are defined in this repository. Workflows are orchestrated through the **agent protocol** defined in `.agents/project/AGENTS.md` §50–66 and the coordination rules in `docs/agents/agent-directory.md` §95–107.

---

## Agent Protocol (from `.agents/project/AGENTS.md` §50–66)

### When to Use Subagents
> Use subagents only when independent work materially improves a complex task.

### Protocol Steps

1. **Orchestrator defines**: outcome, scope, acceptance criteria, file ownership, permission boundary
2. **Delegation prompt names**: custom agent + each required skill using `$skill-name`; never rely on directory table
3. **Subagent states loaded skills** in first update; reports unavailable/conflicting skills before continuing
4. **Read-only agents** may inspect architecture, security, tests, research, or documentation in parallel
5. **Delivery owner reads** specialist result and folds accepted requirements into feature's owning document before implementation
6. **One writer owns each file set**; overlapping writers prohibited
7. **Request one bounded independent review** when it materially reduces risk; add security/architecture only for affected boundaries
8. **Documentation changes only** when behavior or an approved decision changed

### Default Pattern
> Default to one delivery owner who plans, implements, verifies, and reconciles reviews. Do not spawn another coordinator merely because this task is called Command Center.

### Parallel Writes
> For parallel writes, use separate Git worktrees or branches and never edit the same files. Confirm that private instructions exist in a worktree before relying on them.

---

## Coordination Rules (from `docs/agents/agent-directory.md` §95–107)

| Rule | Description |
| --- | --- |
| 1 | Use one main agent for simple tasks |
| 2 | Current delivery owner coordinates directly. Use separate read-only orchestrator only for explicitly bounded planning question, not as mandatory layer above a writer |
| 3 | Give read-only agents bounded questions and exact evidence expectations |
| 4 | Reconcile conflicting recommendations before any implementation |
| 5 | Assign one writer sole ownership of each modified file set. Never run overlapping writers |
| 6 | Select one relevant independent reviewer for a risky change. Add security/architecture reviews only for affected boundaries, not automatically for every change |
| 7 | Main agent remains accountable for instructions, evidence, final synthesis, and disclosure of skipped checks |
| 8 | Recommended maximum concurrency: four (one orchestrator/main + up to three independent read-only specialists). Sequential work preferred when tasks share files or decisions |
| 9 | 18 roles and 28 skills are a retained capability inventory, not 18 active team members or mandatory task stages |
| 10 | Named dedicated task does not synchronize conversation with other tasks. Use owning feature document's delivery record and handoff contract; delivery owner must read and integrate specialist results |

---

## Handoff Contract (from `docs/agents/chat-starters.md`)

Each feature workstream maintains a **delivery record** in its owning document containing:
- Approved decisions and acceptance criteria
- Owner and write boundary
- Evidence and verification results
- Next action and blocked items

**Dedicated-chat starters** provide explicit handoff templates for:
- Security review handoff
- Architecture review handoff
- Privacy impact assessment handoff
- QA/test handoff
- Documentation sync handoff

See `docs/agents/chat-starters.md` for full templates.

---

## Standard Workflow Patterns

### Pattern 1: Simple Change (Single Agent)
```
Main agent → read context → implement → verify → document → done
```
Use for: bug fixes, small refactors, documentation updates, single-file changes

### Pattern 2: Feature Delivery (Delivery Owner + Optional Reviewers)
```
Delivery owner (fullstack_engineer) → plan → implement → verify
    ↓ (when risky boundary)
Specialist reviewer (security_architect / supabase_engineer / etc.) → bounded review
    ↓
Delivery owner reconciles → final verify → document
```
Use for: approved feature work with clear scope and affected boundaries

### Pattern 3: Complex Exploration (Orchestrator + Parallel Specialists)
```
Orchestrator (lingocoon_orchestrator) → scope work → delegate to parallel read-only specialists
    ├── security_architect (secure-code-review)
    ├── software_architect (threat-model-update)
    ├── qa_test_engineer (test-plan-and-coverage)
    └── privacy_compliance_reviewer (privacy-impact-assessment)
    ↓
Orchestrator reconciles → single decision → delivery owner implements
```
Use for: architecture decisions, security hardening, privacy compliance, cross-cutting concerns

### Pattern 4: Research & Discovery (Idea Creator / Product Strategist)
```
Idea creator (idea_creator) + lingocoon-research → bounded exploration → decision-ready brief
    ↓
Product strategist (product_strategist) + lingocoon-product → prioritization → roadmap entry
```
Use for: unapproved problems, new product ideas, competitor research

---

## Delegation Prompt Template

When delegating to a subagent, the prompt **must** include:

```markdown
## Delegation to [agent-name]

### Outcome
[One-sentence expected result]

### Scope
[Exact files, boundaries, and limits]

### Acceptance Criteria
[Verifiable conditions for completion]

### Required Skills
$skill-name-1
$skill-name-2
...

### Permission Boundary
[What the subagent may NOT do: no remote writes, no secrets, no production changes, etc.]
```

The subagent **must** confirm loaded skills in its first update before proceeding.

---

## Quality Gates for Workflow Completion

Per `.agents/project/AGENTS.md` §75–81 and `docs/engineering/test-strategy.md`:

- [ ] `npm run check` green (exit 0)
- [ ] `npm run test:security` → pass 302 / fail 0
- [ ] `npm audit --audit-level=high` → 0 high (or documented override)
- [ ] `git diff --check` clean
- [ ] Every finding has source-backed evidence (file:line) marked CONFIRMED
- [ ] Live-state unknowns resolved via authorized readback or documented as external-state unknown
- [ ] `docs/work/HANDOFF.md` updated with outcome and next step
- [ ] Italian summary (max 6 lines) appended to phase commit

---

## Cross-References

| Source | Location |
| --- | --- |
| Agent protocol | `.agents/project/AGENTS.md` §50–66 |
| Coordination rules | `docs/agents/agent-directory.md` §95–107 |
| Handoff contracts | `docs/agents/chat-starters.md` |
| Agent inventory | `docs/governance/AGENTS-INDEX.md` |
| Skill registry | `docs/governance/SKILLS-REGISTRY.md` |
| Definition of done | `.agents/project/AGENTS.md` §75–81 |
| Test strategy | `docs/engineering/test-strategy.md` |

---

## Validation

- All cross-references resolve to existing files
- Coordination rules match `docs/agents/agent-directory.md`
- Agent protocol matches `.agents/project/AGENTS.md`
- Handoff templates exist in `docs/agents/chat-starters.md`