import { NextResponse, type NextRequest } from "next/server";
import { createClient, getSession } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  dpdpEngineConfigured,
  fetchDpdpReportPdf,
} from "@/lib/scanner/dpdp-engine";
import { isDpdpReportContext } from "@/lib/scanner/dpdp-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * PDF download - always prefer the original Flask WeasyPrint/xhtml2pdf output.
 * Flask enforces report ownership via the user JWT.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  const { reportId: rawId } = await params;
  const reportId = decodeURIComponent(rawId || "").trim();
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
    return NextResponse.json(
      { error: "unauthorized", detail: "Sign in to download the PDF." },
      { status: 401 }
    );
  }

  const session = await getSession();
  const token = session?.access_token;
  if (!token) {
    return NextResponse.json(
      { error: "unauthorized", detail: "Session expired. Sign in again." },
      { status: 401 }
    );
  }

  // Original engine PDF first - do not gate on user_scans shape/RLS.
  // Flask already checks owner + premium unlock.
  if (dpdpEngineConfigured()) {
    try {
      const { bytes, filename } = await fetchDpdpReportPdf(reportId, token);
      return new NextResponse(bytes, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Cache-Control": "no-store",
        },
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "PDF download failed.";
      const status = /not found|No such file|Errno 2/i.test(message)
        ? 404
        : /Premium|402|unlock/i.test(message)
          ? 402
          : /Sign in|ACCESS_DENIED|403/i.test(message)
            ? 403
            : 502;
      console.error("[scanner/pdf] Flask PDF failed:", message);
      // Fall through only for legacy TrustStack heuristic reports.
      if (status !== 502 && !/ECONNREFUSED|fetch failed|engine/i.test(message)) {
        return NextResponse.json(
          {
            error: status === 404 ? "not_found" : "pdf_failed",
            detail:
              status === 404
                ? "This scan report is no longer on the local scanner disk. Run a new scan, then download the PDF again."
                : message,
          },
          { status }
        );
      }
      console.warn(
        "[scanner/pdf] Engine unreachable - checking for legacy payload PDF path."
      );
    }
  }

  // Legacy heuristic reports: confirm ownership in user_scans.
  let owned = false;
  let payload: unknown = null;

  const { data: item, error: itemErr } = await supabase
    .from("user_scans")
    .select("report_id, payload")
    .eq("user_id", user.id)
    .eq("report_id", reportId)
    .maybeSingle();

  if (itemErr) {
    console.error("[scanner/pdf] user_scans read failed:", itemErr.message);
  }
  if (item?.report_id) {
    owned = true;
    payload = item.payload;
  }

  if (!owned) {
    const admin = createAdminClient();
    if (admin) {
      const { data: adminItem } = await admin
        .from("user_scans")
        .select("report_id, payload")
        .eq("user_id", user.id)
        .eq("report_id", reportId)
        .maybeSingle();
      if (adminItem?.report_id) {
        owned = true;
        payload = adminItem.payload ?? payload;
      }
    }
  }

  if (!owned) {
    return NextResponse.json(
      {
        error: "not_found",
        detail: "Report not found for your account.",
      },
      { status: 404 }
    );
  }

  if (isDpdpReportContext(payload)) {
    return NextResponse.json(
      {
        error: "engine_unavailable",
        detail:
          "The DPDP PDF engine is not reachable. Keep the Flask API on port 5000 running, then retry Download PDF.",
      },
      { status: 503 }
    );
  }

  return NextResponse.json(
    {
      error: "pdf_unavailable",
      detail:
        "PDF for this assessment is unavailable. Re-run the scan with the DPDP engine running.",
    },
    { status: 404 }
  );
}
