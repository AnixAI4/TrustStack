'use client'

import Link from 'next/link'
import { ChevronRight, MapPin, ClipboardCheck, ClipboardX } from 'lucide-react'
import { VendorStatusBadge } from './VendorStatusBadge'
import { VendorRiskBadge } from './VendorRiskBadge'
import { DpaExpiryIndicator } from './DpaExpiryIndicator'
import { VENDOR_TYPES } from '@/lib/constants'
import { dpaNeedsAttention, effectiveDpaStatus } from '@/lib/vendors/status'
import type { Vendor } from '@/types/dpdp'

interface Props {
  vendors: Vendor[]
  loading?: boolean
}

function typeLabel(value: string): string {
  return VENDOR_TYPES.find(t => t.value === value)?.label ?? value
}

export function VendorsTable({ vendors, loading }: Props) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  if (vendors.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 border border-gray-100 rounded-xl">
        <p className="text-gray-700 font-medium">No vendors yet</p>
        <p className="text-sm text-gray-500 mt-1">Add a vendor manually or pick one from the pre-assessed India library.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 pr-4">Vendor</th>
            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 pr-4">Type</th>
            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 pr-4">Risk</th>
            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 pr-4">DPA</th>
            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 pr-4">Expiry</th>
            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 pr-4">Questionnaire</th>
            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {vendors.map(v => {
            const attention = dpaNeedsAttention(v)
            return (
              <tr key={v.id} className={`transition-colors ${attention ? 'bg-red-50/50 hover:bg-red-50' : 'hover:bg-gray-50'}`}>
                <td className="py-3 pr-4">
                  <div className="font-medium text-[#1A1A2E]">{v.name}</div>
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    {v.india_data_residency
                      ? <><MapPin size={11} className="text-green-500" /> India</>
                      : <><MapPin size={11} className="text-gray-300" /> {(v.data_location ?? []).join(', ') || 'Location unknown'}</>}
                  </div>
                </td>
                <td className="py-3 pr-4 text-gray-600 whitespace-nowrap">{typeLabel(v.vendor_type)}</td>
                <td className="py-3 pr-4"><VendorRiskBadge tier={v.risk_tier} score={v.risk_score} showScore /></td>
                <td className="py-3 pr-4"><VendorStatusBadge status={effectiveDpaStatus(v)} /></td>
                <td className="py-3 pr-4"><DpaExpiryIndicator status={v.dpa_status} expiresAt={v.dpa_expires_at} /></td>
                <td className="py-3 pr-4">
                  {v.questionnaire_completed
                    ? <span className="inline-flex items-center gap-1 text-xs text-green-600"><ClipboardCheck size={13} /> Completed</span>
                    : <span className="inline-flex items-center gap-1 text-xs text-gray-400"><ClipboardX size={13} /> Pending</span>}
                </td>
                <td className="py-3">
                  <Link
                    href={`/dashboard/vendors/${v.id}`}
                    className="inline-flex items-center text-[#003366] hover:text-[#1A5276] font-medium"
                  >
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
