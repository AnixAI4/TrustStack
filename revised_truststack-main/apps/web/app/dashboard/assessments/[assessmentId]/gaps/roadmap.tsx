"use client";

import {
  GAP_ACTION_STATUS_LABEL,
  GAP_OPENING_SEVERITIES,
  GAP_SEVERITY_LABEL,
  ROADMAP_WINDOW_LABEL,
  ROADMAP_WINDOWS,
  roadmapWindow,
  type RoadmapWindow,
} from "@truststack/core";
import { formatDueDate, SEVERITY_STYLE, type Gap, type GapAction } from "@/lib/client/gaps";

/** What the roadmap needs of a gap — an assessment gap, or a ROPA gap with its record as the context (Slice 7). */
export type RoadmapGap = Pick<Gap, "state" | "severity" | "actions" | "domainName">;

interface Item {
  gap: RoadmapGap;
  action: GapAction;
}

/**
 * The 30/60/90-day roadmap: every OPEN action placed by its stored due date,
 * relative to today, then grouped by owner.
 *
 * The due date itself is stored (D-055) — only which column it falls in today
 * is worked out here. Closed actions are done and leave the roadmap; a gap
 * that no longer applies is not remediation work and is not shown either.
 */
export function Roadmap({ gaps, today }: { gaps: RoadmapGap[]; today: string }) {
  const items: Item[] = gaps
    .filter((g) => g.state === "open")
    .flatMap((gap) => gap.actions.filter((a) => a.status !== "closed").map((action) => ({ gap, action })));

  const byWindow = new Map<RoadmapWindow, Item[]>(ROADMAP_WINDOWS.map((w) => [w, []]));
  for (const item of items) byWindow.get(roadmapWindow(item.action.dueDate, today))!.push(item);

  if (items.length === 0) {
    return (
      <p data-testid="roadmap-empty" className="text-sm text-slate-700">
        Nothing left on the roadmap: every action is closed.
      </p>
    );
  }

  return (
    <section data-testid="roadmap" className="space-y-3">
      <p className="text-xs text-slate-600">
        Open actions by due date, as of {formatDueDate(today)}. Critical gaps are due within 30 days of being found,
        High within 60 and Medium within 90; Low gaps wait for the next assessment cycle unless a date is set.
      </p>
      <div className="grid gap-3 lg:grid-cols-3">
        {ROADMAP_WINDOWS.map((bucket) => {
          const list = byWindow.get(bucket)!;
          // "Overdue" and "After 90 days" only earn a column when something is in them.
          if (list.length === 0 && (bucket === "overdue" || bucket === "later")) return null;
          return <Column key={bucket} bucket={bucket} items={list} />;
        })}
      </div>
    </section>
  );
}

function Column({ bucket, items }: { bucket: RoadmapWindow; items: Item[] }) {
  const overdue = bucket === "overdue";
  // Grouped by the PERSON (their id), not their display name: two people can
  // share a name, and a former member may have none (Slice 8, pitfall 8).
  const byOwner = new Map<string | null, Item[]>();
  for (const item of items) {
    const owner = item.action.ownerUserId;
    byOwner.set(owner, [...(byOwner.get(owner) ?? []), item]);
  }
  const ownerName = (id: string | null, list: Item[]) =>
    id === null ? "Unassigned" : (list[0]?.action.ownerName ?? "A former member");
  const owners = [...byOwner.entries()]
    .map(([id, list]) => [id, ownerName(id, list), list] as const)
    .sort(([a, an], [b, bn]) => (a === null ? 1 : b === null ? -1 : an.localeCompare(bn) || a.localeCompare(b)));

  return (
    <div
      data-testid={`roadmap-${bucket}`}
      className={`rounded-xl border p-3 ${overdue ? "border-red-300 bg-red-50" : "border-slate-200"}`}
    >
      <div className="flex items-baseline justify-between gap-2">
        <h3 className={`text-sm font-semibold ${overdue ? "text-red-900" : ""}`}>{ROADMAP_WINDOW_LABEL[bucket]}</h3>
        <span data-testid={`roadmap-count-${bucket}`} className="text-xs text-slate-600">
          {items.length} action{items.length === 1 ? "" : "s"}
        </span>
      </div>

      <p className="mt-1 flex flex-wrap gap-1 text-xs">
        {GAP_OPENING_SEVERITIES.map((severity) => {
          const n = items.filter((i) => i.gap.severity === severity).length;
          if (n === 0) return null;
          return (
            <span
              key={severity}
              data-testid={`roadmap-${bucket}-${severity}`}
              className={`rounded-full px-2 py-0.5 ${SEVERITY_STYLE[severity] ?? ""}`}
            >
              {n} {GAP_SEVERITY_LABEL[severity]}
            </span>
          );
        })}
      </p>

      {items.length === 0 ? (
        <p className="mt-2 text-xs text-slate-500">Nothing due.</p>
      ) : (
        <div className="mt-2 space-y-3">
          {owners.map(([id, owner, list]) => (
            <div key={id ?? "unassigned"}>
              <p className="text-xs font-semibold text-slate-700">
                {owner} <span className="font-normal text-slate-500">· {list.length}</span>
              </p>
              <ul className="mt-1 space-y-1">
                {list.map(({ gap, action }) => (
                  <li key={action.id} data-testid={`roadmap-item-${action.id}`} className="rounded-md bg-white p-2 text-xs ring-1 ring-slate-200">
                    <p className="font-medium text-slate-900">{action.title}</p>
                    <p className="mt-0.5 text-slate-600">
                      {gap.domainName} · {GAP_SEVERITY_LABEL[gap.severity]} · {GAP_ACTION_STATUS_LABEL[action.status]} ·{" "}
                      <span className={overdue ? "font-semibold text-red-800" : undefined}>{formatDueDate(action.dueDate)}</span>
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
