'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Search, X, Plus } from 'lucide-react'
import { BreachTable } from '@/components/modules/breach/BreachTable'
import { BreachLogModal } from '@/components/modules/breach/BreachLogModal'
import { BREACH_NATURE_TYPES } from '@/lib/constants'
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
      const res  = await fetch(`/api/breach?${params}`)
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <Link href="/dashboard/breach" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#003366] mb-3">
            <ChevronLeft size={14} /> Back to Breach Response
          </Link>
          <h1 className="text-2xl font-bold text-[#003366]">Breach Register</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total.toLocaleString('en-IN')} incident{total !== 1 ? 's' : ''} — the chronological audit log</p>
        </div>
        <button
          onClick={() => setLogOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
        >
          <Plus size={14} /> Log Breach
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

        <select
          value={nature}
          onChange={e => { setNature(e.target.value); setPage(1) }}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#003366]"
        >
          <option value="all">All natures</option>
          {BREACH_NATURE_TYPES.map(n => <option key={n.value} value={n.value}>{n.label}</option>)}
        </select>

        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search by reference…"
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
        <BreachTable incidents={incidents} loading={loading} />
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Page {page} of {totalPages}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      <BreachLogModal
        open={logOpen}
        onClose={() => setLogOpen(false)}
        onLogged={incident => { setLogOpen(false); router.push(`/dashboard/breach/${incident.id}`) }}
      />
    </div>
  )
}
