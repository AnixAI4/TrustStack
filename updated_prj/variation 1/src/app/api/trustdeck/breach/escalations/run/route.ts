import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/platform/supabase/admin'
import { BREACH_ESCALATION_HOURS, BREACH_NATURE_TYPES } from '@/lib/platform/constants'
import { hoursRemaining, isOverdue } from '@/lib/platform/breach/countdown'
import { sendBreachEscalationEmail } from '@/lib/platform/breach/escalation'

// ============================================================================
// POST /api/trustdeck/breach/escalations/run - DPBI escalation alert runner.
//
// There is NO user session here - this is a SYSTEM endpoint meant to be hit by
// an EXTERNAL scheduler (Vercel Cron via vercel.json, a GitHub Action, or
// Supabase pg_cron) roughly every ~15 minutes. It is gated by a shared secret
// (CRON_SECRET) and uses the service-role admin client to scan across all orgs.
//
// The 72-hour countdown itself is DERIVED at read time and needs no cron - only
// these alert EMAILS need the external trigger (note 5). The runner is
// idempotent: each crossed "hours remaining" threshold is recorded in
// breach_incidents.escalations_sent so a breach is never double-alerted, even if
// the scheduler fires more often or several thresholds lapse between runs.
// ============================================================================

const MS_PER_HOUR = 3_600_000
// Only breaches within the first escalation window (or already overdue) are
// candidates - bounds the scan using the (organization_id, due_at) index.
const MAX_WINDOW_HOURS = Math.max(...BREACH_ESCALATION_HOURS)

function natureLabel(n: string): string {
  return BREACH_NATURE_TYPES.find(x => x.value === n)?.label ?? n
}

function isAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET
  // No secret configured → the runner is effectively disabled (deny everything),
  // so an unconfigured deployment can't be triggered by an unauthenticated caller.
  if (!secret) return false
  const headerSecret = req.headers.get('x-cron-secret')
  if (headerSecret && headerSecret === secret) return true
  // Vercel Cron sends `Authorization: Bearer <CRON_SECRET>`.
  const auth = req.headers.get('authorization')
  if (auth && auth === `Bearer ${secret}`) return true
  return false
}

export async function POST(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createAdminClient()
    const now = new Date()
    const cutoffIso = new Date(now.getTime() + MAX_WINDOW_HOURS * MS_PER_HOUR).toISOString()

    // Candidates: not yet DPBI-notified, not resolved, and within (or past) the
    // first escalation threshold.
    const { data, error } = await supabase
      .from('breach_incidents')
      .select('id, organization_id, reference_number, nature, dpbi_notification_due_at, escalations_sent')
      .eq('dpbi_notified', false)
      .neq('status', 'resolved')
      .lte('dpbi_notification_due_at', cutoffIso)

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    const rows = (data ?? []) as {
      id: string
      organization_id: string
      reference_number: string
      nature: string
      dpbi_notification_due_at: string
      escalations_sent: string[] | null
    }[]

    // Cache org name + DPO email per org for the run.
    const orgCache = new Map<string, { name: string; dpoEmail: string | null }>()
    async function getOrgContact(orgId: string) {
      const cached = orgCache.get(orgId)
      if (cached) return cached
      const [{ data: org }, { data: officer }] = await Promise.all([
        supabase.from('organizations').select('name').eq('id', orgId).single(),
        supabase
          .from('grievance_officers')
          .select('email')
          .eq('organization_id', orgId)
          .eq('active', true)
          .order('appointed_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ])
      const contact = { name: org?.name ?? 'your organization', dpoEmail: officer?.email ?? null }
      orgCache.set(orgId, contact)
      return contact
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
    let scanned = 0
    let alerted = 0
    let skipped = 0

    for (const r of rows) {
      scanned += 1
      const hrs = hoursRemaining(r.dpbi_notification_due_at, now) ?? 0
      const overdue = isOverdue(r.dpbi_notification_due_at, now)

      // Every threshold the clock has crossed (hours remaining <= threshold),
      // plus an 'overdue' token once past the deadline.
      const crossed: string[] = BREACH_ESCALATION_HOURS.filter(t => hrs <= t).map(String)
      if (overdue) crossed.push('overdue')

      const alreadySent = new Set(r.escalations_sent ?? [])
      const newlyCrossed = crossed.filter(c => !alreadySent.has(c))
      if (newlyCrossed.length === 0) continue

      const { name: orgName, dpoEmail } = await getOrgContact(r.organization_id)
      if (!dpoEmail) {
        // No DPO/officer to notify yet - leave un-sent so it alerts once one is
        // appointed (don't mark thresholds as sent).
        skipped += 1
        continue
      }

      // Most-urgent newly-crossed numeric threshold for the messaging.
      const numericNew = newlyCrossed.filter(c => c !== 'overdue').map(Number)
      const messagingThreshold = numericNew.length ? Math.min(...numericNew) : 0

      const sent = await sendBreachEscalationEmail(dpoEmail, {
        referenceNumber: r.reference_number,
        natureLabel: natureLabel(r.nature),
        hoursRemaining: hrs,
        threshold: messagingThreshold,
        overdue,
        orgName,
        incidentUrl: `${appUrl}/trustdeck/breach/${r.id}`,
      })

      if (!sent) {
        // Email failed - don't record the thresholds so the next run retries.
        skipped += 1
        continue
      }

      // Mark the UNION of all crossed thresholds as sent (so a long gap between
      // runs collapses to a single email, never one per skipped threshold).
      const updatedSent = Array.from(new Set([...alreadySent, ...crossed]))
      await supabase
        .from('breach_incidents')
        .update({ escalations_sent: updatedSent, updated_at: new Date().toISOString() })
        .eq('id', r.id)

      alerted += 1
    }

    return NextResponse.json({ success: true, scanned, alerted, skipped })
  } catch (e) {
    console.error('[Breach] escalation run error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
