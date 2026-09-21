-- psql -X -v ON_ERROR_STOP=1 -f supabase/tests/reading_tts.sql
-- ISOLATED DATABASE ONLY, after baseline + all forward migrations as postgres.
-- Requires empty Reading TTS tables and the untouched zero-budget singleton.
-- Uses synthetic users/metadata only; no provider or Storage API requests.
-- All fixtures and budget edits roll back. Never run this on the linked project.
-- Run database_security.sql as well, and reapply the migration to verify that
-- existing lifetime_used and private cache rows survive a second application.
-- Concurrent sessions and real Storage deletion/upload races need separate
-- integration testing: this script exercises serialized transitions, not races.

\set ON_ERROR_STOP on
begin;

create function pg_temp.assert_true(p_value boolean, p_message text)
returns void language plpgsql as $function$
begin
  if p_value is distinct from true then
    raise exception 'Reading TTS test failed: %', p_message;
  end if;
end;
$function$;

create function pg_temp.expect_error(p_statement text, p_state text)
returns void language plpgsql as $function$
begin
  begin
    execute p_statement;
  exception when others then
    if sqlstate = p_state then return; end if;
    raise;
  end;
  raise exception 'Expected SQLSTATE % for negative test', p_state;
end;
$function$;

select pg_temp.assert_true(
  (select count(*) = 1 and bool_and(lifetime_limit = 0 and lifetime_used = 0
    and daily_limit = 999000 and user_daily_limit = 10000 and concurrent_limit = 5
    and storage_limit_bytes = 268435456) from public.reading_tts_budget),
  'fresh singleton defaults must fail closed'
);
select pg_temp.assert_true(not exists (select 1 from public.reading_tts_cache)
  and not exists (select 1 from public.reading_tts_user_daily)
  and not exists (select 1 from public.reading_tts_cleanup_queue)
  and not exists (select 1 from public.reading_tts_rate_windows), 'requires empty isolated TTS tables');

select gen_random_uuid() as owner, gen_random_uuid() as other,
  gen_random_uuid() as missing, gen_random_uuid() as lease_a,
  gen_random_uuid() as lease_b, gen_random_uuid() as lease_c,
  gen_random_uuid() as lease_new, gen_random_uuid() as deck
\gset tts_

insert into auth.users (id, email) values
  (:'tts_owner', 'reading-tts-owner@example.test'),
  (:'tts_other', 'reading-tts-other@example.test');
insert into public.decks (id, user_id, title, language_from, language_to)
values (:'tts_deck', :'tts_owner', 'Existing learner data', 'en', 'it');

-- Table ACLs, RLS without policies, service mutation boundaries and RPC ACLs.
do $test$
declare
  v_table text;
  v_function text;
  v_role text;
  v_privilege text;
begin
  foreach v_table in array array['reading_tts_cache', 'reading_tts_budget',
    'reading_tts_user_daily', 'reading_tts_rate_windows', 'reading_tts_cleanup_queue'] loop
    if not (select relrowsecurity from pg_class where oid = ('public.' || v_table)::regclass)
      or exists (select 1 from pg_policies where schemaname = 'public' and tablename = v_table) then
      raise exception 'Expected RLS without policies on %', v_table;
    end if;
    foreach v_role in array array['anon', 'authenticated'] loop
      foreach v_privilege in array array['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER'] loop
        if has_table_privilege(v_role, 'public.' || v_table, v_privilege) then
          raise exception 'Unexpected % % on %', v_role, v_privilege, v_table;
        end if;
      end loop;
    end loop;
    if not has_table_privilege('service_role', 'public.' || v_table, 'SELECT')
      or has_table_privilege('service_role', 'public.' || v_table, 'INSERT')
      or has_table_privilege('service_role', 'public.' || v_table, 'UPDATE')
      or has_table_privilege('service_role', 'public.' || v_table, 'TRUNCATE') then
      raise exception 'Unexpected service grant on %', v_table;
    end if;
    if has_table_privilege('service_role', 'public.' || v_table, 'DELETE')
      is distinct from (v_table in ('reading_tts_cache', 'reading_tts_cleanup_queue')) then
      raise exception 'Unexpected service DELETE grant on %', v_table;
    end if;
  end loop;
  foreach v_function in array array[
    'public.reading_tts_reserve(uuid,text,integer,text,uuid)',
    'public.reading_tts_complete(uuid,text,uuid,text,integer)',
    'public.reading_tts_fail(uuid,text,uuid)'
  ] loop
    if has_function_privilege('anon', v_function, 'EXECUTE')
      or has_function_privilege('authenticated', v_function, 'EXECUTE')
      or not has_function_privilege('service_role', v_function, 'EXECUTE') then
      raise exception 'Unexpected RPC privilege on %', v_function;
    end if;
    if not (select prosecdef and proconfig @> array['search_path=""']
      from pg_proc where oid = v_function::regprocedure) then
      raise exception 'RPC must have pinned definer boundary: %', v_function;
    end if;
  end loop;
