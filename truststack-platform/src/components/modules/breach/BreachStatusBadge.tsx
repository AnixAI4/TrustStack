'use client'

import type { BreachStatus } from '@/types/dpdp'

const STATUS_CONFIG: Record<BreachStatus, { label: string; className: string }> = {
  open:      { label: 'Open',      className: 'bg-red-100 text-red-700 border border-red-200' },
  contained: { label: 'Contained', className: 'bg-amber-100 text-amber-700 border border-amber-200' },
  resolved:  { label: 'Resolved',  className: 'bg-green-100 text-green-700 border border-green-200' },
}

export function BreachStatusBadge({ status }: { status: BreachStatus }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.open
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  )
}
