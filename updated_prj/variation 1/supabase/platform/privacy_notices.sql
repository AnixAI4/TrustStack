-- ============================================================================
-- M3: Privacy Notice Builder - schema + RLS
-- ----------------------------------------------------------------------------
-- Two tables:
--   privacy_notices - one row per org (the "live" pointer + slug)
--   privacy_notice_versions - immutable per-version snapshot of the generated
--                              notice (English + translations + the Grievance
--                              Officer details captured at publish time).
--
-- Mirrors the M2 consent_config_versions immutability pattern: a new snapshot
-- row is written on every save/publish; old rows are NEVER mutated, so you can
-- always reconstruct exactly which notice a data principal saw on a given date.
--
-- Run this once in the Supabase SQL Editor. Idempotent - safe to re-run.
-- (Supabase flags any DROP as "destructive"; DROP POLICY IF EXISTS before
--  CREATE POLICY is intentional and harmless - it just makes the script rerunnable.)
-- ============================================================================

create table if not exists public.privacy_notices (
  id                 uuid primary key default gen_random_uuid(),
  organization_id    uuid not null references public.organizations(id) on delete cascade,
  current_version_id uuid,
  slug               text unique not null,
  published          boolean not null default false,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create table if not exists public.privacy_notice_versions (
  id                      uuid primary key default gen_random_uuid(),
  notice_id               uuid not null references public.privacy_notices(id) on delete cascade,
  organization_id         uuid not null references public.organizations(id) on delete cascade,
  version_number          integer not null default 1,
  content_en              text not null,
  content_hi              text,
  content_ta              text,
  content_te              text,
  content_mr              text,
  grievance_officer_name  text not null,
  grievance_officer_email text not null,
  grievance_officer_phone text,
  change_summary          text,
  published_at            timestamptz,
  created_by              uuid references auth.users(id),
  created_at              timestamptz not null default now()
);

create index if not exists idx_pn_org              on public.privacy_notices (organization_id);
create index if not exists idx_pnv_notice_created  on public.privacy_notice_versions (notice_id, created_at desc);
create index if not exists idx_pnv_org             on public.privacy_notice_versions (organization_id);

alter table public.privacy_notices         enable row level security;
alter table public.privacy_notice_versions enable row level security;

-- ----------------------------------------------------------------------------
-- privacy_notices policies
-- ----------------------------------------------------------------------------
-- Org members manage their own notice.
drop policy if exists "org members manage privacy_notices" on public.privacy_notices;
create policy "org members manage privacy_notices" on public.privacy_notices
  for all using (
    organization_id in (
      select organization_id from public.organization_members where user_id = auth.uid()
    )
  );

-- Anyone (incl. anon) can read a notice once it is published.
drop policy if exists "public can read published notices" on public.privacy_notices;
create policy "public can read published notices" on public.privacy_notices
  for select using (published = true);

-- ----------------------------------------------------------------------------
-- privacy_notice_versions policies
-- ----------------------------------------------------------------------------
-- Org members manage their own versions.
drop policy if exists "org members manage notice_versions" on public.privacy_notice_versions;
create policy "org members manage notice_versions" on public.privacy_notice_versions
  for all using (
    organization_id in (
      select organization_id from public.organization_members where user_id = auth.uid()
    )
  );

-- Anyone can read versions that belong to a published notice (public page).
drop policy if exists "public can read published versions" on public.privacy_notice_versions;
create policy "public can read published versions" on public.privacy_notice_versions
  for select using (
    notice_id in (select id from public.privacy_notices where published = true)
  );
