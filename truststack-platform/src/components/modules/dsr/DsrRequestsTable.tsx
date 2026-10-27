'use client'

import Link from 'next/link'
import { ChevronRight, ShieldCheck, ShieldAlert } from 'lucide-react'
import { DsrStatusBadge } from './DsrStatusBadge'
import { SlaIndicator } from './SlaIndicator'
import { DSR_RIGHT_TYPES } from '@/lib/constants'
import { isOverdue } from '@/lib/dsr/sla'
import type { DsrRequest } from '@/types/dpdp'

interface Props {
  requests: DsrRequest[]
  loading?: boolean
}

function rightLabel(value: string): string {
  return DSR_RIGHT_TYPES.find(r => r.value === value)?.label ?? value
}

export function DsrRequestsTable({ requests, loading }: Props) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-12 bg-green-50 border border-green-100 rounded-xl">
        <p className="text-green-700 font-medium">No data rights requests yet</p>
        <p className="text-sm text-green-600 mt-1">Requests submitted via your public portal will appear here.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 pr-4">Reference</th>
            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 pr-4">Date</th>
            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 pr-4">Requestor</th>
            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 pr-4">Right</th>
            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 pr-4">Status</th>
            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 pr-4">SLA</th>
            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {requests.map(r => {
            const overdue = isOverdue(r)
            return (
              <tr key={r.id} className={`transition-colors ${overdue ? 'bg-red-50/50 hover:bg-red-50' : 'hover:bg-gray-50'}`}>
                <td className="py-3 pr-4">
                  <span className="font-mono text-xs font-semibold text-[#003366]">{r.reference_number}</span>
                </td>
                <td className="py-3 pr-4 text-gray-600 whitespace-nowrap">
                  {new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </td>
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-[#1A1A2E]">{r.requestor_name}</span>
                    {r.requestor_identity_verified ? (
                      <ShieldCheck size={13} className="text-green-500 shrink-0" aria-label="Identity verified" />
                    ) : (
                      <ShieldAlert size={13} className="text-amber-500 shrink-0" aria-label="Identity not verified" />
                    )}
                  </div>
                  {r.requestor_email && <div className="text-xs text-gray-400">{r.requestor_email}</div>}
                </td>
                <td className="py-3 pr-4 text-gray-600">{rightLabel(r.right_type)}</td>
                <td className="py-3 pr-4"><DsrStatusBadge status={r.status} /></td>
                <td className="py-3 pr-4"><SlaIndicator dueDate={r.due_date} status={r.status} /></td>
                <td className="py-3">
                  <Link
                    href={`/dashboard/dsr/requests/${r.id}`}
                    className="inline-flex items-center text-[#003366] hover:text-[#1A5276] font-medium"
                  >
                    View <ChevronRight size={14} />
                  </Link>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
