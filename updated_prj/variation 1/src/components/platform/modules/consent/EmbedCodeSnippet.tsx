'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { ModulePanel } from '@/components/platform/ui/ModulePageHeader'

interface Props {
  orgId: string
  configId?: string
}

export function EmbedCodeSnippet({ orgId, configId }: Props) {
  const [copied, setCopied] = useState(false)

  const snippet = `<script
  src="https://consent.truststack.in/widget.js"
  data-org-id="${orgId}"${configId ? `\n  data-config-id="${configId}"` : ''}
  defer
></script>`

  function copy() {
    navigator.clipboard.writeText(snippet).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {})
  }

  return (
    <ModulePanel className="relative">
      <div className="overflow-hidden bg-[#141816]">
        <pre className="overflow-x-auto whitespace-pre p-5 pr-24 font-mono text-xs leading-relaxed text-white/80">
          {snippet}
        </pre>
      </div>
      <button
        type="button"
        onClick={copy}
        className="absolute right-3 top-3 inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-white/15 bg-white/10 px-2.5 py-1.5 text-xs font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/20"
      >
        {copied ? (
          <>
            <Check className="h-3.5 w-3.5" /> Copied
          </>
        ) : (
          <>
            <Copy className="h-3.5 w-3.5" /> Copy
          </>
        )}
      </button>
    </ModulePanel>
  )
}
