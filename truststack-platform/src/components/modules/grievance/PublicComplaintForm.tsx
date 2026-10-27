'use client'

import { useState } from 'react'
import { CheckCircle, Upload } from 'lucide-react'
import { COMPLAINT_TYPES, GRIEVANCE_LANGUAGES } from '@/lib/constants'

interface Props {
  orgSlug: string
  orgName: string
}

interface FormState {
  complainant_name:  string
  complainant_email: string
  complainant_phone: string
  complaint_type:    string
  description:       string
  language:          string
}

const INITIAL: FormState = {
  complainant_name:  '',
  complainant_email: '',
  complainant_phone: '',
  complaint_type:    '',
  description:       '',
  language:          'en',
}

export function PublicComplaintForm({ orgSlug, orgName }: Props) {
  const [form, setForm]             = useState<FormState>(INITIAL)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const [refNumber, setRefNumber]   = useState<string | null>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!form.complainant_name.trim()) { setError('Your name is required.'); return }
    if (!form.complainant_email.trim() && !form.complainant_phone.trim()) {
      setError('Please provide at least one contact method (email or phone).'); return
    }
    if (!form.complaint_type) { setError('Please select a complaint type.'); return }
    if (form.description.trim().length < 50) {
      setError('Description must be at least 50 characters so we can understand your concern.'); return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/grievance/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ org_slug: orgSlug, ...form }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Submission failed. Please try again.'); return }
      setRefNumber(json.reference_number as string)
    } catch {
      setError('Network error — please check your connection and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (refNumber) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <CheckCircle className="text-green-600" size={32} />
        </div>
        <h2 className="text-xl font-bold text-[#003366] mb-2">Complaint Submitted</h2>
        <p className="text-gray-600 mb-4">
          We have received your complaint and will respond within <strong>30 days</strong> as required under DPDP Section 14.
        </p>
        <div className="inline-block bg-[#D6E4F0] rounded-xl px-6 py-4">
          <p className="text-xs font-semibold text-[#003366] uppercase tracking-wider mb-1">Your Reference Number</p>
          <p className="font-mono text-2xl font-bold text-[#003366]">{refNumber}</p>
          <p className="text-xs text-gray-500 mt-1">Please save this for your records</p>
        </div>
        <p className="text-sm text-gray-400 mt-6">
          If you don&apos;t hear back within 30 days, you may escalate to the Data Protection Board of India (DPBI).
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Language selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
        <select
          name="language"
          value={form.language}
          onChange={handleChange}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]"
        >
          {GRIEVANCE_LANGUAGES.map(l => (
            <option key={l.code} value={l.code}>{l.name}</option>
          ))}
        </select>
      </div>

      {/* Complainant name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Your Full Name <span className="text-red-500">*</span>
        </label>
        <input
          name="complainant_name"
          value={form.complainant_name}
          onChange={handleChange}
          placeholder="Enter your full name"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]"
        />
      </div>

      {/* Contact */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email Address <span className="text-gray-400 font-normal">(at least one required)</span>
          </label>
          <input
            type="email"
            name="complainant_email"
            value={form.complainant_email}
            onChange={handleChange}
            placeholder="you@example.com"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number <span className="text-gray-400 font-normal">(at least one required)</span>
          </label>
          <input
            type="tel"
            name="complainant_phone"
            value={form.complainant_phone}
            onChange={handleChange}
            placeholder="+91 98765 43210"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]"
          />
        </div>
      </div>

      {/* Complaint type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nature of Complaint <span className="text-red-500">*</span>
        </label>
        <select
          name="complaint_type"
          value={form.complaint_type}
          onChange={handleChange}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]"
        >
          <option value="">Select complaint type…</option>
          {COMPLAINT_TYPES.map(t => (
            <option key={t.value} value={t.value}>{t.label} ({t.dpdp_section})</option>
          ))}
        </select>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Describe Your Complaint <span className="text-red-500">*</span>
        </label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          rows={5}
          placeholder="Please describe your complaint in detail (minimum 50 characters). Include relevant dates, actions taken, and what resolution you are seeking."
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#003366]"
        />
        <p className={`text-xs mt-1 ${form.description.length < 50 && form.description.length > 0 ? 'text-red-500' : 'text-gray-400'}`}>
          {form.description.length}/50 characters minimum
        </p>
      </div>

      {/* File upload note */}
      <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 rounded-lg px-4 py-3">
        <Upload size={15} className="shrink-0" />
        <span>Document attachments: Please email supporting documents to {orgName}&apos;s Grievance Officer directly.</span>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full py-3 bg-[#003366] text-white font-semibold rounded-lg hover:bg-[#1A5276] transition-colors disabled:opacity-50"
      >
        {submitting ? 'Submitting…' : 'Submit Complaint'}
      </button>

      <p className="text-xs text-center text-gray-400">
        By submitting, you acknowledge that this complaint will be reviewed by {orgName}&apos;s Grievance Officer under DPDP Section 14.
      </p>
    </form>
  )
}
