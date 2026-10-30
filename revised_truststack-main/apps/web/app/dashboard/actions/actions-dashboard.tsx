"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ACTION_SOURCE_LABEL,
  GAP_ACTION_STATUS_LABEL,
  GAP_OPENING_SEVERITIES,
  GAP_SEVERITY_LABEL,
  groupActionsByOwner,
  isOverdue,
  isProgrammeRole,
  ownOpenActions,
  summariseActions,
  type ActionSource,
} from "@truststack/core";
import { ExplainButton } from "@/components/ai/assistant-panel";
import { DataTable, type Column } from "@/components/data/data-table";
import { Notice } from "@/components/feedback/notice";
import { Tabs } from "@/components/ui/tabs";
import { apiFetch } from "@/lib/client/api";
import type { DashboardActionItem, DashboardPayload } from "@/lib/client/dashboard";
import { formatDueDate, SEVERITY_STYLE } from "@/lib/client/gaps";
import { usePermissions } from "@/lib/client/permissions";
import { Roadmap, type RoadmapGap } from "../assessments/[assessmentId]/gaps/roadmap";

type SourceFilter = "all" | ActionSource;
type SeverityFilter = "all" | (typeof GAP_OPENING_SEVERITIES)[number];

const SOURCE_STYLE: Record<ActionSource, string> = {
  assessment: "bg-indigo-50 text-indigo-800 ring-indigo-200",
  ropa: "bg-teal-50 text-teal-800 ring-teal-200",
  breach: "bg-rose-50 text-rose-800 ring-rose-200",
  rights: "bg-sky-50 text-sky-800 ring-sky-200",
  retention: "bg-amber-50 text-amber-800 ring-amber-200",
};

/**
 * Everything the organisation owes, on one page (D-067's launch requirement):
 * the actions on assessment gaps, processing-register gaps, breaches, Data
 * Principals' requests and grievances, and overdue erasures in the retention
 * register, by owner and by due window, each
 * labelled by where it came from.
 *
 * The rows come from `GET …/dashboard`. Grouping and counting them is core's
 * (`groupActionsByOwner`, `summariseActions`) — the same rules the overview
 * used, so a filter here can never disagree with a tile there. The owner is a
 * PERSON; Unassigned is a real bucket. Editing stays where it always was, on
 * each register's own page: this page reads.
 *
 * Slice 10.5 B1 (F1.5): anyone who owns an open action gets "My actions",
 * first and selected — except the programme roles, who keep "By owner" first.
 */
