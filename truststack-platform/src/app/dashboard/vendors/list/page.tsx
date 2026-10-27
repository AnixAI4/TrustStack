'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { ChevronLeft, Search, X, Plus } from 'lucide-react'
import { VendorsTable } from '@/components/modules/vendors/VendorsTable'
import { VendorFormModal } from '@/components/modules/vendors/VendorFormModal'
import { VENDOR_TYPES } from '@/lib/constants'
import type { Vendor } from '@/types/dpdp'

const STATUS_FILTERS: { label: string; value: string }[] = [
  { label: 'All',     value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Sent',    value: 'sent' },
  { label: 'Signed',  value: 'signed' },
  { label: 'Expired', value: 'expired' },
]

const RISK_FILTERS: { label: string; value: string }[] = [
  { label: 'All risk',  value: 'all' },
  { label: 'Low',       value: 'low' },
  { label: 'Medium',    value: 'medium' },
  { label: 'High',      value: 'high' },
  { label: 'Critical',  value: 'critical' },
]

export default function VendorsListPage() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus]   = useState('all')
  const [risk, setRisk]       = useState('all')
  const [vendorType, setVendorType] = useState('all')
  const [search, setSearch]   = useState('')
  const [total, setTotal]     = useState(0)
  const [page, setPage]       = useState(1)
  const [showAdd, setShowAdd] = useState(false)
  const limit = 20

  const load = useCallback(async (s: string, r: string, t: string, q: string, p: number) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: String(limit), page: String(p) })
      if (s !== 'all') params.set('status', s)
      if (r !== 'all') params.set('risk_tier', r)
      if (t !== 'all') params.set('vendor_type', t)
      if (q)           params.set('search', q)
      const res  = await fetch(`/api/vendors?${params}`)
      const json = await res.json()
      if (json.success) {
        setVendors(json.data as Vendor[])
        setTotal(json.total as number)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load(status, risk, vendorType, search, page) }, [load, status, risk, vendorType, search, page])

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <Link href="/dashboard/vendors" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#003366] mb-3">
            <ChevronLeft size={14} /> Back to Vendor DPA Manager
          </Link>
          <h1 className="text-2xl font-bold text-[#003366]">Vendor Registry</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total.toLocaleString('en-IN')} vendor{total !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#003366] text-white text-sm font-medium rounded-lg hover:bg-[#1A5276] transition-colors">
          <Plus size={15} /> Add Vendor
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

        <select value={risk} onChange={e => { setRisk(e.target.value); setPage(1) }} className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#003366]">
          {RISK_FILTERS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>

        <select value={vendorType} onChange={e => { setVendorType(e.target.value); setPage(1) }} className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#003366]">
          <option value="all">All types</option>
          {VENDOR_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>

        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search by vendor name…"
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
        <VendorsTable vendors={vendors} loading={loading} />
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

      <VendorFormModal open={showAdd} onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); load(status, risk, vendorType, search, page) }} />
    </div>
  )
}
