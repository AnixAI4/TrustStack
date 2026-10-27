'use client'

import { ConsentRecord } from '@/types/dpdp'
import { ChevronRight, ScrollText } from 'lucide-react'
import { ModuleEmptyState } from '@/components/platform/ui/ModuleStatGrid'

interface Props {
  records: ConsentRecord[]
  loading?: boolean
}

function fmtDate(d: string): string {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export function AuditTable({ records, loading }: Props) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-10 bg-surface-2 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  if (!records.length) {
    return (
      <ModuleEmptyState
        icon={<ScrollText className="h-5 w-5" />}
        title="No consent records yet"
        description="Records will appear here as people interact with your published consent experience."
      />
    )
  }

  return (
    <div className="overflow-x-auto overscroll-x-contain">
      <table className="module-table w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-line">
            <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider py-3 pr-4">Principal ID</th>
            <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider py-3 pr-4">Timestamp</th>
            <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider py-3 pr-4">Action</th>
            <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider py-3 pr-4">Purposes</th>
            <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider py-3">Details</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {records.map(r => (
            <tr key={r.id} className="hover:bg-glass">
              <td className="py-2.5 pr-4 font-mono text-xs text-text-muted truncate max-w-[120px]">{r.data_principal_hash || r.id}</td>
              <td className="py-2.5 pr-4 text-text-muted whitespace-nowrap">{fmtDate(r.created_at)}</td>
              <td className="py-2.5 pr-4">
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    r.withdrawn ? 'bg-amber/10 text-amber' :
                    r.purposes_accepted.length > 0 ? 'bg-green/10 text-green' :
                    r.purposes_rejected.length > 0 ? 'bg-red/10 text-red' :
                    'bg-amber/10 text-amber'
                  }`}
                >
                  {r.withdrawn ? 'Withdrawn' : r.purposes_accepted.length > 0 ? 'Accepted' : 'Rejected'}
                </span>
              </td>
              <td className="py-2.5 pr-4 text-text-muted truncate max-w-[180px]">{r.purposes_accepted?.join(', ') ?? ' - '}</td>
              <td className="py-2.5">
                <span className="inline-flex items-center gap-1 text-text-muted">
                  {r.channel} <ChevronRight size={14} />
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
