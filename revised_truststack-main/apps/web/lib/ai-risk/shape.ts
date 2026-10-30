import "server-only";
import {
  aiChildTrackingUnexempt,
  aiReviewDueOn,
  aiSystemUnreviewed,
  AI_SYSTEM_STATUS_LABEL,
  AI_USAGE_LABEL,
  countAiSystems,
  ROPA_CHILD_EXEMPTIONS,
  toInstant,
  type AiRegisterUsageType,
  type AiSystemStatus,
  type ExposureAiSystemInput,
  type RopaChildExemption,
  type TriState,
} from "@truststack/core";
import { evidenceByLinkedEntity, evidenceToApi } from "@/lib/evidence/shape";
import { namesFor, type Member } from "@/lib/gaps/shape";
import type { AppSupabaseClient } from "@/lib/supabase/server";

/**
 * Row → API shapes for the AI risk register (Slice 10, Stage 5), and the ONE
 * reader its routes and the exposure model share (D-069).
 *
 * Enabling, never a status (D-073): the model reads only each row's status
 * and last review, and only on head 4, which applies once an SDF notification
 * is recorded (1.5.0). Who recorded a review, and when, are the database's.
 */

/** One literal string: Supabase types a `select()` from the literal. */
export const AI_COLUMNS =
  "id, organization_id, system_id, usage_type, name, purpose, personal_data, child_tracking, child_exemption, human_review, status, last_reviewed_on, review_recorded_by, review_recorded_at, created_by, updated_by, created_at, updated_at" as const;

export interface AiRow {
  id: string;
  organization_id: string;
  system_id: string | null;
  usage_type: string | null;
  name: string;
  purpose: string;
  personal_data: string;
  child_tracking: string;
  child_exemption: string | null;
  human_review: string | null;
  status: string;
  last_reviewed_on: string | null;
  review_recorded_by: string | null;
  review_recorded_at: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

interface SystemRef {
  id: string;
  name: string;
  system_type: string;
}

export function aiToApi(
  row: AiRow,
  system: SystemRef | undefined,
  documents: ReturnType<typeof evidenceToApi>[],
  names: ReadonlyMap<string, string>,
  today: string,
) {
  const status = row.status as AiSystemStatus;
  const usage = row.usage_type as AiRegisterUsageType | null;
  const childExemption = row.child_exemption as RopaChildExemption | null;
  const exemption = ROPA_CHILD_EXEMPTIONS.find((e) => e.code === childExemption);
  return {
    id: row.id,
    name: row.name,
    systemId: row.system_id,
    system: system ? { id: system.id, name: system.name, systemType: system.system_type } : null,
    usageType: usage,
    usageLabel: usage ? (AI_USAGE_LABEL[usage] ?? usage) : null,
    purpose: row.purpose,
    personalData: row.personal_data,
    /** s.9(3): does it track, behaviourally monitor or target advertising at children? */
    childTracking: row.child_tracking as TriState,
    /** The Fourth Schedule exemption relied on (Rule 12), only when it does. */
    childExemption: childExemption,
    childExemptionLabel: exemption ? `${exemption.part} — ${exemption.label}` : null,
    /** In use, tracking children, and no exemption recorded: the register's red warning. */
    childTrackingUnexempt: aiChildTrackingUnexempt({ status, childTracking: row.child_tracking as TriState, childExemption }),
    humanReview: row.human_review,
    status,
    statusLabel: AI_SYSTEM_STATUS_LABEL[status] ?? row.status,
    lastReviewedOn: row.last_reviewed_on,
    /** Twelve months after the last review — a TrustStack default, never statute. */
    reviewDueOn: aiReviewDueOn(row.last_reviewed_on),
    /** In use and not reviewed in twelve months (1.5.0's head-4 reason, when head 4 applies). */
    reviewDue: aiSystemUnreviewed({ status, lastReviewedOn: row.last_reviewed_on }, today),
    review:
      row.review_recorded_at === null
        ? null
        : {
            at: toInstant(row.review_recorded_at),
            byUserId: row.review_recorded_by,
            byName: row.review_recorded_by ? (names.get(row.review_recorded_by) ?? null) : null,
          },
    /** Reviews, impact assessments and other documents (evidence link type `ai_system`). */
    documents,
    createdByName: row.created_by ? (names.get(row.created_by) ?? null) : null,
    createdAt: toInstant(row.created_at),
    updatedAt: toInstant(row.updated_at),
  };
}

export type AiApi = ReturnType<typeof aiToApi>;

/** The register, by name. Read as the caller (RLS applies); `aiSystemId` narrows it to one row. */
export async function readAiSystems(
  supabase: AppSupabaseClient,
  organizationId: string,
  members: readonly Member[],
  today: string,
  aiSystemId?: string,
): Promise<AiApi[]> {
  let q = supabase.from("ai_systems").select(AI_COLUMNS).eq("organization_id", organizationId);
  if (aiSystemId) q = q.eq("id", aiSystemId);
  const { data, error } = await q.order("name").order("id").limit(1000);
  if (error) throw error;
  const rows = (data ?? []) as AiRow[];
  if (rows.length === 0) return [];
  const systemIds = [...new Set(rows.map((r) => r.system_id).filter((x): x is string => x !== null))];
  const [systems, documents] = await Promise.all([
    systemIds.length === 0
      ? Promise.resolve([] as SystemRef[])
      : supabase
          .from("systems")
          .select("id, name, system_type")
          .eq("organization_id", organizationId)
          .in("id", systemIds)
          .then(({ data: s, error: e }) => {
            if (e) throw e;
            return (s ?? []) as SystemRef[];
          }),
    evidenceByLinkedEntity(supabase, organizationId, "ai_system", rows.map((r) => r.id)),
  ]);
  const byId = new Map(systems.map((s) => [s.id, s]));
  const names = await namesFor(supabase, members, rows.flatMap((r) => [r.created_by, r.review_recorded_by]));
  return rows.map((r) => aiToApi(r, r.system_id ? byId.get(r.system_id) : undefined, (documents.get(r.id) ?? []).map(evidenceToApi), names, today));
}

/**
 * The register with its headline, as `GET …/ai-systems` returns it — and as
 * the Legal Position Report reads it (Stage 6), so the two can never
 * disagree: counted in core over the rows above (D-069). Head 4 applies only
 * once an SDF notification is recorded — never inferred (D-028).
 */
export async function readAiRegister(supabase: AppSupabaseClient, organizationId: string, members: readonly Member[], today: string) {
  const [systems, org] = await Promise.all([
    readAiSystems(supabase, organizationId, members, today),
    supabase.from("organizations").select("sdf_notified_on").eq("id", organizationId).maybeSingle(),
  ]);
  if (org.error) throw org.error;
  return {
    systems,
    counts: countAiSystems(
      systems.map((s) => ({ status: s.status, lastReviewedOn: s.lastReviewedOn, childTracking: s.childTracking, childExemption: s.childExemption })),
      today,
    ),
    sdfNotified: (org.data?.sdf_notified_on ?? null) !== null,
  };
}

/** The model's facts (1.5.0), as `app.exposure_input` reads them: every row's status and last review. */
export async function readAiFacts(supabase: AppSupabaseClient, organizationId: string): Promise<ExposureAiSystemInput[]> {
  const { data, error } = await supabase
    .from("ai_systems")
    .select("status, last_reviewed_on")
    .eq("organization_id", organizationId)
    .order("created_at")
    .order("id")
    .limit(1000);
  if (error) throw error;
  return (data ?? []).map((r) => ({ status: r.status as AiSystemStatus, lastReviewedOn: r.last_reviewed_on }));
}
