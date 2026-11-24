-- Per-user AI usage counters (fixed windows). Table is closed: no direct access
-- for any API role. Only consume_ai_quota() (SECURITY DEFINER) can write it.
begin;

create table public.ai_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  bucket text not null,
  window_start timestamptz not null,
  request_count integer not null check (request_count >= 0),
  primary key (user_id, bucket, window_start)
);
alter table public.ai_usage enable row level security;
revoke all on public.ai_usage from public, anon, authenticated, service_role;

create function public.consume_ai_quota(
  p_bucket text,
  p_limit integer,
  p_window_seconds integer
) returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user uuid := auth.uid();
  v_now timestamptz := clock_timestamp();
  v_window_start timestamptz;
  v_count integer;
begin
  if v_user is null then
    raise exception using errcode = '28000', message = 'Authentication required';
  end if;
  -- Whitelists keep a malicious authenticated caller from creating unbounded rows.
  if p_bucket is null
    or p_bucket not in ('ai_daily', 'tutor', 'deck_generation', 'lexicoon',
      'card_translation', 'context_studio', 'stt')
    or p_limit is null or p_limit not between 1 and 100000
    or p_window_seconds is null or p_window_seconds not in (60, 86400) then
    raise exception using errcode = '22023', message = 'Invalid AI quota request';
  end if;

  v_window_start := to_timestamp(
    (floor(extract(epoch from v_now) / p_window_seconds) * p_window_seconds)::double precision
  );

  -- Cheap cleanup of this user's own old rows (uses the primary key prefix).
  delete from public.ai_usage
  where user_id = v_user and window_start < v_now - interval '2 days';

  insert into public.ai_usage as usage (user_id, bucket, window_start, request_count)
  values (v_user, p_bucket, v_window_start, 1)
  on conflict (user_id, bucket, window_start)
  do update set request_count = usage.request_count + 1
  returning usage.request_count into v_count;

  return v_count <= p_limit;
end;
$function$;

revoke all on function public.consume_ai_quota(text, integer, integer)
  from public, anon, authenticated, service_role;
grant execute on function public.consume_ai_quota(text, integer, integer) to authenticated;

commit;