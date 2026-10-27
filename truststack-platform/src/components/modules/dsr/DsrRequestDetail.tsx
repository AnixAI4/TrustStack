'use client'

import { useState } from 'react'
import { ShieldCheck, ShieldAlert, Sparkles, UserPlus } from 'lucide-react'
import { DsrStatusBadge } from './DsrStatusBadge'
import { SlaIndicator } from './SlaIndicator'
import { DSR_RIGHT_TYPES, DATA_CATEGORIES } from '@/lib/constants'
import type { DsrRequest, DsrNomination, DsrStatus } from '@/types/dpdp'

interface Props {
  request: DsrRequest
  nomination: DsrNomination | null
  onUpdate: (updated: DsrRequest) => void
}

function rightInfo(value: string) {
  return DSR_RIGHT_TYPES.find(r => r.value === value)
}

function categoryLabel(key: string): string {
  return DATA_CATEGORIES.find(c => c.key === key)?.label ?? key
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function DsrRequestDetail({ request, nomination, onUpdate }: Props) {
  const [fulfillmentNotes, setFulfillmentNotes] = useState(request.fulfillment_notes ?? '')
  const [denialReason, setDenialReason]         = useState(request.denial_reason ?? '')
  const [saving, setSaving]                     = useState(false)
  const [drafting, setDrafting]                 = useState<'fulfillment' | 'denial' | null>(null)
  const [error, setError]                       = useState<string | null>(null)

  const right = rightInfo(request.right_type)
  const isClosed = request.status === 'fulfilled' || request.status === 'denied'
  const canProcess = request.status === 'received' || request.status === 'identity_pending'

  async function patch(updates: { status?: DsrStatus; fulfillment_notes?: string; denial_reason?: string }) {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/dsr/requests/${request.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Failed to update'); return }
      onUpdate(json.data as DsrRequest)
    } catch {
      setError('Network error — please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function draftWithAi(mode: 'fulfillment' | 'denial') {
    setDrafting(mode)
    setError(null)
    try {
      const res = await fetch('/api/dsr/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: request.id, mode }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Could not generate a draft'); return }
      if (mode === 'fulfillment') setFulfillmentNotes(json.draft as string)
      else setDenialReason(json.draft as string)
    } catch {
      setError('Network error while drafting — please try again.')
    } finally {
      setDrafting(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-mono text-sm font-bold text-[#003366]">{request.reference_number}</span>
            <DsrStatusBadge status={request.status} />
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {right?.label ?? request.right_type} · {right?.dpdp_section ?? 'DPDP'} · Submitted {fmtDate(request.created_at)}
          </p>
        </div>
        <SlaIndicator dueDate={request.due_date} status={request.status} variant="inline" />
      </div>

      {/* Identity verification status */}
      {request.requestor_identity_verified ? (
        <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-lg px-4 py-2.5">
          <ShieldCheck size={16} className="text-green-600 shrink-0" />
          <span className="text-sm text-green-800">
            Identity verified{request.verification_method === 'email_otp' ? ' via email OTP' : ''}.
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-lg px-4 py-2.5">
          <ShieldAlert size={16} className="text-amber-600 shrink-0" />
          <span className="text-sm text-amber-800">
            Identity not yet verified — the data principal must confirm the emailed code before this request is actioned.
          </span>
        </div>
      )}

      {/* Requestor info */}
      <div className="bg-gray-50 rounded-xl p-5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Data Principal</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          <div>
            <span className="text-gray-400">Name</span>
            <p className="font-medium text-[#1A1A2E] mt-0.5">{request.requestor_name}</p>
          </div>
          {request.requestor_email && (
            <div>
              <span className="text-gray-400">Email</span>
              <p className="font-medium text-[#1A1A2E] mt-0.5 break-all">{request.requestor_email}</p>
            </div>
          )}
          {request.requestor_phone && (
            <div>
              <span className="text-gray-400">Phone</span>
              <p className="font-medium text-[#1A1A2E] mt-0.5">{request.requestor_phone}</p>
            </div>
          )}
        </div>
      </div>

      {/* Request details */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Request</p>
          <span className="text-xs text-gray-400">{right?.label ?? request.right_type} · {right?.dpdp_section ?? 'DPDP'}</span>
        </div>
        {request.affected_data_categories && request.affected_data_categories.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {request.affected_data_categories.map(c => (
              <span key={c} className="text-xs bg-[#D6E4F0] text-[#003366] px-2 py-0.5 rounded-full">
                {categoryLabel(c)}
              </span>
            ))}
          </div>
        )}
        <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
          {request.request_details || <span className="text-gray-400">No additional details provided.</span>}
        </p>
      </div>

      {/* Nomination (Section 15) */}
      {nomination && (
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-3">
            <UserPlus size={15} className="text-[#003366]" />
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Nominee (DPDP Section 15)</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-400">Name</span>
              <p className="font-medium text-[#1A1A2E] mt-0.5">{nomination.nominee_name}</p>
            </div>
            <div>
              <span className="text-gray-400">Email</span>
              <p className="font-medium text-[#1A1A2E] mt-0.5 break-all">{nomination.nominee_email}</p>
            </div>
            {nomination.nominee_phone && (
              <div>
                <span className="text-gray-400">Phone</span>
                <p className="font-medium text-[#1A1A2E] mt-0.5">{nomination.nominee_phone}</p>
              </div>
            )}
            {nomination.relationship && (
              <div>
                <span className="text-gray-400">Relationship</span>
                <p className="font-medium text-[#1A1A2E] mt-0.5">{nomination.relationship}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Workflow */}
      {!isClosed && (
        <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Fulfillment Workflow</p>

          {canProcess && (
            <button
              disabled={saving}
              onClick={() => patch({ status: 'processing' })}
              className="px-4 py-2 text-sm font-medium bg-[#003366] text-white rounded-lg hover:bg-[#1A5276] transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Start Processing'}
            </button>
          )}

          {/* Fulfill */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-gray-700">Fulfillment notes</label>
              <button
                type="button"
                disabled={drafting !== null}
                onClick={() => draftWithAi('fulfillment')}
                className="inline-flex items-center gap-1 text-xs text-[#2874A6] hover:text-[#003366] disabled:opacity-50"
              >
                <Sparkles size={12} /> {drafting === 'fulfillment' ? 'Drafting…' : 'Draft with AI'}
              </button>
            </div>
            <textarea
              value={fulfillmentNotes}
              onChange={e => setFulfillmentNotes(e.target.value)}
              placeholder="Which systems were checked and what action was taken (e.g. data exported, record corrected, account erased)…"
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#003366] focus:border-transparent"
            />
            <button
              disabled={saving || !fulfillmentNotes.trim()}
              onClick={() => patch({ status: 'fulfilled', fulfillment_notes: fulfillmentNotes.trim() })}
              className="mt-2 px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              Mark Fulfilled
            </button>
          </div>

          {/* Deny */}
          <div className="border-t border-gray-100 pt-5">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-gray-700">Reason for denial</label>
              <button
                type="button"
                disabled={drafting !== null}
                onClick={() => draftWithAi('denial')}
                className="inline-flex items-center gap-1 text-xs text-[#2874A6] hover:text-[#003366] disabled:opacity-50"
              >
                <Sparkles size={12} /> {drafting === 'denial' ? 'Drafting…' : 'Draft with AI'}
              </button>
            </div>
            <textarea
              value={denialReason}
              onChange={e => setDenialReason(e.target.value)}
              placeholder="State the specific, lawful reason this request cannot be fulfilled…"
              rows={2}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#003366] focus:border-transparent"
            />
            <button
              disabled={saving || !denialReason.trim()}
              onClick={() => patch({ status: 'denied', denial_reason: denialReason.trim() })}
              className="mt-2 px-4 py-2 text-sm font-medium border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              Deny Request
            </button>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      )}

      {/* Closed — fulfilled */}
      {request.status === 'fulfilled' && (
        <div className="bg-green-50 border border-green-100 rounded-xl p-5">
          <p className="text-xs font-semibold text-green-700 uppercase tracking-wider mb-2">Fulfilled</p>
          {request.fulfillment_notes && <p className="text-sm text-green-800 whitespace-pre-wrap">{request.fulfillment_notes}</p>}
          {request.fulfilled_at && <p className="text-xs text-green-600 mt-2">Fulfilled on {fmtDate(request.fulfilled_at)}</p>}
        </div>
      )}

      {/* Closed — denied */}
      {request.status === 'denied' && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Denied</p>
          {request.denial_reason && <p className="text-sm text-gray-700 whitespace-pre-wrap">{request.denial_reason}</p>}
        </div>
      )}
    </div>
  )
}
