/**
 * Reports (Slice 9, Stage 3) — what a stored report SAYS, as data.
 *
 * A report is a document model (`ReportDocument`: sections of tiles, tables,
 * paragraphs, bullets and notices) built by a pure function per kind, then
 * rendered to PDF by the app. Building it here, framework-free, means its
 * wording, its caveats and its black-box rule are unit-tested without
 * rendering a PDF, and the renderer has no opinions of its own.
 *
 * The builders add NO arithmetic (D-069): every figure is one the engine, the
 * database or the documented model produced — a stored exposure snapshot, a
 * forecast, a score, a count of rows — and is only labelled, formatted and
 * placed here. No question code, pack code or trigger ever reaches a report
 * (D-071): the inputs carry plain words only.
 */
import { DPDP_REPORT_CAVEAT } from "./caveat.js";
import {
  ACTION_SOURCE_LABEL,
  ACTION_SOURCES,
  ropaReviewOverdue,
  type ActionSource,
  type ActionSummary,
  type RopaRegisterCounts,
} from "./dashboard.js";
import { DOMAIN_CODES, domainByCode, type DomainCode } from "./domains.js";
import { DOMAIN_STATUS_LABEL, domainStatusLabel, GAP_SEVERITY_LABEL, type DomainStatus, type GapSeverity } from "./engine.js";
import {
  CEILINGS_AT_STAKE_HEADING,
  CEILINGS_LABEL,
  COMMENCEMENT,
  EXPOSURE_HEADS,
  EXPOSURE_MAPPING,
  EXPOSURE_STATUS_LABEL,
  MODELLED_HEAD_CODES,
  MODULE_INPUTS,
  S37_NOTICE,
  UNSCORED_FACTORS,
  directHeadsOf,
  exposureCaveat,
  type ExposureBasis,
  type ExposureStatus,
  type MappingKey,
  type ModelledHeadCode,
  type PositionBand,
} from "./exposure.js";
import type { ForecastResult, Projection } from "./forecast.js";
import { countNoun } from "./words.js";
import {
  CLOSING_REVIEW_STATUSES,
  CLOSURE_REFUSAL_MESSAGE,
  GAP_ACTION_STATUS_LABEL,
  ROADMAP_WINDOWS,
  ROADMAP_WINDOW_LABEL,
  roadmapWindow,
  type ClosureBasis,
  type GapActionStatus,
  type GapState,
  type RoadmapWindow,
} from "./gaps.js";
import { dayLabel, type SlippageWarning, type WhatIfDelta } from "./intelligence.js";
import type { EvidenceReviewStatus } from "./scoring.js";
import { AI_RISK_NOTE, type AiRegisterCounts } from "./ai-risk.js";
import { BREACH_CLOCK_NOTE, BREACH_STATUS_LABEL, type BoardClockState, type BreachCounts } from "./breach.js";
import type { ConsentCounts } from "./consent.js";
import { RETENTION_DEEMED_NOTE, RETENTION_NOTE, type RetentionCounts } from "./retention.js";
import { RIGHTS_CLOCK_NOTE, type RightsCounts } from "./rights.js";
import type { TriState, VendorRole } from "./scope.js";
import { VENDOR_REVIEW_NOTE, VENDOR_RISK_NOTE } from "./vendors.js";

// ---------------------------------------------------------------------------
// The kinds — mirrored by `app.report_kinds()`: migration 20261010000000_reports,
// widened to ten by 20261018000000_slice10_reports (Slice 10, Stage 6)
// ---------------------------------------------------------------------------

export const REPORT_KINDS = [
  "exposure_brief",
  "programme_status",
  "owner_action_pack",
  "evidence_pack",
  "gap_action_tracker",
  "ropa_register",
  "evidence_index",
  // Slice 10, Stage 6: one report per stakeholder the workflow modules serve.
  "security_breach",
  "legal_position",
  "processor_exposure",
] as const;
export type ReportKind = (typeof REPORT_KINDS)[number];

export const REPORT_FORMATS = ["pdf", "xlsx"] as const;
export type ReportFormat = (typeof REPORT_FORMATS)[number];

export interface ReportKindDefinition {
  kind: ReportKind;
  label: string;
  /** Who it is for. */
  audience: string;
  /** The question it answers, in the reader's words. */
  question: string;
  format: ReportFormat;
  /** Records a fresh exposure snapshot first, and prints from it (§9). */
  recordsExposure: boolean;
  /** One per owner: the report names a person (`subject_user_id`). */
  perOwner: boolean;
  /** The file-name stem the database uses. */
  fileSlug: string;
  /** Built and offered (all seven since Slice 9 Stage 4; ten since Slice 10 Stage 6). */
  available: boolean;
}

export const REPORT_KIND_DEFINITIONS: readonly ReportKindDefinition[] = Object.freeze([
  {
    kind: "exposure_brief",
    label: "DPDP Exposure Brief",
    audience: "Board, CEO and Executive Sponsor",
    question: "How close are we to a DPDP penalty, how large could it be, and are we on track?",
    format: "pdf",
    recordsExposure: true,
    perOwner: false,
    fileSlug: "DPDP_Exposure_Brief",
    available: true,
  },
  {
    kind: "programme_status",
    label: "Programme Status Report",
    audience: "DPO and DPDP Programme Owner",
    question: "Are we moving fast enough, and where is it stuck?",
    format: "pdf",
    recordsExposure: true,
    perOwner: false,
    fileSlug: "Programme_Status_Report",
    available: true,
  },
  {
    kind: "owner_action_pack",
    label: "Owner Action Pack",
    audience: "Each action owner",
    question: "What do I personally owe, and by when?",
    format: "pdf",
    recordsExposure: false,
    perOwner: true,
    fileSlug: "Owner_Action_Pack",
    available: true,
  },
  {
    kind: "evidence_pack",
    label: "Regulator-Ready Evidence Pack",
    audience: "Auditor, reviewer, or a Board inquiry",
    question: "If the Board asked tomorrow, can we show our evidence?",
    format: "pdf",
    recordsExposure: true,
    perOwner: false,
    fileSlug: "Regulator_Ready_Evidence_Pack",
    available: true,
  },
  {
    kind: "gap_action_tracker",
    label: "Gap & Action Tracker",
    audience: "The programme team",
    question: "Every gap and action, from every register, as a working file.",
    format: "xlsx",
    recordsExposure: false,
    perOwner: false,
    fileSlug: "Gap_and_Action_Tracker",
    available: true,
  },
  {
    kind: "ropa_register",
    label: "ROPA Register",
    audience: "Register owners",
    question: "The processing register, as a working file.",
    format: "xlsx",
    recordsExposure: false,
    perOwner: false,
    fileSlug: "ROPA_Register",
    available: true,
  },
  {
    kind: "evidence_index",
    label: "Evidence Index",
    audience: "Auditor or reviewer",
    question: "Every artefact and what it evidences, as a working file.",
    format: "xlsx",
    recordsExposure: false,
    perOwner: false,
    fileSlug: "Evidence_Index",
    available: true,
  },
  {
    kind: "security_breach",
    label: "Security and Breach Report",
    audience: "CISO and the incident response team",
    question: "Could we meet Rule 7 on the next breach, and where do the open ones stand?",
    format: "pdf",
    recordsExposure: true,
    perOwner: false,
    fileSlug: "Security_and_Breach_Report",
    available: true,
  },
  {
    kind: "legal_position",
    label: "Legal Position Report",
    audience: "Counsel and the Data Protection Officer",
    question: "Where do we stand on rights, notice and consent, children and retention — and which of it is statute?",
    format: "pdf",
    recordsExposure: true,
    perOwner: false,
    fileSlug: "Legal_Position_Report",
    available: true,
  },
  {
    kind: "processor_exposure",
    label: "Processor Exposure Report",
    audience: "Procurement and vendor owners",
    question: "Which processors could expose us, and what must each contract or assessment fix?",
    format: "pdf",
    recordsExposure: true,
    perOwner: false,
    fileSlug: "Processor_Exposure_Report",
    available: true,
  },
] satisfies readonly ReportKindDefinition[]);

export function reportKindDefinition(kind: ReportKind): ReportKindDefinition {
  const found = REPORT_KIND_DEFINITIONS.find((k) => k.kind === kind);
  if (!found) throw new Error(`Unknown report kind: ${kind}`);
  return found;
}

/** The kinds a user may generate today. */
export const AVAILABLE_REPORT_KINDS: readonly ReportKind[] = Object.freeze(
  REPORT_KIND_DEFINITIONS.filter((k) => k.available).map((k) => k.kind),
);

export function isReportKind(value: string): value is ReportKind {
  return (REPORT_KINDS as readonly string[]).includes(value);
}

/** `TrustStack_DPDP_Exposure_Brief_v3_2026-10-06.pdf` — the database's `app.report_file_name`, mirrored. */
export function reportFileName(kind: ReportKind, version: number, asOf: string): string {
  const def = reportKindDefinition(kind);
  return `TrustStack_${def.fileSlug}_v${version}_${asOf}.${def.format}`;
}

export const REPORT_STATUSES = ["running", "ready", "failed"] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

export const REPORT_STATUS_LABEL: Readonly<Record<ReportStatus, string>> = Object.freeze({
  running: "Generating",
  ready: "Ready",
  failed: "Failed",
});

// ---------------------------------------------------------------------------
// The document model — what any renderer draws
// ---------------------------------------------------------------------------

export type ReportTone = "neutral" | "critical" | "warning" | "positive" | "muted";

export interface ReportTile {
  label: string;
  value: string;
  note?: string;
  tone?: ReportTone;
}

export type ReportCell = string | { text: string; tone: ReportTone };

export interface ReportColumn {
  header: string;
  /** A share of the table's width; a table's widths add up to 1. */
  width: number;
  align?: "left" | "right";
}

export type ReportBlock =
  | { type: "paragraph"; text: string; tone?: "normal" | "muted" }
  | { type: "subheading"; text: string }
  | { type: "tiles"; tiles: ReportTile[] }
  | { type: "table"; columns: ReportColumn[]; rows: ReportCell[][]; empty: string }
  | { type: "bullets"; items: string[] }
  | { type: "notice"; tone: "warning" | "info"; text: string };

export interface ReportSection {
  title: string;
  blocks: ReportBlock[];
  /** Start on a new page (an appendix). */
  pageBreakBefore?: boolean;
}

export interface ReportDocument {
  kind: ReportKind;
  title: string;
  audience: string;
  organizationName: string;
  /** Label/value pairs under the title: as of, version, basis, model. */
  meta: { label: string; value: string }[];
  sections: ReportSection[];
  /** Verbatim, on every report: D-011's, then (for an exposure report) the model's (§6.6). */
  caveats: { title: string; text: string }[];
  /** How to read it: method, commencement, ceilings. */
  notes: string[];
  footer: string;
}

/** Every word a document prints, in reading order — what the caveat and black-box tests read. */
export function reportDocumentText(doc: ReportDocument): string {
  const cell = (c: ReportCell) => (typeof c === "string" ? c : c.text);
  const parts: string[] = [doc.title, doc.audience, doc.organizationName, ...doc.meta.flatMap((m) => [m.label, m.value])];
  for (const s of doc.sections) {
    parts.push(s.title);
    for (const b of s.blocks) {
      switch (b.type) {
        case "paragraph":
        case "subheading":
        case "notice":
          parts.push(b.text);
          break;
        case "tiles":
          for (const t of b.tiles) parts.push(t.label, t.value, t.note ?? "");
          break;
        case "table":
          parts.push(...b.columns.map((c) => c.header));
          if (b.rows.length === 0) parts.push(b.empty);
          for (const r of b.rows) parts.push(...r.map(cell));
          break;
        case "bullets":
          parts.push(...b.items);
          break;
      }
    }
  }
  for (const c of doc.caveats) parts.push(c.title, c.text);
  parts.push(...doc.notes, doc.footer);
  return parts.filter((p) => p !== "").join("\n");
}

// ---------------------------------------------------------------------------
// Inputs — plain words and stored figures, read by the app's readers
// ---------------------------------------------------------------------------

