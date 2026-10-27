"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Eye, FileText, Lock } from "lucide-react";
import {
  TEMPLATES,
  TEMPLATE_FILTERS,
  TEMPLATE_CAT_META,
  type TemplateCat,
} from "@/content/templates";
import { TemplateDownloads } from "@/components/resources/TemplateDownloads";

export function TemplatesBrowser() {
  const [filter, setFilter] = useState<TemplateCat | "all">("all");
  const [purchased, setPurchased] = useState<Set<string>>(new Set());
  const items =
    filter === "all" ? TEMPLATES : TEMPLATES.filter((t) => t.cat === filter);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/templates/purchases", {
          credentials: "include",
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = (await res.json()) as { purchased?: string[] };
        if (!cancelled && Array.isArray(data.purchased)) {
          setPurchased(new Set(data.purchased));
        }
      } catch {
        // ignore - cards still show unlock price
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="section">
      <div className="container-x">
        <div className="flex flex-wrap gap-2">
          {TEMPLATE_FILTERS.map((f) => (
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

        <p className="mt-4 text-sm text-text-muted">
          Unlock individually to read on-screen and download Word + PDF.
          Pricing is confirmed securely at checkout.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((t) => {
            const cat = TEMPLATE_CAT_META[t.cat];
            const owned = purchased.has(t.slug);
            return (
              <article
                key={t.slug}
                className="group relative flex h-full flex-col rounded-lg border border-line bg-surface-2/40 p-5 transition-all hover:-translate-y-0.5 hover:border-accent/40"
              >
                <div className="flex items-center justify-between">
                  <span className="grid h-11 w-11 place-items-center rounded-lg border border-line bg-glass text-accent">
                    <FileText className="h-5 w-5" />
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={cat.badge}>{cat.label}</span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-pill border px-2 py-0.5 font-mono text-label ${
                        owned
                          ? "border-green/40 bg-green/10 text-green"
                          : "border-accent/30 bg-accent/10 text-accent"
                      }`}
                    >
                      {owned ? (
                        <>
                          <Eye className="h-3 w-3" /> Unlocked
                        </>
                      ) : (
                        <>
                          <Lock className="h-3 w-3" /> Unlock
                        </>
                      )}
                    </span>
                  </div>
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold text-text">
                  <Link
                    href={`/templates/${t.slug}`}
                    className="after:absolute after:inset-0 after:rounded-lg focus-visible:outline-none group-hover:text-accent"
                  >
                    {t.title}
                  </Link>
                </h3>
                <p className="mt-1.5 flex-1 text-sm text-text-muted">
                  {t.summary}
                </p>
                <div className="mt-4 flex items-center justify-between gap-3 border-t border-line/60 pt-4">
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-accent">
                    {owned ? "Preview" : "View & unlock"}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                  {owned ? (
                    <TemplateDownloads slug={t.slug} compact />
                  ) : (
                    <span className="relative z-10 inline-flex items-center gap-1 text-xs font-medium text-text-faint">
                      <Lock className="h-3.5 w-3.5" /> Locked
                    </span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
