"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { EXPLORE } from "@/content/home";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { RevealGroup, RevealItem } from "@/components/ui/Reveal";
import { PilotLockLink } from "@/components/gates/PilotLockLink";
import { featureForHref } from "@/lib/paid-routes";

export function ExploreBand({ id }: { id?: string }) {
  const t = useTranslations("explore");
  return (
    <section id={id ?? "explore"} className="section scroll-mt-24">
      <div className="container-x">
        <SectionHeader
          eyebrow={t("eyebrow")}
          title={t("title")}
          lede={t("lede")}
        />

        <RevealGroup className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {EXPLORE.map((c) => {
            const Icon = c.icon;
            const key = c.href.replace(/^\//, "");
            const paid = Boolean(featureForHref(c.href));
            const CardLink = paid ? PilotLockLink : Link;
            return (
              <RevealItem key={c.label}>
                <CardLink
                  href={c.href}
                  className="card card-hover group flex h-full flex-col"
                >
                  <div className="flex items-center justify-between">
                    <span className="grid h-11 w-11 place-items-center rounded-lg border border-line bg-glass text-accent transition-transform group-hover:scale-105">
                      <Icon className="h-5 w-5" />
                    </span>
                    <ArrowUpRight className="h-5 w-5 text-text-faint transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent" />
                  </div>
                  <h3 className="mt-5 font-display text-xl font-semibold text-text">
                    {t(`cards.${key}.label`)}
                  </h3>
                  <p className="mt-2 text-sm text-text-muted">{t(`cards.${key}.desc`)}</p>
                </CardLink>
              </RevealItem>
            );
          })}
        </RevealGroup>
      </div>
    </section>
  );
}
