-- P0 access control: close org self-join, add seat-limited invites.
--
-- Verified exploit this fixes: any authenticated user could
--   insert into organization_members (organization_id, user_id, role)
-- with only the public anon key, then read that org's vendors / ropa /
-- breaches / dsr / consent records. Proven against this database.
--
-- Run in: Supabase dashboard > SQL Editor. Safe to re-run.

-- ── Helper: org ids for a user ──────────────────────────────────────────────
-- security definer so policies on organization_members can call it without
-- recursing into their own RLS check.
create or replace function public.user_org_ids(p_user_id uuid)
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select distinct coalesce(m.organization_id, m.org_id)
  from public.organization_members m
  where (auth.role() = 'service_role' or p_user_id = auth.uid())
    and m.user_id = p_user_id
    and coalesce(m.organization_id, m.org_id) is not null;
$$;

create or replace function public.is_org_admin(p_user_id uuid, p_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (auth.role() = 'service_role' or p_user_id = auth.uid()) and exists (
    select 1 from public.organization_members m
    where m.user_id = p_user_id
      and coalesce(m.organization_id, m.org_id) = p_org_id
      and m.role in ('owner', 'admin')
  );
$$;

-- ── Seats on the subscription ───────────────────────────────────────────────
alter table public.truststack_subscriptions
  add column if not exists seats integer not null default 3;

-- ── Invites ─────────────────────────────────────────────────────────────────
create table if not exists public.organization_invites (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  email text not null,
  role text not null default 'member'
    check (role in ('owner', 'admin', 'member', 'dpo', 'viewer', 'board')),
  -- sha256 of the token; the raw token is only ever in the invite link.
  token_hash text not null unique,
  invited_by uuid references auth.users(id) on delete set null,
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  accepted_by uuid references auth.users(id) on delete set null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists organization_invites_org_idx
  on public.organization_invites (organization_id);
create unique index if not exists organization_invites_pending_email_idx
  on public.organization_invites (organization_id, lower(email))
  where accepted_at is null and revoked_at is null;

alter table public.organization_invites enable row level security;

-- Admins may view their org's invites. All writes go through server routes
-- using the service role, which enforce seat limits.
drop policy if exists "admins read org invites" on public.organization_invites;
create policy "admins read org invites" on public.organization_invites
  for select to authenticated
  using (public.is_org_admin(auth.uid(), organization_id));

-- ── THE FIX: no client-side membership writes ───────────────────────────────
-- Previously: with check (user_id = auth.uid()) -- i.e. join any org you like.
revoke insert, update on public.organization_members from public, anon, authenticated;
revoke insert on public.organizations from public, anon, authenticated;

drop policy if exists "users can join orgs" on public.organization_members;
drop policy if exists "users can insert their membership" on public.organization_members;
drop policy if exists "users can insert own membership" on public.organization_members;
drop policy if exists "authenticated users can join" on public.organization_members;
drop policy if exists "org members insert" on public.organization_members;
drop policy if exists "members insert self" on public.organization_members;
drop policy if exists "authenticated users can create org" on public.organizations;

-- Workspace metadata may be changed only by owners/admins. A board or viewer
-- member can read the workspace but cannot rename or reconfigure it.
drop policy if exists "members can update own orgs" on public.organizations;
drop policy if exists "admins update own orgs" on public.organizations;
create policy "admins update own orgs" on public.organizations
  for update to authenticated
  using (public.is_org_admin(auth.uid(), id))
  with check (public.is_org_admin(auth.uid(), id));

-- Members may see who else is in their org (previously self-row only, which
-- made any member-management UI impossible).
drop policy if exists "members read own org roster" on public.organization_members;
create policy "members read own org roster" on public.organization_members
  for select to authenticated
  using (coalesce(organization_id, org_id) in (select public.user_org_ids(auth.uid())));

-- Admins may remove members; nobody may INSERT from the client.
drop policy if exists "admins remove members" on public.organization_members;
create policy "admins remove members" on public.organization_members
  for delete to authenticated
  using (
    public.is_org_admin(auth.uid(), coalesce(organization_id, org_id))
    and user_id <> auth.uid()
  );

-- Atomically reserve an invite seat. A personal Pilot subscription is attached
-- to the org on first invite so accepted members inherit the same entitlement.
create or replace function public.create_organization_invite(
  p_org_id uuid,
  p_email text,
  p_role text,
  p_token_hash text,
  p_invited_by uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_subscription public.truststack_subscriptions%rowtype;
  v_members integer;
  v_pending integer;
  v_invite_id uuid;
begin
  if not public.is_org_admin(p_invited_by, p_org_id) then
    raise exception 'admin_required';
  end if;
  if p_role not in ('admin', 'member', 'dpo', 'viewer', 'board') then
    raise exception 'invalid_role';
  end if;
  if p_email !~* '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$' then
    raise exception 'invalid_email';
  end if;

  select * into v_subscription
  from public.truststack_subscriptions s
  where s.tier = 'pilot'
    and s.status in ('active', 'trialing')
    and (s.current_period_end is null or s.current_period_end > now())
    and (s.org_id = p_org_id or (s.org_id is null and s.user_id = p_invited_by))
  order by (s.org_id = p_org_id) desc, s.created_at desc
  limit 1
  for update;

  if v_subscription.id is null then
    raise exception 'active_org_pilot_required';
  end if;

  if v_subscription.org_id is null then
    update public.truststack_subscriptions
    set org_id = p_org_id, updated_at = now()
    where id = v_subscription.id;
  end if;

  select count(*) into v_members
  from public.organization_members
  where coalesce(organization_id, org_id) = p_org_id;

  select count(*) into v_pending
  from public.organization_invites
  where organization_id = p_org_id
    and accepted_at is null and revoked_at is null and expires_at > now();

  if v_members + v_pending >= v_subscription.seats then
    raise exception 'seat_limit_reached';
  end if;

  insert into public.organization_invites
    (organization_id, email, role, token_hash, invited_by)
  values
    (p_org_id, lower(trim(p_email)), p_role, p_token_hash, p_invited_by)
  returning id into v_invite_id;

  return v_invite_id;
end;
$$;

create or replace function public.accept_organization_invite(
  p_token_hash text,
  p_user_id uuid,
  p_email text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_invite public.organization_invites%rowtype;
  v_seats integer;
  v_members integer;
begin
  select * into v_invite
  from public.organization_invites
  where token_hash = p_token_hash
  for update;

  if v_invite.id is null or v_invite.revoked_at is not null then
    raise exception 'invite_not_found';
  end if;
  if v_invite.accepted_at is not null then
    if v_invite.accepted_by = p_user_id then
      return jsonb_build_object('organization_id', v_invite.organization_id, 'accepted', true);
    end if;
    raise exception 'invite_already_used';
  end if;
  if v_invite.expires_at <= now() then
    raise exception 'invite_expired';
  end if;
  if lower(trim(p_email)) <> lower(v_invite.email) then
    raise exception 'email_mismatch';
  end if;

  select s.seats into v_seats
  from public.truststack_subscriptions s
  where s.org_id = v_invite.organization_id
    and s.tier = 'pilot'
    and s.status in ('active', 'trialing')
    and (s.current_period_end is null or s.current_period_end > now())
  order by s.created_at desc
  limit 1
  for update;

  if v_seats is null then raise exception 'active_org_pilot_required'; end if;

  select count(*) into v_members
  from public.organization_members
  where coalesce(organization_id, org_id) = v_invite.organization_id;
  if v_members >= v_seats then raise exception 'seat_limit_reached'; end if;

  insert into public.organization_members
    (org_id, organization_id, user_id, role, invited_at, joined_at)
  values
    (v_invite.organization_id, v_invite.organization_id, p_user_id,
     v_invite.role, v_invite.created_at, now())
  on conflict (org_id, user_id) do nothing;

  update public.organization_invites
  set accepted_at = now(), accepted_by = p_user_id
  where id = v_invite.id;

  return jsonb_build_object(
    'organization_id', v_invite.organization_id,
    'accepted', true
  );
end;
$$;

revoke execute on function public.user_org_ids(uuid) from public, anon, authenticated;
revoke execute on function public.is_org_admin(uuid, uuid) from public, anon, authenticated;
grant execute on function public.user_org_ids(uuid) to authenticated, service_role;
grant execute on function public.is_org_admin(uuid, uuid) to authenticated, service_role;
revoke execute on function public.create_organization_invite(uuid, text, text, text, uuid) from public, anon, authenticated;
revoke execute on function public.accept_organization_invite(text, uuid, text) from public, anon, authenticated;
grant execute on function public.create_organization_invite(uuid, text, text, text, uuid) to service_role;
grant execute on function public.accept_organization_invite(text, uuid, text) to service_role;
