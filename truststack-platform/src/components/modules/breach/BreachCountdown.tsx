'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, Clock, AlertTriangle } from 'lucide-react'
import { urgencyLevel, formatCountdown } from '@/lib/breach/countdown'
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
  normal:   { pill: 'bg-green-50 text-green-700',  banner: 'bg-green-50 border-green-200 text-green-800',   label: 'On track' },
  warning:  { pill: 'bg-amber-50 text-amber-700',  banner: 'bg-amber-50 border-amber-200 text-amber-800',   label: 'Notify soon' },
  critical: { pill: 'bg-red-50 text-red-700',      banner: 'bg-red-50 border-red-200 text-red-800',         label: 'Urgent' },
  overdue:  { pill: 'bg-red-100 text-red-800',     banner: 'bg-red-100 border-red-300 text-red-900',        label: 'Overdue' },
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
        <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-green-800">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">DPBI notified</p>
            <p className="text-sm text-green-700">The Data Protection Board of India has been notified — the 72-hour clock is stopped.</p>
          </div>
        </div>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
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
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${tone.pill}`}>
      {formatCountdown(dueAt, nowDate)}
    </span>
  )
}
