import type { Metadata } from "next";
import Link from "next/link";
import { Cookie, ShieldCheck } from "lucide-react";
import { ConsentConsoleHero } from "@/components/sections/LegalUtilityHeroes";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { HERO_CONFIGS } from "@/content/hero-configs";

const categories = [
  {
    title: "Essential cookies",
    status: "Always on",
    body: "Required for core site operation, security, load balancing, language routing, cookie preference storage, accessibility settings and fraud prevention. These are not used for optional advertising or analytics.",
  },
  {
    title: "Functional cookies",
    status: "Optional",
    body: "Remember preferences such as theme, language, learning state, saved generators and user interface choices so the site works the way you selected.",
  },
  {
    title: "Analytics cookies",
    status: "Optional consent",
    body: "Help us understand aggregate site usage, broken journeys and feature performance. We use analytics only when you opt in, and we configure it to minimise personal data where possible.",
  },
  {
    title: "Marketing cookies",
    status: "Optional consent",
    body: "May support relevant communications, campaign measurement or demo follow-up. These remain off unless you choose to accept them.",
  },
];

const cookieInventory = [
  {
    name: "NEXT_LOCALE",
    party: "First-party",
    category: "Functional",
    duration: "1 year",
    purpose: "Remembers the language you chose so the site doesn't reset it on every visit.",
  },
  {
    name: "sb-*-auth-token",
    party: "First-party (Supabase)",
    category: "Essential",
    duration: "Length of your signed-in session",
    purpose: "Keeps you signed in to your TrustStack account. Set only after you sign in.",
  },
  {
    name: "truststack-device",
    party: "First-party",
    category: "Essential security",
    duration: "30 days when device-session enforcement is enabled",
    purpose: "Identifies a browser session using a random token so concurrent-device limits and account-sharing controls can be enforced. The server stores only its SHA-256 hash.",
  },
  {
    name: "dpdp-consent",
    party: "Browser local storage (not a cookie)",
    category: "Essential",
    duration: "Until you change or clear it",
    purpose: "Stores the cookie choices you made in this banner, so we don't ask again every visit.",
  },
  {
    name: "dpdp-theme, dpdp-reading, dpdp-a11y-v4, anixai-theme",
    party: "Browser local storage (not cookies)",
    category: "Functional",
    duration: "Until changed or browser storage is cleared",
    purpose: "Remembers visual theme, easy-read mode and accessibility settings selected on this device.",
  },
  {
    name: "dpdp-progress, dpdp-quiz-best, dpdp-risk-v1, dpdp-know-section-dismissed",
    party: "Browser local storage (not cookies)",
    category: "Functional",
    duration: "Until reset or browser storage is cleared",
    purpose: "Stores local learning progress, quiz score, risk-check state and dismissed educational prompts.",
  },
  {
    name: "dpdp-lexbot-chat",
    party: "Browser local storage (not a cookie)",
    category: "Functional",
    duration: "Until chat is cleared or browser storage is cleared",
    purpose: "Keeps recent TrustChat messages on this device so the conversation can continue after navigation.",
  },
];

const controls = [
  "Reject non-essential cookies from the banner without losing access to the site.",
  "Accept all optional categories only through a clear affirmative action.",
  "Customise functional, analytics and marketing categories separately.",
  "Withdraw consent at any time by reopening cookie preferences from the footer or by clearing browser storage.",
  "Use browser controls to block or delete cookies, noting that essential features may then reset.",
];

export const metadata: Metadata = {
  title: "Cookie Policy | TrustStack",
  description:
    "TrustStack cookie policy covering essential, functional, analytics and marketing cookies, optional consent and easy withdrawal controls.",
};

