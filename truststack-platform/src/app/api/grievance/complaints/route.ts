import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { GrievanceComplaint } from '@/types/dpdp'

export async function GET(req: NextRequest) {
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

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const page   = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
    const limit  = Math.min(50, parseInt(searchParams.get('limit') ?? '20'))
    const search = searchParams.get('search')?.trim()
    const from   = (page - 1) * limit

    let query = supabase
      .from('grievance_complaints')
      .select('*', { count: 'exact' })
      .eq('organization_id', membership.organization_id)
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1)

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }
    if (search) {
      query = query.or(`reference_number.ilike.%${search}%,complainant_name.ilike.%${search}%`)
    }

    const { data, count, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json({
      success: true,
      data: (data ?? []) as GrievanceComplaint[],
      total: count ?? 0,
      page,
      limit,
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
