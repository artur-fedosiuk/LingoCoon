---
description: Updates docs/work/HANDOFF.md with done, current state, next step, commands to resume.
---

# /handoff — Update Session Handoff Document

Updates `docs/work/HANDOFF.md` with session summary.

## Procedure

1. Read current `docs/work/HANDOFF.md` (if exists)
2. Update with:
   - **Done**: What was completed this session
   - **Current state**: Branch, key files changed, test status
   - **Next step**: What to do next session
   - **Commands to resume**: Exact commands to run
3. Write back to `docs/work/HANDOFF.md`

## Template

```markdown
# Handoff — {{date}}

## Done
- {{item1}}
- {{item2}}

## Current State
- **Branch**: {{branch}}
- **Key files**: {{files}}
- **Tests**: {{status}}

## Next Step
{{next-step}}

## Commands to Resume
```bash
{{command1}}
{{command2}}
```
```