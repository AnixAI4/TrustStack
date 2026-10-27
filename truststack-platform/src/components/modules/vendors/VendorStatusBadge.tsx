'use client'

import type { VendorDpaStatus } from '@/types/dpdp'

const STATUS_CONFIG: Record<VendorDpaStatus, { label: string; className: string }> = {
  pending: { label: 'Pending',            className: 'bg-gray-100 text-gray-600 border border-gray-200' },
  sent:    { label: 'Sent for Signature', className: 'bg-blue-100 text-blue-700 border border-blue-200' },
  signed:  { label: 'Signed',             className: 'bg-green-100 text-green-700 border border-green-200' },
  expired: { label: 'Expired',            className: 'bg-red-100 text-red-700 border border-red-200' },
}

// Pass the EFFECTIVE status (see effectiveDpaStatus) so a lapsed signed DPA shows
// as Expired.
export function VendorStatusBadge({ status }: { status: VendorDpaStatus }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  )
}
