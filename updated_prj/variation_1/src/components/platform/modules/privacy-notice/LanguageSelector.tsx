'use client'

import { NOTICE_LANGUAGES } from '@/lib/platform/constants'

interface Props {
  value: string
  onChange: (value: string) => void
}

export function LanguageSelector({ value, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {NOTICE_LANGUAGES.map(lang => {
        const selected = value === lang.code
        return (
          <button
            key={lang.code}
            type="button"
            onClick={() => onChange(lang.code)}
            className={`min-h-11 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              selected
                ? 'bg-accent text-white'
                : 'bg-surface-2 text-text-muted hover:bg-surface-2'
            }`}
          >
            {lang.nativeName}
            {lang.nativeName !== lang.name && (
              <span className="ml-1 text-xs opacity-70">· {lang.name}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}

export default LanguageSelector
