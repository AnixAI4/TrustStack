import type { Metadata } from "next";
import { ToolsConsoleHero } from "@/components/sections/ToolsConsoleHero";
import { Calculators } from "@/components/sections/Calculators";
import { Generators } from "@/components/sections/Generators";
import { CtaBand } from "@/components/sections/CtaBand";
import { EasyIntro } from "@/components/site/EasyContent";
import { HERO_CONFIGS } from "@/content/hero-configs";
import { ToolsGate } from "@/components/gates/ToolsGate";
import { ScannerCallout } from "@/components/gates/ScannerCallout";

export const metadata: Metadata = {
  title: "Compliance tools - DPDP calculators & document studio",
};

export default function ToolsPage() {
  return (
    <>
      <ToolsConsoleHero {...HERO_CONFIGS.tools} />

      <EasyIntro
        title="What these tools do"
        points={[
          "See what a data mistake could cost you",
          "Work out if getting compliant is worth it",
          "Create the privacy documents you need",
          "Everything stays private on your device",
        ]}
      >
        No sign-up, and nothing is uploaded anywhere. These free tools run right
        on your device and give you numbers and documents you can use straight
        away.
      </EasyIntro>

      <ToolsGate>
        <ScannerCallout />
        <Calculators id="calculators" />
        <Generators id="generators" />
      </ToolsGate>
      <CtaBand />
    </>
  );
}
