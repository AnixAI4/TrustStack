-- One-time Razorpay receipt ledger. Run in Supabase SQL Editor.
-- Confirm routes fail closed until this table exists.

create table if not exists public.payment_receipts (
  id uuid primary key default gen_random_uuid(),
  razorpay_payment_id text not null unique,
  razorpay_order_id text not null unique,
  user_id uuid not null references auth.users(id) on delete restrict,
  purpose text not null check (purpose in ('pilot_subscription', 'extra_scan', 'template')),
  amount_paise integer not null check (amount_paise > 0),
  currency text not null default 'INR' check (currency = 'INR'),
  metadata jsonb not null default '{}'::jsonb,
  status text not null default 'processing'
    check (status in ('processing', 'fulfilled', 'failed')),
  failure_reason text,
  created_at timestamptz not null default now(),
  fulfilled_at timestamptz
);

create index if not exists payment_receipts_user_idx
  on public.payment_receipts (user_id, created_at desc);

alter table public.payment_receipts enable row level security;

-- No browser policies: payment claims and fulfillment are service-role only.
revoke all on public.payment_receipts from public, anon, authenticated;
