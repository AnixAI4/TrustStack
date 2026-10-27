'use client'

import type { BreachStatus } from '@/types/dpdp'

const STATUS_CONFIG: Record<BreachStatus, { label: string; className: string }> = {
  open:      { label: 'Open',      className: 'border border-red/20 bg-red/10 text-red' },
  contained: { label: 'Contained', className: 'border border-amber/20 bg-amber/10 text-amber' },
  resolved:  { label: 'Resolved',  className: 'border border-green/20 bg-green/10 text-green' },
}

export function BreachStatusBadge({ status }: { status: BreachStatus }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.open
  return (
    <span className={`inline-flex items-center rounded-pill px-2.5 py-0.5 text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  )
}
