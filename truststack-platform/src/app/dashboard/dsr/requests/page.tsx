'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { ChevronLeft, Search, X } from 'lucide-react'
import { DsrRequestsTable } from '@/components/modules/dsr/DsrRequestsTable'
import { DSR_RIGHT_TYPES } from '@/lib/constants'
import type { DsrRequest } from '@/types/dpdp'

const STATUS_FILTERS: { label: string; value: string }[] = [
  { label: 'All',                  value: 'all' },
  { label: 'Received',             value: 'received' },
  { label: 'Awaiting Verification', value: 'identity_pending' },
  { label: 'Processing',           value: 'processing' },
  { label: 'Fulfilled',            value: 'fulfilled' },
  { label: 'Denied',               value: 'denied' },
]

export default function DsrRequestsPage() {
  const [requests, setRequests] = useState<DsrRequest[]>([])
  const [loading, setLoading]   = useState(true)
  const [status, setStatus]     = useState('all')
  const [rightType, setRightType] = useState('all')
  const [search, setSearch]     = useState('')
  const [total, setTotal]       = useState(0)
  const [page, setPage]         = useState(1)
  const limit = 20

  const load = useCallback(async (s: string, rt: string, q: string, p: number) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: String(limit), page: String(p) })
      if (s !== 'all')  params.set('status', s)
      if (rt !== 'all') params.set('right_type', rt)
      if (q)            params.set('search', q)
      const res  = await fetch(`/api/dsr/requests?${params}`)
      const json = await res.json()
      if (json.success) {
        setRequests(json.data as DsrRequest[])
        setTotal(json.total as number)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load(status, rightType, search, page) }, [load, status, rightType, search, page])

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <Link href="/dashboard/dsr" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#003366] mb-3">
          <ChevronLeft size={14} /> Back to DSR Management
        </Link>
        <h1 className="text-2xl font-bold text-[#003366]">Data Rights Requests</h1>
        <p className="text-sm text-gray-500 mt-0.5">{total.toLocaleString('en-IN')} total request{total !== 1 ? 's' : ''}</p>
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
          value={rightType}
          onChange={e => { setRightType(e.target.value); setPage(1) }}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#003366]"
        >
          <option value="all">All rights</option>
          {DSR_RIGHT_TYPES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>

        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search by reference or name…"
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
        <DsrRequestsTable requests={requests} loading={loading} />
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
    </div>
  )
}
