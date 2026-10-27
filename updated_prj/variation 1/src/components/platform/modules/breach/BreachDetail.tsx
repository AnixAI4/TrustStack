'use client'

import { useState } from 'react'
import { Sparkles, Copy, Download, Check, ShieldCheck, Megaphone, ClipboardList } from 'lucide-react'
import { BreachStatusBadge } from './BreachStatusBadge'
import { BreachCountdown } from './BreachCountdown'
import { BREACH_NATURE_TYPES, DATA_CATEGORIES } from '@/lib/platform/constants'
import type { BreachIncident, BreachStatus } from '@/types/dpdp'

interface Props {
  incident: BreachIncident
  onUpdate: (updated: BreachIncident) => void
}

function natureLabel(v: string): string {
  return BREACH_NATURE_TYPES.find(n => n.value === v)?.label ?? v
}
function categoryLabel(key: string): string {
  return DATA_CATEGORIES.find(c => c.key === key)?.label ?? key
}
function fmtDateTime(d: string): string {
  return new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
}
function fmtDate(d: string): string {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
}

const labelCls = 'text-xs font-semibold text-text-muted uppercase tracking-wider'

export function BreachDetail({ incident, onUpdate }: Props) {
  const [containment, setContainment]   = useState(incident.containment_actions ?? '')
  const [rootCause, setRootCause]       = useState(incident.root_cause ?? '')
  const [remediation, setRemediation]   = useState(incident.remediation_actions ?? '')
  const [notifyMethod, setNotifyMethod] = useState(incident.notification_method ?? '')

  const [saving, setSaving]     = useState(false)
  const [drafting, setDrafting] = useState(false)
  const [copied, setCopied]     = useState(false)
  const [error, setError]       = useState<string | null>(null)

  async function patch(updates: Record<string, unknown>) {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/trustdeck/breach/${incident.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Failed to update'); return }
      onUpdate(json.data as BreachIncident)
    } catch {
      setError('Network error - please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function generateDraft() {
    setDrafting(true)
    setError(null)
    try {
      const res = await fetch(`/api/trustdeck/breach/${incident.id}/dpbi-draft`, { method: 'POST' })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Could not generate the draft'); return }
      onUpdate({ ...incident, dpbi_notification_draft: json.draft as string })
    } catch {
      setError('Network error while generating - please try again.')
    } finally {
      setDrafting(false)
    }
  }

  function copyDraft() {
    if (!incident.dpbi_notification_draft) return
    navigator.clipboard.writeText(incident.dpbi_notification_draft).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {})
  }

  function downloadDraft() {
    if (!incident.dpbi_notification_draft) return
    const blob = new Blob([incident.dpbi_notification_draft], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `DPBI-notification-${incident.reference_number}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-mono text-sm font-bold text-accent">{incident.reference_number}</span>
            <BreachStatusBadge status={incident.status} />
          </div>
          <p className="text-xs text-text-faint mt-1">
            {natureLabel(incident.nature)} · Discovered {fmtDateTime(incident.discovered_at)}
          </p>
        </div>
      </div>

      {/* 72-hour countdown - the prominent, ticking, derived timer */}
      <BreachCountdown
        dueAt={incident.dpbi_notification_due_at}
        dpbiNotified={incident.dpbi_notified}
        variant="banner"
        live
      />

      {/* Incident facts */}
      <div className="bg-glass rounded-xl p-5">
        <p className={`${labelCls} mb-3`}>Incident Details</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          <div>
            <span className="text-text-faint">Nature</span>
            <p className="font-medium text-text mt-0.5">{natureLabel(incident.nature)}</p>
          </div>
          <div>
            <span className="text-text-faint">Discovered</span>
            <p className="font-medium text-text mt-0.5">{fmtDateTime(incident.discovered_at)}</p>
          </div>
          <div>
            <span className="text-text-faint">Occurred</span>
            <p className="font-medium text-text mt-0.5">{incident.occurred_at ? fmtDateTime(incident.occurred_at) : 'Unknown'}</p>
          </div>
          <div>
            <span className="text-text-faint">Approx. data principals affected</span>
            <p className="font-medium text-text mt-0.5">
              {incident.data_subjects_affected_approx != null ? `~${incident.data_subjects_affected_approx.toLocaleString('en-IN')}` : 'Unknown'}
            </p>
          </div>
          <div>
            <span className="text-text-faint">Discovery method</span>
            <p className="font-medium text-text mt-0.5">{incident.discovery_method || ' - '}</p>
          </div>
          <div>
            <span className="text-text-faint">Systems involved</span>
            <p className="font-medium text-text mt-0.5">{incident.systems_involved?.length ? incident.systems_involved.join(', ') : ' - '}</p>
          </div>
        </div>
        {incident.data_categories_affected.length > 0 && (
          <div className="mt-4">
            <span className="text-text-faint text-sm">Data categories affected</span>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {incident.data_categories_affected.map(c => (
                <span key={c} className="text-xs bg-accent/15 text-accent px-2 py-0.5 rounded-full">{categoryLabel(c)}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* DPBI notification - draft + mark notified */}
      <div className="bg-bg-2 rounded-xl border border-line p-5 space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <p className={labelCls}>DPBI Notification (Rule 7)</p>
          {incident.dpbi_notified && incident.dpbi_notified_at && (
            <span className="inline-flex items-center gap-1 text-xs text-green">
              <ShieldCheck size={13} /> Notified {fmtDate(incident.dpbi_notified_at)}
            </span>
          )}
        </div>

        {incident.dpbi_notification_draft ? (
          <div>
            <div className="flex items-center justify-end gap-3 mb-2">
              <button onClick={copyDraft} className="inline-flex items-center gap-1 text-xs text-brand hover:text-accent">
                {copied ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
              </button>
              <button onClick={downloadDraft} className="inline-flex items-center gap-1 text-xs text-brand hover:text-accent">
                <Download size={12} /> Download .txt
              </button>
              <button onClick={generateDraft} disabled={drafting} className="inline-flex items-center gap-1 text-xs text-brand hover:text-accent disabled:opacity-50">
                <Sparkles size={12} /> {drafting ? 'Regenerating…' : 'Regenerate'}
              </button>
            </div>
            <pre className="whitespace-pre-wrap font-sans text-sm text-text bg-glass border border-line rounded-lg p-4 max-h-96 overflow-y-auto leading-relaxed">
              {incident.dpbi_notification_draft}
            </pre>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-text-muted mb-3">Generate a DPBI-format breach notification letter covering all Rule 7 fields. The follow-up contact is pulled from your active Grievance Officer.</p>
            <button
              onClick={generateDraft}
              disabled={drafting}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-[#2F5FE0] text-white rounded-lg hover:bg-accent transition-colors disabled:opacity-50"
            >
              <Sparkles size={14} /> {drafting ? 'Generating…' : 'Generate DPBI Draft'}
            </button>
          </div>
        )}

        {!incident.dpbi_notified && (
          <div className="border-t border-line pt-4">
            <button
              onClick={() => patch({ mark_dpbi_notified: true })}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <ShieldCheck size={15} /> Mark as DPBI Notified
            </button>
            <p className="text-xs text-text-faint mt-1.5">Records the notification timestamp and stops the 72-hour countdown.</p>
          </div>
        )}
      </div>

      {/* Data principal notification */}
      <div className="bg-bg-2 rounded-xl border border-line p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Megaphone size={15} className="text-accent" />
          <p className={labelCls}>Data Principal Notification</p>
        </div>
        {incident.principals_notified && incident.principals_notified_at ? (
          <p className="text-sm text-green">
            Affected data principals notified on {fmtDate(incident.principals_notified_at)}
            {incident.notification_method ? ` via ${incident.notification_method}` : ''}.
          </p>
        ) : (
          <p className="text-sm text-text-muted">When the breach is likely to cause harm, affected data principals must be informed. Record it here once done.</p>
        )}
        <div className="flex flex-col sm:flex-row sm:items-end gap-2">
          <div className="flex-1">
            <label htmlFor="breach-notification-method" className="block text-sm font-medium text-text mb-1">Notification method</label>
            <input
              id="breach-notification-method"
              value={notifyMethod}
              onChange={e => setNotifyMethod(e.target.value)}
              placeholder="e.g. Email + in-app banner"
              className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          {incident.principals_notified ? (
            <button
              onClick={() => patch({ principals_notified: false })}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium border border-line text-text rounded-lg hover:bg-glass transition-colors disabled:opacity-50"
            >
              Mark Not Notified
            </button>
          ) : (
            <button
              onClick={() => patch({ principals_notified: true, notification_method: notifyMethod.trim() || undefined })}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium bg-accent text-white rounded-lg hover:bg-accent-soft transition-colors disabled:opacity-50"
            >
              Mark Principals Notified
            </button>
          )}
        </div>
      </div>

      {/* Status workflow */}
      <div className="bg-bg-2 rounded-xl border border-line p-5 space-y-3">
        <p className={labelCls}>Status</p>
        <div className="flex flex-wrap gap-2">
          {(['open', 'contained', 'resolved'] as BreachStatus[]).map(s => (
            <button
              key={s}
              onClick={() => patch({ status: s })}
              disabled={saving || incident.status === s}
              className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors disabled:cursor-default ${
                incident.status === s
                  ? 'bg-accent text-white border-accent'
                  : 'border-line text-text hover:bg-glass'
              }`}
            >
              {s === 'open' ? 'Open' : s === 'contained' ? 'Mark Contained' : 'Mark Resolved'}
            </button>
          ))}
        </div>
        {incident.status === 'resolved' && incident.resolved_at && (
          <p className="text-xs text-green">Resolved on {fmtDate(incident.resolved_at)}.</p>
        )}
      </div>

      {/* Containment + post-mortem */}
      <div className="bg-bg-2 rounded-xl border border-line p-5 space-y-4">
        <div className="flex items-center gap-2">
          <ClipboardList size={15} className="text-accent" />
          <p className={labelCls}>Containment &amp; Post-Mortem</p>
        </div>
        <div>
          <label htmlFor="breach-containment" className="block text-sm font-medium text-text mb-1">Containment actions taken</label>
          <textarea
            id="breach-containment"
            value={containment}
            onChange={e => setContainment(e.target.value)}
            rows={2}
            placeholder="What was done immediately to limit the breach…"
            className="w-full border border-line rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
        <div>
          <label htmlFor="breach-root-cause" className="block text-sm font-medium text-text mb-1">Root cause</label>
          <textarea
            id="breach-root-cause"
            value={rootCause}
            onChange={e => setRootCause(e.target.value)}
            rows={2}
            placeholder="The underlying cause identified during investigation…"
            className="w-full border border-line rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
        <div>
          <label htmlFor="breach-remediation" className="block text-sm font-medium text-text mb-1">Remediation actions</label>
          <textarea
            id="breach-remediation"
            value={remediation}
            onChange={e => setRemediation(e.target.value)}
            rows={2}
            placeholder="Longer-term fixes to prevent recurrence…"
            className="w-full border border-line rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
        <button
          onClick={() => patch({
            containment_actions: containment.trim() || undefined,
            root_cause: rootCause.trim() || undefined,
            remediation_actions: remediation.trim() || undefined,
          })}
          disabled={saving}
          className="px-4 py-2 text-sm font-medium bg-accent text-white rounded-lg hover:bg-accent-soft transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save Notes'}
        </button>
      </div>

      {error && <p className="rounded-lg border border-red/25 bg-red/[0.07] px-3 py-2 text-sm text-red">{error}</p>}
    </div>
  )
}
