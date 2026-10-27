"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, ClipboardCheck, Copy, ListChecks, Sparkles } from "lucide-react";
import type { AssessmentIndicator } from "@/lib/scanner/assessment-map";

type RemediationItem = AssessmentIndicator & {
  gap: number;
  allocGap: number;
};

function buildRemediationItems(
  findings: AssessmentIndicator[],
  score: number
): { items: RemediationItem[]; totalRecoverable: number; potentialScore: number } {
  const headroom = Math.max(0, 100 - score);
  const rawItems = findings
    .map((f) => ({
      ...f,
      gap: Math.max(0, (f.max_points ?? 0) - (f.points ?? 0)),
    }))
    .filter((f) => f.gap > 0.05 && f.status !== "Found")
    .sort((a, b) => b.gap - a.gap);

  const rawTotal = rawItems.reduce((sum, it) => sum + it.gap, 0);
  const totalRecoverable = Math.min(rawTotal, headroom);
  const potentialScore = Math.min(100, Math.round(score + totalRecoverable));

  if (rawTotal <= 0 || totalRecoverable <= 0) {
    return { items: [], totalRecoverable: 0, potentialScore: score };
  }

  if (rawTotal <= headroom) {
    return {
      items: rawItems.map((it) => ({ ...it, allocGap: it.gap })),
      totalRecoverable,
      potentialScore,
    };
  }

  let allocated = 0;
  const items: RemediationItem[] = rawItems.map((it, index, arr) => {
    if (index === arr.length - 1) {
      const allocGap = Math.max(0, Math.round((totalRecoverable - allocated) * 10) / 10);
      return { ...it, allocGap };
    }
    const allocGap = Math.round((it.gap / rawTotal) * totalRecoverable * 10) / 10;
    allocated += allocGap;
    return { ...it, allocGap };
  });

  return {
    items: items.filter((it) => it.allocGap > 0.05),
    totalRecoverable,
    potentialScore,
  };
}

function formatPts(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

const STATUS_CLS: Record<string, string> = {
  Found: "border-green/40 bg-green/12 text-green",
  Partial: "border-amber/40 bg-amber/12 text-amber",
  Missing: "border-red/40 bg-red/12 text-red",
};

export function RemediationPlan({
  findings,
  reportId,
  score,
}: {
  findings: AssessmentIndicator[];
  reportId: string;
  score: number;
}) {
  const { items, totalRecoverable, potentialScore } = useMemo(
    () => buildRemediationItems(findings, score),
    [findings, score]
  );

  const storageKey = `truststack:remediation:${reportId}`;
  const [resolved, setResolved] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setResolved(new Set(JSON.parse(raw) as string[]));
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, [storageKey]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify([...resolved]));
    } catch {
      /* ignore */
    }
  }, [resolved, hydrated, storageKey]);

  if (items.length === 0) {
    return (
      <section className="card relative overflow-hidden">
        <span className="absolute inset-y-0 left-0 w-[3px] bg-green" aria-hidden />
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-green/15 text-green">
            <Sparkles className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-display text-lg font-bold tracking-tight text-text">
              No remediation required
            </h2>
            <p className="mt-0.5 text-sm text-text-muted">
              Every assessed indicator was satisfied. Re-scan periodically to maintain compliance.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const recovered = items
    .filter((it) => resolved.has(it.key))
    .reduce((sum, it) => sum + it.allocGap, 0);
  const remainingRecoverable = Math.max(0, totalRecoverable - recovered);
  const doneCount = items.filter((it) => resolved.has(it.key)).length;
  const pct = Math.round((doneCount / items.length) * 100);

  const toggle = (key: string) =>
    setResolved((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const copy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied((c) => (c === key ? null : c)), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <section className="card overflow-hidden !p-0">
      <header className="border-b border-line px-5 py-5 md:px-7">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 font-display text-lg font-bold tracking-tight text-text">
              <ListChecks className="h-4 w-4 text-accent" />
              Remediation Plan
            </h2>
            <p className="mt-1 text-sm text-text-muted">
              Prioritised fixes to raise your compliance score - highest impact first.
            </p>
          </div>
          <div className="text-right">
            <p className="font-display text-2xl font-bold leading-none tabular-nums text-accent">
              +{formatPts(remainingRecoverable)}
            </p>
            <p className="mt-1 text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-text-faint">
              pts recoverable
            </p>
            <p className="mt-1.5 text-xs tabular-nums text-text-muted">
              {score}/100 → up to {potentialScore}/100
            </p>
          </div>
        </div>
        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between text-xs text-text-muted">
            <span>
              {doneCount} of {items.length} resolved
            </span>
            <span className="tabular-nums">{pct}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-line">
            <span
              className="block h-full rounded-full bg-gradient-to-r from-accent to-amber transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </header>

      <ul className="divide-y divide-line">
        {items.map((it, i) => {
          const done = resolved.has(it.key);
          const action =
            it.recommendation ||
            `Address “${it.indicator}” to recover approximately ${formatPts(it.allocGap)} points.`;
          return (
            <li key={it.key || `remediation-${i}`} className="px-5 py-4 md:px-7">
              <div className="flex items-start gap-3.5">
                <button
                  type="button"
                  onClick={() => toggle(it.key)}
                  aria-pressed={done}
                  aria-label={done ? "Mark as not done" : "Mark as resolved"}
                  className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border transition-all ${
                    done
                      ? "border-accent bg-accent text-white"
                      : "border-line bg-surface-2/40 text-transparent hover:border-accent/60"
                  }`}
                >
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                </button>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[0.7rem] font-bold tabular-nums text-text-faint">
                      #{i + 1}
                    </span>
                    <h3
                      className={`font-display font-bold ${
                        done ? "text-text-faint line-through" : "text-text"
                      }`}
                    >
                      {it.indicator}
                    </h3>
                    <span
                      className={`rounded-pill border px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider ${
                        STATUS_CLS[it.status] || STATUS_CLS.Missing
                      }`}
                    >
                      {it.status}
                    </span>
                    <span className="inline-flex items-center rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-xs font-bold tabular-nums text-accent">
                      +{formatPts(it.allocGap)} pts
                    </span>
                  </div>
                  <p
                    className={`mt-1.5 text-sm leading-relaxed ${
                      done ? "text-text-faint" : "text-text-muted"
                    }`}
                  >
                    {action}
                  </p>
                  <p className="mt-1 font-mono text-[0.7rem] text-text-faint">
                    {it.rule}
                    {it.gap !== it.allocGap && (
                      <span className="ml-2">
                        ({formatPts(it.points)}/{formatPts(it.max_points)} earned)
                      </span>
                    )}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => copy(it.key, action)}
                  className="shrink-0 rounded-lg border border-line bg-surface-2/40 p-2 text-text-muted transition-colors hover:border-accent/40 hover:text-text"
                  aria-label="Copy recommendation"
                >
                  {copied === it.key ? (
                    <ClipboardCheck className="h-4 w-4 text-accent" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
