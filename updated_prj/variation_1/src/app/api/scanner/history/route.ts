import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ScanReport } from "@/content/scanner";
import {
  isDpdpReportContext,
  normalizeDpdpReportContext,
} from "@/lib/scanner/dpdp-types";
import { saveScanHistory } from "@/lib/scanner/scan-report-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export type ScanHistoryItem = {
  report_id: string;
  url: string;
  score: number;
  verdict: string;
  scanned_at: string;
  access_tier: "full" | "preview";
};

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("user_scans")
    .select("report_id, url, score, verdict, scanned_at")
    .eq("user_id", user.id)
    .order("scanned_at", { ascending: false })
    .limit(50);

  if (error) {
    // Table may not exist yet — return empty rather than hard-fail the UI
    if (error.code === "42P01" || error.message?.includes("does not exist")) {
      return NextResponse.json({ items: [] as ScanHistoryItem[] });
    }
    return NextResponse.json(
      { error: "history_failed", detail: error.message },
      { status: 500 }
    );
  }

  const items: ScanHistoryItem[] = (data ?? []).map((row) => ({
    report_id: row.report_id,
    url: row.url,
    score: row.score ?? 0,
    verdict: row.verdict ?? "",
    scanned_at: row.scanned_at,
    access_tier: "full",
  }));

  return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: {
    report_id?: string;
    url?: string;
    score?: number;
    verdict?: string;
    report?: ScanReport | Record<string, unknown>;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const report_id = body.report_id?.trim();
  const url = body.url?.trim();
  if (!report_id || !url) {
    return NextResponse.json(
      { error: "invalid_request", detail: "report_id and url are required." },
      { status: 400 }
    );
  }

  const incoming =
    normalizeDpdpReportContext(body.report, report_id) ?? body.report ?? null;
  const payloadRec = (incoming || {}) as Record<string, unknown>;

  // Never let a thin client shell wipe a previously saved full DPDP report.
  const existing = await supabase
    .from("user_scans")
    .select("payload, score, verdict, scanned_at, url")
    .eq("user_id", user.id)
    .eq("report_id", report_id)
    .maybeSingle();
  const existingPayload = existing.data?.payload;
  const keepExisting =
    isDpdpReportContext(existingPayload) && !isDpdpReportContext(incoming);
  const payload = keepExisting ? existingPayload : incoming;

  if (!payload || typeof payload !== "object") {
    return NextResponse.json(
      { error: "invalid_request", detail: "Full report payload is required." },
      { status: 400 }
    );
  }

  const score = Math.round(
    keepExisting && typeof existing.data?.score === "number"
      ? existing.data.score
      : body.score ??
          (typeof payloadRec.overall_score === "number"
            ? payloadRec.overall_score
            : typeof payloadRec.score === "number"
              ? payloadRec.score
              : 0)
  );
  const verdict = keepExisting
    ? existing.data?.verdict || body.verdict || ""
    : body.verdict ??
      (typeof payloadRec.verdict === "string"
        ? payloadRec.verdict
        : typeof payloadRec.grade === "string"
          ? payloadRec.grade
          : typeof payloadRec.risk_level === "string"
            ? payloadRec.risk_level
            : "");
  const scannedAt = keepExisting
    ? existing.data?.scanned_at || new Date().toISOString()
    : new Date().toISOString();

  await saveScanHistory(user.id, {
    reportId: report_id,
    url: keepExisting && existing.data?.url ? existing.data.url : url,
    score,
    verdict,
    scannedAt,
    payload: payload as ScanReport | Record<string, unknown>,
  });

  return NextResponse.json({ ok: true });
}
