'use client'

import { useState, useEffect } from 'react'
import { Building2, X } from 'lucide-react'
import { VENDOR_TYPES, DATA_CATEGORIES } from '@/lib/platform/constants'
import type { Vendor, VendorType } from '@/types/dpdp'

interface Props {
  open: boolean
  onClose: () => void
  onSave: (data: Partial<Vendor>) => Promise<void>
  initialData?: Partial<Vendor>
}

const inputClass =
  'module-field'

export function VendorFormModal({ open, onClose, onSave, initialData }: Props) {
  const [name, setName]             = useState('')
  const [type, setType]             = useState<VendorType>('other')
  const [website, setWebsite]       = useState('')
  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [dataCategories, setDataCategories] = useState<string[]>([])
  const [indiaDataResidency, setIndiaDataResidency] = useState(true)
  const [dataLocations, setDataLocations] = useState('')
  const [notes, setNotes]           = useState('')

  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState<string | null>(null)

  // Reset / prefill on open
  useEffect(() => {
    if (!open) return
    setName(initialData?.name ?? '')
    setType(initialData?.vendor_type ?? 'other')
    setWebsite(initialData?.website ?? '')
    setContactName(initialData?.contact_name ?? '')
    setContactEmail(initialData?.contact_email ?? '')
    setDataCategories(initialData?.personal_data_categories ?? [])
    setIndiaDataResidency(initialData?.india_data_residency ?? true)
    setDataLocations(initialData?.data_location?.join(', ') ?? '')
    setNotes(initialData?.notes ?? '')
    setError(null)
  }, [open, initialData])

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
    setDataCategories(prev => (prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!name.trim()) { setError('Vendor name is required.'); return }

    setSaving(true)
    try {
      await onSave({
        name: name.trim(),
        vendor_type: type,
        website: website.trim(),
        contact_name: contactName.trim(),
        contact_email: contactEmail.trim(),
        personal_data_categories: dataCategories,
        india_data_residency: indiaDataResidency,
        data_location: dataLocations.split(',').map(location => location.trim()).filter(Boolean),
        notes: notes.trim(),
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save vendor.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="module-dialog-backdrop fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overscroll-contain p-2 sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="vendor-form-title"
        className="module-dialog-surface max-h-[calc(100dvh-1rem)] w-full max-w-lg overflow-y-auto overscroll-contain rounded-xl sm:max-h-[calc(100dvh-2rem)]"
        onClick={e => e.stopPropagation()}
      >
        <div className="module-dialog-header sticky top-0 z-10 flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
          <h2 id="vendor-form-title" className="flex items-center gap-2.5 font-display text-lg font-semibold text-text">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-accent/10 text-accent"><Building2 size={18} /></span>
            {initialData?.name ? 'Edit vendor' : 'Add vendor'}
          </h2>
          <button type="button" onClick={onClose} aria-label="Close vendor form" className="grid h-10 w-10 place-items-center rounded-lg text-text-faint hover:bg-glass hover:text-text-muted"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-4 sm:p-6">
          {/* Name + type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="vendor-name" className="block text-sm font-medium text-text mb-1">Vendor name <span className="text-red">*</span></label>
              <input id="vendor-name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. AWS, Salesforce" className={inputClass} />
            </div>
            <div>
              <label htmlFor="vendor-type" className="block text-sm font-medium text-text mb-1">Type</label>
              <select id="vendor-type" value={type} onChange={e => setType(e.target.value as VendorType)} className={inputClass}>
                {VENDOR_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>

          {/* Website */}
          <div>
            <label htmlFor="vendor-website" className="block text-sm font-medium text-text mb-1">Website</label>
            <input id="vendor-website" value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://…" className={inputClass} />
          </div>

          {/* Contact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="vendor-contact-name" className="block text-sm font-medium text-text mb-1">Contact name</label>
              <input id="vendor-contact-name" value={contactName} onChange={e => setContactName(e.target.value)} placeholder="DPO or account rep" className={inputClass} />
            </div>
            <div>
              <label htmlFor="vendor-contact-email" className="block text-sm font-medium text-text mb-1">Contact email</label>
              <input id="vendor-contact-email" type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} className={inputClass} />
            </div>
          </div>

          {/* Data categories */}
          <div>
            <label className="block text-sm font-medium text-text mb-2">Data categories shared</label>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto border border-line rounded-lg p-2">
              {DATA_CATEGORIES.map(c => {
                const selected = dataCategories.includes(c.key)
                return (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => toggleCategory(c.key)}
                    className={`px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${
                      selected
                        ? 'bg-accent text-[color:var(--on-accent)] shadow-sm'
                        : 'border border-line bg-surface-2/70 text-text-muted hover:border-accent/25 hover:text-text'
                    }`}
                  >
                    {c.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Data residency */}
          <div className="border-t border-line pt-4">
            <label className="flex items-center gap-2 text-sm text-text cursor-pointer">
              <input
                type="checkbox"
                checked={indiaDataResidency}
                onChange={e => setIndiaDataResidency(e.target.checked)}
                className="rounded border-line text-accent focus:ring-accent"
              />
              Vendor offers India data residency
            </label>
            <div className="mt-3">
              <label htmlFor="vendor-data-locations" className="block text-sm font-medium text-text mb-1">Data locations <span className="font-normal text-text-faint">(comma-separated)</span></label>
              <input
                id="vendor-data-locations"
                value={dataLocations}
                onChange={e => setDataLocations(e.target.value)}
                placeholder="e.g. Mumbai, Singapore, EU"
                className={inputClass}
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="vendor-notes" className="block text-sm font-medium text-text mb-1">Notes</label>
            <textarea
              id="vendor-notes"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              placeholder="Internal notes…"
              className={`${inputClass} resize-none`}
            />
          </div>

          {error && <p className="rounded-lg border border-red/25 bg-red/[0.07] px-3 py-2 text-sm text-red">{error}</p>}

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
            <button type="button" onClick={onClose} className="btn btn-ghost w-full sm:w-auto">Cancel</button>
            <button
              type="submit"
              disabled={saving}
              className="btn btn-accent w-full disabled:opacity-50 sm:w-auto"
            >
              {saving ? 'Saving…' : initialData?.name ? 'Update' : 'Add Vendor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
