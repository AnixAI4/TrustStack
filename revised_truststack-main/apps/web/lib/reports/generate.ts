import "server-only";
import {
  evidenceIndexWorkbook,
  evidencePack,
  exposureBrief,
  gapActionTracker,
  groupActionsByOwner,
  legalPositionReport,
  ownerActionPack,
  processorExposureReport,
  programmeStatusReport,
  reportKindDefinition,
  ropaRegisterWorkbook,
  securityBreachReport,
  ROPA_BANDS,
  ROPA_COMPLETENESS_AREAS,
  ROPA_RISK_LABEL,
  ROPA_STATUS_LABEL,
  type EvidenceIndexEntry,
  type ExposureBasis,
  type ForecastResult,
  type GapActionStatus,
  type ReportAction,
  type ReportBasisFacts,
  type ReportDocument,
  type ReportExposure,
  type ReportHeader,
  type ReportKind,
  type ReportReadiness,
  type ReportWorkbook,
  type RopaRiskRating,
  type RopaStatus,
  type StakeholderReportInput,
  type StoredSnapshotSummary,
} from "@truststack/core";
import { ApiError, rpcError, type TenantContext } from "@/lib/api/guard";
import { readDashboard, type DashboardPayload } from "@/lib/dashboard/read";
import { readLiveExposure, type LiveExposure } from "@/lib/exposure/read";
import { readLatestSnapshot, readSnapshot } from "@/lib/exposure/snapshots";
import { namesFor } from "@/lib/gaps/shape";
import { ropaExportHeaders, ropaExportRow, todayInIndia } from "@/lib/ropa/shape";
import type { Json } from "@/lib/supabase/database.types";
import type { AppSupabaseClient } from "@/lib/supabase/server";
import { readEvidenceLines, readRemediationLines, type RemediationLines } from "./inputs";
import { renderReportPdf } from "./pdf";
import { readLegalRegisters, readProcessorRegisters, readSecurityRegisters } from "./stakeholders";
import { REPORTS_BUCKET, memberNames, readReportRow, reportToApi } from "./store";
import { XLSX_CONTENT_TYPE, renderReportXlsx } from "./xlsx";

/**
 * Generating one report (Slice 9, Stages 3–4; decision 8: synchronously,
 * inside the request, for MVP sizes — `reports.status` keeps a worker's shape).
 *
 *   1. `begin_report` (SQL): the row, its version, its file name and path —
 *      for an exposure report a FRESH exposure snapshot, recorded first; for
 *      an owner's pack, the owner it names.
 *   2. Gather, through the routes' own readers: the STORED snapshot (what an
 *      exposure report prints — a report never recomputes exposure), the live
 *      intelligence the Command Centre shows, the overview's own payload, and
 *      the gap registers and the evidence index (`./inputs`).
 *   3. Build the document or the workbook in core (pure), render it to PDF
 *      or XLSX.
 *   4. Upload with the caller's JWT — Storage admits only the person who
 *      began a still-running report, at exactly its path.
 *   5. `complete_report` (SQL): ready, with the size READ from the stored
 *      object. Any failure after step 1 marks the row failed, with a reason.
 *
 * No number is computed here: every figure is the engine's, the database's
 * or the model's, and is placed by core's builders (D-069).
 */

export interface Begun {
  id: string;
  kind: ReportKind;
  format: string;
  version: number;
  asOf: string;
  fileName: string;
  storagePath: string;
  assessmentId: string | null;
  exposureSnapshotId: string | null;
}

/** Plain words for one leverage entry: the dashboard's item, never a question code (D-071). */
function leverageActions(live: LiveExposure): ReportAction[] {
  return live.intelligence.leverage.map((entry) => ({
    title: entry.action?.title ?? "An open action",
    ownerName: entry.action?.ownerName ?? (entry.ownerUserId ? "A former member" : null),
    dueDate: entry.dueDate,
    severity: entry.severity,
    sourceLabel: entry.action?.sourceLabel ?? "",
    context: entry.action?.context ?? "",
    heads: entry.heads,
  }));
}

