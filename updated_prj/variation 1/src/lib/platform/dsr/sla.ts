// M5 DSR - 30-day SLA helpers. CLIENT-SAFE (pure date math, no node deps), so
// both the dashboard components and the API routes can share them.
import type { DsrRequest, DsrStatus } from '@/types/dpdp'

export const DSR_SLA_DAYS = 30
const MS_PER_DAY = 86_400_000

// Open statuses still count against the 30-day SLA clock. identity_pending is
// awaiting the data principal, but the statutory clock runs from receipt, so we
// keep it "open" for overdue accounting.
const OPEN_STATUSES: DsrStatus[] = ['received', 'identity_pending', 'processing', 'overdue']
const CLOSED_STATUSES: DsrStatus[] = ['fulfilled', 'denied']

export function dueDateFrom(createdAt: string | Date): string {
  const base = new Date(createdAt)
  return new Date(base.getTime() + DSR_SLA_DAYS * MS_PER_DAY).toISOString()
}

export function isOpen(status: DsrStatus): boolean {
  return OPEN_STATUSES.includes(status)
}

export function isClosed(status: DsrStatus): boolean {
  return CLOSED_STATUSES.includes(status)
}

// Whole days left until the due date (negative once overdue). null if no due date.
export function daysRemaining(dueDate: string | null, now: Date = new Date()): number | null {
  if (!dueDate) return null
  return Math.ceil((new Date(dueDate).getTime() - now.getTime()) / MS_PER_DAY)
}

// A request is overdue when it is still open and past its due date.
export function isOverdue(
  req: Pick<DsrRequest, 'status' | 'due_date'>,
  now: Date = new Date(),
): boolean {
  if (!req.due_date || !isOpen(req.status)) return false
  return new Date(req.due_date).getTime() < now.getTime()
}
