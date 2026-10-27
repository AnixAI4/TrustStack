-- TrustDeck database hardening: function privileges, role-aware RLS, and
-- validated server-only public submissions.
--
-- Apply after 00_core.sql through 03_payment_receipts.sql and all module SQL.
-- Safe to re-run.

-- ---------------------------------------------------------------------------
-- 1) SECURITY DEFINER helpers must not trust caller-supplied user ids.
-- ---------------------------------------------------------------------------
create or replace function public.user_org_ids(p_user_id uuid)
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select distinct coalesce(m.organization_id, m.org_id)
  from public.organization_members m
  where (auth.role() = 'service_role' or p_user_id = auth.uid())
    and m.user_id = p_user_id
    and coalesce(m.organization_id, m.org_id) is not null;
$$;

create or replace function public.is_org_admin(p_user_id uuid, p_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    (auth.role() = 'service_role' or p_user_id = auth.uid())
    and exists (
      select 1
      from public.organization_members m
      where m.user_id = p_user_id
        and coalesce(m.organization_id, m.org_id) = p_org_id
        and m.role in ('owner', 'admin')
    );
$$;

create or replace function public.can_manage_org_data(p_user_id uuid, p_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    (auth.role() = 'service_role' or p_user_id = auth.uid())
    and exists (
      select 1
      from public.organization_members m
      where m.user_id = p_user_id
        and coalesce(m.organization_id, m.org_id) = p_org_id
        and m.role in ('owner', 'admin', 'member', 'dpo')
    );
$$;

-- Functions receive EXECUTE for PUBLIC by default in PostgreSQL. Always revoke
-- PUBLIC before granting only the roles that need each function.
revoke execute on function public.user_org_ids(uuid) from public, anon, authenticated;
revoke execute on function public.is_org_admin(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.can_manage_org_data(uuid, uuid) from public, anon, authenticated;
grant execute on function public.user_org_ids(uuid) to authenticated, service_role;
grant execute on function public.is_org_admin(uuid, uuid) to authenticated, service_role;
grant execute on function public.can_manage_org_data(uuid, uuid) to authenticated, service_role;

alter function public.create_organization_invite(uuid, text, text, text, uuid) set search_path to '';
alter function public.accept_organization_invite(text, uuid, text) set search_path to '';
alter function public.register_device(uuid, text, inet, text, integer) set search_path to '';
alter function public.is_device_active(uuid, text) set search_path to '';

revoke execute on function public.create_organization_invite(uuid, text, text, text, uuid) from public, anon, authenticated;
revoke execute on function public.accept_organization_invite(text, uuid, text) from public, anon, authenticated;
revoke execute on function public.register_device(uuid, text, inet, text, integer) from public, anon, authenticated;
revoke execute on function public.is_device_active(uuid, text) from public, anon, authenticated;
grant execute on function public.create_organization_invite(uuid, text, text, text, uuid) to service_role;
grant execute on function public.accept_organization_invite(text, uuid, text) to service_role;
grant execute on function public.register_device(uuid, text, inet, text, integer) to service_role;
grant execute on function public.is_device_active(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 2) Membership and workspace administration.
-- ---------------------------------------------------------------------------
revoke insert, update on public.organization_members from public, anon, authenticated;
revoke insert on public.organizations from public, anon, authenticated;

drop policy if exists "users can insert own membership" on public.organization_members;
drop policy if exists "users can insert their membership" on public.organization_members;
drop policy if exists "users can join orgs" on public.organization_members;
drop policy if exists "authenticated users can join" on public.organization_members;
drop policy if exists "org members insert" on public.organization_members;
drop policy if exists "members insert self" on public.organization_members;
drop policy if exists "authenticated users can create org" on public.organizations;

drop policy if exists "members can update own orgs" on public.organizations;
drop policy if exists "admins update own orgs" on public.organizations;
create policy "admins update own orgs" on public.organizations
  for update to authenticated
  using (public.is_org_admin(auth.uid(), id))
  with check (public.is_org_admin(auth.uid(), id));

-- ---------------------------------------------------------------------------
-- 3) Assessments remain private to their creator, and read-only roles cannot
-- create them or mutate their answers/gaps.
-- ---------------------------------------------------------------------------
drop policy if exists "org members manage assessments" on public.assessments;
drop policy if exists "users manage own assessments" on public.assessments;
create policy "operators manage own assessments" on public.assessments
  for all to authenticated
  using (
    created_by = auth.uid()
    and public.can_manage_org_data(auth.uid(), organization_id)
  )
  with check (
    created_by = auth.uid()
    and public.can_manage_org_data(auth.uid(), organization_id)
  );

drop policy if exists "org members manage assessment_answers" on public.assessment_answers;
drop policy if exists "users manage own assessment_answers" on public.assessment_answers;
create policy "operators manage own assessment answers" on public.assessment_answers
  for all to authenticated
  using (
    public.can_manage_org_data(auth.uid(), organization_id)
    and exists (
      select 1 from public.assessments a
      where a.id = assessment_answers.assessment_id
        and a.organization_id = assessment_answers.organization_id
        and a.created_by = auth.uid()
    )
  )
  with check (
    public.can_manage_org_data(auth.uid(), organization_id)
    and exists (
      select 1 from public.assessments a
      where a.id = assessment_answers.assessment_id
        and a.organization_id = assessment_answers.organization_id
        and a.created_by = auth.uid()
    )
  );

drop policy if exists "org members manage assessment_gaps" on public.assessment_gaps;
drop policy if exists "users manage own assessment_gaps" on public.assessment_gaps;
create policy "operators manage own assessment gaps" on public.assessment_gaps
  for all to authenticated
  using (
    public.can_manage_org_data(auth.uid(), organization_id)
    and exists (
      select 1 from public.assessments a
      where a.id = assessment_gaps.assessment_id
        and a.organization_id = assessment_gaps.organization_id
        and a.created_by = auth.uid()
    )
  )
  with check (
    public.can_manage_org_data(auth.uid(), organization_id)
    and exists (
      select 1 from public.assessments a
      where a.id = assessment_gaps.assessment_id
        and a.organization_id = assessment_gaps.organization_id
        and a.created_by = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- 4) Organization data: all members can read, only operational roles can write.
-- viewer and board are deliberately read-only at the database boundary.
-- ---------------------------------------------------------------------------
do $$
declare
  item record;
begin
  for item in
    select * from (values
      ('consent_configs', 'org members manage consent_configs'),
      ('consent_purposes', 'org members manage consent_purposes'),
      ('consent_records', 'org members manage consent_records'),
      ('grievance_officers', 'org members manage grievance_officers'),
      ('grievance_complaints', 'org members manage grievance_complaints'),
      ('privacy_notices', 'org members manage privacy_notices'),
      ('privacy_notice_versions', 'org members manage notice_versions'),
      ('dsr_requests', 'org members manage dsr_requests'),
      ('dsr_nominations', 'org members manage nominations'),
      ('ropa_entries', 'org members manage ropa'),
      ('vendors', 'org members manage vendors'),
      ('vendor_questionnaire_responses', 'org members manage vendor questionnaires'),
      ('breach_incidents', 'org members manage breaches')
    ) as policies(table_name, legacy_policy)
  loop
    execute format('drop policy if exists %I on public.%I', item.legacy_policy, item.table_name);
    execute format('drop policy if exists "members read organization data" on public.%I', item.table_name);
    execute format('drop policy if exists "operators manage organization data" on public.%I', item.table_name);
    execute format(
      'create policy "members read organization data" on public.%I for select to authenticated using (organization_id in (select public.user_org_ids(auth.uid())))',
      item.table_name
    );
    execute format(
      'create policy "operators manage organization data" on public.%I for all to authenticated using (public.can_manage_org_data(auth.uid(), organization_id)) with check (public.can_manage_org_data(auth.uid(), organization_id))',
      item.table_name
    );
  end loop;
end $$;

-- Consent snapshots are immutable: members read, operators may only append.
drop policy if exists "ccv_select_members" on public.consent_config_versions;
drop policy if exists "ccv_insert_members" on public.consent_config_versions;
drop policy if exists "members read consent snapshots" on public.consent_config_versions;
drop policy if exists "operators create consent snapshots" on public.consent_config_versions;
create policy "members read consent snapshots" on public.consent_config_versions
  for select to authenticated
  using (organization_id in (select public.user_org_ids(auth.uid())));
create policy "operators create consent snapshots" on public.consent_config_versions
  for insert to authenticated
  with check (public.can_manage_org_data(auth.uid(), organization_id));

-- Public submissions now go through validated server endpoints using the
-- service role. Remove direct table writes that bypass API validation.
drop policy if exists "public can insert consent_records" on public.consent_records;
drop policy if exists "public can submit grievance" on public.grievance_complaints;
drop policy if exists "public can submit dsr" on public.dsr_requests;
revoke insert on public.consent_records from anon;
revoke insert on public.grievance_complaints from anon;
revoke insert on public.dsr_requests from anon;

-- ---------------------------------------------------------------------------
-- 5) Force RLS and close sensitive supporting objects explicitly.
-- Roles with BYPASSRLS (the Supabase service role) remain available to trusted
-- server routes, while table owners cannot accidentally bypass policies.
-- ---------------------------------------------------------------------------
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'organizations', 'organization_members', 'organization_invites',
    'assessments', 'assessment_answers', 'assessment_gaps',
    'consent_configs', 'consent_purposes', 'consent_records',
    'consent_config_versions', 'privacy_notices', 'privacy_notice_versions',
    'grievance_officers', 'grievance_complaints',
    'dsr_requests', 'dsr_nominations', 'dsr_otps',
    'ropa_entries', 'vendors', 'vendor_questionnaire_responses',
    'breach_incidents', 'user_sessions', 'payment_receipts'
  ]
  loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('alter table public.%I force row level security', table_name);
  end loop;
end $$;

revoke all on public.dsr_otps from public, anon, authenticated;
revoke all on public.payment_receipts from public, anon, authenticated;
revoke all on public.user_session_daily_ips from public, anon, authenticated;
