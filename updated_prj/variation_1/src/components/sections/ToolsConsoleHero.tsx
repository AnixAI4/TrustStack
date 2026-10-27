"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Calculator, FileText, Gauge, SlidersHorizontal } from "lucide-react";
import type {
  ConstellationHeroConfig,
  HeroColorKey,
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

export function ToolsConsoleHero({
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
      5000
    );
    return () => clearTimeout(timer);
  }, [active, nodes.length, reduce]);

  return (
    <section
      className="page-hero route-hero-standard relative overflow-hidden border-b border-line"
      data-tools-console=""
      data-tool-index={active}
      data-tool={activeNode?.name ?? ""}
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
          "linear-gradient(135deg, var(--bg) 0%, var(--surface-2) 48%, var(--bg) 100%)",
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-55"
        aria-hidden="true"
        style={{
          backgroundImage:
            "linear-gradient(rgb(var(--text-rgb) / 0.05) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--text-rgb) / 0.05) 1px, transparent 1px)",
          backgroundSize: "34px 34px",
          maskImage: "linear-gradient(90deg, transparent, black 36%, black)",
        }}
      />

      <div className="route-hero-inner container-x">
        <div className="route-hero-grid lg:grid-cols-[0.7fr_1.3fr]">
          <div className="relative z-10 min-w-0">
            <p className="font-mono text-label font-semibold uppercase tracking-wider text-text-faint">
              On-device instruments
            </p>
            <h1 className="route-hero-title mt-3 min-w-0 font-display font-bold tracking-tight text-text [overflow-wrap:anywhere]">
              <span data-rm="normal">{word}</span>
              <span data-rm="easy">{easyWord ?? word}</span>
            </h1>
            <div key={activeNode?.name} className="mt-5" aria-live="polite">
              <div className="font-mono text-label uppercase tracking-wider text-text-faint">
                Instrument {String(active + 1).padStart(2, "0")} / {String(nodes.length).padStart(2, "0")}
              </div>
              <p className="mt-2 font-display text-3xl font-semibold" style={{ color: activeColor }}>
                {activeNode?.name}
              </p>
              <p className="mt-3 max-w-lg text-base leading-relaxed text-text-muted">
                {active === 0
                  ? "Penalty exposure, compliance ROI and breach cost in one private calculator console."
                  : "Privacy Notice and Consent Form drafts assembled in the on-device Document Studio."}
              </p>
            </div>
          </div>

          {activeNode && (
            <ToolWorkbench
              active={active}
              node={activeNode}
              engaged={engaged}
              reduce={reduce}
            />
          )}
        </div>

        <div className="route-hero-tabs border-t border-line lg:grid-cols-2" role="tablist" aria-label="Tool instruments">
          {nodes.map((node, index) => {
            const Icon = index === 0 ? Calculator : FileText;
            const selected = index === active;
            return (
              <button
                key={node.name}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setActive(index)}
                className={`group relative flex min-h-20 items-center justify-center gap-3 border-b border-line px-5 transition-colors hover:bg-surface-2/60 lg:border-b-0 lg:border-r lg:last:border-r-0 ${
                  selected ? "bg-surface-2/70" : ""
                }`}
              >
                {selected && <HeroTabGlow colorVar={COLORS[node.colorKey]} reduce={reduce} />}
                <Icon
                  className="relative h-5 w-5"
                  style={{ color: `rgb(${COLORS[node.colorKey]})` }}
                  strokeWidth={1.65}
                />
                <span
                  className={`relative min-w-0 text-sm leading-tight [overflow-wrap:anywhere] ${
                    selected ? "font-semibold text-text" : "text-text-muted"
                  }`}
                >
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

function ToolWorkbench({
  active,
  node,
  engaged,
  reduce,
}: {
  active: number;
  node: HeroNode;
  engaged: boolean;
  reduce: boolean;
}) {
  const footprint = active === 0
    ? { left: 75, width: 450 }
    : { left: 92, width: 415 };

  return (
    <div className="route-hero-stage relative hidden min-w-0 lg:block" data-tool-model={active === 0 ? "calculator-console" : "document-press"} aria-hidden="true">
      <div className="absolute left-1/2 top-0 h-[344px] w-[600px] -translate-x-1/2">
        <div
          className="absolute top-[296px] h-5 rounded-[50%] blur-[3px]"
          style={{
            left: footprint.left,
            width: footprint.width,
            background:
              "radial-gradient(ellipse at center, rgb(var(--text-rgb) / 0.24), rgb(var(--text-rgb) / 0.08) 48%, transparent 74%)",
          }}
        />
        <motion.div
          key={active}
          className="absolute inset-0"
          initial={false}
          animate={{ y: engaged ? -3 : 0 }}
          transition={reduce ? { duration: 0.2 } : { duration: 0.55, ease: "easeOut" }}
        >
          {active === 0 ? (
            <CalculatorConsole colorKey={node.colorKey} reduce={reduce} />
          ) : (
            <DocumentPress colorKey={node.colorKey} reduce={reduce} />
          )}
        </motion.div>
      </div>
    </div>
  );
}

function CalculatorConsole({
  colorKey,
  reduce,
}: {
  colorKey: HeroColorKey;
  reduce: boolean;
}) {
  const color = `rgb(${COLORS[colorKey]})`;
  const meters = [
    { label: "Penalty", width: "84%" },
    { label: "ROI", width: "61%" },
    { label: "Breach", width: "72%" },
  ];

  return (
    <div
      data-tool-assembly="calculator-console"
      className="absolute left-[55px] top-7 h-[270px] w-[490px] overflow-hidden rounded-md border border-line"
      style={{
        background: "linear-gradient(145deg, var(--surface), var(--surface-2))",
        boxShadow: `inset 0 1px 0 rgb(255 255 255 / 0.28), 0 24px 52px -30px rgb(${COLORS[colorKey]} / 0.52), 0 14px 28px -22px rgb(var(--text-rgb) / 0.4)`,
      }}
    >
      <span
        className="absolute inset-x-0 top-0 h-[3px]"
        style={{ background: `linear-gradient(90deg, rgb(${COLORS[colorKey]} / 0.64), rgb(${COLORS[colorKey]} / 0.08))` }}
      />
      <div className="absolute inset-x-6 top-6 grid h-[92px] grid-cols-[2.25rem_minmax(0,1fr)_1.25rem] items-center gap-4 border border-line bg-bg px-5">
        <Gauge className="h-9 w-9 shrink-0" style={{ color }} strokeWidth={1.4} />
        <div className="min-w-0 flex-1">
          <div className="whitespace-nowrap font-mono text-label uppercase tracking-wider text-text-faint">Private calculation engine</div>
          <div className="mt-2 whitespace-nowrap font-display text-xl font-semibold text-text">Penalty · ROI · Breach</div>
        </div>
        <SlidersHorizontal className="h-5 w-5" style={{ color }} strokeWidth={1.5} />
      </div>
      <div className="absolute bottom-6 left-6 right-[176px] space-y-3">
        {meters.map((meter, index) => (
          <div key={meter.label} className="grid grid-cols-[4.5rem_1fr] items-center gap-3">
            <span className="font-mono text-label uppercase tracking-wider text-text-faint">{meter.label}</span>
            <div className="h-2 overflow-hidden rounded-full bg-line">
              <motion.div
                className="h-full rounded-full"
                style={{ background: color }}
                animate={{ width: reduce ? meter.width : ["12%", meter.width, "42%", meter.width] }}
                transition={reduce ? { duration: 0 } : { duration: 4.2, delay: index * 0.28, repeat: Infinity }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="absolute bottom-5 right-6 grid w-[128px] grid-cols-3 gap-2">
        {Array.from({ length: 9 }, (_, index) => (
          <span
            key={index}
            className="grid aspect-square place-items-center rounded-sm border bg-bg font-mono text-label text-text-faint"
            style={{
              borderColor: index === 2 ? `rgb(${COLORS[colorKey]} / 0.72)` : "var(--line)",
              background: index === 2 ? `rgb(${COLORS[colorKey]} / 0.1)` : "var(--bg)",
              boxShadow: "inset 0 1px 0 rgb(255 255 255 / 0.16)",
            }}
          >
            {index + 1}
          </span>
        ))}
      </div>
    </div>
  );
}

function DocumentPress({
  colorKey,
  reduce,
}: {
  colorKey: HeroColorKey;
  reduce: boolean;
}) {
  const color = `rgb(${COLORS[colorKey]})`;

  return (
    <div
      className="absolute left-[72px] top-5 h-[286px] w-[455px] border border-line bg-surface shadow-card"
      data-tool-assembly="document-press"
    >
      <div className="absolute inset-x-8 top-7 h-[88px] border border-line bg-bg">
        <div className="absolute left-7 top-1/2 h-10 w-10 -translate-y-1/2 rounded-full border-4 border-line bg-surface-2" />
        <div className="absolute right-7 top-1/2 h-10 w-10 -translate-y-1/2 rounded-full border-4 border-line bg-surface-2" />
        <div className="absolute left-[70px] right-[70px] top-1/2 h-5 -translate-y-1/2 rounded-full border border-line" style={{ background: `rgb(${COLORS[colorKey]} / 0.2)` }} />
        <FileText className="absolute left-1/2 top-1/2 h-7 w-7 -translate-x-1/2 -translate-y-1/2" style={{ color }} strokeWidth={1.45} />
      </div>

      <div className="absolute bottom-7 left-1/2 h-[134px] w-[260px] -translate-x-1/2 overflow-hidden border-x border-t border-line bg-bg">
        <motion.div
          className="absolute left-1/2 top-1.5 h-[122px] w-[220px] border border-line bg-surface-2 px-5 py-3 shadow-card"
          style={{ x: "-50%" }}
          initial={false}
          animate={{ y: reduce ? 0 : [0, 3, 0] }}
          transition={reduce ? { duration: 0 } : { duration: 3.6, repeat: Infinity }}
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-label font-semibold uppercase tracking-wider" style={{ color }}>
              DPDP
            </span>
            <FileText className="h-4 w-4" style={{ color }} />
          </div>
          <div className="mt-3 h-px w-full bg-line" />
          <div className="mt-2 h-px w-[86%] bg-line" />
          <div className="mt-2 h-px w-[72%] bg-line" />
          <div className="mt-3 grid grid-cols-2 gap-3 font-mono text-label uppercase tracking-wider text-text-faint">
            <span>Notice</span>
            <span>Consent</span>
          </div>
        </motion.div>
      </div>
      <div className="absolute inset-x-0 bottom-0 h-5 border-t border-line bg-surface-2" />
    </div>
  );
}