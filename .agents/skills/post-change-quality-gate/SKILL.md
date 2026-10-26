---
name: post-change-quality-gate
description: Run and interpret LingoCoon's proportionate final verification after a local change; do not use as a substitute for defining acceptance criteria or environment-specific tests.
---

# Post-Change Quality Gate

## Procedure

1. Inspect status, tracked diffs, and untracked files in scope; `git diff` alone omits new files. Run `git diff --check`.
2. Read current `package.json` commands and the relevant acceptance criteria. Never hard-code a test count or assume a runner exists.
3. For application changes, run the repository baseline `npm run check` and change-specific checks from `docs/engineering/test-strategy.md`. Disclose failed commands and alternative build modes separately.
4. Confirm tests import or exercise shipped implementation. A passing duplicate algorithm, fixture-only assertion, or source-string check is not proof of runtime behavior.
5. For UI, require rendered success, failure, keyboard, and narrow-screen evidence against the accepted references. If login blocks the target flow, mark it unverified; do not weaken auth to get a screenshot.
6. For documentation/skills only, validate changed links, YAML/TOML where relevant, routing, and one realistic behavioral scenario. Do not rebuild the application merely because prose changed.
7. Check scanner scope before claiming coverage of new files. Use dependency audit for application/dependency work, history scan when publication/history exposure is relevant, and scanner self-test after scanner changes.
8. Report criteria as verified, failed, or unverified with evidence and environment. Agent self-reports and green compilation do not override missing acceptance evidence.

Use database, security, accessibility, provider, performance, and release procedures only for affected boundaries. No production access, auth bypass, external write, dependency installation, or deployment is authorized here.
