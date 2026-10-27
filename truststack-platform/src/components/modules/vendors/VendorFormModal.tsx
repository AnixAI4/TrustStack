'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { VENDOR_TYPES, DATA_CATEGORIES } from '@/lib/constants'
import type { Vendor, VendorType } from '@/types/dpdp'

interface Props {
  open: boolean
  onClose: () => void
  onSaved: (vendor: Vendor) => void
  vendor?: Vendor | null // present = edit mode
}

const inputClass =
  'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]'
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function VendorFormModal({ open, onClose, onSaved, vendor }: Props) {
  const isEdit = Boolean(vendor)
  const [name, setName]               = useState(vendor?.name ?? '')
  const [vendorType, setVendorType]   = useState<VendorType>(vendor?.vendor_type ?? 'cloud')
  const [website, setWebsite]         = useState(vendor?.website ?? '')
  const [contactName, setContactName] = useState(vendor?.contact_name ?? '')
  const [contactEmail, setContactEmail] = useState(vendor?.contact_email ?? '')
  const [india, setIndia]             = useState(vendor?.india_data_residency ?? false)
  const [dataLocation, setDataLocation] = useState((vendor?.data_location ?? []).join(', '))
  const [categories, setCategories]   = useState<string[]>(vendor?.personal_data_categories ?? [])
  const [notes, setNotes]             = useState(vendor?.notes ?? '')
  const [saving, setSaving]           = useState(false)
  const [error, setError]             = useState<string | null>(null)

  if (!open) return null

  function toggleCategory(key: string) {
    setCategories(prev => (prev.includes(key) ? prev.filter(c => c !== key) : [...prev, key]))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!name.trim()) { setError('Vendor name is required.'); return }
    if (contactEmail.trim() && !EMAIL_RE.test(contactEmail.trim())) {
      setError('Please enter a valid contact email.'); return
    }

    setSaving(true)
    try {
      const payload = {
        name: name.trim(),
        vendor_type: vendorType,
        website: website.trim() || undefined,
        contact_name: contactName.trim() || undefined,
        contact_email: contactEmail.trim() || undefined,
        india_data_residency: india,
        data_location: dataLocation.split(',').map(s => s.trim()).filter(Boolean),
        personal_data_categories: categories,
        notes: notes.trim() || undefined,
      }
      const res = await fetch(isEdit ? `/api/vendors/${vendor!.id}` : '/api/vendors', {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Failed to save vendor.'); return }
      onSaved(json.data as Vendor)
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
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white">
          <h2 className="text-lg font-bold text-[#003366]">{isEdit ? 'Edit Vendor' : 'Add Vendor'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vendor Name <span className="text-red-500">*</span></label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Razorpay" className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type <span className="text-red-500">*</span></label>
              <select value={vendorType} onChange={e => setVendorType(e.target.value as VendorType)} className={inputClass}>
                {VENDOR_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Website <span className="text-gray-400 font-normal">(optional)</span></label>
              <input value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://…" className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Location(s) <span className="text-gray-400 font-normal">(comma-separated)</span></label>
              <input value={dataLocation} onChange={e => setDataLocation(e.target.value)} placeholder="India, Singapore" className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name <span className="text-gray-400 font-normal">(optional)</span></label>
              <input value={contactName} onChange={e => setContactName(e.target.value)} placeholder="Account manager" className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email <span className="text-gray-400 font-normal">(for questionnaire)</span></label>
              <input type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} placeholder="privacy@vendor.com" className={inputClass} />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={india} onChange={e => setIndia(e.target.checked)} className="rounded border-gray-300 text-[#003366] focus:ring-[#003366]" />
            Vendor stores our data within India (DPDP data residency)
          </label>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Personal Data Categories <span className="text-gray-400 font-normal">(optional)</span></label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-44 overflow-y-auto border border-gray-100 rounded-lg p-3">
              {DATA_CATEGORIES.map(cat => (
                <label key={cat.key} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={categories.includes(cat.key)}
                    onChange={() => toggleCategory(cat.key)}
                    className="rounded border-gray-300 text-[#003366] focus:ring-[#003366]"
                  />
                  {cat.label}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes <span className="text-gray-400 font-normal">(optional)</span></label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Certifications, context, internal notes…" className={`${inputClass} resize-none`} />
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800">Cancel</button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-sm font-medium bg-[#003366] text-white rounded-lg hover:bg-[#1A5276] transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Vendor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
