"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Cookie, Eye, Headset, LockKeyhole, Network, ShieldCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ConstellationHeroConfig, HeroColorKey, HeroIconKey, HeroNode } from "@/content/hero-configs";
import { HeroRotationDots, HeroTabGlow } from "@/components/ui/HeroRotationIndicator";

const COLORS: Record<HeroColorKey, string> = {
  accent: "var(--accent-rgb)", gold: "var(--gold-rgb)", amber: "var(--amber-rgb)",
  blue: "var(--blue-rgb)", brand: "var(--brand-rgb)", green: "var(--green-rgb)", red: "var(--red-rgb)",
};
const ICONS: Partial<Record<HeroIconKey, LucideIcon>> = {
  "lock-keyhole": LockKeyhole, "shield-check": ShieldCheck, eye: Eye, cookie: Cookie, network: Network, headset: Headset,
};
const POSITIONS = [
  { left: 88, top: 48 }, { left: 248, top: 8 }, { left: 408, top: 48 },
  { left: 408, top: 224 }, { left: 248, top: 244 }, { left: 88, top: 224 },
];

export function SecurityFortressHero({ word, easyWord, nodes = [] }: ConstellationHeroConfig) {
  const reduce = !!useReducedMotion();
  const [active, setActive] = useState(0);
  const [engaged, setEngaged] = useState(false);
  const activeNode = nodes[active] ?? nodes[0];
  const activeColor = activeNode ? `rgb(${COLORS[activeNode.colorKey]})` : "var(--red)";
  useEffect(() => {
    if (reduce || nodes.length < 2) return;
    const timer = setTimeout(() => setActive((current) => (current + 1) % nodes.length), 4200);
    return () => clearTimeout(timer);
  }, [active, nodes.length, reduce]);

  return (
    <section
      className="page-hero route-hero-technical relative overflow-hidden border-b border-line"
      data-security-fortress=""
      data-control-index={active}
      data-control={activeNode?.name ?? ""}
      onPointerEnter={() => setEngaged(true)} onPointerLeave={() => setEngaged(false)}
      onFocusCapture={() => setEngaged(true)} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setEngaged(false); }}
      style={{ background: "linear-gradient(140deg, var(--bg), var(--surface-2) 54%, var(--bg))" }}
    >
      <div className="pointer-events-none absolute inset-0 opacity-55" aria-hidden="true" style={{
        backgroundImage: "linear-gradient(rgb(var(--red-rgb) / 0.04) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--blue-rgb) / 0.045) 1px, transparent 1px)",
        backgroundSize: "38px 38px", maskImage: "linear-gradient(90deg, transparent, black 30%, black)",
      }} />
      <div className="route-hero-inner container-x">
        <div className="route-hero-grid lg:grid-cols-[0.68fr_1.32fr]">
          <div className="relative z-10 min-w-0">
            <p className="font-mono text-label font-semibold uppercase tracking-wider text-text-faint">Defensive perimeter</p>
            <h1 className="route-hero-title mt-3 min-w-0 font-display font-bold tracking-tight text-text [overflow-wrap:anywhere]"><span data-rm="normal">{word}</span><span data-rm="easy">{easyWord ?? word}</span></h1>
            <div key={activeNode?.name} className="mt-5" aria-live="polite">
              <div className="font-mono text-label uppercase tracking-wider text-text-faint">Control {String(active + 1).padStart(2, "0")} / {String(nodes.length).padStart(2, "0")}</div>
              <p className="mt-2 font-display text-3xl font-semibold" style={{ color: activeColor }}>{activeNode?.name}</p>
              <p className="mt-3 max-w-lg text-base leading-relaxed text-text-muted">A public security control defending the site perimeter and DPDP safeguard duty.</p>
            </div>
          </div>
          <FortressModel nodes={nodes} active={active} engaged={engaged} reduce={reduce} />
        </div>
        <ControlTabs nodes={nodes} active={active} setActive={setActive} reduce={reduce} />
        <HeroRotationDots count={nodes.length} active={active} onSelect={setActive} getColorVar={(i) => COLORS[nodes[i].colorKey]} label="Show" />
      </div>
    </section>
  );
}

