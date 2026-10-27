-- Durable full scan report storage (cross-device recovery).
-- Safe to re-run. Run in Supabase Dashboard → SQL → New query.

create table if not exists public.scan_reports (
  report_id text primary key,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_scan_reports_updated
  on public.scan_reports (updated_at desc);

alter table public.scan_reports enable row level security;
-- Service role (Next.js admin + Flask API) bypasses RLS.
