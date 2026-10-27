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
    <section className="h-full overflow-hidden rounded-xl border border-line bg-bg-2 shadow-card" aria-labelledby="compliance-calendar-title">
      <div className="border-b border-line px-5 py-4">
        <p className="font-mono text-label font-semibold uppercase tracking-[var(--tracking-label)] text-text-faint">Deadlines</p>
        <h2 id="compliance-calendar-title" className="mt-1 font-display text-lg font-semibold text-text">Compliance calendar</h2>
      </div>
      <ul className="space-y-3 p-5">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-3">
            <span
              className={`mt-0.5 w-14 flex-shrink-0 font-mono text-label font-semibold uppercase tracking-[var(--tracking-label)] ${
                item.urgent ? 'text-red' : 'text-brand'
              }`}
            >
              {item.when}
            </span>
            <div className="flex min-w-0 items-start gap-1.5">
              {item.urgent ? (
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-red" />
              ) : (
                <CalendarClock className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-text-faint" />
              )}
              <span className="text-sm leading-snug text-text">{item.label}</span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
