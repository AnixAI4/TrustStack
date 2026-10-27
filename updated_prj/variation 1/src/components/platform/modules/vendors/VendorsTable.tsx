'use client'

import Link from 'next/link'
import { ChevronRight, Building2 } from 'lucide-react'
import { VendorStatusBadge } from './VendorStatusBadge'
import { VendorRiskBadge } from './VendorRiskBadge'
import { DpaExpiryIndicator } from './DpaExpiryIndicator'
import { ModuleEmptyState } from '@/components/platform/ui/ModuleStatGrid'
import { VENDOR_TYPES } from '@/lib/platform/constants'
import { dpaNeedsAttention, effectiveDpaStatus } from '@/lib/platform/vendors/status'
import type { Vendor } from '@/types/dpdp'

interface Props {
  vendors: Vendor[]
  loading?: boolean
}

function typeLabel(v: string): string {
  return VENDOR_TYPES.find(t => t.value === v)?.label ?? v
}

export function VendorsTable({ vendors, loading }: Props) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 bg-surface-2 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  if (vendors.length === 0) {
    return (
      <ModuleEmptyState
        icon={<Building2 className="h-5 w-5" />}
        title="No vendors registered"
        description="Add a vendor or pick from the library using the actions above."
      />
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="module-table w-full text-sm">
        <thead>
          <tr className="border-b border-line">
            <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider py-3 pr-4">Vendor</th>
            <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider py-3 pr-4">Type</th>
            <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider py-3 pr-4">Risk</th>
            <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider py-3 pr-4">DPA Status</th>
            <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider py-3 pr-4">Expiry</th>
            <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider py-3">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {vendors.map(v => {
            const flag = dpaNeedsAttention(v)
            const status = effectiveDpaStatus(v)
            return (
              <tr key={v.id} className={`transition-colors ${flag ? 'bg-amber/8 hover:bg-amber/12' : 'hover:bg-glass'}`}>
                <td className="py-3 pr-4 text-text font-medium">{v.name}</td>
                <td className="py-3 pr-4 text-text-muted">{typeLabel(v.vendor_type)}</td>
                <td className="py-3 pr-4"><VendorRiskBadge risk={v.risk_tier} /></td>
                <td className="py-3 pr-4"><VendorStatusBadge status={status} /></td>
                <td className="py-3 pr-4"><DpaExpiryIndicator expiresAt={v.dpa_expires_at} status={status} /></td>
                <td className="py-3">
                  <Link href={`/trustdeck/vendors/${v.id}`} className="inline-flex items-center text-accent hover:text-accent font-medium">
                    View <ChevronRight size={14} />
                  </Link>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
