---
name: lingocoon-ai-learning
description: Use when designing or reviewing LingoCoon AI learning workflows, contracts, recommendations, evaluations, fallbacks, privacy, or usage limits.
license: MIT
metadata:
  author: LingoCoon
---

# LingoCoon AI Learning

Design bounded AI behavior for LingoCoon's personalized learning engine. Use for prompts, AI contracts, recommendation logic, speaking evaluation, learning-event extraction, model selection, and quality plans.

This skill never expands the user's authorization to edit the repository or an external system.

## Before designing

- Read `.agents/project/AGENTS.md`.
- Read `docs/product/learning-profile-v1.md`.
- Read `docs/architecture/learning-engine.md` and `docs/architecture/ai-contracts.md`.
- Identify the learner outcome, allowed data, and failure fallback.

Use `ai-abuse-and-cost-review` when provider limits, retries, privacy, or cost are the primary question. Use `privacy-impact-assessment` for a new data transfer/retention decision and `adaptive-path-evaluation` for recommendation policy.

## Required principles

- Keep learner-controlled text untrusted and separate from system instructions.
- Use schema-validated, bounded outputs.
- Separate observed evidence, model inference, learner preference, and confidence.
- Never allow the model to write arbitrary profile state or bypass authorization.
- Prefer one useful correction and a retry over exhaustive correction.
- Evaluate speaking for task relevance, comprehensibility, target-language use, and improvement without penalizing normal hesitation or acceptable variants.
- Define rate limits, usage budgets, latency targets, privacy handling, and provider fallbacks.
- Minimize personal data sent to providers and define retention for audio and transcripts.

## Required output

- learning objective;
- workflow and state transitions;
- input and output contract;
- validation and authorization boundary;
- prompt-injection and abuse controls;
- evaluation cases and quality thresholds;
- fallback behavior;
- cost and observability plan;
- open decisions.

Do not introduce paid services, unrestricted agents, or production AI behavior without explicit approval.

Before finalizing, test the contract on valid, invalid, oversized, adversarial, ambiguous, low-confidence, budget-exhausted, timeout, malformed-output, and provider-unavailable cases. State what is deterministic application truth and what remains model inference.
