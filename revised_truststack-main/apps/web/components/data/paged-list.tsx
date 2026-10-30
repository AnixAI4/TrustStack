"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { pageWindow, showingLabel } from "./paging";

/** A short list's page: an item's documents rarely pass this, and past it they page (F2.5). */
export const SHORT_LIST_PAGE_SIZE = 10;

/**
 * A short list that pages once it passes ten (Slice 10.5 Batch B2, F2.5) — the
 * documents or evidence on ONE item: an answer, an action, a record, a
 * processor, a register row. Until it passes ten it is the plain list it
 * always was; past ten it shows ten at a time with "Showing 11–20 of 23" and
 * Previous / Next. `<DataTable>` is for the registers themselves.
 *
 * `renderItem` returns the row (an `<li>` or a component that renders one).
 */
export function PagedList<T>({
  items,
  renderItem,
  noun = "documents",
  testId,
  className = "space-y-2",
  pageSize = SHORT_LIST_PAGE_SIZE,
}: {
  items: readonly T[];
  renderItem: (item: T) => ReactNode;
  noun?: string;
  /** On the `<ul>`; the pager's buttons get `{testId}-previous` / `{testId}-next`. */
  testId?: string;
  className?: string;
  pageSize?: number;
}) {
  const [page, setPage] = useState(1);
  // A file attached or detached changes the count: stay in range.
  useEffect(() => setPage((p) => Math.min(p, Math.max(1, Math.ceil(items.length / pageSize)))), [items.length, pageSize]);

  const w = pageWindow(items.length, page, pageSize);
  const paged = items.length > pageSize;

  return (
    <div className="space-y-2">
      <ul data-testid={testId} className={className}>
        {items.slice(w.start, w.end).map(renderItem)}
      </ul>
      {paged && (
        <nav aria-label={`Pages of ${noun}`} className="flex flex-wrap items-center justify-between gap-2 text-xs text-ink-soft">
          <span data-testid={testId ? `${testId}-showing` : undefined}>{showingLabel(w, noun)}</span>
          <span className="flex items-center gap-1">
            <button
              type="button"
              data-testid={testId ? `${testId}-previous` : undefined}
              aria-label={`Previous ${noun}`}
              disabled={w.page === 1}
              onClick={() => setPage(w.page - 1)}
              className="flex h-7 min-w-7 items-center justify-center rounded-md border border-line bg-surface text-ink hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft aria-hidden="true" className="h-4 w-4" />
            </button>
            <span>
              Page {w.page} of {w.pageCount}
            </span>
            <button
              type="button"
              data-testid={testId ? `${testId}-next` : undefined}
              aria-label={`Next ${noun}`}
              disabled={w.page === w.pageCount}
              onClick={() => setPage(w.page + 1)}
              className="flex h-7 min-w-7 items-center justify-center rounded-md border border-line bg-surface text-ink hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight aria-hidden="true" className="h-4 w-4" />
            </button>
          </span>
        </nav>
      )}
    </div>
  );
}
