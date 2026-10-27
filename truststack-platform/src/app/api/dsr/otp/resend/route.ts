import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateOtp, hashOtp, otpExpiryIso, sendOtpEmail, maskEmail } from '@/lib/dsr/otp'

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
    const { reference_number, org_slug } = (await req.json()) as { reference_number?: string; org_slug?: string }
    if (!reference_number) {
      return NextResponse.json({ error: 'reference_number is required' }, { status: 400, headers: CORS_HEADERS })
    }

    const supabase = createAdminClient()

    // Reference numbers are unique per ORG (not globally) — scope by org slug.
    let orgId: string | null = null
    if (org_slug) {
      const { data: org } = await supabase.from('organizations').select('id').eq('slug', org_slug).maybeSingle()
      if (!org) return NextResponse.json({ error: 'Request not found' }, { status: 404, headers: CORS_HEADERS })
      orgId = org.id
    }

    let lookup = supabase
      .from('dsr_requests')
      .select('id, organization_id, reference_number, requestor_email, requestor_identity_verified')
      .eq('reference_number', reference_number.trim())
    if (orgId) lookup = lookup.eq('organization_id', orgId)
    const { data: request } = await lookup.maybeSingle()

    if (!request) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404, headers: CORS_HEADERS })
    }
    if (request.requestor_identity_verified) {
      return NextResponse.json({ success: true, already_verified: true }, { headers: CORS_HEADERS })
    }
    if (!request.requestor_email) {
      return NextResponse.json({ error: 'No email on file for this request' }, { status: 400, headers: CORS_HEADERS })
    }

    const { data: org } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', request.organization_id)
      .single()

    // Invalidate any outstanding codes, then issue a fresh one.
    await supabase
      .from('dsr_otps')
      .update({ consumed_at: new Date().toISOString() })
      .eq('dsr_request_id', request.id)
      .is('consumed_at', null)

    const code = generateOtp()
    await supabase.from('dsr_otps').insert({
      dsr_request_id: request.id,
      organization_id: request.organization_id,
      code_hash: hashOtp(code, request.id),
      expires_at: otpExpiryIso(),
    })

    const otpSent = await sendOtpEmail(request.requestor_email, code, request.reference_number, org?.name ?? 'the organization')

    return NextResponse.json(
      { success: true, otp_sent: otpSent, email_masked: maskEmail(request.requestor_email) },
      { headers: CORS_HEADERS },
    )
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: CORS_HEADERS })
  }
}