end;
$test$;

select pg_temp.assert_true((select not public and file_size_limit = 52428800
  and allowed_mime_types = array['application/x-ndjson']
  from storage.buckets where id = 'reading-audio'), 'private bounded bucket');
select pg_temp.assert_true(exists (select 1 from pg_policies
  where schemaname = 'storage' and tablename = 'objects'
    and policyname = 'reading_audio_service_only' and permissive = 'RESTRICTIVE'
    and cmd = 'ALL' and roles @> array['anon', 'authenticated']::name[]
    and qual is not null and with_check is not null), 'Storage read/write denial includes WITH CHECK');
select pg_temp.assert_true(not exists (select 1 from pg_constraint
  where conrelid = 'public.reading_tts_cleanup_queue'::regclass and contype = 'f'), 'cleanup queue survives user deletion');
select pg_temp.assert_true((select prosecdef and proconfig @> array['search_path=""']
  from pg_proc where oid = 'private.reading_tts_enqueue_cleanup()'::regprocedure), 'cleanup trigger definer has pinned search path');

-- Invalid input and nonexistent owners fail before reservation/dispatch.
select pg_temp.expect_error(format(
  'select public.reading_tts_reserve(%L, %L, 6001, %L, %L)',
  :'tts_owner', repeat('a', 64), repeat('f', 64), :'tts_lease_a'), '22023');
select pg_temp.expect_error(format(
  'select public.reading_tts_reserve(%L, %L, 0, %L, %L)',
  :'tts_owner', repeat('a', 64), repeat('f', 64), :'tts_lease_a'), '22023');
select pg_temp.expect_error(format(
  'select public.reading_tts_reserve(%L, %L, 1, %L, %L)',
  :'tts_owner', repeat('A', 64), repeat('f', 64), :'tts_lease_a'), '22023');
select pg_temp.expect_error(format(
  'select public.reading_tts_reserve(%L, %L, 1, %L, %L)',
  :'tts_owner', repeat('a', 64), '192.0.2.1', :'tts_lease_a'), '22023');
select pg_temp.expect_error(format(
  'select public.reading_tts_reserve(%L, %L, 1, %L, %L)',
  :'tts_missing', repeat('a', 64), repeat('f', 64), :'tts_lease_a'), '23503');
select pg_temp.expect_error('update public.reading_tts_budget set concurrent_limit = 6', '23514');
select pg_temp.expect_error('update public.reading_tts_budget set storage_limit_bytes = 268435457', '23514');

select pg_temp.assert_true(public.reading_tts_reserve(:'tts_owner', repeat('a', 64), 100,
  repeat('f', 64), :'tts_lease_a')->>'status' = 'quota_exceeded', 'zero budget disables dispatch');
select pg_temp.assert_true((select lifetime_used = 0 and daily_used = 0 from public.reading_tts_budget)
  and not exists (select 1 from public.reading_tts_cache), 'zero quota creates no job or charge');
select pg_temp.assert_true((select requests = 1 from public.reading_tts_rate_windows
  where scope = 'user' and subject = :'tts_owner'), 'quota rejection still counts access');

