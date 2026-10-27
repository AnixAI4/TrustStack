'use client'

import type { VendorDpaStatus } from '@/types/dpdp'

const STATUS_CONFIG: Record<VendorDpaStatus, { label: string; className: string }> = {
  pending:    { label: 'Pending',     className: 'border border-amber/20 bg-amber/10 text-amber' },
  sent:       { label: 'Sent',        className: 'border border-blue/20 bg-blue/10 text-blue' },
  signed:     { label: 'Signed',      className: 'border border-green/20 bg-green/10 text-green' },
  expired:    { label: 'Expired',     className: 'border border-red/20 bg-red/10 text-red' },
}

export function VendorStatusBadge({ status }: { status: VendorDpaStatus }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending
  return (
    <span className={`inline-flex items-center rounded-pill px-2.5 py-0.5 text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  )
}
