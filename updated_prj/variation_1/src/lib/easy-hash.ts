/**
 * Content-hash helper for the "Easy read" pipeline.
 *
 * The key insight (see the Easy Read architecture): entries in the generated
 * simplification map are keyed by a hash of the *source text itself*, not by an
 * id. So if the technical text is edited later, its hash changes, the lookup
 * misses, and the component falls back to the (edited) original - instead of
 * silently showing a stale simplification. Re-running the generator then fills
 * the new hash. This is what keeps coverage honest as content evolves.
 *
 * IMPORTANT: the algorithm here is duplicated (deliberately, kept tiny) in
 * scripts/generate-easy-content.mjs. If you change one, change both - the
 * build-time generator and the runtime lookup must agree on the key.
 */

/** Collapse whitespace runs to single spaces and trim, so trivial formatting
 * differences (line wraps, indentation in JSX) don't change the key. */
export function normalizeEasy(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

/** Deterministic FNV-1a (32-bit) hash of the normalized text, base36-encoded. */
export function easyKey(text: string): string {
  const str = normalizeEasy(text);
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}
