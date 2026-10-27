import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/platform/supabase/admin'
import {
  hashOtp,
  OTP_MAX_ATTEMPTS,
  isSupabaseOtpDelivery,
  verifySupabaseAuthOtp,
} from '@/lib/platform/dsr/otp'
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
    const { reference_number, code, org_slug } = (await req.json()) as {
      reference_number?: string
      code?: string
      org_slug?: string
    }

    if (!reference_number || !code) {
      return NextResponse.json({ error: 'reference_number and code are required' }, { status: 400, headers: CORS_HEADERS })
    }

    const supabase = createAdminClient()

    // Reference numbers are unique per ORG (not globally), so scope the lookup by
    // the org slug the public portal already knows.
    let orgId: string | null = null
    if (org_slug) {
      const { data: org } = await supabase.from('organizations').select('id').eq('slug', org_slug).maybeSingle()
      if (!org) return NextResponse.json({ error: 'Request not found' }, { status: 404, headers: CORS_HEADERS })
      orgId = org.id
    }

    let lookup = supabase
      .from('dsr_requests')
      .select('id, status, requestor_identity_verified, organization_id, reference_number, right_type, requestor_name, requestor_email')
      .eq('reference_number', reference_number.trim())
    if (orgId) lookup = lookup.eq('organization_id', orgId)
    const { data: request } = await lookup.maybeSingle()

    if (!request) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404, headers: CORS_HEADERS })
    }

    if (request.requestor_identity_verified) {
      return NextResponse.json({ success: true, verified: true, already: true }, { headers: CORS_HEADERS })
    }

    const { data: otp } = await supabase
      .from('dsr_otps')
      .select('*')
      .eq('dsr_request_id', request.id)
      .is('consumed_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!otp) {
      return NextResponse.json({ error: 'No active verification code. Please request a new one.' }, { status: 400, headers: CORS_HEADERS })
    }
    if (new Date(otp.expires_at).getTime() < Date.now()) {
      return NextResponse.json({ error: 'This code has expired. Please request a new one.' }, { status: 400, headers: CORS_HEADERS })
    }
    if (otp.attempts >= OTP_MAX_ATTEMPTS) {
      return NextResponse.json({ error: 'Too many incorrect attempts. Please request a new code.' }, { status: 429, headers: CORS_HEADERS })
    }

    let verified = false

    if (isSupabaseOtpDelivery(otp.code_hash)) {
      if (!request.requestor_email) {
        return NextResponse.json({ error: 'No email on file for this request' }, { status: 400, headers: CORS_HEADERS })
      }
      const result = await verifySupabaseAuthOtp(request.requestor_email, code.trim())
      if (!result.ok) {
        const attempts = otp.attempts + 1
        await supabase.from('dsr_otps').update({ attempts }).eq('id', otp.id)
        const remaining = Math.max(0, OTP_MAX_ATTEMPTS - attempts)
        const suffix =
          remaining > 0 && !result.message.includes('expired')
            ? ` ${remaining} attempt${remaining !== 1 ? 's' : ''} left.`
            : result.message.includes('expired')
              ? ''
              : ' Please request a new code.'
        return NextResponse.json(
          { error: `${result.message}${suffix}` },
          { status: 400, headers: CORS_HEADERS },
        )
      }
      verified = true
    } else {
      const matches = hashOtp(code.trim(), request.id) === otp.code_hash
      if (!matches) {
        const attempts = otp.attempts + 1
        await supabase.from('dsr_otps').update({ attempts }).eq('id', otp.id)
        const remaining = Math.max(0, OTP_MAX_ATTEMPTS - attempts)
        return NextResponse.json(
          { error: `Incorrect code.${remaining > 0 ? ` ${remaining} attempt${remaining !== 1 ? 's' : ''} left.` : ' Please request a new code.'}` },
          { status: 400, headers: CORS_HEADERS },
        )
      }
      verified = true
    }

    if (!verified) {
      return NextResponse.json({ error: 'Verification failed' }, { status: 400, headers: CORS_HEADERS })
    }

    // Success - consume the OTP and move the request out of identity_pending.
    await finalizeDsrIdentityVerification(supabase, request, otp.id)

    return NextResponse.json({ success: true, verified: true }, { headers: CORS_HEADERS })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: CORS_HEADERS })
  }
}
