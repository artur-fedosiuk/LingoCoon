---
name: authorized-red-team-test
description: Execute a narrowly authorized defensive abuse test against LingoCoon local or preview scope; do not activate without explicit target and method authorization.
---

# Authorized Red-Team Test

## Authorization gate

Record the exact target, environment, identities, techniques, rate, duration, data rules, stop conditions, and cleanup. If any are missing or include production or a third party, stop and request direction.

## Procedure

1. Prefer static analysis, unit tests, mocks, and local fixtures over live traffic.
2. Establish a harmless control case and expected security invariant.
3. Run only approved cases at a bounded rate; collect minimum reproducible evidence.
4. Stop on unintended data access, service instability, billing risk, or scope ambiguity.
5. Remove temporary accounts/data and verify cleanup.

Return authorization, environment, cases, observations, findings, evidence locations, cleanup, and untested areas. Never access credentials, evade monitoring, persist access, attack users/providers, or infer authorization from repository ownership.
