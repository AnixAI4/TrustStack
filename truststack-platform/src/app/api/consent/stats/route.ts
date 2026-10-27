import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: member } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single()

    if (!member) return NextResponse.json({ error: 'No organization found' }, { status: 403 })

    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    // Which purposes are "required" (e.g. essential)? We measure genuine opt-in:
    // a record only counts toward the consent rate if it accepted at least one
    // NON-required (optional) purpose. Otherwise a "Reject All" — which still keeps
    // the required essentials — would inflate the rate to ~100% and tell us nothing.
    const { data: orgPurposes } = await supabase
      .from('consent_purposes')
      .select('purpose_key, required')
      .eq('organization_id', member.organization_id)

    const requiredKeys = new Set(
      (orgPurposes || []).filter(p => p.required).map(p => p.purpose_key)
    )

    const { data: records } = await supabase
      .from('consent_records')
      .select('channel, purposes_accepted, withdrawn')
      .eq('organization_id', member.organization_id)
      .gte('created_at', startOfMonth.toISOString())

    const total = records?.length || 0
    const accepted = records?.filter(r =>
      Array.isArray(r.purposes_accepted) &&
      r.purposes_accepted.some((k: string) => !requiredKeys.has(k))
    ).length || 0
    const withdrawals = records?.filter(r => r.withdrawn).length || 0

    const byChannel: Record<string, number> = {}
    records?.forEach(r => {
      byChannel[r.channel] = (byChannel[r.channel] || 0) + 1
    })

    return NextResponse.json({
      total_this_month: total,
      consent_rate: total > 0 ? Math.round((accepted / total) * 100) : 0,
      withdrawals_this_month: withdrawals,
      by_channel: byChannel,
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
