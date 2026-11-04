# LingoCoon Agent Workspace

This private workspace keeps Codex operating guidance separate from public product source. Project-scoped Codex runtime configuration lives beside it in `../.codex/`.

## Required loading order

1. The repository-root `AGENTS.md` is discovered automatically by Codex.
2. Read `project/AGENTS.md` completely before project work.
3. Read `project/configuration-map.md` for configuration, tooling, Git, CI, deployment, or publication questions.
4. Read the relevant authoritative document in `../docs/`.
5. Load every skill explicitly named by the user or assigned agent prompt, then add only the narrow skills required by the active task.

Skill discovery exposes routing metadata; selecting a skill requires reading its full `SKILL.md`. Codex can select matching skills implicitly: the user does not need to name them in every request. Delegation prompts must name required skills explicitly, and the recipient must confirm loading them. A skill list or a task name alone proves neither invocation nor correct execution. Every skill preserves the approval boundaries in `project/AGENTS.md`.

Default to one delivery owner, not a chain of departments. Consult [working method](../docs/agents/chat-starters.md) for handoffs and [Context Studio](../docs/product/context-studio.md) for the active reader scope and evidence. Retained specialist roles are optional resources, not a checklist to run.

## Structure

- `project/AGENTS.md`: complete project-wide instructions and approval boundaries.
- `project/configuration-map.md`: ownership, location, publication status, and validation for repository configuration.
- `skills/`: six domain skills plus narrow, repeatable delivery, security, QA, database, release, privacy, and documentation procedures.
- `../.codex/config.toml`: project-scoped safe defaults and bounded multi-agent concurrency.
- `../.codex/agents/`: persistent custom-agent role definitions.
- `../docs/agents/`: human-readable agent matrix and dedicated-chat starters.
- `../AGENTS.md`: minimal repository-root entrypoint required for automatic instruction discovery.

## Skill routing

| Task | Skill |
| --- | --- |
| Product strategy, priorities, learning scope, personalization, or gamification | `lingocoon-product` |
| Evidence-backed product, competitor, learning, UX, technology, or repository research | `lingocoon-research` |
| Learner flows, information architecture, accessibility, interaction states, or interface behavior | `lingocoon-ux` |
| Visual rules, component styling, or monochrome-system migration | `lingocoon-minimal` |
| AI learning workflows, contracts, evaluation, privacy, fallback, or usage limits | `lingocoon-ai-learning` |
| Explicitly approved code, refactor, test, integration, dependency, or migration work | `lingocoon-engineering` |

Use procedure skills for repeatable work such as `feature-delivery`, `secure-code-review`, `safe-database-migration`, `test-plan-and-coverage`, `git-safe-workflow`, and `post-change-quality-gate`. The complete inventory and agent mapping live in `docs/agents/agent-directory.md`.

Use the smallest matching set. Availability is routing information, not modification authority.

## Runtime scope

- Automatic project loading applies only to Codex tasks opened with this LingoCoon checkout as their workspace/current repository.
- Root `AGENTS.md` is loaded when a task/session starts; restart a task after changing project instructions if the current task still shows stale behavior.
- Skill additions and edits are detected automatically; restart Codex if a changed skill does not appear.
- Custom-agent TOML files configure spawned subagent sessions. A chat-starter prompt does not itself turn the main task into that TOML agent, so it must explicitly request delegation when the custom agent is required.
- Because `AGENTS.md`, `.agents/`, `.codex/`, and `docs/` are ignored, this operating system is available only in this checkout unless copied or published separately.
