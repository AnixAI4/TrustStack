import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/platform/supabase/admin'
import { NOTICE_LANGUAGES } from '@/lib/platform/constants'
import type { PrivacyNotice, PrivacyNoticeVersion } from '@/types/dpdp'

// Public, no auth. Returns the current published notice for an org slug.
// Uses the admin client (service role) because there is no user session - it
// then explicitly filters to published notices so nothing draft leaks.
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS })
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const supabase = createAdminClient()

    const { data: notice } = await supabase
      .from('privacy_notices')
      .select('*')
      .eq('slug', slug)
      .eq('published', true)
      .maybeSingle()

    if (!notice || !(notice as PrivacyNotice).current_version_id) {
      return NextResponse.json({ error: 'Notice not found' }, { status: 404, headers: CORS })
    }

    const noticeRow = notice as PrivacyNotice

    const [{ data: version }, { data: org }] = await Promise.all([
      supabase
        .from('privacy_notice_versions')
        .select('*')
        .eq('id', noticeRow.current_version_id as string)
        .maybeSingle(),
      supabase
        .from('organizations')
        .select('name, logo_url')
        .eq('id', noticeRow.organization_id)
        .single(),
    ])

    if (!version) {
      return NextResponse.json({ error: 'Notice not found' }, { status: 404, headers: CORS })
    }

    const v = version as PrivacyNoticeVersion
    const available_languages = NOTICE_LANGUAGES.filter(
      l => !!(v as unknown as Record<string, string | null>)[l.column]
    ).map(l => l.code)

    return NextResponse.json(
      {
        notice: noticeRow,
        current_version: v,
        organization_name: org?.name || slug,
        organization_logo_url: org?.logo_url || null,
        available_languages,
      },
      { headers: CORS }
    )
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: CORS })
  }
}
