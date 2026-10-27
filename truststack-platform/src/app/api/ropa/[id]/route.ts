import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { DPDP_BASES, DATA_CATEGORIES, ROPA_SUBJECT_TYPES } from '@/lib/constants'
import { computeConsentCoverage } from '@/lib/ropa/consent'
import type { RopaEntry, RopaStatus, ConsentPurpose } from '@/types/dpdp'

const VALID_BASES = new Set<string>(DPDP_BASES.map(b => b.id))
const VALID_CATEGORIES = new Set<string>(DATA_CATEGORIES.map(c => c.key))
const VALID_SUBJECTS = new Set<string>(ROPA_SUBJECT_TYPES.map(s => s.value))

// Allowed status transitions (note #7 — validate the draft → active → archived flow).
const ALLOWED_TRANSITIONS: Record<RopaStatus, RopaStatus[]> = {
  draft:    ['active', 'archived'],
  active:   ['archived', 'draft'],
  archived: ['active', 'draft'],
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

// GET — a single ROPA entry plus its read-time consent coverage.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const m = await getMembership(supabase)
    if ('error' in m) return NextResponse.json({ error: m.error }, { status: m.status })

    const { data: entry, error } = await supabase
      .from('ropa_entries')
      .select('*')
      .eq('id', id)
      .eq('organization_id', m.organizationId)
      .single()

    if (error || !entry) return NextResponse.json({ error: 'ROPA entry not found' }, { status: 404 })

    const { data: purposes } = await supabase
      .from('consent_purposes')
      .select('name_en, description_en, purpose_key')
      .eq('organization_id', m.organizationId)

    const coverage = computeConsentCoverage(
      entry as RopaEntry,
      (purposes ?? []) as Pick<ConsentPurpose, 'name_en' | 'description_en' | 'purpose_key'>[],
    )

    return NextResponse.json({ success: true, data: entry as RopaEntry, coverage })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH — edit fields, drive the DPO approval workflow, and validate status
// transitions. The approver/approval timestamp are stamped SERVER-SIDE; the
// client never supplies dpo_approved / dpo_approved_at directly.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const m = await getMembership(supabase)
    if ('error' in m) return NextResponse.json({ error: m.error }, { status: m.status })

    // Need the current row for transition validation + ownership.
    const { data: current, error: fetchErr } = await supabase
      .from('ropa_entries')
      .select('status, dpo_approved')
      .eq('id', id)
      .eq('organization_id', m.organizationId)
      .single()

    if (fetchErr || !current) return NextResponse.json({ error: 'ROPA entry not found' }, { status: 404 })

    const body = (await req.json()) as Record<string, unknown>
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    const now = new Date().toISOString()

    // ── Field edits ──────────────────────────────────────────────────────────
    if (typeof body.activity_name === 'string') {
      if (!body.activity_name.trim()) return NextResponse.json({ error: 'Activity name cannot be empty' }, { status: 400 })
      updates.activity_name = body.activity_name.trim().slice(0, 200)
    }
    if (typeof body.activity_description === 'string') {
      updates.activity_description = body.activity_description.trim().slice(0, 2000) || null
    }
    if (typeof body.data_controller_name === 'string') {
      if (!body.data_controller_name.trim()) return NextResponse.json({ error: 'Data controller cannot be empty' }, { status: 400 })
      updates.data_controller_name = body.data_controller_name.trim().slice(0, 200)
    }
    if (typeof body.legal_basis === 'string') {
      if (!VALID_BASES.has(body.legal_basis)) return NextResponse.json({ error: 'Invalid legal_basis' }, { status: 400 })
      updates.legal_basis = body.legal_basis
    }
    if ('data_categories' in body)     updates.data_categories  = cleanArray(body.data_categories, VALID_CATEGORIES)
    if ('data_subject_types' in body)  updates.data_subject_types = cleanArray(body.data_subject_types, VALID_SUBJECTS)
    if ('processing_purposes' in body) updates.processing_purposes = cleanArray(body.processing_purposes)
    if ('data_sources' in body)        { const a = cleanArray(body.data_sources);       updates.data_sources = a.length ? a : null }
    if ('recipients' in body)          { const a = cleanArray(body.recipients);         updates.recipients = a.length ? a : null }
    if ('transfer_countries' in body)  { const a = cleanArray(body.transfer_countries); updates.transfer_countries = a.length ? a : null }
    if ('security_measures' in body)   { const a = cleanArray(body.security_measures);  updates.security_measures = a.length ? a : null }
    if ('processor_names' in body)     { const a = cleanArray(body.processor_names);    updates.processor_names = a.length ? a : null }
    if (typeof body.cross_border_transfer === 'boolean') updates.cross_border_transfer = body.cross_border_transfer
    if (typeof body.retention_period === 'string')       updates.retention_period = body.retention_period.trim().slice(0, 300) || null
    if (body.mark_reviewed === true)                     updates.last_reviewed_at = now

    // ── DPO approval (server-side stamp) ──────────────────────────────────────
    let targetStatus: RopaStatus | null = null
    if (body.approve === true) {
      // One-click approve → active. Approver is the authenticated user (server-side).
      updates.dpo_approved = true
      updates.dpo_approved_at = now
      updates.last_reviewed_at = now
      targetStatus = 'active'
    } else if (body.approve === false) {
      // Revoke approval → back to draft if it was active.
      updates.dpo_approved = false
      updates.dpo_approved_at = null
      if (current.status === 'active') targetStatus = 'draft'
    }

    // ── Explicit status transition (when not driven by approve) ───────────────
    if (targetStatus === null && typeof body.status === 'string') {
      const next = body.status as RopaStatus
      if (!(['draft', 'active', 'archived'] as RopaStatus[]).includes(next)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
      }
      if (next !== current.status) {
        if (!ALLOWED_TRANSITIONS[current.status as RopaStatus].includes(next)) {
          return NextResponse.json({ error: `Cannot move from ${current.status} to ${next}` }, { status: 400 })
        }
        // Activating requires DPO sign-off (already approved, or approving now).
        const willBeApproved = updates.dpo_approved === true || current.dpo_approved === true
        if (next === 'active' && !willBeApproved) {
          return NextResponse.json({ error: 'Approve the entry (DPO sign-off) before activating it.' }, { status: 400 })
        }
        targetStatus = next
      }
    }

    if (targetStatus) updates.status = targetStatus

    const { data: entry, error } = await supabase
      .from('ropa_entries')
      .update(updates)
      .eq('id', id)
      .eq('organization_id', m.organizationId)
      .select()
      .single()

    if (error || !entry) return NextResponse.json({ error: error?.message ?? 'Update failed' }, { status: 400 })

    return NextResponse.json({ success: true, data: entry as RopaEntry })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE — remove a ROPA entry.
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const m = await getMembership(supabase)
    if ('error' in m) return NextResponse.json({ error: m.error }, { status: m.status })

    const { error } = await supabase
      .from('ropa_entries')
      .delete()
      .eq('id', id)
      .eq('organization_id', m.organizationId)

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
