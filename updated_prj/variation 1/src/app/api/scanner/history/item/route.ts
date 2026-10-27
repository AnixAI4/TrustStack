import { NextResponse, type NextRequest } from "next/server";
import { createClient, getSession } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  dpdpEngineConfigured,
  fetchDpdpReportContext,
} from "@/lib/scanner/dpdp-engine";
import {
  isDpdpReportContext,
  normalizeDpdpReportContext,
  type DpdpReportContext,
} from "@/lib/scanner/dpdp-types";
import { recoverDpdpFromMirror } from "@/lib/scanner/scan-report-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type HistoryItem = {
  report_id: string;
  url: string;
  score: number;
  verdict: string;
  scanned_at: string;
  payload: unknown;
};

async function backfillPayload(
  userId: string,
  item: HistoryItem
): Promise<void> {
  const clients = [createAdminClient(), await createClient()].filter(
    (c): c is NonNullable<typeof c> => Boolean(c)
  );
  for (const supabase of clients) {
    const { error } = await supabase.from("user_scans").upsert(
      {
        user_id: userId,
        report_id: item.report_id,
        url: item.url,
        score: item.score,
        verdict: item.verdict,
        scanned_at: item.scanned_at,
        payload: item.payload,
      },
      { onConflict: "user_id,report_id" }
    );
    if (!error) return;
    console.warn("[scanner/history/item] backfill failed:", error.message);
  }
}

function buildItemFromContext(
  reportId: string,
  context: DpdpReportContext,
  item: HistoryItem | null
): HistoryItem {
  return {
    report_id: reportId,
    url: item?.url || context.report?.url || "",
    score: item?.score ?? context.score,
    verdict: item?.verdict || context.verdict,
    scanned_at:
      item?.scanned_at ||
      context.report?.timestamp ||
      new Date().toISOString(),
    payload: context,
  };
}

/** Fetch a single saved scan — full report on any device for the same account. */
export async function GET(request: NextRequest) {
  const reportId = request.nextUrl.searchParams.get("report_id")?.trim();
  if (!reportId) {
    return NextResponse.json(
      { error: "invalid_request", detail: "report_id is required." },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("user_scans")
    .select("report_id, url, score, verdict, scanned_at, payload")
    .eq("user_id", user.id)
    .eq("report_id", reportId)
    .maybeSingle();

  let item: HistoryItem | null = null;

  if (error) {
    const fallback = await supabase
      .from("user_scans")
      .select("report_id, url, score, verdict, scanned_at")
      .eq("user_id", user.id)
      .eq("report_id", reportId)
      .maybeSingle();
    if (!fallback.error && fallback.data) {
      item = { ...fallback.data, payload: null };
    }
  } else if (data) {
    item = data;
  }

  // Fast path: payload already stored on this user's scan row.
  const stored = normalizeDpdpReportContext(item?.payload, reportId);
  if (stored) {
    return NextResponse.json({
      item: buildItemFromContext(reportId, stored, item),
    });
  }

  // Supabase scan_reports mirror (no Flask dependency — works cross-device).
  const mirrored = await recoverDpdpFromMirror(reportId);
  if (mirrored) {
    const recovered = buildItemFromContext(reportId, mirrored, item);
    void backfillPayload(user.id, recovered);
    return NextResponse.json({ item: recovered });
  }

  // Flask engine: disk → scan_reports (legacy recovery path).
  if (dpdpEngineConfigured()) {
    try {
      const session = await getSession();
      const token = session?.access_token;
      if (token) {
        const context = await fetchDpdpReportContext(reportId, token);
        if (isDpdpReportContext(context)) {
          const recovered = buildItemFromContext(reportId, context, item);
          void backfillPayload(user.id, recovered);
          return NextResponse.json({ item: recovered });
        }
      }
    } catch (err) {
      console.warn(
        "[scanner/history/item] engine recovery failed:",
        err instanceof Error ? err.message : err
      );
    }
  }

  if (!item) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ item });
}
