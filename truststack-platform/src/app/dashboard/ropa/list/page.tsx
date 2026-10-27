'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { ChevronLeft, Search, X, Plus } from 'lucide-react'
import { RopaTable } from '@/components/modules/ropa/RopaTable'
import { RopaEntryForm } from '@/components/modules/ropa/RopaEntryForm'
import { ROPA_SUBJECT_TYPES } from '@/lib/constants'
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
      const res  = await fetch(`/api/ropa?${params}`)
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <Link href="/dashboard/ropa" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#003366] mb-3">
            <ChevronLeft size={14} /> Back to ROPA Builder
          </Link>
          <h1 className="text-2xl font-bold text-[#003366]">Processing Activities</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total.toLocaleString('en-IN')} {total === 1 ? 'activity' : 'activities'}</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#003366] text-white text-sm font-medium rounded-lg hover:bg-[#1A5276] transition-colors">
          <Plus size={15} /> Add Activity
        </button>
      </div>

      {/* Filters + search */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 flex-wrap">
          {STATUS_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => { setStatus(f.value); setPage(1) }}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                status === f.value ? 'bg-white text-[#003366] shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <select value={subjectType} onChange={e => { setSubjectType(e.target.value); setPage(1) }} className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#003366]">
          <option value="all">All data subjects</option>
          {ROPA_SUBJECT_TYPES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>

        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search by activity name…"
            className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003366]"
          />
          {search && (
            <button onClick={() => { setSearch(''); setPage(1) }} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <RopaTable entries={entries} coverage={coverage} loading={loading} />
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Page {page} of {totalPages}</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors">
              Previous
            </button>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors">
              Next
            </button>
          </div>
        </div>
      )}

      <RopaEntryForm open={showAdd} onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); load(status, subjectType, search, page) }} />
    </div>
  )
}