function basisFacts(live: LiveExposure): ReportBasisFacts {
  return {
    assessmentName: live.assessment?.name ?? null,
    outstandingQuestions: live.basis === "provisional" ? live.freshness.outstandingQuestions : null,
    scopeSaved: live.freshness.scopeSaved,
    assessmentGapsStale: live.freshness.assessmentGapsStale,
    registerGapsGenerated: live.freshness.registerGapsGenerated,
    registerGapsStale: live.freshness.registerGapsStale,
  };
}

async function storedExposure(supabase: AppSupabaseClient, organizationId: string, snapshotId: string): Promise<ReportExposure> {
  const s = await readSnapshot(supabase, organizationId, snapshotId);
  if (!s) throw new Error("the exposure snapshot recorded for this report could not be read");
  return {
    snapshotId: s.id,
    recordedAt: s.recordedAt,
    asOf: s.asOf,
    modelVersion: s.modelVersion,
    basis: s.basis as ExposureBasis,
    ceilingsAtStakeCrore: s.ceilingsAtStakeCrore,
    exposedHeads: s.exposedHeads,
    applicableHeads: s.applicableHeads,
    heads: s.heads,
    forecast: s.forecast as ForecastResult,
  };
}

type ReadinessView = NonNullable<NonNullable<DashboardPayload["readiness"]>["finalised"]>;

/** The scorecard of the assessment the exposure snapshot was based on — the overview's own figures. */
function readinessFor(dashboard: DashboardPayload, assessmentId: string | null): ReportReadiness | null {
  const views = [dashboard.readiness?.finalised, dashboard.readiness?.inProgress].filter((v): v is ReadinessView => !!v);
  const view = views.find((v) => v.assessment.id === assessmentId);
  if (!view?.score) return null;
  const { score } = view;
  return {
    assessmentName: view.assessment.name,
    finalised: score.finalised,
    frozenAt: score.snapshot?.calculatedAt ?? null,
    finalScore: score.overall.finalScore,
    rawScore: score.overall.rawScore,
    scoreCap: score.overall.scoreCap,
    applicableWeight: score.overall.applicableWeight,
    maturityLevel: score.overall.maturityLevel,
    evidenceConfidence: score.overall.evidenceConfidence,
    criticalCount: score.overall.criticalCount,
    highCount: score.overall.highCount,
    outstandingCount: score.overall.outstandingCount,
    engineVersion: score.overall.engineVersion,
    // Labels and caps only — a red flag's question is bank provenance (D-071).
    redFlags: (score.overall.redFlags as readonly { label: string; cap: number }[]).map((f) => ({ label: f.label, cap: f.cap })),
    domains: score.domains.map((d) => ({
      name: d.name,
      weight: d.weight,
      state: d.state,
      score: d.score,
      percent: d.percent,
      evidenceConfidence: d.evidenceConfidence,
      status: d.status ?? null,
      questionCount: d.questionCount,
      outstandingCount: d.outstandingCount,
    })),
  };
}

async function organizationName(supabase: AppSupabaseClient, organizationId: string): Promise<string> {
  const { data, error } = await supabase.from("organizations").select("name").eq("id", organizationId).maybeSingle();
  if (error) throw error;
  return data?.name ?? "Your organisation";
}

/**
 * What one request reads, read once: the evidence pack and the Evidence
 * Index generated with it describe the SAME moment, and a report that needs
 * the gap registers twice reads them once.
 */
class Gathered {
  private remediation?: Promise<RemediationLines>;
  private evidence?: Promise<EvidenceIndexEntry[]>;
  private dashboard?: Promise<DashboardPayload>;

  constructor(private readonly ctx: TenantContext<unknown, unknown>) {}

  lines() {
    this.remediation ??= readRemediationLines(this.ctx);
    return this.remediation;
  }

  async evidenceIndex() {
    this.evidence ??= this.lines().then((r) => readEvidenceLines(this.ctx, r));
    return this.evidence;
  }

  overview() {
    this.dashboard ??= readDashboard(this.ctx as TenantContext<undefined, undefined>);
    return this.dashboard;
  }
}

export type Output = { format: "pdf"; doc: ReportDocument } | { format: "xlsx"; workbook: ReportWorkbook };

