'use client'

import { DATA_CATEGORIES, DPDP_BASES } from '@/lib/constants'
import type { NoticePurposeMapping } from '@/types/dpdp'

interface Props {
  purposes: NoticePurposeMapping[]
  onChange: (purposes: NoticePurposeMapping[]) => void
  otherText?: string
}

function labelFor(key: string, otherText?: string): string {
  if (key === 'other') return otherText?.trim() || 'Other personal data'
  return DATA_CATEGORIES.find(c => c.key === key)?.label ?? key
}

export default function PurposeMapper({ purposes, onChange, otherText }: Props) {
  const update = (index: number, patch: Partial<NoticePurposeMapping>) => {
    onChange(purposes.map((p, i) => (i === index ? { ...p, ...patch } : p)))
  }

  if (purposes.length === 0) {
    return (
      <p className="text-sm text-gray-400 text-center py-6">
        Select at least one data category in the previous step to map processing purposes.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {purposes.map((row, i) => (
        <div key={row.data_category} className="rounded-xl border border-gray-100 p-4 bg-gray-50/60">
          <p className="text-sm font-medium text-[#1A1A2E] mb-2">{labelFor(row.data_category, otherText)}</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Processing purpose</label>
              <input
                type="text"
                value={row.purpose}
                onChange={e => update(i, { purpose: e.target.value })}
                placeholder="e.g. Account creation and customer support"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#003366]/20"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">DPDP legal basis</label>
              <select
                value={row.basis}
                onChange={e => update(i, { basis: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#003366]/20"
              >
                {DPDP_BASES.map(b => (
                  <option key={b.id} value={b.id}>{b.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
