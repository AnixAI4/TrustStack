'use client'

import Link from 'next/link'
import { ChevronRight, Users } from 'lucide-react'
import { BreachStatusBadge } from './BreachStatusBadge'
import { BreachCountdown } from './BreachCountdown'
import { BREACH_NATURE_TYPES } from '@/lib/constants'
import { isOverdue } from '@/lib/breach/countdown'
import type { BreachIncident } from '@/types/dpdp'

interface Props {
  incidents: BreachIncident[]
  loading?: boolean
}

function natureLabel(value: string): string {
  return BREACH_NATURE_TYPES.find(n => n.value === value)?.label ?? value
}

// The Breach Register — the chronological audit log of all incidents.
export function BreachTable({ incidents, loading }: Props) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  if (incidents.length === 0) {
    return (
      <div className="text-center py-12 bg-green-50 border border-green-100 rounded-xl">
        <p className="text-green-700 font-medium">No breaches logged</p>
        <p className="text-sm text-green-600 mt-1">Log an incident the moment you become aware of one — the 72-hour DPBI clock starts at discovery.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 pr-4">Reference</th>
            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 pr-4">Discovered</th>
            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 pr-4">Nature</th>
            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 pr-4">Affected</th>
            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 pr-4">Status</th>
            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 pr-4">DPBI Deadline</th>
            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {incidents.map(b => {
            const flag = !b.dpbi_notified && b.status !== 'resolved' && isOverdue(b.dpbi_notification_due_at)
            return (
              <tr key={b.id} className={`transition-colors ${flag ? 'bg-red-50/50 hover:bg-red-50' : 'hover:bg-gray-50'}`}>
                <td className="py-3 pr-4">
                  <span className="font-mono text-xs font-semibold text-[#003366]">{b.reference_number}</span>
                </td>
                <td className="py-3 pr-4 text-gray-600 whitespace-nowrap">
                  {new Date(b.discovered_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </td>
                <td className="py-3 pr-4 text-gray-600">{natureLabel(b.nature)}</td>
                <td className="py-3 pr-4 text-gray-600">
                  {b.data_subjects_affected_approx != null ? (
                    <span className="inline-flex items-center gap-1"><Users size={13} className="text-gray-400" />~{b.data_subjects_affected_approx.toLocaleString('en-IN')}</span>
                  ) : (
                    <span className="text-gray-300">—</span>
                  )}
                </td>
                <td className="py-3 pr-4"><BreachStatusBadge status={b.status} /></td>
                <td className="py-3 pr-4"><BreachCountdown dueAt={b.dpbi_notification_due_at} dpbiNotified={b.dpbi_notified} /></td>
                <td className="py-3">
                  <Link
                    href={`/dashboard/breach/${b.id}`}
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
