'use client'

import Link from 'next/link'
import { ChevronRight, MessageCircle } from 'lucide-react'
import { ComplaintStatusBadge } from './ComplaintStatusBadge'
import { ModuleEmptyState } from '@/components/platform/ui/ModuleStatGrid'
import { COMPLAINT_TYPES } from '@/lib/platform/constants'
import type { GrievanceComplaint } from '@/types/dpdp'

interface Props {
  complaints: GrievanceComplaint[]
  loading?: boolean
}

function typeLabel(v: string): string {
  return COMPLAINT_TYPES.find(c => c.value === v)?.label ?? v
}

export function ComplaintsTable({ complaints, loading }: Props) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 bg-surface-2 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  if (complaints.length === 0) {
    return (
      <ModuleEmptyState
        icon={<MessageCircle className="h-5 w-5" />}
        title="No grievances filed yet"
        description="Complaints from your public form will appear here."
      />
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="module-table w-full text-sm">
        <thead>
          <tr className="border-b border-line">
            <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider py-3 pr-4">Reference</th>
            <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider py-3 pr-4">Name</th>
            <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider py-3 pr-4">Type</th>
            <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider py-3 pr-4">Filed</th>
            <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider py-3 pr-4">Status</th>
            <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider py-3">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {complaints.map(c => (
            <tr key={c.id} className="hover:bg-glass">
              <td className="py-3 pr-4 font-mono text-xs font-semibold text-accent">{c.reference_number}</td>
              <td className="py-3 pr-4 text-text">{c.complainant_name}</td>
              <td className="py-3 pr-4 text-text-muted">{typeLabel(c.complaint_type)}</td>
              <td className="py-3 pr-4 text-text-muted whitespace-nowrap">
                {new Date(c.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </td>
              <td className="py-3 pr-4"><ComplaintStatusBadge status={c.status} /></td>
              <td className="py-3">
                <Link href={`/trustdeck/grievance/complaints/${c.id}`} className="inline-flex items-center text-accent hover:text-accent font-medium">
                  View <ChevronRight size={14} />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
