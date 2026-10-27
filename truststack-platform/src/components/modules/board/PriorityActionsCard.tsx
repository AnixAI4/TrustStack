import Link from 'next/link'
import { ShieldCheck, ArrowRight } from 'lucide-react'
import type { TopAction, TopActionPriority } from '@/types/dpdp'

const PRIORITY_STYLE: Record<TopActionPriority, { dot: string; badge: string; label: string }> = {
  p0: { dot: 'bg-red-500', badge: 'bg-red-50 text-red-700', label: 'P0' },
  p1: { dot: 'bg-amber-500', badge: 'bg-amber-50 text-amber-700', label: 'P1' },
  p2: { dot: 'bg-blue-500', badge: 'bg-blue-50 text-blue-700', label: 'P2' },
}

export default function PriorityActionsCard({ actions }: { actions: TopAction[] }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Top Priority Actions</p>

      {actions.length === 0 ? (
        <div className="flex items-center gap-3 py-6 text-center justify-center text-sm text-gray-500">
          <ShieldCheck className="w-5 h-5 text-green-600" />
          No outstanding priority actions — you&apos;re on track.
        </div>
      ) : (
        <ul className="space-y-2">
          {actions.map((a, i) => {
            const s = PRIORITY_STYLE[a.priority]
            return (
              <li key={i}>
                <Link
                  href={a.action_url}
                  className="group flex items-start gap-3 rounded-lg border border-gray-100 p-3 hover:border-[#003366]/20 hover:bg-gray-50 transition-colors"
                >
                  <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${s.dot}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${s.badge}`}>{s.label}</span>
                      <span className="text-sm font-medium text-gray-800 truncate">{a.title}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{a.description}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-[#003366] flex-shrink-0 mt-1 transition-colors" />
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
