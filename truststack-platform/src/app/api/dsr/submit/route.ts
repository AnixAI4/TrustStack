import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { DSR_RIGHT_TYPES } from '@/lib/constants'
import { dueDateFrom } from '@/lib/dsr/sla'
import {
  generateOtp,
  hashOtp,
  otpExpiryIso,
  sendOtpEmail,
  maskEmail,
  hashDataPrincipal,
} from '@/lib/dsr/otp'
import type { DsrRightType } from '@/types/dpdp'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

const VALID_RIGHTS = DSR_RIGHT_TYPES.map(r => r.value) as readonly string[]
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

async function generateReferenceNumber(
  supabase: ReturnType<typeof createAdminClient>,
  organizationId: string,
): Promise<string> {
  const year = new Date().getFullYear()
  const { count } = await supabase
    .from('dsr_requests')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .gte('created_at', `${year}-01-01`)
  const sequence = String((count ?? 0) + 1).padStart(3, '0')
  return `DSR-${year}-${sequence}`
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      org_slug?: string
      right_type?: string
      requestor_name?: string
      requestor_email?: string
      requestor_phone?: string
      request_details?: string
      affected_data_categories?: unknown
      nominee_name?: string
      nominee_email?: string
      nominee_phone?: string
      relationship?: string
    }

    const {
      org_slug,
      right_type,
      requestor_name,
      requestor_email,
      requestor_phone,
      request_details,
      nominee_name,
      nominee_email,
      nominee_phone,
      relationship,
    } = body

    // --- validation ---------------------------------------------------------
    if (!org_slug) {
      return NextResponse.json({ error: 'org_slug is required' }, { status: 400, headers: CORS_HEADERS })
    }
    if (!right_type || !VALID_RIGHTS.includes(right_type)) {
      return NextResponse.json({ error: 'A valid right_type is required' }, { status: 400, headers: CORS_HEADERS })
    }
    if (!requestor_name?.trim()) {
      return NextResponse.json({ error: 'requestor_name is required' }, { status: 400, headers: CORS_HEADERS })
    }
    // Email is required: email-OTP is the identity-verification method.
    if (!requestor_email?.trim() || !EMAIL_RE.test(requestor_email.trim())) {
      return NextResponse.json({ error: 'A valid requestor_email is required for identity verification' }, { status: 400, headers: CORS_HEADERS })
    }

    const isNominate = right_type === 'nominate'
    if (isNominate) {
      if (!nominee_name?.trim() || !nominee_email?.trim() || !EMAIL_RE.test(nominee_email.trim())) {
        return NextResponse.json({ error: 'nominee_name and a valid nominee_email are required for a nomination' }, { status: 400, headers: CORS_HEADERS })
      }
    } else if (!request_details || request_details.trim().length < 10) {
      return NextResponse.json({ error: 'request_details must be at least 10 characters' }, { status: 400, headers: CORS_HEADERS })
    }

    const affected = Array.isArray(body.affected_data_categories)
      ? body.affected_data_categories.filter((c): c is string => typeof c === 'string')
      : []

    const supabase = createAdminClient()

    const { data: org } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('slug', org_slug)
      .single()

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404, headers: CORS_HEADERS })
    }

    const referenceNumber = await generateReferenceNumber(supabase, org.id)
    const nowIso = new Date().toISOString()
    const email = requestor_email.trim().toLowerCase()

    const { data: request, error: insertError } = await supabase
      .from('dsr_requests')
      .insert({
        organization_id: org.id,
        reference_number: referenceNumber,
        right_type: right_type as DsrRightType,
        requestor_name: requestor_name.trim(),
        requestor_email: email,
        requestor_phone: requestor_phone?.trim() || null,
        requestor_identity_verified: false,
        request_details: request_details?.trim() || null,
        affected_data_categories: affected.length ? affected : null,
        status: 'identity_pending',
        due_date: dueDateFrom(nowIso),
      })
      .select('id')
      .single()

    if (insertError || !request) {
      return NextResponse.json({ error: insertError?.message ?? 'Failed to create request' }, { status: 400, headers: CORS_HEADERS })
    }

    // Section 15 — also record the nomination, linked by the hashed data principal.
    if (isNominate) {
      await supabase.from('dsr_nominations').insert({
        organization_id: org.id,
        data_principal_hash: hashDataPrincipal(email, org.id),
        nominee_name: nominee_name!.trim(),
        nominee_email: nominee_email!.trim().toLowerCase(),
        nominee_phone: nominee_phone?.trim() || null,
        relationship: relationship?.trim() || null,
        active: true,
      })
    }

    // Issue + email the identity-verification OTP.
    const code = generateOtp()
    await supabase.from('dsr_otps').insert({
      dsr_request_id: request.id,
      organization_id: org.id,
      code_hash: hashOtp(code, request.id),
      expires_at: otpExpiryIso(),
    })
    const otpSent = await sendOtpEmail(email, code, referenceNumber, org.name)

    return NextResponse.json(
      {
        success: true,
        reference_number: referenceNumber,
        identity_verification_required: true,
        otp_sent: otpSent,
        email_masked: maskEmail(email),
        message: otpSent
          ? 'Request received. Check your email for a verification code.'
          : 'Request received, but we could not email a verification code right now. Use "Resend code" or contact the organization.',
      },
      { headers: CORS_HEADERS },
    )
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: CORS_HEADERS })
  }
}
