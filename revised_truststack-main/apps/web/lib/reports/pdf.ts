import "server-only";
import path from "node:path";
import { createElement as h, type ReactElement, type ReactNode } from "react";
import { Document, Font, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import type { ReportBlock, ReportCell, ReportDocument, ReportSection, ReportTone } from "@truststack/core";

/**
 * The one PDF renderer (Slice 9, Stage 3; `@react-pdf/renderer`, D-076). It
 * draws any `ReportDocument` core built — tiles, tables, paragraphs, bullets,
 * notices, then the caveats — and has no opinions of its own: no figure,
 * label or sentence is decided here, so what a report SAYS is tested in
 * core without rendering, and this file only decides how it LOOKS.
 *
 * The fonts are Noto Sans, with Noto Sans Devanagari as a per-glyph fallback
 * for names and titles typed in Hindi or Marathi (both SIL Open Font
 * License, `fonts/OFL.txt`), embedded: PDF's standard fonts have no ₹.
 * `tests/unit/report-pdf.test.ts` fails if the wording core can print needs a
 * glyph neither font has.
 */

export const REPORT_FONT_FAMILY = "Noto Sans";
const FALLBACK_FONT_FAMILY = "Noto Sans Devanagari";
const fontFile = (name: string) => path.join(process.cwd(), "lib/reports/fonts", name);
export const REPORT_FONT_FILES = {
  regular: fontFile("NotoSans-Regular.ttf"),
  bold: fontFile("NotoSans-Bold.ttf"),
  devanagariRegular: fontFile("NotoSansDevanagari-Regular.ttf"),
  devanagariBold: fontFile("NotoSansDevanagari-Bold.ttf"),
} as const;

let fontsRegistered = false;
function registerFonts() {
  if (fontsRegistered) return;
  Font.register({
    family: REPORT_FONT_FAMILY,
    fonts: [
      { src: REPORT_FONT_FILES.regular, fontWeight: 400 },
      { src: REPORT_FONT_FILES.bold, fontWeight: 700 },
    ],
  });
  Font.register({
    family: FALLBACK_FONT_FAMILY,
    fonts: [
      { src: REPORT_FONT_FILES.devanagariRegular, fontWeight: 400 },
      { src: REPORT_FONT_FILES.devanagariBold, fontWeight: 700 },
    ],
  });
  // Never hyphenate: a caveat must survive text extraction word for word.
  Font.registerHyphenationCallback((word) => [word]);
  fontsRegistered = true;
}

const INK = "#0f172a";
const TEXT = "#1e293b";
const MUTED = "#64748b";
const LINE = "#e2e8f0";
const SOFT = "#f8fafc";

const TONES: Readonly<Record<ReportTone, { fg: string; bg: string; border: string }>> = {
  neutral: { fg: INK, bg: SOFT, border: LINE },
  muted: { fg: MUTED, bg: SOFT, border: LINE },
  critical: { fg: "#b91c1c", bg: "#fef2f2", border: "#fca5a5" },
  warning: { fg: "#b45309", bg: "#fffbeb", border: "#fcd34d" },
  positive: { fg: "#047857", bg: "#ecfdf5", border: "#6ee7b7" },
};

/** The Board's brief must fit one page; the DPO's report reads better a size up. */
type Density = "compact" | "standard";

function stylesFor(density: Density) {
  const base = density === "compact" ? 7.2 : 8.4;
  // Line height is set on every text style, in points: inherited from the
  // page it would be the page's, and larger text would overlap.
  const lh = (size: number) => ({ fontSize: size, lineHeight: 1.3 });
  return StyleSheet.create({
    page: {
      fontFamily: [REPORT_FONT_FAMILY, FALLBACK_FONT_FAMILY],
      // fontSize only: a lineHeight here would be inherited by the page number, which react-pdf then drops.
      fontSize: base,
      color: TEXT,
      paddingTop: 28,
      paddingBottom: 38,
      paddingHorizontal: 34,
    },
    header: { flexDirection: "row", justifyContent: "space-between", borderBottomWidth: 2, borderBottomColor: INK, paddingBottom: 6, marginBottom: 4 },
    kicker: { ...lh(base - 1.4), color: MUTED, letterSpacing: 1.2, fontWeight: 700 },
    title: { ...lh(density === "compact" ? 15 : 18), fontWeight: 700, color: INK, marginTop: 1 },
    organization: { ...lh(base + 3), fontWeight: 700, color: INK, marginTop: 2 },
    audience: { ...lh(base), color: MUTED },
    meta: { width: 200, marginLeft: 12 },
    metaRow: { flexDirection: "row", marginBottom: 1 },
    metaLabel: { width: 70, color: MUTED, ...lh(base - 0.8) },
    metaValue: { flex: 1, color: INK, ...lh(base - 0.8) },
    section: { marginTop: density === "compact" ? 5 : 10 },
    sectionTitle: {
      ...lh(base + 2.2),
      fontWeight: 700,
      color: INK,
      borderBottomWidth: 0.75,
      borderBottomColor: LINE,
      paddingBottom: 1.5,
      marginBottom: 3,
    },
    subheading: { ...lh(base + 0.8), fontWeight: 700, color: INK, marginTop: 6, marginBottom: 1.5 },
    paragraph: { ...lh(base), marginBottom: 2.5 },
    muted: { color: MUTED, ...lh(base - 0.6), marginBottom: 2.5 },
    tiles: { flexDirection: "row", marginBottom: 3 },
    tile: { flex: 1, borderWidth: 0.75, borderRadius: 3, padding: density === "compact" ? 4 : 5, marginRight: 4 },
    tileLast: { marginRight: 0 },
    tileLabel: { ...lh(base - 1), color: MUTED, fontWeight: 700 },
    tileValue: { ...lh(density === "compact" ? 12 : 14), fontWeight: 700, marginTop: 1 },
    tileNote: { ...lh(base - 1.4), color: MUTED, marginTop: 1 },
    table: { borderTopWidth: 0.75, borderTopColor: LINE, marginBottom: 3 },
    tr: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: LINE },
    th: { backgroundColor: SOFT },
    cell: { paddingVertical: density === "compact" ? 1.8 : 2.4, paddingHorizontal: 3 },
    td: { ...lh(base) },
    thText: { ...lh(base - 1), fontWeight: 700, color: MUTED },
    empty: { color: MUTED, ...lh(base), paddingVertical: 3, paddingHorizontal: 3 },
    bulletRow: { flexDirection: "row", marginBottom: 1.2 },
    bullet: { width: 9, color: MUTED, ...lh(base) },
    bulletText: { flex: 1, ...lh(base) },
    notice: { borderLeftWidth: 2.5, paddingVertical: 2.5, paddingHorizontal: 6, marginBottom: 3 },
    noticeText: { ...lh(base) },
    caveats: { marginTop: density === "compact" ? 6 : 10, borderTopWidth: 0.75, borderTopColor: LINE, paddingTop: 5 },
    caveatTitle: { ...lh(base - 0.6), fontWeight: 700, color: INK },
    caveatText: { ...lh(base - 0.8), color: TEXT, marginBottom: 3 },
    note: { ...lh(base - 1.2), color: MUTED, marginBottom: 1.5 },
    footerText: { position: "absolute", bottom: 16, left: 34, right: 110, ...lh(base - 1.6), color: MUTED },
    // No lineHeight here: react-pdf drops a `render` text that has one.
    pageNumber: { position: "absolute", bottom: 16, left: 34, right: 34, textAlign: "right", fontSize: base - 1.6, color: MUTED },
    footerRule: { position: "absolute", bottom: 28, left: 34, right: 34, borderTopWidth: 0.5, borderTopColor: LINE },
  });
}

