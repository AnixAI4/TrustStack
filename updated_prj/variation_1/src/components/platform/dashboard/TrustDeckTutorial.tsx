'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckSquare,
  Compass,
  Database,
  FileBarChart,
  Play,
  ShieldCheck,
  Sparkles,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react'
import { EASE } from '@/lib/motion'
import { cn } from '@/lib/cn'

type TutorialStep = {
  id: string
  icon: LucideIcon
  eyebrow: string
  title: string
  body: string
  bullets: string[]
  output: string
  href: string
  action: string
  tone: 'accent' | 'green' | 'amber' | 'blue' | 'red'
}

const STEPS: TutorialStep[] = [
  {
    id: 'baseline',
    icon: Compass,
    eyebrow: '1 · Establish the baseline',
    title: 'Measure before you build',
    body: 'DPDP Compass turns your current practices into a verified readiness baseline. Complete the assessment once, then use the gap map to decide what deserves attention first.',
    bullets: [
      '45 questions across eight control areas',
      'Industry-aware scoring and maturity level',
      'Prioritized remediation mapped to TrustDeck modules',
    ],
    output: 'Readiness score + prioritized gap roadmap',
    href: '/trustdeck/assessment',
    action: 'Open DPDP Compass',
    tone: 'accent',
  },
  {
    id: 'trust',
    icon: CheckSquare,
    eyebrow: '2 · Build the trust layer',
    title: 'Make notice and consent operational',
    body: 'Configure purpose-specific consent, publish a readable privacy notice, and keep immutable evidence of what people were told and what they chose.',
    bullets: [
      'Consent purposes, languages and widget controls',
      'AI-assisted privacy notice with publish validation',
      'Consent audit trail and reversible withdrawal',
    ],
    output: 'Published notice + demonstrable consent records',
    href: '/trustdeck/consent',
    action: 'Configure consent',
    tone: 'green',
  },
  {
    id: 'rights',
    icon: Users,
    eyebrow: '3 · Run rights operations',
    title: 'Turn requests into accountable workflows',
    body: 'Appoint a grievance officer, receive public complaints and data-rights requests, track deadlines, and preserve a complete response record.',
    bullets: [
      'Grievance intake with resolution status',
      'DSR register with 30-day due dates',
      'Drafted responses with human review',
    ],
    output: 'Auditable grievance and DSR registers',
    href: '/trustdeck/dsr',
    action: 'Open DSR Management',
    tone: 'blue',
  },
  {
    id: 'ecosystem',
    icon: Database,
    eyebrow: '4 · Map the processing ecosystem',
    title: 'Know what you process and who touches it',
    body: 'Build the Record of Processing Activities, connect legal bases to consent, and assess every external processor before sensitive data leaves your control.',
    bullets: [
      'ROPA entries with DPO approval workflow',
      'Vendor questionnaire and risk score',
      'AI-assisted DPA drafting and expiry tracking',
    ],
    output: 'Approved ROPA + governed vendor register',
    href: '/trustdeck/ropa',
    action: 'Build the ROPA',
    tone: 'amber',
  },
  {
    id: 'assurance',
    icon: FileBarChart,
    eyebrow: '5 · Respond and report',
    title: 'Keep leadership and regulators ready',
    body: 'Use the breach workflow when an incident happens, then turn live module data into a board-ready report without rebuilding evidence by hand.',
    bullets: [
      '72-hour DPBI deadline and notification draft',
      'Board summary with current module evidence',
      'PDF export and seven-day signed share link',
    ],
    output: 'Breach response record + board assurance pack',
    href: '/trustdeck/reports',
    action: 'Create a board report',
    tone: 'red',
  },
]

