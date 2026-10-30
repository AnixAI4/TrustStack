import "server-only";
import { EXPOSURE_STATUS_LABEL, type ExposureStatus, type ModelledHeadCode, type PositionBand, type StoredSnapshotSummary } from "@truststack/core";
import { z } from "zod";
import { ApiError, rpcError, type TenantContext } from "@/lib/api/guard";
import { ok } from "@/lib/api/envelope";
import { activeMembers } from "@/lib/gaps/shape";
import type { AppSupabaseClient } from "@/lib/supabase/server";

/**
 * Exposure history (Slice 9, Stage 2): snapshots of the exposure model,
 * stored so exposure can be tracked over time and so every report records the
 * exposure it was based on (Stage 3).
 *
 * A snapshot is written ONLY by `public.record_exposure_snapshot(org)`: one
 * id in, every value derived in SQL by the mirror of core's model — exactly
 * the way a finalised score is (D-052, D-053). This file calls it and reads
 * what it stored; it computes nothing. Users may not insert, edit or delete a
 * row (no grant; an immutability trigger).
 */

const SNAPSHOT_COLUMNS =
  "id, recorded_at, recorded_by, as_of, model_version, basis, assessment_id, score_snapshot_id, heads, ceilings_at_stake, exposed_heads, applicable_heads, forecast" as const;
const SUMMARY_COLUMNS =
  "id, recorded_at, recorded_by, as_of, model_version, basis, heads, ceilings_at_stake, exposed_heads, applicable_heads" as const;

/** One stored head — `app.exposure_evaluate`'s shape. */
export interface StoredHeadRow {
  code: ModelledHeadCode;
  serial: number;
  title: string;
  ceilingCrore: number;
  applies: boolean;
  status: ExposureStatus;
  statusLabel: string;
  atStake: boolean;
  position: {
    points: number;
    band: PositionBand;
    bandLabel: string;
    fromCrore: number;
    toCrore: number;
    rangeLabel: string;
    factors: { code: string; clause: string; points: number; text: string }[];
  } | null;
  reasons: { kind: string; text: string }[];
}

interface SnapshotRow {
  id: string;
  recorded_at: string;
  recorded_by: string | null;
  as_of: string;
  model_version: string;
  basis: string;
  assessment_id?: string | null;
  score_snapshot_id?: string | null;
  heads: unknown;
  ceilings_at_stake: string | number;
  exposed_heads: number;
  applicable_heads: number;
  forecast?: unknown;
}

const heads = (value: unknown): StoredHeadRow[] => (Array.isArray(value) ? (value as StoredHeadRow[]) : []);

/** The full stored snapshot: every head with its position and reasons, and the forecast. */
function snapshotToApi(row: SnapshotRow, names: ReadonlyMap<string, string | null>) {
  return {
    id: row.id,
    recordedAt: row.recorded_at,
    recordedBy: row.recorded_by,
    recordedByName: row.recorded_by ? (names.get(row.recorded_by) ?? null) : null,
    /** The date in India it describes (D-055). */
    asOf: row.as_of,
    modelVersion: row.model_version,
    basis: row.basis,
    assessmentId: row.assessment_id ?? null,
    scoreSnapshotId: row.score_snapshot_id ?? null,
    /** Σ CEILINGS of the heads at stake — a ceiling, never a fine. */
    ceilingsAtStakeCrore: Number(row.ceilings_at_stake),
    exposedHeads: row.exposed_heads,
    applicableHeads: row.applicable_heads,
    heads: heads(row.heads),
    forecast: row.forecast ?? null,
  };
}

/** A history row: the headline and each head's status and band — no reasons. */
function summaryToApi(row: SnapshotRow, names: ReadonlyMap<string, string | null>) {
  return {
    id: row.id,
    recordedAt: row.recorded_at,
    recordedByName: row.recorded_by ? (names.get(row.recorded_by) ?? null) : null,
    asOf: row.as_of,
    modelVersion: row.model_version,
    basis: row.basis,
    ceilingsAtStakeCrore: Number(row.ceilings_at_stake),
    exposedHeads: row.exposed_heads,
    applicableHeads: row.applicable_heads,
    heads: heads(row.heads).map((h) => ({
      code: h.code,
      title: h.title,
      status: h.status,
      statusLabel: EXPOSURE_STATUS_LABEL[h.status] ?? h.statusLabel,
      atStake: h.atStake,
      band: h.position?.band ?? null,
    })),
  };
}

