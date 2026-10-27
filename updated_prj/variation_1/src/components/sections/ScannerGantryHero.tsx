"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Cookie,
  FileText,
  LockKeyhole,
  Radar,
  ScanLine,
  ShieldCheck,
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
  accent: "var(--accent-rgb)", gold: "var(--gold-rgb)", amber: "var(--amber-rgb)",
  blue: "var(--blue-rgb)", brand: "var(--brand-rgb)", green: "var(--green-rgb)", red: "var(--red-rgb)",
};

const ICONS: Partial<Record<HeroIconKey, LucideIcon>> = {
  "lock-keyhole": LockKeyhole,
  "shield-check": ShieldCheck,
  "file-text": FileText,
  cookie: Cookie,
  radar: Radar,
};

export function ScannerGantryHero({ word, easyWord, nodes = [] }: ConstellationHeroConfig) {
  const reduce = !!useReducedMotion();
  const [active, setActive] = useState(0);
  const [engaged, setEngaged] = useState(false);
  const activeNode = nodes[active] ?? nodes[0];
  const activeColor = activeNode ? `rgb(${COLORS[activeNode.colorKey]})` : "var(--accent)";

  useEffect(() => {
    if (reduce || nodes.length < 2) return;
    const timer = setTimeout(() => setActive((current) => (current + 1) % nodes.length), 3800);
    return () => clearTimeout(timer);
  }, [active, nodes.length, reduce]);

  return (
    <section
      className="page-hero route-hero-technical relative overflow-hidden border-b border-line"
      data-scanner-gantry=""
      data-signal-index={active}
      data-signal={activeNode?.name ?? ""}
      onPointerEnter={() => setEngaged(true)}
      onPointerLeave={() => setEngaged(false)}
      onFocusCapture={() => setEngaged(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setEngaged(false);
      }}
      style={{ background: "linear-gradient(140deg, var(--bg), var(--surface-2) 54%, var(--bg))" }}
    >
      <ModelGrid colorKey="accent" />
      <div className="route-hero-inner container-x">
        <div className="route-hero-grid lg:grid-cols-[0.68fr_1.32fr]">
          <HeroCopy
            eyebrow="Public-signal inspection"
            word={word}
            easyWord={easyWord}
            active={active}
            total={nodes.length}
            node={activeNode}
            color={activeColor}
          />
          <ScannerModel nodes={nodes} active={active} engaged={engaged} reduce={reduce} />
        </div>
        <SignalTabs nodes={nodes} active={active} setActive={setActive} reduce={reduce} />
        <HeroRotationDots count={nodes.length} active={active} onSelect={setActive} getColorVar={(i) => COLORS[nodes[i].colorKey]} label="Show" />
      </div>
    </section>
  );
}

function ModelGrid({ colorKey }: { colorKey: HeroColorKey }) {
  return (
    <div
      className="pointer-events-none absolute inset-0 opacity-55"
      aria-hidden="true"
      style={{
        backgroundImage: `linear-gradient(rgb(${COLORS[colorKey]} / 0.05) 1px, transparent 1px), linear-gradient(90deg, rgb(${COLORS[colorKey]} / 0.05) 1px, transparent 1px)`,
        backgroundSize: "36px 36px",
        maskImage: "linear-gradient(90deg, transparent, black 28%, black)",
      }}
    />
  );
}

