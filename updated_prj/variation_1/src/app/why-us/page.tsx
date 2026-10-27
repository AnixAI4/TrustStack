import type { Metadata } from "next";
import { WhyUsIntegrationHero } from "@/components/sections/WhyUsIntegrationHero";
import { WhyUsSection } from "@/components/sections/WhyUsSection";
import { ComparisonSection } from "@/components/sections/ComparisonSection";
import { CtaBand } from "@/components/sections/CtaBand";
import { EasyIntro } from "@/components/site/EasyContent";
import { HERO_CONFIGS } from "@/content/hero-configs";

export const metadata: Metadata = {
  title: "Why us - Anix TrustStack vs alternatives",
};

export default function WhyUsPage() {
  return (
    <>
      <WhyUsIntegrationHero {...HERO_CONFIGS.whyUs} />
      <EasyIntro
        title="Why people pick us"
        points={[
          "One team, not four separate companies",
          "Privacy, AI, data and security handled together",
          "Clear plans written in plain language",
          "Made for Indian law and Indian businesses",
        ]}
      >
        Most companies only fix one piece of the puzzle. We look after everything
        that keeps your customers&apos; data safe and your business on the right
        side of the law - so nothing falls through the cracks.
      </EasyIntro>
      <WhyUsSection id="why" />
      <ComparisonSection id="compare" />
      <CtaBand />
    </>
  );
}