update public.reading_tts_budget set lifetime_limit = 10000, user_daily_limit = 10000, concurrent_limit = 2;
select pg_temp.assert_true(public.reading_tts_reserve(:'tts_owner', repeat('a', 64), 100,
  repeat('f', 64), :'tts_lease_a')->>'status' = 'quota_exceeded', 'unverified credit expiry disables dispatch despite a positive limit');
update public.reading_tts_budget set credit_expires_at = clock_timestamp() + interval '60 seconds';
select pg_temp.assert_true(public.reading_tts_reserve(:'tts_owner', repeat('a', 64), 100,
  repeat('f', 64), :'tts_lease_a')->>'status' = 'quota_exceeded', 'credit expiry must cover the full worker lease');
update public.reading_tts_budget set credit_expires_at = clock_timestamp() + interval '1 day';
set local role service_role;
select public.reading_tts_reserve(:'tts_owner', repeat('a', 64), 100, repeat('f', 64), :'tts_lease_a') as first
\gset tts_
reset role;
select pg_temp.assert_true(:'tts_first'::jsonb->>'status' = 'reserved', 'service role reserves atomically');
select pg_temp.assert_true((select bytes = 0 and status = 'pending'
  and lease_expires_at > clock_timestamp() + interval '80 seconds'
  and expires_at > clock_timestamp() + interval '29 days'
  from public.reading_tts_cache where cache_key = repeat('a', 64)), 'pending lease and TTL');
select pg_temp.assert_true(public.reading_tts_reserve(:'tts_owner', repeat('a', 64), 6000,
  repeat('f', 64), :'tts_lease_new')->>'status' = 'wait', 'dedup ignores miss-only character quota');
select pg_temp.assert_true(public.reading_tts_reserve(:'tts_other', repeat('a', 64), 100,
  repeat('f', 64), :'tts_lease_new')->>'status' = 'busy', 'owner swapping fails without leaking path');
select pg_temp.assert_true((select lifetime_used = 100 from public.reading_tts_budget), 'wait/collision not charged');
select pg_temp.assert_true(public.reading_tts_reserve(:'tts_owner', repeat('b', 64), 200,
  repeat('f', 64), :'tts_lease_b')->>'status' = 'reserved', 'second concurrent request');
select pg_temp.assert_true(public.reading_tts_reserve(:'tts_owner', repeat('c', 64), 100,
  repeat('f', 64), :'tts_lease_c')->>'status' = 'busy', 'persistent concurrency cap');

-- Completion is a compare-and-set on owner, key, lease, state and expiry.
select pg_temp.assert_true(not public.reading_tts_complete(:'tts_owner', repeat('a', 64), :'tts_lease_new',
  :'tts_owner' || '/' || repeat('a', 64) || '/' || :'tts_lease_new' || '.ndjson', 1000), 'wrong lease');
select pg_temp.assert_true(not public.reading_tts_complete(:'tts_other', repeat('a', 64), :'tts_lease_a',
  :'tts_other' || '/' || repeat('a', 64) || '/' || :'tts_lease_a' || '.ndjson', 1000), 'wrong owner');
select pg_temp.assert_true(not public.reading_tts_complete(:'tts_owner', repeat('a', 64), :'tts_lease_a',
  '../another-object.ndjson', 1000), 'path traversal denied');
select pg_temp.assert_true(not public.reading_tts_complete(:'tts_owner', repeat('a', 64), :'tts_lease_a',
  null, 1000), 'null path denied');
select pg_temp.assert_true(not public.reading_tts_complete(:'tts_owner', repeat('a', 64), :'tts_lease_a',
  :'tts_owner' || '/' || repeat('a', 64) || '/' || :'tts_lease_a' || '.ndjson', 33554433), 'oversized object denied');
select pg_temp.assert_true(public.reading_tts_complete(:'tts_owner', repeat('a', 64), :'tts_lease_a',
  :'tts_owner' || '/' || repeat('a', 64) || '/' || :'tts_lease_a' || '.ndjson', 1000), 'valid completion');
