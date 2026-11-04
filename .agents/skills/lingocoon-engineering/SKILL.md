---
name: lingocoon-engineering
description: Use when implementing or reviewing an explicitly approved LingoCoon code change, refactor, test, integration, or migration.
license: MIT
metadata:
  author: LingoCoon
---

# LingoCoon Engineering

Implement approved LingoCoon product and architecture work in small, verifiable increments. Use for application code, refactors, tests, integrations, and migrations after the required specification is approved.

This skill never expands the scope of the user's approved change or authorizes external-system changes.

Use `feature-delivery` for the end-to-end delivery sequence, a narrower security/database/UI procedure when that boundary dominates, and `post-change-quality-gate` for final evidence. This domain skill supplies LingoCoon engineering constraints rather than duplicating those procedures.

## Before editing

- Read `.agents/project/AGENTS.md` and the relevant product, architecture, design, and security documents.
- Inspect current code paths, types, dependencies, and tests.
- Identify behavior to preserve, files in scope, data and security boundaries, and acceptance criteria.
- Stop and report an ambiguity that would materially change the product or data model.

## Implementation requirements

- Use strict TypeScript, English identifiers, and readable small modules.
- Prefer the smallest complete vertical slice.
- Validate all untrusted input at runtime.
- Enforce authorization at the server and data boundaries.
- Keep provider failures, loading, empty, error, disabled, mobile, keyboard, and reduced-motion states explicit.
- Avoid new production dependencies unless separately approved.
- Do not modify unrelated user work.

## Verification

Run the applicable unit or integration tests, lint, type-check, build, accessibility checks, security checks, and manual browser verification. Interpret failures instead of hiding them. Report commands, results, changed behavior, remaining limitations, and follow-up work.

Do not implement a speculative feature, change external services, or claim completion without evidence.
