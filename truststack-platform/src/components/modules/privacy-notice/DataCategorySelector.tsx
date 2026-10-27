'use client'

import { Check } from 'lucide-react'
import { DATA_CATEGORIES, DATA_CATEGORY_GROUPS } from '@/lib/constants'

interface Props {
  selected: string[]
  onChange: (selected: string[]) => void
  otherText: string
  onOtherChange: (text: string) => void
}

export default function DataCategorySelector({ selected, onChange, otherText, onOtherChange }: Props) {
  const toggle = (key: string) => {
    onChange(
      selected.includes(key)
        ? selected.filter(k => k !== key)
        : [...selected, key]
    )
  }

  return (
    <div className="space-y-5">
      {DATA_CATEGORY_GROUPS.map(group => {
        const items = DATA_CATEGORIES.filter(c => c.group === group)
        if (items.length === 0) return null
        return (
          <div key={group}>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{group}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {items.map(cat => {
                const isSelected = selected.includes(cat.key)
                return (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => toggle(cat.key)}
                    className={`flex items-center gap-2 p-3 rounded-lg border text-left transition-colors ${
                      isSelected ? 'border-[#003366] bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-[#003366] border-[#003366]' : 'border-gray-300'
                    }`}>
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className="text-sm text-[#1A1A2E] leading-tight">{cat.label}</span>
                    {cat.sensitive && (
                      <span className="ml-auto text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full shrink-0">
                        Sensitive
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}

      {selected.includes('other') && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Specify other data category</label>
          <input
            type="text"
            value={otherText}
            onChange={e => onOtherChange(e.target.value)}
            placeholder="e.g. Vehicle registration details"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]/20"
          />
        </div>
      )}

      <p className="text-xs text-gray-400">
        {selected.length} categor{selected.length === 1 ? 'y' : 'ies'} selected
      </p>
    </div>
  )
}
