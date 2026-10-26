---
name: browser-e2e-validation
description: Validate an approved LingoCoon user flow in a local or authorized preview browser with reproducible evidence; do not use to deploy or test production implicitly.
---

# Browser E2E Validation

## Procedure

1. Define the flow, expected state, accepted visual references, account/data fixture, environment, and cleanup. Verify that the target page is reachable, not merely its login screen.
2. Start local code with `npm run dev` unless an authorized preview is explicitly selected.
3. Exercise success, loading, empty, validation, provider failure, permission denial, save failure, and recovery states that apply.
4. Check keyboard flow, focus, 320px layout, touch targets, reduced motion, audio/transcript behavior, console errors, and relevant network responses.
5. For visible UI changes, capture and inspect the relevant desktop and narrow-screen states against the references. Record mismatches in hierarchy, reading width, selection feedback, focus, overflow, and controls. Never capture secrets or unnecessary personal data.
6. Clean up fixtures and distinguish observed results from unavailable cases.

If authentication is unavailable, report the protected flow as unverified and request normal sign-in when needed. An isolated component fixture may verify presentation but must not bypass application auth or be presented as authenticated/provider evidence. A mocked provider response does not prove a real translation works.

Return environment/revision, steps, expected versus actual, evidence, defects, accessibility notes, and cleanup. Inspect current tooling before naming an automated runner; do not claim automation that was not configured and run.
