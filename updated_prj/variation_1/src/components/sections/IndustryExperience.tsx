"use client";

import { useState } from "react";
import { EasyIntro } from "@/components/site/EasyContent";
import { HERO_CONFIGS } from "@/content/hero-configs";
import { IndustryModelsHero } from "@/components/sections/IndustryModelsHero";
import { IndustriesSection } from "@/components/sections/IndustriesSection";

export function IndustryExperience() {
  const [active, setActive] = useState(0);

  return (
    <>
      <IndustryModelsHero
        {...HERO_CONFIGS.industries}
        active={active}
        onActiveChange={setActive}
      />
      <EasyIntro
        title="Advice that fits your world"
        points={[
          "Ready-made plans for your type of business",
          "Knows the data risks in your field",
          "Faster to set up, with less guesswork",
          "Ready for inspections from day one",
        ]}
      >
        A hospital and a shop don&apos;t handle information the same way. Pick
        your industry and we&apos;ll show you the exact steps that matter for
        you.
      </EasyIntro>
      <IndustriesSection id="industries" active={active} />
    </>
  );
}