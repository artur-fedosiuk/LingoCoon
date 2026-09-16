-- ISOLATED DATABASE ONLY, after baseline and ALL forward migrations.
-- psql -X -v ON_ERROR_STOP=1 -f supabase/tests/google_tts_budget.sql
-- Transactional fixtures; no Google/Storage call. Does not test concurrency:
-- parallel sessions and real Storage role denial remain release requirements.
\set ON_ERROR_STOP on
begin;
do $test$
declare
  owner_id uuid := gen_random_uuid();
  lease_a uuid := gen_random_uuid();
  lease_b uuid := gen_random_uuid();
  period_start timestamptz := clock_timestamp() - interval '1 day';
  response jsonb;
  used bigint;
begin
  if exists (select 1 from public.google_tts_budget_periods)
    or exists (select 1 from public.reading_tts_cache)
    or exists (select 1 from public.reading_tts_cleanup_queue) then
    raise exception 'Requires empty isolated TTS tables';
  end if;
  if not (select relrowsecurity from pg_class where oid = 'public.google_tts_budget_periods'::regclass)
    or has_table_privilege('anon', 'public.google_tts_budget_periods', 'SELECT')
    or has_table_privilege('authenticated', 'public.google_tts_budget_periods', 'INSERT')
    or has_table_privilege('service_role', 'public.google_tts_budget_periods', 'UPDATE')
    or has_table_privilege('service_role', 'public.google_tts_budget_periods', 'DELETE')
    or has_function_privilege('anon', 'public.reading_tts_reserve_google(uuid,text,integer,text,uuid,integer)', 'EXECUTE')
    or has_function_privilege('authenticated', 'public.reading_tts_reserve_google(uuid,text,integer,text,uuid,integer)', 'EXECUTE')
    or not has_function_privilege('service_role', 'public.reading_tts_reserve_google(uuid,text,integer,text,uuid,integer)', 'EXECUTE') then
    raise exception 'Google TTS ACL/RLS regression';
  end if;
  if not (select prosecdef and proconfig @> array['search_path=""'] from pg_proc
    where oid = 'public.reading_tts_reserve_google(uuid,text,integer,text,uuid,integer)'::regprocedure) then
    raise exception 'Expected pinned definer RPC';
  end if;
  insert into auth.users(id, email) values (owner_id, 'google-tts-fixture@example.test');
  update public.reading_tts_budget set lifetime_limit = 1000000, daily_limit = 1000000,
    user_daily_limit = 1000000, credit_expires_at = clock_timestamp() + interval '10 days' where singleton;

  response := public.reading_tts_reserve_google(owner_id, repeat('a',64), 10, repeat('c',64), lease_a, 50);
  if response->>'status' <> 'quota_exceeded' or exists (select 1 from public.reading_tts_cache) then
    raise exception 'Missing reconciled period must block before reservation';
  end if;
  insert into public.google_tts_budget_periods(starts_at, ends_at, outside_characters, reconciled_at, enabled)
    values (period_start, clock_timestamp() + interval '1 day', 999620, clock_timestamp(), true);

  update public.google_tts_budget_periods set voice_tier = 'wavenet' where starts_at = period_start;
  response := public.reading_tts_reserve_google(owner_id, repeat('a',64), 10, repeat('c',64), lease_a, 50);
  if response->>'status' <> 'quota_exceeded' or exists (select 1 from public.reading_tts_cache) then
    raise exception 'Legacy voice tier cannot authorize Chirp dispatch';
  end if;
  update public.google_tts_budget_periods set voice_tier = 'chirp3-hd' where starts_at = period_start;

  response := public.reading_tts_reserve_google(owner_id, repeat('a',64), 10, repeat('c',64), lease_a, 50);
  if response->>'status' <> 'reserved' then raise exception 'Expected first reservation'; end if;
  select reserved_characters into used from public.google_tts_budget_periods where starts_at = period_start;
  if used <> 50 then raise exception 'Must charge reserved billable units, not 10 source characters'; end if;

  response := public.reading_tts_reserve_google(owner_id, repeat('b',64), 10, repeat('c',64), lease_b, 31);
  if response->>'status' <> 'quota_exceeded' or exists (select 1 from public.reading_tts_cache where cache_key = repeat('b',64)) then
    raise exception 'One-character overshoot must reject the entire request';
  end if;
  response := public.reading_tts_reserve_google(owner_id, repeat('b',64), 10, repeat('c',64), lease_b, 30);
  if response->>'status' <> 'reserved' then raise exception 'Exact remaining allowance must fit'; end if;
  select reserved_characters into used from public.google_tts_budget_periods where starts_at = period_start;
  if used <> 80 then raise exception 'Shared budget must include both jobs'; end if;

  perform public.reading_tts_complete(owner_id, repeat('a',64), lease_a,
    owner_id::text || '/' || repeat('a',64) || '/' || lease_a::text || '.ndjson', 100);
  response := public.reading_tts_reserve_google(owner_id, repeat('a',64), 10, repeat('c',64), gen_random_uuid(), 50);
  if response->>'status' <> 'hit' then raise exception 'Private cache hit should work at exhausted budget'; end if;
  perform public.reading_tts_fail(owner_id, repeat('b',64), lease_b);
  if (select reserved_characters from public.google_tts_budget_periods where starts_at = period_start) <> 80 then
    raise exception 'Failures and cache hits cannot refund or double-charge';
  end if;
  response := public.reading_tts_reserve_google(owner_id, repeat('d',64), 1, repeat('c',64), gen_random_uuid(), 1);
  if response->>'status' <> 'quota_exceeded' then raise exception 'Exhausted global budget'; end if;

  begin
    perform public.reading_tts_reserve_google(owner_id, repeat('d',64), 10, repeat('c',64), gen_random_uuid(), 9);
    raise exception 'Accepted undercounted billing';
  exception when invalid_parameter_value then null;
  end;
  begin
    update public.google_tts_budget_periods set character_limit = 1000000 where starts_at = period_start;
    raise exception 'Allowed raising the approved maximum';
  exception when check_violation then null;
  end;
  begin
    insert into public.google_tts_budget_periods(starts_at, ends_at, outside_characters, reconciled_at)
      values (clock_timestamp(), clock_timestamp() + interval '1 day', 0, clock_timestamp());
    raise exception 'Overlapping billing periods must be impossible';
  exception when exclusion_violation then null;
  end;

  update public.google_tts_budget_periods set outside_characters = 0, enabled = false where starts_at = period_start;
  response := public.reading_tts_reserve_google(owner_id, repeat('d',64), 1, repeat('c',64), gen_random_uuid(), 1);
  if response->>'status' <> 'quota_exceeded' then raise exception 'Disabled period'; end if;
  update public.google_tts_budget_periods set enabled = true, ends_at = clock_timestamp() + interval '60 seconds' where starts_at = period_start;
  response := public.reading_tts_reserve_google(owner_id, repeat('d',64), 1, repeat('c',64), gen_random_uuid(), 1);
  if response->>'status' <> 'quota_exceeded' then raise exception 'Lease headroom before billing rollover'; end if;
  update public.google_tts_budget_periods set ends_at = clock_timestamp() - interval '1 second' where starts_at = period_start;
  response := public.reading_tts_reserve_google(owner_id, repeat('d',64), 1, repeat('c',64), gen_random_uuid(), 1);
  if response->>'status' <> 'quota_exceeded' then raise exception 'No automatic unverified renewal'; end if;
  if (select reserved_characters from public.google_tts_budget_periods where starts_at = period_start) <> 80 then
    raise exception 'Rollover must preserve history';
  end if;
end;
$test$;
rollback;
