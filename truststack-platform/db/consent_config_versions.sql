-- ============================================================================
-- M2 audit upgrade: immutable consent config version snapshots
-- ----------------------------------------------------------------------------
-- Each time an org saves its consent config, a full snapshot of that version
-- (purposes + settings) is stored here. consent_records already carry
-- `config_version`, so you can reconstruct EXACTLY what a data principal agreed
-- to on a given date — the DPDP Section 6(5) "demonstrate consent" requirement.
--
-- Run this once in the Supabase SQL Editor.
-- ============================================================================

create table if not exists public.consent_config_versions (
  id                       uuid primary key default gen_random_uuid(),
  organization_id          uuid not null references public.organizations(id) on delete cascade,
  version                  text not null,
  purposes                 jsonb not null default '[]'::jsonb,
  languages                text[] not null default array['en'],
  position                 text not null default 'bottom-bar',
  primary_color            text not null default '003366',
  show_reject_all          boolean not null default true,
  require_age_confirmation boolean not null default false,
  whatsapp_enabled         boolean not null default false,
  created_at               timestamptz not null default now(),
  unique (organization_id, version)
);

create index if not exists idx_ccv_org_created
  on public.consent_config_versions (organization_id, created_at desc);

alter table public.consent_config_versions enable row level security;

-- Members can READ their org's snapshots (used by the Version History UI).
drop policy if exists "ccv_select_members" on public.consent_config_versions;
create policy "ccv_select_members" on public.consent_config_versions
  for select using (
    organization_id in (
      select organization_id from public.organization_members where user_id = auth.uid()
    )
  );

-- Members can INSERT snapshots for their org (the manage route writes on save).
drop policy if exists "ccv_insert_members" on public.consent_config_versions;
create policy "ccv_insert_members" on public.consent_config_versions
  for insert with check (
    organization_id in (
      select organization_id from public.organization_members where user_id = auth.uid()
    )
  );

-- NOTE: deliberately NO update/delete policies — snapshots are immutable for
-- non-service roles. Only the service_role key (server admin) could ever change them.

-- ----------------------------------------------------------------------------
-- Backfill: snapshot the CURRENT version for every org that already has a config.
-- (Earlier versions can't be reconstructed — their content was overwritten before
--  this table existed. From now on, every save is captured.)
-- ----------------------------------------------------------------------------
insert into public.consent_config_versions (
  organization_id, version, purposes, languages, position,
  primary_color, show_reject_all, require_age_confirmation, whatsapp_enabled, created_at
)
select
  c.organization_id,
  c.widget_version,
  coalesce((
    select jsonb_agg(
      jsonb_build_object(
        'purpose_key',    p.purpose_key,
        'name_en',        p.name_en,
        'name_hi',        p.name_hi,
        'name_ta',        p.name_ta,
        'name_te',        p.name_te,
        'description_en', p.description_en,
        'required',       p.required,
        'dpdp_basis',     p.dpdp_basis
      ) order by p.created_at
    )
    from public.consent_purposes p
    where p.organization_id = c.organization_id
  ), '[]'::jsonb),
  c.languages, c.position, c.primary_color,
  c.show_reject_all, c.require_age_confirmation, c.whatsapp_enabled,
  now()
from public.consent_configs c
on conflict (organization_id, version) do nothing;