async function memberNames(supabase: AppSupabaseClient, organizationId: string) {
  const members = await activeMembers(supabase, organizationId);
  return new Map(members.map((m) => [m.userId, m.fullName]));
}

/** The newest stored snapshot, as "what changed" reads it — or null. */
export async function readLatestSnapshot(supabase: AppSupabaseClient, organizationId: string): Promise<StoredSnapshotSummary | null> {
  const { data, error } = await supabase
    .from("exposure_snapshots")
    .select(SUMMARY_COLUMNS)
    .eq("organization_id", organizationId)
    .order("recorded_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const row = data as unknown as SnapshotRow;
  return {
    id: row.id,
    recordedAt: row.recorded_at,
    modelVersion: row.model_version,
    ceilingsAtStakeCrore: Number(row.ceilings_at_stake),
    exposedHeads: row.exposed_heads,
    heads: heads(row.heads).map((h) => ({ code: h.code, status: h.status, position: h.position && { band: h.position.band } })),
  };
}

/** One stored snapshot in full, or null — `SELECT` by RLS, scoped to the organisation. */
export async function readSnapshot(supabase: AppSupabaseClient, organizationId: string, snapshotId: string) {
  const { data, error } = await supabase
    .from("exposure_snapshots")
    .select(SNAPSHOT_COLUMNS)
    .eq("organization_id", organizationId)
    .eq("id", snapshotId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return snapshotToApi(data as unknown as SnapshotRow, await memberNames(supabase, organizationId));
}

const historyQuery = z.object({ limit: z.coerce.number().int().min(1).max(200).default(52) }).strict();
const snapshotParams = z.object({ snapshotId: z.uuid() });

export const exposureSnapshots = {
  list: {
    // Every role holds score.read; the table's RLS asks for the same.
    options: { auth: "required", tenant: "fromParam", permission: "score.read", query: historyQuery } as const,
    handler: async (ctx: TenantContext<undefined, z.infer<typeof historyQuery>>) => {
      const { supabase, organizationId, query, request } = ctx;
      const { data, error } = await supabase
        .from("exposure_snapshots")
        .select(SUMMARY_COLUMNS)
        .eq("organization_id", organizationId)
        .order("recorded_at", { ascending: false })
        .order("id", { ascending: false })
        .limit(query.limit);
      if (error) throw error;
      const names = await memberNames(supabase, organizationId);
      return ok(
        {
          organizationId,
          /** Newest first. Each was derived in SQL when it was recorded; none is recomputed here. */
          snapshots: ((data ?? []) as unknown as SnapshotRow[]).map((r) => summaryToApi(r, names)),
        },
        request,
      );
    },
  },

  read: {
    options: { auth: "required", tenant: "fromParam", permission: "score.read" } as const,
    handler: async (ctx: TenantContext<undefined, undefined>) => {
      const { supabase, organizationId, request } = ctx;
      const parsed = snapshotParams.safeParse(ctx.params);
      // A malformed id is simply not found — the same answer as another tenant's id.
      const snapshot = parsed.success ? await readSnapshot(supabase, organizationId, parsed.data.snapshotId) : null;
      if (!snapshot) throw new ApiError(404, "NOT_FOUND", "Exposure snapshot not found.");
      return ok(snapshot, request);
    },
  },

  record: {
    // Programme roles (decision 9). The RPC checks it again, in the database.
    options: { auth: "required", tenant: "fromParam", permission: "score.calculate" } as const,
    handler: async (ctx: TenantContext<undefined, undefined>) => {
      const { supabase, organizationId, request } = ctx;
      // One id and nothing else: every value is derived inside the RPC, in
      // SQL, so there is no number for a caller to send — or to forge.
      const { data, error } = await supabase.rpc("record_exposure_snapshot", { p_organization_id: organizationId });
      if (error) throw rpcError(error) ?? error;
      const snapshot = await readSnapshot(supabase, organizationId, data as string);
      if (!snapshot) throw new ApiError(500, "INTERNAL_ERROR", "The snapshot was not stored. Try again.");
      return ok(snapshot, request, { status: 201 });
    },
  },
};