export interface ReportHeader {
  organizationName: string;
  /** Per organisation + kind (+ owner), from the database. */
  version: number;
  /** The date in India the report describes (D-055). */
  asOf: string;
  /** ISO timestamp the generation started. */
  generatedAt: string;
  generatedByName: string | null;
}

/** One head of a STORED exposure snapshot — `app.exposure_evaluate`'s shape. */
export interface ReportExposureHead {
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
    rangeLabel: string;
    factors: readonly { clause: string; points: number; text: string }[];
  } | null;
  reasons: readonly { kind: string; text: string }[];
}

/** A stored exposure snapshot: what an exposure report prints. Never recomputed. */
export interface ReportExposure {
  snapshotId: string;
  recordedAt: string;
  asOf: string;
  modelVersion: string;
  basis: ExposureBasis;
  ceilingsAtStakeCrore: number;
  exposedHeads: number;
  applicableHeads: number;
  heads: readonly ReportExposureHead[];
  forecast: ForecastResult;
}

/** Which assessment fed the model, and how current each input was. */
export interface ReportBasisFacts {
  assessmentName: string | null;
  /** Questions still unanswered in a provisional assessment; null otherwise. */
  outstandingQuestions: number | null;
  scopeSaved: boolean;
  /** Null without an assessment. */
  assessmentGapsStale: boolean | null;
  registerGapsGenerated: boolean;
  registerGapsStale: boolean;
}

/** One action, in plain words — the dashboard's item, never a question code. */
export interface ReportAction {
  title: string;
  ownerName: string | null;
  dueDate: string | null;
  severity: GapSeverity;
  sourceLabel: string;
  context: string;
  /** The heads at stake it counts against (leverage). */
  heads?: readonly ModelledHeadCode[];
}

export interface ReportOwnerLoad {
  /** Null = Unassigned. */
  ownerName: string | null;
  unassigned: boolean;
  outstanding: number;
  overdue: number;
}

export interface ReportReadiness {
  assessmentName: string;
  finalised: boolean;
  /** When a finalised score was frozen (ISO), else null. */
  frozenAt: string | null;
  finalScore: number;
  rawScore: number;
  scoreCap: number;
  applicableWeight: number;
  maturityLevel: string;
  evidenceConfidence: number | null;
  criticalCount: number;
  highCount: number;
  outstandingCount: number;
  engineVersion: string;
  redFlags: readonly { label: string; cap: number }[];
  domains: readonly {
    name: string;
    weight: number;
    /** `scored` · `scoped_out` · `all_not_applicable` (D-038). */
    state: string;
    score: number | null;
    percent: number | null;
    evidenceConfidence: number | null;
    status: string | null;
    /** Questions in the domain, and those still unanswered: all unanswered reads "Not started" (Q3, F4.6). */
    questionCount: number;
    outstandingCount: number;
  }[];
}

// ---------------------------------------------------------------------------
// Wording helpers
// ---------------------------------------------------------------------------

const DEADLINE = "13 May 2027";

/** Where a count of actions comes from: every register the Actions page reads (F4.3). */
export const FROM_EVERY_REGISTER = "From every register.";

/** A stakeholder report's head detail — the heads are named on the tiles above it (F4.4). */
export const PENALTY_HEADS_SECTION_TITLE = "The penalty heads this report covers";

/** B3's words for a processor with no accepted current assessment (D-116.9), in the reports too. */
export const NO_ACCEPTED_ASSESSMENT_LABEL = "No accepted assessment";

const NOT_ANSWERED = / has not been answered yet\.$/;

/**
 * A head's "X has not been answered yet." reasons folded into ONE line —
 * "Not yet answered: X; Y; Z." — at the place of the first (F4.4). Display only:
 * the stored snapshot keeps the model's own reasons, word for word.
 */
export function foldUnansweredReasons<T extends { kind: string; text: string }>(reasons: readonly T[]): T[] {
  const names = reasons.filter((r) => r.kind === "status" && NOT_ANSWERED.test(r.text)).map((r) => r.text.replace(NOT_ANSWERED, ""));
  if (names.length === 0) return [...reasons];
  const out: T[] = [];
  let folded = false;
  for (const r of reasons) {
    if (r.kind !== "status" || !NOT_ANSWERED.test(r.text)) out.push(r);
    else if (!folded) {
      out.push({ ...r, text: `Not yet answered: ${names.join("; ")}.` });
      folded = true;
    }
  }
  return out;
}

export function croreLabel(crore: number): string {
  return `₹${crore.toLocaleString("en-IN", { maximumFractionDigits: 3 })} crore`;
}

const dateOrDash = (day: string | null) => (day ? dayLabel(day) : "—");

/** An ISO timestamp as India's date and time: "6 October 2026, 14:05 IST". */
export function timestampLabel(iso: string): string {
  const d = new Date(iso);
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("day")} ${get("month")} ${get("year")}, ${get("hour")}:${get("minute")} IST`;
}

const STATUS_TONE: Readonly<Record<ExposureStatus, ReportTone>> = Object.freeze({
  not_applicable: "muted",
  not_yet_assessed: "warning",
  exposed: "critical",
  partially_mitigated: "warning",
  mitigated: "positive",
});

const statusCell = (status: ExposureStatus): ReportCell => ({ text: EXPOSURE_STATUS_LABEL[status], tone: STATUS_TONE[status] });

const headFact = (code: ModelledHeadCode) => EXPOSURE_HEADS.find((h) => h.code === code)!;

const headName = (h: Pick<ReportExposureHead, "serial" | "title">) => `${h.serial}. ${h.title}`;

/** The Board's one page names each head briefly, with its provision; the DPO's report uses the full title. */
export const HEAD_SHORT_NAME: Readonly<Record<ModelledHeadCode, string>> = Object.freeze({
  H1: "Security safeguards",
  H2: "Breach notification",
  H3: "Children and lawful guardians",
  H4: "Significant Data Fiduciary duties",
  H7: "Any other provision",
});

const headShortName = (h: Pick<ReportExposureHead, "code" | "serial">) => {
  const provision = headFact(h.code).provision;
  return `${h.serial}. ${HEAD_SHORT_NAME[h.code]}${provision.startsWith("s.") ? ` (${provision})` : ""}`;
};

const positionText = (h: ReportExposureHead) => (h.position ? `${h.position.bandLabel}: ${h.position.rangeLabel}` : "—");

const signed = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${-n}` : "0");

function basisText(basis: ExposureBasis, facts: ReportBasisFacts): string {
  const name = facts.assessmentName ? `“${facts.assessmentName}”` : "the assessment";
  if (basis === "finalised") return `The newest finalised assessment, ${name}, as frozen.`;
  if (basis === "provisional") {
    const n = facts.outstandingQuestions ?? 0;
    return n > 0
      ? `The assessment in progress, ${name} — provisional: ${n.toLocaleString("en-IN")} ${n === 1 ? "question is" : "questions are"} still unanswered.`
      : `The assessment in progress, ${name} — provisional until it is finalised.`;
  }
  return "No assessment yet: the scope and the processing register only. A head with no evidence either way is Not yet assessed, and counts as at stake.";
}

const BASIS_LABEL: Readonly<Record<ExposureBasis, string>> = Object.freeze({
  finalised: "Finalised assessment",
  provisional: "Provisional — assessment in progress",
  none: "No assessment yet",
});

/** What is out of date, said plainly — a stale input is reported, never hidden. */
function freshnessNotes(facts: ReportBasisFacts): string[] {
  const out: string[] = [];
  if (!facts.scopeSaved) out.push("The organisation's scope has not been saved, so every scope fact counts as not yet known.");
  if (facts.assessmentGapsStale) out.push("The assessment's gap register is out of date: answers changed after it was last generated.");
  if (!facts.registerGapsGenerated) out.push("The processing register's gaps have never been generated.");
  else if (facts.registerGapsStale) out.push("The processing register's gaps are out of date: records changed after they were last generated.");
  return out;
}

/** One notice for everything out of date, or none. */
function freshnessBlocks(facts: ReportBasisFacts): ReportBlock[] {
  const notes = freshnessNotes(facts);
  return notes.length > 0 ? [{ type: "notice", tone: "info", text: notes.join(" ") }] : [];
}

function projectionText(p: Projection, notEnoughHistory: boolean): { likely: string; cautious: string } {
  if (p.outstanding === 0) return { likely: "Nothing outstanding", cautious: "—" };
  if (notEnoughHistory) return { likely: "Not enough history", cautious: "—" };
  return {
    likely: p.beyondHorizon.p50 ? "Beyond five years" : dateOrDash(p.p50Date),
    cautious: p.beyondHorizon.p85 ? "Beyond five years" : dateOrDash(p.p85Date),
  };
}

/** One sentence per kind of work, for the Board: what is left and when it is likely to finish. */
function paceSentence(label: string, p: Projection, notEnoughHistory: boolean): string {
  const n = p.outstanding.toLocaleString("en-IN");
  if (p.outstanding === 0) return `${label}: nothing outstanding.`;
  if (notEnoughHistory) return `${label}: ${n} outstanding; not enough history yet to forecast a finish date.`;
  if (p.beyondHorizon.p50) return `${label}: ${n} outstanding; at the current pace it would not finish within five years.`;
  const cautious = p.beyondHorizon.p85 ? "beyond five years" : dateOrDash(p.p85Date);
  return `${label}: ${n} outstanding, likely to finish ${dateOrDash(p.p50Date)} (cautious: ${cautious}).`;
}

function headlineTiles(e: ReportExposure): ReportTile[] {
  const ch = projectionText(e.forecast.criticalHigh, e.forecast.notEnoughHistory);
  const days = e.forecast.daysToDeadline;
  return [
    {
      label: CEILINGS_AT_STAKE_HEADING,
      value: croreLabel(e.ceilingsAtStakeCrore),
      note: CEILINGS_LABEL,
      tone: e.exposedHeads > 0 ? "critical" : "positive",
    },
    {
      label: "Penalty heads at stake",
      value: `${e.exposedHeads} of ${e.applicableHeads}`,
      note: "Exposed, partially mitigated or not yet assessed, of the heads that apply.",
      tone: e.exposedHeads > 0 ? "warning" : "positive",
    },
    {
      label: `Days to ${DEADLINE}`,
      value: days >= 0 ? days.toLocaleString("en-IN") : "Passed",
      note: "When most of the DPDP Rules commence.",
    },
    {
      label: "Critical and high work finishes",
      value: ch.likely,
      note: ch.cautious === "—" ? "At the current pace." : `Likely date at the current pace; cautious: ${ch.cautious}.`,
      tone: e.forecast.criticalHigh.meetsDeadline.p50 === false ? "critical" : "neutral",
    },
  ];
}

function s37Block(e: ReportExposure): ReportBlock[] {
  // The model's rule: shown whenever any head is at stake (§6.5).
  return e.exposedHeads > 0 ? [{ type: "notice", tone: "warning", text: S37_NOTICE }] : [];
}

const notModelledText = () =>
  "Not modelled: " +
  EXPOSURE_HEADS.filter((h) => !h.modelled)
    .map((h) => `${h.serial}. ${h.title} (${h.ceilingLabel}) — ${h.notModelledReason}`)
    .join(" ");

function caveats(modelVersion: string | null): ReportDocument["caveats"] {
  return [
    { title: "About this report", text: DPDP_REPORT_CAVEAT },
    ...(modelVersion ? [{ title: "About the exposure figures", text: exposureCaveat(modelVersion) }] : []),
  ];
}

function exposureNotes(): string[] {
  return [
    CEILINGS_LABEL,
    COMMENCEMENT.note,
    "Indicative positions use the factors in section 33(2) that TrustStack can observe. " +
      UNSCORED_FACTORS.map((f) => `${f.clause} ${f.label}`).join(" "),
  ];
}

function headerMeta(header: ReportHeader, e: ReportExposure): ReportDocument["meta"] {
  return [
    { label: "As of", value: dayLabel(header.asOf) },
    { label: "Version", value: String(header.version) },
    { label: "Basis", value: BASIS_LABEL[e.basis] },
    { label: "Exposure model", value: e.modelVersion },
    { label: "Generated", value: `${timestampLabel(header.generatedAt)}${header.generatedByName ? ` by ${header.generatedByName}` : ""}` },
  ];
}

