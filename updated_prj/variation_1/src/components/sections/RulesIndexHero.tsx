"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Baby,
  ClipboardList,
  Database,
  FileText,
  Landmark,
  ShieldAlert,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type {
  ConstellationHeroConfig,
  HeroColorKey,
  HeroIconKey,
  HeroNode,
} from "@/content/hero-configs";
import { HeroRotationDots, HeroTabGlow } from "@/components/ui/HeroRotationIndicator";

const COLORS: Record<HeroColorKey, string> = {
  accent: "var(--accent-rgb)",
  gold: "var(--gold-rgb)",
  amber: "var(--amber-rgb)",
  blue: "var(--blue-rgb)",
  brand: "var(--brand-rgb)",
  green: "var(--green-rgb)",
  red: "var(--red-rgb)",
};

const ICONS: Partial<Record<HeroIconKey, LucideIcon>> = {
  "file-text": FileText,
  "clipboard-list": ClipboardList,
  "shield-alert": ShieldAlert,
  baby: Baby,
  landmark: Landmark,
  database: Database,
};

export function RulesIndexHero({
  word,
  easyWord,
  nodes = [],
}: ConstellationHeroConfig) {
  const reduce = !!useReducedMotion();
  const [active, setActive] = useState(0);
  const [engaged, setEngaged] = useState(false);
  const activeNode = nodes[active] ?? nodes[0];
  const activeColor = activeNode
    ? `rgb(${COLORS[activeNode.colorKey]})`
    : "var(--text)";

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
      data-rules-index=""
      data-category-index={active}
      data-category={activeNode?.name ?? ""}
      onPointerEnter={() => setEngaged(true)}
      onPointerLeave={() => setEngaged(false)}
      onFocusCapture={() => setEngaged(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setEngaged(false);
        }
      }}
      style={{ background: "linear-gradient(142deg, var(--bg), var(--surface-2) 54%, var(--bg))" }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-55"
        aria-hidden="true"
        style={{
          backgroundImage:
            "linear-gradient(rgb(var(--gold-rgb) / 0.055) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--gold-rgb) / 0.045) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          maskImage: "linear-gradient(90deg, transparent, black 32%, black)",
        }}
      />

      <div className="route-hero-inner container-x">
        <div className="route-hero-grid lg:grid-cols-[0.7fr_1.3fr]">
          <div className="relative z-10 min-w-0">
            <p className="font-mono text-label font-semibold uppercase tracking-wider text-text-faint">
              Operational index · 2025
            </p>
            <h1 className="route-hero-title mt-3 min-w-0 break-words font-display font-bold tracking-tight text-text">
              <span data-rm="normal">{word}</span>
              <span data-rm="easy">{easyWord ?? word}</span>
            </h1>
            <div key={activeNode?.name} className="mt-5" aria-live="polite">
                <div className="font-mono text-label uppercase tracking-wider text-text-faint">
                  Category {String(active + 1).padStart(2, "0")} / {String(nodes.length).padStart(2, "0")}
                </div>
                <p className="mt-2 font-display text-3xl font-semibold" style={{ color: activeColor }}>
                  {activeNode?.name}
                </p>
                <p className="mt-3 max-w-lg text-base leading-relaxed text-text-muted">
                  The operational detail of the Act, indexed by the area it puts into practice.
                </p>
            </div>
          </div>

          <RulesMachine nodes={nodes} active={active} engaged={engaged} reduce={reduce} />
        </div>

        <div className="route-hero-tabs border-t border-line lg:grid-cols-6" role="tablist" aria-label="Rule categories">
          {nodes.map((node, index) => {
            const Icon = ICONS[node.iconKey] ?? FileText;
            const selected = index === active;
            return (
              <button
                key={node.name}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setActive(index)}
                className={`group relative flex min-h-20 items-center gap-3 border-b border-line px-3 text-left transition-colors hover:bg-surface-2/60 lg:border-b-0 lg:border-r lg:last:border-r-0 ${
                  selected ? "bg-surface-2/70" : ""
                }`}
              >
                {selected && <HeroTabGlow colorVar={COLORS[node.colorKey]} reduce={reduce} />}
                <Icon className="relative h-5 w-5 shrink-0" style={{ color: `rgb(${COLORS[node.colorKey]})` }} strokeWidth={1.65} />
                <span className={`relative min-w-0 text-sm leading-tight [overflow-wrap:anywhere] ${selected ? "font-semibold text-text" : "text-text-muted"}`}>{node.short}</span>
                {selected && (
                  <span
                    className="absolute inset-x-0 bottom-0 h-[3px]"
                    style={{ background: `rgb(${COLORS[node.colorKey]} / 0.28)` }}
                  />
                )}
              </button>
            );
          })}
        </div>

        <HeroRotationDots
          count={nodes.length}
          active={active}
          onSelect={setActive}
          getColorVar={(index) => COLORS[nodes[index].colorKey]}
          label="Show"
        />
      </div>
    </section>
  );
}

