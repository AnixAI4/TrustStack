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
      href: '/dashboard/assessment',
      state: m1.status === 'complete' ? 'done' : m1.status === 'in_progress' ? 'partial' : 'todo',
      detail:
        m1.status === 'complete'
          ? `Completed — Score: ${m1.last_score ?? '—'}`
          : m1.status === 'in_progress'
            ? 'In progress'
            : 'Not started',
    },
    {
      code: 'M2',
      name: 'Consent Management',
      href: '/dashboard/consent',
      state: m2.status === 'active' ? 'done' : m2.status === 'configured' ? 'partial' : 'todo',
      detail:
        m2.status === 'not_configured'
          ? 'Not configured'
          : `Active — ${m2.records_this_month ?? 0} records`,
    },
    {
      code: 'M3',
      name: 'Privacy Notice',
      href: '/dashboard/privacy-notice',
      state: m3.status === 'published' ? 'done' : m3.status === 'draft' ? 'partial' : 'todo',
      detail:
        m3.status === 'published'
          ? `Published${m3.version ? ` — v${m3.version}` : ''}`
          : m3.status === 'draft'
            ? 'Draft'
            : 'Not created',
    },
    {
      code: 'M4',
      name: 'Grievance Officer',
      href: '/dashboard/grievance',
      state: m4.status === 'officer_set' ? 'done' : 'todo',
      detail:
        m4.status === 'officer_set'
          ? `Officer: ${m4.officer_name ?? 'appointed'}${m4.open_complaints ? ` · ${m4.open_complaints} open` : ''}`
          : 'No officer appointed',
    },
    { code: 'M5', name: 'DSR Management', state: 'soon', detail: 'Coming Soon' },
    { code: 'M6', name: 'ROPA Builder', state: 'soon', detail: 'Coming Soon' },
    { code: 'M7', name: 'Vendor DPA', state: 'soon', detail: 'Coming Soon' },
    { code: 'M8', name: 'Breach Response', state: 'soon', detail: 'Coming Soon' },
  ]
}

function StateIcon({ state }: { state: RowState }) {
  if (state === 'done') return <CheckCircle2 className="w-4 h-4 text-green-600" />
  if (state === 'partial') return <Clock className="w-4 h-4 text-amber-500" />
  if (state === 'todo') return <Circle className="w-4 h-4 text-gray-300" />
  return <Lock className="w-4 h-4 text-gray-300" />
}

const DETAIL_COLOR: Record<RowState, string> = {
  done: 'text-green-700',
  partial: 'text-amber-600',
  todo: 'text-gray-400',
  soon: 'text-gray-300',
}

export default function ModuleStatusGrid({ moduleStatus }: { moduleStatus: OverviewModuleStatus }) {
  const rows = buildRows(moduleStatus)

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 h-full">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Module Status</p>
      <div className="divide-y divide-gray-50">
        {rows.map(row => {
          const inner = (
            <div className="flex items-center gap-3 py-2.5">
              <StateIcon state={row.state} />
              <span className="text-xs font-mono text-gray-400 w-7 flex-shrink-0">{row.code}</span>
              <span className="text-sm font-medium text-gray-800 flex-1 min-w-0 truncate">{row.name}</span>
              <span className={`text-xs ${DETAIL_COLOR[row.state]} flex-shrink-0`}>{row.detail}</span>
              {row.href && <ChevronRight className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />}
            </div>
          )
          return row.href ? (
            <Link key={row.code} href={row.href} className="block rounded-lg hover:bg-gray-50 -mx-2 px-2 transition-colors">
              {inner}
            </Link>
          ) : (
            <div key={row.code} className="-mx-2 px-2 opacity-70">
              {inner}
            </div>
          )
        })}
      </div>
    </div>
  )
}
