import "server-only";
import {
  assessScopeProfile,
  EMPTY_SCOPE,
  explainRiskTags,
  isIndustryCode,
  selectQuestionPacks,
  type AiUsageType,
  type RiskInput,
  type RiskTag,
  type ScopeAnswers,
  type TriState,
} from "@truststack/core";
import type { AppSupabaseClient } from "@/lib/supabase/server";

export interface ScopeState {
  industryCode: string | null;
  dataPrincipalCountEstimate: number | null;
  answers: ScopeAnswers;
  /** As stored at the last save (null if never saved). */
  stored: { riskTags: RiskTag[]; derivedAt: string | null } | null;
  input: RiskInput;
}

/** Everything deriveRiskTags needs, read AS THE CALLER (RLS applies). */
export async function loadScopeState(supabase: AppSupabaseClient, organizationId: string): Promise<ScopeState> {
  const [org, scope, systems, vendors, dps] = await Promise.all([
    supabase.from("organizations").select("industry_code, data_principal_count_estimate").eq("id", organizationId).maybeSingle(),
    supabase
      .from("organization_scopes")
      .select("children_data, guardian_data, uses_data_processors, ai_usage_types, marketing_tracking, cross_border, multi_location, public_facing_portal, sensitive_documents, risk_tags, derived_at")
      .eq("organization_id", organizationId)
      .maybeSingle(),
    supabase.from("systems").select("name, system_type, hosting_model, data_location, processes_children_data").eq("organization_id", organizationId),
    supabase.from("vendors").select("name, vendor_role, cross_border").eq("organization_id", organizationId),
    supabase.from("data_principal_types").select("code, label, includes_children, estimated_count").eq("organization_id", organizationId),
  ]);
  for (const r of [org, scope, systems, vendors, dps]) if (r.error) throw r.error;

  const s = scope.data;
  const answers: ScopeAnswers = s
    ? {
        childrenData: s.children_data as TriState,
        guardianData: s.guardian_data as TriState,
        aiUsageTypes: s.ai_usage_types as AiUsageType[],
        marketingTracking: s.marketing_tracking as TriState,
        crossBorder: s.cross_border as TriState,
        multiLocation: s.multi_location,
        publicFacingPortal: s.public_facing_portal as TriState,
        sensitiveDocuments: s.sensitive_documents as TriState,
        usesDataProcessors: s.uses_data_processors as TriState,
      }
    : EMPTY_SCOPE;

  const dataPrincipalCountEstimate = org.data?.data_principal_count_estimate ?? null;
  return {
    industryCode: org.data?.industry_code ?? null,
    dataPrincipalCountEstimate,
    answers,
    stored: s ? { riskTags: s.risk_tags as RiskTag[], derivedAt: s.derived_at } : null,
    input: {
      scope: answers,
      systems: (systems.data ?? []).map((x) => ({
        name: x.name,
        systemType: x.system_type as never,
        hostingModel: x.hosting_model as never,
        dataLocation: x.data_location as never,
        processesChildrenData: x.processes_children_data as TriState,
      })),
      vendors: (vendors.data ?? []).map((x) => ({ name: x.name, vendorRole: x.vendor_role as never, crossBorder: x.cross_border as TriState })),
      dataPrincipalTypes: (dps.data ?? []).map((x) => ({
        code: x.code as never,
        label: x.label,
        includesChildren: x.includes_children as TriState,
        estimatedCount: x.estimated_count,
      })),
      dataPrincipalCountEstimate,
    },
  };
}

/** Fresh derivation + pack preview. `stale` = registers changed since the last scope save. */
export function preview(state: ScopeState) {
  const explained = explainRiskTags(state.input);
  const riskTags = explained.map((e) => e.tag);
  const industryCode = state.industryCode && isIndustryCode(state.industryCode) ? state.industryCode : null;
  return {
    industryCode,
    // Scale and vendor tiers + enhanced-review flags. Internal triggers, never an SDF classification (D-028).
    profile: assessScopeProfile(state.input),
    riskTags: explained,
    questionPacks: selectQuestionPacks({ industryCode, riskTags, aiUsageTypes: state.answers.aiUsageTypes }),
    stale: state.stored === null || state.stored.riskTags.join(",") !== riskTags.join(","),
  };
}

/**
 * The preview as the CALLER may see it: the question packs are Anix's working
 * detail (D-068, D-071), so `questionPacks` is present only for a caller who
 * holds `question.read_bank`. Every route that returns a preview uses this.
 */
export function previewFor(state: ScopeState, permissions: ReadonlySet<string>) {
  const { questionPacks, ...rest } = preview(state);
  return permissions.has("question.read_bank") ? { ...rest, questionPacks } : rest;
}
