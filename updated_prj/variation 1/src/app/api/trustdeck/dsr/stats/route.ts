import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requirePlatformOrg } from '@/lib/platform/org'
import { getVerifiedUser } from '@/lib/supabase/verified-user'
import { isOpen, isOverdue } from '@/lib/platform/dsr/sla'
import type { DsrStats, DsrStatus } from '@/types/dpdp'

export async function GET() {
  try {
    const supabase = await createClient()
    const user = await getVerifiedUser(supabase)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const ctx = await requirePlatformOrg(supabase, user.id)
    if (!ctx.ok) return NextResponse.json({ error: ctx.error }, { status: ctx.status })

    const { data, error } = await supabase
      .from('dsr_requests')
      .select('status, right_type, due_date, fulfilled_at')
      .eq('organization_id', ctx.organizationId)

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    const rows = (data ?? []) as { status: DsrStatus; right_type: string; due_date: string | null; fulfilled_at: string | null }[]
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    const stats: DsrStats = {
      total: rows.length,
      open: 0,
      identity_pending: 0,
      overdue: 0,
      fulfilled_this_month: 0,
      by_right_type: {},
    }

    for (const r of rows) {
      if (isOpen(r.status)) stats.open += 1
      if (r.status === 'identity_pending') stats.identity_pending += 1
      if (isOverdue(r, now)) stats.overdue += 1
      if (r.status === 'fulfilled' && r.fulfilled_at && new Date(r.fulfilled_at) >= monthStart) {
        stats.fulfilled_this_month += 1
      }
      stats.by_right_type[r.right_type] = (stats.by_right_type[r.right_type] ?? 0) + 1
    }

    return NextResponse.json({ success: true, data: stats })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
