'use client'

import type { DsrStatus } from '@/types/dpdp'

const STATUS_CONFIG: Record<DsrStatus, { label: string; className: string }> = {
  received:         { label: 'Received',              className: 'bg-blue-100 text-blue-700 border border-blue-200' },
  identity_pending: { label: 'Awaiting Verification', className: 'bg-amber-100 text-amber-700 border border-amber-200' },
  processing:       { label: 'Processing',            className: 'bg-indigo-100 text-indigo-700 border border-indigo-200' },
  fulfilled:        { label: 'Fulfilled',             className: 'bg-green-100 text-green-700 border border-green-200' },
  denied:           { label: 'Denied',                className: 'bg-gray-100 text-gray-600 border border-gray-200' },
  overdue:          { label: 'Overdue',               className: 'bg-red-100 text-red-700 border border-red-200' },
}

export function DsrStatusBadge({ status }: { status: DsrStatus }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.received
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  )
}
