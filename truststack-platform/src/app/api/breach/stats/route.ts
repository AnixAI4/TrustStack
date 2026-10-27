import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isOverdue, urgencyLevel } from '@/lib/breach/countdown'
import type { BreachStats, BreachStatus } from '@/types/dpdp'

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
      .from('breach_incidents')
      .select('status, nature, dpbi_notified, dpbi_notification_due_at')
      .eq('organization_id', membership.organization_id)

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    const rows = (data ?? []) as {
      status: BreachStatus
      nature: string
      dpbi_notified: boolean
      dpbi_notification_due_at: string
    }[]
    const now = new Date()

    const stats: BreachStats = {
      total: rows.length,
      open: 0,
      awaiting_dpbi: 0,
      overdue_dpbi: 0,
      due_soon: 0,
      resolved: 0,
      dpbi_notified: 0,
      by_nature: {},
    }

    for (const r of rows) {
      const isResolved = r.status === 'resolved'
      if (!isResolved) stats.open += 1
      if (isResolved) stats.resolved += 1
      if (r.dpbi_notified) stats.dpbi_notified += 1

      // Awaiting DPBI = not yet notified AND not resolved (the actionable set
      // that the escalation runner also targets).
      const awaiting = !r.dpbi_notified && !isResolved
      if (awaiting) {
        stats.awaiting_dpbi += 1
        if (isOverdue(r.dpbi_notification_due_at, now)) {
          stats.overdue_dpbi += 1
        } else {
          const u = urgencyLevel(r.dpbi_notification_due_at, now)
          if (u === 'warning' || u === 'critical') stats.due_soon += 1
        }
      }

      stats.by_nature[r.nature] = (stats.by_nature[r.nature] ?? 0) + 1
    }

    return NextResponse.json({ success: true, data: stats })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
