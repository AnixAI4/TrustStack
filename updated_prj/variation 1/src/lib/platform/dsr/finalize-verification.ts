import type { SupabaseClient } from '@supabase/supabase-js'
import { DSR_RIGHT_TYPES } from '@/lib/platform/constants'
import { sendDpoNewRequestEmail } from '@/lib/platform/dsr/otp'

type DsrRequestRow = {
  id: string
  organization_id: string
  reference_number: string
  right_type: string
  requestor_name: string
  requestor_email: string | null
  requestor_identity_verified: boolean
  status?: string
}

export function parseDsrCompleteNext(
  next: string,
): { orgSlug: string; reference: string } | null {
  const path = next.startsWith('/') ? next : `/${next}`
  const match = path.match(/^\/trustdeck\/public\/dsr\/([^/]+)\/complete(?:\?|$)/)
  if (!match) return null
  const ref = new URL(path, 'http://localhost').searchParams.get('ref')?.trim()
  if (!ref) return null
  return { orgSlug: decodeURIComponent(match[1]), reference: ref }
}

export async function finalizeDsrMagicLink(
  supabase: SupabaseClient,
  email: string,
  orgSlug: string,
  referenceNumber: string,
): Promise<'verified' | 'already' | 'not_found' | 'email_mismatch' | 'not_pending'> {
  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .eq('slug', orgSlug)
    .maybeSingle()
  if (!org) return 'not_found'

  const { data: request } = await supabase
    .from('dsr_requests')
    .select(
      'id, organization_id, reference_number, right_type, requestor_name, requestor_email, requestor_identity_verified, status',
    )
    .eq('organization_id', org.id)
    .eq('reference_number', referenceNumber.trim())
    .maybeSingle()

  if (!request) return 'not_found'
  if (request.requestor_email?.trim().toLowerCase() !== email.trim().toLowerCase()) {
    return 'email_mismatch'
  }
  if (request.requestor_identity_verified) return 'already'
  if (request.status !== 'identity_pending') return 'not_pending'

  await finalizeDsrIdentityVerification(supabase, request as DsrRequestRow)
  return 'verified'
}

export async function finalizeDsrIdentityVerification(
  supabase: SupabaseClient,
  request: DsrRequestRow,
  otpRowId?: string,
): Promise<void> {
  if (request.requestor_identity_verified) return

  if (otpRowId) {
    await supabase
      .from('dsr_otps')
      .update({ consumed_at: new Date().toISOString() })
      .eq('id', otpRowId)
  } else {
    await supabase
      .from('dsr_otps')
      .update({ consumed_at: new Date().toISOString() })
      .eq('dsr_request_id', request.id)
      .is('consumed_at', null)
  }

  await supabase
    .from('dsr_requests')
    .update({
      requestor_identity_verified: true,
      verification_method: 'email_otp',
      status: 'received',
      updated_at: new Date().toISOString(),
    })
    .eq('id', request.id)

  try {
    const [{ data: officer }, { data: org }] = await Promise.all([
      supabase
        .from('grievance_officers')
        .select('email')
        .eq('organization_id', request.organization_id)
        .eq('active', true)
        .maybeSingle(),
      supabase.from('organizations').select('name').eq('id', request.organization_id).single(),
    ])
    if (officer?.email) {
      const rightLabel =
        DSR_RIGHT_TYPES.find(r => r.value === request.right_type)?.label ?? request.right_type
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
}
