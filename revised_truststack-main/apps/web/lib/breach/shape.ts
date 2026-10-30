import "server-only";
import {
  ACTION_SOURCE_LABEL,
  boardClock,
  BREACH_NATURE_LABEL,
  BREACH_STATUS_LABEL,
  questionPriority,
  toInstant,
  type ActionSource,
  type BreachNature,
  type BreachSeverity,
  type BreachStatus,
  type ExposureBreachInput,
  type GapSeverity,
  type GapState,
} from "@truststack/core";
import { evidenceByLinkedEntity, evidenceToApi } from "@/lib/evidence/shape";
import { ACTION_COLUMNS, actionToApi, evidenceByAction, namesFor, type ActionRow, type Member } from "@/lib/gaps/shape";
import type { AppSupabaseClient } from "@/lib/supabase/server";

/**
 * Row → API shapes for the breach register (Slice 10, Stage 1), and the ONE
 * reader the register's routes, the overview, the exposure model and the
 * reports all share — so a count on the overview and the register it links
 * to can never disagree (D-069).
 *
 * The incident code and the Board report's due time were derived by the
 * database (migration 20261011000000_breach_register); the clock is core's
 * `boardClock`, read at `now`. Nothing here computes a status.
 */

/** One literal string: Supabase types a `select()` from the literal. */
export const BREACH_COLUMNS =
  "id, organization_id, incident_code, title, description, nature, severity, status, aware_at, occurred_at, location, principals_affected, data_categories, likely_impact, containment_measures, dismissal_reason, board_report_due_at, board_extension_until, board_extension_ref, board_extension_recorded_by, board_extension_recorded_at, board_initial_at, board_initial_recorded_by, board_initial_recorded_at, board_report_at, board_report_ref, board_report_recorded_by, board_report_recorded_at, principals_intimated_at, principals_intimation_method, principals_recorded_by, principals_recorded_at, closed_at, closed_by, created_by, created_at, updated_at" as const;

