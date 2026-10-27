/**
 * Durable scan report storage in Supabase `scan_reports`.
 * Mirrors the Flask engine's supabase_store.py so Next.js can recover full
 * reports on any device without depending on localhost:5000 or sessionStorage.
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { ScanReport } from "@/content/scanner";
import {
  normalizeDpdpReportContext,
  type DpdpReportContext,
} from "@/lib/scanner/dpdp-types";

export type ScanHistoryMeta = {
  reportId: string;
  url: string;
  score: number;
  verdict: string;
  scannedAt?: string;
  payload: ScanReport | DpdpReportContext | Record<string, unknown>;
};

/** Persist full report JSON to scan_reports (service role). */
export async function mirrorScanReport(
  reportId: string,
  payload: unknown
): Promise<boolean> {
  const admin = createAdminClient();
  if (!admin || !reportId || !payload || typeof payload !== "object") {
    return false;
  }
  const now = new Date().toISOString();
  const { error } = await admin.from("scan_reports").upsert(
    {
      report_id: reportId,
      payload,
      updated_at: now,
    },
    { onConflict: "report_id" }
  );
  if (error) {
    console.warn("[scan-report-store] mirror failed:", error.message);
    return false;
  }
  return true;
}

/** Load full report payload from scan_reports (service role). */
export async function fetchMirroredScanReport(
  reportId: string
): Promise<unknown | null> {
  const admin = createAdminClient();
  if (!admin || !reportId) return null;
  const { data, error } = await admin
    .from("scan_reports")
    .select("payload")
    .eq("report_id", reportId)
    .maybeSingle();
  if (error) {
    console.warn("[scan-report-store] fetch failed:", error.message);
    return null;
  }
  return data?.payload ?? null;
}

/** Upsert user_scans with full payload — admin first, then user JWT. */
export async function saveScanHistory(
  userId: string,
  meta: ScanHistoryMeta
): Promise<void> {
  const rowWithPayload = {
    user_id: userId,
    report_id: meta.reportId,
    url: meta.url,
    score: meta.score,
    verdict: meta.verdict,
    scanned_at: meta.scannedAt || new Date().toISOString(),
    payload: meta.payload,
  };
  const rowWithoutPayload = {
    user_id: userId,
    report_id: meta.reportId,
    url: meta.url,
    score: meta.score,
    verdict: meta.verdict,
    scanned_at: meta.scannedAt || new Date().toISOString(),
  };

  const clients = [createAdminClient(), await createClient()].filter(
    (c): c is NonNullable<typeof c> => Boolean(c)
  );

  let savedWithPayload = false;
  for (const supabase of clients) {
    const { error } = await supabase
      .from("user_scans")
      .upsert(rowWithPayload, { onConflict: "user_id,report_id" });

    if (!error) {
      savedWithPayload = true;
      break;
    }

    if (error.message?.includes("payload")) {
      const { error: err2 } = await supabase
        .from("user_scans")
        .upsert(rowWithoutPayload, { onConflict: "user_id,report_id" });
      if (!err2) {
        console.error(
          "[scan-report-store] history saved WITHOUT payload — run scanner_history.sql migration"
        );
        break;
      }
      console.error(
        "[scan-report-store] history save failed (no payload):",
        err2.message
      );
      continue;
    }

    console.error("[scan-report-store] history save failed:", error.message);
  }

  // Always mirror to scan_reports so cross-device recovery works even when
  // user_scans.payload is missing or the Flask engine is offline.
  void mirrorScanReport(meta.reportId, meta.payload);

  if (!savedWithPayload) {
    console.warn(
      "[scan-report-store] user_scans payload not saved for",
      meta.reportId
    );
  }
}

/** Recover a normalized DpdpReportContext from scan_reports if present. */
export async function recoverDpdpFromMirror(
  reportId: string
): Promise<DpdpReportContext | null> {
  const raw = await fetchMirroredScanReport(reportId);
  return normalizeDpdpReportContext(raw, reportId);
}
