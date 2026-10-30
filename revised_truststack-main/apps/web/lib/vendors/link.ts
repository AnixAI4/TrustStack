import "server-only";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import {
  EVIDENCE_CONTENT_TYPES,
  EVIDENCE_MAX_BYTES,
  isIntakeCode,
  isVendorLinkToken,
  maskEmail,
  sanitiseEvidenceFileName,
  VENDOR_LIMITS,
  VENDOR_LINK_LIMITS,
  VENDOR_LINK_REFUSAL,
  VENDOR_LINK_REFUSAL_STATUS,
  VENDOR_QUESTION_CODES,
  vendorLinkPath,
  type VendorLinkRefusal,
} from "@truststack/core";
import { z } from "zod";
import { ApiError, type PublicContext, type TenantContext } from "@/lib/api/guard";
import { fail, ok, type ApiErrorCode } from "@/lib/api/envelope";
import { readCookie } from "@/lib/auth/active-organization";
import { EmailDeliveryError, EmailNotConfiguredError, sendEmail } from "@/lib/email/send";
import { renderVendorLinkCodeEmail, renderVendorLinkEmail } from "@/lib/email/templates/vendor-link";
import { clientKey, generateIntakeCode } from "@/lib/intake/keys";
import {
  addVendorLinkDocument,
  attachVendorLinkDocument,
  confirmVendorLink,
  saveVendorLink,
  sendVendorLinkCode,
  signVendorUpload,
  submitVendorLink,
  viewVendorLink,
  type VendorLinkEntry,
  type VendorLinkHeader,
} from "@/lib/intake/rpc";
import { appOrigin } from "@/lib/invites/deliver";
import { activeMembers } from "@/lib/gaps/shape";
import { todayInIndia } from "@/lib/ropa/shape";
import { readAssessmentDetail } from "./shape";

/**
 * The vendor-facing questionnaire link (Slice 10, Stage 4b; SLICE_10 §7b).
 *
 * Staff send it (`send_vendor_link`, as the user, vendor.assess) and revoke it.
 * The respondent's steps — view, code, confirm, save, upload, attach, submit —
 * go through the one door (`lib/intake/rpc.ts`, the service role) to seven
 * database functions that re-check the token, its expiry, revocation and lock,
 * that the assessment is still open to answers, and the respondent's session.
 *
 * Three secrets, each stored only as a SHA-256 hash: the link's token (in the
 * emailed URL), the six-digit code (emailed when the page is opened) and the
 * respondent's session (an HttpOnly cookie set when the right code is entered
 * — so a forwarded link is useless without the respondent's mailbox).
 */

// ---------------------------------------------------------------------------
// Keys
// ---------------------------------------------------------------------------

const sha256 = (value: string) => createHash("sha256").update(value, "utf8").digest("hex");

/** 32 random bytes, base64url: the link's token. Lives in the email and nowhere else. */
export function generateLinkToken(): string {
  return randomBytes(32).toString("base64url");
}

export const hashLinkToken = sha256;

/** Salted with the token's hash, so one code's hash matches no other link. */
export function hashLinkCode(tokenHash: string, code: string): string {
  return sha256(`${tokenHash}:${code}`);
}

/** One cookie per link, so a respondent answering for two organisations keeps both sessions. */
export function sessionCookieName(tokenHash: string): string {
  return `ts_vl_${tokenHash.slice(0, 16)}`;
}

/** A session cookie's value, hashed — or null when it is missing or malformed. */
export function sessionHashOf(raw: string | undefined): string | null {
  return raw && /^[A-Za-z0-9_-]{43}$/.test(raw) ? sha256(raw) : null;
}

/** The session cookie's hash, or null when this browser has not entered the code. */
export function sessionHashFrom(request: Request, tokenHash: string): string | null {
  return sessionHashOf(readCookie(request, sessionCookieName(tokenHash)));
}

