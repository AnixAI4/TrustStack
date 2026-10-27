import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: member } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single()

    if (!member) return NextResponse.json({ error: 'No organization found' }, { status: 403 })

    const { data, error } = await supabase
      .from('consent_config_versions')
      .select('*')
      .eq('organization_id', member.organization_id)
      .order('created_at', { ascending: false })

    if (error) {
      // Most likely the table hasn't been created yet — return an empty,
      // non-error payload so the UI can show a helpful setup hint.
      return NextResponse.json({ versions: [], available: false })
    }

    return NextResponse.json({ versions: data || [], available: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
