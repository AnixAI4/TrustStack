'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { INDUSTRY_SECTORS, EMPLOYEE_COUNT_RANGES, REVENUE_RANGES } from '@/lib/platform/constants'
import { getPlatformReturnPath } from '@/lib/platform-return'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 50)
}

export default function CreateOrganizationPage() {
  const [name, setName] = useState('')
  const [industry, setIndustry] = useState('')
  const [employeeCountRange, setEmployeeCountRange] = useState('')
  const [revenueRange, setRevenueRange] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [backHref, setBackHref] = useState('/')

  useEffect(() => {
    setBackHref(getPlatformReturnPath())
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('Organization name is required.')
      return
    }

    setLoading(true)

    const slug = slugify(name) + '-' + Math.random().toString(36).slice(2, 6)

    const res = await fetch('/api/trustdeck/organizations/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.trim(),
        slug,
        industry: industry || null,
        employee_count_range: employeeCountRange || null,
        revenue_range: revenueRange || null,
      }),
    })

    const data = await res.json() as { success?: boolean; error?: string; data?: { id?: string; already_exists?: boolean } }

    if (!res.ok || !data.success) {
      setError(data.error ?? 'Failed to create organization. Please try again.')
      setLoading(false)
      return
    }

    // Hard navigation so the app layout re-reads membership (soft push was looping)
    window.location.assign('/trustdeck/overview')
  }

  return (
    <div className="w-full max-w-lg">
      <div className="bg-bg-2 rounded-xl border border-line shadow-card p-8">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <h1 className="font-display text-xl font-semibold tracking-tight text-text">Set up your organization</h1>
              <p className="text-xs text-text-muted">Step 1 of 1 - takes 30 seconds</p>
            </div>
          </div>
          <p className="text-sm text-text-muted">
            This creates your TrustDeck™ workspace. All DPDP compliance data will be organized under your organization.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-text mb-1.5" htmlFor="org-name">
              Organization legal name <span className="text-red">*</span>
            </label>
            <input
              id="org-name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              placeholder="Acme Technologies Pvt. Ltd."
              className="w-full px-3 py-2.5 border border-line rounded-lg text-sm text-text placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text mb-1.5" htmlFor="industry">
              Industry sector
            </label>
            <select
              id="industry"
              value={industry}
              onChange={e => setIndustry(e.target.value)}
              className="w-full px-3 py-2.5 border border-line rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors bg-bg-2"
            >
              <option value="">Select industry</option>
              {INDUSTRY_SECTORS.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text mb-1.5" htmlFor="employees">
                Company size
              </label>
              <select
                id="employees"
                value={employeeCountRange}
                onChange={e => setEmployeeCountRange(e.target.value)}
                className="w-full px-3 py-2.5 border border-line rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors bg-bg-2"
              >
                <option value="">Select</option>
                {EMPLOYEE_COUNT_RANGES.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text mb-1.5" htmlFor="revenue">
                Annual revenue
              </label>
              <select
                id="revenue"
                value={revenueRange}
                onChange={e => setRevenueRange(e.target.value)}
                className="w-full px-3 py-2.5 border border-line rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors bg-bg-2"
              >
                <option value="">Select</option>
                {REVENUE_RANGES.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-red/30 bg-red/10 px-3 py-2.5 text-xs text-red">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-accent w-full min-h-11 mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating workspace…' : 'Continue to Dashboard →'}
          </button>
        </form>
      </div>
      <p className="mt-4 text-center text-xs text-text-faint">
        Not ready yet?{' '}
        <Link
          href={backHref}
          prefetch={false}
          className="font-medium text-accent underline-offset-2 hover:underline"
        >
          Back to TrustStack
        </Link>
      </p>
    </div>
  )
}
