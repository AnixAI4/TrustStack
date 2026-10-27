'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { ChevronLeft, Search, X } from 'lucide-react'
import { ComplaintsTable } from '@/components/platform/modules/grievance/ComplaintsTable'
import type { GrievanceComplaint } from '@/types/dpdp'

const FILTERS: { label: string; value: string }[] = [
  { label: 'All',          value: 'all' },
  { label: 'New',          value: 'new' },
  { label: 'Under Review', value: 'under_review' },
  { label: 'Resolved',     value: 'resolved' },
  { label: 'Escalated',    value: 'escalated_to_dpbi' },
]

export default function ComplaintsPage() {
  const [complaints, setComplaints] = useState<GrievanceComplaint[]>([])
  const [loading, setLoading]       = useState(true)
  const [activeFilter, setFilter]   = useState<string>('all')
  const [search, setSearch]         = useState('')
  const [total, setTotal]           = useState(0)
  const [page, setPage]             = useState(1)
  const limit = 20

  const load = useCallback(async (filter: string, q: string, p: number) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: String(limit), page: String(p) })
      if (filter !== 'all') params.set('status', filter)
      if (q)                params.set('search', q)
      const res  = await fetch(`/api/trustdeck/grievance/complaints?${params}`)
      const json = await res.json()
      if (json.success) {
        setComplaints(json.data as GrievanceComplaint[])
        setTotal(json.total as number)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load(activeFilter, search, page) }, [load, activeFilter, search, page])

  function handleFilterChange(f: string) {
    setFilter(f)
    setPage(1)
  }

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSearch(e.target.value)
    setPage(1)
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link href="/trustdeck/grievance" className="btn btn-ghost inline-flex items-center gap-1 mb-3">
          <ChevronLeft size={14} /> Back to Grievance Portal
        </Link>
        <h1 className="font-display text-2xl font-semibold text-text">Complaints</h1>
        <p className="text-sm text-text-muted mt-0.5">{total.toLocaleString('en-IN')} total complaint{total !== 1 ? 's' : ''}</p>
      </div>

      {/* Filters + search */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1 bg-surface-2 rounded-lg p-1">
          {FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => handleFilterChange(f.value)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                activeFilter === f.value
                  ? 'bg-bg-2 text-accent shadow-sm'
                  : 'text-text-muted hover:text-text'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-faint" />
          <input
            value={search}
            onChange={handleSearchChange}
            placeholder="Search by reference or name…"
            className="w-full pl-9 pr-8 py-2 text-sm border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
          />
          {search && (
            <button
              onClick={() => { setSearch(''); setPage(1) }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-text-faint hover:text-text-muted"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-line bg-bg-2 p-6 shadow-card">
        <ComplaintsTable complaints={complaints} loading={loading} />
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
    </div>
  )
}
