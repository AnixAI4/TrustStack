import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { Hero } from "@/components/home/Hero";
import { DpdpKnowSection } from "@/components/home/DpdpKnowSection";
import { Marquee } from "@/components/ui/Marquee";
import { EasyIntro } from "@/components/site/EasyContent";

const BentoShowcase = dynamic(() =>
  import("@/components/home/BentoShowcase").then((m) => m.BentoShowcase)
);
const RiskCheck = dynamic(() =>
  import("@/components/home/RiskCheck").then((m) => m.RiskCheck)
);
const ExploreBand = dynamic(() =>
  import("@/components/sections/ExploreBand").then((m) => m.ExploreBand)
);
const CtaBand = dynamic(() =>
  import("@/components/sections/CtaBand").then((m) => m.CtaBand)
);

export default function HomePage() {
  const t = useTranslations("marquee");
  return (
    <>
      <DpdpKnowSection />
      <Hero />
      <EasyIntro
        title="What is this website?"
        points={[
          "Learn your rights over your own data",
          "See what a business must do to follow the law",
          "Use free tools and ready-made documents",
          "Check where you stand in a few minutes",
        ]}
      >
        This is a friendly guide to India&apos;s new privacy law, called the DPDP
        Act. Whether you are a regular person who wants to know your rights, or a
        business owner who needs to follow the rules, everything here is written
        to be easy to understand - no legal words, no confusion.
      </EasyIntro>
      <BentoShowcase />
      <RiskCheck />
      <ExploreBand />
      <CtaBand />
      <Marquee items={t.raw("lines") as string[]} fixed />
    </>
  );
}
