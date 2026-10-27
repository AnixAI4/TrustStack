import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/** TrustDeck page header — matches Assessment / Overview display language. */
export function ModulePageHeader({
  eyebrow,
  title,
  description,
  action,
  className,
  titleAs: TitleTag = 'h1',
}: {
  eyebrow?: string
  title: string
  description?: ReactNode
  action?: ReactNode
  className?: string
  titleAs?: 'h1' | 'h2'
}) {
  return (
    <header
      className={cn(
        'relative flex flex-col gap-4 border-b border-line/75 pb-5 sm:flex-row sm:items-end sm:justify-between sm:pb-6',
        className
      )}
    >
      <div className="min-w-0">
        {eyebrow && (
          <p className="flex items-center gap-2 font-mono text-label font-semibold uppercase tracking-[var(--tracking-label)] text-accent before:h-px before:w-5 before:bg-accent/65">
            {eyebrow}
          </p>
        )}
        <TitleTag
          className={cn(
            'font-display text-3xl font-semibold leading-none text-text sm:text-[2.1rem]',
            eyebrow ? 'mt-2' : undefined
          )}
        >
          {title}
        </TitleTag>
        {description && (
          <div className="mt-1.5 text-sm text-text-muted">{description}</div>
        )}
      </div>
      {action && <div className="flex shrink-0 flex-wrap items-center gap-2 self-start sm:self-auto">{action}</div>}
    </header>
  )
}

/** Soft panel shell used for module cards / forms / tables. */
export function ModulePanel({
  children,
  className,
  as: Tag = 'section',
  padded = false,
}: {
  children: ReactNode
  className?: string
  as?: 'section' | 'div' | 'aside'
  padded?: boolean
}) {
  return (
    <Tag
      className={cn(
        'platform-panel overflow-hidden rounded-xl border border-line bg-bg-2 shadow-card',
        padded && 'p-5 sm:p-6',
        className
      )}
    >
      {children}
    </Tag>
  )
}

export function ModulePanelHeader({
  eyebrow,
  title,
  description,
  action,
  titleId,
}: {
  eyebrow?: string
  title: string
  description?: string
  action?: ReactNode
  titleId?: string
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line bg-surface-2/20 px-5 py-4">
      <div className="min-w-0">
        {eyebrow && (
          <p className="font-mono text-label font-semibold uppercase tracking-[var(--tracking-label)] text-text-faint">
            {eyebrow}
          </p>
        )}
        <h2
          id={titleId}
          className={cn('font-display text-lg font-semibold text-text', eyebrow ? 'mt-1' : undefined)}
        >
          {title}
        </h2>
        {description && <p className="mt-0.5 text-xs text-text-muted">{description}</p>}
      </div>
      {action}
    </div>
  )
}

/** Tokenized loading placeholders that match final card geometry. */
export function ModulePageSkeleton({
  cards = 3,
  showHeader = true,
  className,
}: {
  cards?: number
  showHeader?: boolean
  className?: string
}) {
  return (
    <div
      className={cn('mx-auto max-w-6xl space-y-5', className)}
      aria-busy="true"
      aria-live="polite"
    >
      {showHeader && (
        <div className="space-y-2.5">
          <div className="module-shimmer h-3 w-28 rounded bg-surface-2/50" />
          <div className="module-shimmer h-9 w-56 rounded-lg bg-surface-2/50" />
          <div className="module-shimmer h-4 w-72 max-w-full rounded bg-surface-2/40" />
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: Math.min(cards, 4) }).map((_, i) => (
          <div
            key={i}
            className="platform-panel module-shimmer h-24 rounded-xl border border-line bg-bg-2 shadow-card"
            style={{ animationDelay: `${i * 70}ms` }}
          />
        ))}
      </div>
      {Array.from({ length: Math.max(0, cards - 4) }).map((_, i) => (
        <div
          key={`row-${i}`}
          className="platform-panel module-shimmer h-28 rounded-xl border border-line bg-bg-2 shadow-card"
          style={{ animationDelay: `${(i + 4) * 70}ms` }}
        />
      ))}
    </div>
  )
}
