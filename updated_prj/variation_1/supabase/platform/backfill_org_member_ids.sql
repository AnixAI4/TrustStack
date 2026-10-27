-- Backfill organization_id from org_id (fixes platform API lookups)
-- Safe to re-run.

update public.organization_members
set organization_id = org_id
where organization_id is null
  and org_id is not null;

update public.organization_members
set org_id = organization_id
where org_id is null
  and organization_id is not null;
