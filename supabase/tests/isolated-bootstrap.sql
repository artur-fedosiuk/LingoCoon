-- CI ONLY: minimal managed-schema fixtures, not the Supabase platform.
-- Never apply this file to a linked or persistent database.
\set ON_ERROR_STOP on
do $guard$
begin
  if current_database() <> 'lingocoon_ci'
    or exists (select 1 from pg_namespace where nspname in ('auth', 'storage')) then
    raise exception 'Requires a fresh isolated lingocoon_ci database';
  end if;
end;
$guard$;
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;
create schema auth;
create schema storage;
grant usage on schema public, auth, storage to anon, authenticated, service_role;
create table auth.users (
  id uuid primary key,
  email text,
  raw_user_meta_data jsonb not null default '{}'::jsonb
);
create function auth.uid() returns uuid language sql stable as $function$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
$function$;
create table storage.buckets (
  id text primary key,
  name text unique not null,
  public boolean not null default false,
  file_size_limit bigint,
  allowed_mime_types text[]
);
create table storage.objects (
  id uuid primary key default gen_random_uuid(),
  bucket_id text references storage.buckets(id),
  name text
);
alter table storage.objects enable row level security;
grant all on storage.objects, storage.buckets to service_role;
grant select, insert, update, delete on storage.objects to anon, authenticated;
