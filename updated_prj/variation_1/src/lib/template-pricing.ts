/** Shared template pricing (safe for client + server). */

import { getTemplate } from "@/content/templates";

/** Fallback if a slug is missing a price (should not happen). */
const DEFAULT_INR = 99;

export function templatePriceInr(slug: string): number {
  const t = getTemplate(slug);
  return t?.priceInr ?? DEFAULT_INR;
}

export function templatePricePaise(slug: string): number {
  return templatePriceInr(slug) * 100;
}

export function templatePriceDisplay(slug: string): number {
  return templatePriceInr(slug);
}

/** Lowest catalog price - for marketing copy. */
export function templatePriceFloorInr(): number {
  return 49;
}
