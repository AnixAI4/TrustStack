import { NextResponse, type NextRequest } from "next/server";
import { withScannerSecurity, type ApiContext } from "@/lib/security/api-guard";
import { validateUrl, validateRequestBody } from "@/lib/security/validation";
import { buildPdfPolicyReport } from "@/lib/scanner/pdf-report";
import {
  consumeScan,
  refundScan,
  resolveScanAccess,
  type ScanType,
} from "@/lib/scanner/entitlements";
import { buildUrlScanReport } from "@/lib/scanner/url-report";
import {
  dpdpEngineConfigured,
  runDpdpUrlScan,
  type DpdpUrlScanInput,
} from "@/lib/scanner/dpdp-engine";
import { normalizeDpdpReportContext } from "@/lib/scanner/dpdp-types";
import { getSession } from "@/lib/supabase/server";
import { saveScanHistory } from "@/lib/scanner/scan-report-store";
import type { ScanReport } from "@/content/scanner";
import { randomUUID } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/** DeepSeek assessments regularly exceed 90s — allow the original engine to finish. */
export const maxDuration = 300;

const EXTERNAL_SCANNER_URL = process.env.SCANNER_SERVICE_URL?.trim() || "";
const USE_EXTERNAL =
  process.env.SCANNER_USE_EXTERNAL === "1" && Boolean(EXTERNAL_SCANNER_URL);
const SCAN_TIMEOUT_MS = 90_000;
const MAX_PDF_BYTES = 15 * 1024 * 1024;

/** When the Render/Flask engine restarts or OOMs mid-scan, fall back to the built-in scanner. */
const ENGINE_RECOVERABLE =
  /server restart|interrupted|timed out|engine unavailable|ECONNREFUSED|fetch failed|DPDP engine/i;

async function assertCanScan(
  userId: string
): Promise<{ blocked: NextResponse } | { scanType: ScanType }> {
  const access = await resolveScanAccess(userId);
  if (!access.can_scan || !access.scan_type) {
    return {
      blocked: NextResponse.json(
        {
          error: "quota_exceeded",
          detail: access.message || "No scans remaining.",
          reason: access.reason,
        },
        { status: 402 }
      ),
    };
  }
  return { scanType: access.scan_type };
}

/** Reserve entitlement before the scan runs so parallel requests cannot reuse it. */
async function reserveScan(
  userId: string,
  scanType: ScanType
): Promise<NextResponse | null> {
  const ok = await consumeScan(userId, scanType);
  if (!ok) {
    return NextResponse.json(
      {
        error: "quota_exceeded",
        detail: "Could not reserve a scan. Refresh and try again.",
      },
      { status: 402 }
    );
  }
  return null;
}

function withReportId(report: ScanReport, reportId: string) {
  return { ...report, report_id: reportId };
}


async function extractPdfText(buf: Buffer): Promise<string> {
  // pdf-parse is CJS; dynamic import keeps the route loadable under Turbopack.
  const mod = await import("pdf-parse");
  const pdfParse = (mod as { default?: (b: Buffer) => Promise<{ text: string }> }).default ??
    (mod as unknown as (b: Buffer) => Promise<{ text: string }>);
  const parsed = await pdfParse(buf);
  return (parsed.text || "").trim();
}

