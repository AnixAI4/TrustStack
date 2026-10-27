-- ============================================================================
-- M7: Vendor DPA Manager — schema + RLS
-- ----------------------------------------------------------------------------
-- Two tables:
--   vendors                        — one row per data processor an org uses.
--                                    Tracks the DPA lifecycle (pending → sent →
--                                    signed → expired), the computed risk score
--                                    / tier, residency, and DPA dates.
--   vendor_questionnaire_responses — one row per answered questionnaire question
--                                    (vendor_id + question_id). The risk score is
--                                    recomputed from these on submit.
--
-- RLS pattern: both tables carry organization_id and are gated by membership in
-- organization_members (the standard pattern — the recursion trap only applies
-- to policies ON organization_members itself, not to policies that query it).
-- The public questionnaire GET/submit use the SERVICE-ROLE admin client, which
-- bypasses RLS; the org-members policy is for the authenticated dashboard.
--
-- There is NO per-org sequential reference number in this schema, so the M4/M5
-- global-unique pitfall does not apply here.
--
-- Run this once in the Supabase SQL Editor. Idempotent — safe to re-run.
-- (Supabase flags DROP as "destructive"; DROP POLICY IF EXISTS before CREATE
--  POLICY is intentional and harmless — it just makes the script rerunnable.)
-- ============================================================================

create table if not exists public.vendors (
  id                         uuid primary key default gen_random_uuid(),
  organization_id            uuid references public.organizations(id) on delete cascade,
  name                       text not null,
  website                    text,
  contact_name               text,
  contact_email              text,
  vendor_type                text not null,            -- 'cloud' | 'payments' | 'analytics' | 'marketing' | 'crm' | 'hr' | 'communications' | 'other'
  data_location              text[],                   -- countries / regions where data is stored
  india_data_residency       boolean default false,
  personal_data_categories   text[],
  risk_tier                  text,                     -- 'low' | 'medium' | 'high' | 'critical' (computed)
  risk_score                 integer,                  -- 0-100 computed
  dpa_status                 text not null default 'pending', -- 'pending' | 'sent' | 'signed' | 'expired'
  dpa_signed_at              timestamptz,
  dpa_expires_at             timestamptz,
  dpa_document_url           text,
  questionnaire_completed    boolean default false,
  questionnaire_completed_at timestamptz,
  notes                      text,
  created_at                 timestamptz default now(),
  updated_at                 timestamptz default now()
);

create table if not exists public.vendor_questionnaire_responses (
  id              uuid primary key default gen_random_uuid(),
  vendor_id       uuid references public.vendors(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete cascade,
  question_id     text not null,                       -- 'A1' … 'G6'
  answer          text not null,
  created_at      timestamptz default now()
);

-- One stored answer per question per vendor (submit upserts on this).
create unique index if not exists vendor_qresp_vendor_question_uniq
  on public.vendor_questionnaire_responses (vendor_id, question_id);

create index if not exists idx_vendors_org             on public.vendors (organization_id, created_at desc);
create index if not exists idx_vendors_org_status      on public.vendors (organization_id, dpa_status);
create index if not exists idx_vendors_org_risk        on public.vendors (organization_id, risk_tier);
create index if not exists idx_vendors_dpa_expiry      on public.vendors (organization_id, dpa_expires_at);
create index if not exists idx_vendor_qresp_vendor     on public.vendor_questionnaire_responses (vendor_id);
create index if not exists idx_vendor_qresp_org        on public.vendor_questionnaire_responses (organization_id);

alter table public.vendors                        enable row level security;
alter table public.vendor_questionnaire_responses enable row level security;

-- ----------------------------------------------------------------------------
-- vendors policies — org members manage their own vendors.
-- ----------------------------------------------------------------------------
drop policy if exists "org members manage vendors" on public.vendors;
create policy "org members manage vendors" on public.vendors
  for all using (
    organization_id in (
      select organization_id from public.organization_members where user_id = auth.uid()
    )
  );

-- ----------------------------------------------------------------------------
-- vendor_questionnaire_responses policies — org members manage their own.
-- The public questionnaire submit writes via the service-role admin client,
-- which bypasses RLS, so no public-insert policy is needed.
-- ----------------------------------------------------------------------------
drop policy if exists "org members manage vendor questionnaires" on public.vendor_questionnaire_responses;
create policy "org members manage vendor questionnaires" on public.vendor_questionnaire_responses
  for all using (
    organization_id in (
      select organization_id from public.organization_members where user_id = auth.uid()
    )
  );