const footer = (header: ReportHeader, title: string) =>
  `TrustStack DPDP Compass · ${title} v${header.version} · ${header.organizationName} · Confidential`;

const headsLabel = (heads: readonly ModelledHeadCode[] | undefined) =>
  heads && heads.length > 0 ? heads.map((c) => `Head ${headFact(c).serial}`).join(", ") : "—";

const ownerLabel = (name: string | null) => name ?? "Unassigned";

// ---------------------------------------------------------------------------
// DPDP Exposure Brief — the Board's page
// ---------------------------------------------------------------------------

export interface ExposureBriefInput {
  header: ReportHeader;
  exposure: ReportExposure;
  basis: ReportBasisFacts;
  /** The leverage ranking, highest first; the brief prints the top five. */
  topActions: readonly ReportAction[];
}

export const EXPOSURE_BRIEF_TOP_ACTIONS = 5;

export function exposureBrief(input: ExposureBriefInput): ReportDocument {
  const { header, exposure: e, basis } = input;
  const def = reportKindDefinition("exposure_brief");
  const modelled = e.heads;
  const firstReason = (h: ReportExposureHead) => {
    const reasons = foldUnansweredReasons(h.reasons);
    return reasons.find((r) => r.kind === "status")?.text ?? reasons[0]?.text ?? "—";
  };
  const pace = e.forecast;

  return {
    kind: "exposure_brief",
    title: def.label,
    audience: `For the ${def.audience}`,
    organizationName: header.organizationName,
    meta: headerMeta(header, e),
    sections: [
      {
        title: "Where you stand",
        blocks: [
          { type: "tiles", tiles: headlineTiles(e) },
          ...s37Block(e),
          { type: "paragraph", text: `Based on: ${basisText(e.basis, basis)}`, tone: "muted" },
          ...freshnessBlocks(basis),
        ],
      },
      {
        title: "Exposure by penalty head (the Schedule, s.33(1))",
        blocks: [
          {
            type: "table",
            columns: [
              { header: "Penalty head", width: 0.2 },
              { header: "Status", width: 0.12 },
              { header: "Ceiling", width: 0.09 },
              { header: "Indicative position", width: 0.17 },
              { header: "Main reason", width: 0.42 },
            ],
            rows: modelled.map((h) => [
              headShortName(h),
              statusCell(h.status),
              headFact(h.code).ceilingLabel,
              positionText(h),
              h.applies ? firstReason(h) : (h.reasons[0]?.text ?? "Does not apply."),
            ]),
            empty: "No penalty head was evaluated.",
          },
        ],
      },
      {
        title: "The actions that retire the most exposure",
        blocks: [
          {
            type: "table",
            columns: [
              { header: "Action", width: 0.46 },
              { header: "Penalty heads", width: 0.14 },
              { header: "Severity", width: 0.1 },
              { header: "Owner", width: 0.17 },
              { header: "Due", width: 0.13 },
            ],
            rows: input.topActions
              .slice(0, EXPOSURE_BRIEF_TOP_ACTIONS)
              .map((a) => [a.title, headsLabel(a.heads), GAP_SEVERITY_LABEL[a.severity], ownerLabel(a.ownerName), dateOrDash(a.dueDate)]),
            empty: "No open action counts against a penalty head that is at stake.",
          },
        ],
      },
      {
        title: "Pace",
        blocks: [
          {
            type: "paragraph",
            text: [
              paceSentence("Critical and high work", pace.criticalHigh, pace.notEnoughHistory),
              paceSentence("All work", pace.all, pace.notEnoughHistory),
              pace.all.requiredPerWeek === null
                ? `${DEADLINE} has passed.`
                : `Closing about ${countNoun(pace.averagePerWeek, "action", "actions")} a week; ${pace.all.requiredPerWeek} a week are needed to finish all work by ${DEADLINE}.`,
            ].join(" "),
          },
        ],
      },
    ],
    caveats: caveats(e.modelVersion),
    notes: [notModelledText(), ...exposureNotes()],
    footer: footer(header, def.label),
  };
}

// ---------------------------------------------------------------------------
// Programme Status Report — the DPO's report, with the scorecard as an appendix
// ---------------------------------------------------------------------------

export interface ProgrammeStatusInput {
  header: ReportHeader;
  exposure: ReportExposure;
  basis: ReportBasisFacts;
  /** Against the snapshot recorded BEFORE this report's; null when this is the first. */
  changes: { since: { recordedAt: string; modelVersion: string }; modelChanged: boolean; change: WhatIfDelta } | null;
  slippage: readonly SlippageWarning[];
  /** The leverage ranking, highest first (top ten). */
  leverage: readonly ReportAction[];
  actions: ActionSummary;
  owners: readonly ReportOwnerLoad[];
  register: RopaRegisterCounts;
  readiness: ReportReadiness | null;
}

const WEEK_LABELS = ["Latest week", "2 weeks ago", "3 weeks ago", "4 weeks ago", "5 weeks ago", "6 weeks ago", "7 weeks ago", "8 weeks ago"];

function headSections(e: ReportExposure): ReportBlock[] {
  const blocks: ReportBlock[] = [];
  for (const h of e.heads) {
    const fact = headFact(h.code);
    blocks.push({ type: "subheading", text: `${headName(h)} (${fact.provision}) — ceiling ${fact.ceilingLabel}` });
    blocks.push({
      type: "paragraph",
      text:
        `Status: ${EXPOSURE_STATUS_LABEL[h.status]}.` +
        (h.position ? ` Indicative position: ${h.position.bandLabel.toLowerCase()}, ${h.position.rangeLabel} (${h.position.points} ${h.position.points === 1 ? "point" : "points"}).` : ""),
    });
    if (h.reasons.length > 0) blocks.push({ type: "bullets", items: foldUnansweredReasons(h.reasons).map((r) => r.text) });
    if (h.position && h.position.factors.length > 0) {
      blocks.push({
        type: "paragraph",
        tone: "muted",
        text: "Position factors, s.33(2): " + h.position.factors.map((f) => `${f.clause} ${f.text} ${signed(f.points)}`).join("; ") + ".",
      });
    }
  }
  blocks.push({ type: "paragraph", text: notModelledText(), tone: "muted" });
  return blocks;
}

function forecastBlocks(f: ForecastResult): ReportBlock[] {
  const row = (label: string, p: Projection): ReportCell[] => {
    const t = projectionText(p, f.notEnoughHistory);
    return [label, p.outstanding.toLocaleString("en-IN"), p.requiredPerWeek === null ? "—" : String(p.requiredPerWeek), t.likely, t.cautious];
  };
  return [
    {
      type: "table",
      columns: [
        { header: "Work", width: 0.24 },
        { header: "Outstanding", width: 0.14, align: "right" },
        { header: `Needed a week to finish by ${DEADLINE}`, width: 0.22, align: "right" },
        { header: "Likely finish (P50)", width: 0.2 },
        { header: "Cautious finish (P85)", width: 0.2 },
      ],
      rows: [row("Critical and high", f.criticalHigh), row("All work", f.all)],
      empty: "—",
    },
    {
      type: "paragraph",
      text: `Pace: about ${countNoun(f.averagePerWeek, "action", "actions")} closed a week over the last eight weeks; ${f.activeWeeks} of those eight weeks closed at least one.`,
    },
    {
      type: "table",
      columns: [
        { header: "Actions closed", width: 0.2 },
        ...f.weeklyClosures.map((_, i) => ({ header: WEEK_LABELS[i] ?? `${i + 1} weeks ago`, width: 0.1, align: "right" as const })),
      ],
      rows: [["Each week", ...f.weeklyClosures.map((n) => String(n))]],
      empty: "No closures recorded.",
    },
    { type: "paragraph", text: `Method: ${f.method}`, tone: "muted" },
  ];
}

/**
 * What moved since the snapshot, in one sentence (F4.5): "No change since the
 * snapshot of …" when neither figure moved — never "went from ₹700 crore to ₹700 crore".
 */
export function changeSentence(c: NonNullable<ProgrammeStatusInput["changes"]>): string {
  const { ceilingsAtStakeCrore: ceilings, exposedHeads: heads } = c.change;
  const when = timestampLabel(c.since.recordedAt);
  if (ceilings.from === ceilings.to && heads.from === heads.to) {
    return `No change since the snapshot of ${when}: ceilings at stake ${croreLabel(ceilings.to)}; heads at stake ${heads.to}.`;
  }
  const ceilingsText =
    ceilings.from === ceilings.to
      ? `ceilings at stake unchanged at ${croreLabel(ceilings.to)}`
      : `ceilings at stake went from ${croreLabel(ceilings.from)} to ${croreLabel(ceilings.to)}`;
  const headsText = heads.from === heads.to ? `heads at stake unchanged at ${heads.to}` : `heads at stake from ${heads.from} to ${heads.to}`;
  return `Since the snapshot of ${when}: ${ceilingsText}; ${headsText}.`;
}

function changeBlocks(input: ProgrammeStatusInput): ReportBlock[] {
  const c = input.changes;
  if (c === null) {
    return [{ type: "paragraph", text: "This is the first exposure snapshot recorded for the organisation, so there is nothing to compare it with yet." }];
  }
  const blocks: ReportBlock[] = [
    { type: "paragraph", text: changeSentence(c) },
    {
      type: "table",
      columns: [
        { header: "Penalty head", width: 0.4 },
        { header: "Was", width: 0.3 },
        { header: "Now", width: 0.3 },
      ],
      rows: c.change.heads.map((h) => {
        const head = headFact(h.code);
        const band = (b: PositionBand | null) => (b ? `, ${b} third` : "");
        return [`${head.serial}. ${h.title}`, `${h.fromLabel}${band(h.fromBand)}`, `${h.toLabel}${band(h.toBand)}`];
      }),
      empty: "No head changed status or position.",
    },
  ];
  if (c.modelChanged) {
    blocks.push({
      type: "notice",
      tone: "info",
      text: `The earlier snapshot was recorded under exposure model ${c.since.modelVersion}; a move may be the model's, not the organisation's.`,
    });
  }
  return blocks;
}

const pct = (value: number | null) => (value === null ? "—" : `${Math.round(value)}%`);
const scoreText = (value: number | null) => (value === null ? "—" : value.toFixed(2));

/**
 * A scorecard row's status in words: Q3's display rule (F4.6) — a scored
 * domain with no question answered is "Not started", as on the overview and the
 * assessment (core `domainStatusLabel`); the engine still stores `needs_work`.
 */
function scorecardStatus(d: ReportReadiness["domains"][number]): string {
  if (d.state === "scoped_out") return "Out of scope";
  if (d.state === "all_not_applicable") return "Not applicable";
  if (!d.status || !(d.status in DOMAIN_STATUS_LABEL)) return d.status ?? "—";
  return domainStatusLabel({ state: "scored", status: d.status as DomainStatus, questionCount: d.questionCount, outstandingCount: d.outstandingCount });
}

/**
 * The scorecard, as the report's appendix. It follows the register on the same
 * page when there is room — a forced break left a near-empty page (F4.5).
 */
