/**
 * Slice 11 — the citation check (SLICE_11 §4.2(a)). Every answer cites the
 * Act or the Rules; the server checks each citation against the corpus the
 * model was given and drops (and flags) one the corpus does not contain. An
 * answer left with no valid citation is rejected.
 *
 * The index is built from the corpus text itself: sections 1–44 of the Act,
 * rules 1–23 of the Rules, the Act's Schedule and the Rules' seven Schedules,
 * each with the bracketed sub-provisions that appear in its text.
 */

export interface ProvisionIndex {
  /** section number → its text */
  act: ReadonlyMap<number, string>;
  /** rule number → its text */
  rules: ReadonlyMap<number, string>;
  actSchedule: boolean;
  /** 1–7: the Rules' First to Seventh Schedules found in the text */
  rulesSchedules: ReadonlySet<number>;
}

const ORDINALS = ["first", "second", "third", "fourth", "fifth", "sixth", "seventh"] as const;

/**
 * Splits numbered provisions in order: `n.` at the start of a line, followed
 * by `(`, a capital or a quote, where n is the next number expected. Expecting
 * the NEXT number keeps a numbered list inside a provision from being read as one.
 */
function splitNumbered(text: string, last: number): Map<number, string> {
  const lines = text.split("\n");
  const out = new Map<number, string>();
  let current = 0;
  let buffer: string[] = [];
  for (const line of lines) {
    const m = /^\s*(\d{1,2})\.\s*(?=[(A-Z“"])/.exec(line);
    if (m && Number(m[1]) === current + 1 && current < last) {
      if (current > 0) out.set(current, buffer.join("\n"));
      current += 1;
      buffer = [line];
    } else if (current > 0) {
      buffer.push(line);
    }
  }
  if (current > 0) out.set(current, buffer.join("\n"));
  return out;
}

export function indexProvisions(actText: string, rulesText: string): ProvisionIndex {
  const actEnd = actText.search(/^THE SCHEDULE\s*$/m);
  const act = splitNumbered(actEnd < 0 ? actText : actText.slice(0, actEnd), 44);
  const rulesEnd = rulesText.search(/^FIRST SCHEDULE\s*$/m);
  const rules = splitNumbered(rulesEnd < 0 ? rulesText : rulesText.slice(0, rulesEnd), 23);
  const rulesSchedules = new Set<number>();
  ORDINALS.forEach((o, i) => {
    if (new RegExp(`^${o.toUpperCase()} SCHEDULE\\s*$`, "m").test(rulesText)) rulesSchedules.add(i + 1);
  });
  return { act, rules, actSchedule: actEnd >= 0, rulesSchedules };
}

export type ParsedCitation =
  | { kind: "section"; number: number; parts: string[] }
  | { kind: "rule"; number: number; parts: string[] }
  | { kind: "rules_schedule"; number: number }
  | { kind: "act_schedule" };

/**
 * Reads the citation forms the prompt asks for, and the common variants:
 * `s.8(5)`, `section 8(5)(a)`, `Rule 7(2)`, `r.7(2)`, `Third Schedule`,
 * `the Schedule to the Act`. A leading "DPDP Act" / "Rules" label is ignored.
 */
export function parseCitation(ref: string): ParsedCitation | null {
  const r = ref
    .trim()
    .replace(/\s+/g, " ")
    // "DPDP Act, s.8(5)" / "Rules 2025 rule 7(2)": the label goes, the provision stays.
    .replace(/^(?:the\s+)?(?:DPDP\s+)?(?:Act|Rules)(?:,?\s*20\d\d)?\s*[,:–-]?\s*(?=(?:s\.|ss\.|sec\.|section|r\.|rule)\s*\d)/i, "");
  const parts = (s: string) => [...s.matchAll(/\(([^()]{1,6})\)/g)].map((x) => x[1]!.trim());

  let m = /^(?:s\.|ss?\.|sec\.|section)\s*(\d{1,2})((?:\s*\([^()]{1,6}\))*)$/i.exec(r);
  if (m) return { kind: "section", number: Number(m[1]), parts: parts(m[2] ?? "") };
  m = /^(?:r\.|rule)\s*(\d{1,2})((?:\s*\([^()]{1,6}\))*)$/i.exec(r);
  if (m) return { kind: "rule", number: Number(m[1]), parts: parts(m[2] ?? "") };
  m = /^(?:the\s+)?(first|second|third|fourth|fifth|sixth|seventh)\s+schedule(?:\s+to\s+the\s+(?:DPDP\s+)?rules(?:,?\s*2025)?)?$/i.exec(r);
  if (m) return { kind: "rules_schedule", number: ORDINALS.indexOf(m[1]!.toLowerCase() as (typeof ORDINALS)[number]) + 1 };
  if (/^(?:the\s+)?schedule\s+(?:to|of)\s+the\s+(?:DPDP\s+)?act(?:,?\s*2023)?$/i.test(r) || /^(?:DPDP\s+)?act,?\s*(?:2023\s*,?\s*)?(?:the\s+)?schedule$/i.test(r)) {
    return { kind: "act_schedule" };
  }
  return null;
}

/** The canonical form printed under an answer. */
export function formatCitation(c: ParsedCitation): string {
  const tail = (p: string[]) => p.map((x) => `(${x})`).join("");
  switch (c.kind) {
    case "section":
      return `s.${c.number}${tail(c.parts)}`;
    case "rule":
      return `Rule ${c.number}${tail(c.parts)}`;
    case "rules_schedule":
      return `${ORDINALS[c.number - 1]!.replace(/^./, (x) => x.toUpperCase())} Schedule`;
    case "act_schedule":
      return "The Schedule to the Act";
  }
}

export interface CitationCheck {
  ref: string;
  valid: boolean;
  /** Canonical form, when it parsed. */
  canonical: string | null;
  reason?: "unreadable" | "not_in_corpus";
}

function partsAppear(body: string, parts: string[]): boolean {
  // Each sub-provision must appear in the provision's own text, e.g. "(5)" in section 8.
  return parts.every((p) => body.includes(`(${p})`));
}

export function checkCitation(ref: string, index: ProvisionIndex): CitationCheck {
  const parsed = parseCitation(ref);
  if (!parsed) return { ref, valid: false, canonical: null, reason: "unreadable" };
  const canonical = formatCitation(parsed);
  let valid: boolean;
  switch (parsed.kind) {
    case "section": {
      const body = index.act.get(parsed.number);
      valid = body !== undefined && partsAppear(body, parsed.parts);
      break;
    }
    case "rule": {
      const body = index.rules.get(parsed.number);
      valid = body !== undefined && partsAppear(body, parsed.parts);
      break;
    }
    case "rules_schedule":
      valid = index.rulesSchedules.has(parsed.number);
      break;
    case "act_schedule":
      valid = index.actSchedule;
      break;
  }
  return valid ? { ref, valid, canonical } : { ref, valid, canonical, reason: "not_in_corpus" };
}
