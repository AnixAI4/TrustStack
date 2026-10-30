import "server-only";
import {
  AI_FEEDBACK,
  AI_FEEDBACK_COMMENT_MAX,
  AI_TASK_SPECS,
  AI_TASKS,
  can,
  isAiTask,
  scrubPersonalData,
  translationKeyProblems,
  type AiTask,
  type ReportNarrative,
} from "@truststack/core";
import { z } from "zod";
import { ApiError, rpcError, type TenantContext } from "@/lib/api/guard";
import { ok } from "@/lib/api/envelope";
import { namesFor } from "@/lib/gaps/shape";
import type { Json } from "@/lib/supabase/database.types";
import { narrativeNumberProblem, readNarratableReport } from "@/lib/reports/narrate";
import type { AppSupabaseClient } from "@/lib/supabase/server";
import { ACCEPTED_DRAFT_SCHEMAS, isDraftTask } from "./drafts";
import { aiStatusPayload, readAiStatus, runAiTask } from "./gateway";

/**
 * The AI routes (SLICE_11 §2.1). Both need `ai.use` — every role holds it — and
 * the task route then needs the task's own read permission (§4.7). The body is
 * validated per task inside the gateway: an unknown task is a 404 whatever it sends.
 *
 * Feedback (§4.13, Stage 1b): thumbs up or down on an answer, with an optional
 * comment — once, by the person who asked. The database enforces both and audits
 * `ai.feedback` without the comment; the comment is scrubbed here first (A3).
 *
 * Decisions (§4.4, Stage 2a; D-129): a drafting task's draft is accepted — with
 * the person's edited text — or discarded, once, by anyone holding the register's
 * WRITE permission (not only the asker, D-129.3). Accepting writes NO register
 * row: the page pre-fills the register's own form and the person saves through
 * its own route. The database enforces the same rules (`app.guard_ai_draft_update`)
 * and audits `ai.draft.accepted` / `ai.draft.discarded` without the text.
 */
const feedbackBody = z
  .object({
    feedback: z.enum(AI_FEEDBACK),
    comment: z.string().trim().max(AI_FEEDBACK_COMMENT_MAX).optional(),
  })
  .strict();
const acceptBody = z.object({ output: z.record(z.string(), z.unknown()) }).strict();
const draftsQuery = z
  .object({
    targetId: z.uuid(),
    task: z.enum(AI_TASKS).optional(),
    status: z.enum(["draft", "accepted", "discarded"]).optional(),
  })
  .strict();

const DRAFT_COLUMNS = "id, task, status, target_type, target_id, target_key, output, accepted_output, requested_by, decided_by, decided_at, created_at, model" as const;
interface DraftRow {
  id: string;
  task: string;
  status: string;
  target_type: string;
  target_id: string | null;
  target_key: string | null;
  output: Json | null;
  accepted_output: Json | null;
  requested_by: string | null;
  decided_by: string | null;
  decided_at: string | null;
  created_at: string;
  model: string;
}

function draftToApi(row: DraftRow, names: ReadonlyMap<string, string>) {
  return {
    id: row.id,
    task: row.task as AiTask,
    status: row.status as "draft" | "accepted" | "discarded" | "rejected",
    target: { type: row.target_type, id: row.target_id, key: row.target_key },
    createdAt: row.created_at,
    model: row.model,
    answer: row.output,
    acceptedOutput: row.accepted_output,
    decidedAt: row.decided_at,
    decidedByName: row.decided_by ? (names.get(row.decided_by) ?? null) : null,
  };
}

/** One draft of this organisation the caller may read (RLS: ai.use + the task's read permission), or a 404. */
async function readDraft(supabase: AppSupabaseClient, organizationId: string, rawId: string | undefined): Promise<DraftRow> {
  const draftId = z.uuid().safeParse(rawId);
  if (!draftId.success) throw new ApiError(404, "NOT_FOUND", "Draft not found.");
  const { data, error } = await supabase
    .from("ai_drafts")
    .select(DRAFT_COLUMNS)
    .eq("id", draftId.data)
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new ApiError(404, "NOT_FOUND", "Draft not found.");
  return data as DraftRow;
}

