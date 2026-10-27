import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { defaultLocale, isLocale } from "@/i18n/locales";
import { ManagerRequestSchema } from "@/lib/security-compliance-contract";
import {
  ManagerServiceError,
  analyzeSecurityReport,
  answerSecurityReportQuestion,
  getManagerConfig,
} from "@/lib/server/security-compliance-manager";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 256 * 1024;
const RATE_WINDOW_MS = 10 * 60 * 1_000;

type RateEntry = { count: number; resetAt: number };

// Demo-only process-local limiting. Production needs a shared store or gateway policy.
const rateEntries = new Map<string, RateEntry>();

function json(data: unknown, status = 200, runId?: string) {
  const headers = new Headers({ "Cache-Control": "no-store" });
  if (runId) headers.set("X-Compliance-Run-Id", runId);
  return NextResponse.json(data, { status, headers });
}

function errorResponse(
  error: ManagerServiceError["code"],
  detail: string,
  status: number,
  runId: string
) {
  return json({ error, detail, runId }, status, runId);
}

function clientAddress(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return (forwarded || request.headers.get("x-real-ip") || "local").slice(0, 200);
}

function takeRateSlot(key: string, limit: number): boolean {
  const now = Date.now();
  for (const [entryKey, entry] of rateEntries) {
    if (entry.resetAt <= now) rateEntries.delete(entryKey);
  }

  const existing = rateEntries.get(key);
  if (!existing) {
    rateEntries.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (existing.count >= limit) return false;
  existing.count += 1;
  return true;
}

export async function GET() {
  return json(getManagerConfig());
}

export async function POST(request: Request) {
  const runId = randomUUID();
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
  if (!contentType.includes("application/json")) {
    return errorResponse(
      "invalid_request",
      "Request content type must be application/json.",
      400,
      runId
    );
  }

  const declaredLength = Number.parseInt(request.headers.get("content-length") ?? "0", 10);
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return errorResponse(
      "request_too_large",
      "The request exceeds the 256 KB demo limit.",
      413,
      runId
    );
  }

  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return errorResponse("invalid_request", "The request body could not be read.", 400, runId);
  }
  if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) {
    return errorResponse(
      "request_too_large",
      "The request exceeds the 256 KB demo limit.",
      413,
      runId
    );
  }

  let input: unknown;
  try {
    input = JSON.parse(rawBody) as unknown;
  } catch {
    return errorResponse("invalid_request", "Request body must be valid JSON.", 400, runId);
  }

  const parsed = ManagerRequestSchema.safeParse(input);
  if (!parsed.success) {
    return errorResponse(
      "invalid_request",
      "The request did not match the compliance manager contract.",
      400,
      runId
    );
  }

  const actionLimit = parsed.data.action === "analyze" ? 5 : 10;
  const rateKey = `${parsed.data.action}:${clientAddress(request)}`;
  if (!takeRateSlot(rateKey, actionLimit)) {
    return errorResponse(
      "rate_limited",
      "This demo has received too many requests from this client. Try again later.",
      429,
      runId
    );
  }

  const locale = isLocale(parsed.data.locale) ? parsed.data.locale : defaultLocale;
  try {
    if (parsed.data.action === "analyze") {
      const analysis = await analyzeSecurityReport({ ...parsed.data, locale }, runId);
      return json(analysis, 200, runId);
    }
    const answer = await answerSecurityReportQuestion({ ...parsed.data, locale }, runId);
    return json(answer, 200, runId);
  } catch (error) {
    if (error instanceof ManagerServiceError) {
      console.info(
        `[security-compliance-manager] run=${runId} action=${parsed.data.action} code=${error.code} status=${error.status}`
      );
      return errorResponse(error.code, error.message, error.status, runId);
    }
    console.error(
      `[security-compliance-manager] run=${runId} action=${parsed.data.action} code=provider_unavailable status=502`
    );
    return errorResponse(
      "provider_unavailable",
      "The compliance manager could not complete this request.",
      502,
      runId
    );
  }
}