import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { BREACH_NATURE_TYPES, BREACH_STATUS_LABELS, DATA_CATEGORIES } from '@/lib/constants'
import { dueAtFrom } from '@/lib/breach/countdown'
import type { BreachIncident, BreachNature } from '@/types/dpdp'

const VALID_NATURES = new Set<string>(BREACH_NATURE_TYPES.map(n => n.value))
const VALID_STATUSES = new Set<string>(Object.keys(BREACH_STATUS_LABELS)) // open | contained | resolved
const VALID_CATEGORIES = new Set<string>(DATA_CATEGORIES.map(c => c.key))

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

// Keep only valid, de-duplicated string members of an allowed set (or any string).
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

function optStr(v: unknown, max: number): string | null {
  return typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null
}

// Reference numbers are minted PER ORG (BRH-YYYY-NNN restarts at 001 each org) —
// the composite unique index (organization_id, reference_number) scopes them, so
// counting this org's incidents for the year is correct (mirrors M5 DSR).
async function generateReferenceNumber(
  supabase: Awaited<ReturnType<typeof createClient>>,
  organizationId: string,
): Promise<string> {
  const year = new Date().getFullYear()
  const { count } = await supabase
    .from('breach_incidents')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .gte('created_at', `${year}-01-01`)
  const sequence = String((count ?? 0) + 1).padStart(3, '0')
  return `BRH-${year}-${sequence}`
}

// GET — list breach incidents (the Breach Register) with filter (status / nature)
// + search + pagination. Ordered newest-first.
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const m = await getMembership(supabase)
    if ('error' in m) return NextResponse.json({ error: m.error }, { status: m.status })

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const nature = searchParams.get('nature')
    const page   = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
    const limit  = Math.min(50, parseInt(searchParams.get('limit') ?? '20'))
    const search = searchParams.get('search')?.trim()
    const from   = (page - 1) * limit

    let query = supabase
      .from('breach_incidents')
      .select('*', { count: 'exact' })
      .eq('organization_id', m.organizationId)
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1)

    if (status && status !== 'all' && VALID_STATUSES.has(status)) {
      query = query.eq('status', status)
    }
    if (nature && nature !== 'all' && VALID_NATURES.has(nature)) {
      query = query.eq('nature', nature)
    }
    if (search) {
      query = query.ilike('reference_number', `%${search}%`)
    }

    const { data, count, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json({
      success: true,
      data: (data ?? []) as BreachIncident[],
      total: count ?? 0,
      page,
      limit,
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST — log a new breach incident. Captures Rule 7 essentials at log time;
// derives the 72-hour DPBI deadline and stamps logged_by SERVER-SIDE. Always
// starts 'open' and not-yet-notified.
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const m = await getMembership(supabase)
    if ('error' in m) return NextResponse.json({ error: m.error }, { status: m.status })

    const body = (await req.json()) as Record<string, unknown>

    // discovered_at — when the org became aware. Required; cannot be in the future.
    const discoveredRaw = typeof body.discovered_at === 'string' ? body.discovered_at.trim() : ''
    const discovered = discoveredRaw ? new Date(discoveredRaw) : null
    if (!discovered || isNaN(discovered.getTime())) {
      return NextResponse.json({ error: 'A valid discovered_at date/time is required' }, { status: 400 })
    }
    if (discovered.getTime() > Date.now() + 60_000) {
      return NextResponse.json({ error: 'discovered_at cannot be in the future' }, { status: 400 })
    }

    const nature = typeof body.nature === 'string' ? body.nature : ''
    if (!VALID_NATURES.has(nature)) {
      return NextResponse.json({ error: 'A valid nature is required' }, { status: 400 })
    }

    const categories = cleanArray(body.data_categories_affected, VALID_CATEGORIES)
    if (categories.length === 0) {
      return NextResponse.json({ error: 'At least one affected data category is required (DPDP Rule 7)' }, { status: 400 })
    }

    // occurred_at — optional; only stored if it parses.
    let occurredAtIso: string | null = null
    if (typeof body.occurred_at === 'string' && body.occurred_at.trim()) {
      const d = new Date(body.occurred_at)
      if (!isNaN(d.getTime())) occurredAtIso = d.toISOString()
    }

    // approximate affected count — optional non-negative integer.
    let approx: number | null = null
    if (body.data_subjects_affected_approx != null && body.data_subjects_affected_approx !== '') {
      const n = Number(body.data_subjects_affected_approx)
      if (Number.isFinite(n) && n >= 0) approx = Math.floor(n)
    }

    const systems = cleanArray(body.systems_involved)
    const discoveredIso = discovered.toISOString()
    const referenceNumber = await generateReferenceNumber(supabase, m.organizationId)

    const { data: incident, error } = await supabase
      .from('breach_incidents')
      .insert({
        organization_id:               m.organizationId,
        reference_number:              referenceNumber,
        discovered_at:                 discoveredIso,
        occurred_at:                   occurredAtIso,
        nature:                        nature as BreachNature,
        data_categories_affected:      categories,
        data_subjects_affected_approx: approx,
        systems_involved:              systems.length ? systems : null,
        discovery_method:              optStr(body.discovery_method, 300),
        containment_actions:           optStr(body.containment_actions, 4000),
        dpbi_notification_due_at:      dueAtFrom(discoveredIso),
        status:                        'open',
        logged_by:                     m.userId,
      })
      .select()
      .single()

    if (error || !incident) {
      return NextResponse.json({ error: error?.message ?? 'Failed to log breach' }, { status: 400 })
    }

    return NextResponse.json({ success: true, data: incident as BreachIncident })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