export function ActionsDashboard() {
  const permissions = usePermissions();
  const [payload, setPayload] = useState<DashboardPayload | null>(null);
  const [userId, setUserId] = useState<string | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<SourceFilter>("all");
  const [severity, setSeverity] = useState<SeverityFilter>("all");
  const organizationId = permissions.kind === "ready" ? permissions.value.organizationId : null;

  useEffect(() => {
    if (!organizationId) return;
    let cancelled = false;
    apiFetch<DashboardPayload>(`/api/v1/organizations/${organizationId}/dashboard`).then((r) => {
      if (cancelled) return;
      if (r.success) setPayload(r.data);
      else setError(r.error.message);
    });
    // "My actions" needs to know who "my" is: the existing /auth/me read.
    apiFetch<{ user: { id: string } | null }>("/api/v1/auth/me").then((r) => {
      if (!cancelled) setUserId(r.success ? (r.data.user?.id ?? null) : null);
    });
    return () => {
      cancelled = true;
    };
  }, [organizationId]);

  const items = useMemo(
    () =>
      (payload?.actions?.items ?? []).filter(
        (i) => (source === "all" || i.source === source) && (severity === "all" || i.severity === severity),
      ),
    [payload, source, severity],
  );

  if (error) {
    return (
      <Notice tone="error" testId="actions-error">
        {error}
      </Notice>
    );
  }
  // Wait for both, so the first tab is chosen once — not switched under the reader's eyes.
  if (!payload || userId === undefined) return <p className="text-sm text-slate-500">Loading the actions…</p>;
  if (!payload.actions) {
    return <p data-testid="actions-unavailable" className="text-sm text-slate-600">Actions are not available to your role.</p>;
  }

  const today = payload.today;
  const summary = summariseActions(items, today);
  // The tab shows for anyone who owns an open action at all; its rows follow the filters.
  const ownsAny = userId !== null && ownOpenActions(payload.actions.items, userId).length > 0;
  const mine = userId !== null ? ownOpenActions(items, userId) : [];
  const programme = permissions.kind === "ready" && isProgrammeRole(permissions.value.role);
  const owners = groupActionsByOwner(items, today);
  // The roadmap takes gaps; each action becomes its own entry, labelled by source and context.
  const roadmapGaps: RoadmapGap[] = items.map((i) => ({
    state: i.gapState,
    severity: i.severity,
    domainName: `${i.sourceLabel} · ${i.context}`,
    actions: [i],
  }));

  const columns: Column<DashboardActionItem>[] = [
    {
      key: "action",
      header: "Action",
      sortValue: (i) => i.title,
      cell: (i) => (
        <>
          <Link href={i.href} className="font-medium text-indigo-800 hover:underline">
            {i.title}
          </Link>
          <p className="text-xs text-slate-600">
            <span className={`mr-1 rounded-full px-1.5 py-0.5 ring-1 ${SOURCE_STYLE[i.source]}`}>{i.sourceLabel}</span>
            {i.context}
          </p>
          {organizationId && <ExplainAction organizationId={organizationId} item={i} testPrefix="ai-explain-action" />}
        </>
      ),
    },
    { key: "owner", header: "Owner", className: "text-xs", sortValue: (i) => i.ownerName, cell: (i) => i.ownerName ?? "Unassigned" },
    {
      key: "severity",
      header: "Severity",
      sortValue: (i) => GAP_OPENING_SEVERITIES.indexOf(i.severity as (typeof GAP_OPENING_SEVERITIES)[number]),
      cell: (i) => <span className={`rounded px-1.5 py-0.5 text-xs ${SEVERITY_STYLE[i.severity] ?? ""}`}>{GAP_SEVERITY_LABEL[i.severity]}</span>,
    },
    { key: "status", header: "Status", className: "text-xs", sortValue: (i) => GAP_ACTION_STATUS_LABEL[i.status], cell: (i) => GAP_ACTION_STATUS_LABEL[i.status] },
    {
      key: "due",
      header: "Due",
      className: "text-xs whitespace-nowrap",
      sortValue: (i) => i.dueDate,
      cell: (i) => {
        const late = isOverdue(i.status, i.dueDate, today);
        return (
          <span className={late ? "font-semibold text-red-800" : undefined}>
            {late ? "Overdue — " : ""}
            {formatDueDate(i.dueDate)}
          </span>
        );
      },
    },
  ];

  const ownersTab = {
    id: "owners",
    label: "By owner",
    content: (
      <section className="space-y-3">
        <h3 className="sr-only">By owner</h3>
        {owners.length === 0 ? (
          <p data-testid="owners-empty" className="text-sm text-slate-600">
            {payload.actions.items.length === 0
              ? "No actions yet. Actions appear when a gap register is generated."
              : "Nothing open for this filter."}
          </p>
        ) : (
          <div data-testid="owner-groups" className="space-y-3">
            {owners.map((group) => (
              <OwnerGroup key={group.ownerUserId ?? "unassigned"} group={group} today={today} organizationId={organizationId} />
            ))}
          </div>
        )}
      </section>
    ),
  };
  const mineTab = {
    id: "mine",
    label: "My actions",
    badge: mine.length,
    hidden: !ownsAny,
    content: (
      <DataTable
        testId="actions-mine"
        rows={mine}
        rowKey={(i) => i.id}
        rowTestId={(i) => `actions-mine-row-${i.id}`}
        noun="actions"
        empty={<p className="text-sm text-slate-600">None of your actions match this filter.</p>}
        columns={columns.filter((c) => c.key !== "owner")}
      />
    ),
  };
  const allTab = {
    id: "all",
    label: "All actions",
    badge: items.length,
    content: (
      <DataTable
        testId="actions-table"
        rows={items}
        rowKey={(i) => i.id}
        rowTestId={(i) => `actions-row-${i.id}`}
        noun="actions"
        empty={<p className="text-sm text-slate-600">No actions for this filter.</p>}
        search={{ label: "Search actions", placeholder: "Search by action, owner or context", text: (i) => `${i.title} ${i.ownerName ?? "Unassigned"} ${i.context} ${i.sourceLabel}` }}
        columns={columns}
      />
    ),
  };
  const roadmapTab = {
    id: "roadmap",
    label: "30 / 60 / 90-day roadmap",
    content: (
      <section className="space-y-3">
        <h3 className="sr-only">30 / 60 / 90-day roadmap</h3>
        {payload.actions.items.length === 0 ? (
          <p className="text-sm text-slate-600">Nothing on the roadmap yet.</p>
        ) : (
          <Roadmap gaps={roadmapGaps} today={today} />
        )}
      </section>
    ),
  };

  return (
    <div data-testid="actions-dashboard" className="space-y-6">
      {/* The top bar already says "Actions" (F1.6); the purpose line stays. */}
      <p data-testid="actions-purpose" className="text-sm text-slate-600">
        Every remediation action the organisation owes — from the assessment, the processing register, and the breach,
        rights and retention registers — by owner and by due date, as of {formatDueDate(today)}. Edit an action on its
        own register&apos;s page.
      </p>

      <div className="flex flex-wrap items-end gap-3 text-sm">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-slate-600">Source</span>
          <select
            data-testid="actions-filter-source"
            value={source}
            onChange={(e) => setSource(e.target.value as SourceFilter)}
            className="rounded-md border border-slate-300 px-2 py-1"
          >
            <option value="all">Every source</option>
            {payload.actions.sources.map((s) => (
              <option key={s} value={s}>
                {ACTION_SOURCE_LABEL[s]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-slate-600">Severity</span>
          <select
            data-testid="actions-filter-severity"
            value={severity}
            onChange={(e) => setSeverity(e.target.value as SeverityFilter)}
            className="rounded-md border border-slate-300 px-2 py-1"
          >
            <option value="all">All</option>
            {GAP_OPENING_SEVERITIES.map((s) => (
              <option key={s} value={s}>
                {GAP_SEVERITY_LABEL[s]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Open" value={summary.outstanding} testid="actions-open" />
        <Stat label="Overdue" value={summary.overdue} testid="actions-overdue" alert={summary.overdue > 0} />
        <Stat label="With no owner" value={summary.unassigned} testid="actions-unassigned" />
        <Stat label="Closed" value={summary.closed} testid="actions-closed" />
      </dl>
      <p data-testid="actions-by-severity" className="flex flex-wrap gap-1 text-xs">
        {GAP_OPENING_SEVERITIES.map((s) => (
          <span key={s} className={`rounded-full px-2 py-0.5 ${SEVERITY_STYLE[s] ?? ""}`}>
            {summary.bySeverity[s]} {GAP_SEVERITY_LABEL[s]}
          </span>
        ))}
      </p>

      <Tabs
        label="Actions"
        tabs={
          programme
            ? [ownersTab, mineTab, allTab, roadmapTab]
            : [mineTab, ownersTab, allTab, roadmapTab]
        }
      />
    </div>
  );
}

function OwnerGroup({
  group,
  today,
  organizationId,
}: {
  group: { ownerUserId: string | null; items: DashboardActionItem[]; overdue: number };
  today: string;
  organizationId: string | null;
}) {
  const name = group.ownerUserId === null ? "Unassigned" : (group.items[0]?.ownerName ?? "A former member");
  return (
    <div
      data-testid={`owner-group-${group.ownerUserId ?? "unassigned"}`}
      className={`rounded-xl border p-3 ${group.ownerUserId === null ? "border-amber-300 bg-amber-50/40" : "border-slate-200"}`}
    >
      <p className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
        <span className="font-semibold">{name}</span>
        <span className="text-xs text-slate-600">
          {group.items.length} open{group.overdue > 0 && <span className="font-semibold text-red-800"> · {group.overdue} overdue</span>}
        </span>
      </p>
      <ul className="mt-2 space-y-1">
        {group.items.map((item) => {
          const late = isOverdue(item.status, item.dueDate, today);
          return (
            <li
              key={item.id}
              data-testid={`owner-item-${item.id}`}
              className="flex flex-wrap items-baseline gap-x-2 gap-y-1 rounded-md bg-white p-2 text-xs ring-1 ring-slate-200"
            >
              <span data-testid={`owner-item-source-${item.id}`} className={`rounded-full px-2 py-0.5 ring-1 ${SOURCE_STYLE[item.source]}`}>
                {item.sourceLabel}
              </span>
              <Link href={item.href} className="font-medium text-slate-900 hover:text-indigo-700 hover:underline">
                {item.title}
              </Link>
              <span className="text-slate-600">
                {item.context} · <span className={`rounded px-1 ${SEVERITY_STYLE[item.severity] ?? ""}`}>{GAP_SEVERITY_LABEL[item.severity]}</span> ·{" "}
                {GAP_ACTION_STATUS_LABEL[item.status]} ·{" "}
                <span className={late ? "font-semibold text-red-800" : undefined}>
                  {late ? "Overdue — " : ""}
                  {formatDueDate(item.dueDate)}
                </span>
              </span>
              {organizationId && <ExplainAction organizationId={organizationId} item={item} testPrefix="ai-explain-owner-item" />}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/**
 * "Explain this action" (Slice 11 Stage 1b, the Gap/Action Helper): an action on
 * an assessment gap only — a register's action (ROPA, breach, rights, retention)
 * has no assessment gap to explain yet. Its next step goes to the action's own page.
 */
function ExplainAction({ organizationId, item, testPrefix }: { organizationId: string; item: DashboardActionItem; testPrefix: string }) {
  if (item.source !== "assessment" || !item.gapId) return null;
  return (
    <ExplainButton
      organizationId={organizationId}
      task="gap_helper"
      body={{ actionId: item.id }}
      subject={item.title}
      label="Explain this action"
      testId={`${testPrefix}-${item.id}`}
      className="mt-1"
      nextSteps={{ add_evidence: { href: item.href }, view_gaps: { href: item.href } }}
    />
  );
}

function Stat({ label, value, testid, alert = false }: { label: string; value: number; testid: string; alert?: boolean }) {
  return (
    <div className={`rounded-xl border p-3 ${alert ? "border-red-300 bg-red-50" : "border-slate-200"}`}>
      <dt className="text-xs text-slate-600">{label}</dt>
      <dd data-testid={testid} className={`text-2xl font-semibold ${alert ? "text-red-900" : ""}`}>
        {value.toLocaleString("en-IN")}
      </dd>
    </div>
  );
}
