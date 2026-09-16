-- Private Reading TTS cache and durable, fail-closed character reservations.
-- Apply as postgres after all earlier migrations. No provider is enabled here.
-- Existing learner tables and policies are unchanged. DDL is transactional;
-- runtime RPCs serialize on one budget row, never across a provider request.
-- Reapplying preserves all counters, including the non-resetting lifetime use.
--
-- Service contract:
-- * Resolve owner from verified auth; derive owner-scoped keys and IP HMACs.
-- * Call reserve before EVERY cache access, including polling. Dispatch only
--   after `reserved` commits; cap provider execution at 30s and stream at 32 MiB.
-- * Upload without upsert to owner/key/lease.ndjson, then call complete.
-- * A failed/expired row returns busy until cleanup: remove its exact Storage
--   object (derive its path from owner/key/lease if object_path is null), then
--   DELETE the row using key + owner + lease + expires_at <= current time.
--   Every DELETE enqueues that path in reading_tts_cleanup_queue; after Storage
--   removal succeeds, DELETE the matching queue row to release its capacity.
--   Every non-ready row reserves 32 MiB, including abandoned jobs. Only the
--   worker that has stopped uploading may fail and clean its job immediately;
--   abandoned pending jobs must wait until their 90s lease ends. Stop uploads
--   after lease expiry; if complete returns false, remove that worker's exact
--   object. Never reuse lease IDs, and never clear a queue row before removal.
-- * Account deletion queues even in-flight paths without an auth FK. A daily
--   service cleanup drains the queue. Delay queue cleanup until not_before so
--   account deletion during generation cannot permit a late orphan upload.
--
-- Approved external handoff (NOT executed by this source change):
-- 1. Inspect migration history, Storage schema/policies and bucket collision;
--    reconcile the historical baseline, never replay it on an existing project.
-- 2. Apply this file transactionally as postgres via the approved migration
--    runner. Read back bucket privacy, RLS, ACLs, RPC search paths, and singleton
--    lifetime_limit=0 / lifetime_used=0 on first creation. Do not reset a ledger.
-- 3. Run tests/reading_tts.sql only on an isolated database; test Storage HTTP
--    access as anon/owner/other, cleanup, and parallel reservations separately.
-- 4. Any positive lifetime_limit requires separate verified free-credit approval.
--    Set credit_expires_at before the confirmed promotional-credit expiry and
--    reserve headroom for in-flight work. Never infer monthly credit renewal.
-- Rollback: disable the application entry point, then (with external approval)
-- BEGIN;
-- UPDATE public.reading_tts_budget SET lifetime_limit = 0 WHERE singleton;
-- REVOKE EXECUTE ON FUNCTION public.reading_tts_reserve(uuid,text,integer,text,uuid)
--   FROM service_role;
-- COMMIT;
-- Drain workers for at least 90s; retain complete/fail and cleanup access while
-- draining. Keep the private bucket/tables/ledger for recovery and read back
-- limit=0 and no service_role EXECUTE on reserve. Do not drop usage history or
-- delete storage.buckets/objects metadata with SQL to remove physical files.

begin;

create table if not exists public.reading_tts_budget (
  singleton boolean primary key default true check (singleton),
  lifetime_limit bigint not null default 0 check (lifetime_limit >= 0),
  lifetime_used bigint not null default 0 check (lifetime_used >= 0),
  credit_expires_at timestamptz not null default '-infinity'::timestamptz,
  daily_limit bigint not null default 10000 check (daily_limit >= 0),
  daily_used bigint not null default 0 check (daily_used >= 0),
  daily_date date not null default (now() at time zone 'UTC')::date,
  user_daily_limit integer not null default 3000 check (user_daily_limit >= 0),
  concurrent_limit integer not null default 2 check (concurrent_limit between 1 and 5),
  storage_limit_bytes bigint not null default 268435456
    check (storage_limit_bytes between 0 and 268435456)
);

insert into public.reading_tts_budget (singleton) values (true)
on conflict (singleton) do nothing;

