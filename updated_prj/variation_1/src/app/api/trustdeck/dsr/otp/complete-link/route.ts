import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/platform/supabase/admin'
import { finalizeDsrIdentityVerification } from '@/lib/platform/dsr/finalize-verification'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

export async function POST(req: Request) {
  try {
    const { reference_number, org_slug } = (await req.json()) as {
      reference_number?: string
      org_slug?: string
    }

    if (!reference_number?.trim()) {
      return NextResponse.json({ error: 'reference_number is required' }, { status: 400, headers: CORS_HEADERS })
    }

    const sessionClient = await createClient()
    const {
      data: { user },
    } = await sessionClient.auth.getUser()

    if (!user?.email) {
      return NextResponse.json(
        { error: 'Sign-in link verification did not complete. Open the link from your email again.' },
        { status: 401, headers: CORS_HEADERS },
      )
    }

    const admin = createAdminClient()
    let orgId: string | null = null
    if (org_slug) {
      const { data: org } = await admin.from('organizations').select('id').eq('slug', org_slug).maybeSingle()
      if (!org) {
        return NextResponse.json({ error: 'Request not found' }, { status: 404, headers: CORS_HEADERS })
      }
      orgId = org.id
    }

    let lookup = admin
      .from('dsr_requests')
      .select('id, organization_id, reference_number, right_type, requestor_name, requestor_email, requestor_identity_verified, status')
      .eq('reference_number', reference_number.trim())
    if (orgId) lookup = lookup.eq('organization_id', orgId)
    const { data: request } = await lookup.maybeSingle()

    if (!request) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404, headers: CORS_HEADERS })
    }

    if (request.requestor_email?.trim().toLowerCase() !== user.email.trim().toLowerCase()) {
      return NextResponse.json(
        { error: 'This verification link does not match the email on the request.' },
        { status: 403, headers: CORS_HEADERS },
      )
    }

    if (request.requestor_identity_verified) {
      await sessionClient.auth.signOut()
      return NextResponse.json({ success: true, verified: true, already: true }, { headers: CORS_HEADERS })
    }

    if (request.status !== 'identity_pending') {
      return NextResponse.json({ error: 'This request is no longer awaiting verification.' }, { status: 400, headers: CORS_HEADERS })
    }

    await finalizeDsrIdentityVerification(admin, request)
    await sessionClient.auth.signOut()

    return NextResponse.json({ success: true, verified: true }, { headers: CORS_HEADERS })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: CORS_HEADERS })
  }
}
