import type { Metadata } from "next";
import { TemplateArchiveHero } from "@/components/sections/TemplateArchiveHero";
import { TemplatesBrowser } from "@/components/resources/TemplatesBrowser";
import { CtaBand } from "@/components/sections/CtaBand";
import { HERO_CONFIGS } from "@/content/hero-configs";
import { TemplatesGate } from "@/components/gates/TemplatesGate";

export const metadata: Metadata = {
  title: "Templates & Policies | DPDP-ready documents",
};

export default function TemplatesPage() {
  return (
    <>
      <TemplateArchiveHero {...HERO_CONFIGS.templates} />
      <TemplatesGate>
        <TemplatesBrowser />
      </TemplatesGate>
      <CtaBand />
    </>
  );
}
