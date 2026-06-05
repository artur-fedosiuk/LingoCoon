---
name: lingocoon-minimal
description: Monochrome, modern, distraction-free design system for the LingoCoon language-learning application.
license: MIT
metadata:
  author: LingoCoon
---

# LingoCoon Minimal Design System

## Mission

Build a quiet, modern language-learning interface where the content is always more prominent than the surrounding UI.

## Foundations

- Use white surfaces, near-black text, and neutral grays.
- Use black for primary actions and active navigation.
- Use light gray backgrounds and borders for secondary hierarchy.
- Reserve red, green, and amber for semantic error, success, and warning states only.
- Do not introduce decorative colors, gradients, or page-specific palettes.
- Use the native system font stack to avoid external font requests.
- Follow the spacing scale `4 / 8 / 12 / 16 / 24 / 32`.
- Use `4px`, `8px`, and `12px` corner radii consistently.

## Component Rules

- Primary buttons must use a black background and white text.
- Secondary buttons must use a white background, gray border, and near-black text.
- Inputs must use a white surface, gray border, and visible neutral focus state.
- Cards must use a white surface and light gray border with minimal or no shadow.
- AI features must be identified with icons and labels, not a separate color system.
- Loading states should be subtle and never visually dominate the current task.

## Accessibility

- Preserve WCAG 2.2 AA contrast.
- Keep visible focus states on every interactive element.
- Use semantic HTML before ARIA.
- Do not communicate meaning using color alone.
- Prefer at least `44px` touch targets where practical.

## Prohibited Patterns

- No violet, indigo, blue, or rainbow decoration.
- No decorative gradients.
- No glassmorphism or excessive shadows.
- No ornamental animations.
- No special visual language limited to AI screens.

## Migration Guidance

When updating existing UI:

1. Preserve the existing behavior and content hierarchy.
2. Replace decorative color with black, white, or neutral gray.
3. Remove gradients before changing component structure.
4. Keep semantic error, success, and warning colors only where they communicate state.
5. Verify hover, focus, disabled, loading, and mobile states after every component change.
