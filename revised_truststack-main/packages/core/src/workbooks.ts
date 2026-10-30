/**
 * The three working spreadsheets (Slice 9, Stage 4) — what an XLSX export
 * SAYS, as data, the way `reports.ts` holds what a PDF says.
 *
 * A `ReportWorkbook` is an "About" block (the title, the organisation, the
 * date, D-011's caveat) and sheets of plain VALUES. The app's renderer
 * (`lib/reports/xlsx.ts`) writes them with exceljs and decides nothing: no
 * formula is ever written, and any text a spreadsheet could read as one is
 * defused with `csvCell`'s rule (`defuseFormula`, pitfall 9) — here, before
 * the renderer sees it, so the rule is unit-tested without a file.
 *
 * No arithmetic (D-069): every figure is a stored value or a count of the
 * rows the readers returned. No question code, pack code or trigger (D-071):
 * the inputs carry plain words, and the mapping key behind "penalty heads" is
 * read through the model, never printed.
 */
import { EVIDENCE_LEVEL_MEANING } from "./assessment-display.js";
import { DPDP_REPORT_CAVEAT } from "./caveat.js";
import { domainByCode } from "./domains.js";
import { GAP_SEVERITY_LABEL } from "./engine.js";
import { directHeadsOf } from "./exposure.js";
import { GAP_ACTION_STATUS_LABEL, isCalendarDate, ROADMAP_WINDOW_LABEL, roadmapWindow } from "./gaps.js";
import { dayLabel } from "./intelligence.js";
import {
  CLOSURE_BASIS_LABEL,
  EVIDENCE_LINK_LABEL,
  EVIDENCE_REVIEW_LABEL,
  headsLabelFor,
  isAcceptedEvidence,
  isEnablingKey,
  linkDirectHeads,
  reportKindDefinition,
  timestampLabel,
  type EvidenceIndexEntry,
  type EvidenceLinkLine,
  type ReportGapLine,
  type ReportHeader,
  type ReportKind,
} from "./reports.js";
import { defuseFormula } from "./ropa.js";

// ---------------------------------------------------------------------------
// The workbook model — what the renderer writes
// ---------------------------------------------------------------------------

/**
 * A calendar date in India (`YYYY-MM-DD`), written as a real date cell — so it
 * sorts and filters as a date in Excel (F4.7). A value, never a formula.
 */
export interface WorkbookDate {
  date: string;
}

/** A value, never a formula: text (already defused), a number, a date, or empty. */
export type WorkbookCell = string | number | WorkbookDate | null;

/** A date cell, or empty. Throws on anything that is not a calendar date. */
export function dateCell(day: string | null | undefined): WorkbookCell {
  if (day === null || day === undefined || day === "") return null;
  if (!isCalendarDate(day)) throw new Error(`a date cell needs YYYY-MM-DD (got ${day})`);
  return { date: day };
}

/** An instant as its date in India (D-055) — not the UTC date the ISO string starts with. */
export function indiaDay(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso));
}

export interface WorkbookColumn {
  header: string;
  /** Excel's column width, in characters. */
  width: number;
}

export interface WorkbookSheet {
  /** ≤ 31 characters, no `[]:*?/\` (Excel's rule). */
  name: string;
  columns: WorkbookColumn[];
  rows: WorkbookCell[][];
  /** Written under the header when there are no rows, so an empty export still says something. */
  empty: string;
}

export interface ReportWorkbook {
  kind: ReportKind;
  title: string;
  organizationName: string;
  /** Label/value pairs for the About sheet: as of, version, generated. */
  about: { label: string; value: string }[];
  /** Verbatim: D-011's caveat on every export. */
  caveats: { title: string; text: string }[];
  notes: string[];
  sheets: WorkbookSheet[];
}

/** The About sheet's name — first in every workbook. */
export const WORKBOOK_ABOUT_SHEET = "About";

/** Every word a workbook holds, in order — what the caveat and black-box tests read. */
export function workbookText(wb: ReportWorkbook): string {
  const parts: string[] = [wb.title, wb.organizationName, ...wb.about.flatMap((a) => [a.label, a.value])];
  for (const c of wb.caveats) parts.push(c.title, c.text);
  parts.push(...wb.notes);
  for (const s of wb.sheets) {
    parts.push(s.name, ...s.columns.map((c) => c.header));
    if (s.rows.length === 0) parts.push(s.empty);
    for (const r of s.rows) for (const c of r) if (c !== null) parts.push(typeof c === "object" ? c.date : String(c));
  }
  return parts.filter((p) => p !== "").join("\n");
}

