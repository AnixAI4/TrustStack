import type { Metadata } from "next";
import Link from "next/link";
import { TermsLedgerHero } from "@/components/sections/LegalUtilityHeroes";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { HERO_CONFIGS } from "@/content/hero-configs";

const terms = [
  {
    title: "Educational and operational content",
    body: "TrustStack provides DPDP education, templates, scanner demonstrations, checklists and operational guidance. The site is not a substitute for legal advice from counsel who understands your facts.",
  },
  {
    title: "Using templates and tools",
    body: "Templates, generated notices, scanner findings and examples must be reviewed and tailored before use. Your organisation remains responsible for its own legal basis, notices, consents, processor contracts, security controls, retention schedule and grievance process.",
  },
  {
    title: "Acceptable use",
    body: "Do not misuse the scanner, submit unlawful content, attempt to disrupt the service, probe systems without authorisation, upload confidential third-party data without authority, or remove notices and attribution from materials where they are required.",
  },
  {
    title: "Accounts, seats and security",
    body: "Each account is for one named person. Do not share passwords, reuse another person's seat, bypass device or subscription controls, or invite someone who is not authorised by your organisation. You are responsible for keeping credentials secure and promptly reporting suspected unauthorised access. We may revoke sessions or suspend access used to evade account, seat or security limits.",
  },
  {
    title: "Subscriptions and payments",
    body: "Paid access applies for the period and seat count shown at checkout or in your order. Payment processing is handled by Razorpay. Access may be limited or suspended when a subscription expires, a payment is reversed, or use exceeds the purchased scope.",
  },
  {
    title: "Accuracy and updates",
    body: "We work to keep content aligned with the DPDP Act, 2023, DPDP Rules, 2025 and official guidance, but the law and enforcement practice can change. We may update content, features and policies as the regulatory position develops.",
  },
  {
    title: "Liability",
    body: "To the fullest extent permitted by law, TrustStack is provided on an as-is and as-available basis. We are not liable for indirect, incidental, special, consequential or punitive loss arising from use of educational content, templates or scanner outputs.",
  },
  {
    title: "Privacy and cookies",
    body: "Personal data and cookie choices are governed by our Privacy Policy and Cookie Policy. Those notices explain purposes, consent withdrawal, retention, rights and grievance channels.",
  },
  {
    title: "AI-assisted output",
    body: "AI-assisted drafts, summaries and recommendations may be incomplete or incorrect. Review them before use. They do not replace legal advice, and TrustStack does not make automated legal decisions on your behalf.",
  },
];

export const metadata: Metadata = {
  title: "Terms and Disclaimer | TrustStack",
  description:
    "TrustStack terms and disclaimer for DPDP educational content, templates, scanner demos, privacy notices and cookie controls.",
};

export default function TermsPage() {
  return (
    <>
      <TermsLedgerHero {...HERO_CONFIGS.terms} />

      <section className="section">
        <div className="container-x">
          <SectionHeader
            eyebrow="Last updated: 7 August 2026"
            title="Use the material responsibly"
            lede="These terms keep the boundaries clear while linking back to the privacy and cookie notices a scanner expects to find."
          />
          <div className="mt-10 grid gap-4 lg:grid-cols-2">
            {terms.map((term) => (
              <article key={term.title} className="rounded-2xl border border-line bg-surface-2/30 p-6">
                <h2 className="font-display text-xl font-semibold text-text">{term.title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-text-muted">{term.body}</p>
              </article>
            ))}
          </div>
          <div className="mt-8 rounded-2xl border border-line bg-bg-2/60 p-6 text-sm leading-relaxed text-text-muted">
            Questions about these terms can be sent to{" "}
            <a className="text-accent hover:underline" href="mailto:consult@anixai.io">
              consult@anixai.io
            </a>
            . Privacy requests and grievances use the same monitored channel or the methods listed in our{" "}
            <Link href="/privacy" className="text-accent hover:underline">
              Privacy Policy
            </Link>
            , and cookie choices are described in our{" "}
            <Link href="/cookies" className="text-accent hover:underline">
              Cookie Policy
            </Link>
            .
          </div>
        </div>
      </section>
    </>
  );
}