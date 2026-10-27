'use client'

import { daysUntilExpiry, effectiveDpaStatus } from '@/lib/vendors/status'
import type { VendorDpaStatus } from '@/types/dpdp'

interface Props {
  status: VendorDpaStatus
  expiresAt: string | null
  /** `pill` (default) for tables; `inline` for the detail header. */
  variant?: 'pill' | 'inline'
}

// DPA expiry countdown. Green → amber → red as expiry approaches (30-day window),
// red "Expired" once past, neutral "—" when there's no signed DPA / no date.
// Derived at read time — nothing flips dpa_status automatically.
export function DpaExpiryIndicator({ status, expiresAt, variant = 'pill' }: Props) {
  const effective = effectiveDpaStatus({ dpa_status: status, dpa_expires_at: expiresAt })

  // Only a signed (or lapsed-signed) DPA has an expiry to show.
  if (status !== 'signed' || !expiresAt) {
    if (effective === 'expired') {
      return <Chip variant={variant} tone="bg-red-50 text-red-700" text="Expired" />
    }
    return <span className="text-xs text-gray-400">—</span>
  }

  const days = daysUntilExpiry(expiresAt) ?? 0

  let text: string
  let tone: string
  if (days < 0) {
    const over = Math.abs(days)
    text = `Expired ${over} day${over !== 1 ? 's' : ''} ago`
    tone = 'bg-red-50 text-red-700'
  } else if (days === 0) {
    text = 'Expires today'
    tone = 'bg-red-50 text-red-700'
  } else if (days <= 30) {
    text = `Expires in ${days} day${days !== 1 ? 's' : ''}`
    tone = days <= 7 ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
  } else {
    text = `Expires in ${days} days`
    tone = 'bg-green-50 text-green-700'
  }

  return <Chip variant={variant} tone={tone} text={text} />
}

function Chip({ variant, tone, text }: { variant: 'pill' | 'inline'; tone: string; text: string }) {
  if (variant === 'inline') {
    return <span className={`text-sm font-medium px-3 py-1.5 rounded-full ${tone}`}>{text}</span>
  }
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${tone}`}>{text}</span>
}
