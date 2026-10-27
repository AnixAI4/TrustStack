import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/platform/supabase/admin'
import { resolvePilotTier } from '@/lib/security/pilot-gate'

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

    // Pilot required to create a platform workspace
    if ((await resolvePilotTier(supabase, user.id)) !== 'pilot') {
      return NextResponse.json(
        {
          error: 'Pilot subscription required',
          code: 'PILOT_REQUIRED',
          subscribe_url: '/subscribe?next=%2Fplatform%2Fcreate-organization',
        },
        { status: 402 }
      )
    }

    // Check if user already has an org (admin - avoids RLS false-negatives)
    const admin = createAdminClient()
    const { data: existing } = await admin
      .from('organization_members')
      .select('org_id, organization_id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle()

    if (existing?.org_id || existing?.organization_id) {
      return NextResponse.json({
        success: true,
        data: {
          already_exists: true,
          id: existing.organization_id || existing.org_id,
        },
      })
    }

    // Also treat owner_id orgs as existing workspace
    const { data: owned } = await admin
      .from('organizations')
      .select('id')
      .eq('owner_id', user.id)
      .limit(1)
      .maybeSingle()

    if (owned?.id) {
      // Ensure membership row exists for platform queries
      await admin.from('organization_members').upsert(
        {
          org_id: owned.id,
          organization_id: owned.id,
          user_id: user.id,
          role: 'owner',
          joined_at: new Date().toISOString(),
        },
        { onConflict: 'org_id,user_id' }
      )
      return NextResponse.json({
        success: true,
        data: { already_exists: true, id: owned.id },
      })
    }

    const body = await request.json() as CreateOrgBody
    const { name, slug, industry, employee_count_range, revenue_range } = body

    if (!name?.trim() || !slug?.trim()) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 })
    }

    const { data: org, error: orgError } = await admin
      .from('organizations')
      .insert({
        name: name.trim(),
        slug,
        industry,
        employee_count_range,
        revenue_range,
        owner_id: user.id,
      })
      .select()
      .single()

    if (orgError) {
      return NextResponse.json({ error: orgError.message }, { status: 500 })
    }

    // Existing schema uses org_id; platform uses organization_id - DB trigger syncs both.
    // Use role 'owner' (always allowed by TrustStack check constraint).
    const { error: memberError } = await admin
      .from('organization_members')
      .insert({
        org_id: org.id,
        organization_id: org.id,
        user_id: user.id,
        role: 'owner',
        joined_at: new Date().toISOString(),
      })

    if (memberError) {
      console.error('[platform] member insert failed:', memberError.message)
      // Clean up the org if member insert fails
      await admin.from('organizations').delete().eq('id', org.id)
      return NextResponse.json({ error: memberError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: { id: org.id } })
  } catch (err) {
    console.error('[platform] create org error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
