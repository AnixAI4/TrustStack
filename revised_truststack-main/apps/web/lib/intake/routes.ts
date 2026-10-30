import "server-only";
import {
  CONSENT_ACTIONS,
  CONSENT_IDENTIFIER_LIMIT,
  CONSENT_LANGUAGES,
  INTAKE_REFUSAL,
  INTAKE_REFUSAL_STATUS,
  isIntakeCode,
  isPublicSlug,
  maskEmail,
  RIGHTS_CAPACITIES,
  RIGHTS_KINDS,
  RIGHTS_NAME_LIMIT,
  RIGHTS_SHORT_LIMIT,
  RIGHTS_TEXT_LIMIT,
  PRINCIPAL_KINDS,
  PURPOSE_KEY_PATTERN,
  type RightsKind,
} from "@truststack/core";
import { z } from "zod";
import { ApiError } from "@/lib/api/guard";
import { fail, type ApiErrorCode } from "@/lib/api/envelope";
import { EmailDeliveryError, EmailNotConfiguredError, sendEmail } from "@/lib/email/send";
import { renderIntakeCodeEmail, renderIntakeReceiptEmail } from "@/lib/email/templates/intake";
import type { PublicProfile } from "./rpc";

/** Byte for byte the body `refuse(…, "not_found")` sends: a malformed address is no different from an unknown one. */
const notFound = () => new ApiError(404, "NOT_FOUND", INTAKE_REFUSAL.not_found, [{ field: "outcome", issue: "not_found" }]);

/** An unknown or malformed slug is the same "not found" as a tenant without public pages (D-084). */
export function slugOrNotFound(raw: string | undefined): string {
  if (!raw || !isPublicSlug(raw)) throw notFound();
  return raw;
}

export function submissionIdOrNotFound(raw: string | undefined): string {
  const parsed = z.uuid().safeParse(raw);
  if (!parsed.success) throw notFound();
  return parsed.data;
}

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((v) => (v ? v : null));

/** What a public form may send — only what Stage 2's register records (SLICE_10 §7a.6). */
export const submissionSchema = z
  .object({
    surface: z.enum(["rights", "grievance"]),
    kind: z.enum(RIGHTS_KINDS),
    requesterName: z.string().trim().min(1).max(RIGHTS_NAME_LIMIT),
    requesterEmail: z.email().max(320),
    requesterPhone: optionalText(40),
    requesterCapacity: z.enum(RIGHTS_CAPACITIES).default("self"),
    principalIdentifier: optionalText(RIGHTS_NAME_LIMIT),
    summary: z.string().trim().min(1).max(RIGHTS_TEXT_LIMIT),
    relatedRequestCode: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^(DPR|GRV)-[0-9]{4}-[0-9]{3,}$/, "Use a reference like DPR-2026-001.")
      .nullish()
      .or(z.literal("").transform(() => null))
      .transform((v) => v ?? null),
    nominee: z
      .object({
        name: z.string().trim().min(1).max(RIGHTS_NAME_LIMIT),
        contact: optionalText(RIGHTS_SHORT_LIMIT),
        relationship: optionalText(RIGHTS_NAME_LIMIT),
      })
      .strict()
      .nullish()
      .transform((v) => v ?? null),
  })
  .strict()
  .superRefine((v, ctx) => {
    if ((v.surface === "grievance") !== (v.kind === "grievance")) {
      ctx.addIssue({ code: "custom", path: ["kind"], message: "That kind of request does not belong on this form." });
    }
    if ((v.kind === "nomination") !== (v.nominee !== null)) {
      ctx.addIssue({
        code: "custom",
        path: ["nominee"],
        message: v.kind === "nomination" ? "Name the person you nominate." : "Only a nomination names a nominee.",
      });
    }
    if (v.relatedRequestCode !== null && v.kind !== "grievance") {
      ctx.addIssue({ code: "custom", path: ["relatedRequestCode"], message: "Only a grievance names an earlier request." });
    }
  });
export type SubmissionBody = z.infer<typeof submissionSchema>;

export const confirmSchema = z
  .object({ code: z.string().trim().refine(isIntakeCode, "Enter the six-digit code from the email.") })
  .strict();

const REFUSAL_CODE: Record<keyof typeof INTAKE_REFUSAL, ApiErrorCode> = {
  not_found: "NOT_FOUND",
  rate_limited: "RATE_LIMITED",
  wrong_code: "VALIDATION_ERROR",
  code_expired: "GONE",
  locked: "GONE",
  expired: "GONE",
  already_confirmed: "CONFLICT",
};

