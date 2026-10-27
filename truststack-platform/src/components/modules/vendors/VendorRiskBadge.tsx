'use client'

import { VENDOR_RISK_TIERS } from '@/lib/constants'
import type { VendorRiskTier } from '@/types/dpdp'

interface Props {
  tier: VendorRiskTier | null
  score?: number | null
  showScore?: boolean
}

// Risk tier chip (low → critical). Renders a neutral "Not assessed" when the
// vendor hasn't completed the questionnaire yet.
export function VendorRiskBadge({ tier, score, showScore = false }: Props) {
  if (!tier) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500 border border-gray-200">
        Not assessed
      </span>
    )
  }
  const config = VENDOR_RISK_TIERS[tier]
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border"
      style={{ color: config.color, backgroundColor: config.bgColor, borderColor: `${config.color}33` }}
    >
      {config.label}
      {showScore && typeof score === 'number' && <span className="font-mono opacity-70">· {score}</span>}
    </span>
  )
}
