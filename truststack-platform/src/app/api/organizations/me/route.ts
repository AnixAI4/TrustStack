import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Organization } from '@/types/dpdp'

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: membership } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .limit(1)
      .single()

    if (!membership) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 })
    }

    const { data: org } = await supabase
      .from('organizations')
      .select('id, name, slug, industry, cin, gstin, registered_state, employee_count_range, revenue_range, created_at, updated_at')
      .eq('id', membership.organization_id)
      .single()

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: org as Organization })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