select pg_temp.assert_true(not public.reading_tts_complete(:'tts_owner', repeat('a', 64), :'tts_lease_a',
  :'tts_owner' || '/' || repeat('a', 64) || '/' || :'tts_lease_a' || '.ndjson', 1000), 'completion replay cannot rewrite');
select pg_temp.assert_true(not public.reading_tts_fail(:'tts_owner', repeat('a', 64), :'tts_lease_a'), 'cannot fail ready audio');
select pg_temp.assert_true((select bytes = 1000 and lease_expires_at is null
  from public.reading_tts_cache where cache_key = repeat('a', 64)), 'actual completed byte count');

-- Hits survive all miss-only budget/storage/concurrency limits.
update public.reading_tts_budget set lifetime_limit = 0, daily_limit = 0,
  user_daily_limit = 0, storage_limit_bytes = 0;
select pg_temp.assert_true(public.reading_tts_reserve(:'tts_owner', repeat('a', 64), 6000,
  repeat('f', 64), :'tts_lease_new') = jsonb_build_object('status', 'hit',
  'objectPath', :'tts_owner' || '/' || repeat('a', 64) || '/' || :'tts_lease_a' || '.ndjson'), 'hit with exhausted budget');
select pg_temp.assert_true(public.reading_tts_reserve(:'tts_owner', repeat('b', 64), 6000,
  repeat('f', 64), :'tts_lease_new')->>'status' = 'wait', 'wait with exhausted budget');
select pg_temp.assert_true(public.reading_tts_reserve(:'tts_owner', repeat('c', 64), 1,
  repeat('f', 64), :'tts_lease_c')->>'status' = 'quota_exceeded', 'new dispatch blocked');
select pg_temp.assert_true((select lifetime_used = 300 from public.reading_tts_budget), 'cache access never charges characters');

-- Both authenticated identities and anon are denied even their own cache row.
select set_config('reading_tts.test_owner', :'tts_owner', true);
select set_config('reading_tts.test_other', :'tts_other', true);
do $test$
declare
  v_identity text;
  v_table text;
  v_statement text;
begin
  foreach v_identity in array array[
    current_setting('reading_tts.test_owner'), current_setting('reading_tts.test_other'), ''
  ] loop
    perform set_config('request.jwt.claim.sub', v_identity, true);
    if v_identity = '' then execute 'set local role anon';
    else execute 'set local role authenticated'; end if;
    foreach v_table in array array['reading_tts_cache', 'reading_tts_budget',
      'reading_tts_user_daily', 'reading_tts_rate_windows', 'reading_tts_cleanup_queue'] loop
      begin
        execute format('select 1 from public.%I limit 1', v_table);
        raise exception 'Forbidden table read succeeded';
      exception when insufficient_privilege then null;
      end;
    end loop;
    foreach v_statement in array array[
      'insert into public.reading_tts_cache (cache_key) values (repeat(''0'', 64))',
      'update public.reading_tts_cache set bytes = 1',
      'delete from public.reading_tts_cache',
      'select public.reading_tts_reserve(null,null,null,null,null)',
      'select public.reading_tts_complete(null,null,null,null,null)',
      'select public.reading_tts_fail(null,null,null)'
    ] loop
      begin
        execute v_statement;
        raise exception 'Forbidden operation succeeded';
      exception when insufficient_privilege then null;
      end;
    end loop;
    execute 'reset role';
  end loop;
end;
$test$;

-- Failure releases concurrency, retains charges/capacity, and waits for cleanup.
update public.reading_tts_budget set lifetime_limit = 100000, daily_limit = 100000,
  user_daily_limit = 100000, storage_limit_bytes = 268435456;
