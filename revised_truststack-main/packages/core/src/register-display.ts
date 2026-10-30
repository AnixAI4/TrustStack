/**
 * Slice 10.5 Batch B3 — the registers: how they say things.
 *
 * Display rules only. Nothing here changes a stored value, a derived score or
 * a legal position: periods stay stored in months, the rights status and its
 * outcome are the database's, and the Fourth Schedule's exemptions keep their
 * codes. Each helper words what a register already holds, so the list, the
 * filter and the record say it the same way.
 */
import {
  ROPA_CHILD_EXEMPTIONS,
  ROPA_COMPLETENESS_AREAS,
  ROPA_IMPORT_FIELDS,
  ROPA_IMPORT_HEADERS,
  type RopaAreaCode,
  type RopaChildExemption,
} from "./ropa.js";

/**
 * A retention period in the largest whole unit: 120 → "10 years", 18 → "18
 * months", 12 → "1 year". The stored value stays months (Rule 8(3) counts at
 * least one year; the database counts calendar months).
 */
export function formatRetentionPeriod(months: number): string {
  if (months > 0 && months % 12 === 0) {
    const years = months / 12;
    return `${years} ${years === 1 ? "year" : "years"}`;
  }
  return `${months} ${months === 1 ? "month" : "months"}`;
}

/**
 * The Fourth Schedule exemptions (Rule 12) by a short name. The full wording
 * stays in `ROPA_CHILD_EXEMPTIONS` (the picker and the tooltip show it); the
 * code (Part A or B, item n) goes in brackets.
 */
export const CHILD_EXEMPTION_SHORT_LABEL: Readonly<Record<RopaChildExemption, string>> = Object.freeze({
  clinical: "Clinical health services",
  allied_health: "Allied healthcare",
  education: "Educational institution",
  creche: "Crèche or day-care",
  school_transport: "School transport",
  child_law_function: "A function under law",
  child_state_benefit: "A subsidy, benefit or service",
  email_account: "An email account",
  location_safety: "Real-time location for safety",
  harmful_content: "Keeping harmful content away",
  age_check: "Confirming the person is not a child",
});

/** "Educational institution (A3)" — or null for no exemption, or one the Schedule does not list. */
export function childExemptionShort(code: string | null | undefined): string | null {
  const e = ROPA_CHILD_EXEMPTIONS.find((x) => x.code === code);
  return e ? `${CHILD_EXEMPTION_SHORT_LABEL[e.code]} (${e.part})` : null;
}

/**
 * A request's status as one phrase, the same in the list and the record:
 * "Responded — Fulfilled" once a response is recorded, else the status alone.
 */
export function rightsStatusText(statusLabel: string, outcomeLabel: string | null | undefined): string {
  return outcomeLabel ? `${statusLabel} — ${outcomeLabel}` : statusLabel;
}

/** A processor questionnaire's progress in a sentence: "43 answered, 1 not applicable, of 44". */
export function questionnaireProgress(answered: number, notApplicable: number, of: number): string {
  return `${answered} answered, ${notApplicable} not applicable, of ${of}`;
}

/**
 * The people types a register names, folded so one kind of person is offered
 * once: case is already folded by the reader; here a plural goes when its
 * singular is also there ("Applicant" and "Applicants" → "Applicant"). The
 * look-up matches the words as a substring, so the singular still finds every
 * record that says the plural. Order is kept.
 */
export function foldPeopleTypes(names: readonly string[]): string[] {
  const seen = new Map<string, string>();
  for (const n of names) {
    const key = n.trim().toLowerCase();
    if (key && !seen.has(key)) seen.set(key, n.trim());
  }
  // Only plurals that contain their singular ("-s", "-es"): "Universities" stays, as "university" would not find it.
  const singularOf = (key: string): string | null => {
    if (key.endsWith("es") && seen.has(key.slice(0, -2))) return key.slice(0, -2);
    if (key.endsWith("s") && seen.has(key.slice(0, -1))) return key.slice(0, -1);
    return null;
  };
  return [...seen.entries()].filter(([key]) => singularOf(key) === null).map(([, name]) => name);
}

/**
 * A processing record's form in five tabs (F3.2). Every one of the thirteen
 * completeness areas sits in exactly one tab; the areas, their weights and
 * their rules are unchanged (D-061) — this only groups them on screen.
 */
export const ROPA_RECORD_TABS: readonly { id: string; label: string; areas: readonly RopaAreaCode[] }[] = Object.freeze([
  { id: "who", label: "Who and what", areas: ["identity", "department_owner", "data_principals", "data_categories"] },
  { id: "purpose", label: "Purpose and ground", areas: ["purpose_basis", "collection_source", "notice_consent"] },
  { id: "systems", label: "Systems and processors", areas: ["systems", "vendors"] },
  { id: "retention", label: "Retention and security", areas: ["retention", "security", "risk_review"] },
  { id: "evidence", label: "Evidence", areas: ["evidence"] },
]);

/**
 * A tab's points from the areas the register returned with the record — a
 * sum of what the database marked complete, never a fresh completeness check.
 */
export function ropaTabPoints(
  areas: readonly { code: string; weight: number; complete: boolean }[],
  tabAreas: readonly RopaAreaCode[],
): { got: number; of: number } {
  const mine = areas.filter((a) => (tabAreas as readonly string[]).includes(a.code));
  return { got: mine.filter((a) => a.complete).reduce((n, a) => n + a.weight, 0), of: mine.reduce((n, a) => n + a.weight, 0) };
}

/** What a tab's areas are worth in all (a new record has none saved yet). */
export function ropaTabWeight(tabAreas: readonly RopaAreaCode[]): number {
  return ROPA_COMPLETENESS_AREAS.filter((a) => (tabAreas as readonly string[]).includes(a.code)).reduce((n, a) => n + a.weight, 0);
}

/**
 * The import's template (F3.12): one header row, a column for every field the
 * importer already reads, each named as the workbook names it (the first of
 * its aliases). Nothing new to parse — it is what `mapColumns` matches.
 */
export function ropaImportTemplateCsv(): string {
  return `${ROPA_IMPORT_FIELDS.map((f) => ROPA_IMPORT_HEADERS[f][0]).join(",")}\r\n`;
}
