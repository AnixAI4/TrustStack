import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requirePlatformOrg } from '@/lib/platform/org'

export async function POST() {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const ctx = await requirePlatformOrg(supabase, user.id)
    if (!ctx.ok) return NextResponse.json({ error: ctx.error }, { status: ctx.status })

    // This write intentionally uses the authenticated client. If RLS rejects
    // it, fail closed rather than masking a broken policy with service-role.
    const { data: assessment, error } = await supabase
      .from('assessments')
      .insert({
        organization_id: ctx.organizationId,
        created_by: user.id,
        status: 'in_progress',
      })
      .select('id')
      .single()

    if (error || !assessment) {
      return NextResponse.json(
        { error: 'Failed to start assessment' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data: { id: assessment.id } })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
