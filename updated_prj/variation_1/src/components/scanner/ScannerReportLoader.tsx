"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import type { ScanReport } from "@/content/scanner";
import {
  ScannerAssessmentReport,
  type AssessmentMeta,
} from "@/components/scanner/ScannerAssessmentReport";
import { DpdpEngineReport } from "@/components/scanner/DpdpEngineReport";
import { readCachedScanReport } from "@/lib/scanner/report-cache";
import {
  isDpdpReportContext,
  normalizeDpdpReportContext,
  type DpdpReportContext,
} from "@/lib/scanner/dpdp-types";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | {
      status: "ready";
      kind: "dpdp";
      context: DpdpReportContext;
    }
  | {
      status: "ready";
      kind: "legacy";
      report: ScanReport | null;
      meta: AssessmentMeta;
    };

export function ScannerReportLoader({ reportId }: { reportId: string }) {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const cachedRaw = readCachedScanReport(reportId);
      const cachedDpdp = normalizeDpdpReportContext(cachedRaw, reportId);
      const cachedLegacy =
        !cachedDpdp && cachedRaw && typeof cachedRaw === "object"
          ? (cachedRaw as ScanReport)
          : null;

      if (cachedDpdp && !cancelled) {
        setState({ status: "ready", kind: "dpdp", context: cachedDpdp });
      } else if (cachedLegacy && !cancelled) {
        setState({
          status: "ready",
          kind: "legacy",
          report: cachedLegacy,
          meta: {
            reportId,
            url: cachedLegacy.url,
            score: cachedLegacy.overall_score,
            verdict: cachedLegacy.grade || cachedLegacy.risk_level || "",
            scannedAt: cachedLegacy.scanned_at,
            limited: false,
          },
        });
      }

      try {
        const res = await fetch(
          `/api/scanner/history/item?report_id=${encodeURIComponent(reportId)}`
        );
        if (cancelled) return;

        if (res.status === 401) {
          setState({
            status: "error",
            message: "Sign in to view this assessment report.",
          });
          return;
        }
        if (res.status === 404) {
          if (cachedDpdp || cachedLegacy) return;
          setState({
            status: "error",
            message:
              "Report not found. It may have been removed or belongs to another account.",
          });
          return;
        }
        if (!res.ok) {
          if (cachedDpdp || cachedLegacy) return;
          setState({
            status: "error",
            message: "Could not load this report. Please try again.",
          });
          return;
        }

        const data = (await res.json()) as {
          item?: {
            report_id: string;
            url: string;
            score: number;
            verdict: string;
            scanned_at: string;
            payload?: unknown;
          };
        };
        const item = data.item;
        if (!item) {
          if (cachedDpdp || cachedLegacy) return;
          setState({ status: "error", message: "Report not found." });
          return;
        }

        const payload =
          normalizeDpdpReportContext(item.payload, item.report_id) ??
          cachedDpdp ??
          item.payload ??
          cachedLegacy ??
          null;
        if (isDpdpReportContext(payload)) {
          setState({
            status: "ready",
            kind: "dpdp",
            context: {
              ...payload,
              report_id: payload.report_id || item.report_id,
            },
          });
          return;
        }

        const report =
          payload && typeof payload === "object"
            ? (payload as ScanReport)
            : null;
        setState({
          status: "ready",
          kind: "legacy",
          report,
          meta: {
            reportId: item.report_id,
            url: item.url,
            score: item.score ?? report?.overall_score ?? 0,
            verdict: item.verdict || report?.grade || "",
            scannedAt:
              item.scanned_at || report?.scanned_at || new Date().toISOString(),
            limited: !report,
          },
        });
      } catch {
        if (cancelled) return;
        if (cachedDpdp || cachedLegacy) return;
        setState({
          status: "error",
          message: "Network error while loading the report.",
        });
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [reportId]);

  if (state.status === "loading") {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-text-muted">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
        <p className="text-sm">Loading assessment report…</p>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-semibold text-text">Report unavailable</h1>
        <p className="mt-2 text-sm text-text-muted">{state.message}</p>
        <Link href="/scanner" className="btn btn-accent mt-6 inline-flex">
          Back to scanner
        </Link>
      </div>
    );
  }

  if (state.kind === "dpdp") {
    return <DpdpEngineReport data={state.context} />;
  }

  return <ScannerAssessmentReport report={state.report} meta={state.meta} />;
}