/** The kinds that keep the document they printed, so a narrative can be drafted from it (D-133.1). */
export const NARRATABLE_KINDS: readonly ReportKind[] = ["exposure_brief", "programme_status", "evidence_pack"];

interface Extras {
  /** The owner an owner's pack names. */
  ownerUserId?: string;
  /** The Evidence Index generated with an evidence pack, by file name. */
  indexFileName?: string;
}

async function exposureInputs(ctx: TenantContext<unknown, unknown>, begun: Begun, previous: StoredSnapshotSummary | null) {
  const { supabase, organizationId } = ctx;
  if (!begun.exposureSnapshotId) throw new Error("an exposure report needs its exposure snapshot");
  const [exposure, live] = await Promise.all([
    storedExposure(supabase, organizationId, begun.exposureSnapshotId),
    readLiveExposure(supabase, organizationId, todayInIndia(), previous),
  ]);
  return { exposure, live };
}

async function buildOutput(
  ctx: TenantContext<unknown, unknown>,
  begun: Begun,
  previous: StoredSnapshotSummary | null,
  gathered: Gathered,
  extras: Extras,
): Promise<Output> {
  const { supabase, organizationId, user } = ctx;
  const header: ReportHeader = {
    organizationName: await organizationName(supabase, organizationId),
    version: begun.version,
    asOf: begun.asOf,
    generatedAt: new Date().toISOString(),
    generatedByName: user.fullName,
  };

  switch (begun.kind) {
    case "exposure_brief": {
      const { exposure, live } = await exposureInputs(ctx, begun, previous);
      return { format: "pdf", doc: exposureBrief({ header, exposure, basis: basisFacts(live), topActions: leverageActions(live) }) };
    }

    case "programme_status": {
      const [{ exposure, live }, dashboard] = await Promise.all([exposureInputs(ctx, begun, previous), gathered.overview()]);
      if (!dashboard.actions || !dashboard.ropa) throw new Error("the programme report needs the actions and the register");
      const items = dashboard.actions.items.map((i) => ({ ...i, status: i.status as GapActionStatus }));
      const owners = groupActionsByOwner(items, dashboard.today).map((g) => ({
        ownerName: g.ownerUserId === null ? null : (g.items[0]?.ownerName ?? "A former member"),
        unassigned: g.ownerUserId === null,
        outstanding: g.items.length,
        overdue: g.overdue,
      }));
      return {
        format: "pdf",
        doc: programmeStatusReport({
          header,
          exposure,
          basis: basisFacts(live),
          changes: live.intelligence.changes,
          slippage: live.intelligence.slippage,
          leverage: leverageActions(live),
          actions: dashboard.actions.summary,
          owners,
          register: dashboard.ropa.counts,
          readiness: readinessFor(dashboard, begun.assessmentId),
        }),
      };
    }

    case "owner_action_pack": {
      const ownerId = extras.ownerUserId;
      if (!ownerId) throw new Error("an owner's pack needs its owner");
      const lines = await gathered.lines();
      const owner = lines.members.find((m) => m.userId === ownerId);
      const records = lines.records.filter((r) => r.owner_user_id === ownerId && r.status !== "archived");
      return {
        format: "pdf",
        doc: ownerActionPack({
          header,
          owner: { name: owner?.fullName ?? "The owner" },
          today: lines.today,
          actions: lines.actions.filter((a) => a.ownerUserId === ownerId),
          records: records.map((r) => ({
            recordCode: r.record_code,
            name: r.name,
            statusLabel: ROPA_STATUS_LABEL[r.status as RopaStatus] ?? r.status,
            completenessScore: r.completeness_score,
            bandLabel: ROPA_BANDS.find((b) => b.band === r.completeness_band)?.label ?? r.completeness_band,
            missing: (r.completeness_missing ?? []).map((m) => ROPA_COMPLETENESS_AREAS.find((a) => a.code === m)?.label ?? m),
            riskLabel: ROPA_RISK_LABEL[r.risk_rating as RopaRiskRating] ?? r.risk_rating,
            nextReviewAt: r.next_review_at,
          })),
        }),
      };
    }

    case "evidence_pack": {
      const [{ exposure, live }, dashboard, lines, entries] = await Promise.all([
        exposureInputs(ctx, begun, previous),
        gathered.overview(),
        gathered.lines(),
        gathered.evidenceIndex(),
      ]);
      return {
        format: "pdf",
        doc: evidencePack({
          header,
          exposure,
          basis: basisFacts(live),
          entries,
          actions: lines.actions,
          readiness: readinessFor(dashboard, begun.assessmentId),
          registerRecords: dashboard.ropa?.counts.total ?? lines.records.filter((r) => r.status !== "archived").length,
          indexFileName: extras.indexFileName ?? null,
        }),
      };
    }

    case "gap_action_tracker": {
      const lines = await gathered.lines();
      return { format: "xlsx", workbook: gapActionTracker({ header, today: lines.today, gaps: lines.gaps }) };
    }

    case "ropa_register": {
      const lines = await gathered.lines();
      const names = await namesFor(supabase, lines.members, lines.records.flatMap((r) => [r.owner_user_id, r.approved_by]));
      return {
        format: "xlsx",
        workbook: ropaRegisterWorkbook({ header, columns: ropaExportHeaders(), rows: lines.records.map((r) => ropaExportRow(r, names)) }),
      };
    }

    case "evidence_index":
      return { format: "xlsx", workbook: evidenceIndexWorkbook({ header, entries: await gathered.evidenceIndex() }) };

    // Slice 10, Stage 6 — one report per stakeholder, each from the registers' own readers.
    case "security_breach": {
      const [{ exposure, live }, dashboard, lines] = await Promise.all([exposureInputs(ctx, begun, previous), gathered.overview(), gathered.lines()]);
      const base: StakeholderReportInput = { header, exposure, basis: basisFacts(live), today: lines.today, actions: lines.actions };
      return {
        format: "pdf",
        doc: securityBreachReport({ ...base, ...(await readSecurityRegisters(ctx, lines.members)), readiness: readinessFor(dashboard, begun.assessmentId) }),
      };
    }

    case "legal_position": {
      const [{ exposure, live }, dashboard, lines] = await Promise.all([exposureInputs(ctx, begun, previous), gathered.overview(), gathered.lines()]);
      if (!dashboard.ropa) throw new Error("the legal position report needs the processing register");
      const base: StakeholderReportInput = { header, exposure, basis: basisFacts(live), today: lines.today, actions: lines.actions };
      return { format: "pdf", doc: legalPositionReport({ ...base, ...(await readLegalRegisters(ctx, lines.members, lines.today, dashboard.ropa.counts)) }) };
    }

    case "processor_exposure": {
      const [{ exposure, live }, lines] = await Promise.all([exposureInputs(ctx, begun, previous), gathered.lines()]);
      const base: StakeholderReportInput = { header, exposure, basis: basisFacts(live), today: lines.today, actions: lines.actions };
      return { format: "pdf", doc: processorExposureReport({ ...base, ...(await readProcessorRegisters(ctx, lines.members, lines.today)) }) };
    }
  }
}

