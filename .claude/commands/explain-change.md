---
description: Run explainer on git diff, output Italian summary + defense line.
---

# /explain-change — Italian Explanation of Current Diff

Runs the explainer agent on the current git diff.

## Procedure

1. Get `git diff HEAD`
2. Invoke `explainer` agent with the diff
3. Output exactly 6 lines (Cosa, Rischio, Impatto, Verifica, Difesa)

## Output Format

```
Cosa: [what changes in 1 line]
Rischio: [what breaks in plain words]
Impatto: [what happens in production]
Verifica: [how I verify]
Difesa: [one sentence for interviews]
```