type Styles = ReturnType<typeof stylesFor>;

/** Tables this short move to the next page whole rather than leave a row behind. */
const KEEP_TOGETHER_ROWS = 14;

const cellText = (c: ReportCell) => (typeof c === "string" ? c : c.text);
const cellTone = (c: ReportCell): ReportTone | null => (typeof c === "string" ? null : c.tone);

/** Points of rows a long table's header needs after it on the same page — about three rows. */
const LEAD_PRESENCE = 45;

/** `lead`: a title or subheading that must travel with a long table's header. */
function block(b: ReportBlock, s: Styles, key: number, lead?: ReactElement): ReactElement {
  switch (b.type) {
    case "paragraph":
      return h(Text, { key, style: b.tone === "muted" ? s.muted : s.paragraph }, b.text);
    case "subheading":
      return h(Text, { key, style: s.subheading, minPresenceAhead: 30 }, b.text);
    case "notice": {
      const tone = TONES[b.tone === "warning" ? "warning" : "neutral"];
      return h(
        View,
        { key, style: [s.notice, { borderLeftColor: tone.border, backgroundColor: tone.bg }], wrap: false },
        h(Text, { style: [s.noticeText, { color: b.tone === "warning" ? tone.fg : TEXT }] }, b.text),
      );
    }
    case "bullets":
      return h(
        View,
        { key, style: { marginBottom: 3 } },
        ...b.items.map((item, i) =>
          h(View, { key: i, style: s.bulletRow, wrap: false }, h(Text, { style: s.bullet }, "•"), h(Text, { style: s.bulletText }, item)),
        ),
      );
    case "tiles":
      return h(
        View,
        { key, style: s.tiles, wrap: false },
        ...b.tiles.map((t, i) => {
          const tone = TONES[t.tone ?? "neutral"];
          return h(
            View,
            {
              key: i,
              style: [s.tile, i === b.tiles.length - 1 ? s.tileLast : {}, { borderColor: tone.border, backgroundColor: tone.bg }],
            },
            h(Text, { style: s.tileLabel }, t.label),
            h(Text, { style: [s.tileValue, { color: tone.fg }] }, t.value),
            t.note ? h(Text, { style: s.tileNote }, t.note) : null,
          );
        }),
      );
    case "table": {
      const width = (i: number) => `${(b.columns[i]!.width * 100).toFixed(2)}%`;
      const header = h(
        View,
        { style: [s.tr, s.th], wrap: false, fixed: false },
        ...b.columns.map((c, i) =>
          h(View, { key: i, style: [s.cell, { width: width(i) }] }, h(Text, { style: [s.thText, { textAlign: c.align ?? "left" }] }, c.header)),
        ),
      );
      const rows =
        b.rows.length === 0
          ? [h(Text, { key: "empty", style: s.empty }, b.empty)]
          : b.rows.map((row, r) =>
              h(
                View,
                { key: r, style: s.tr, wrap: false },
                ...row.map((c, i) => {
                  const tone = cellTone(c);
                  return h(
                    View,
                    { key: i, style: [s.cell, { width: width(i) }] },
                    h(
                      Text,
                      {
                        style: [
                          s.td,
                          { textAlign: b.columns[i]?.align ?? "left" },
                          tone ? { color: TONES[tone].fg, fontWeight: 700 } : {},
                        ],
                      },
                      cellText(c),
                    ),
                  );
                }),
              ),
            );
      // A short table is never split across pages. A long one breaks between
      // rows; its header — and any title leading it — needs room for its first
      // rows after it, or moves to the next page (react-pdf's minPresenceAhead,
      // which looks at the SIBLINGS that follow, so all of them share one view).
      if (b.rows.length <= KEEP_TOGETHER_ROWS) return h(View, { key, style: s.table, wrap: false }, header, ...rows);
      return h(
        View,
        { key, style: { marginBottom: 3 } },
        // react-pdf moves an element for presence only if a sibling precedes it
        // in the same parent ("breaking improves presence"); this empty one does.
        h(View, { style: { height: 0 } }),
        // The lead and the header are ONE element, so they move together.
        h(View, { wrap: false, minPresenceAhead: LEAD_PRESENCE }, ...(lead ? [lead] : []), h(View, { style: { borderTopWidth: 0.75, borderTopColor: LINE } }, header)),
        ...rows,
      );
    }
  }
}

