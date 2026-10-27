/** Fired after Easy Read mutates the DOM so LocaleTextRuntime can re-translate. */
export const RETRANSLATE_EVENT = "dpdp-retranslate";

export function requestRetranslate(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(RETRANSLATE_EVENT));
}
