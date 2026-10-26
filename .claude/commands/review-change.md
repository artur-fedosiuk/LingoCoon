---
description: Run security-reviewer and privacy-reviewer on git diff, fix findings.
---

# /review-change — Security & Privacy Review on Current Diff

Runs both reviewers on the current git diff and fixes findings.

## Procedure

1. Get `git diff HEAD`
2. Invoke `security-reviewer` agent with the diff
3. Invoke `privacy-reviewer` agent with the diff
3. Report all findings (severity ordered, evidence mandatory)
4. Fix findings that are actionable in this session
5. Re-run verification after fixes

## Output

- Security findings (Critical → High → Medium → Low)
- Privacy findings (GDPR / EU AI Act)
- Fixes applied
- Verification results