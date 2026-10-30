import "server-only";
import {
  ACTION_SOURCE_LABEL,
  questionPriority,
  rightsClock,
  rightsFamily,
  RIGHTS_CAPACITY_LABEL,
  RIGHTS_CHANNEL_LABEL,
  RIGHTS_KIND_LABEL,
  RIGHTS_KIND_PROVISION,
  RIGHTS_OUTCOME_LABEL,
  RIGHTS_STATUS_LABEL,
  toInstant,
  type ActionSource,
  type ExposureRightsInput,
  type GapSeverity,
  type GapState,
  type RightsCapacity,
  type RightsChannel,
  type RightsClockFacts,
  type RightsKind,
  type RightsOutcome,
  type RightsStatus,
} from "@truststack/core";
import { evidenceByLinkedEntity, evidenceToApi } from "@/lib/evidence/shape";
import { ACTION_COLUMNS, actionToApi, evidenceByAction, namesFor, type ActionRow, type Member } from "@/lib/gaps/shape";
import type { AppSupabaseClient } from "@/lib/supabase/server";

/**
 * Row → API shapes for the rights and grievance register (Slice 10, Stage 2),
 * and the ONE reader the register's routes, the overview, the exposure model
 * and the reports all share — so a count on the overview and the register it
 * links to can never disagree (D-069).
 *
 * The request code and the respond-by date were derived by the database
 * (migration 20261012000000_rights_register); the clock is core's
 * `rightsClock`, read on `today` in India. Nothing here computes a status.
 *
 * The requester's name, email, phone and identifier are personal data. They
 * are returned to the register's readers only — the actions view and the
 * reports name a request by its code and kind, never by its person.
 */

/** One literal string: Supabase types a `select()` from the literal. */
export const RIGHTS_COLUMNS =
  "id, organization_id, request_code, kind, status, received_on, respond_by, channel, requester_name, requester_email, requester_phone, requester_capacity, principal_identifier, summary, related_request_id, nominee_name, nominee_contact, nominee_relationship, owner_user_id, identity_verified_on, identity_method, identity_recorded_by, identity_recorded_at, outcome, responded_on, response_summary, response_recorded_by, response_recorded_at, closure_reason, closed_at, closed_by, created_by, created_at, updated_at" as const;

