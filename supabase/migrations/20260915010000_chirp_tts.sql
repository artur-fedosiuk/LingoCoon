-- Chirp 3 HD replaces WaveNet. Retain counters; require fresh billing reconciliation.
-- Apply after 20260914010000. No positive allowance is activated.
-- Rollback: GOOGLE_TTS_ENABLED=false; retain usage and cache cleanup.
begin;
alter table public.google_tts_budget_periods
  add column voice_tier text not null default 'wavenet';
alter table public.google_tts_budget_periods
  alter column voice_tier set default 'chirp3-hd';
alter table public.google_tts_budget_periods
  add constraint google_tts_voice_tier check (voice_tier in ('wavenet', 'chirp3-hd'));
-- Existing periods remain historical records, disabled until reconciled for Chirp.
update public.google_tts_budget_periods
  set enabled = false, character_limit = least(character_limit, 999700);
alter table public.google_tts_budget_periods
  alter column character_limit set default 999700;
alter table public.google_tts_budget_periods
  add constraint google_chirp_budget_maximum check (character_limit between 0 and 999700);

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
  if not found or v_period.voice_tier <> 'chirp3-hd' or not v_period.enabled or v_period.reconciled_at > v_now
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
