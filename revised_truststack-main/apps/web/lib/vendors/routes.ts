import "server-only";
import { answerProblem, canReviewAssessment, isCalendarDate, reviewByProblem, VENDOR_LIMITS, VENDOR_QUESTION_CODES } from "@truststack/core";
import { z } from "zod";
import { ApiError, type TenantContext } from "@/lib/api/guard";
import { ok } from "@/lib/api/envelope";
import { activeMembers } from "@/lib/gaps/shape";
import { todayInIndia } from "@/lib/ropa/shape";
import { readAssessmentDetail, readProcessor, readProcessorRegister } from "./shape";

/**
 * The processor register and its questionnaire (Slice 10, Stage 4a), nested
 * under `/organizations/{id}/processors/…` like every tenant route: both ids
 * filter every query, so a foreign id is a 404, never data.
 *
 * Reading is the vendor register's (organization.read). Every write is one of
 * five database functions — start, save, submit, review, discard — which
 * check the caller's permission themselves, stamp who did what, refuse an
 * incomplete submission and a self-review, freeze an accepted assessment, and
 * audit each step once (migration 20261015000000_processor_register). The
 * checks here repeat theirs only to say what is wrong in words, field by field.
 *
 * The contract's dates and tri-states are the vendor register's, edited
 * through `PATCH …/vendors/{vendorId}` (scope.write); a vendor's documents are
 * evidence linked to it (`POST …/evidence/{evidenceId}/link` with `vendorId`).
 * Sending the vendor a link to answer it, and the vendor's own steps, are
 * `lib/vendors/link.ts` (Stage 4b).
 */

type Ctx<B = unknown> = TenantContext<B, unknown>;

const entrySchema = z
  .object({
    code: z.enum(VENDOR_QUESTION_CODES as [string, ...string[]]),
    /** Null or absent, with notApplicable false, clears the question. */
    answer: z.string().trim().max(VENDOR_LIMITS.textAnswer).nullable().optional(),
    notApplicable: z.boolean().default(false),
    naReason: z.string().trim().max(VENDOR_LIMITS.naReason).nullable().optional(),
    /** One of the vendor's documents, cited for this answer. */
    evidenceId: z.uuid().nullable().optional(),
  })
  .strict();

const saveBody = z
  .object({
    /** Where the answers came from — "the vendor's email of 3 Oct 2026". Required before submitting. */
    sourceNote: z.string().trim().max(VENDOR_LIMITS.sourceNote).nullable(),
    answers: z.array(entrySchema).max(VENDOR_QUESTION_CODES.length).default([]),
  })
  .strict();

const reviewBody = z
  .object({
    decision: z.enum(["accept", "return"]),
    /** Required to return one. */
    reason: z.string().trim().max(VENDOR_LIMITS.returnReason).nullable().optional(),
    /** Accept only: defaults to twelve months on (a TrustStack default). */
    reviewBy: z.string().refine(isCalendarDate, "must be a calendar date, YYYY-MM-DD").nullable().optional(),
  })
  .strict();

function idParam(ctx: Ctx, param: string, notFound: string): string {
  const parsed = z.uuid().safeParse(ctx.params[param]);
  if (!parsed.success) throw new ApiError(404, "NOT_FOUND", notFound);
  return parsed.data;
}

const invalid = (message: string, field: string): never => {
  throw new ApiError(422, "VALIDATION_ERROR", message, [{ field, issue: message }]);
};

async function detail(ctx: Ctx, vendorId: string, assessmentId: string) {
  const found = await readAssessmentDetail(ctx.supabase, ctx.organizationId, vendorId, assessmentId, await activeMembers(ctx.supabase, ctx.organizationId), todayInIndia());
  if (!found) throw new ApiError(404, "NOT_FOUND", "Assessment not found.");
  return found;
}

