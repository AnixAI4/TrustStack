"use client";

import { useState } from "react";
import { DataTable } from "@/components/data/data-table";
import { formatCrore, formatDate, type ExposureSnapshotSummary } from "@/lib/client/exposure";

/**
 * Exposure over time: ONE series — the statutory ceilings at stake at each
 * recorded snapshot — in one hue, with a table of the same numbers alongside
 * (the dataviz rules: a single series needs no legend, the title names it;
 * a table view always exists; thin 2px line, 8px markers with a surface
 * ring, recessive grid, a hover tooltip per point). No dependency: plain SVG.
 *
 * The numbers are the stored snapshots' own; nothing is interpolated or
 * recomputed. Ceilings are summed as ceilings, never as a fine. The table pages
 * through `<DataTable>` (Slice 10.5 B4, N4) and names the model each snapshot
 * was recorded under: a stored snapshot is immutable, so one from before 1.7.0
 * keeps its own version.
 */
const W = 640;
const H = 200;
const PAD = { top: 12, right: 16, bottom: 28, left: 56 };
const LINE = "var(--color-brand-navy)"; // the app's navy (D-101) — text stays in text colours

export function ExposureHistory({ snapshots }: { snapshots: ExposureSnapshotSummary[] | null }) {
  const [hover, setHover] = useState<number | null>(null);
  if (snapshots === null) return <p className="text-sm text-slate-500">Loading the history…</p>;
  if (snapshots.length === 0) {
    return (
      <p data-testid="exposure-history-empty" className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-600">
        No snapshot recorded yet. A snapshot stores today&apos;s exposure so it can be compared later; every report will record one.
      </p>
    );
  }

  const points = [...snapshots].reverse(); // oldest → newest, left → right
  const max = Math.max(100, ...points.map((p) => p.ceilingsAtStakeCrore));
  // Headroom above the highest point, so a mark never sits on the frame.
  const top = Math.ceil((max * 1.1) / 100) * 100;
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
  const y = (v: number) => PAD.top + innerH - (v / top) * innerH;
  const ticks = [0, top / 2, top];
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.ceilingsAtStakeCrore).toFixed(1)}`).join(" ");
  const active = hover === null ? null : points[hover]!;

  return (
    <div data-testid="exposure-history" className="space-y-3">
      <figure className="relative">
        <figcaption className="text-sm font-medium">Statutory ceilings at stake, ₹ crore, at each snapshot</figcaption>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label={`Statutory ceilings at stake at ${points.length} snapshots; latest ${formatCrore(points.at(-1)!.ceilingsAtStakeCrore)}`}
          className="mt-1 h-auto w-full"
          onMouseLeave={() => setHover(null)}
        >
          {ticks.map((t) => (
            <g key={t}>
              <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} stroke="#e2e8f0" strokeWidth={1} />
              <text x={PAD.left - 8} y={y(t) + 4} textAnchor="end" fontSize={11} fill="#64748b">
                {t.toLocaleString("en-IN")}
              </text>
            </g>
          ))}
          <text x={points.length === 1 ? x(0) : PAD.left} y={H - 8} textAnchor={points.length === 1 ? "middle" : "start"} fontSize={11} fill="#64748b">
            {formatDate(points[0]!.asOf)}
          </text>
          {points.length > 1 && (
            <text x={W - PAD.right} y={H - 8} textAnchor="end" fontSize={11} fill="#64748b">
              {formatDate(points.at(-1)!.asOf)}
            </text>
          )}
          {points.length > 1 && <path d={path} fill="none" stroke={LINE} strokeWidth={2} strokeLinejoin="round" />}
          {active && hover !== null && (
            <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={PAD.top + innerH} stroke="#94a3b8" strokeWidth={1} strokeDasharray="3 3" />
          )}
          {points.map((p, i) => (
            <g key={p.id}>
              {/* A hit target bigger than the mark. */}
              <rect
                x={x(i) - Math.max(8, innerW / Math.max(points.length, 1) / 2)}
                y={PAD.top}
                width={Math.max(16, innerW / Math.max(points.length, 1))}
                height={innerH}
                fill="transparent"
                onMouseEnter={() => setHover(i)}
              />
              <circle cx={x(i)} cy={y(p.ceilingsAtStakeCrore)} r={4} fill={LINE} stroke="#ffffff" strokeWidth={2} pointerEvents="none" />
            </g>
          ))}
        </svg>
        {active && hover !== null && (
          <div
            data-testid="exposure-history-tooltip"
            className="pointer-events-none absolute rounded-md border border-slate-200 bg-white px-2 py-1 text-xs shadow-sm"
            style={{ left: `${(x(hover) / W) * 100}%`, top: 24, transform: "translateX(-50%)" }}
          >
            <p className="font-medium text-slate-900">{formatCrore(active.ceilingsAtStakeCrore)}</p>
            <p className="text-slate-600">
              {formatDate(active.asOf)} · {active.exposedHeads} of {active.applicableHeads} heads at stake
            </p>
          </div>
        )}
      </figure>

      <DataTable
        testId="exposure-history-table"
        rows={snapshots}
        rowKey={(r) => r.id}
        noun="snapshots"
        caption="Exposure snapshots, newest first"
        columns={[
          { key: "date", header: "Date", cell: (r) => formatDate(r.asOf), sortValue: (r) => r.recordedAt },
          { key: "ceilings", header: "Ceilings at stake", cell: (r) => formatCrore(r.ceilingsAtStakeCrore), sortValue: (r) => r.ceilingsAtStakeCrore },
          { key: "heads", header: "Heads at stake", cell: (r) => `${r.exposedHeads} of ${r.applicableHeads}`, sortValue: (r) => r.exposedHeads },
          {
            key: "basis",
            header: "Basis",
            cell: (r) => (r.basis === "finalised" ? "Finalised assessment" : r.basis === "provisional" ? "Provisional" : "No assessment"),
          },
          { key: "model", header: "Exposure model", cell: (r) => r.modelVersion, cellTestId: (r) => `exposure-history-model-${r.id}` },
          { key: "by", header: "Recorded by", cell: (r) => r.recordedByName ?? "—" },
        ]}
      />
    </div>
  );
}
