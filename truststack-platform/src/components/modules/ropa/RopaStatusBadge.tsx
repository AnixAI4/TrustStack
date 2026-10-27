'use client'

import type { RopaStatus } from '@/types/dpdp'

const STATUS_CONFIG: Record<RopaStatus, { label: string; className: string }> = {
  draft:    { label: 'Draft',    className: 'bg-amber-100 text-amber-700 border border-amber-200' },
  active:   { label: 'Active',   className: 'bg-green-100 text-green-700 border border-green-200' },
  archived: { label: 'Archived', className: 'bg-gray-100 text-gray-600 border border-gray-200' },
}

export function RopaStatusBadge({ status }: { status: RopaStatus }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  )
}