/** An unknown or malformed token is the same "not found" as an expired, revoked, used or locked link. */
function tokenOrNotFound(raw: string | undefined): { token: string; tokenHash: string } {
  if (!raw || !isVendorLinkToken(raw)) throw refusalError("not_found");
  return { token: raw, tokenHash: hashLinkToken(raw) };
}

// ---------------------------------------------------------------------------
// Refusals and errors
// ---------------------------------------------------------------------------

const REFUSAL_CODE: Record<VendorLinkRefusal, ApiErrorCode> = {
  not_found: "NOT_FOUND",
  unconfirmed: "UNAUTHENTICATED",
  rate_limited: "RATE_LIMITED",
  wrong_code: "VALIDATION_ERROR",
  code_expired: "GONE",
  locked: "GONE",
  too_many_documents: "CONFLICT",
};

/** `details[0].issue` carries the outcome, so the page knows what to offer next. */
function refusalError(outcome: VendorLinkRefusal, message: string = VENDOR_LINK_REFUSAL[outcome]): ApiError {
  return new ApiError(VENDOR_LINK_REFUSAL_STATUS[outcome], REFUSAL_CODE[outcome], message, [{ field: "outcome", issue: outcome }]);
}

function refuse(request: Request, outcome: VendorLinkRefusal, message?: string): Response {
  const e = refusalError(outcome, message);
  return fail(e.status, e.code, e.message, request, e.details, outcome === "rate_limited" ? { "Retry-After": "3600" } : undefined);
}

/** Postgres errors from the link functions: a rule the page should have caught is a 4xx, never a 500. */
function linkDbError(error: { code?: string; message: string }): Error {
  if (error.code === "TS422") return new ApiError(422, "VALIDATION_ERROR", error.message);
  if (error.code === "TS404") return refusalError("not_found");
  if (error.code === "TS409") return new ApiError(409, "CONFLICT", error.message);
  if (error.code === "23514" || error.code === "22001" || error.code === "22P02") {
    return new ApiError(400, "VALIDATION_ERROR", "A value is too long or not allowed.");
  }
  return new Error(error.message);
}

const rpc = <T>(promise: Promise<T>) =>
  promise.catch((error) => {
    throw linkDbError(error);
  });

/** What a page may see of the header: the respondent's address masked. */
export function publicHeader(h: VendorLinkHeader) {
  return {
    organization: h.organization,
    vendor: h.vendor,
    version: h.version,
    respondentName: h.respondentName,
    respondentEmail: maskEmail(h.respondentEmail),
    expiresAt: h.expiresAt,
  };
}

// ---------------------------------------------------------------------------
// Bodies
// ---------------------------------------------------------------------------

const linkEntrySchema = z
  .object({
    code: z.enum(VENDOR_QUESTION_CODES as [string, ...string[]]),
    answer: z.string().trim().max(VENDOR_LIMITS.textAnswer).nullable().optional(),
    notApplicable: z.boolean().default(false),
    naReason: z.string().trim().max(VENDOR_LIMITS.naReason).nullable().optional(),
    /** Absent keeps the document cited now (one the organisation holds stays cited); null clears it. */
    evidenceId: z.uuid().nullable().optional(),
  })
  .strict();

export const linkSaveBody = z.object({ answers: z.array(linkEntrySchema).max(VENDOR_QUESTION_CODES.length) }).strict();
export const linkConfirmBody = z
  .object({ code: z.string().trim().refine(isIntakeCode, "Enter the six-digit code from the email.") })
  .strict();
export const linkDocumentBody = z
  .object({
    fileName: z.string().trim().min(1).max(255),
    contentType: z.enum(EVIDENCE_CONTENT_TYPES),
    byteSize: z.number().int().min(1).max(EVIDENCE_MAX_BYTES),
  })
  .strict();