/** The two ids of the path, the assessment checked to be the vendor's. */
async function requireAssessment(ctx: Ctx) {
  const vendorId = idParam(ctx, "vendorId", "Vendor not found.");
  const assessmentId = idParam(ctx, "assessmentId", "Assessment not found.");
  const { data, error } = await ctx.supabase
    .from("vendor_assessments")
    .select("id, status, created_by, submitted_by")
    .eq("organization_id", ctx.organizationId)
    .eq("vendor_id", vendorId)
    .eq("id", assessmentId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new ApiError(404, "NOT_FOUND", "Assessment not found.");
  return { vendorId, assessmentId, row: data };
}

export const processors = {
  /** GET …/processors — the register, with its counts. */
  register: {
    options: { auth: "required", tenant: "fromParam", permission: "organization.read" } as const,
    handler: async (ctx: Ctx<undefined>) =>
      ok(await readProcessorRegister(ctx.supabase, ctx.organizationId, await activeMembers(ctx.supabase, ctx.organizationId), todayInIndia()), ctx.request),
  },

  /** GET …/processors/{vendorId} — one vendor: its contract, documents and every assessment version. */
  read: {
    options: { auth: "required", tenant: "fromParam", permission: "organization.read" } as const,
    handler: async (ctx: Ctx<undefined>) => {
      const vendorId = idParam(ctx, "vendorId", "Vendor not found.");
      const processor = await readProcessor(ctx.supabase, ctx.organizationId, vendorId, await activeMembers(ctx.supabase, ctx.organizationId), todayInIndia());
      if (!processor) throw new ApiError(404, "NOT_FOUND", "Vendor not found.");
      return ok({ processor }, ctx.request);
    },
  },

  /** POST …/processors/{vendorId}/assessments — start the next version (vendor.assess). */
  start: {
    options: { auth: "required", tenant: "fromParam", permission: "vendor.assess" } as const,
    handler: async (ctx: Ctx<undefined>) => {
      const vendorId = idParam(ctx, "vendorId", "Vendor not found.");
      const { data, error } = await ctx.supabase.rpc("start_vendor_assessment", { p_organization_id: ctx.organizationId, p_vendor_id: vendorId });
      if (error) throw error;
      const started = data as unknown as { id: string };
      return ok(await detail(ctx, vendorId, started.id), ctx.request, { status: 201 });
    },
  },

  /** GET …/processors/{vendorId}/assessments/{assessmentId} — the questionnaire and its review. */
  readAssessment: {
    options: { auth: "required", tenant: "fromParam", permission: "organization.read" } as const,
    handler: async (ctx: Ctx<undefined>) =>
      ok(await detail(ctx, idParam(ctx, "vendorId", "Vendor not found."), idParam(ctx, "assessmentId", "Assessment not found.")), ctx.request),
  },

  /** PATCH …/assessments/{assessmentId} — save answers and the stated source (vendor.assess; a draft or returned one only). */
  save: {
    options: { auth: "required", tenant: "fromParam", permission: "vendor.assess", body: saveBody } as const,
    handler: async (ctx: Ctx<z.infer<typeof saveBody>>) => {
      const { vendorId, assessmentId, row } = await requireAssessment(ctx);
      if (row.status !== "draft" && row.status !== "returned") {
        throw new ApiError(409, "CONFLICT", row.status === "accepted" ? "An accepted assessment never changes — start a new version." : "This assessment is awaiting review — its answers can no longer change.");
      }
      const codes = ctx.body.answers.map((a) => a.code);
      if (new Set(codes).size !== codes.length) invalid("Each question is answered once.", "answers");
      for (const a of ctx.body.answers) {
        const answer = a.answer === "" ? null : (a.answer ?? null);
        if (answer === null && !a.notApplicable) continue; // clears the question
        const problem = answerProblem({ code: a.code, answer: a.notApplicable ? null : answer, notApplicable: a.notApplicable, naReason: a.naReason ?? null });
        if (problem) invalid(problem, `answers.${a.code}`);
      }
      const { error } = await ctx.supabase.rpc("save_vendor_assessment", {
        p_organization_id: ctx.organizationId,
        p_assessment_id: assessmentId,
        // The generated types mark nullable RPC arguments as required strings.
        p_source_note: (ctx.body.sourceNote ?? null) as unknown as string,
        p_answers: ctx.body.answers.map((a) => ({
          code: a.code,
          answer: a.notApplicable ? null : (a.answer ?? null),
          notApplicable: a.notApplicable,
          naReason: a.notApplicable ? (a.naReason ?? null) : null,
          evidenceId: a.notApplicable ? null : (a.evidenceId ?? null),
        })),
      });
      if (error) throw error;
      return ok(await detail(ctx, vendorId, assessmentId), ctx.request);
    },
  },

  /** POST …/assessments/{assessmentId}/submit — complete, with its source, for a second person to review (vendor.assess). */
  submit: {
    options: { auth: "required", tenant: "fromParam", permission: "vendor.assess" } as const,
    handler: async (ctx: Ctx<undefined>) => {
      const { vendorId, assessmentId } = await requireAssessment(ctx);
      const { error } = await ctx.supabase.rpc("submit_vendor_assessment", { p_organization_id: ctx.organizationId, p_assessment_id: assessmentId });
      if (error) throw error;
      return ok(await detail(ctx, vendorId, assessmentId), ctx.request);
    },
  },

  /** POST …/assessments/{assessmentId}/review — accept or return it (vendor.review; never the person who entered it, nor who sent the vendor its link). */
  review: {
    options: { auth: "required", tenant: "fromParam", permission: "vendor.review", body: reviewBody } as const,
    handler: async (ctx: Ctx<z.infer<typeof reviewBody>>) => {
      const { vendorId, assessmentId, row } = await requireAssessment(ctx);
      const { body } = ctx;
      if (row.status !== "submitted") throw new ApiError(409, "CONFLICT", "Only an assessment awaiting review can be accepted or returned.");
      const before = await detail(ctx, vendorId, assessmentId);
      if (!canReviewAssessment(ctx.user.id, before.assessment.involved)) {
        const sender = before.assessment.links.some((l) => l.sentBy === ctx.user.id);
        throw new ApiError(
          403,
          "FORBIDDEN",
          sender
            ? "You sent this assessment to the vendor — someone else must review their answers."
            : "You entered or answered this assessment — someone else must review it.",
        );
      }
      if (body.decision === "return" && !body.reason) invalid("Say why it is returned.", "reason");
      if (body.decision === "accept" && body.reviewBy) {
        const problem = reviewByProblem(body.reviewBy, todayInIndia());
        if (problem) invalid(problem, "reviewBy");
      }
      const { error } = await ctx.supabase.rpc("review_vendor_assessment", {
        p_organization_id: ctx.organizationId,
        p_assessment_id: assessmentId,
        p_decision: body.decision,
        p_reason: (body.decision === "return" ? body.reason : null) as unknown as string,
        p_review_by: (body.decision === "accept" ? (body.reviewBy ?? null) : null) as unknown as string,
      });
      if (error) throw error;
      return ok(await detail(ctx, vendorId, assessmentId), ctx.request);
    },
  },

  /** DELETE …/assessments/{assessmentId} — discard a draft or a returned assessment (vendor.assess). */
  discard: {
    options: { auth: "required", tenant: "fromParam", permission: "vendor.assess" } as const,
    handler: async (ctx: Ctx<undefined>) => {
      const { assessmentId, row } = await requireAssessment(ctx);
      if (row.status !== "draft" && row.status !== "returned") throw new ApiError(409, "CONFLICT", "A submitted or accepted assessment is never discarded.");
      const { error } = await ctx.supabase.rpc("discard_vendor_assessment", { p_organization_id: ctx.organizationId, p_assessment_id: assessmentId });
      if (error) throw error;
      return ok({ deleted: assessmentId }, ctx.request);
    },
  },
};
