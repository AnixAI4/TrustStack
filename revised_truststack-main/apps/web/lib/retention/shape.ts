import "server-only";
import {
  ACTION_SOURCE_LABEL,
  ERASURE_METHOD_LABEL,
  ERASURE_STANDING_LABEL,
  erasureIncomplete,
  erasureStanding,
  lastCountingErasureOn,
  PROCESSOR_ERASURE_LABEL,
  questionPriority,
  retentionClock,
  RETENTION_BASIS_LABEL,
  RETENTION_BASIS_PROVISION,
  RETENTION_START_LABEL,
  RETENTION_STATE_LABEL,
  toInstant,
  type ActionSource,
  type ErasureFacts,
  type ErasureMethod,
  type ExposureRetentionInput,
  type GapSeverity,
  type GapState,
  type ProcessorErasureAnswer,
  type RetentionBasis,
  type RetentionFacts,
} from "@truststack/core";
import { evidenceByLinkedEntity, evidenceToApi } from "@/lib/evidence/shape";
import { ACTION_COLUMNS, actionToApi, evidenceByAction, namesFor, type ActionRow, type Member } from "@/lib/gaps/shape";
import type { AppSupabaseClient } from "@/lib/supabase/server";

/**
 * Row → API shapes for the retention register (Slice 10, Stage 5), and the ONE
 * reader its routes, the actions view, the exposure model and the reports
 * share — so a count and the register it links to can never disagree (D-069).
 *
 * The end date and the Rule 8(2) inform-by date were derived by the database
 * (migration 20261017000000_retention_ai_risk); where a schedule stands is
 * core's `retentionClock`, read on `today` in India. Nothing here computes one.
 * Which erasures count — the processors told, not marked in error — is core's
 * `erasureStanding` (D-096), the same rule as the SQL mirror's.
 */

/** One literal string each: Supabase types a `select()` from the literal. */
export const SCHEDULE_COLUMNS =
  "id, organization_id, ropa_record_id, basis, period_months, law_name, starts_on, ends_on, inform_by, notes, created_by, updated_by, created_at, updated_at" as const;
export const ERASURE_COLUMNS =
  "id, organization_id, retention_schedule_id, erased_on, method, method_note, processors_told, principals_informed_on, recorded_by, recorded_at" as const;
export const VOID_COLUMNS = "id, organization_id, retention_erasure_id, reason, voided_by, voided_at" as const;

