import Link from 'next/link'
import { ShieldCheck, ArrowUpRight } from 'lucide-react'
import type { TopAction, TopActionPriority } from '@/types/dpdp'
import { BoardPanel, BoardPanelHeader } from './BoardPanel'

const PRIORITY_STYLE: Record<TopActionPriority, { badge: string; label: string }> = {
  p0: { badge: 'bg-red/10 text-red', label: 'Critical' },
  p1: { badge: 'bg-amber/10 text-amber', label: 'High' },
  p2: { badge: 'bg-blue/10 text-blue', label: 'Planned' },
}

export default function PriorityActionsCard({ actions }: { actions: TopAction[] }) {
  const criticalCount = actions.filter(action => action.priority === 'p0').length

  return (
    <BoardPanel labelledBy="priority-work-title">
      <BoardPanelHeader
        eyebrow="Action queue"
        title="Priority work"
        description="Resolve these items to improve your compliance posture."
        titleId="priority-work-title"
        action={
          actions.length > 0 ? (
            <div className="shrink-0 text-right">
              <p className="font-display text-xl font-semibold leading-none text-text">{actions.length}</p>
              <p className="mt-1 font-mono text-label uppercase tracking-[var(--tracking-label)] text-text-faint">
                {criticalCount > 0 ? `${criticalCount} critical` : 'open items'}
              </p>
            </div>
          ) : undefined
        }
      />

      {actions.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 px-5 py-12 text-center">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-green/10 text-green">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <p className="text-sm font-medium text-text">You&apos;re on track</p>
          <p className="max-w-xs text-xs text-text-muted">No outstanding priority actions right now.</p>
        </div>
      ) : (
        <ul className="divide-y divide-line">
          {actions.map((a, i) => {
            const s = PRIORITY_STYLE[a.priority]
            return (
              <li key={`${a.priority}-${a.title}-${i}`}>
                <Link
                  href={a.action_url}
                  className="group grid gap-2 px-5 py-3.5 transition-colors duration-200 ease-[var(--ease)] hover:bg-glass sm:grid-cols-[5.25rem_minmax(0,1fr)_auto] sm:items-start sm:gap-3"
                >
                  <span className={`w-fit rounded-pill px-2 py-1 font-mono text-label font-bold uppercase tracking-[var(--tracking-label)] ${s.badge}`}>
                    {s.label}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold leading-snug text-text transition-colors group-hover:text-accent">{a.title}</p>
                    <p className="mt-1 line-clamp-1 text-xs text-text-muted">{a.description}</p>
                  </div>
                  <ArrowUpRight className="hidden h-4 w-4 shrink-0 text-text-faint transition-colors group-hover:text-accent sm:block" />
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </BoardPanel>
  )
}
