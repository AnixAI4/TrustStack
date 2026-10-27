// M5 DSR — email-OTP helpers. SERVER-ONLY (imports node:crypto + resend).
// Never import this from a client component.
import { createHash, randomInt } from 'crypto'

export const OTP_TTL_MS = 10 * 60 * 1000 // 10 minutes
export const OTP_MAX_ATTEMPTS = 5
export const OTP_LENGTH = 6

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

// Hash a data principal's identifier (email), org-salted — used to correlate a
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

// Send the OTP via Resend. Returns true on success, false if email isn't
// configured or the send failed (caller decides how to surface that).
export async function sendOtpEmail(
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
      // anixai.io is verified in Resend; switch to truststack.in once verified.
      from: 'TrustStack™ <noreply@anixai.io>',
      to,
      subject: `Your verification code — ${referenceNumber}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
          <h2 style="color:#003366">Verify your identity</h2>
          <p>You (or someone using your email) submitted a data rights request to ${orgName}.
             To protect your personal data, please verify your identity using the code below.</p>
          <div style="text-align:center;margin:24px 0">
            <div style="display:inline-block;background:#D6E4F0;border-radius:12px;padding:16px 28px">
              <span style="font-family:monospace;font-size:32px;font-weight:700;letter-spacing:8px;color:#003366">${code}</span>
            </div>
          </div>
          <p style="color:#6B7280;font-size:14px">This code expires in 10 minutes. Your request reference is
             <strong style="font-family:monospace">${referenceNumber}</strong>.</p>
          <p style="color:#6B7280;font-size:14px">If you did not make this request, you can safely ignore this email —
             no request will be processed without this code.</p>
          <hr style="border:none;border-top:1px solid #E5E7EB;margin:20px 0" />
          <p style="color:#9CA3AF;font-size:12px">Sent via TrustStack™ — DPDP compliance for ${orgName}.</p>
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

// Notify the org's Grievance Officer (the DPDP §14 contact / DPO) that a new,
// identity-verified data rights request has landed. Best-effort — the caller
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
      subject: `New data rights request — ${opts.referenceNumber}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
          <h2 style="color:#003366">New Data Rights Request</h2>
          <p>An identity-verified data principal has submitted a request via ${opts.orgName}'s DSR portal.</p>
          <table style="border-collapse:collapse;width:100%;margin:16px 0">
            <tr><td style="padding:8px;font-weight:600;color:#6B7280;width:140px">Reference</td><td style="padding:8px;font-family:monospace;font-weight:700">${opts.referenceNumber}</td></tr>
            <tr style="background:#F9FAFB"><td style="padding:8px;font-weight:600;color:#6B7280">Right</td><td style="padding:8px">${opts.rightLabel}</td></tr>
            <tr><td style="padding:8px;font-weight:600;color:#6B7280">From</td><td style="padding:8px">${opts.requestorName}</td></tr>
          </table>
          <p>You must respond within <strong>30 days</strong> as required under the DPDP Act.</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/dsr/requests" style="display:inline-block;padding:12px 24px;background:#003366;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;margin-top:8px">
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
