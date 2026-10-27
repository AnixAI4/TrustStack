"use client";

import { useState } from "react";
import Link from "next/link";
import { Scale, ArrowRight, ArrowUpRight } from "lucide-react";
import {
  CASES,
  CASE_FILTERS,
  FEATURED_CASE,
  type CaseCat,
} from "@/content/cases";

const CAT_LABEL: Record<CaseCat, string> = {
  privacy: "Right to privacy",
  consent: "Consent & confidentiality",
  surveillance: "Surveillance & the state",
  speech: "Speech & the internet",
};

export function CasesBrowser() {
  const [filter, setFilter] = useState<CaseCat | "all">("all");
  const items = (filter === "all" ? CASES : CASES.filter((c) => c.cat === filter))
    // The featured case is shown in the hero above, so keep it out of the grid.
    .filter((c) => c.slug !== FEATURED_CASE.slug);

  return (
    <section className="section">
      <div className="container-x">
        {/* Featured case */}
        <Link
          href={`/cases/${FEATURED_CASE.slug}`}
          className="group relative block overflow-hidden rounded-2xl border border-accent/30 bg-accent/[0.06] p-8 transition-colors hover:border-accent/50 sm:p-10"
        >
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-accent/20 blur-3xl" />
          <span className="badge">
            Landmark · {FEATURED_CASE.bench} · {FEATURED_CASE.year}
          </span>
          <h2 className="relative mt-5 max-w-3xl font-display text-3xl font-semibold text-text sm:text-4xl">
            {FEATURED_CASE.title}
          </h2>
          <p className="relative mt-2 font-mono text-sm text-accent">
            {CAT_LABEL[FEATURED_CASE.cat]} · {FEATURED_CASE.citation}
          </p>
          <p className="relative mt-5 max-w-3xl text-lg text-text-muted">
            {FEATURED_CASE.holding}
          </p>
          <p className="relative mt-4 max-w-3xl text-text-muted">
            <span className="font-semibold text-text">Why it matters: </span>
            {FEATURED_CASE.whyItMatters[0]}
          </p>
          <span className="relative mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-accent transition-colors group-hover:text-accent-soft">
            Read the full breakdown
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>

        {/* Filters */}
        <div className="mt-10 flex flex-wrap gap-2">
          {CASE_FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              data-active={filter === f.key}
              className="chip"
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((c) => (
            <Link
              key={c.slug}
              href={`/cases/${c.slug}`}
              className="group flex h-full flex-col rounded-lg border border-line bg-surface-2/40 p-5 transition-all hover:-translate-y-0.5 hover:border-accent/40"
            >
              <div className="flex items-center justify-between">
                <span className="grid h-10 w-10 place-items-center rounded-lg border border-line bg-glass text-accent">
                  <Scale className="h-5 w-5" />
                </span>
                <span className="font-mono text-xs text-text-faint">{c.year}</span>
              </div>
              <h3 className="mt-4 font-display text-base font-semibold text-text">
                {c.shortTitle}
              </h3>
              <p className="mt-1 font-mono text-label uppercase tracking-wider text-text-faint">
                {c.bench}
              </p>
              <p className="mt-3 flex items-start gap-1.5 text-sm text-text-muted">
                <ArrowRight className="mt-1 h-3.5 w-3.5 shrink-0 text-text-faint" />
                {c.question}
              </p>
              <p className="mt-3 border-t border-line pt-3 text-sm text-text">
                <span className="font-semibold text-green-soft">Held: </span>
                {c.holding}
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-accent transition-colors group-hover:text-accent-soft">
                Read the full breakdown
                <ArrowUpRight className="h-3.5 w-3.5" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
