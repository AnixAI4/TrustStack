-- Read-only TrustDeck database security verification.
-- Run in Supabase SQL Editor after 01_access_control.sql through
-- 04_database_hardening.sql. Any missing protection raises an exception.

do $$
declare
  expected_tables text[] := array[
    'organizations', 'organization_members', 'organization_invites',
    'assessments', 'assessment_answers', 'assessment_gaps',
    'consent_configs', 'consent_purposes', 'consent_records',
    'consent_config_versions', 'privacy_notices', 'privacy_notice_versions',
    'grievance_officers', 'grievance_complaints',
    'dsr_requests', 'dsr_nominations', 'dsr_otps',
    'ropa_entries', 'vendors', 'vendor_questionnaire_responses',
    'breach_incidents', 'user_sessions', 'payment_receipts'
  ];
  missing_rls text[];
  read_policy_count integer;
  manage_policy_count integer;
begin
  if has_function_privilege(
    'anon',
    'public.register_device(uuid,text,inet,text,integer)',
    'execute'
  ) then
    raise exception 'SECURITY FAIL: anon can execute register_device';
  end if;

  if has_function_privilege(
    'authenticated',
    'public.register_device(uuid,text,inet,text,integer)',
    'execute'
  ) then
    raise exception 'SECURITY FAIL: authenticated can execute register_device directly';
  end if;

  if not has_function_privilege(
    'authenticated',
    'public.is_device_active(uuid,text)',
    'execute'
  ) then
    raise exception 'SECURITY FAIL: authenticated cannot verify its device session';
  end if;

  if has_table_privilege('authenticated', 'public.organization_members', 'insert') then
    raise exception 'SECURITY FAIL: authenticated can insert organization membership';
  end if;

  if has_table_privilege('authenticated', 'public.organizations', 'insert') then
    raise exception 'SECURITY FAIL: authenticated can insert organizations directly';
  end if;

  if has_table_privilege('anon', 'public.consent_records', 'insert')
     or has_table_privilege('anon', 'public.grievance_complaints', 'insert')
     or has_table_privilege('anon', 'public.dsr_requests', 'insert') then
    raise exception 'SECURITY FAIL: anon can bypass a validated public submission route';
  end if;

  select array_agg(c.relname order by c.relname)
    into missing_rls
  from pg_catalog.pg_class c
  join pg_catalog.pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname = any(expected_tables)
    and (not c.relrowsecurity or not c.relforcerowsecurity);

  if coalesce(array_length(missing_rls, 1), 0) > 0 then
    raise exception 'SECURITY FAIL: RLS is not enabled and forced on %', missing_rls;
  end if;

  select count(*) into read_policy_count
  from pg_catalog.pg_policies
  where schemaname = 'public'
    and policyname = 'members read organization data';

  select count(*) into manage_policy_count
  from pg_catalog.pg_policies
  where schemaname = 'public'
    and policyname = 'operators manage organization data';

  if read_policy_count <> 13 or manage_policy_count <> 13 then
    raise exception
      'SECURITY FAIL: expected 13 read and 13 manage policies, found % and %',
      read_policy_count,
      manage_policy_count;
  end if;

  if not exists (
    select 1 from pg_catalog.pg_policies
    where schemaname = 'public'
      and tablename = 'organizations'
      and policyname = 'admins update own orgs'
      and cmd = 'UPDATE'
  ) then
    raise exception 'SECURITY FAIL: admin-only organization update policy is missing';
  end if;

  if exists (
    select 1 from pg_catalog.pg_policies
    where schemaname = 'public'
      and policyname in (
        'users can insert own membership',
        'public can insert consent_records',
        'public can submit grievance',
        'public can submit dsr'
      )
  ) then
    raise exception 'SECURITY FAIL: a legacy unsafe policy still exists';
  end if;
end $$;

select
  'PASS' as status,
  'TrustDeck function grants, role policies, forced RLS, and public writes are hardened.' as result;
