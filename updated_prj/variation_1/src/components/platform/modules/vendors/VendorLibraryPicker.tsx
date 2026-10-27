'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import { VendorRiskBadge } from './VendorRiskBadge'
import { INDIA_VENDOR_PREASSESSMENTS, VENDOR_TYPES, type IndiaVendorPreassessment } from '@/lib/platform/constants'
import type { Vendor } from '@/types/dpdp'

interface Props {
  onSelect: (vendor: Partial<Vendor>) => void
  existingVendorNames?: string[]
}

export function VendorLibraryPicker({ onSelect, existingVendorNames = [] }: Props) {
  const [search, setSearch]             = useState('')
  const [selectedType, setSelectedType] = useState<string | null>(null)

  const filtered = INDIA_VENDOR_PREASSESSMENTS.filter(v => {
    if (existingVendorNames.includes(v.name)) return false
    if (selectedType && v.type !== selectedType) return false
    if (search && !v.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  function handleSelect(v: IndiaVendorPreassessment) {
    onSelect({
      name: v.name,
      vendor_type: v.type,
      risk_tier: v.risk_tier,
      india_data_residency: v.india_data_residency,
      notes: v.notes,
    })
  }

  return (
    <div className="space-y-4 rounded-xl border border-line p-4 sm:p-5">
      <p className="text-sm font-semibold text-text">Add from vendor library</p>

      {/* Search + filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-faint" />
          <input
            aria-label="Search vendor library"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search vendors…"
            className="min-h-11 w-full rounded-lg border border-line bg-bg-2 py-2 pl-9 pr-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
        <select
          aria-label="Filter vendor library by type"
          value={selectedType ?? ''}
          onChange={e => setSelectedType(e.target.value || null)}
          className="min-h-11 w-full rounded-lg border border-line bg-bg-2 px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent sm:w-auto"
        >
          <option value="">All types</option>
          {VENDOR_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      {/* Vendor list */}
      <div className="max-h-64 overflow-y-auto space-y-2">
        {filtered.length === 0 ? (
          <p className="text-sm text-text-faint text-center py-4">No vendors match your criteria.</p>
        ) : (
          filtered.map(v => (
            <button
              key={v.name}
              type="button"
              onClick={() => handleSelect(v)}
              className="flex min-h-14 w-full items-center gap-3 rounded-lg border border-line p-3 text-left transition-colors hover:bg-glass"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text truncate">{v.name}</p>
                <p className="text-xs text-text-muted">{VENDOR_TYPES.find(t => t.value === v.type)?.label}</p>
              </div>
              <VendorRiskBadge risk={v.risk_tier} />
            </button>
          ))
        )}
      </div>
    </div>
  )
}