select pg_temp.assert_true(not public.reading_tts_fail(:'tts_owner', repeat('b', 64), :'tts_lease_new'), 'stale failure fenced');
select pg_temp.assert_true(public.reading_tts_fail(:'tts_owner', repeat('b', 64), :'tts_lease_b'), 'current failure recorded');
select pg_temp.assert_true(not public.reading_tts_fail(:'tts_owner', repeat('b', 64), :'tts_lease_b'), 'failure replay fenced');
select pg_temp.assert_true((select lifetime_used = 300 from public.reading_tts_budget), 'failure does not refund');
select pg_temp.assert_true((select status = 'failed' and expires_at <= clock_timestamp()
  from public.reading_tts_cache where cache_key = repeat('b', 64)), 'failed worker can clean up immediately');
select pg_temp.assert_true(public.reading_tts_reserve(:'tts_owner', repeat('b', 64), 200,
  repeat('f', 64), :'tts_lease_new')->>'status' = 'busy', 'failed reservation persists until cleanup');
select pg_temp.assert_true(public.reading_tts_reserve(:'tts_owner', repeat('c', 64), 100,
  repeat('f', 64), :'tts_lease_c')->>'status' = 'reserved', 'failure releases concurrent slot');

-- Simulate stopped worker + object-first cleanup (no real objects in this test).
set local role service_role;
delete from public.reading_tts_cache where cache_key = repeat('b', 64)
  and owner_id = :'tts_owner' and lease_id = :'tts_lease_b' and expires_at <= clock_timestamp();
reset role;
select pg_temp.assert_true((select bytes = 33554432 and not_before <= clock_timestamp()
  from public.reading_tts_cleanup_queue where object_path =
    :'tts_owner' || '/' || repeat('b', 64) || '/' || :'tts_lease_b' || '.ndjson'), 'failure deletion queues predictable path and full capacity');
set local role service_role;
delete from public.reading_tts_cleanup_queue where object_path =
  :'tts_owner' || '/' || repeat('b', 64) || '/' || :'tts_lease_b' || '.ndjson'
  and not_before <= clock_timestamp();
reset role;
select pg_temp.assert_true(public.reading_tts_reserve(:'tts_owner', repeat('b', 64), 200,
  repeat('f', 64), :'tts_lease_new')->>'status' = 'reserved', 'fresh lease after cleanup charges again');
select pg_temp.assert_true(not public.reading_tts_complete(:'tts_owner', repeat('b', 64), :'tts_lease_b',
  :'tts_owner' || '/' || repeat('b', 64) || '/' || :'tts_lease_b' || '.ndjson', 1000), 'old worker cannot complete replacement');
select pg_temp.assert_true(not public.reading_tts_fail(:'tts_owner', repeat('b', 64), :'tts_lease_b'), 'old worker cannot fail replacement');
update public.reading_tts_cache set lease_expires_at = clock_timestamp() - interval '1 second'
where cache_key = repeat('b', 64);
select pg_temp.assert_true(not public.reading_tts_complete(:'tts_owner', repeat('b', 64), :'tts_lease_new',
  :'tts_owner' || '/' || repeat('b', 64) || '/' || :'tts_lease_new' || '.ndjson', 1000), 'expired lease cannot complete');
select pg_temp.assert_true(public.reading_tts_reserve(:'tts_owner', repeat('b', 64), 200,
  repeat('f', 64), :'tts_lease_b')->>'status' = 'busy', 'abandoned job requires object cleanup');
select pg_temp.assert_true((select status = 'failed' and expires_at <= clock_timestamp()
  from public.reading_tts_cache where cache_key = repeat('b', 64)), 'abandoned job discoverable by expiry query');

-- Limits are independent; global UTC rollover never resets lifetime use.
select lifetime_used as used from public.reading_tts_budget
\gset tts_
update public.reading_tts_budget set daily_date = (clock_timestamp() at time zone 'UTC')::date - 1,
  daily_used = 100000;
insert into public.reading_tts_user_daily (owner_id, usage_date, characters)
values (:'tts_owner', (clock_timestamp() at time zone 'UTC')::date - 8, 3000);
insert into public.reading_tts_rate_windows (scope, subject, window_start, requests)
values ('ip', repeat('e', 64), clock_timestamp() - interval '1 day', 180);
select pg_temp.assert_true(public.reading_tts_reserve(:'tts_owner', repeat('d', 64), 100,
  repeat('f', 64), gen_random_uuid())->>'status' = 'reserved', 'UTC day rolls over');
