"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  BookOpen,
  ClipboardList,
  FileText,
  GraduationCap,
  Scale,
  Sparkles,
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
  "graduation-cap": GraduationCap,
  sparkles: Sparkles,
  "file-text": FileText,
  scale: Scale,
  "clipboard-list": ClipboardList,
  "book-open": BookOpen,
};

const DESCRIPTIONS: Record<string, string> = {
  "Courses by role": "Role-based tracks for citizens, founders, DPOs, legal teams, engineers and students.",
  "Adaptive quiz": "A live knowledge check with immediate feedback from the free starter question set.",
  "Privacy Notice Generator": "Build a Section 5 notice from the information your organisation actually handles.",
  "Legitimate Interest tool": "Work through the lawful basis behind a processing purpose.",
  "Consent checklist": "Inspect whether a consent flow is specific, informed and reversible.",
  "Frequently asked questions": "Resolve the practical questions that recur across the Act and Rules.",
};

export function LearnPathHero({
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
      4000
    );
    return () => clearTimeout(timer);
  }, [active, nodes.length, reduce]);

  return (
    <section
      className="page-hero route-hero-standard relative overflow-hidden border-b border-line"
      data-learning-path=""
      data-step-index={active}
      data-step={activeNode?.name ?? ""}
      onPointerEnter={() => setEngaged(true)}
      onPointerLeave={() => setEngaged(false)}
      onFocusCapture={() => setEngaged(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setEngaged(false);
        }
      }}
      style={{ background: "linear-gradient(140deg, var(--bg), var(--surface-2) 50%, var(--bg))" }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-55"
        aria-hidden="true"
        style={{
          backgroundImage:
            "linear-gradient(rgb(var(--green-rgb) / 0.05) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--blue-rgb) / 0.05) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          maskImage: "linear-gradient(90deg, transparent, black 28%, black)",
        }}
      />

      <div className="route-hero-inner container-x">
        <div className="route-hero-grid lg:grid-cols-[0.68fr_1.32fr]">
          <div className="relative z-10">
            <p className="font-mono text-label font-semibold uppercase tracking-wider text-text-faint">
              Learning route
            </p>
            <h1 className="route-hero-title mt-3 font-display font-bold tracking-tight text-text">
              <span data-rm="normal">{word}</span>
              <span data-rm="easy">{easyWord ?? word}</span>
            </h1>
            <div key={activeNode?.name} className="mt-5 min-h-[10rem]" aria-live="polite">
                <div className="font-mono text-label uppercase tracking-wider text-text-faint">
                  Station {String(active + 1).padStart(2, "0")} / {String(nodes.length).padStart(2, "0")}
                </div>
                <p className="mt-2 font-display text-3xl font-semibold" style={{ color: activeColor }}>
                  {activeNode?.name}
                </p>
                <p className="mt-3 max-w-lg text-base leading-relaxed text-text-muted">
                  {activeNode ? DESCRIPTIONS[activeNode.name] : ""}
                </p>
            </div>
          </div>

          <LearningPathModel nodes={nodes} active={active} engaged={engaged} reduce={reduce} />
        </div>

        <div className="route-hero-tabs border-t border-line lg:grid-cols-6" role="tablist" aria-label="Learning stations">
          {nodes.map((node, index) => {
            const Icon = ICONS[node.iconKey] ?? BookOpen;
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
                <span className={`relative ${selected ? "font-semibold text-text" : "text-text-muted"}`}>{node.short}</span>
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

function LearningPathModel({
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
  const positions = [
    { left: 10, top: 270 },
    { left: 92, top: 226 },
    { left: 174, top: 184 },
    { left: 256, top: 140 },
    { left: 338, top: 98 },
    { left: 420, top: 54 },
  ];

  return (
    <div className="route-hero-stage route-hero-stage-scale relative hidden overflow-hidden lg:block [perspective:1500px]" aria-hidden="true">
      <motion.div
        className="absolute left-1/2 top-[46%] h-[360px] w-[540px] [transform-style:preserve-3d]"
        style={{ x: "-50%", y: "-50%" }}
        initial={false}
        animate={{ rotateY: engaged ? 8 : -5, rotateX: engaged ? -3 : 0, scale: engaged ? 1.03 : 1 }}
        transition={reduce ? { duration: 0.2 } : { duration: 0.8, ease: "easeOut" }}
      >
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 540 360" fill="none">
          <motion.path
            d="M 40 305 L 122 261 L 204 219 L 286 175 L 368 133 L 450 89"
            stroke="rgb(var(--green-rgb) / 0.42)"
            strokeWidth="2"
            strokeDasharray="7 7"
            initial={false}
            animate={{ pathLength: (active + 1) / nodes.length }}
            transition={reduce ? { duration: 0.2 } : { duration: 0.75, ease: "easeOut" }}
          />
        </svg>

        {nodes.map((node, index) => {
          const Icon = ICONS[node.iconKey] ?? BookOpen;
          const position = positions[index] ?? positions[positions.length - 1];
          const selected = index === active;
          const completed = index <= active;
          return (
            <motion.div
              key={node.name}
              className="absolute flex h-[72px] w-[112px] flex-col overflow-hidden border bg-surface shadow-card"
              style={{
                left: position.left,
                top: position.top,
                borderColor: completed
                  ? `rgb(${COLORS[node.colorKey]} / 0.66)`
                  : "var(--line)",
              }}
              initial={false}
              animate={{ y: selected ? -14 : 0, scale: selected ? 1.08 : 1, opacity: completed ? 1 : 0.55 }}
              transition={reduce ? { duration: 0.2 } : { type: "spring", stiffness: 190, damping: 22 }}
            >
              <div className="flex flex-1 flex-col gap-1.5 px-3 pt-2.5">
                <Icon className="h-5 w-5 shrink-0" style={{ color: `rgb(${COLORS[node.colorKey]})` }} strokeWidth={1.6} />
                <span className="line-clamp-2 font-mono text-[10px] font-semibold uppercase leading-[1.15] tracking-wide text-text">
                  {node.short}
                </span>
              </div>
              <div className="h-3 shrink-0 border-t border-line bg-surface-2" />
            </motion.div>
          );
        })}

        <motion.div
          className="absolute h-8 w-8 rounded-full border-4 border-bg bg-green shadow-[0_0_25px_rgb(var(--green-rgb)/0.6)]"
          initial={false}
          animate={{
            left: (positions[active]?.left ?? 10) + 42,
            top: (positions[active]?.top ?? 270) - 34,
          }}
          transition={reduce ? { duration: 0.2 } : { type: "spring", stiffness: 130, damping: 20 }}
        />
      </motion.div>
    </div>
  );
}