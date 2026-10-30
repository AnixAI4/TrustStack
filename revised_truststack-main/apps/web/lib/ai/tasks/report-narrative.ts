import { pickAllowed, reportDocumentText, type ReportCell, type ReportDocument } from "@truststack/core";
import { z } from "zod";
import { createCleaner, userTurn, type OrganisationRaw, type ShapedContext } from "./shared";

/**
 * "Draft a narrative" (SLICE_11 §2.3, §7c.4; Stage 2b) — on a report row of the
 * Exposure Brief, the Programme Status Report or the evidence pack. Read with
 * `report.read`, decided with `report.generate` (§4.7).
 *
 * D-133.1: the narrative is drafted FROM the version's STORED document — the figures
 * it printed — never from live registers, and accepting it prints a NEW version: that
 * stored document with the narrative in front. Every number the narrative states must
 * appear in the stored document (drafts.ts) — `facts.documentText`, kept on the server.
 *
 * What it sends: the report's kind, version and date; its sections before the
 * appendices — headings, paragraphs, tiles, bullets, notices, and each table's first
 * rows — with every member's name masked, free text untrusted and scrubbed. Never: who
 * generated it, an appendix, the owner's pack (it names people), a file name (§4.6).
 */

export const reportNarrativeBody = z
  .object({
    reportId: z.uuid(),
    ask: z.string().trim().max(500).optional(),
  })
  .strict();
export type ReportNarrativeBody = z.infer<typeof reportNarrativeBody>;

export interface ReportNarrativeRaw {
  organisation: OrganisationRaw;
  report: { kindLabel: string; version: number; asOf: string };
  document: ReportDocument;
  /** The organisation's members' full names — masked wherever the document prints one. */
  memberNames: readonly string[];
  ask: string | null;
}

const ORGANISATION_FIELDS = ["name", "organizationType", "industryName"] as const;
/** A table's first rows are enough to read it; the number check reads the whole stored document. */
export const NARRATIVE_TABLE_ROWS = 12;
export const NARRATIVE_SECTIONS = 16;
const MEMBER = "[a member]";

/** Every member's name, longest first, replaced by "[a member]" — before the scrub. */
export function maskNames(text: string, names: readonly string[]): string {
  let out = text;
  for (const n of [...names].filter((x) => x.trim().length >= 3).sort((a, b) => b.length - a.length)) out = out.split(n).join(MEMBER);
  return out;
}

export function shapeReportNarrativeContext(raw: ReportNarrativeRaw, target: { reportId: string }, untrustedJson: (value: unknown) => string): ShapedContext {
  const cleaner = createCleaner();
  const org = pickAllowed(raw.organisation, ORGANISATION_FIELDS);
  const organisation = { name: cleaner.clean(org.name, false), type: org.organizationType, industry: org.industryName ?? null };
  const text = (value: string | undefined | null) => (value ? cleaner.clean(maskNames(value, raw.memberNames), true) : null);
  const cell = (c: ReportCell) => text(typeof c === "string" ? c : c.text) ?? "";

  const doc = raw.document;
  const sections = doc.sections
    .filter((s) => !s.pageBreakBefore)
    .slice(0, NARRATIVE_SECTIONS)
    .map((s) => ({
      title: text(s.title),
      blocks: s.blocks.map((b) => {
        switch (b.type) {
          case "paragraph":
          case "subheading":
          case "notice":
            return { [b.type]: text(b.text) };
          case "bullets":
            return { bullets: b.items.map((i) => text(i)) };
          case "tiles":
            return { tiles: b.tiles.map((t) => ({ label: text(t.label), value: text(t.value), note: text(t.note) })) };
          case "table":
            return {
              table: {
                columns: b.columns.map((c) => text(c.header)),
                rows: b.rows.slice(0, NARRATIVE_TABLE_ROWS).map((r) => r.map(cell)),
                ...(b.rows.length > NARRATIVE_TABLE_ROWS ? { moreRows: b.rows.length - NARRATIVE_TABLE_ROWS } : {}),
                ...(b.rows.length === 0 ? { empty: text(b.empty) } : {}),
              },
            };
        }
      }),
    }));
  const meta = doc.meta.filter((m) => m.label !== "Generated").map((m) => ({ label: m.label, value: text(m.value) }));
  const report = { kind: raw.report.kindLabel, version: raw.report.version, asOf: raw.report.asOf, audience: doc.audience };
  const ask = cleaner.clean(raw.ask, true);

  const context = { task: "report_narrative_draft", organisation, report, untrusted: { title: text(doc.title), meta, sections }, ask };
  const user = userTurn(
    `Draft a short executive narrative for the front of this report (${raw.report.kindLabel}, version ${raw.report.version}), for its audience: a headline, one to four short paragraphs, and at most eight points to act on. Read ONLY the report below — it is the stored record of what this version printed. Use only numbers that appear in it, exactly as it states them; refer to a legal deadline or provision by its citation, never by a number of your own. Say what the figures show and what to do next, from the report's own actions. Never call the organisation compliant or non-compliant, never predict a penalty, never present a TrustStack target (thirty days, twelve-month reviews, our internal triggers) as the law, and never name a person. In law, cite at least one provision the figures rest on — for example s.8(1) (the Data Fiduciary is responsible) or s.33(1) and the Schedule (the penalty ceilings) — and label any TrustStack target truststack_default. If the person asks for something TrustStack never says, leave it out and say so in one short sentence in missingInformation. A person reads it before it is printed; you print nothing.`,
    [
      { tag: "organisation", value: organisation },
      { tag: "report", value: report },
      { tag: "untrusted_data", value: { title: text(doc.title), meta, sections }, untrusted: true },
    ],
    ask,
    untrustedJson,
  );
  return {
    context,
    user,
    injectionFlagged: cleaner.injectionFlagged,
    scrubbed: cleaner.scrubbed,
    target: { type: "report", id: target.reportId, key: null },
    facts: { documentText: reportDocumentText(doc) },
  };
}