async function handlePdfScan(form: FormData, userId: string): Promise<NextResponse> {
  const gate = await assertCanScan(userId);
  if ("blocked" in gate) return gate.blocked;

  const reference = String(form.get("reference") || "").trim();
  if (!reference || reference.length < 2) {
    return NextResponse.json(
      { error: "invalid_request", detail: "Organisation / reference is required." },
      { status: 400 }
    );
  }

  const privacyFile = form.get("privacy_pdf");
  if (!(privacyFile instanceof File) || privacyFile.size === 0) {
    return NextResponse.json(
      { error: "invalid_request", detail: "Privacy Policy PDF is required." },
      { status: 400 }
    );
  }

  async function readPdf(file: FormDataEntryValue | null, label: string): Promise<string | undefined> {
    if (!(file instanceof File) || file.size === 0) return undefined;
    if (file.size > MAX_PDF_BYTES) {
      throw new Error(`${label} exceeds the 15 MB limit.`);
    }
    const name = file.name.toLowerCase();
    if (!name.endsWith(".pdf") && file.type !== "application/pdf") {
      throw new Error(`${label} must be a PDF file.`);
    }
    const buf = Buffer.from(await file.arrayBuffer());
    const text = await extractPdfText(buf);
    if (!text) {
      throw new Error(`Could not extract text from ${label}. Try a text-based PDF.`);
    }
    return text;
  }

  const reserved = await reserveScan(userId, gate.scanType);
  if (reserved) return reserved;

  try {
    const privacyText = await readPdf(privacyFile, "Privacy Policy PDF");
    if (!privacyText) {
      await refundScan(userId, gate.scanType).catch(() => undefined);
      return NextResponse.json(
        { error: "invalid_request", detail: "Privacy Policy PDF is required." },
        { status: 400 }
      );
    }
    const termsText = await readPdf(form.get("terms_pdf"), "Terms of Service PDF");
    const cookieText = await readPdf(form.get("cookie_pdf"), "Cookie Policy PDF");

    const report = buildPdfPolicyReport({
      reference,
      privacyText,
      termsText,
      cookieText,
    });
    const reportId = randomUUID();
    await saveScanHistory(userId, {
      reportId,
      url: report.url,
      score: report.overall_score,
      verdict: report.grade || report.risk_level || "",
      scannedAt: report.scanned_at,
      payload: report,
    });
    return NextResponse.json(withReportId(report, reportId), { status: 200 });
  } catch (err) {
    await refundScan(userId, gate.scanType).catch(() => undefined);
    const message = err instanceof Error ? err.message : "PDF scan failed.";
    return NextResponse.json(
      { error: "pdf_scan_failed", detail: message },
      { status: 400 }
    );
  }
}

