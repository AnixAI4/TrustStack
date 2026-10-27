'use client'

import { useEffect, useState } from 'react'
import { X, AlertTriangle } from 'lucide-react'
import { BREACH_NATURE_TYPES, DATA_CATEGORIES, DATA_CATEGORY_GROUPS } from '@/lib/platform/constants'
import type { BreachIncident } from '@/types/dpdp'

interface Props {
  open: boolean
  onClose: () => void
  onLogged: (incident: BreachIncident) => void
}

const inputClass =
  'module-field'

const toCommaList = (s: string) => s.split(',').map(x => x.trim()).filter(Boolean)

// Format a Date as a value for <input type="datetime-local"> (local time).
function toLocalInputValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function BreachLogModal({ open, onClose, onLogged }: Props) {
  const [discoveredAt, setDiscoveredAt] = useState('')
  const [occurredAt, setOccurredAt]     = useState('')
  const [nature, setNature]             = useState<string>(BREACH_NATURE_TYPES[0].value)
  const [categories, setCategories]     = useState<string[]>([])
  const [approx, setApprox]             = useState('')
  const [systemsText, setSystemsText]   = useState('')
  const [discoveryMethod, setDiscoveryMethod] = useState('')
  const [containment, setContainment]   = useState('')

  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState<string | null>(null)

  // Reset whenever the modal opens; default discovery to "now".
  useEffect(() => {
    if (!open) return
    setDiscoveredAt(toLocalInputValue(new Date()))
    setOccurredAt('')
    setNature(BREACH_NATURE_TYPES[0].value)
    setCategories([])
    setApprox('')
    setSystemsText('')
    setDiscoveryMethod('')
    setContainment('')
    setError(null)
  }, [open])

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, onClose])

  if (!open) return null

  function toggleCategory(key: string) {
    setCategories(prev => (prev.includes(key) ? prev.filter(c => c !== key) : [...prev, key]))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!discoveredAt) { setError('When you became aware of the breach is required.'); return }
    const discovered = new Date(discoveredAt)
    if (isNaN(discovered.getTime())) { setError('Enter a valid discovery date/time.'); return }
    if (discovered.getTime() > Date.now() + 60_000) { setError('The discovery time cannot be in the future.'); return }
    if (categories.length === 0) { setError('Select at least one affected data category (DPDP Rule 7).'); return }

    setSaving(true)
    try {
      const payload = {
        // Send ISO (UTC) so the server parses unambiguously regardless of its TZ.
        discovered_at: discovered.toISOString(),
        occurred_at: occurredAt ? new Date(occurredAt).toISOString() : undefined,
        nature,
        data_categories_affected: categories,
        data_subjects_affected_approx: approx.trim() ? Number(approx) : undefined,
        systems_involved: toCommaList(systemsText),
        discovery_method: discoveryMethod.trim() || undefined,
        containment_actions: containment.trim() || undefined,
      }
      const res = await fetch('/api/trustdeck/breach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Failed to log the breach.'); return }
      onLogged(json.data as BreachIncident)
    } catch {
      setError('Network error - please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="module-dialog-backdrop fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overscroll-contain p-2 sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="breach-form-title"
        className="module-dialog-surface max-h-[calc(100dvh-1rem)] w-full max-w-2xl overflow-y-auto overscroll-contain rounded-xl sm:max-h-[calc(100dvh-2rem)]"
        onClick={e => e.stopPropagation()}
      >
        <div className="module-dialog-header sticky top-0 z-10 flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
          <h2 id="breach-form-title" className="flex items-center gap-2.5 font-display text-lg font-semibold text-text">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-red/10 text-red"><AlertTriangle size={18} /></span>
            Log a breach incident
          </h2>
          <button type="button" onClick={onClose} aria-label="Close breach form" className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-text-faint hover:bg-glass hover:text-text-muted"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-4 sm:p-6">
          <div className="rounded-lg border border-amber/20 bg-amber/[0.07] px-4 py-2.5 text-sm text-amber">
            The 72-hour DPBI notification clock starts at the moment of discovery - log incidents promptly.
          </div>

          {/* Timing */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="breach-discovered-at" className="block text-sm font-medium text-text mb-1">Discovered (you became aware) <span className="text-red">*</span></label>
              <input id="breach-discovered-at" type="datetime-local" value={discoveredAt} onChange={e => setDiscoveredAt(e.target.value)} max={toLocalInputValue(new Date())} className={inputClass} />
            </div>
            <div>
              <label htmlFor="breach-occurred-at" className="block text-sm font-medium text-text mb-1">Occurred <span className="text-text-faint font-normal">(if known)</span></label>
              <input id="breach-occurred-at" type="datetime-local" value={occurredAt} onChange={e => setOccurredAt(e.target.value)} className={inputClass} />
            </div>
          </div>

          {/* Nature + approx affected */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="breach-nature" className="block text-sm font-medium text-text mb-1">Nature of breach <span className="text-red">*</span></label>
              <select id="breach-nature" value={nature} onChange={e => setNature(e.target.value)} className={inputClass}>
                {BREACH_NATURE_TYPES.map(n => <option key={n.value} value={n.value}>{n.label}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="breach-affected-count" className="block text-sm font-medium text-text mb-1">Approx. data principals affected</label>
              <input id="breach-affected-count" type="number" min={0} value={approx} onChange={e => setApprox(e.target.value)} placeholder="e.g. 1500" className={inputClass} />
            </div>
          </div>

          {/* Data categories */}
          <div>
            <label className="block text-sm font-medium text-text mb-2">Data categories affected <span className="text-red">*</span></label>
            <div className="border border-line rounded-lg p-3 max-h-52 overflow-y-auto space-y-3">
              {DATA_CATEGORY_GROUPS.map(group => {
                const cats = DATA_CATEGORIES.filter(c => c.group === group)
                if (!cats.length) return null
                return (
                  <div key={group}>
                    <p className="text-xs font-semibold text-text-faint uppercase tracking-wider mb-1">{group}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                      {cats.map(cat => (
                        <label key={cat.key} className="flex min-h-10 cursor-pointer items-center gap-2 text-sm text-text">
                          <input
                            type="checkbox"
                            checked={categories.includes(cat.key)}
                            onChange={() => toggleCategory(cat.key)}
                            className="rounded border-line text-accent focus:ring-accent"
                          />
                          {cat.label}{cat.sensitive && <span className="text-[10px] text-amber">●</span>}
                        </label>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Systems + discovery method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="breach-systems" className="block text-sm font-medium text-text mb-1">Systems involved <span className="text-text-faint font-normal">(comma-separated)</span></label>
              <input id="breach-systems" value={systemsText} onChange={e => setSystemsText(e.target.value)} placeholder="e.g. CRM database, S3 bucket" className={inputClass} />
            </div>
            <div>
              <label htmlFor="breach-discovery-method" className="block text-sm font-medium text-text mb-1">Discovery method</label>
              <input id="breach-discovery-method" value={discoveryMethod} onChange={e => setDiscoveryMethod(e.target.value)} placeholder="e.g. SIEM alert, customer report" className={inputClass} />
            </div>
          </div>

          {/* Containment */}
          <div>
            <label htmlFor="breach-initial-containment" className="block text-sm font-medium text-text mb-1">Containment actions taken <span className="text-text-faint font-normal">(optional)</span></label>
            <textarea id="breach-initial-containment" value={containment} onChange={e => setContainment(e.target.value)} rows={2} placeholder="What was done immediately to limit the breach…" className={`${inputClass} resize-y`} />
          </div>

          {error && <p className="rounded-lg border border-red/25 bg-red/[0.07] px-3 py-2 text-sm text-red">{error}</p>}

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
            <button type="button" onClick={onClose} className="btn btn-ghost w-full sm:w-auto">Cancel</button>
            <button
              type="submit"
              disabled={saving}
              className="btn btn-accent w-full disabled:opacity-50 sm:w-auto"
            >
              {saving ? 'Logging…' : 'Log Incident'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
