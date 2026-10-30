import "server-only";
import { randomUUID } from "node:crypto";
import {
  assertReviewConsistent,
  EVIDENCE_BUCKET,
  EVIDENCE_CONTENT_TYPES,
  EVIDENCE_DOWNLOAD_URL_SECONDS,
  EVIDENCE_MAX_BYTES,
  evidenceStoragePath,
  ForbiddenError,
  REVIEWED_STATUSES,
  sanitiseEvidenceFileName,
  ScoringInputError,
} from "@truststack/core";
import { z } from "zod";
import { ApiError, type TenantContext } from "@/lib/api/guard";
import { ok } from "@/lib/api/envelope";
import { readResponse } from "@/lib/assessments/responses";
import { activeMembers, readGapForAction } from "@/lib/gaps/shape";
import { readRecord, readRopaGapForAction } from "@/lib/ropa/shape";
import { EVIDENCE_COLUMNS, evidenceToApi, mapWriteError, type EvidenceRow } from "./shape";

/**
 * Evidence (Slice 4): upload by signed URL, link to an answer, review, and
 * download by signed URL.
 *
 * The evidence store holds a client's most sensitive documents (Rule 6(a)).
 * The bucket is private; every URL is short-lived, minted with the CALLER's
 * JWT so Storage's own policies decide (no service role), and audited here —
 * issuing a URL writes no row, so no trigger could see it.
 *
 * Uploaded files are untrusted input: nothing here reads their contents, and
 * nothing ever will act on instructions inside one.
 */

const uploadBody = z
  .object({
    fileName: z.string().trim().min(1).max(255),
    contentType: z.enum(EVIDENCE_CONTENT_TYPES),
    byteSize: z.number().int().min(1).max(EVIDENCE_MAX_BYTES),
  })
  .strict();

/**
 * Exactly one target. `evidence_links` is polymorphic (D-008): an artefact
 * supports an ANSWER, where it moves the score; a remediation ACTION (Slice
 * 6), where it never does; a ROPA RECORD (Slice 7), where it completes the
 * record's evidence area and never touches any answer (D-064); or a VENDOR
 * (Slice 10 Stage 4a) — its contract, certificates and reports, which its
 * assessment's answers cite; a RETENTION SCHEDULE (Stage 5) — the erasure
 * certificate; an AI SYSTEM (Stage 5) — a review or an impact assessment; a
 * BREACH (Stage 6) — the Board's intimations, the notice to the people
 * affected; or a RIGHTS REQUEST (Stage 6) — the response sent.
 */
const linkBody = z.union([
  z.object({ responseId: z.uuid() }).strict(),
  z.object({ gapActionId: z.uuid() }).strict(),
  z.object({ ropaRecordId: z.uuid() }).strict(),
  z.object({ vendorId: z.uuid() }).strict(),
  z.object({ retentionScheduleId: z.uuid() }).strict(),
  z.object({ aiSystemId: z.uuid() }).strict(),
  z.object({ breachIncidentId: z.uuid() }).strict(),
  z.object({ rightsRequestId: z.uuid() }).strict(),
]);

const reviewBody = z
  .object({
    // `pending` is not a verdict; there is no attested status (D-039).
    reviewStatus: z.enum(REVIEWED_STATUSES),
    evidenceLevel: z.number().int().min(0).max(5),
    reviewNotes: z.string().trim().max(4000).optional(),
  })
  .strict()
  .superRefine((value, issue) => {
    try {
      assertReviewConsistent(value.reviewStatus, value.evidenceLevel);
    } catch (error) {
      if (!(error instanceof ScoringInputError)) throw error;
      issue.addIssue({ code: "custom", path: ["evidenceLevel"], message: error.message });
    }
  });

