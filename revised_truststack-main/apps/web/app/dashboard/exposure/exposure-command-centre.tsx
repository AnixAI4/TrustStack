"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  actionsOpenLabel,
  CEILINGS_AT_STAKE_HEADING,
  foldUnansweredReasons,
  GAP_SEVERITY_LABEL,
  type ForecastResult,
  type GapSeverity,
  type Projection,
} from "@truststack/core";
import { Notice } from "@/components/feedback/notice";
import { Tabs } from "@/components/ui/tabs";
import { apiFetch } from "@/lib/client/api";
import {
  EXPOSURE_STATUS_STYLE,
  formatCrore,
  formatDate,
  headLabel,
  type ExposurePayload,
  type ExposureSnapshotSummary,
  type WhatIfPayload,
} from "@/lib/client/exposure";
import { Can, usePermissions } from "@/lib/client/permissions";
import { ExposureHistory } from "./exposure-history";

/**
 * The Exposure Command Centre (Slice 9, Stage 2): how close the organisation
 * is to a DPDP penalty, where it sits within each statutory ceiling and why,
 * whether it will be ready by 13 May 2027 at its current pace, and which
 * actions retire the most exposure.
 *
 * Every figure comes from the API — the exposure model in core, or a snapshot
 * the database derived. This page formats; it computes nothing. A band is an
 * INDICATIVE POSITION within a statutory ceiling, never a fine; the headline
 * sums CEILINGS, labelled as such; both caveats are on the page (§6.6, D-011).
 * No question code, pack code or trigger appears (D-071).
 */
/** Where each Slice 10 register's facts are recorded. */
const REGISTER_HREF: Record<string, string> = {
  "Breach register": "/dashboard/breaches",
  "Rights and grievance register": "/dashboard/rights",
};

