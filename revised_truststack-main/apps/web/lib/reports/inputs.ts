import "server-only";
import {
  ACTION_SOURCE_LABEL,
  type ClosureBasis,
  type DomainCode,
  type EvidenceReviewStatus,
  type GapActionStatus,
  type GapSeverity,
  type GapState,
  type ReportActionLine,
  type ReportGapLine,
} from "@truststack/core";
import type { TenantContext } from "@/lib/api/guard";
import { listAssessments, type AssessmentRow } from "@/lib/assessments/routes";
import { questionPriority } from "@truststack/core";
import type { BreachApi } from "@/lib/breach/shape";
import { rightsContext, rightsParentName, rightsSeverity, type RightsApi } from "@/lib/rights/shape";
import { retentionContext, retentionParentName, retentionSeverity, type ScheduleApi } from "@/lib/retention/shape";
import { readRemediation } from "@/lib/dashboard/read";
import { readEvidenceIndex } from "@/lib/evidence/index-reader";
import { activeMembers, type GapApi, type Member } from "@/lib/gaps/shape";
import { readAllRecords, todayInIndia, type RecordRow, type RopaGapApi } from "@/lib/ropa/shape";

/**
 * What the Stage 4 reports read (Slice 9): every gap and action, from every
 * assessment and the register, through the SAME reader the overview's action
 * list uses (`readRemediation`, D-069), turned into plain-word lines — and,
 * for the evidence reports, the evidence index. Only shapes are changed here:
 * every severity, state, verdict and date is the stored one.
 */

type ApiAction = GapApi["actions"][number];

function actionLine(a: ApiAction, gap: Omit<ReportGapLine, "actions">): ReportActionLine {
  return {
    id: a.id,
    title: a.title,
    source: gap.source,
    sourceLabel: gap.sourceLabel,
    parentName: gap.parentName,
    context: gap.context,
    mapping: gap.mapping,
    severity: gap.severity,
    priority: gap.priority,
    gapState: gap.state,
    status: a.status as GapActionStatus,
    ownerUserId: a.ownerUserId,
    ownerName: a.ownerName,
    dueDate: a.dueDate,
    closedAt: a.closedAt,
    closedByName: a.closedByName,
    closureBasis: a.closureBasis as ClosureBasis | null,
    notes: a.notes,
    evidence: a.evidence.map((e) => ({ fileName: e.fileName, reviewStatus: e.reviewStatus as EvidenceReviewStatus })),
  };
}

function withActions(gap: Omit<ReportGapLine, "actions">, actions: readonly ApiAction[]): ReportGapLine {
  return { ...gap, actions: actions.map((a) => actionLine(a, gap)) };
}

function assessmentGapLine(assessment: AssessmentRow, g: GapApi): ReportGapLine {
  return withActions(
    {
      source: "assessment",
      sourceLabel: ACTION_SOURCE_LABEL.assessment,
      parentName: assessment.name,
      // Plain language: the domain, never a question code (D-071).
      context: g.domainName,
      mapping: { source: "assessment", domainCode: g.domainCode as DomainCode },
      finding: g.finding,
      recommendedFix: g.recommendedFix,
      severity: g.severity as GapSeverity,
      priority: g.priority,
      state: g.state as GapState,
    },
    g.actions,
  );
}

function ropaGapLine(g: RopaGapApi): ReportGapLine {
  return withActions(
    {
      source: "ropa",
      sourceLabel: ACTION_SOURCE_LABEL.ropa,
      // As the dashboard's `ropaItems` labels it.
      parentName: g.recordName ?? "The whole register",
      context: g.recordCode ? `${g.recordCode} · ${g.label}` : g.label,
      mapping: { source: "ropa", gapCode: g.gapCode },
      finding: g.finding,
      recommendedFix: g.recommendedFix,
      severity: g.severity as GapSeverity,
      priority: g.priority,
      state: g.state as GapState,
    },
    g.actions,
  );
}

/** A breach as a register line: its remedial actions, labelled as the overview's `breachItems` labels them. */
function breachLine(b: BreachApi): ReportGapLine {
  return withActions(
    {
      source: "breach",
      sourceLabel: ACTION_SOURCE_LABEL.breach,
      parentName: b.title,
      context: `${b.incidentCode} · ${b.natureLabel}`,
      mapping: { source: "breach" },
      finding: `${b.incidentCode}: ${b.title}`,
      recommendedFix: null,
      severity: b.severity as GapSeverity,
      priority: questionPriority(b.severity as GapSeverity),
      // A breach dismissed as not a personal data breach: its actions are no longer owed.
      state: (b.status === "dismissed" ? "superseded" : "open") as GapState,
    },
    b.actions,
  );
}

