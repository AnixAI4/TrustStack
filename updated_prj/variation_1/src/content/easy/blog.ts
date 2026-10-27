/**
 * Easy read pairs for /blog and /blog/[slug]: hero, filters, the article-card
 * descriptions and the detail disclaimer (content/blog.ts CATALOG).
 *
 * Article headlines are kept as editorial titles. Article-body pairs below
 * deliberately simplify the long-form analysis while keeping statute, rule,
 * deadline and penalty details exact.
 */
export const PAIRS: [string, string][] = [
  // ---- hero ----
  [
    "Editorial analysis on the DPDP Act, the 2025 Rules and what they mean for businesses, builders and citizens.",
    "Clear analysis of the DPDP Act, the 2025 Rules and what they mean for businesses, builders and citizens.",
  ],

  // ---- filters ----
  ["SMEs", "Small businesses"],

  // ---- article-card descriptions ----
  [
    "From consent managers to breach timelines, the operational detail finally lands. Here's what every Data Fiduciary should action first - and what can wait.",
    "From consent managers to data-leak deadlines, the practical detail finally lands. Here's what every responsible organisation should do first - and what can wait.",
  ],
  [
    "Why cybersecurity is the control layer that makes DPDP obligations work in real organisations.",
    "Why cybersecurity is the layer that makes DPDP duties work in real organisations.",
  ],
  ['What "outside India" really means for your data flows', 'What "outside India" really means for where your data goes'],
  [
    "Monitoring patterns that catch misuse before it becomes a breach",
    "Watching for patterns that catch misuse before it becomes a data leak",
  ],
  ["What model builders must know about training data and consent", "What AI model builders must know about training data and permission"],
  ["Where large models bump into consent, purpose and erasure", "Where large AI models bump into permission, purpose and deletion"],
  ["Practical, low-cost steps to get compliant without a big team", "Practical, low-cost steps to follow the law without a big team"],
  ["How erasure works in practice - and its limits", "How deletion works in practice - and its limits"],
  ["What Section 9 and Rule 10 demand of platforms", "What Section 9 and Rule 10 require of platforms"],

  // ---- detail disclaimer ----
  [
    "TrustStack Insights publishes editorial analysis of India's data protection framework. Cross-check material provisions against the Digital Personal Data Protection Act, 2023 and the DPDP Rules, 2025 before relying on it for compliance decisions.",
    "TrustStack Insights publishes editorial analysis of India's data-protection system. Check important points against the Digital Personal Data Protection Act, 2023 and the DPDP Rules, 2025 before relying on it for compliance decisions.",
  ],

  // ---- dpdp-rules-2025-industry-implications ----
  [
    "For two years, the Digital Personal Data Protection Act, 2023 sat on the books as a framework without an engine. Founders, DPOs and engineering leads had principles to work from but no operating detail: how a breach notice should actually read, what a Consent Manager has to look like, how long a log has to live on a server. That changed when the Ministry of Electronics and Information Technology notified the Digital Personal Data Protection Rules, 2025, turning the Act from a statement of intent into an enforceable compliance regime. Here is what actually changed for organisations operating in India, without the hype.",
    "For two years, the Digital Personal Data Protection Act, 2023 set out the main principles but not the practical steps. Founders, DPOs and engineering leads did not yet know what a data-leak notice should say, how a Consent Manager should work, or how long server logs must be kept. That changed when the Ministry of Electronics and Information Technology issued the Digital Personal Data Protection Rules, 2025. The Rules turned the Act from a plan into a system that organisations in India must follow. Here is what changed, without the hype.",
  ],
  ["The staggered compliance clock", "When each rule starts"],
  [
    "The Rules do not switch on all at once. They are staggered, and which speed applies to you depends on which part of the framework you are looking at.",
    "The Rules do not all start at the same time. The start date depends on which part of the law you are looking at.",
  ],
  [
    "Immediate: the rules establishing and operationalising the Data Protection Board take effect, so the regulator now formally exists and can begin acting.",
    "Immediate: the rules that create and set up the Data Protection Board take effect. This means the authority now formally exists and can start working.",
  ],
  [
    "12 months out: Rule 4 and the First Schedule switch on, opening formal registration for Consent Managers.",
    "After 12 months: Rule 4 and the First Schedule start. Consent Managers can then formally register.",
  ],
  [
    "18 months out: the remaining operational rules covering notice, consent, security safeguards, breach reporting, retention and Data Principal rights become fully effective.",
    "After 18 months: the remaining practical rules fully start. They cover notices, permission, security protections, data-leak reporting, how long data is kept, and the rights of people whose data is used.",
  ],
  [
    "It is tempting to read that timeline as a grace period to do nothing for a year and a half. It is not. Building consent flows, retention schedules and breach playbooks takes longer than most organisations expect, and the 18-month window is best treated as a build deadline, not a buffer.",
    "Do not treat this timeline as permission to wait for 18 months. Setting up permission flows, data-keeping schedules and data-leak response plans takes time. Treat the 18-month window as the deadline for finishing the work, not extra time to delay.",
  ],
  ["Notice and consent in the real world", "Notices and permission in practice"],
  [
    "Rule 3 requires a standalone notice: an itemised list of the personal data being collected, the specified purpose described in terms a Data Principal can actually understand, and a direct link for both withdrawing consent and complaining to the Board. Imagine an e-commerce checkout. Consent buried inside a forty-clause terms-of-service page no longer satisfies the notice requirement; it has to stand on its own, in plain language, right at the point of collection. If a user cannot easily find how to withdraw that consent later, your notice fails the test.",
    "Rule 3 requires a separate notice. It must list each type of personal data collected, explain the exact reason in words the person can understand, and link directly to ways to withdraw permission and complain to the Board. For example, an online shop cannot hide permission inside a forty-clause terms page. The notice must be separate, clear and shown when data is collected. It fails if users cannot easily find how to withdraw permission later.",
  ],
  ["Breach reporting: The 72-hour reality", "Reporting a data leak within 72 hours"],
  [
    "Rule 7 layers a strict breach response on top of your security safeguards: notify the Board within 72 hours, and notify affected Data Principals without unreasonable delay, in plain language. There is no materiality threshold to hide behind. Picture a misconfigured cloud storage bucket that exposes a few hundred customer email addresses for an hour. Under other global regimes, you might log it and move on. Under DPDP, every personal data breach has to be reported. You need a named individual who can authorise a breach notification without waiting for a committee, a pre-drafted template, and log retention configured for at least twelve months.",
    "Rule 7 adds strict steps for data leaks to your security duties. You must tell the Board within 72 hours and tell affected people without unreasonable delay, using plain language. There is no minimum level of harm below which you can avoid reporting. For example, if a wrongly configured cloud storage bucket exposes a few hundred customer email addresses for one hour, it must still be reported under DPDP. Name one person who can approve the report without waiting for a committee. Prepare a template in advance and keep logs for at least twelve months.",
  ],
  [
    "Retention defaults and the Significant Data Fiduciary tier",
    "How long data must be kept and extra duties for high-risk organisations",
  ],
  [
    "Rule 8 sets default retention windows for high-volume intermediaries, while Rule 8(3) sets a baseline requiring every Data Fiduciary to retain personal data and associated logs for at least one year before erasure. Above all of this sits the Significant Data Fiduciary tier under Section 10. Organisations notified by the government face an annual Data Protection Impact Assessment and a due-diligence obligation under Rule 13 to confirm that the algorithmic software they use does not pose a risk to Data Principal rights. The headline penalties are real, but the true shift is that India's regime has moved from principle to procedure. The months ahead are the time to build the procedure.",
    "Rule 8 sets standard periods for certain high-volume services to keep data. Rule 8(3) also requires every organisation responsible for data to keep personal data and related logs for at least one year before deletion. Section 10 adds extra duties for organisations the government names as Significant Data Fiduciaries. They must complete a Data Protection Impact Assessment every year. Under Rule 13, they must also check that software using algorithms does not put people's rights at risk. The fines matter, but the biggest change is practical: India's system now sets out steps organisations must follow. Use the coming months to put those steps in place.",
  ],
];
