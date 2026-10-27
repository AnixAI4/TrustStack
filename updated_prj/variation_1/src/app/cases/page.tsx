import type { Metadata } from "next";
import { CaseBalanceHero } from "@/components/sections/CaseBalanceHero";
import { CasesBrowser } from "@/components/resources/CasesBrowser";
import { CtaBand } from "@/components/sections/CtaBand";
import { HERO_CONFIGS } from "@/content/hero-configs";

export const metadata: Metadata = {
  title: "Case Laws | Privacy jurisprudence behind the DPDP Act",
};

export default function CasesPage() {
  return (
    <>
      <CaseBalanceHero {...HERO_CONFIGS.cases} />
      <CasesBrowser />
      <CtaBand />
    </>
  );
}
