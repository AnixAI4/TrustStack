'use client'

import { AlertTriangle, AlertCircle, Info } from 'lucide-react'
import { VENDOR_RISK_TIERS } from '@/lib/platform/constants'
import type { VendorRiskTier } from '@/types/dpdp'

const CONFIG: Record<VendorRiskTier, { className: string; Icon: typeof AlertTriangle }> = {
  critical: { className: 'border border-red/25 bg-red/15 text-red', Icon: AlertTriangle },
  high:   { className: 'border border-red/20 bg-red/10 text-red', Icon: AlertTriangle },
  medium: { className: 'border border-amber/20 bg-amber/10 text-amber', Icon: AlertCircle },
  low:    { className: 'border border-green/20 bg-green/10 text-green', Icon: Info },
}

interface Props {
  risk?: VendorRiskTier | null
}

export function VendorRiskBadge({ risk }: Props) {
  if (!risk) {
    return (
      <span className="inline-flex items-center rounded-pill bg-surface-2 px-2 py-0.5 text-xs font-medium text-text-muted">
        Not assessed
      </span>
    )
  }
  const tierInfo = VENDOR_RISK_TIERS[risk]
  const config = CONFIG[risk] ?? CONFIG.low
  const { Icon } = config
  return (
    <span className={`inline-flex items-center gap-1 rounded-pill px-2 py-0.5 text-xs font-medium ${config.className}`}>
      <Icon size={12} /> {tierInfo?.label ?? risk}
    </span>
  )
}