const isLongTable = (b: ReportBlock | undefined) => b?.type === "table" && b.rows.length > KEEP_TOGETHER_ROWS;

/**
 * The blocks after a section's first, with each subheading kept with the
 * block it introduces (Stage 4: the owner's pack heads a table per window) —
 * the same rule as a section title.
 */
function restBlocks(blocks: readonly ReportBlock[], s: Styles, offset: number): ReactElement[] {
  const out: ReactElement[] = [];
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i]!;
    const next = blocks[i + 1];
    if (b.type === "subheading" && next) {
      out.push(
        isLongTable(next)
          ? block(next, s, offset + i + 1, block(b, s, offset + i))
          : h(View, { key: `k${offset + i}`, wrap: false }, block(b, s, offset + i), block(next, s, offset + i + 1)),
      );
      i += 1;
    } else {
      out.push(block(b, s, offset + i));
    }
  }
  return out;
}

function section(sec: ReportSection, s: Styles, key: number): ReactElement {
  const [first, ...rest] = sec.blocks;
  // The title never sits alone at the foot of a page: it moves with its first
  // block — or, for a long table, with its header and first rows.
  const title = h(Text, { style: s.sectionTitle, minPresenceAhead: 40 }, sec.title);
  const frame = (...children: ReactElement[]) => h(View, { key, style: s.section, break: sec.pageBreakBefore === true }, ...children);
  if (!first) return frame(title);
  // A section that opens with a subheading: the title, the subheading and what it introduces travel together.
  const [second, ...after] = rest;
  if (first.type === "subheading" && second) {
    const lead = h(View, {}, title, block(first, s, 0));
    const head = isLongTable(second) ? block(second, s, 1, lead) : h(View, { wrap: false }, lead, block(second, s, 1));
    return frame(head, ...restBlocks(after, s, 2));
  }
  const head = isLongTable(first) ? block(first, s, 0, title) : h(View, { wrap: false }, title, block(first, s, 0));
  return frame(head, ...restBlocks(rest, s, 1));
}

