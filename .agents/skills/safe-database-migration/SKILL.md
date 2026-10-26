---
name: safe-database-migration
description: Prepare and verify one approved forward Supabase/PostgreSQL migration with rollback and RLS evidence; do not use for dashboard SQL or remote execution without approval.
---

# Safe Database Migration

## Procedure

1. Check Git state; read `supabase/README.md`, the historical baseline, all forward migrations, callers, and generated types.
2. State the invariant, data effect, lock/availability risk, compatibility, and rollback before writing.
3. Add one ordered migration; never rewrite the baseline to represent a new change.
4. Make ownership, grants, RLS, constraints, indexes, search paths, idempotency, and deletion behavior explicit.
5. Test upgrade and security behavior in a local or isolated database, including owner/other/anon and representative existing data.
6. Prepare—but do not execute—the exact remote apply, verification, and rollback/readback steps.

Return SQL files, behavior, test evidence, risks, rollback, and external approval checkpoint. Never use a linked reset, guessed live schema, broad destructive SQL, or production execution by implication.
