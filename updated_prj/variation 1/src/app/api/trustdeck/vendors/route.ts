import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requirePlatformOrg } from '@/lib/platform/org'
import { getVerifiedUser } from '@/lib/supabase/verified-user'
import { VENDOR_TYPES } from '@/lib/platform/constants'
import { scoreForTier, vendorRiskTier } from '@/lib/platform/vendors/risk'
import type { Vendor, VendorRiskTier, VendorType } from '@/types/dpdp'

const VALID_TYPES = VENDOR_TYPES.map(t => t.value) as readonly string[]
const VALID_TIERS: VendorRiskTier[] = ['low', 'medium', 'high', 'critical']
const VALID_DPA_STATUSES = ['pending', 'sent', 'signed', 'expired'] as const
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

async function getMembership(supabase: Awaited<ReturnType<typeof createClient>>) {
  const user = await getVerifiedUser(supabase)
  if (!user) return { error: 'Unauthorized', status: 401 as const }
  const ctx = await requirePlatformOrg(supabase, user.id)
  if (!ctx.ok) return { error: ctx.error, status: ctx.status }
  return { organizationId: ctx.organizationId }
}

// GET - list vendors with filter (dpa_status / risk_tier / vendor_type) + search + pagination.
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const m = await getMembership(supabase)
    if ('error' in m) return NextResponse.json({ error: m.error }, { status: m.status })

    const { searchParams } = new URL(req.url)
    const status     = searchParams.get('status')
    const riskTier   = searchParams.get('risk_tier')
    const vendorType = searchParams.get('vendor_type')
    const page       = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
    const limit      = Math.min(50, parseInt(searchParams.get('limit') ?? '20'))
    const search     = searchParams.get('search')?.trim()
    const from       = (page - 1) * limit

    let query = supabase
      .from('vendors')
      .select('*', { count: 'exact' })
      .eq('organization_id', m.organizationId)
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1)

    if (status && status !== 'all') query = query.eq('dpa_status', status)
    if (riskTier && riskTier !== 'all' && VALID_TIERS.includes(riskTier as VendorRiskTier)) {
      query = query.eq('risk_tier', riskTier)
    }
    if (vendorType && vendorType !== 'all' && VALID_TYPES.includes(vendorType)) {
      query = query.eq('vendor_type', vendorType)
    }
    if (search) query = query.ilike('name', `%${search}%`)

    const { data, count, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json({
      success: true,
      data: (data ?? []) as Vendor[],
      total: count ?? 0,
      page,
      limit,
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - create a vendor (manual add or "Add from library").
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const m = await getMembership(supabase)
    if ('error' in m) return NextResponse.json({ error: m.error }, { status: m.status })

    const body = (await req.json()) as {
      name?: string
      website?: string
      contact_name?: string
      contact_email?: string
      vendor_type?: string
      data_location?: unknown
      india_data_residency?: boolean
      personal_data_categories?: unknown
      risk_tier?: string
      risk_score?: number
      notes?: string
      dpa_status?: string
      dpa_signed_at?: string
      dpa_expires_at?: string
      dpa_document_url?: string
    }

    if (!body.name?.trim()) {
      return NextResponse.json({ error: 'Vendor name is required' }, { status: 400 })
    }
    if (!body.vendor_type || !VALID_TYPES.includes(body.vendor_type)) {
      return NextResponse.json({ error: 'A valid vendor_type is required' }, { status: 400 })
    }
    if (body.contact_email && !EMAIL_RE.test(body.contact_email.trim())) {
      return NextResponse.json({ error: 'contact_email is not a valid email' }, { status: 400 })
    }
    if (body.dpa_status && !VALID_DPA_STATUSES.includes(body.dpa_status as (typeof VALID_DPA_STATUSES)[number])) {
      return NextResponse.json({ error: 'Invalid dpa_status' }, { status: 400 })
    }

    const dataLocation = Array.isArray(body.data_location)
      ? body.data_location.filter((c): c is string => typeof c === 'string')
      : null
    const categories = Array.isArray(body.personal_data_categories)
      ? body.personal_data_categories.filter((c): c is string => typeof c === 'string')
      : null

    // If a library item supplies a risk_tier but no score, derive a representative one.
    let risk_tier: VendorRiskTier | null = null
    let risk_score: number | null = null
    if (typeof body.risk_score === 'number') {
      risk_score = Math.max(0, Math.min(100, Math.round(body.risk_score)))
      risk_tier = vendorRiskTier(risk_score)
    } else if (body.risk_tier && VALID_TIERS.includes(body.risk_tier as VendorRiskTier)) {
      risk_tier = body.risk_tier as VendorRiskTier
      risk_score = scoreForTier(risk_tier)
    }

    const { data: vendor, error } = await supabase
      .from('vendors')
      .insert({
        organization_id: m.organizationId,
        name: body.name.trim(),
        website: body.website?.trim() || null,
        contact_name: body.contact_name?.trim() || null,
        contact_email: body.contact_email?.trim().toLowerCase() || null,
        vendor_type: body.vendor_type as VendorType,
        data_location: dataLocation?.length ? dataLocation : null,
        india_data_residency: Boolean(body.india_data_residency),
        personal_data_categories: categories?.length ? categories : null,
        risk_tier,
        risk_score,
        dpa_status: (body.dpa_status as (typeof VALID_DPA_STATUSES)[number]) ?? 'pending',
        dpa_signed_at: body.dpa_signed_at || null,
        dpa_expires_at: body.dpa_expires_at || null,
        dpa_document_url: body.dpa_document_url?.trim() || null,
        notes: body.notes?.trim() || null,
      })
      .select()
      .single()

    if (error || !vendor) {
      return NextResponse.json({ error: error?.message ?? 'Failed to create vendor' }, { status: 400 })
    }

    return NextResponse.json({ success: true, data: vendor as Vendor })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
