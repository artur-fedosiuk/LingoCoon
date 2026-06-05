---
name: LingoCoon Minimal
colors:
  primary: "#111111"
  secondary: "#525252"
  surface: "#FFFFFF"
  surfaceMuted: "#FAFAFA"
  border: "#E5E5E5"
  text: "#111111"
  textMuted: "#737373"
  success: "#16A34A"
  warning: "#D97706"
  danger: "#DC2626"
typography:
  h1:
    fontFamily: "System UI"
    fontSize: 2.25rem
  body-md:
    fontFamily: "System UI"
    fontSize: 1rem
  label-caps:
    fontFamily: "System Mono"
    fontSize: 0.75rem
  sourceScale: "12/14/16/18/24/30/36"
  weights: "400, 500, 600, 700"
rounded:
  sm: 4px
  md: 8px
  lg: 12px
spacing:
  sm: 4px
  md: 8px
  sourceScale: "4/8/12/16/24/32"
---

## Overview

LingoCoon uses a quiet, modern, monochrome interface. The content and learning task must remain more visible than the interface around them.

## Style Foundations

- Use white surfaces, near-black text, and a restrained gray scale.
- Use black for primary actions and active navigation.
- Use gray borders and subtle background changes for secondary actions and hover states.
- Do not use decorative gradients, colored cards, or colored icons.
- Reserve red, green, and amber for errors, success states, and warnings only.
- Use the native system font stack to avoid external font requests.
- Follow the spacing scale `4 / 8 / 12 / 16 / 24 / 32`.
- Use rounded corners consistently: `4px` for compact controls, `8px` for buttons and inputs, `12px` for cards and panels.

## Component Rules

- Primary buttons: black background, white text, subtle black hover state.
- Secondary buttons: white background, gray border, near-black text, light gray hover background.
- Inputs: white background, gray border, black focus border, visible neutral focus ring.
- Cards: white surface, light gray border, no colored background, minimal or no shadow.
- AI features: use a sparkle or bot icon and clear labels, not a separate color palette.
- Errors: use red only for the message, border, or destructive action.
- Success and warning colors: use only when the state needs semantic emphasis.

## Accessibility

- Preserve WCAG 2.2 AA contrast.
- Every interactive element must have a visible focus state.
- Touch targets should be at least `44px` where practical.
- Do not rely on color alone to communicate meaning.
- Keep labels explicit and readable in all supported interface languages.

## Prohibited Patterns

- No violet, indigo, blue, or rainbow accents.
- No decorative gradients.
- No glassmorphism, excessive shadows, or ornamental animation.
- No one-off visual style for AI pages.
- No low-contrast gray text for essential information.
