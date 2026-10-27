'use client'

import { useEffect, useState } from 'react'
import { X, Check, Plus, Layers } from 'lucide-react'
import { getRopaTemplates, INDUSTRY_SECTORS, DPDP_BASES, type RopaTemplateActivity } from '@/lib/constants'
import type { RopaEntry } from '@/types/dpdp'

interface Props {
  open: boolean
  onClose: () => void
  onAdded: (entry: RopaEntry) => void
  existingNames: string[]
}

const basisLabel = (id: string) => DPDP_BASES.find(b => b.id === id)?.label ?? id
const industryLabel = (v: string | null) => INDUSTRY_SECTORS.find(s => s.value === v)?.label ?? 'your industry'

export function RopaTemplatePicker({ open, onClose, onAdded, existingNames }: Props) {
  const [industry, setIndustry]   = useState<string | null>(null)
  const [templates, setTemplates] = useState<RopaTemplateActivity[]>([])
  const [adding, setAdding]       = useState<string | null>(null)
  const [error, setError]         = useState<string | null>(null)
  const existing = new Set(existingNames.map(n => n.toLowerCase()))

  useEffect(() => {
    if (!open) return
    setError(null)
    fetch('/api/organizations/me')
      .then(r => r.json())
      .then(j => {
        const ind = (j?.data?.industry ?? null) as string | null
        setIndustry(ind)
        setTemplates(getRopaTemplates(ind))
      })
      .catch(() => setTemplates(getRopaTemplates(null)))
  }, [open])

  if (!open) return null

  async function add(item: RopaTemplateActivity) {
    setAdding(item.activity_name)
    setError(null)
    try {
      const res = await fetch('/api/ropa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activity_name:        item.activity_name,
          activity_description: item.activity_description,
          data_categories:      item.data_categories,
          data_subject_types:   item.data_subject_types,
          processing_purposes:  item.processing_purposes,
          legal_basis:          item.legal_basis,
          retention_period:     item.retention_period,
          recipients:           item.recipients ?? [],
          security_measures:    item.security_measures ?? [],
        }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? `Could not add ${item.activity_name}.`); return }
      onAdded(json.data as RopaEntry)
    } catch {
      setError('Network error — please try again.')
    } finally {
      setAdding(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white">
          <div>
            <h2 className="text-lg font-bold text-[#003366] flex items-center gap-1.5"><Layers size={18} /> ROPA Templates</h2>
            <p className="text-xs text-gray-500 mt-0.5">Common processing activities for {industryLabel(industry)} — add the ones you run.</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <div className="p-6 space-y-2">
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-2">{error}</p>}
          {templates.length === 0 && <p className="text-sm text-gray-500">Loading templates…</p>}
          {templates.map(item => {
            const already = existing.has(item.activity_name.toLowerCase())
            return (
              <div key={item.activity_name} className="flex items-start justify-between gap-3 border border-gray-100 rounded-lg p-3 hover:bg-gray-50 transition-colors">
                <div className="min-w-0">
                  <div className="font-medium text-[#1A1A2E]">{item.activity_name}</div>
                  <p className="text-xs text-gray-500 mt-0.5">{item.activity_description}</p>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                    <span className="text-[11px] text-[#003366] bg-[#D6E4F0] rounded-full px-2 py-0.5">{basisLabel(item.legal_basis)}</span>
                    <span className="text-[11px] text-gray-500">{item.data_categories.length} categories · {item.data_subject_types.join(', ')}</span>
                  </div>
                </div>
                {already ? (
                  <span className="inline-flex items-center gap-1 text-xs text-green-600 shrink-0"><Check size={14} /> Added</span>
                ) : (
                  <button
                    onClick={() => add(item)}
                    disabled={adding !== null}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-[#003366] text-white rounded-lg hover:bg-[#1A5276] transition-colors disabled:opacity-50 shrink-0"
                  >
                    <Plus size={13} /> {adding === item.activity_name ? 'Adding…' : 'Add'}
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
