'use client'

import Link from 'next/link'
import { ChevronRight, Users, ShieldCheck } from 'lucide-react'
import { BreachStatusBadge } from './BreachStatusBadge'
import { BreachCountdown } from './BreachCountdown'
import { ModuleEmptyState } from '@/components/platform/ui/ModuleStatGrid'
import { BREACH_NATURE_TYPES } from '@/lib/platform/constants'
import { isOverdue } from '@/lib/platform/breach/countdown'
import type { BreachIncident } from '@/types/dpdp'

interface Props {
  incidents: BreachIncident[]
  loading?: boolean
}

function natureLabel(value: string): string {
  return BREACH_NATURE_TYPES.find(n => n.value === value)?.label ?? value
}

// The Breach Register - the chronological audit log of all incidents.
export function BreachTable({ incidents, loading }: Props) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-12 bg-surface-2 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  if (incidents.length === 0) {
    return (
      <ModuleEmptyState
        icon={<ShieldCheck className="h-5 w-5" />}
        title="No breaches logged"
        description="Log an incident the moment you become aware of one — the 72-hour DPBI clock starts at discovery."
      />
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="module-table w-full text-sm">
        <thead>
          <tr className="border-b border-line">
            <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider py-3 pr-4">Reference</th>
            <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider py-3 pr-4">Discovered</th>
            <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider py-3 pr-4">Nature</th>
            <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider py-3 pr-4">Affected</th>
            <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider py-3 pr-4">Status</th>
            <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider py-3 pr-4">DPBI Deadline</th>
            <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider py-3">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {incidents.map(b => {
            const flag = !b.dpbi_notified && b.status !== 'resolved' && isOverdue(b.dpbi_notification_due_at)
            return (
              <tr key={b.id} className={`transition-colors ${flag ? 'bg-red/[0.07] hover:bg-red/[0.11]' : 'hover:bg-glass'}`}>
                <td className="py-3 pr-4">
                  <span className="font-mono text-xs font-semibold text-accent">{b.reference_number}</span>
                </td>
                <td className="py-3 pr-4 text-text-muted whitespace-nowrap">
                  {new Date(b.discovered_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </td>
                <td className="py-3 pr-4 text-text-muted">{natureLabel(b.nature)}</td>
                <td className="py-3 pr-4 text-text-muted">
                  {b.data_subjects_affected_approx != null ? (
                    <span className="inline-flex items-center gap-1"><Users size={13} className="text-text-faint" />~{b.data_subjects_affected_approx.toLocaleString('en-IN')}</span>
                  ) : (
                    <span className="text-text-faint"> - </span>
                  )}
                </td>
                <td className="py-3 pr-4"><BreachStatusBadge status={b.status} /></td>
                <td className="py-3 pr-4"><BreachCountdown dueAt={b.dpbi_notification_due_at} dpbiNotified={b.dpbi_notified} /></td>
                <td className="py-3">
                  <Link
                    href={`/trustdeck/breach/${b.id}`}
                    className="inline-flex items-center text-accent hover:text-accent font-medium"
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
