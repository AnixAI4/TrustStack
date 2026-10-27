// M7 Vendor DPA - DPA expiry helpers. CLIENT-SAFE pure date math (the analog of
// src/lib/platform/dsr/sla.ts). Expiry alerts are DERIVED at read time - there is no cron
// and nothing auto-flips dpa_status. A user may still set dpa_status='expired'
// manually; these helpers surface the "30 days before expiry" warning regardless.
import { DPA_EXPIRY_WARNING_DAYS } from '@/lib/platform/constants'
import type { Vendor, VendorDpaStatus } from '@/types/dpdp'

const MS_PER_DAY = 86_400_000

type DpaFields = Pick<Vendor, 'dpa_status' | 'dpa_expires_at'>

// Whole days until the DPA expires (negative once past). null if no expiry date.
export function daysUntilExpiry(expiresAt: string | null, now: Date = new Date()): number | null {
  if (!expiresAt) return null
  return Math.ceil((new Date(expiresAt).getTime() - now.getTime()) / MS_PER_DAY)
}

// Past the expiry date (independent of the stored dpa_status).
export function isExpired(expiresAt: string | null, now: Date = new Date()): boolean {
  if (!expiresAt) return false
  return new Date(expiresAt).getTime() < now.getTime()
}

// Within the warning window (default 30 days) and not yet past expiry.
export function isExpiringSoon(
  expiresAt: string | null,
  withinDays: number = DPA_EXPIRY_WARNING_DAYS,
  now: Date = new Date(),
): boolean {
  const d = daysUntilExpiry(expiresAt, now)
  if (d == null) return false
  return d >= 0 && d <= withinDays
}

// The status to DISPLAY: a signed DPA past its expiry reads as 'expired' even if
// the stored dpa_status hasn't been manually flipped (alerts are derived).
export function effectiveDpaStatus(v: DpaFields, now: Date = new Date()): VendorDpaStatus {
  if (v.dpa_status === 'signed' && isExpired(v.dpa_expires_at, now)) return 'expired'
  return v.dpa_status
}

// Needs attention on the dashboard: already expired, OR a signed DPA inside the
// 30-day warning window.
export function dpaNeedsAttention(v: DpaFields, now: Date = new Date()): boolean {
  if (effectiveDpaStatus(v, now) === 'expired') return true
  return v.dpa_status === 'signed' && isExpiringSoon(v.dpa_expires_at, DPA_EXPIRY_WARNING_DAYS, now)
}
