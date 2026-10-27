'use client'

import { useState } from 'react'
import { DsrStatusBadge } from './DsrStatusBadge'
import { SlaIndicator } from './SlaIndicator'
import { DSR_RIGHT_TYPES, DATA_CATEGORIES } from '@/lib/platform/constants'
import type { DsrRequest, DsrNomination, DsrStatus } from '@/types/dpdp'

interface Props {
  request: DsrRequest
  nomination: DsrNomination | null
  onUpdate: (updated: DsrRequest) => void
}

function rightLabel(v: string): string {
  return DSR_RIGHT_TYPES.find(r => r.value === v)?.label ?? v
}
function categoryLabel(key: string): string {
  return DATA_CATEGORIES.find(c => c.key === key)?.label ?? key
}
function fmtDate(d: string): string {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
}

const labelCls = 'text-xs font-semibold text-text-muted uppercase tracking-wider'

export function DsrRequestDetail({ request, nomination, onUpdate }: Props) {
  const [denialReason, setDenialReason] = useState('')
  const [fulfillmentNotes, setFulfillmentNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState<string | null>(null)

  async function updateStatus(status: DsrStatus, extra?: Record<string, unknown>) {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/trustdeck/dsr/requests/${request.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, ...extra }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Failed to update'); return }
      onUpdate(json.data as DsrRequest)
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
            <span className="font-mono text-sm font-bold text-accent">{request.reference_number}</span>
            <DsrStatusBadge status={request.status} />
          </div>
          <p className="text-xs text-text-faint mt-1">{rightLabel(request.right_type)} · Received {fmtDate(request.created_at)}</p>
        </div>
        <SlaIndicator dueDate={request.due_date} status={request.status} />
      </div>

      {/* Principal info */}
      <div className="rounded-xl bg-glass p-4 sm:p-5">
        <p className={`${labelCls} mb-3`}>Data Principal</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-text-faint">Name</span>
            <p className="font-medium text-text mt-0.5">{request.requestor_name}</p>
          </div>
          <div>
            <span className="text-text-faint">Email</span>
            <p className="break-all font-medium text-text mt-0.5">{request.requestor_email || ' - '}</p>
          </div>
          <div>
            <span className="text-text-faint">Phone</span>
            <p className="font-medium text-text mt-0.5">{request.requestor_phone ?? ' - '}</p>
          </div>
        </div>
        {nomination && (
          <div className="mt-4 border-t border-line pt-4">
            <p className={`${labelCls} mb-2`}>Nominee</p>
            <p className="text-sm text-text">
              {nomination.nominee_name}{nomination.relationship ? ` (${nomination.relationship})` : ''}
            </p>
            <p className="mt-1 break-all text-xs text-text-muted">{nomination.nominee_email}</p>
          </div>
        )}
      </div>

      {/* Request details */}
      <div className="space-y-4 rounded-xl border border-line bg-bg-2 p-4 sm:p-5">
        <p className={labelCls}>Request Details</p>
        <div className="text-sm text-text-muted space-y-2">
          <p><span className="text-text-faint font-medium">Right:</span> {rightLabel(request.right_type)}</p>
          {request.affected_data_categories?.length ? (
            <div>
              <span className="text-text-faint font-medium">Data categories:</span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {request.affected_data_categories.map(c => (
                  <span key={c} className="text-xs bg-accent/15 text-accent px-2 py-0.5 rounded-full">{categoryLabel(c)}</span>
                ))}
              </div>
            </div>
          ) : null}
          {request.request_details && (
            <div>
              <span className="text-text-faint font-medium">Additional details:</span>
              <p className="whitespace-pre-wrap mt-1">{request.request_details}</p>
            </div>
          )}
        </div>
      </div>

      {/* Status workflow */}
      {!['fulfilled', 'denied'].includes(request.status) && (
        <div className="space-y-4 rounded-xl border border-line bg-bg-2 p-4 sm:p-5">
          <p className={labelCls}>Update Status</p>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {request.status !== 'processing' && (
              <button
                onClick={() => updateStatus('processing')}
                disabled={saving}
                className="min-h-11 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
              >
                Start Processing
              </button>
            )}
          </div>
          <div className="space-y-2 border-t border-line pt-4">
            <label htmlFor="dsr-fulfillment-notes" className="block text-sm font-medium text-text">Fulfillment notes</label>
            <textarea
              id="dsr-fulfillment-notes"
              value={fulfillmentNotes}
              onChange={e => setFulfillmentNotes(e.target.value)}
              rows={2}
              placeholder="Describe how the request was fulfilled…"
              className="w-full resize-y rounded-lg border border-line bg-bg-2 px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <button
              onClick={() => updateStatus('fulfilled', { fulfillment_notes: fulfillmentNotes.trim() })}
              disabled={saving}
              className="min-h-11 w-full rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50 sm:w-auto"
            >
              Mark Fulfilled
            </button>
          </div>
          <div className="space-y-2 border-t border-line pt-4">
            <label htmlFor="dsr-denial-reason" className="block text-sm font-medium text-text">Denial reason</label>
            <textarea
              id="dsr-denial-reason"
              value={denialReason}
              onChange={e => setDenialReason(e.target.value)}
              rows={2}
              placeholder="Explain why the request is being denied…"
              className="w-full resize-y rounded-lg border border-line bg-bg-2 px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <button
              onClick={() => updateStatus('denied', { denial_reason: denialReason.trim() })}
              disabled={saving || !denialReason.trim()}
              className="min-h-11 w-full rounded-lg border border-red/30 px-4 py-2 text-sm font-medium text-red transition-colors hover:bg-red/[0.07] disabled:opacity-50 sm:w-auto"
            >
              Deny Request
            </button>
          </div>
        </div>
      )}

      {request.status === 'fulfilled' && request.fulfilled_at && (
        <p className="text-sm text-green">Fulfilled on {fmtDate(request.fulfilled_at)}.</p>
      )}
      {request.status === 'denied' && request.denial_reason && (
        <p className="text-sm text-text-muted bg-glass border border-line rounded-lg p-3">
          <span className="font-medium text-text-muted">Denial reason:</span> {request.denial_reason}
        </p>
      )}

      {error && <p className="rounded-lg border border-red/25 bg-red/[0.07] px-3 py-2 text-sm text-red">{error}</p>}
    </div>
  )
}