/**
 * A refusal, enveloped. `details[0].issue` carries the outcome so the form
 * knows whether to offer a new code or a fresh start; nothing else.
 */
export function refuse(
  request: Request,
  outcome: keyof typeof INTAKE_REFUSAL,
  attemptsLeft?: number,
  headers: Record<string, string> = {},
): Response {
  const message =
    outcome === "wrong_code" && attemptsLeft !== undefined
      ? `${INTAKE_REFUSAL.wrong_code} ${attemptsLeft} ${attemptsLeft === 1 ? "try" : "tries"} left.`
      : INTAKE_REFUSAL[outcome];
  return fail(
    INTAKE_REFUSAL_STATUS[outcome],
    REFUSAL_CODE[outcome],
    message,
    request,
    [{ field: "outcome", issue: outcome }],
    outcome === "rate_limited" ? { "Retry-After": "3600", ...headers } : headers,
  );
}

/**
 * The consent widget runs on the organisation's OWN website, so its two calls
 * are cross-origin. Any origin may read them — they carry no credentials and
 * nothing private (the widget version is what the site shows anyway) — and the
 * widget posts as text/plain, so the browser sends no preflight.
 */
export const WIDGET_CORS: Record<string, string> = { "Access-Control-Allow-Origin": "*" };

/** A choice made in the widget (s.6). Never a verification: the widget cannot know one (Rules 10–11). */
export const consentSchema = z
  .object({
    configId: z.uuid(),
    /** The site's own identifier for the person, or the widget's random browser id. Hashed by the database, never stored. */
    identifier: z.string().trim().min(1).max(CONSENT_IDENTIFIER_LIMIT),
    action: z.enum(CONSENT_ACTIONS),
    purposes: z.array(z.string().regex(PURPOSE_KEY_PATTERN)).max(20).default([]),
    principalKind: z.enum(PRINCIPAL_KINDS).default("self"),
    language: z.enum(CONSENT_LANGUAGES).default("en"),
  })
  .strict()
  .superRefine((v, ctx) => {
    if ((v.action === "given") !== (v.purposes.length > 0)) {
      ctx.addIssue({
        code: "custom",
        path: ["purposes"],
        message: v.action === "given" ? "Name at least one purpose." : "A refusal or a withdrawal names no purpose.",
      });
    }
    if (new Set(v.purposes).size !== v.purposes.length) ctx.addIssue({ code: "custom", path: ["purposes"], message: "A purpose is named twice." });
  });

/** Postgres errors from the intake functions: a CHECK the form should have caught is a 400, never a 500. */
export function intakeDbError(error: { code?: string; message: string }): Error {
  if (error.code === "TS422") return new ApiError(400, "VALIDATION_ERROR", error.message);
  if (error.code === "23514" || error.code === "22001") {
    return new ApiError(400, "VALIDATION_ERROR", "A value is too long or not allowed.");
  }
  return new Error(error.message);
}

/**
 * Sends the code. A failure is reported, never thrown: the submission is
 * held, and the person can ask for a new code. The code is never logged.
 */
export async function emailCode(input: {
  to: string;
  submissionId: string;
  codeHash: string;
  code: string;
  kind: RightsKind;
  organization: PublicProfile;
}): Promise<boolean> {
  const message = renderIntakeCodeEmail({ organization: input.organization, code: input.code, kind: input.kind });
  return deliver({ to: input.to, ...message, idempotencyKey: `intake-code:${input.submissionId}:${input.codeHash.slice(0, 16)}` });
}

export async function emailReceipt(input: {
  to: string;
  submissionId: string;
  requestCode: string;
  kind: RightsKind;
  receivedOn: string;
  respondBy: string;
  organization: PublicProfile;
}): Promise<boolean> {
  const message = renderIntakeReceiptEmail(input);
  return deliver({ to: input.to, ...message, idempotencyKey: `intake-receipt:${input.submissionId}` });
}

async function deliver(message: { to: string; subject: string; html: string; text: string; idempotencyKey: string }) {
  try {
    await sendEmail(message);
    return true;
  } catch (error) {
    if (error instanceof EmailDeliveryError || error instanceof EmailNotConfiguredError) {
      console.error("[intake] email not sent:", error.message);
      return false;
    }
    throw error;
  }
}

export { maskEmail };
