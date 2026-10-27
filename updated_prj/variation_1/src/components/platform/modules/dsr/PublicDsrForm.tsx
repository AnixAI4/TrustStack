'use client'

import { useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { DSR_RIGHT_TYPES, DATA_CATEGORIES, DPDP_RIGHTS } from '@/lib/platform/constants'
import type { DsrRightType } from '@/types/dpdp'

interface Props {
  orgSlug: string
  orgName?: string
}

export interface DsrFormPayload {
  right_type: string
  principal_name: string
  principal_email: string
  principal_phone?: string
  details: string
  nominee_name?: string
  nominee_email?: string
  nominee_phone?: string
  nominee_relationship?: string
  data_categories?: string[]
}

const inputClass =
  'module-field'

async function readJsonResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) {
    throw new Error('Server returned an unexpected response. Please try again in a moment.')
  }
  return response.json() as Promise<T>
}

export function PublicDsrForm({ orgSlug, orgName }: Props) {
  const [rightType, setRightType]         = useState<DsrRightType>(DSR_RIGHT_TYPES[0].value)
  const [name, setName]                   = useState('')
  const [email, setEmail]                 = useState('')
  const [phone, setPhone]                 = useState('')
  const [details, setDetails]             = useState('')
  const [nomineeName, setNomineeName]     = useState('')
  const [nomineeEmail, setNomineeEmail]   = useState('')
  const [nomineePhone, setNomineePhone]   = useState('')
  const [nomineeRel, setNomineeRel]       = useState('')
  const [categories, setCategories]       = useState<string[]>([])
  const [submitting, setSubmitting]       = useState(false)
  const [submitted, setSubmitted]         = useState(false)
  const [reference, setReference]         = useState('')
  const [error, setError]                 = useState<string | null>(null)

  const rightInfo = DPDP_RIGHTS.find(r => r.id === rightType)
  const needsCategories: DsrRightType[] = ['access', 'correction', 'completeness', 'erasure']
  const showCategories = needsCategories.includes(rightType)
  const isNominate = rightType === 'nominate'

  function toggleCategory(key: string) {
    setCategories(prev => (prev.includes(key) ? prev.filter(c => c !== key) : [...prev, key]))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!name.trim()) { setError('Please enter your name.'); return }
    if (!email.trim()) { setError('Please enter your email address.'); return }
    if (!isNominate && details.trim().length < 10) { setError('Please provide at least 10 characters of request details.'); return }
    if (isNominate && (!nomineeName.trim() || !nomineeEmail.trim())) {
      setError("Please enter the nominee's name and email address."); return
    }

    setSubmitting(true)
    try {
      const payload: DsrFormPayload = {
        right_type: rightType,
        principal_name: name.trim(),
        principal_email: email.trim(),
        principal_phone: phone.trim() || undefined,
        details: details.trim(),
        nominee_name: isNominate ? nomineeName.trim() : undefined,
        nominee_email: isNominate ? nomineeEmail.trim() : undefined,
        nominee_phone: isNominate ? nomineePhone.trim() || undefined : undefined,
        nominee_relationship: isNominate ? nomineeRel.trim() : undefined,
        data_categories: showCategories ? categories : undefined,
      }
      const response = await fetch('/api/trustdeck/dsr/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          org_slug: orgSlug,
          right_type: payload.right_type,
          requestor_name: payload.principal_name,
          requestor_email: payload.principal_email,
          requestor_phone: payload.principal_phone,
          request_details: payload.details,
          affected_data_categories: payload.data_categories,
          nominee_name: payload.nominee_name,
          nominee_email: payload.nominee_email,
          nominee_phone: payload.nominee_phone,
          relationship: payload.nominee_relationship,
        }),
      })
      const result = await readJsonResponse<{
        error?: string
        reference_number?: string
      }>(response)
      if (!response.ok || !result.reference_number) throw new Error(result.error || 'Could not submit request')
      setReference(result.reference_number)
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
        <h2 className="font-display text-xl font-semibold tracking-tight text-text">Request Submitted</h2>
        <p className="text-sm text-text-muted mt-2">
          We&apos;ll respond within 30 days. Your reference is{' '}
          <span className="font-mono font-semibold text-text">{reference}</span>.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg mx-auto space-y-5">
      {orgName && (
        <p className="text-sm text-text-muted text-center">Submit a Data Subject Request to <span className="font-medium text-text">{orgName}</span></p>
      )}

      <div>
        <label htmlFor="dsr-right-type" className="block text-sm font-medium text-text mb-1">Type of request <span className="text-red">*</span></label>
        <select id="dsr-right-type" value={rightType} onChange={e => setRightType(e.target.value as DsrRightType)} className={inputClass}>
          {DSR_RIGHT_TYPES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
        {rightInfo && <p className="mt-1 text-xs text-text-faint">DPDP Section {rightInfo.section} · {rightInfo.name}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="dsr-name" className="block text-sm font-medium text-text mb-1">Full name <span className="text-red">*</span></label>
          <input id="dsr-name" value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" className={inputClass} />
        </div>
        <div>
          <label htmlFor="dsr-email" className="block text-sm font-medium text-text mb-1">Email <span className="text-red">*</span></label>
          <input id="dsr-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className={inputClass} />
        </div>
      </div>
      <div>
        <label htmlFor="dsr-phone" className="block text-sm font-medium text-text mb-1">Phone <span className="text-text-faint font-normal">(optional)</span></label>
        <input id="dsr-phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 …" className={inputClass} />
      </div>

      {isNominate && (
        <div className="border-t border-line pt-4">
          <p className="mb-3 text-sm font-medium text-text">Nominee details</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="dsr-nominee-name" className="block text-sm font-medium text-text mb-1">Nominee name <span className="text-red">*</span></label>
              <input id="dsr-nominee-name" value={nomineeName} onChange={e => setNomineeName(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label htmlFor="dsr-nominee-email" className="block text-sm font-medium text-text mb-1">Nominee email <span className="text-red">*</span></label>
              <input id="dsr-nominee-email" type="email" value={nomineeEmail} onChange={e => setNomineeEmail(e.target.value)} className={inputClass} />
            </div>
            <div><label htmlFor="dsr-nominee-phone" className="block text-sm font-medium text-text mb-1">Nominee phone</label><input id="dsr-nominee-phone" value={nomineePhone} onChange={e => setNomineePhone(e.target.value)} className={inputClass} /></div>
            <div><label htmlFor="dsr-nominee-relationship" className="block text-sm font-medium text-text mb-1">Relationship</label><input id="dsr-nominee-relationship" value={nomineeRel} onChange={e => setNomineeRel(e.target.value)} placeholder="e.g. Parent" className={inputClass} /></div>
          </div>
        </div>
      )}

      {showCategories && (
        <div>
          <label className="block text-sm font-medium text-text mb-2">Data categories <span className="text-text-faint font-normal">(select those relevant)</span></label>
          <div className="grid max-h-52 grid-cols-1 gap-1 overflow-y-auto rounded-lg border border-line p-3 min-[420px]:grid-cols-2">
            {DATA_CATEGORIES.map(c => (
              <label key={c.key} className="flex min-h-10 cursor-pointer items-center gap-2 text-sm text-text">
                <input
                  type="checkbox"
                  checked={categories.includes(c.key)}
                  onChange={() => toggleCategory(c.key)}
                  className="rounded border-line text-accent focus:ring-accent"
                />
                {c.label}
              </label>
            ))}
          </div>
        </div>
      )}

      <div>
        <label htmlFor="dsr-details" className="block text-sm font-medium text-text mb-1">Additional details</label>
        <textarea
          id="dsr-details"
          value={details}
          onChange={e => setDetails(e.target.value)}
          rows={3}
          placeholder="Provide any details that will help us fulfil your request…"
          className={`${inputClass} resize-none`}
        />
      </div>

      {error && <p className="text-sm text-red bg-red/10 border border-red/30 rounded-lg px-3 py-2">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="btn btn-accent w-full min-h-11 disabled:opacity-50"
      >
        {submitting ? 'Submitting…' : 'Submit Request'}
      </button>
    </form>
  )
}
