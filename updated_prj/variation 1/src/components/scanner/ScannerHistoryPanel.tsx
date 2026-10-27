"use client";

import { History, Loader2 } from "lucide-react";
import type { ScanHistoryItem } from "@/app/api/scanner/history/route";
import { cn } from "@/lib/cn";

interface Props {
  items: ScanHistoryItem[];
  loading?: boolean;
  activeId?: string | null;
  onSelect?: (item: ScanHistoryItem) => void;
}

/** Match DPDP verdict bands: ≥80 compliant, ≥50 partial, else non-compliant. */
function scoreBand(score: number): "high" | "mid" | "low" {
  if (score >= 80) return "high";
  if (score >= 50) return "mid";
  return "low";
}

function verdictBand(verdict?: string | null): "high" | "mid" | "low" | null {
  const v = (verdict || "").toLowerCase();
  if (!v) return null;
  if (v.includes("non-compliant") || v.includes("non compliant")) return "low";
  if (v.includes("partial")) return "mid";
  if (v.includes("compliant")) return "high";
  return null;
}

const BAND_PILL: Record<"high" | "mid" | "low", string> = {
  high: "border-green/40 bg-green/12 text-green",
  mid: "border-amber/40 bg-amber/12 text-amber",
  low: "border-red/40 bg-red/12 text-red",
};

const BAND_LABEL: Record<"high" | "mid" | "low", string> = {
  high: "text-green",
  mid: "text-amber",
  low: "text-red",
};

export function ScannerHistoryPanel({
  items,
  loading,
  activeId,
  onSelect,
}: Props) {
  return (
    <aside className="overflow-hidden rounded-2xl border border-line bg-bg-2 shadow-sm">
      <header className="border-b border-line px-4 py-3.5">
        <h2 className="flex items-center gap-2 font-display text-base font-bold text-text">
          <History className="h-4 w-4 text-accent" />
          Scan history
        </h2>
        <p className="mt-1 text-xs text-text-muted">Your recent assessments</p>
      </header>

      {loading ? (
        <div className="flex items-center gap-2 px-4 py-10 text-sm text-text-muted">
          <Loader2 className="h-4 w-4 animate-spin text-accent" />
          Loading history…
        </div>
      ) : items.length === 0 ? (
        <p className="px-4 py-10 text-center text-sm text-text-faint">
          No previous assessments yet. Run a scan to build your history.
        </p>
      ) : (
        <ul className="max-h-[28rem] divide-y divide-line overflow-y-auto">
          {items.map((item) => {
            const band = verdictBand(item.verdict) ?? scoreBand(item.score);
            return (
            <li key={item.report_id}>
              <button
                type="button"
                onClick={() => onSelect?.(item)}
                className={cn(
                  "block w-full px-4 py-3.5 text-left transition-colors hover:bg-glass",
                  activeId === item.report_id && "bg-accent/8"
                )}
              >
                <p className="truncate text-sm font-semibold text-text">{item.url}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      "inline-flex rounded-full border px-2 py-0.5 text-xs font-bold tabular-nums",
                      BAND_PILL[band]
                    )}
                  >
                    {item.score}
                    <span className="ml-0.5 font-medium opacity-60">/100</span>
                  </span>
                  {item.verdict ? (
                    <span className={cn("text-xs font-medium", BAND_LABEL[band])}>
                      {item.verdict}
                    </span>
                  ) : null}
                </div>
                <p className="mt-1.5 font-mono text-[10px] uppercase tracking-wider text-text-faint">
                  {new Date(item.scanned_at).toLocaleString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </button>
            </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
}
