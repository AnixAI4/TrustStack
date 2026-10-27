'use client'

import { CONSENT_TRANSLATIONS } from '@/lib/platform/constants'

interface Purpose {
  purpose_key: string
  name_en: string
  required?: boolean
}

interface Props {
  purposes: Purpose[]
  language?: string
  brandColor?: string
  onSave?: () => void
}

export function WidgetPreview({ purposes, language = 'en', brandColor = 'var(--accent)', onSave }: Props) {
  const t = CONSENT_TRANSLATIONS[language as keyof typeof CONSENT_TRANSLATIONS] ?? CONSENT_TRANSLATIONS.en

  return (
    <div className="w-full max-w-sm space-y-4 rounded-xl border border-line bg-bg-2 p-4 font-sans shadow-lg sm:p-6">
      <h2 className="text-lg font-bold" style={{ color: brandColor }}>{t.banner_title}</h2>
      <p className="text-sm text-text-muted">{t.banner_desc}</p>

      <div className="space-y-2">
        {purposes.map(p => (
          <label key={p.purpose_key} className="flex min-h-10 cursor-pointer items-center gap-2 text-sm text-text">
            <input
              type="checkbox"
              defaultChecked={p.required}
              disabled={p.required}
              className="rounded border-line"
              style={{ accentColor: brandColor }}
            />
            {p.name_en}
            {p.required && <span className="text-xs text-text-faint">({t.required_label})</span>}
          </label>
        ))}
      </div>

      <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:items-center">
        <button
          onClick={onSave}
          className="min-h-11 flex-1 rounded-lg py-2 text-sm font-medium text-white transition-colors"
          style={{ backgroundColor: brandColor }}
        >
          {t.accept_all}
        </button>
        <button
          className="min-h-11 rounded-lg border border-line px-4 py-2 text-sm font-medium text-text transition-colors hover:bg-glass"
        >
          {t.reject_all}
        </button>
      </div>
      <p className="text-xs leading-snug text-text-faint">{t.withdraw_notice}</p>
    </div>
  )
}