/** Who may decide, and whether there is anything to decide — the database checks all of it again. */
function decidable(ctx: TenantContext<unknown, undefined>, row: DraftRow) {
  const task = row.task as AiTask;
  if (!isAiTask(task) || !isDraftTask(task)) throw new ApiError(409, "CONFLICT", "An explanation is not a draft: there is nothing to accept or discard.");
  const write = AI_TASK_SPECS[task].writePermission!;
  if (!can(ctx.permissions, write)) throw new ApiError(403, "FORBIDDEN", "Only someone who can write to this register can accept or discard this draft.");
  if (row.status === "rejected") throw new ApiError(409, "CONFLICT", "This answer was not kept, so there is nothing to accept or discard.");
  if (row.status !== "draft") throw new ApiError(409, "CONFLICT", "This draft has already been accepted or discarded.");
  return task;
}

async function decide(ctx: TenantContext<unknown, undefined>, row: DraftRow, update: { status: "accepted"; accepted_output: Json } | { status: "discarded" }) {
  const { data, error } = await ctx.supabase
    .from("ai_drafts")
    .update(update)
    .eq("id", row.id)
    .eq("organization_id", ctx.organizationId)
    .eq("status", "draft")
    .select(DRAFT_COLUMNS)
    .maybeSingle();
  if (error) throw rpcError(error) ?? error;
  // Another person decided first.
  if (!data) throw new ApiError(409, "CONFLICT", "This draft has already been accepted or discarded.");
  const decided = data as DraftRow;
  return ok({ draft: draftToApi(decided, await namesFor(ctx.supabase, [], [decided.decided_by])) }, ctx.request);
}

/**
 * Stage 2b: what the person accepts is checked against its source too — a translation keeps
 * the published notice's purpose keys (D-133.2); a narrative states only the stored report's
 * numbers (D-133.1). The model's draft passed the same checks; a person's edit must as well.
 */
async function checkAcceptedAgainstSource(ctx: TenantContext<unknown, undefined>, task: AiTask, row: DraftRow, output: Record<string, unknown>) {
  if (task === "notice_translation_draft" && row.target_id) {
    const { data, error } = await ctx.supabase
      .from("privacy_notices")
      .select("purposes")
      .eq("organization_id", ctx.organizationId)
      .eq("id", row.target_id)
      .maybeSingle();
    if (error) throw error;
    const sourceKeys = ((data?.purposes ?? []) as { key: string }[]).map((p) => p.key);
    const problems = translationKeyProblems(sourceKeys, (output.purposes as { key: string }[]).map((p) => p.key));
    if (problems.length > 0) {
      throw new ApiError(422, "VALIDATION_ERROR", "A translation keeps every purpose of the notice, with the same key.", problems.map((p) => ({ field: "output.purposes", issue: p })));
    }
  }
  if (task === "report_narrative_draft" && row.target_id) {
    const { document } = await readNarratableReport(ctx.supabase, ctx.organizationId, row.target_id);
    const problem = narrativeNumberProblem(output as unknown as ReportNarrative, document);
    if (problem) throw new ApiError(422, "VALIDATION_ERROR", problem, [{ field: "output", issue: "numbers_not_in_document" }]);
  }
}

