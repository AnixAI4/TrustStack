'use client'

import type { GrievanceStatus } from '@/types/dpdp'

const STATUS_CONFIG: Record<GrievanceStatus, { label: string; className: string }> = {
  new:               { label: 'New',               className: 'bg-red-100 text-red-700 border border-red-200' },
  under_review:      { label: 'Under Review',       className: 'bg-amber-100 text-amber-700 border border-amber-200' },
  resolved:          { label: 'Resolved',           className: 'bg-green-100 text-green-700 border border-green-200' },
  escalated_to_dpbi: { label: 'Escalated to DPBI', className: 'bg-purple-100 text-purple-700 border border-purple-200' },
}

export function ComplaintStatusBadge({ status }: { status: GrievanceStatus }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.new
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  )
}
