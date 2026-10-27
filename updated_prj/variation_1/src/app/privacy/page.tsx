import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { PrivacyVaultHero } from "@/components/sections/LegalUtilityHeroes";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { HERO_CONFIGS } from "@/content/hero-configs";

const essentials = [
  "Itemised notice before or at collection of personal data",
  "Clear lawful purposes for every category of personal data",
  "Consent withdrawal as easy as consent collection",
  "Rights to access, correction, erasure, grievance and nomination",
  "Retention limited to live purpose, legal need or user request",
  "Named grievance contact and escalation channel",
  "Documented security and breach-notification commitments",
];

const sections = [
  {
    title: "Who we are",
    body: [
      "TrustStack is a DPDP education, template and compliance-tool website operated by Anix for Indian organisations, founders, privacy teams and Data Principals. This Privacy Policy is our Section 5 notice under the Digital Personal Data Protection Act, 2023 and explains what personal data we process, why we process it, how long we keep it and how you can exercise your rights.",
      "We act as the Data Fiduciary for personal data collected through this website, our learning tools, template downloads, scanner demos, contact forms, newsletter flows and support channels.",
    ],
  },
  {
    title: "Personal data we collect",
    body: [
      "Account, contact and enquiry data: name, organisation, role, email address, phone number, message content and communication preferences when you contact us, request a demo, subscribe or use support.",
      "Learning and certificate data: course progress, quiz answers, generated certificates, completion records and feedback when you use our learning modules.",
      "Scanner and template data: website URLs, policy-page URLs, cookie-scan observations, uploaded or generated document metadata and the compliance findings needed to provide the tool output you requested.",
      "Device, cookie and usage data: IP address, browser type, approximate location, language preference, theme, accessibility settings, consent preferences, page views and diagnostic logs. Non-essential cookies are controlled through our cookie banner and Cookie Policy.",
    ],
  },
  {
    title: "Purposes and lawful basis",
    body: [
      "We process personal data to provide the website, courses, templates, scanner results, certificates, support, security, fraud prevention, preference management and service communications that you request.",
      "Where processing is necessary to deliver a feature you asked for, we rely on the legitimate uses permitted by the DPDP Act. Where we use optional analytics, marketing, newsletters, demos, non-essential cookies or similar tracking, we rely on free, specific, informed, unconditional and unambiguous consent that you may withdraw at any time.",
      "We do not process personal data for a new incompatible purpose without fresh notice and, where required, fresh consent.",
    ],
  },
  {
    title: "Consent and withdrawal",
    body: [
      "Consent on TrustStack is purpose-specific. Optional analytics, marketing and preference cookies are off unless you choose to accept them or enable them in the banner.",
      "You can withdraw consent as easily as you gave it by reopening cookie preferences from the footer, using unsubscribe links in email, changing your account or course settings where available, or emailing consult@anixai.io. Withdrawal does not affect lawful processing completed before withdrawal or data we must keep under law.",
    ],
  },
  {
    title: "Sharing and processors",
    body: [
      "We share personal data only with service providers who help us host the site, deliver email, secure the service, run analytics that you consent to, process support requests, generate certificates or operate scanner and template features.",
      "Current processor categories include Supabase for account authentication and application data, Anthropic for AI-assisted drafts and answers, Resend for transactional email, Razorpay for payment processing, and our hosting and infrastructure providers. Payment-card details are collected by Razorpay and are not stored by TrustStack. We do not sell personal data.",
      "Processors must use personal data only on our instructions, protect it with appropriate security safeguards, keep it confidential, assist with rights requests and delete or return it when the processing purpose ends unless law requires retention.",
    ],
  },
  {
    title: "AI-assisted features",
    body: [
      "When you use TrustChat, notice generation, report summaries, DPA drafting or other AI-assisted tools, the prompt and relevant workspace context are sent to our contracted AI processor to generate the requested output. Do not submit personal data that is unnecessary for the task.",
      "AI output is decision support, not an automated legal decision. You remain responsible for human review before relying on generated notices, reports, recommendations or contractual language.",
    ],
  },
  {
    title: "Security safeguards",
    body: [
      "We use proportionate technical and organisational safeguards including access controls, encryption in transit, least-privilege administration, logging, backup discipline, dependency review and incident-response procedures. If we become aware of a personal data breach, we will assess and contain it promptly, notify affected Data Principals where required, and notify the Data Protection Board of India without delay and within the applicable 72-hour reporting timeline under the DPDP Rules.",
    ],
  },
  {
    title: "Retention and deletion",
    body: [
      "We keep personal data only for as long as needed for the purpose stated in this notice, for a legal or security requirement, or to resolve a request or dispute. Contact enquiries are normally reviewed for deletion or anonymisation within 24 months. Cookie consent logs are retained only as long as needed to prove and manage preferences. Scanner input and generated reports are deleted or anonymised when no longer needed to provide the requested result, debug abuse or comply with law.",
      "When the purpose ends, we delete, anonymise or archive personal data under restricted access unless another law requires continued retention.",
    ],
  },
  {
    title: "Children's data",
    body: [
      "TrustStack is intended for adults and professional users. We do not knowingly offer child-directed services, track children, behaviourally monitor children or target advertising at children. If a child uses a feature that requires personal data, a parent or lawful guardian must provide verifiable consent where required by law.",
    ],
  },
  {
    title: "Cross-border transfers",
    body: [
      "We may use service providers located outside India where needed to operate the website and tools. We will not transfer personal data to a country or territory restricted by the Government of India under the DPDP Act, and we require processors to protect transferred data consistently with this policy.",
    ],
  },
  {
    title: "Your DPDP rights",
    body: [
      "You may request access to your personal data and a summary of processing, correction of inaccurate data, completion of incomplete data, erasure when retention is no longer necessary, grievance redressal, and nomination of another person to exercise your rights in case of death or incapacity. Where processing relies on consent, you may also withdraw that consent at any time.",
      "Send rights and grievance requests to the Anix Privacy Team at consult@anixai.io. Please include enough information for us to verify your identity and understand the request. We aim to acknowledge every request within 3 business days and resolve it within 30 days, and we will tell you if a request needs more time and why. If you are not satisfied with our response, you may escalate to the Data Protection Board of India after first using our grievance channel.",
    ],
  },
];

