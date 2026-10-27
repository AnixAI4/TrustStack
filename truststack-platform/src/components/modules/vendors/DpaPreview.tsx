'use client'

import { useState } from 'react'
import { X, Copy, Check, Download, Printer } from 'lucide-react'
import { renderMarkdown } from '@/lib/markdown'

interface Props {
  open: boolean
  onClose: () => void
  dpa: string
  vendorName: string
}

// Preview a Claude-generated DPA (Markdown). Offers copy, download (.md), and
// print / save-as-PDF (opens a clean print window — no @react-pdf needed, mirrors
// the M3 window.print approach). renderMarkdown HTML-escapes input, so the
// dangerouslySetInnerHTML below is XSS-safe.
export function DpaPreview({ open, onClose, dpa, vendorName }: Props) {
  const [copied, setCopied] = useState(false)
  if (!open) return null

  const safeName = vendorName.replace(/[^a-z0-9]+/gi, '-').replace(/(^-|-$)/g, '') || 'vendor'

  async function copy() {
    try {
      await navigator.clipboard.writeText(dpa)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* clipboard unavailable — ignore */ }
  }

  function download() {
    const blob = new Blob([dpa], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `DPA-${safeName}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  function print() {
    const w = window.open('', '_blank', 'width=860,height=1000')
    if (!w) return
    w.document.write(`<!doctype html><html><head><title>DPA — ${vendorName}</title>
      <meta charset="utf-8" />
      <style>
        body{font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:760px;margin:40px auto;padding:0 24px;color:#1A1A2E;line-height:1.6}
        h1{color:#003366;font-size:24px;margin:24px 0 12px} h2{color:#003366;font-size:19px;margin:22px 0 8px}
        h3{font-size:16px;margin:18px 0 6px} code{background:#f3f4f6;padding:1px 5px;border-radius:4px;font-size:90%}
        hr{border:none;border-top:1px solid #e5e7eb;margin:24px 0} ul,ol{padding-left:24px}
      </style></head><body>${renderMarkdown(dpa)}</body></html>`)
    w.document.close()
    w.focus()
    setTimeout(() => w.print(), 300)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-[#003366]">Generated DPA — {vendorName}</h2>
            <p className="text-xs text-gray-500 mt-0.5">AI-drafted template for legal review. Edit before signing.</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <div className="flex items-center gap-2 px-6 py-3 border-b border-gray-100 bg-gray-50">
          <button onClick={copy} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white hover:bg-gray-50">
            {copied ? <><Check size={14} className="text-green-600" /> Copied</> : <><Copy size={14} /> Copy</>}
          </button>
          <button onClick={download} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white hover:bg-gray-50">
            <Download size={14} /> Download .md
          </button>
          <button onClick={print} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white hover:bg-gray-50">
            <Printer size={14} /> Print / PDF
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-5">
          <div dangerouslySetInnerHTML={{ __html: renderMarkdown(dpa) }} />
        </div>
      </div>
    </div>
  )
}