export const linkSubmitBody = z
  .object({
    declaredName: z.string().trim().min(1).max(VENDOR_LINK_LIMITS.name),
    declaredRole: z.string().trim().min(1).max(VENDOR_LINK_LIMITS.name),
    /** The declaration, ticked: "These answers are accurate and complete." */
    accurate: z.literal(true, { error: "Confirm the declaration before submitting." }),
  })
  .strict();

export const sendLinkBody = z
  .object({
    respondentName: z.string().trim().min(1).max(VENDOR_LINK_LIMITS.name),
    respondentEmail: z.email().max(320),
  })
  .strict();

type Pub<B> = PublicContext<B, unknown>;

// ---------------------------------------------------------------------------
// Email
// ---------------------------------------------------------------------------

/** A failure is reported, never thrown: the link or the code stays, and can be sent again. Nothing secret is logged. */
async function deliver(message: { to: string; subject: string; html: string; text: string; idempotencyKey: string }) {
  try {
    await sendEmail(message);
    return true;
  } catch (error) {
    if (error instanceof EmailDeliveryError || error instanceof EmailNotConfiguredError) {
      console.error("[vendor-link] email not sent:", error.message);
      return false;
    }
    throw error;
  }
}

// ---------------------------------------------------------------------------
// The respondent's steps — public, through the one door
// ---------------------------------------------------------------------------

