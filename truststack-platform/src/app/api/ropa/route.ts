import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { DPDP_BASES, DATA_CATEGORIES, ROPA_SUBJECT_TYPES } from '@/lib/constants'
import { buildCoverageMap } from '@/lib/ropa/consent'
import type { RopaEntry, RopaStatus, ConsentPurpose } from '@/types/dpdp'

const VALID_BASES = new Set<string>(DPDP_BASES.map(b => b.id))
const VALID_CATEGORIES = new Set<string>(DATA_CATEGORIES.map(c => c.key))
const VALID_SUBJECTS = new Set<string>(ROPA_SUBJECT_TYPES.map(s => s.value))
const VALID_STATUSES: RopaStatus[] = ['draft', 'active', 'archived']

async function getMembership(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized', status: 401 as const }
  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single()
  if (!membership) return { error: 'No organization found', status: 404 as const }
  return { organizationId: membership.organization_id as string, userId: user.id }
}

// Keep only valid string members of an allowed set (or any string if no set).
function cleanArray(v: unknown, allowed?: Set<string>): string[] {
  if (!Array.isArray(v)) return []
  const out: string[] = []
  const seen = new Set<string>()
  for (const item of v) {
    if (typeof item !== 'string') continue
    const s = item.trim()
    if (!s) continue
    if (allowed && !allowed.has(s)) continue
    if (seen.has(s.toLowerCase())) continue
    seen.add(s.toLowerCase())
    out.push(s.slice(0, 500))
  }
  return out
}

// Load the org's consent purposes (M2) for the read-time cross-reference.
// Degrades to [] so the list never 500s if consent isn't configured.
async function loadConsentPurposes(
  supabase: Awaited<ReturnType<typeof createClient>>,
  organizationId: string,
): Promise<Pick<ConsentPurpose, 'name_en' | 'description_en' | 'purpose_key'>[]> {
  const { data } = await supabase
    .from('consent_purposes')
    .select('name_en, description_en, purpose_key')
    .eq('organization_id', organizationId)
  return (data ?? []) as Pick<ConsentPurpose, 'name_en' | 'description_en' | 'purpose_key'>[]
}

// GET — list ROPA entries with filter (status / subject_type) + search + pagination.
// Also returns a coverage map (entryId → ROPA↔Consent cross-reference) for the page.
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const m = await getMembership(supabase)
    if ('error' in m) return NextResponse.json({ error: m.error }, { status: m.status })

    const { searchParams } = new URL(req.url)
    const status      = searchParams.get('status')
    const subjectType = searchParams.get('subject_type')
    const page        = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
    const limit       = Math.min(50, parseInt(searchParams.get('limit') ?? '20'))
    const search      = searchParams.get('search')?.trim()
    const from        = (page - 1) * limit

    let query = supabase
      .from('ropa_entries')
      .select('*', { count: 'exact' })
      .eq('organization_id', m.organizationId)
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1)

    if (status && status !== 'all' && VALID_STATUSES.includes(status as RopaStatus)) {
      query = query.eq('status', status)
    }
    if (subjectType && subjectType !== 'all' && VALID_SUBJECTS.has(subjectType)) {
      query = query.contains('data_subject_types', [subjectType])
    }
    if (search) query = query.ilike('activity_name', `%${search}%`)

    const { data, count, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    const entries = (data ?? []) as RopaEntry[]
    const purposes = await loadConsentPurposes(supabase, m.organizationId)
    const coverage = buildCoverageMap(entries, purposes)

    return NextResponse.json({
      success: true,
      data: entries,
      coverage,
      total: count ?? 0,
      page,
      limit,
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST — create a ROPA entry (manual add or "Add from template"). Always starts
// as a draft, unapproved; created_by is captured SERVER-SIDE.
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const m = await getMembership(supabase)
    if ('error' in m) return NextResponse.json({ error: m.error }, { status: m.status })

    const body = (await req.json()) as Record<string, unknown>

    const activityName = typeof body.activity_name === 'string' ? body.activity_name.trim() : ''
    if (!activityName) {
      return NextResponse.json({ error: 'Activity name is required' }, { status: 400 })
    }

    const legalBasis = typeof body.legal_basis === 'string' ? body.legal_basis : ''
    if (!legalBasis || !VALID_BASES.has(legalBasis)) {
      return NextResponse.json({ error: 'A valid legal_basis is required' }, { status: 400 })
    }

    // Default the controller to the org name if the caller didn't supply one
    // (templates don't carry a controller).
    let controller = typeof body.data_controller_name === 'string' ? body.data_controller_name.trim() : ''
    if (!controller) {
      const { data: org } = await supabase
        .from('organizations')
        .select('name')
        .eq('id', m.organizationId)
        .single()
      controller = org?.name?.trim() || 'Our Organization'
    }

    const dataSources       = cleanArray(body.data_sources)
    const recipients        = cleanArray(body.recipients)
    const transferCountries = cleanArray(body.transfer_countries)
    const securityMeasures  = cleanArray(body.security_measures)
    const processorNames    = cleanArray(body.processor_names)

    const { data: entry, error } = await supabase
      .from('ropa_entries')
      .insert({
        organization_id:       m.organizationId,
        activity_name:         activityName.slice(0, 200),
        activity_description:  typeof body.activity_description === 'string' ? body.activity_description.trim().slice(0, 2000) || null : null,
        data_controller_name:  controller.slice(0, 200),
        data_categories:       cleanArray(body.data_categories, VALID_CATEGORIES),
        data_subject_types:    cleanArray(body.data_subject_types, VALID_SUBJECTS),
        processing_purposes:   cleanArray(body.processing_purposes),
        legal_basis:           legalBasis,
        data_sources:          dataSources.length ? dataSources : null,
        recipients:            recipients.length ? recipients : null,
        cross_border_transfer: Boolean(body.cross_border_transfer),
        transfer_countries:    transferCountries.length ? transferCountries : null,
        retention_period:      typeof body.retention_period === 'string' ? body.retention_period.trim().slice(0, 300) || null : null,
        security_measures:     securityMeasures.length ? securityMeasures : null,
        processor_names:       processorNames.length ? processorNames : null,
        status:                'draft',
        dpo_approved:          false,
        created_by:            m.userId,
      })
      .select()
      .single()

    if (error || !entry) {
      return NextResponse.json({ error: error?.message ?? 'Failed to create ROPA entry' }, { status: 400 })
    }

    return NextResponse.json({ success: true, data: entry as RopaEntry })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
