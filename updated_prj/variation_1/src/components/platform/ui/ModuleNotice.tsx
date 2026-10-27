import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

type ModuleNoticeTone = 'accent' | 'green' | 'amber' | 'red' | 'blue'

const TONE: Record<ModuleNoticeTone, { frame: string; rail: string; icon: string; eyebrow: string }> = {
  accent: {
    frame: 'border-accent/25 bg-accent/[0.07]',
    rail: 'bg-accent',
    icon: 'border-accent/15 bg-accent/10 text-accent',
    eyebrow: 'text-accent',
  },
  green: {
    frame: 'border-green/25 bg-green/[0.07]',
    rail: 'bg-green',
    icon: 'border-green/15 bg-green/10 text-green',
    eyebrow: 'text-green',
  },
  amber: {
    frame: 'border-amber/25 bg-amber/[0.07]',
    rail: 'bg-amber',
    icon: 'border-amber/15 bg-amber/10 text-amber',
    eyebrow: 'text-amber',
  },
  red: {
    frame: 'border-red/25 bg-red/[0.07]',
    rail: 'bg-red',
    icon: 'border-red/15 bg-red/10 text-red',
    eyebrow: 'text-red',
  },
  blue: {
    frame: 'border-blue/25 bg-blue/[0.07]',
    rail: 'bg-blue',
    icon: 'border-blue/15 bg-blue/10 text-blue',
    eyebrow: 'text-blue',
  },
}

export function ModuleNotice({
  tone = 'accent',
  icon,
  eyebrow,
  title,
  description,
  action,
  className,
  alert = false,
}: {
  tone?: ModuleNoticeTone
  icon?: ReactNode
  eyebrow?: string
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  className?: string
  alert?: boolean
}) {
  const style = TONE[tone]

  return (
    <div
      role={alert ? 'alert' : 'status'}
      className={cn(
        'relative flex flex-col gap-3 overflow-hidden rounded-xl border px-5 py-4 shadow-card sm:flex-row sm:items-center sm:justify-between',
        style.frame,
        className
      )}
    >
      <span aria-hidden="true" className={cn('absolute inset-y-0 left-0 w-1', style.rail)} />
      <div className="flex min-w-0 items-start gap-3">
        {icon && (
          <span className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-lg border shadow-sm', style.icon)}>
            {icon}
          </span>
        )}
        <div className="min-w-0">
          {eyebrow && (
            <p className={cn('font-mono text-label font-semibold uppercase tracking-[var(--tracking-label)]', style.eyebrow)}>
              {eyebrow}
            </p>
          )}
          <div className={cn('text-sm font-semibold leading-snug text-text', eyebrow && 'mt-1')}>{title}</div>
          {description && <div className="mt-1 text-xs leading-relaxed text-text-muted sm:text-sm">{description}</div>}
        </div>
      </div>
      {action && <div className="flex shrink-0 items-center self-start sm:self-auto">{action}</div>}
    </div>
  )
}
