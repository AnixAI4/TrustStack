"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { POSTS, BLOG_FILTERS, FEATURED_POST, type BlogCat } from "@/content/blog";

export function BlogBrowser() {
  const [filter, setFilter] = useState<BlogCat | "all">("all");
  const items = filter === "all" ? POSTS : POSTS.filter((p) => p.cat === filter);

  return (
    <section className="section">
      <div className="container-x">
        {/* featured */}
        <Link
          href={`/blog/${FEATURED_POST.slug}`}
          className="group relative block overflow-hidden rounded-2xl border border-line bg-surface-2/40 p-8 transition-colors hover:border-accent/40 sm:p-10"
        >
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand/15 blur-3xl" />
          <span className="badge-blue badge">{FEATURED_POST.badge}</span>
          <h2 className="relative mt-5 max-w-3xl font-display text-2xl font-semibold text-text sm:text-4xl">
            {FEATURED_POST.title}
          </h2>
          <p className="relative mt-4 max-w-2xl text-lg text-text-muted">
            {FEATURED_POST.desc}
          </p>
          <p className="relative mt-5 font-mono text-xs uppercase tracking-wider text-text-faint">
            {FEATURED_POST.meta}
          </p>
        </Link>

        <div className="mt-10 flex flex-wrap gap-2">
          {BLOG_FILTERS.map((f) => (
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

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((p) => (
            <Link
              key={p.slug}
              href={`/blog/${p.slug}`}
              className="group flex h-full flex-col rounded-lg border border-line bg-surface-2/40 p-5 transition-all hover:-translate-y-0.5 hover:border-accent/40"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-label uppercase tracking-wider text-accent">
                  {p.kind}
                </span>
                <ArrowUpRight className="h-4 w-4 text-text-faint transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent" />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold text-text">
                {p.title}
              </h3>
              <p className="mt-2 flex-1 text-sm text-text-muted">{p.desc}</p>
              <p className="mt-4 font-mono text-label uppercase tracking-wider text-text-faint">
                {p.read}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
