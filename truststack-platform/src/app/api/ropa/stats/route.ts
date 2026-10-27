import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { computeConsentCoverage, CONSENT_LEGAL_BASIS } from '@/lib/ropa/consent'
import type { RopaStats, RopaEntry, ConsentPurpose } from '@/types/dpdp'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: membership } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single()

    if (!membership) return NextResponse.json({ error: 'No organization found' }, { status: 404 })

    const [{ data, error }, { data: purposes }] = await Promise.all([
      supabase
        .from('ropa_entries')
        .select('status, dpo_approved, cross_border_transfer, legal_basis, processing_purposes, data_categories, activity_name')
        .eq('organization_id', membership.organization_id),
      supabase
        .from('consent_purposes')
        .select('name_en, description_en, purpose_key')
        .eq('organization_id', membership.organization_id),
    ])

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    type Row = Pick<RopaEntry, 'status' | 'dpo_approved' | 'cross_border_transfer' | 'legal_basis' | 'processing_purposes' | 'data_categories' | 'activity_name'>
    const rows = (data ?? []) as Row[]
    const consentPurposes = (purposes ?? []) as Pick<ConsentPurpose, 'name_en' | 'description_en' | 'purpose_key'>[]

    const stats: RopaStats = {
      total: rows.length,
      draft: 0,
      active: 0,
      archived: 0,
      dpo_approved: 0,
      awaiting_approval: 0,
      cross_border: 0,
      consent_based: 0,
      consent_configured: 0,
      consent_gaps: 0,
      by_status: {},
    }

    for (const r of rows) {
      stats.by_status[r.status] = (stats.by_status[r.status] ?? 0) + 1
      if (r.status === 'draft')    stats.draft += 1
      if (r.status === 'active')   stats.active += 1
      if (r.status === 'archived') stats.archived += 1
      if (r.dpo_approved) stats.dpo_approved += 1
      else stats.awaiting_approval += 1
      if (r.cross_border_transfer) stats.cross_border += 1

      if (r.legal_basis === CONSENT_LEGAL_BASIS) {
        stats.consent_based += 1
        const coverage = computeConsentCoverage(r, consentPurposes)
        if (coverage.status === 'configured') stats.consent_configured += 1
        else stats.consent_gaps += 1
      }
    }

    return NextResponse.json({ success: true, data: stats })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
