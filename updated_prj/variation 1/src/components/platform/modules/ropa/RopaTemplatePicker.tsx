'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'
import { getRopaTemplates, INDUSTRY_SECTORS, DPDP_BASES } from '@/lib/platform/constants'
import type { RopaEntry } from '@/types/dpdp'

interface Props {
  onSelect: (entries: Partial<RopaEntry>[]) => void
}

export function RopaTemplatePicker({ onSelect }: Props) {
  const [industry, setIndustry]       = useState('')
  const [selectedKeys, setSelectedKeys] = useState<string[]>([])

  const templates = industry ? getRopaTemplates(industry) : []

  function toggle(key: string) {
    setSelectedKeys(prev => (prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]))
  }

  function handleApply() {
    const selected = templates.filter(template => selectedKeys.includes(template.activity_name))
    const entries: Partial<RopaEntry>[] = selected.map(template => ({
      activity_name: template.activity_name,
      activity_description: template.activity_description,
      processing_purposes: template.processing_purposes,
      legal_basis: template.legal_basis,
      data_categories: template.data_categories,
      data_subject_types: template.data_subject_types,
      retention_period: template.retention_period,
      recipients: template.recipients ?? [],
      security_measures: template.security_measures ?? [],
    }))
    onSelect(entries)
    setSelectedKeys([])
  }

  return (
    <div className="space-y-4 rounded-xl border border-line p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-text">Start from a template</p>
        {selectedKeys.length > 0 && (
          <button
            onClick={handleApply}
            className="min-h-10 rounded-lg px-2 text-xs font-medium text-accent hover:bg-accent/10"
          >
            Add {selectedKeys.length} selected
          </button>
        )}
      </div>

      <div>
        <label className="block text-xs font-medium text-text-muted mb-1">Select your industry</label>
        <select
          value={industry}
          onChange={e => { setIndustry(e.target.value); setSelectedKeys([]) }}
          className="min-h-11 w-full rounded-lg border border-line bg-bg-2 px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <option value="">Choose an industry…</option>
          {INDUSTRY_SECTORS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      {templates.length > 0 && (
        <div className="max-h-64 overflow-y-auto space-y-2">
          {templates.map(template => {
            const selected = selectedKeys.includes(template.activity_name)
            return (
              <button
                key={template.activity_name}
                type="button"
                onClick={() => toggle(template.activity_name)}
                className={`flex min-h-14 w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors ${
                  selected ? 'border-accent bg-accent/10' : 'border-line hover:bg-glass'
                }`}
              >
                <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center ${selected ? 'bg-accent border-accent text-white' : 'border-line'}`}>
                  {selected && <Check size={13} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-text">{template.activity_name}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-text-muted">{template.processing_purposes.join(' · ')}</p>
                  <p className="text-xs text-text-faint mt-1">
                    {DPDP_BASES.find(basis => basis.id === template.legal_basis)?.label ?? template.legal_basis}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {industry && templates.length === 0 && (
        <p className="text-sm text-text-faint text-center py-4">No templates available for this industry yet.</p>
      )}
    </div>
  )
}
