"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { FileSignature, Network, Radar, Scale, ShieldCheck } from "lucide-react";
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
  "shield-check": ShieldCheck,
  "file-signature": FileSignature,
  radar: Radar,
  network: Network,
};

const DESCRIPTIONS: Record<string, string> = {
  "Right to privacy": "The constitutional foundation behind India's modern data-protection framework.",
  "Consent & confidentiality": "Judgments about permission, trust and limits on disclosure.",
  "Surveillance & the state": "The legality, necessity and proportionality of state intrusion.",
  "Speech & the internet": "Cases balancing privacy, expression and digital access.",
};

export function CaseBalanceHero({
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
      4600
    );
    return () => clearTimeout(timer);
  }, [active, nodes.length, reduce]);

  return (
    <section
      className="page-hero route-hero-compact relative overflow-hidden border-b border-line"
      data-case-balance=""
      data-case-index={active}
      data-case-category={activeNode?.name ?? ""}
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
        className="pointer-events-none absolute inset-0 opacity-70"
        aria-hidden="true"
        style={{
          backgroundImage:
            "linear-gradient(rgb(var(--gold-rgb) / 0.045) 1px, transparent 1px), radial-gradient(ellipse at 76% 48%, rgb(var(--gold-rgb) / 0.09), transparent 48%)",
          backgroundSize: "100% 28px, auto",
          maskImage: "linear-gradient(90deg, transparent, black 38%, black)",
        }}
      />

      <div className="route-hero-inner container-x">
        <div className="route-hero-grid lg:grid-cols-[0.7fr_1.3fr]">
          <div className="relative z-10 min-w-0">
            <p className="font-mono text-label font-semibold uppercase tracking-wider text-text-faint">
              Privacy jurisprudence
            </p>
            <h1 className="route-hero-title mt-3 font-display font-bold tracking-tight text-text">
              <span data-rm="normal">{word}</span>
              <span data-rm="easy">{easyWord ?? word}</span>
            </h1>
            <div key={activeNode?.name} className="mt-5" aria-live="polite">
                <div className="font-mono text-label uppercase tracking-wider text-text-faint">
                  Dossier {String(active + 1).padStart(2, "0")} / {String(nodes.length).padStart(2, "0")}
                </div>
                <p className="mt-2 font-display text-3xl font-semibold leading-tight" style={{ color: activeColor }}>
                  {activeNode?.name}
                </p>
                <p className="mt-3 max-w-lg text-base leading-relaxed text-text-muted">
                  {activeNode ? DESCRIPTIONS[activeNode.name] : ""}
                </p>
            </div>
          </div>

          <JurisprudenceBalance nodes={nodes} active={active} engaged={engaged} reduce={reduce} />
        </div>

        <div className="route-hero-tabs border-t border-line lg:grid-cols-4" role="tablist" aria-label="Case law categories">
          {nodes.map((node, index) => {
            const Icon = ICONS[node.iconKey] ?? Scale;
            const selected = index === active;
            return (
              <button
                key={node.name}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setActive(index)}
                className={`group relative flex min-h-20 items-center justify-center gap-3 border-b border-line px-4 transition-colors hover:bg-surface-2/60 lg:border-b-0 lg:border-r lg:last:border-r-0 ${
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

function JurisprudenceBalance({
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
  const activeNode = nodes[active];
  const color = activeNode
    ? `rgb(${COLORS[activeNode.colorKey]})`
    : "var(--gold)";
  const angles = [-2.4, -1.7, -2.8, -2.1];
  const angle = angles[active] ?? angles[0];
  const radians = (angle * Math.PI) / 180;
  const centerX = 300;
  const pivotY = 68;
  const halfBeam = 236;
  const leftX = centerX - halfBeam * Math.cos(radians);
  const leftY = pivotY - halfBeam * Math.sin(radians);
  const rightX = centerX + halfBeam * Math.cos(radians);
  const rightY = pivotY + halfBeam * Math.sin(radians);
  const leftRimY = leftY + 91;
  const rightRimY = rightY + 91;
  const dossierLines = activeNode?.name === "Consent & confidentiality"
    ? ["Consent &", "confidentiality"]
    : activeNode?.name === "Surveillance & the state"
      ? ["Surveillance &", "the state"]
      : activeNode?.name === "Speech & the internet"
        ? ["Speech &", "the internet"]
        : [activeNode?.name ?? "Case dossier"];

  return (
    <div className="route-hero-stage relative hidden min-w-0 overflow-hidden lg:block" aria-hidden="true">
      <motion.div
        className="absolute left-1/2 top-1 h-[272px] w-[584px]"
        data-case-artwork=""
        style={{ x: "-50%" }}
        initial={false}
        animate={{ y: engaged ? -3 : 0 }}
        transition={reduce ? { duration: 0.2 } : { duration: 0.55, ease: "easeOut" }}
      >
        <svg className="h-full w-full overflow-visible" viewBox="0 0 600 280" fill="none" direction="ltr">
          <defs>
            <linearGradient id="case-brass" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="rgb(var(--gold-rgb))" stopOpacity="0.72" />
              <stop offset="0.45" stopColor="rgb(var(--amber-rgb))" stopOpacity="0.94" />
              <stop offset="1" stopColor="rgb(var(--gold-rgb))" stopOpacity="0.5" />
            </linearGradient>
            <linearGradient id="case-stone" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="var(--surface)" />
              <stop offset="1" stopColor="var(--surface-2)" />
            </linearGradient>
            <filter id="case-shadow" x="-30%" y="-40%" width="160%" height="190%">
              <feDropShadow dx="0" dy="5" stdDeviation="5" floodColor="rgb(var(--text-rgb))" floodOpacity="0.18" />
            </filter>
          </defs>

          <ellipse
            data-balance-part="contact-shadow"
            cx="300"
            cy="268"
            rx="139"
            ry="8"
            fill="rgb(var(--text-rgb))"
            opacity="0.13"
          />
          <g data-balance-part="plinth" filter="url(#case-shadow)">
            <path d="M176 246H424L442 260V270H158V260L176 246Z" fill="url(#case-stone)" stroke="var(--line)" />
            <path d="M176 246H424" stroke="rgb(var(--gold-rgb))" strokeOpacity="0.52" />
            <path d="M188 258H412" stroke="var(--line)" />
            <rect x="274" y="232" width="52" height="19" rx="4" fill="var(--surface-2)" stroke="var(--line)" />
          </g>

          <g data-balance-part="mast">
            <path d="M287 236L290 82H310L313 236Z" fill="url(#case-brass)" stroke="rgb(var(--gold-rgb))" strokeOpacity="0.72" />
            <path d="M294 88V230" stroke="rgb(255 255 255)" strokeOpacity="0.34" />
            <ellipse cx="300" cy="235" rx="28" ry="7" fill="var(--surface-2)" stroke="rgb(var(--gold-rgb))" strokeOpacity="0.64" />
          </g>

          <g data-balance-part="beam">
            <path
              d={`M ${leftX.toFixed(2)} ${(leftY - 5).toFixed(2)} L ${rightX.toFixed(2)} ${(rightY - 5).toFixed(2)} L ${(rightX - 5).toFixed(2)} ${(rightY + 6).toFixed(2)} L ${(leftX + 5).toFixed(2)} ${(leftY + 6).toFixed(2)} Z`}
              fill="url(#case-brass)"
              stroke="rgb(var(--gold-rgb))"
              strokeOpacity="0.78"
            />
            <path d={`M ${leftX.toFixed(2)} ${(leftY - 2).toFixed(2)} L ${rightX.toFixed(2)} ${(rightY - 2).toFixed(2)}`} stroke="rgb(255 255 255)" strokeOpacity="0.42" />
            <circle cx={leftX} cy={leftY} r="5" fill="var(--surface-2)" stroke="rgb(var(--gold-rgb))" />
            <circle cx={rightX} cy={rightY} r="5" fill="var(--surface-2)" stroke="rgb(var(--gold-rgb))" />
          </g>

          <g data-balance-part="fulcrum" filter="url(#case-shadow)">
            <circle cx={centerX} cy={pivotY} r="27" fill="var(--bg)" stroke="rgb(var(--gold-rgb))" strokeWidth="2" />
            <circle cx={centerX} cy={pivotY} r="16" fill="url(#case-brass)" stroke="rgb(var(--gold-rgb))" />
            <circle cx={centerX} cy={pivotY} r="6" fill="var(--surface-2)" stroke="rgb(var(--gold-rgb))" />
            <path d="M286 68H314" stroke="rgb(var(--gold-rgb))" strokeOpacity="0.58" />
          </g>

          <g data-balance-part="left-suspension" stroke="rgb(var(--gold-rgb))" strokeOpacity="0.76">
            <path d={`M ${leftX.toFixed(2)} ${leftY.toFixed(2)} L ${(leftX - 47).toFixed(2)} ${leftRimY.toFixed(2)}`} />
            <path d={`M ${leftX.toFixed(2)} ${leftY.toFixed(2)} L ${(leftX + 47).toFixed(2)} ${leftRimY.toFixed(2)}`} />
            <circle cx={leftX} cy={leftY + 8} r="3" fill="var(--surface-2)" />
          </g>
          <g data-balance-part="right-suspension" stroke="rgb(var(--gold-rgb))" strokeOpacity="0.76">
            <path d={`M ${rightX.toFixed(2)} ${rightY.toFixed(2)} L ${(rightX - 47).toFixed(2)} ${rightRimY.toFixed(2)}`} />
            <path d={`M ${rightX.toFixed(2)} ${rightY.toFixed(2)} L ${(rightX + 47).toFixed(2)} ${rightRimY.toFixed(2)}`} />
            <circle cx={rightX} cy={rightY + 8} r="3" fill="var(--surface-2)" />
          </g>

          <g data-balance-part="left-pan" filter="url(#case-shadow)">
            <path d={`M ${(leftX - 72).toFixed(2)} ${leftRimY.toFixed(2)} H ${(leftX + 72).toFixed(2)} Q ${(leftX + 57).toFixed(2)} ${(leftRimY + 28).toFixed(2)} ${leftX.toFixed(2)} ${(leftRimY + 30).toFixed(2)} Q ${(leftX - 57).toFixed(2)} ${(leftRimY + 28).toFixed(2)} ${(leftX - 72).toFixed(2)} ${leftRimY.toFixed(2)} Z`} fill="url(#case-brass)" stroke="rgb(var(--gold-rgb))" strokeOpacity="0.8" />
            <ellipse cx={leftX} cy={leftRimY} rx="72" ry="9" fill="var(--surface-2)" stroke="rgb(var(--gold-rgb))" strokeOpacity="0.82" />
          </g>
          <g data-balance-part="right-pan" filter="url(#case-shadow)">
            <path d={`M ${(rightX - 72).toFixed(2)} ${rightRimY.toFixed(2)} H ${(rightX + 72).toFixed(2)} Q ${(rightX + 57).toFixed(2)} ${(rightRimY + 28).toFixed(2)} ${rightX.toFixed(2)} ${(rightRimY + 30).toFixed(2)} Q ${(rightX - 57).toFixed(2)} ${(rightRimY + 28).toFixed(2)} ${(rightX - 72).toFixed(2)} ${rightRimY.toFixed(2)} Z`} fill="url(#case-brass)" stroke="rgb(var(--gold-rgb))" strokeOpacity="0.8" />
            <ellipse cx={rightX} cy={rightRimY} rx="72" ry="9" fill="var(--surface-2)" stroke="rgb(var(--gold-rgb))" strokeOpacity="0.82" />
          </g>

          <g data-balance-part="dossier" transform={`translate(${(leftX - 65).toFixed(2)} ${(leftRimY - 65).toFixed(2)})`} filter="url(#case-shadow)">
            <ellipse cx="65" cy="69" rx="55" ry="7" fill="rgb(var(--text-rgb))" opacity="0.16" />
            <path d="M5 8H48L57 0H125V68H5Z" fill="var(--surface)" stroke={color} strokeOpacity="0.78" />
            <path d="M5 8H125" stroke={color} strokeOpacity="0.48" />
            <rect x="14" y="16" width="4" height="4" rx="2" fill={color} />
            <text x="24" y="21" fill={color} fontFamily="var(--font-mono)" fontSize="10.4" fontWeight="600" letterSpacing="1.1">
              DOSSIER {String(active + 1).padStart(2, "0")}
            </text>
            <text x="14" y="40" fill="var(--text)" fontFamily="var(--font-sans)" fontSize="12.5" fontWeight="600">
              {dossierLines.map((line, index) => (
                <tspan key={line} x="14" dy={index === 0 ? 0 : 14}>{line}</tspan>
              ))}
            </text>
            <path d="M14 60H112" stroke="var(--line)" />
          </g>
        </svg>
      </motion.div>
    </div>
  );
}