export const ai = {
  status: {
    options: { auth: "required", tenant: "fromParam", permission: "ai.use" } as const,
    handler: async (ctx: TenantContext<undefined, undefined>) => {
      const { row, offReason } = await readAiStatus(ctx.supabase, ctx.organizationId);
      return ok({ ai: aiStatusPayload(row, offReason) }, ctx.request);
    },
  },

  feedback: {
    options: { auth: "required", tenant: "fromParam", permission: "ai.use", body: feedbackBody } as const,
    handler: async (ctx: TenantContext<z.infer<typeof feedbackBody>, undefined>) => {
      const { supabase, organizationId, body, request } = ctx;
      const draftId = z.uuid().safeParse(ctx.params.draftId);
      if (!draftId.success) throw new ApiError(404, "NOT_FOUND", "Answer not found.");
      // RLS reads it only with ai.use AND the task's own read permission; another organisation's is not there.
      const { data: draft, error: readError } = await supabase
        .from("ai_drafts")
        .select("id, status, requested_by, feedback")
        .eq("id", draftId.data)
        .eq("organization_id", organizationId)
        .maybeSingle();
      if (readError) throw readError;
      if (!draft) throw new ApiError(404, "NOT_FOUND", "Answer not found.");
      if (draft.requested_by !== ctx.user.id) throw new ApiError(403, "FORBIDDEN", "Only the person who asked can rate this answer.");
      if (draft.status === "rejected") throw new ApiError(409, "CONFLICT", "This answer was not kept, so it cannot be rated.");
      if (draft.feedback !== null) throw new ApiError(409, "CONFLICT", "This answer has already been rated.");

      const comment = body.comment ? scrubPersonalData(body.comment).text : null;
      const { data, error } = await supabase
        .from("ai_drafts")
        .update({ feedback: body.feedback, feedback_comment: comment || null })
        .eq("id", draft.id)
        .eq("organization_id", organizationId)
        .select("id, feedback, feedback_at")
        .single();
      if (error) throw rpcError(error) ?? error;
      return ok({ draft: { id: data.id, feedback: data.feedback, feedbackAt: data.feedback_at } }, request);
    },
  },

  /** GET …/ai/drafts?targetId=… — a breach's or a request's drafts (the accepted intimation, the accepted letter), newest first. */
  drafts: {
    options: { auth: "required", tenant: "fromParam", permission: "ai.use", query: draftsQuery } as const,
    handler: async (ctx: TenantContext<undefined, z.infer<typeof draftsQuery>>) => {
      const { supabase, organizationId, query, request } = ctx;
      let q = supabase.from("ai_drafts").select(DRAFT_COLUMNS).eq("organization_id", organizationId).eq("target_id", query.targetId);
      q = query.task ? q.eq("task", query.task) : q.in("task", AI_TASKS.filter((t) => isDraftTask(t)));
      q = query.status ? q.eq("status", query.status) : q.in("status", ["draft", "accepted", "discarded"]);
      const { data, error } = await q.order("created_at", { ascending: false }).order("id").limit(20);
      if (error) throw error;
      const rows = (data ?? []) as DraftRow[];
      const names = await namesFor(supabase, [], rows.map((r) => r.decided_by));
      return ok({ drafts: rows.map((r) => draftToApi(r, names)) }, request);
    },
  },

  /** GET …/ai/drafts/{draftId} — one draft, e.g. the accepted ROPA draft the new-record form pre-fills from. */
  draft: {
    options: { auth: "required", tenant: "fromParam", permission: "ai.use" } as const,
    handler: async (ctx: TenantContext<undefined, undefined>) => {
      const row = await readDraft(ctx.supabase, ctx.organizationId, ctx.params.draftId);
      if (row.status === "rejected") throw new ApiError(404, "NOT_FOUND", "Draft not found.");
      return ok({ draft: draftToApi(row, await namesFor(ctx.supabase, [], [row.decided_by])) }, ctx.request);
    },
  },

  /** POST …/ai/drafts/{draftId}/accept — the person's edited text is kept; NO register row is written. */
  accept: {
    options: { auth: "required", tenant: "fromParam", permission: "ai.use", body: acceptBody } as const,
    handler: async (ctx: TenantContext<z.infer<typeof acceptBody>, undefined>) => {
      const row = await readDraft(ctx.supabase, ctx.organizationId, ctx.params.draftId);
      const task = decidable(ctx as unknown as TenantContext<unknown, undefined>, row);
      const parsed = ACCEPTED_DRAFT_SCHEMAS[task].safeParse(ctx.body.output);
      if (!parsed.success) {
        throw new ApiError(
          400,
          "VALIDATION_ERROR",
          "Invalid request body.",
          parsed.error.issues.map((i) => ({ field: ["output", ...i.path].join("."), issue: i.message })),
        );
      }
      await checkAcceptedAgainstSource(ctx as unknown as TenantContext<unknown, undefined>, task, row, parsed.data as Record<string, unknown>);
      return decide(ctx as unknown as TenantContext<unknown, undefined>, row, { status: "accepted", accepted_output: parsed.data as Json });
    },
  },

  /** POST …/ai/drafts/{draftId}/discard — once; nothing is kept but the decision. */
  discard: {
    options: { auth: "required", tenant: "fromParam", permission: "ai.use" } as const,
    handler: async (ctx: TenantContext<undefined, undefined>) => {
      const row = await readDraft(ctx.supabase, ctx.organizationId, ctx.params.draftId);
      decidable(ctx as unknown as TenantContext<unknown, undefined>, row);
      return decide(ctx as unknown as TenantContext<unknown, undefined>, row, { status: "discarded" });
    },
  },

  run: {
    options: {
      auth: "required",
      tenant: "fromParam",
      permission: "ai.use",
      body: z.record(z.string(), z.unknown()),
    } as const,
    handler: async (ctx: TenantContext<Record<string, unknown>, undefined>) => {
      const task = ctx.params.task ?? "";
      if (!isAiTask(task)) throw new ApiError(404, "NOT_FOUND", "There is no such AI helper.");
      return runAiTask(ctx as TenantContext<unknown, unknown>, task);
    },
  },
};