function readinessSection(r: ReportReadiness | null): ReportSection {
  const title = "Appendix — Readiness scorecard";
  if (r === null) {
    return {
      title,
      blocks: [{ type: "paragraph", text: "No assessment has been started, so there is no readiness score yet." }],
    };
  }
  return {
    title,
    blocks: [
      {
        type: "paragraph",
        text:
          "The maturity scorecard underneath the exposure view. Exposure is read from it; exposure never feeds back into the score. " +
          (r.finalised
            ? `“${r.assessmentName}” was finalised${r.frozenAt ? ` on ${timestampLabel(r.frozenAt)}` : ""}; these figures are frozen.`
            : `“${r.assessmentName}” is in progress; these figures are provisional${r.outstandingCount > 0 ? ` (${r.outstandingCount.toLocaleString("en-IN")} questions unanswered)` : ""}.`),
        tone: "muted",
      },
      {
        type: "tiles",
        tiles: [
          {
            label: "Readiness score",
            value: `${scoreText(r.finalScore)} of ${scoreText(r.applicableWeight)}`,
            note: r.scoreCap < 100 ? `Capped at ${r.scoreCap} by a red flag (uncapped ${scoreText(r.rawScore)}).` : "No red-flag cap.",
          },
          { label: "Maturity", value: r.maturityLevel },
          { label: "Evidence confidence", value: pct(r.evidenceConfidence) },
          { label: "Critical / high findings", value: `${r.criticalCount} / ${r.highCount}` },
        ],
      },
      ...(r.redFlags.length > 0
        ? [{ type: "bullets" as const, items: r.redFlags.map((f) => `Red flag: ${f.label} (caps the score at ${f.cap}).`) }]
        : []),
      {
        type: "table",
        columns: [
          { header: "Domain", width: 0.34 },
          { header: "Weight", width: 0.1, align: "right" },
          { header: "Score", width: 0.1, align: "right" },
          { header: "Of weight", width: 0.12, align: "right" },
          { header: "Evidence confidence", width: 0.16, align: "right" },
          { header: "Status", width: 0.18 },
        ],
        rows: r.domains.map((d) => [
          d.name,
          scoreText(d.weight),
          scoreText(d.score),
          d.percent === null ? "—" : pct(d.percent * 100),
          pct(d.evidenceConfidence),
          scorecardStatus(d),
        ]),
        empty: "No domain.",
      },
      { type: "paragraph", text: `Scoring engine ${r.engineVersion}.`, tone: "muted" },
    ],
  };
}

export function programmeStatusReport(input: ProgrammeStatusInput): ReportDocument {
  const { header, exposure: e, basis, actions, register: reg } = input;
  const def = reportKindDefinition("programme_status");
  const n = (v: number) => v.toLocaleString("en-IN");

  return {
    kind: "programme_status",
    title: def.label,
    audience: `For the ${def.audience}`,
    organizationName: header.organizationName,
    meta: headerMeta(header, e),
    sections: [
      {
        title: "At a glance",
        blocks: [
          { type: "tiles", tiles: headlineTiles(e) },
          {
            type: "tiles",
            tiles: [
              { label: "Actions outstanding", value: n(actions.outstanding), note: FROM_EVERY_REGISTER },
              { label: "Overdue", value: n(actions.overdue), tone: actions.overdue > 0 ? "critical" : "positive" },
              { label: "No owner", value: n(actions.unassigned), tone: actions.unassigned > 0 ? "warning" : "positive" },
              { label: "Closed", value: n(actions.closed) },
            ],
          },
          ...s37Block(e),
          { type: "paragraph", text: `Based on: ${basisText(e.basis, basis)}`, tone: "muted" },
          ...freshnessBlocks(basis),
        ],
      },
      {
        title: "Slippage warnings",
        blocks:
          input.slippage.length > 0
            ? [{ type: "bullets", items: input.slippage.map((w) => (w.level === "warning" ? `Warning: ${w.text}` : `Note: ${w.text}`)) }]
            : [{ type: "paragraph", text: "No slippage warning." }],
      },
      { title: "Exposure by penalty head", blocks: headSections(e) },
      { title: "Pace and forecast", blocks: forecastBlocks(e.forecast) },
      { title: "What changed since the last snapshot", blocks: changeBlocks(input) },
      {
        title: "The actions that retire the most exposure",
        blocks: [
          {
            type: "table",
            columns: [
              { header: "Action", width: 0.36 },
              { header: "Penalty heads", width: 0.12 },
              { header: "Severity", width: 0.09 },
              { header: "Owner", width: 0.15 },
              { header: "Due", width: 0.12 },
              { header: "Source", width: 0.16 },
            ],
            rows: input.leverage.map((a) => [
              a.title,
              headsLabel(a.heads),
              GAP_SEVERITY_LABEL[a.severity],
              ownerLabel(a.ownerName),
              dateOrDash(a.dueDate),
              `${a.sourceLabel} · ${a.context}`,
            ]),
            empty: "No open action counts against a penalty head that is at stake.",
          },
        ],
      },
      {
        title: "Remediation by owner and by window",
        blocks: [
          {
            type: "table",
            columns: [
              { header: "Owner", width: 0.6 },
              { header: "Outstanding", width: 0.2, align: "right" },
              { header: "Overdue", width: 0.2, align: "right" },
            ],
            rows: input.owners.map((o) => [
              o.unassigned ? { text: "Unassigned", tone: "warning" } : ownerLabel(o.ownerName),
              n(o.outstanding),
              o.overdue > 0 ? { text: n(o.overdue), tone: "critical" } : "0",
            ]),
            empty: "No action is outstanding.",
          },
          {
            type: "table",
            columns: [
              { header: "Roadmap window", width: 0.6 },
              { header: "Outstanding actions", width: 0.4, align: "right" },
            ],
            rows: ROADMAP_WINDOWS.map((w) => [ROADMAP_WINDOW_LABEL[w], n(actions.byWindow[w])]),
            empty: "—",
          },
          {
            type: "table",
            columns: [
              { header: "Source", width: 0.6 },
              { header: "Outstanding", width: 0.2, align: "right" },
              { header: "Overdue", width: 0.2, align: "right" },
            ],
            // Every source the Actions page reads (Q1, D-104.1), so this table totals "Actions outstanding".
            rows: ACTION_SOURCES.map((src) => [ACTION_SOURCE_LABEL[src], n(actions.bySource[src].outstanding), n(actions.bySource[src].overdue)]),
            empty: "—",
          },
        ],
      },
      {
        title: "Processing register",
        blocks: [
          {
            type: "table",
            columns: [
              { header: "Records", width: 0.75 },
              { header: "Count", width: 0.25, align: "right" },
            ],
            rows: [
              ["Live records (archived excluded)", n(reg.total)],
              ["Approved", n(reg.approved)],
              ["Not yet approved (draft or in review)", n(reg.notApproved)],
              ["Below the Usable completeness band", n(reg.belowUsable)],
              ["High risk", n(reg.highRisk)],
              ["Children's data — yes or not yet known", n(reg.children)],
              ["Linked to a Data Processor", n(reg.vendorLinked)],
              ["AI or automated processing — yes or not yet known", n(reg.ai)],
              ["Where data is held or sent is not known", n(reg.unknownLocation)],
              ["Retention incomplete", n(reg.missingRetention)],
              ["Review overdue or not scheduled", n(reg.reviewOverdue)],
            ],
            empty: "—",
          },
          { type: "paragraph", text: "A DPDP readiness register — not a statutory record.", tone: "muted" },
        ],
      },
      readinessSection(input.readiness),
    ],
    caveats: caveats(e.modelVersion),
    notes: exposureNotes(),
    footer: footer(header, def.label),
  };
}

// ---------------------------------------------------------------------------
// Stage 4 — the remediation and evidence inputs, as the app's readers hand them over
// ---------------------------------------------------------------------------

/**
 * One remediation action as a list prints it: the dashboard's item, in plain
 * words. The mapping key (a domain or a register rule) is never printed; it
 * only says which penalty heads the action's gap counts against.
 */
export interface ReportActionLine {
  /** Never printed: how an evidence link finds its action. */
  id: string;
  title: string;
  source: ActionSource;
  sourceLabel: string;
  /** The assessment's name, or the record's ("The whole register"). */
  parentName: string;
  /** The domain, or the record code and the rule. */
  context: string;
  mapping: MappingKey;
  severity: GapSeverity;
  /** The gap's stored priority (`P0`…`P3`). */
  priority: string;
  gapState: GapState;
  status: GapActionStatus;
  ownerUserId: string | null;
  ownerName: string | null;
  dueDate: string | null;
  closedAt: string | null;
  closedByName: string | null;
  closureBasis: ClosureBasis | null;
  notes: string | null;
  /** Each artefact attached to the action, with its stored review verdict. */
  evidence: readonly { fileName: string; reviewStatus: EvidenceReviewStatus }[];
}

/** One gap with its actions — the gap register's own rows, from either parent. */
export interface ReportGapLine {
  source: ActionSource;
  sourceLabel: string;
  parentName: string;
  context: string;
  mapping: MappingKey;
  finding: string;
  recommendedFix: string | null;
  severity: GapSeverity;
  priority: string;
  state: GapState;
  actions: readonly ReportActionLine[];
}

/**
 * What one stored artefact is linked to, in plain words: D-064's three link
 * types, and (Slice 10, Stage 6) every register's own — each named as its
 * register names it, never by a person's personal data.
 */
export type EvidenceLinkLine =
  | { type: "assessment_response"; assessmentName: string; domainCode: DomainCode; questionText: string | null }
  | { type: "gap_action"; actionTitle: string; sourceLabel: string; parentName: string; context: string; mapping: MappingKey }
  | { type: "ropa_record"; recordCode: string; recordName: string }
  /** A vendor's contract, certificate or report (Stage 4a). */
  | { type: "vendor"; vendorName: string; service: string | null }
  /** An erasure certificate (Stage 5): the schedule, named by its record. */
  | { type: "retention_schedule"; scheduleName: string; context: string }
  /** A review or an impact assessment (Stage 5). */
  | { type: "ai_system"; systemName: string }
  /** The Board's intimations, the notice to the people affected (Stage 6). */
  | { type: "breach_incident"; incidentCode: string; title: string }
  /** The response sent (Stage 6): by code and kind, never by the person who asked. */
  | { type: "rights_request"; requestCode: string; kindLabel: string };

/** One stored artefact, with who uploaded and reviewed it and everything it is linked to. */
export interface EvidenceIndexEntry {
  fileName: string;
  contentType: string;
  byteSize: number;
  uploadedByName: string | null;
  /** Sent by a vendor's respondent through the questionnaire link (Stage 4b) — no member uploaded it. */
  uploadedViaVendorLink?: boolean;
  uploadedAt: string;
  reviewStatus: EvidenceReviewStatus;
  evidenceLevel: number | null;
  reviewedByName: string | null;
  reviewedAt: string | null;
  reviewNotes: string | null;
  links: readonly EvidenceLinkLine[];
}

export const EVIDENCE_REVIEW_LABEL: Readonly<Record<EvidenceReviewStatus, string>> = Object.freeze({
  pending: "Awaiting review",
  adequate: "Adequate",
  strong: "Strong",
  partial: "Partial",
  rejected: "Rejected",
  outdated: "Outdated",
});

export const EVIDENCE_LINK_LABEL: Readonly<Record<EvidenceLinkLine["type"], string>> = Object.freeze({
  assessment_response: "Assessment answer",
  gap_action: "Remediation action",
  ropa_record: "Register record",
  vendor: "Vendor",
  retention_schedule: "Retention schedule",
  ai_system: "AI system",
  breach_incident: "Personal data breach",
  rights_request: "Rights request or grievance",
});

export const CLOSURE_BASIS_LABEL: Readonly<Record<ClosureBasis, string>> = Object.freeze({
  evidence: "Accepted evidence",
  reviewer_approval: "A reviewer's approval",
  erasure_recorded: "An erasure recorded by someone else",
});

/** Reviewed as Adequate or Strong — what counts for closing an action (D-056). */
export const isAcceptedEvidence = (status: EvidenceReviewStatus) => (CLOSING_REVIEW_STATUSES as readonly string[]).includes(status);

/** Partial, Rejected or Outdated: reviewed, and not accepted. */
const isReturnedEvidence = (status: EvidenceReviewStatus) => status !== "pending" && !isAcceptedEvidence(status);

/** The register whose model rows a document on that register's own row bears on (Slice 10's module inputs). */
const LINK_REGISTER: Readonly<Partial<Record<EvidenceLinkLine["type"], string>>> = Object.freeze({
  vendor: "Processor register",
  retention_schedule: "Retention register",
  ai_system: "AI risk register",
  breach_incident: "Breach register",
  rights_request: "Rights and grievance register",
});

/**
 * The penalty heads a link evidences directly — the model's mapping (§6.2). A
 * processing record evidences its record. A document on a module register's
 * row evidences the heads whose STATUS that register's rows can set (Slice 10,
 * Stage 6): read from the model's own rows, never re-typed — so the AI risk
 * register, whose one row is only a reason, evidences none.
 */