const TONE: Record<TutorialStep['tone'], { color: string; soft: string }> = {
  accent: { color: 'var(--accent)', soft: 'color-mix(in srgb, var(--accent) 12%, transparent)' },
  green: { color: 'var(--green)', soft: 'color-mix(in srgb, var(--green) 12%, transparent)' },
  amber: { color: 'var(--amber)', soft: 'color-mix(in srgb, var(--amber) 12%, transparent)' },
  blue: { color: 'var(--blue)', soft: 'color-mix(in srgb, var(--blue) 12%, transparent)' },
  red: { color: 'var(--red)', soft: 'color-mix(in srgb, var(--red) 12%, transparent)' },
}

export const TRUSTDECK_TOUR_STORAGE_KEY = 'trustdeck-tour-v1'

export function TrustDeckTutorialStrip({
  onStart,
  onDismiss,
}: {
  onStart: () => void
  onDismiss: () => void
}) {
  const reduce = useReducedMotion()

  return (
    <section className="relative mb-6 overflow-hidden rounded-xl border border-accent/20 bg-bg-2 shadow-card" aria-labelledby="trustdeck-tour-title">
      <div
        className="absolute inset-0 opacity-80"
        aria-hidden
        style={{
          background:
            'linear-gradient(110deg, color-mix(in srgb, var(--accent) 11%, transparent), transparent 42%, color-mix(in srgb, var(--green) 7%, transparent))',
        }}
      />
      <div className="relative flex flex-col gap-4 px-4 py-4 sm:px-5 lg:flex-row lg:items-center lg:gap-6">
        <div className="flex min-w-0 items-center gap-3.5 lg:max-w-[27rem]">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-accent/25 bg-bg-2 text-accent shadow-sm">
            <Sparkles className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="font-mono text-label font-semibold uppercase tracking-[var(--tracking-label)] text-accent">Start here</p>
            <h2 id="trustdeck-tour-title" className="mt-0.5 font-display text-lg font-semibold text-text">See how TrustDeck fits together</h2>
            <p className="mt-0.5 text-xs leading-relaxed text-text-muted">A five-step operating loop, from first assessment to board assurance.</p>
          </div>
        </div>

        <div className="hidden min-w-0 flex-1 items-center justify-center md:flex" aria-hidden>
          {STEPS.map((step, index) => {
            const Icon = step.icon
            const tone = TONE[step.tone]
            return (
              <div key={step.id} className="flex min-w-0 items-center">
                <span
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border bg-bg-2"
                  style={{ borderColor: `color-mix(in srgb, ${tone.color} 28%, var(--line))`, color: tone.color }}
                >
                  <Icon className="h-3.5 w-3.5" />
                </span>
                {index < STEPS.length - 1 && (
                  <span className="relative h-px w-7 overflow-hidden bg-line lg:w-10">
                    {!reduce && (
                      <motion.span
                        className="absolute inset-y-0 left-0 w-3 bg-accent"
                        animate={{ x: [0, 42] }}
                        transition={{ duration: 1.8, repeat: Infinity, ease: 'linear', delay: index * 0.18 }}
                      />
                    )}
                  </span>
                )}
              </div>
            )
          })}
        </div>

        <div className="flex shrink-0 items-center gap-2 lg:ml-auto">
          <button type="button" onClick={onStart} className="btn btn-accent inline-flex min-h-10 items-center gap-2 text-sm">
            <Play className="h-4 w-4 fill-current" /> Take the tour
          </button>
          <button
            type="button"
            onClick={onDismiss}
            title="Dismiss getting started"
            aria-label="Dismiss getting started"
            className="grid h-10 w-10 place-items-center rounded-lg border border-line bg-bg-2 text-text-faint transition-colors hover:text-text"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  )
}

