'use client'

import { useState } from 'react'
import { NOTICE_LANGUAGES } from '@/lib/constants'
import { renderMarkdown } from '@/lib/markdown'

interface Props {
  // Map of language code -> markdown content. 'en' is expected to be present.
  contentByLang: Record<string, string>
}

export default function NoticePreview({ contentByLang }: Props) {
  const available = NOTICE_LANGUAGES.filter(l => (contentByLang[l.code] || '').trim())
  const [active, setActive] = useState<string>(available[0]?.code || 'en')

  const content = contentByLang[active] || contentByLang['en'] || ''

  return (
    <div className="rounded-xl border border-gray-100 overflow-hidden">
      {available.length > 1 && (
        <div className="flex flex-wrap gap-1 px-3 pt-3 border-b border-gray-100 bg-gray-50/60">
          {available.map(l => (
            <button
              key={l.code}
              type="button"
              onClick={() => setActive(l.code)}
              className={`px-3 py-1.5 text-sm rounded-t-lg transition-colors ${
                active === l.code
                  ? 'bg-white text-[#003366] font-medium border border-gray-100 border-b-white -mb-px'
                  : 'text-gray-500 hover:text-[#003366]'
              }`}
            >
              {l.name}
            </button>
          ))}
        </div>
      )}
      <div className="p-6 max-h-[28rem] overflow-y-auto bg-white">
        {content.trim() ? (
          <div dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }} />
        ) : (
          <p className="text-sm text-gray-400 text-center py-8">No content yet.</p>
        )}
      </div>
    </div>
  )
}
