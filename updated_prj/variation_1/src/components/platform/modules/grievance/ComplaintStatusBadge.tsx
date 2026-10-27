'use client'

import type { GrievanceStatus } from '@/types/dpdp'

const STATUS_CONFIG: Record<GrievanceStatus, { label: string; className: string }> = {
  new:               { label: 'New',          className: 'border border-amber/20 bg-amber/10 text-amber' },
  under_review:      { label: 'Under Review', className: 'border border-blue/20 bg-blue/10 text-blue' },
  resolved:          { label: 'Resolved',     className: 'border border-green/20 bg-green/10 text-green' },
  escalated_to_dpbi: { label: 'Escalated',    className: 'border border-red/20 bg-red/10 text-red' },
}

export function ComplaintStatusBadge({ status }: { status: GrievanceStatus }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.new
  return (
    <span className={`inline-flex items-center rounded-pill px-2.5 py-0.5 text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  )
}
