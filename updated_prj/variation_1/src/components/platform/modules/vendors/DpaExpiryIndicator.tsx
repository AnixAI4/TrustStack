'use client'

import { Clock, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { daysUntilExpiry } from '@/lib/platform/vendors/status'
import type { VendorDpaStatus } from '@/types/dpdp'

interface Props {
  expiresAt?: string | null
  status: VendorDpaStatus
}

export function DpaExpiryIndicator({ expiresAt, status }: Props) {
  if (status === 'pending' || status === 'sent') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber">
        <Clock size={12} /> {status === 'sent' ? 'Awaiting signature' : 'Not signed'}
      </span>
    )
  }

  if (status === 'expired') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-red">
        <AlertTriangle size={12} /> Expired
      </span>
    )
  }

  if (!expiresAt) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-green">
        <CheckCircle2 size={12} /> No expiry
      </span>
    )
  }

  const days = daysUntilExpiry(expiresAt)

  if (days === null) {
    return <span className="text-xs text-text-faint">Invalid expiry date</span>
  }

  if (days <= 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-red">
        <AlertTriangle size={12} /> Expired
      </span>
    )
  }

  if (days <= 30) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber">
        <Clock size={12} /> {days}d left
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-green">
      <CheckCircle2 size={12} /> {days}d
    </span>
  )
}
