-- Google WaveNet staged integration. Apply AFTER 20260913010000, never instead.
-- No activation or allowance is created. Legacy Inworld/ElevenLabs is untouched.
-- Invariant: one shared, pre-dispatch budget for ALL Google voices/languages and
-- all future Google callers. Every caller must use this RPC, never dispatch direct.
-- Existing auth/cache/rate/concurrency/lifetime/daily/storage checks still apply.
-- Locks use the same order as cleanup: reading_tts_budget, then provider period.
-- No network request occurs in a transaction. Failed calls are never refunded.
--
-- External activation requires billing readback of Standard + WaveNet usage,
-- exact provider-period boundaries, exclusive credential use, isolated SQL tests,
-- and review of legacy lifetime/day/storage gates. Insert ONE reconciled period
-- with outside_characters covering prior/external usage. Do not reset used counters.
-- Period renewal is deliberately explicit: missing/expired periods fail closed;
-- do not assume a local UTC reset matches a provider billing reset. No scheduler
-- or app role can issue its own allowance. Retain period history for reconciliation.
--
-- Rollback (after approval): set GOOGLE_TTS_ENABLED=false; revoke execute on
-- reading_tts_reserve_google(uuid,text,integer,text,uuid,integer) from service_role.
-- Drain at least 90s, retain cache cleanup and ledgers; do not drop user data.
begin;

create table public.google_tts_budget_periods (
  starts_at timestamptz primary key,
  ends_at timestamptz not null,
  character_limit bigint not null default 3999700 check (character_limit between 0 and 3999700),
  outside_characters bigint not null check (outside_characters >= 0),
  reserved_characters bigint not null default 0 check (reserved_characters >= 0),
  reconciled_at timestamptz not null,
  enabled boolean not null default false,
  check (isfinite(starts_at) and isfinite(ends_at) and ends_at > starts_at and ends_at <= starts_at + interval '32 days'),
  exclude using gist (tstzrange(starts_at, ends_at, '[)') with &&)
);
alter table public.google_tts_budget_periods enable row level security;
revoke all on public.google_tts_budget_periods from public, anon, authenticated, service_role;
grant select on public.google_tts_budget_periods to service_role;

create or replace function public.reading_tts_reserve_google(
  p_owner_id uuid, p_cache_key text, p_characters integer,
  p_ip_hash text, p_lease_id uuid, p_billable_characters integer
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_now timestamptz;
  v_period public.google_tts_budget_periods%rowtype;
  v_result jsonb;
begin
  if p_owner_id is null or p_lease_id is null
    or p_cache_key is null or p_cache_key !~ '^[0-9a-f]{64}$'
    or p_ip_hash is null or p_ip_hash !~ '^[0-9a-f]{64}$'
    or p_characters is null or p_characters not between 1 and 6000
    or p_billable_characters is null or p_billable_characters < p_characters
    or p_billable_characters > 50000 then
    raise exception using errcode = '22023', message = 'Invalid Google TTS reservation';
  end if;

  perform 1 from public.reading_tts_budget where singleton for update;
  if not found then
    raise exception using errcode = '55000', message = 'Reading TTS budget unavailable';
  end if;
  v_now := clock_timestamp();
  -- Cache access still authenticates and uses rate windows through the original
  -- RPC, but may work after generation is exhausted. Never bypass owner checks.
  if exists (select 1 from public.reading_tts_cache where cache_key = p_cache_key) then
    return public.reading_tts_reserve(p_owner_id, p_cache_key, p_characters, p_ip_hash, p_lease_id);
  end if;

  select * into v_period from public.google_tts_budget_periods
    where starts_at <= v_now and ends_at > v_now
    for update;
  if not found or not v_period.enabled or v_period.reconciled_at > v_now
    or v_period.ends_at <= v_now + interval '90 seconds'
    or p_billable_characters > v_period.character_limit - v_period.outside_characters - v_period.reserved_characters then
    return jsonb_build_object('status', 'quota_exceeded');
  end if;

  v_result := public.reading_tts_reserve(p_owner_id, p_cache_key, p_characters, p_ip_hash, p_lease_id);
  if v_result->>'status' = 'reserved' then
    update public.google_tts_budget_periods
      set reserved_characters = reserved_characters + p_billable_characters
      where starts_at = v_period.starts_at;
  end if;
  return v_result;
end;
$function$;
revoke all on function public.reading_tts_reserve_google(uuid,text,integer,text,uuid,integer)
  from public, anon, authenticated, service_role;
grant execute on function public.reading_tts_reserve_google(uuid,text,integer,text,uuid,integer)
  to service_role;
commit;
