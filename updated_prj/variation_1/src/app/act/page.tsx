import type { Metadata } from "next";
import { ActCodexHero } from "@/components/sections/ActCodexHero";
import { ActBrowser } from "@/components/resources/ActBrowser";
import { CtaBand } from "@/components/sections/CtaBand";
import { HERO_CONFIGS } from "@/content/hero-configs";

export const metadata: Metadata = {
  title: "The Act - All Sections | DPDP Act, 2023",
};

export default function ActPage() {
  return (
    <>
      <ActCodexHero {...HERO_CONFIGS.act} />
      <ActBrowser />
      <CtaBand />
    </>
  );
}
