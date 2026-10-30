import "server-only";
import {
  assessScopeProfile,
  deriveRiskTags,
  exposureChanges,
  exposureFor,
  exposureForecast,
  leverage,
  slippage,
  strongestTriState,
  whatIf,
  type DomainCode,
  type ExposureBasis,
  type ExposureGapInput,
  type ExposureInput,
  type ExposureRegisterActionInput,
  type GapActionStatus,
  type GapSeverity,
  type GapState,
  type RopaGapCode,
  type StoredSnapshotSummary,
  type TriState,
} from "@truststack/core";
import { z } from "zod";
import { ApiError, type TenantContext } from "@/lib/api/guard";
import { ok } from "@/lib/api/envelope";
import { listAssessments, type AssessmentRow } from "@/lib/assessments/routes";
import { readAssessmentScore, type AssessmentScoreApi } from "@/lib/assessments/score";
import { breachItems, clockFactsOf, readBreaches } from "@/lib/breach/shape";
import { modelFactsOf, readRights, rightsItems } from "@/lib/rights/shape";
import { readConsentFacts } from "@/lib/consent/shape";
import { readVendorFacts } from "@/lib/vendors/shape";
import { readRetention, readRetentionFacts, retentionItems } from "@/lib/retention/shape";
import { readAiFacts } from "@/lib/ai-risk/shape";
import { assessmentItems, pickAssessments, ropaItems } from "@/lib/dashboard/read";
import { readGapRegister } from "@/lib/gaps/routes";
import { activeMembers } from "@/lib/gaps/shape";
import { readAllRecords, readRopaGapRegister, todayInIndia, type RecordRow } from "@/lib/ropa/shape";
import { loadScopeState, type ScopeState } from "@/lib/scope/risk";
import { readActionClosures } from "./closures";
import { readLatestSnapshot } from "./snapshots";
import type { AppSupabaseClient } from "@/lib/supabase/server";

/**
 * The live exposure model (Slice 9, Stage 1): penalty heads, statuses and
 * indicative positions for one organisation, from ONE read.
 *
 * Like the dashboard (D-069), every input is read through the routes' own
 * readers — the score, the gap register, the ROPA register and the scope —
 * so the exposure view and the page each figure links to can never disagree.
 * The model itself is `exposureFor` in `packages/core`, pure and unit-tested;
 * this file only gathers its inputs and adds no arithmetic of its own.
 *
 * Which assessment feeds it (decision 2, the `pickAssessments` rule): the
 * newest FINALISED snapshot when one exists, else the live provisional score
 * of the assessment in progress, else none — and the payload says which.
 */

/** A what-if names at most fifty actions; it writes nothing. */
const whatIfBody = z.object({ actionIds: z.array(z.uuid()).max(50) }).strict();

/** Exposure needs the whole picture: a caller who cannot read one input would see a falsely calm view. */
const INPUT_PERMISSIONS = ["assessment.read", "gap.read", "ropa.read", "breach.read", "rights.read", "consent.read", "retention.read"] as const;

function chooseAssessment(assessments: readonly AssessmentRow[]): { basis: ExposureBasis; assessment: AssessmentRow | null } {
  const { finalised, inProgress } = pickAssessments(assessments);
  if (finalised) return { basis: "finalised", assessment: finalised };
  if (inProgress) return { basis: "provisional", assessment: inProgress };
  return { basis: "none", assessment: null };
}

/**
 * The scope facts the model reads. An organisation that has never saved its
 * scope has answered nothing, and "unknown" counts as risk (D-026): every
 * tri-state is then `unknown`, never the wizard's blank-form defaults.
 */
export function scopeFacts(state: ScopeState): ExposureInput["scope"] {
  const saved = state.stored !== null;
  const { answers, input } = state;
  const unknownUnlessSaved = (value: TriState): TriState => (saved ? value : "unknown");
  const tags = new Set(deriveRiskTags(input));
  return {
    childrenData: unknownUnlessSaved(
      strongestTriState([
        answers.childrenData,
        ...input.dataPrincipalTypes.map((d) => d.includesChildren),
        ...input.systems.map((s) => s.processesChildrenData),
      ]),
    ),
    guardianData: unknownUnlessSaved(answers.guardianData),
    sensitiveDocuments: unknownUnlessSaved(answers.sensitiveDocuments),
    largeScale: assessScopeProfile(input).processingScale === "large_scale",
    locationUnknown: !saved || tags.has("cross_border_unknown"),
  };
}

function domainsFrom(score: AssessmentScoreApi): NonNullable<ExposureInput["assessment"]> {
  return {
    domains: score.domains.map((d) => ({
      code: d.code as DomainCode,
      state: d.state,
      weight: d.weight,
      questionCount: d.questionCount,
      outstandingCount: d.outstandingCount,
      percent: d.percent,
      evidenceConfidence: d.evidenceConfidence,
    })),
    redFlags: (score.overall.redFlags as readonly { code: string; domainCode: string; label: string }[]).map((f) => ({
      code: f.code,
      domainCode: f.domainCode,
      label: f.label,
    })),
  };
}

