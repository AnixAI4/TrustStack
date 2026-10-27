'use client'

import { useState } from 'react'
import { PurposeFormData } from './PurposeEditor'
import { CONSENT_TRANSLATIONS } from '@/lib/constants'

interface WidgetPreviewProps {
  position: 'bottom-bar' | 'corner-popup' | 'center-modal'
  primaryColor: string
  showRejectAll: boolean
  purposes: PurposeFormData[]
  languages: string[]
  orgName?: string
}

export default function WidgetPreview({
  position,
  primaryColor,
  showRejectAll,
  purposes,
  languages,
  orgName = 'Your Organization',
}: WidgetPreviewProps) {
  const [expanded, setExpanded] = useState(false)
  const lang = languages.includes('en') ? 'en' : (languages[0] || 'en')
  const t = CONSENT_TRANSLATIONS[lang] || CONSENT_TRANSLATIONS.en
  const color = primaryColor.startsWith('#') ? primaryColor : `#${primaryColor}`

  const purposeList = purposes.length > 0 ? purposes : [
    { purpose_key: 'essential', name_en: 'Essential Cookies', description_en: 'Required for the website to function.', required: true, dpdp_basis: 's7_legal', name_hi: '', name_ta: '', name_te: '' },
    { purpose_key: 'analytics', name_en: 'Analytics', description_en: 'Help us understand visitor interactions.', required: false, dpdp_basis: 'consent_s6', name_hi: '', name_ta: '', name_te: '' },
  ]

  const containerClass = {
    'bottom-bar': 'absolute bottom-0 left-0 right-0',
    'corner-popup': 'absolute bottom-4 right-4 max-w-[320px]',
    'center-modal': 'absolute inset-0 flex items-center justify-center bg-black/30',
  }[position]

  const boxClass = {
    'bottom-bar': 'w-full',
    'corner-popup': 'w-full rounded-xl shadow-xl',
    'center-modal': 'w-[340px] rounded-xl shadow-2xl',
  }[position]

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Live Preview</p>

      <div
        className="relative bg-gray-100 rounded-xl overflow-hidden"
        style={{ height: position === 'center-modal' ? '360px' : '280px' }}
      >
        {/* Simulated page content */}
        <div className="absolute inset-0 p-4 opacity-30">
          <div className="h-4 bg-gray-300 rounded w-1/2 mb-3" />
          <div className="h-3 bg-gray-300 rounded w-full mb-2" />
          <div className="h-3 bg-gray-300 rounded w-4/5 mb-2" />
          <div className="h-3 bg-gray-300 rounded w-3/5" />
        </div>

        <div className={containerClass}>
          <div className={`bg-white border-t border-gray-200 p-4 ${boxClass}`} style={position === 'center-modal' ? { borderTop: 'none' } : {}}>
            <p className="font-semibold text-[13px] text-gray-900 mb-1">{t.banner_title} — {orgName}</p>
            <p className="text-[11px] text-gray-600 leading-relaxed mb-3">
              {t.banner_desc}
            </p>

            {expanded && (
              <div className="mb-3 space-y-2 border-t border-gray-100 pt-3">
                {purposeList.map(p => (
                  <div key={p.purpose_key} className="flex items-start gap-2">
                    <div
                      className="mt-0.5 w-3.5 h-3.5 rounded-sm flex-shrink-0 border flex items-center justify-center"
                      style={p.required ? { backgroundColor: color, borderColor: color } : { borderColor: '#d1d5db' }}
                    >
                      {p.required && <span className="text-white text-[8px]">✓</span>}
                    </div>
                    <div>
                      <p className="text-[11px] font-medium text-gray-800">{p.name_en}</p>
                      <p className="text-[10px] text-gray-500">{p.description_en}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2 flex-wrap">
              <button
                className="text-[11px] px-3 py-1.5 rounded-lg text-white font-medium"
                style={{ backgroundColor: color }}
              >
                {t.accept_all}
              </button>
              {showRejectAll && (
                <button
                  className="text-[11px] px-3 py-1.5 rounded-lg font-medium border"
                  style={{ color: color, borderColor: color }}
                >
                  {t.reject_all}
                </button>
              )}
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-[11px] px-3 py-1.5 rounded-lg text-gray-600 border border-gray-200 font-medium"
              >
                {expanded ? t.save : t.manage}
              </button>
            </div>
          </div>
        </div>
      </div>

      <p className="mt-3 text-xs text-gray-400 text-center">
        Click &quot;Manage Preferences&quot; to expand the purpose list
      </p>
    </div>
  )
}
