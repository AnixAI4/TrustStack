"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Eye,
  LifeBuoy,
  PencilLine,
  PowerOff,
  Trash2,
  UserCheck,
  UserPlus,
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
  eye: Eye,
  "pencil-line": PencilLine,
  "trash-2": Trash2,
  "life-buoy": LifeBuoy,
  "user-plus": UserPlus,
  "power-off": PowerOff,
};

export function RightsWheelHero({
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
      data-rights-wheel=""
      data-right-index={active}
      data-right={activeNode?.name ?? ""}
      onPointerEnter={() => setEngaged(true)}
      onPointerLeave={() => setEngaged(false)}
      onFocusCapture={() => setEngaged(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setEngaged(false);
        }
      }}
      style={{ background: "linear-gradient(140deg, var(--bg), var(--surface-2) 56%, var(--bg))" }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-55"
        aria-hidden="true"
        style={{
          backgroundImage:
            "radial-gradient(circle at 72% 50%, rgb(var(--blue-rgb) / 0.1), transparent 34%), linear-gradient(rgb(var(--text-rgb) / 0.045) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--text-rgb) / 0.045) 1px, transparent 1px)",
          backgroundSize: "auto, 42px 42px, 42px 42px",
          maskImage: "linear-gradient(90deg, transparent, black 30%, black)",
        }}
      />

      <div className="route-hero-inner container-x">
        <div className="route-hero-grid lg:grid-cols-[0.72fr_1.28fr]">
          <div className="relative z-10">
            <p className="font-mono text-label font-semibold uppercase tracking-wider text-text-faint">
              Data Principal control system
            </p>
            <h1 className="route-hero-title mt-3 font-display font-bold tracking-tight text-text">
              <span data-rm="normal">{word}</span>
              <span data-rm="easy">{easyWord ?? word}</span>
            </h1>
            <div key={activeNode?.name} className="mt-5 min-h-[8rem]" aria-live="polite">
                <div className="font-mono text-label font-semibold uppercase tracking-wider" style={{ color: activeColor }}>
                  {activeNode?.meta}
                </div>
                <p className="mt-2 font-display text-3xl font-semibold leading-tight text-text">
                  {activeNode?.name}
                </p>
                <p className="mt-3 max-w-lg text-base leading-relaxed text-text-muted">
                  Six enforceable actions that put the individual at the centre of how personal data is handled.
                </p>
            </div>
          </div>

          <RightsDial nodes={nodes} active={active} engaged={engaged} reduce={reduce} />
        </div>

        <div className="route-hero-tabs border-t border-line lg:grid-cols-6" role="tablist" aria-label="Data Principal rights">
          {nodes.map((node, index) => {
            const Icon = ICONS[node.iconKey] ?? UserCheck;
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
                <span className="relative">
                  <span className={selected ? "block font-semibold text-text" : "block text-text-muted"}>{node.short}</span>
                  <span className="block font-mono text-label uppercase tracking-wider text-text-faint">{node.meta}</span>
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

function RightsDial({
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
    <div className="route-hero-stage route-hero-stage-scale relative hidden lg:block [perspective:1500px]" aria-hidden="true">
      <div className="absolute left-1/2 top-1/2 h-[390px] w-[500px] -translate-x-1/2 -translate-y-1/2">
        <div className="absolute left-1/2 top-1/2 h-[360px] w-[360px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-line bg-surface-2/35 shadow-[0_28px_80px_-36px_rgb(var(--blue-rgb)/0.45)]" />
        <div className="absolute left-1/2 top-[-2px] z-30 h-0 w-0 -translate-x-1/2 border-x-[14px] border-t-[22px] border-x-transparent border-t-blue" />
        <motion.div
          className="absolute left-1/2 top-1/2 h-[320px] w-[320px] rounded-full border-2 border-line [transform-style:preserve-3d]"
          style={{ x: "-50%", y: "-50%" }}
          initial={false}
          animate={{
            rotate: -active * 60,
            scale: engaged ? 1.04 : 1,
          }}
          transition={
            reduce
              ? { duration: 0.2 }
              : { type: "spring", stiffness: 120, damping: 20 }
          }
        >
          <div className="absolute inset-5 rounded-full border border-dashed border-line" />
          {nodes.map((node, index) => {
            const Icon = ICONS[node.iconKey] ?? UserCheck;
            const angle = index * 60;
            const selected = index === active;
            return (
              <div
                key={node.name}
                className="absolute left-1/2 top-1/2 h-14 w-14 -translate-x-1/2 -translate-y-1/2"
                style={{ transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-132px)` }}
              >
                <motion.div
                  className="grid h-14 w-14 place-items-center rounded-full border bg-bg shadow-card"
                  style={{
                    borderColor: selected
                      ? `rgb(${COLORS[node.colorKey]} / 0.9)`
                      : "var(--line)",
                    color: `rgb(${COLORS[node.colorKey]})`,
                  }}
                  animate={{ rotate: active * 60 - angle, scale: selected ? 1.18 : 0.9, opacity: selected ? 1 : 0.62 }}
                  transition={reduce ? { duration: 0.2 } : { type: "spring", stiffness: 150, damping: 20 }}
                >
                  <Icon className="h-6 w-6" strokeWidth={1.55} />
                </motion.div>
              </div>
            );
          })}
        </motion.div>

        <div className="absolute left-1/2 top-1/2 z-20 grid h-40 w-40 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-blue bg-bg shadow-[0_0_65px_rgb(var(--blue-rgb)/0.24)]">
          <div className="text-center">
            <UserCheck className="mx-auto h-9 w-9 text-blue" strokeWidth={1.45} />
            <span className="mt-2 block font-mono text-label font-semibold uppercase tracking-wider text-text">Data Principal</span>
            <span className="mt-1 block font-display text-3xl font-semibold text-text">6</span>
            <span className="block font-mono text-label uppercase tracking-wider text-text-faint">Rights</span>
          </div>
        </div>
      </div>
    </div>
  );
}