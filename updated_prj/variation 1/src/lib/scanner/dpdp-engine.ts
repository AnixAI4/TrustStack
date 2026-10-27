/**
 * Client for the original DPDP Flask scan engine (DeepSeek + condensed Rules).
 * TrustStack UI stays; scoring / report JSON / PDF come from dpdp_comp unchanged.
 */
import {
  normalizeDpdpReportContext,
  type DpdpReportContext,
} from "@/lib/scanner/dpdp-types";

const DEFAULT_ENGINE = "http://127.0.0.1:5000";
const POLL_MS = 1200;
const MAX_WAIT_MS = 6 * 60 * 1000;

export function dpdpEngineConfigured(): boolean {
  // Default ON - use the original engine unless explicitly disabled.
  if (process.env.DPDP_ENGINE_ENABLED === "0") return false;
  const key = process.env.DPDP_ENGINE_API_KEY || process.env.DPDP_API_KEY;
  return Boolean(key);
}

function engineBase(): string {
  return (
    process.env.DPDP_ENGINE_URL?.trim() ||
    process.env.SCANNER_SERVICE_URL?.trim() ||
    DEFAULT_ENGINE
  ).replace(/\/$/, "");
}

function engineKey(): string {
  const key = process.env.DPDP_ENGINE_API_KEY || process.env.DPDP_API_KEY || "";
  if (!key) throw new Error("DPDP_ENGINE_API_KEY is not configured.");
  return key;
}

function headers(accessToken: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    "X-API-Key": engineKey(),
    "X-TrustStack-Proxy": "1",
    Authorization: `Bearer ${accessToken}`,
  };
}

async function readJson(res: Response): Promise<Record<string, unknown>> {
  const data = (await res.json().catch(() => null)) as Record<string, unknown> | null;
  if (!res.ok) {
    const detail =
      (typeof data?.error === "string" && data.error) ||
      (typeof data?.detail === "string" && data.detail) ||
      `DPDP engine HTTP ${res.status}`;
    throw new Error(detail);
  }
  return data || {};
}

export type DpdpUrlScanInput = {
  url: string;
  privacy_url?: string;
  terms_url?: string;
  cookie_url?: string;
};

export type DpdpScanResult = {
  report_id: string;
  score: number;
  verdict: string;
  url: string;
  context: DpdpReportContext;
};

/** Start job → poll → fetch full ReportContext (original engine). */
export async function runDpdpUrlScan(
  input: DpdpUrlScanInput,
  accessToken: string
): Promise<DpdpScanResult> {
  const base = engineBase();

  const startRes = await fetch(`${base}/api/scan`, {
    method: "POST",
    headers: headers(accessToken),
    body: JSON.stringify({
      input_mode: "url",
      url: input.url,
      privacy_url: input.privacy_url || "",
      terms_url: input.terms_url || "",
      cookie_url: input.cookie_url || "",
    }),
    cache: "no-store",
  });
  const started = await readJson(startRes);
  const jobId = String(started.job_id || "");
  if (!jobId) throw new Error("DPDP engine did not return a job_id.");

  const deadline = Date.now() + MAX_WAIT_MS;
  let reportId = "";
  let score = 0;
  let verdict = "";
  let url = input.url;

  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, POLL_MS));
    const stRes = await fetch(`${base}/api/scan/${encodeURIComponent(jobId)}`, {
      headers: headers(accessToken),
      cache: "no-store",
    });
    const st = await readJson(stRes);
    const status = String(st.status || "");
    if (status === "error") {
      throw new Error(String(st.error || "DPDP engine scan failed."));
    }
    if (status === "complete") {
      reportId = String(st.report_id || "");
      score = Number(st.score ?? 0);
      verdict = String(st.verdict || "");
      url = String(st.url || input.url);
      break;
    }
  }

  if (!reportId) {
    throw new Error(
      "DPDP engine timed out before the assessment finished. Try again shortly."
    );
  }

  const reportRes = await fetch(
    `${base}/api/report/${encodeURIComponent(reportId)}`,
    {
      headers: headers(accessToken),
      cache: "no-store",
    }
  );
  const raw = await readJson(reportRes);
  const context = normalizeDpdpReportContext(
    {
      ...raw,
      engine: "dpdp_comp",
      report_id: reportId,
      score: asNumber(raw.score) ?? score,
      verdict: String(raw.verdict || verdict),
    },
    reportId
  );
  if (!context) {
    throw new Error("DPDP engine returned an incomplete report payload.");
  }

  return {
    report_id: reportId,
    score: context.score,
    verdict: context.verdict,
    url: String(context.report?.url || url),
    context,
  };
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return null;
}

/** Proxy original WeasyPrint/xhtml2pdf report bytes. */
export async function fetchDpdpReportPdf(
  reportId: string,
  accessToken: string
): Promise<{ bytes: ArrayBuffer; filename: string }> {
  const base = engineBase();
  const res = await fetch(
    `${base}/api/report/${encodeURIComponent(reportId)}/pdf`,
    {
      headers: {
        "X-API-Key": engineKey(),
        "X-TrustStack-Proxy": "1",
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    }
  );
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as {
      error?: string;
      code?: string;
    } | null;
    throw new Error(
      data?.error ||
        (res.status === 402
          ? "PDF unlock required for this report."
          : `PDF download failed (HTTP ${res.status}).`)
    );
  }
  const disp = res.headers.get("content-disposition") || "";
  const match = /filename="?([^"]+)"?/i.exec(disp);
  const filename = match?.[1] || `DPDP-Report-${reportId}.pdf`;
  return { bytes: await res.arrayBuffer(), filename };
}

export async function fetchDpdpReportContext(
  reportId: string,
  accessToken: string
): Promise<DpdpReportContext> {
  const base = engineBase();
  const res = await fetch(
    `${base}/api/report/${encodeURIComponent(reportId)}`,
    {
      headers: headers(accessToken),
      cache: "no-store",
    }
  );
  const raw = await readJson(res);
  const context = normalizeDpdpReportContext(
    { ...raw, engine: "dpdp_comp", report_id: reportId },
    reportId
  );
  if (!context) {
    throw new Error("DPDP engine returned an incomplete report payload.");
  }
  return context;
}
