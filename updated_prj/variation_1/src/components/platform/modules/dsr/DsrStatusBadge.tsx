'use client'

import type { DsrStatus } from '@/types/dpdp'

const STATUS_CONFIG: Record<DsrStatus, { label: string; className: string }> = {
  received:         { label: 'Received',         className: 'border border-amber/20 bg-amber/10 text-amber' },
  identity_pending: { label: 'Verify Identity',  className: 'border border-blue/20 bg-blue/10 text-blue' },
  processing:       { label: 'Processing',       className: 'border border-blue/20 bg-blue/10 text-blue' },
  fulfilled:        { label: 'Fulfilled',        className: 'border border-green/20 bg-green/10 text-green' },
  denied:           { label: 'Denied',           className: 'bg-surface-2 text-text-muted border border-line' },
  overdue:          { label: 'Overdue',          className: 'border border-red/20 bg-red/10 text-red' },
}

export function DsrStatusBadge({ status }: { status: DsrStatus }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.received
  return (
    <span className={`inline-flex items-center rounded-pill px-2.5 py-0.5 text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  )
}
