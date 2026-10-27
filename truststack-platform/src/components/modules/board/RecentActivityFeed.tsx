import { MessageCircle, CheckSquare, Compass, FileText, UserCheck, Activity } from 'lucide-react'
import type { ActivityType, RecentActivityItem } from '@/types/dpdp'

const ICON: Record<ActivityType, { icon: React.ElementType; color: string; bg: string }> = {
  complaint: { icon: MessageCircle, color: 'text-amber-600', bg: 'bg-amber-50' },
  consent_activated: { icon: CheckSquare, color: 'text-blue-600', bg: 'bg-blue-50' },
  assessment: { icon: Compass, color: 'text-[#003366]', bg: 'bg-[#D6E4F0]' },
  notice_published: { icon: FileText, color: 'text-green-600', bg: 'bg-green-50' },
  officer_appointed: { icon: UserCheck, color: 'text-purple-600', bg: 'bg-purple-50' },
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
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 h-full">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Recent Activity</p>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center text-sm text-gray-400">
          <Activity className="w-5 h-5 mb-2 text-gray-300" />
          No activity yet. Completed modules will appear here.
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((item, i) => {
            const cfg = ICON[item.type]
            const Icon = cfg.icon
            return (
              <li key={i} className="flex items-start gap-3">
                <span className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                  <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-700 leading-snug">{item.description}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{relativeTime(item.timestamp)}</p>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
