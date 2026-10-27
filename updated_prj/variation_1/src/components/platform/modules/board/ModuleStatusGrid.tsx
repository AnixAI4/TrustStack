import Link from 'next/link'
import { CheckCircle2, Clock, Circle, Lock, ChevronRight } from 'lucide-react'
import type { OverviewModuleStatus } from '@/types/dpdp'

type RowState = 'done' | 'partial' | 'todo' | 'soon'

interface Row {
  code: string
  name: string
  state: RowState
  detail: string
  href?: string
}

function buildRows(m: OverviewModuleStatus): Row[] {
  const m1 = m.m1_assessment
  const m2 = m.m2_consent
  const m3 = m.m3_notice
  const m4 = m.m4_grievance

  return [
    {
      code: 'M1',
      name: 'Compass Assessment',
      href: '/trustdeck/assessment',
      state: m1.status === 'complete' ? 'done' : m1.status === 'in_progress' ? 'partial' : 'todo',
      detail:
        m1.status === 'complete'
          ? `Completed - Score: ${m1.last_score ?? ' - '}`
          : m1.status === 'in_progress'
            ? 'In progress'
            : 'Not started',
    },
    {
      code: 'M2',
      name: 'Consent Management',
      href: '/trustdeck/consent',
      state: m2.status === 'active' ? 'done' : m2.status === 'configured' ? 'partial' : 'todo',
      detail:
        m2.status === 'not_configured'
          ? 'Not configured'
          : `Active - ${m2.records_this_month ?? 0} records`,
    },
    {
      code: 'M3',
      name: 'Privacy Notice',
      href: '/trustdeck/privacy-notice',
      state: m3.status === 'published' ? 'done' : m3.status === 'draft' ? 'partial' : 'todo',
      detail:
        m3.status === 'published'
          ? `Published${m3.version ? ` - v${m3.version}` : ''}`
          : m3.status === 'draft'
            ? 'Draft'
            : 'Not created',
    },
    {
      code: 'M4',
      name: 'Grievance Officer',
      href: '/trustdeck/grievance',
      state: m4.status === 'officer_set' ? 'done' : 'todo',
      detail:
        m4.status === 'officer_set'
          ? `Officer: ${m4.officer_name ?? 'appointed'}${m4.open_complaints ? ` · ${m4.open_complaints} open` : ''}`
          : 'No officer appointed',
    },
    { code: 'M5', name: 'DSR Management', href: '/trustdeck/dsr', state: 'todo', detail: 'Open module' },
    { code: 'M6', name: 'ROPA Builder', href: '/trustdeck/ropa', state: 'todo', detail: 'Open module' },
    { code: 'M7', name: 'Vendor DPA', href: '/trustdeck/vendors', state: 'todo', detail: 'Open module' },
    { code: 'M8', name: 'Breach Response', href: '/trustdeck/breach', state: 'todo', detail: 'Open module' },
  ]
}

function StateIcon({ state }: { state: RowState }) {
  if (state === 'done') return <CheckCircle2 className="h-4 w-4 text-green" />
  if (state === 'partial') return <Clock className="h-4 w-4 text-amber" />
  if (state === 'todo') return <Circle className="h-4 w-4 text-text-faint" />
  return <Lock className="h-4 w-4 text-text-faint" />
}

const DETAIL_COLOR: Record<RowState, string> = {
  done: 'text-green',
  partial: 'text-amber',
  todo: 'text-text-faint',
  soon: 'text-text-faint',
}

export default function ModuleStatusGrid({ moduleStatus }: { moduleStatus: OverviewModuleStatus }) {
  const rows = buildRows(moduleStatus)
  const completed = rows.filter(row => row.state === 'done').length

  return (
    <section className="overflow-hidden rounded-xl border border-line bg-bg-2 shadow-card" aria-labelledby="module-status-title">
      <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
        <div>
          <p className="font-mono text-label font-semibold uppercase tracking-[var(--tracking-label)] text-text-faint">Workspace setup</p>
          <h2 id="module-status-title" className="mt-1 font-display text-lg font-semibold text-text">Module status</h2>
        </div>
        <p className="text-xs font-medium text-text-muted"><span className="text-text">{completed}</span> / {rows.length} operational</p>
      </div>
      <div className="divide-y divide-line px-3">
        {rows.map(row => {
          const inner = (
            <div className="flex min-w-0 items-center gap-2 py-2.5 sm:gap-3">
              <StateIcon state={row.state} />
              <span className="w-7 flex-shrink-0 font-mono text-xs text-text-faint">{row.code}</span>
              <div className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-text">{row.name}</span>
                <span className={`mt-0.5 block truncate text-xs sm:hidden ${DETAIL_COLOR[row.state]}`}>
                  {row.detail}
                </span>
              </div>
              <span className={`hidden max-w-[40%] truncate text-xs sm:inline ${DETAIL_COLOR[row.state]}`}>
                {row.detail}
              </span>
              {row.href && <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-text-faint" />}
            </div>
          )
          return row.href ? (
            <Link key={row.code} href={row.href} className="-mx-3 block px-3 transition-colors duration-200 ease-[var(--ease)] hover:bg-glass">
              {inner}
            </Link>
          ) : (
            <div key={row.code} className="-mx-3 px-3 opacity-70">
              {inner}
            </div>
          )
        })}
      </div>
    </section>
  )
}
