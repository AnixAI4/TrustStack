/**
 * Slice 11 — the guardrails that are code, not promises (SLICE_11 §4.5,
 * §4.6, §4.11, §8; CLAUDE.md's AI invariant). Framework-free and pure:
 *
 *   * scrubPersonalData — A3: masks emails, phone numbers and Aadhaar- or
 *     PAN-like numbers that staff may have typed into a title or a note.
 *   * pickAllowed — §4.6: a context builder sends only its allow-listed fields.
 *   * stripBankInternals — §4.5, D-071: no question code, pack code, weight,
 *     trigger, evidence cap or red-flag rule reaches a prompt.
 *   * detectInjection — §8: instruction-like text in tenant data is flagged
 *     (and audited); it is always sent as data, never as instructions.
 *   * checkWording — §4.11: an answer that certifies, approves evidence,
 *     closes a gap, changes a score or presents a TrustStack target as
 *     statute is rejected.
 */

// ---------------------------------------------------------------------------
// A3 — the free-text scrub
// ---------------------------------------------------------------------------

export type ScrubKind = "email" | "phone" | "aadhaar" | "pan";

const SCRUB_PATTERNS: readonly { kind: ScrubKind; pattern: RegExp; mask: string }[] = [
  { kind: "email", pattern: /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+/g, mask: "[email removed]" },
  // Aadhaar: twelve digits, first 2–9, often in fours. Before phones, which it contains.
  { kind: "aadhaar", pattern: /(?<![\d-])[2-9]\d{3}[\s-]?\d{4}[\s-]?\d{4}(?![\d-])/g, mask: "[ID number removed]" },
  // PAN: five letters, four digits, a letter.
  { kind: "pan", pattern: /\b[A-Za-z]{5}\d{4}[A-Za-z]\b/g, mask: "[ID number removed]" },
  // Indian mobiles (+91 / 0 optional, then 6–9 and nine digits) and landlines with an STD code.
  {
    kind: "phone",
    pattern: /(?<![\w])(?:\+?91[\s-]?|0)?(?:[6-9]\d{4}[\s-]?\d{5}|\d{2,4}[\s-]\d{6,8})(?![\d])/g,
    mask: "[phone removed]",
  },
];

export interface ScrubResult {
  text: string;
  masked: Partial<Record<ScrubKind, number>>;
}

export function scrubPersonalData(text: string): ScrubResult {
  const masked: Partial<Record<ScrubKind, number>> = {};
  let out = text;
  for (const { kind, pattern, mask } of SCRUB_PATTERNS) {
    out = out.replace(pattern, () => {
      masked[kind] = (masked[kind] ?? 0) + 1;
      return mask;
    });
  }
  return { text: out, masked };
}

// ---------------------------------------------------------------------------
// §4.6 — allow-lists
// ---------------------------------------------------------------------------

/** Copies only the named fields. A field not on the list never reaches a prompt, whatever the reader returned. */
export function pickAllowed<T extends Record<string, unknown>, K extends keyof T & string>(
  source: T,
  allowed: readonly K[],
): Pick<T, K> {
  const out = {} as Pick<T, K>;
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(source, key)) out[key] = source[key];
  }
  return out;
}

// ---------------------------------------------------------------------------
// §4.5 — the black box (D-071)
// ---------------------------------------------------------------------------

/**
 * Question codes (`CB1.1`, `ROPA1.8`, `UNI-RET-005`) and pack codes
 * (`BFSI_OVERLAY_V1`) are bank internals: masked in any free text that
 * reaches a prompt. The fields that carry weights, triggers, caps and
 * red-flag rules never reach one at all — no context builder lists them.
 */
const BANK_CODE = /\b(?:[A-Z]{1,4}\d{1,2}\.\d{1,2}|[A-Z]{2,5}-[A-Z]{2,5}-\d{2,4}|[A-Z]{2,}(?:_[A-Z0-9]+)+_V\d+)\b/g;

export function stripBankInternals(text: string): string {
  return text.replace(BANK_CODE, "[reference]");
}