const actionFacts = (actions: readonly { id: string; ownerUserId: string | null; dueDate: string | null; status: string }[]) =>
  actions.map((a) => ({ id: a.id, ownerUserId: a.ownerUserId, dueDate: a.dueDate, status: a.status as GapActionStatus }));

/**
 * Everything the model reads, as the caller (RLS applies). `now` is the
 * instant a breach clock is read at (1.1.0); `today` is its date in India.
 */
export async function readExposureInput(
  supabase: AppSupabaseClient,
  organizationId: string,
  today: string,
  now: string = new Date().toISOString(),
) {
  const [assessments, members, records, scope, org, closedOn] = await Promise.all([
    listAssessments(supabase, organizationId),
    activeMembers(supabase, organizationId),
    readAllRecords(supabase, organizationId),
    loadScopeState(supabase, organizationId),
    supabase.from("organizations").select("sdf_notified_on").eq("id", organizationId).maybeSingle(),
    readActionClosures(supabase, organizationId, today),
  ]);
  if (org.error) throw org.error;

  const { basis, assessment } = chooseAssessment(assessments);
  const [score, gapRegister, ropaRegister, breaches, rights, consentFacts, vendors, retention, aiSystems, schedules] = await Promise.all([
    assessment ? readAssessmentScore(supabase, organizationId, assessment) : Promise.resolve(null),
    assessment ? readGapRegister(supabase, organizationId, assessment, members) : Promise.resolve(null),
    readRopaGapRegister(supabase, organizationId, members, records),
    // The register's own reader (D-069): the model reads exactly what the breach page shows.
    readBreaches(supabase, organizationId, members, now),
    // Likewise the rights register (1.2.0): what the register page shows, on today in India.
    readRights(supabase, organizationId, members, today),
    // And the consent register (1.3.0): the facts its page counts, from the same function.
    readConsentFacts(supabase, organizationId),
    // And the processor register (1.4.0): what `app.exposure_input` reads — every vendor's
    // role, contract facts and its latest accepted assessment's review-by date.
    readVendorFacts(supabase, organizationId),
    // And the retention register and the AI risk register (1.5.0): what `app.exposure_input`
    // reads — each schedule's start, derived end and latest erasure; each AI row's status and review.
    readRetentionFacts(supabase, organizationId),
    readAiFacts(supabase, organizationId),
    // 1.7.0: the retention register's own reader, for its actions — as the Actions page reads them.
    readRetention(supabase, organizationId, members, today),
  ]);

  const live = records.filter((r: RecordRow) => r.status !== "archived");
  const gaps: ExposureGapInput[] = [
    ...(gapRegister?.gaps ?? []).map((g) => ({
      source: "assessment" as const,
      domainCode: g.domainCode as DomainCode,
      severity: g.severity as GapSeverity,
      state: g.state as GapState,
      actions: actionFacts(g.actions),
    })),
    ...ropaRegister.gaps.map((g) => ({
      source: "ropa" as const,
      gapCode: g.gapCode as RopaGapCode,
      severity: g.severity as GapSeverity,
      state: g.state as GapState,
      actions: actionFacts(g.actions),
    })),
  ];

  // 1.7.0 (Q1): the actions on a breach, a request and a retention schedule — the
  // Actions page's own items (D-069), so the forecast counts what that page counts.
  const registerItems = [...breachItems(breaches), ...rightsItems(rights), ...retentionItems(schedules)];
  const registerActions: ExposureRegisterActionInput[] = registerItems.map((i) => ({
    source: i.source as ExposureRegisterActionInput["source"],
    severity: i.severity,
    state: i.gapState,
    ...actionFacts([i])[0]!,
  }));

  const input: ExposureInput = {
    today,
    now,
    basis,
    assessment: score ? domainsFrom(score) : null,
    gaps,
    registerActions,
    scope: scopeFacts(scope),
    register: {
      childrenData: live.map((r) => r.children_data as TriState),
      crossBorder: live.map((r) => r.cross_border as TriState),
    },
    sdf: { notifiedOn: org.data?.sdf_notified_on ?? null },
    breaches: breaches.map(clockFactsOf),
    rights: rights.map(modelFactsOf),
    consents: consentFacts.modelFacts,
    vendors,
    retention,
    aiSystems,
  };

  // The same action items the dashboard lists (D-069.4): title, owner,
  // source and a plain context — never a question code (D-071).
  const items = [...(assessment && gapRegister ? assessmentItems(assessment, gapRegister.gaps) : []), ...ropaItems(ropaRegister.gaps)];

  return {
    input,
    assessment,
    items,
    /** Closure dates in India over the trailing window — the forecast's pace. */
    closedOn,
    /** How current the inputs are — a stale register is reported, never hidden. */
    freshness: {
      scopeSaved: scope.stored !== null,
      assessmentProvisional: score?.overall.provisional ?? null,
      outstandingQuestions: score?.overall.outstandingCount ?? null,
      assessmentGapsStale: gapRegister?.stale ?? null,
      registerGapsGenerated: ropaRegister.generated,
      registerGapsStale: ropaRegister.stale,
    },
  };
}

