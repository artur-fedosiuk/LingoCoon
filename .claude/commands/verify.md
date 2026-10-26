---
description: Run npm run check, npm audit --audit-level=high, node --test .claude/hooks, real output.
---

# /verify — Full Verification Pipeline

Runs the complete quality gate with real output.

## Commands

```bash
npm run check
npm audit --audit-level=high
node --test .claude/hooks/hooks.test.mjs
```

## Expected Results

- `npm run check`: All stages pass (secrets scan, 104 security tests, lint, typecheck, build)
- `npm audit --audit-level=high`: No high/critical vulnerabilities
- `node --test .claude/hooks/hooks.test.mjs`: 60 tests pass, 0 fail

Reports actual exit codes and observations.