export default function CookiesPage() {
  return (
    <>
      <ConsentConsoleHero {...HERO_CONFIGS.cookies} />

      <section className="section">
        <div className="container-x">
          <SectionHeader
            eyebrow="Last updated: 7 August 2026"
            title="Cookies are separated by purpose"
            lede="This policy should be read with our Privacy Policy. It explains which storage is essential and which storage depends on your consent."
          />

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {categories.map((category) => (
              <article key={category.title} className="rounded-2xl border border-line bg-surface-2/30 p-6">
                <div className="flex items-center justify-between gap-4">
                  <span className="grid h-11 w-11 place-items-center rounded-lg border border-line bg-glass text-accent">
                    <Cookie className="h-5 w-5" />
                  </span>
                  <span className="rounded-pill border border-line bg-bg-2/60 px-3 py-1 font-mono text-label uppercase tracking-wider text-text-muted">
                    {category.status}
                  </span>
                </div>
                <h2 className="mt-5 font-display text-xl font-semibold text-text">{category.title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-text-muted">{category.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section pt-0">
        <div className="container-x">
          <SectionHeader
            eyebrow="Full disclosure"
            title="The cookies we currently set"
            lede="No cookie policy should hide behind vague categories. Here is every cookie or local-storage item TrustStack sets today, and why. We do not currently load any analytics, advertising or social-media trackers - if that ever changes, this table will be updated first and consent will be asked before any non-essential cookie fires."
          />
          <div className="mt-8 overflow-x-auto rounded-2xl border border-line">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-line bg-surface-2/40 text-text-faint">
                  <th className="px-4 py-3 font-mono text-label uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 font-mono text-label uppercase tracking-wider">Party</th>
                  <th className="px-4 py-3 font-mono text-label uppercase tracking-wider">Category</th>
                  <th className="px-4 py-3 font-mono text-label uppercase tracking-wider">Duration</th>
                  <th className="px-4 py-3 font-mono text-label uppercase tracking-wider">Purpose</th>
                </tr>
              </thead>
              <tbody>
                {cookieInventory.map((c) => (
                  <tr key={c.name} className="border-b border-line last:border-0">
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-text">{c.name}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-text-muted">{c.party}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-text-muted">{c.category}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-text-muted">{c.duration}</td>
                    <td className="px-4 py-3 text-text-muted">{c.purpose}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="section pt-0">
        <div className="container-x grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          <div className="rounded-2xl border border-line bg-gradient-to-br from-surface-2/60 to-bg-2 p-6 sm:p-8">
            <p className="eyebrow mb-4">Consent controls</p>
            <h2 className="font-display text-3xl font-semibold text-text">Your choices stay reversible</h2>
            <p className="mt-4 text-sm leading-relaxed text-text-muted sm:text-base">
              Non-essential cookies are not required to browse TrustStack. Giving consent is a choice, and withdrawing it is built into the same preference layer.
            </p>
          </div>
          <ul className="space-y-3">
            {controls.map((control) => (
              <li key={control} className="flex gap-3 rounded-xl border border-line bg-surface-2/30 p-4 text-sm leading-relaxed text-text-muted">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <span>{control}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section pt-0">
        <div className="container-x">
          <div className="rounded-2xl border border-line bg-surface-2/30 p-6 text-sm leading-relaxed text-text-muted sm:p-8 sm:text-base">
            <h2 className="font-display text-2xl font-semibold text-text">Retention, sharing and contact</h2>
            <p className="mt-4">
              Cookie preference records are kept only as long as needed to remember and demonstrate your choice. Optional analytics or marketing identifiers are retained under the limits set by the relevant provider and our configuration, and are not used after you withdraw consent.
            </p>
            <p className="mt-3">
              We may use processors to host the website, store preferences, measure consented analytics or deliver communications. They must process cookie and device data only on our instructions and protect it with appropriate safeguards.
            </p>
            <p className="mt-3">
              For privacy or cookie requests, contact{" "}
              <a className="text-accent hover:underline" href="mailto:consult@anixai.io">
                consult@anixai.io
              </a>
              . The same monitored channel accepts grievances and DPDP rights requests. See the{" "}
              <Link href="/privacy" className="text-accent hover:underline">
                Privacy Policy
              </Link>{" "}
              for your DPDP rights.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}