'use client'

import type { ReactNode } from 'react'
import { RefreshCw } from 'lucide-react'
import { cn } from '@/lib/cn'

export type ModuleStatTone = 'blue' | 'amber' | 'green' | 'red' | 'accent'

const TONE: Record<ModuleStatTone, { bg: string; icon: string; bar: string }> = {
  blue: { bg: 'bg-blue/10', icon: 'text-blue', bar: 'bg-blue' },
  amber: { bg: 'bg-amber/10', icon: 'text-amber', bar: 'bg-amber' },
  green: { bg: 'bg-green/10', icon: 'text-green', bar: 'bg-green' },
  red: { bg: 'bg-red/10', icon: 'text-red', bar: 'bg-red' },
  accent: { bg: 'bg-accent/10', icon: 'text-accent', bar: 'bg-accent' },
}

export type ModuleStatItem = {
  label: string
  value: number | string
  icon: ReactNode
  tone: ModuleStatTone
  /** Keep raw string (e.g. "30 days") instead of locale-formatting numbers. */
  isText?: boolean
}

/** Unified hub stats strip — same geometry as Overview / Consent. */
export function ModuleStatGrid({ items, className }: { items: ModuleStatItem[]; className?: string }) {
  const cols = items.length <= 2 ? 'grid-cols-2' : 'grid-cols-2 lg:grid-cols-4'

  return (
    <div
      className={cn(
        'platform-panel grid overflow-hidden rounded-xl border border-line bg-bg-2 shadow-card',
        cols,
        className
      )}
    >
      {items.map((item, index) => {
        const c = TONE[item.tone]
        const divider = [
          'border-b border-line lg:border-b-0',
          'border-b border-l border-line lg:border-b-0',
          'lg:border-l lg:border-line',
          'border-l border-line',
        ][index % 4]
        const display =
          item.isText || typeof item.value === 'string'
            ? item.value
            : item.value.toLocaleString('en-IN')

        return (
          <div key={item.label} className={cn('relative min-h-28 overflow-hidden p-4 sm:px-5 sm:py-5', divider)}>
            <span className={cn('absolute inset-x-0 top-0 h-0.5 opacity-75', c.bar)} />
            <div className="flex items-start justify-between gap-3">
              <p className="pt-0.5 font-mono text-label font-semibold uppercase tracking-[var(--tracking-label)] text-text-faint">{item.label}</p>
              <span className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-current/10', c.bg, c.icon)}>
                {item.icon}
              </span>
            </div>
            <p className="mt-4 font-display text-3xl font-semibold leading-none text-text">{display}</p>
          </div>
        )
      })}
    </div>
  )
}

/** Quiet header refresh — keeps live polling UX without crowding primary CTAs. */
export function ModuleRefreshControl({
  onRefresh,
  lastRefreshed,
  className,
}: {
  onRefresh: () => void
  lastRefreshed?: Date
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onRefresh}
      title={
        lastRefreshed
          ? `Updated ${lastRefreshed.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
          : 'Refresh'
      }
      aria-label="Refresh"
      className={cn(
        'grid h-9 w-9 place-items-center rounded-lg border border-line/80 bg-bg-2 text-text-muted shadow-sm transition-[border-color,color,transform] hover:-translate-y-0.5 hover:border-accent/40 hover:text-accent',
        className
      )}
    >
      <RefreshCw className="h-3.5 w-3.5" strokeWidth={1.75} />
    </button>
  )
}

/** Shared empty state for hub tables / lists. */
export function ModuleEmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'platform-panel relative overflow-hidden rounded-xl border border-dashed border-line bg-bg-2/65 px-6 py-12 text-center',
        className
      )}
    >
      <span aria-hidden="true" className="pointer-events-none absolute left-1/2 top-0 h-32 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/10 blur-3xl" />
      {icon && (
        <span className="relative mx-auto grid h-12 w-12 place-items-center rounded-xl border border-accent/15 bg-accent/10 text-accent shadow-sm">
          {icon}
        </span>
      )}
      <p className={cn('text-sm font-semibold text-text', Boolean(icon) && 'mt-3')}>{title}</p>
      {description && (
        <p className="mx-auto mt-1.5 max-w-sm text-xs leading-relaxed text-text-muted">{description}</p>
      )}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  )
}
