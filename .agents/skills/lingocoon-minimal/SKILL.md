---
name: lingocoon-minimal
description: Use when defining or reviewing LingoCoon visual rules, component styling, or migration to its monochrome interface system.
license: MIT
metadata:
  author: LingoCoon
---

# LingoCoon Minimal Design System

Apply the authoritative LingoCoon visual system without inventing a parallel style guide. This skill defines a review workflow and never expands authorization to edit code, configuration, data, assets, or external systems.

## Required sources

Read `docs/design/visual-system.md` completely. Read `docs/design/ux-principles.md` for behavior and the relevant product/flow specification for hierarchy and learner intent. The documents own color, typography, spacing, radii, components, motion, raccoon use, originality, and migration order.

## Review procedure

1. Identify the approved screen, component, state set, and behavior that must remain unchanged.
2. Inventory existing tokens, primitives, one-off values, copied patterns, assets, and accessibility constraints.
3. Compare the proposal or diff with the canonical visual rules and existing reusable components.
4. Report inconsistencies by learner impact and system-wide recurrence, not personal taste.
5. Recommend the smallest token/component migration that preserves behavior and avoids page-specific styling.
6. Require explicit approval before code or asset changes.

## Validation

Check normal, hover, focus-visible, active, disabled, loading, empty, success, warning, error, mobile, zoom, high-contrast, and reduced-motion states where relevant. Verify semantic color, non-color cues, contrast, touch targets, layout stability, and original raccoon usage. Use `design-system-review` for a bounded diff and `accessibility-audit` when accessibility evidence is the primary outcome.

## Output

Return scope, source rules, conformance findings, prioritized changes, reusable token/component implications, accessibility risks, verification cases, and the next approval gate. Do not copy proprietary Duolingo artwork or reproduce its interface.
