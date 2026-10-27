-- Device/session registry: makes account sharing visible and self-limiting.
--
-- Today one email+password can be signed in on unlimited devices forever, and
-- nothing is recorded, so sharing cannot even be detected after the fact.
-- This records one row per device and lets the app cap concurrent devices.
--
-- Run in: Supabase dashboard > SQL Editor. Safe to re-run.

create table if not exists public.user_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  -- stable per browser profile; stored hashed, never raw.
  device_hash text not null,
  ip inet,
  user_agent text,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  revoked_at timestamptz,
  revoked_reason text,
  unique (user_id, device_hash)
);

create index if not exists user_sessions_active_idx
  on public.user_sessions (user_id, last_seen_at desc)
  where revoked_at is null;

alter table public.user_sessions enable row level security;

-- A user may see their own devices (to power a "signed in devices" screen).
-- Writes are service-role only, from the server.
drop policy if exists "read own sessions" on public.user_sessions;
create policy "read own sessions" on public.user_sessions
  for select to authenticated using (user_id = auth.uid());

-- Distinct IPs per user per day - the signal that a login is being shared.
create or replace view public.user_session_daily_ips as
  select user_id,
         date_trunc('day', last_seen_at) as day,
         count(distinct ip)              as distinct_ips,
         count(distinct device_hash)     as distinct_devices
  from public.user_sessions
  where revoked_at is null
  group by 1, 2;

revoke all on public.user_session_daily_ips from anon, authenticated;

-- Registers a device and enforces a concurrent-device cap in one atomic step.
-- Returns the action taken so the caller can surface it to the user.
create or replace function public.register_device(
  p_user_id uuid,
  p_device_hash text,
  p_ip inet,
  p_user_agent text,
  p_max_devices integer default 2
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_active integer;
  v_evicted integer := 0;
begin
  insert into public.user_sessions (user_id, device_hash, ip, user_agent)
  values (p_user_id, p_device_hash, p_ip, p_user_agent)
  on conflict (user_id, device_hash) do update
    set last_seen_at = now(),
        ip           = excluded.ip,
        user_agent   = excluded.user_agent,
        revoked_at   = null,
        revoked_reason = null;

  select count(*) into v_active
  from public.user_sessions
  where user_id = p_user_id and revoked_at is null;

  -- Over the cap: revoke least-recently-used devices, never the current one.
  if v_active > p_max_devices then
    with stale as (
      select id from public.user_sessions
      where user_id = p_user_id
        and revoked_at is null
        and device_hash <> p_device_hash
      order by last_seen_at desc
      offset greatest(p_max_devices - 1, 0)
    )
    update public.user_sessions s
      set revoked_at = now(), revoked_reason = 'device_limit'
      from stale
      where s.id = stale.id;
    get diagnostics v_evicted = row_count;
  end if;

  return jsonb_build_object(
    'active_devices', least(v_active, p_max_devices),
    'evicted', v_evicted,
    'max_devices', p_max_devices
  );
end;
$$;

-- Is this specific device still allowed to act?
create or replace function public.is_device_active(p_user_id uuid, p_device_hash text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.user_sessions
    where p_user_id = auth.uid()
      and user_id = p_user_id
      and device_hash = p_device_hash
      and revoked_at is null
  );
$$;

-- PostgreSQL grants EXECUTE on new functions to PUBLIC by default. Revoking
-- only anon/authenticated is insufficient because both roles inherit PUBLIC.
revoke execute on function public.register_device(uuid, text, inet, text, integer) from public, anon, authenticated;
grant execute on function public.register_device(uuid, text, inet, text, integer) to service_role;
revoke execute on function public.is_device_active(uuid, text) from public, anon, authenticated;
grant execute on function public.is_device_active(uuid, text) to authenticated;
