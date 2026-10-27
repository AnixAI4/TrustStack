import type { Metadata } from "next";
import { FrameworkMethodHero } from "@/components/sections/FrameworkMethodHero";
import { FrameworkSection } from "@/components/sections/FrameworkSection";
import { PlatformShowcase } from "@/components/sections/PlatformShowcase";
import { BadgeShowcase } from "@/components/sections/BadgeShowcase";
import { CtaBand } from "@/components/sections/CtaBand";
import { EasyIntro } from "@/components/site/EasyContent";

export const metadata: Metadata = {
  title: "The Anix 7D DPDP Framework™",
};

export default function FrameworkPage() {
  return (
    <>
      <FrameworkMethodHero />
      <EasyIntro
        title="Seven clear steps"
        points={[
          "Find out what data you hold",
          "Set the rules and design safe systems",
          "Protect the data and put it into daily use",
          "Prove it works and keep improving",
        ]}
      >
        Instead of one giant, scary task, we break the whole job into seven
        simple steps you can follow one at a time - and tick off as you go.
      </EasyIntro>
      <FrameworkSection id="framework" />
      <PlatformShowcase id="app" />
      <BadgeShowcase id="badges" />
      <CtaBand />
    </>
  );
}
