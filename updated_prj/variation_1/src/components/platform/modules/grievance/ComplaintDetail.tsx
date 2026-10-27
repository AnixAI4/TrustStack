'use client'

import { useState } from 'react'
import { ComplaintStatusBadge } from './ComplaintStatusBadge'
import { COMPLAINT_TYPES } from '@/lib/platform/constants'
import type { GrievanceComplaint, GrievanceStatus } from '@/types/dpdp'

interface Props {
  complaint: GrievanceComplaint
  onUpdate: (updated: GrievanceComplaint) => void
}

function typeLabel(v: string): string {
  return COMPLAINT_TYPES.find(c => c.value === v)?.label ?? v
}
function fmtDate(d: string): string {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
}

const labelCls = 'text-xs font-semibold text-text-muted uppercase tracking-wider'

export function ComplaintDetail({ complaint, onUpdate }: Props) {
  const [resolution, setResolution]     = useState(complaint.resolution_notes ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState<string | null>(null)

  async function updateStatus(status: GrievanceStatus, extra?: Record<string, unknown>) {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/trustdeck/grievance/complaints/${complaint.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, ...extra }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Failed to update'); return }
      onUpdate(json.data as GrievanceComplaint)
    } catch {
      setError('Network error - please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function saveNotes() {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/trustdeck/grievance/complaints/${complaint.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resolution_notes: resolution.trim(),
        }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Failed to save'); return }
      onUpdate(json.data as GrievanceComplaint)
    } catch {
      setError('Network error - please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-mono text-sm font-bold text-accent">{complaint.reference_number}</span>
            <ComplaintStatusBadge status={complaint.status} />
          </div>
          <p className="text-xs text-text-faint mt-1">{typeLabel(complaint.complaint_type)} · Filed {fmtDate(complaint.created_at)}</p>
        </div>
      </div>

      {/* Complainant info */}
      <div className="rounded-xl bg-glass p-4 sm:p-5">
        <p className={`${labelCls} mb-3`}>Complainant</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-text-faint">Name</span>
            <p className="font-medium text-text mt-0.5">{complaint.complainant_name}</p>
          </div>
          <div>
            <span className="text-text-faint">Email</span>
            <p className="mt-0.5 break-all font-medium text-text">{complaint.complainant_email || ' - '}</p>
          </div>
          <div>
            <span className="text-text-faint">Phone</span>
            <p className="font-medium text-text mt-0.5">{complaint.complainant_phone ?? ' - '}</p>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="rounded-xl border border-line bg-bg-2 p-4 sm:p-5">
        <p className={`${labelCls} mb-2`}>Description</p>
        <p className="text-sm text-text whitespace-pre-wrap">{complaint.description}</p>
      </div>

      {/* Status workflow */}
      {complaint.status !== 'resolved' && (
        <div className="space-y-4 rounded-xl border border-line bg-bg-2 p-4 sm:p-5">
          <p className={labelCls}>Update Status</p>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {complaint.status === 'new' && (
              <button
                onClick={() => updateStatus('under_review')}
                disabled={saving}
                className="min-h-11 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
              >
                Start Investigation
              </button>
            )}
            <button
              onClick={() => updateStatus('resolved', { resolution_notes: resolution.trim() })}
              disabled={saving}
              className="min-h-11 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
            >
              Mark Resolved
            </button>
            {complaint.status !== 'escalated_to_dpbi' && (
              <button
                onClick={() => updateStatus('escalated_to_dpbi')}
                disabled={saving}
                className="min-h-11 rounded-lg border border-red/30 px-4 py-2 text-sm font-medium text-red transition-colors hover:bg-red/[0.07] disabled:opacity-50"
              >
                Escalate
              </button>
            )}
          </div>
        </div>
      )}

      {/* Resolution notes */}
      <div className="space-y-4 rounded-xl border border-line bg-bg-2 p-4 sm:p-5">
        <p className={labelCls}>Resolution Notes</p>
        <div>
          <label htmlFor="complaint-resolution" className="block text-sm font-medium text-text mb-1">Resolution (shared with complainant)</label>
          <textarea
            id="complaint-resolution"
            value={resolution}
            onChange={e => setResolution(e.target.value)}
            rows={3}
            placeholder="Describe how the grievance was resolved…"
            className="w-full resize-y rounded-lg border border-line bg-bg-2 px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
        <button
          onClick={saveNotes}
          disabled={saving}
          className="min-h-11 w-full rounded-lg bg-accent px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-soft disabled:opacity-50 sm:w-auto"
        >
          {saving ? 'Saving…' : 'Save Notes'}
        </button>
      </div>

      {complaint.status === 'resolved' && complaint.resolved_at && (
        <p className="text-sm text-green">Resolved on {fmtDate(complaint.resolved_at)}.</p>
      )}

      {error && <p className="rounded-lg border border-red/25 bg-red/[0.07] px-3 py-2 text-sm text-red">{error}</p>}
    </div>
  )
}
