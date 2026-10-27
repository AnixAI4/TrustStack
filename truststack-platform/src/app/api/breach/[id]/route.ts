import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { BREACH_STATUS_LABELS } from '@/lib/constants'
import type { BreachIncident, BreachStatus } from '@/types/dpdp'

const VALID_STATUSES = new Set<string>(Object.keys(BREACH_STATUS_LABELS))

// Allowed lifecycle transitions. Forward progress plus reopen (an incident can
// recur). Invalid status values are rejected; resolved_at is managed below.
const ALLOWED_TRANSITIONS: Record<BreachStatus, BreachStatus[]> = {
  open:      ['open', 'contained', 'resolved'],
  contained: ['contained', 'open', 'resolved'],
  resolved:  ['resolved', 'open', 'contained'],
}

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

function optStr(v: unknown, max: number): string | null {
  return typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const m = await getMembership(supabase)
    if ('error' in m) return NextResponse.json({ error: m.error }, { status: m.status })

    const { data: incident, error } = await supabase
      .from('breach_incidents')
      .select('*')
      .eq('id', id)
      .eq('organization_id', m.organizationId)
      .single()

    if (error || !incident) return NextResponse.json({ error: 'Breach incident not found' }, { status: 404 })

    return NextResponse.json({ success: true, data: incident as BreachIncident })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH — status workflow + DPBI / data-principal notification + post-mortem.
// All status-change timestamps (dpbi_notified_at, principals_notified_at,
// resolved_at) are stamped SERVER-SIDE; the client never supplies them.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const m = await getMembership(supabase)
    if ('error' in m) return NextResponse.json({ error: m.error }, { status: m.status })

    const body = (await req.json()) as {
      status?: string
      mark_dpbi_notified?: boolean
      principals_notified?: boolean
      notification_method?: string
      root_cause?: string
      remediation_actions?: string
      containment_actions?: string
      dpbi_notification_draft?: string
    }

    // Load the current row first — needed for transition validation and to avoid
    // re-stamping timestamps that are already set.
    const { data: current } = await supabase
      .from('breach_incidents')
      .select('*')
      .eq('id', id)
      .eq('organization_id', m.organizationId)
      .single()
    if (!current) return NextResponse.json({ error: 'Breach incident not found' }, { status: 404 })
    const breach = current as BreachIncident

    const now = new Date().toISOString()
    const updates: Record<string, unknown> = { updated_at: now }

    if (body.status !== undefined) {
      if (!VALID_STATUSES.has(body.status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
      }
      const next = body.status as BreachStatus
      if (!ALLOWED_TRANSITIONS[breach.status].includes(next)) {
        return NextResponse.json({ error: `Cannot move a breach from ${breach.status} to ${next}` }, { status: 400 })
      }
      updates.status = next
      if (next === 'resolved') {
        // Stamp on first resolve; preserve the original resolved_at if already set.
        updates.resolved_at = breach.resolved_at ?? now
      } else if (breach.status === 'resolved') {
        // Reopened — clear the resolution timestamp.
        updates.resolved_at = null
      }
    }

    // Mark as DPBI Notified — boolean + server-side timestamp (note 7). Idempotent.
    if (body.mark_dpbi_notified === true && !breach.dpbi_notified) {
      updates.dpbi_notified = true
      updates.dpbi_notified_at = now
    }

    // Data-principal notification — boolean + server-side timestamp.
    if (body.principals_notified !== undefined) {
      const val = Boolean(body.principals_notified)
      updates.principals_notified = val
      if (val && !breach.principals_notified) updates.principals_notified_at = now
      if (!val) updates.principals_notified_at = null
    }
    if (body.notification_method !== undefined) {
      updates.notification_method = optStr(body.notification_method, 200)
    }

    // Post-mortem + containment free-text.
    if (body.root_cause !== undefined)          updates.root_cause          = optStr(body.root_cause, 4000)
    if (body.remediation_actions !== undefined) updates.remediation_actions = optStr(body.remediation_actions, 4000)
    if (body.containment_actions !== undefined) updates.containment_actions = optStr(body.containment_actions, 4000)

    // Persist an edited DPBI draft (the dpbi-draft route also writes this).
    if (body.dpbi_notification_draft !== undefined) {
      updates.dpbi_notification_draft = typeof body.dpbi_notification_draft === 'string'
        ? body.dpbi_notification_draft
        : null
    }

    const { data: incident, error } = await supabase
      .from('breach_incidents')
      .update(updates)
      .eq('id', id)
      .eq('organization_id', m.organizationId)
      .select()
      .single()

    if (error || !incident) {
      return NextResponse.json({ error: error?.message ?? 'Update failed' }, { status: 400 })
    }

    return NextResponse.json({ success: true, data: incident as BreachIncident })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
