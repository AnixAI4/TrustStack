import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { effectiveDpaStatus, isExpiringSoon } from '@/lib/vendors/status'
import type { VendorStats, VendorDpaStatus, VendorRiskTier } from '@/types/dpdp'

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

    const { data, error } = await supabase
      .from('vendors')
      .select('dpa_status, dpa_expires_at, risk_tier')
      .eq('organization_id', membership.organization_id)

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    const rows = (data ?? []) as { dpa_status: VendorDpaStatus; dpa_expires_at: string | null; risk_tier: VendorRiskTier | null }[]
    const now = new Date()

    const stats: VendorStats = {
      total: rows.length,
      signed: 0,
      awaiting: 0,
      expiring_soon: 0,
      expired: 0,
      high_risk: 0,
      by_status: {},
      by_risk_tier: {},
    }

    for (const r of rows) {
      const effective = effectiveDpaStatus(r, now)
      // by_status / signed / awaiting use the DERIVED status so a lapsed signed
      // DPA counts as expired everywhere consistently.
      stats.by_status[effective] = (stats.by_status[effective] ?? 0) + 1
      if (effective === 'signed') stats.signed += 1
      if (effective === 'pending' || effective === 'sent') stats.awaiting += 1
      if (effective === 'expired') stats.expired += 1
      if (r.dpa_status === 'signed' && isExpiringSoon(r.dpa_expires_at, 30, now)) stats.expiring_soon += 1
      if (r.risk_tier === 'high' || r.risk_tier === 'critical') stats.high_risk += 1
      if (r.risk_tier) stats.by_risk_tier[r.risk_tier] = (stats.by_risk_tier[r.risk_tier] ?? 0) + 1
    }

    return NextResponse.json({ success: true, data: stats })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