/** Text for a cell: defused, so nothing a client typed can run in someone's Excel. */
const text = (value: string | null | undefined): WorkbookCell => (value === null || value === undefined || value === "" ? null : defuseFormula(value));

const yesNo = (v: boolean) => (v ? "Yes" : "No");

function about(header: ReportHeader, kind: ReportKind): ReportWorkbook["about"] {
  return [
    { label: "Organisation", value: header.organizationName },
    { label: "As of", value: dayLabel(header.asOf) },
    { label: "Version", value: String(header.version) },
    { label: "Generated", value: `${timestampLabel(header.generatedAt)}${header.generatedByName ? ` by ${header.generatedByName}` : ""}` },
    { label: "Report", value: reportKindDefinition(kind).question },
  ];
}

function shell(header: ReportHeader, kind: ReportKind, notes: string[], sheets: WorkbookSheet[]): ReportWorkbook {
  return {
    kind,
    title: reportKindDefinition(kind).label,
    organizationName: header.organizationName,
    about: about(header, kind),
    caveats: [{ title: "About this export", text: DPDP_REPORT_CAVEAT }],
    notes: [...notes, "Every value is as stored when the file was generated; no cell holds a formula."],
    sheets,
  };
}

// ---------------------------------------------------------------------------
// Gap & Action Tracker — every gap and action, from both parents
// ---------------------------------------------------------------------------

export interface GapActionTrackerInput {
  header: ReportHeader;
  /** India's date (D-055): the window and "overdue" are measured from it. */
  today: string;
  gaps: readonly ReportGapLine[];
}

const GAP_STATE_LABEL: Readonly<Record<string, string>> = Object.freeze({ open: "Open", superseded: "No longer applies" });

export function gapActionTracker(input: GapActionTrackerInput): ReportWorkbook {
  const { header, today } = input;
  const actions = input.gaps.flatMap((g) => g.actions.map((a) => ({ gap: g, a })));

  const actionRows: WorkbookCell[][] = actions.map(({ gap, a }) => {
    const owed = gap.state === "open" && a.status !== "closed";
    const window = roadmapWindow(a.dueDate, today);
    return [
      text(a.sourceLabel),
      text(a.parentName),
      text(a.context),
      text(a.title),
      text(GAP_SEVERITY_LABEL[a.severity]),
      text(a.priority),
      text(a.ownerName ?? (a.ownerUserId ? "A former member" : "Unassigned")),
      text(GAP_ACTION_STATUS_LABEL[a.status]),
      text(a.dueDate),
      owed ? text(ROADMAP_WINDOW_LABEL[window]) : null,
      text(yesNo(owed && window === "overdue")),
      text(GAP_STATE_LABEL[gap.state] ?? gap.state),
      text(headsLabelFor(directHeadsOf(a.mapping), isEnablingKey(a.mapping))),
      a.evidence.length,
      a.evidence.filter((e) => isAcceptedEvidence(e.reviewStatus)).length,
      text(a.closedAt ? a.closedAt.slice(0, 10) : null),
      text(a.closedByName),
      text(a.closureBasis ? CLOSURE_BASIS_LABEL[a.closureBasis] : null),
      text(a.notes),
    ];
  });

  const gapRows: WorkbookCell[][] = input.gaps.map((g) => [
    text(g.sourceLabel),
    text(g.parentName),
    text(g.context),
    text(g.finding),
    text(g.recommendedFix),
    text(GAP_SEVERITY_LABEL[g.severity]),
    text(g.priority),
    text(GAP_STATE_LABEL[g.state] ?? g.state),
    text(headsLabelFor(directHeadsOf(g.mapping), isEnablingKey(g.mapping))),
    g.actions.length,
    g.actions.filter((a) => g.state === "open" && a.status !== "closed").length,
  ]);

  return shell(
    header,
    "gap_action_tracker",
    [
      "Actions: one row per remediation action, from every register, labelled by source.",
      "Gaps: one row per gap, with how many of its actions are still owed.",
      "Penalty heads are those the gap counts against directly under the TrustStack exposure model; the window and Overdue are measured from today's date in India.",
    ],
    [
      {
        name: "Actions",
        columns: [
          { header: "Source", width: 20 },
          { header: "Assessment or record", width: 32 },
          { header: "Area or register rule", width: 36 },
          { header: "Action", width: 48 },
          { header: "Severity", width: 11 },
          { header: "Priority", width: 9 },
          { header: "Owner", width: 22 },
          { header: "Status", width: 13 },
          { header: "Due date", width: 12 },
          { header: "Roadmap window", width: 22 },
          { header: "Overdue", width: 9 },
          { header: "Gap", width: 18 },
          { header: "Penalty heads", width: 16 },
          { header: "Artefacts attached", width: 10 },
          { header: "Accepted artefacts", width: 10 },
          { header: "Closed on", width: 12 },
          { header: "Closed by", width: 22 },
          { header: "Closed on the basis of", width: 22 },
          { header: "Notes", width: 40 },
        ],
        rows: actionRows,
        empty: "No remediation action yet.",
      },
      {
        name: "Gaps",
        columns: [
          { header: "Source", width: 20 },
          { header: "Assessment or record", width: 32 },
          { header: "Area or register rule", width: 36 },
          { header: "Finding", width: 60 },
          { header: "Recommended fix", width: 60 },
          { header: "Severity", width: 11 },
          { header: "Priority", width: 9 },
          { header: "State", width: 18 },
          { header: "Penalty heads", width: 16 },
          { header: "Actions", width: 9 },
          { header: "Actions still owed", width: 10 },
        ],
        rows: gapRows,
        empty: "No gap has been generated yet.",
      },
    ],
  );
}

