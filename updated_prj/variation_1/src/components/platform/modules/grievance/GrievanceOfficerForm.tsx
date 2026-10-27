'use client'

import { useState, useEffect } from 'react'
import type { GrievanceOfficer } from '@/types/dpdp'

interface Props {
  officer?: GrievanceOfficer | null
  onSave: (officer: {
    name: string
    designation: string
    email: string
    phone?: string
  }) => Promise<void>
  onCancel?: () => void
}

const inputClass =
  'module-field'

export function GrievanceOfficerForm({ officer, onSave, onCancel }: Props) {
  const [name, setName]       = useState('')
  const [email, setEmail]     = useState('')
  const [phone, setPhone]     = useState('')
  const [designation, setDesignation] = useState('')
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (officer) {
      setName(officer.name ?? '')
      setEmail(officer.email ?? '')
      setPhone(officer.phone ?? '')
      setDesignation(officer.designation ?? '')
    }
  }, [officer])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (!name.trim()) { setError('Grievance Officer name is required.'); return }
    if (!designation.trim()) { setError('Designation is required.'); return }
    if (!email.trim()) { setError('Email is required.'); return }

    setSaving(true)
    try {
      await onSave({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        designation: designation.trim(),
      })
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save officer.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="officer-name" className="block text-sm font-medium text-text mb-1">Name <span className="text-red">*</span></label>
          <input id="officer-name" value={name} onChange={e => setName(e.target.value)} placeholder="Full name" className={inputClass} />
        </div>
        <div>
          <label htmlFor="officer-designation" className="block text-sm font-medium text-text mb-1">Designation <span className="text-red">*</span></label>
          <input id="officer-designation" value={designation} onChange={e => setDesignation(e.target.value)} placeholder="e.g. Data Protection Officer" className={inputClass} />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="officer-email" className="block text-sm font-medium text-text mb-1">Email <span className="text-red">*</span></label>
          <input id="officer-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="grievance@example.com" className={inputClass} />
        </div>
        <div>
          <label htmlFor="officer-phone" className="block text-sm font-medium text-text mb-1">Phone</label>
          <input id="officer-phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 …" className={inputClass} />
        </div>
      </div>

      {error && <p className="rounded-lg border border-red/25 bg-red/[0.07] px-3 py-2 text-sm text-red">{error}</p>}
      {success && <p className="rounded-lg border border-green/25 bg-green/[0.07] px-3 py-2 text-sm text-green">Grievance Officer saved successfully.</p>}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {onCancel && (
          <button type="button" onClick={onCancel} disabled={saving} className="min-h-11 rounded-lg px-4 py-2 text-sm font-medium text-text-muted hover:bg-glass hover:text-text disabled:opacity-50">
            Cancel
          </button>
        )}
        <button type="submit" disabled={saving} className="min-h-11 rounded-lg bg-accent px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-soft disabled:opacity-50">
          {saving ? 'Saving…' : 'Save Officer'}
        </button>
      </div>
    </form>
  )
}