function FortressModel({ nodes, active, engaged, reduce }: { nodes: readonly HeroNode[]; active: number; engaged: boolean; reduce: boolean }) {
  const activeNode = nodes[active];
  const color = activeNode ? `rgb(${COLORS[activeNode.colorKey]})` : "var(--red)";
  return (
    <div className="route-hero-stage relative hidden min-w-0 overflow-hidden lg:block" aria-hidden="true">
      <motion.div
        data-security-assembly=""
        className="absolute left-1/2 top-0 h-[336px] w-[560px]"
        style={{ x: "-50%" }}
        initial={false}
        animate={{ y: engaged ? -3 : 0 }}
        transition={reduce ? { duration: 0.2 } : { duration: 0.55, ease: "easeOut" }}
      >
        {[330, 260, 190].map((size, index) => (
          <div key={size} className="absolute left-1/2 top-1/2 border" style={{
            x: "-50%", y: "-50%", width: size, height: size,
            transform: "translate(-50%, -50%)",
            clipPath: "polygon(30% 0,70% 0,100% 30%,100% 70%,70% 100%,30% 100%,0 70%,0 30%)",
            borderColor: index === 2 ? color : `rgb(var(--text-rgb) / ${0.12 + index * 0.06})`,
            background: index === 2 ? `rgb(${activeNode ? COLORS[activeNode.colorKey] : "var(--red-rgb)"} / 0.07)` : "transparent",
          }} />
        ))}
        <motion.div className="absolute left-1/2 top-1/2 z-20 grid h-32 w-32 place-items-center rounded-full border-2 bg-bg shadow-[0_0_70px_rgb(var(--red-rgb)/0.22)]" style={{ x: "-50%", y: "-50%", borderColor: color }} animate={{ scale: engaged ? 1.08 : 1 }}>
          <div className="text-center"><ShieldCheck className="mx-auto h-9 w-9" style={{ color }} strokeWidth={1.45} /><span className="mt-2 block font-mono text-label font-semibold uppercase tracking-wider text-text">Protected</span><span className="mt-1 block font-display text-2xl font-semibold text-text">s.8(5)</span></div>
        </motion.div>
        {nodes.map((node, index) => { const Icon = ICONS[node.iconKey] ?? ShieldCheck; const p = POSITIONS[index] ?? POSITIONS[0]; const selected = index === active; return (
          <motion.div key={node.name} className="absolute z-10 grid h-16 w-16 place-items-center rounded-lg border bg-surface shadow-card" style={{ left: p.left, top: p.top, color: `rgb(${COLORS[node.colorKey]})` }} animate={{ scale: selected ? 1.08 : 0.92, opacity: selected ? 1 : 0.58, borderColor: selected ? `rgb(${COLORS[node.colorKey]} / 0.82)` : "var(--line)" }} transition={reduce ? { duration: 0.2 } : { type: "spring", stiffness: 180, damping: 20 }}>
            <Icon className="h-6 w-6" strokeWidth={1.55} /><span className="absolute -bottom-5 whitespace-nowrap font-mono text-label uppercase tracking-wider text-text-faint">{node.short}</span>
          </motion.div>
        ); })}
        <motion.div className="absolute left-1/2 top-1/2 z-0 h-[220px] w-[220px] rounded-full" style={{ x: "-50%", y: "-50%", background: `conic-gradient(from 0deg, transparent 0 82%, ${color} 98%, transparent)` }} animate={{ rotate: reduce ? 45 : 360 }} transition={reduce ? { duration: 0 } : { duration: 4, repeat: Infinity, ease: "linear" }} />
      </motion.div>
    </div>
  );
}

function ControlTabs({ nodes, active, setActive, reduce }: { nodes: readonly HeroNode[]; active: number; setActive: (index: number) => void; reduce: boolean }) {
  return <div className="route-hero-tabs border-t border-line lg:grid-cols-6" role="tablist" aria-label="Security controls">{nodes.map((node,index)=>{const Icon=ICONS[node.iconKey]??ShieldCheck;const selected=index===active;return <button key={node.name} type="button" role="tab" aria-selected={selected} onClick={()=>setActive(index)} className={`group relative flex min-h-20 items-center gap-3 border-b border-line px-3 text-left transition-colors hover:bg-surface-2/60 lg:border-b-0 lg:border-r lg:last:border-r-0 ${selected?"bg-surface-2/70":""}`}>{selected&&<HeroTabGlow colorVar={COLORS[node.colorKey]} reduce={reduce}/>}<Icon className="relative h-5 w-5 shrink-0" style={{color:`rgb(${COLORS[node.colorKey]})`}} strokeWidth={1.65}/><span className={`relative min-w-0 text-sm leading-tight [overflow-wrap:anywhere] ${selected?"font-semibold text-text":"text-text-muted"}`}>{node.short}</span>{selected&&<span className="absolute inset-x-0 bottom-0 h-[3px]" style={{background:`rgb(${COLORS[node.colorKey]} / 0.28)`}}/>}</button>})}</div>;
}