export interface ScheduleRow {
  id: string;
  organization_id: string;
  ropa_record_id: string;
  basis: string;
  period_months: number;
  law_name: string | null;
  starts_on: string | null;
  ends_on: string | null;
  inform_by: string | null;
  notes: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ErasureRow {
  id: string;
  organization_id: string;
  retention_schedule_id: string;
  erased_on: string;
  method: string;
  method_note: string | null;
  processors_told: string;
  principals_informed_on: string | null;
  recorded_by: string | null;
  recorded_at: string;
}

/** "Recorded in error" (D-096, R4): one per erasure, never changed. */
export interface VoidRow {
  id: string;
  organization_id: string;
  retention_erasure_id: string;
  reason: string;
  voided_by: string | null;
  voided_at: string;
}

/** What the register shows of the processing activity a schedule is for. */
interface RecordRef {
  id: string;
  record_code: string;
  name: string;
  status: string;
}

/** The newest erasure first — the one that decides the current cycle. */
const newestFirst = (a: ErasureRow, b: ErasureRow) => b.erased_on.localeCompare(a.erased_on) || b.recorded_at.localeCompare(a.recorded_at);

/** One erasure as core reads it: its day, the processors' answer, and whether it was marked in error. */
export function erasureFactsOf(row: Pick<ErasureRow, "id" | "erased_on" | "processors_told">, voided: ReadonlySet<string>): ErasureFacts {
  return { erasedOn: row.erased_on, processorsTold: row.processors_told as ProcessorErasureAnswer, voided: voided.has(row.id) };
}

/** The facts the model and core's clock read of one schedule — the latest erasure that COUNTS (D-096). */
export function scheduleFacts(row: Pick<ScheduleRow, "starts_on" | "ends_on">, erasures: readonly ErasureFacts[]): RetentionFacts {
  return { startsOn: row.starts_on, endsOn: row.ends_on, lastErasedOn: lastCountingErasureOn(erasures) };
}

function erasureToApi(row: ErasureRow, voidRow: VoidRow | undefined, names: ReadonlyMap<string, string>) {
  const standing = erasureStanding({ processorsTold: row.processors_told as ProcessorErasureAnswer, voided: voidRow !== undefined });
  return {
    id: row.id,
    erasedOn: row.erased_on,
    method: row.method as ErasureMethod,
    methodLabel: ERASURE_METHOD_LABEL[row.method as ErasureMethod] ?? row.method,
    methodNote: row.method_note,
    /** s.8(7)(b). */
    processorsTold: row.processors_told as ProcessorErasureAnswer,
    processorsToldLabel: PROCESSOR_ERASURE_LABEL[row.processors_told as ProcessorErasureAnswer] ?? row.processors_told,
    /** Rule 8(2), the Third-Schedule period only. */
    principalsInformedOn: row.principals_informed_on,
    recorded: { at: toInstant(row.recorded_at), byUserId: row.recorded_by, byName: row.recorded_by ? (names.get(row.recorded_by) ?? null) : null },
    /** Counts, incomplete (processors not told) or recorded in error — only "counts" clears the overdue state (D-096). */
    standing,
    standingLabel: ERASURE_STANDING_LABEL[standing],
    /** Marked as recorded in error, by someone other than its recorder; the erasure stays, struck through. */
    void:
      voidRow === undefined
        ? null
        : {
            reason: voidRow.reason,
            at: toInstant(voidRow.voided_at),
            byUserId: voidRow.voided_by,
            byName: voidRow.voided_by ? (names.get(voidRow.voided_by) ?? null) : null,
          },
  };
}

export function scheduleToApi(
  row: ScheduleRow,
  record: RecordRef | undefined,
  erasures: readonly ErasureRow[],
  voids: ReadonlyMap<string, VoidRow>,
  documents: ReturnType<typeof evidenceToApi>[],
  actions: ReturnType<typeof actionToApi>[],
  names: ReadonlyMap<string, string>,
  today: string,
) {
  const basis = row.basis as RetentionBasis;
  const sorted = [...erasures].sort(newestFirst);
  const voided = new Set(voids.keys());
  const erasureFacts = sorted.map((e) => erasureFactsOf(e, voided));
  const facts = scheduleFacts(row, erasureFacts);
  const clock = retentionClock(facts, today);
  return {
    id: row.id,
    ropaRecordId: row.ropa_record_id,
    /** Null when the caller may not read the processing register. */
    record: record ? { id: record.id, recordCode: record.record_code, name: record.name, status: record.status } : null,
    basis,
    basisLabel: RETENTION_BASIS_LABEL[basis] ?? row.basis,
    provision: RETENTION_BASIS_PROVISION[basis] ?? "",
    startLabel: RETENTION_START_LABEL[basis] ?? "",
    periodMonths: row.period_months,
    lawName: row.law_name,
    /** `YYYY-MM-DD`, India's calendar; null = the clock has not started. */
    startsOn: row.starts_on,
    /** The database's: start + period. Null exactly when no start is recorded. */
    endsOn: row.ends_on,
    /** The database's: two days before the end — the Third-Schedule period only (Rule 8(2)). */
    informBy: row.inform_by,
    notes: row.notes,
    clock: { ...clock, label: RETENTION_STATE_LABEL[clock.state] },
    /** The latest erasure that counts (D-096). */
    lastErasedOn: facts.lastErasedOn,
    /** This cycle has an erasure whose processors were not told, and none that counts: "Erasure incomplete — processors not told". */
    erasureIncomplete: erasureIncomplete(row.starts_on, erasureFacts),
    erasures: sorted.map((e) => erasureToApi(e, voids.get(e.id), names)),
    /** The erasure certificates and other documents (evidence link type `retention_schedule`). */
    documents,
    actions,
    createdByName: row.created_by ? (names.get(row.created_by) ?? null) : null,
    updatedByName: row.updated_by ? (names.get(row.updated_by) ?? null) : null,
    createdAt: toInstant(row.created_at),
    updatedAt: toInstant(row.updated_at),
  };
}

export type ScheduleApi = ReturnType<typeof scheduleToApi>;

/** What core's counts read of a schedule the API already shaped. */
export function factsOf(s: ScheduleApi): RetentionFacts {
  return { startsOn: s.startsOn, endsOn: s.endsOn, lastErasedOn: s.lastErasedOn };
}

/** The model's facts (1.5.0) — the same three the SQL mirror reads. */
export const modelFactsOf = (s: ScheduleApi): ExposureRetentionInput => factsOf(s);

async function readAll<T>(fetchPage: (from: number) => PromiseLike<{ data: unknown[] | null; error: unknown }>): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await fetchPage(from);
    if (error) throw error;
    out.push(...((data ?? []) as T[]));
    if ((data ?? []).length < 1000) return out;
  }
}

