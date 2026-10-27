'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { safeInternalPath } from '@/lib/pilot-paths'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { signIn } = useAuth()
  const redirectTo = safeInternalPath(
    searchParams.get('redirectTo'),
    '/trustdeck/overview'
  )

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await signIn(email, password)
    if (result.status !== 'ok') {
      setError(result.message)
      setLoading(false)
      return
    }

    router.push(redirectTo)
    router.refresh()
  }

  return (
    <div className="w-full max-w-sm">
      <div className="bg-bg-2 rounded-xl border border-line shadow-card p-8">
        <div className="mb-6 text-center">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-text">Welcome back</h1>
          <p className="text-sm text-text-muted mt-1">Sign in to your TrustStack™ account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-text mb-1.5" htmlFor="email">
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
              className="w-full px-3 py-2.5 border border-line rounded-lg text-sm text-text placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-text" htmlFor="password">
                Password
              </label>
              <Link
                href="/auth/sign-in"
                className="text-xs text-brand hover:text-accent transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full px-3 py-2.5 border border-line rounded-lg text-sm text-text placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red/30 bg-red/10 px-3 py-2.5 text-xs text-red">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-accent w-full min-h-11 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-text-muted">
          Don&apos;t have an account?{' '}
          <Link href="/trustdeck/signup" className="text-brand font-medium hover:text-accent transition-colors">
            Sign up free
          </Link>
        </p>
      </div>

      <p className="mt-4 text-center text-xs text-text-faint">
        Your data is protected under{' '}
        <Link href="/privacy-policy" className="underline hover:text-text-muted">
          our privacy policy
        </Link>
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