/** Field names a context must never carry (the black-box test plants each). */
export const BANK_INTERNAL_FIELDS = [
  "questionCode",
  "question_code",
  "packCode",
  "pack_code",
  "includedReason",
  "included_reason",
  "domainWeight",
  "domain_weight",
  "weight",
  "trigger",
  "triggers",
  "evidenceCap",
  "evidence_cap",
  "redFlag",
  "red_flag",
  "redFlagRule",
  "priority",
] as const;

// ---------------------------------------------------------------------------
// §8 — prompt injection: flagged, audited, and always treated as data
// ---------------------------------------------------------------------------

const INJECTION_PATTERNS: readonly RegExp[] = [
  /\b(?:ignore|disregard|forget|override)\b[^.\n]{0,40}\b(?:previous|prior|above|earlier|all|your|the)\b[^.\n]{0,20}\b(?:instructions?|rules?|prompts?|guidelines?|directions?)\b/i,
  /\byou\s+are\s+now\b/i,
  /\b(?:new|updated)\s+(?:system\s+)?instructions?\s*:/i,
  /\bsystem\s+prompt\b/i,
  /<\/?\s*(?:system|instructions?|assistant)\s*>/i,
  /\b(?:mark|declare|certify|report)\b[^.\n]{0,40}\b(?:as\s+)?(?:fully\s+)?compliant\b/i,
  /\b(?:approve|accept)\s+(?:this|the|all)\s+evidence\b/i,
  /\b(?:close|resolve)\s+(?:this|the|all)\s+gaps?\b/i,
  /\b(?:set|change|raise)\s+(?:the|this|my|our)\s+score\b/i,
];

export function detectInjection(text: string): boolean {
  return INJECTION_PATTERNS.some((re) => re.test(text));
}

// ---------------------------------------------------------------------------
// §4.11 — wording rules in code
// ---------------------------------------------------------------------------

export type WordingViolation = "certifies" | "approves_evidence" | "closes_gap" | "changes_score" | "statute_target";

const WORDING_RULES: readonly { kind: WordingViolation; pattern: RegExp }[] = [
  // "is compliant", "are fully DPDP-compliant", "now compliant" — never "is not compliant".
  { kind: "certifies", pattern: /\b(?:is|are|was|were|be|being|been|becomes?|now)\s+(?:now\s+|fully\s+|entirely\s+|completely\s+)*(?:DPDP[- ]?)?compliant\b/i },
  { kind: "certifies", pattern: /\bfully\s+compliant\b/i },
  { kind: "certifies", pattern: /\b(?:is|are|has been|have been|was)\s+(?:now\s+)?certified\b/i },
  { kind: "certifies", pattern: /\b(?:I|we)\s+(?:hereby\s+)?certify\b/i },
  { kind: "certifies", pattern: /\bguarantee[sd]?\s+(?:your\s+|full\s+|DPDP\s+)?compliance\b/i },
  { kind: "approves_evidence", pattern: /\b(?:I|we)\s+(?:have\s+)?(?:approved|accepted|verified)\b/i },
  { kind: "approves_evidence", pattern: /\bevidence\s+(?:is|has been|was|is now)\s+(?:now\s+)?(?:approved|accepted|verified)\b/i },
  { kind: "closes_gap", pattern: /\b(?:gaps?|actions?)\s+(?:is|are|has been|have been|was|were)\s+(?:now\s+)?closed\b/i },
  { kind: "closes_gap", pattern: /\b(?:I|we)\s+(?:have\s+)?closed\b/i },
  { kind: "changes_score", pattern: /\b(?:I|we)\s+(?:have\s+)?(?:changed|raised|increased|lowered|overridden|overrode|updated|adjusted)\s+(?:the|your|its|this)\s+(?:readiness\s+)?(?:score|rating|band)\b/i },
  { kind: "changes_score", pattern: /\b(?:score|rating|band)\s+(?:has been|is now|was)\s+(?:changed|raised|increased|overridden|adjusted|set)\b/i },
];

