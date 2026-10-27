import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requirePlatformOrg } from '@/lib/platform/org'
import { getVerifiedUser } from '@/lib/supabase/verified-user'
import type { Organization } from '@/types/dpdp'

export async function GET() {
  try {
    const supabase = await createClient()

    const user = await getVerifiedUser(supabase)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const ctx = await requirePlatformOrg(supabase, user.id)
    if (!ctx.ok) return NextResponse.json({ error: ctx.error }, { status: ctx.status })

    const { data: org } = await supabase
      .from('organizations')
      .select('id, name, slug, industry, cin, gstin, registered_state, employee_count_range, revenue_range, created_at, updated_at')
      .eq('id', ctx.organizationId)
      .single()

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: org as Organization })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
