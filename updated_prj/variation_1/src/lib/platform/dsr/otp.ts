// M5 DSR - email-OTP helpers. SERVER-ONLY (imports node:crypto + resend).
// Never import this from a client component.
import { createHash, randomInt } from 'crypto'
import { createClient } from '@supabase/supabase-js'

export const OTP_TTL_MS = 10 * 60 * 1000 // 10 minutes
export const OTP_MAX_ATTEMPTS = 5
export const OTP_LENGTH = 6
export const SUPABASE_OTP_MARKER = 'supabase_auth'

export type OtpDeliveryProvider = 'resend' | 'supabase'

function createPublicAuthClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }
  return createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export function buildDsrAuthRedirectUrl(orgSlug: string, referenceNumber: string): string {
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '')
  const next = `/trustdeck/public/dsr/${orgSlug}/complete?ref=${encodeURIComponent(referenceNumber)}`
  return `${appUrl}/auth/callback?next=${encodeURIComponent(next)}`
}

// Cryptographically-random zero-padded numeric OTP.
export function generateOtp(): string {
  const max = 10 ** OTP_LENGTH
  return String(randomInt(0, max)).padStart(OTP_LENGTH, '0')
}

// Hash the OTP salted with the request id, so a leaked dsr_otps row can't be
// brute-matched to a code without also knowing which request it belongs to.
export function hashOtp(code: string, requestId: string): string {
  return createHash('sha256').update(`${requestId}:${code}`).digest('hex')
}

export function isSupabaseOtpDelivery(codeHash: string): boolean {
  return codeHash === SUPABASE_OTP_MARKER
}

// Hash a data principal's identifier (email), org-salted - used to correlate a
// nomination row with its dsr_requests row (mirrors the consent-record hashing).
export function hashDataPrincipal(identifier: string, organizationId: string): string {
  return createHash('sha256').update(`${organizationId}:${identifier.trim().toLowerCase()}`).digest('hex')
}

export function otpExpiryIso(now: Date = new Date()): string {
  return new Date(now.getTime() + OTP_TTL_MS).toISOString()
}

// Mask an email for display in API responses ("ab***@example.com").
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!domain) return email
  const shown = local.slice(0, 2)
  return `${shown}${'*'.repeat(Math.max(1, local.length - 2))}@${domain}`
}

async function sendOtpViaResend(
  to: string,
  code: string,
  referenceNumber: string,
  orgName: string,
): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) return false
  try {
    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)
    const { error } = await resend.emails.send({
      from: 'TrustStack™ <noreply@anixai.io>',
      to,
      subject: `Your verification code - ${referenceNumber}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
          <h2 style="color:#E2620A">Verify your identity</h2>
          <p>You (or someone using your email) submitted a data rights request to ${orgName}.
             To protect your personal data, please verify your identity using the code below.</p>
          <div style="text-align:center;margin:24px 0">
            <div style="display:inline-block;background:#D6E4F0;border-radius:12px;padding:16px 28px">
              <span style="font-family:monospace;font-size:32px;font-weight:700;letter-spacing:8px;color:#E2620A">${code}</span>
            </div>
          </div>
          <p style="color:#6B7280;font-size:14px">This code expires in 10 minutes. Your request reference is
             <strong style="font-family:monospace">${referenceNumber}</strong>.</p>
          <p style="color:#6B7280;font-size:14px">If you did not make this request, you can safely ignore this email - no request will be processed without this code.</p>
          <hr style="border:none;border-top:1px solid #E5E7EB;margin:20px 0" />
          <p style="color:#9CA3AF;font-size:12px">Sent via TrustStack™ - DPDP compliance for ${orgName}.</p>
        </div>
      `,
    })
    if (error) {
      console.error('[DSR] OTP email error:', error)
      return false
    }
    return true
  } catch (e) {
    console.error('[DSR] OTP email exception:', e)
    return false
  }
}

