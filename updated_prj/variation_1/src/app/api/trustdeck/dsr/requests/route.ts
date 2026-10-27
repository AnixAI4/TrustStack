import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requirePlatformOrg } from '@/lib/platform/org'
import { getVerifiedUser } from '@/lib/supabase/verified-user'
import { DSR_RIGHT_TYPES } from '@/lib/platform/constants'
import type { DsrRequest } from '@/types/dpdp'

const VALID_RIGHTS = DSR_RIGHT_TYPES.map(r => r.value) as readonly string[]

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const user = await getVerifiedUser(supabase)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const ctx = await requirePlatformOrg(supabase, user.id)
    if (!ctx.ok) return NextResponse.json({ error: ctx.error }, { status: ctx.status })

    const { searchParams } = new URL(req.url)
    const status     = searchParams.get('status')
    const rightType  = searchParams.get('right_type')
    const page       = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
    const limit      = Math.min(50, parseInt(searchParams.get('limit') ?? '20'))
    const search     = searchParams.get('search')?.trim()
    const from       = (page - 1) * limit

    let query = supabase
      .from('dsr_requests')
      .select('*', { count: 'exact' })
      .eq('organization_id', ctx.organizationId)
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1)

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }
    if (rightType && rightType !== 'all' && VALID_RIGHTS.includes(rightType)) {
      query = query.eq('right_type', rightType)
    }
    if (search) {
      query = query.or(`reference_number.ilike.%${search}%,requestor_name.ilike.%${search}%`)
    }

    const { data, count, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json({
      success: true,
      data: (data ?? []) as DsrRequest[],
      total: count ?? 0,
      page,
      limit,
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
