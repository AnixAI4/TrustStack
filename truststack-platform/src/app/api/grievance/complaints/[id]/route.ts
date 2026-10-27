import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { GrievanceComplaint, GrievanceStatus } from '@/types/dpdp'

const VALID_STATUSES: GrievanceStatus[] = ['new', 'under_review', 'resolved', 'escalated_to_dpbi']

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

    const { data: complaint, error } = await supabase
      .from('grievance_complaints')
      .select('*')
      .eq('id', id)
      .eq('organization_id', membership.organization_id)
      .single()

    if (error || !complaint) return NextResponse.json({ error: 'Complaint not found' }, { status: 404 })

    return NextResponse.json({ success: true, data: complaint as GrievanceComplaint })
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

    const body = await req.json() as { status?: string; resolution_notes?: string; assigned_to?: string }
    const { status, resolution_notes, assigned_to } = body

    if (status && !VALID_STATUSES.includes(status as GrievanceStatus)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (status)           updates.status           = status
    if (resolution_notes !== undefined) updates.resolution_notes = resolution_notes
    if (assigned_to)      updates.assigned_to      = assigned_to
    if (status === 'resolved')          updates.resolved_at  = new Date().toISOString()
    if (status === 'escalated_to_dpbi') updates.escalated_at = new Date().toISOString()

    const { data: complaint, error } = await supabase
      .from('grievance_complaints')
      .update(updates)
      .eq('id', id)
      .eq('organization_id', membership.organization_id)
      .select()
      .single()

    if (error || !complaint) return NextResponse.json({ error: error?.message ?? 'Update failed' }, { status: 400 })

    return NextResponse.json({ success: true, data: complaint as GrievanceComplaint })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
