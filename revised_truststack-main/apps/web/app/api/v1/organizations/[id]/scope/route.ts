import { AI_USAGE_TYPES, deriveRiskTags, INDUSTRY_CODES, TRI_STATES } from "@truststack/core";
import { z } from "zod";
import { withApi } from "@/lib/api/guard";
import { ok } from "@/lib/api/envelope";
import { scopeDbError } from "@/lib/scope/db-errors";
import { loadScopeState, previewFor } from "@/lib/scope/risk";

export const dynamic = "force-dynamic";

const tri = z.enum(TRI_STATES);

/**
 * `risk_tags` is deliberately NOT in this schema: Zod strips unknown keys, so a
 * client that sends tags has them ignored. Tags are only ever derived (pitfall 3).
 */
const putSchema = z.object({
  industryCode: z.enum(INDUSTRY_CODES as [string, ...string[]]),
  dataPrincipalCountEstimate: z.number().int().min(0).max(2_000_000_000).nullable(),
  answers: z.object({
    childrenData: tri,
    aiUsageTypes: z
      .array(z.enum(AI_USAGE_TYPES))
      .max(AI_USAGE_TYPES.length)
      .transform((a) => [...new Set(a)])
      .refine((a) => !(a.includes("none") && a.length > 1), { message: "`none` cannot be combined with other AI uses." }),
    marketingTracking: tri,
    crossBorder: tri,
    multiLocation: z.boolean(),
    publicFacingPortal: tri,
    sensitiveDocuments: tri,
    // Absent means unknown, matching the column default: an omitted answer
    // must never read as "no" (D-037).
    usesDataProcessors: tri.default("unknown"),
    // Slice 9 (s.9(1)): the same rule — absent is unknown, never "no".
    guardianData: tri.default("unknown"),
  }),
});

/** GET /api/v1/organizations/{id}/scope — answers, stored tags, and a fresh preview. */
export const GET = withApi(
  { auth: "required", tenant: "fromParam", permission: "organization.read" },
  async ({ request, supabase, organizationId, permissions }) => {
    const state = await loadScopeState(supabase, organizationId);
    return ok(
      {
        organizationId,
        industryCode: state.industryCode,
        dataPrincipalCountEstimate: state.dataPrincipalCountEstimate,
        answers: state.answers,
        saved: state.stored !== null,
        storedRiskTags: state.stored?.riskTags ?? [],
        derivedAt: state.stored?.derivedAt ?? null,
        preview: previewFor(state, permissions),
      },
      request,
    );
  },
);

/**
 * PUT /api/v1/organizations/{id}/scope — saves the wizard answers, then derives
 * risk tags with packages/core from the answers AND the current registers, and
 * stores them. Audited by trigger (D-026).
 */
export const PUT = withApi(
  { auth: "required", tenant: "fromParam", permission: "scope.write", body: putSchema },
  async ({ request, supabase, organizationId, user, body, permissions }) => {
    const { error: orgError } = await supabase
      .from("organizations")
      .update({ industry_code: body.industryCode, data_principal_count_estimate: body.dataPrincipalCountEstimate })
      .eq("id", organizationId);
    if (orgError) throw scopeDbError(orgError, "update");

    const current = await loadScopeState(supabase, organizationId);
    const riskTags = deriveRiskTags({
      ...current.input,
      scope: body.answers,
      dataPrincipalCountEstimate: body.dataPrincipalCountEstimate,
    });

    const a = body.answers;
    const { error } = await supabase.from("organization_scopes").upsert(
      {
        organization_id: organizationId,
        children_data: a.childrenData,
        guardian_data: a.guardianData,
        ai_usage_types: a.aiUsageTypes,
        marketing_tracking: a.marketingTracking,
        cross_border: a.crossBorder,
        multi_location: a.multiLocation,
        public_facing_portal: a.publicFacingPortal,
        sensitive_documents: a.sensitiveDocuments,
        uses_data_processors: a.usesDataProcessors,
        risk_tags: riskTags,
        derived_at: new Date().toISOString(),
        updated_by: user.id,
      },
      { onConflict: "organization_id" },
    );
    if (error) throw scopeDbError(error, "update");

    const saved = await loadScopeState(supabase, organizationId);
    return ok(
      {
        organizationId,
        industryCode: saved.industryCode,
        dataPrincipalCountEstimate: saved.dataPrincipalCountEstimate,
        answers: saved.answers,
        storedRiskTags: saved.stored?.riskTags ?? [],
        derivedAt: saved.stored?.derivedAt ?? null,
        preview: previewFor(saved, permissions),
      },
      request,
    );
  },
);
