import { MessageCircle, CheckSquare, Compass, FileText, UserCheck, Activity } from 'lucide-react'
import type { ActivityType, RecentActivityItem } from '@/types/dpdp'

const ICON: Record<ActivityType, { icon: React.ElementType; color: string; bg: string }> = {
  complaint: { icon: MessageCircle, color: 'text-amber', bg: 'bg-amber/10' },
  consent_activated: { icon: CheckSquare, color: 'text-blue', bg: 'bg-blue/10' },
  assessment: { icon: Compass, color: 'text-accent', bg: 'bg-accent/15' },
  notice_published: { icon: FileText, color: 'text-green', bg: 'bg-green/10' },
  officer_appointed: { icon: UserCheck, color: 'text-brand', bg: 'bg-brand/10' },
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  return `${Math.floor(months / 12)}y ago`
}

export default function RecentActivityFeed({ items }: { items: RecentActivityItem[] }) {
  return (
    <section className="h-full overflow-hidden rounded-xl border border-line bg-bg-2 shadow-card" aria-labelledby="recent-activity-title">
      <div className="border-b border-line px-5 py-4">
        <p className="font-mono text-label font-semibold uppercase tracking-[var(--tracking-label)] text-text-faint">Timeline</p>
        <h2 id="recent-activity-title" className="mt-1 font-display text-lg font-semibold text-text">Recent activity</h2>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 px-5 py-12 text-center">
          <Activity className="h-5 w-5 text-text-faint" />
          <p className="text-sm font-medium text-text">No activity yet</p>
          <p className="max-w-xs text-xs text-text-muted">Completed modules and key events will appear here.</p>
        </div>
      ) : (
        <ul className="space-y-3 p-5">
          {items.map((item, i) => {
            const cfg = ICON[item.type]
            const Icon = cfg.icon
            return (
              <li key={i} className="flex items-start gap-3">
                <span className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg ${cfg.bg}`}>
                  <Icon className={`h-3.5 w-3.5 ${cfg.color}`} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-snug text-text">{item.description}</p>
                  <p className="mt-0.5 font-mono text-label uppercase tracking-[var(--tracking-label)] text-text-faint">{relativeTime(item.timestamp)}</p>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
