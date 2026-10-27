// M8 Breach — 72-hour DPBI notification countdown. CLIENT-SAFE pure date math
// (the analog of src/lib/dsr/sla.ts + src/lib/vendors/status.ts), so the detail
// page can tick it client-side with a setInterval and the API routes can reuse
// the exact same helpers. The countdown is DERIVED at read time — there is no
// cron and nothing flips status automatically. dpbi_notification_due_at is
// stamped server-side on create (= discovered_at + 72h); these helpers re-derive
// the remaining time and urgency band from it.
import { DPBI_DEADLINE_HOURS } from '@/lib/constants'
import type { BreachIncident, BreachUrgency } from '@/types/dpdp'

const MS_PER_HOUR = 3_600_000
const MS_PER_MINUTE = 60_000

// Urgency thresholds (hours remaining). Aligned with the escalation schedule —
// 'warning' at the first 48h alert, 'critical' from the 12h alert onward.
const WARNING_THRESHOLD_HOURS = 48
const CRITICAL_THRESHOLD_HOURS = 12

// The 72-hour DPBI deadline, derived from when the org became aware.
export function dueAtFrom(discoveredAt: string | Date): string {
  const base = new Date(discoveredAt)
  return new Date(base.getTime() + DPBI_DEADLINE_HOURS * MS_PER_HOUR).toISOString()
}

// Whole hours remaining until the deadline (negative once overdue). null if no due date.
export function hoursRemaining(dueAt: string | null, now: Date = new Date()): number | null {
  if (!dueAt) return null
  return Math.floor((new Date(dueAt).getTime() - now.getTime()) / MS_PER_HOUR)
}

// Whole minutes remaining until the deadline (negative once overdue). Accurate to
// the minute for the ticking client-side timer. null if no due date.
export function minutesRemaining(dueAt: string | null, now: Date = new Date()): number | null {
  if (!dueAt) return null
  return Math.floor((new Date(dueAt).getTime() - now.getTime()) / MS_PER_MINUTE)
}

// Past the 72-hour deadline (exact timestamp compare, independent of status).
export function isOverdue(dueAt: string | null, now: Date = new Date()): boolean {
  if (!dueAt) return false
  return new Date(dueAt).getTime() < now.getTime()
}

// Urgency band for the countdown UI, derived purely from time remaining.
export function urgencyLevel(dueAt: string | null, now: Date = new Date()): BreachUrgency {
  const hrs = hoursRemaining(dueAt, now)
  if (hrs == null) return 'normal'
  if (hrs < 0) return 'overdue'
  if (hrs <= CRITICAL_THRESHOLD_HOURS) return 'critical'
  if (hrs <= WARNING_THRESHOLD_HOURS) return 'warning'
  return 'normal'
}

// Human-readable countdown string for the UI ("47h 12m remaining" / "Overdue by 3h 5m").
export function formatCountdown(dueAt: string | null, now: Date = new Date()): string {
  if (!dueAt) return '—'
  const totalMin = minutesRemaining(dueAt, now)
  if (totalMin == null) return '—'
  const overdue = totalMin < 0
  const abs = Math.abs(totalMin)
  const h = Math.floor(abs / 60)
  const m = abs % 60
  const body = h > 0 ? `${h}h ${m}m` : `${m}m`
  return overdue ? `Overdue by ${body}` : `${body} remaining`
}

// The DPBI clock is still running while the breach has not been notified. The
// statutory clock runs from awareness regardless of containment status — only
// recording the notification stops it.
export function needsDpbiNotification(
  b: Pick<BreachIncident, 'dpbi_notified'>,
): boolean {
  return !b.dpbi_notified
}
