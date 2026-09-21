-- ISOLATED DATABASE ONLY. Synthetic metadata; never calls Google or Storage.
\set ON_ERROR_STOP on
begin;
do $test$
declare
  owners uuid[] := array[]::uuid[];
  leases uuid[] := array[]::uuid[];
  owner_id uuid;
  lease_id uuid;
  key text;
  result jsonb;
  i integer;
begin
  if exists(select 1 from public.reading_tts_cache)
    or exists(select 1 from public.google_tts_budget_periods) then
    raise exception 'Requires empty isolated tables';
  end if;
  if has_function_privilege('anon','public.reading_tts_admit(uuid,text,integer,text,uuid,integer,integer)','EXECUTE')
    or has_function_privilege('authenticated','public.reading_tts_admit(uuid,text,integer,text,uuid,integer,integer)','EXECUTE')
    or not has_function_privilege('service_role','public.reading_tts_admit(uuid,text,integer,text,uuid,integer,integer)','EXECUTE')
    or has_table_privilege('service_role','public.reading_tts_admission','INSERT')
    or has_table_privilege('authenticated','public.reading_tts_admission','SELECT')
    or has_table_privilege('service_role','public.reading_tts_dispatch_windows','DELETE') then
    raise exception 'Admission ACL regression';
  end if;
  if exists(select 1 from pg_class where oid in ('public.reading_tts_admission'::regclass,
    'public.reading_tts_dispatch_windows'::regclass) and not relrowsecurity) then
    raise exception 'Admission RLS regression';
  end if;
  update public.reading_tts_budget set lifetime_limit=999000, daily_limit=999000,
    user_daily_limit=10000, concurrent_limit=5, credit_expires_at=clock_timestamp()+interval '1 day';
  insert into public.google_tts_budget_periods(starts_at,ends_at,outside_characters,reconciled_at,enabled)
    values(clock_timestamp()-interval '1 hour',clock_timestamp()+interval '1 day',0,clock_timestamp(),true);
  for i in 1..100 loop
    owner_id := gen_random_uuid(); lease_id := gen_random_uuid();
    owners := array_append(owners,owner_id); leases := array_append(leases,lease_id);
    key := lpad(to_hex(i),64,'0');
    insert into auth.users(id,email) values(owner_id,'queue-'||i||'@example.test');
    result := public.reading_tts_admit(owner_id,key,100,repeat('f',64),lease_id,100,1);
    if result->>'status' <> (case when i<=5 then 'reserved' else 'queued' end) then
      raise exception 'Admission % returned %', i,result;
    end if;
  end loop;
  if (select count(*) from public.reading_tts_admission) <> 95
    or (select lifetime_used from public.reading_tts_budget) <> 500 then
    raise exception 'Waiting must not charge characters';
  end if;
  -- Polling the waiting queue does not amplify shared-IP access accounting.
  update public.reading_tts_admission set next_poll_at='-infinity';
  for i in 6..100 loop
    result := public.reading_tts_admit(owners[i],lpad(to_hex(i),64,'0'),100,repeat('f',64),gen_random_uuid(),100,1);
    if result->>'status'<>'queued' then raise exception 'Full pool must queue'; end if;
  end loop;
  if (select requests from public.reading_tts_rate_windows where scope='ip' and subject=repeat('f',64))<>5 then
    raise exception 'Queue polling consumed access slots';
  end if;
  update public.reading_tts_admission set next_poll_at='-infinity';
  for i in 1..100 loop
    key := lpad(to_hex(i),64,'0');
    if i>5 then
      result := public.reading_tts_admit(owners[i],key,100,repeat('f',64),leases[i],100,1);
      if result->>'status'<>'reserved' then raise exception 'Queue did not drain at %: %',i,result; end if;
    end if;
    if not public.reading_tts_complete(owners[i],key,leases[i],owners[i]::text||'/'||key||'/'||leases[i]::text||'.ndjson',100) then
      raise exception 'Completion failed';
    end if;
  end loop;
  if exists(select 1 from public.reading_tts_admission)
    or (select reserved_characters from public.google_tts_budget_periods)<>10000
    or (select sum(requests) from public.reading_tts_dispatch_windows)<>100 then
    raise exception 'Incorrect drain accounting';
  end if;
  -- Cached playback bypasses the exhausted generation budget, not owner checks.
  update public.google_tts_budget_periods set outside_characters=989000;
  for i in 1..100 loop
    result := public.reading_tts_admit(owners[i],lpad(to_hex(i),64,'0'),100,repeat('f',64),gen_random_uuid(),100,1);
    if result->>'status'<>'hit' then raise exception 'Cache hit failed at %: %',i,result; end if;
  end loop;
  result := public.reading_tts_admit(owners[1],repeat('a',64),1,repeat('f',64),gen_random_uuid(),1,1);
  if result->>'status'<>'quota_exceeded' then raise exception 'Quota bypass'; end if;
  -- Pacing reserves every chunk; an abandoned ticket expires without charging.
  update public.google_tts_budget_periods set outside_characters=0;
  insert into public.reading_tts_dispatch_windows values(gen_random_uuid(),clock_timestamp(),80);
  result := public.reading_tts_admit(owners[1],repeat('b',64),1,repeat('f',64),gen_random_uuid(),1,1);
  if result->>'status'<>'queued' then raise exception 'Provider pacing bypass'; end if;
  update public.reading_tts_admission set expires_at=clock_timestamp()-interval '1 second';
  result := public.reading_tts_admit(owners[2],repeat('c',64),1,repeat('f',64),gen_random_uuid(),1,1);
  if exists(select 1 from public.reading_tts_admission as admission where admission.owner_id=owners[1]) then
    raise exception 'Abandoned ticket retained';
  end if;
end;
$test$;
rollback;
