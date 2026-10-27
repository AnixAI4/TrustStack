-- ============================================================================
-- M8: Breach Response - schema + RLS
-- ----------------------------------------------------------------------------
-- breach_incidents - one row per logged personal data breach (BRH-YYYY-NNN).
--   An INTERNAL incident log: an org records its OWN breaches and drives the
--   72-hour DPBI notification workflow (DPDP Act §8(6) + Rules 2025 Rule 7).
--   There are NO public routes - so, unlike M5 DSR, there is NO public-insert
--   policy here (same as M6 ROPA).
--
-- The 72-hour countdown is DERIVED at read time from discovered_at (no cron);
-- dpbi_notification_due_at is stamped on create so escalation/countdown scans
-- can use an index. The escalation ALERT EMAILS need an EXTERNAL scheduler
-- hitting POST /api/breach/escalations/run (Vercel Cron / GitHub Action /
-- Supabase pg_cron) - nothing in this schema sends email.
--
-- Run this once in the Supabase SQL Editor. Idempotent - safe to re-run.
-- (Supabase flags any DROP as "destructive"; DROP POLICY IF EXISTS before
--  CREATE POLICY is intentional and harmless - it just makes the script rerunnable.)
-- ============================================================================

create table if not exists public.breach_incidents (
  id                            uuid primary key default gen_random_uuid(),
  organization_id               uuid references public.organizations(id) on delete cascade,
  reference_number              text not null,          -- BRH-2026-001 (unique PER ORG - composite index below, NOT global)
  discovered_at                 timestamptz not null,   -- when the org became aware
  occurred_at                   timestamptz,            -- when the breach actually happened (if known)
  nature                        text not null,          -- 'unauthorized_access' | 'accidental_disclosure' | 'ransomware' | 'data_loss' | 'insider_threat' | 'other'
  data_categories_affected      text[] not null default '{}',
  data_subjects_affected_approx integer,                -- approximate number of data principals
  systems_involved              text[],
  discovery_method              text,
  containment_actions           text,

  -- 72-hour DPBI countdown (derived at read time; due_at stored for indexed scans)
  dpbi_notification_due_at      timestamptz not null,   -- discovered_at + 72 hours
  dpbi_notified                 boolean not null default false,
  dpbi_notified_at              timestamptz,
  dpbi_notification_draft       text,                   -- Claude-generated DPBI notification letter

  -- Data principal notification
  principals_notified           boolean not null default false,
  principals_notified_at        timestamptz,
  notification_method           text,

  -- Status + post-mortem. status is the lifecycle ('open' | 'contained' |
  -- 'resolved') ONLY - the DPBI-notified state is the dpbi_notified boolean
  -- above, deliberately NOT encoded as a status value (so the two never collide).
  status                        text not null default 'open',
  root_cause                    text,
  remediation_actions           text,
  resolved_at                   timestamptz,

  -- Escalation bookkeeping - which "hours remaining" thresholds have already
  -- emailed the DPO (e.g. {'48','24'}), so escalations/run never double-sends.
  escalations_sent              text[] not null default '{}',

  logged_by                     uuid references auth.users(id),
  created_at                    timestamptz default now(),
  updated_at                    timestamptz default now()
);

-- Reference numbers are generated PER ORG (BRH-YYYY-NNN restarts at 001 for each
-- org), so uniqueness must be scoped to the org - NOT global, or two orgs both
-- minting BRH-2026-001 would collide on insert (the latent M4 / fixed-in-M5 bug).
create unique index if not exists breach_incidents_org_reference_uniq on public.breach_incidents (organization_id, reference_number);
create index if not exists idx_breach_org_created  on public.breach_incidents (organization_id, created_at desc);
create index if not exists idx_breach_org_status   on public.breach_incidents (organization_id, status);
-- For the countdown / escalation scans (open, un-notified breaches near a deadline).
create index if not exists idx_breach_org_due      on public.breach_incidents (organization_id, dpbi_notification_due_at);
create index if not exists idx_breach_org_notified on public.breach_incidents (organization_id, dpbi_notified);

alter table public.breach_incidents enable row level security;

-- ----------------------------------------------------------------------------
-- breach_incidents policies - standard org-members manage. Querying
-- organization_members FROM breach_incidents is safe; the infinite-recursion
-- trap only applies to policies defined ON organization_members itself.
-- ----------------------------------------------------------------------------
drop policy if exists "org members manage breaches" on public.breach_incidents;
create policy "org members manage breaches" on public.breach_incidents
  for all using (
    organization_id in (
      select organization_id from public.organization_members where user_id = auth.uid()
    )
  );

-- INTERNAL module - NO public-insert policy (unlike M5 DSR). The escalation-run
-- endpoint (POST /api/breach/escalations/run) is a system cron with no user
-- session and uses the service-role admin client, which bypasses RLS entirely.
