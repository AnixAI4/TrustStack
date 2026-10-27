"use client";

import { useEffect, useState, type CSSProperties, type KeyboardEvent } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  BookOpen,
  Building2,
  Cloud,
  HeartPulse,
  Landmark,
  ShoppingCart,
} from "lucide-react";
import type {
  ConstellationHeroConfig,
  HeroColorKey,
  HeroModelKey,
  HeroNode,
} from "@/content/hero-configs";
import { HeroRotationDots, HeroTabGlow } from "@/components/ui/HeroRotationIndicator";

type ModelNode = HeroNode & { model: HeroModelKey };

const COLORS: Record<HeroColorKey, string> = {
  accent: "var(--accent-rgb)",
  gold: "var(--gold-rgb)",
  amber: "var(--amber-rgb)",
  blue: "var(--blue-rgb)",
  brand: "var(--brand-rgb)",
  green: "var(--green-rgb)",
  red: "var(--red-rgb)",
};

const MODEL_ICONS = {
  "finance-city": Landmark,
  "hospital-campus": HeartPulse,
  "school-campus": BookOpen,
  "technology-hub": Cloud,
  "commerce-store": ShoppingCart,
  "civic-complex": Building2,
} as const;

const MODEL_FOOTPRINTS: Record<HeroModelKey, { left: number; width: number }> = {
  "finance-city": { left: 45, width: 385 },
  "hospital-campus": { left: 58, width: 388 },
  "school-campus": { left: 78, width: 364 },
  "technology-hub": { left: 90, width: 298 },
  "commerce-store": { left: 75, width: 370 },
  "civic-complex": { left: 80, width: 360 },
};

type IndustryModelsHeroProps = ConstellationHeroConfig & {
  active: number;
  onActiveChange: (index: number) => void;
};