export interface BreachRow {
  id: string;
  organization_id: string;
  incident_code: string;
  title: string;
  description: string | null;
  nature: string;
  severity: string;
  status: string;
  aware_at: string;
  occurred_at: string | null;
  location: string | null;
  principals_affected: number | null;
  data_categories: string | null;
  likely_impact: string | null;
  containment_measures: string | null;
  dismissal_reason: string | null;
  board_report_due_at: string;
  board_extension_until: string | null;
  board_extension_ref: string | null;
  board_extension_recorded_by: string | null;
  board_extension_recorded_at: string | null;
  board_initial_at: string | null;
  board_initial_recorded_by: string | null;
  board_initial_recorded_at: string | null;
  board_report_at: string | null;
  board_report_ref: string | null;
  board_report_recorded_by: string | null;
  board_report_recorded_at: string | null;
  principals_intimated_at: string | null;
  principals_intimation_method: string | null;
  principals_recorded_by: string | null;
  principals_recorded_at: string | null;
  closed_at: string | null;
  closed_by: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

/** PostgREST returns `…+00:00` with microseconds; both copies of the model compare `…Z` milliseconds. */
const instant = (v: string | null) => (v === null ? null : toInstant(v));

/** The raw facts the exposure model and the counts read (core `ExposureBreachInput`). */
export function breachFacts(row: BreachRow): ExposureBreachInput {
  return {
    status: row.status as BreachStatus,
    awareAt: toInstant(row.aware_at),
    boardReportDueAt: toInstant(row.board_report_due_at),
    boardReportAt: instant(row.board_report_at),
    principalsIntimatedAt: instant(row.principals_intimated_at),
  };
}

/** Who recorded a fact, and when — the database's stamps, never the client's. */
function recorded(by: string | null, at: string | null, names: ReadonlyMap<string, string>) {
  return at === null ? null : { at: toInstant(at), byUserId: by, byName: by ? (names.get(by) ?? null) : null };
}

export function breachToApi(
  row: BreachRow,
  names: ReadonlyMap<string, string>,
  actions: ReturnType<typeof actionToApi>[],
  now: string,
  documents: ReturnType<typeof evidenceToApi>[] = [],
) {
  const facts = breachFacts(row);
  return {
    id: row.id,
    incidentCode: row.incident_code,
    title: row.title,
    description: row.description,
    nature: row.nature as BreachNature,
    natureLabel: BREACH_NATURE_LABEL[row.nature as BreachNature] ?? row.nature,
    severity: row.severity as BreachSeverity,
    status: row.status as BreachStatus,
    statusLabel: BREACH_STATUS_LABEL[row.status as BreachStatus] ?? row.status,
    awareAt: facts.awareAt,
    occurredAt: instant(row.occurred_at),
    location: row.location,
    principalsAffected: row.principals_affected,
    dataCategories: row.data_categories,
    likelyImpact: row.likely_impact,
    containmentMeasures: row.containment_measures,
    dismissalReason: row.dismissal_reason,
    /** Rule 7(2): the Board. The due time is the database's (aware + 72 h, or the extension). */
    board: {
      dueAt: facts.boardReportDueAt,
      clock: boardClock(facts, now),
      extension:
        row.board_extension_until === null
          ? null
          : {
              until: toInstant(row.board_extension_until),
              reference: row.board_extension_ref,
              recorded: recorded(row.board_extension_recorded_by, row.board_extension_recorded_at, names),
            },
      /** Rule 7(2)(a): without delay. */
      initial: row.board_initial_at === null ? null : { at: toInstant(row.board_initial_at), recorded: recorded(row.board_initial_recorded_by, row.board_initial_recorded_at, names) },
      /** Rule 7(2)(b): the detailed report. */
      report:
        row.board_report_at === null
          ? null
          : {
              at: toInstant(row.board_report_at),
              reference: row.board_report_ref,
              recorded: recorded(row.board_report_recorded_by, row.board_report_recorded_at, names),
            },
    },
    /** Rule 7(1): each affected Data Principal. */
    principals:
      row.principals_intimated_at === null
        ? null
        : {
            at: toInstant(row.principals_intimated_at),
            method: row.principals_intimation_method,
            recorded: recorded(row.principals_recorded_by, row.principals_recorded_at, names),
          },
    closedAt: instant(row.closed_at),
    closedByName: row.closed_by ? (names.get(row.closed_by) ?? null) : null,
    createdByName: row.created_by ? (names.get(row.created_by) ?? null) : null,
    createdAt: toInstant(row.created_at),
    updatedAt: toInstant(row.updated_at),
    actions,
    /** The Board's intimations, the notice to the people affected (evidence link type `breach_incident`, Stage 6). */
    documents,
  };
}

export type BreachApi = ReturnType<typeof breachToApi>;

/** What core's counts read of an incident the API already shaped — the same facts the exposure model reads. */
export function clockFactsOf(b: BreachApi): ExposureBreachInput {
  return {
    status: b.status,
    awareAt: b.awareAt,
    boardReportDueAt: b.board.dueAt,
    boardReportAt: b.board.report?.at ?? null,
    principalsIntimatedAt: b.principals?.at ?? null,
  };
}

/**
 * The register, newest awareness first, each incident with its actions and
 * their evidence. Read as the caller (RLS applies) and PAGED past PostgREST's
 * 1,000-row cap. `breachId` narrows it to one incident.
 */
export async function readBreaches(
  supabase: AppSupabaseClient,
  organizationId: string,
  members: readonly Member[],
  now: string,
  breachId?: string,
): Promise<BreachApi[]> {
  const rows: BreachRow[] = [];
  for (let from = 0; ; from += 1000) {
    let query = supabase.from("breach_incidents").select(BREACH_COLUMNS).eq("organization_id", organizationId);
    if (breachId) query = query.eq("id", breachId);
    const { data, error } = await query.order("aware_at", { ascending: false }).order("id").range(from, from + 999);
    if (error) throw error;
    rows.push(...((data ?? []) as BreachRow[]));
    if ((data ?? []).length < 1000) break;
  }
  if (rows.length === 0) return [];
  const ids = new Set(rows.map((r) => r.id));

  const actions: ActionRow[] = [];
  for (let from = 0; ; from += 1000) {
    let query = supabase
      .from("gap_actions")
      .select(ACTION_COLUMNS)
      .eq("organization_id", organizationId)
      .not("breach_incident_id", "is", null);
    if (breachId) query = query.eq("breach_incident_id", breachId);
    const { data, error } = await query.order("created_at").order("id").range(from, from + 999);
    if (error) throw error;
    actions.push(...((data ?? []) as ActionRow[]).filter((a) => a.breach_incident_id !== null && ids.has(a.breach_incident_id)));
    if ((data ?? []).length < 1000) break;
  }

  const [evidence, documents] = await Promise.all([
    evidenceByAction(supabase, organizationId, actions.map((a) => a.id)),
    evidenceByLinkedEntity(supabase, organizationId, "breach_incident", [...ids]),
  ]);
  const names = await namesFor(supabase, members, [
    ...actions.flatMap((a) => [a.owner_user_id, a.closed_by]),
    ...rows.flatMap((r) => [
      r.created_by,
      r.closed_by,
      r.board_extension_recorded_by,
      r.board_initial_recorded_by,
      r.board_report_recorded_by,
      r.principals_recorded_by,
    ]),
  ]);
  const byIncident = new Map<string, ReturnType<typeof actionToApi>[]>();
  for (const a of actions) {
    const list = byIncident.get(a.breach_incident_id!) ?? [];
    list.push(actionToApi(a, evidence.get(a.id) ?? [], names));
    byIncident.set(a.breach_incident_id!, list);
  }
  return rows.map((r) => breachToApi(r, names, byIncident.get(r.id) ?? [], now, (documents.get(r.id) ?? []).map(evidenceToApi)));
}

/**
 * A breach's actions in the ONE actions view (D-067), labelled by source like
 * every other. A dismissed breach's actions are no longer owed — "superseded",
 * the word a gap that no longer applies already uses. Priority follows the
 * incident's severity on the same ladder as every gap (critical → P0).
 */
export function breachItems(incidents: readonly BreachApi[]) {
  return incidents.flatMap((b) =>
    b.actions.map((action) => ({
      ...action,
      source: "breach" as ActionSource,
      sourceLabel: ACTION_SOURCE_LABEL.breach,
      context: `${b.incidentCode} · ${b.natureLabel}`,
      parentName: b.title,
      href: `/dashboard/breaches/${b.id}`,
      gapState: (b.status === "dismissed" ? "superseded" : "open") as GapState,
      severity: b.severity as GapSeverity,
      priority: questionPriority(b.severity as GapSeverity),
    })),
  );
}