export function linkDirectHeads(link: EvidenceLinkLine): ModelledHeadCode[] {
  if (link.type === "assessment_response") return directHeadsOf({ source: "assessment", domainCode: link.domainCode });
  if (link.type === "gap_action") return directHeadsOf(link.mapping);
  const register = LINK_REGISTER[link.type];
  if (!register) return [];
  return [...new Set(MODULE_INPUTS.filter((m) => m.register === register && m.effect !== "reason").map((m) => m.head))];
}

/** "Head 1, Head 7" — or "Enabling control" for a domain no provision imposes, "—" otherwise. */
export function headsLabelFor(heads: readonly ModelledHeadCode[], enabling = false): string {
  if (heads.length > 0) return heads.map((c) => `Head ${headFact(c).serial}`).join(", ");
  return enabling ? "Enabling control" : "—";
}

/** A domain or register rule that no DPDP provision imposes as such (§6.2): it never sets a head's status. */
export function isEnablingKey(key: MappingKey): boolean {
  // A breach (head 2), a rights request or a retention schedule (head 7) is direct evidence (Slice 10) — never an enabling control.
  if (key.source === "breach" || key.source === "rights" || key.source === "retention") return false;
  const c = key.source === "assessment" ? EXPOSURE_MAPPING.domains[key.domainCode] : EXPOSURE_MAPPING.registerRules[key.gapCode];
  return c?.kind === "enabling";
}

// ---------------------------------------------------------------------------
// Evidence coverage — counts of rows, for the evidence pack
// ---------------------------------------------------------------------------

export interface EvidenceTally {
  /** Distinct artefacts. */
  artefacts: number;
  accepted: number;
  awaitingReview: number;
  /** Reviewed as Partial, Rejected or Outdated. */
  notAccepted: number;
}

export interface EvidenceCoverage {
  total: EvidenceTally;
  byStatus: Record<EvidenceReviewStatus, number>;
  /** Linked to nothing: it evidences nothing yet. */
  unlinked: number;
  /** Per head, artefacts on an answer or an action that counts against it directly. */
  byHead: Record<ModelledHeadCode, EvidenceTally>;
  /** Per Compass domain: artefacts on its answers, or on actions for its gaps. */
  byDomain: Record<DomainCode, EvidenceTally>;
  /** Artefacts linked to a register record, and how many records have one. */
  registerArtefacts: number;
  recordsWithEvidence: number;
}

const emptyTally = (): EvidenceTally => ({ artefacts: 0, accepted: 0, awaitingReview: 0, notAccepted: 0 });

function tallyOne(t: EvidenceTally, status: EvidenceReviewStatus) {
  t.artefacts += 1;
  if (isAcceptedEvidence(status)) t.accepted += 1;
  else if (status === "pending") t.awaitingReview += 1;
  else t.notAccepted += 1;
}

/**
 * Counts, never scores (D-069): every figure is a number of artefacts the
 * evidence reader returned, each counted ONCE per head, domain or total
 * however many links it has. Which head a link evidences is the model's
 * mapping (`linkDirectHeads`), so this never disagrees with the exposure view.
 */
export function evidenceCoverage(entries: readonly EvidenceIndexEntry[]): EvidenceCoverage {
  const total = emptyTally();
  const byStatus = Object.fromEntries(Object.keys(EVIDENCE_REVIEW_LABEL).map((s) => [s, 0])) as Record<EvidenceReviewStatus, number>;
  const byHead = Object.fromEntries(MODELLED_HEAD_CODES.map((h) => [h, emptyTally()])) as Record<ModelledHeadCode, EvidenceTally>;
  const byDomain = Object.fromEntries(DOMAIN_CODES.map((d) => [d, emptyTally()])) as Record<DomainCode, EvidenceTally>;
  let unlinked = 0;
  let registerArtefacts = 0;
  const records = new Set<string>();

  for (const e of entries) {
    tallyOne(total, e.reviewStatus);
    byStatus[e.reviewStatus] += 1;
    if (e.links.length === 0) unlinked += 1;
    const heads = new Set(e.links.flatMap(linkDirectHeads));
    for (const h of heads) tallyOne(byHead[h], e.reviewStatus);
    const domains = new Set(
      e.links.flatMap((l): DomainCode[] =>
        l.type === "assessment_response" ? [l.domainCode] : l.type === "gap_action" && l.mapping.source === "assessment" ? [l.mapping.domainCode] : [],
      ),
    );
    for (const d of domains) tallyOne(byDomain[d], e.reviewStatus);
    const recordLinks = e.links.filter((l): l is Extract<EvidenceLinkLine, { type: "ropa_record" }> => l.type === "ropa_record");
    if (recordLinks.length > 0) registerArtefacts += 1;
    for (const l of recordLinks) records.add(l.recordCode);
  }
  return { total, byStatus, unlinked, byHead, byDomain, registerArtefacts, recordsWithEvidence: records.size };
}

// ---------------------------------------------------------------------------
// Owner Action Pack — what one person owes, and by when
// ---------------------------------------------------------------------------

/** One processing record the owner is named on — stored fields only. */
export interface OwnerRecordLine {
  recordCode: string;
  name: string;
  statusLabel: string;
  completenessScore: number;
  bandLabel: string;
  /** The completeness areas the database found missing, as labels. */
  missing: readonly string[];
  riskLabel: string;
  nextReviewAt: string | null;
}

export interface OwnerActionPackInput {
  header: ReportHeader;
  owner: { name: string };
  /** India's date (D-055): windows and "overdue" are measured from it. */
  today: string;
  /** Every action the owner holds, in any state, from both parents. */
  actions: readonly ReportActionLine[];
  records: readonly OwnerRecordLine[];
}

const isOwed = (a: Pick<ReportActionLine, "status" | "gapState">) => a.gapState === "open" && a.status !== "closed";

/** What an outstanding action still needs before it can close, in the owner's words. */
export function evidenceStateText(a: Pick<ReportActionLine, "evidence">): { text: string; tone: ReportTone } {
  if (a.evidence.some((e) => isAcceptedEvidence(e.reviewStatus))) return { text: "Accepted evidence attached — ready to close", tone: "positive" };
  if (a.evidence.some((e) => e.reviewStatus === "pending")) return { text: "Evidence awaiting review", tone: "neutral" };
  const returned = a.evidence.filter((e) => isReturnedEvidence(e.reviewStatus));
  if (returned.length > 0) {
    const verdicts = [...new Set(returned.map((e) => EVIDENCE_REVIEW_LABEL[e.reviewStatus]))].join(", ");
    return { text: `Evidence returned (${verdicts}) — provide more`, tone: "warning" };
  }
  return { text: "No evidence attached", tone: "warning" };
}

const whereText = (a: Pick<ReportActionLine, "sourceLabel" | "context">) => `${a.sourceLabel} · ${a.context}`;

function ownerActionRows(actions: readonly ReportActionLine[]): ReportCell[][] {
  return actions.map((a) => [
    a.title,
    { text: GAP_SEVERITY_LABEL[a.severity], tone: a.severity === "critical" ? "critical" : a.severity === "high" ? "warning" : "neutral" },
    whereText(a),
    dateOrDash(a.dueDate),
    GAP_ACTION_STATUS_LABEL[a.status],
    evidenceStateText(a),
  ]);
}

const OWNER_ACTION_COLUMNS: ReportColumn[] = [
  { header: "Action", width: 0.29 },
  { header: "Severity", width: 0.08 },
  { header: "Where it comes from", width: 0.21 },
  { header: "Due", width: 0.15 },
  { header: "Status", width: 0.09 },
  { header: "Evidence", width: 0.18 },
];

/** Due date first (none last), then severity, then title — a stable reading order. */
function byDue(a: ReportActionLine, b: ReportActionLine): number {
  const due = (x: ReportActionLine) => x.dueDate ?? "9999-12-31";
  const sev = ["critical", "high", "medium", "low", "improvement", "no_gap"];
  return due(a).localeCompare(due(b)) || sev.indexOf(a.severity) - sev.indexOf(b.severity) || a.title.localeCompare(b.title);
}

export function ownerActionPack(input: OwnerActionPackInput): ReportDocument {
  const { header, owner, today } = input;
  const def = reportKindDefinition("owner_action_pack");
  const n = (v: number) => v.toLocaleString("en-IN");
  const owed = input.actions.filter(isOwed).sort(byDue);
  const windowOf = (a: ReportActionLine): RoadmapWindow => roadmapWindow(a.dueDate, today);
  const overdue = owed.filter((a) => windowOf(a) === "overdue");
  const closed = input.actions.filter((a) => a.status === "closed");
  const needsEvidence = owed.filter((a) => !a.evidence.some((e) => isAcceptedEvidence(e.reviewStatus)));
  const reviewsDue = input.records.filter((r) => ropaReviewOverdue(r.nextReviewAt, today));

  const windowBlocks: ReportBlock[] = ROADMAP_WINDOWS.filter((w) => w !== "overdue").flatMap((w) => {
    const items = owed.filter((a) => windowOf(a) === w);
    return items.length === 0
      ? []
      : [
          { type: "subheading" as const, text: `${ROADMAP_WINDOW_LABEL[w]} (${n(items.length)})` },
          { type: "table" as const, columns: OWNER_ACTION_COLUMNS, rows: ownerActionRows(items), empty: "—" },
        ];
  });

  return {
    kind: "owner_action_pack",
    title: def.label,
    audience: `For ${owner.name}`,
    organizationName: header.organizationName,
    meta: [
      { label: "As of", value: dayLabel(header.asOf) },
      { label: "Version", value: String(header.version) },
      { label: "Owner", value: owner.name },
      { label: "Generated", value: `${timestampLabel(header.generatedAt)}${header.generatedByName ? ` by ${header.generatedByName}` : ""}` },
    ],
    sections: [
      {
        title: "At a glance",
        blocks: [
          {
            type: "tiles",
            tiles: [
              { label: "Actions you owe", value: n(owed.length), note: FROM_EVERY_REGISTER },
              { label: "Overdue", value: n(overdue.length), tone: overdue.length > 0 ? "critical" : "positive" },
              { label: "Due in the next 30 days", value: n(owed.filter((a) => windowOf(a) === "days_30").length) },
              { label: "Closed", value: n(closed.length), tone: "neutral" },
            ],
          },
          ...(reviewsDue.length > 0
            ? [{ type: "notice" as const, tone: "warning" as const, text: `${n(reviewsDue.length)} of your processing records ${reviewsDue.length === 1 ? "is" : "are"} due for review or ${reviewsDue.length === 1 ? "has" : "have"} no review date.` }]
            : []),
        ],
      },
      {
        title: "Overdue",
        blocks: [{ type: "table", columns: OWNER_ACTION_COLUMNS, rows: ownerActionRows(overdue), empty: "Nothing you owe is overdue." }],
      },
      {
        title: "Your actions, by when they are due",
        blocks: windowBlocks.length > 0 ? windowBlocks : [{ type: "paragraph", text: owed.length === 0 ? "Nothing is assigned to you that is still open." : "Everything you owe is overdue — see above." }],
      },
      {
        title: "Evidence to provide",
        blocks: [
          {
            type: "table",
            columns: [
              { header: "Action", width: 0.42 },
              { header: "Where it comes from", width: 0.3 },
              { header: "What is needed", width: 0.28 },
            ],
            rows: needsEvidence.map((a) => [a.title, whereText(a), evidenceStateText(a)]),
            empty: "Every action you owe has accepted evidence attached.",
          },
          { type: "paragraph", tone: "muted", text: `How an action closes: ${CLOSURE_REFUSAL_MESSAGE.no_evidence_or_reviewer} Nobody reviews their own upload.` },
        ],
      },
      {
        title: "Your processing register records",
        blocks: [
          {
            type: "table",
            columns: [
              { header: "Record", width: 0.28 },
              { header: "Status", width: 0.11 },
              { header: "Completeness", width: 0.14 },
              { header: "Missing", width: 0.22 },
              { header: "Risk", width: 0.1 },
              { header: "Next review", width: 0.15 },
            ],
            rows: input.records.map((r) => [
              `${r.recordCode} · ${r.name}`,
              r.statusLabel,
              `${r.completenessScore}/100 · ${r.bandLabel}`,
              r.missing.length > 0 ? r.missing.join("; ") : "—",
              r.riskLabel,
              ropaReviewOverdue(r.nextReviewAt, today)
                ? { text: r.nextReviewAt ? `${dayLabel(r.nextReviewAt)} (overdue)` : "Not scheduled", tone: "critical" }
                : dateOrDash(r.nextReviewAt),
            ]),
            empty: "You are not named as the owner of any processing record.",
          },
        ],
      },
    ],
    caveats: caveats(null),
    notes: [
      "Overdue and the windows are measured from today's date in India; a due date of today is not overdue.",
      "An action on a gap that no longer applies is not listed as owed.",
    ],
    footer: `TrustStack DPDP Compass · ${def.label} v${header.version} · ${owner.name} · ${header.organizationName} · Confidential`,
  };
}