export function TrustDeckTutorialModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const reduce = useReducedMotion()
  const [index, setIndex] = useState(0)
  const closeRef = useRef<HTMLButtonElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  const returnFocusRef = useRef<HTMLElement | null>(null)
  const step = STEPS[index]
  const tone = TONE[step.tone]
  const canPortal = typeof document !== 'undefined'

  useEffect(() => {
    if (!open) return
    setIndex(0)
    returnFocusRef.current = document.activeElement as HTMLElement | null
    document.body.style.overflow = 'hidden'
    window.setTimeout(() => closeRef.current?.focus(), 0)
    return () => {
      document.body.style.overflow = ''
      returnFocusRef.current?.focus()
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
      if (event.key === 'ArrowRight') setIndex(current => Math.min(STEPS.length - 1, current + 1))
      if (event.key === 'ArrowLeft') setIndex(current => Math.max(0, current - 1))
      if (event.key === 'Tab') {
        const focusable = Array.from(
          modalRef.current?.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
          ) ?? []
        ).filter(element => element.offsetParent !== null)
        const first = focusable[0]
        const last = focusable.at(-1)
        if (first && last && event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last.focus()
        } else if (first && last && !event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  if (!canPortal) return null

  return createPortal(
    open ? (
        <div ref={modalRef} className="fixed inset-0 z-[220] grid place-items-center p-2 sm:p-4" role="dialog" aria-modal="true" aria-labelledby="trustdeck-tutorial-title">
          <button
            type="button"
            tabIndex={-1}
            aria-label="Close tutorial"
            className="absolute inset-0 bg-black/65 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={reduce ? false : { y: 16, scale: 0.98 }}
            animate={{ y: 0, scale: 1 }}
            transition={{ duration: 0.28, ease: EASE }}
            className="relative z-10 grid max-h-[calc(100dvh-1rem)] w-full max-w-5xl overflow-hidden rounded-xl border border-line bg-bg-2 shadow-[0_48px_120px_-34px_rgba(0,0,0,0.72)] md:grid-cols-[18rem_minmax(0,1fr)]"
          >
            <aside className="relative overflow-hidden border-b border-line bg-[#171a17] px-4 py-5 text-white md:border-b-0 md:border-r md:px-5 md:py-6">
              <div className="absolute inset-0 opacity-40" aria-hidden style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.045) 1px, transparent 1px), linear-gradient(90deg,rgba(255,255,255,.045) 1px,transparent 1px)', backgroundSize: '28px 28px' }} />
              <div className="relative">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-lg bg-accent text-[color:var(--on-accent)]">
                    <ShieldCheck className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-display text-lg font-semibold">TrustDeck tour</p>
                    <p className="font-mono text-label uppercase tracking-[var(--tracking-label)] text-white/45">The operating loop</p>
                  </div>
                </div>

                <nav className="mt-6 hidden space-y-1 md:block" aria-label="Tutorial steps">
                  {STEPS.map((item, itemIndex) => {
                    const Icon = item.icon
                    const active = itemIndex === index
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setIndex(itemIndex)}
                        className={cn(
                          'relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors',
                          active ? 'text-white' : 'text-white/50 hover:bg-white/[0.05] hover:text-white/80'
                        )}
                      >
                        {active && <motion.span layoutId="trustdeck-tour-active" className="absolute inset-0 rounded-lg bg-white/[0.1] shadow-[inset_0_0_0_1px_rgba(255,255,255,.08)]" />}
                        <span className={cn('relative z-10 grid h-7 w-7 place-items-center rounded-md border', active ? 'border-accent/60 bg-accent text-[color:var(--on-accent)]' : 'border-white/10 bg-white/[0.04]')}>
                          <Icon className="h-3.5 w-3.5" />
                        </span>
                        <span className="relative z-10 min-w-0 flex-1 truncate">{item.title}</span>
                        <span className="relative z-10 font-mono text-[10px] text-white/35">0{itemIndex + 1}</span>
                      </button>
                    )
                  })}
                </nav>

                <div className="mt-5 flex gap-1.5 md:hidden" aria-label={`Step ${index + 1} of ${STEPS.length}`}>
                  {STEPS.map((item, itemIndex) => (
                    <button key={item.id} type="button" aria-label={`Go to step ${itemIndex + 1}`} onClick={() => setIndex(itemIndex)} className={cn('h-1.5 flex-1 rounded-pill', itemIndex === index ? 'bg-accent' : 'bg-white/15')} />
                  ))}
                </div>
              </div>
            </aside>

            <section className="min-h-0 overflow-y-auto">
              <header className="flex items-center justify-between gap-4 border-b border-line px-5 py-3 sm:px-7">
                <p className="font-mono text-label font-semibold uppercase tracking-[var(--tracking-label)] text-text-faint">Step {index + 1} of {STEPS.length}</p>
                <button ref={closeRef} type="button" onClick={onClose} aria-label="Close tutorial" className="grid h-9 w-9 place-items-center rounded-lg border border-line bg-glass text-text-muted transition-colors hover:text-text">
                  <X className="h-4 w-4" />
                </button>
              </header>

              <motion.div
                key={step.id}
                initial={reduce ? false : { x: 18 }}
                animate={{ x: 0 }}
                transition={{ duration: 0.25, ease: EASE }}
                className="px-5 py-6 sm:px-8 sm:py-8"
              >
                <div className="flex items-start gap-4">
                  <motion.span
                    className="relative grid h-14 w-14 shrink-0 place-items-center rounded-xl border"
                    style={{ color: tone.color, background: tone.soft, borderColor: `color-mix(in srgb, ${tone.color} 28%, var(--line))` }}
                    animate={reduce ? undefined : { y: [0, -3, 0] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <step.icon className="h-6 w-6" />
                  </motion.span>
                  <div className="min-w-0">
                    <p className="font-mono text-label font-semibold uppercase tracking-[var(--tracking-label)]" style={{ color: tone.color }}>{step.eyebrow}</p>
                    <h2 id="trustdeck-tutorial-title" className="mt-1 font-display text-2xl font-semibold leading-tight text-text sm:text-3xl">{step.title}</h2>
                  </div>
                </div>

                <p className="mt-5 max-w-2xl text-sm leading-relaxed text-text-muted sm:text-base">{step.body}</p>

                <div className="mt-6 divide-y divide-line border-y border-line">
                  {step.bullets.map((bullet, bulletIndex) => (
                    <div key={bullet} className="flex items-center gap-3 py-3.5">
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold" style={{ color: tone.color, background: tone.soft }}>
                        {bulletIndex + 1}
                      </span>
                      <p className="text-sm font-medium text-text">{bullet}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-5 flex items-start gap-3 rounded-lg border border-line bg-surface-2/35 p-4">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-bg-2 text-green shadow-sm"><Check className="h-4 w-4" /></span>
                  <div>
                    <p className="font-mono text-label font-semibold uppercase tracking-[var(--tracking-label)] text-text-faint">What this produces</p>
                    <p className="mt-0.5 text-sm font-semibold text-text">{step.output}</p>
                  </div>
                </div>
              </motion.div>

              <footer className="flex items-center justify-between gap-3 border-t border-line px-5 py-3 sm:px-7">
                <button type="button" disabled={index === 0} onClick={() => setIndex(current => Math.max(0, current - 1))} className="btn btn-ghost inline-flex min-h-10 items-center gap-2 text-sm disabled:invisible">
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
                <div className="flex items-center gap-2">
                  <Link href={step.href} prefetch={false} onClick={onClose} className="btn btn-ghost hidden min-h-10 items-center gap-2 text-sm sm:inline-flex">
                    {step.action}
                  </Link>
                  {index < STEPS.length - 1 ? (
                    <button type="button" onClick={() => setIndex(current => Math.min(STEPS.length - 1, current + 1))} className="btn btn-accent inline-flex min-h-10 items-center gap-2 text-sm">
                      Next <ArrowRight className="h-4 w-4" />
                    </button>
                  ) : (
                    <Link href="/trustdeck/assessment" prefetch={false} onClick={onClose} className="btn btn-accent inline-flex min-h-10 items-center gap-2 text-sm">
                      Start with Compass <Compass className="h-4 w-4" />
                    </Link>
                  )}
                </div>
              </footer>
            </section>
          </motion.div>
        </div>
    ) : null,
    document.body
  )
}
