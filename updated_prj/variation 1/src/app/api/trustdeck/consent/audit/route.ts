import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requirePlatformOrg } from '@/lib/platform/org'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const ctx = await requirePlatformOrg(supabase, user.id)
    if (!ctx.ok) return NextResponse.json({ error: ctx.error }, { status: ctx.status })

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '25')))
    const channel = searchParams.get('channel')
    const from_date = searchParams.get('from_date')
    const to_date = searchParams.get('to_date')
    const offset = (page - 1) * limit

    let query = supabase
      .from('consent_records')
      .select('*', { count: 'exact' })
      .eq('organization_id', ctx.organizationId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (channel) query = query.eq('channel', channel)
    if (from_date) query = query.gte('created_at', from_date)
    if (to_date) query = query.lte('created_at', to_date + 'T23:59:59Z')

    const { data, count, error } = await query

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch audit records' }, { status: 500 })
    }

    return NextResponse.json({
      records: data || [],
      total: count || 0,
      page,
      limit,
      pages: Math.ceil((count || 0) / limit),
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
