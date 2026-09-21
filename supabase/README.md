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
disables old periods. The 20260918010000 safety-margin migration lowers the
Chirp cap to 999,000 without resetting counters; it creates no positive
allowance. Never apply the historical baseline or test fixtures to an existing
project. Inspect migration history, bucket collisions and the current schema first.

Keep `GOOGLE_TTS_ENABLED=false` until schema, private Storage, server credentials,
cleanup and a reconciled billing period have passed hosted acceptance. Prior and
external usage must be included; the app cap cannot stop other clients using the
Google account. Preserve consumption counters during activation and rollback.
Disable the flag to stop synthesis; retain the ledger and cleanup path.

## Queue-aware TTS release (2026-09-20)

Apply `migrations/20260920010000_tts_admission_queue.sql` **before enabling the
new application build**. It requires all four previous TTS migrations, including
the 999,000 safety-margin migration. On the existing project, those earlier TTS
changes were applied as a composite migration: inspect the ledger; do not replay
the baseline or the original non-idempotent migrations. The new migration runs
in one transaction and must be recorded once in the migration history.

The migration adds two service-only tables and `reading_tts_admit`. It preserves
all consumed characters, period dates, enabled state and lifetime allowance.
Only old configuration defaults change: generation slots 2 -> 5, global daily
characters 10,000 -> 999,000 and per-user daily characters 3,000 -> 10,000.
Custom overrides remain. The shared-IP access window changes from 180 to 1,200
requests/minute; the per-user access window remains 90. These are operational
limits, not a guarantee of 100 simultaneous Google generations or free hosting.

Admission keeps at most 100 waiting owners, one ticket per owner. The oldest
small batch can claim free slots; it is not strict completion-order FIFO.
Tickets expire after 20 seconds without polling. Polls earlier than one second
are rejected. The browser waits 4–9 seconds between explicit `202 queued`
responses and stops after 180 seconds; closing/canceling stops polling and the
ticket expires. Waiting tickets store no text and reserve no characters.
All planned Google chunks are reserved against 180 requests in a rolling
90-second window before generation; provider errors are never automatically
retried. This assumes the existing 30-second generation deadline and exclusive
use of this dispatch path. Calls made outside LingoCoon are not controlled.

No new Google API, credential, external queue service or local daemon is needed.
Existing server variables remain required in Vercel Preview and Production:
`GOOGLE_TTS_API_KEY`, `GOOGLE_TTS_ENABLED=true`, `READING_TTS_PROVIDER=google`,
`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
`READING_TTS_CACHE_SECRET` (at least 32 characters), and `CRON_SECRET` (at least
32 characters) for private cache cleanup. Never prefix secrets with NEXT_PUBLIC.
Keep the cache secret stable when reusing the same private cache. Period renewal
is still explicit; the currently activated period ends 2026-10-01 00:00 UTC.

Release sequence:

1. Push the feature branch, not a production merge. Require both CI workflows
   (application and disposable database) to pass. The database workflow includes
   transactional queue/ACL/accounting fixtures, not real Google/load testing.
2. Apply the new migration through the approved migration workflow. If applying
   manually in SQL Editor, record the action and reconcile its migration ledger
   before subsequently using `supabase db push`. Never run the SQL test fixtures
   on the hosted project.
3. Check metadata without secrets:

   ```sql
   select to_regprocedure('public.reading_tts_admit(uuid,text,integer,text,uuid,integer,integer)') as admission;
   select daily_limit, user_daily_limit, concurrent_limit, lifetime_used
     from public.reading_tts_budget where singleton;
   select relname, relrowsecurity from pg_class
     where oid in ('public.reading_tts_admission'::regclass,
                   'public.reading_tts_dispatch_windows'::regclass);
   ```

4. Confirm the existing variables in the intended Vercel environment, then
   redeploy/test the preview with normal sign-in. Check one cache miss, one hit,
   queue cancellation, and scheduled cleanup. Never promote solely on build
   success. At the owner's request no 100-user hosted load test was performed.

Rollback: revert the application release first; the old routes remain compatible.
Retain the new tables, counters and dispatch history. To restore old throughput
defaults, separately approve changing slots/daily/user limits to 2/10000/3000;
do not reduce used counters or reset the provider period. A lower limit below
current usage intentionally blocks fresh generation. Shared-IP policy rollback
requires a forward migration, not replaying the entire historical cache migration.