export const vendorLink = {
  /** GET /api/v1/vendor-links/{token} — the header, and the questionnaire once this browser entered the code. */
  view: {
    options: { auth: "public" } as const,
    handler: async ({ request, params }: Pub<undefined>) => {
      const { tokenHash } = tokenOrNotFound(params.token);
      const view = await rpc(viewVendorLink(tokenHash, sessionHashFrom(request, tokenHash)));
      if (view.status === "not_found") return refuse(request, "not_found");
      if (view.status === "unconfirmed") return ok({ status: view.status, ...publicHeader(view) }, request);
      const { answers, documents, missing } = view;
      return ok({ status: view.status, ...publicHeader(view), answers, documents, missing }, request);
    },
  },

  /** POST …/code — email a six-digit code to the address the link was sent to (never another). */
  sendCode: {
    options: { auth: "public" } as const,
    handler: async ({ request, params }: Pub<undefined>) => {
      const { tokenHash } = tokenOrNotFound(params.token);
      const code = generateIntakeCode();
      const codeHash = hashLinkCode(tokenHash, code);
      const result = await rpc(sendVendorLinkCode(tokenHash, clientKey(request), codeHash));
      if (result.status !== "sent") return refuse(request, result.status);
      const message = renderVendorLinkCodeEmail({ organizationName: result.organization.name, vendorName: result.vendor.name, code });
      const emailed = await deliver({ to: result.respondentEmail, ...message, idempotencyKey: `vendor-link-code:${codeHash.slice(0, 32)}` });
      return ok({ email: maskEmail(result.respondentEmail), codeExpiresAt: result.codeExpiresAt, emailed }, request, { status: 202 });
    },
  },

  /** POST …/confirm — the code: this browser's session becomes the respondent's (an HttpOnly cookie, until the link expires). */
  confirm: {
    options: { auth: "public", body: linkConfirmBody } as const,
    handler: async ({ request, params, body }: Pub<z.infer<typeof linkConfirmBody>>) => {
      const { tokenHash } = tokenOrNotFound(params.token);
      const session = randomBytes(32).toString("base64url");
      const result = await rpc(confirmVendorLink(tokenHash, hashLinkCode(tokenHash, body.code), hashLinkToken(session)));
      if (result.status === "wrong_code") {
        return refuse(request, "wrong_code", `${VENDOR_LINK_REFUSAL.wrong_code} ${result.attemptsLeft} ${result.attemptsLeft === 1 ? "try" : "tries"} left.`);
      }
      if (result.status !== "confirmed") return refuse(request, result.status);
      const response = ok({ confirmed: true, expiresAt: result.expiresAt }, request);
      response.cookies.set(sessionCookieName(tokenHash), session, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        // Lax, not Strict: the respondent arrives from an email — a cross-site navigation.
        sameSite: "lax",
        path: "/",
        expires: new Date(result.expiresAt),
      });
      return response;
    },
  },

  /** PATCH /api/v1/vendor-links/{token} — save answers (attributed to the vendor's respondent). */
  save: {
    options: { auth: "public", body: linkSaveBody } as const,
    handler: async ({ request, params, body }: Pub<z.infer<typeof linkSaveBody>>) => {
      const { tokenHash } = tokenOrNotFound(params.token);
      const answers: VendorLinkEntry[] = body.answers.map((a) => {
        const answer = a.answer === "" ? null : (a.answer ?? null);
        return {
          code: a.code,
          answer: a.notApplicable ? null : answer,
          notApplicable: a.notApplicable,
          naReason: a.notApplicable ? (a.naReason ?? null) : null,
          ...(a.evidenceId !== undefined ? { evidenceId: a.notApplicable ? null : a.evidenceId } : {}),
        };
      });
      const result = await rpc(saveVendorLink(tokenHash, sessionHashFrom(request, tokenHash), answers));
      if (result.status !== "saved") return refuse(request, result.status);
      const { answers: saved, documents, missing } = result;
      return ok({ status: "open", ...publicHeader(result), answers: saved, documents, missing }, request);
    },
  },

  /** POST …/documents — register a document and sign its upload (the server's service role; the database registered the path). */
  addDocument: {
    options: { auth: "public", body: linkDocumentBody } as const,
    handler: async ({ request, params, body }: Pub<z.infer<typeof linkDocumentBody>>) => {
      const { tokenHash } = tokenOrNotFound(params.token);
      const evidenceId = randomUUID();
      const fileName = sanitiseEvidenceFileName(body.fileName);
      const result = await rpc(
        addVendorLinkDocument(tokenHash, sessionHashFrom(request, tokenHash), { evidenceId, fileName, contentType: body.contentType, byteSize: body.byteSize }),
      );
      if (result.status !== "registered") return refuse(request, result.status);
      const url = await signVendorUpload(result.storagePath);
      // The row stays, inert: it cannot be attached until a file exists at its path.
      if (!url) throw new ApiError(502, "INTERNAL_ERROR", "Could not prepare the upload. Try again.");
      return ok(
        { document: { id: evidenceId, fileName, contentType: body.contentType, byteSize: body.byteSize }, upload: { method: "PUT", url, contentType: body.contentType } },
        request,
        { status: 201 },
      );
    },
  },

  /** POST …/documents/{evidenceId}/attach — the upload finished: attach it to the vendor, pending review. */
  attach: {
    options: { auth: "public" } as const,
    handler: async ({ request, params }: Pub<undefined>) => {
      const { tokenHash } = tokenOrNotFound(params.token);
      const evidenceId = z.uuid().safeParse(params.evidenceId);
      if (!evidenceId.success) return refuse(request, "not_found");
      const result = await rpc(attachVendorLinkDocument(tokenHash, sessionHashFrom(request, tokenHash), evidenceId.data));
      if (result.status !== "attached") return refuse(request, result.status);
      return ok({ attached: evidenceId.data }, request, { status: 201 });
    },
  },

  /** POST …/submit — the declaration, signed; the link is used up. Nothing counts until someone in the organisation accepts it. */
  submit: {
    options: { auth: "public", body: linkSubmitBody } as const,
    handler: async ({ request, params, body }: Pub<z.infer<typeof linkSubmitBody>>) => {
      const { tokenHash } = tokenOrNotFound(params.token);
      const result = await rpc(submitVendorLink(tokenHash, sessionHashFrom(request, tokenHash), body.declaredName, body.declaredRole));
      if (result.status !== "submitted") return refuse(request, result.status);
      const response = ok({ submittedAt: result.submittedAt, declaredAt: result.declaredAt, organization: result.organization, vendor: result.vendor }, request);
      response.cookies.delete({ name: sessionCookieName(tokenHash), path: "/" });
      return response;
    },
  },
};

