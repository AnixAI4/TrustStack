import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

function source(path: string): string {
  return readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
}

test('core bootstrap never permits self-service organization membership', () => {
  const core = source('supabase/platform/00_core.sql')
  const access = source('supabase/platform/01_access_control.sql')

  assert.doesNotMatch(core, /create policy "users can insert own membership"/)
  assert.doesNotMatch(core, /create policy "authenticated users can create org"/)
  assert.match(access, /drop policy if exists "users can insert own membership"/)
  assert.match(
    access,
    /revoke insert, update on public\.organization_members from public, anon, authenticated;/
  )
  assert.match(access, /create policy "admins update own orgs"/)
})

test('device registry functions are not executable through PUBLIC', () => {
  const migration = source('supabase/platform/02_session_registry.sql')

  assert.match(
    migration,
    /revoke execute on function public\.register_device\([^)]+\) from public, anon, authenticated;/
  )
  assert.match(
    migration,
    /grant execute on function public\.register_device\([^)]+\) to service_role;/
  )
  assert.match(
    migration,
    /revoke execute on function public\.is_device_active\([^)]+\) from public, anon, authenticated;/
  )
  assert.equal((migration.match(/set search_path = ''/g) ?? []).length, 2)
})

test('hardening migration restricts helper functions to the current identity', () => {
  const migration = source('supabase/platform/04_database_hardening.sql')

  assert.match(migration, /auth\.role\(\) = 'service_role' or p_user_id = auth\.uid\(\)/)
  assert.match(migration, /m\.role in \('owner', 'admin', 'member', 'dpo'\)/)
  assert.match(
    migration,
    /revoke execute on function public\.can_manage_org_data\(uuid, uuid\) from public, anon, authenticated;/
  )
  assert.equal((migration.match(/set search_path = ''/g) ?? []).length, 3)
})

test('hardening migration separates member reads from operator writes', () => {
  const migration = source('supabase/platform/04_database_hardening.sql')

  assert.match(migration, /create policy "members read organization data"/)
  assert.match(migration, /create policy "operators manage organization data"/)
  assert.match(migration, /public\.can_manage_org_data\(auth\.uid\(\), organization_id\)/)
  assert.match(migration, /create policy "admins update own orgs"/)
  assert.match(migration, /execute format\('alter table public\.%I force row level security'/)
  assert.match(migration, /'payment_receipts'/)
})

test('public evidence submissions cannot bypass validated server routes', () => {
  const migration = source('supabase/platform/04_database_hardening.sql')

  for (const policy of [
    'public can insert consent_records',
    'public can submit grievance',
    'public can submit dsr',
  ]) {
    assert.match(migration, new RegExp(`drop policy if exists "${policy}"`))
  }
  assert.match(migration, /revoke insert on public\.consent_records from anon;/)
  assert.match(migration, /revoke insert on public\.grievance_complaints from anon;/)
  assert.match(migration, /revoke insert on public\.dsr_requests from anon;/)
})

test('deployment guide requires the complete security migration sequence', () => {
  const readme = source('supabase/platform/README.md')

  for (const file of [
    '01_access_control.sql',
    '02_session_registry.sql',
    '03_payment_receipts.sql',
    '04_database_hardening.sql',
  ]) {
    assert.match(readme, new RegExp(file.replace('.', '\\.')))
  }
  assert.match(readme, /four numbered security migrations are mandatory/i)
  assert.match(readme, /verify_security\.sql/)
  assert.match(readme, /ENFORCE_DEVICE_SESSIONS=1/)
})

test('live database verifier checks grants, policies, writes, and forced RLS', () => {
  const verifier = source('supabase/platform/verify_security.sql')

  assert.match(verifier, /has_function_privilege/)
  assert.match(verifier, /has_table_privilege/)
  assert.match(verifier, /pg_catalog\.pg_policies/)
  assert.match(verifier, /not c\.relrowsecurity or not c\.relforcerowsecurity/)
  assert.match(verifier, /SECURITY FAIL/)
  assert.match(verifier, /'PASS' as status/)
})

test('authenticated TrustDeck paths never hide RLS failures with service-role', () => {
  const assessment = source('src/app/api/trustdeck/assessment/start/route.ts')
  const organization = source('src/lib/platform/org.ts')
  const grievance = source('src/app/api/trustdeck/grievance/submit/route.ts')

  assert.doesNotMatch(assessment, /createAdminClient/)
  assert.doesNotMatch(organization, /createAdminClient/)
  assert.match(grievance, /createAdminClient/)
  assert.doesNotMatch(grievance, /createClient.*supabase\/server/)
})

test('public-link tokens have no known or AI-key signing fallback', () => {
  const helper = source('src/lib/platform/security/token-secret.ts')
  const boardToken = source('src/lib/platform/dashboard/share-token.ts')
  const vendorToken = source('src/lib/platform/vendors/token.ts')

  assert.doesNotMatch(`${helper}${boardToken}${vendorToken}`, /truststack-dev-secret/)
  assert.doesNotMatch(helper, /ANTHROPIC_API_KEY/)
  assert.match(helper, /MIN_TOKEN_SECRET_BYTES = 32/)
  assert.match(source('.env.example'), /TRUSTDECK_TOKEN_SECRET=/)
})
