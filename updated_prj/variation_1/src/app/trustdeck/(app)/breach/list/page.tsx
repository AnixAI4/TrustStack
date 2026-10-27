'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Search, X, Plus } from 'lucide-react'
import { BreachTable } from '@/components/platform/modules/breach/BreachTable'
import { BreachLogModal } from '@/components/platform/modules/breach/BreachLogModal'
import { BREACH_NATURE_TYPES } from '@/lib/platform/constants'
import type { BreachIncident } from '@/types/dpdp'

const STATUS_FILTERS: { label: string; value: string }[] = [
  { label: 'All',       value: 'all' },
  { label: 'Open',      value: 'open' },
  { label: 'Contained', value: 'contained' },
  { label: 'Resolved',  value: 'resolved' },
]

export default function BreachRegisterPage() {
  const router = useRouter()
  const [incidents, setIncidents] = useState<BreachIncident[]>([])
  const [loading, setLoading]     = useState(true)
  const [status, setStatus]       = useState('all')
  const [nature, setNature]       = useState('all')
  const [search, setSearch]       = useState('')
  const [total, setTotal]         = useState(0)
  const [page, setPage]           = useState(1)
  const [logOpen, setLogOpen]     = useState(false)
  const limit = 20

  const load = useCallback(async (s: string, n: string, q: string, p: number) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: String(limit), page: String(p) })
      if (s !== 'all') params.set('status', s)
      if (n !== 'all') params.set('nature', n)
      if (q)           params.set('search', q)
      const res  = await fetch(`/api/trustdeck/breach?${params}`)
      const json = await res.json()
      if (json.success) {
        setIncidents(json.data as BreachIncident[])
        setTotal(json.total as number)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load(status, nature, search, page) }, [load, status, nature, search, page])

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <Link href="/trustdeck/breach" className="btn btn-ghost inline-flex items-center gap-1 mb-3">
            <ChevronLeft size={14} /> Back to Breach Response
          </Link>
          <h1 className="font-display text-2xl font-semibold text-text">Breach Register</h1>
          <p className="text-sm text-text-muted mt-0.5">{total.toLocaleString('en-IN')} incident{total !== 1 ? 's' : ''} - the chronological audit log</p>
        </div>
        <button
          onClick={() => setLogOpen(true)}
          className="inline-flex min-h-10 items-center gap-1.5 rounded-pill bg-red px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red/90"
        >
          <Plus size={14} /> Log Breach
        </button>
      </div>

      {/* Filters + search */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1 bg-surface-2 rounded-lg p-1 flex-wrap">
          {STATUS_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => { setStatus(f.value); setPage(1) }}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                status === f.value ? 'bg-bg-2 text-accent shadow-sm' : 'text-text-muted hover:text-text'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <select
          value={nature}
          onChange={e => { setNature(e.target.value); setPage(1) }}
          className="text-sm border border-line rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <option value="all">All natures</option>
          {BREACH_NATURE_TYPES.map(n => <option key={n.value} value={n.value}>{n.label}</option>)}
        </select>

        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-faint" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search by reference…"
            className="w-full pl-9 pr-8 py-2 text-sm border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
          />
          {search && (
            <button onClick={() => { setSearch(''); setPage(1) }} className="absolute right-2 top-1/2 -translate-y-1/2 text-text-faint hover:text-text-muted">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-line bg-bg-2 p-6 shadow-card">
        <BreachTable incidents={incidents} loading={loading} />
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-text-muted">
          <span>Page {page} of {totalPages}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 border border-line rounded-lg disabled:opacity-40 hover:bg-glass transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 border border-line rounded-lg disabled:opacity-40 hover:bg-glass transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      <BreachLogModal
        open={logOpen}
        onClose={() => setLogOpen(false)}
        onLogged={incident => { setLogOpen(false); router.push(`/trustdeck/breach/${incident.id}`) }}
      />
    </div>
  )
}
