import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { createAdminClient } from '@/lib/platform/supabase/admin'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

function hashIdentifier(identifier: string, orgId: string): string {
  return createHash('sha256').update(`${orgId}:${identifier}`).digest('hex')
}

function hashIP(ip: string): string {
  return createHash('sha256').update(ip).digest('hex')
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      org_slug,
      data_principal_identifier,
      purposes_accepted,
      purposes_rejected,
      language,
      channel,
      user_agent,
    } = body

    if (!org_slug || !data_principal_identifier) {
      return NextResponse.json(
        { error: 'org_slug and data_principal_identifier are required' },
        { status: 400, headers: CORS_HEADERS }
      )
    }

    const supabase = createAdminClient()

    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', org_slug)
      .single()

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404, headers: CORS_HEADERS })
    }

    const { data: config } = await supabase
      .from('consent_configs')
      .select('widget_version')
      .eq('organization_id', org.id)
      .single()

    const identifierHash = hashIdentifier(String(data_principal_identifier), org.id)

    const rawIP =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown'
    const ipHash = hashIP(rawIP)

    const { data: record, error } = await supabase
      .from('consent_records')
      .insert({
        organization_id: org.id,
        config_version: config?.widget_version || '1',
        data_principal_hash: identifierHash,
        channel: channel || 'web',
        purposes_accepted: Array.isArray(purposes_accepted) ? purposes_accepted : [],
        purposes_rejected: Array.isArray(purposes_rejected) ? purposes_rejected : [],
        language: language || 'en',
        user_agent: user_agent || null,
        ip_hash: ipHash,
      })
      .select('id')
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to record consent' }, { status: 500, headers: CORS_HEADERS })
    }

    return NextResponse.json({ success: true, consent_id: record.id }, { headers: CORS_HEADERS })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: CORS_HEADERS })
  }
}
