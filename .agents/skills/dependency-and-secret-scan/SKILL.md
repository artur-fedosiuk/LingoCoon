---
name: dependency-and-secret-scan
description: Check LingoCoon dependencies and reachable Git content for known vulnerabilities and credential-shaped material; do not use to print or rotate secrets.
---

# Dependency and Secret Scan

## Procedure

1. Check `git status --short --branch` and avoid reading `.env.local` values.
2. Run `npm ls --depth=0` and explain extraneous, missing, or invalid packages.
3. Run `npm audit --audit-level=high`; verify advisories before recommending an update.
4. Run `npm run security:secrets` for the current tree.
5. Run `npm run security:secrets:history` when publication, history, or prior exposure is in scope.
6. Run `npm run security:secrets:self-test` only after scanner changes or during scanner verification.

Return commands, exit status, affected package/path metadata without secret values, reachability, severity, remediation, and external rotation/revocation actions. A clean scan is evidence for its rules and refs, not proof that no credential exists anywhere.