/**
 * The register, in the processing register's order (by record code), each
 * schedule with its erasures, documents and actions. Read as the caller (RLS
 * applies) and paged past PostgREST's 1,000-row cap. `scheduleId` narrows it
 * to one schedule.
 */
export async function readRetention(
  supabase: AppSupabaseClient,
  organizationId: string,
  members: readonly Member[],
  today: string,
  scheduleId?: string,
): Promise<ScheduleApi[]> {
  const rows = await readAll<ScheduleRow>((from) => {
    let q = supabase.from("retention_schedules").select(SCHEDULE_COLUMNS).eq("organization_id", organizationId);
    if (scheduleId) q = q.eq("id", scheduleId);
    return q.order("created_at").order("id").range(from, from + 999);
  });
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);

  const [records, erasures, voids, actions, documents] = await Promise.all([
    // The processing activities, by RLS: a caller without ropa.read sees the schedule without its record's name.
    readAll<RecordRef>((from) =>
      supabase.from("ropa_records").select("id, record_code, name, status").eq("organization_id", organizationId).order("record_code").range(from, from + 999),
    ),
    readAll<ErasureRow>((from) => {
      let q = supabase.from("retention_erasures").select(ERASURE_COLUMNS).eq("organization_id", organizationId);
      if (scheduleId) q = q.eq("retention_schedule_id", scheduleId);
      return q.order("erased_on").order("id").range(from, from + 999);
    }),
    // "Recorded in error" — every void in the organisation; there are few.
    readAll<VoidRow>((from) =>
      supabase.from("retention_erasure_voids").select(VOID_COLUMNS).eq("organization_id", organizationId).order("id").range(from, from + 999),
    ),
    readAll<ActionRow>((from) => {
      let q = supabase.from("gap_actions").select(ACTION_COLUMNS).eq("organization_id", organizationId).not("retention_schedule_id", "is", null);
      if (scheduleId) q = q.eq("retention_schedule_id", scheduleId);
      return q.order("created_at").order("id").range(from, from + 999);
    }),
    evidenceByLinkedEntity(supabase, organizationId, "retention_schedule", ids),
  ]);
  const recordById = new Map(records.map((r) => [r.id, r]));
  const actionEvidence = await evidenceByAction(supabase, organizationId, actions.map((a) => a.id));
  const names = await namesFor(supabase, members, [
    ...rows.flatMap((r) => [r.created_by, r.updated_by]),
    ...erasures.map((e) => e.recorded_by),
    ...voids.map((v) => v.voided_by),
    ...actions.flatMap((a) => [a.owner_user_id, a.closed_by]),
  ]);
  const voidOf = new Map(voids.map((v) => [v.retention_erasure_id, v]));
  const erasuresOf = new Map<string, ErasureRow[]>();
  for (const e of erasures) erasuresOf.set(e.retention_schedule_id, [...(erasuresOf.get(e.retention_schedule_id) ?? []), e]);
  const actionsOf = new Map<string, ReturnType<typeof actionToApi>[]>();
  for (const a of actions) {
    actionsOf.set(a.retention_schedule_id!, [...(actionsOf.get(a.retention_schedule_id!) ?? []), actionToApi(a, actionEvidence.get(a.id) ?? [], names)]);
  }

  const shaped = rows.map((r) =>
    scheduleToApi(
      r,
      recordById.get(r.ropa_record_id),
      erasuresOf.get(r.id) ?? [],
      new Map((erasuresOf.get(r.id) ?? []).flatMap((e) => (voidOf.has(e.id) ? [[e.id, voidOf.get(e.id)!] as const] : []))),
      (documents.get(r.id) ?? []).map(evidenceToApi),
      actionsOf.get(r.id) ?? [],
      names,
      today,
    ),
  );
  // The processing register's order; a record the caller cannot read sorts last.
  return shaped.sort(
    (a, b) => (a.record?.recordCode ?? "~").localeCompare(b.record?.recordCode ?? "~") || a.createdAt.localeCompare(b.createdAt),
  );
}

