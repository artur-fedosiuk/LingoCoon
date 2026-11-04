---
name: supabase-rls-audit
description: Audit versioned Supabase grants, functions, ownership, and RLS policies for one schema or table set; do not use to apply remote SQL.
---

# Supabase RLS Audit

Read `supabase/README.md`, the baseline, every forward migration, and `supabase/tests/database_security.sql` before conclusions.

1. Inventory tables, ownership columns, foreign keys, functions, grants, default privileges, and policies.
2. For each operation, verify owner-scoped `SELECT`, `UPDATE`, `DELETE`, and `INSERT WITH CHECK`; test anon, owner, and other authenticated user.
3. Check child ownership, security-definer use, pinned search paths, executable grants, Storage, Realtime, and service-role boundaries where present.
4. Compare source with live state only through an explicitly authorized metadata-only inspection.
5. Run the transactional SQL test only against a local, isolated, or explicitly approved database.

Return a table-by-operation matrix, evidence, gaps, test results, and drift unknowns. Never disable RLS, overlap policies blindly, expose service credentials, or modify the remote project.
