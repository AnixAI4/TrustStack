'use client'

import { useEffect, useState } from 'react'
import { X, AlertTriangle } from 'lucide-react'
import { BREACH_NATURE_TYPES, DATA_CATEGORIES, DATA_CATEGORY_GROUPS } from '@/lib/constants'
import type { BreachIncident } from '@/types/dpdp'

interface Props {
  open: boolean
  onClose: () => void
  onLogged: (incident: BreachIncident) => void
}

const inputClass =
  'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]'

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
      const res = await fetch('/api/breach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Failed to log the breach.'); return }
      onLogged(json.data as BreachIncident)
    } catch {
      setError('Network error — please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="flex items-center gap-2 text-lg font-bold text-[#003366]">
            <AlertTriangle size={18} className="text-red-500" /> Log a Breach Incident
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="bg-amber-50 border border-amber-100 rounded-lg px-4 py-2.5 text-sm text-amber-800">
            The 72-hour DPBI notification clock starts at the moment of discovery — log incidents promptly.
          </div>

          {/* Timing */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Discovered (you became aware) <span className="text-red-500">*</span></label>
              <input type="datetime-local" value={discoveredAt} onChange={e => setDiscoveredAt(e.target.value)} max={toLocalInputValue(new Date())} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Occurred <span className="text-gray-400 font-normal">(if known)</span></label>
              <input type="datetime-local" value={occurredAt} onChange={e => setOccurredAt(e.target.value)} className={inputClass} />
            </div>
          </div>

          {/* Nature + approx affected */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nature of breach <span className="text-red-500">*</span></label>
              <select value={nature} onChange={e => setNature(e.target.value)} className={inputClass}>
                {BREACH_NATURE_TYPES.map(n => <option key={n.value} value={n.value}>{n.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Approx. data principals affected</label>
              <input type="number" min={0} value={approx} onChange={e => setApprox(e.target.value)} placeholder="e.g. 1500" className={inputClass} />
            </div>
          </div>

          {/* Data categories */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Data categories affected <span className="text-red-500">*</span></label>
            <div className="border border-gray-100 rounded-lg p-3 max-h-52 overflow-y-auto space-y-3">
              {DATA_CATEGORY_GROUPS.map(group => {
                const cats = DATA_CATEGORIES.filter(c => c.group === group)
                if (!cats.length) return null
                return (
                  <div key={group}>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{group}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                      {cats.map(cat => (
                        <label key={cat.key} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={categories.includes(cat.key)}
                            onChange={() => toggleCategory(cat.key)}
                            className="rounded border-gray-300 text-[#003366] focus:ring-[#003366]"
                          />
                          {cat.label}{cat.sensitive && <span className="text-[10px] text-amber-600">●</span>}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Systems involved <span className="text-gray-400 font-normal">(comma-separated)</span></label>
              <input value={systemsText} onChange={e => setSystemsText(e.target.value)} placeholder="e.g. CRM database, S3 bucket" className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Discovery method</label>
              <input value={discoveryMethod} onChange={e => setDiscoveryMethod(e.target.value)} placeholder="e.g. SIEM alert, customer report" className={inputClass} />
            </div>
          </div>

          {/* Containment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Containment actions taken <span className="text-gray-400 font-normal">(optional)</span></label>
            <textarea value={containment} onChange={e => setContainment(e.target.value)} rows={2} placeholder="What was done immediately to limit the breach…" className={`${inputClass} resize-none`} />
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800">Cancel</button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-sm font-medium bg-[#003366] text-white rounded-lg hover:bg-[#1A5276] transition-colors disabled:opacity-50"
            >
              {saving ? 'Logging…' : 'Log Incident'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
