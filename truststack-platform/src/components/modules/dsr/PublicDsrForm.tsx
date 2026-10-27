'use client'

import { useState } from 'react'
import { CheckCircle, ChevronLeft, ChevronRight, ShieldCheck, MessageCircle, Mail } from 'lucide-react'
import { DSR_RIGHT_TYPES, DATA_CATEGORIES, DPDP_RIGHTS } from '@/lib/constants'

interface Props {
  orgSlug: string
  orgName: string
}

type RightType = (typeof DSR_RIGHT_TYPES)[number]
type Step = 'select' | 'form' | 'otp' | 'done'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const GRIEVANCE = DPDP_RIGHTS.find(r => r.id === 'grievance')!

interface FormState {
  requestor_name: string
  requestor_email: string
  requestor_phone: string
  request_details: string
  affected_data_categories: string[]
  nominee_name: string
  nominee_email: string
  nominee_phone: string
  relationship: string
}

const INITIAL_FORM: FormState = {
  requestor_name: '',
  requestor_email: '',
  requestor_phone: '',
  request_details: '',
  affected_data_categories: [],
  nominee_name: '',
  nominee_email: '',
  nominee_phone: '',
  relationship: '',
}

const inputClass =
  'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]'

export function PublicDsrForm({ orgSlug, orgName }: Props) {
  const [step, setStep]       = useState<Step>('select')
  const [right, setRight]     = useState<RightType | null>(null)
  const [form, setForm]       = useState<FormState>(INITIAL_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  // OTP step
  const [refNumber, setRefNumber]     = useState('')
  const [emailMasked, setEmailMasked] = useState('')
  const [otpSent, setOtpSent]         = useState(true)
  const [code, setCode]               = useState('')
  const [verifying, setVerifying]     = useState(false)
  const [resending, setResending]     = useState(false)
  const [notice, setNotice]           = useState<string | null>(null)

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function pickRight(r: RightType) {
    setRight(r)
    setForm(INITIAL_FORM)
    setError(null)
    setStep('form')
  }

  function toggleCategory(key: string) {
    setForm(prev => ({
      ...prev,
      affected_data_categories: prev.affected_data_categories.includes(key)
        ? prev.affected_data_categories.filter(c => c !== key)
        : [...prev.affected_data_categories, key],
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!right) return
    setError(null)

    if (!form.requestor_name.trim()) { setError('Your name is required.'); return }
    if (!EMAIL_RE.test(form.requestor_email.trim())) {
      setError('A valid email is required — we send a verification code to it.'); return
    }
    if (right.value === 'nominate') {
      if (!form.nominee_name.trim() || !EMAIL_RE.test(form.nominee_email.trim())) {
        setError('Please provide the nominee’s name and a valid email.'); return
      }
    } else if (form.request_details.trim().length < 10) {
      setError('Please describe your request (at least 10 characters).'); return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/dsr/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          org_slug: orgSlug,
          right_type: right.value,
          requestor_name: form.requestor_name,
          requestor_email: form.requestor_email,
          requestor_phone: form.requestor_phone,
          request_details: form.request_details,
          affected_data_categories: right.needs_data_categories ? form.affected_data_categories : [],
          nominee_name: form.nominee_name,
          nominee_email: form.nominee_email,
          nominee_phone: form.nominee_phone,
          relationship: form.relationship,
        }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Submission failed. Please try again.'); return }
      setRefNumber(json.reference_number as string)
      setEmailMasked(json.email_masked as string)
      setOtpSent(Boolean(json.otp_sent))
      setNotice(json.otp_sent ? null : 'We couldn’t email a code just now. Tap “Resend code” to try again.')
      setStep('otp')
    } catch {
      setError('Network error — please check your connection and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!/^\d{6}$/.test(code.trim())) { setError('Enter the 6-digit code from your email.'); return }
    setVerifying(true)
    try {
      const res = await fetch('/api/dsr/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference_number: refNumber, code: code.trim(), org_slug: orgSlug }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Verification failed.'); return }
      setStep('done')
    } catch {
      setError('Network error — please try again.')
    } finally {
      setVerifying(false)
    }
  }

  async function handleResend() {
    setResending(true)
    setError(null)
    setNotice(null)
    try {
      const res = await fetch('/api/dsr/otp/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference_number: refNumber, org_slug: orgSlug }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Could not resend the code.'); return }
      if (json.email_masked) setEmailMasked(json.email_masked as string)
      setOtpSent(Boolean(json.otp_sent))
      setNotice(json.otp_sent ? 'A new code is on its way.' : 'We still couldn’t email a code. Please contact the organization directly.')
    } catch {
      setError('Network error — please try again.')
    } finally {
      setResending(false)
    }
  }

  // --- Step: success --------------------------------------------------------
  if (step === 'done') {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <CheckCircle className="text-green-600" size={32} />
        </div>
        <h2 className="text-xl font-bold text-[#003366] mb-2">Request Verified &amp; Submitted</h2>
        <p className="text-gray-600 mb-4">
          Your identity has been verified and your request is now with {orgName}. They will respond within{' '}
          <strong>30 days</strong> as required under the DPDP Act.
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

  // --- Step: OTP ------------------------------------------------------------
  if (step === 'otp') {
    return (
      <form onSubmit={handleVerify} className="space-y-5">
        <div className="flex items-center gap-3 bg-[#D6E4F0] rounded-lg px-4 py-3">
          <Mail size={18} className="text-[#003366] shrink-0" />
          <p className="text-sm text-[#003366]">
            We sent a 6-digit verification code to <strong>{emailMasked}</strong>. Enter it below to confirm your
            identity. Your reference is <span className="font-mono font-semibold">{refNumber}</span>.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Verification code</label>
          <input
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
            placeholder="123456"
            className={`${inputClass} text-center text-2xl tracking-[0.5em] font-mono`}
          />
        </div>

        {notice && <p className="text-sm text-[#2874A6] bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">{notice}</p>}
        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

        <button
          type="submit"
          disabled={verifying}
          className="w-full py-3 bg-[#003366] text-white font-semibold rounded-lg hover:bg-[#1A5276] transition-colors disabled:opacity-50"
        >
          {verifying ? 'Verifying…' : 'Verify & Submit Request'}
        </button>

        <div className="flex items-center justify-between text-sm">
          <button type="button" onClick={() => { setStep('form'); setError(null); setNotice(null) }} className="text-gray-500 hover:text-[#003366] inline-flex items-center gap-1">
            <ChevronLeft size={14} /> Edit request
          </button>
          <button type="button" onClick={handleResend} disabled={resending} className="text-[#003366] hover:underline disabled:opacity-50">
            {resending ? 'Resending…' : 'Resend code'}
          </button>
        </div>
        {!otpSent && (
          <p className="text-xs text-amber-600 text-center">
            Heads up: the code email hasn’t gone through yet — try “Resend code”.
          </p>
        )}
      </form>
    )
  }

  // --- Step: form -----------------------------------------------------------
  if (step === 'form' && right) {
    const isNominate = right.value === 'nominate'
    return (
      <form onSubmit={handleSubmit} className="space-y-5">
        <button type="button" onClick={() => { setStep('select'); setError(null) }} className="text-sm text-gray-500 hover:text-[#003366] inline-flex items-center gap-1">
          <ChevronLeft size={14} /> Choose a different right
        </button>

        <div className="bg-gray-50 rounded-lg px-4 py-3">
          <p className="font-semibold text-[#003366]">{right.label}</p>
          <p className="text-xs text-gray-500 mt-0.5">{right.dpdp_section} — {right.description}</p>
        </div>

        {/* Requestor */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Your Full Name <span className="text-red-500">*</span></label>
          <input value={form.requestor_name} onChange={e => update('requestor_name', e.target.value)} placeholder="Enter your full name" className={inputClass} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address <span className="text-red-500">*</span></label>
            <input type="email" value={form.requestor_email} onChange={e => update('requestor_email', e.target.value)} placeholder="you@example.com" className={inputClass} />
            <p className="text-xs text-gray-400 mt-1">We send a verification code here.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number <span className="text-gray-400 font-normal">(optional)</span></label>
            <input type="tel" value={form.requestor_phone} onChange={e => update('requestor_phone', e.target.value)} placeholder="+91 98765 43210" className={inputClass} />
          </div>
        </div>

        {/* Affected data categories */}
        {right.needs_data_categories && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Which data does this concern? <span className="text-gray-400 font-normal">(optional)</span></label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {DATA_CATEGORIES.map(cat => (
                <label key={cat.key} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.affected_data_categories.includes(cat.key)}
                    onChange={() => toggleCategory(cat.key)}
                    className="rounded border-gray-300 text-[#003366] focus:ring-[#003366]"
                  />
                  {cat.label}
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Nominee */}
        {isNominate && (
          <div className="bg-[#F4F8FC] rounded-lg p-4 space-y-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Nominee details</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nominee Name <span className="text-red-500">*</span></label>
                <input value={form.nominee_name} onChange={e => update('nominee_name', e.target.value)} placeholder="Full name" className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nominee Email <span className="text-red-500">*</span></label>
                <input type="email" value={form.nominee_email} onChange={e => update('nominee_email', e.target.value)} placeholder="nominee@example.com" className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nominee Phone <span className="text-gray-400 font-normal">(optional)</span></label>
                <input type="tel" value={form.nominee_phone} onChange={e => update('nominee_phone', e.target.value)} placeholder="+91 98765 43210" className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Relationship <span className="text-gray-400 font-normal">(optional)</span></label>
                <input value={form.relationship} onChange={e => update('relationship', e.target.value)} placeholder="e.g. Spouse, Parent, Child" className={inputClass} />
              </div>
            </div>
          </div>
        )}

        {/* Details */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {right.detail_label} {!isNominate && <span className="text-red-500">*</span>}
          </label>
          <textarea
            value={form.request_details}
            onChange={e => update('request_details', e.target.value)}
            rows={4}
            placeholder={right.detail_placeholder}
            className={`${inputClass} resize-none`}
          />
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 bg-[#003366] text-white font-semibold rounded-lg hover:bg-[#1A5276] transition-colors disabled:opacity-50"
        >
          {submitting ? 'Submitting…' : 'Continue to Identity Verification'}
        </button>
        <p className="text-xs text-center text-gray-400 flex items-center justify-center gap-1">
          <ShieldCheck size={13} /> Your identity is verified by email before {orgName} processes this request.
        </p>
      </form>
    )
  }

  // --- Step: select ---------------------------------------------------------
  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500">Select the right you would like to exercise under the DPDP Act:</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {DSR_RIGHT_TYPES.map(r => (
          <button
            key={r.value}
            onClick={() => pickRight(r)}
            className="text-left bg-white border border-gray-200 rounded-xl p-4 hover:border-[#003366] hover:shadow-sm transition-all group"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-[#1A1A2E] group-hover:text-[#003366]">{r.label}</span>
              <ChevronRight size={16} className="text-gray-300 group-hover:text-[#003366]" />
            </div>
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{r.dpdp_section}</span>
            <p className="text-sm text-gray-500 mt-1.5">{r.description}</p>
          </button>
        ))}

        {/* Grievance redressal lives in M4 — link out instead of creating a DSR. */}
        <a
          href={`/public/grievance/${orgSlug}`}
          className="text-left bg-white border border-gray-200 rounded-xl p-4 hover:border-[#003366] hover:shadow-sm transition-all group"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="font-semibold text-[#1A1A2E] group-hover:text-[#003366] inline-flex items-center gap-1.5">
              <MessageCircle size={15} /> {GRIEVANCE.name}
            </span>
            <ChevronRight size={16} className="text-gray-300 group-hover:text-[#003366]" />
          </div>
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Section {GRIEVANCE.section}</span>
          <p className="text-sm text-gray-500 mt-1.5">Raise a complaint with the Grievance Officer.</p>
        </a>
      </div>
    </div>
  )
}
