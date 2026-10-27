'use client'

import Link from 'next/link'
import { ChevronRight, ShieldCheck, Globe } from 'lucide-react'
import { RopaStatusBadge } from './RopaStatusBadge'
import { RopaConsentBadge } from './RopaConsentBadge'
import { DPDP_BASES, ROPA_SUBJECT_TYPES } from '@/lib/constants'
import type { RopaEntry, RopaConsentCoverage } from '@/types/dpdp'

interface Props {
  entries: RopaEntry[]
  coverage?: Record<string, RopaConsentCoverage>
  loading?: boolean
}

const basisLabel = (id: string) => DPDP_BASES.find(b => b.id === id)?.label ?? id
const subjectLabel = (v: string) => ROPA_SUBJECT_TYPES.find(s => s.value === v)?.label ?? v

export function RopaTable({ entries, coverage, loading }: Props) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 border border-gray-100 rounded-xl">
        <p className="text-gray-700 font-medium">No processing activities yet</p>
        <p className="text-sm text-gray-500 mt-1">Add an activity manually, use AI assist, or load your industry template.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 pr-4">Activity</th>
            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 pr-4">Data Subjects</th>
            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 pr-4">Legal Basis</th>
            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 pr-4">Consent</th>
            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 pr-4">DPO</th>
            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 pr-4">Status</th>
            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {entries.map(e => (
            <tr key={e.id} className="hover:bg-gray-50 transition-colors">
              <td className="py-3 pr-4">
                <div className="font-medium text-[#1A1A2E] flex items-center gap-1.5">
                  {e.activity_name}
                  {e.cross_border_transfer && <Globe size={12} className="text-amber-500" aria-label="Cross-border transfer" />}
                </div>
                <div className="text-xs text-gray-400">{e.data_controller_name}</div>
              </td>
              <td className="py-3 pr-4 text-gray-600">
                {(e.data_subject_types ?? []).length
                  ? (e.data_subject_types ?? []).map(subjectLabel).join(', ')
                  : <span className="text-gray-300">—</span>}
              </td>
              <td className="py-3 pr-4 text-gray-600 whitespace-nowrap">{basisLabel(e.legal_basis)}</td>
              <td className="py-3 pr-4"><RopaConsentBadge coverage={coverage?.[e.id]} /></td>
              <td className="py-3 pr-4">
                {e.dpo_approved
                  ? <span className="inline-flex items-center gap-1 text-xs text-green-600"><ShieldCheck size={13} /> Approved</span>
                  : <span className="text-xs text-gray-400">Pending</span>}
              </td>
              <td className="py-3 pr-4"><RopaStatusBadge status={e.status} /></td>
              <td className="py-3">
                <Link
                  href={`/dashboard/ropa/${e.id}`}
                  className="inline-flex items-center text-[#003366] hover:text-[#1A5276] font-medium"
                >
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
