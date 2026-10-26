---
name: accessibility-audit
description: Audit a LingoCoon page, component, or flow for WCAG-oriented semantics, keyboard, screen-reader, motion, audio, and responsive barriers; do not use as a visual-style review.
---

# Accessibility Audit

## Procedure

1. Define the exact flow and affected user needs; inspect semantic source first.
2. Check landmarks, headings, labels, names/roles/values, errors, live regions, focus order, and keyboard operation.
3. Check contrast and non-color meaning, 44px targets where practical, zoom/narrow width, reduced motion, transcripts, captions, and permission-denied fallbacks.
4. Run available automated checks only if the repository provides them; otherwise state that no automated accessibility runner exists.
5. Perform or specify manual keyboard, screen-reader, 320px, audio, and motion checks.

Return reproducible findings with affected users, evidence, WCAG reference when known, severity, fix guidance, and retest method. Never claim WCAG conformance from static inspection or a build alone. Writes require separate approval.