export function IndustryModelsHero({
  word,
  easyWord,
  nodes = [],
  active,
  onActiveChange,
}: IndustryModelsHeroProps) {
  const reduce = !!useReducedMotion();
  const modelNodes = nodes.filter(
    (node): node is ModelNode => typeof node.model === "string"
  );
  const [engaged, setEngaged] = useState(false);
  const [autoplayStopped, setAutoplayStopped] = useState(false);
  const activeNode = modelNodes[active] ?? modelNodes[0];
  const activeColor = activeNode
    ? `rgb(${COLORS[activeNode.colorKey]})`
    : "var(--text)";
  const ActiveIcon = activeNode ? MODEL_ICONS[activeNode.model] : Landmark;

  useEffect(() => {
    if (reduce || engaged || autoplayStopped || modelNodes.length < 2) return;
    const timer = setTimeout(
      () => onActiveChange((active + 1) % modelNodes.length),
      5000
    );
    return () => clearTimeout(timer);
  }, [active, autoplayStopped, engaged, modelNodes.length, onActiveChange, reduce]);

  function selectModel(index: number, event?: KeyboardEvent<HTMLButtonElement>) {
    const next = (index + modelNodes.length) % modelNodes.length;
    onActiveChange(next);
    setAutoplayStopped(true);

    if (event) {
      const tabs = event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>(
        '[role="tab"]'
      );
      tabs?.[next]?.focus();
    }
  }

  return (
    <section
      className="page-hero route-hero-technical industry-model-hero relative overflow-hidden border-b border-line"
      data-industry-models=""
      data-model-index={active}
      data-model={activeNode?.model ?? ""}
      data-sector={activeNode?.name ?? ""}
      onPointerEnter={() => setEngaged(true)}
      onPointerLeave={() => setEngaged(false)}
      onFocusCapture={() => setEngaged(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setEngaged(false);
        }
      }}
      style={{
        "--industry-color": activeNode
          ? COLORS[activeNode.colorKey]
          : "var(--accent-rgb)",
        background:
          "linear-gradient(112deg, var(--bg) 0%, var(--bg) 40%, rgb(var(--industry-color) / 0.06) 70%, var(--surface-2) 100%)",
      } as CSSProperties}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-80"
        aria-hidden="true"
        style={{
          backgroundImage:
            "linear-gradient(rgb(var(--industry-color) / 0.07) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--industry-color) / 0.07) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          maskImage:
            "linear-gradient(90deg, transparent 0%, black 34%, black 100%)",
        }}
      />
      <motion.div
        className="pointer-events-none absolute right-[-6%] top-1/2 h-[680px] w-[680px] rounded-full blur-[100px]"
        aria-hidden="true"
        style={{ background: activeColor, y: "-50%" }}
        initial={false}
        animate={{ opacity: engaged ? 0.18 : 0.1, scale: engaged ? 1.06 : 0.94 }}
        transition={reduce ? { duration: 0.2 } : { duration: 0.8, ease: "easeOut" }}
      />

      <div className="route-hero-inner container-x">
        <div className="route-hero-grid grid-cols-[minmax(0,1fr)] lg:grid-cols-[0.8fr_1.2fr]">
          <div className="relative z-10 min-w-0">
            <div className="flex items-center gap-3 font-mono text-label font-semibold uppercase tracking-wider text-text-faint">
              <span className="h-px w-10" style={{ background: activeColor }} />
              Sector model {String(active + 1).padStart(2, "0")} / {String(modelNodes.length).padStart(2, "0")}
            </div>
            <h1 className="route-hero-title mt-3 min-w-0 font-display font-bold tracking-tight text-text [overflow-wrap:anywhere]">
              <span data-rm="normal">{word}</span>
              <span data-rm="easy">{easyWord ?? word}</span>
            </h1>
            <div
              key={activeNode?.name}
              className="industry-model-summary mt-5 flex w-full max-w-lg items-start gap-3.5"
              aria-live="polite"
            >
              <span className="industry-model-summary__icon" aria-hidden="true">
                <ActiveIcon className="h-5 w-5" strokeWidth={1.7} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-display text-2xl font-semibold leading-none sm:text-3xl" style={{ color: activeColor }}>
                  {activeNode?.name}
                </p>
                <p className="mt-2 max-w-lg text-base leading-relaxed text-text-muted">
                  A living model of the systems, buildings and data surfaces that shape this sector.
                </p>
              </div>
            </div>
            <motion.div
              className="mt-5 flex h-[3px] origin-left overflow-hidden rounded-pill bg-line"
              initial={false}
              animate={{ width: engaged ? "13rem" : "5rem" }}
              transition={reduce ? { duration: 0.2 } : { duration: 0.7, ease: "easeOut" }}
            >
              <span className="h-full w-1/2 rounded-pill" style={{ background: activeColor }} />
            </motion.div>
          </div>

          {activeNode && (
            <IndustryModelStage
              node={activeNode}
              active={active}
              engaged={engaged}
              reduce={reduce}
            />
          )}
        </div>

        <div
          className="route-hero-tabs industry-model-tabs flex snap-x snap-mandatory overflow-x-auto lg:grid lg:grid-cols-6 lg:overflow-visible"
          role="tablist"
          aria-label="Industry models"
        >
          {modelNodes.map((node, index) => {
            const Icon = MODEL_ICONS[node.model];
            const selected = index === active;
            return (
              <button
                key={node.name}
                type="button"
                role="tab"
                id={`industry-model-tab-${index}`}
                aria-controls="industry-sector-panel"
                aria-selected={selected}
                tabIndex={selected ? 0 : -1}
                onClick={() => selectModel(index)}
                onKeyDown={(event) => {
                  if (event.key === "ArrowRight" || event.key === "ArrowDown") {
                    event.preventDefault();
                    selectModel(active + 1, event);
                  } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
                    event.preventDefault();
                    selectModel(active - 1, event);
                  } else if (event.key === "Home") {
                    event.preventDefault();
                    selectModel(0, event);
                  } else if (event.key === "End") {
                    event.preventDefault();
                    selectModel(modelNodes.length - 1, event);
                  }
                }}
                className="industry-model-tab group relative flex min-h-12 min-w-40 snap-start items-center gap-2.5 px-2.5 text-left lg:min-h-0 lg:min-w-0"
                style={{ "--model-color": COLORS[node.colorKey] } as CSSProperties}
              >
                {selected && <HeroTabGlow colorVar={COLORS[node.colorKey]} reduce={reduce} />}
                <span className="industry-model-tab__icon relative" aria-hidden="true">
                  <Icon className="h-4 w-4" strokeWidth={1.8} />
                </span>
                <span
                  className={`relative min-w-0 flex-1 text-sm leading-tight [overflow-wrap:anywhere] ${
                    selected ? "font-semibold text-text" : "text-text-muted"
                  }`}
                >
                  {node.short}
                </span>
                <span className="industry-model-tab__number relative" aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                {selected && (
                  <span
                    className="absolute inset-x-2.5 bottom-0 h-[2px] rounded-pill"
                    style={{ background: `rgb(${COLORS[node.colorKey]} / 0.28)` }}
                  />
                )}
              </button>
            );
          })}
        </div>

        <HeroRotationDots
          count={modelNodes.length}
          active={active}
          onSelect={(index) => selectModel(index)}
          getColorVar={(index) => COLORS[modelNodes[index].colorKey]}
          label="Show"
        />
      </div>
    </section>
  );
}