// ---------------------------------------------------------------------------
// ROPA Register — the CSV export's columns, as a workbook
// ---------------------------------------------------------------------------

export interface RopaRegisterWorkbookInput {
  header: ReportHeader;
  /** The export's column headers — the app's one list, shared with the CSV (SLICE_09 §5). */
  columns: readonly string[];
  /** One row per record, in the columns' order: stored values only. */
  rows: readonly (readonly (string | number | null)[])[];
}

/** Wide text columns get room; codes and numbers stay narrow. */
const ropaWidth = (header: string) => (/name|purpose|description|categor|safeguard|missing|factors|reason|note|basis|system|vendor|sharing|retention/i.test(header) ? 36 : 16);

export function ropaRegisterWorkbook(input: RopaRegisterWorkbookInput): ReportWorkbook {
  return shell(
    input.header,
    "ropa_register",
    [
      "A DPDP readiness register — not a statutory record.",
      "The workbook's own columns come first, under their workbook names, so this sheet imports straight back; the register's derived columns follow.",
    ],
    [
      {
        name: "Register",
        columns: input.columns.map((h) => ({ header: h, width: ropaWidth(h) })),
        rows: input.rows.map((r) => r.map((c) => (typeof c === "number" ? c : text(c)))),
        empty: "No processing record yet.",
      },
    ],
  );
}

// ---------------------------------------------------------------------------
// Evidence Index — every artefact and what it evidences
// ---------------------------------------------------------------------------

export interface EvidenceIndexInput {
  header: ReportHeader;
  entries: readonly EvidenceIndexEntry[];
}

function linkWhere(l: EvidenceLinkLine): string {
  switch (l.type) {
    case "assessment_response":
      return l.assessmentName;
    case "gap_action":
      return `${l.sourceLabel} · ${l.parentName}`;
    case "ropa_record":
      return l.recordCode;
    case "vendor":
      return "Processor register";
    case "retention_schedule":
      return "Retention register";
    case "ai_system":
      return "AI risk register";
    case "breach_incident":
      return l.incidentCode;
    case "rights_request":
      return l.requestCode;
  }
}

