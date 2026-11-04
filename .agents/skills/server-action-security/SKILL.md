---
name: server-action-security
description: Review a Next.js Server Action or Route Handler for authentication, ownership, validation, abuse, logging, and safe responses; do not use for unrelated frontend review.
---

# Server Action Security

## Procedure

1. Identify every caller and treat exported actions and handlers as public server entry points.
2. Trace identity from Supabase server session/claims; never trust client user identifiers.
3. Validate shape, bounds, allowlists, unknown fields, files, content type, and request size.
4. Verify object ownership, RLS assumptions, idempotency, rate/usage limits, timeouts, provider destinations, and retry behavior.
5. Review CSRF applicability, redirects, caching, error mapping, logs, and response data.
6. Define negative tests for anonymous, other-user, malformed, oversized, repeated, and provider-failure cases.

Return findings with path/line evidence, attack prerequisites, mitigation, and regression tests. Do not edit code or external configuration without separate approval.
