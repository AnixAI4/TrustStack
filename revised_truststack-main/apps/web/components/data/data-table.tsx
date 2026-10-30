"use client";

import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, ChevronsUpDown, Search } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  DEFAULT_PAGE_SIZE,
  PAGE_SIZES,
  pageNumbers,
  pageWindow,
  searchRows,
  showingLabel,
  sortRows,
  type SortDirection,
  type SortValue,
} from "./paging";

export interface Column<T> {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  /** Present: the column sorts on this value. */
  sortValue?: (row: T) => SortValue;
  className?: string;
  headerClassName?: string;
  /** A test id for the cell. */
  cellTestId?: (row: T) => string | undefined;
}

/**
 * One table for every list that grows (Slice 10.5 Stage B0): 25 a page (25 /
 * 50 / 100), page numbers, "Showing 1–25 of 140", sortable columns, an
 * optional search box, a sticky header.
 *
 * Client-side over the rows the page's reader already returned — no API
 * change, and every count the page shows stays the reader's (D-069). The
 * reader's order is kept until someone sorts.
 */
export function DataTable<T>({
  rows,
  columns,
  rowKey,
  rowTestId,
  rowClassName,
  testId,
  search,
  noun = "rows",
  empty,
  pageSize: initialPageSize = DEFAULT_PAGE_SIZE,
  caption,
}: {
  rows: readonly T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  rowTestId?: (row: T) => string | undefined;
  rowClassName?: (row: T) => string;
  /** On the `<table>`. */
  testId?: string;
  search?: { text: (row: T) => string; placeholder?: string; label?: string };
  /** "records", "breaches" … for "No breaches match". */
  noun?: string;
  /** Shown instead of the table when there are no rows at all. */
  empty?: ReactNode;
  pageSize?: number;
  /** A visually hidden caption for screen readers. */
  caption?: string;
}) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<{ key: string; direction: SortDirection } | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  // A filter above the table changes how many rows arrive: start again at page 1.
  useEffect(() => setPage(1), [rows.length, query, pageSize]);

  const shown = useMemo(() => {
    const found = search ? searchRows(rows, query, search.text) : [...rows];
    const column = sort ? columns.find((c) => c.key === sort.key) : undefined;
    return column?.sortValue && sort ? sortRows(found, column.sortValue, sort.direction) : found;
  }, [rows, query, search, sort, columns]);

  if (rows.length === 0 && empty) return <>{empty}</>;

  const w = pageWindow(shown.length, page, pageSize);
  const pageRows = shown.slice(w.start, w.end);
  const paged = rows.length > PAGE_SIZES[0];

  function toggleSort(key: string) {
    setSort((s) => (s?.key !== key ? { key, direction: "asc" } : s.direction === "asc" ? { key, direction: "desc" } : null));
  }

  return (
    <div className="space-y-3">
      {(search || paged) && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          {search ? (
            <label className="relative block w-full max-w-sm">
              <span className="sr-only">{search.label ?? "Search"}</span>
              <Search aria-hidden="true" className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
              <input
                type="search"
                data-testid={testId ? `${testId}-search` : undefined}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={search.placeholder ?? "Search"}
                className="w-full rounded-md border border-line-strong bg-surface py-1.5 pl-8 pr-2 text-sm text-ink placeholder:text-ink-muted"
              />
            </label>
          ) : (
            <span />
          )}
          {/* Only when it adds something: more than one page, or a search narrowed the list. */}
          {(paged || query) && (
            <p data-testid={testId ? `${testId}-showing` : undefined} className="text-xs text-ink-soft">
              {showingLabel(w, noun)}
            </p>
          )}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-line bg-surface shadow-card lg:overflow-visible">
        <table data-testid={testId} className="w-full text-left text-sm">
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead className="sticky top-0 z-10 bg-surface-muted text-xs text-ink-soft shadow-[inset_0_-1px_0_var(--color-line)]">
            <tr>
              {columns.map((c) => {
                const active = sort?.key === c.key;
                return (
                  <th
                    key={c.key}
                    scope="col"
                    aria-sort={active ? (sort!.direction === "asc" ? "ascending" : "descending") : undefined}
                    className={`px-3 py-2 font-semibold ${c.headerClassName ?? ""}`}
                  >
                    {c.sortValue ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(c.key)}
                        className="-mx-1 inline-flex items-center gap-1 rounded px-1 hover:text-ink"
                      >
                        {c.header}
                        {active ? (
                          sort!.direction === "asc" ? (
                            <ArrowUp aria-hidden="true" className="h-3 w-3" />
                          ) : (
                            <ArrowDown aria-hidden="true" className="h-3 w-3" />
                          )
                        ) : (
                          <ChevronsUpDown aria-hidden="true" className="h-3 w-3 opacity-50" />
                        )}
                      </button>
                    ) : (
                      c.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row) => (
              <tr
                key={rowKey(row)}
                data-testid={rowTestId?.(row)}
                className={`border-t border-line align-top hover:bg-surface-muted/60 ${rowClassName?.(row) ?? ""}`}
              >
                {columns.map((c) => (
                  <td key={c.key} data-testid={c.cellTestId?.(row)} className={`px-3 py-2.5 ${c.className ?? ""}`}>
                    {c.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-3 py-6 text-center text-sm text-ink-soft">
                  {query ? `No ${noun} match “${query}”.` : `No ${noun} match these filters.`}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {paged && (
        <nav aria-label="Pages" className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <label className="flex items-center gap-2 text-xs text-ink-soft">
            Rows per page
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              data-testid={testId ? `${testId}-page-size` : undefined}
              className="rounded-md border border-line-strong bg-surface px-1.5 py-1 text-sm text-ink"
            >
              {PAGE_SIZES.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          {w.pageCount > 1 && (
            <div className="flex items-center gap-1">
              <PageButton label="Previous page" disabled={w.page === 1} onClick={() => setPage(w.page - 1)}>
                <ChevronLeft aria-hidden="true" className="h-4 w-4" />
              </PageButton>
              {pageNumbers(w.page, w.pageCount).map((n, i) =>
                n === "gap" ? (
                  <span key={`gap-${i}`} className="px-1 text-ink-muted">
                    …
                  </span>
                ) : (
                  <PageButton key={n} label={`Page ${n}`} current={n === w.page} onClick={() => setPage(n)}>
                    {n}
                  </PageButton>
                ),
              )}
              <PageButton label="Next page" disabled={w.page === w.pageCount} onClick={() => setPage(w.page + 1)}>
                <ChevronRight aria-hidden="true" className="h-4 w-4" />
              </PageButton>
            </div>
          )}
        </nav>
      )}
    </div>
  );
}

function PageButton({
  label,
  current,
  disabled,
  onClick,
  children,
}: {
  label: string;
  current?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-current={current ? "page" : undefined}
      disabled={disabled}
      onClick={onClick}
      className={`flex h-8 min-w-8 items-center justify-center rounded-md border px-2 text-sm ${
        current ? "border-brand-navy bg-brand-navy font-semibold text-white" : "border-line bg-surface text-ink hover:bg-surface-muted"
      } disabled:cursor-not-allowed disabled:opacity-40`}
    >
      {children}
    </button>
  );
}
