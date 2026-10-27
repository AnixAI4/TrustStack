'use client'

import { NOTICE_LANGUAGES } from '@/lib/platform/constants'
import { renderMarkdown } from '@/lib/platform/markdown'

interface Props {
  content: string
  language?: string
}

function langLabel(code: string): string {
  return NOTICE_LANGUAGES.find(language => language.code === code)?.name ?? code
}

export function NoticePreview({ content, language = 'en' }: Props) {
  const html = renderMarkdown(content)

  return (
    <div className="bg-bg-2 border border-line rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-glass border-b border-line">
        <span className="text-xs font-medium text-text-muted">Preview</span>
        <span className="text-xs text-text-faint">{langLabel(language)}</span>
      </div>
      <div
        className="prose prose-sm prose-gray max-w-none p-4 sm:p-6"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  )
}

export default NoticePreview
