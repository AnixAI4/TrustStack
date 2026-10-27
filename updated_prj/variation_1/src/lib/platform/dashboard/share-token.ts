// Stateless, signed, time-limited share tokens for the public board report.
// Server-only. No table is needed - the token is self-contained and verified
// by a strong HMAC signature plus expiry.

import crypto from 'crypto'
import { getTrustDeckTokenSecret } from '@/lib/platform/security/token-secret'

interface SharePayload {
  o: string // organization id
  u: string // assessment owner user id
  f: string // period from (ISO)
  t: string // period to (ISO)
  e: number // expiry (epoch ms)
}

function sign(body: string): string {
  return crypto.createHmac('sha256', getTrustDeckTokenSecret()).update(body).digest('base64url')
}

export function signShareToken(orgId: string, userId: string, fromDate: string, toDate: string, ttlMs: number): string {
  const payload: SharePayload = { o: orgId, u: userId, f: fromDate, t: toDate, e: Date.now() + ttlMs }
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  return `${body}.${sign(body)}`
}

export function verifyShareToken(token: string): SharePayload | null {
  const parts = token.split('.')
  if (parts.length !== 2) return null
  const [body, sig] = parts

  const expected = sign(body)
  if (sig.length !== expected.length) return null
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString()) as SharePayload
    if (!payload.o || !payload.u || typeof payload.e !== 'number') return null
    if (Date.now() > payload.e) return null
    return payload
  } catch {
    return null
  }
}