// ---------------------------------------------------------------------------
// Regulator-Ready Evidence Pack — "if the Board asked tomorrow"
// ---------------------------------------------------------------------------

export interface EvidencePackInput {
  header: ReportHeader;
  exposure: ReportExposure;
  basis: ReportBasisFacts;
  entries: readonly EvidenceIndexEntry[];
  /** Every action, both parents — for what was closed, and on what basis. */
  actions: readonly ReportActionLine[];
  /** The engine's per-domain evidence confidence, from the assessment the snapshot was based on. */
  readiness: ReportReadiness | null;
  /** Live processing records — the register's own count. */
  registerRecords: number;
  /** The Evidence Index generated with this pack, by file name. */
  indexFileName: string | null;
}

const tallyCells = (t: EvidenceTally): ReportCell[] => [
  t.artefacts.toLocaleString("en-IN"),
  t.accepted.toLocaleString("en-IN"),
  t.awaitingReview.toLocaleString("en-IN"),
  t.notAccepted > 0 ? { text: t.notAccepted.toLocaleString("en-IN"), tone: "warning" } : "0",
];

const TALLY_COLUMNS: ReportColumn[] = [
  { header: "Artefacts", width: 0.1, align: "right" },
  { header: "Accepted", width: 0.1, align: "right" },
  { header: "Awaiting review", width: 0.12, align: "right" },
  { header: "Not accepted", width: 0.11, align: "right" },
];

export function evidencePack(input: EvidencePackInput): ReportDocument {
  const { header, exposure: e, basis } = input;
  const def = reportKindDefinition("evidence_pack");
  const n = (v: number) => v.toLocaleString("en-IN");
  const coverage = evidenceCoverage(input.entries);
  const confidence = new Map((input.readiness?.domains ?? []).map((d) => [d.name, d.evidenceConfidence]));
  const closed = input.actions.filter((a) => a.status === "closed").sort((a, b) => (b.closedAt ?? "").localeCompare(a.closedAt ?? ""));
  const onEvidence = closed.filter((a) => a.closureBasis === "evidence").length;
  const onApproval = closed.filter((a) => a.closureBasis === "reviewer_approval").length;
  const onErasure = closed.filter((a) => a.closureBasis === "erasure_recorded").length;

  return {
    kind: "evidence_pack",
    title: def.label,
    audience: "For an auditor, a reviewer, or a Board inquiry (s.28)",
    organizationName: header.organizationName,
    meta: headerMeta(header, e),
    sections: [
      {
        title: "Where you stand",
        blocks: [
          { type: "tiles", tiles: headlineTiles(e) },
          ...s37Block(e),
          { type: "paragraph", text: `Based on: ${basisText(e.basis, basis)}`, tone: "muted" },
          ...freshnessBlocks(basis),
        ],
      },
      {
        title: "Your evidence at a glance",
        blocks: [
          {
            type: "tiles",
            tiles: [
              { label: "Artefacts stored", value: n(coverage.total.artefacts) },
              { label: "Accepted by a reviewer", value: n(coverage.total.accepted), note: "Reviewed as Adequate or Strong.", tone: "positive" },
              { label: "Awaiting review", value: n(coverage.total.awaitingReview), tone: coverage.total.awaitingReview > 0 ? "warning" : "neutral" },
              { label: "Not linked to anything", value: n(coverage.unlinked), tone: coverage.unlinked > 0 ? "warning" : "neutral" },
            ],
          },
          {
            type: "paragraph",
            text:
              "Evidence of mitigation, and how promptly it was taken, is one of the factors the Data Protection Board weighs under section 33(2)(e). " +
              "Nobody reviews their own upload, and an artefact counts once however many things it supports.",
            tone: "muted",
          },
        ],
      },
      {
        title: "Evidence by penalty head",
        blocks: [
          {
            type: "table",
            columns: [
              { header: "Penalty head", width: 0.25 },
              { header: "Status", width: 0.13 },
              { header: "Evidenced by", width: 0.19 },
              ...TALLY_COLUMNS,
            ],
            rows: e.heads.map((h) => [
              headShortName(h),
              statusCell(h.status),
              DOMAIN_CODES.filter((d) => directHeadsOf({ source: "assessment", domainCode: d }).includes(h.code))
                .map((d) => domainByCode(d)?.name ?? d)
                .join(", "),
              ...tallyCells(coverage.byHead[h.code]),
            ]),
            empty: "No penalty head was evaluated.",
          },
          {
            type: "paragraph",
            tone: "muted",
            text: "Counts artefacts on an assessment answer in an area that evidences the head directly, on a remediation action for a gap that counts against it, or on a register's own row whose facts can set the head's status (a breach, a request, a processor, a retention schedule). Processing records are counted below.",
          },
        ],
      },
      {
        title: "Evidence by obligation area",
        blocks: [
          {
            type: "table",
            columns: [
              { header: "Area", width: 0.25 },
              { header: "Penalty heads", width: 0.14 },
              ...TALLY_COLUMNS,
              { header: "Evidence confidence", width: 0.18, align: "right" },
            ],
            rows: DOMAIN_CODES.map((d) => {
              const name = domainByCode(d)?.name ?? d;
              const c = confidence.get(name);
              return [
                name,
                headsLabelFor(directHeadsOf({ source: "assessment", domainCode: d }), isEnablingKey({ source: "assessment", domainCode: d })),
                ...tallyCells(coverage.byDomain[d]),
                c === undefined || c === null ? "—" : pct(c),
              ];
            }),
            empty: "—",
          },
          {
            type: "paragraph",
            tone: "muted",
            text: input.readiness
              ? `Evidence confidence is the scoring engine's, from “${input.readiness.assessmentName}”${input.readiness.finalised ? " as finalised" : " (provisional)"}. An enabling control is good practice that no DPDP provision imposes as such.`
              : "No assessment yet, so there is no evidence confidence. An enabling control is good practice that no DPDP provision imposes as such.",
          },
        ],
      },
      {
        title: "Processing register",
        blocks: [
          {
            type: "paragraph",
            text: `${n(coverage.recordsWithEvidence)} of ${n(input.registerRecords)} live processing ${input.registerRecords === 1 ? "record has" : "records have"} evidence attached (${n(coverage.registerArtefacts)} ${coverage.registerArtefacts === 1 ? "artefact" : "artefacts"}).`,
          },
        ],
      },
      {
        title: "Remediation closed, and on what basis",
        blocks: [
          {
            type: "tiles",
            tiles: [
              { label: "Closed on accepted evidence", value: n(onEvidence), tone: "positive" },
              { label: "Closed on a reviewer's approval", value: n(onApproval), note: "A reviewer who is not the action's owner." },
              // Slice 10 Stage 5: only once a retention action has closed this way.
              ...(onErasure > 0
                ? [{ label: "Closed on a recorded erasure", value: n(onErasure), note: "Recorded on the retention schedule by someone who is not the action's owner." }]
                : []),
              { label: "Still outstanding", value: n(input.actions.filter(isOwed).length) },
            ],
          },
          {
            type: "table",
            columns: [
              { header: "Action", width: 0.3 },
              { header: "Where it comes from", width: 0.24 },
              { header: "Closed on", width: 0.12 },
              { header: "Closed by", width: 0.14 },
              { header: "Basis", width: 0.12 },
              { header: "Artefacts", width: 0.08, align: "right" },
            ],
            rows: closed.map((a) => [
              a.title,
              whereText(a),
              a.closedAt ? dayLabel(a.closedAt.slice(0, 10)) : "—",
              a.closedByName ?? "—",
              a.closureBasis ? CLOSURE_BASIS_LABEL[a.closureBasis] : "—",
              n(a.evidence.length),
            ]),
            empty: "No remediation action has been closed yet.",
          },
        ],
      },
      {
        title: "Review status of every artefact",
        blocks: [
          {
            type: "table",
            columns: [
              { header: "Review", width: 0.7 },
              { header: "Artefacts", width: 0.3, align: "right" },
            ],
            rows: (Object.keys(EVIDENCE_REVIEW_LABEL) as EvidenceReviewStatus[]).map((s) => [EVIDENCE_REVIEW_LABEL[s], n(coverage.byStatus[s])]),
            empty: "—",
          },
          {
            type: "paragraph",
            text: input.indexFileName
              ? `Every artefact — what it supports, who uploaded and reviewed it, and when — is listed in the Evidence Index generated with this pack: ${input.indexFileName}.`
              : "Every artefact — what it supports, who uploaded and reviewed it, and when — is listed in the Evidence Index.",
          },
        ],
      },
    ],
    caveats: caveats(e.modelVersion),
    notes: [
      "Accepted means reviewed as Adequate or Strong. Partial, Rejected and Outdated artefacts are listed, and are not counted as accepted.",
      ...exposureNotes(),
    ],
    footer: footer(header, def.label),
  };
}

// ---------------------------------------------------------------------------
// Slice 10, Stage 6 — one report per stakeholder the workflow modules serve
// ---------------------------------------------------------------------------
//
// Each prints the STORED exposure snapshot for the heads its reader answers
// for, and the registers as their own readers counted them (D-069): no figure
// is computed here. A TrustStack target is never presented as statute
// (pitfall 1); nothing is University-specific and nothing is bank internals.

/** What every stakeholder report reads, besides its registers. */
export interface StakeholderReportInput {
  header: ReportHeader;
  exposure: ReportExposure;
  basis: ReportBasisFacts;
  /** India's date (D-055): "overdue" is measured from it. */
  today: string;
  /** Every action, every parent — each report lists its own registers'. */
  actions: readonly ReportActionLine[];
}

const TRI_STATE_REPORT_LABEL: Readonly<Record<TriState, string>> = Object.freeze({ yes: "Yes", no: "No", unknown: "Not known" });

/** One tile per head the report answers for: its stored status and position. */
function headTiles(e: ReportExposure, codes: readonly ModelledHeadCode[]): ReportTile[] {
  return codes.flatMap((code) => {
    const h = e.heads.find((x) => x.code === code);
    if (!h) return [];
    return [
      {
        label: headShortName(h),
        value: EXPOSURE_STATUS_LABEL[h.status],
        note: h.position ? `${h.position.bandLabel}: ${h.position.rangeLabel}` : `Ceiling ${headFact(code).ceilingLabel}.`,
        tone: STATUS_TONE[h.status],
      },
    ];
  });
}

/** The DPO report's head detail, for the heads this report answers for only — in the report's own order, as its tiles and title. */
function headBlocksFor(e: ReportExposure, codes: readonly ModelledHeadCode[]): ReportBlock[] {
  const heads = codes.flatMap((code) => e.heads.filter((h) => h.code === code));
  return headSections({ ...e, heads }).slice(0, -1);
}

function whereYouStand(input: StakeholderReportInput, codes: readonly ModelledHeadCode[], tiles: ReportTile[]): ReportSection {
  const { exposure: e, basis } = input;
  return {
    title: "Where you stand",
    blocks: [
      { type: "tiles", tiles: [...headTiles(e, codes), ...tiles] },
      ...s37Block(e),
      { type: "paragraph", text: `Based on: ${basisText(e.basis, basis)}`, tone: "muted" },
      ...freshnessBlocks(basis),
    ],
  };
}