/**
 * TrustStack's own targets (pitfall 2): the 30-day rights target, the 48 h /
 * 12 h breach alerts and the twelve-month AI review are ours, not the law's.
 * A sentence that gives one of them to the Act, the Rules or "the law" is
 * rejected. (Seventy-two hours, ninety days, one year and three years ARE in
 * the Rules and are not on this list.)
 */
// Slice 11 call 11 (D-136): the hyphenated forms too — "thirty-day target", "30-day", "12-hour".
const TRUSTSTACK_TARGET = /\b(?:30|thirty)(?:\s+|-)days?\b|\b(?:12|twelve)(?:\s+|-)hours?\b|\b(?:12|twelve)[- ]month(?:ly)?\s+review|\breviewed?\s+(?:every|each|once\s+a)\s+(?:12\s+months|twelve\s+months|year)\b/i;
const STATUTE_CLAIM = /\b(?:the\s+(?:DPDP\s+)?Act|the\s+(?:DPDP\s+)?Rules|the\s+law|by\s+law|statut(?:e|ory)|legally\s+required|mandated|mandatory|requires?|required)\b/i;

/** TrustStack's breach-clock alerts: "48 hours" alone is also Rule 8(2)'s notice, so only an ALERT counts. */
const TRUSTSTACK_ALERT = /\b(?:48|forty-eight|12|twelve)(?:\s+|-)hours?\b[^.!?]{0,60}\b(?:alert|remain)|\balerts?\b[^.!?]{0,60}\b(?:48|forty-eight|12|twelve)(?:\s+|-)hours?\b/i;

/**
 * D-126.3: whether a point names one of TrustStack's own targets — the thirty-day
 * rights target, the 48 h / 12 h breach-clock alerts, the twelve-month review.
 * A cited provision of the Act or the Rules whose point names none is the law,
 * whatever label the model gave it (the live smoke's s.8(10) case).
 */
export function namesTrustStackTarget(text: string): boolean {
  return TRUSTSTACK_TARGET.test(text) || TRUSTSTACK_ALERT.test(text);
}

/** A denial shortly before a certifying phrase, in the same sentence. */
const NEGATION = /\b(?:not|never|no|cannot|isn't|aren't|doesn't|don't|won't)\b[^.!?,;]*$/i;

/**
 * Stage 1b (D-127.15): a denial OR a condition shortly before an evidence or
 * gap phrase, in the same clause — "a reviewer decides whether the evidence is
 * accepted", "the action can be closed once that evidence is accepted", "no
 * evidence has been accepted yet". These say who decides; they claim nothing.
 * A comma still ends the clause, so "Once uploaded, the evidence is accepted"
 * is refused, as is any bare claim.
 */
const DENIAL_OR_CONDITION =
  /\b(?:not|never|no|cannot|isn't|aren't|doesn't|don't|won't|whether|once|until|unless|if|when|after|before)\b[^.!?,;]*$/i;

export function checkWording(text: string): WordingViolation[] {
  const found = new Set<WordingViolation>();
  for (const { kind, pattern } of WORDING_RULES) {
    const global = new RegExp(pattern.source, pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`);
    for (const m of text.matchAll(global)) {
      // "does not mean you are compliant", "never certified": a denial, not a claim.
      const before = text.slice(Math.max(0, m.index - 40), m.index);
      if (kind === "certifies" && NEGATION.test(before)) continue;
      if ((kind === "approves_evidence" || kind === "closes_gap") && DENIAL_OR_CONDITION.test(before)) continue;
      found.add(kind);
      break;
    }
  }
  for (const sentence of text.split(/(?<=[.!?])\s+|\n+/)) {
    if (TRUSTSTACK_TARGET.test(sentence) && STATUTE_CLAIM.test(sentence) && !/\bTrustStack\b/i.test(sentence)) {
      found.add("statute_target");
    }
  }
  return [...found];
}

/**
 * §8: an answer naming another organisation the caller can see is rejected —
 * the model was given one tenant's context and must not reach past it.
 */
export function namesAnotherOrganisation(text: string, otherNames: readonly string[]): boolean {
  const lower = text.toLowerCase();
  return otherNames.some((n) => n.trim().length >= 3 && lower.includes(n.trim().toLowerCase()));
}
