'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, Clock, AlertTriangle } from 'lucide-react'
import { urgencyLevel, formatCountdown } from '@/lib/platform/breach/countdown'
import type { BreachUrgency } from '@/types/dpdp'

interface Props {
  dueAt: string
  dpbiNotified: boolean
  /** `pill` (default) for the register table; `banner` for the detail page hero. */
  variant?: 'pill' | 'banner'
  /** Tick client-side every second so the value stays accurate to the minute. */
  live?: boolean
}

const TONE: Record<BreachUrgency, { pill: string; banner: string; label: string }> = {
  normal:   { pill: 'bg-green/10 text-green', banner: 'border-green/25 bg-green/[0.07] text-green', label: 'On track' },
  warning:  { pill: 'bg-amber/10 text-amber', banner: 'border-amber/25 bg-amber/[0.07] text-amber', label: 'Notify soon' },
  critical: { pill: 'bg-red/10 text-red', banner: 'border-red/25 bg-red/[0.07] text-red', label: 'Urgent' },
  overdue:  { pill: 'bg-red/15 text-red', banner: 'border-red/35 bg-red/[0.11] text-red', label: 'Overdue' },
}

// 72-hour DPBI notification countdown. Derived at read time; ticks client-side
// when `live` so the prominent detail-page timer is accurate to the minute with
// no polling. Once the breach is recorded as DPBI-notified, the clock stops.
export function BreachCountdown({ dueAt, dpbiNotified, variant = 'pill', live = false }: Props) {
  const [now, setNow] = useState<number>(() => Date.now())

  useEffect(() => {
    if (!live || dpbiNotified) return
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [live, dpbiNotified])

  if (dpbiNotified) {
    if (variant === 'banner') {
      return (
        <div className="flex items-center gap-3 rounded-xl border border-green/25 bg-green/[0.07] px-4 py-3 text-green">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">DPBI notified</p>
            <p className="text-sm text-text-muted">The Data Protection Board of India has been notified - the 72-hour clock is stopped.</p>
          </div>
        </div>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-pill bg-green/10 px-2 py-0.5 text-xs font-medium text-green">
        <CheckCircle2 className="h-3 w-3" /> DPBI notified
      </span>
    )
  }

  const nowDate = new Date(now)
  const urgency = urgencyLevel(dueAt, nowDate)
  const tone = TONE[urgency]
  const overdue = urgency === 'overdue'

  if (variant === 'banner') {
    // Recompute with seconds for a live ticking feel.
    const diffMs = new Date(dueAt).getTime() - now
    const abs = Math.abs(diffMs)
    const h = Math.floor(abs / 3_600_000)
    const m = Math.floor((abs % 3_600_000) / 60_000)
    const s = Math.floor((abs % 60_000) / 1000)
    const Icon = overdue ? AlertTriangle : Clock
    return (
      <div className={`rounded-xl border px-5 py-4 ${tone.banner}`}>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
          <Icon className="h-4 w-4" />
          {overdue ? '72-hour DPBI deadline passed' : '72-hour DPBI notification deadline'}
        </div>
        <p className="mt-1 font-mono text-3xl font-bold tabular-nums">
          {overdue ? 'Overdue by ' : ''}{h}h {m}m {s}s{overdue ? '' : ' remaining'}
        </p>
        <p className="mt-1 text-sm opacity-80">
          Due {new Date(dueAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
        </p>
      </div>
    )
  }

  return (
    <span className={`inline-flex items-center rounded-pill px-2 py-0.5 text-xs font-medium ${tone.pill}`}>
      {formatCountdown(dueAt, nowDate)}
    </span>
  )
}
