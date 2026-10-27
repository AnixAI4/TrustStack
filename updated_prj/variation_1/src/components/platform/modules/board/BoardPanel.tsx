import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/** Shared TrustDeck panel chrome - mirrors TrustStack `.card` language. */
export function BoardPanel({
  children,
  className,
  as: Tag = 'section',
  labelledBy,
  padded = false,
}: {
  children: ReactNode
  className?: string
  as?: 'section' | 'div' | 'aside'
  labelledBy?: string
  padded?: boolean
}) {
  return (
    <Tag
      className={cn(
        'overflow-hidden rounded-xl border border-line bg-bg-2 shadow-card',
        padded && 'p-5 sm:p-6',
        className
      )}
      aria-labelledby={labelledBy}
    >
      {children}
    </Tag>
  )
}

export function BoardPanelHeader({
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
    <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
      <div className="min-w-0">
        {eyebrow && (
          <p className="font-mono text-label font-semibold uppercase tracking-[var(--tracking-label)] text-accent">
            {eyebrow}
          </p>
        )}
        <h2
          id={titleId}
          className={cn('font-display text-lg font-semibold text-text', eyebrow ? 'mt-1' : undefined)}
        >
          {title}
        </h2>
        {description && (
          <p className="mt-0.5 text-xs text-text-muted">{description}</p>
        )}
      </div>
      {action}
    </div>
  )
}
