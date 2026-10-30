import "server-only";
import { compareGaps, domainByCode, type DomainCode, type GapSeverity } from "@truststack/core";
import { EVIDENCE_COLUMNS, evidenceToApi, type EvidenceRow } from "@/lib/evidence/shape";
import type { AppSupabaseClient } from "@/lib/supabase/server";

/**
 * Row → API shapes for the gap register (Slice 6), and the readers the gap
 * and evidence routes share.
 *
 * Every severity, priority and adjusted score here was derived by the
 * database (migration 20261002000000_gaps_actions); the API only reports it.
 */

/** One literal string each: Supabase types a `select()` from the literal. */
export const GAP_COLUMNS =
  "id, organization_id, assessment_id, question_code, domain_code, severity, priority, adjusted_score, state, finding, recommended_fix, generated_at, updated_at" as const;
export const ACTION_COLUMNS =
  "id, organization_id, gap_id, ropa_gap_id, breach_incident_id, rights_request_id, retention_schedule_id, title, owner_user_id, owner_role, status, due_date, closed_at, closed_by, closure_basis, notes, updated_at" as const;

export interface GapRow {
  id: string;
  organization_id: string;
  assessment_id: string;
  question_code: string;
  domain_code: string;
  severity: string;
  priority: string;
  adjusted_score: number;
  state: string;
  finding: string;
  recommended_fix: string | null;
  generated_at: string;
  updated_at: string;
}

export interface ActionRow {
  id: string;
  organization_id: string;
  /** Exactly one of these is set (D-060, Slice 10): an assessment gap, a ROPA gap, a breach, a rights request, or a retention schedule. */
  gap_id: string | null;
  ropa_gap_id: string | null;
  breach_incident_id: string | null;
  rights_request_id: string | null;
  retention_schedule_id: string | null;
  title: string;
  owner_user_id: string | null;
  owner_role: string | null;
  status: string;
  due_date: string | null;
  closed_at: string | null;
  closed_by: string | null;
  closure_basis: string | null;
  notes: string | null;
  updated_at: string;
}

export interface QuestionContext {
  question_code: string;
  question_text: string;
  evidence_guidance: string | null;
  priority: string | null;
}

export interface Member {
  userId: string;
  fullName: string | null;
  roleName: string;
}

export function actionToApi(row: ActionRow, evidence: EvidenceRow[], names: ReadonlyMap<string, string>) {
  return {
    id: row.id,
    gapId: row.gap_id,
    ropaGapId: row.ropa_gap_id,
    breachIncidentId: row.breach_incident_id,
    rightsRequestId: row.rights_request_id,
    retentionScheduleId: row.retention_schedule_id,
    title: row.title,
    ownerUserId: row.owner_user_id,
    ownerName: row.owner_user_id ? (names.get(row.owner_user_id) ?? null) : null,
    /** The question's suggested owner, as authored — a role, not a person. */
    ownerRole: row.owner_role,
    status: row.status,
    /** `YYYY-MM-DD`, stored. Null = next assessment cycle (D-055). */
    dueDate: row.due_date,
    closedAt: row.closed_at,
    closedBy: row.closed_by,
    closedByName: row.closed_by ? (names.get(row.closed_by) ?? null) : null,
    closureBasis: row.closure_basis,
    notes: row.notes,
    updatedAt: row.updated_at,
    evidence: evidence.map(evidenceToApi),
  };
}

export function gapToApi(
  row: GapRow,
  question: QuestionContext | undefined,
  actions: ReturnType<typeof actionToApi>[],
) {
  const domain = domainByCode(row.domain_code);
  return {
    id: row.id,
    assessmentId: row.assessment_id,
    questionCode: row.question_code,
    questionText: question?.question_text ?? null,
    domainCode: row.domain_code,
    domainName: domain?.name ?? row.domain_code,
    severity: row.severity,
    /** From the severity — never the question's authored priority. */
    priority: row.priority,
    /** The question's own authored priority, or null: shown as "—", never guessed. */
    questionPriority: question?.priority ?? null,
    adjustedScore: row.adjusted_score,
    state: row.state,
    finding: row.finding,
    recommendedFix: row.recommended_fix,
    evidenceGuidance: question?.evidence_guidance ?? null,
    generatedAt: row.generated_at,
    actions,
  };
}

export type GapApi = ReturnType<typeof gapToApi>;

/** Linked evidence for a set of actions, grouped by action id. Links are polymorphic (D-008). */
/**
 * PostgREST carries an `in.(…)` filter in the URL, and a long list of uuids
 * outgrows it ("URI too long" — found on a 100-gap ROPA register, Slice 7).
 * Lists are sent in chunks of this many ids.
 */
export const IN_CHUNK = 80;

export function chunks<T>(items: readonly T[], size = IN_CHUNK): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

export async function evidenceByAction(
  supabase: AppSupabaseClient,
  organizationId: string,
  actionIds: string[],
): Promise<Map<string, EvidenceRow[]>> {
  const out = new Map<string, EvidenceRow[]>();
  for (const ids of chunks(actionIds)) {
    const { data, error } = await supabase
      .from("evidence_links")
      .select(`linked_entity_id, evidence(${EVIDENCE_COLUMNS})`)
      .eq("organization_id", organizationId)
      .eq("linked_entity_type", "gap_action")
      .in("linked_entity_id", ids)
      .order("linked_at");
    if (error) throw error;
    for (const link of data ?? []) {
      const evidence = link.evidence as unknown as EvidenceRow | null;
      if (!evidence) continue;
      const list = out.get(link.linked_entity_id) ?? [];
      list.push(evidence);
      out.set(link.linked_entity_id, list);
    }
  }
  return out;
}

