'use client'

import { renderMarkdown } from '@/lib/platform/markdown'

interface Props {
  content: string
}

export function DpaPreview({ content }: Props) {
  const html = renderMarkdown(content)

  return (
    <div className="rounded-lg border border-line bg-glass p-4 sm:p-5">
      <div
        className="prose prose-sm prose-gray max-w-none"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  )
}
