'use client'

// Board overview - M5-M8 operational coverage (P1.5 FIX3).
// Four tiles (DSR / ROPA / Vendors / Breach) that surface the live operational
// state the board cares about, each linking to its module. Red sub-text flags a
// statutory risk (overdue rights request, expired DPA, missed 72-hr DPBI deadline).

import Link from 'next/link'
import { ArrowUpRight, FileText, Database, Building2, ShieldAlert } from 'lucide-react'
import type { BoardComplianceCoverage } from '@/types/dpdp'

function fmtDate(iso: string | null): string | null {
  return iso ? new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : null
}

function Tile({
  href,
  icon,
  label,
  value,
  unit,
  sub,
  alert,
  index,
}: {
  href: string
  icon: React.ReactNode
  label: string
  value: number
  unit: string
  sub: string
  alert: boolean
  index: number
}) {
  const divider = [
    'border-b border-line lg:border-b-0',
    'border-b border-l border-line lg:border-b-0',
    'lg:border-l lg:border-line',
    'border-l border-line',
  ][index]

  return (
    <Link
      href={href}
      className={`group min-w-0 p-4 transition-colors duration-200 ease-[var(--ease)] hover:bg-glass sm:p-5 ${divider}`}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-xs font-semibold text-text-muted">{icon}{label}</span>
        <ArrowUpRight className="h-3.5 w-3.5 text-text-faint transition-colors group-hover:text-accent" />
      </div>
      <div className="font-display text-2xl font-semibold text-text">
        {value}
        <span className="ml-1 text-xs font-medium text-text-faint">{unit}</span>
      </div>
      <div className={`mt-1 text-xs ${alert ? 'font-medium text-red' : 'text-text-muted'}`}>{sub}</div>
    </Link>
  )
}

export default function ComplianceCoverage({ coverage }: { coverage: BoardComplianceCoverage }) {
  const { dsr, ropa, vendors, breach } = coverage
  const lastReview = fmtDate(ropa.last_review_date)

  return (
    <section aria-labelledby="coverage-title">
      <div className="mb-3 flex items-end justify-between gap-4">
        <div>
          <p className="font-mono text-label font-semibold uppercase tracking-[var(--tracking-label)] text-text-faint">Operations</p>
          <h2 id="coverage-title" className="mt-1 font-display text-lg font-semibold text-text">Compliance coverage</h2>
        </div>
        <p className="hidden text-xs text-text-faint sm:block">Live module data</p>
      </div>
      <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-line bg-bg-2 shadow-card lg:grid-cols-4">
        <Tile
          index={0}
          href="/trustdeck/dsr"
          icon={<FileText className="w-3.5 h-3.5" />}
          label="DSR Requests"
          value={dsr.pending}
          unit="pending"
          sub={dsr.overdue > 0 ? `${dsr.overdue} overdue` : `${dsr.completed_last_30_days} done in 30d`}
          alert={dsr.overdue > 0}
        />
        <Tile
          index={1}
          href="/trustdeck/ropa"
          icon={<Database className="w-3.5 h-3.5" />}
          label="ROPA Entries"
          value={ropa.active_entries}
          unit="active"
          sub={lastReview ? `Reviewed ${lastReview}` : 'Not yet reviewed'}
          alert={!lastReview}
        />
        <Tile
          index={2}
          href="/trustdeck/vendors"
          icon={<Building2 className="w-3.5 h-3.5" />}
          label="Vendors"
          value={vendors.total}
          unit="tracked"
          sub={vendors.overdue_assessments > 0 ? `${vendors.overdue_assessments} expired DPA` : 'All DPAs current'}
          alert={vendors.overdue_assessments > 0}
        />
        <Tile
          index={3}
          href="/trustdeck/breach"
          icon={<ShieldAlert className="w-3.5 h-3.5" />}
          label="Breaches"
          value={breach.open_incidents}
          unit="open"
          sub={breach.past_dpbi_deadline > 0 ? `${breach.past_dpbi_deadline} past 72-hour deadline` : 'None past deadline'}
          alert={breach.past_dpbi_deadline > 0}
        />
      </div>
    </section>
  )
}
