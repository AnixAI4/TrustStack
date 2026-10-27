-- ============================================================================
-- TrustStack Platform - CORE schema (compatible with existing TrustStack orgs)
-- ----------------------------------------------------------------------------
-- Your DB already has organizations + organization_members using `org_id`.
-- This script:
--   1) Extends those tables for the platform (does NOT recreate them)
--   2) Adds `organization_id` as an alias of `org_id` (kept in sync)
--   3) Creates assessment / consent / grievance tables
--
-- Run this in the Supabase SQL Editor. Idempotent - safe to re-run.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 0) Helper: detect whether a column exists
-- ---------------------------------------------------------------------------
-- (inlined checks below via information_schema)

-- ---------------------------------------------------------------------------
-- 1) Extend organizations (existing table uses owner_id; platform adds fields)
-- ---------------------------------------------------------------------------
alter table public.organizations
  add column if not exists cin text,
  add column if not exists gstin text,
  add column if not exists registered_state text,
  add column if not exists industry text,
  add column if not exists employee_count_range text,
  add column if not exists revenue_range text,
  add column if not exists logo_url text,
  add column if not exists updated_at timestamptz default now();

-- owner_id is NOT NULL on the existing TrustStack schema. Platform creates
-- may omit it - make it nullable so both flows work. Existing rows keep values.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'organizations' and column_name = 'owner_id'
  ) then
    alter table public.organizations alter column owner_id drop not null;
  end if;
exception when others then
  -- ignore if already nullable / no permission edge cases
  null;
end $$;

-- ---------------------------------------------------------------------------
-- 2) Bridge org_id ↔ organization_id on organization_members
-- ---------------------------------------------------------------------------
-- Existing TrustStack code uses org_id.
-- Platform code uses organization_id.
-- Keep BOTH columns populated and in sync.

alter table public.organization_members
  add column if not exists organization_id uuid;

-- Backfill from org_id if that column exists
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'organization_members' and column_name = 'org_id'
  ) then
    update public.organization_members
      set organization_id = org_id
      where organization_id is null and org_id is not null;
  end if;
end $$;

-- If somehow only organization_id was set, ensure org_id exists + backfill
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'organization_members' and column_name = 'org_id'
  ) then
    alter table public.organization_members
      add column org_id uuid references public.organizations(id) on delete cascade;
  end if;

  update public.organization_members
    set org_id = organization_id
    where org_id is null and organization_id is not null;
end $$;

-- FK for organization_id (safe if already present)
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'organization_members_organization_id_fkey'
  ) then
    alter table public.organization_members
      add constraint organization_members_organization_id_fkey
      foreign key (organization_id) references public.organizations(id) on delete cascade;
  end if;
exception when others then
  null;
end $$;

create index if not exists idx_org_members_organization_id
  on public.organization_members (organization_id);
create index if not exists idx_org_members_user
  on public.organization_members (user_id);

-- Keep org_id and organization_id mirrored on insert/update
create or replace function public.sync_org_member_ids()
returns trigger
language plpgsql
as $$
begin
  if new.organization_id is null and new.org_id is not null then
    new.organization_id := new.org_id;
  end if;
  if new.org_id is null and new.organization_id is not null then
    new.org_id := new.organization_id;
  end if;
  if new.org_id is not null and new.organization_id is not null
     and new.org_id is distinct from new.organization_id then
    -- Prefer the non-null newest write: if both set differently, align to organization_id
    new.org_id := new.organization_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_sync_org_member_ids on public.organization_members;
create trigger trg_sync_org_member_ids
  before insert or update on public.organization_members
  for each row execute function public.sync_org_member_ids();

-- Relax role check so platform roles (admin/dpo/viewer/board) are allowed
-- alongside existing owner/admin/member
do $$
declare
  c record;
begin
  for c in
    select conname
    from pg_constraint
    where conrelid = 'public.organization_members'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%role%'
  loop
    execute format('alter table public.organization_members drop constraint %I', c.conname);
  end loop;
exception when others then
  null;
end $$;

alter table public.organization_members
  drop constraint if exists organization_members_role_check;

alter table public.organization_members
  add constraint organization_members_role_check
  check (role in ('owner', 'admin', 'member', 'dpo', 'viewer', 'board'));

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;

