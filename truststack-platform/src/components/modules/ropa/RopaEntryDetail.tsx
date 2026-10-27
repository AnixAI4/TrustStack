'use client'

import { useState } from 'react'
import {
  ShieldCheck, ShieldAlert, Pencil, Trash2, Scale, Users, Layers, Send, Database,
  Globe, Clock, Lock, CheckCircle2, RotateCcw, CalendarCheck,
} from 'lucide-react'
import { RopaStatusBadge } from './RopaStatusBadge'
import { RopaConsentBadge } from './RopaConsentBadge'
import { RopaEntryForm } from './RopaEntryForm'
import { DPDP_BASES, DATA_CATEGORIES, ROPA_SUBJECT_TYPES } from '@/lib/constants'
import type { RopaEntry, RopaConsentCoverage, RopaStatus } from '@/types/dpdp'

interface Props {
  entry: RopaEntry
  coverage?: RopaConsentCoverage
  onUpdate: (e: RopaEntry) => void
  onDeleted: () => void
}

const basisLabel = (id: string) => DPDP_BASES.find(b => b.id === id)?.label ?? id
const categoryLabel = (k: string) => DATA_CATEGORIES.find(c => c.key === k)?.label ?? k
const subjectLabel = (v: string) => ROPA_SUBJECT_TYPES.find(s => s.value === v)?.label ?? v
const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })

export function RopaEntryDetail({ entry, coverage, onUpdate, onDeleted }: Props) {
  const [busy, setBusy]       = useState<string | null>(null)
  const [error, setError]     = useState<string | null>(null)
  const [editing, setEditing] = useState(false)

  async function patch(updates: Record<string, unknown>, label: string) {
    setBusy(label); setError(null)
    try {
      const res = await fetch(`/api/ropa/${entry.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Update failed'); return }
      onUpdate(json.data as RopaEntry)
    } catch {
      setError('Network error — please try again.')
    } finally {
      setBusy(null)
    }
  }

  async function remove() {
    if (!confirm(`Delete "${entry.activity_name}"? This cannot be undone.`)) return
    setBusy('delete'); setError(null)
    try {
      const res = await fetch(`/api/ropa/${entry.id}`, { method: 'DELETE' })
      if (res.ok) { onDeleted(); return }
      const json = await res.json()
      setError(json.error ?? 'Delete failed')
    } catch {
      setError('Network error — please try again.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-lg font-bold text-[#1A1A2E]">{entry.activity_name}</h2>
            <RopaStatusBadge status={entry.status} />
            <RopaConsentBadge coverage={coverage} />
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {entry.data_controller_name} · Added {fmtDate(entry.created_at)}
            {entry.last_reviewed_at ? ` · Last reviewed ${fmtDate(entry.last_reviewed_at)}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setEditing(true)} className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
            <Pencil size={13} /> Edit
          </button>
          <button onClick={remove} disabled={busy === 'delete'} className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50">
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {entry.activity_description && <p className="text-sm text-gray-600 whitespace-pre-wrap">{entry.activity_description}</p>}

      {/* Consent cross-reference banner */}
      {coverage?.status === 'missing' && (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5">
          <ShieldAlert size={16} className="text-amber-500 shrink-0" />
          <span className="text-sm text-amber-800">
            This activity is consent-based but no matching consent purpose was found. Configure one in{' '}
            <a href="/dashboard/consent" className="underline font-medium">Consent Management</a>.
          </span>
        </div>
      )}
      {coverage?.status === 'configured' && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-lg px-4 py-2.5">
          <CheckCircle2 size={16} className="text-green-600 shrink-0" />
          <span className="text-sm text-green-800">
            Consent configured{coverage.matched_purposes.length ? ` — matched: ${coverage.matched_purposes.join(', ')}` : ''}.
          </span>
        </div>
      )}

      {/* DPO approval workflow */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">DPO Approval</p>
        {entry.dpo_approved ? (
          <div className="flex items-center justify-between gap-3 flex-wrap bg-green-50 border border-green-100 rounded-lg px-4 py-3">
            <div className="flex items-center gap-3">
              <ShieldCheck size={18} className="text-green-600 shrink-0" />
              <p className="text-sm text-green-800">
                Approved by DPO{entry.dpo_approved_at ? ` on ${fmtDate(entry.dpo_approved_at)}` : ''}.
              </p>
            </div>
            <button
              onClick={() => patch({ approve: false }, 'revoke')}
              disabled={busy === 'revoke'}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              <RotateCcw size={13} /> {busy === 'revoke' ? 'Revoking…' : 'Revoke approval'}
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3 flex-wrap bg-amber-50 border border-amber-100 rounded-lg px-4 py-3">
            <div className="flex items-center gap-3">
              <ShieldAlert size={18} className="text-amber-600 shrink-0" />
              <p className="text-sm text-amber-800">Awaiting DPO sign-off. Approving activates this record.</p>
            </div>
            <button
              onClick={() => patch({ approve: true }, 'approve')}
              disabled={busy === 'approve'}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-[#003366] text-white rounded-lg hover:bg-[#1A5276] transition-colors disabled:opacity-50"
            >
              <ShieldCheck size={14} /> {busy === 'approve' ? 'Approving…' : 'Approve & Activate'}
            </button>
          </div>
        )}

        {/* Status quick-actions + review */}
        <div className="flex items-center gap-2 flex-wrap mt-4">
          <span className="text-sm text-gray-500">Status:</span>
          {(['draft', 'active', 'archived'] as RopaStatus[]).map(s => (
            <button
              key={s}
              onClick={() => patch({ status: s }, `status-${s}`)}
              disabled={busy === `status-${s}` || entry.status === s}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors disabled:opacity-40 ${
                entry.status === s ? 'bg-[#003366] text-white border-[#003366]' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {busy === `status-${s}` ? '…' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
          <button
            onClick={() => patch({ mark_reviewed: true }, 'review')}
            disabled={busy === 'review'}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 ml-auto"
          >
            <CalendarCheck size={13} /> {busy === 'review' ? 'Marking…' : 'Mark reviewed'}
          </button>
        </div>
        {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
      </div>

      {/* Processing details */}
      <div className="bg-gray-50 rounded-xl p-5 space-y-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Processing Details</p>

        <Detail icon={<Scale size={14} />} label="Legal Basis">{basisLabel(entry.legal_basis)}</Detail>

        <Detail icon={<Users size={14} />} label="Data Subjects">
          {(entry.data_subject_types ?? []).length
            ? <Chips items={(entry.data_subject_types ?? []).map(subjectLabel)} />
            : <span className="text-gray-400">—</span>}
        </Detail>

        <Detail icon={<Layers size={14} />} label="Data Categories">
          {(entry.data_categories ?? []).length
            ? <Chips items={(entry.data_categories ?? []).map(categoryLabel)} />
            : <span className="text-gray-400">—</span>}
        </Detail>

        <Detail icon={<Database size={14} />} label="Processing Purposes">
          {(entry.processing_purposes ?? []).length
            ? <ul className="list-disc list-inside text-sm text-gray-700 space-y-0.5">{entry.processing_purposes.map((p, i) => <li key={i}>{p}</li>)}</ul>
            : <span className="text-gray-400">—</span>}
        </Detail>

        {entry.data_sources?.length ? <Detail icon={<Database size={14} />} label="Data Sources"><Chips items={entry.data_sources} /></Detail> : null}
        {entry.recipients?.length ? <Detail icon={<Send size={14} />} label="Recipients"><Chips items={entry.recipients} /></Detail> : null}
        {entry.processor_names?.length ? <Detail icon={<Send size={14} />} label="Processors / Vendors"><Chips items={entry.processor_names} /></Detail> : null}

        <Detail icon={<Globe size={14} />} label="Cross-Border Transfer">
          {entry.cross_border_transfer
            ? <span className="text-amber-700">Yes{entry.transfer_countries?.length ? ` → ${entry.transfer_countries.join(', ')}` : ''}</span>
            : <span className="text-gray-600">No</span>}
        </Detail>

        <Detail icon={<Clock size={14} />} label="Retention Period">{entry.retention_period || <span className="text-gray-400">Not set</span>}</Detail>

        {entry.security_measures?.length ? <Detail icon={<Lock size={14} />} label="Security Measures"><Chips items={entry.security_measures} /></Detail> : null}
      </div>

      <RopaEntryForm open={editing} onClose={() => setEditing(false)} entry={entry} onSaved={e => { onUpdate(e); setEditing(false) }} />
    </div>
  )
}

function Detail({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="flex items-center gap-1.5 text-gray-400 text-xs mb-1">{icon} {label}</span>
      <div className="text-sm text-[#1A1A2E]">{children}</div>
    </div>
  )
}

function Chips({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((c, i) => (
        <span key={i} className="text-xs bg-[#D6E4F0] text-[#003366] px-2 py-0.5 rounded-full">{c}</span>
      ))}
    </div>
  )
}