const countRows = (rows: readonly (readonly [string, number, ReportTone?])[]): ReportCell[][] =>
  rows.map(([label, n, tone]) => [label, tone && n > 0 ? { text: n.toLocaleString("en-IN"), tone } : n.toLocaleString("en-IN")]);

const COUNT_COLUMNS: ReportColumn[] = [
  { header: "", width: 0.8 },
  { header: "Count", width: 0.2, align: "right" },
];

/** A register's actions still owed, in the owner's pack's columns — labelled by source, as the one actions view (D-067). */
function owedActionsBlock(actions: readonly ReportActionLine[], sources: readonly ActionSource[], empty: string): ReportBlock {
  const owed = actions.filter((a) => sources.includes(a.source) && isOwed(a)).sort(byDue);
  return {
    type: "table",
    columns: [
      { header: "Action", width: 0.27 },
      { header: "Where it comes from", width: 0.23 },
      { header: "Owner", width: 0.14 },
      { header: "Due", width: 0.12 },
      { header: "Status", width: 0.08 },
      { header: "Evidence", width: 0.16 },
    ],
    rows: owed.map((a) => [a.title, whereText(a), ownerLabel(a.ownerName), dateOrDash(a.dueDate), GAP_ACTION_STATUS_LABEL[a.status], evidenceStateText(a)]),
    empty,
  };
}

const stakeholderMeta = headerMeta;

// --- Security and Breach Report (the CISO) ---------------------------------

/** One incident as the breach register's reader shaped it — times are ISO instants, shown in IST. */
export interface ReportBreachLine {
  incidentCode: string;
  title: string;
  natureLabel: string;
  severityLabel: string;
  statusLabel: string;
  awareAt: string;
  /** Core's `boardClock`, as the register shows it. */
  boardClock: { state: BoardClockState; label: string };
  extensionUntil: string | null;
  boardInitialAt: string | null;
  boardReportAt: string | null;
  principalsAt: string | null;
  /** Documents attached to the incident itself (link type `breach_incident`). */
  documents: number;
}

export interface SecurityBreachInput extends StakeholderReportInput {
  /** The overview's own breach section (`countBreaches`), and every incident, newest awareness first. */
  breaches: { counts: BreachCounts; incidents: readonly ReportBreachLine[] };
  /** The scorecard the snapshot was based on — for the areas that evidence head 1. */
  readiness: ReportReadiness | null;
}

const SECURITY_HEADS: readonly ModelledHeadCode[] = ["H2", "H1"];

export function securityBreachReport(input: SecurityBreachInput): ReportDocument {
  const { header, exposure: e, breaches } = input;
  const def = reportKindDefinition("security_breach");
  const c = breaches.counts;
  const h1Areas = DOMAIN_CODES.filter((d) => directHeadsOf({ source: "assessment", domainCode: d }).includes("H1"));
  const scored = new Map((input.readiness?.domains ?? []).map((d) => [d.name, d]));
  const at = (iso: string | null) => (iso ? timestampLabel(iso) : "Not recorded");

  return {
    kind: "security_breach",
    title: def.label,
    audience: `For the ${def.audience}`,
    organizationName: header.organizationName,
    meta: stakeholderMeta(header, e),
    sections: [
      whereYouStand(input, SECURITY_HEADS, [
        { label: "Detailed reports to the Board overdue", value: c.overdue.toLocaleString("en-IN"), note: "Rule 7(2)(b): seventy-two hours, or the longer period the Board allowed.", tone: c.overdue > 0 ? "critical" : "positive" },
        { label: "Affected people not yet told", value: c.principalsPending.toLocaleString("en-IN"), note: "Rule 7(1): without delay.", tone: c.principalsPending > 0 ? "warning" : "positive" },
      ]),
      {
        title: "The breach register (s.8(6), Rule 7)",
        blocks: [
          {
            type: "table",
            columns: COUNT_COLUMNS,
            rows: countRows([
              ["Personal data breaches recorded (dismissed ones included)", c.total],
              ["Open or contained", c.active],
              ["Detailed report to the Board not yet made, still inside its due time", c.insideWindow, "warning"],
              ["Detailed report to the Board not yet made, past its due time", c.overdue, "critical"],
              ["Affected Data Principals not yet recorded as told", c.principalsPending, "warning"],
              ["Closed", c.closed],
              ["Dismissed — not a personal data breach", c.dismissed],
            ]),
            empty: "—",
          },
          {
            type: "table",
            columns: [
              { header: "Incident", width: 0.24 },
              { header: "Status", width: 0.11 },
              { header: "Became aware", width: 0.14 },
              { header: "The Board — Rule 7(2)", width: 0.23 },
              { header: "People affected — Rule 7(1)", width: 0.18 },
              { header: "Documents", width: 0.1, align: "right" },
            ],
            rows: breaches.incidents.map((b) => [
              `${b.incidentCode} · ${b.title} (${b.natureLabel}; ${b.severityLabel})`,
              b.statusLabel,
              timestampLabel(b.awareAt),
              {
                text:
                  `Without delay: ${at(b.boardInitialAt)}. Detailed report: ${b.boardClock.label}.` +
                  (b.extensionUntil ? ` Extended by the Board to ${timestampLabel(b.extensionUntil)}.` : ""),
                tone: b.boardClock.state === "overdue" ? "critical" : b.boardClock.state === "running" ? "warning" : "neutral",
              },
              b.principalsAt ? `Told: ${timestampLabel(b.principalsAt)}` : { text: "Not recorded as told", tone: b.statusLabel === BREACH_STATUS_LABEL.dismissed ? "muted" : "warning" },
              b.documents.toLocaleString("en-IN"),
            ]),
            empty: "No personal data breach is recorded.",
          },
          { type: "paragraph", tone: "muted", text: BREACH_CLOCK_NOTE },
        ],
      },
      { title: PENALTY_HEADS_SECTION_TITLE, blocks: headBlocksFor(e, SECURITY_HEADS) },
      {
        title: "Security safeguards in the assessment (head 1)",
        blocks: [
          {
            type: "table",
            columns: [
              { header: "Area", width: 0.4 },
              { header: "Score", width: 0.15, align: "right" },
              { header: "Evidence confidence", width: 0.2, align: "right" },
              { header: "Status", width: 0.25 },
            ],
            rows: h1Areas.map((d) => {
              const name = domainByCode(d)?.name ?? d;
              const r = scored.get(name);
              return [name, pct(r?.percent ?? null), pct(r?.evidenceConfidence ?? null), r ? scorecardStatus(r) : "—"];
            }),
            empty: "—",
          },
          {
            type: "paragraph",
            tone: "muted",
            text: input.readiness
              ? `The areas the exposure model reads as evidence of reasonable security safeguards (s.8(5), Rule 6), from “${input.readiness.assessmentName}”${input.readiness.finalised ? " as finalised" : " (provisional)"}.`
              : "No assessment yet, so the security areas have no score.",
          },
        ],
      },
      {
        title: "Breach remediation still owed",
        blocks: [owedActionsBlock(input.actions, ["breach"], "No remedial action on a breach is outstanding.")],
      },
    ],
    caveats: caveats(e.modelVersion),
    notes: [notModelledText(), ...exposureNotes()],
    footer: footer(header, def.label),
  };
}

// --- Legal Position Report (counsel) ---------------------------------------

export interface LegalPositionInput extends StakeholderReportInput {
  /** The overview's rights section (`countRights`) and the requests that need someone now, oldest first. */
  rights: { counts: RightsCounts; attention: readonly { requestCode: string; kindLabel: string; clockLabel: string; overdue: boolean }[] };
  /** The consent register: the published notices, the live widget version, and the counts over every principal's latest record. */
  consent: {
    counts: ConsentCounts;
    notices: readonly { languageLabel: string; version: number; publishedOn: string | null }[];
    liveWidgetVersion: number | null;
  };
  /** The processing register's own counts (children's data, retention incomplete). */
  register: RopaRegisterCounts;
  /** The overview's retention section (`countRetention`), and the Third-Schedule class if one is recorded (never inferred). */
  retention: {
    counts: RetentionCounts;
    overdue: readonly { recordCode: string | null; endsOn: string | null; erasureIncomplete: boolean }[];
    thirdScheduleLabel: string | null;
  };
  /** The AI risk register's counts (`countAiSystems`) — an enabling note, never a status. */
  ai: { counts: AiRegisterCounts; sdfNotified: boolean };
}

const LEGAL_HEADS: readonly ModelledHeadCode[] = ["H3", "H7"];