-- CRITICAL: do NOT query organization_members from a policy ON organization_members
drop policy if exists "members can read membership" on public.organization_members;
create policy "members can read membership" on public.organization_members
  for select using (user_id = auth.uid());

drop policy if exists "users can insert own membership" on public.organization_members;
-- No client insert policy. Membership is created only by trusted organization
-- creation and invite-acceptance routes using the service role.

drop policy if exists "authenticated users can create org" on public.organizations;
-- No client insert policy. Organization creation is a server-only operation.

drop policy if exists "members can read own orgs" on public.organizations;
create policy "members can read own orgs" on public.organizations
  for select using (
    id in (
      select coalesce(om.organization_id, om.org_id)
      from public.organization_members om
      where om.user_id = auth.uid()
    )
  );

drop policy if exists "members can update own orgs" on public.organizations;
-- 01_access_control.sql adds an owner/admin-only update policy.

-- ---------------------------------------------------------------------------
-- 3) M1: Assessments
-- ---------------------------------------------------------------------------
create table if not exists public.assessments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  created_by uuid references auth.users(id),
  status text not null default 'in_progress',
  compass_score integer,
  maturity_level integer,
  risk_tier text,
  completed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.assessment_answers (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid references public.assessments(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete cascade,
  question_id text not null,
  section text not null,
  answer text not null,
  created_at timestamptz default now(),
  constraint assessment_answers_assessment_question_unique unique (assessment_id, question_id)
);

create table if not exists public.assessment_gaps (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid references public.assessments(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete cascade,
  question_id text not null,
  gap_description text not null,
  priority text not null,
  dpdp_section text,
  recommended_action text not null,
  module_to_fix text,
  resolved boolean default false,
  resolved_at timestamptz,
  created_at timestamptz default now()
);

alter table public.assessments enable row level security;
alter table public.assessment_answers enable row level security;
alter table public.assessment_gaps enable row level security;

drop policy if exists "org members manage assessments" on public.assessments;
drop policy if exists "users manage own assessments" on public.assessments;
create policy "users manage own assessments" on public.assessments
  for all using (
    created_by = auth.uid()
    and organization_id in (
      select coalesce(om.organization_id, om.org_id)
      from public.organization_members om
      where om.user_id = auth.uid()
    )
  ) with check (
    created_by = auth.uid()
    and organization_id in (
      select coalesce(om.organization_id, om.org_id)
      from public.organization_members om
      where om.user_id = auth.uid()
    )
  );

drop policy if exists "org members manage assessment_answers" on public.assessment_answers;
drop policy if exists "users manage own assessment_answers" on public.assessment_answers;
create policy "users manage own assessment_answers" on public.assessment_answers
  for all using (
    exists (
      select 1
      from public.assessments a
      where a.id = assessment_answers.assessment_id
        and a.organization_id = assessment_answers.organization_id
        and a.created_by = auth.uid()
    )
  ) with check (
    exists (
      select 1
      from public.assessments a
      where a.id = assessment_answers.assessment_id
        and a.organization_id = assessment_answers.organization_id
        and a.created_by = auth.uid()
    )
  );

drop policy if exists "org members manage assessment_gaps" on public.assessment_gaps;
drop policy if exists "users manage own assessment_gaps" on public.assessment_gaps;
create policy "users manage own assessment_gaps" on public.assessment_gaps
  for all using (
    exists (
      select 1
      from public.assessments a
      where a.id = assessment_gaps.assessment_id
        and a.organization_id = assessment_gaps.organization_id
        and a.created_by = auth.uid()
    )
  ) with check (
    exists (
      select 1
      from public.assessments a
      where a.id = assessment_gaps.assessment_id
        and a.organization_id = assessment_gaps.organization_id
        and a.created_by = auth.uid()
    )
  );

create index if not exists idx_assessments_org on public.assessments (organization_id, created_at desc);
create index if not exists idx_assessments_owner on public.assessments (created_by, created_at desc);
create index if not exists idx_assessment_answers_assessment on public.assessment_answers (assessment_id);
create index if not exists idx_assessment_gaps_assessment on public.assessment_gaps (assessment_id);

-- ---------------------------------------------------------------------------
-- 4) M2: Consent
-- ---------------------------------------------------------------------------
create table if not exists public.consent_configs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  widget_version text not null default '1',
  purposes jsonb not null default '[]',
  languages text[] not null default '{en}',
  position text not null default 'bottom-bar',
  primary_color text not null default '003366',
  show_reject_all boolean not null default true,
  require_age_confirmation boolean not null default false,
  whatsapp_enabled boolean not null default false,
  whatsapp_template_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.consent_purposes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  purpose_key text not null,
  name_en text not null,
  name_hi text,
  name_ta text,
  name_te text,
  description_en text not null,
  required boolean not null default false,
  dpdp_basis text,
  created_at timestamptz default now(),
  unique(organization_id, purpose_key)
);