create table if not exists public.reading_tts_cache (
  cache_key text primary key check (cache_key ~ '^[0-9a-f]{64}$'),
  owner_id uuid not null references auth.users(id) on delete cascade,
  status text not null check (status in ('pending', 'ready', 'failed')),
  lease_id uuid not null,
  lease_expires_at timestamptz,
  object_path text,
  expires_at timestamptz not null,
  bytes integer not null default 0 check (bytes between 0 and 33554432),
  constraint reading_tts_cache_state check (
    (status = 'pending' and lease_expires_at is not null and object_path is null and bytes = 0)
    or (status = 'ready' and lease_expires_at is null and object_path is not null and bytes > 0)
    or (status = 'failed' and lease_expires_at is null and object_path is null and bytes = 0)
  ),
  constraint reading_tts_cache_object_path check (
    object_path is null
    or object_path = owner_id::text || '/' || cache_key || '/' || lease_id::text || '.ndjson'
  )
);

create index if not exists reading_tts_cache_owner_idx on public.reading_tts_cache (owner_id);
create index if not exists reading_tts_cache_expiry_idx on public.reading_tts_cache (expires_at);
create index if not exists reading_tts_cache_pending_idx
  on public.reading_tts_cache (lease_expires_at) where status = 'pending';

create table if not exists public.reading_tts_user_daily (
  owner_id uuid not null references auth.users(id) on delete cascade,
  usage_date date not null,
  characters bigint not null default 0 check (characters >= 0),
  primary key (owner_id, usage_date)
);

create index if not exists reading_tts_user_daily_date_idx
  on public.reading_tts_user_daily (usage_date);

