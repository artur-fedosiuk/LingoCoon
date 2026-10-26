---
description: 3 questions of increasing difficulty on last change, you answer, I correct, append to docs/learning-log.md.
---

# /teach-me — Learning Exercise on Last Change

Interactive learning: 3 questions of increasing difficulty, you answer, I correct, logs to `docs/learning-log.md`.

## Procedure

1. Get last commit: `git log -1 --pretty=format:"%s %b"`
2. Ask 3 questions:
   - **Q1 (Recall)**: What was the main change and why?
   - **Q2 (Analysis)**: What could break? What are the edge cases?
   - **Q3 (Synthesis)**: How would you verify it works in production? What would you monitor?
3. User answers each
4. I provide correct/expanded answer
5. Append to `docs/learning-log.md`:
   ```markdown
   ## {{date}} — {{commit-message}}

   **Q1**: {{question}}
   **A1**: {{user-answer}}
   **Correct**: {{correct-answer}}

   **Q2**: {{question}}
   **A2**: {{user-answer}}
   **Correct**: {{correct-answer}}

   **Q3**: {{question}}
   **A3**: {{user-answer}}
   **Correct**: {{correct-answer}}

   ---
   ```

## Output

Interactive Q&A session with corrections, then log entry.