// ---------------------------------------------------------------------------
// Staff — send and revoke (vendor.assess), as the user
// ---------------------------------------------------------------------------

type Ctx<B = unknown> = TenantContext<B, unknown>;

function ids(ctx: Ctx) {
  const vendorId = z.uuid().safeParse(ctx.params.vendorId);
  if (!vendorId.success) throw new ApiError(404, "NOT_FOUND", "Vendor not found.");
  const assessmentId = z.uuid().safeParse(ctx.params.assessmentId);
  if (!assessmentId.success) throw new ApiError(404, "NOT_FOUND", "Assessment not found.");
  return { vendorId: vendorId.data, assessmentId: assessmentId.data };
}

/** The assessment, checked to be the vendor's in this organisation (a foreign id is a 404, never data). */
async function requireAssessment(ctx: Ctx) {
  const { vendorId, assessmentId } = ids(ctx);
  const { data, error } = await ctx.supabase
    .from("vendor_assessments")
    .select("id")
    .eq("organization_id", ctx.organizationId)
    .eq("vendor_id", vendorId)
    .eq("id", assessmentId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new ApiError(404, "NOT_FOUND", "Assessment not found.");
  return { vendorId, assessmentId };
}

async function detail(ctx: Ctx, vendorId: string, assessmentId: string) {
  const found = await readAssessmentDetail(ctx.supabase, ctx.organizationId, vendorId, assessmentId, await activeMembers(ctx.supabase, ctx.organizationId), todayInIndia());
  if (!found) throw new ApiError(404, "NOT_FOUND", "Assessment not found.");
  return found;
}

export const vendorLinkStaff = {
  /**
   * POST …/assessments/{assessmentId}/link — send the vendor a link (vendor.assess;
   * a draft or returned assessment). The token is emailed and never returned:
   * whoever sends it cannot answer as the vendor, and may not review (D-092).
   */
  send: {
    options: { auth: "required", tenant: "fromParam", permission: "vendor.assess", body: sendLinkBody } as const,
    handler: async (ctx: Ctx<z.infer<typeof sendLinkBody>>) => {
      const { vendorId, assessmentId } = await requireAssessment(ctx);
      const token = generateLinkToken();
      const { data, error } = await ctx.supabase.rpc("send_vendor_link", {
        p_organization_id: ctx.organizationId,
        p_assessment_id: assessmentId,
        p_respondent_name: ctx.body.respondentName,
        p_respondent_email: ctx.body.respondentEmail,
        p_token_hash: hashLinkToken(token),
      });
      if (error) throw error;
      const sent = data as unknown as { id: string; expiresAt: string } & VendorLinkHeader;
      const url = new URL(vendorLinkPath(token), appOrigin(ctx.request)).toString();
      const message = renderVendorLinkEmail({
        organizationName: sent.organization.name,
        vendorName: sent.vendor.name,
        respondentName: sent.respondentName,
        url,
        expiresAt: sent.expiresAt,
      });
      const emailed = await deliver({ to: sent.respondentEmail, ...message, idempotencyKey: `vendor-link:${sent.id}` });
      return ok({ ...(await detail(ctx, vendorId, assessmentId)), emailed }, ctx.request, { status: 201 });
    },
  },

  /** DELETE …/assessments/{assessmentId}/link — revoke the open link; the answers it saved stay. */
  revoke: {
    options: { auth: "required", tenant: "fromParam", permission: "vendor.assess" } as const,
    handler: async (ctx: Ctx<undefined>) => {
      const { vendorId, assessmentId } = await requireAssessment(ctx);
      const { error } = await ctx.supabase.rpc("revoke_vendor_link", { p_organization_id: ctx.organizationId, p_assessment_id: assessmentId });
      if (error) throw error;
      return ok(await detail(ctx, vendorId, assessmentId), ctx.request);
    },
  },
};
