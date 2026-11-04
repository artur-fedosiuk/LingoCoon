---
description: Fill the template Goal / Context files / Constraints / Done when / Verify commands, restate it, then execute autonomously.
arguments:
  - name: goal
    description: What you want to accomplish
    required: true
  - name: context_files
    description: Comma-separated file paths relevant to the task
    required: false
  - name: constraints
    description: Hard limits or rules to follow
    required: false
  - name: done_when
    description: Verifiable completion criteria
    required: false
  - name: verify_commands
    description: npm scripts or commands to run for verification
    required: false
---

# /task — Autonomous Task Execution

## Template

**Goal**: {{goal}}

**Context files**: {{context_files}}

**Constraints**: {{constraints}}

**Done when**: {{done_when}}

**Verify commands**: {{verify_commands}}

---

## Execution

1. Restate the above clearly
2. Explore via subagents if needed (keep context clean)
3. Implement
4. Run verify commands
5. Report: implemented / verified / blocked / proposed separately

If any field is not provided, use sensible defaults from CLAUDE.md and AGENTS.md.