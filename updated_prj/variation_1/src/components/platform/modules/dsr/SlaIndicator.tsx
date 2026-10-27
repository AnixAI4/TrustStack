'use client'

import { Clock, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react'
import { daysRemaining, isClosed, isOverdue } from '@/lib/platform/dsr/sla'
import type { DsrStatus } from '@/types/dpdp'

interface Props {
  dueDate: string | null
  status: DsrStatus
}

export function SlaIndicator({ dueDate, status }: Props) {
  if (isClosed(status)) {
    const Icon = status === 'fulfilled' ? CheckCircle2 : XCircle
    const label = status === 'fulfilled' ? 'Fulfilled' : 'Denied'
    const color = status === 'fulfilled' ? 'text-green' : 'text-text-muted'
    return (
      <span className={`inline-flex items-center gap-1 text-xs font-medium ${color}`}>
        <Icon size={13} /> {label}
      </span>
    )
  }

  const overdue = isOverdue({ status, due_date: dueDate })
  const days = daysRemaining(dueDate)

  if (days === null) {
    return <span className="text-xs text-text-faint">No due date</span>
  }

  if (overdue) {
    return (
      <span className="inline-flex items-center gap-1 rounded-pill bg-red/10 px-2 py-0.5 text-xs font-medium text-red">
        <AlertTriangle size={12} /> {Math.abs(days)}d overdue
      </span>
    )
  }

  const urgent = days <= 3
  const tone = urgent
    ? 'bg-amber/10 text-amber'
    : 'bg-green/10 text-green'

  return (
    <span className={`inline-flex items-center gap-1 rounded-pill px-2 py-0.5 text-xs font-medium ${tone}`}>
      <Clock size={12} /> {days}d left
    </span>
  )
}