/** Both ids, always — an Org B evidence id under an Org A path is a 404, never data. */
async function requireEvidence(ctx: TenantContext<unknown, unknown>): Promise<EvidenceRow> {
  const parsed = z.uuid().safeParse(ctx.params.evidenceId);
  if (!parsed.success) throw new ApiError(404, "NOT_FOUND", "Evidence not found.");
  const { data, error } = await ctx.supabase
    .from("evidence")
    .select(EVIDENCE_COLUMNS)
    .eq("id", parsed.data)
    .eq("organization_id", ctx.organizationId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new ApiError(404, "NOT_FOUND", "Evidence not found.");
  return data as EvidenceRow;
}

export const evidence = {
  uploadUrl: {
    options: { auth: "required", tenant: "fromParam", permission: "evidence.write", body: uploadBody } as const,
    handler: async (ctx: TenantContext<z.infer<typeof uploadBody>, undefined>) => {
      const { supabase, organizationId, body, request } = ctx;
      const id = randomUUID();
      const fileName = sanitiseEvidenceFileName(body.fileName);
      const storagePath = evidenceStoragePath(organizationId, id, fileName);

      // The row first: Storage's INSERT policy only signs an upload for a path
      // that is already registered to this uploader (D-042).
      const { data, error } = await supabase
        .from("evidence")
        .insert({
          id,
          organization_id: organizationId,
          storage_path: storagePath,
          file_name: fileName,
          content_type: body.contentType,
          byte_size: body.byteSize,
        })
        .select(EVIDENCE_COLUMNS)
        .single();
      if (error) mapWriteError(error);

      const signed = await supabase.storage.from(EVIDENCE_BUCKET).createSignedUploadUrl(storagePath);
      if (signed.error || !signed.data) {
        // The row stays, inert: it cannot be linked or reviewed until a file
        // exists at its path (the database checks), and no user can delete it.
        throw new ApiError(502, "INTERNAL_ERROR", "Could not prepare the upload. Try again.");
      }

      await ctx.audit([
        {
          organizationId,
          eventType: "evidence.upload_url.issued",
          entityType: "evidence",
          entityId: id,
          description: "Issued a signed evidence upload URL",
          metadata: { fileName, contentType: body.contentType, byteSize: body.byteSize },
        },
      ]);

      return ok(
        {
          evidence: evidenceToApi(data as EvidenceRow),
          // Single use: the object cannot be overwritten (no UPDATE policy), so
          // the token is spent by the first successful PUT.
          upload: { method: "PUT", url: signed.data.signedUrl, contentType: body.contentType },
        },
        request,
        { status: 201 },
      );
    },
  },

  link: {
    options: { auth: "required", tenant: "fromParam", permission: "evidence.write", body: linkBody } as const,
    handler: async (ctx: TenantContext<z.infer<typeof linkBody>, undefined>) => {
      const { supabase, organizationId, body, request } = ctx;
      const row = await requireEvidence(ctx as TenantContext<unknown, unknown>);

      if ("gapActionId" in body) {
        // Attaching evidence to an action is work on the action as well as an
        // evidence write; the trigger checks gap.write too.
        if (!ctx.permissions.has("gap.write")) throw new ForbiddenError();

        // The trigger checks the action is this organisation's and the file
        // is really stored. It re-derives NOTHING: evidence that an action
        // was done says nothing about what the answer scored.
        const { error } = await supabase.from("evidence_links").insert({
          organization_id: organizationId,
          evidence_id: row.id,
          linked_entity_type: "gap_action",
          linked_entity_id: body.gapActionId,
        });
        if (error) {
          if (error.code === "23505") throw new ApiError(409, "CONFLICT", "That evidence is already attached to this action.");
          mapWriteError(error, "Action not found.");
        }

        const gap = await readGapForAction(supabase, organizationId, body.gapActionId);
        if (gap) return ok({ gap }, request, { status: 201 });
        // One action table (D-060): the action may belong to a ROPA gap instead.
        const members = await activeMembers(supabase, organizationId);
        const ropaGap = await readRopaGapForAction(supabase, organizationId, body.gapActionId, members);
        if (ropaGap) return ok({ ropaGap }, request, { status: 201 });
        // …or (Slice 10) to a breach, a rights request or a retention schedule,
        // whose pages re-read their own record. The link above is already
        // stored: answering 404 here would tell the person it failed when it did not.
        const { data: action, error: aError } = await supabase
          .from("gap_actions")
          .select("id, breach_incident_id, rights_request_id, retention_schedule_id")
          .eq("id", body.gapActionId)
          .eq("organization_id", organizationId)
          .maybeSingle();
        if (aError) throw aError;
        if (!action || (action.breach_incident_id === null && action.rights_request_id === null && action.retention_schedule_id === null)) {
          throw new ApiError(404, "NOT_FOUND", "Action not found.");
        }
        return ok(
          {
            action: {
              id: action.id,
              breachIncidentId: action.breach_incident_id,
              rightsRequestId: action.rights_request_id,
              retentionScheduleId: action.retention_schedule_id,
            },
          },
          request,
          { status: 201 },
        );
      }

      if ("ropaRecordId" in body) {
        // Evidence on a processing record is work on the register; the
        // trigger checks ropa.write too, the record's tenancy, that it is not
        // archived, and that the file is really stored. It re-derives the
        // RECORD's completeness — never an answer's score.
        if (!ctx.permissions.has("ropa.write")) throw new ForbiddenError();
        const { error } = await supabase.from("evidence_links").insert({
          organization_id: organizationId,
          evidence_id: row.id,
          linked_entity_type: "ropa_record",
          linked_entity_id: body.ropaRecordId,
        });
        if (error) {
          if (error.code === "23505") throw new ApiError(409, "CONFLICT", "That evidence is already attached to this record.");
          mapWriteError(error, "Record not found.");
        }
        const record = await readRecord(supabase, organizationId, body.ropaRecordId);
        if (!record) throw new ApiError(404, "NOT_FOUND", "Record not found.");
        return ok({ ropaRecordId: record.id, completenessScore: record.completeness_score, evidenceCount: record.evidence_count }, request, { status: 201 });
      }

      if ("vendorId" in body) {
        // A vendor's document is work on its assessment; the trigger checks
        // vendor.assess too, the vendor's tenancy, and that the file is really
        // stored. It re-derives nothing: an answer's score reads the documents
        // it cites when it is submitted, and again when it is accepted.
        if (!ctx.permissions.has("vendor.assess")) throw new ForbiddenError();
        const { error } = await supabase.from("evidence_links").insert({
          organization_id: organizationId,
          evidence_id: row.id,
          linked_entity_type: "vendor",
          linked_entity_id: body.vendorId,
        });
        if (error) {
          if (error.code === "23505") throw new ApiError(409, "CONFLICT", "That document is already attached to this vendor.");
          mapWriteError(error, "Vendor not found.");
        }
        return ok({ vendorId: body.vendorId, evidence: evidenceToApi(row) }, request, { status: 201 });
      }

      if ("retentionScheduleId" in body || "aiSystemId" in body) {
        // Slice 10 Stage 5. An erasure certificate is work on the retention
        // register (retention.write); a review on the AI risk register
        // (ropa.write, D-094.2). The trigger checks the same, the row's tenancy
        // and that the file is really stored. Nothing is re-derived.
        const schedule = "retentionScheduleId" in body;
        if (!ctx.permissions.has(schedule ? "retention.write" : "ropa.write")) throw new ForbiddenError();
        const entityId = schedule ? body.retentionScheduleId : body.aiSystemId;
        const { error } = await supabase.from("evidence_links").insert({
          organization_id: organizationId,
          evidence_id: row.id,
          linked_entity_type: schedule ? "retention_schedule" : "ai_system",
          linked_entity_id: entityId,
        });
        if (error) {
          if (error.code === "23505") throw new ApiError(409, "CONFLICT", `That document is already attached to this ${schedule ? "schedule" : "AI system"}.`);
          mapWriteError(error, schedule ? "Schedule not found." : "AI system not found.");
        }
        return ok({ [schedule ? "retentionScheduleId" : "aiSystemId"]: entityId, evidence: evidenceToApi(row) }, request, { status: 201 });
      }

      if ("breachIncidentId" in body || "rightsRequestId" in body) {
        // Slice 10 Stage 6. A breach's documents are work on the breach
        // register (breach.write); a request's on the rights register
        // (rights.write). The trigger checks the same, the row's tenancy, that
        // a breach is not dismissed or a request void, and that the file is
        // really stored. Nothing is re-derived.
        const breach = "breachIncidentId" in body;
        if (!ctx.permissions.has(breach ? "breach.write" : "rights.write")) throw new ForbiddenError();
        const entityId = breach ? body.breachIncidentId : body.rightsRequestId;
        const { error } = await supabase.from("evidence_links").insert({
          organization_id: organizationId,
          evidence_id: row.id,
          linked_entity_type: breach ? "breach_incident" : "rights_request",
          linked_entity_id: entityId,
        });
        if (error) {
          if (error.code === "23505") throw new ApiError(409, "CONFLICT", `That document is already attached to this ${breach ? "breach" : "request"}.`);
          mapWriteError(error, breach ? "Breach not found." : "Request not found.");
        }
        return ok({ [breach ? "breachIncidentId" : "rightsRequestId"]: entityId, evidence: evidenceToApi(row) }, request, { status: 201 });
      }

      // The trigger checks the response is this organisation's, the assessment
      // is not locked and the file is really stored — then re-derives the level.
      const { error } = await supabase.from("evidence_links").insert({
        organization_id: organizationId,
        evidence_id: row.id,
        linked_entity_type: "assessment_response",
        linked_entity_id: body.responseId,
      });
      if (error) {
        if (error.code === "23505") throw new ApiError(409, "CONFLICT", "That evidence is already attached to this answer.");
        mapWriteError(error, "Response not found.");
      }

      const response = await readResponse(supabase, organizationId, body.responseId);
      return ok({ response }, request, { status: 201 });
    },
  },

  unlink: {
    options: { auth: "required", tenant: "fromParam", permission: "evidence.write" } as const,
    handler: async (ctx: TenantContext<undefined, undefined>) => {
      const { supabase, organizationId, request } = ctx;
      const row = await requireEvidence(ctx as TenantContext<unknown, unknown>);
      const responseId = z.uuid().safeParse(ctx.params.responseId);
      if (!responseId.success) throw new ApiError(404, "NOT_FOUND", "Response not found.");

      // Detaching an artefact from ONE answer. The artefact itself stays: a
      // stored artefact is retained, and nobody can delete one (D-042). The
      // trigger re-derives the answer's level, and so its adjusted score, in
      // the same transaction — the number never outlives its evidence.
      const { data, error } = await supabase
        .from("evidence_links")
        .delete()
        .eq("organization_id", organizationId)
        .eq("evidence_id", row.id)
        .eq("linked_entity_type", "assessment_response")
        .eq("linked_entity_id", responseId.data)
        .select("id");
      if (error) mapWriteError(error, "Response not found.");
      // RLS filters a row the caller may not touch, so "nothing deleted" is
      // the same answer as "no such link": a 404 either way, never a hint.
      if (!data || data.length === 0) throw new ApiError(404, "NOT_FOUND", "That evidence is not attached to this answer.");

      const response = await readResponse(supabase, organizationId, responseId.data);
      return ok({ response }, request);
    },
  },

  downloadUrl: {
    options: { auth: "required", tenant: "fromParam", permission: "evidence.read" } as const,
    handler: async (ctx: TenantContext<undefined, undefined>) => {
      const { supabase, organizationId, request } = ctx;
      const row = await requireEvidence(ctx as TenantContext<unknown, unknown>);

      const signed = await supabase.storage
        .from(EVIDENCE_BUCKET)
        .createSignedUrl(row.storage_path, EVIDENCE_DOWNLOAD_URL_SECONDS, { download: row.file_name });
      if (signed.error || !signed.data) throw new ApiError(404, "NOT_FOUND", "The file has not been uploaded.");

      // Every issuance, every time (Rule 6(c)).
      await ctx.audit([
        {
          organizationId,
          eventType: "evidence.download_url.issued",
          entityType: "evidence",
          entityId: row.id,
          description: "Issued a signed evidence download URL",
          metadata: { fileName: row.file_name, expiresInSeconds: EVIDENCE_DOWNLOAD_URL_SECONDS },
        },
      ]);

      return ok({ url: signed.data.signedUrl, expiresInSeconds: EVIDENCE_DOWNLOAD_URL_SECONDS }, request);
    },
  },

  review: {
    options: { auth: "required", tenant: "fromParam", permission: "evidence.review", body: reviewBody } as const,
    handler: async (ctx: TenantContext<z.infer<typeof reviewBody>, undefined>) => {
      const { supabase, organizationId, body, request, user } = ctx;
      const row = await requireEvidence(ctx as TenantContext<unknown, unknown>);

      // The database refuses this too (trigger + CHECK); here for the message.
      if (row.uploaded_by === user.id) {
        throw new ApiError(403, "FORBIDDEN", "You cannot review evidence you uploaded — another reviewer must.");
      }

      const { data, error } = await supabase
        .from("evidence")
        .update({ review_status: body.reviewStatus, evidence_level: body.evidenceLevel, review_notes: body.reviewNotes ?? null })
        .eq("id", row.id)
        .eq("organization_id", organizationId)
        .select(EVIDENCE_COLUMNS)
        .single();
      if (error) mapWriteError(error, "Evidence not found.");

      return ok({ evidence: evidenceToApi(data as EvidenceRow) }, request);
    },
  },
};
