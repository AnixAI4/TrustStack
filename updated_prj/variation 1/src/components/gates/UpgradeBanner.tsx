"use client";

import Link from "next/link";
import { Lock, Sparkles, ArrowRight } from "lucide-react";
import type { TrustStackFeature } from "@/lib/supabase/types";

const FEATURE_INFO: Record<
  TrustStackFeature,
  { title: string; description: string }
> = {
  templates: {
    title: "Policy templates",
    description:
      "Browse DPDP templates and unlock each for on-screen reading plus Word/PDF download. Pricing is confirmed at checkout.",
  },
  certifications: {
    title: "Certification Modules",
    description:
      "Complete 8 certification modules to demonstrate DPDP compliance expertise.",
  },
  tools: {
    title: "Compliance Tools",
    description:
      "Unlock calculators, document generators, and the full DPDP scanner.",
  },
  scanner_full: {
    title: "Full Scanner Access",
    description:
      "Get unlimited daily scans with detailed compliance reports.",
  },
  trustchat: {
    title: "TrustChat AI",
    description: "Ask questions about DPDP compliance with our AI assistant.",
  },
  platform: {
    title: "TrustDeck",
    description:
      "Create your organization workspace and run the full DPDP compliance dashboard.",
  },
};

export function UpgradeBanner({ feature }: { feature: TrustStackFeature }) {
  const info = FEATURE_INFO[feature];

  return (
    <div className="sticky top-16 z-40 border-b border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent backdrop-blur-sm">
      <div className="container-x py-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/20">
              <Lock className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <h3 className="font-semibold text-text">
                {info.title} requires Pilot
              </h3>
              <p className="text-sm text-text-muted">{info.description}</p>
            </div>
          </div>
          <Link
            href="/subscribe"
            className="btn btn-accent inline-flex shrink-0 items-center gap-2 self-start sm:self-auto"
          >
            <Sparkles className="h-4 w-4" />
            Upgrade to Pilot
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
