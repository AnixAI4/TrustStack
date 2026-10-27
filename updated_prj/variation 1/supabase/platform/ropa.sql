-- ============================================================================
-- M6: ROPA Builder - schema + RLS
-- ----------------------------------------------------------------------------
-- One table:
--   ropa_entries - one row per Record of Processing Activity for an org. Tracks
--                  the data categories / subject types / purposes / legal basis,
--                  cross-border transfers, retention, processors, the DPO
--                  approval flags, and the draft → active → archived lifecycle.
--
-- RLS pattern: organization_id-scoped, gated by membership in organization_members
-- (the standard pattern - the recursion trap only applies to policies ON
-- organization_members itself, not to policies that query it). ROPA is an
-- INTERNAL inventory: there are NO public routes and NO public policy.
--
-- There is NO per-org sequential reference number here, so the M4/M5 global-unique
-- pitfall does not apply.
--
-- The ROPA ↔ Consent cross-reference (which entries have a matching consent
-- purpose) is computed at READ TIME in the API - it is intentionally NOT a stored
-- column here.
--
-- Run this once in the Supabase SQL Editor. Idempotent - safe to re-run.
-- (Supabase flags DROP as "destructive"; DROP POLICY IF EXISTS before CREATE
--  POLICY is intentional and harmless - it just makes the script rerunnable.)
-- ============================================================================

create table if not exists public.ropa_entries (
  id                    uuid primary key default gen_random_uuid(),
  organization_id       uuid references public.organizations(id) on delete cascade,
  activity_name         text not null,
  activity_description  text,
  data_controller_name  text not null,
  data_categories       text[] not null default '{}',
  data_subject_types    text[] not null default '{}',   -- 'customers' | 'employees' | 'children' | 'vendors' | 'website_visitors'
  processing_purposes   text[] not null default '{}',
  legal_basis           text not null,                  -- DPDP_BASES id
  data_sources          text[],
  recipients            text[],
  cross_border_transfer boolean default false,
  transfer_countries    text[],
  retention_period      text,
  security_measures     text[],
  processor_names       text[],
  dpo_approved          boolean default false,
  dpo_approved_at       timestamptz,
  last_reviewed_at      timestamptz,
  status                text not null default 'draft',  -- 'draft' | 'active' | 'archived'
  created_by            uuid references auth.users(id),
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);

create index if not exists idx_ropa_org            on public.ropa_entries (organization_id, created_at desc);
create index if not exists idx_ropa_org_status     on public.ropa_entries (organization_id, status);

alter table public.ropa_entries enable row level security;

-- ----------------------------------------------------------------------------
-- ropa_entries policies - org members manage their own ROPA (internal only).
-- ----------------------------------------------------------------------------
drop policy if exists "org members manage ropa" on public.ropa_entries;
create policy "org members manage ropa" on public.ropa_entries
  for all using (
    organization_id in (
      select organization_id from public.organization_members where user_id = auth.uid()
    )
  );
