---
description: Runs context logic: size, what to compact or clear, recommendation.
---

# /session-status — Context Health Check

Analyzes current context and recommends action.

## Procedure

1. Check context size (approximate tokens)
2. Assess what can be compacted or cleared
3. Recommendation based on:
   - **Same task, full context** → compact context
   - **New task** → clear context and start fresh
   - **Heavy exploration** → delegate to explorer subagent
   - **Wrong path** → undo changes
   - **Unsure** → stop and ask

## Output

```
## Context Status
- **Estimated tokens**: {{tokens}}
- **Task**: {{current-task}}
- **Recommendation**: {{action}}
- **Reason**: {{reason}}
```