'use client'

import { useState } from 'react'
import { FileBarChart, Download, Share2, Loader2, Sparkles, Check, Copy, AlertCircle } from 'lucide-react'
import type { BoardReportData } from '@/types/dpdp'

function toYmd(d: Date): string {
  return d.toISOString().slice(0, 10)
}

const REPORT_SECTIONS = [
  'Compliance status summary — Compass Score, maturity level, AI executive summary',
  'Module completion status — assessment, consent, privacy notice, grievance',
  'Key metrics — consent records, complaints, unresolved gaps by priority',
  'Top priority actions — P0 (immediate) and P1 (30-day) gaps',
  'Compliance timeline — completed this period + upcoming deadlines',
]

export default function ReportsPage() {
  const today = new Date()
  const monthAgo = new Date(Date.now() - 30 * 86_400_000)

  const [from, setFrom] = useState(toYmd(monthAgo))
  const [to, setTo] = useState(toYmd(today))
  const [generating, setGenerating] = useState(false)
  const [report, setReport] = useState<BoardReportData | null>(null)
  const [reportHtml, setReportHtml] = useState('')
  const [pdfLoading, setPdfLoading] = useState(false)
  const [sharing, setSharing] = useState(false)
  const [shareUrl, setShareUrl] = useState('')
  const [copied, setCopied] = useState(false)
  const [err, setErr] = useState('')

  const fromIso = () => new Date(`${from}T00:00:00`).toISOString()
  const toIso = () => new Date(`${to}T23:59:59`).toISOString()

  async function generate() {
    setGenerating(true)
    setErr('')
    setShareUrl('')
    try {
      const res = await fetch('/api/dashboard/report/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from_date: fromIso(), to_date: toIso() }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setReport(json.report as BoardReportData)
      setReportHtml(json.report_html as string)
    } catch {
      setErr('Could not generate the report. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  async function downloadPdf() {
    if (!report) return
    setPdfLoading(true)
    setErr('')
    try {
      const res = await fetch('/api/dashboard/report/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ report }),
      })
      if (!res.ok) throw new Error()
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'truststack-board-report.pdf'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch {
      setErr('PDF generation failed. Please try again.')
    } finally {
      setPdfLoading(false)
    }
  }

  async function createShareLink() {
    setSharing(true)
    setErr('')
    try {
      const res = await fetch('/api/dashboard/report/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from_date: fromIso(), to_date: toIso() }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error()
      setShareUrl(json.url as string)
      try {
        await navigator.clipboard.writeText(json.url as string)
        setCopied(true)
        setTimeout(() => setCopied(false), 2500)
      } catch {
        /* clipboard blocked — the URL is still shown below */
      }
    } catch {
      setErr('Could not create a share link. Please try again.')
    } finally {
      setSharing(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#003366] flex items-center gap-2">
          <FileBarChart className="w-7 h-7" /> Board Reports
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Generate a board-ready DPDP compliance report with an AI executive summary. Download as PDF or share a
          time-limited link with board members.
        </p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">From</label>
            <input
              type="date"
              value={from}
              max={to}
              onChange={e => setFrom(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]/20"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">To</label>
            <input
              type="date"
              value={to}
              min={from}
              max={toYmd(today)}
              onChange={e => setTo(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]/20"
            />
          </div>
          <button
            onClick={generate}
            disabled={generating}
            className="inline-flex items-center justify-center gap-2 bg-[#003366] text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#1A5276] transition-colors disabled:opacity-60 sm:ml-auto"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {generating ? 'Generating…' : 'Generate Board Report'}
          </button>
        </div>
      </div>

      {err && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-2 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {err}
        </div>
      )}

      {!report ? (
        /* Pre-generation: what the report contains */
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">What&apos;s in the report</p>
          <ul className="space-y-2">
            {REPORT_SECTIONS.map((s, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-gray-700">
                <span className="w-6 h-6 rounded-full bg-[#D6E4F0] text-[#003366] text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {i + 1}
                </span>
                {s}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <>
          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={downloadPdf}
              disabled={pdfLoading}
              className="inline-flex items-center gap-2 bg-[#003366] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#1A5276] transition-colors disabled:opacity-60"
            >
              {pdfLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {pdfLoading ? 'Preparing PDF…' : 'Download PDF'}
            </button>
            <button
              onClick={createShareLink}
              disabled={sharing}
              className="inline-flex items-center gap-2 border border-[#003366] text-[#003366] px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#D6E4F0] transition-colors disabled:opacity-60"
            >
              {sharing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
              Share link
            </button>
            <span className="text-xs text-gray-400">Generated {new Date(report.generated_at).toLocaleString('en-IN')}</span>
          </div>

          {/* Share URL */}
          {shareUrl && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center justify-between gap-3 mb-1">
                <p className="text-sm font-semibold text-blue-800 flex items-center gap-1.5">
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Link copied to clipboard' : 'Time-limited share link (7 days)'}
                </p>
              </div>
              <p className="text-xs text-blue-700 break-all font-mono bg-white/60 rounded px-2 py-1.5">{shareUrl}</p>
              <p className="text-[11px] text-blue-600 mt-1.5">
                Board members can open this without logging in. It expires in 7 days.
              </p>
            </div>
          )}

          {/* Preview */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Preview</p>
            <div
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-8"
              dangerouslySetInnerHTML={{ __html: reportHtml }}
            />
          </div>
        </>
      )}
    </div>
  )
}
