"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  BookOpen,
  ClipboardList,
  FileText,
  Gavel,
  Landmark,
  Scale,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type {
  ConstellationHeroConfig,
  HeroIconKey,
} from "@/content/hero-configs";

const ICONS: Partial<Record<HeroIconKey, LucideIcon>> = {
  "book-open": BookOpen,
  "clipboard-list": ClipboardList,
  scale: Scale,
  "file-text": FileText,
  landmark: Landmark,
  gavel: Gavel,
};

export function ActCodexHero({
  word,
  easyWord,
  nodes = [],
}: ConstellationHeroConfig) {
  const reduce = !!useReducedMotion();
  const [active, setActive] = useState(0);
  const activeNode = nodes[active] ?? nodes[0];
  const ActiveIcon = activeNode ? ICONS[activeNode.iconKey] ?? BookOpen : BookOpen;

  useEffect(() => {
    if (reduce || nodes.length < 2) return;
    const timer = setTimeout(
      () => setActive((current) => (current + 1) % nodes.length),
      4400
    );
    return () => clearTimeout(timer);
  }, [active, nodes.length, reduce]);

  return (
    <section
      className="page-hero route-hero-technical relative overflow-hidden border-b border-line"
      data-act-codex=""
      data-chapter-index={active}
      data-chapter={activeNode?.name ?? ""}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        aria-hidden="true"
        style={{
          backgroundImage:
            "linear-gradient(rgb(var(--gold-rgb) / 0.06) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--gold-rgb) / 0.045) 1px, transparent 1px)",
          backgroundSize: "42px 42px",
          maskImage: "linear-gradient(to bottom, black, transparent 88%)",
        }}
      />

      <div className="route-hero-inner container-x">
        <div className="route-hero-grid lg:grid-cols-[0.74fr_1.26fr]">
          <div className="min-w-0">
            <p className="font-mono text-label font-semibold uppercase tracking-wider text-gold">
              Act 22 of 2023
            </p>
            <h1 className="route-hero-title mt-3 font-display font-bold tracking-tight text-text">
              <span data-rm="normal">{word}</span>
              <span data-rm="easy">{easyWord ?? word}</span>
            </h1>
            <div className="mt-7 flex items-end gap-7 border-y border-line py-4">
              <div>
                <div className="font-display text-4xl font-semibold text-text">9</div>
                <div className="font-mono text-label uppercase tracking-wider text-text-faint">Chapters</div>
              </div>
              <div className="h-11 w-px bg-line" />
              <div>
                <div className="font-display text-4xl font-semibold text-text">44</div>
                <div className="font-mono text-label uppercase tracking-wider text-text-faint">Sections</div>
              </div>
            </div>

            <div className="route-hero-scroll mt-5 flex snap-x snap-mandatory gap-1.5 overflow-x-auto pb-1 lg:grid lg:grid-cols-9 lg:overflow-visible lg:pb-0" aria-label="Act chapters">
              {nodes.map((node, index) => (
                <button
                  key={node.name}
                  type="button"
                  title={node.name}
                  aria-label={`Chapter ${index + 1}: ${node.name}`}
                  aria-pressed={index === active}
                  onClick={() => setActive(index)}
                  className={`relative grid h-11 min-w-11 shrink-0 snap-start place-items-center border font-mono text-label transition-colors lg:aspect-square lg:h-auto lg:min-w-0 ${
                    index === active
                      ? "border-gold bg-gold/12 text-gold"
                      : "border-line text-text-faint hover:border-gold/45 hover:text-text"
                  }`}
                >
                  {String(index + 1).padStart(2, "0")}
                  {index === active && (
                    <motion.span
                      layoutId="act-chapter-marker"
                      className="absolute -bottom-px left-0 h-[3px] w-full bg-gold"
                      transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 28 }}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="route-hero-stage route-hero-stage-scale relative hidden lg:block">
            <div className="absolute left-1/2 top-1/2 h-[326px] w-[640px] -translate-x-1/2 -translate-y-1/2">
              {[3, 2, 1].map((layer) => (
                <div
                  key={layer}
                  className="absolute inset-x-3 rounded-sm border border-line bg-surface-2"
                  style={{ top: layer * 3, bottom: -layer * 3, zIndex: layer }}
                  aria-hidden="true"
                />
              ))}

              <div className="absolute inset-0 z-10 grid grid-cols-2 overflow-visible rounded-sm shadow-[0_30px_80px_-30px_rgb(var(--text-rgb)/0.38)]">
                <div
                  className="relative overflow-hidden border border-line px-9 py-8"
                  style={{
                    background:
                      "linear-gradient(100deg, var(--surface) 0%, var(--surface-2) 88%, rgb(var(--text-rgb) / 0.07) 100%)",
                  }}
                >
                  <div className="absolute inset-y-0 right-0 w-8 bg-[linear-gradient(90deg,transparent,rgb(var(--text-rgb)/0.08))]" />
                  <BookOpen className="h-8 w-8 text-gold" strokeWidth={1.35} />
                  <p className="mt-9 font-mono text-label uppercase tracking-wider text-text-faint">
                    Digital Personal Data Protection
                  </p>
                  <div className="mt-3 font-display text-7xl font-semibold text-text">2023</div>
                  <div className="mt-8 h-px w-full bg-line" />
                  <p className="mt-4 max-w-[13rem] text-sm leading-relaxed text-text-muted">
                    The statute, organised as a living nine-chapter legal codex.
                  </p>
                </div>

                <div className="relative border-y border-r border-line bg-surface-2">
                  <div className="absolute inset-y-0 left-0 z-20 w-8 bg-[linear-gradient(90deg,rgb(var(--text-rgb)/0.09),transparent)]" />
                    <div
                      key={activeNode?.name}
                      className="absolute inset-0 overflow-hidden px-10 py-8"
                      aria-live="polite"
                      style={{
                        background:
                          "linear-gradient(90deg, var(--surface-2), var(--surface) 100%)",
                      }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-mono text-label font-semibold uppercase tracking-wider text-gold">
                            Chapter {String(active + 1).padStart(2, "0")}
                          </p>
                          <p className="mt-1 font-mono text-label uppercase tracking-wider text-text-faint">
                            {activeNode?.meta}
                          </p>
                        </div>
                        <ActiveIcon className="h-7 w-7 text-gold" strokeWidth={1.4} />
                      </div>
                      <h2 className="mt-10 font-display text-3xl font-semibold leading-tight text-text">
                        {activeNode?.name}
                      </h2>
                      <div className="mt-7 space-y-3" aria-hidden="true">
                        <div className="h-px w-full bg-line" />
                        <div className="h-px w-[88%] bg-line" />
                        <div className="h-px w-[72%] bg-line" />
                      </div>
                      <p className="absolute bottom-7 right-9 font-serif text-sm italic text-text-faint">
                        {active + 1} / {nodes.length}
                      </p>
                    </div>
                </div>
                <div className="pointer-events-none absolute inset-y-0 left-1/2 z-30 w-px -translate-x-1/2 bg-line shadow-[0_0_18px_rgb(var(--text-rgb)/0.2)]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