function IndustryModelStage({
  node,
  active,
  engaged,
  reduce,
}: {
  node: ModelNode;
  active: number;
  engaged: boolean;
  reduce: boolean;
}) {
  const color = `rgb(${COLORS[node.colorKey]})`;
  const footprint = MODEL_FOOTPRINTS[node.model];

  return (
    <div
      className="route-hero-stage route-hero-stage-compact relative hidden min-w-0 lg:block"
      data-industry-model={node.model}
      aria-hidden="true"
    >
      <div className="industry-model-viewport absolute left-1/2 top-1/2 h-[300px] w-[500px] max-w-full -translate-x-1/2 -translate-y-1/2">
        <div className="industry-model-viewport__wash absolute inset-0" />
        <span className="industry-model-viewport__corner industry-model-viewport__corner--tl" />
        <span className="industry-model-viewport__corner industry-model-viewport__corner--tr" />
        <span className="industry-model-viewport__corner industry-model-viewport__corner--bl" />
        <span className="industry-model-viewport__corner industry-model-viewport__corner--br" />
        <div className="absolute left-5 top-4 flex items-center gap-1.5">
          <span className="h-1.5 w-8 rounded-pill" style={{ background: color }} />
          <span className="h-1.5 w-1.5 rounded-full bg-line" />
          <span className="h-1.5 w-1.5 rounded-full bg-line" />
        </div>
        <div
          className="absolute bottom-5 h-5 rounded-[50%] blur-[3px]"
          style={{
            left: footprint.left + 25,
            width: footprint.width,
            background:
              "radial-gradient(ellipse at center, rgb(var(--text-rgb) / 0.22), rgb(var(--text-rgb) / 0.08) 46%, transparent 74%)",
          }}
        />

        <div className="absolute inset-x-[25px] bottom-[30px] h-[250px]">
          <motion.div
            key={node.model}
            className="h-full w-full"
            initial={false}
            animate={{ y: engaged ? -4 : 0 }}
            transition={
              reduce
                ? { duration: 0.2 }
                : { duration: 0.65, ease: [0.22, 1, 0.36, 1] }
            }
          >
            <IndustryModel model={node.model} colorKey={node.colorKey} reduce={reduce} />
          </motion.div>
        </div>

        <motion.div
          key={`model-label-${active}`}
          className="absolute right-5 top-3 font-display text-7xl font-bold leading-none"
          style={{ color, opacity: 0.1 }}
          initial={reduce ? false : { opacity: 0, x: 24 }}
          animate={{ opacity: 0.1, x: 0 }}
        >
          {String(active + 1).padStart(2, "0")}
        </motion.div>
      </div>
    </div>
  );
}

