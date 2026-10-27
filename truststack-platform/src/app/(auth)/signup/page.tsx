'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      setLoading(false)
      return
    }

    const supabase = createClient()
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${window.location.origin}/api/auth/callback?next=/create-organization`,
      },
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    // If session is immediately available (email confirmation disabled in Supabase),
    // redirect straight to org creation
    if (data.session) {
      router.push('/create-organization')
      router.refresh()
      return
    }

    setEmailSent(true)
    setLoading(false)
  }

  if (emailSent) {
    return (
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center">
          <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-[#003366] mb-2">Check your email</h1>
          <p className="text-sm text-gray-500">
            We sent a confirmation link to <strong className="text-gray-700">{email}</strong>.
            Click the link to activate your account.
          </p>
          <p className="mt-4 text-xs text-gray-400">
            Didn&apos;t receive it? Check spam, or{' '}
            <button
              onClick={() => setEmailSent(false)}
              className="text-[#2874A6] underline"
            >
              try again
            </button>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-[#003366]">Start your DPDP journey</h1>
          <p className="text-sm text-gray-500 mt-1">Free 14-day trial · No credit card required</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5" htmlFor="name">
              Your full name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              autoComplete="name"
              placeholder="Priya Sharma"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#003366]/20 focus:border-[#003366] transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5" htmlFor="email">
              Work email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="you@company.com"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#003366]/20 focus:border-[#003366] transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="Min 8 characters"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#003366]/20 focus:border-[#003366] transition-colors"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 text-xs text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#003366] text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-[#1A5276] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-gray-400">
          By signing up you agree to our{' '}
          <Link href="/terms" className="underline hover:text-gray-600">Terms</Link>
          {' '}and{' '}
          <Link href="/privacy-policy" className="underline hover:text-gray-600">Privacy Policy</Link>
        </p>

        <p className="mt-4 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link href="/login" className="text-[#2874A6] font-medium hover:text-[#003366] transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
