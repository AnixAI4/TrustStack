"use client";

import { ScanLine, ArrowUpRight, Sparkles } from "lucide-react";
import { DPDP_SCANNER_URL } from "@/content/home";
import { PilotLockLink } from "@/components/gates/PilotLockLink";

export function ScannerCallout() {
  const scannerExternal = DPDP_SCANNER_URL.startsWith("http");
  return (
    <section className="section pb-0">
      <div className="container-x">
        <PilotLockLink
          href={DPDP_SCANNER_URL}
          target={scannerExternal ? "_blank" : undefined}
          rel={scannerExternal ? "noopener noreferrer" : undefined}
          className="group relative block overflow-hidden rounded-2xl border border-accent/40 bg-gradient-to-r from-accent/15 via-surface-2/40 to-brand/10 p-6 transition-all hover:border-accent/70 sm:p-8"
        >
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-accent/20 blur-[80px]" />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-accent/40 bg-accent/10 text-accent">
                <ScanLine className="h-6 w-6" />
              </span>
              <div>
                <span className="badge">
                  <Sparkles className="h-3 w-3" /> New · DPDP Scanner
                </span>
                <h2 className="mt-2 font-display text-xl font-semibold text-text sm:text-2xl">
                  Stop guessing if you&apos;re compliant - scan and find out.
                </h2>
                <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-text-muted">
                  The DPDP Scanner inspects your website for consent, notice, cookie and
                  security gaps against the DPDP Act, 2023 - and hands you a prioritised
                  fix-list in minutes.
                </p>
              </div>
            </div>
            <span className="btn btn-accent btn-lg shrink-0 self-start sm:self-auto">
              Run the DPDP Scanner
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </div>
        </PilotLockLink>
      </div>
    </section>
  );
}
