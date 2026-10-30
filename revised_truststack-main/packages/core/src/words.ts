/**
 * Counts in plain words (Slice 10.5 Batch B4, F4.2): "1 action open", never
 * "1 actions open". One helper, used wherever the app or a report writes a
 * count, so the rule cannot drift between screens and PDFs.
 *
 * Not used by the exposure model's own reason text: that wording is mirrored
 * word for word in SQL (`app.exposure_plural`) and is already singular-safe.
 */

/** A whole number in Indian grouping ("1,20,000"); a rate keeps its decimal ("0.1"). */
function numberText(n: number): string {
  return Number.isInteger(n) ? n.toLocaleString("en-IN") : String(n);
}

/** "1 action" · "3 actions" · "0.5 actions" — the singular only for exactly one. */
export function countNoun(n: number, one: string, many: string): string {
  return `${numberText(n)} ${n === 1 ? one : many}`;
}

/** "1 action open" · "4 actions open" — the Exposure page's forecast tile and the model's text (F4.2). */
export function actionsOpenLabel(n: number): string {
  return `${countNoun(n, "action", "actions")} open`;
}
