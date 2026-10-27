'use client'

import { useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { COMPLAINT_TYPES, GRIEVANCE_LANGUAGES } from '@/lib/platform/constants'
import type { GrievanceComplaintType } from '@/types/dpdp'

interface Props {
  orgSlug: string
  orgName?: string
}

export interface ComplaintFormPayload {
  complaint_type: string
  complainant_name: string
  complainant_email: string
  complainant_phone?: string
  description: string
  preferred_language?: string
}

const inputClass =
  'module-field'

export function PublicComplaintForm({ orgSlug, orgName }: Props) {
  const [type, setType]             = useState<GrievanceComplaintType>(COMPLAINT_TYPES[0].value)
  const [name, setName]             = useState('')
  const [email, setEmail]           = useState('')
  const [phone, setPhone]           = useState('')
  const [description, setDescription] = useState('')
  const [lang, setLang]             = useState('en')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted]   = useState(false)
  const [error, setError]           = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!name.trim()) { setError('Please enter your name.'); return }
    if (!email.trim()) { setError('Please enter your email address.'); return }
    if (!description.trim()) { setError('Please describe your grievance.'); return }

    setSubmitting(true)
    try {
      const payload: ComplaintFormPayload = {
        complaint_type: type,
        complainant_name: name.trim(),
        complainant_email: email.trim(),
        complainant_phone: phone.trim() || undefined,
        description: description.trim(),
        preferred_language: lang,
      }
      const response = await fetch('/api/trustdeck/grievance/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          org_slug: orgSlug,
          ...payload,
          language: payload.preferred_language,
        }),
      })
      const result = await response.json() as { error?: string }
      if (!response.ok) throw new Error(result.error || 'Could not submit grievance')
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred - please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <div className="w-14 h-14 rounded-full bg-green/10 flex items-center justify-center mx-auto mb-4">
          <ShieldCheck className="h-7 w-7 text-green" />
        </div>
        <h2 className="font-display text-xl font-semibold tracking-tight text-text">Complaint Submitted</h2>
        <p className="text-sm text-text-muted mt-2">
          We&apos;ve received your grievance and our Grievance Officer will respond within 30 days.
          Updates will be sent to <span className="font-medium">{email}</span>.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg mx-auto space-y-5">
      {orgName && (
        <p className="text-sm text-text-muted text-center">Submit a grievance to <span className="font-medium text-text">{orgName}</span></p>
      )}

      {/* Type */}
      <div>
        <label htmlFor="grievance-type" className="block text-sm font-medium text-text mb-1">Type of complaint <span className="text-red">*</span></label>
        <select id="grievance-type" value={type} onChange={e => setType(e.target.value as GrievanceComplaintType)} className={inputClass}>
          {COMPLAINT_TYPES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>

      {/* Personal details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="grievance-name" className="block text-sm font-medium text-text mb-1">Full name <span className="text-red">*</span></label>
          <input id="grievance-name" value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" className={inputClass} />
        </div>
        <div>
          <label htmlFor="grievance-email" className="block text-sm font-medium text-text mb-1">Email <span className="text-red">*</span></label>
          <input id="grievance-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className={inputClass} />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="grievance-phone" className="block text-sm font-medium text-text mb-1">Phone <span className="text-text-faint font-normal">(optional)</span></label>
          <input id="grievance-phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 …" className={inputClass} />
        </div>
        <div>
          <label htmlFor="grievance-language" className="block text-sm font-medium text-text mb-1">Preferred language</label>
          <select id="grievance-language" value={lang} onChange={e => setLang(e.target.value)} className={inputClass}>
            {GRIEVANCE_LANGUAGES.map(language => <option key={language.code} value={language.code}>{language.name}</option>)}
          </select>
        </div>
      </div>

      {/* Description */}
      <div>
        <label htmlFor="grievance-description" className="block text-sm font-medium text-text mb-1">Describe your grievance <span className="text-red">*</span></label>
        <textarea
          id="grievance-description"
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={4}
          placeholder="Please describe the issue in detail…"
          className={`${inputClass} resize-y`}
        />
      </div>

      {error && <p className="text-sm text-red bg-red/10 border border-red/30 rounded-lg px-3 py-2">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="btn btn-accent w-full min-h-11 disabled:opacity-50"
      >
        {submitting ? 'Submitting…' : 'Submit Grievance'}
      </button>
    </form>
  )
}