function RulesMachine({
  nodes,
  active,
  engaged,
  reduce,
}: {
  nodes: readonly HeroNode[];
  active: number;
  engaged: boolean;
  reduce: boolean;
}) {
  return (
    <div className="route-hero-stage relative hidden min-w-0 overflow-hidden lg:block" aria-hidden="true">
      <motion.div
        data-rules-assembly=""
        className="absolute left-1/2 top-0 h-[336px] w-[500px]"
        style={{ x: "-50%" }}
        initial={false}
        animate={{ y: engaged ? -3 : 0 }}
        transition={reduce ? { duration: 0.2 } : { duration: 0.55, ease: "easeOut" }}
      >
        <div className="absolute left-[72px] top-2 h-[312px] w-[356px] border border-line bg-surface shadow-[0_28px_64px_-34px_rgb(var(--gold-rgb)/0.4)]">
          <div className="absolute inset-x-4 top-4 grid h-[66px] grid-cols-[minmax(0,1fr)_3.5rem] items-center gap-3 border border-line bg-bg px-4 py-2">
            <div className="min-w-0">
            <div className="font-mono text-label font-semibold uppercase tracking-wider text-gold">DPDP Rules · 2025</div>
              <span className="mt-1 block truncate font-display text-2xl font-semibold text-text">Operational index</span>
            </div>
            <span className="text-right font-display text-4xl font-semibold text-text">23</span>
          </div>

          <div className="absolute inset-x-4 bottom-4 top-[94px] space-y-1.5">
            {nodes.map((node, index) => {
              const Icon = ICONS[node.iconKey] ?? FileText;
              const selected = index === active;
              return (
                <motion.div
                  key={node.name}
                  className="relative flex h-[29px] min-w-0 items-center border border-line bg-surface-2 px-3 shadow-sm"
                  initial={false}
                  animate={{
                    x: selected ? 6 : 0,
                    opacity: selected ? 1 : 0.68,
                    borderColor: selected
                      ? `rgb(${COLORS[node.colorKey]} / 0.78)`
                      : "var(--line)",
                  }}
                  transition={reduce ? { duration: 0.2 } : { type: "spring", stiffness: 210, damping: 24 }}
                >
                  <Icon className="h-4 w-4" style={{ color: `rgb(${COLORS[node.colorKey]})` }} strokeWidth={1.6} />
                  <span className="ml-3 min-w-0 truncate font-mono text-label font-semibold uppercase tracking-wider text-text">{node.short}</span>
                  <span className="ml-auto font-mono text-label text-text-faint">{String(index + 1).padStart(2, "0")}</span>
                  <div className="absolute -right-2 top-1/2 h-px w-2 bg-line" />
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className="absolute bottom-0 left-[52px] h-4 w-[420px] border border-line bg-surface-2" />
        <div className="absolute right-3 top-[104px] grid h-[196px] w-12 grid-cols-2 gap-1 border border-line bg-bg p-2">
          {Array.from({ length: 23 }, (_, index) => (
            <span
              key={index}
              className="border border-line"
              style={{ background: index % 2 ? "var(--surface-2)" : "rgb(var(--gold-rgb) / 0.16)" }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}