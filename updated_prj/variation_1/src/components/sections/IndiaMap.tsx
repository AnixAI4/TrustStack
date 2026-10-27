"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Building2, Layers, Target, X, Info } from "lucide-react";
import { INDIA_MAP } from "@/data/india-map";
import { STATE_DPDP } from "@/data/state-dpdp";
import { EASE } from "@/lib/motion";

type StateInfo = {
  r: number;
  hubs: string[];
  sectors: string[];
  focus: string;
  fact: string;
};

const STATES = STATE_DPDP as Record<string, StateInfo>;

function info(id: string): StateInfo | undefined {
  return STATES[id];
}

// City "data hubs" placed as a fraction of each state's bounding box, plus the
// flow arcs between them - mirrors the original loved hero feature.
const HUBS: { id: string; city: string; fx: number; fy: number }[] = [
  { id: "dl", city: "Delhi", fx: 0.5, fy: 0.5 },
  { id: "mh", city: "Mumbai", fx: 0.12, fy: 0.5 },
  { id: "ld", city: "Kavaratti", fx: 0.5, fy: 0.5 },
  { id: "tg", city: "Hyderabad", fx: 0.5, fy: 0.52 },
  { id: "ka", city: "Bengaluru", fx: 0.5, fy: 0.82 },
  { id: "tn", city: "Chennai", fx: 0.82, fy: 0.42 },
  { id: "wb", city: "Kolkata", fx: 0.6, fy: 0.8 },
];
const LINKS: [string, string][] = [
  ["dl", "mh"],
  ["dl", "wb"],
  ["mh", "tg"],
  ["tg", "ka"],
  ["ka", "tn"],
  ["wb", "tg"],
  ["mh", "ka"],
  ["dl", "tg"],
];

const FLAG_GRADIENT_ID = "imap-tricolor-gradient";

type Pt = { x: number; y: number; city: string };

