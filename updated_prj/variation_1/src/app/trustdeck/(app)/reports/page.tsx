'use client'

import { useState } from 'react'
import { Download, Share2, Loader2, Sparkles, Check, Copy, AlertCircle } from 'lucide-react'
import { ModulePageHeader, ModulePanel } from '@/components/platform/ui/ModulePageHeader'
import { ModulePage } from '@/components/platform/ui/ModulePage'
import type { BoardReportData } from '@/types/dpdp'

function toYmd(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const REPORT_SECTIONS = [
  'Compliance status summary - Compass Score, maturity level, AI executive summary',
  'Module completion status - assessment, consent, privacy notice, grievance',
  'Key metrics - consent records, complaints, unresolved gaps by priority',
  'Top priority actions - P0 (immediate) and P1 (30-day) gaps',
  'Compliance timeline - completed this period + upcoming deadlines',
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
      const res = await fetch('/api/trustdeck/dashboard/report/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from_date: fromIso(), to_date: toIso() }),
      })
      const json = await res.json() as { error?: string; report?: BoardReportData; report_html?: string }
      if (!res.ok) throw new Error(json.error || 'Could not generate the report.')
      setReport(json.report as BoardReportData)
      setReportHtml(json.report_html as string)
    } catch (error) {
      setErr(error instanceof Error && error.message ? error.message : 'Could not generate the report. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  async function downloadPdf() {
    if (!report) return
    setPdfLoading(true)
    setErr('')
    try {
      const res = await fetch('/api/trustdeck/dashboard/report/pdf', {
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
      const res = await fetch('/api/trustdeck/dashboard/report/share', {
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
        /* clipboard blocked - the URL is still shown below */
      }
    } catch {
      setErr('Could not create a share link. Please try again.')
    } finally {
      setSharing(false)
    }
  }

  return (
    <ModulePage className="max-w-4xl mx-auto space-y-6">
      <ModulePageHeader
        title="Board Reports"
        description="Generate a board-ready DPDP compliance report with an AI executive summary. Download as PDF or share a time-limited link with board members."
      />

      {/* Controls */}
      <ModulePanel padded>
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <div>
            <label htmlFor="report-from" className="block font-mono text-label font-semibold uppercase tracking-[var(--tracking-label)] text-text-faint mb-1">From</label>
            <input
              id="report-from"
              name="report-from"
              type="date"
              value={from}
              max={to}
              onChange={e => setFrom(e.target.value)}
              className="rounded-lg border border-line bg-bg px-3 py-2 text-sm text-text [color-scheme:light] focus:outline-none focus:ring-2 focus:ring-accent/20 dark:[color-scheme:dark]"
            />
          </div>
          <div>
            <label htmlFor="report-to" className="block font-mono text-label font-semibold uppercase tracking-[var(--tracking-label)] text-text-faint mb-1">To</label>
            <input
              id="report-to"
              name="report-to"
              type="date"
              value={to}
              min={from}
              max={toYmd(today)}
              onChange={e => setTo(e.target.value)}
              className="rounded-lg border border-line bg-bg px-3 py-2 text-sm text-text [color-scheme:light] focus:outline-none focus:ring-2 focus:ring-accent/20 dark:[color-scheme:dark]"
            />
          </div>
          <button
            type="button"
            onClick={generate}
            disabled={generating}
            className="btn btn-accent inline-flex items-center justify-center gap-2 disabled:opacity-60 sm:ml-auto"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {generating ? 'Generating…' : 'Generate Board Report'}
          </button>
        </div>
      </ModulePanel>

      {err && (
        <div role="alert" className="rounded-xl border border-red/20 bg-red/10 p-4 flex items-center gap-2 text-sm text-red">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {err}
        </div>
      )}

      {!report ? (
        /* Pre-generation: what the report contains */
        <ModulePanel padded>
          <p className="font-mono text-label font-semibold uppercase tracking-[var(--tracking-label)] text-text-faint mb-3">What&apos;s in the report</p>
          <ul className="space-y-2">
            {REPORT_SECTIONS.map((s, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-text">
                <span className="w-6 h-6 rounded-full bg-accent/10 text-accent text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {i + 1}
                </span>
                {s}
              </li>
            ))}
          </ul>
        </ModulePanel>
      ) : (
        <>
          {/* Actions */}
          <ModulePanel padded>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={downloadPdf}
                disabled={pdfLoading}
                className="btn btn-accent inline-flex items-center gap-2 disabled:opacity-60"
              >
                {pdfLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                {pdfLoading ? 'Preparing PDF…' : 'Download PDF'}
              </button>
              <button
                type="button"
                onClick={createShareLink}
                disabled={sharing}
                className="btn btn-ghost inline-flex items-center gap-2 disabled:opacity-60"
              >
                {sharing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
                Share link
              </button>
              <span className="text-xs text-text-faint sm:ml-auto">
                Generated {new Date(report.generated_at).toLocaleString('en-IN')}
              </span>
            </div>
          </ModulePanel>

          {/* Share URL */}
          {shareUrl && (
            <div className="rounded-xl border border-accent/25 bg-accent/8 p-4">
              <div className="mb-1 flex items-center justify-between gap-3">
                <p className="flex items-center gap-1.5 text-sm font-semibold text-accent">
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Link copied to clipboard' : 'Time-limited share link (7 days)'}
                </p>
              </div>
              <p className="break-all rounded-lg bg-bg-2/60 px-2 py-1.5 font-mono text-xs text-text-muted">{shareUrl}</p>
              <p className="mt-1.5 text-[11px] text-text-faint">
                Board members can open this without logging in. It expires in 7 days.
              </p>
            </div>
          )}

          {/* Preview */}
          <ModulePanel>
            <div className="border-b border-line px-5 py-3">
              <p className="font-mono text-label font-semibold uppercase tracking-[var(--tracking-label)] text-text-faint">
                Preview
              </p>
            </div>
            <div className="p-5">
              <div dangerouslySetInnerHTML={{ __html: reportHtml }} />
            </div>
          </ModulePanel>
        </>
      )}
    </ModulePage>
  )
}
