import type { Metadata } from "next";
import { SolutionsHero } from "@/components/sections/SolutionsHero";
import { ServiceExplorer } from "@/components/sections/ServiceExplorer";
import { CtaBand } from "@/components/sections/CtaBand";
import { EasyIntro } from "@/components/site/EasyContent";
import { HERO_CONFIGS } from "@/content/hero-configs";
import { SERVICE_DETAIL } from "@/content/service-detail";

export const metadata: Metadata = {
  title: "Services - DPDP assessment, implementation & AI governance",
};

export default function SolutionsPage() {
  const heroNodes = HERO_CONFIGS.solutions.nodes.map((node) => {
    const detail = SERVICE_DETAIL[`${node.name}™`] ?? SERVICE_DETAIL[node.name];
    return {
      ...node,
      meta: detail?.stage,
      detail: detail?.oneLiner,
    };
  });

  return (
    <>
      <SolutionsHero {...HERO_CONFIGS.solutions} nodes={heroNodes} />
      <EasyIntro
        title="What we can do for you"
        points={[
          "Teach your team the basics in simple workshops",
          "Check where your gaps are today",
          "Fix those gaps with a clear plan",
          "Keep you compliant month after month",
        ]}
      >
        Think of us as your privacy partner. We start by finding out what your
        business needs, then do the work with you - and stay on to make
        sure it keeps running smoothly.
      </EasyIntro>
      <ServiceExplorer id="explore" />
      <CtaBand />
    </>
  );
}
