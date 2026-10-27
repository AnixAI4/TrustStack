import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import { SecurityFortressHero } from "@/components/sections/SecurityFortressHero";
import { EasyIntro } from "@/components/site/EasyContent";
import { CtaBand } from "@/components/sections/CtaBand";
import { DpdpSecurityScanner } from "@/components/tools/DpdpSecurityScanner";
import { HERO_CONFIGS } from "@/content/hero-configs";
import { RequirePilot } from "@/components/gates/RequirePilot";
import { PilotLockLink } from "@/components/gates/PilotLockLink";

export const metadata: Metadata = {
  title: "DPDP Security Scan - is your personal data actually protected?",
  description:
    "A passive, external security-posture scan mapped to the DPDP Act, 2023: transport/TLS, security headers, data exposure, cookie security, third-party surface and breach contactability - with a DPDP Security Score and prioritised fixes.",
};

export default function SecurityPage() {
  return (
    <RequirePilot feature="scanner_full">
      <SecurityFortressHero {...HERO_CONFIGS.security} />

      <EasyIntro
        title="What this security scan checks"
        points={[
          "We open your website like a visitor",
          "We check HTTPS, the certificate and security headers",
          "We look for leaked secrets and too many trackers",
          "We give you a security score and clear fixes",
        ]}
      >
        This is the security side of DPDP. It reads only what any visitor can see - it never
        logs in or touches your internal systems. Controls that live inside your systems (access,
        cloud, logging) are shown honestly as &ldquo;needs connected systems&rdquo; rather than
        guessed.
      </EasyIntro>

      <section className="section pt-4">
        <div className="container-x">
          <DpdpSecurityScanner />
          <p className="mx-auto mt-6 max-w-4xl text-sm text-text-muted">
            Looking for the consent, cookie &amp; policy check instead?{" "}
            <PilotLockLink
              href="/scanner"
              feature="scanner_full"
              className="inline-flex items-center gap-1 font-medium text-accent hover:underline"
            >
              Run the DPDP compliance scan
              <ArrowUpRight className="h-3.5 w-3.5" />
            </PilotLockLink>
          </p>
        </div>
      </section>

      <CtaBand />
    </RequirePilot>
  );
}
