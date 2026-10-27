'use client'

import type { RopaStatus } from '@/types/dpdp'

const STATUS_CONFIG: Record<RopaStatus, { label: string; className: string }> = {
  draft:    { label: 'Draft',    className: 'bg-surface-2 text-text-muted border border-line' },
  active:   { label: 'Active',   className: 'border border-green/20 bg-green/10 text-green' },
  archived: { label: 'Archived', className: 'border border-amber/20 bg-amber/10 text-amber' },
}

export function RopaStatusBadge({ status }: { status: RopaStatus }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft
  return (
    <span className={`inline-flex items-center rounded-pill px-2.5 py-0.5 text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  )
}
