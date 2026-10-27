'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { ChevronLeft, Search, X, Plus } from 'lucide-react'
import { RopaTable } from '@/components/platform/modules/ropa/RopaTable'
import { RopaEntryForm } from '@/components/platform/modules/ropa/RopaEntryForm'
import { ROPA_SUBJECT_TYPES } from '@/lib/platform/constants'
import type { RopaEntry, RopaConsentCoverage } from '@/types/dpdp'

const STATUS_FILTERS: { label: string; value: string }[] = [
  { label: 'All',      value: 'all' },
  { label: 'Draft',    value: 'draft' },
  { label: 'Active',   value: 'active' },
  { label: 'Archived', value: 'archived' },
]

export default function RopaListPage() {
  const [entries, setEntries]   = useState<RopaEntry[]>([])
  const [coverage, setCoverage] = useState<Record<string, RopaConsentCoverage>>({})
  const [loading, setLoading]   = useState(true)
  const [status, setStatus]     = useState('all')
  const [subjectType, setSubjectType] = useState('all')
  const [search, setSearch]     = useState('')
  const [total, setTotal]       = useState(0)
  const [page, setPage]         = useState(1)
  const [showAdd, setShowAdd]   = useState(false)
  const limit = 20

  const load = useCallback(async (s: string, st: string, q: string, p: number) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: String(limit), page: String(p) })
      if (s !== 'all')  params.set('status', s)
      if (st !== 'all') params.set('subject_type', st)
      if (q)            params.set('search', q)
      const res  = await fetch(`/api/trustdeck/ropa?${params}`)
      const json = await res.json()
      if (json.success) {
        setEntries(json.data as RopaEntry[])
        setCoverage((json.coverage as Record<string, RopaConsentCoverage>) ?? {})
        setTotal(json.total as number)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load(status, subjectType, search, page) }, [load, status, subjectType, search, page])

  const totalPages = Math.ceil(total / limit)

  async function handleAdd(data: Partial<RopaEntry>) {
    const response = await fetch('/api/trustdeck/ropa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const result = await response.json() as { data?: RopaEntry; error?: string }
    if (!response.ok || !result.data) throw new Error(result.error || 'Failed to add processing activity.')
    setShowAdd(false)
    await load(status, subjectType, search, page)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link href="/trustdeck/ropa" className="btn btn-ghost inline-flex items-center gap-1 mb-3">
            <ChevronLeft size={14} /> Back to ROPA Builder
          </Link>
          <h1 className="font-display text-xl font-semibold text-text sm:text-2xl">Processing Activities</h1>
          <p className="text-sm text-text-muted mt-0.5">{total.toLocaleString('en-IN')} {total === 1 ? 'activity' : 'activities'}</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn btn-accent inline-flex min-h-11 w-full items-center justify-center gap-1.5 sm:w-auto">
          <Plus size={15} /> Add Activity
        </button>
      </div>

      {/* Filters + search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="flex w-full items-center gap-1 overflow-x-auto rounded-lg bg-surface-2 p-1 sm:w-auto">
          {STATUS_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => { setStatus(f.value); setPage(1) }}
              className={`min-h-10 shrink-0 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                status === f.value ? 'bg-bg-2 text-accent shadow-sm' : 'text-text-muted hover:text-text'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <select value={subjectType} onChange={e => { setSubjectType(e.target.value); setPage(1) }} className="min-h-11 w-full rounded-lg border border-line bg-bg-2 px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent sm:w-auto">
          <option value="all">All data subjects</option>
          {ROPA_SUBJECT_TYPES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>

        <div className="relative min-w-0 flex-1 sm:max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-faint" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search by activity name…"
            className="min-h-11 w-full rounded-lg border border-line bg-bg-2 py-2 pl-9 pr-10 text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent"
          />
          {search && (
            <button onClick={() => { setSearch(''); setPage(1) }} aria-label="Clear activity search" className="absolute right-1 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center text-text-faint hover:text-text-muted">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-line bg-bg-2 p-3 shadow-card sm:p-6">
        <RopaTable entries={entries} coverage={coverage} loading={loading} />
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col gap-3 text-sm text-text-muted sm:flex-row sm:items-center sm:justify-between">
          <span>Page {page} of {totalPages}</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="min-h-11 flex-1 rounded-lg border border-line px-3 py-1.5 transition-colors hover:bg-glass disabled:opacity-40 sm:flex-none">
              Previous
            </button>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="min-h-11 flex-1 rounded-lg border border-line px-3 py-1.5 transition-colors hover:bg-glass disabled:opacity-40 sm:flex-none">
              Next
            </button>
          </div>
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overscroll-contain bg-black/45 p-2 sm:p-4" onClick={() => setShowAdd(false)}>
          <div role="dialog" aria-modal="true" aria-labelledby="ropa-list-add-title" className="max-h-[calc(100dvh-1rem)] w-full max-w-2xl overflow-y-auto rounded-xl bg-bg-2 shadow-xl sm:max-h-[calc(100dvh-2rem)]" onClick={event => event.stopPropagation()}>
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-bg-2/95 px-4 py-3 backdrop-blur sm:px-6">
              <h2 id="ropa-list-add-title" className="font-display text-lg font-semibold text-text">Add processing activity</h2>
              <button type="button" onClick={() => setShowAdd(false)} aria-label="Close activity form" className="grid h-10 w-10 place-items-center rounded-lg text-text-faint hover:bg-glass hover:text-text"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-4 sm:p-6"><RopaEntryForm onSave={handleAdd} /></div>
          </div>
        </div>
      )}
    </div>
  )
}
