'use client'

import { CheckCircle2, AlertCircle, MinusCircle } from 'lucide-react'
import type { RopaConsentCoverage } from '@/types/dpdp'

// ROPA ↔ Consent cross-reference badge (note #6). Coverage is computed at read
// time by the API; 'not_applicable' = the activity isn't consent-based.
export function RopaConsentBadge({ coverage }: { coverage?: RopaConsentCoverage }) {
  if (!coverage || coverage.status === 'not_applicable') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-gray-400" title="Not a consent-based activity">
        <MinusCircle size={13} /> N/A
      </span>
    )
  }
  if (coverage.status === 'configured') {
    return (
      <span
        className="inline-flex items-center gap-1 text-xs text-green-600"
        title={coverage.matched_purposes.length ? `Matched: ${coverage.matched_purposes.join(', ')}` : 'Consent purpose configured'}
      >
        <CheckCircle2 size={13} /> Configured
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs text-red-600" title="No matching consent purpose found">
      <AlertCircle size={13} /> Missing
    </span>
  )
}
