import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOverviewData } from '@/lib/dashboard/aggregate'

// GET (auth) — single aggregated payload for the board dashboard home.
export async function GET() {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: member } = await supabase
      .from('organization_members')
      .select('organization_id, organizations(name)')
      .eq('user_id', user.id)
      .limit(1)
      .single()

    if (!member) return NextResponse.json({ error: 'No organization found' }, { status: 404 })

    const org = member.organizations as unknown as { name: string } | null
    const data = await getOverviewData(supabase, member.organization_id, org?.name ?? '')

    return NextResponse.json(data)
  } catch (error) {
    console.error('Dashboard overview error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
