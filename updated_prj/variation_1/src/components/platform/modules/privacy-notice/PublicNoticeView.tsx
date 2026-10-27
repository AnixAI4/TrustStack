'use client'

import { useState } from 'react'
import { Globe, ChevronRight } from 'lucide-react'
import { NOTICE_LANGUAGES } from '@/lib/platform/constants'
import { renderMarkdown, extractHeadings } from '@/lib/platform/markdown'
import type { PrivacyNoticeVersion } from '@/types/dpdp'

interface Props {
  organizationName: string
  logoUrl?: string | null
  version: PrivacyNoticeVersion
  availableLanguages?: string[]
}

function langLabel(code: string): string {
  return NOTICE_LANGUAGES.find(l => l.code === code)?.nativeName ?? code
}

export function PublicNoticeView({ organizationName, version, availableLanguages = ['en'] }: Props) {
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [activeLanguage, setActiveLanguage] = useState('en')
  const language = NOTICE_LANGUAGES.find(l => l.code === activeLanguage)
  const column = language?.column ?? 'content_en'
  const content = (version as unknown as Record<string, string | null>)[column] || version.content_en
  const html = renderMarkdown(content)
  const headings = extractHeadings(content)

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Sidebar TOC */}
      {headings.length > 0 && (
        <nav className="lg:w-56 flex-shrink-0">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Contents</p>
          <ul className="space-y-1 text-sm">
            {headings.map(h => (
              <li key={h.id}>
                <a
                  href={`#${h.id}`}
                  onClick={() => setActiveSection(h.id)}
                  style={{ paddingLeft: `${(h.level - 1) * 0.75}rem` }}
                  className={`block border-l-2 py-1 transition-colors ${
                    activeSection === h.id
                      ? 'border-accent text-accent font-medium'
                      : 'border-transparent text-text-muted hover:text-accent hover:border-line'
                  }`}
                >
                  {h.text}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}

      {/* Main content */}
      <article className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-line">
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight text-text">{organizationName} Privacy Notice</h1>
            <p className="text-xs text-text-faint mt-1">
              Version {version.version_number} · Last updated{' '}
              {new Date(version.published_at ?? version.created_at).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
          {availableLanguages.length > 1 && (
            <div className="flex items-center gap-2">
              <Globe size={14} className="text-text-faint" />
              <select
                value={activeLanguage}
                onChange={e => setActiveLanguage(e.target.value)}
                className="text-sm border border-line rounded-lg bg-bg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
              >
                {availableLanguages.map(l => (
                  <option key={l} value={l}>{langLabel(l)}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div
          className="prose prose-sm prose-gray max-w-none prose-headings:scroll-mt-20"
          dangerouslySetInnerHTML={{ __html: html }}
        />

        {/* Jump links at bottom */}
        {headings.length > 5 && (
          <div className="mt-8 pt-6 border-t border-line">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Quick links</p>
            <div className="flex flex-wrap gap-2">
              {headings.filter(h => h.level === 2).map(h => (
                <a
                  key={h.id}
                  href={`#${h.id}`}
                  className="inline-flex items-center text-xs text-brand hover:text-accent font-medium"
                >
                  {h.text} <ChevronRight size={12} />
                </a>
              ))}
            </div>
          </div>
        )}
      </article>
    </div>
  )
}
