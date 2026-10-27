'use client'

import { AlertTriangle, User, Mail, Phone, Briefcase, Calendar, ExternalLink, Edit2 } from 'lucide-react'
import type { GrievanceOfficer } from '@/types/dpdp'

interface Props {
  officer: GrievanceOfficer | null
  orgSlug: string
  onEdit: () => void
}

export function GrievanceOfficerCard({ officer, orgSlug, onEdit }: Props) {
  if (!officer) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-5 flex items-start gap-4">
        <AlertTriangle className="text-red-500 mt-0.5 shrink-0" size={20} />
        <div className="flex-1">
          <p className="font-semibold text-red-800">
            Grievance Officer not appointed — required under DPDP Section 14
          </p>
          <p className="text-sm text-red-600 mt-0.5">
            You must appoint a Grievance Officer before publishing your Privacy Notice or accepting complaints.
          </p>
          <button
            onClick={onEdit}
            className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-[#003366] text-white text-sm font-medium rounded-lg hover:bg-[#1A5276] transition-colors"
          >
            Appoint Grievance Officer →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#D6E4F0] flex items-center justify-center">
            <User size={20} className="text-[#003366]" />
          </div>
          <div>
            <h3 className="font-semibold text-[#1A1A2E] text-lg">{officer.name}</h3>
            <p className="text-sm text-gray-500">{officer.designation}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`/public/grievance/${orgSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-[#003366] text-[#003366] rounded-lg hover:bg-[#D6E4F0] transition-colors"
          >
            <ExternalLink size={14} />
            View Public Page
          </a>
          <button
            onClick={onEdit}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[#003366] text-white rounded-lg hover:bg-[#1A5276] transition-colors"
          >
            <Edit2 size={14} />
            Edit
          </button>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Mail size={15} className="text-gray-400 shrink-0" />
          <a href={`mailto:${officer.email}`} className="hover:text-[#003366] truncate">{officer.email}</a>
        </div>
        {officer.phone && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Phone size={15} className="text-gray-400 shrink-0" />
            <span>{officer.phone}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar size={15} className="text-gray-400 shrink-0" />
          <span>Appointed {new Date(officer.appointed_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
        <span className="text-xs text-green-700 font-medium">Active — DPDP Section 14 Compliant</span>
      </div>
    </div>
  )
}