async function render(output: Output): Promise<{ body: Buffer; contentType: string }> {
  return output.format === "pdf"
    ? { body: await renderReportPdf(output.doc), contentType: "application/pdf" }
    : { body: await renderReportXlsx(output.workbook), contentType: XLSX_CONTENT_TYPE };
}

/** What a stored failure says: where it stopped, never a stack trace or another tenant's anything. */
const FAILURE: Readonly<Record<string, string>> = {
  gather: "The report's data could not be read.",
  render: "The report could not be rendered.",
  store: "The report file could not be stored.",
  finish: "The report could not be marked as ready.",
};

export interface Generated {
  begun: Begun;
  totalMs: number;
  renderMs: number;
  bytes: number;
}

/**
 * Begin → build → render → store → finish, for any report row a `begin_*` function made.
 * Throws an ApiError, with the row marked failed, if any step after `begin` fails. A
 * narratable kind's document is stored with it, as the finish step (D-133.1).
 */
export async function runGeneration(
  ctx: TenantContext<unknown, unknown>,
  begin: () => Promise<Begun>,
  build: (begun: Begun) => Promise<Output>,
): Promise<Generated> {
  const { supabase, organizationId } = ctx;
  const started = performance.now();
  const begun = await begin();
  const kind = begun.kind;

  let stage: keyof typeof FAILURE = "gather";
  let renderMs = 0;
  let bytes = 0;
  try {
    const output = await build(begun);
    stage = "render";
    const renderStarted = performance.now();
    const file = await render(output);
    renderMs = Math.round(performance.now() - renderStarted);
    bytes = file.body.byteLength;
    stage = "store";
    const upload = await supabase.storage.from(REPORTS_BUCKET).upload(begun.storagePath, file.body, { contentType: file.contentType, upsert: false });
    if (upload.error) throw upload.error;
    stage = "finish";
    const done = await supabase.rpc("complete_report", {
      p_organization_id: organizationId,
      p_report_id: begun.id,
      ...(output.format === "pdf" && NARRATABLE_KINDS.includes(kind) ? { p_document: output.doc as unknown as Json } : {}),
    });
    if (done.error) throw done.error;
  } catch (error) {
    console.error("[reports]", kind, begun.id, stage, error instanceof Error ? error.message : error);
    await supabase.rpc("fail_report", { p_organization_id: organizationId, p_report_id: begun.id, p_error: FAILURE[stage]! });
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, "INTERNAL_ERROR", `${FAILURE[stage]} It is listed as failed; try again.`);
  }

  const totalMs = Math.round(performance.now() - started);
  console.info(`[reports] ${kind} v${begun.version} ready in ${totalMs} ms (render ${renderMs} ms, ${bytes} bytes)`);
  return { begun, totalMs, renderMs, bytes };
}