export function ExposureCommandCentre() {
  const permissions = usePermissions();
  const organizationId = permissions.kind === "ready" ? permissions.value.organizationId : null;
  const [payload, setPayload] = useState<ExposurePayload | null>(null);
  const [history, setHistory] = useState<ExposureSnapshotSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!organizationId) return;
    const [live, snapshots] = await Promise.all([
      apiFetch<ExposurePayload>(`/api/v1/organizations/${organizationId}/exposure`),
      apiFetch<{ snapshots: ExposureSnapshotSummary[] }>(`/api/v1/organizations/${organizationId}/exposure/snapshots`),
    ]);
    if (live.success) setPayload(live.data);
    else setError(live.error.message);
    if (snapshots.success) setHistory(snapshots.data.snapshots);
  }, [organizationId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (error) {
    return (
      <Notice tone="error" testId="exposure-error">
        {error}
      </Notice>
    );
  }
  if (!payload || !organizationId) return <p className="text-sm text-slate-500">Loading the exposure view…</p>;

  const { headline, s37, intelligence } = payload;

  return (
    <div data-testid="exposure-command-centre" className="space-y-6">
      {/* The shell's header names the page (D-110.10, N3): no second heading here. */}
      <section className="space-y-1">
        <p data-testid="exposure-basis" className="text-sm text-slate-600">
          {payload.basis === "finalised" && payload.assessment && <>Based on the finalised assessment {payload.assessment.name}, and the processing register.</>}
          {payload.basis === "provisional" && payload.assessment && (
            <>
              Provisional — based on {payload.assessment.name}, still in progress
              {payload.freshness.outstandingQuestions ? ` (${payload.freshness.outstandingQuestions} questions unanswered)` : ""}, and the processing register.
            </>
          )}
          {payload.basis === "none" && <>No assessment yet — based on the scope and the processing register only.</>}
        </p>
        <Freshness freshness={payload.freshness} />
      </section>

      <Tabs
        label="Exposure"
        testId="exposure-tabs"
        tabs={[
          {
            id: "where-you-stand",
            label: "Where you stand",
            content: (
              <div className="space-y-6">
                {/* --- The headline ---------------------------------------------------- */}
                <section data-testid="exposure-headline" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <Tile label={CEILINGS_AT_STAKE_HEADING} testid="exposure-ceilings">
                    <span className="text-2xl font-semibold">{formatCrore(headline.ceilingsAtStakeCrore)}</span>
                    <span className="mt-1 block text-xs text-slate-600">{headline.ceilingsLabel}</span>
                  </Tile>
                  <Tile label="Penalty heads at stake" testid="exposure-heads-at-stake">
                    <span className="text-2xl font-semibold">
                      {headline.exposedHeads} <span className="text-base font-normal text-slate-500">of {headline.applicableHeads} that apply</span>
                    </span>
                    <span className="mt-1 block text-xs text-slate-600">
                      {headline.byStatus.exposed} exposed · {headline.byStatus.partially_mitigated} partially mitigated · {headline.byStatus.not_yet_assessed} not yet assessed
                    </span>
                  </Tile>
                  <Tile label="Days to 13 May 2027" testid="exposure-days">
                    <span className="text-2xl font-semibold">{headline.daysToDeadline.toLocaleString("en-IN")}</span>
                    <span className="mt-1 block text-xs text-slate-600">{payload.commencementNote}</span>
                  </Tile>
                  <Tile label="Forecast — all work" testid="exposure-forecast-tile">
                    <ForecastLine projection={intelligence.forecast.all} forecast={intelligence.forecast} />
                  </Tile>
                </section>

                {/* F4.1: the law, said once and calmly under the tiles — not an error. */}
                {s37.shown && (
                  <Notice tone="info" testId="exposure-s37">
                    {s37.text}
                  </Notice>
                )}

                {intelligence.slippage.length > 0 && (
                  <section data-testid="exposure-slippage" className="space-y-2">
                    <h3 className="text-lg font-semibold">Where the programme is slipping</h3>
                    <ul className="space-y-1">
                      {intelligence.slippage.map((w) => (
                        <li
                          key={w.code}
                          data-testid={`slippage-${w.code}`}
                          className={`rounded-md p-2 text-sm ${w.level === "warning" ? "bg-amber-50 text-amber-900" : "bg-slate-50 text-slate-700"}`}
                        >
                          <span className="font-medium">{w.level === "warning" ? "Warning: " : "Note: "}</span>
                          {w.text}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
              </div>
            ),
          },
          {
            id: "penalty-heads",
            label: "Penalty heads",
            badge: headline.exposedHeads > 0 ? String(headline.exposedHeads) : undefined,
            attention: headline.exposedHeads > 0,
            content: <PenaltyHeads payload={payload} />,
          },
          {
            id: "what-if",
            label: "What-if",
            content: <LeverageAndWhatIf organizationId={organizationId} payload={payload} />,
          },
          {
            id: "history",
            label: "History",
            badge: history && history.length > 0 ? String(history.length) : undefined,
            content: (
              <div className="space-y-6">
                {intelligence.changes && <WhatChanged changes={intelligence.changes} />}
                <section className="space-y-3">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="text-lg font-semibold">Exposure over time</h3>
                    <Can permission="score.calculate">
                      <RecordSnapshot organizationId={organizationId} onRecorded={load} />
                    </Can>
                  </div>
                  <ExposureHistory snapshots={history} />
                </section>
              </div>
            ),
          },
        ]}
      />

      {/* Both caveats stay on the page whatever the tab (§6.6, D-011). */}
      <section data-testid="exposure-caveats" className="space-y-2 border-t border-slate-200 pt-4 text-xs text-slate-600">
        <p data-testid="exposure-caveat">{payload.caveats.exposure}</p>
        <p data-testid="readiness-caveat">{payload.caveats.readiness}</p>
        <p>
          Not scored:{" "}
          {payload.unscoredFactors.map((f) => `s.33(2)${f.clause} — ${f.label}`).join(" ")}
        </p>
      </section>
    </div>
  );
}

/** One card per modelled head, then the two heads the model does not evaluate. */
function PenaltyHeads({ payload }: { payload: ExposurePayload }) {
  const { heads } = payload;
  return (
    <section className="space-y-3">
      <h3 className="text-lg font-semibold">The penalty heads of the Schedule</h3>
      <div className="space-y-3">
        {heads.map((h) => (
          <article key={h.code} data-testid={`exposure-head-${h.code}`} className="rounded-xl border border-slate-200 p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {headLabel(h.serial)} · {h.provision} · ceiling {h.ceilingLabel}
                </p>
                <h4 className="font-medium">{h.title}</h4>
              </div>
              <span data-testid={`exposure-status-${h.code}`} className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${EXPOSURE_STATUS_STYLE[h.status]}`}>
                {h.statusLabel}
              </span>
            </div>
            {h.position && (
              <p data-testid={`exposure-position-${h.code}`} className="mt-2 text-sm">
                Indicative position within the statutory ceiling: <strong>{h.position.bandLabel}</strong> ({h.position.rangeLabel})
              </p>
            )}
            {/* Direct evidence first; root causes (enabling controls, never a status) collapsed below it. */}
            {h.reasons.some((r) => r.kind !== "root_cause") && (
              <ul className="mt-2 list-disc space-y-0.5 pl-5 text-sm text-slate-700">
                {/* "Not yet answered: …" once, not a line per area (F4.4) — as every report says it. */}
                {foldUnansweredReasons(h.reasons)
                  .filter((r) => r.kind !== "root_cause")
                  .map((r, i) => (
                    <li key={i}>{r.text}</li>
                  ))}
              </ul>
            )}
            {h.reasons.some((r) => r.kind === "root_cause") && (
              <details data-testid={`exposure-root-causes-${h.code}`} className="mt-2 text-xs text-slate-600">
                <summary className="cursor-pointer">
                  Root causes ({h.reasons.filter((r) => r.kind === "root_cause").length}) — good practice that explains this head, not a statutory duty
                </summary>
                <ul className="mt-1 list-disc pl-5">
                  {h.reasons
                    .filter((r) => r.kind === "root_cause")
                    .map((r, i) => (
                      <li key={i}>{r.text.replace(/^Root cause: /, "")}</li>
                    ))}
                </ul>
              </details>
            )}
            {h.position && h.position.factors.length > 0 && (
              <details className="mt-2 text-xs text-slate-600">
                <summary className="cursor-pointer">Why this position (section 33(2) factors TrustStack can observe)</summary>
                <ul className="mt-1 list-disc pl-5">
                  {h.position.factors.map((f) => (
                    <li key={f.code}>
                      {f.text} ({f.points > 0 ? `+${f.points}` : f.points}, s.33(2){f.clause})
                    </li>
                  ))}
                </ul>
              </details>
            )}
            {h.applies && (h.evidencedBy.domains.length > 0 || h.evidencedBy.registerRules.length > 0) && (
              <p className="mt-2 text-xs text-slate-500">
                Evidenced by:{" "}
                {h.evidencedBy.domains.map((d) => `${d.name} (${d.provision})`).join("; ")}
                {h.evidencedBy.registerRules.length > 0 && (
                  <>
                    {h.evidencedBy.domains.length > 0 && "; "}
                    <Link href="/dashboard/ropa/gaps" className="text-indigo-700 hover:underline">
                      register checks
                    </Link>
                    : {h.evidencedBy.registerRules.map((r) => r.label).join(", ")}
                  </>
                )}
                {/* 1.1.0, 1.2.0: the Slice 10 registers' own facts, each register linked to its page. */}
                {[...new Set(h.evidencedBy.moduleInputs.map((m) => m.register))].map((register) => (
                  <span key={register}>
                    ;{" "}
                    <Link href={REGISTER_HREF[register] ?? "/dashboard"} className="text-indigo-700 hover:underline">
                      {register.toLowerCase()}
                    </Link>
                    :{" "}
                    {h.evidencedBy.moduleInputs
                      .filter((m) => m.register === register)
                      .map((m) => `${m.label} (${m.provision})`)
                      .join("; ")}
                  </span>
                ))}
                .
              </p>
            )}
          </article>
        ))}
      </div>
      <ul className="text-xs text-slate-500">
        {payload.notModelled.map((h) => (
          <li key={h.code}>
            {h.title} ({h.provision}, {h.ceilingLabel}) — not modelled: {h.reason}
          </li>
        ))}
      </ul>
    </section>
  );
}

function Freshness({ freshness }: { freshness: ExposurePayload["freshness"] }) {
  const notes = [
    !freshness.scopeSaved && "The scope has never been saved, so every scope fact is treated as not yet known.",
    freshness.assessmentGapsStale && "The assessment's gap register is out of date — the answers have changed since it was generated.",
    !freshness.registerGapsGenerated && "The processing register's gaps have not been generated yet.",
    freshness.registerGapsGenerated && freshness.registerGapsStale && "The processing register's gaps are out of date.",
  ].filter((n): n is string => typeof n === "string");
  if (notes.length === 0) return null;
  return (
    <ul data-testid="exposure-freshness" className="list-disc pl-5 text-xs text-amber-800">
      {notes.map((n) => (
        <li key={n}>{n}</li>
      ))}
    </ul>
  );
}

function Tile({ label, testid, children }: { label: string; testid: string; children: React.ReactNode }) {
  return (
    <div data-testid={testid} className="rounded-xl border border-slate-200 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">{label}</p>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function ForecastLine({ projection, forecast }: { projection: Projection; forecast: ForecastResult }) {
  if (projection.outstanding === 0) return <span className="text-sm">Nothing outstanding.</span>;
  if (forecast.notEnoughHistory) {
    return (
      <span className="text-sm text-slate-700">
        Not enough history to forecast yet.
        <span className="mt-1 block text-xs text-slate-600">
          {actionsOpenLabel(projection.outstanding)}; {projection.requiredPerWeek ?? "—"} a week needed to finish by 13 May 2027.
        </span>
      </span>
    );
  }
  return (
    <span className="text-sm">
      Likely {projection.p50Date ? formatDate(projection.p50Date) : "beyond five years"}
      <span className="block text-xs text-slate-600">
        Cautious: {projection.p85Date ? formatDate(projection.p85Date) : "beyond five years"} · {forecast.averagePerWeek} closed a week, {projection.requiredPerWeek ?? "—"} needed
      </span>
    </span>
  );
}

// ---------------------------------------------------------------------------
// Leverage + what-if
// ---------------------------------------------------------------------------

function LeverageAndWhatIf({ organizationId, payload }: { organizationId: string; payload: ExposurePayload }) {
  const { leverage } = payload.intelligence;
  const [ticked, setTicked] = useState<Set<string>>(new Set());
  const [result, setResult] = useState<WhatIfPayload | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setBusy(true);
    setError(null);
    const r = await apiFetch<WhatIfPayload>(`/api/v1/organizations/${organizationId}/exposure/what-if`, {
      method: "POST",
      body: JSON.stringify({ actionIds: [...ticked] }),
    });
    setBusy(false);
    if (r.success) setResult(r.data);
    else setError(r.error.message);
  };

  const toggle = (id: string) =>
    setTicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <section data-testid="exposure-leverage" className="space-y-3">
      <h3 className="text-lg font-semibold">The actions that retire the most exposure</h3>
      {leverage.length === 0 ? (
        <p data-testid="exposure-leverage-empty" className="text-sm text-slate-600">
          No open action is on a penalty head at stake.
        </p>
      ) : (
        <>
          <p className="text-xs text-slate-600">
            Ranked by the ceilings of the heads each action&apos;s gap counts against × the gap&apos;s severity. Tick actions to see what closing them would change — nothing is saved.
          </p>
          <ol className="space-y-2">
            {leverage.map((e, i) => (
              <li key={e.actionId} data-testid={`leverage-${i}`} className="flex gap-3 rounded-lg border border-slate-200 p-3 text-sm">
                <input
                  type="checkbox"
                  aria-label={`Include in what-if: ${e.action?.title ?? "action"}`}
                  data-testid={`whatif-tick-${i}`}
                  checked={ticked.has(e.actionId)}
                  onChange={() => toggle(e.actionId)}
                  className="mt-1"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{e.action?.title ?? "Action"}</p>
                  <p className="text-xs text-slate-600">
                    {e.action?.sourceLabel} · {e.action?.context} · {GAP_SEVERITY_LABEL[e.severity as GapSeverity] ?? e.severity} · owner {e.action?.ownerName ?? "none"} · due {formatDate(e.action?.dueDate ?? null)}
                  </p>
                  <p className="text-xs text-slate-500">
                    Heads: {payload.heads.filter((h) => e.heads.includes(h.code)).map((h) => headLabel(h.serial)).join(", ")}
                    {e.alone.heads.length > 0
                      ? ` · closing it alone: ${e.alone.heads.map((c) => `${headLabel(payload.heads.find((h) => h.code === c.code)?.serial ?? 0)} ${c.fromLabel} → ${c.toLabel}`).join("; ")}`
                      : " · closing it alone moves no head by itself"}
                  </p>
                </div>
                {e.action && (
                  <Link href={e.action.href} className="shrink-0 text-xs text-indigo-700 hover:underline">
                    Open
                  </Link>
                )}
              </li>
            ))}
          </ol>
          <button
            type="button"
            data-testid="whatif-run"
            disabled={busy || ticked.size === 0}
            onClick={run}
            className="rounded-md bg-indigo-700 px-3 py-1.5 text-sm text-white hover:bg-indigo-800 disabled:opacity-50"
          >
            {busy ? "Working…" : `What if these ${ticked.size} were closed?`}
          </button>
          {error && <Notice tone="error" compact>{error}</Notice>}
          {result && (
            <div data-testid="whatif-result" className="rounded-lg border border-indigo-200 bg-indigo-50/40 p-3 text-sm">
              <p>
                Ceilings at stake: {formatCrore(result.change.ceilingsAtStakeCrore.from)} →{" "}
                <strong data-testid="whatif-ceilings-after">{formatCrore(result.change.ceilingsAtStakeCrore.to)}</strong> · heads at stake{" "}
                {result.change.exposedHeads.from} → {result.change.exposedHeads.to}
              </p>
              {result.change.heads.length === 0 ? (
                <p className="text-slate-600">No head changes status or position.</p>
              ) : (
                <ul className="mt-1 list-disc pl-5">
                  {result.change.heads.map((c) => (
                    <li key={c.code}>
                      {c.title}: {c.fromLabel} → {c.toLabel}
                      {c.fromBand !== c.toBand && ` (position ${c.fromBand ?? "none"} → ${c.toBand ?? "none"})`}
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-1 text-slate-700">
                {result.forecast.after.notEnoughHistory
                  ? `Open actions ${result.forecast.before.all.outstanding} → ${result.forecast.after.all.outstanding}; not enough closure history to forecast a finish date.`
                  : `All work, likely finish: ${formatDate(result.forecast.before.all.p50Date)} → ${formatDate(result.forecast.after.all.p50Date)} (${result.forecast.before.all.outstanding} → ${result.forecast.after.all.outstanding} open)`}
              </p>
              <p className="mt-1 text-xs text-slate-500">A what-if changes nothing. Close the actions on their own pages.</p>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function WhatChanged({ changes }: { changes: NonNullable<ExposurePayload["intelligence"]["changes"]> }) {
  const { change } = changes;
  return (
    <section data-testid="exposure-changes" className="space-y-1">
      <h3 className="text-lg font-semibold">What changed since the last snapshot</h3>
      <p className="text-sm text-slate-700">
        Since {formatDate(changes.since.recordedAt)}: ceilings at stake {formatCrore(change.ceilingsAtStakeCrore.from)} →{" "}
        {formatCrore(change.ceilingsAtStakeCrore.to)}; heads at stake {change.exposedHeads.from} → {change.exposedHeads.to}.
      </p>
      {changes.modelChanged && (
        <p className="text-xs text-amber-800">
          The snapshot was recorded under exposure model {changes.since.modelVersion}; some movement may be the model, not the organisation.
        </p>
      )}
      {change.heads.length === 0 ? (
        <p className="text-sm text-slate-600">No head has changed status or position.</p>
      ) : (
        <ul className="list-disc pl-5 text-sm">
          {change.heads.map((c) => (
            <li key={c.code}>
              {c.title}: {c.fromLabel} → {c.toLabel}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function RecordSnapshot({ organizationId, onRecorded }: { organizationId: string; onRecorded: () => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <span className="flex items-center gap-2">
      {error && <span className="text-xs text-red-700">{error}</span>}
      <button
        type="button"
        data-testid="exposure-record-snapshot"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError(null);
          const r = await apiFetch(`/api/v1/organizations/${organizationId}/exposure/snapshots`, { method: "POST" });
          setBusy(false);
          if (!r.success) setError(r.error.message);
          else await onRecorded();
        }}
        className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-100 disabled:opacity-50"
      >
        {busy ? "Recording…" : "Record a snapshot now"}
      </button>
    </span>
  );
}