async function handleUrlScan(body: unknown, userId: string): Promise<NextResponse> {
  const gate = await assertCanScan(userId);
  if ("blocked" in gate) return gate.blocked;
  const bodyValidation = validateRequestBody<{
    url: string;
    privacy_url?: string;
    terms_url?: string;
    cookie_url?: string;
  }>(body, ["url"]);
  if (!bodyValidation.valid) {
    return NextResponse.json(
      { error: "invalid_request", detail: bodyValidation.error },
      { status: 400 }
    );
  }

  const urlValidation = validateUrl(bodyValidation.data!.url);
  if (!urlValidation.valid) {
    return NextResponse.json(
      { error: "invalid_request", detail: urlValidation.error },
      { status: 400 }
    );
  }

  const url = urlValidation.sanitized!;
  const payload: DpdpUrlScanInput = { url };
  const optional = body as {
    privacy_url?: string;
    terms_url?: string;
    cookie_url?: string;
  };
  for (const key of ["privacy_url", "terms_url", "cookie_url"] as const) {
    const raw = optional[key]?.trim();
    if (!raw) continue;
    const check = validateUrl(raw);
    if (!check.valid || !check.sanitized) {
      return NextResponse.json(
        { error: "invalid_request", detail: `Invalid ${key.replace("_", " ")}.` },
        { status: 400 }
      );
    }
    payload[key] = check.sanitized;
  }

  const blockedPatterns = [
    /^https?:\/\/localhost/i,
    /^https?:\/\/127\./,
    /^https?:\/\/192\.168\./,
    /^https?:\/\/10\./,
    /^https?:\/\/172\.(1[6-9]|2[0-9]|3[01])\./,
    /^https?:\/\/\[::1\]/,
    /^https?:\/\/0\.0\.0\.0/,
  ];

  for (const pattern of blockedPatterns) {
    if (pattern.test(url)) {
      return NextResponse.json(
        { error: "invalid_request", detail: "Cannot scan internal or local addresses." },
        { status: 400 }
      );
    }
  }

  const reserved = await reserveScan(userId, gate.scanType);
  if (reserved) return reserved;

  try {
    // Prefer the original DPDP Flask engine (DeepSeek + Rules checklist) so
    // scores / report sections / PDF match dpdp_comp exactly.
    let engineResult: Awaited<ReturnType<typeof runDpdpUrlScan>> | null = null;

    if (dpdpEngineConfigured()) {
      const session = await getSession();
      const accessToken = session?.access_token;
      if (!accessToken) {
        await refundScan(userId, gate.scanType).catch(() => undefined);
        return NextResponse.json(
          {
            error: "unauthorized",
            detail: "Session expired. Sign in again to run an assessment.",
          },
          { status: 401 }
        );
      }

      try {
        engineResult = await runDpdpUrlScan(payload, accessToken);
      } catch (engineErr) {
        const msg =
          engineErr instanceof Error ? engineErr.message : String(engineErr);
        if (!ENGINE_RECOVERABLE.test(msg)) throw engineErr;
        console.warn(
          "[scanner] DPDP engine failed; falling back to built-in scanner:",
          msg
        );
      }
    }

    if (engineResult) {
      const result = engineResult;
      const context =
        normalizeDpdpReportContext(result.context, result.report_id) ||
        result.context;
      await saveScanHistory(userId, {
        reportId: result.report_id,
        url: result.url,
        score: result.score,
        verdict: result.verdict,
        scannedAt: context.report?.timestamp || new Date().toISOString(),
        payload: context,
      });

      return NextResponse.json(
        {
          engine: "dpdp_comp",
          report_id: result.report_id,
          url: result.url,
          overall_score: result.score,
          grade: result.verdict,
          risk_level: result.verdict,
          verdict: result.verdict,
          scanned_at: context.report?.timestamp || new Date().toISOString(),
          // Keep a thin ScanReport-shaped shell so older clients don't crash;
          // the dedicated report page loads the full DpdpReportContext by id.
          summary: result.verdict,
          categories: [],
          findings: [],
          cookies: [],
          trackers: [],
          policies: [],
          meta: {
            https: true,
            status: 200,
            consent_banner_detected: Boolean(
              context.report?.cookie_banner_found
            ),
            security_headers: {},
            cookies_total: 0,
            third_party_trackers: 0,
            model_mode: "deepseek",
            engine: "dpdp_comp",
            notes: ["Assessed with the original DPDP Rules + DeepSeek engine."],
          },
          context,
        },
        { status: 200 }
      );
    }

    let report: ScanReport;

    if (USE_EXTERNAL) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), SCAN_TIMEOUT_MS);
      try {
        const res = await fetch(`${EXTERNAL_SCANNER_URL}/api/scan`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
          signal: controller.signal,
          cache: "no-store",
        });
        const data = await res.json().catch(() => null);
        if (!res.ok || !data) {
          throw new Error(
            (data as { detail?: string } | null)?.detail ||
              `External scanner returned HTTP ${res.status}.`
          );
        }
        report = data as ScanReport;
      } finally {
        clearTimeout(timeout);
      }
    } else {
      report = await buildUrlScanReport(payload);
    }

    const reportId =
      (report as ScanReport & { report_id?: string }).report_id || randomUUID();
    await saveScanHistory(userId, {
      reportId,
      url: report.url,
      score: report.overall_score,
      verdict: report.grade || report.risk_level || "",
      scannedAt: report.scanned_at,
      payload: report,
    });
    return NextResponse.json(withReportId(report, reportId), { status: 200 });
  } catch (err) {
    await refundScan(userId, gate.scanType).catch(() => undefined);
    const aborted = err instanceof Error && err.name === "AbortError";
    const message =
      err instanceof Error ? err.message : "Scan failed unexpectedly.";
    const engineDown =
      /ECONNREFUSED|fetch failed|Failed to fetch|DPDP engine/i.test(message);
    return NextResponse.json(
      {
        error: aborted ? "timeout" : engineDown ? "engine_unavailable" : "scan_failed",
        detail: aborted
          ? "The scan took too long and timed out. Try again."
          : engineDown
            ? "The DPDP assessment engine is not running. Start the dpdp_comp Flask API on port 5000, then retry."
            : message,
      },
      { status: aborted ? 504 : 502 }
    );
  }
}

async function handleScan(
  request: NextRequest,
  { user }: ApiContext
): Promise<NextResponse> {
  if (!user) {
    return NextResponse.json(
      { error: "unauthorized", detail: "Authentication required to use scanner." },
      { status: 401 }
    );
  }

  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    return handlePdfScan(form, user.id);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "invalid_request", detail: "Request body must be JSON or multipart form data." },
      { status: 400 }
    );
  }

  return handleUrlScan(body, user.id);
}

export const POST = withScannerSecurity(handleScan);
