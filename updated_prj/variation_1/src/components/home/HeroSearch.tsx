"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, CornerDownLeft } from "lucide-react";
import type { SearchEntry } from "@/lib/search-index";

type SearchFn = (query: string, limit?: number) => SearchEntry[];

export function HeroSearch({ placeholder, chips }: { placeholder: string; chips: string[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [searchFn, setSearchFn] = useState<SearchFn | null>(null);
  const loadingRef = useRef(false);

  // The search index statically pulls in the full Act/Rules/Cases/Templates text
  // (~165KB). Load it lazily on first interaction so it stays out of the initial
  // homepage bundle, keeping hydration light so the header/menus become
  // interactive fast. Prefetched on focus, so results are ready before typing.
  const ensureIndex = useCallback(() => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    import("@/lib/search-index").then((m) => setSearchFn(() => m.searchDPDP));
  }, []);

  const results = useMemo(
    () => (searchFn ? searchFn(q, 8) : []),
    [q, searchFn]
  );

  const go = (u: string) => {
    setOpen(false);
    router.push(u);
  };

  return (
    <div className="relative">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (results[0]) go(results[0].u);
          else router.push("/act");
        }}
        className="flex items-center gap-3 rounded-pill border border-line bg-surface-2/70 px-4 py-3 backdrop-blur transition-colors focus-within:border-accent/50"
      >
        <Search className="h-5 w-5 shrink-0 text-text-faint" />
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
            ensureIndex();
          }}
          onFocus={() => {
            setOpen(true);
            ensureIndex();
          }}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={placeholder}
          role="combobox"
          aria-label="Search the DPDP Act, rules, templates and tools"
          aria-expanded={open && results.length > 0}
          aria-controls="hero-search-results"
          aria-autocomplete="list"
          className="min-w-0 flex-1 bg-transparent text-sm text-text outline-none placeholder:text-text-faint"
        />
        <kbd className="hidden items-center gap-1 rounded-md border border-line px-2 py-1 font-mono text-label text-text-faint sm:flex">
          <CornerDownLeft className="h-3 w-3" /> Enter
        </kbd>
      </form>

      {open && results.length > 0 && (
        <div
          id="hero-search-results"
          role="listbox"
          className="absolute left-0 right-0 top-full z-20 mt-2 max-h-72 overflow-y-auto rounded-lg border border-line bg-bg-2/95 backdrop-blur-xl shadow-glow"
        >
          {results.map((r) => (
            <button
              key={`${r.u}-${r.t}`}
              type="button"
              role="option"
              aria-selected="false"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => go(r.u)}
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-glass"
            >
              <span className="text-sm text-text">{r.t}</span>
              <span className="shrink-0 font-mono text-label uppercase tracking-wider text-accent">
                {r.cat}
              </span>
            </button>
          ))}
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-label font-semibold uppercase tracking-[0.08em] text-text-muted">
          Try
        </span>
        {chips.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => {
              setQ(c);
              setOpen(true);
              ensureIndex();
            }}
            className="chip py-1 text-xs"
          >
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}
