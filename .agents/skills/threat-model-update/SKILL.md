---
name: threat-model-update
description: Create or update LingoCoon's repository threat model after an architecture or trust-boundary change, or on explicit request; do not use for ordinary code review.
---

# Threat Model Update

Read `docs/architecture/system-overview.md`, `docs/security/security-baseline.md`, and the applicable source. Treat the model as hypotheses and architecture facts, not a vulnerability report.

1. Trace users, entry points, data flows, credentials by reference, sensitive operations, external providers, and deployment paths.
2. Identify assets, attacker starting/non-capabilities, trust boundaries, enforcing controls, assumptions, and unknown live configuration.
3. Build realistic attacker stories with prerequisites, capability gain, impact, evidence, and mitigation.
4. Obtain one independent read-only architecture review for a material rewrite when subagents are authorized.
5. Verify every repository citation and update `docs/security/threat-model.md` only when the architecture evidence changed.

Return changed boundaries, stories, severity calibration, open questions, and source citations. Never reproduce credentials, attack third parties, or convert a hypothesis into a finding without validation.
