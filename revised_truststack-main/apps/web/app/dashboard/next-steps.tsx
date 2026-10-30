"use client";

import Link from "next/link";
import { isOverdue, isProgrammeRole, mostUrgentRegisterItem, ownOpenActions } from "@truststack/core";
import type { DashboardPayload } from "@/lib/client/dashboard";
import { formatDay } from "@/lib/client/dashboard";
import { formatDueDate } from "@/lib/client/gaps";

/** How many of a person's own actions the overview lists; the rest are one click away on "My actions". */
const SHOWN = 5;

/**
 * "Your next steps" — the overview's first panel (Slice 10.5 B1, F1.1, Q5).
 *
 * The signed-in person's own open actions, overdue first, each a link to its
 * register's page; and for the programme roles, the single register item that
 * most needs someone. Everything here is filtered in the browser from the
 * `GET …/dashboard` the overview already loads — every section in it was gated
 * by the API (a register the role may not read is null), so this changes what
 * a role sees FIRST, never what it may see. It reads; nothing on it writes.
 */
export function NextSteps({
  payload,
  user,
  roleCode,
  roleName,
}: {
  payload: DashboardPayload;
  user: { id: string; email: string };
  roleCode: string;
  roleName: string;
}) {
  const mine = payload.actions ? ownOpenActions(payload.actions.items, user.id) : null;
  const programme = isProgrammeRole(roleCode);

  return (
    <section data-testid="next-steps" className="space-y-4 rounded-xl border border-slate-200 bg-white p-6">
      <div>
        <h2 className="text-lg font-semibold">Your next steps</h2>
        <p className="text-xs text-slate-500">
          For <span data-testid="user-email">{user.email}</span> · <span data-testid="user-role">{roleName}</span>
        </p>
      </div>

      {programme && <UrgentItem payload={payload} />}

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-700">Your open actions</h3>
        {mine === null ? (
          <p className="text-sm text-slate-600">Actions are not available to your role.</p>
        ) : mine.length === 0 ? (
          <p data-testid="next-steps-none" className="text-sm text-slate-600">
            Nothing is assigned to you right now.
          </p>
        ) : (
          <>
            <ul data-testid="next-steps-actions" className="space-y-1">
              {mine.slice(0, SHOWN).map((a) => (
                <li key={a.id} data-testid={`next-step-${a.id}`} className="flex flex-wrap items-baseline gap-x-2 text-sm">
                  <Link href={a.href} className="font-medium text-indigo-800 hover:underline">
                    {a.title}
                  </Link>
                  <span className="text-xs text-slate-600">
                    {a.sourceLabel} · {a.context} ·{" "}
                    {isOverdue(a.status, a.dueDate, payload.today) ? (
                      <span className="font-semibold text-red-800">Overdue — {formatDueDate(a.dueDate)}</span>
                    ) : a.dueDate ? (
                      `Due ${formatDueDate(a.dueDate)}`
                    ) : (
                      formatDueDate(a.dueDate)
                    )}
                  </span>
                </li>
              ))}
            </ul>
            <Link href="/dashboard/actions#mine" data-testid="next-steps-all" className="text-sm text-indigo-700 hover:underline">
              {mine.length > SHOWN ? `All ${mine.length} of your actions →` : "Open My actions →"}
            </Link>
          </>
        )}
      </div>
    </section>
  );
}

/** The one register item that most needs someone now, or a plain "nothing" (programme roles only). */
function UrgentItem({ payload }: { payload: DashboardPayload }) {
  const { breaches, rights, retention } = payload;
  const urgent = mostUrgentRegisterItem({
    breachClocks: breaches?.clocks ?? null,
    rightsAttention: rights?.attention ?? null,
    retentionOverdue: retention?.overdue ?? null,
  });

  let body: React.ReactNode = <span className="text-slate-600">Nothing in the registers needs someone right now.</span>;
  if (urgent) {
    const breach = breaches?.clocks.find((c) => c.id === urgent.id);
    const request = rights?.attention.find((r) => r.id === urgent.id);
    const schedule = retention?.overdue.find((s) => s.id === urgent.id);
    if ((urgent.kind === "board_report_overdue" || urgent.kind === "board_report_due") && breach) {
      body = (
        <>
          <Link href={`/dashboard/breaches/${breach.id}`} className="font-medium text-indigo-800 hover:underline">
            {breach.incidentCode}
          </Link>{" "}
          — {breach.title}: the report to the Board is{" "}
          <span className={urgent.kind === "board_report_overdue" ? "font-semibold text-red-800" : "font-medium"}>
            {urgent.kind === "board_report_overdue" ? "overdue" : "due"} ({breach.clock.label})
          </span>
        </>
      );
    } else if ((urgent.kind === "rights_overdue" || urgent.kind === "rights_past_target") && request) {
      body = (
        <>
          <Link href={`/dashboard/rights/${request.id}`} className="font-medium text-indigo-800 hover:underline">
            {request.requestCode}
          </Link>{" "}
          — {request.kindLabel}:{" "}
          <span className={urgent.kind === "rights_overdue" ? "font-semibold text-red-800" : "font-medium"}>{request.clock.label}</span>
        </>
      );
    } else if (urgent.kind === "erasure_overdue" && schedule) {
      body = (
        <>
          <Link href={`/dashboard/retention/${schedule.id}`} className="font-medium text-indigo-800 hover:underline">
            {schedule.recordCode ?? "A retention schedule"}
          </Link>{" "}
          — <span className="font-semibold text-red-800">erasure overdue</span>
          {schedule.endsOn && <> since {formatDay(schedule.endsOn)}</>}
          {schedule.erasureIncomplete && <span className="text-red-800"> (erasure incomplete — processors not told)</span>}
        </>
      );
    }
  }

  return (
    <div data-testid="next-steps-urgent" className="space-y-1">
      <h3 className="text-sm font-semibold text-slate-700">Needs someone now</h3>
      <p className="text-sm">{body}</p>
    </div>
  );
}
