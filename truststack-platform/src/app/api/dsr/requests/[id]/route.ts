import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { hashDataPrincipal } from '@/lib/dsr/otp'
import type { DsrRequest, DsrNomination, DsrStatus } from '@/types/dpdp'

const VALID_STATUSES: DsrStatus[] = ['received', 'identity_pending', 'processing', 'fulfilled', 'denied', 'overdue']

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: membership } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single()

    if (!membership) return NextResponse.json({ error: 'No organization found' }, { status: 404 })

    const { data: request, error } = await supabase
      .from('dsr_requests')
      .select('*')
      .eq('id', id)
      .eq('organization_id', membership.organization_id)
      .single()

    if (error || !request) return NextResponse.json({ error: 'Request not found' }, { status: 404 })

    const dsr = request as DsrRequest

    // For a nomination, surface the linked nominee record (correlated by the
    // hashed data principal email).
    let nomination: DsrNomination | null = null
    if (dsr.right_type === 'nominate' && dsr.requestor_email) {
      const { data: nom } = await supabase
        .from('dsr_nominations')
        .select('*')
        .eq('organization_id', membership.organization_id)
        .eq('data_principal_hash', hashDataPrincipal(dsr.requestor_email, membership.organization_id))
        .eq('active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      nomination = (nom as DsrNomination | null) ?? null
    }

    return NextResponse.json({ success: true, data: dsr, nomination })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: membership } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single()

    if (!membership) return NextResponse.json({ error: 'No organization found' }, { status: 404 })

    const body = (await req.json()) as {
      status?: string
      fulfillment_notes?: string
      denial_reason?: string
      assigned_to?: string
    }
    const { status, fulfillment_notes, denial_reason, assigned_to } = body

    if (status && !VALID_STATUSES.includes(status as DsrStatus)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }
    if (status === 'denied' && denial_reason !== undefined && !denial_reason.trim()) {
      return NextResponse.json({ error: 'A denial reason is required to deny a request' }, { status: 400 })
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (status)                          updates.status            = status
    if (fulfillment_notes !== undefined) updates.fulfillment_notes = fulfillment_notes
    if (denial_reason !== undefined)     updates.denial_reason     = denial_reason
    if (assigned_to)                     updates.assigned_to       = assigned_to
    if (status === 'fulfilled')          updates.fulfilled_at      = new Date().toISOString()

    const { data: request, error } = await supabase
      .from('dsr_requests')
      .update(updates)
      .eq('id', id)
      .eq('organization_id', membership.organization_id)
      .select()
      .single()

    if (error || !request) return NextResponse.json({ error: error?.message ?? 'Update failed' }, { status: 400 })

    return NextResponse.json({ success: true, data: request as DsrRequest })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
