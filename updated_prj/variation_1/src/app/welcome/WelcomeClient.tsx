"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Check,
  X,
  Shield,
  Sparkles,
  FileText,
  Award,
  Scan,
  Bot,
  Wrench,
  ArrowRight,
  Zap,
} from "lucide-react";
import { Logo } from "@/components/site/Logo";
import { BRAND } from "@/content/site";
import {
  clearPilotCheckoutPending,
  markPilotCheckoutPending,
} from "@/lib/pilot-checkout";

type PlanType = "free" | "pilot";

interface FeatureItem {
  name: string;
  icon: React.ReactNode;
  free: boolean | string;
  pilot: boolean | string;
}

const features: FeatureItem[] = [
  {
    name: "Policy Templates (15+)",
    icon: <FileText className="h-4 w-4" />,
    free: false,
    pilot: true,
  },
  {
    name: "Certification Modules (8)",
    icon: <Award className="h-4 w-4" />,
    free: false,
    pilot: true,
  },
  {
    name: "Tools & Utilities",
    icon: <Wrench className="h-4 w-4" />,
    free: false,
    pilot: true,
  },
  {
    name: "DPDP Compliance Scanner",
    icon: <Scan className="h-4 w-4" />,
    free: "1 preview",
    pilot: "1/day",
  },
  {
    name: "TrustChat AI (Coming Soon)",
    icon: <Bot className="h-4 w-4" />,
    free: false,
    pilot: true,
  },
  {
    name: "Learn & Quiz",
    icon: <Sparkles className="h-4 w-4" />,
    free: true,
    pilot: true,
  },
  {
    name: "Act & Rules Reference",
    icon: <Shield className="h-4 w-4" />,
    free: true,
    pilot: true,
  },
];

