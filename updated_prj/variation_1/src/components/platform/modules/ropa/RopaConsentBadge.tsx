'use client'

import { CheckCircle2, AlertCircle, XCircle } from 'lucide-react'
import type { RopaConsentCoverage } from '@/types/dpdp'

const CONFIG: Record<RopaConsentCoverage['status'], { label: string; className: string; Icon: typeof CheckCircle2 }> = {
  configured:    { label: 'Configured',     className: 'bg-green/10 text-green', Icon: CheckCircle2 },
  missing:       { label: 'Consent gap',    className: 'bg-red/10 text-red',     Icon: XCircle },
  not_applicable: { label: 'Not applicable', className: 'bg-surface-2 text-text-muted', Icon: AlertCircle },
}

interface Props {
  coverage?: RopaConsentCoverage | null
}

export function RopaConsentBadge({ coverage }: Props) {
  if (!coverage) {
    return (
      <span className="inline-flex items-center rounded-pill bg-surface-2 px-2 py-0.5 text-xs font-medium text-text-muted">
        Not assessed
      </span>
    )
  }
  const config = CONFIG[coverage.status]
  const { Icon } = config
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-pill px-2 py-0.5 text-xs font-medium ${config.className}`}
      title={coverage.matched_purposes.length ? `Matched: ${coverage.matched_purposes.join(', ')}` : undefined}
    >
      <Icon size={12} /> {config.label}
    </span>
  )
}
