import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/platform/supabase/admin'
import { getOverviewData } from '@/lib/platform/dashboard/aggregate'
import { requirePlatformOrg } from '@/lib/platform/org'
import { getVerifiedUser } from '@/lib/supabase/verified-user'

// GET (auth) - single aggregated payload for the board dashboard home.
export async function GET() {
  try {
    const supabase = await createClient()

    const user = await getVerifiedUser(supabase)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const ctx = await requirePlatformOrg(supabase, user.id)
    if (!ctx.ok) {
      return NextResponse.json({ error: ctx.error }, { status: ctx.status })
    }

    // Aggregate with service role so dual-FK / RLS quirks don't blank the dashboard
    const admin = createAdminClient()
    const data = await getOverviewData(admin, ctx.organizationId, ctx.org.name, user.id)

    return NextResponse.json(data, {
      headers: {
        // This payload is user-specific: cache only in the user's browser, never
        // in a shared CDN. A short stale window keeps back-navigation instant.
        'Cache-Control': 'private, max-age=10, stale-while-revalidate=30',
        Vary: 'Cookie, Authorization',
      },
    })
  } catch (error) {
    console.error('Dashboard overview error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
