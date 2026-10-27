'use client'

import { useMemo, useState } from 'react'
import { Shield, Printer, Mail, Globe } from 'lucide-react'
import { NOTICE_LANGUAGES } from '@/lib/constants'
import { renderMarkdown, extractHeadings } from '@/lib/markdown'
import type { PrivacyNoticeVersion } from '@/types/dpdp'

interface Props {
  organizationName: string
  logoUrl?: string | null
  version: PrivacyNoticeVersion
  availableLanguages: string[]
}

const COLUMN: Record<string, keyof PrivacyNoticeVersion> = {
  en: 'content_en',
  hi: 'content_hi',
  ta: 'content_ta',
  te: 'content_te',
  mr: 'content_mr',
}

export default function PublicNoticeView({ organizationName, logoUrl, version, availableLanguages }: Props) {
  const langs = NOTICE_LANGUAGES.filter(l => availableLanguages.includes(l.code))
  const [active, setActive] = useState<string>(langs[0]?.code || 'en')

  const content = (version[COLUMN[active]] as string | null) || version.content_en || ''
  const html = useMemo(() => renderMarkdown(content), [content])
  const headings = useMemo(() => extractHeadings(content), [content])

  const updated = version.published_at || version.created_at

  return (
    <div className="min-h-screen bg-[#F4F8FC]">
      {/* Print rules: hide chrome, expand content for a clean PDF */}
      <style>{`@media print { .no-print { display: none !important; } .notice-main { max-width: none !important; } }`}</style>

      <header className="bg-[#003366] text-white py-4 px-6 no-print">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield size={18} className="text-[#D6E4F0]" />
            <span className="text-sm font-medium text-[#D6E4F0]">TrustStack™ — DPDP Compliance</span>
          </div>
          <div className="flex items-center gap-2">
            {langs.length > 1 && (
              <div className="flex items-center gap-1 mr-2">
                <Globe size={14} className="text-[#D6E4F0]" />
                {langs.map(l => (
                  <button
                    key={l.code}
                    onClick={() => setActive(l.code)}
                    className={`text-xs px-2 py-1 rounded transition-colors ${
                      active === l.code ? 'bg-white/20 text-white' : 'text-[#D6E4F0] hover:bg-white/10'
                    }`}
                  >
                    {l.nativeName}
                  </button>
                ))}
              </div>
            )}
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded transition-colors"
            >
              <Printer size={14} /> Download PDF
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6 flex items-center gap-4">
          {logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={`${organizationName} logo`} className="h-12 w-auto max-w-[180px] object-contain shrink-0" />
          )}
          <div>
            <h1 className="text-2xl font-bold text-[#003366]">{organizationName} — Privacy Notice</h1>
            <p className="text-sm text-gray-500 mt-1">
              Last updated: {new Date(updated).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Sticky table of contents */}
          {headings.length > 2 && (
            <aside className="hidden lg:block w-56 shrink-0 no-print">
              <div className="sticky top-6">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">On this page</p>
                <nav className="space-y-1 text-sm border-l border-gray-200">
                  {headings.map(h => (
                    <a
                      key={h.id}
                      href={`#${h.id}`}
                      className={`block py-1 text-gray-500 hover:text-[#003366] border-l-2 border-transparent hover:border-[#003366] -ml-px ${
                        h.level === 1 ? 'pl-3 font-medium' : h.level === 2 ? 'pl-4' : 'pl-6 text-xs'
                      }`}
                    >
                      {h.text}
                    </a>
                  ))}
                </nav>
              </div>
            </aside>
          )}

          {/* Notice content */}
          <article className="notice-main flex-1 min-w-0 bg-white rounded-xl border border-gray-100 shadow-sm p-6 sm:p-10">
            <div dangerouslySetInnerHTML={{ __html: html }} />

            <div className="mt-10 pt-6 border-t border-gray-100 no-print">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Grievance Officer</p>
              <p className="text-sm text-gray-700">{version.grievance_officer_name}</p>
              <a
                href={`mailto:${version.grievance_officer_email}`}
                className="inline-flex items-center gap-1.5 text-sm text-[#2874A6] hover:underline mt-1"
              >
                <Mail size={14} /> {version.grievance_officer_email}
              </a>
              {version.grievance_officer_phone && (
                <p className="text-sm text-gray-500 mt-1">{version.grievance_officer_phone}</p>
              )}
            </div>
          </article>
        </div>

        <p className="text-center text-xs text-gray-400 mt-8 no-print">
          Privacy Notice generated by <a href="/" className="hover:text-[#003366]">TrustStack™</a> by Anix AI
        </p>
      </main>
    </div>
  )
}
