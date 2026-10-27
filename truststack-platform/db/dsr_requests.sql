-- ============================================================================
-- M5: DSR (Data Subject Rights) Management — schema + RLS
-- ----------------------------------------------------------------------------
-- Three tables:
--   dsr_requests    — one row per rights request (DSR-YYYY-NNN). Covers the 6
--                     actionable DPDP rights (access / correction / completeness
--                     / erasure / restrict / nominate). Grievance redressal
--                     (Section 14) stays in M4.
--   dsr_nominations — Section 15 nominations (no GDPR equivalent). Linked to the
--                     requestor by data_principal_hash (sha256 of org:email).
--   dsr_otps        — short-lived, hashed email-OTP material for identity
--                     verification. RLS is ON with NO policies, so ONLY the
--                     service-role (admin client) can read/write it — no anon or
--                     authenticated client ever sees an OTP hash.
--
-- Run this once in the Supabase SQL Editor. Idempotent — safe to re-run.
-- (Supabase flags any DROP as "destructive"; DROP POLICY IF EXISTS before
--  CREATE POLICY is intentional and harmless — it just makes the script rerunnable.)
-- ============================================================================

create table if not exists public.dsr_requests (
  id                          uuid primary key default gen_random_uuid(),
  organization_id             uuid references public.organizations(id) on delete cascade,
  reference_number            text not null,          -- DSR-2026-001 (unique PER ORG — see composite index below)
  right_type                  text not null,          -- 'access' | 'correction' | 'completeness' | 'erasure' | 'restrict' | 'nominate'
  requestor_name              text not null,
  requestor_email             text,
  requestor_phone             text,
  requestor_identity_verified boolean not null default false,
  verification_method         text,                   -- 'email_otp' | 'sms_otp' | 'aadhaar' (future)
  request_details             text,
  affected_data_categories    text[],
  status                      text not null default 'received', -- 'received' | 'identity_pending' | 'processing' | 'fulfilled' | 'denied' | 'overdue'
  assigned_to                 uuid references auth.users(id),
  fulfillment_notes           text,
  denial_reason               text,
  fulfilled_at                timestamptz,
  due_date                    timestamptz,            -- recommended 30 days from created_at
  created_at                  timestamptz default now(),
  updated_at                  timestamptz default now()
);

-- For the nomination right (Section 15)
create table if not exists public.dsr_nominations (
  id                  uuid primary key default gen_random_uuid(),
  organization_id     uuid references public.organizations(id) on delete cascade,
  data_principal_hash text not null,
  nominee_name        text not null,
  nominee_email       text not null,
  nominee_phone       text,
  relationship        text,
  active              boolean not null default true,
  created_at          timestamptz default now()
);

-- Email-OTP material for identity verification (M5-only; built this module).
create table if not exists public.dsr_otps (
  id              uuid primary key default gen_random_uuid(),
  dsr_request_id  uuid not null references public.dsr_requests(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete cascade,
  code_hash       text not null,          -- sha256(request_id:code) — never the raw code
  expires_at      timestamptz not null,
  attempts        integer not null default 0,
  consumed_at     timestamptz,
  created_at      timestamptz default now()
);

-- Reference numbers are generated PER ORG (DSR-YYYY-NNN restarts at 001 for each
-- org), so uniqueness must be scoped to the org — NOT global, or two orgs both
-- minting DSR-2026-001 would collide.
create unique index if not exists dsr_requests_org_reference_uniq on public.dsr_requests (organization_id, reference_number);
create index if not exists idx_dsr_req_org           on public.dsr_requests (organization_id, created_at desc);
create index if not exists idx_dsr_req_reference     on public.dsr_requests (reference_number);
create index if not exists idx_dsr_req_status        on public.dsr_requests (organization_id, status);
create index if not exists idx_dsr_nom_org_principal on public.dsr_nominations (organization_id, data_principal_hash);
create index if not exists idx_dsr_otp_request       on public.dsr_otps (dsr_request_id, created_at desc);

alter table public.dsr_requests    enable row level security;
alter table public.dsr_nominations enable row level security;
alter table public.dsr_otps        enable row level security;

-- ----------------------------------------------------------------------------
-- dsr_requests policies
-- ----------------------------------------------------------------------------
-- Org members manage their own requests.
drop policy if exists "org members manage dsr_requests" on public.dsr_requests;
create policy "org members manage dsr_requests" on public.dsr_requests
  for all using (
    organization_id in (
      select organization_id from public.organization_members where user_id = auth.uid()
    )
  );

-- Public can submit (the DSR portal is public-facing). The submit API actually
-- uses the service-role admin client, so this is belt-and-suspenders.
drop policy if exists "public can submit dsr" on public.dsr_requests;
create policy "public can submit dsr" on public.dsr_requests
  for insert with check (true);

-- ----------------------------------------------------------------------------
-- dsr_nominations policies
-- ----------------------------------------------------------------------------
drop policy if exists "org members manage nominations" on public.dsr_nominations;
create policy "org members manage nominations" on public.dsr_nominations
  for all using (
    organization_id in (
      select organization_id from public.organization_members where user_id = auth.uid()
    )
  );

-- ----------------------------------------------------------------------------
-- dsr_otps — intentionally NO policies. RLS is enabled and nothing is granted,
-- so anon + authenticated clients are denied entirely; only the service-role
-- (admin client) used by /api/dsr/submit + /api/dsr/otp/* can touch this table.
-- ----------------------------------------------------------------------------
