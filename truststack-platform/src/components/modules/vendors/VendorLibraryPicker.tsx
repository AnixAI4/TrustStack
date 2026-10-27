'use client'

import { useState } from 'react'
import { X, Check, Plus, MapPin } from 'lucide-react'
import { VendorRiskBadge } from './VendorRiskBadge'
import { INDIA_VENDOR_PREASSESSMENTS, VENDOR_TYPES, type IndiaVendorPreassessment } from '@/lib/constants'
import type { Vendor } from '@/types/dpdp'

interface Props {
  open: boolean
  onClose: () => void
  onAdded: (vendor: Vendor) => void
  existingNames: string[]
}

function typeLabel(value: string): string {
  return VENDOR_TYPES.find(t => t.value === value)?.label ?? value
}

export function VendorLibraryPicker({ open, onClose, onAdded, existingNames }: Props) {
  const [adding, setAdding] = useState<string | null>(null)
  const [error, setError]   = useState<string | null>(null)
  const existing = new Set(existingNames.map(n => n.toLowerCase()))

  if (!open) return null

  async function add(item: IndiaVendorPreassessment) {
    setAdding(item.name)
    setError(null)
    try {
      const res = await fetch('/api/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: item.name,
          vendor_type: item.type,
          india_data_residency: item.india_data_residency,
          risk_tier: item.risk_tier,
          notes: item.notes,
        }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? `Could not add ${item.name}.`); return }
      onAdded(json.data as Vendor)
    } catch {
      setError('Network error — please try again.')
    } finally {
      setAdding(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white">
          <div>
            <h2 className="text-lg font-bold text-[#003366]">Pre-Assessed India Vendor Library</h2>
            <p className="text-xs text-gray-500 mt-0.5">Add a common India-resident SaaS vendor with a starting risk rating.</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <div className="p-6 space-y-2">
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-2">{error}</p>}
          {INDIA_VENDOR_PREASSESSMENTS.map(item => {
            const already = existing.has(item.name.toLowerCase())
            return (
              <div key={item.name} className="flex items-center justify-between gap-3 border border-gray-100 rounded-lg p-3 hover:bg-gray-50 transition-colors">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-[#1A1A2E]">{item.name}</span>
                    <span className="text-xs text-gray-400">{typeLabel(item.type)}</span>
                    <VendorRiskBadge tier={item.risk_tier} />
                    {item.india_data_residency && (
                      <span className="inline-flex items-center gap-0.5 text-xs text-green-600"><MapPin size={11} /> India</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">{item.notes}</p>
                </div>
                {already ? (
                  <span className="inline-flex items-center gap-1 text-xs text-green-600 shrink-0"><Check size={14} /> Added</span>
                ) : (
                  <button
                    onClick={() => add(item)}
                    disabled={adding !== null}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-[#003366] text-white rounded-lg hover:bg-[#1A5276] transition-colors disabled:opacity-50 shrink-0"
                  >
                    <Plus size={13} /> {adding === item.name ? 'Adding…' : 'Add'}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
