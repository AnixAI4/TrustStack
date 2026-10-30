import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

/**
 * The spec's response envelope (docs/spec/02_*.md §Standard API Response Format).
 * Every /api/v1 route responds through these two helpers — never a bare JSON body.
 */

export type ApiErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "TENANT_ACCESS_DENIED"
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "CONFLICT"
  | "INVITE_INVALID"
  | "INVITE_EXPIRED"
  | "LAST_ORGANIZATION_ADMIN"
  | "EMAIL_DELIVERY_FAILED"
  // Slice 10 Stage 3a: public intake — too many attempts, and a code or submission that is spent.
  | "RATE_LIMITED"
  | "GONE"
  // Slice 11 Stage 1a: the AI assistant is off (platform, organisation, sector or SDF hold);
  // its answer failed a guardrail and was not kept; the provider could not be reached.
  | "AI_DISABLED"
  | "AI_ANSWER_REJECTED"
  | "AI_UNAVAILABLE"
  | "INTERNAL_ERROR";

export interface ApiErrorDetail {
  field?: string;
  issue: string;
}

export interface ApiMeta {
  requestId: string;
  timestamp: string;
}

export type ApiSuccess<T> = { success: true; data: T; meta: ApiMeta };
export type ApiFailure = {
  success: false;
  error: { code: ApiErrorCode; message: string; details: ApiErrorDetail[] };
  meta: ApiMeta;
};

function meta(request?: Request): ApiMeta {
  const incoming = request?.headers.get("x-request-id");
  return {
    requestId: incoming && /^[\w-]{1,64}$/.test(incoming) ? incoming : `req_${randomUUID()}`,
    timestamp: new Date().toISOString(),
  };
}

export function ok<T>(data: T, request?: Request, init?: ResponseInit) {
  const body: ApiSuccess<T> = { success: true, data, meta: meta(request) };
  return NextResponse.json(body, { status: 200, ...init, headers: noStore(init?.headers) });
}

export function fail(
  status: number,
  code: ApiErrorCode,
  message: string,
  request?: Request,
  details: ApiErrorDetail[] = [],
  headers?: HeadersInit,
) {
  const body: ApiFailure = { success: false, error: { code, message, details }, meta: meta(request) };
  return NextResponse.json(body, { status, headers: noStore(headers) });
}

function noStore(headers?: HeadersInit): Headers {
  const h = new Headers(headers);
  h.set("Cache-Control", "no-store");
  return h;
}
