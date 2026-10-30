import { detectInjection, scrubPersonalData, stripBankInternals, type AiTargetType, type ScrubKind } from "@truststack/core";
import type { DraftFacts } from "../drafts";

/**
 * What every context builder returns (SLICE_11 §2.1): exactly what was sent,
 * the prompt's user turn, whether instruction-like text was found, how much
 * personal data the scrub masked, and the draft's target.
 */
export interface ShapedContext {
  /** Stored in the draft row and hashed into its digest: exactly what was sent. */
  context: Record<string, unknown>;
  /** The user turn of the prompt. */
  user: string;
  injectionFlagged: boolean;
  scrubbed: Partial<Record<ScrubKind, number>>;
  /** The draft's target — mirrors `ai_drafts_target_type_check`. A record not yet made (`ropa_new`) has no id. */
  target: { type: AiTargetType; id: string | null; key: string | null };
  /** A drafting task's facts the SERVER writes into the draft (Rule 7(2)(b)(vi)) — never the model's. */
  facts?: DraftFacts;
}

/** The organisation as every helper sends it: a Data Fiduciary is not a Data Principal (D-125.10). */
export interface OrganisationRaw extends Record<string, unknown> {
  name: string;
  organizationType: string;
  industryName: string | null;
}

/**
 * Every free text a builder sends goes through one of these: bank codes out
 * (§4.5), personal data masked (A3), and — for text people wrote — an
 * instruction-like phrase flagged (§8). It is always sent as data.
 */
export function createCleaner() {
  const scrubbed: Partial<Record<ScrubKind, number>> = {};
  let injectionFlagged = false;
  const clean = (value: unknown, untrusted: boolean): string | null => {
    if (typeof value !== "string" || value.trim() === "") return null;
    const { text, masked } = scrubPersonalData(stripBankInternals(value));
    for (const [k, n] of Object.entries(masked)) scrubbed[k as ScrubKind] = (scrubbed[k as ScrubKind] ?? 0) + (n ?? 0);
    if (untrusted && detectInjection(text)) injectionFlagged = true;
    return text;
  };
  return {
    clean,
    get scrubbed() {
      return scrubbed;
    },
    get injectionFlagged() {
      return injectionFlagged;
    },
  };
}

/** The user turn: the task first, then each block in its own tag; untrusted blocks are escaped JSON. */
export function userTurn(
  task: string,
  blocks: readonly { tag: string; value: unknown; untrusted?: boolean }[],
  ask: string | null,
  untrustedJson: (value: unknown) => string,
): string {
  const lines = [`TASK: ${task}`];
  for (const b of blocks) {
    lines.push("", `<${b.tag}>`, b.untrusted ? untrustedJson(b.value) : JSON.stringify(b.value, null, 2), `</${b.tag}>`);
  }
  lines.push("", "<person_question>", ask ? untrustedJson(ask) : "(none — explain it)", "</person_question>");
  return lines.join("\n");
}