select pg_temp.assert_true((select lifetime_used = :'tts_used'::bigint + 100 and daily_used = 100
  from public.reading_tts_budget), 'lifetime never rolls over');
select pg_temp.assert_true(not exists (select 1 from public.reading_tts_user_daily
  where usage_date < (clock_timestamp() at time zone 'UTC')::date - 7)
  and not exists (select 1 from public.reading_tts_rate_windows where subject = repeat('e', 64)), 'stale counter retention');
update public.reading_tts_budget set daily_limit = daily_used;
select pg_temp.assert_true(public.reading_tts_reserve(:'tts_owner', repeat('e', 64), 1,
  repeat('f', 64), gen_random_uuid())->>'status' = 'quota_exceeded', 'global daily cap');
update public.reading_tts_budget set daily_limit = 100000, user_daily_limit = 0;
select pg_temp.assert_true(public.reading_tts_reserve(:'tts_owner', repeat('e', 64), 1,
  repeat('f', 64), gen_random_uuid())->>'status' = 'quota_exceeded', 'per-user daily cap');
update public.reading_tts_budget set user_daily_limit = 100000;

-- Rate checks precede hits; both counters increase even when access is denied.
insert into public.reading_tts_rate_windows (scope, subject, window_start, requests)
values ('user', :'tts_owner', date_trunc('minute', clock_timestamp(), 'UTC'), 89)
on conflict (scope, subject, window_start) do update set requests = 89;
select pg_temp.assert_true(public.reading_tts_reserve(:'tts_owner', repeat('a', 64), 1,
  repeat('f', 64), gen_random_uuid())->>'status' = 'hit', '90th user access permitted');
select pg_temp.assert_true(public.reading_tts_reserve(:'tts_owner', repeat('a', 64), 1,
  repeat('f', 64), gen_random_uuid())->>'status' = 'rate_limited', '91st user access blocked even on hit');
update public.reading_tts_rate_windows set requests = 0 where scope = 'user';
insert into public.reading_tts_rate_windows (scope, subject, window_start, requests)
values ('ip', repeat('f', 64), date_trunc('minute', clock_timestamp(), 'UTC'), 1199)
on conflict (scope, subject, window_start) do update set requests = 1199;
select pg_temp.assert_true(public.reading_tts_reserve(:'tts_owner', repeat('a', 64), 1,
  repeat('f', 64), gen_random_uuid())->>'status' = 'hit', '1200th shared IP access permitted');
select pg_temp.assert_true(public.reading_tts_reserve(:'tts_other', repeat('a', 64), 1,
  repeat('f', 64), gen_random_uuid())->>'status' = 'rate_limited', '1201st shared IP access blocked across users');
update public.reading_tts_rate_windows set requests = 0;

-- Expired ready audio is never returned, nor silently uncounted.
update public.reading_tts_cache set expires_at = clock_timestamp() - interval '1 second'
where cache_key = repeat('a', 64);
select pg_temp.assert_true(public.reading_tts_reserve(:'tts_owner', repeat('a', 64), 1,
  repeat('f', 64), gen_random_uuid())->>'status' = 'busy', 'expired ready object requires cleanup');
select pg_temp.assert_true((select bytes = 1000 from public.reading_tts_cache
  where cache_key = repeat('a', 64)), 'expired object still counted');

-- A failed job still reserves 32 MiB: eight fill the 256 MiB cap.
-- Remove only synthetic fixture metadata; no Storage objects exist in this test.
delete from public.reading_tts_cache where owner_id in (:'tts_owner', :'tts_other');
select pg_temp.assert_true((select bytes = 1000 from public.reading_tts_cleanup_queue
  where object_path = :'tts_owner' || '/' || repeat('a', 64) || '/' || :'tts_lease_a' || '.ndjson'), 'ready deletion queues actual bytes');
