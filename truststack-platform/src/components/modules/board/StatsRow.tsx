import Link from 'next/link'
import { CheckSquare, MessageCircle, AlertTriangle, CalendarClock } from 'lucide-react'
import type { OverviewStats } from '@/types/dpdp'

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  sub?: string
  tone: 'blue' | 'amber' | 'orange' | 'green'
  href?: string
}

const TONE: Record<StatCardProps['tone'], { bg: string; icon: string; value: string }> = {
  blue: { bg: 'bg-blue-50', icon: 'text-blue-500', value: 'text-blue-700' },
  amber: { bg: 'bg-amber-50', icon: 'text-amber-500', value: 'text-amber-700' },
  orange: { bg: 'bg-orange-50', icon: 'text-orange-500', value: 'text-orange-700' },
  green: { bg: 'bg-green-50', icon: 'text-green-500', value: 'text-green-700' },
}

function StatCard({ icon, label, value, sub, tone, href }: StatCardProps) {
  const c = TONE[tone]
  const body = (
    <div className={`${c.bg} rounded-xl p-4 h-full ${href ? 'hover:brightness-[0.98] transition' : ''}`}>
      <div className={`${c.icon} mb-2`}>{icon}</div>
      <p className={`text-2xl font-bold ${c.value}`}>{value}</p>
      <p className="text-xs text-gray-600 mt-0.5">{label}</p>
      {sub && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
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
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        icon={<CheckSquare size={18} />}
        label="Consent Records"
        value={stats.consent_records_this_month.toLocaleString('en-IN')}
        sub="this month"
        tone="blue"
        href="/dashboard/consent/audit"
      />
      <StatCard
        icon={<MessageCircle size={18} />}
        label="Open Complaints"
        value={stats.open_complaints}
        tone={stats.open_complaints > 0 ? 'amber' : 'green'}
        href="/dashboard/grievance/complaints"
      />
      <StatCard
        icon={<AlertTriangle size={18} />}
        label="Unresolved Gaps"
        value={stats.unresolved_gaps}
        sub={stats.critical_gaps > 0 ? `P0: ${stats.critical_gaps}` : 'no critical gaps'}
        tone={stats.critical_gaps > 0 ? 'orange' : 'green'}
      />
      <StatCard
        icon={<CalendarClock size={18} />}
        label="Days to Notice Renewal"
        value={stats.days_until_notice_renewal != null ? stats.days_until_notice_renewal : '—'}
        sub={stats.days_until_notice_renewal == null ? 'no notice published' : undefined}
        tone={
          stats.days_until_notice_renewal != null && stats.days_until_notice_renewal <= 30 ? 'amber' : 'green'
        }
        href="/dashboard/privacy-notice"
      />
    </div>
  )
}
