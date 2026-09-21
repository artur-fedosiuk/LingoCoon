-- Apply before deploying the queue-aware application. No provider allowance is
-- created, reset or extended. Roll back application first; retain usage ledgers.
begin;

create table public.reading_tts_admission (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  cache_key text not null check (cache_key ~ '^[0-9a-f]{64}$'),
  ticket bigint generated always as identity unique,
  expires_at timestamptz not null,
  next_poll_at timestamptz not null default clock_timestamp()
);
create table public.reading_tts_dispatch_windows (
  lease_id uuid primary key,
  reserved_at timestamptz not null,
  requests integer not null check (requests between 1 and 100)
);
create index reading_tts_dispatch_expiry on public.reading_tts_dispatch_windows(reserved_at);
alter table public.reading_tts_admission enable row level security;
alter table public.reading_tts_dispatch_windows enable row level security;
revoke all on public.reading_tts_admission, public.reading_tts_dispatch_windows
  from public, anon, authenticated, service_role;
revoke all on sequence public.reading_tts_admission_ticket_seq
  from public, anon, authenticated, service_role;

-- Update only the old defaults, retaining operator overrides and all counters.
update public.reading_tts_budget set
  concurrent_limit = case when concurrent_limit = 2 then 5 else concurrent_limit end,
  daily_limit = case when daily_limit = 10000 then 999000 else daily_limit end,
  user_daily_limit = case when user_daily_limit = 3000 then 10000 else user_daily_limit end
where singleton;

create function public.reading_tts_admit(
  p_owner_id uuid, p_cache_key text, p_characters integer,
  p_ip_hash text, p_lease_id uuid, p_billable_characters integer,
  p_provider_requests integer
) returns jsonb language plpgsql security definer set search_path = '' as $function$
declare
  v_now timestamptz;
  v_ticket bigint;
  v_used bigint;
  v_active bigint;
  v_result jsonb;
begin
  if p_owner_id is null or p_lease_id is null or p_cache_key is null
    or p_cache_key !~ '^[0-9a-f]{64}$' or p_ip_hash is null
    or p_ip_hash !~ '^[0-9a-f]{64}$' or p_characters is null
    or p_characters not between 1 and 6000 or p_billable_characters is null
    or p_billable_characters < p_characters or p_billable_characters > 50000
    or p_provider_requests is null or p_provider_requests not between 1 and 100 then
    raise exception using errcode = '22023', message = 'Invalid TTS admission';
  end if;
  perform 1 from public.reading_tts_budget where singleton for update;
  if not found then raise exception using errcode = '55000', message = 'Missing TTS budget'; end if;
  v_now := clock_timestamp();
  delete from public.reading_tts_admission where expires_at <= v_now;
  delete from public.reading_tts_dispatch_windows where reserved_at <= v_now - interval '90 seconds';

  -- Existing cache and in-flight work do not compete with new generations.
  if exists(select 1 from public.reading_tts_cache where cache_key = p_cache_key) then
    return public.reading_tts_reserve_google(p_owner_id, p_cache_key, p_characters,
      p_ip_hash, p_lease_id, p_billable_characters);
  end if;
  select ticket into v_ticket from public.reading_tts_admission where owner_id = p_owner_id;
  if found then
    -- A different text cannot steal the place of an earlier request.
    if not exists(select 1 from public.reading_tts_admission
      where owner_id = p_owner_id and cache_key = p_cache_key) then
      return jsonb_build_object('status', 'busy');
    end if;
    if exists(select 1 from public.reading_tts_admission
      where owner_id = p_owner_id and next_poll_at > v_now) then
      return jsonb_build_object('status', 'rate_limited');
    end if;
    update public.reading_tts_admission set expires_at = v_now + interval '20 seconds',
      next_poll_at = v_now + interval '1 second'
      where owner_id = p_owner_id;
  else
    if (select count(*) from public.reading_tts_admission) >= 100 then
      return jsonb_build_object('status', 'busy');
    end if;
    insert into public.reading_tts_admission(owner_id, cache_key, expires_at, next_poll_at)
      values(p_owner_id, p_cache_key, v_now + interval '20 seconds', v_now + interval '1 second') returning ticket into v_ticket;
  end if;
  -- Admit the oldest small batch, avoiding one slow polling client serializing
  -- everyone else. Actual generation slots are still locked by reserve_google.
  if (select count(*) from public.reading_tts_admission where ticket < v_ticket)
    >= (select concurrent_limit from public.reading_tts_budget where singleton) then
    return jsonb_build_object('status', 'queued');
  end if;

  -- Count all planned chunks before dispatch. The 90s window includes the
  -- provider's 30s execution deadline, not just starts in a fixed minute.
  select coalesce(sum(requests), 0) into v_used from public.reading_tts_dispatch_windows;
  if v_used + p_provider_requests > 180 then
    return jsonb_build_object('status', 'queued');
  end if;
  -- Polling a full pool must not consume user/IP access-rate slots. One active
  -- generation per owner prevents one account monopolizing the worker pool.
  select count(*) into v_active from public.reading_tts_cache
    where status = 'pending' and lease_expires_at > v_now;
  if v_active >= (select concurrent_limit from public.reading_tts_budget where singleton)
    or exists(select 1 from public.reading_tts_cache
      where owner_id = p_owner_id and status = 'pending' and lease_expires_at > v_now) then
    return jsonb_build_object('status', 'queued');
  end if;
  v_result := public.reading_tts_reserve_google(p_owner_id, p_cache_key, p_characters,
    p_ip_hash, p_lease_id, p_billable_characters);
  if v_result->>'status' = 'busy' then
    return jsonb_build_object('status', 'queued');
  end if;
  delete from public.reading_tts_admission where owner_id = p_owner_id and cache_key = p_cache_key;
  if v_result->>'status' = 'reserved' then
    insert into public.reading_tts_dispatch_windows values(p_lease_id, v_now, p_provider_requests);
  end if;
  return v_result;
