'use client'

// Board overview — M5–M8 operational coverage (P1.5 FIX3).
// Four tiles (DSR / ROPA / Vendors / Breach) that surface the live operational
// state the board cares about, each linking to its module. Red sub-text flags a
// statutory risk (overdue rights request, expired DPA, missed 72-hr DPBI deadline).

import Link from 'next/link'
import { ArrowRight, FileText, Database, Building2, ShieldAlert } from 'lucide-react'
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
}: {
  href: string
  icon: React.ReactNode
  label: string
  value: number
  unit: string
  sub: string
  alert: boolean
}) {
  return (
    <Link
      href={href}
      className="group bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:border-[#003366]/20 hover:bg-gray-50 transition-colors"
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-500">{icon}{label}</span>
        <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-[#003366] transition-colors" />
      </div>
      <div className="text-2xl font-bold text-[#003366]">
        {value}
        <span className="text-xs font-medium text-gray-400 ml-1">{unit}</span>
      </div>
      <div className={`text-xs mt-1 ${alert ? 'text-red-600 font-medium' : 'text-gray-500'}`}>{sub}</div>
    </Link>
  )
}

export default function ComplianceCoverage({ coverage }: { coverage: BoardComplianceCoverage }) {
  const { dsr, ropa, vendors, breach } = coverage
  const lastReview = fmtDate(ropa.last_review_date)

  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Compliance Coverage</p>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Tile
          href="/dashboard/dsr"
          icon={<FileText className="w-3.5 h-3.5" />}
          label="DSR Requests"
          value={dsr.pending}
          unit="pending"
          sub={dsr.overdue > 0 ? `⚠ ${dsr.overdue} overdue` : `${dsr.completed_last_30_days} done in 30d`}
          alert={dsr.overdue > 0}
        />
        <Tile
          href="/dashboard/ropa"
          icon={<Database className="w-3.5 h-3.5" />}
          label="ROPA Entries"
          value={ropa.active_entries}
          unit="active"
          sub={lastReview ? `Reviewed ${lastReview}` : 'Not yet reviewed'}
          alert={!lastReview}
        />
        <Tile
          href="/dashboard/vendors"
          icon={<Building2 className="w-3.5 h-3.5" />}
          label="Vendors"
          value={vendors.total}
          unit="tracked"
          sub={vendors.overdue_assessments > 0 ? `⚠ ${vendors.overdue_assessments} expired DPA` : 'All DPAs current'}
          alert={vendors.overdue_assessments > 0}
        />
        <Tile
          href="/dashboard/breach"
          icon={<ShieldAlert className="w-3.5 h-3.5" />}
          label="Breaches"
          value={breach.open_incidents}
          unit="open"
          sub={breach.past_dpbi_deadline > 0 ? `🔴 ${breach.past_dpbi_deadline} past 72-hr deadline` : 'None past deadline'}
          alert={breach.past_dpbi_deadline > 0}
        />
      </div>
    </div>
  )
}