export function legalPositionReport(input: LegalPositionInput): ReportDocument {
  const { header, exposure: e, rights, consent, register, retention, ai } = input;
  const def = reportKindDefinition("legal_position");
  const rc = rights.counts;
  const cc = consent.counts;
  const tc = retention.counts;
  const ac = ai.counts;

  return {
    kind: "legal_position",
    title: def.label,
    audience: `For ${def.audience}`,
    organizationName: header.organizationName,
    meta: stakeholderMeta(header, e),
    sections: [
      whereYouStand(input, LEGAL_HEADS, [
        { label: "Requests past the Rules' ninety days", value: rc.overdue.toLocaleString("en-IN"), note: "Rule 14(3).", tone: rc.overdue > 0 ? "critical" : "positive" },
        { label: "Erasures overdue", value: tc.overdue.toLocaleString("en-IN"), note: "s.8(7), Rule 8(3).", tone: tc.overdue > 0 ? "critical" : "positive" },
      ]),
      { title: PENALTY_HEADS_SECTION_TITLE, blocks: headBlocksFor(e, LEGAL_HEADS) },
      {
        title: "Rights of the Data Principal and grievances (s.11–14, Rule 14)",
        blocks: [
          {
            type: "table",
            columns: COUNT_COLUMNS,
            rows: countRows([
              ["Requests and grievances recorded (withdrawn and void included)", rc.total],
              ["Open requests to exercise a right", rc.openRequests],
              ["Open grievances (s.13)", rc.openGrievances],
              ["Open past TrustStack's 30-day target — a target, not a statutory period", rc.pastTarget, "warning"],
              ["Open past the ninety days the Rules allow (Rule 14(3))", rc.overdue, "critical"],
              ["Responded", rc.responded],
              ["…of which after the ninety days", rc.respondedLate, "warning"],
              ["Withdrawn by the person, or void", rc.closedOtherwise],
            ]),
            empty: "—",
          },
          {
            type: "table",
            columns: [
              { header: "Request", width: 0.2 },
              { header: "Kind", width: 0.4 },
              { header: "Where it stands", width: 0.4 },
            ],
            rows: rights.attention.map((r) => [r.requestCode, r.kindLabel, { text: r.clockLabel, tone: r.overdue ? "critical" : "warning" }]),
            empty: "No open request or grievance is past TrustStack's target or the Rules' ninety days.",
          },
          { type: "paragraph", tone: "muted", text: `${RIGHTS_CLOCK_NOTE} Requests are named by code and kind only: the person's details stay in the register.` },
        ],
      },
      {
        title: "Notice and consent (s.5, s.6, Rule 3)",
        blocks: [
          {
            type: "table",
            columns: [
              { header: "Published privacy notice", width: 0.5 },
              { header: "Version", width: 0.2, align: "right" },
              { header: "Published on", width: 0.3 },
            ],
            rows: consent.notices.map((n) => [n.languageLabel, String(n.version), dateOrDash(n.publishedOn)]),
            empty: "No privacy notice has been published.",
          },
          {
            type: "paragraph",
            text:
              consent.liveWidgetVersion === null
                ? "No consent widget version is published, so no consent is being collected through TrustStack."
                : `The consent widget serves version ${consent.liveWidgetVersion}; every consent records the notice version it was given against.`,
          },
          {
            type: "table",
            columns: COUNT_COLUMNS,
            rows: countRows([
              ["Data Principals with a consent record", cc.principals],
              ["Consent given (latest record)", cc.given],
              ["Consent refused", cc.refused],
              ["Consent withdrawn (s.6(4))", cc.withdrawn],
            ]),
            empty: "—",
          },
        ],
      },
      {
        title: "Children and persons with disability (s.9, Rules 10–12)",
        blocks: [
          {
            type: "table",
            columns: COUNT_COLUMNS,
            rows: countRows([
              ["Consents given on behalf of a child or a person with disability", cc.onBehalf],
              ["…of which no verification of the parent or lawful guardian is recorded", cc.unverified, "critical"],
              ["Processing records with children's data — yes or not yet known", register.children, "warning"],
            ]),
            empty: "—",
          },
          ...(cc.unverified > 0
            ? [
                {
                  type: "notice" as const,
                  tone: "warning" as const,
                  text: "Section 9(1) requires the verifiable consent of the parent or lawful guardian, and Rules 10 and 11 say how it is verified. Each consent counted above records no such check.",
                },
              ]
            : []),
        ],
      },
      {
        title: "Retention and erasure (s.8(7), Rule 8)",
        blocks: [
          {
            type: "table",
            columns: COUNT_COLUMNS,
            rows: countRows([
              ["Retention schedules", tc.total],
              ["No end date recorded", tc.noEnd, "warning"],
              ["Running", tc.running],
              ["Ending in the next 30 days", tc.endingSoon, "warning"],
              ["Past the end date with no erasure that counts", tc.overdue, "critical"],
              ["Erased for the current cycle", tc.erased],
              ["Processing records with retention incomplete", register.missingRetention, "warning"],
            ]),
            empty: "—",
          },
          {
            type: "table",
            columns: [
              { header: "Overdue erasure — processing record", width: 0.35 },
              { header: "End date", width: 0.25 },
              { header: "Note", width: 0.4 },
            ],
            rows: retention.overdue.map((s) => [
              s.recordCode ?? "A record no longer in the register",
              dateOrDash(s.endsOn),
              s.erasureIncomplete ? { text: "Erasure incomplete — processors not told", tone: "critical" } : "No erasure recorded",
            ]),
            empty: "No erasure is overdue.",
          },
          {
            type: "paragraph",
            text:
              "An erasure counts only when it is complete — the processors were told to erase, or none held the data (s.8(7)(b)) — and was not recorded in error. " +
              (retention.thirdScheduleLabel
                ? `This organisation is recorded in the Third Schedule (${retention.thirdScheduleLabel}), so Rule 8(1)–(2) apply as well.`
                : "No Third Schedule class is recorded, so Rule 8(1)–(2) do not apply: s.8(7) and Rule 8(3)'s one-year floor do."),
          },
          { type: "paragraph", tone: "muted", text: retention.thirdScheduleLabel ? `${RETENTION_NOTE} ${RETENTION_DEEMED_NOTE}` : RETENTION_NOTE },
        ],
      },
      {
        title: "AI systems — an enabling note, not a status",
        blocks: [
          {
            type: "table",
            columns: COUNT_COLUMNS,
            rows: countRows([
              ["AI systems in use", ac.inUse],
              ["…with no review recorded in the last twelve months (a TrustStack default)", ac.unreviewed, "warning"],
              ["…that track, behaviourally monitor or target advertising at children (s.9(3))", ac.childTracking],
              ["…of which no Fourth Schedule exemption is recorded", ac.childTrackingUnexempt, "critical"],
              ["…where the children's question is not yet answered", ac.childTrackingUnknown, "warning"],
            ]),
            empty: "—",
          },
          ...(ac.childTrackingUnexempt > 0
            ? [
                {
                  type: "notice" as const,
                  tone: "warning" as const,
                  text: "Section 9(3) bars tracking or behavioural monitoring of children and advertising targeted at them, unless the processing is exempt (s.9(4)–(5), Rule 12, the Fourth Schedule). The systems counted above record such processing with no exemption — for counsel to confirm.",
                },
              ]
            : []),
          {
            type: "paragraph",
            tone: "muted",
            text: `${AI_RISK_NOTE} ${ai.sdfNotified ? "A Significant Data Fiduciary notification is recorded, so head 4 applies and an unreviewed AI system is a reason on it." : "No Significant Data Fiduciary notification is recorded, so head 4 does not apply."}`,
          },
        ],
      },
      {
        title: "Rights and retention remediation still owed",
        blocks: [owedActionsBlock(input.actions, ["rights", "retention"], "No remedial action on a request, a grievance or a retention schedule is outstanding.")],
      },
    ],
    caveats: caveats(e.modelVersion),
    notes: [notModelledText(), ...exposureNotes()],
    footer: footer(header, def.label),
  };
}

// --- Processor Exposure Report (procurement) -------------------------------

/** The processor register's own counts, as its reader returns them. */
export interface ProcessorRegisterCounts {
  vendors: number;
  processors: number;
  contractGaps: number;
  accepted: number;
  neverAssessed: number;
  awaitingReview: number;
  withVendor: number;
  outOfDate: number;
}

/** One vendor as the processor register's reader shaped it — never its respondent's name or email. */
export interface ReportProcessorLine {
  name: string;
  service: string | null;
  role: VendorRole;
  isProcessor: boolean;
  contractExists: TriState;
  dpdpClauses: TriState;
  crossBorder: TriState;
  contractGap: boolean;
  contractReviewPassed: boolean;
  /** The latest ACCEPTED assessment — the one that counts. */
  current: { riskScore: number | null; riskTierLabel: string | null; reviewBy: string | null; outOfDate: boolean } | null;
  /** The one not yet accepted, if any. */
  open: { statusLabel: string; withVendor: boolean } | null;
  documents: number;
}

export interface ProcessorExposureInput extends StakeholderReportInput {
  processors: { counts: ProcessorRegisterCounts; vendors: readonly ReportProcessorLine[] };
}

const PROCESSOR_HEADS: readonly ModelledHeadCode[] = ["H1", "H7"];

const VENDOR_ROLE_REPORT_LABEL: Readonly<Record<VendorRole, string>> = Object.freeze({
  data_processor: "Data Processor",
  independent: "Independent Data Fiduciary",
  unknown: "Role not yet known — counted as a processor",
});

function contractText(v: ReportProcessorLine): string {
  if (!v.isProcessor) return "Not a processor: s.8(2) does not apply.";
  if (v.contractExists !== "yes") return `Contract: ${TRI_STATE_REPORT_LABEL[v.contractExists]}.`;
  return `Contract: Yes. DPDP clauses: ${TRI_STATE_REPORT_LABEL[v.dpdpClauses]}.${v.contractReviewPassed ? " Its own review date has passed." : ""}`;
}

function contractNeed(v: ReportProcessorLine): string {
  if (v.contractExists !== "yes") return "Record a contract (s.8(2)), with the security safeguards it must provide for (Rule 6(1)(f)).";
  return "Amend the contract to carry DPDP clauses, then record it: the processor acts only on instructions, keeps reasonable security safeguards and erases when told (s.8(2), s.8(7)(b), Rule 6(1)(f)).";
}

function assessmentText(v: ReportProcessorLine): ReportCell {
  if (v.current) {
    const risk = v.current.riskScore === null ? "" : ` · risk ${v.current.riskScore}${v.current.riskTierLabel ? ` (${v.current.riskTierLabel})` : ""}`;
    return v.current.outOfDate
      ? { text: `Accepted${risk} — past its review-by date`, tone: "warning" }
      : { text: `Accepted${risk}`, tone: "positive" };
  }
  if (v.open) return { text: `${v.open.statusLabel}${v.open.withVendor ? " — with the vendor" : ""}`, tone: "warning" };
  return v.isProcessor ? { text: NO_ACCEPTED_ASSESSMENT_LABEL, tone: "warning" } : "—";
}

export function processorExposureReport(input: ProcessorExposureInput): ReportDocument {
  const { header, exposure: e, processors } = input;
  const def = reportKindDefinition("processor_exposure");
  const c = processors.counts;
  const processorRows = processors.vendors.filter((v) => v.isProcessor);
  const gaps = processorRows.filter((v) => v.contractGap);
  const toAssess = processorRows.filter((v) => v.current === null || v.current.outOfDate || v.open !== null);
  const independent = processors.vendors.filter((v) => !v.isProcessor);

  return {
    kind: "processor_exposure",
    title: def.label,
    audience: `For ${def.audience}`,
    organizationName: header.organizationName,
    meta: stakeholderMeta(header, e),
    sections: [
      whereYouStand(input, PROCESSOR_HEADS, [
        { label: "Processors with a contract gap", value: c.contractGaps.toLocaleString("en-IN"), note: "No contract, or no DPDP clauses, recorded.", tone: c.contractGaps > 0 ? "critical" : "positive" },
        { label: "Processors with no accepted assessment", value: c.neverAssessed.toLocaleString("en-IN"), tone: c.neverAssessed > 0 ? "warning" : "positive" },
      ]),
      {
        title: PENALTY_HEADS_SECTION_TITLE,
        blocks: [
          ...headBlocksFor(e, PROCESSOR_HEADS),
          { type: "paragraph", tone: "muted", text: "Head 7 is the residual head (any other provision): some of its reasons may come from other registers." },
        ],
      },
      {
        title: "The processor register (s.8(2))",
        blocks: [
          {
            type: "table",
            columns: COUNT_COLUMNS,
            rows: countRows([
              ["Vendors recorded", c.vendors],
              ["Data processors, or role not yet known", c.processors],
              ["…with no contract, or no DPDP clauses, recorded", c.contractGaps, "critical"],
              ["…with an accepted assessment", c.accepted],
              // B3's words for the reader's count (D-116.9): awaiting review, with the vendor, or never started.
              [`…with ${NO_ACCEPTED_ASSESSMENT_LABEL.toLowerCase()}`, c.neverAssessed, "warning"],
              ["…accepted assessment past its review-by date (a TrustStack default)", c.outOfDate, "warning"],
              ["Assessments awaiting review", c.awaitingReview],
              ["Questionnaires with the vendor", c.withVendor],
            ]),
            empty: "—",
          },
          {
            type: "table",
            columns: [
              { header: "Vendor", width: 0.24 },
              { header: "Role", width: 0.14 },
              { header: "Contract", width: 0.24 },
              { header: "Cross-border", width: 0.1 },
              { header: "Assessment", width: 0.19 },
              { header: "Documents", width: 0.09, align: "right" },
            ],
            rows: processors.vendors.map((v) => [
              v.service ? `${v.name} · ${v.service}` : v.name,
              VENDOR_ROLE_REPORT_LABEL[v.role],
              v.contractGap ? { text: contractText(v), tone: "critical" } : contractText(v),
              TRI_STATE_REPORT_LABEL[v.crossBorder],
              assessmentText(v),
              v.documents.toLocaleString("en-IN"),
            ]),
            empty: "No vendor is recorded.",
          },
        ],
      },
      {
        title: "Contracts to fix",
        blocks: [
          {
            type: "table",
            columns: [
              { header: "Processor", width: 0.3 },
              { header: "What is recorded", width: 0.3 },
              { header: "What it needs", width: 0.4 },
            ],
            rows: gaps.map((v) => [v.name, contractText(v), contractNeed(v)]),
            empty: "Every processor has a contract with DPDP clauses recorded.",
          },
        ],
      },
      {
        title: "Assessments to complete or renew",
        blocks: [
          {
            type: "table",
            columns: [
              { header: "Processor", width: 0.35 },
              { header: "Assessment", width: 0.4 },
              { header: "Review by", width: 0.25 },
            ],
            rows: toAssess.map((v) => [v.name, assessmentText(v), dateOrDash(v.current?.reviewBy ?? null)]),
            empty: "Every processor has a current accepted assessment.",
          },
          {
            type: "paragraph",
            tone: "muted",
            text: `${VENDOR_REVIEW_NOTE} ${VENDOR_RISK_NOTE} Nothing a vendor answers counts until someone who neither answered, submitted nor sent the link has reviewed it.`,
          },
          ...(independent.length > 0
            ? [
                {
                  type: "paragraph" as const,
                  tone: "muted" as const,
                  text: `${independent.length.toLocaleString("en-IN")} ${independent.length === 1 ? "vendor is" : "vendors are"} recorded as an independent Data Fiduciary, not a processor: s.8(2) does not apply to ${independent.length === 1 ? "it" : "them"}.`,
                },
              ]
            : []),
        ],
      },
    ],
    caveats: caveats(e.modelVersion),
    notes: [notModelledText(), ...exposureNotes()],
    footer: footer(header, def.label),
  };
}
