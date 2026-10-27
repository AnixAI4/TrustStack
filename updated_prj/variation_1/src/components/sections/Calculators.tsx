"use client";

import { useEffect, useMemo, useState } from "react";
import { IndianRupee, TrendingUp, ShieldAlert } from "lucide-react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { cn } from "@/lib/cn";
import { markCalcUsed } from "@/lib/progress";

function inr(n: number): string {
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)} cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(2)} L`;
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

const TABS = [
  { key: "penalty", label: "Penalty estimator", icon: IndianRupee },
  { key: "roi", label: "Compliance ROI", icon: TrendingUp },
  { key: "breach", label: "Breach cost", icon: ShieldAlert },
] as const;

const PENALTY_TYPES = [
  { label: "Security-safeguards failure", cap: 250e7, sec: "S.8(5)" },
  { label: "Breach-notification failure", cap: 200e7, sec: "S.8(6)" },
  { label: "Children's-data obligations", cap: 200e7, sec: "S.9" },
  { label: "Significant Data Fiduciary duties", cap: 150e7, sec: "S.10" },
  { label: "Other provisions", cap: 50e7, sec: " - " },
];

function Range({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  hint?: string;
}) {
  return (
    <label className="block">
      <div className="flex items-center justify-between text-sm">
        <span className="text-text-muted">{label}</span>
        {hint && <span className="font-mono text-xs text-accent">{hint}</span>}
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 h-1.5 w-full cursor-pointer appearance-none rounded-pill bg-line [accent-color:var(--accent)]"
        style={{ accentColor: "var(--accent)" }}
      />
    </label>
  );
}

function Out({ label, value, big }: { label: string; value: string; big?: boolean }) {
  return (
    <div className="rounded-lg border border-line bg-bg-2/40 p-4">
      <div className="font-mono text-label uppercase tracking-wider text-text-faint">
        {label}
      </div>
      <div
        className={cn(
          "mt-1 font-display font-semibold text-text",
          big ? "text-2xl" : "text-lg"
        )}
      >
        {value}
      </div>
    </div>
  );
}

function PenaltyCalc() {
  const [type, setType] = useState(0);
  const [scale, setScale] = useState(40);
  const [duration, setDuration] = useState(30);
  const [repeat, setRepeat] = useState(10);
  const [gain, setGain] = useState(20);
  const [mitigation, setMitigation] = useState(30);

  const t = PENALTY_TYPES[type];
  const factor = Math.min(
    1,
    Math.max(
      0.02,
      ((scale * 0.3 + duration * 0.25 + repeat * 0.2 + gain * 0.25) / 100) *
        (1 - (mitigation / 100) * 0.5)
    )
  );
  const estimate = t.cap * factor;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <label className="block">
          <span className="text-sm text-text-muted">Type of breach</span>
          <select
            value={type}
            onChange={(e) => setType(Number(e.target.value))}
            className="mt-2 w-full rounded-lg border border-line bg-bg-2/60 px-3 py-2.5 text-sm text-text outline-none focus:border-accent/50"
          >
            {PENALTY_TYPES.map((p, i) => (
              <option key={p.label} value={i} className="bg-bg-2">
                {p.label} (Cap {inr(p.cap)}, {p.sec})
              </option>
            ))}
          </select>
        </label>
        <Range label="Data principals affected" value={scale} onChange={setScale} />
        <Range label="Duration unaddressed" value={duration} onChange={setDuration} />
        <Range label="Repetitive nature" value={repeat} onChange={setRepeat} />
        <Range label="Gain realized" value={gain} onChange={setGain} />
        <Range label="Mitigation taken" value={mitigation} onChange={setMitigation} hint="reduces" />
      </div>
      <div className="space-y-3">
        <Out label="Estimated penalty exposure" value={inr(estimate)} big />
        <div className="grid grid-cols-2 gap-3">
          <Out label="Likely range (low)" value={inr(estimate * 0.7)} />
          <Out label="Likely range (high)" value={inr(Math.min(t.cap, estimate * 1.15))} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Out label="Statutory cap" value={inr(t.cap)} />
          <Out label="Section" value={t.sec} />
        </div>
        <p className="text-xs text-text-faint">
          Indicative only, never legal advice. Penalties are fixed by the Data
          Protection Board on the factors in Section 33(2).
        </p>
      </div>
    </div>
  );
}

function RoiCalc() {
  const [records, setRecords] = useState(50);
  const [industry, setIndustry] = useState(1);
  const [maturity, setMaturity] = useState(30);
  const [invest, setInvest] = useState(40);

  const recordCount = Math.round(10000 * Math.pow(10, records / 33));
  const industryMult = [0.8, 1, 1.4, 1.8][industry];
  const investAmount = Math.round(200000 * Math.pow(10, invest / 50));
  const exposure = recordCount * 35 * industryMult * (1 - maturity / 200);
  const residual = exposure * (1 - Math.min(0.85, investAmount / (exposure + 1)));
  const roi = ((exposure - residual - investAmount) / (investAmount + 1)) * 100;
  const payback = Math.max(1, Math.round((investAmount / ((exposure - residual) / 12 + 1))));

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <Range label="Personal-data records" value={records} onChange={setRecords} hint={recordCount.toLocaleString("en-IN")} />
        <label className="block">
          <span className="text-sm text-text-muted">Industry</span>
          <select
            value={industry}
            onChange={(e) => setIndustry(Number(e.target.value))}
            className="mt-2 w-full rounded-lg border border-line bg-bg-2/60 px-3 py-2.5 text-sm text-text outline-none focus:border-accent/50"
          >
            {["E-commerce / SME", "Standard", "Healthcare / Education", "BFSI"].map(
              (n, i) => (
                <option key={n} value={i} className="bg-bg-2">
                  {n}
                </option>
              )
            )}
          </select>
        </label>
        <Range label="Current DPDP maturity" value={maturity} onChange={setMaturity} hint={`${maturity}%`} />
        <Range label="Planned annual investment" value={invest} onChange={setInvest} hint={inr(investAmount)} />
      </div>
      <div className="space-y-3">
        <Out label="Risk exposure / yr" value={inr(exposure)} big />
        <div className="grid grid-cols-2 gap-3">
          <Out label="Residual exposure" value={inr(residual)} />
          <Out label="Return on investment" value={`${Math.round(roi)}%`} />
        </div>
        <Out label="Payback period" value={`${payback} months`} />
        <p className="text-xs text-text-faint">
          Indicative model comparing breach-cost exposure against compliance
          investment. Not a guarantee of outcomes.
        </p>
      </div>
    </div>
  );
}

function BreachCalc() {
  const [records, setRecords] = useState(50);
  const [sensitivity, setSensitivity] = useState(1);
  const [detect, setDetect] = useState(40);

  const recordCount = Math.round(5000 * Math.pow(10, records / 33));
  const sensMult = [1, 1.6, 2.4][sensitivity];
  const detectMult = 1 + detect / 120;
  const perRecord = 280 * sensMult * detectMult;
  const total = recordCount * perRecord;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <Range label="Records exposed" value={records} onChange={setRecords} hint={recordCount.toLocaleString("en-IN")} />
        <label className="block">
          <span className="text-sm text-text-muted">Data sensitivity</span>
          <select
            value={sensitivity}
            onChange={(e) => setSensitivity(Number(e.target.value))}
            className="mt-2 w-full rounded-lg border border-line bg-bg-2/60 px-3 py-2.5 text-sm text-text outline-none focus:border-accent/50"
          >
            {["Basic identifiers", "Financial / contact", "Health / children"].map(
              (n, i) => (
                <option key={n} value={i} className="bg-bg-2">
                  {n}
                </option>
              )
            )}
          </select>
        </label>
        <Range label="Time to detect" value={detect} onChange={setDetect} hint={`${Math.round(detect * 1.8)} days`} />
      </div>
      <div className="space-y-3">
        <Out label="Total breach cost" value={inr(total)} big />
        <div className="grid grid-cols-2 gap-3">
          <Out label="Per-record cost" value={inr(perRecord)} />
          <Out label="Records" value={recordCount.toLocaleString("en-IN")} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Out label="Detection & response" value={inr(total * 0.35)} />
          <Out label="Notification & legal" value={inr(total * 0.4)} />
        </div>
        <p className="text-xs text-text-faint">
          Indicative model across detection, notification, legal and remediation
          drivers. Not legal or actuarial advice.
        </p>
      </div>
    </div>
  );
}

export function Calculators({ id }: { id?: string }) {
  const [tab, setTab] = useState(0);
  useEffect(() => {
    markCalcUsed();
  }, [tab]);
  const Body = useMemo(() => [PenaltyCalc, RoiCalc, BreachCalc][tab], [tab]);

  return (
    <section id={id} className="section scroll-mt-24">
      <div className="container-x">
        <SectionHeader
          eyebrow="DPDP Calculators · Section 33 ready-reckoner"
          title="Model your DPDP exposure in real numbers"
          lede="Three quick, on-device estimators - penalty exposure, compliance ROI and breach cost. Move the sliders to see how scale, sensitivity and mitigation change the picture. Indicative figures only, never legal advice."
        />

        <div className="mt-10 rounded-xl border border-line bg-surface-2/40 p-6 sm:p-8">
          <div className="flex flex-wrap gap-2">
            {TABS.map((t, i) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(i)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-pill border px-4 py-2 text-sm font-medium transition-all",
                    i === tab
                      ? "border-accent/50 bg-accent/10 text-text"
                      : "border-line text-text-muted hover:border-accent/30 hover:text-text"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {t.label}
                </button>
              );
            })}
          </div>
          <div className="mt-8">
            <Body />
          </div>
        </div>
      </div>
    </section>
  );
}
