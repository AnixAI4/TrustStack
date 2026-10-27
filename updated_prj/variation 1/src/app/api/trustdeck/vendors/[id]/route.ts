import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requirePlatformOrg } from '@/lib/platform/org'
import { VENDOR_TYPES } from '@/lib/platform/constants'
import type { Vendor, VendorQuestionnaireResponse } from '@/types/dpdp'

const VALID_TYPES = VENDOR_TYPES.map(t => t.value) as readonly string[]
const VALID_DPA_STATUSES = ['pending', 'sent', 'signed', 'expired'] as const
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

async function getMembership(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized', status: 401 as const }
  const ctx = await requirePlatformOrg(supabase, user.id)
  if (!ctx.ok) return { error: ctx.error, status: ctx.status }
  return { organizationId: ctx.organizationId }
}

// GET - vendor + its stored questionnaire responses (for the detail view).
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const m = await getMembership(supabase)
    if ('error' in m) return NextResponse.json({ error: m.error }, { status: m.status })

    const { data: vendor, error } = await supabase
      .from('vendors')
      .select('*')
      .eq('id', id)
      .eq('organization_id', m.organizationId)
      .single()

    if (error || !vendor) return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })

    const { data: responses } = await supabase
      .from('vendor_questionnaire_responses')
      .select('*')
      .eq('vendor_id', id)
      .eq('organization_id', m.organizationId)
      .order('question_id', { ascending: true })

    return NextResponse.json({
      success: true,
      data: vendor as Vendor,
      responses: (responses ?? []) as VendorQuestionnaireResponse[],
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH - edit vendor fields and drive the DPA workflow.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const m = await getMembership(supabase)
    if ('error' in m) return NextResponse.json({ error: m.error }, { status: m.status })

    const body = (await req.json()) as Record<string, unknown>
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }

    if (typeof body.name === 'string') {
      if (!body.name.trim()) return NextResponse.json({ error: 'Vendor name cannot be empty' }, { status: 400 })
      updates.name = body.name.trim()
    }
    if (typeof body.website === 'string')      updates.website = body.website.trim() || null
    if (typeof body.contact_name === 'string') updates.contact_name = body.contact_name.trim() || null
    if (typeof body.contact_email === 'string') {
      const e = body.contact_email.trim()
      if (e && !EMAIL_RE.test(e)) return NextResponse.json({ error: 'contact_email is not a valid email' }, { status: 400 })
      updates.contact_email = e.toLowerCase() || null
    }
    if (typeof body.vendor_type === 'string') {
      if (!VALID_TYPES.includes(body.vendor_type)) return NextResponse.json({ error: 'Invalid vendor_type' }, { status: 400 })
      updates.vendor_type = body.vendor_type
    }
    if (Array.isArray(body.data_location)) {
      const arr = body.data_location.filter((c): c is string => typeof c === 'string')
      updates.data_location = arr.length ? arr : null
    }
    if (typeof body.india_data_residency === 'boolean') updates.india_data_residency = body.india_data_residency
    if (Array.isArray(body.personal_data_categories)) {
      const arr = body.personal_data_categories.filter((c): c is string => typeof c === 'string')
      updates.personal_data_categories = arr.length ? arr : null
    }
    if (typeof body.notes === 'string')            updates.notes = body.notes.trim() || null
    if (typeof body.dpa_document_url === 'string')  updates.dpa_document_url = body.dpa_document_url.trim() || null
    if (typeof body.dpa_expires_at === 'string' || body.dpa_expires_at === null) {
      updates.dpa_expires_at = body.dpa_expires_at || null
    }
    if (typeof body.dpa_signed_at === 'string' || body.dpa_signed_at === null) {
      updates.dpa_signed_at = body.dpa_signed_at || null
    }

    if (typeof body.dpa_status === 'string') {
      if (!VALID_DPA_STATUSES.includes(body.dpa_status as (typeof VALID_DPA_STATUSES)[number])) {
        return NextResponse.json({ error: 'Invalid dpa_status' }, { status: 400 })
      }
      updates.dpa_status = body.dpa_status
      // Stamp the signed date when marking signed, unless the caller set one.
      if (body.dpa_status === 'signed' && body.dpa_signed_at === undefined) {
        updates.dpa_signed_at = new Date().toISOString()
      }
    }

    const { data: vendor, error } = await supabase
      .from('vendors')
      .update(updates)
      .eq('id', id)
      .eq('organization_id', m.organizationId)
      .select()
      .single()

    if (error || !vendor) return NextResponse.json({ error: error?.message ?? 'Update failed' }, { status: 400 })

    return NextResponse.json({ success: true, data: vendor as Vendor })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - remove a vendor (cascade drops its questionnaire responses).
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const m = await getMembership(supabase)
    if ('error' in m) return NextResponse.json({ error: m.error }, { status: m.status })

    const { error } = await supabase
      .from('vendors')
      .delete()
      .eq('id', id)
      .eq('organization_id', m.organizationId)

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
