"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  BookOpen,
  BrainCircuit,
  ClipboardList,
  Layers,
  LayoutGrid,
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
  "clipboard-list": ClipboardList,
  "brain-circuit": BrainCircuit,
  layers: Layers,
  "shield-alert": ShieldAlert,
  "layout-grid": LayoutGrid,
  "book-open": BookOpen,
};

export function WhyUsIntegrationHero({
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
      4200
    );
    return () => clearTimeout(timer);
  }, [active, nodes.length, reduce]);

  return (
    <section
      className="page-hero route-hero-standard relative overflow-hidden border-b border-line"
      data-integration-core=""
      data-proof-index={active}
      data-proof={activeNode?.name ?? ""}
      onPointerEnter={() => setEngaged(true)}
      onPointerLeave={() => setEngaged(false)}
      onFocusCapture={() => setEngaged(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setEngaged(false);
        }
      }}
      style={{
        background:
          "linear-gradient(145deg, var(--bg) 0%, var(--surface-2) 52%, var(--bg) 100%)",
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-55"
        aria-hidden="true"
        style={{
          backgroundImage:
            "linear-gradient(rgb(var(--text-rgb) / 0.045) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--text-rgb) / 0.045) 1px, transparent 1px)",
          backgroundSize: "38px 38px",
          maskImage: "linear-gradient(90deg, transparent, black 34%, black)",
        }}
      />

      <div className="route-hero-inner container-x">
        <div className="route-hero-grid lg:grid-cols-[0.9fr_1.1fr]">
          <div className="relative z-10">
            <p className="font-mono text-label font-semibold uppercase tracking-wider text-text-faint">
              Integrated operating model
            </p>
            <h1 className="route-hero-title mt-3 font-display font-bold tracking-tight text-text">
              <span data-rm="normal">{word}</span>
              <span data-rm="easy">{easyWord ?? word}</span>
            </h1>
            <div key={activeNode?.name} className="mt-5" aria-live="polite">
                <div className="font-mono text-label uppercase tracking-wider text-text-faint">
                  Proof {String(active + 1).padStart(2, "0")} / {String(nodes.length).padStart(2, "0")}
                </div>
                <p className="mt-2 max-w-xl font-display text-3xl font-semibold leading-tight" style={{ color: activeColor }}>
                  {activeNode?.name}
                </p>
                <p className="mt-3 max-w-lg text-base leading-relaxed text-text-muted">
                  Privacy, data, AI and security assembled into one operating system instead of separate workstreams.
                </p>
            </div>
          </div>

          <IntegrationCoreModel
            nodes={nodes}
            active={active}
            engaged={engaged}
            reduce={reduce}
          />
        </div>

        <div className="route-hero-tabs border-t border-line lg:grid-cols-6" role="tablist" aria-label="Why TrustStack proof points">
          {nodes.map((node, index) => {
            const Icon = ICONS[node.iconKey] ?? Layers;
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
                <span className={`relative ${selected ? "font-semibold text-text" : "text-text-muted"}`}>
                  {node.short}
                </span>
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

function IntegrationCoreModel({
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
    <div className="route-hero-stage route-hero-stage-scale relative hidden lg:block [perspective:1600px]" aria-hidden="true">
      <div className="absolute left-1/2 top-1/2 h-[360px] w-[560px] -translate-x-1/2 -translate-y-1/2">
        <motion.div
          className="absolute left-1/2 top-1/2 h-[220px] w-[220px] rounded-full border border-accent/25"
          style={{ x: "-50%", y: "-50%" }}
          animate={{ rotate: reduce ? 0 : 360 }}
          transition={reduce ? { duration: 0 } : { duration: 28, ease: "linear", repeat: Infinity }}
        >
          <div className="absolute left-1/2 top-[-5px] h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-accent shadow-[0_0_18px_var(--accent)]" />
          <div className="absolute bottom-[-5px] left-1/2 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-amber shadow-[0_0_18px_var(--amber)]" />
        </motion.div>

        <motion.div
          className="absolute left-1/2 top-1/2 h-[330px] w-[540px] [transform-style:preserve-3d]"
          style={{ x: "-50%", y: "-50%" }}
          initial={false}
          animate={{
            rotateY: engaged ? 12 : -7,
            rotateX: engaged ? -7 : -2,
            scale: engaged ? 1.04 : 1,
          }}
          transition={reduce ? { duration: 0.2 } : { duration: 0.85, ease: "easeOut" }}
        >
          {nodes.map((node, index) => {
            const Icon = ICONS[node.iconKey] ?? Layers;
            const selected = index === active;
            const fromLeft = index % 2 === 0;
            const row = Math.floor(index / 2);
            const top = 30 + row * 102;
            const left = fromLeft ? 4 : 356;
            return (
              <div key={node.name} className="absolute h-14 w-[180px]" style={{ top, left }}>
                <motion.span
                  className={`absolute top-1/2 h-px w-4 -translate-y-1/2 origin-center ${fromLeft ? "left-full" : "right-full"}`}
                  style={{ background: `rgb(${COLORS[node.colorKey]})` }}
                  animate={{ scaleX: selected ? 1 : 0.35, opacity: selected ? 1 : 0.3 }}
                  transition={reduce ? { duration: 0.2 } : { duration: 0.45 }}
                />
                <motion.div
                  className="h-14 w-[180px] border bg-surface shadow-card"
                  initial={false}
                  animate={{
                    x: selected ? (fromLeft ? 8 : -8) : 0,
                    opacity: selected ? 1 : 0.58,
                    scale: selected ? 1.04 : 0.96,
                    borderColor: selected
                      ? `rgb(${COLORS[node.colorKey]} / 0.82)`
                      : "var(--line)",
                  }}
                  transition={
                    reduce
                      ? { duration: 0.2 }
                      : { type: "spring", stiffness: 220, damping: 24 }
                  }
                >
                  <div className="flex h-full items-center gap-3 px-4" style={{ color: `rgb(${COLORS[node.colorKey]})` }}>
                    <Icon className="h-5 w-5 shrink-0" strokeWidth={1.65} />
                    <span className="font-mono text-label font-semibold uppercase tracking-wider text-text">
                      {node.short}
                    </span>
                    <span className="ml-auto font-mono text-label text-text-faint">{String(index + 1).padStart(2, "0")}</span>
                  </div>
                </motion.div>
              </div>
            );
          })}

          <div className="absolute left-1/2 top-1/2 z-20 grid h-36 w-36 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-accent bg-bg shadow-[0_0_60px_rgb(var(--accent-rgb)/0.28)]">
            <div className="text-center">
              <Layers className="mx-auto h-7 w-7 text-accent" strokeWidth={1.5} />
              <span className="mt-2 block font-mono text-label font-semibold uppercase tracking-wider text-text">One system</span>
              <span className="mt-1 block font-display text-2xl font-semibold text-text">6 → 1</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}