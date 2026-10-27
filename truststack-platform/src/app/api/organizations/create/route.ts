import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

interface CreateOrgBody {
  name: string
  slug: string
  industry: string | null
  employee_count_range: string | null
  revenue_range: string | null
}

export async function POST(request: NextRequest) {
  try {
    // Verify auth server-side (cookies always available here)
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user already has an org
    const { data: existing } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .limit(1)
      .single()

    if (existing) {
      return NextResponse.json({ success: true, data: { already_exists: true } })
    }

    const body = await request.json() as CreateOrgBody
    const { name, slug, industry, employee_count_range, revenue_range } = body

    if (!name?.trim() || !slug?.trim()) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 })
    }

    // Use admin client to bypass RLS — user is already verified above
    const admin = createAdminClient()

    const { data: org, error: orgError } = await admin
      .from('organizations')
      .insert({ name: name.trim(), slug, industry, employee_count_range, revenue_range })
      .select()
      .single()

    if (orgError) {
      return NextResponse.json({ error: orgError.message }, { status: 500 })
    }

    const { error: memberError } = await admin
      .from('organization_members')
      .insert({ organization_id: org.id, user_id: user.id, role: 'admin' })

    if (memberError) {
      // Clean up the org if member insert fails
      await admin.from('organizations').delete().eq('id', org.id)
      return NextResponse.json({ error: memberError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: { id: org.id } })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
