'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { INDUSTRY_SECTORS, EMPLOYEE_COUNT_RANGES, REVENUE_RANGES } from '@/lib/constants'

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
  const router = useRouter()

  const [name, setName] = useState('')
  const [industry, setIndustry] = useState('')
  const [employeeCountRange, setEmployeeCountRange] = useState('')
  const [revenueRange, setRevenueRange] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('Organization name is required.')
      return
    }

    setLoading(true)

    const slug = slugify(name) + '-' + Math.random().toString(36).slice(2, 6)

    const res = await fetch('/api/organizations/create', {
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

    const data = await res.json() as { success?: boolean; error?: string }

    if (!res.ok || !data.success) {
      setError(data.error ?? 'Failed to create organization. Please try again.')
      setLoading(false)
      return
    }

    router.push('/dashboard/overview')
    router.refresh()
  }

  return (
    <div className="w-full max-w-lg">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-[#003366] rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#003366]">Set up your organization</h1>
              <p className="text-xs text-gray-500">Step 1 of 1 — takes 30 seconds</p>
            </div>
          </div>
          <p className="text-sm text-gray-500">
            This creates your TrustStack™ workspace. All DPDP compliance data will be organized under your organization.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5" htmlFor="org-name">
              Organization legal name <span className="text-red-500">*</span>
            </label>
            <input
              id="org-name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              placeholder="Acme Technologies Pvt. Ltd."
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#003366]/20 focus:border-[#003366] transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5" htmlFor="industry">
              Industry sector
            </label>
            <select
              id="industry"
              value={industry}
              onChange={e => setIndustry(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#003366]/20 focus:border-[#003366] transition-colors bg-white"
            >
              <option value="">Select industry</option>
              {INDUSTRY_SECTORS.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5" htmlFor="employees">
                Company size
              </label>
              <select
                id="employees"
                value={employeeCountRange}
                onChange={e => setEmployeeCountRange(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#003366]/20 focus:border-[#003366] transition-colors bg-white"
              >
                <option value="">Select</option>
                {EMPLOYEE_COUNT_RANGES.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5" htmlFor="revenue">
                Annual revenue
              </label>
              <select
                id="revenue"
                value={revenueRange}
                onChange={e => setRevenueRange(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#003366]/20 focus:border-[#003366] transition-colors bg-white"
              >
                <option value="">Select</option>
                {REVENUE_RANGES.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 text-xs text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#003366] text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-[#1A5276] transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-2"
          >
            {loading ? 'Creating workspace…' : 'Continue to Dashboard →'}
          </button>
        </form>
      </div>
    </div>
  )
}