create table if not exists public.consent_records (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  config_version text not null,
  data_principal_hash text not null,
  channel text not null,
  purposes_accepted text[] not null default '{}',
  purposes_rejected text[] not null default '{}',
  language text not null default 'en',
  user_agent text,
  ip_hash text,
  withdrawn boolean not null default false,
  withdrawn_at timestamptz,
  created_at timestamptz default now()
);

alter table public.consent_configs enable row level security;
alter table public.consent_purposes enable row level security;
alter table public.consent_records enable row level security;

drop policy if exists "org members manage consent_configs" on public.consent_configs;
create policy "org members manage consent_configs" on public.consent_configs
  for all using (
    organization_id in (
      select coalesce(om.organization_id, om.org_id)
      from public.organization_members om
      where om.user_id = auth.uid()
    )
  );

drop policy if exists "org members manage consent_purposes" on public.consent_purposes;
create policy "org members manage consent_purposes" on public.consent_purposes
  for all using (
    organization_id in (
      select coalesce(om.organization_id, om.org_id)
      from public.organization_members om
      where om.user_id = auth.uid()
    )
  );

drop policy if exists "org members manage consent_records" on public.consent_records;
create policy "org members manage consent_records" on public.consent_records
  for all using (
    organization_id in (
      select coalesce(om.organization_id, om.org_id)
      from public.organization_members om
      where om.user_id = auth.uid()
    )
  );

drop policy if exists "public can insert consent_records" on public.consent_records;
create policy "public can insert consent_records" on public.consent_records
  for insert with check (true);

-- ---------------------------------------------------------------------------
-- 5) M4: Grievance
-- ---------------------------------------------------------------------------
create table if not exists public.grievance_officers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  name text not null,
  designation text not null,
  email text not null,
  phone text,
  active boolean not null default true,
  appointed_at timestamptz not null default now(),
  created_at timestamptz default now()
);

create table if not exists public.grievance_complaints (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  reference_number text not null,
  complainant_name text not null,
  complainant_email text,
  complainant_phone text,
  complaint_type text not null,
  description text not null,
  attachment_url text,
  language text not null default 'en',
  status text not null default 'new',
  assigned_to uuid references auth.users(id),
  resolution_notes text,
  resolved_at timestamptz,
  escalated_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index if not exists grievance_complaints_org_reference_uniq
  on public.grievance_complaints (organization_id, reference_number);

alter table public.grievance_officers enable row level security;
alter table public.grievance_complaints enable row level security;

drop policy if exists "org members manage grievance_officers" on public.grievance_officers;
create policy "org members manage grievance_officers" on public.grievance_officers
  for all using (
    organization_id in (
      select coalesce(om.organization_id, om.org_id)
      from public.organization_members om
      where om.user_id = auth.uid()
    )
  );

drop policy if exists "org members manage grievance_complaints" on public.grievance_complaints;
create policy "org members manage grievance_complaints" on public.grievance_complaints
  for all using (
    organization_id in (
      select coalesce(om.organization_id, om.org_id)
      from public.organization_members om
      where om.user_id = auth.uid()
    )
  );

drop policy if exists "public can submit grievance" on public.grievance_complaints;
create policy "public can submit grievance" on public.grievance_complaints
  for insert with check (true);

drop policy if exists "public can read active officers" on public.grievance_officers;
create policy "public can read active officers" on public.grievance_officers
  for select using (active = true);
