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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { org_slug, data_principal_identifier } = body

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

    const identifierHash = hashIdentifier(String(data_principal_identifier), org.id)

    const { data, error } = await supabase
      .from('consent_records')
      .update({ withdrawn: true, withdrawn_at: new Date().toISOString() })
      .eq('organization_id', org.id)
      .eq('data_principal_hash', identifierHash)
      .eq('withdrawn', false)
      .select('id')

    if (error) {
      return NextResponse.json({ error: 'Failed to process withdrawal' }, { status: 500, headers: CORS_HEADERS })
    }

    return NextResponse.json({ success: true, withdrawn_count: data?.length || 0 }, { headers: CORS_HEADERS })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: CORS_HEADERS })
  }
}
