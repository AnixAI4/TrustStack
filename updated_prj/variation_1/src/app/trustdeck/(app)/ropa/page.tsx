'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import {
  Database, ArrowRight, FileCheck2, Clock, ShieldAlert, Plus, Layers,
  FileDown, Sheet, CheckCircle2, X,
} from 'lucide-react'
import { RopaTable } from '@/components/platform/modules/ropa/RopaTable'
import { RopaEntryForm } from '@/components/platform/modules/ropa/RopaEntryForm'
import { RopaTemplatePicker } from '@/components/platform/modules/ropa/RopaTemplatePicker'
import { ModulePageHeader, ModulePanel, ModulePanelHeader, ModulePageSkeleton } from '@/components/platform/ui/ModulePageHeader'
import { ModulePage } from '@/components/platform/ui/ModulePage'
import { ModuleStatGrid, ModuleRefreshControl } from '@/components/platform/ui/ModuleStatGrid'
import { ModuleNotice } from '@/components/platform/ui/ModuleNotice'
import type { RopaEntry, RopaStats, RopaConsentCoverage } from '@/types/dpdp'

export default function RopaPage() {
  const [stats, setStats]       = useState<RopaStats | null>(null)
  const [entries, setEntries]   = useState<RopaEntry[]>([])
  const [coverage, setCoverage] = useState<Record<string, RopaConsentCoverage>>({})
  const [loading, setLoading]   = useState(true)
  const [showAdd, setShowAdd]   = useState(false)
  const [showTpl, setShowTpl]   = useState(false)
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date())
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const cancelledRef = useRef(false)

  const load = useCallback(async () => {
    try {
      const [statsRes, listRes] = await Promise.all([
        fetch('/api/trustdeck/ropa/stats'),
        fetch('/api/trustdeck/ropa?limit=50'),
      ])
      const statsJson = await statsRes.json()
      const listJson  = await listRes.json()
      if (cancelledRef.current) return
      if (statsJson.success) setStats(statsJson.data as RopaStats)
      if (listJson.success) {
        setEntries(listJson.data as RopaEntry[])
        setCoverage((listJson.coverage as Record<string, RopaConsentCoverage>) ?? {})
      }
    } finally {
      if (!cancelledRef.current) {
        setLoading(false)
        setLastRefreshed(new Date())
      }
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    cancelledRef.current = false
    load()
    intervalRef.current = setInterval(() => {
      if (document.visibilityState === 'visible') void load()
    }, 30_000)
    const handleVisibility = () => { if (document.visibilityState === 'visible') void load() }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      cancelled = true
      cancelledRef.current = cancelled
      if (intervalRef.current) clearInterval(intervalRef.current)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [load])

  useEffect(() => {
    if (!showAdd && !showTpl) return
    const previousOverflow = document.body.style.overflow
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowAdd(false)
        setShowTpl(false)
      }
    }
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [showAdd, showTpl])

  async function createEntry(data: Partial<RopaEntry>): Promise<RopaEntry> {
    const response = await fetch('/api/trustdeck/ropa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const result = await response.json() as { data?: RopaEntry; error?: string }
    if (!response.ok || !result.data) throw new Error(result.error || 'Failed to add processing activity.')
    return result.data
  }

  async function handleManualAdd(data: Partial<RopaEntry>) {
    await createEntry(data)
    setShowAdd(false)
    await load()
  }

  async function handleTemplateAdd(items: Partial<RopaEntry>[]) {
    await Promise.all(items.map(item => createEntry(item)))
    setShowTpl(false)
    await load()
  }

  const hasEntries = entries.length > 0

  return (
    <div className="space-y-6">
      <ModulePageHeader
        eyebrow="DPDP processing inventory"
        title="ROPA Builder"
        description="Record of Processing Activities"
        action={
          <>
            <ModuleRefreshControl onRefresh={() => load()} lastRefreshed={lastRefreshed} />
            <button type="button" onClick={() => setShowTpl(true)} className="btn btn-ghost inline-flex min-h-11 items-center gap-1.5">
              <Layers size={15} /> Add from Template
            </button>
            <button type="button" onClick={() => setShowAdd(true)} className="btn btn-accent inline-flex min-h-11 items-center gap-1.5">
              <Plus size={15} /> Add Activity
            </button>
          </>
        }
      />

      {loading ? (
        <ModulePageSkeleton cards={4} showHeader={false} className="max-w-none" />
      ) : (
        <ModulePage className="space-y-6">
          {/* Consent-gap alert */}
          {stats && stats.consent_gaps > 0 && (
            <ModuleNotice
              tone="amber"
              alert
              icon={<ShieldAlert size={20} />}
              eyebrow="Consent gap"
              title={`${stats.consent_gaps} consent-based ${stats.consent_gaps === 1 ? 'activity has' : 'activities have'} no matching consent purpose`}
              description={<>Configure these in <Link href="/trustdeck/consent" className="font-semibold text-accent hover:underline">Consent Management</Link> to close the cross-reference gap.</>}
            />
          )}

          {/* Stats */}
          <ModuleStatGrid
            items={[
              { icon: <Database size={16} />, label: 'Total Activities', value: stats?.total ?? 0, tone: 'blue' },
              { icon: <FileCheck2 size={16} />, label: 'Active', value: stats?.active ?? 0, tone: 'green' },
              { icon: <Clock size={16} />, label: 'Awaiting Approval', value: stats?.awaiting_approval ?? 0, tone: (stats?.awaiting_approval ?? 0) > 0 ? 'amber' : 'green' },
              { icon: <ShieldAlert size={16} />, label: 'Consent Gaps', value: stats?.consent_gaps ?? 0, tone: (stats?.consent_gaps ?? 0) > 0 ? 'red' : 'green' },
            ]}
          />

          {stats && stats.consent_based > 0 && (
            <ModuleNotice
              tone="green"
              icon={<CheckCircle2 size={17} />}
              title={`${stats.consent_configured} of ${stats.consent_based} consent-based ${stats.consent_based === 1 ? 'activity has' : 'activities have'} a matching consent purpose`}
            />
          )}

          {/* Activities + exports */}
          <ModulePanel>
            <ModulePanelHeader
              title="Processing Activities"
              action={
                <div className="flex flex-wrap items-center gap-2">
                  {hasEntries && (
                    <>
                      <Link href="/api/trustdeck/ropa/export/pdf" prefetch={false} className="btn btn-ghost inline-flex min-h-10 items-center gap-1.5">
                        <FileDown size={14} /> PDF
                      </Link>
                      <Link href="/api/trustdeck/ropa/export/csv" prefetch={false} className="btn btn-ghost inline-flex min-h-10 items-center gap-1.5">
                        <Sheet size={14} /> Excel (CSV)
                      </Link>
                    </>
                  )}
                  <Link href="/trustdeck/ropa/list" className="inline-flex items-center gap-1 text-sm text-accent hover:underline">
                    View all <ArrowRight size={13} />
                  </Link>
                </div>
              }
            />
            <div className="p-5">
              <RopaTable entries={entries.slice(0, 8)} coverage={coverage} />
            </div>
          </ModulePanel>
        </ModulePage>
      )}

      {showAdd && (
        <div className="module-dialog-backdrop fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overscroll-contain p-2 sm:p-4" onClick={() => setShowAdd(false)}>
          <div role="dialog" aria-modal="true" aria-labelledby="ropa-add-title" className="module-dialog-surface max-h-[calc(100dvh-1rem)] w-full max-w-2xl overflow-y-auto rounded-xl sm:max-h-[calc(100dvh-2rem)]" onClick={event => event.stopPropagation()}>
            <div className="module-dialog-header sticky top-0 z-10 flex items-center justify-between px-4 py-3 sm:px-6">
              <h2 id="ropa-add-title" className="font-display text-lg font-semibold text-text">Add processing activity</h2>
              <button type="button" onClick={() => setShowAdd(false)} aria-label="Close activity form" className="grid h-10 w-10 place-items-center rounded-lg text-text-faint hover:bg-glass hover:text-text"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-4 sm:p-6"><RopaEntryForm onSave={handleManualAdd} /></div>
          </div>
        </div>
      )}

      {showTpl && (
        <div className="module-dialog-backdrop fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overscroll-contain p-2 sm:p-4" onClick={() => setShowTpl(false)}>
          <div role="dialog" aria-modal="true" aria-labelledby="ropa-template-title" className="module-dialog-surface max-h-[calc(100dvh-1rem)] w-full max-w-2xl overflow-y-auto rounded-xl p-3 sm:max-h-[calc(100dvh-2rem)] sm:p-5" onClick={event => event.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between gap-3 border-b border-line px-1 pb-3">
              <h2 id="ropa-template-title" className="font-display text-lg font-semibold text-text">ROPA templates</h2>
              <button type="button" onClick={() => setShowTpl(false)} aria-label="Close ROPA templates" className="grid h-10 w-10 place-items-center rounded-lg text-text-faint hover:bg-glass hover:text-text"><X className="h-5 w-5" /></button>
            </div>
            <RopaTemplatePicker onSelect={handleTemplateAdd} />
          </div>
        </div>
      )}
    </div>
  )
}
