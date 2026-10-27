'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { RopaStatusBadge } from './RopaStatusBadge'
import { RopaConsentBadge } from './RopaConsentBadge'
import { RopaEntryForm } from './RopaEntryForm'
import { DPDP_BASES, DATA_CATEGORIES, ROPA_SUBJECT_TYPES } from '@/lib/platform/constants'
import type { RopaEntry, RopaConsentCoverage, RopaStatus } from '@/types/dpdp'

interface Props {
  entry: RopaEntry
  coverage?: RopaConsentCoverage
  onUpdate: (updated: RopaEntry) => void
  onDeleted: () => void
}

function basisLabel(v: string): string {
  return DPDP_BASES.find(basis => basis.id === v)?.label ?? v
}
function categoryLabel(key: string): string {
  return DATA_CATEGORIES.find(c => c.key === key)?.label ?? key
}
function subjectLabel(v: string): string {
  return ROPA_SUBJECT_TYPES.find(s => s.value === v)?.label ?? v
}
function fmtDate(d: string): string {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
}

const labelCls = 'text-xs font-semibold text-text-muted uppercase tracking-wider'

export function RopaEntryDetail({ entry, coverage, onUpdate, onDeleted }: Props) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState<string | null>(null)

  async function handleStatusChange(status: RopaStatus) {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/trustdeck/ropa/${entry.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(status === 'active' && !entry.dpo_approved ? { approve: true } : { status }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Failed to update'); return }
      onUpdate(json.data as RopaEntry)
    } catch {
      setError('Network error - please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function handleSave(data: Partial<RopaEntry>) {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/trustdeck/ropa/${entry.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Failed to update'); return }
      onUpdate(json.data as RopaEntry)
      setEditing(false)
    } catch {
      setError('Network error - please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Delete ${entry.activity_name}? This cannot be undone.`)) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/trustdeck/ropa/${entry.id}`, { method: 'DELETE' })
      const json = await res.json() as { error?: string }
      if (!res.ok) { setError(json.error ?? 'Failed to delete entry'); return }
      onDeleted()
    } catch {
      setError('Network error - please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (editing) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-accent">Edit Entry</h2>
          <button onClick={() => setEditing(false)} className="min-h-10 rounded-lg px-3 text-sm text-text-muted hover:bg-glass hover:text-text">Cancel</button>
        </div>
        <RopaEntryForm entry={entry} onSave={handleSave} />
        {error && <p className="rounded-lg border border-red/25 bg-red/[0.07] px-3 py-2 text-sm text-red">{error}</p>}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-accent">{entry.activity_name}</h2>
          <p className="text-xs text-text-faint mt-1">Created {fmtDate(entry.created_at)}</p>
        </div>
        <div className="flex items-center gap-2">
          <RopaStatusBadge status={entry.status} />
          <RopaConsentBadge coverage={coverage} />
        </div>
      </div>

      {/* Details */}
      <div className="space-y-4 rounded-xl bg-glass p-4 sm:p-5">
        {entry.activity_description && (
          <div>
            <p className={labelCls}>Description</p>
            <p className="mt-1 text-sm leading-relaxed text-text">{entry.activity_description}</p>
          </div>
        )}
        {entry.processing_purposes.length > 0 && (
          <div>
            <p className={labelCls}>Processing purposes</p>
            <ul className="mt-1.5 space-y-1 text-sm text-text">
              {entry.processing_purposes.map(purpose => <li key={purpose}>• {purpose}</li>)}
            </ul>
          </div>
        )}
        <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
          <div>
            <p className={labelCls}>Data controller</p>
            <p className="mt-1 font-medium text-text">{entry.data_controller_name}</p>
          </div>
          <div>
            <p className={labelCls}>Legal basis</p>
            <p className="font-medium text-text mt-1">{basisLabel(entry.legal_basis)}</p>
          </div>
          <div>
            <p className={labelCls}>Retention period</p>
            <p className="font-medium text-text mt-1">{entry.retention_period || ' - '}</p>
          </div>
        </div>
        {entry.data_categories?.length ? (
          <div>
            <p className={labelCls}>Data categories</p>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {entry.data_categories.map(c => (
                <span key={c} className="text-xs bg-accent/15 text-accent px-2 py-0.5 rounded-full">{categoryLabel(c)}</span>
              ))}
            </div>
          </div>
        ) : null}
        {entry.data_subject_types?.length ? (
          <div>
            <p className={labelCls}>Data subjects</p>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {entry.data_subject_types.map(s => (
                <span key={s} className="text-xs bg-surface-2 text-text px-2 py-0.5 rounded-full">{subjectLabel(s)}</span>
              ))}
            </div>
          </div>
        ) : null}
        {entry.cross_border_transfer && (
          <div>
            <p className={labelCls}>Cross-border transfer</p>
            <p className="text-sm text-text mt-1">{entry.transfer_countries?.join(', ') || 'Yes'}</p>
          </div>
        )}
        {entry.processor_names?.length ? (
          <div>
            <p className={labelCls}>Processors / vendors</p>
            <p className="mt-1 text-sm text-text">{entry.processor_names.join(', ')}</p>
          </div>
        ) : null}
        {entry.security_measures?.length ? (
          <div>
            <p className={labelCls}>Security measures</p>
            <p className="mt-1 text-sm text-text">{entry.security_measures.join(', ')}</p>
          </div>
        ) : null}
        {(entry.data_sources?.length || entry.recipients?.length) && (
          <div className="grid gap-4 sm:grid-cols-2">
            {entry.data_sources?.length ? (
              <div>
                <p className={labelCls}>Data sources</p>
                <p className="mt-1 text-sm text-text">{entry.data_sources.join(', ')}</p>
              </div>
            ) : null}
            {entry.recipients?.length ? (
              <div>
                <p className={labelCls}>Recipients</p>
                <p className="mt-1 text-sm text-text">{entry.recipients.join(', ')}</p>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-3">
        <button
          onClick={() => setEditing(true)}
          className="min-h-11 rounded-lg border border-line px-4 py-2 text-sm font-medium text-text transition-colors hover:bg-glass"
        >
          Edit Entry
        </button>
        {entry.status === 'draft' && (
          <button
            onClick={() => handleStatusChange('active')}
            disabled={saving}
            className="min-h-11 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
          >
            Mark Active
          </button>
        )}
        {entry.status === 'active' && (
          <button
            onClick={() => handleStatusChange('archived')}
            disabled={saving}
            className="min-h-11 rounded-lg border border-amber/30 px-4 py-2 text-sm font-medium text-amber transition-colors hover:bg-amber/[0.07] disabled:opacity-50"
          >
            Archive
          </button>
        )}
        {entry.status === 'archived' && (
          <button
            onClick={() => handleStatusChange('active')}
            disabled={saving}
            className="min-h-11 rounded-lg border border-green/30 px-4 py-2 text-sm font-medium text-green transition-colors hover:bg-green/[0.07] disabled:opacity-50"
          >
            Restore to Active
          </button>
        )}
        <button
          type="button"
          onClick={handleDelete}
          disabled={saving}
          className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-red transition-colors hover:bg-red/10 disabled:opacity-50 sm:ml-auto"
        >
          <Trash2 size={14} /> Delete entry
        </button>
      </div>

      {error && <p className="rounded-lg border border-red/25 bg-red/[0.07] px-3 py-2 text-sm text-red">{error}</p>}
    </div>
  )
}
