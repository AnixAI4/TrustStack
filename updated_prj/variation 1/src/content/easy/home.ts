/**
 * Easy read pairs for the home page (/): Hero CTAs + search chips + stats,
 * BentoShowcase (the "bento" i18n namespace + the hard-coded Scanner card) and
 * the RiskCheck self-assessment ("risk" i18n namespace).
 *
 * The hero title + subhead already swap via data-rm spans in Hero.tsx, so they
 * are not repeated here. Brand/product/statute names and already-plain labels
 * are left untouched. Every number, deadline and statute reference is kept exact.
 */
export const PAIRS: [string, string][] = [
  // ---- Hero (buttons, chips, stats) ----
  ["Get free risk check", "Get a free risk check"],
  ["Read the Act", "Read the law"],
  ["Consent", "Permission"],
  ["Data breach", "Data leak"],
  ["Penalties", "Fines"],
  ["Max penalty", "Biggest fine"],

  // ---- BentoShowcase: section header ----
  ["One platform", "One place"],
  ["The DPDP Act, made operational", "The DPDP Act, put to work"],
  [
    "From the official text to penalties, coverage and live tooling - the whole Act, working for you.",
    "From the official text to fines, coverage and live tools - the whole Act, working for you.",
  ],

  // ---- BentoShowcase: reader card (titles + technical "says" lines) ----
  ["Security safeguards", "Security protections"],
  ["Right to access", "Right to see your data"],
  ["Notice", "Clear notice"],
  [
    "Consent must be free, specific, informed, unconditional and unambiguous - given by a clear affirmative action.",
    "Permission must be freely given, clear and for a specific reason - through a clear yes.",
  ],
  [
    "Verifiable parental consent is required, and tracking or targeted advertising directed at children is barred.",
    "You must get a parent's confirmed permission. Tracking or targeting ads at children is not allowed.",
  ],
  [
    "A Data Fiduciary must keep personal data accurate, protect it with reasonable safeguards, and report breaches.",
    "The organisation responsible for your data must keep it correct, protect it well, and report any data leak.",
  ],
  [
    "A Data Principal may obtain a summary of their personal data and the identities it has been shared with.",
    "The person the data is about can get a summary of their data and who it was shared with.",
  ],
  [
    "A notice must describe the personal data sought and the purpose for which it will be processed.",
    "Before using your data, you must be told what data is collected and why.",
  ],
  ["Open the Act", "Open the law"],

  // ---- BentoShowcase: small cards ----
  ["Seven questions. Your readiness score updates live.", "Seven questions. Your score updates as you go."],
  ["Is consent needed for product analytics?", "Do I need permission for product analytics?"],
  [
    "Plain answers on the Act, the Rules and your obligations.",
    "Plain answers on the Act, the Rules and your duties.",
  ],
  [
    "Maximum penalty per breach. Model your exposure with the calculators.",
    "Biggest fine per data leak. Work out your risk with the calculators.",
  ],
  ["Every State & UT", "Every State and Union Territory"],
  [
    "28 States · 8 Union Territories, mapped to local readiness.",
    "28 States · 8 Union Territories, matched to local readiness.",
  ],
  [
    "Scan your website for consent, notice, cookie and security gaps - and get a prioritised fix-list in minutes.",
    "Scan your website for gaps in permission, notices, cookies and security - and get a priority fix-list in minutes.",
  ],

  // ---- RiskCheck ("risk" namespace) ----
  ["Anix TrustStack™ · DPDP Risk Self-Assessment", "Anix TrustStack™ · DPDP Risk Self-Check"],
  [
    "One question for each stage of our 7D DPDP framework - Discover to Drive. Mark each and your readiness score updates live.",
    "One question for each stage of our 7D DPDP framework - Discover to Drive. Answer each and your score updates as you go.",
  ],
  ["Mark each question:", "Answer each question:"],
  [
    "Discover - Do you have a complete, current inventory of every personal-data flow across cloud, on-premise, vendors, and AI tools?",
    "Discover - Do you have a complete, up-to-date list of everywhere people's data moves - cloud, on-site, outside partners and AI tools?",
  ],
  [
    "Define - Can you show a documented purpose, lawful basis, and retention period for each category of personal data you process?",
    "Define - Can you show, in writing, why you use each type of people's data, your legal reason, and how long you keep it?",
  ],
  [
    "Design - Are your privacy notices, consent capture, and consent-withdrawal flows DPDP-ready and in clear, plain language?",
    "Design - Are your privacy notices, permission requests and permission-withdrawal steps DPDP-ready and in clear, plain language?",
  ],
  [
    "Defend - If a breach happened today, could you contain it and notify the Board and affected people within 72 hours?",
    "Defend - If a data leak happened today, could you stop it and tell the Board and affected people within 72 hours?",
  ],
  [
    "Deploy - Have DPDP processes, role-based training, and signed vendor DPAs actually rolled out across every department?",
    "Deploy - Have DPDP steps, role-based training and signed partner contracts actually rolled out across every department?",
  ],
  [
    "Demonstrate - Could you hand an auditor or the Data Protection Board evidence of your compliance on demand?",
    "Demonstrate - Could you show an auditor or the Data Protection Board proof that you follow the law, on request?",
  ],
  [
    "Drive - Does someone own DPDP day-to-day, with regular Data Principal rights, grievance, and AI-privacy reviews?",
    "Drive - Does someone run DPDP day-to-day, with regular checks on people's rights, complaints and AI privacy?",
  ],
  ["This control is fully in place across your organization", "This is fully in place across your organisation"],
  ["Audit-ready", "Ready for audit"],
  [
    "Don't guess your compliance status. DPDP Compass™ gives you a professional, evidence-based assessment with a 90-day action roadmap.",
    "Don't guess where you stand. DPDP Compass™ gives you a professional, evidence-based check with a 90-day action plan.",
  ],
  ["Can your organization answer these 7 questions?", "Can your organisation answer these 7 questions?"],
  ["Work has started but is not yet complete", "Started but not finished yet"],
  ["Not yet addressed or needs attention", "Not started, or needs attention"],
];
