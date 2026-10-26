---
name: ai-abuse-and-cost-review
description: Review a LingoCoon AI, TTS, or STT operation for abuse resistance, durable limits, provider privacy, retries, cost, and fallback; do not use for model-quality evaluation alone.
---

# AI Abuse and Cost Review

Read `docs/architecture/ai-contracts.md` and `docs/security/threat-model.md`.

1. Trace authentication, ownership, input bounds, system/user separation, output schema, persistence, logs, and provider destination.
2. Model burst, daily, concurrent, retry, multi-instance, and global-budget abuse.
3. Define operation units: tokens, characters, bytes, audio duration, or requests.
4. Require atomic persistent reservations, per-user caps, global hard stop, reconciliation, no paid overage, and privacy-safe usage metadata before public provider-backed release.
5. Check timeouts, cancellation, malformed output, provider retention, data location, consent/legal basis, and deterministic fallback.
6. Verify current free limits and terms immediately before numeric recommendations.

Return data flow, abuse cases, effective/missing controls, budget inputs, fallback, tests, and approval decisions. Never access keys, call paid services, or treat an in-memory limiter as a durable distributed quota.
