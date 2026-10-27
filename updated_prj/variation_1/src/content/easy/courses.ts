/**
 * Easy read pairs for /courses and /courses/[slug].
 *
 * Covers the list-page + detail-page hero (personas, taglines, blurbs) and the
 * shared detail chrome. The deep per-module points, course lessons
 * (course-lessons.ts) and interactive activities (course-activities.ts) are
 * instructional prose behind curriculum accordions and rely on fallbackEasyText,
 * per the huge-content guardrail. Course names and statute refs stay exact.
 */
export const PAIRS: [string, string][] = [
  // ---- list-page hero ----
  [
    "The DPDP Act lands differently on a citizen, a founder, a DPO, a lawyer, an engineer and a student. So instead of one generic certificate, pick the track written for your role - each maps to the same Act, but teaches what you actually need to do with it.",
    "The DPDP Act affects a citizen, a founder, a DPO, a lawyer, an engineer and a student differently. So instead of one generic certificate, pick the track written for your role - each covers the same Act, but teaches what you actually need to do with it.",
  ],

  // ---- personas ----
  ["For citizens & families", "For citizens and families"],
  ["For founders & SMEs", "For founders and small businesses"],
  ["For DPOs & privacy leads", "For DPOs and privacy leads"],
  ["For legal, risk & compliance", "For legal, risk and compliance"],
  ["For engineering & security", "For engineering and security"],
  ["For students & aspirants", "For students and learners"],

  // ---- taglines (jargony ones) ----
  ["Get compliant without a legal team.", "Follow the law without a legal team."],
  ["Run DPDP compliance end to end.", "Run DPDP compliance from start to finish."],

  // ---- detail-page blurbs (hero subheads) ----
  [
    "A plain-language course for everyday people. Understand what the DPDP Act gives you, how consent really works, and exactly how to act when a company mishandles your data - no legal background needed.",
    "A plain-language course for everyday people. Understand what the DPDP Act gives you, how permission really works, and exactly how to act when a company mishandles your data - no legal background needed.",
  ],
  [
    "A pragmatic course for people building a business. Work out whether DPDP applies to you, stand up the minimum compliant stack quickly and cheaply, and avoid the mistakes that draw penalties or lose you enterprise deals.",
    "A practical course for people building a business. Work out whether DPDP applies to you, set up the basics quickly and cheaply, and avoid the mistakes that draw fines or lose you big deals.",
  ],
  [
    "The full, practitioner-grade certification. Eight section-mapped modules take you across the whole Act and Rules, then a timed exam from a 272-question bank earns you a verifiable Certified DPDP Practitioner certificate.",
    "The full professional certification. Eight section-mapped modules take you across the whole Act and Rules, then a timed exam from a 272-question bank earns you a verifiable Certified DPDP Practitioner certificate.",
  ],
  [
    "A close reading for advisors. Work through the Act section by section and the Rules that give it effect, ground it in privacy jurisprudence, and map the enforcement and penalty regime so you can advise with precision.",
    "A close read for advisors. Work through the Act section by section and the Rules that support it, ground it in privacy court rulings, and map the enforcement and penalty system so you can advise with precision.",
  ],
  [
    "A builder's course. Translate the Act's duties into architecture - data discovery, minimisation, security safeguards, consent and rights automation, and governance for AI and GenAI systems that touch personal data.",
    "A builder's course. Turn the Act's duties into design - finding your data, collecting only what's needed, security measures, permission and rights automation, and control of AI systems that touch personal data.",
  ],
  [
    "A study path that starts at first principles and ends at the certificate. Build the fundamentals chapter by chapter, then practise against the full 272-question exam bank and sit the timed examination.",
    "A study path that starts from the basics and ends at the certificate. Build the fundamentals chapter by chapter, then practise with the full 272-question exam bank and sit the timed exam.",
  ],

  // ---- shared detail chrome ----
  [
    "Concrete capabilities you carry away - not just knowledge, but what to do with it.",
    "Real skills you take away - not just knowledge, but what to do with it.",
  ],
  [
    "Put the theory to work - judge real situations, follow the decision tools, and lock in the vocabulary.",
    "Put the ideas to work - judge real situations, follow the decision tools, and learn the key words.",
  ],
];
