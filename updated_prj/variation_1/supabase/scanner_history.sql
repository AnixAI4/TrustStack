-- Scanner history + usage (shared with DPDP scanner schema).
-- Safe to re-run.

create table if not exists public.user_scans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  report_id text not null,
  url text not null,
  score integer not null default 0,
  verdict text not null default '',
  scanned_at timestamptz not null default now(),
  unique (user_id, report_id)
);

alter table public.user_scans
  add column if not exists payload jsonb;

create index if not exists idx_user_scans_user_scanned
  on public.user_scans (user_id, scanned_at desc);

alter table public.user_scans enable row level security;

drop policy if exists "Users read own scans" on public.user_scans;
create policy "Users read own scans"
  on public.user_scans for select
  using (auth.uid() = user_id);

drop policy if exists "Users insert own scans" on public.user_scans;
create policy "Users insert own scans"
  on public.user_scans for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users update own scans" on public.user_scans;
create policy "Users update own scans"
  on public.user_scans for update
  using (auth.uid() = user_id);

drop policy if exists "Users delete own scans" on public.user_scans;
create policy "Users delete own scans"
  on public.user_scans for delete
  using (auth.uid() = user_id);

create table if not exists public.daily_scan_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  scan_date date not null default current_date,
  scans_used integer not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, scan_date)
);

alter table public.daily_scan_usage enable row level security;

drop policy if exists "Users see own scan usage" on public.daily_scan_usage;
create policy "Users see own scan usage"
  on public.daily_scan_usage for select
  using (auth.uid() = user_id);

create table if not exists public.user_entitlements (
  user_id uuid primary key references auth.users(id) on delete cascade,
  free_scans_used integer not null default 0,
  scan_credits integer not null default 0,
  pro_scans_used integer not null default 0,
  pro_scans_reset_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.user_entitlements enable row level security;

drop policy if exists "Users see own entitlements" on public.user_entitlements;
create policy "Users see own entitlements"
  on public.user_entitlements for select
  using (auth.uid() = user_id);
