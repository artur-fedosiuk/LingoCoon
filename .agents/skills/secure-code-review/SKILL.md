---
name: secure-code-review
description: Review a bounded LingoCoon diff or code path for exploitable security regressions with source-backed findings; do not use for generic style review or an unscoped red-team test.
---

# Secure Code Review

## Procedure

1. Resolve scope, attacker starting capability, protected asset, and trust boundaries.
2. Trace input to authentication, authorization, ownership, parsing, provider calls, storage, logging, and sensitive output.
3. Check RLS/IDOR, CSRF applicability, XSS, SSRF, injection, redirect handling, secrets, abuse limits, dependency/supply chain, and error disclosure where relevant.
4. Validate each candidate against actual callers and controls; reject unsupported keyword findings.
5. Define the smallest mitigation and a regression test without editing unless a fix is separately approved.

Lead with findings ordered by severity. Include impact, prerequisites, path/line evidence, cause, mitigation, test, confidence, and live-state unknowns. If none survive validation, state reviewed surfaces and limits rather than declaring the system secure.