select pg_temp.assert_true((select bytes = 33554432 and not_before > clock_timestamp()
  from public.reading_tts_cleanup_queue where object_path =
    :'tts_owner' || '/' || repeat('c', 64) || '/' || :'tts_lease_c' || '.ndjson'), 'pending deletion defers queue cleanup until lease end');
-- No worker or physical object exists for these synthetic SQL-only fixtures.
delete from public.reading_tts_cleanup_queue where object_path like :'tts_owner' || '/%';
do $test$
declare
  v_owner uuid := current_setting('reading_tts.test_owner')::uuid;
  v_lease uuid;
  v_key text;
  v_result jsonb;
begin
  for i in 1..8 loop
    v_lease := gen_random_uuid();
    v_key := lpad(to_hex(i), 64, '0');
    v_result := public.reading_tts_reserve(v_owner, v_key, 1, repeat('f', 64), v_lease);
    if v_result->>'status' <> 'reserved' then raise exception 'Storage reservation % failed', i; end if;
    perform public.reading_tts_fail(v_owner, v_key, v_lease);
  end loop;
  v_result := public.reading_tts_reserve(v_owner, repeat('9', 64), 1, repeat('f', 64), gen_random_uuid());
  if v_result->>'status' <> 'busy' then raise exception 'Storage reservation cap exceeded'; end if;
end;
$test$;

-- Existing learner data is still readable by its owner and isolated from other users.
select set_config('request.jwt.claim.sub', :'tts_owner', true);
set local role authenticated;
select count(*) as existing_count from public.decks where id = :'tts_deck'
\gset tts_
reset role;
select pg_temp.assert_true(:'tts_existing_count'::int = 1, 'existing owner policy preserved');
select set_config('request.jwt.claim.sub', :'tts_other', true);
set local role authenticated;
select count(*) as other_count from public.decks where id = :'tts_deck'
\gset tts_
reset role;
select pg_temp.assert_true(:'tts_other_count'::int = 0, 'existing other-user isolation preserved');

select lifetime_used as used from public.reading_tts_budget
\gset tts_
delete from auth.users where id = :'tts_owner';
select pg_temp.assert_true(not exists (select 1 from public.reading_tts_cache where owner_id = :'tts_owner')
  and not exists (select 1 from public.reading_tts_user_daily where owner_id = :'tts_owner'), 'owner metadata cascade');
select pg_temp.assert_true((select lifetime_used = :'tts_used'::bigint from public.reading_tts_budget), 'account deletion does not refund budget');
select pg_temp.assert_true((select count(*) = 8 and sum(bytes::bigint) = 268435456
  from public.reading_tts_cleanup_queue), 'cascade retains every predictable path and storage charge');
select pg_temp.assert_true(public.reading_tts_reserve(:'tts_other', repeat('9', 64), 1,
  repeat('f', 64), gen_random_uuid())->>'status' = 'busy', 'queued orphan capacity blocks new generation');
-- Simulate successful Storage removal, then drain the queue as the service.
set local role service_role;
delete from public.reading_tts_cleanup_queue where object_path like :'tts_owner' || '/%'
  and not_before <= clock_timestamp();
reset role;
select pg_temp.assert_true(public.reading_tts_reserve(:'tts_other', repeat('9', 64), 1,
  repeat('f', 64), gen_random_uuid())->>'status' = 'reserved', 'successful queue cleanup releases capacity');
select lifetime_used as used from public.reading_tts_budget
\gset tts_

-- Exercise the non-destructive operational rollback without dropping the ledger.
update public.reading_tts_budget set lifetime_limit = 0;
revoke execute on function public.reading_tts_reserve(uuid,text,integer,text,uuid) from service_role;
select pg_temp.assert_true(not has_function_privilege('service_role',
  'public.reading_tts_reserve(uuid,text,integer,text,uuid)', 'EXECUTE')
  and (select lifetime_limit = 0 and lifetime_used = :'tts_used'::bigint from public.reading_tts_budget), 'rollback disables new use and preserves history');

rollback;
\echo 'Reading TTS SQL checks passed; all fixtures rolled back. Concurrent/Storage HTTP checks remain separate.'