/**
 * A request or grievance as a register line: its remedial actions, labelled as
 * the overview's `rightsItems` labels them — by code and kind, never by the
 * person who made it.
 */
function rightsLine(r: RightsApi): ReportGapLine {
  const severity = rightsSeverity(r);
  return withActions(
    {
      source: "rights",
      sourceLabel: ACTION_SOURCE_LABEL.rights,
      parentName: rightsParentName(r),
      context: rightsContext(r),
      mapping: { source: "rights" },
      finding: `${r.requestCode}: ${r.kindLabel} (${r.provision}), received ${r.receivedOn}`,
      recommendedFix: null,
      severity,
      priority: questionPriority(severity),
      // A void request (entered in error): its actions are no longer owed.
      state: (r.status === "void" ? "superseded" : "open") as GapState,
    },
    r.actions,
  );
}

/** A retention schedule as a register line: its actions, labelled as the overview's `retentionItems` labels them. */
function retentionLine(s: ScheduleApi): ReportGapLine {
  const severity = retentionSeverity(s);
  return withActions(
    {
      source: "retention",
      sourceLabel: ACTION_SOURCE_LABEL.retention,
      parentName: retentionParentName(s),
      context: retentionContext(s),
      mapping: { source: "retention" },
      finding: `${retentionParentName(s)}: ${s.clock.label}${s.endsOn ? `, end date ${s.endsOn}` : ""}`,
      recommendedFix: null,
      severity,
      priority: questionPriority(severity),
      state: "open" as GapState,
    },
    s.actions,
  );
}

export interface RemediationLines {
  today: string;
  members: Member[];
  assessments: AssessmentRow[];
  records: RecordRow[];
  /** Assessments newest first, each one's gaps in the register's order; then the register's; then the breaches'; then the requests'; then the retention schedules'. */
  gaps: ReportGapLine[];
  actions: ReportActionLine[];
}

export async function readRemediationLines(ctx: TenantContext<unknown, unknown>): Promise<RemediationLines> {
  const { supabase, organizationId, permissions } = ctx;
  const canAssessments = permissions.has("assessment.read");
  const canRopa = permissions.has("ropa.read");
  const canGaps = permissions.has("gap.read");
  const canBreaches = permissions.has("breach.read");
  const canRights = permissions.has("rights.read");
  const canRetention = permissions.has("retention.read");
  const [members, assessments, records] = await Promise.all([
    activeMembers(supabase, organizationId),
    canAssessments ? listAssessments(supabase, organizationId) : Promise.resolve([] as AssessmentRow[]),
    canRopa ? readAllRecords(supabase, organizationId) : Promise.resolve([] as RecordRow[]),
  ]);
  const { assessmentGaps, ropaRegister, breaches, rights, retention } = await readRemediation(supabase, organizationId, members, assessments, records, {
    assessmentGaps: canGaps && canAssessments,
    ropaGaps: canGaps && canRopa,
    breaches: canGaps && canBreaches,
    rights: canGaps && canRights,
    retention: canGaps && canRetention,
  });
  const gaps = [
    ...(assessmentGaps ?? []).flatMap(({ assessment, gaps: list }) => list.map((g) => assessmentGapLine(assessment, g))),
    ...(ropaRegister?.gaps ?? []).map(ropaGapLine),
    // Slice 10: a breach with no action yet is not remediation work — only those with actions are listed.
    ...(breaches ?? []).filter((b) => b.actions.length > 0).map(breachLine),
    // Slice 10 Stage 2: likewise a request or grievance — only those with actions are remediation work.
    ...(rights ?? []).filter((r) => r.actions.length > 0).map(rightsLine),
    // Slice 10 Stage 5: and a retention schedule — only those with actions.
    ...(retention ?? []).filter((s) => s.actions.length > 0).map(retentionLine),
  ];
  return { today: todayInIndia(), members, assessments, records, gaps, actions: gaps.flatMap((g) => g.actions) };
}

/** The evidence index, its links named exactly as the remediation lines name them. */
export async function readEvidenceLines(ctx: TenantContext<unknown, unknown>, remediation: RemediationLines) {
  return readEvidenceIndex(ctx.supabase, ctx.organizationId, {
    members: remediation.members,
    assessmentNames: new Map(remediation.assessments.map((a) => [a.id, a.name])),
    actions: remediation.actions,
    records: remediation.records,
  });
}
