---
paths:
  - src/app/**
  - src/components/**
---

# Rules for UI (src/app/**, src/components/**)

## Security-Critical Path
- User interface components and pages
- Accessibility, i18n, responsive design

## Rules
- **Semantic HTML before ARIA** — visible focus states on every interactive element
- **Keyboard access to every action** — recording, audio, hints, transcript, feedback, navigation
- **i18n (en/fr/it/uk)** — no hardcoded strings; labels and text in addition to color or icons
- **320px minimum** — one content column, no horizontal page scroll at narrow width
- **Reduced motion** — respect `prefers-reduced-motion`; no looping animation without a static fallback
- **Touch targets** — at least `44px` where practical
- **WCAG 2.2 AA contrast** — verify mobile, hover, focus, disabled, loading, reduced-motion states
- **No placeholder controls** — every visible element maps to a real behavior

## Validation
```bash
npm run lint
npm run typecheck
npm run test:security
```