/** Exposure needs the whole picture; a caller missing one input gets a 403, never a calm view built from the rest. */
export function assertExposureInputs(permissions: ReadonlySet<string>): void {
  const missing = INPUT_PERMISSIONS.filter((p) => !permissions.has(p));
  if (missing.length > 0) {
    throw new ApiError(403, "FORBIDDEN", "The exposure view needs access to the assessment, its gaps, the processing register, the breach register, the rights register, the consent register and the retention register.");
  }
}

/**
 * The live model and its intelligence, as `GET …/exposure` returns it — and
 * as the reports read it (Stage 3), so a report and the Command Centre can
 * never disagree. `last` is the stored snapshot "what changed" compares with:
 * the newest, unless the caller read an earlier one first.
 */
export async function readLiveExposure(
  supabase: AppSupabaseClient,
  organizationId: string,
  today: string,
  last: StoredSnapshotSummary | null | Promise<StoredSnapshotSummary | null>,
) {
  // The snapshot read runs alongside the inputs, as it always has.
  const [{ input, assessment, freshness, items, closedOn }, lastSnapshot] = await Promise.all([
    readExposureInput(supabase, organizationId, today),
    last,
  ]);
  const model = exposureFor(input);
  const projection = exposureForecast(input, closedOn);
  const byId = new Map(items.map((i) => [i.id, i]));

  return {
    organizationId,
    /** Live: recomputed on this read. Stored snapshots are `…/exposure/snapshots`. */
    live: true,
    assessment: assessment && {
      id: assessment.id,
      name: assessment.name,
      status: assessment.status,
      createdAt: assessment.created_at,
    },
    freshness,
    ...model,
    intelligence: {
      forecast: projection,
      /** The ten open actions that retire the most exposure (§8), with what closing each alone would change. */
      leverage: leverage(input, model).map(({ gapIndex: _gapIndex, ...entry }) => ({ ...entry, action: actionView(byId.get(entry.actionId)) })),
      slippage: slippage(input, model, projection),
      /** Against the newest stored snapshot; null until one is recorded. */
      changes: exposureChanges(lastSnapshot, model),
    },
    lastSnapshot: lastSnapshot && {
      id: lastSnapshot.id,
      recordedAt: lastSnapshot.recordedAt,
      modelVersion: lastSnapshot.modelVersion,
      ceilingsAtStakeCrore: lastSnapshot.ceilingsAtStakeCrore,
      exposedHeads: lastSnapshot.exposedHeads,
    },
  };
}

export type LiveExposure = Awaited<ReturnType<typeof readLiveExposure>>;

export const exposure = {
  read: {
    // Every role holds score.read; the model also needs every input it reads.
    options: { auth: "required", tenant: "fromParam", permission: "score.read" } as const,
    handler: async (ctx: TenantContext<undefined, undefined>) => {
      const { supabase, organizationId, permissions, request } = ctx;
      assertExposureInputs(permissions);
      return ok(await readLiveExposure(supabase, organizationId, todayInIndia(), readLatestSnapshot(supabase, organizationId)), request);
    },
  },

  whatIf: {
    options: { auth: "required", tenant: "fromParam", permission: "score.read", body: whatIfBody } as const,
    handler: async (ctx: TenantContext<z.infer<typeof whatIfBody>, undefined>) => {
      const { supabase, organizationId, permissions, request, body } = ctx;
      assertExposureInputs(permissions);
      // Read-only by construction: the model runs again on a COPY of the
      // input with these actions treated as closed. Nothing is written.
      const { input, items, closedOn } = await readExposureInput(supabase, organizationId, todayInIndia());
      const result = whatIf(input, body.actionIds, closedOn);
      const byId = new Map(items.map((i) => [i.id, i]));
      const headView = (r: typeof result.before) => ({
        headline: r.headline,
        heads: r.heads.map((h) => ({
          code: h.code,
          title: h.title,
          status: h.status,
          statusLabel: h.statusLabel,
          atStake: h.atStake,
          position: h.position && { band: h.position.band, bandLabel: h.position.bandLabel, rangeLabel: h.position.rangeLabel, points: h.position.points },
        })),
      });
      return ok(
        {
          organizationId,
          actions: result.actionIds.map((id) => ({ actionId: id, action: actionView(byId.get(id)) })),
          unknownActionIds: result.unknownActionIds,
          before: headView(result.before),
          after: headView(result.after),
          change: result.change,
          forecast: result.forecast,
          caveats: result.after.caveats,
        },
        request,
      );
    },
  },
};

/** Plain words for one action — what a screen shows. No question code, pack or trigger (D-071). */
function actionView(item: ReturnType<typeof assessmentItems>[number] | ReturnType<typeof ropaItems>[number] | undefined) {
  if (!item) return null;
  return {
    title: item.title,
    ownerUserId: item.ownerUserId,
    ownerName: item.ownerName,
    status: item.status,
    dueDate: item.dueDate,
    source: item.source,
    sourceLabel: item.sourceLabel,
    context: item.context,
    href: item.href,
    severity: item.severity,
  };
}

