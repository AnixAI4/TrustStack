'use client'

import { useEffect, useState, useCallback } from 'react'
import { Download, ChevronLeft, ChevronRight, Filter } from 'lucide-react'
import { ConsentRecord } from '@/types/dpdp'

interface AuditResponse {
  records: ConsentRecord[]
  total: number
  page: number
  pages: number
}

export default function AuditTable() {
  const [data, setData] = useState<AuditResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [channel, setChannel] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  const fetchRecords = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: '25' })
    if (channel) params.set('channel', channel)
    if (fromDate) params.set('from_date', fromDate)
    if (toDate) params.set('to_date', toDate)

    const res = await fetch(`/api/consent/audit?${params}`)
    const json = await res.json()
    if (!json.error) setData(json)
    setLoading(false)
  }, [page, channel, fromDate, toDate])

  useEffect(() => { fetchRecords() }, [fetchRecords])

  const exportCSV = () => {
    if (!data?.records.length) return
    const headers = ['ID', 'Date', 'Channel', 'Version', 'Purposes Accepted', 'Purposes Rejected', 'Language', 'Status']
    const rows = data.records.map(r => [
      r.id,
      new Date(r.created_at).toLocaleDateString('en-IN'),
      r.channel,
      r.config_version,
      r.purposes_accepted.join(';'),
      r.purposes_rejected.join(';'),
      r.language,
      r.withdrawn ? 'Withdrawn' : 'Active',
    ])
    const csv = [headers, ...rows].map(row => row.map(v => `"${v}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `consent-audit-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 p-4 border-b border-gray-100">
        <Filter className="w-4 h-4 text-gray-400 shrink-0" />

        <select
          value={channel}
          onChange={e => { setChannel(e.target.value); setPage(1) }}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]/20"
        >
          <option value="">All Channels</option>
          <option value="web">Web</option>
          <option value="whatsapp">WhatsApp</option>
          <option value="sms">SMS</option>
        </select>

        <input
          type="date"
          value={fromDate}
          onChange={e => { setFromDate(e.target.value); setPage(1) }}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]/20"
        />
        <span className="text-gray-400 text-sm">to</span>
        <input
          type="date"
          value={toDate}
          onChange={e => { setToDate(e.target.value); setPage(1) }}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]/20"
        />

        <div className="ml-auto">
          <button
            onClick={exportCSV}
            disabled={!data?.records.length}
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-40"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              {['ID', 'Date', 'Channel', 'Version', 'Purposes Accepted', 'Language', 'Status'].map(h => (
                <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-gray-50">
                  {Array.from({ length: 7 }).map((__, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 bg-gray-100 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data?.records.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-gray-400 text-sm">
                  No consent records found for the selected filters.
                </td>
              </tr>
            ) : (
              data?.records.map(r => (
                <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-gray-400">
                    {r.id.slice(0, 8)}…
                  </td>
                  <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                    {new Date(r.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-[#003366] capitalize">
                      {r.channel}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">v{r.config_version}</td>
                  <td className="px-4 py-3 text-gray-600 max-w-[200px]">
                    {r.purposes_accepted.length > 0
                      ? r.purposes_accepted.join(', ')
                      : <span className="text-gray-400 italic">None</span>}
                  </td>
                  <td className="px-4 py-3 uppercase text-xs text-gray-500">{r.language}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      r.withdrawn
                        ? 'bg-red-50 text-red-600'
                        : 'bg-green-50 text-green-700'
                    }`}>
                      {r.withdrawn ? 'Withdrawn' : 'Active'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data && data.pages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            {data.total} records · Page {data.page} of {data.pages}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage(p => Math.min(data.pages, p + 1))}
              disabled={page === data.pages}
              className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
