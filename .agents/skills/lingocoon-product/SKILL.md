---
name: lingocoon-product
description: Use when defining or reviewing LingoCoon product strategy, learning scope, priorities, personalization, gamification, or learner outcomes.
license: MIT
metadata:
  author: LingoCoon
---

# LingoCoon Product Skill

Treat LingoCoon as a public language-learning product, not a flashcard demo.

This skill never expands the user's authorization to edit the repository or an external system.

## Product direction

- Optimize for useful real-world language production.
- Treat personalization as the core product capability.
- Support both a structured path and learner-created activities.
- Give speaking a first-class role alongside reading, writing, and listening.
- Use the raccoon as a helpful guide, feedback character, and progress metaphor.
- Keep the product accessible, fast, privacy-conscious, and compatible with a zero-budget constraint.

## Before proposing a feature

Explain:

1. the learner problem;
2. the pedagogical or product reason;
3. the smallest useful version;
4. how it personalizes the experience;
5. what data it creates or changes;
6. how success will be measured;
7. the main risks and fallback behavior.

Read `docs/product/vision-and-principles.md` before making product-direction decisions. Read `docs/product/learning-profile-v1.md` before making decisions about learner data, errors, recommendations, speaking evaluation, or the structured/free learning paths. Read `docs/product/first-learning-mission.md` before specifying the first end-to-end learning experience.

Use `feature-discovery` to turn an unresolved idea into an approval brief. Use `learning-feature-design` when the product decision is accepted and the learning activity needs a measurable contract.

## Learning loop

Prefer activities that move through context, attempt, feedback, retry, and delayed review. Do not make isolated flashcard repetition the default learning experience.

Every meaningful interaction should produce structured learning signals when the learner has consented to saving them. Distinguish uncertain AI feedback from confirmed learner errors, and avoid overcorrecting acceptable variants or accents.

## AI behavior

The AI should propose, generate, evaluate, and explain bounded learning activities. It must not behave as an unrestricted chatbot or write arbitrary profile data. Use validated schemas, explicit completion criteria, safe fallbacks, and transparent recommendations.

For speaking activities, reward relevant independent responses, comprehensibility, improvement, and appropriate use of target language. Do not reward repeated memorized phrases without conversational relevance.

## Product scope

Start with one complete, testable learning mission before building multiplayer, a browser extension, a large content library, or complex reward systems. Preserve a clear distinction between product decisions, learning design, UX design, architecture, implementation, and verification.

## Output expectations

When creating a plan, include a small number of prioritized phases, dependencies, measurable acceptance criteria, and the next decision requiring approval. Do not implement code or change external services unless the user explicitly authorizes that step.

Before finalizing, verify that the recommendation is consistent with the vision, learner-profile boundaries, first-mission scope, roadmap, zero-budget rule, and current repository capability. Label assumptions and time-sensitive provider facts.
