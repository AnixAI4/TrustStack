// Stateless, signed, time-limited share tokens for the public board report.
// Server-only (uses crypto + the service-role key as the HMAC secret). No table
// is needed — the token is self-contained and verified by signature + expiry.

import crypto from 'crypto'

interface SharePayload {
  o: string // organization id
  f: string // period from (ISO)
  t: string // period to (ISO)
  e: number // expiry (epoch ms)
}

function secret(): string {
  // Service-role key is server-only and always set; falls back so dev never crashes.
  return process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.ANTHROPIC_API_KEY || 'truststack-dev-secret'
}

function sign(body: string): string {
  return crypto.createHmac('sha256', secret()).update(body).digest('base64url')
}

export function signShareToken(orgId: string, fromDate: string, toDate: string, ttlMs: number): string {
  const payload: SharePayload = { o: orgId, f: fromDate, t: toDate, e: Date.now() + ttlMs }
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
    if (!payload.o || typeof payload.e !== 'number') return null
    if (Date.now() > payload.e) return null
    return payload
  } catch {
    return null
  }
}
