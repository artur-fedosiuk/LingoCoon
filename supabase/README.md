# Supabase Database Source

This directory contains the versioned public-schema baseline, forward
migrations, and database security checks for LingoCoon.

## Baseline

`baseline/20260901_public_schema.sql` records the production `public` schema as
observed on 2026-09-01. It contains schema objects and privileges, but no rows,
users, credentials, or Storage data.

The baseline is a historical snapshot. Do not run it against the existing
production project. A future Supabase CLI setup must mark or reconcile it as
the starting state before using `db push`.

## Forward migrations

Files under `migrations/` are ordered, reviewable changes. The first migration
enables RLS automatically for future `public` tables, changes three unnecessary
`SECURITY DEFINER` functions to invoker mode, and applies least-privilege grants.
The follow-up migration pins the remaining mutable helper-function search paths.

Create future `public` objects through versioned migrations executed by the
project `postgres` role. If another owner role is introduced, audit and narrow
that role's default privileges before exposing its objects through the Data API.

## Verification

Run `tests/database_security.sql` after the migration in a local, isolated, or
explicitly approved environment. The script uses a transaction and rolls back
its temporary probe table.

Never run `supabase db reset --linked` against production.

## Isolated TTS verification

`.github/workflows/database.yml` creates a disposable PostgreSQL service, runs
`scripts/test-database.mjs`, and destroys the service with the job. It never uses
project credentials or connects to hosted Supabase. The runner requires the
local host, database `lingocoon_ci`, and `LINGOCOON_ISOLATED_DB=true`.

`tests/isolated-bootstrap.sql` supplies minimal Auth/Storage schema fixtures for
SQL tests only. It is not a Supabase installation and must never be applied to
the hosted project. Tests exercise ordered upgrades, grants/RLS, quota failures,
cache ownership, preservation of existing consumption, and parallel reservations.
They do not prove Storage HTTP authorization/deletion or live Google playback.

## Google speech rollout boundary

The three TTS migrations dated 20260913, 20260914 and 20260915 must run in order,
after the earlier hardening migrations have been reconciled. The final migration
disables old periods and sets the Chirp cap to 999,700; it creates no positive
allowance. Never apply the historical baseline or test fixtures to an existing
project. Inspect migration history, bucket collisions and the current schema first.

Keep `GOOGLE_TTS_ENABLED=false` until schema, private Storage, server credentials,
cleanup and a reconciled billing period have passed hosted acceptance. Prior and
external usage must be included; the app cap cannot stop other clients using the
Google account. Preserve consumption counters during activation and rollback.
Disable the flag to stop synthesis; retain the ledger and cleanup path.
