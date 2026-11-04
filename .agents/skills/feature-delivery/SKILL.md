---
name: feature-delivery
description: Deliver one explicitly approved LingoCoon feature from accepted contracts through implementation and verification; do not use while product scope is unresolved.
---

# Feature Delivery

## Inputs

Read the approved outcome, existing feature document, relevant handoff, write owner, and external-action boundary. If scope is accepted, do not restart discovery. If the handoff is inaccessible, disclose that before relying on it.

## Procedure

1. Inspect the worktree, real execution path, and existing tests. Preserve unrelated edits.
2. Record a small acceptance-to-evidence checklist in the owning feature document or current task. For UI, identify the supplied reference states and the interaction qualities to preserve, not just colors and component names.
3. Keep one owner accountable from implementation through verification. Delegate only independent questions; do not automatically create a product–UX–architecture relay.
4. Deliver the smallest usable end-to-end slice. Reduce breadth, not the correctness of selection, loading/error recovery, keyboard behavior, or narrow-screen layout. Missing core behavior requires an explicit scope decision, not silent removal.
5. Test the actual shipped functions/components. Do not duplicate algorithms inside tests or count assertions on literal fixtures as behavioral coverage. Explain which real regression each test catches.
6. For visible changes, use $browser-e2e-validation and compare the rendered states to the accepted references. Fix demonstrated mismatches within the approved slice before handoff; record other unmet criteria without expanding scope implicitly. A login redirect cannot verify the reader; a mock cannot verify a live provider.
7. Run $post-change-quality-gate. Reconcile reviewer findings yourself, then update the existing delivery record.

## Output and boundary

Report implemented behavior, verified criteria, commands and evidence, unverified/blocked criteria, remaining risk, and next action. Do not call a critical unverified flow complete. No new dependencies, Git actions, external services, database-remote changes, or deployment are authorized by this skill.
