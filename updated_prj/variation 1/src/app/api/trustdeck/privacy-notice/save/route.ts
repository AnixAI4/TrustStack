import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requirePlatformOrg } from '@/lib/platform/org'
import type { PrivacyNotice } from '@/types/dpdp'

// POST (auth) - persists a new immutable notice version (draft).
// Ensures the org's privacy_notices row exists, then writes a fresh
// privacy_notice_versions snapshot. The Grievance Officer details are captured
// server-side from the live officer record so the snapshot is authoritative.
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const ctx = await requirePlatformOrg(supabase, user.id)
    if (!ctx.ok) return NextResponse.json({ error: ctx.error }, { status: ctx.status })

    const body = await request.json()
    const {
      content_en,
      content_hi = null,
      content_ta = null,
      content_te = null,
      content_mr = null,
      change_summary = null,
    } = body as {
      content_en?: string
      content_hi?: string | null
      content_ta?: string | null
      content_te?: string | null
      content_mr?: string | null
      change_summary?: string | null
    }

    if (!content_en || !content_en.trim()) {
      return NextResponse.json({ error: 'content_en is required - generate the notice first' }, { status: 400 })
    }

    // Authoritative Grievance Officer (DPDP Section 14). Required for the notice.
    const { data: officer } = await supabase
      .from('grievance_officers')
      .select('name, email, phone')
      .eq('organization_id', ctx.organizationId)
      .eq('active', true)
      .order('appointed_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!officer) {
      return NextResponse.json(
        { error: 'No Grievance Officer set. Appoint one in the Grievance module before saving a notice.' },
        { status: 400 }
      )
    }

    // Org (for slug on first creation)
    const { data: org } = await supabase
      .from('organizations')
      .select('slug')
      .eq('id', ctx.organizationId)
      .single()

    if (!org) return NextResponse.json({ error: 'Organization not found' }, { status: 404 })

    // Ensure the notice row exists for this org.
    let { data: notice } = await supabase
      .from('privacy_notices')
      .select('*')
      .eq('organization_id', ctx.organizationId)
      .maybeSingle()

    if (!notice) {
      const { data: created, error: createError } = await supabase
        .from('privacy_notices')
        .insert({ organization_id: ctx.organizationId, slug: org.slug, published: false })
        .select('*')
        .single()
      if (createError || !created) {
        return NextResponse.json({ error: 'Failed to create notice' }, { status: 500 })
      }
      notice = created
    }

    const noticeRow = notice as PrivacyNotice

    // Next version number for this notice (immutable; never reuse).
    const { data: latest } = await supabase
      .from('privacy_notice_versions')
      .select('version_number')
      .eq('notice_id', noticeRow.id)
      .order('version_number', { ascending: false })
      .limit(1)
      .maybeSingle()

    const nextVersion = latest ? latest.version_number + 1 : 1

    const { data: version, error: versionError } = await supabase
      .from('privacy_notice_versions')
      .insert({
        notice_id: noticeRow.id,
        organization_id: ctx.organizationId,
        version_number: nextVersion,
        content_en: content_en.trim(),
        content_hi,
        content_ta,
        content_te,
        content_mr,
        grievance_officer_name: officer.name,
        grievance_officer_email: officer.email,
        grievance_officer_phone: officer.phone || null,
        change_summary: nextVersion === 1 ? (change_summary || 'Initial version') : change_summary,
        created_by: user.id,
      })
      .select('*')
      .single()

    if (versionError || !version) {
      return NextResponse.json({ error: 'Failed to save notice version' }, { status: 500 })
    }

    // Keep the notice's updated_at fresh.
    await supabase
      .from('privacy_notices')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', noticeRow.id)

    return NextResponse.json({ success: true, notice: noticeRow, version })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
