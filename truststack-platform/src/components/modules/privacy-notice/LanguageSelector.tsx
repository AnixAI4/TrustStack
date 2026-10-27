'use client'

import { Check } from 'lucide-react'
import { NOTICE_LANGUAGES } from '@/lib/constants'

interface Props {
  selected: string[]
  onChange: (selected: string[]) => void
}

export default function LanguageSelector({ selected, onChange }: Props) {
  const toggle = (code: string) => {
    if (code === 'en') return // English is always generated
    onChange(
      selected.includes(code)
        ? selected.filter(c => c !== code)
        : [...selected, code]
    )
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {NOTICE_LANGUAGES.map(lang => {
          const isSelected = lang.code === 'en' || selected.includes(lang.code)
          const locked = lang.code === 'en'
          return (
            <button
              key={lang.code}
              type="button"
              onClick={() => toggle(lang.code)}
              disabled={locked}
              className={`flex items-center gap-2 p-3 rounded-lg border text-left transition-colors ${
                isSelected ? 'border-[#003366] bg-blue-50' : 'border-gray-200 hover:border-gray-300'
              } ${locked ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                isSelected ? 'bg-[#003366] border-[#003366]' : 'border-gray-300'
              }`}>
                {isSelected && <Check className="w-3 h-3 text-white" />}
              </div>
              <div>
                <p className="text-sm font-medium text-[#1A1A2E] leading-tight">{lang.name}</p>
                <p className="text-xs text-gray-400">{lang.nativeName}</p>
              </div>
            </button>
          )
        })}
      </div>
      <p className="text-xs text-gray-400">
        English is always generated. {selected.filter(c => c !== 'en').length} additional language
        {selected.filter(c => c !== 'en').length !== 1 ? 's' : ''} selected — translated via Claude on publish.
      </p>
    </div>
  )
}
