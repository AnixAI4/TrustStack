"use client";

import Link from "next/link";
import { ArrowUpRight, ScanLine } from "lucide-react";
import { useTranslations } from "next-intl";
import { FINAL_CTA } from "@/content/home";
import { Reveal } from "@/components/ui/Reveal";
import { PilotLockLink } from "@/components/gates/PilotLockLink";

export function CtaBand() {
  const t = useTranslations("final_cta");
  const scannerExternal = FINAL_CTA.scanner.href.startsWith("http");
  return (
    <section className="section">
      <div className="container-x">
        <Reveal className="relative overflow-hidden rounded-2xl border border-line bg-surface-2/40 px-6 py-16 text-center sm:px-12">
          <div className="pointer-events-none absolute inset-0 -z-10 opacity-90">
            <div className="absolute -left-20 top-0 h-64 w-64 rounded-full bg-accent/25 blur-[100px]" />
            <div className="absolute -right-20 bottom-0 h-64 w-64 rounded-full bg-brand/25 blur-[100px]" />
          </div>
          <h2 className="mx-auto max-w-3xl font-display text-3xl font-semibold leading-tight tracking-tight text-balance sm:text-4xl lg:text-[2.7rem]">
            {t("heading")}
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-text-muted text-pretty">
            {t("subheading")}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href={FINAL_CTA.primary.href} className="btn btn-accent btn-lg">
              {t("primary")}
              <ArrowUpRight className="h-4 w-4" />
            </Link>
            <Link href={FINAL_CTA.secondary.href} className="btn btn-ghost btn-lg">
              {t("secondary")}
            </Link>
            <PilotLockLink
              href={FINAL_CTA.scanner.href}
              target={scannerExternal ? "_blank" : undefined}
              rel={scannerExternal ? "noopener noreferrer" : undefined}
              className="btn btn-ghost btn-lg gap-2"
            >
              <ScanLine className="h-4 w-4" />
              {FINAL_CTA.scanner.label}
              <span className="rounded-pill bg-accent/15 px-1.5 py-0.5 text-label font-semibold uppercase tracking-wider text-accent">
                New
              </span>
            </PilotLockLink>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
