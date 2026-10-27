'use client'

import { useState } from 'react'
import { Code, Copy, Check } from 'lucide-react'

interface EmbedCodeSnippetProps {
  orgSlug: string
}

export default function EmbedCodeSnippet({ orgSlug }: EmbedCodeSnippetProps) {
  const [copied, setCopied] = useState(false)

  const snippet = `<!-- TrustStack™ Consent Widget — paste before </body> -->
<script
  src="https://app.truststack.in/consent-widget.js"
  data-org="${orgSlug}"
  data-lang="auto"
  async>
</script>`

  const handleCopy = async () => {
    await navigator.clipboard.writeText(snippet)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Code className="w-5 h-5 text-[#003366]" />
          <h3 className="font-semibold text-[#1A1A2E]">Embed Code</h3>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-green-600" />
              <span className="text-green-600">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="bg-[#0D1117] text-[#E6EDF3] text-xs rounded-lg p-4 overflow-x-auto leading-relaxed font-mono whitespace-pre">
        {snippet}
      </pre>
      <p className="mt-3 text-xs text-gray-500">
        Paste this snippet on every page of your website where you process personal data. The widget loads asynchronously and will not affect page speed.
      </p>
    </div>
  )
}
