# LingoCoon Working Method

- Version: 2.0
- Last reviewed: 2026-09-08
- Supersedes the sixteen department starters. Existing tasks may stay open; do not create, restart, message, or archive them without a task-specific reason and the applicable authorization.

## Default: one owner, one complete slice

Use this main task for decisions and ordinary delivery. One owner carries the accepted outcome through implementation, browser verification, and review. A separate task is useful for a large independent piece of work, not a mandatory department through which every feature must pass.

Keep one short delivery record inside the existing feature document: outcome, accepted scope/non-goals, owner and workspace/branch, write boundary, acceptance evidence, unresolved blockers, and next action. For the reader, use [Context Studio](../product/context-studio.md). This is the shared handoff, not a second backlog.

Task histories are separate. A main task does not automatically receive another task's findings; the owner must read the actual handoff and reconcile it. The same checkout shares files, not reasoning. Private ignored instructions may be absent from another clone/worktree.

## Handoff and ownership

1. Select one deliverable that a learner can actually use. Map each accepted requirement to an observable check before coding.
2. Read relevant existing research and UX output. Separate accepted decisions from proposals; do not repeatedly ask approval for the same accepted scope.
3. Give implementation to one owner. Record a handoff before another task edits the same files, and confirm the previous writer is stopped.
4. For a side question, use one bounded read-only specialist. State the custom agent, required `$skill-name`, exact question, evidence format, and prohibition on edits. Avoid a coordinator spawning another coordinator.
5. Review the rendered result against the supplied references, not just the component names. Login redirects, mocked providers, and static checks must be labelled for what they prove.
6. Return a concise result with acceptance evidence and remaining gaps. Update the feature record; do not copy full chat transcripts into docs.

Prefer compact task status/results over polling or rereading entire histories. Do not send the user between tasks merely to copy our own summaries.

## Starter: deliver an accepted feature

Use in the main task or one explicitly created delivery task; no subagent is required.

```text
Act as the sole delivery owner for the approved change below. Load $feature-delivery and $lingocoon-engineering, then $post-change-quality-gate for verification. Read the project entrypoint and the named feature document, including current owner and evidence. Inspect the relevant implementation and existing user changes. Carry the accepted slice through implementation and verification; do not restart product discovery or spawn departments by default.

Before editing, state the observable outcome and local write boundary. Preserve auth, privacy, budget and unrelated work. For UI, compare actual rendered desktop/mobile states to the accepted references. Tests must call production code. Report unavailable browser/provider checks honestly and do not claim completion with an unverified critical flow. No dependency, Git, remote-service, or deployment changes are included.

Feature document and approved change:
[Provide the existing document and concrete task.]
```

## Starter: investigate one unresolved question

Use only when the answer can change a product or implementation decision.

```text
Investigate only the question below, read-only. Load $lingocoon-research and the one additional domain skill required by the question. Read the named feature document and relevant source. Use primary sources; for interaction quality, distinguish hands-on observations, supplied screenshots, official documentation, and inference. If account access is unavailable, state that limitation.

Return the recommendation, direct evidence, tradeoffs, and the few observable acceptance criteria it changes. Do not produce a new roadmap, edit files, start other tasks, or treat proposals as approved.

Question and feature document:
[Provide one question and the owning document.]
```

## Starter: independently review a delivery

Use a bounded `qa_test_engineer` subagent or an explicitly requested review task.

```text
Act as a read-only reviewer. Load $test-plan-and-coverage and $post-change-quality-gate; load $browser-e2e-validation only if the specified browser flow is accessible and in scope. Confirm loaded skills. Review the specified files and acceptance criteria independently.

Try to disprove completion: do tests execute shipped logic, do the supplied screenshots demonstrate the intended interaction, and do async/failure/keyboard/narrow-screen cases have evidence? Distinguish confirmed defects, unverified claims, and optional improvements. Return the most important findings with paths, reproduction steps or missing evidence, and a completion recommendation. Do not edit, use secrets, call paid providers, or access production.

Feature document, file boundary, and available environment:
[Provide the exact review scope.]
```

Specialist roles and additional procedures remain in the [agent directory](agent-directory.md). They are capabilities to select when needed, not sixteen standing tasks.
