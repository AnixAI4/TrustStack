'use client'

import Link from 'next/link'
import { ChevronRight, Database } from 'lucide-react'
import { RopaStatusBadge } from './RopaStatusBadge'
import { RopaConsentBadge } from './RopaConsentBadge'
import { ModuleEmptyState } from '@/components/platform/ui/ModuleStatGrid'
import { DPDP_BASES, ROPA_SUBJECT_TYPES } from '@/lib/platform/constants'
import type { RopaEntry, RopaConsentCoverage } from '@/types/dpdp'

interface Props {
  entries: RopaEntry[]
  coverage?: Record<string, RopaConsentCoverage>
  loading?: boolean
}

function basisLabel(v: string): string {
  return DPDP_BASES.find(basis => basis.id === v)?.label ?? v
}

function subjectLabel(v: string): string {
  return ROPA_SUBJECT_TYPES.find(s => s.value === v)?.label ?? v
}

export function RopaTable({ entries, coverage = {}, loading }: Props) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 bg-surface-2 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <ModuleEmptyState
        icon={<Database className="h-5 w-5" />}
        title="No ROPA entries yet"
        description="Add a processing activity or start from a template using the actions above."
      />
    )
  }

  return (
    <div className="overflow-x-auto overscroll-x-contain">
      <table className="module-table w-full min-w-[760px] text-sm">
        <thead>
          <tr className="border-b border-line">
            <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider py-3 pr-4">Activity</th>
            <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider py-3 pr-4">Legal Basis</th>
            <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider py-3 pr-4">Subjects</th>
            <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider py-3 pr-4">Consent</th>
            <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider py-3 pr-4">Status</th>
            <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider py-3">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {entries.map(e => (
            <tr key={e.id} className="hover:bg-glass">
              <td className="py-3 pr-4 text-text font-medium max-w-[200px] truncate">{e.activity_name}</td>
              <td className="py-3 pr-4 text-text-muted">{basisLabel(e.legal_basis)}</td>
              <td className="py-3 pr-4 text-text-muted text-xs">
                {e.data_subject_types?.slice(0, 2).map(subjectLabel).join(', ')}
                {e.data_subject_types && e.data_subject_types.length > 2 && ` +${e.data_subject_types.length - 2}`}
              </td>
              <td className="py-3 pr-4">
                <RopaConsentBadge coverage={coverage[e.id]} />
              </td>
              <td className="py-3 pr-4"><RopaStatusBadge status={e.status} /></td>
              <td className="py-3">
                <Link href={`/trustdeck/ropa/${e.id}`} className="inline-flex min-h-10 items-center text-accent hover:text-accent font-medium">
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
