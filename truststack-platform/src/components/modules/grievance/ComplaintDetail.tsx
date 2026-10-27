'use client'

import { useState } from 'react'
import { ComplaintStatusBadge } from './ComplaintStatusBadge'
import { COMPLAINT_TYPES } from '@/lib/constants'
import type { GrievanceComplaint, GrievanceStatus } from '@/types/dpdp'

const STATUS_TRANSITIONS: Record<GrievanceStatus, GrievanceStatus[]> = {
  new:               ['under_review'],
  under_review:      ['resolved', 'escalated_to_dpbi'],
  resolved:          [],
  escalated_to_dpbi: [],
}

interface Props {
  complaint: GrievanceComplaint
  onUpdate: (updated: GrievanceComplaint) => void
}

export function ComplaintDetail({ complaint, onUpdate }: Props) {
  const [resolutionNotes, setResolutionNotes] = useState(complaint.resolution_notes ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState<string | null>(null)

  const nextStatuses = STATUS_TRANSITIONS[complaint.status]
  const typeLabel = COMPLAINT_TYPES.find(t => t.value === complaint.complaint_type)?.label ?? complaint.complaint_type
  const daysSince = Math.floor((Date.now() - new Date(complaint.created_at).getTime()) / 86_400_000)

  async function updateStatus(newStatus: GrievanceStatus) {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/grievance/complaints/${complaint.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, resolution_notes: resolutionNotes || undefined }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Failed to update'); return }
      onUpdate(json.data as GrievanceComplaint)
    } catch {
      setError('Network error — please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm font-bold text-[#003366]">{complaint.reference_number}</span>
            <ComplaintStatusBadge status={complaint.status} />
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Submitted {new Date(complaint.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className={`text-sm font-medium px-3 py-1.5 rounded-full ${daysSince > 25 ? 'bg-red-50 text-red-700' : daysSince > 15 ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'}`}>
          {daysSince === 0 ? 'Received today' : `${daysSince} day${daysSince !== 1 ? 's' : ''} elapsed`}
          {daysSince > 25 && ' — nearing 30-day limit'}
        </div>
      </div>

      {/* Complainant info */}
      <div className="bg-gray-50 rounded-xl p-5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Complainant</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          <div>
            <span className="text-gray-400">Name</span>
            <p className="font-medium text-[#1A1A2E] mt-0.5">{complaint.complainant_name}</p>
          </div>
          {complaint.complainant_email && (
            <div>
              <span className="text-gray-400">Email</span>
              <p className="font-medium text-[#1A1A2E] mt-0.5">{complaint.complainant_email}</p>
            </div>
          )}
          {complaint.complainant_phone && (
            <div>
              <span className="text-gray-400">Phone</span>
              <p className="font-medium text-[#1A1A2E] mt-0.5">{complaint.complainant_phone}</p>
            </div>
          )}
        </div>
      </div>

      {/* Complaint details */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Complaint</p>
          <span className="text-xs text-gray-400">{typeLabel} · Language: {complaint.language.toUpperCase()}</span>
        </div>
        <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{complaint.description}</p>
        {complaint.attachment_url && (
          <a
            href={complaint.attachment_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block text-sm text-[#003366] underline hover:text-[#1A5276]"
          >
            View attachment
          </a>
        )}
      </div>

      {/* Resolution */}
      {nextStatuses.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Update Status</p>
          <textarea
            value={resolutionNotes}
            onChange={e => setResolutionNotes(e.target.value)}
            placeholder="Add internal resolution notes (not visible to complainant)…"
            rows={3}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#003366] focus:border-transparent"
          />
          {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            {nextStatuses.map(s => (
              <button
                key={s}
                disabled={saving}
                onClick={() => updateStatus(s)}
                className="px-4 py-2 text-sm font-medium bg-[#003366] text-white rounded-lg hover:bg-[#1A5276] transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving…' : `Mark as ${s === 'under_review' ? 'Under Review' : s === 'resolved' ? 'Resolved' : 'Escalated to DPBI'}`}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Resolved info */}
      {complaint.status === 'resolved' && complaint.resolution_notes && (
        <div className="bg-green-50 border border-green-100 rounded-xl p-5">
          <p className="text-xs font-semibold text-green-700 uppercase tracking-wider mb-2">Resolution Notes</p>
          <p className="text-sm text-green-800 whitespace-pre-wrap">{complaint.resolution_notes}</p>
          {complaint.resolved_at && (
            <p className="text-xs text-green-600 mt-2">
              Resolved on {new Date(complaint.resolved_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
