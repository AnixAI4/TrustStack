// M7 Vendor DPA - stateless, signed, time-limited tokens for the PUBLIC vendor
// questionnaire link (no vendor login, no DB table). Server-only: uses a strong
// HMAC secret. Copied from the M9 board share-token
// pattern (src/lib/platform/dashboard/share-token.ts). The token embeds the vendor + org
// ids and an expiry; it is verified by signature + expiry alone.
import crypto from 'crypto'
import { getTrustDeckTokenSecret } from '@/lib/platform/security/token-secret'

interface QuestionnairePayload {
  v: string // vendor id
  o: string // organization id
  e: number // expiry (epoch ms)
}

// Default validity of an emailed questionnaire link.
export const QUESTIONNAIRE_TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 days

function sign(body: string): string {
  return crypto.createHmac('sha256', getTrustDeckTokenSecret()).update(body).digest('base64url')
}

export function signQuestionnaireToken(
  vendorId: string,
  orgId: string,
  ttlMs: number = QUESTIONNAIRE_TTL_MS,
): string {
  const payload: QuestionnairePayload = { v: vendorId, o: orgId, e: Date.now() + ttlMs }
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  return `${body}.${sign(body)}`
}

export function verifyQuestionnaireToken(token: string): QuestionnairePayload | null {
  const parts = token.split('.')
  if (parts.length !== 2) return null
  const [body, sig] = parts

  const expected = sign(body)
  if (sig.length !== expected.length) return null
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString()) as QuestionnairePayload
    if (!payload.v || !payload.o || typeof payload.e !== 'number') return null
    if (Date.now() > payload.e) return null
    return payload
  } catch {
    return null
  }
}
