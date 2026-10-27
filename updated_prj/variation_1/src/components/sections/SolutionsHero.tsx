"use client";

import { useEffect, useId, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  BrainCircuit,
  Compass,
  GraduationCap,
  Hammer,
  Headset,
  LayoutGrid,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type {
  ConstellationHeroConfig,
  HeroColorKey,
  HeroIconKey,
  HeroNode,
} from "@/content/hero-configs";
import { HERO_AUTO_ADVANCE_MS } from "@/lib/hero-auto-advance";
import { HeroRotationDots, HeroTabGlow } from "@/components/ui/HeroRotationIndicator";

const ICONS: Partial<Record<HeroIconKey, LucideIcon>> = {
  sparkles: Sparkles,
  compass: Compass,
  hammer: Hammer,
  "brain-circuit": BrainCircuit,
  headset: Headset,
  "layout-grid": LayoutGrid,
  "graduation-cap": GraduationCap,
};

const COLORS: Record<HeroColorKey, string> = {
  accent: "var(--accent-rgb)",
  gold: "var(--gold-rgb)",
  amber: "var(--amber-rgb)",
  blue: "var(--blue-rgb)",
  brand: "var(--brand-rgb)",
  green: "var(--green-rgb)",
  red: "var(--red-rgb)",
};

type ServiceHeroNode = HeroNode & { detail?: string };
type SolutionsHeroProps = Omit<ConstellationHeroConfig, "nodes"> & {
  nodes?: readonly ServiceHeroNode[];
};
type ResolvedNode = ServiceHeroNode & { Icon: LucideIcon; rgb: string };

export function SolutionsHero({
  word,
  easyWord,
  instruction,
  nodes = [],
}: SolutionsHeroProps) {
  const prefersReducedMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const reduce = mounted && !!prefersReducedMotion;
  const instructionId = useId();
  const [hovered, setHovered] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [active, setActive] = useState(0);
  const open = hovered || pinned;
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const serviceCount = Math.min(nodes.length, 7);

  useEffect(() => setMounted(true), []);
  useEffect(
    () => () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    },
    []
  );
  useEffect(() => {
    if (reduce || serviceCount < 2) return;
    const timer = setTimeout(
      () => setActive((current) => (current + 1) % serviceCount),
      HERO_AUTO_ADVANCE_MS
    );
    return () => clearTimeout(timer);
  }, [active, reduce, serviceCount]);

  const openNow = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setHovered(true);
  };
  const closeSoon = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setHovered(false), 140);
  };
  const resolvedNodes: ResolvedNode[] = nodes.slice(0, 7).map((node) => ({
    ...node,
    Icon: ICONS[node.iconKey] ?? Sparkles,
    rgb: COLORS[node.colorKey],
  }));
  const activeNode = resolvedNodes[active] ?? resolvedNodes[0];

  return (
    <section
      className="page-hero route-hero-technical relative overflow-hidden border-b border-line"
      data-constellation-hero=""
      data-service-stack=""
      data-variant="orbit"
      data-open={open ? "true" : "false"}
      data-service-index={active}
      data-service={activeNode?.name ?? ""}
      onPointerEnter={openNow}
      onPointerLeave={closeSoon}
      style={{
        background:
          "linear-gradient(142deg, var(--bg) 0%, var(--surface-2) 54%, var(--bg) 100%)",
      }}
    >
      <div className="pointer-events-none absolute -left-20 top-0 h-64 w-64 rounded-full bg-accent/15 blur-[110px]" />
      <div className="pointer-events-none absolute right-0 top-10 h-64 w-64 rounded-full bg-brand/15 blur-[120px]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-55"
        aria-hidden="true"
        style={{
          backgroundImage:
            "linear-gradient(rgb(var(--accent-rgb) / 0.045) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--text-rgb) / 0.04) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          maskImage: "linear-gradient(90deg, transparent, black 28%, black)",
        }}
      />
      <div className="route-hero-inner container-x">
        <div className="route-hero-grid lg:grid-cols-[0.88fr_1.12fr]">
          <div className="relative z-10">
            <p className="font-mono text-label font-semibold uppercase tracking-wider text-text-faint">
              Seven services · one operating journey
            </p>
            <h1 className="route-hero-title relative mt-3 font-display font-semibold tracking-tight">
              <span
                role="button"
                tabIndex={0}
                aria-expanded={open}
                aria-describedby={instructionId}
                className={`ignite-word cursor-pointer rounded-lg font-bold tracking-tight outline-none focus-visible:ring-2 focus-visible:ring-accent/60${open ? " is-lit" : ""}`}
                onFocus={openNow}
                onBlur={closeSoon}
                onClick={() => setPinned((current) => !current)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setPinned((current) => !current);
                  }
                }}
              >
                <span data-rm="normal">{word}</span>
                <span data-rm="easy">{easyWord ?? word}</span>
              </span>
            </h1>
            <span id={instructionId} className="sr-only">
              {instruction ?? "Activate to reveal the visual theme"}
            </span>
            <motion.div
              aria-hidden="true"
              className="relative mt-4 h-[5px] w-full max-w-[32rem] origin-left rounded-full"
              style={{ background: "linear-gradient(90deg, rgb(var(--accent-rgb) / 0), rgb(var(--accent-rgb)) 28%, rgb(var(--amber-rgb)) 72%, rgb(var(--amber-rgb) / 0))" }}
              initial={false}
              animate={{ scaleX: open ? 1 : 0.7, opacity: open ? 1 : 0.8 }}
              transition={reduce ? { duration: 0.25, ease: "linear" } : { type: "spring", stiffness: 200, damping: 24 }}
            />
            <div className="mt-8 grid" aria-live="polite" aria-atomic="true">
              {resolvedNodes.map((node, index) => {
                const selected = index === active;
                return (
                  <div
                    key={node.name}
                    className={`col-start-1 row-start-1 ${selected ? "visible" : "invisible pointer-events-none"}`}
                    aria-hidden={!selected}
                  >
                    <div className="font-mono text-label uppercase tracking-wider text-text-faint">
                      Stage {String(index + 1).padStart(2, "0")} / {String(resolvedNodes.length).padStart(2, "0")} · {node.meta}
                    </div>
                    <p className="mt-2 font-display text-3xl font-semibold leading-tight" style={{ color: `rgb(${node.rgb})` }}>
                      {node.name}
                    </p>
                    <p className="mt-3 max-w-xl text-base leading-relaxed text-text-muted">
                      {node.detail}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <ServiceStackEngine
            nodes={resolvedNodes}
            active={active}
            open={open}
            reduce={reduce}
          />
        </div>

        <div className="route-hero-tabs border-t border-line lg:grid-cols-7" role="tablist" aria-label="Service journey">
          {resolvedNodes.map((node, index) => {
            const selected = index === active;
            return (
            <button
              key={node.name}
              type="button"
              role="tab"
              aria-selected={selected}
              title={node.name}
              onClick={() => setActive(index)}
              className={`group relative flex min-h-20 items-center gap-2 border-b border-line px-3 text-left transition-colors hover:bg-surface-2/60 lg:border-b-0 lg:border-r lg:last:border-r-0 ${selected ? "bg-surface-2/70" : ""}`}
            >
              {selected && <HeroTabGlow colorVar={node.rgb} reduce={reduce} />}
              <node.Icon className="relative h-4 w-4 shrink-0" style={{ color: `rgb(${node.rgb})` }} strokeWidth={1.65} />
              <span className={`relative ${selected ? "truncate font-semibold text-text" : "truncate text-text-muted"}`}>{node.short}</span>
              {selected && (
                <span
                  className="absolute inset-x-0 bottom-0 h-[3px]"
                  style={{ background: `rgb(${node.rgb} / 0.28)` }}
                />
              )}
            </button>
            );
          })}
        </div>

        <HeroRotationDots
          count={resolvedNodes.length}
          active={active}
          onSelect={setActive}
          getColorVar={(index) => resolvedNodes[index].rgb}
          label="Show"
        />
      </div>
    </section>
  );
}

function ServiceStackEngine({ nodes, active, open, reduce }: { nodes: readonly ResolvedNode[]; active: number; open: boolean; reduce: boolean }) {
  const activeColor = nodes[active]?.rgb ?? "var(--accent-rgb)";

  return (
    <div className="route-hero-stage route-hero-stage-scale relative hidden overflow-visible lg:block" aria-hidden="true" data-service-engine="">
      <div className="absolute left-1/2 top-1/2 h-[390px] w-[560px] -translate-x-1/2 -translate-y-1/2">
        <motion.div
          className="absolute left-1/2 top-[48%] h-[310px] w-[430px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[76px]"
          style={{ background: `rgb(${activeColor} / 0.14)` }}
          animate={{ opacity: open ? 0.9 : 0.52, scale: open ? 1.04 : 0.96 }}
          transition={reduce ? { duration: 0.2 } : { duration: 0.75 }}
        />
        <div
          className="absolute bottom-[6px] left-[112px] h-3 w-[336px] rounded-[50%] blur-lg"
          style={{ background: "rgb(var(--text-rgb) / 0.24)" }}
        />

        <div
          className="absolute left-[54px] top-[35px] h-[332px] w-[470px] rounded-md border border-line"
          style={{
            background: "linear-gradient(145deg, var(--surface-2), var(--bg))",
            boxShadow: "0 24px 56px -28px rgb(var(--text-rgb) / 0.5)",
          }}
        />
        <div
          className="absolute left-[514px] top-[48px] h-[304px] w-6"
          style={{
            clipPath: "polygon(0 0, 100% 10px, 100% calc(100% - 10px), 0 100%)",
            background: `linear-gradient(90deg, rgb(${activeColor} / 0.12), rgb(var(--text-rgb) / 0.08))`,
            borderRight: "1px solid var(--line)",
          }}
        />
        <div
          className="absolute left-[68px] top-[360px] h-3 w-[446px]"
          style={{
            clipPath: "polygon(0 0, 100% 0, calc(100% - 7px) 100%, 7px 100%)",
            background: "linear-gradient(180deg, var(--surface), var(--surface-2))",
            borderTop: "1px solid rgb(var(--text-rgb) / 0.1)",
            borderBottom: "1px solid var(--line)",
            boxShadow: "0 5px 10px -8px rgb(var(--text-rgb) / 0.5)",
          }}
        />

        <motion.div
          className="absolute left-[42px] top-[22px] h-[340px] w-[476px] overflow-hidden rounded-md border border-line bg-surface"
          style={{
            boxShadow: `inset 0 1px 0 rgb(255 255 255 / 0.18), 0 28px 70px -34px rgb(${activeColor} / 0.46), 0 12px 28px -20px rgb(var(--text-rgb) / 0.36)`,
          }}
          animate={{ y: open ? -3 : 0 }}
          transition={reduce ? { duration: 0.2 } : { duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        >
          <div
            className="absolute inset-x-0 top-0 h-px"
            style={{ background: "linear-gradient(90deg, transparent, rgb(255 255 255 / 0.55), transparent)" }}
          />
          {["left-3 top-3", "right-3 top-3", "bottom-3 left-3", "bottom-3 right-3"].map((position) => (
            <span
              key={position}
              className={`absolute ${position} h-1.5 w-1.5 rounded-full border border-line bg-bg shadow-inner`}
            />
          ))}

          <div className="absolute inset-x-5 top-5 flex h-[54px] items-center justify-between border-b border-line px-1">
            <div className="flex items-center gap-3">
              <span className="grid h-8 w-8 grid-cols-3 items-end gap-1 border border-line bg-bg p-2">
                <span className="h-2" style={{ background: `rgb(${activeColor} / 0.46)` }} />
                <span className="h-3.5" style={{ background: `rgb(${activeColor} / 0.72)` }} />
                <span className="h-4" style={{ background: `rgb(${activeColor})` }} />
              </span>
              <div>
                <span className="block font-mono text-label font-semibold uppercase tracking-wider text-text">TrustStack</span>
                <span className="block font-mono text-label uppercase tracking-wider text-text-faint">Service engine</span>
              </div>
            </div>
            <div className="flex items-end gap-2">
              <span className="mb-1 font-mono text-label uppercase tracking-wider text-text-faint">Modules</span>
              <span className="font-display text-3xl font-semibold leading-none text-text">07</span>
            </div>
          </div>

          <div className="absolute bottom-5 left-5 top-[91px] w-11 border-r border-line bg-bg/55">
            <div className="absolute bottom-3 left-1/2 top-3 w-px -translate-x-1/2 bg-line" />
            {nodes.map((node, index) => (
              <span
                key={node.name}
                className="absolute left-1/2 grid h-5 w-5 -translate-x-1/2 place-items-center rounded-full border bg-surface"
                style={{
                  top: 6 + index * 32,
                  borderColor: index === active ? `rgb(${node.rgb} / 0.8)` : "var(--line)",
                  boxShadow: index === active ? `0 0 0 3px rgb(${node.rgb} / 0.12)` : "none",
                }}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{
                    background: `rgb(${node.rgb})`,
                    opacity: index === active ? 1 : index < active ? 0.72 : 0.38,
                  }}
                />
              </span>
            ))}
          </div>

          <div className="absolute bottom-5 left-[80px] right-5 top-[91px] grid grid-rows-7 gap-1.5">
            {nodes.map((node, index) => {
              const selected = index === active;
              return (
                <motion.div
                  key={node.name}
                  className="relative flex min-h-0 items-center overflow-hidden rounded-sm border px-3"
                  style={{
                    borderColor: selected ? `rgb(${node.rgb} / 0.72)` : "var(--line)",
                    background: selected
                      ? `linear-gradient(90deg, rgb(${node.rgb} / 0.16), rgb(${node.rgb} / 0.045) 60%, var(--surface-2))`
                      : "linear-gradient(180deg, var(--surface-2), var(--surface))",
                    boxShadow: selected
                      ? `inset 0 1px 0 rgb(255 255 255 / 0.16), 0 5px 12px -8px rgb(${node.rgb} / 0.8)`
                      : "inset 0 1px 0 rgb(255 255 255 / 0.1)",
                  }}
                  initial={false}
                  animate={{
                    x: selected ? 6 : 0,
                    opacity: selected ? 1 : open ? 0.84 : 0.72,
                  }}
                  transition={reduce ? { duration: 0.2 } : { type: "spring", stiffness: 210, damping: 24 }}
                >
                  <span
                    className="absolute inset-y-0 left-0 w-[3px]"
                    style={{ background: `rgb(${node.rgb})`, opacity: selected ? 1 : 0.38 }}
                  />
                  <node.Icon className="ml-0.5 h-4 w-4 shrink-0" style={{ color: `rgb(${node.rgb})` }} strokeWidth={1.7} />
                  <span className="ml-3 truncate font-mono text-label font-semibold uppercase tracking-wider text-text">{node.short}</span>
                  <span className="ml-auto pl-3 font-mono text-label uppercase tracking-wider text-text-faint">{node.meta}</span>
                  <span
                    className="ml-2 h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ background: `rgb(${node.rgb})`, opacity: selected ? 1 : 0.34 }}
                  />
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}