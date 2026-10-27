"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Baby,
  Building2,
  FileSignature,
  Landmark,
  Layers,
  LockKeyhole,
  Scale,
  ShieldCheck,
  UserCheck,
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
  layers: Layers,
  "file-signature": FileSignature,
  scale: Scale,
  "user-check": UserCheck,
  "lock-keyhole": LockKeyhole,
  baby: Baby,
  "building-2": Building2,
  landmark: Landmark,
};

export function CertificationPressHero({
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
      3800
    );
    return () => clearTimeout(timer);
  }, [active, nodes.length, reduce]);

  return (
    <section
      className="page-hero route-hero-technical relative overflow-hidden border-b border-line"
      data-credential-press=""
      data-module-index={active}
      data-module={activeNode?.name ?? ""}
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
            "radial-gradient(circle at 73% 50%, rgb(var(--gold-rgb) / 0.1), transparent 32%), linear-gradient(rgb(var(--gold-rgb) / 0.05) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--green-rgb) / 0.04) 1px, transparent 1px)",
          backgroundSize: "auto, 42px 42px, 42px 42px",
          maskImage: "linear-gradient(90deg, transparent, black 30%, black)",
        }}
      />

      <div className="route-hero-inner container-x">
        <div className="route-hero-grid lg:grid-cols-[0.7fr_1.3fr]">
          <div className="relative z-10 min-w-0">
            <p className="font-mono text-label font-semibold uppercase tracking-wider text-text-faint">
              Credential production line
            </p>
            <h1 className="route-hero-title mt-3 min-w-0 font-display font-bold tracking-tight text-text [overflow-wrap:anywhere]">
              <span data-rm="normal">{word}</span>
              <span data-rm="easy">{easyWord ?? word}</span>
            </h1>
            <div key={activeNode?.name} className="mt-5" aria-live="polite">
              <div className="font-mono text-label uppercase tracking-wider text-text-faint">
                Module {String(active + 1).padStart(2, "0")} /{" "}
                {String(nodes.length).padStart(2, "0")}
              </div>
              <p
                className="mt-2 font-display text-3xl font-semibold leading-tight [overflow-wrap:anywhere]"
                style={{ color: activeColor }}
              >
                {activeNode?.name}
              </p>
              <p className="mt-3 max-w-lg text-base leading-relaxed text-text-muted">
                Eight section-mapped modules feed one employer-verifiable DPDP
                credential.
              </p>
            </div>
          </div>

          <CredentialPress
            nodes={nodes}
            active={active}
            engaged={engaged}
            reduce={reduce}
          />
        </div>

        <div
          className="route-hero-tabs border-t border-line lg:grid-cols-8"
          role="tablist"
          aria-label="Certification modules"
        >
          {nodes.map((node, index) => {
            const Icon = ICONS[node.iconKey] ?? ShieldCheck;
            const selected = index === active;
            return (
              <button
                key={node.name}
                type="button"
                role="tab"
                aria-selected={selected}
                title={node.name}
                onClick={() => setActive(index)}
                className={`group relative flex min-h-20 min-w-0 items-center gap-2 border-b border-line px-2 text-left transition-colors hover:bg-surface-2/60 lg:border-b-0 lg:border-r lg:last:border-r-0 ${
                  selected ? "bg-surface-2/70" : ""
                }`}
              >
                {selected && <HeroTabGlow colorVar={COLORS[node.colorKey]} reduce={reduce} />}
                <Icon
                  className="relative h-4 w-4 shrink-0"
                  style={{ color: `rgb(${COLORS[node.colorKey]})` }}
                  strokeWidth={1.6}
                />
                <span
                  className={`relative min-w-0 truncate ${
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

function CredentialPress({
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

  return (
    <div
      className="route-hero-stage route-hero-stage-compact relative hidden min-w-0 overflow-hidden lg:block"
      aria-hidden="true"
      data-credential-press-model=""
    >
      {/*
        The frame fills the stage exactly via top-0/bottom-0 (not a fixed
        height on top of an offset) so it can never be taller than the
        stage and get clipped at the bottom.
      */}
      <div className="absolute left-1/2 top-0 bottom-0 w-[540px] -translate-x-1/2">
        <motion.div
          className="absolute inset-0"
          initial={false}
          animate={{ y: engaged ? -3 : 0 }}
          transition={
            reduce ? { duration: 0.2 } : { duration: 0.55, ease: "easeOut" }
          }
        >
          {/* Side pillars - anchored top+bottom so height always matches the frame. */}
          <div className="absolute left-[48px] top-16 bottom-3 w-6 border border-line bg-surface shadow-card" />
          <div className="absolute right-[48px] top-16 bottom-3 w-6 border border-line bg-surface shadow-card" />

          {/* Header rail */}
          <div className="absolute left-[32px] right-[32px] top-2 h-11 border border-line bg-surface shadow-card">
            <div className="flex h-full items-center justify-between px-5">
              <span className="font-mono text-label font-semibold uppercase tracking-wider text-gold">
                CDPP Credential Press
              </span>
              <span className="font-display text-xl font-semibold text-text">
                {String(nodes.length).padStart(2, "0")}
              </span>
            </div>
            <motion.span
              className="absolute -bottom-px left-5 right-5 h-px origin-center bg-gold"
              animate={{
                scaleX: reduce ? 0.35 : [0.3, 1, 0.3],
                opacity: reduce ? 0.45 : [0.3, 1, 0.3],
              }}
              transition={
                reduce
                  ? { duration: 0 }
                  : {
                      duration: engaged ? 1.5 : 3.8,
                      ease: "easeInOut",
                      repeat: Infinity,
                    }
              }
            />
          </div>

          {/* Press chamber - anchored top+bottom, certificate sheet lives fully inside. */}
          <div className="absolute left-[72px] right-[72px] top-16 bottom-6 overflow-hidden border border-line bg-bg shadow-[inset_0_0_40px_rgb(var(--text-rgb)/0.05)]">
            <motion.div
              className="absolute inset-x-4 top-4 h-px bg-gold/70"
              animate={{
                scaleX: reduce ? 1 : [0.15, 1, 0.15],
                opacity: reduce ? 0.45 : [0.15, 0.9, 0.15],
              }}
              transition={{
                duration: reduce ? 0 : 2.6,
                ease: "easeInOut",
                repeat: reduce ? 0 : Infinity,
              }}
            />

            {/*
              Certificate sheet. Extra top padding (pt-9) reserves clear
              space for the seal so the stamp never sits on top of the
              title text - the seal straddles the sheet's top-right corner,
              a spot with no copy under it, mimicking a real embossed stamp.
            */}
            <div className="absolute bottom-4 left-1/2 h-[152px] w-[268px] -translate-x-1/2 overflow-hidden border border-line bg-surface-2 px-5 pb-4 pt-4 shadow-card">
              <div className="max-w-[74%]">
                <p className="font-mono text-[10px] font-semibold uppercase leading-tight tracking-wide text-gold">
                  TrustStack Certification
                </p>
                <p className="mt-1.5 font-display text-base font-semibold leading-snug text-text">
                  DPDP Practitioner
                </p>
              </div>
              <div className="mt-3 h-px w-full bg-line" />
              <p className="mt-2 font-mono text-label uppercase tracking-wider text-text-faint">
                Module {String(active + 1).padStart(2, "0")}
              </p>
              <p className="mt-0.5 truncate text-sm font-medium text-text">
                {activeNode?.short}
              </p>
              <motion.span
                className="pointer-events-none absolute inset-y-0 w-16 bg-gradient-to-r from-transparent via-gold/15 to-transparent"
                animate={{ x: reduce ? 240 : [-80, 300] }}
                transition={{
                  duration: reduce ? 0 : 3.8,
                  ease: "easeInOut",
                  repeat: reduce ? 0 : Infinity,
                  repeatDelay: 0.7,
                }}
              />
            </div>

            {/*
              Single seal instance (no AnimatePresence) stamped over the
              sheet's empty top-right corner - never above the title text.
              Motion is local: a short press bounce, no vertical travel that
              could clip above the chamber.
            */}
            <motion.div
              key={active}
              className="absolute bottom-[130px] right-[36px] z-20 grid h-14 w-14 place-items-center rounded-full border-[3px] bg-bg shadow-[0_10px_22px_-8px_rgb(var(--gold-rgb)/0.65)]"
              style={{ borderColor: color }}
              initial={reduce ? false : { scale: 0.85, opacity: 0.55 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={
                reduce
                  ? { duration: 0.2 }
                  : { type: "spring", stiffness: 380, damping: 22 }
              }
            >
              <motion.div
                className="grid h-9 w-9 place-items-center rounded-full border-2 border-dashed"
                style={{ borderColor: color, color }}
                animate={{ rotate: reduce ? 0 : 360 }}
                transition={
                  reduce
                    ? { duration: 0 }
                    : { duration: 9, ease: "linear", repeat: Infinity }
                }
              >
                <ShieldCheck className="h-4 w-4" strokeWidth={1.6} />
              </motion.div>
            </motion.div>
          </div>

          {/* Base rail */}
          <div className="absolute bottom-1 left-[24px] right-[24px] h-4 border border-line bg-surface-2" />

          {/* Module counter chips - kept inside the 540px frame */}
          <div className="absolute right-1 top-[68px] grid grid-cols-2 gap-1.5">
            {nodes.map((node, index) => (
              <motion.span
                key={node.name}
                className="grid h-8 w-8 place-items-center border border-line bg-surface font-mono text-label text-text-faint"
                animate={{
                  borderColor:
                    index <= active
                      ? `rgb(${COLORS[node.colorKey]} / 0.7)`
                      : "var(--line)",
                  color:
                    index <= active
                      ? `rgb(${COLORS[node.colorKey]})`
                      : "var(--text-faint)",
                }}
              >
                {String(index + 1).padStart(2, "0")}
              </motion.span>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
