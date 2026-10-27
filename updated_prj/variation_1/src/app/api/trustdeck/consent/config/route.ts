import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/platform/supabase/admin'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const orgSlug = searchParams.get('org')

  if (!orgSlug) {
    return NextResponse.json({ error: 'org parameter required' }, { status: 400, headers: CORS_HEADERS })
  }

  try {
    const supabase = createAdminClient()

    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('slug', orgSlug)
      .single()

    if (orgError || !org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404, headers: CORS_HEADERS })
    }

    const { data: config, error: configError } = await supabase
      .from('consent_configs')
      .select('widget_version, languages, position, primary_color, show_reject_all, require_age_confirmation')
      .eq('organization_id', org.id)
      .single()

    if (configError || !config) {
      return NextResponse.json({ error: 'Consent not configured' }, { status: 404, headers: CORS_HEADERS })
    }

    const { data: purposes } = await supabase
      .from('consent_purposes')
      .select('purpose_key, name_en, name_hi, name_ta, name_te, description_en, required, dpdp_basis')
      .eq('organization_id', org.id)
      .order('created_at', { ascending: true })

    return NextResponse.json(
      {
        org_name: org.name,
        purposes: purposes || [],
        languages: config.languages,
        position: config.position,
        primary_color: config.primary_color,
        show_reject_all: config.show_reject_all,
        require_age_confirmation: config.require_age_confirmation,
        config_version: config.widget_version,
      },
      {
        headers: {
          ...CORS_HEADERS,
          'Cache-Control': 'public, max-age=300',
        },
      }
    )
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: CORS_HEADERS })
  }
}