function reportElement(doc: ReportDocument, density: Density): ReactElement {
  const s = stylesFor(density);
  const children: ReactNode[] = [
    h(
      View,
      { key: "header", style: s.header },
      h(
        View,
        { style: { flex: 1 } },
        h(Text, { style: s.kicker }, "TRUSTSTACK DPDP COMPASS"),
        h(Text, { style: s.title }, doc.title),
        h(Text, { style: s.organization }, doc.organizationName),
        h(Text, { style: s.audience }, doc.audience),
      ),
      h(
        View,
        { style: s.meta },
        ...doc.meta.map((m, i) => h(View, { key: i, style: s.metaRow }, h(Text, { style: s.metaLabel }, m.label), h(Text, { style: s.metaValue }, m.value))),
      ),
    ),
    ...doc.sections.map((sec, i) => section(sec, s, i)),
    h(
      View,
      { key: "caveats", style: s.caveats, wrap: false },
      ...doc.caveats.flatMap((c, i) => [h(Text, { key: `t${i}`, style: s.caveatTitle }, c.title), h(Text, { key: `c${i}`, style: s.caveatText }, c.text)]),
      ...doc.notes.map((n, i) => h(Text, { key: `n${i}`, style: s.note }, n)),
    ),
    // The footer is drawn on every page: react-pdf's `fixed`, positioned in the bottom margin.
    h(View, { key: "rule", style: s.footerRule, fixed: true }),
    h(Text, { key: "footer", style: s.footerText, fixed: true }, doc.footer),
    h(Text, {
      key: "page",
      style: s.pageNumber,
      fixed: true,
      render: ({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) => `Page ${pageNumber} of ${totalPages}`,
    }),
  ];

  return h(
    Document,
    {
      title: `${doc.title} — ${doc.organizationName}`,
      author: "TrustStack DPDP Compass",
      subject: doc.audience,
      creator: "TrustStack DPDP Compass",
      producer: "TrustStack DPDP Compass",
      language: "en-IN",
    },
    h(Page, { size: "A4", style: s.page, wrap: true }, ...children),
  );
}

/** Renders a report to PDF bytes, in memory. The Board's brief is set compact so it fits one page. */
export async function renderReportPdf(doc: ReportDocument): Promise<Buffer> {
  registerFonts();
  const density: Density = doc.kind === "exposure_brief" ? "compact" : "standard";
  // react-pdf's types want a <Document> element; ours is one, built without JSX.
  return renderToBuffer(reportElement(doc, density) as Parameters<typeof renderToBuffer>[0]);
}