/** One report, begin to finish, from the routes' readers. */
async function generateOne(ctx: TenantContext<unknown, unknown>, kind: ReportKind, gathered: Gathered, extras: Extras): Promise<Generated> {
  const { supabase, organizationId } = ctx;
  const def = reportKindDefinition(kind);
  // "What changed" compares with the snapshot BEFORE this report's own.
  const previous = kind === "programme_status" ? await readLatestSnapshot(supabase, organizationId) : null;
  return runGeneration(
    ctx,
    async () => {
      const begin = await supabase.rpc("begin_report", {
        p_organization_id: organizationId,
        p_kind: kind,
        p_format: def.format,
        ...(def.perOwner ? { p_subject_user_id: extras.ownerUserId } : {}),
      });
      if (begin.error) throw rpcError(begin.error) ?? begin.error;
      return begin.data as unknown as Begun;
    },
    (begun) => buildOutput(ctx, begun, previous, gathered, extras),
  );
}

export async function toApi(ctx: TenantContext<unknown, unknown>, reportId: string) {
  const row = await readReportRow(ctx.supabase, ctx.organizationId, reportId);
  if (!row) throw new ApiError(500, "INTERNAL_ERROR", "The report was stored but could not be read back.");
  return reportToApi(row, await memberNames(ctx.supabase, ctx.organizationId));
}

/**
 * Generate one report — and, for the Regulator-Ready Evidence Pack, the
 * Evidence Index that goes with it (SLICE_09 §2.7: "PDF summary + XLSX
 * index"), first, from the same reads, so the summary can name it.
 */
export async function generateReport(ctx: TenantContext<unknown, unknown>, kind: ReportKind, options: { ownerUserId?: string } = {}) {
  const gathered = new Gathered(ctx);
  const companion = kind === "evidence_pack" ? await generateOne(ctx, "evidence_index", gathered, {}) : null;
  const main = await generateOne(ctx, kind, gathered, {
    ownerUserId: options.ownerUserId,
    indexFileName: companion?.begun.fileName,
  });

  return {
    report: await toApi(ctx, main.begun.id),
    /** The Evidence Index generated with an evidence pack; null otherwise. */
    companion: companion ? await toApi(ctx, companion.begun.id) : null,
    /** Measured on this request (decision 8) — not stored. */
    generation: {
      totalMs: main.totalMs + (companion?.totalMs ?? 0),
      renderMs: main.renderMs + (companion?.renderMs ?? 0),
      bytes: main.bytes,
    },
  };
}