end;
$function$;
revoke all on function public.reading_tts_admit(uuid,text,integer,text,uuid,integer,integer)
  from public, anon, authenticated, service_role;
grant execute on function public.reading_tts_admit(uuid,text,integer,text,uuid,integer,integer) to service_role;
-- Shared classroom/NAT access: keep 90/user/minute, allow 12 accesses per
-- learner/minute for 100 learners behind the same IP. Generation is separately
-- bounded by admission, character budgets and provider dispatch windows.
create or replace function public.reading_tts_reserve(
  p_owner_id uuid,
  p_cache_key text,
  p_characters integer,
  p_ip_hash text,
  p_lease_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_budget public.reading_tts_budget%rowtype;
  v_cache public.reading_tts_cache%rowtype;
  v_now timestamptz;
  v_day date;
  v_minute timestamptz;
  v_user_requests bigint;
  v_ip_requests bigint;
  v_user_characters bigint;
  v_pending bigint;
  v_storage bigint;
  v_entries bigint;
begin
  if p_owner_id is null or p_lease_id is null
    or p_cache_key is null or p_cache_key !~ '^[0-9a-f]{64}$'
    or p_ip_hash is null or p_ip_hash !~ '^[0-9a-f]{64}$'
    or p_characters is null or p_characters not between 1 and 6000 then
    raise exception using errcode = '22023', message = 'Invalid Reading TTS reservation';
  end if;

  select * into v_budget from public.reading_tts_budget where singleton for update;
  if not found then
    raise exception using errcode = '55000', message = 'Reading TTS budget unavailable';
  end if;
  -- Read wall time AFTER the lock: a queued transaction must not reuse an old day
  -- or revive a lease that expired while it was waiting for the global lock.
  v_now := clock_timestamp();
  v_day := (v_now at time zone 'UTC')::date;
  v_minute := date_trunc('minute', v_now, 'UTC');

  delete from public.reading_tts_rate_windows where window_start < v_minute - interval '2 minutes';
  delete from public.reading_tts_user_daily where usage_date < v_day - 7;

  if v_budget.daily_date <> v_day then
    update public.reading_tts_budget set daily_date = v_day, daily_used = 0 where singleton;
    v_budget.daily_used := 0;
  end if;

  -- FK validation precedes any cache result, even a hit under a zero budget.
  insert into public.reading_tts_user_daily (owner_id, usage_date)
  values (p_owner_id, v_day) on conflict (owner_id, usage_date) do nothing;

  insert into public.reading_tts_rate_windows (scope, subject, window_start, requests)
  values ('user', p_owner_id::text, v_minute, 1)
  on conflict (scope, subject, window_start) do update
    set requests = public.reading_tts_rate_windows.requests + 1
  returning requests into v_user_requests;

  insert into public.reading_tts_rate_windows (scope, subject, window_start, requests)
  values ('ip', p_ip_hash, v_minute, 1)
  on conflict (scope, subject, window_start) do update
    set requests = public.reading_tts_rate_windows.requests + 1
  returning requests into v_ip_requests;

  if v_user_requests > 90 or v_ip_requests > 1200 then
    return jsonb_build_object('status', 'rate_limited');
  end if;

  select * into v_cache from public.reading_tts_cache
  where cache_key = p_cache_key for update;
  if found then
    -- A colliding/misbound key cannot reveal another owner's object or change
    -- ownership. Count the request, but never charge characters for it.
    if v_cache.owner_id <> p_owner_id then
      return jsonb_build_object('status', 'busy');
    end if;
    if v_cache.status = 'ready' and v_cache.expires_at > v_now then
      return jsonb_build_object('status', 'hit', 'objectPath', v_cache.object_path);
    end if;
    if v_cache.status = 'pending' and v_cache.lease_expires_at > v_now then
      return jsonb_build_object('status', 'wait');
    end if;
    if v_cache.status = 'pending' then
      update public.reading_tts_cache
      set status = 'failed', lease_expires_at = null, expires_at = v_now
      where cache_key = p_cache_key;
    end if;
    -- Do not discard an old object's storage reservation during a retry.
    return jsonb_build_object('status', 'busy');
  end if;

  select characters into v_user_characters from public.reading_tts_user_daily
  where owner_id = p_owner_id and usage_date = v_day;
  if v_budget.credit_expires_at <= v_now + interval '90 seconds'
    or p_characters > v_budget.lifetime_limit - v_budget.lifetime_used
    or p_characters > v_budget.daily_limit - v_budget.daily_used
    or p_characters > v_budget.user_daily_limit::bigint - v_user_characters then
    return jsonb_build_object('status', 'quota_exceeded');
  end if;

  select count(*) filter (where status = 'pending' and lease_expires_at > v_now),
    coalesce(sum(case when status = 'ready' then bytes::bigint else 33554432::bigint end), 0),
    count(*)
  into v_pending, v_storage, v_entries from public.reading_tts_cache;
  select v_storage + coalesce(sum(bytes::bigint), 0), v_entries + count(*),
    v_pending + count(*) filter (where not_before > v_now)
  into v_storage, v_entries, v_pending from public.reading_tts_cleanup_queue;
  -- A deleted account's provider may still be running until its lease ends;
  -- its queued object reserves both bytes and that active concurrency slot.
  -- Retain expired entries in storage accounting until object-first cleanup.
  -- The entry cap also bounds metadata/query cost for tiny cached word clips.
  if v_pending >= v_budget.concurrent_limit
    or v_storage + 33554432 > v_budget.storage_limit_bytes
    or v_entries >= 4096 then
    return jsonb_build_object('status', 'busy');
  end if;

  update public.reading_tts_budget
  set lifetime_used = lifetime_used + p_characters, daily_used = daily_used + p_characters
  where singleton;
  update public.reading_tts_user_daily set characters = characters + p_characters
  where owner_id = p_owner_id and usage_date = v_day;

  insert into public.reading_tts_cache
    (cache_key, owner_id, status, lease_id, lease_expires_at, expires_at)
  values
    (p_cache_key, p_owner_id, 'pending', p_lease_id, v_now + interval '90 seconds', v_now + interval '30 days');
  return jsonb_build_object('status', 'reserved');
end;
$function$;

commit;