export function IndiaMap() {
  const [selected, setSelected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [tip, setTip] = useState<{ x: number; y: number; name: string } | null>(
    null
  );
  const [explored, setExplored] = useState<Set<string>>(() => new Set());
  const [hubPts, setHubPts] = useState<Record<string, Pt>>({});
  const [flows, setFlows] = useState<{ d: string; dur: number }[]>([]);
  const [reduce, setReduce] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  const byId = useMemo(() => {
    const m = new Map<string, string>();
    INDIA_MAP.locations.forEach((l) => m.set(l.id, l.name));
    return m;
  }, []);

  // Respect reduced-motion for the flowing dots + hub pulse.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduce(mq.matches);
    sync();
    mq.addEventListener?.("change", sync);
    return () => mq.removeEventListener?.("change", sync);
  }, []);

  // Derive hub points + flow arcs from the rendered state geometry (getBBox).
  // getBBox returns 0 until the SVG is actually laid out (e.g. while still in a
  // suspense/hidden stage), so retry via a ResizeObserver until it's measurable.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    let done = false;

    const compute = () => {
      const probe = svg.querySelector<SVGPathElement>('[data-id="dl"]');
      if (!probe) return;
      let pb: DOMRect;
      try {
        pb = probe.getBBox();
      } catch {
        return;
      }
      if (!pb.width) return; // not laid out yet

      const pts: Record<string, Pt> = {};
      HUBS.forEach((h) => {
        const el = svg.querySelector<SVGPathElement>(`[data-id="${h.id}"]`);
        if (!el) return;
        const b = el.getBBox();
        pts[h.id] = {
          x: b.x + b.width * h.fx,
          y: b.y + b.height * h.fy,
          city: h.city,
        };
      });
      const fl: { d: string; dur: number }[] = [];
      LINKS.forEach((l, i) => {
        const a = pts[l[0]];
        const b = pts[l[1]];
        if (!a || !b) return;
        const mx = (a.x + b.x) / 2;
        const my = (a.y + b.y) / 2;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const len = Math.hypot(dx, dy) || 1;
        const bend = Math.min(34, len * 0.22);
        const cx = mx + (-dy / len) * bend;
        const cy = my + (dx / len) * bend;
        fl.push({
          d: `M${a.x},${a.y} Q${cx},${cy} ${b.x},${b.y}`,
          dur: 2.4 + i * 0.45,
        });
      });
      setHubPts(pts);
      setFlows(fl);
      done = true;
    };

    compute();
    if (done) return;
    const ro = new ResizeObserver(() => {
      if (!done) compute();
    });
    ro.observe(svg);
    return () => ro.disconnect();
  }, []);

  const fillFor = (id: string) => {
    if (id === selected) return "rgb(var(--accent-rgb) / 0.68)";
    if (id === hovered) return "rgb(var(--accent-rgb) / 0.42)";
    if (id === "ld") return "rgb(var(--accent-rgb) / 0.42)";
    return `url(#${FLAG_GRADIENT_ID})`;
  };

  const selectState = (id: string) => {
    setSelected((prev) => (prev === id ? null : id));
    setExplored((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  const sel = selected ? info(selected) : undefined;
  const selName = selected ? byId.get(selected) : undefined;

  return (
    <div className="imap-card imap-floating relative w-full max-w-full overflow-visible p-0">
            {/* Premium ambient backdrop: glow + dot-grid + coverage rings */}
            <div className="imap-bg" aria-hidden="true" />
            {tip && (
              <div
                className="imap-tip"
                style={{ left: tip.x + 12, top: tip.y + 12 }}
              >
                {tip.name}
              </div>
            )}

            <svg
              ref={svgRef}
              viewBox={INDIA_MAP.viewBox}
              className="imap-svg relative z-[1] h-auto w-full"
              role="img"
              aria-label="Interactive map of India - select a state"
              onMouseLeave={() => {
                setHovered(null);
                setTip(null);
              }}
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                if (hovered)
                  setTip({
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top,
                    name: byId.get(hovered) || "",
                  });
              }}
            >
              <defs>
                <linearGradient
                  id={FLAG_GRADIENT_ID}
                  gradientUnits="userSpaceOnUse"
                  x1="90"
                  y1="80"
                  x2="530"
                  y2="640"
                >
                  <stop offset="0%" stopColor="rgb(var(--accent-rgb) / 0.18)" />
                  <stop offset="26%" stopColor="rgb(var(--amber-rgb) / 0.15)" />
                  <stop offset="43%" stopColor="rgb(255 255 255 / 0.32)" />
                  <stop offset="57%" stopColor="rgb(255 255 255 / 0.24)" />
                  <stop offset="74%" stopColor="rgb(var(--green-rgb) / 0.24)" />
                  <stop offset="100%" stopColor="rgb(var(--green-rgb) / 0.38)" />
                  {!reduce && (
                    <animateTransform
                      attributeName="gradientTransform"
                      type="translate"
                      values="-90 -58; 90 58; -90 -58"
                      dur="18s"
                      calcMode="spline"
                      keySplines="0.42 0 0.58 1; 0.42 0 0.58 1"
                      repeatCount="indefinite"
                    />
                  )}
                </linearGradient>
              </defs>

              {INDIA_MAP.locations.map((loc) => (
                <path
                  key={loc.id}
                  data-id={loc.id}
                  d={loc.path}
                  fill={fillFor(loc.id)}
                  stroke={
                    loc.id === selected
                      ? "rgb(var(--accent-rgb))"
                      : loc.id === "ld"
                        ? "rgb(var(--accent-rgb) / 0.85)"
                      : "rgb(var(--text-rgb) / 0.46)"
                  }
                  strokeWidth={loc.id === selected ? 1.7 : loc.id === "ld" ? 1.35 : 1.15}
                  vectorEffect="non-scaling-stroke"
                  tabIndex={0}
                  role="button"
                  aria-label={loc.name}
                  style={{ cursor: "pointer", transition: "fill .2s, stroke .2s" }}
                  onMouseEnter={() => setHovered(loc.id)}
                  onClick={() => selectState(loc.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      selectState(loc.id);
                    }
                  }}
                />
              ))}

              <g className="imap-flows" style={{ pointerEvents: "none" }}>
                {flows.map((f, i) => (
                  <g key={i}>
                    <path className="imap-flow-line" d={f.d} />
                    {!reduce && (
                      <circle className="imap-flow-dot" r={2.6}>
                        <animateMotion
                          dur={`${f.dur}s`}
                          repeatCount="indefinite"
                          path={f.d}
                          rotate="auto"
                        />
                      </circle>
                    )}
                  </g>
                ))}
              </g>

              <g className="imap-hubs">
                {Object.entries(hubPts).map(([id, p]) => (
                  <g
                    key={id}
                    className="imap-hub"
                    transform={`translate(${p.x},${p.y})`}
                    tabIndex={0}
                    role="button"
                    aria-label={`${p.city} - data hub`}
                  >
                    {!reduce && <circle className="imap-hub-pulse" r={3} />}
                    <circle className="imap-hub-core" r={3} />
                    <text className="imap-hub-label" x={6} y={3.5}>
                      {p.city}
                    </text>
                  </g>
                ))}
              </g>
            </svg>

            <div className="imap-readout">
              <span className="imap-dotk" aria-hidden="true" />
              <span className="imap-rd-text">
                Protecting <b>{selName ?? "every state of India"}</b> · under
                the DPDP Act, 2023
              </span>
              <span className="imap-rd-hint">
                <b>{explored.size}</b> explored · tap a state
              </span>
            </div>

            <div className="imap-legend" aria-hidden="true">
              <span>
                <i className="imap-lg-state" /> State / UT
              </span>
              <span>
                <i className="imap-lg-hub" /> Data hub
              </span>
              <span>
                <i className="imap-lg-flow" /> Data flow
              </span>
            </div>

            {/* Slide-over state snapshot (over the map, like the original) */}
            <AnimatePresence>
              {sel && selName && (
                <motion.div
                  key={selected}
                  initial={{ x: "102%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "102%" }}
                  transition={{ duration: 0.4, ease: EASE }}
                  className="absolute inset-0 z-[6] flex flex-col gap-2 overflow-y-auto rounded-2xl border border-line bg-surface p-5"
                >
                  <button
                    type="button"
                    onClick={() => setSelected(null)}
                    aria-label="Close state panel"
                    className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-lg border border-line bg-surface-2 text-text-muted transition-colors hover:text-text"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <span className="font-mono text-label font-bold uppercase tracking-[0.14em] text-accent">
                    DPDP snapshot · illustrative
                  </span>
                  <h3 className="pr-9 font-display text-2xl font-semibold leading-tight text-text">
                    {selName}
                  </h3>
                  <div className="mt-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-text-muted">Awareness index</span>
                      <span className="font-semibold text-text">{sel.r}/100</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-pill bg-line">
                      <div
                        className="h-full rounded-pill bg-gradient-to-r from-accent to-amber"
                        style={{ width: `${sel.r}%` }}
                      />
                    </div>
                    <p className="mt-2 flex items-start gap-1.5 text-label leading-snug text-text-faint">
                      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                      Illustrative only - not validated against official or live compliance data.
                      For awareness, not benchmarking.
                    </p>
                  </div>
                  <Block icon={Building2} title="Data hubs" items={sel.hubs} href="/industries" />
                  <Block icon={Layers} title="Sectors" items={sel.sectors} href="/industries" />
                  <div className="mt-3 flex items-start gap-2">
                    <Target className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    <p className="text-sm text-text">{sel.focus}</p>
                  </div>
                  <p className="mt-3 border-t border-line pt-3 text-xs text-text-faint">
                    {sel.fact}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
  );
}

function Block({
  icon: Icon,
  title,
  items,
  href,
}: {
  icon: typeof Building2;
  title: string;
  items: string[];
  href?: string;
}) {
  return (
    <div className="mt-4">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-text-faint" />
        <span className="font-mono text-label uppercase tracking-wider text-text-faint">
          {title}
        </span>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {items.map((it) =>
          href ? (
            <Link
              key={it}
              href={href}
              className="rounded-pill border border-line bg-glass px-2.5 py-1 text-xs text-text-muted transition-colors hover:border-accent/40 hover:text-accent"
            >
              {it}
            </Link>
          ) : (
            <span
              key={it}
              className="rounded-pill border border-line bg-glass px-2.5 py-1 text-xs text-text-muted"
            >
              {it}
            </span>
          )
        )}
      </div>
    </div>
  );
}