-- UTC fixed-minute windows. Only pseudonymous user IDs/IP HMACs, never raw IPs.
create table if not exists public.reading_tts_rate_windows (
  scope text not null check (scope in ('user', 'ip')),
  subject text not null,
  window_start timestamptz not null,
  requests bigint not null default 0 check (requests >= 0),
  primary key (scope, subject, window_start),
  constraint reading_tts_rate_subject check (
    (scope = 'user' and subject ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')
    or (scope = 'ip' and subject ~ '^[0-9a-f]{64}$')
  )
);

create index if not exists reading_tts_rate_windows_expiry_idx
  on public.reading_tts_rate_windows (window_start);

-- Durable deletion outbox: paths and capacity survive auth.users cascades.
-- not_before protects an in-flight upload when deletion cancels its metadata.
create table if not exists public.reading_tts_cleanup_queue (
  object_path text primary key,
  bytes integer not null check (bytes between 1 and 33554432),
  created_at timestamptz not null default now(),
  not_before timestamptz not null default now(),
  constraint reading_tts_cleanup_path check (
    object_path ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{64}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.ndjson$'
  )
);
create index if not exists reading_tts_cleanup_queue_due_idx
  on public.reading_tts_cleanup_queue (not_before);

alter table public.reading_tts_cache enable row level security;
alter table public.reading_tts_budget enable row level security;
alter table public.reading_tts_user_daily enable row level security;
alter table public.reading_tts_rate_windows enable row level security;
alter table public.reading_tts_cleanup_queue enable row level security;

-- No policies: owners and other authenticated users alike have no direct access.
-- Remove inherited service grants too: mutations must use the atomic RPCs.
revoke all on table public.reading_tts_cache, public.reading_tts_budget,
  public.reading_tts_user_daily, public.reading_tts_rate_windows, public.reading_tts_cleanup_queue
  from public, anon, authenticated, service_role;
grant select, delete on public.reading_tts_cache, public.reading_tts_cleanup_queue to service_role;
grant select on public.reading_tts_budget, public.reading_tts_user_daily,
  public.reading_tts_rate_windows to service_role;

create or replace function private.reading_tts_enqueue_cleanup()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  -- Same lock as reserve: moving bytes from cache to queue is indivisible even
  -- during an auth.users cascade. Retain capacity if Storage removal fails.
  perform 1 from public.reading_tts_budget where singleton for update;
  if not found then
    raise exception using errcode = '55000', message = 'Reading TTS budget unavailable';
  end if;
  insert into public.reading_tts_cleanup_queue (object_path, bytes, not_before)
  values (
    coalesce(old.object_path, old.owner_id::text || '/' || old.cache_key || '/' || old.lease_id::text || '.ndjson'),
    case when old.status = 'ready' then old.bytes else 33554432 end,
    greatest(clock_timestamp(), old.lease_expires_at)
  )
  on conflict (object_path) do update
    set bytes = greatest(public.reading_tts_cleanup_queue.bytes, excluded.bytes),
      not_before = greatest(public.reading_tts_cleanup_queue.not_before, excluded.not_before);
  return old;
end;
$function$;
revoke all on function private.reading_tts_enqueue_cleanup() from public, anon, authenticated, service_role;
drop trigger if exists reading_tts_cache_enqueue_cleanup on public.reading_tts_cache;
create trigger reading_tts_cache_enqueue_cleanup before delete on public.reading_tts_cache
for each row execute function private.reading_tts_enqueue_cleanup();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('reading-audio', 'reading-audio', false, 52428800, array['application/x-ndjson'])
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Restrictive policy also denies a future broad permissive Storage policy.
-- Both USING and WITH CHECK apply, including INSERT and object moves.
drop policy if exists reading_audio_service_only on storage.objects;
create policy reading_audio_service_only on storage.objects
  as restrictive for all to anon, authenticated
  using (bucket_id <> 'reading-audio')
  with check (bucket_id <> 'reading-audio');

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

  if v_user_requests > 90 or v_ip_requests > 180 then
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

create or replace function public.reading_tts_complete(
  p_owner_id uuid,
  p_cache_key text,
  p_lease_id uuid,
  p_object_path text,
  p_bytes integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_now timestamptz;
begin
  if p_owner_id is null or p_lease_id is null
    or p_cache_key is null or p_cache_key !~ '^[0-9a-f]{64}$'
    or p_bytes is null or p_bytes not between 1 and 33554432
    or p_object_path is distinct from
      p_owner_id::text || '/' || p_cache_key || '/' || p_lease_id::text || '.ndjson' then
    return false;
  end if;
  perform 1 from public.reading_tts_budget where singleton for update;
  if not found then
    return false;
  end if;
  v_now := clock_timestamp();
  update public.reading_tts_cache
  set status = 'ready', lease_expires_at = null, object_path = p_object_path,
    bytes = p_bytes, expires_at = v_now + interval '30 days'
  where cache_key = p_cache_key and owner_id = p_owner_id and lease_id = p_lease_id
    and status = 'pending' and lease_expires_at > v_now;
  return found;
end;
$function$;

create or replace function public.reading_tts_fail(
  p_owner_id uuid,
  p_cache_key text,
  p_lease_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if p_owner_id is null or p_lease_id is null
    or p_cache_key is null or p_cache_key !~ '^[0-9a-f]{64}$' then
    return false;
  end if;
  perform 1 from public.reading_tts_budget where singleton for update;
  if not found then
    return false;
  end if;
  -- The failing worker has stopped uploading and may clean its path immediately.
  -- Keep full character charges and storage capacity until object/queue cleanup.
  update public.reading_tts_cache
  set status = 'failed', expires_at = clock_timestamp(),
    lease_expires_at = null
  where cache_key = p_cache_key and owner_id = p_owner_id and lease_id = p_lease_id
    and status = 'pending';
  return found;
end;
$function$;

revoke all on function public.reading_tts_reserve(uuid,text,integer,text,uuid),
  public.reading_tts_complete(uuid,text,uuid,text,integer),
  public.reading_tts_fail(uuid,text,uuid) from public, anon, authenticated, service_role;
grant execute on function public.reading_tts_reserve(uuid,text,integer,text,uuid),
  public.reading_tts_complete(uuid,text,uuid,text,integer),
  public.reading_tts_fail(uuid,text,uuid) to service_role;

commit;
