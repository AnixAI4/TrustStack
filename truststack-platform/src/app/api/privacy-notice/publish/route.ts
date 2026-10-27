import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateNotice } from '@/lib/ai/notice-generator'
import type { PrivacyNoticeVersion } from '@/types/dpdp'

// POST (auth) — publishes a saved version: stamps published_at, points the
// notice's current_version_id at it, and flips published = true.
// Runs the compliance validator server-side as a final gate.
export async function POST(request: NextRequest) {
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

    const { version_id } = (await request.json()) as { version_id?: string }
    if (!version_id) {
      return NextResponse.json({ error: 'version_id is required' }, { status: 400 })
    }

    const { data: version } = await supabase
      .from('privacy_notice_versions')
      .select('*')
      .eq('id', version_id)
      .eq('organization_id', member.organization_id)
      .maybeSingle()

    if (!version) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 })
    }

    const v = version as PrivacyNoticeVersion

    // Final compliance gate (DPDP) before going public.
    const errors = validateNotice({
      content_en: v.content_en,
      grievance_officer_name: v.grievance_officer_name,
      grievance_officer_email: v.grievance_officer_email,
    })
    if (errors.length > 0) {
      return NextResponse.json({ error: 'Notice failed compliance checks', errors }, { status: 400 })
    }

    const now = new Date().toISOString()

    // Stamp published_at on the version (only the first time it is published).
    if (!v.published_at) {
      await supabase
        .from('privacy_notice_versions')
        .update({ published_at: now })
        .eq('id', v.id)
    }

    const { error: updateError } = await supabase
      .from('privacy_notices')
      .update({ current_version_id: v.id, published: true, updated_at: now })
      .eq('id', v.notice_id)
      .eq('organization_id', member.organization_id)

    if (updateError) {
      return NextResponse.json({ error: 'Failed to publish notice' }, { status: 500 })
    }

    return NextResponse.json({ success: true, published_at: v.published_at || now })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
