import type { SupabaseClient } from '@supabase/supabase-js'
import { resolvePilotTier } from '@/lib/security/pilot-gate'

export type PlatformOrg = {
  id: string
  name: string
  slug: string
  industry: string | null
  revenue_range: string | null
}

type MemberRow = {
  org_id?: string | null
  organization_id?: string | null
}

/**
 * Resolve the current user's platform organization.
 * Avoids PostgREST embeds - dual FKs (org_id + organization_id) make
 * `organizations(...)` embeds ambiguous and return null/error.
 */
export async function getUserPlatformOrg(
  supabase: SupabaseClient,
  userId: string
): Promise<PlatformOrg | null> {
  const { data: membership, error: memberError } = await supabase
    .from('organization_members')
    .select('org_id, organization_id')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle()

  if (memberError) {
    console.error('[platform] membership lookup failed:', memberError.message)
  }

  const orgId =
    (membership as MemberRow | null)?.organization_id ||
    (membership as MemberRow | null)?.org_id ||
    null

  if (!orgId) {
    const { data: owned } = await supabase
      .from('organizations')
      .select('id, name, slug, industry, revenue_range')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    return (owned as PlatformOrg | null) ?? null
  }

  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('id, name, slug, industry, revenue_range')
    .eq('id', orgId)
    .maybeSingle()

  if (orgError) {
    console.error('[platform] org lookup failed:', orgError.message)
  }

  return (org as PlatformOrg | null) ?? null
}

/** Resolve through the authenticated client so organization RLS always applies. */
export async function resolveUserPlatformOrg(
  supabase: SupabaseClient,
  userId: string
): Promise<PlatformOrg | null> {
  return getUserPlatformOrg(supabase, userId)
}

export type OrgContext =
  | { ok: true; organizationId: string; org: PlatformOrg }
  | { ok: false; error: string; status: 401 | 402 | 404 }

async function hasPilotAccess(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  return (await resolvePilotTier(supabase, userId)) === 'pilot'
}

/** Standard org resolution for platform API routes. */
export async function requirePlatformOrg(
  supabase: SupabaseClient,
  userId: string | null | undefined
): Promise<OrgContext> {
  if (!userId) return { ok: false, error: 'Unauthorized', status: 401 }
  const [hasPilot, org] = await Promise.all([
    hasPilotAccess(supabase, userId),
    resolveUserPlatformOrg(supabase, userId),
  ])
  if (!hasPilot) {
    return { ok: false, error: 'Pilot subscription required', status: 402 }
  }
  if (!org) return { ok: false, error: 'No organization found', status: 404 }
  return { ok: true, organizationId: org.id, org }
}