function IndustryModel({
  model,
  colorKey,
  reduce,
}: {
  model: HeroModelKey;
  colorKey: HeroColorKey;
  reduce: boolean;
}) {
  const color = `rgb(${COLORS[colorKey]})`;

  switch (model) {
    case "finance-city":
      return (
        <div className="relative h-full w-full">
          <ModelTower left={72} width={82} height={150} colorKey={colorKey} rows={6} columns={3} reduce={reduce} />
          <ModelTower left={186} width={96} height={218} colorKey={colorKey} rows={9} columns={4} reduce={reduce} />
          <ModelTower left={316} width={78} height={132} colorKey={colorKey} rows={5} columns={3} reduce={reduce} />
          <div className="absolute bottom-0 left-[45px] h-8 w-[385px] border border-line bg-surface-2 shadow-card" />
          <Landmark className="absolute left-[218px] top-2 h-8 w-8" style={{ color }} strokeWidth={1.45} />
        </div>
      );
    case "hospital-campus":
      return (
        <div className="relative h-full w-full">
          <ModelWing left={58} bottom={18} width={120} height={92} colorKey={colorKey} />
          <ModelWing left={326} bottom={18} width={120} height={92} colorKey={colorKey} />
          <ModelWing left={166} bottom={18} width={174} height={164} colorKey={colorKey} />
          <div className="absolute left-[239px] top-[69px] h-12 w-4 rounded-sm" style={{ background: color }} />
          <div className="absolute left-[223px] top-[85px] h-4 w-12 rounded-sm" style={{ background: color }} />
          <HeartPulse className="absolute left-[242px] top-3 h-8 w-8" style={{ color }} strokeWidth={1.5} />
        </div>
      );
    case "school-campus":
      return (
        <div className="relative h-full w-full">
          <div className="absolute bottom-[16px] left-[95px] h-[128px] w-[330px] border border-line bg-surface shadow-card">
            <div className="absolute inset-x-0 top-0 h-8 border-b border-line" style={{ background: `rgb(${COLORS[colorKey]} / 0.16)` }} />
            <div className="absolute bottom-0 left-1/2 h-16 w-12 -translate-x-1/2 border-x border-t border-line bg-bg" />
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <span key={index} className="absolute top-12 h-9 w-8 border border-line bg-bg" style={{ left: 28 + index * 50 }} />
            ))}
          </div>
          <div
            className="absolute left-[78px] top-[65px] h-16 w-[364px]"
            style={{
              background: `linear-gradient(135deg, transparent 49%, rgb(${COLORS[colorKey]} / 0.36) 50%) left, linear-gradient(225deg, transparent 49%, rgb(${COLORS[colorKey]} / 0.36) 50%) right`,
              backgroundSize: "50% 100%",
              backgroundRepeat: "no-repeat",
            }}
          />
          <BookOpen className="absolute left-[244px] top-3 h-9 w-9" style={{ color }} strokeWidth={1.45} />
        </div>
      );
    case "technology-hub":
      return (
        <div className="relative h-full w-full">
          {[90, 196, 302].map((left, rackIndex) => (
            <div key={left} className="absolute bottom-4 h-[178px] w-[82px] border border-line bg-surface shadow-card" style={{ left }}>
              {[0, 1, 2, 3, 4, 5].map((rowIndex) => (
                <div key={rowIndex} className="absolute left-3 right-3 h-4 border border-line bg-bg" style={{ top: 14 + rowIndex * 25 }}>
                  <motion.span
                    className="absolute right-2 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full"
                    style={{ background: color }}
                    animate={{ opacity: reduce ? 0.7 : [0.35, 1, 0.35] }}
                    transition={reduce ? { duration: 0 } : { duration: 1.8, delay: rackIndex * 0.25 + rowIndex * 0.08, repeat: Infinity }}
                  />
                </div>
              ))}
            </div>
          ))}
          <Cloud className="absolute left-[239px] top-0 h-11 w-11" style={{ color }} strokeWidth={1.35} />
          <div className="absolute left-[130px] top-14 h-px w-[258px]" style={{ background: `rgb(${COLORS[colorKey]} / 0.5)` }} />
        </div>
      );
    case "commerce-store":
      return (
        <div className="relative h-full w-full">
          <div className="absolute bottom-4 left-[75px] h-[156px] w-[370px] border border-line bg-surface shadow-card">
            <div className="absolute inset-x-0 top-0 flex h-11 overflow-hidden border-b border-line">
              {[0, 1, 2, 3, 4, 5, 6, 7].map((index) => (
                <span key={index} className="h-full flex-1" style={{ background: index % 2 ? "var(--surface-2)" : `rgb(${COLORS[colorKey]} / 0.32)` }} />
              ))}
            </div>
            <div className="absolute bottom-0 left-8 h-20 w-28 border-x border-t border-line bg-bg" />
            <div className="absolute bottom-0 right-8 h-20 w-40 border border-line bg-bg" />
          </div>
          {[96, 142, 372].map((left, index) => (
            <motion.div
              key={left}
              className="absolute bottom-1 h-8 w-8 border border-line bg-surface-2"
              style={{ left }}
              animate={{ y: reduce ? 0 : [0, -3, 0] }}
              transition={reduce ? { duration: 0 } : { duration: 2.2, delay: index * 0.2, repeat: Infinity }}
            />
          ))}
          <ShoppingCart className="absolute left-[240px] top-1 h-9 w-9" style={{ color }} strokeWidth={1.45} />
        </div>
      );
    case "civic-complex":
      return (
        <div className="relative h-full w-full">
          <div className="absolute bottom-4 left-[80px] h-[118px] w-[360px] border border-line bg-surface shadow-card">
            <div className="absolute inset-x-0 top-0 h-8 border-b border-line" style={{ background: `rgb(${COLORS[colorKey]} / 0.16)` }} />
            {[0, 1, 2, 3, 4, 5, 6].map((index) => (
              <span key={index} className="absolute bottom-0 h-[76px] w-3 border-x border-line bg-surface-2" style={{ left: 34 + index * 47 }} />
            ))}
          </div>
          <div className="absolute left-[179px] top-[36px] h-[82px] w-[162px] rounded-t-[100%] border border-line bg-surface-2 shadow-card" />
          <div className="absolute left-[250px] top-2 h-10 w-5 rounded-t-full border border-line bg-surface" />
          <Building2 className="absolute left-[241px] top-[70px] h-9 w-9" style={{ color }} strokeWidth={1.4} />
        </div>
      );
  }
}

