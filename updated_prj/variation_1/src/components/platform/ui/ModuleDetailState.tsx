import Link from 'next/link'
import { ArrowLeft, FileQuestion } from 'lucide-react'
import { ModulePageSkeleton } from '@/components/platform/ui/ModulePageHeader'

export function ModuleDetailSkeleton({ label = 'record' }: { label?: string }) {
  return (
    <div className="mx-auto max-w-3xl" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading {label}</span>
      <ModulePageSkeleton cards={3} showHeader />
    </div>
  )
}

export function ModuleDetailNotFound({
  title,
  description,
  backHref,
  backLabel,
}: {
  title: string
  description: string
  backHref: string
  backLabel: string
}) {
  return (
    <section className="platform-panel mx-auto max-w-2xl overflow-hidden rounded-xl border border-line bg-bg-2 p-7 text-center shadow-card sm:p-10" aria-labelledby="detail-not-found-title">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-xl border border-accent/15 bg-accent/10 text-accent shadow-sm">
        <FileQuestion className="h-6 w-6" />
      </span>
      <p className="mt-6 font-mono text-label font-semibold uppercase tracking-[var(--tracking-label)] text-accent">Record unavailable</p>
      <h1 id="detail-not-found-title" className="mt-2 font-display text-2xl font-semibold text-text sm:text-3xl">{title}</h1>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-text-muted">{description}</p>
      <Link href={backHref} className="btn btn-ghost mt-6 inline-flex items-center gap-2">
        <ArrowLeft className="h-4 w-4" /> {backLabel}
      </Link>
    </section>
  )
}
