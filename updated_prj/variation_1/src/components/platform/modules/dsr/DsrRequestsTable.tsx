'use client'

import Link from 'next/link'
import { ChevronRight, Users } from 'lucide-react'
import { DsrStatusBadge } from './DsrStatusBadge'
import { SlaIndicator } from './SlaIndicator'
import { ModuleEmptyState } from '@/components/platform/ui/ModuleStatGrid'
import { DSR_RIGHT_TYPES } from '@/lib/platform/constants'
import { isOverdue } from '@/lib/platform/dsr/sla'
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
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 bg-surface-2 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  if (requests.length === 0) {
    return (
      <ModuleEmptyState
        icon={<Users className="h-5 w-5" />}
        title="No DSR requests yet"
        description="Requests from your public DSR form will appear here."
      />
    )
  }

  return (
    <div className="overflow-x-auto overscroll-x-contain">
      <table className="module-table w-full min-w-[820px] text-sm">
        <thead>
          <tr className="border-b border-line">
            <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider py-3 pr-4">Reference</th>
            <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider py-3 pr-4">Name</th>
            <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider py-3 pr-4">Right</th>
            <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider py-3 pr-4">Received</th>
            <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider py-3 pr-4">Status</th>
            <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider py-3 pr-4">SLA</th>
            <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider py-3">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {requests.map(r => {
            const flag = isOverdue(r)
            return (
              <tr key={r.id} className={`transition-colors ${flag ? 'bg-red/[0.07] hover:bg-red/[0.11]' : 'hover:bg-glass'}`}>
                <td className="py-3 pr-4 font-mono text-xs font-semibold text-accent">{r.reference_number}</td>
                <td className="py-3 pr-4 text-text">{r.requestor_name}</td>
                <td className="py-3 pr-4 text-text-muted">{rightLabel(r.right_type)}</td>
                <td className="py-3 pr-4 text-text-muted whitespace-nowrap">
                  {new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </td>
                <td className="py-3 pr-4"><DsrStatusBadge status={r.status} /></td>
                <td className="py-3 pr-4"><SlaIndicator dueDate={r.due_date} status={r.status} /></td>
                <td className="py-3">
                  <Link href={`/trustdeck/dsr/requests/${r.id}`} className="inline-flex min-h-10 items-center text-accent hover:text-accent font-medium">
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
