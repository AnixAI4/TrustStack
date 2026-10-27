/**
 * Server-side proxy to the standalone DPDP Scanner service's security-posture
 * endpoint. Mirrors /api/scanner but targets /api/security-scan.
 */
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SERVICE_URL = process.env.SCANNER_SERVICE_URL ?? "http://127.0.0.1:8090";
const SCAN_TIMEOUT_MS = 90_000;

export async function POST(request: Request) {
  let body: { url?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "invalid_request", detail: "Request body must be JSON." },
      { status: 400 }
    );
  }

  const url = (body?.url ?? "").trim();
  if (!url) {
    return NextResponse.json(
      { error: "invalid_request", detail: "A website 'url' is required." },
      { status: 400 }
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SCAN_TIMEOUT_MS);
  try {
    const res = await fetch(`${SERVICE_URL}/api/security-scan`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url }),
      signal: controller.signal,
      cache: "no-store",
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      return NextResponse.json(
        data ?? { error: "scan_failed", detail: `Scanner returned HTTP ${res.status}.` },
        { status: res.status }
      );
    }
    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    const aborted = err instanceof Error && err.name === "AbortError";
    return NextResponse.json(
      {
        error: aborted ? "timeout" : "service_unreachable",
        detail: aborted
          ? "The scan took too long and timed out. Try again."
          : `Could not reach the scanner service at ${SERVICE_URL}. Start it with: cd scanner-agent && python main.py --server`,
      },
      { status: aborted ? 504 : 503 }
    );
  } finally {
    clearTimeout(timeout);
  }
}