export interface RightsRow {
  id: string;
  organization_id: string;
  request_code: string;
  kind: string;
  status: string;
  received_on: string;
  respond_by: string;
  channel: string;
  requester_name: string;
  requester_email: string | null;
  requester_phone: string | null;
  requester_capacity: string;
  principal_identifier: string | null;
  summary: string;
  related_request_id: string | null;
  nominee_name: string | null;
  nominee_contact: string | null;
  nominee_relationship: string | null;
  owner_user_id: string | null;
  identity_verified_on: string | null;
  identity_method: string | null;
  identity_recorded_by: string | null;
  identity_recorded_at: string | null;
  outcome: string | null;
  responded_on: string | null;
  response_summary: string | null;
  response_recorded_by: string | null;
  response_recorded_at: string | null;
  closure_reason: string | null;
  closed_at: string | null;
  closed_by: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

const instant = (v: string | null) => (v === null ? null : toInstant(v));

/** The raw facts the exposure model reads (core `ExposureRightsInput`). */
export function rightsFacts(row: Pick<RightsRow, "kind" | "status" | "received_on">): ExposureRightsInput {
  return { kind: row.kind as RightsKind, status: row.status as RightsStatus, receivedOn: row.received_on };
}

/** Who recorded a fact, and when — the database's stamps, never the client's. */
function recorded(by: string | null, at: string | null, names: ReadonlyMap<string, string>) {
  return at === null ? null : { at: toInstant(at), byUserId: by, byName: by ? (names.get(by) ?? null) : null };
}

export function rightsToApi(
  row: RightsRow,
  names: ReadonlyMap<string, string>,
  codes: ReadonlyMap<string, string>,
  actions: ReturnType<typeof actionToApi>[],
  today: string,
  documents: ReturnType<typeof evidenceToApi>[] = [],
) {
  const kind = row.kind as RightsKind;
  const family = rightsFamily(kind);
  const status = row.status as RightsStatus;
  return {
    id: row.id,
    requestCode: row.request_code,
    kind,
    kindLabel: RIGHTS_KIND_LABEL[kind] ?? row.kind,
    provision: RIGHTS_KIND_PROVISION[kind] ?? "",
    family,
    status,
    statusLabel: RIGHTS_STATUS_LABEL[status] ?? row.status,
    /** `YYYY-MM-DD`, India's calendar. The ninety days run from here and it cannot be edited. */
    receivedOn: row.received_on,
    /** The database's: receipt + 90 days (Rule 14(3)). */
    respondBy: row.respond_by,
    clock: rightsClock({ kind, status, receivedOn: row.received_on, respondedOn: row.responded_on }, today),
    channel: row.channel as RightsChannel,
    channelLabel: RIGHTS_CHANNEL_LABEL[row.channel as RightsChannel] ?? row.channel,
    requester: {
      name: row.requester_name,
      email: row.requester_email,
      phone: row.requester_phone,
      capacity: row.requester_capacity as RightsCapacity,
      capacityLabel: RIGHTS_CAPACITY_LABEL[row.requester_capacity as RightsCapacity] ?? row.requester_capacity,
      /** Rule 14(1)(b), (5): the identifier the person gave, e.g. an enrolment number. */
      identifier: row.principal_identifier,
    },
    summary: row.summary,
    related: row.related_request_id === null ? null : { id: row.related_request_id, requestCode: codes.get(row.related_request_id) ?? null },
    /** Rule 14(4): a nomination's nominee. */
    nominee:
      row.nominee_name === null ? null : { name: row.nominee_name, contact: row.nominee_contact, relationship: row.nominee_relationship },
    ownerUserId: row.owner_user_id,
    ownerName: row.owner_user_id ? (names.get(row.owner_user_id) ?? null) : null,
    /** How the person was identified (Rule 14(1)(b), (2)); null until recorded. */
    identity:
      row.identity_verified_on === null
        ? null
        : {
            verifiedOn: row.identity_verified_on,
            method: row.identity_method,
            recorded: recorded(row.identity_recorded_by, row.identity_recorded_at, names),
          },
    response:
      row.outcome === null || row.responded_on === null
        ? null
        : {
            outcome: row.outcome as RightsOutcome,
            outcomeLabel: RIGHTS_OUTCOME_LABEL[family][row.outcome as RightsOutcome] ?? row.outcome,
            respondedOn: row.responded_on,
            summary: row.response_summary,
            recorded: recorded(row.response_recorded_by, row.response_recorded_at, names),
          },
    closureReason: row.closure_reason,
    closedAt: instant(row.closed_at),
    closedByName: row.closed_by ? (names.get(row.closed_by) ?? null) : null,
    createdByName: row.created_by ? (names.get(row.created_by) ?? null) : null,
    createdAt: toInstant(row.created_at),
    updatedAt: toInstant(row.updated_at),
    actions,
    /** The response sent, and anything else on record (evidence link type `rights_request`, Stage 6). */
    documents,
  };
}

export type RightsApi = ReturnType<typeof rightsToApi>;

/** What core's counts read of a request the API already shaped. */
export function clockFactsOf(r: RightsApi): RightsClockFacts {
  return { kind: r.kind, status: r.status, receivedOn: r.receivedOn, respondedOn: r.response?.respondedOn ?? null };
}

/** The model's facts of a request the API already shaped — the same three the SQL mirror reads. */
export function modelFactsOf(r: RightsApi): ExposureRightsInput {
  return { kind: r.kind, status: r.status, receivedOn: r.receivedOn };
}

/**
 * The register, newest receipt first, each request with its actions and
 * their evidence. Read as the caller (RLS applies) and PAGED past PostgREST's
 * 1,000-row cap. `requestId` narrows it to one request.
 */
export async function readRights(
  supabase: AppSupabaseClient,
  organizationId: string,
  members: readonly Member[],
  today: string,
  requestId?: string,
): Promise<RightsApi[]> {
  const rows: RightsRow[] = [];
  for (let from = 0; ; from += 1000) {
    let query = supabase.from("rights_requests").select(RIGHTS_COLUMNS).eq("organization_id", organizationId);
    if (requestId) query = query.eq("id", requestId);
    const { data, error } = await query
      .order("received_on", { ascending: false })
      .order("request_code", { ascending: false })
      .order("id")
      .range(from, from + 999);
    if (error) throw error;
    rows.push(...((data ?? []) as RightsRow[]));
    if ((data ?? []).length < 1000) break;
  }
  if (rows.length === 0) return [];
  const ids = new Set(rows.map((r) => r.id));

  // The codes of the requests a grievance is about — read when they are not already in hand.
  const codes = new Map(rows.map((r) => [r.id, r.request_code]));
  const missing = [...new Set(rows.map((r) => r.related_request_id).filter((id): id is string => id !== null && !codes.has(id)))];
  if (missing.length > 0) {
    const { data, error } = await supabase
      .from("rights_requests")
      .select("id, request_code")
      .eq("organization_id", organizationId)
      .in("id", missing);
    if (error) throw error;
    for (const r of data ?? []) codes.set(r.id, r.request_code);
  }

  const actions: ActionRow[] = [];
  for (let from = 0; ; from += 1000) {
    let query = supabase
      .from("gap_actions")
      .select(ACTION_COLUMNS)
      .eq("organization_id", organizationId)
      .not("rights_request_id", "is", null);
    if (requestId) query = query.eq("rights_request_id", requestId);
    const { data, error } = await query.order("created_at").order("id").range(from, from + 999);
    if (error) throw error;
    actions.push(...((data ?? []) as ActionRow[]).filter((a) => a.rights_request_id !== null && ids.has(a.rights_request_id)));
    if ((data ?? []).length < 1000) break;
  }

  const [evidence, documents] = await Promise.all([
    evidenceByAction(supabase, organizationId, actions.map((a) => a.id)),
    evidenceByLinkedEntity(supabase, organizationId, "rights_request", [...ids]),
  ]);
  const names = await namesFor(supabase, members, [
    ...actions.flatMap((a) => [a.owner_user_id, a.closed_by]),
    ...rows.flatMap((r) => [r.owner_user_id, r.created_by, r.closed_by, r.identity_recorded_by, r.response_recorded_by]),
  ]);
  const byRequest = new Map<string, ReturnType<typeof actionToApi>[]>();
  for (const a of actions) {
    const list = byRequest.get(a.rights_request_id!) ?? [];
    list.push(actionToApi(a, evidence.get(a.id) ?? [], names));
    byRequest.set(a.rights_request_id!, list);
  }
  return rows.map((r) => rightsToApi(r, names, codes, byRequest.get(r.id) ?? [], today, (documents.get(r.id) ?? []).map(evidenceToApi)));
}

/**
 * How a request is named wherever its actions travel — the actions view, the
 * tracker, the owner's pack, the evidence index: by code and kind, never by
 * the person who made it (personal data stays in the register).
 */
export function rightsParentName(r: Pick<RightsApi, "requestCode" | "kindLabel">): string {
  return `${r.kindLabel} ${r.requestCode}`;
}

export function rightsContext(r: Pick<RightsApi, "requestCode" | "kindLabel" | "provision">): string {
  return `${r.requestCode} · ${r.kindLabel} (${r.provision})`;
}

/**
 * The register's actions in the ONE actions view (D-067), labelled by source
 * like every other. A void request's actions are no longer owed —
 * "superseded", the word a gap that no longer applies already uses. A request
 * carries no severity of its own: its remedial work is Medium on the gap
 * ladder (P2), a grievance's High (P1) — what the person complained of is the
 * organisation's own failing.
 */
export function rightsItems(requests: readonly RightsApi[]) {
  return requests.flatMap((r) =>
    r.actions.map((action) => {
      const severity = rightsSeverity(r);
      return {
        ...action,
        source: "rights" as ActionSource,
        sourceLabel: ACTION_SOURCE_LABEL.rights,
        context: rightsContext(r),
        parentName: rightsParentName(r),
        href: `/dashboard/rights/${r.id}`,
        gapState: (r.status === "void" ? "superseded" : "open") as GapState,
        severity,
        priority: questionPriority(severity),
      };
    }),
  );
}

/** The severity a request's remedial actions carry (see `rightsItems`). */
export function rightsSeverity(r: Pick<RightsApi, "family">): GapSeverity {
  return r.family === "grievance" ? "high" : "medium";
}
