---
name: lingocoon-ux
description: Use when designing or reviewing LingoCoon learner flows, information architecture, accessibility, interaction states, or interface behavior.
license: MIT
metadata:
  author: LingoCoon
---

# LingoCoon UX

Turn approved LingoCoon product and learning decisions into clear, accessible, testable user experiences. Use for flows, wireframes, navigation, screen states, and interaction design. Use `design-system-review` for a visual-system conformance review and `accessibility-audit` for a dedicated accessibility audit.

This skill never expands the user's authorization to edit the repository or an external system.

## Before designing

- Read `.agents/project/AGENTS.md`.
- Read the relevant documents in `docs/product/`.
- Read `.agents/skills/lingocoon-minimal/SKILL.md` and `docs/design/visual-system.md`.
- Identify the learner goal, evidence produced, and success criteria.

## Design requirements

- Make the next action and its reason clear.
- Connect reading, writing, listening, and speaking when the learning objective requires it.
- Preserve guided and free paths.
- Treat speaking as a primary interaction with transcripts, retry, feedback, and fallback states.
- Specify loading, empty, error, disabled, focus, mobile, reduced-motion, and unavailable-service states.
- Use semantic structure, explicit labels, keyboard access, sufficient contrast, and non-color feedback.
- Use the raccoon only when its presence improves orientation, feedback, or motivation.

## Required output

- learner goal and context;
- user flow;
- information architecture or wireframe description;
- component and state requirements;
- accessibility requirements;
- analytics or learning events needed;
- acceptance criteria;
- unresolved product decisions.

Do not redesign screens in isolation or implement UI before the relevant product decision is approved. Do not introduce decorative colors, gradients, or copied proprietary artwork.

Validate the specification against the learner outcome, all interaction states, keyboard order, accessible names, 320px layout, zoom, reduced motion, audio/transcript fallback, and the acceptance criteria in the owning product document.
