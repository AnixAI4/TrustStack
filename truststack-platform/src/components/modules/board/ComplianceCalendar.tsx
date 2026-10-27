import { CalendarClock, AlertCircle } from 'lucide-react'

interface CalendarItem {
  when: string
  inDays: number
  label: string
  urgent?: boolean
}

interface Props {
  daysUntilNoticeRenewal: number | null
  lastAssessmentDate: string | null
  openComplaints: number
}

const DAY_MS = 86_400_000
const RE_ASSESS_DAYS = 90

function whenLabel(days: number): string {
  if (days <= 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  if (days < 30) return `+${days}d`
  if (days < 365) return `+${Math.round(days / 30)}mo`
  return `+${Math.round(days / 365)}y`
}

function buildItems({ daysUntilNoticeRenewal, lastAssessmentDate, openComplaints }: Props): CalendarItem[] {
  const items: CalendarItem[] = []

  if (openComplaints > 0) {
    items.push({
      when: 'Today',
      inDays: 0,
      label: `${openComplaints} open complaint${openComplaints > 1 ? 's' : ''} to review (30-day SLA)`,
      urgent: true,
    })
  }

  if (daysUntilNoticeRenewal != null) {
    items.push({
      when: whenLabel(daysUntilNoticeRenewal),
      inDays: daysUntilNoticeRenewal,
      label: 'Privacy notice annual renewal',
      urgent: daysUntilNoticeRenewal <= 30,
    })
  }

  if (lastAssessmentDate) {
    const next = new Date(lastAssessmentDate).getTime() + RE_ASSESS_DAYS * DAY_MS
    const inDays = Math.ceil((next - Date.now()) / DAY_MS)
    items.push({
      when: whenLabel(inDays),
      inDays,
      label: 'Recommended quarterly re-assessment',
      urgent: inDays <= 0,
    })
  } else {
    items.push({ when: 'Today', inDays: 0, label: 'Run your first Compass Assessment', urgent: true })
  }

  return items.sort((a, b) => a.inDays - b.inDays)
}

export default function ComplianceCalendar(props: Props) {
  const items = buildItems(props)

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 h-full">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Compliance Calendar</p>
      <ul className="space-y-3">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-3">
            <span
              className={`text-[11px] font-semibold w-14 flex-shrink-0 mt-0.5 ${
                item.urgent ? 'text-red-600' : 'text-[#2874A6]'
              }`}
            >
              {item.when}
            </span>
            <div className="flex items-start gap-1.5 min-w-0">
              {item.urgent ? (
                <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
              ) : (
                <CalendarClock className="w-3.5 h-3.5 text-gray-300 flex-shrink-0 mt-0.5" />
              )}
              <span className="text-sm text-gray-700 leading-snug">{item.label}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