function ModelTower({
  left,
  width,
  height,
  colorKey,
  rows,
  columns,
  reduce,
}: {
  left: number;
  width: number;
  height: number;
  colorKey: HeroColorKey;
  rows: number;
  columns: number;
  reduce: boolean;
}) {
  return (
    <div
      className="absolute bottom-8 overflow-hidden border border-line"
      style={{
        left,
        width,
        height,
        borderRadius: 2,
        background: `linear-gradient(145deg, var(--surface) 0%, var(--surface) 68%, rgb(${COLORS[colorKey]} / 0.1) 100%)`,
        boxShadow: `inset 0 1px 0 rgb(255 255 255 / 0.3), inset -10px 0 18px -16px rgb(${COLORS[colorKey]} / 0.7), 0 18px 34px -22px rgb(var(--text-rgb) / 0.48)`,
      }}
    >
      <span
        className="absolute inset-x-0 top-0 h-[3px]"
        style={{ background: `linear-gradient(90deg, rgb(${COLORS[colorKey]} / 0.58), rgb(${COLORS[colorKey]} / 0.08))` }}
      />
      <div className="absolute inset-3 grid gap-2" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {Array.from({ length: rows * columns }, (_, index) => {
          const highlighted = (index + columns) % 7 === 0;
          return (
            <motion.span
              key={index}
              className="border"
              style={{
                borderColor: `rgb(${COLORS[colorKey]} / 0.28)`,
                background: highlighted
                  ? `linear-gradient(180deg, rgb(${COLORS[colorKey]} / 0.38), rgb(${COLORS[colorKey]} / 0.2))`
                  : `linear-gradient(180deg, rgb(${COLORS[colorKey]} / 0.2), rgb(${COLORS[colorKey]} / 0.09))`,
                boxShadow: "inset 0 1px 0 rgb(255 255 255 / 0.2)",
              }}
              animate={{ opacity: reduce || !highlighted ? 1 : [0.76, 1, 0.76] }}
              transition={reduce || !highlighted ? { duration: 0 } : { duration: 4.2, delay: (index % columns) * 0.22, repeat: Infinity }}
            />
          );
        })}
      </div>
      <span
        className="absolute inset-x-0 bottom-0 h-px"
        style={{ background: `rgb(${COLORS[colorKey]} / 0.32)` }}
      />
    </div>
  );
}

function ModelWing({
  left,
  bottom,
  width,
  height,
  colorKey,
}: {
  left: number;
  bottom: number;
  width: number;
  height: number;
  colorKey: HeroColorKey;
}) {
  return (
    <div className="absolute border border-line bg-surface shadow-card" style={{ left, bottom, width, height }}>
      <div className="grid h-full grid-cols-3 gap-3 p-4">
        {Array.from({ length: 9 }, (_, index) => (
          <span key={index} className="border border-line" style={{ background: `rgb(${COLORS[colorKey]} / 0.12)` }} />
        ))}
      </div>
    </div>
  );
}

