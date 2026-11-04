# LingoCoon Visual System

## Status

Approved visual foundation for the future product rebuild. The first-mission asset brief below is recommended for implementation approval. This document supersedes the removed legacy root `DESIGN.md`.

- Version: 1.1
- Last reviewed: 2026-08-30

## Visual identity

LingoCoon uses a quiet monochrome interface with a distinctive raccoon illustration system. The learning content remains more prominent than the surrounding UI.

## Foundations

- Use white surfaces, near-black text, and neutral grays.
- Use black for primary actions and active navigation.
- Reserve red, green, and amber for semantic error, success, and warning states.
- Do not use decorative gradients, rainbow palettes, glassmorphism, or excessive shadows.
- Use the native system font stack.
- Use spacing values from `4 / 8 / 12 / 16 / 24 / 32px`.
- Use `4px`, `8px`, and `12px` corner radii consistently.

## Components

- Primary action: black surface with white text.
- Secondary action: white surface with gray border and near-black text.
- Input: white surface, gray border, and visible neutral focus state.
- Card: white surface, light gray border, minimal shadow.
- AI feature: icon and explicit label, never a separate decorative color system.
- Loading state: subtle, informative, and subordinate to the current task.

## Raccoon illustration system

- Use original vector-style artwork or code-native vector assets.
- Define a small reusable set of poses and expressions before adding variants.
- Use expressions to communicate state, encouragement, and progress.
- Keep illustrations functional and lightweight.
- Do not imitate another product's character design or proprietary assets.

## Interaction motion

Use motion only for orientation, feedback, progress, and meaningful state changes. Respect reduced-motion preferences and avoid ornamental animation.

## Accessibility

Maintain WCAG 2.2 AA contrast, visible focus, semantic structure, readable labels, and non-color communication of meaning. Verify mobile, hover, focus, disabled, loading, and reduced-motion states.

## First-mission visual hierarchy

- Use a centered learning column with a readable maximum width and one dominant task.
- Keep navigation and progress visually stable between mission steps.
- Use bordered neutral surfaces for supporting information; do not wrap every text block in a card.
- Reserve large type for the current learning outcome, not marketing slogans inside the app.
- Use semantic color only after the accompanying text makes the state clear.
- Keep the raccoon beside orientation or feedback, never between the learner and the primary input.

## Original raccoon v1 asset brief

Create one original vector character with consistent proportions, line weight, facial construction, tail markings, and neutral grayscale palette. The design must be recognizable at small sizes and must not reproduce another product's mascot silhouette, costume, facial language, or poses.

The minimum reusable pose set is:

| Pose | Product purpose | Required expression or gesture |
| --- | --- | --- |
| Guide | Introduce a mission or explain the next action. | Open posture, calm attention, one directional gesture. |
| Listening | Support listening and speaking tasks. | Attentive ears or hand-to-ear gesture; no judgement. |
| Thinking | Indicate bounded processing. | Quiet reflective expression; no frantic loop. |
| Coach | Prepare a retry. | Encouraging posture that points to one improvement. |
| Success | Mark completed communication. | Small celebration that does not cover results. |
| Recoverable failure | Explain provider or save failure. | Calm concern with a visible recovery direction, never punishment. |

Asset requirements:

- SVG or code-native vector source with optimized exported SVGs;
- stable view box, descriptive asset name, and no embedded raster image;
- decorative instances hidden from assistive technology; meaningful instances paired with equivalent text;
- mirrored variants only when direction is meaningful and markings remain consistent;
- static fallback for every animation;
- no text embedded in artwork;
- target compressed size and rendering budget defined before implementation.

## Motion vocabulary

Only four motion purposes are allowed in v1:

1. reveal the next mission state;
2. confirm a completed learner action;
3. show bounded processing;
4. highlight meaningful improvement after retry.

Each motion needs a reduced-motion replacement. Looping processing motion stops at timeout and changes to a textual recovery state.

## Migration order

1. Define tokens and shared primitives without changing behavior.
2. Migrate the application shell and navigation.
3. Build the personalized home and mission shell.
4. Add the six approved raccoon poses.
5. Migrate supporting deck and LexiCoon surfaces only after the primary loop is coherent.
6. Remove legacy visual rules only after responsive and accessibility comparison passes.

Do not perform a page-by-page reskin before the new information architecture and mission flow exist.
