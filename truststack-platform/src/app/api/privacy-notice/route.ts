import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { PrivacyNotice, PrivacyNoticeVersion } from '@/types/dpdp'

// GET (auth) — returns this org's notice, its current published version, and the
// full immutable version history. Used by the dashboard home + version history.
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

    const { data: notice, error: noticeError } = await supabase
      .from('privacy_notices')
      .select('*')
      .eq('organization_id', member.organization_id)
      .maybeSingle()

    if (noticeError) {
      // Table likely not created yet — return a non-error payload so the UI can
      // show a setup hint (mirrors the consent versions route).
      return NextResponse.json({ available: false, notice: null, current_version: null, versions: [] })
    }

    if (!notice) {
      return NextResponse.json({ available: true, notice: null, current_version: null, versions: [] })
    }

    const { data: versions } = await supabase
      .from('privacy_notice_versions')
      .select('*')
      .eq('notice_id', notice.id)
      .order('version_number', { ascending: false })

    const versionList = (versions || []) as PrivacyNoticeVersion[]
    const current = versionList.find(v => v.id === (notice as PrivacyNotice).current_version_id) || null

    return NextResponse.json({
      available: true,
      notice: notice as PrivacyNotice,
      current_version: current,
      versions: versionList,
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