function HeroCopy({ eyebrow, word, easyWord, active, total, node, color }: {
  eyebrow: string; word: string; easyWord?: string; active: number; total: number; node?: HeroNode; color: string;
}) {
  return (
    <div className="relative z-10 min-w-0">
      <p className="font-mono text-label font-semibold uppercase tracking-wider text-text-faint">{eyebrow}</p>
      <h1 className="route-hero-title mt-3 min-w-0 font-display font-bold tracking-tight text-text [overflow-wrap:anywhere]">
        <span data-rm="normal">{word}</span><span data-rm="easy">{easyWord ?? word}</span>
      </h1>
      <div key={node?.name} className="mt-5" aria-live="polite">
        <div className="font-mono text-label uppercase tracking-wider text-text-faint">Signal {String(active + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}</div>
        <p className="mt-2 font-display text-3xl font-semibold" style={{ color }}>{node?.name}</p>
        <p className="mt-3 max-w-lg text-base leading-relaxed text-text-muted">A public-facing signal loaded, inspected and scored against the DPDP Act.</p>
      </div>
    </div>
  );
}

function ScannerModel({ nodes, active, engaged, reduce }: { nodes: readonly HeroNode[]; active: number; engaged: boolean; reduce: boolean }) {
  const activeNode = nodes[active];
  const color = activeNode ? `rgb(${COLORS[activeNode.colorKey]})` : "var(--accent)";
  return (
    <div className="route-hero-stage relative hidden min-w-0 overflow-hidden lg:block" aria-hidden="true">
      <motion.div
        data-scanner-assembly=""
        className="absolute left-1/2 top-0 h-[336px] w-[580px]"
        style={{ x: "-50%" }}
        initial={false}
        animate={{ y: engaged ? -3 : 0 }}
        transition={reduce ? { duration: 0.2 } : { duration: 0.55, ease: "easeOut" }}
      >
        <div className="absolute bottom-2 left-[42px] h-7 w-[496px] border border-line bg-surface-2 shadow-card" />
        <div className="absolute bottom-9 left-[72px] h-[263px] w-[436px] border border-line bg-surface shadow-card">
          <div className="absolute inset-x-0 top-0 flex h-10 items-center gap-3 border-b border-line bg-bg px-4">
            <span className="h-2.5 w-2.5 rounded-full bg-red/60" /><span className="h-2.5 w-2.5 rounded-full bg-gold/60" /><span className="h-2.5 w-2.5 rounded-full bg-green/60" />
            <span className="ml-3 flex-1 truncate rounded-full border border-line bg-surface-2 px-4 py-1 font-mono text-label text-text-faint">yourbusiness.com</span>
          </div>
          <div className="absolute inset-x-5 bottom-5 top-[60px] grid grid-cols-[1.2fr_0.8fr] gap-4">
            <div className="space-y-3">
              <div className="h-8 w-[78%] bg-line/60" /><div className="h-3 w-full bg-line/50" /><div className="h-3 w-[88%] bg-line/50" />
              <div className="mt-6 grid grid-cols-2 gap-3"><div className="h-16 border border-line bg-bg" /><div className="h-16 border border-line bg-bg" /></div>
            </div>
            <div className="grid content-start gap-1.5">
              {nodes.map((node, index) => (
                <motion.div key={node.name} className="flex h-6 min-w-0 items-center border border-line bg-bg px-2" animate={{ x: index === active ? -6 : 0, opacity: index === active ? 1 : 0.45, borderColor: index === active ? `rgb(${COLORS[node.colorKey]} / 0.75)` : "var(--line)" }} transition={reduce ? { duration: 0.2 } : { type: "spring", stiffness: 220, damping: 24 }}>
                  <span className="h-2 w-2 rounded-full" style={{ background: `rgb(${COLORS[node.colorKey]})` }} /><span className="ml-2 font-mono text-label uppercase tracking-wider text-text">{node.short}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
        <div className="absolute left-[38px] top-1 h-[296px] w-7 border border-line bg-surface shadow-card" />
        <div className="absolute right-[38px] top-1 h-[296px] w-7 border border-line bg-surface shadow-card" />
        <div className="absolute left-[28px] right-[28px] top-1 h-7 border border-line bg-surface shadow-card" />
        <motion.div
          className="absolute bottom-10 top-8 w-[3px]"
          style={{ background: color, boxShadow: `0 0 24px 6px ${color}` }}
          animate={{ left: reduce ? "50%" : ["14%", "86%", "14%"] }}
          transition={reduce ? { duration: 0 } : { duration: 3.8, ease: "easeInOut", repeat: Infinity }}
        />
        <ScanLine className="absolute left-1/2 top-1 h-7 w-7 -translate-x-1/2" style={{ color }} strokeWidth={1.5} />
      </motion.div>
    </div>
  );
}

function SignalTabs({ nodes, active, setActive, reduce }: { nodes: readonly HeroNode[]; active: number; setActive: (index: number) => void; reduce: boolean }) {
  return (
    <div className="route-hero-tabs border-t border-line lg:grid-cols-6" role="tablist" aria-label="Scanner signals">
      {nodes.map((node, index) => { const Icon = ICONS[node.iconKey] ?? ScanLine; const selected = index === active; return (
        <button key={node.name} type="button" role="tab" aria-selected={selected} onClick={() => setActive(index)} className={`group relative flex min-h-20 items-center gap-3 border-b border-line px-3 text-left transition-colors hover:bg-surface-2/60 lg:border-b-0 lg:border-r lg:last:border-r-0 ${selected ? "bg-surface-2/70" : ""}`}>
          {selected && <HeroTabGlow colorVar={COLORS[node.colorKey]} reduce={reduce} />}
          <Icon className="relative h-5 w-5 shrink-0" style={{ color: `rgb(${COLORS[node.colorKey]})` }} strokeWidth={1.65} /><span className={`relative min-w-0 text-sm leading-tight [overflow-wrap:anywhere] ${selected ? "font-semibold text-text" : "text-text-muted"}`}>{node.short}</span>
          {selected && <span className="absolute inset-x-0 bottom-0 h-[3px]" style={{ background: `rgb(${COLORS[node.colorKey]} / 0.28)` }} />}
        </button>
      ); })}
    </div>
  );
}