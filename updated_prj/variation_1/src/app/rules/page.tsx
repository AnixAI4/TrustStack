import type { Metadata } from "next";
import { RulesIndexHero } from "@/components/sections/RulesIndexHero";
import { RulesBrowser } from "@/components/resources/RulesBrowser";
import { HERO_CONFIGS } from "@/content/hero-configs";

export const metadata: Metadata = {
  title: "DPDP Rules 2025 | Mapped to the Act",
};

export default function RulesPage() {
  return (
    <>
      <RulesIndexHero {...HERO_CONFIGS.rules} />
      <RulesBrowser />
    </>
  );
}
