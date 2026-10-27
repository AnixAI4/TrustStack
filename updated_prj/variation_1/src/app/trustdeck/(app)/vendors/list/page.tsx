'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { ChevronLeft, Search, X, Plus } from 'lucide-react'
import { VendorsTable } from '@/components/platform/modules/vendors/VendorsTable'
import { VendorFormModal } from '@/components/platform/modules/vendors/VendorFormModal'
import { VENDOR_TYPES } from '@/lib/platform/constants'
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
  const [loadError, setLoadError] = useState<string | null>(null)
  const limit = 20

  const load = useCallback(async (s: string, r: string, t: string, q: string, p: number) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: String(limit), page: String(p) })
      if (s !== 'all') params.set('status', s)
      if (r !== 'all') params.set('risk_tier', r)
      if (t !== 'all') params.set('vendor_type', t)
      if (q)           params.set('search', q)
      const res = await fetch(`/api/trustdeck/vendors?${params}`)
      if (!res.ok) throw new Error('Could not load vendors')
      const json = await res.json()
      if (json.success) {
        setVendors(json.data as Vendor[])
        setTotal(json.total as number)
        setLoadError(null)
      }
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Could not load vendors')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load(status, risk, vendorType, search, page) }, [load, status, risk, vendorType, search, page])

  const totalPages = Math.ceil(total / limit)

  async function handleAdd(data: Partial<Vendor>) {
    const response = await fetch('/api/trustdeck/vendors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const result = await response.json() as { data?: Vendor; error?: string }
    if (!response.ok || !result.data) throw new Error(result.error || 'Failed to add vendor.')
    setShowAdd(false)
    await load(status, risk, vendorType, search, page)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link href="/trustdeck/vendors" className="btn btn-ghost inline-flex items-center gap-1 mb-3">
            <ChevronLeft size={14} /> Back to Vendor DPA Manager
          </Link>
          <h1 className="font-display text-xl font-semibold text-text sm:text-2xl">Vendor Registry</h1>
          <p className="text-sm text-text-muted mt-0.5">{total.toLocaleString('en-IN')} vendor{total !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn btn-accent inline-flex min-h-11 w-full items-center justify-center gap-1.5 sm:w-auto">
          <Plus size={15} /> Add Vendor
        </button>
      </div>

      {loadError && (
        <div className="rounded-xl border border-red/20 bg-red/10 px-4 py-3 text-sm text-red">
          {loadError}
        </div>
      )}

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

        <select value={risk} onChange={e => { setRisk(e.target.value); setPage(1) }} className="min-h-11 w-full rounded-lg border border-line bg-bg-2 px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent sm:w-auto">
          {RISK_FILTERS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>

        <select value={vendorType} onChange={e => { setVendorType(e.target.value); setPage(1) }} className="min-h-11 w-full rounded-lg border border-line bg-bg-2 px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent sm:w-auto">
          <option value="all">All types</option>
          {VENDOR_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>

        <div className="relative min-w-0 flex-1 sm:max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-faint" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search by vendor name…"
            className="min-h-11 w-full rounded-lg border border-line bg-bg-2 py-2 pl-9 pr-10 text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent"
          />
          {search && (
            <button onClick={() => { setSearch(''); setPage(1) }} aria-label="Clear vendor search" className="absolute right-1 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center text-text-faint hover:text-text-muted">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-line bg-bg-2 p-3 shadow-card sm:p-6">
        <VendorsTable vendors={vendors} loading={loading} />
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

      <VendorFormModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onSave={handleAdd}
      />
    </div>
  )
}
