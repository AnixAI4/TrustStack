import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { hashOtp, OTP_MAX_ATTEMPTS, sendDpoNewRequestEmail } from '@/lib/dsr/otp'
import { DSR_RIGHT_TYPES } from '@/lib/constants'

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
      .select('id, status, requestor_identity_verified, organization_id, reference_number, right_type, requestor_name')
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

    // Success — consume the OTP and move the request out of identity_pending.
    await supabase.from('dsr_otps').update({ consumed_at: new Date().toISOString() }).eq('id', otp.id)
    await supabase
      .from('dsr_requests')
      .update({
        requestor_identity_verified: true,
        verification_method: 'email_otp',
        status: 'received',
        updated_at: new Date().toISOString(),
      })
      .eq('id', request.id)

    // Notify the org's active Grievance Officer (DPDP §14 contact / DPO) that a
    // new, verified request has landed — best-effort, never blocks verification.
    try {
      const [{ data: officer }, { data: org }] = await Promise.all([
        supabase.from('grievance_officers').select('email').eq('organization_id', request.organization_id).eq('active', true).maybeSingle(),
        supabase.from('organizations').select('name').eq('id', request.organization_id).single(),
      ])
      if (officer?.email) {
        const rightLabel = DSR_RIGHT_TYPES.find(r => r.value === request.right_type)?.label ?? request.right_type
        await sendDpoNewRequestEmail(officer.email, {
          referenceNumber: request.reference_number,
          rightLabel,
          requestorName: request.requestor_name,
          orgName: org?.name ?? 'your organization',
        })
      }
    } catch (e) {
      console.error('[DSR] DPO notification failed:', e)
    }

    return NextResponse.json({ success: true, verified: true }, { headers: CORS_HEADERS })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: CORS_HEADERS })
  }
}