/** How a schedule is named wherever its actions travel — by its record, never by its notes. */
export function retentionParentName(s: Pick<ScheduleApi, "record">): string {
  return s.record ? `Retention of ${s.record.recordCode}` : "A retention schedule";
}

export function retentionContext(s: Pick<ScheduleApi, "record" | "basisLabel" | "provision">): string {
  return `${s.record ? `${s.record.recordCode} · ` : ""}${s.basisLabel} (${s.provision})`;
}

/**
 * An overdue erasure is what sets head 7 Exposed (1.5.0): its work is High (P1)
 * on the gap ladder; any other schedule's is Medium (P2).
 */
export function retentionSeverity(s: Pick<ScheduleApi, "clock">): GapSeverity {
  return s.clock.state === "overdue" ? "high" : "medium";
}

/** The register's actions in the ONE actions view (D-067), labelled by source like every other. */
export function retentionItems(schedules: readonly ScheduleApi[]) {
  return schedules.flatMap((s) =>
    s.actions.map((action) => {
      const severity = retentionSeverity(s);
      return {
        ...action,
        source: "retention" as ActionSource,
        sourceLabel: ACTION_SOURCE_LABEL.retention,
        context: retentionContext(s),
        parentName: retentionParentName(s),
        href: `/dashboard/retention/${s.id}`,
        gapState: "open" as GapState,
        severity,
        priority: questionPriority(severity),
      };
    }),
  );
}

/**
 * The model's retention facts (1.5.0), as `app.exposure_input` reads them —
 * every schedule, its latest erasure that counts (D-096).
 */
export async function readRetentionFacts(supabase: AppSupabaseClient, organizationId: string): Promise<ExposureRetentionInput[]> {
  const [rows, erasures, voids] = await Promise.all([
    readAll<Pick<ScheduleRow, "id" | "starts_on" | "ends_on">>((from) =>
      supabase.from("retention_schedules").select("id, starts_on, ends_on").eq("organization_id", organizationId).order("created_at").order("id").range(from, from + 999),
    ),
    readAll<Pick<ErasureRow, "id" | "retention_schedule_id" | "erased_on" | "processors_told">>((from) =>
      supabase
        .from("retention_erasures")
        .select("id, retention_schedule_id, erased_on, processors_told")
        .eq("organization_id", organizationId)
        .order("id")
        .range(from, from + 999),
    ),
    readAll<Pick<VoidRow, "retention_erasure_id">>((from) =>
      supabase.from("retention_erasure_voids").select("retention_erasure_id").eq("organization_id", organizationId).order("id").range(from, from + 999),
    ),
  ]);
  const voided = new Set(voids.map((v) => v.retention_erasure_id));
  return rows.map((r) =>
    scheduleFacts(
      r,
      erasures.filter((e) => e.retention_schedule_id === r.id).map((e) => erasureFactsOf(e, voided)),
    ),
  );
}
