'use client'

import { daysRemaining, isClosed, isOverdue } from '@/lib/dsr/sla'
import type { DsrStatus } from '@/types/dpdp'

interface Props {
  dueDate: string | null
  status: DsrStatus
  /** `pill` (default) for tables; `inline` for the detail header. */
  variant?: 'pill' | 'inline'
}

// 30-day DPDP SLA countdown. Green → amber → red as the due date approaches,
// red "Overdue" once past due, and a neutral "Closed" once fulfilled/denied.
export function SlaIndicator({ dueDate, status, variant = 'pill' }: Props) {
  if (isClosed(status)) {
    return <span className="text-xs text-gray-400">Closed</span>
  }
  if (!dueDate) {
    return <span className="text-xs text-gray-400">—</span>
  }

  const overdue = isOverdue({ status, due_date: dueDate })
  const days = daysRemaining(dueDate) ?? 0

  let text: string
  let tone: string
  if (overdue) {
    const over = Math.abs(days)
    text = `Overdue by ${over} day${over !== 1 ? 's' : ''}`
    tone = 'bg-red-50 text-red-700'
  } else if (days <= 5) {
    text = `${days} day${days !== 1 ? 's' : ''} left`
    tone = 'bg-red-50 text-red-700'
  } else if (days <= 10) {
    text = `${days} days left`
    tone = 'bg-amber-50 text-amber-700'
  } else {
    text = `${days} days left`
    tone = 'bg-green-50 text-green-700'
  }

  if (variant === 'inline') {
    return (
      <span className={`text-sm font-medium px-3 py-1.5 rounded-full ${tone}`}>
        {text}
      </span>
    )
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${tone}`}>
      {text}
    </span>
  )
}
