'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ShieldCheck, AlertCircle, Loader2 } from 'lucide-react'

interface Props {
  orgSlug: string
  orgName: string
}

export function DsrLinkComplete({ orgSlug, orgName }: Props) {
  const searchParams = useSearchParams()
  const reference = searchParams.get('ref') ?? ''
  const verifiedParam = searchParams.get('verified') === '1'
  const errorParam = searchParams.get('error')
  const [state, setState] = useState<'loading' | 'success' | 'error'>(
    verifiedParam ? 'success' : errorParam ? 'error' : 'loading',
  )
  const [message, setMessage] = useState(
    verifiedParam
      ? `Your request ${reference} is verified. ${orgName} will respond within 30 days.`
      : errorParam === 'email_mismatch'
        ? 'This verification link does not match the email on your request.'
        : errorParam
          ? 'This verification link expired or was already used. Submit a new request and open the latest email link.'
          : 'Confirming your identity…',
  )

  useEffect(() => {
    if (verifiedParam || errorParam) return

    if (!reference) {
      setState('error')
      setMessage('Missing request reference. Return to the form and submit again.')
      return
    }

    let cancelled = false
    ;(async () => {
      try {
        const response = await fetch('/api/trustdeck/dsr/otp/complete-link', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ reference_number: reference, org_slug: orgSlug }),
        })
        const contentType = response.headers.get('content-type') ?? ''
        const result = contentType.includes('application/json')
          ? ((await response.json()) as { error?: string; verified?: boolean })
          : { error: 'Unexpected server response.' }
        if (cancelled) return
        if (!response.ok) {
          setState('error')
          setMessage(result.error || 'Verification could not be completed.')
          return
        }
        setState('success')
        setMessage(
          result.verified
            ? `Your request ${reference} is verified. ${orgName} will respond within 30 days.`
            : 'Verification complete.',
        )
      } catch {
        if (!cancelled) {
          setState('error')
          setMessage(
            'Verification could not be completed. Open the latest link from your email — you do not need a TrustStack account.',
          )
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [orgSlug, orgName, reference, verifiedParam, errorParam])

  return (
    <div className="mx-auto max-w-md py-12 text-center">
      {state === 'loading' && (
        <>
          <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-accent" aria-hidden />
          <h1 className="font-display text-xl font-semibold tracking-tight text-text">Verifying your request</h1>
          <p className="mt-2 text-sm text-text-muted">{message}</p>
        </>
      )}
      {state === 'success' && (
        <>
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-green/10">
            <ShieldCheck className="h-7 w-7 text-green" />
          </div>
          <h1 className="font-display text-xl font-semibold tracking-tight text-text">Request verified</h1>
          <p className="mt-2 text-sm text-text-muted">{message}</p>
          <p className="mt-3 text-xs text-text-faint">
            No TrustStack login is required. This only confirmed you own the email on the request.
          </p>
          <Link
            href={`/trustdeck/public/dsr/${orgSlug}`}
            className="mt-6 inline-block text-sm font-medium text-accent hover:underline"
          >
            Back to {orgName}
          </Link>
        </>
      )}
      {state === 'error' && (
        <>
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-red/10">
            <AlertCircle className="h-7 w-7 text-red" />
          </div>
          <h1 className="font-display text-xl font-semibold tracking-tight text-text">Verification failed</h1>
          <p className="mt-2 text-sm text-text-muted">{message}</p>
          <p className="mt-3 text-xs text-text-faint">
            You do not need a TrustStack account. Use the verification link from the same email you submitted with.
          </p>
          <Link
            href={`/trustdeck/public/dsr/${orgSlug}`}
            className="mt-6 inline-block text-sm font-medium text-accent hover:underline"
          >
            Return to the request form
          </Link>
        </>
      )}
    </div>
  )
}
