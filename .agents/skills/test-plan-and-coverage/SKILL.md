---
name: test-plan-and-coverage
description: Build a risk-based LingoCoon test plan and coverage map for an approved change or subsystem; do not use merely to run the existing quality command.
---

# Test Plan and Coverage

## Procedure

1. Start from acceptance criteria, state transitions, trust boundaries, regressions, and failure modes.
2. Inventory existing tests and runners; do not invent tools that are absent.
3. Map each risk to the cheapest reliable layer: unit, integration, database/RLS, API, component, browser E2E, accessibility, performance, or manual.
4. Define fixtures for anonymous, owner, other user, malformed input, duplicate/retry, provider failure, narrow viewport, keyboard, and reduced motion where relevant.
5. Specify command, environment, expected evidence, cleanup, and release-blocking threshold.
6. Identify unautomated coverage and whether a dependency/tooling proposal needs approval.

Return a behavior-to-test matrix, current coverage, missing cases, priority, commands, fixtures, and blocked environments. Do not equate line coverage with product correctness.
