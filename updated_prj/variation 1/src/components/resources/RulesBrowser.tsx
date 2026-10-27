"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Info, Download } from "lucide-react";
import { RULES, RULE_FILTERS, type RuleCat } from "@/content/rules";
import { cn } from "@/lib/cn";

export function RulesBrowser() {
  const [filter, setFilter] = useState<RuleCat | "all">("all");
  const rules = filter === "all" ? RULES : RULES.filter((r) => r.cat === filter);

  return (
    <section className="section">
      <div className="container-x">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {RULE_FILTERS.map((f) => (
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
          <a
            href="/DPDP-Rules-2025.pdf"
            download="DPDP-Rules-2025.pdf"
            className="btn btn-accent shrink-0 text-sm"
          >
            <Download className="h-4 w-4" /> Download Rules (PDF)
          </a>
        </div>

        <div className="mt-6 flex items-start gap-3 rounded-lg border border-blue/30 bg-blue/[0.07] p-4">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-soft" />
          <p className="text-sm text-text-muted">
            <strong className="text-text">How to read this:</strong> Each card
            is one of the 23 notified rules. Click a card for a plain-English
            summary, key points, and the official gazette text - or download the
            full PDF above.
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rules.map((r) => (
            <Link
              key={r.n}
              href={`/rules/${r.n}`}
              className={cn(
                "group rounded-lg border border-line bg-surface-2/40 p-5 transition-all hover:-translate-y-0.5 hover:border-accent/40"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="grid h-9 w-9 place-items-center rounded-lg border border-line bg-glass font-mono text-sm font-semibold text-accent">
                  {r.n}
                </span>
                <span className="rounded-pill border border-line px-2.5 py-1 font-mono text-label uppercase tracking-wider text-text-muted transition-colors group-hover:border-accent/40 group-hover:text-accent">
                  {r.mapsTo}
                </span>
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold text-text group-hover:text-accent">
                {r.title}
              </h3>
              <p className="mt-1.5 text-sm text-text-muted">{r.summary}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-accent opacity-0 transition-opacity group-hover:opacity-100">
                Read rule <ArrowRight className="h-3 w-3" />
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-16 overflow-hidden rounded-2xl border border-line bg-surface-2/40 p-8 text-center sm:p-12">
          <span className="eyebrow">Act ↔ Rules · साकृत्य्धिकार</span>
          <h2 className="mx-auto mt-4 max-w-2xl font-display text-2xl font-semibold text-text sm:text-3xl">
            See every section beside the rule that powers it.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-text-muted">
            The mapping view puts the statute and the 2025 Rules side by side, so
            nothing is lost in translation.
          </p>
          <Link href="/act" className="btn btn-accent mt-6">
            Open the Act
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