function FeatureRow({ feature, plan }: { feature: FeatureItem; plan: PlanType }) {
  const value = plan === "free" ? feature.free : feature.pilot;
  const isIncluded = value === true || typeof value === "string";

  return (
    <li className="flex items-center gap-3 py-2">
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
          isIncluded
            ? "bg-accent/15 text-accent"
            : "bg-surface-2 text-text-faint"
        }`}
      >
        {isIncluded ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
      </span>
      <span className="flex items-center gap-2 text-sm text-text">
        <span className={isIncluded ? "text-accent" : "text-text-faint"}>
          {feature.icon}
        </span>
        <span className={!isIncluded ? "text-text-faint" : ""}>
          {feature.name}
        </span>
      </span>
      {typeof value === "string" && (
        <span className="ml-auto rounded-full border border-line bg-surface-2/60 px-2 py-0.5 text-xs text-text-muted">
          {value}
        </span>
      )}
    </li>
  );
}

export function WelcomeClient() {
  const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null);

  return (
    <div className="welcome-screen relative isolate min-h-screen overflow-hidden bg-bg text-text">
      <div className="welcome-field" aria-hidden="true">
        <div className="welcome-field__grid" />
        <div className="welcome-field__beam welcome-field__beam--primary" />
        <div className="welcome-field__beam welcome-field__beam--secondary" />
        <div className="welcome-field__runner welcome-field__runner--one" />
        <div className="welcome-field__runner welcome-field__runner--two" />
        <div className="welcome-field__runner welcome-field__runner--three" />
        <div className="welcome-field__orb welcome-field__orb--one" />
        <div className="welcome-field__orb welcome-field__orb--two" />
        <div className="welcome-field__vignette" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <header className="mb-12 flex items-center justify-center">
          <Logo size={40} withWordmark />
        </header>

        <div className="text-center">
          <span className="badge">
            <Zap className="h-3.5 w-3.5" />
            Pilot Program · Limited time
          </span>

          <h1 className="mt-6 font-display text-4xl font-semibold tracking-tight text-text sm:text-5xl lg:text-6xl">
            Welcome to{" "}
            <span className="text-accent">{BRAND.name}</span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-text-muted sm:text-lg">
            Choose how you want to start - Free for essentials, or Pilot for the
            full compliance stack: templates, certifications, tools, and daily scans.
          </p>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-2 lg:gap-8">
          {/* Free */}
          <div
            className={`welcome-card relative rounded-2xl border bg-surface-2/40 p-7 transition-all sm:p-8 ${
              selectedPlan === "free"
                ? "border-accent/50 shadow-[0_0_0_1px_color-mix(in_srgb,var(--accent)_30%,transparent)]"
                : "border-line hover:border-accent/35"
            }`}
          >
            <div className="mb-6">
              <h2 className="font-display text-2xl font-semibold text-text">Free</h2>
              <p className="mt-2 text-sm text-text-muted">
                Explore the basics with limited access
              </p>
            </div>

            <div className="mb-8">
              <span className="font-display text-2xl font-semibold text-text">
                Included
              </span>
              <p className="mt-1 text-sm text-text-faint">No commitment required</p>
            </div>

            <ul className="mb-8 space-y-0.5 border-t border-line pt-5">
              {features.map((feature) => (
                <FeatureRow key={feature.name} feature={feature} plan="free" />
              ))}
            </ul>

            <div className="space-y-3">
              <Link
                href="/auth/sign-up?plan=free"
                onClick={() => {
                  setSelectedPlan("free");
                  clearPilotCheckoutPending();
                }}
                className="btn btn-ghost w-full justify-center"
              >
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </Link>
              <p className="text-center text-xs text-text-faint">
                Additional scan credits available after your free preview
              </p>
            </div>
          </div>

          {/* Pilot */}
          <div
            className={`welcome-card welcome-card--pilot relative rounded-2xl border p-7 transition-all sm:p-8 ${
              selectedPlan === "pilot"
                ? "border-accent shadow-[0_0_0_1px_color-mix(in_srgb,var(--accent)_40%,transparent)]"
                : "border-accent/40 hover:border-accent/70"
            }`}
            style={{
              background:
                "linear-gradient(165deg, color-mix(in srgb, var(--accent) 10%, var(--surface-2)) 0%, color-mix(in srgb, var(--brand) 6%, var(--bg-2)) 100%)",
            }}
          >
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="badge badge-gold">Recommended</span>
            </div>

            <div className="mb-6">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-2xl font-semibold text-text">Pilot</h2>
              </div>
              <p className="mt-2 text-sm text-text-muted">
                Full unlock of all {BRAND.name} features
              </p>
            </div>

            <div className="mb-8">
              <span className="font-display text-2xl font-semibold text-text">
                Professional access
              </span>
              <p className="mt-1 text-sm text-text-muted">
                Complete workspace · billed securely at checkout
              </p>
            </div>

            <ul className="mb-8 space-y-0.5 border-t border-line pt-5">
              {features.map((feature) => (
                <FeatureRow key={feature.name} feature={feature} plan="pilot" />
              ))}
            </ul>

            <div className="space-y-3">
              <Link
                href="/auth/sign-up?plan=pilot"
                onClick={() => {
                  setSelectedPlan("pilot");
                  markPilotCheckoutPending();
                }}
                className="btn btn-accent w-full justify-center"
              >
                Start Pilot Access
                <ArrowRight className="h-4 w-4" />
              </Link>
              <p className="text-center text-xs text-text-muted">
                1 full scan per day · all features unlocked
              </p>
            </div>
          </div>
        </div>

        <p className="mt-10 text-center text-sm text-text-muted">
          Already have an account?{" "}
          <Link href="/auth/sign-in" className="text-accent hover:underline">
            Sign in
          </Link>
        </p>

        <section className="welcome-card mt-14 rounded-2xl border border-line bg-surface-2/30 p-6 sm:p-8">
          <h3 className="text-center font-mono text-label uppercase tracking-wider text-text-faint">
            What&apos;s included in Pilot
          </h3>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: FileText,
                title: "15+ Templates",
                desc: "Privacy policies, consent forms, DPO notices & more",
              },
              {
                icon: Award,
                title: "8 Certifications",
                desc: "Complete modules to earn compliance badges",
              },
              {
                icon: Scan,
                title: "Daily Scans",
                desc: "1 full compliance scan per day with detailed reports",
              },
              {
                icon: Wrench,
                title: "All Tools",
                desc: "Full access to compliance tools & calculators",
              },
            ].map((item) => (
              <div key={item.title} className="text-center">
                <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl border border-line bg-glass text-accent">
                  <item.icon className="h-5 w-5" />
                </div>
                <h4 className="font-display font-semibold text-text">{item.title}</h4>
                <p className="mt-1 text-xs leading-relaxed text-text-muted">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
