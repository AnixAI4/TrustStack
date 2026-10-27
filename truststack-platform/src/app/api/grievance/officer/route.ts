import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { GrievanceOfficer } from '@/types/dpdp'

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

    const { data: officer } = await supabase
      .from('grievance_officers')
      .select('*')
      .eq('organization_id', membership.organization_id)
      .eq('active', true)
      .order('appointed_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    return NextResponse.json({ success: true, data: officer as GrievanceOfficer | null })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
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

    const body = await req.json() as { name?: string; designation?: string; email?: string; phone?: string }
    const { name, designation, email, phone } = body

    if (!name?.trim() || !designation?.trim() || !email?.trim()) {
      return NextResponse.json({ error: 'name, designation, and email are required' }, { status: 400 })
    }

    // Deactivate previous officers
    await supabase
      .from('grievance_officers')
      .update({ active: false })
      .eq('organization_id', membership.organization_id)
      .eq('active', true)

    const { data: officer, error } = await supabase
      .from('grievance_officers')
      .insert({
        organization_id: membership.organization_id,
        name: name.trim(),
        designation: designation.trim(),
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || null,
        active: true,
        appointed_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json({ success: true, data: officer as GrievanceOfficer })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