/** The organisation's active members — who an action can be assigned to, and the names to show. */
export async function activeMembers(supabase: AppSupabaseClient, organizationId: string): Promise<Member[]> {
  const { data, error } = await supabase
    .from("organization_users")
    .select("user_id, status, roles(name), users!organization_users_user_id_fkey(full_name)")
    .eq("organization_id", organizationId)
    .eq("status", "active")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((m) => ({
    userId: m.user_id,
    fullName: m.users?.full_name ?? null,
    roleName: m.roles?.name ?? "",
  }));
}

/**
 * Names for the people an action mentions. Former members are not in
 * `activeMembers`, so anyone missing is looked up directly — RLS lets a
 * member read a co-member's row and nobody else's.
 */
export async function namesFor(
  supabase: AppSupabaseClient,
  members: readonly Member[],
  userIds: readonly (string | null)[],
): Promise<Map<string, string>> {
  const names = new Map<string, string>();
  for (const m of members) if (m.fullName) names.set(m.userId, m.fullName);
  const missing = [...new Set(userIds.filter((id): id is string => id !== null && !names.has(id)))];
  for (const ids of chunks(missing)) {
    const { data, error } = await supabase.from("users").select("id, full_name").in("id", ids);
    if (error) throw error;
    for (const u of data ?? []) if (u.full_name) names.set(u.id, u.full_name);
  }
  return names;
}

/**
 * The gaps of one assessment (or one of them), with their actions, each
 * action's evidence, and the question each gap came from — read from the
 * SNAPSHOT (`assessment_questions`), never the live bank (D-035).
 */
export async function readGaps(
  supabase: AppSupabaseClient,
  organizationId: string,
  assessmentId: string,
  members: readonly Member[],
  gapId?: string,
): Promise<GapApi[]> {
  let gapQuery = supabase
    .from("assessment_gaps")
    .select(GAP_COLUMNS)
    .eq("organization_id", organizationId)
    .eq("assessment_id", assessmentId);
  if (gapId) gapQuery = gapQuery.eq("id", gapId);
  const { data: gapData, error: gError } = await gapQuery;
  if (gError) throw gError;
  const gaps = (gapData ?? []) as GapRow[];
  if (gaps.length === 0) return [];

  // In chunks: a long `in.(…)` list outgrows the URL (Slice 7).
  const actions: ActionRow[] = [];
  const questionRows: QuestionContext[] = [];
  for (const part of chunks(gaps)) {
    const { data: actionData, error: aError } = await supabase
      .from("gap_actions")
      .select(ACTION_COLUMNS)
      .eq("organization_id", organizationId)
      .in(
        "gap_id",
        part.map((g) => g.id),
      )
      .order("created_at");
    if (aError) throw aError;
    actions.push(...((actionData ?? []) as ActionRow[]));

    const { data: questionData, error: qError } = await supabase
      .from("assessment_questions")
      .select("question_code, question_text, evidence_guidance, priority")
      .eq("organization_id", organizationId)
      .eq("assessment_id", assessmentId)
      .in(
        "question_code",
        part.map((g) => g.question_code),
      );
    if (qError) throw qError;
    questionRows.push(...((questionData ?? []) as QuestionContext[]));
  }
  const questions = new Map(questionRows.map((q) => [q.question_code, q]));

  const evidence = await evidenceByAction(
    supabase,
    organizationId,
    actions.map((a) => a.id),
  );
  const names = await namesFor(
    supabase,
    members,
    actions.flatMap((a) => [a.owner_user_id, a.closed_by]),
  );

  const actionsByGap = new Map<string, ReturnType<typeof actionToApi>[]>();
  for (const a of actions) {
    // Read by `gap_id IN (…)` above, so never a ROPA action here.
    const gapKey = a.gap_id!;
    const list = actionsByGap.get(gapKey) ?? [];
    list.push(actionToApi(a, evidence.get(a.id) ?? [], names));
    actionsByGap.set(gapKey, list);
  }

  return gaps
    .map((g) => gapToApi(g, questions.get(g.question_code), actionsByGap.get(g.id) ?? []))
    .sort((a, b) =>
      compareGaps(
        { severity: a.severity as GapSeverity, domainCode: a.domainCode as DomainCode, questionCode: a.questionCode },
        { severity: b.severity as GapSeverity, domainCode: b.domainCode as DomainCode, questionCode: b.questionCode },
      ),
    );
}

/**
 * The ASSESSMENT gap an action belongs to, read back after a write. Both ids
 * on every hop, so an action id from another organisation finds nothing. A
 * ROPA action (Slice 7) has no assessment gap: null, and the caller reads its
 * ROPA gap instead (`lib/ropa/shape.ts`).
 */
export async function readGapForAction(
  supabase: AppSupabaseClient,
  organizationId: string,
  actionId: string,
): Promise<GapApi | null> {
  const { data: action, error: aError } = await supabase
    .from("gap_actions")
    .select("gap_id")
    .eq("id", actionId)
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (aError) throw aError;
  if (!action || action.gap_id === null) return null;

  const { data: gap, error: gError } = await supabase
    .from("assessment_gaps")
    .select("id, assessment_id")
    .eq("id", action.gap_id)
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (gError) throw gError;
  if (!gap) return null;

  const members = await activeMembers(supabase, organizationId);
  const [found] = await readGaps(supabase, organizationId, gap.assessment_id, members, gap.id);
  return found ?? null;
}
