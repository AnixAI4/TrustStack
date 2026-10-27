'use client'

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { ComplaintStatusBadge } from './ComplaintStatusBadge'
import { COMPLAINT_TYPES } from '@/lib/constants'
import type { GrievanceComplaint } from '@/types/dpdp'

interface Props {
  complaints: GrievanceComplaint[]
  loading?: boolean
}

function getComplaintTypeLabel(value: string): string {
  return COMPLAINT_TYPES.find(t => t.value === value)?.label ?? value
}

export function ComplaintsTable({ complaints, loading }: Props) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  if (complaints.length === 0) {
    return (
      <div className="text-center py-12 bg-green-50 border border-green-100 rounded-xl">
        <p className="text-green-700 font-medium">No complaints received</p>
        <p className="text-sm text-green-600 mt-1">Keep up the good compliance work.</p>
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
            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 pr-4">Complainant</th>
            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 pr-4">Type</th>
            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 pr-4">Status</th>
            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {complaints.map(c => (
            <tr key={c.id} className="hover:bg-gray-50 transition-colors">
              <td className="py-3 pr-4">
                <span className="font-mono text-xs font-semibold text-[#003366]">{c.reference_number}</span>
              </td>
              <td className="py-3 pr-4 text-gray-600 whitespace-nowrap">
                {new Date(c.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </td>
              <td className="py-3 pr-4">
                <div className="font-medium text-[#1A1A2E]">{c.complainant_name}</div>
                {(c.complainant_email || c.complainant_phone) && (
                  <div className="text-xs text-gray-400">{c.complainant_email ?? c.complainant_phone}</div>
                )}
              </td>
              <td className="py-3 pr-4 text-gray-600">{getComplaintTypeLabel(c.complaint_type)}</td>
              <td className="py-3 pr-4">
                <ComplaintStatusBadge status={c.status} />
              </td>
              <td className="py-3">
                <Link
                  href={`/dashboard/grievance/complaints/${c.id}`}
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
