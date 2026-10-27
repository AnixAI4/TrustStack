'use client'

import Link from 'next/link'
import { ExternalLink, Mail, Pencil, Phone, User, UserPlus } from 'lucide-react'
import type { GrievanceOfficer } from '@/types/dpdp'

interface Props {
  officer: GrievanceOfficer | null
  orgSlug: string
  onEdit: () => void
}

export function GrievanceOfficerCard({ officer, orgSlug, onEdit }: Props) {
  if (!officer) {
    return (
      <div className="rounded-xl border border-line bg-bg-2 p-6 shadow-card">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-accent/15 text-accent">
              <UserPlus size={18} />
            </span>
            <div>
              <h2 className="font-semibold text-text">Appoint a Grievance Officer</h2>
              <p className="mt-1 max-w-xl text-sm leading-relaxed text-text-muted">
                Add the officer responsible for DPDP complaints. Their contact details will appear on your public grievance portal.
              </p>
            </div>
          </div>
          <button type="button" onClick={onEdit} className="btn btn-accent shrink-0 self-start px-4 py-2 text-sm sm:self-auto">
            Appoint officer
          </button>
        </div>
      </div>
    )
  }

  const publicHref = orgSlug ? `/trustdeck/public/grievance/${orgSlug}` : null

  return (
    <div className="rounded-xl border border-line bg-bg-2 p-5 shadow-card">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/15 text-accent">
          <User size={18} />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-text">{officer.name}</p>
          {officer.designation && <p className="text-xs text-text-muted">{officer.designation}</p>}
        </div>
        <span className="ml-auto rounded-full bg-green/10 px-2 py-0.5 text-xs font-medium text-green">Active</span>
      </div>
      <div className="space-y-2 text-sm text-text-muted">
        <div className="flex items-center gap-2">
          <Mail size={14} className="text-text-faint" />
          <a href={`mailto:${officer.email}`} className="hover:text-accent">{officer.email}</a>
        </div>
        {officer.phone && (
          <div className="flex items-center gap-2">
            <Phone size={14} className="text-text-faint" />
            <a href={`tel:${officer.phone}`} className="hover:text-accent">{officer.phone}</a>
          </div>
        )}
      </div>
      <div className="mt-5 flex flex-wrap gap-3 border-t border-line pt-4">
        <button type="button" onClick={onEdit} className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline">
          <Pencil size={14} /> Edit officer
        </button>
        {publicHref && (
          <Link href={publicHref} target="_blank" className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-accent">
            <ExternalLink size={14} /> View public portal
          </Link>
        )}
      </div>
    </div>
  )
}