function linkWhat(l: EvidenceLinkLine): string {
  switch (l.type) {
    case "assessment_response": {
      const area = domainByCode(l.domainCode)?.name ?? "";
      return l.questionText ? `${area}: ${l.questionText}` : area;
    }
    case "gap_action":
      return `${l.actionTitle} (${l.context})`;
    case "ropa_record":
      return l.recordName;
    case "vendor":
      return l.service ? `${l.vendorName} (${l.service})` : l.vendorName;
    case "retention_schedule":
      return `${l.scheduleName} (${l.context})`;
    case "ai_system":
      return l.systemName;
    case "breach_incident":
      return l.title;
    case "rights_request":
      return l.kindLabel;
  }
}

function linkHeads(l: EvidenceLinkLine): string {
  if (l.type === "assessment_response") return headsLabelFor(linkDirectHeads(l), isEnablingKey({ source: "assessment", domainCode: l.domainCode }));
  if (l.type === "gap_action") return headsLabelFor(linkDirectHeads(l), isEnablingKey(l.mapping));
  // A register's own row: the heads its facts can set (none for a processing record or an AI system).
  return headsLabelFor(linkDirectHeads(l));
}

/** Who uploaded a file a vendor's respondent sent through the questionnaire link (F4.7) — there is no member to name. */
export const VENDOR_LINK_UPLOADER = "The vendor (questionnaire link)";

/** E0–E5 in words, for the About sheet: the spec's evidence-level table, as the assessment shows it (F4.7). */
export const EVIDENCE_LEVEL_GLOSS =
  "Evidence level is the reviewer's rating of a file: " +
  Object.entries(EVIDENCE_LEVEL_MEANING)
    .map(([level, meaning]) => `E${level} — ${meaning}`)
    .join("; ") +
  ". An answer's score is capped by its strongest reviewed file.";

export function evidenceIndexWorkbook(input: EvidenceIndexInput): ReportWorkbook {
  const level = (n: number | null) => (n === null ? null : `E${n}`);
  const rows: WorkbookCell[][] = input.entries.flatMap((e) => {
    const artefact: WorkbookCell[] = [
      text(e.fileName),
      text(e.contentType),
      e.byteSize,
      text(e.uploadedViaVendorLink ? VENDOR_LINK_UPLOADER : e.uploadedByName),
      dateCell(indiaDay(e.uploadedAt)),
      text(EVIDENCE_REVIEW_LABEL[e.reviewStatus]),
      text(level(e.evidenceLevel)),
      text(e.reviewedByName),
      dateCell(e.reviewedAt ? indiaDay(e.reviewedAt) : null),
      text(e.reviewNotes),
    ];
    if (e.links.length === 0) return [[...artefact, text("Not linked"), null, null, null]];
    return e.links.map((l) => [...artefact, text(EVIDENCE_LINK_LABEL[l.type]), text(linkWhere(l)), text(linkWhat(l)), text(linkHeads(l))]);
  });

  return shell(
    input.header,
    "evidence_index",
    [
      "One row per artefact and what it is linked to: an artefact that supports three things has three rows; one linked to nothing has one row, \"Not linked\".",
      "Accepted means reviewed as Adequate or Strong; nobody reviews their own upload.",
      EVIDENCE_LEVEL_GLOSS,
      "Uploaded on and Reviewed on are dates in India. A file a processor sent through the questionnaire link names the vendor as its uploader.",
      "Penalty heads are those the area or gap evidences directly under the TrustStack exposure model; an enabling control is good practice no DPDP provision imposes as such.",
      "A document on a register's own row — a breach, a request, a processor, a retention schedule — evidences the heads that register's facts can set. A request is named by its code and kind, never by the person who made it.",
    ],
    [
      {
        name: "Evidence index",
        columns: [
          { header: "Artefact", width: 36 },
          { header: "File type", width: 22 },
          { header: "Size (bytes)", width: 12 },
          { header: "Uploaded by", width: 22 },
          { header: "Uploaded on", width: 12 },
          { header: "Review", width: 16 },
          { header: "Evidence level", width: 10 },
          { header: "Reviewed by", width: 22 },
          { header: "Reviewed on", width: 12 },
          { header: "Review notes", width: 40 },
          { header: "Linked to", width: 20 },
          { header: "Where", width: 32 },
          { header: "What it supports", width: 60 },
          { header: "Penalty heads", width: 16 },
        ],
        rows,
        empty: "No evidence has been uploaded yet.",
      },
    ],
  );
}
