import Link from 'next/link'
import { CheckSquare, MessageCircle, AlertTriangle, CalendarClock, ArrowUpRight } from 'lucide-react'
import type { OverviewStats } from '@/types/dpdp'

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  sub?: string
  tone: 'blue' | 'amber' | 'orange' | 'green'
  href?: string
}

const TONE: Record<StatCardProps['tone'], { bg: string; icon: string }> = {
  blue: { bg: 'bg-blue/10', icon: 'text-blue' },
  amber: { bg: 'bg-amber/10', icon: 'text-amber' },
  orange: { bg: 'bg-accent/10', icon: 'text-accent' },
  green: { bg: 'bg-green/10', icon: 'text-green' },
}

function StatCard({ icon, label, value, sub, tone, href, index }: StatCardProps & { index: number }) {
  const c = TONE[tone]
  const divider = [
    'border-b border-line lg:border-b-0',
    'border-b border-l border-line lg:border-b-0',
    'lg:border-l lg:border-line',
    'border-l border-line',
  ][index]
  const body = (
    <div className={`group relative h-full min-h-24 p-4 sm:px-5 ${divider} ${href ? 'transition-colors duration-200 ease-[var(--ease)] hover:bg-glass' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <span className={`grid h-8 w-8 place-items-center rounded-lg ${c.bg} ${c.icon}`}>{icon}</span>
        {href && <ArrowUpRight className="h-3.5 w-3.5 text-text-faint transition-colors group-hover:text-accent" />}
      </div>
      <p className="mt-3 font-display text-2xl font-semibold leading-none text-text">{value}</p>
      <p className="mt-1 text-xs font-medium text-text-muted">{label}</p>
      {sub && <p className="mt-0.5 font-mono text-label uppercase tracking-[var(--tracking-label)] text-text-faint">{sub}</p>}
    </div>
  )
  return href ? (
    <Link href={href} className="block">
      {body}
    </Link>
  ) : (
    body
  )
}

export default function StatsRow({ stats }: { stats: OverviewStats }) {
  return (
    <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-line bg-bg-2 shadow-card lg:grid-cols-4">
      <StatCard
        index={0}
        icon={<CheckSquare size={18} />}
        label="Consent Records"
        value={stats.consent_records_this_month.toLocaleString('en-IN')}
        sub="this month"
        tone="blue"
        href="/trustdeck/consent/audit"
      />
      <StatCard
        index={1}
        icon={<MessageCircle size={18} />}
        label="Open Complaints"
        value={stats.open_complaints}
        tone={stats.open_complaints > 0 ? 'amber' : 'green'}
        href="/trustdeck/grievance/complaints"
      />
      <StatCard
        index={2}
        icon={<AlertTriangle size={18} />}
        label="Unresolved Gaps"
        value={stats.unresolved_gaps}
        sub={stats.critical_gaps > 0 ? `P0: ${stats.critical_gaps}` : 'no critical gaps'}
        tone={stats.critical_gaps > 0 ? 'orange' : 'green'}
      />
      <StatCard
        index={3}
        icon={<CalendarClock size={18} />}
        label="Days to Notice Renewal"
        value={stats.days_until_notice_renewal != null ? stats.days_until_notice_renewal : ' - '}
        sub={stats.days_until_notice_renewal == null ? 'no notice published' : undefined}
        tone={
          stats.days_until_notice_renewal != null && stats.days_until_notice_renewal <= 30 ? 'amber' : 'green'
        }
        href="/trustdeck/privacy-notice"
      />
    </div>
  )
}