// Uses Supabase Auth email — magic link by default; numeric code if Email OTP is enabled.
export async function sendOtpViaSupabaseAuth(
  email: string,
  referenceNumber: string,
  orgName: string,
  orgSlug: string,
): Promise<boolean> {
  try {
    const supabase = createPublicAuthClient()
    const redirectTo = buildDsrAuthRedirectUrl(orgSlug, referenceNumber)
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        shouldCreateUser: true,
        emailRedirectTo: redirectTo,
        data: {
          purpose: 'dsr_verification',
          dsr_reference: referenceNumber,
          org_slug: orgSlug,
          org_name: orgName,
        },
      },
    })
    if (error) {
      console.error('[DSR] Supabase Auth OTP send error:', error.message)
      return false
    }
    return true
  } catch (e) {
    console.error('[DSR] Supabase Auth OTP send exception:', e)
    return false
  }
}

export async function verifySupabaseAuthOtp(
  email: string,
  code: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const supabase = createPublicAuthClient()
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: code.trim(),
      type: 'email',
    })
    if (error) {
      const msg = error.message.toLowerCase()
      if (msg.includes('expired')) {
        return { ok: false, message: 'This code has expired. Please request a new one.' }
      }
      return { ok: false, message: 'Incorrect code.' }
    }
    return { ok: true }
  } catch {
    return { ok: false, message: 'Verification failed. Please try again.' }
  }
}

// Prefer Resend (branded) when configured; otherwise Supabase Auth email.
export async function deliverDsrVerificationOtp(params: {
  email: string
  referenceNumber: string
  orgName: string
  orgSlug: string
}): Promise<{ sent: boolean; provider: OtpDeliveryProvider | null; code?: string }> {
  if (process.env.RESEND_API_KEY) {
    const code = generateOtp()
    const sent = await sendOtpViaResend(params.email, code, params.referenceNumber, params.orgName)
    return { sent, provider: sent ? 'resend' : null, code }
  }

  const sent = await sendOtpViaSupabaseAuth(
    params.email,
    params.referenceNumber,
    params.orgName,
    params.orgSlug,
  )
  return { sent, provider: sent ? 'supabase' : null }
}

/** @deprecated Use deliverDsrVerificationOtp */
export async function sendOtpEmail(
  to: string,
  code: string,
  referenceNumber: string,
  orgName: string,
): Promise<boolean> {
  return sendOtpViaResend(to, code, referenceNumber, orgName)
}

// Notify the org's Grievance Officer (the DPDP §14 contact / DPO) that a new,
// identity-verified data rights request has landed. Best-effort - the caller
// must not let a failure here block verification.
export async function sendDpoNewRequestEmail(
  to: string,
  opts: { referenceNumber: string; rightLabel: string; requestorName: string; orgName: string },
): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) return false
  try {
    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)
    const { error } = await resend.emails.send({
      from: 'TrustStack™ <noreply@anixai.io>',
      to,
      subject: `New data rights request - ${opts.referenceNumber}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
          <h2 style="color:#E2620A">New Data Rights Request</h2>
          <p>A data principal has submitted a request via ${opts.orgName}'s DSR portal.</p>
          <table style="border-collapse:collapse;width:100%;margin:16px 0">
            <tr><td style="padding:8px;font-weight:600;color:#6B7280;width:140px">Reference</td><td style="padding:8px;font-family:monospace;font-weight:700">${opts.referenceNumber}</td></tr>
            <tr style="background:#F9FAFB"><td style="padding:8px;font-weight:600;color:#6B7280">Right</td><td style="padding:8px">${opts.rightLabel}</td></tr>
            <tr><td style="padding:8px;font-weight:600;color:#6B7280">From</td><td style="padding:8px">${opts.requestorName}</td></tr>
          </table>
          <p>You must respond within <strong>30 days</strong> as required under the DPDP Act.</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/trustdeck/dsr/requests" style="display:inline-block;padding:12px 24px;background:#E2620A;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;margin-top:8px">
            Review Request in TrustStack™
          </a>
        </div>
      `,
    })
    if (error) {
      console.error('[DSR] DPO email error:', error)
      return false
    }
    return true
  } catch (e) {
    console.error('[DSR] DPO email exception:', e)
    return false
  }
}