export const metadata: Metadata = {
  title: "Privacy Policy | TrustStack",
  description:
    "TrustStack privacy policy and DPDP Section 5 notice covering personal data, purposes, consent withdrawal, rights, retention, security and grievance redressal.",
};

export default function PrivacyPage() {
  return (
    <>
      <PrivacyVaultHero {...HERO_CONFIGS.privacy} />

      <section className="section">
        <div className="container-x">
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.4fr]">
            <aside className="rounded-2xl border border-line bg-surface-2/40 p-6 lg:sticky lg:top-24 lg:self-start">
              <p className="eyebrow mb-4">Last updated: 7 August 2026</p>
              <h2 className="font-display text-2xl font-semibold text-text">Compliance snapshot</h2>
              <ul className="mt-5 space-y-3">
                {essentials.map((item) => (
                  <li key={item} className="flex gap-3 text-sm leading-relaxed text-text-muted">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 rounded-xl border border-line bg-bg-2/60 p-4 text-sm leading-relaxed text-text-muted">
                <p className="font-semibold text-text">Grievance Officer</p>
                <p>Anix Privacy Team</p>
                <p>
                  <a className="text-accent hover:underline" href="mailto:consult@anixai.io">
                    consult@anixai.io
                  </a>
                </p>
              </div>
            </aside>

            <div className="space-y-8">
              <SectionHeader
                eyebrow="TrustStack privacy notice"
                title="Clear notice, clear choices"
                lede="This policy is written to be readable by people and crawlable by compliance scanners. It should be read together with our Cookie Policy."
              />
              {sections.map((section) => (
                <article key={section.title} className="rounded-2xl border border-line bg-surface-2/30 p-6">
                  <h2 className="font-display text-2xl font-semibold text-text">{section.title}</h2>
                  <div className="mt-4 space-y-3 text-sm leading-relaxed text-text-muted sm:text-base">
                    {section.body.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>
                </article>
              ))}
              <div className="rounded-2xl border border-line bg-bg-2/60 p-6 text-sm leading-relaxed text-text-muted">
                Cookie controls are available in the banner and described in the{" "}
                <Link href="/cookies" className="text-accent hover:underline">
                  Cookie Policy
                </Link>
                . Legal disclaimers are available in the{" "}
                <Link href="/terms" className="text-accent hover:underline">
                  Terms and Disclaimer
                </Link>
                .
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}