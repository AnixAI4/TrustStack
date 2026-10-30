/**
 * Client-side paging, sorting and searching for `<DataTable>` (Slice 10.5
 * Stage B0). Pure functions over the rows a reader already returned — no new
 * arithmetic on the data and no API change (D-069); the counts a page shows
 * stay the readers' own. Server-side paging is the later step if a list
 * passes about a thousand rows.
 */

export const PAGE_SIZES = [25, 50, 100] as const;
export type PageSize = (typeof PAGE_SIZES)[number];
export const DEFAULT_PAGE_SIZE: PageSize = 25;

export type SortValue = string | number | boolean | null | undefined;
export type SortDirection = "asc" | "desc";

/** Rows whose search text contains every word of the query (case-insensitive). Empty query: all rows. */
export function searchRows<T>(rows: readonly T[], query: string, text: (row: T) => string): T[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [...rows];
  return rows.filter((row) => {
    const haystack = text(row).toLowerCase();
    return words.every((w) => haystack.includes(w));
  });
}

/**
 * A stable sort on one key. Empty values (null, undefined, "") always sort
 * last, whichever the direction, so "no owner" or "not set" never hides the
 * real values at the top.
 */
export function sortRows<T>(rows: readonly T[], key: (row: T) => SortValue, direction: SortDirection): T[] {
  const sign = direction === "asc" ? 1 : -1;
  return rows
    .map((row, index) => ({ row, index, value: key(row) }))
    .sort((a, b) => {
      const ae = a.value === null || a.value === undefined || a.value === "";
      const be = b.value === null || b.value === undefined || b.value === "";
      if (ae || be) return ae === be ? a.index - b.index : ae ? 1 : -1;
      const c = compareValues(a.value!, b.value!);
      return c === 0 ? a.index - b.index : c * sign;
    })
    .map((x) => x.row);
}

function compareValues(a: string | number | boolean, b: string | number | boolean): number {
  if (typeof a === "number" && typeof b === "number") return a - b;
  if (typeof a === "boolean" && typeof b === "boolean") return Number(a) - Number(b);
  return String(a).localeCompare(String(b), "en-IN", { numeric: true, sensitivity: "base" });
}

export interface PageWindow {
  /** 1-based page actually shown (clamped into range). */
  page: number;
  pageCount: number;
  /** 0-based slice bounds. */
  start: number;
  end: number;
  total: number;
}

/** Which slice of `total` rows page `page` shows; an out-of-range page is clamped. */
export function pageWindow(total: number, page: number, pageSize: number): PageWindow {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const p = Math.min(Math.max(1, Math.floor(page) || 1), pageCount);
  const start = (p - 1) * pageSize;
  return { page: p, pageCount, start, end: Math.min(start + pageSize, total), total };
}

/** "Showing 1–25 of 140" (en dash); "No rows" for none. */
export function showingLabel(w: PageWindow, noun = "rows"): string {
  if (w.total === 0) return `No ${noun}`;
  return `Showing ${w.start + 1}–${w.end} of ${w.total}`;
}

/**
 * Page numbers to offer: always the first and last, the current one and its
 * neighbours, with "gap" where pages are skipped — e.g. 1 … 4 5 6 … 12.
 */
export function pageNumbers(page: number, pageCount: number): (number | "gap")[] {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i + 1);
  const wanted = new Set([1, pageCount, page - 1, page, page + 1].filter((n) => n >= 1 && n <= pageCount));
  const sorted = [...wanted].sort((a, b) => a - b);
  const out: (number | "gap")[] = [];
  for (const n of sorted) {
    const last = out[out.length - 1];
    if (typeof last === "number" && n - last > 1) out.push(n - last === 2 ? last + 1 : "gap");
    out.push(n);
  }
  return out;
}
