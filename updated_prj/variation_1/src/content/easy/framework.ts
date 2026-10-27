/**
 * Easy read pairs for /framework:
 *  - FrameworkSection  (the "7D" method - content/dpdp.ts FRAMEWORK)
 *  - PlatformShowcase  (TrustDeck mock + bullets)
 *  - BadgeShowcase     (gamified journey)
 *
 * PageHero + EasyIntro already provide easy variants via data-rm props, so the
 * hero is not repeated here. Brand/product/™ names and the 7D stage names
 * (Discover…Drive) are kept. Numbers, deadlines and statute refs stay exact.
 */
export const PAIRS: [string, string][] = [
  // ---- FrameworkSection: header ----
  ["Proprietary methodology · Trademark pending", "Our own method · Trademark pending"],
  [
    "India's first end-to-end DPDP compliance methodology - from data discovery to continuous compliance operations. Each stage builds on the last into one evidence-based program.",
    "India's first complete DPDP method - from finding your data to running privacy every day. Each step builds on the last into one program you can prove.",
  ],

  // ---- FrameworkSection: stage taglines ----
  ["Map purpose and accountability", "Map why you use data and who is responsible"],
  ["Build compliant workflows", "Build steps that follow the law"],
  ["Security & breach readiness", "Security and data-leak readiness"],
  ["Implement across the organization", "Roll it out across the organisation"],
  ["Build evidence and board dashboards", "Gather proof and board dashboards"],
  ["Continuous compliance operations", "Run privacy every day"],

  // ---- FrameworkSection: stage points ----
  ["Personal data inventory across systems", "A list of all personal data across your systems"],
  ["Vendor and processor identification", "Find your outside partners and data handlers"],
  ["AI/GenAI data touchpoints", "Where AI tools touch personal data"],
  ["Shadow IT and cloud data stores", "Hidden apps and cloud data stores"],
  ["Employee and customer data categories", "Types of staff and customer data"],
  ["Purpose of processing documentation", "Write down why you use each data set"],
  ["Legal basis determination", "Decide your legal reason for using data"],
  ["Consent and legitimate interest mapping", "Map permission and legitimate-interest reasons"],
  ["Data retention schedule definition", "Set how long you keep each data set"],
  ["RoPA (Record of Processing Activities) creation", "Create a record of how you use data (RoPA)"],
  ["Consent capture and withdrawal workflows", "Steps to get and withdraw permission"],
  ["Data Principal rights processes", "Steps for people to use their rights"],
  ["Grievance redressal mechanism", "A way to handle complaints"],
  ["Data Processing Agreements with vendors", "Data-handling contracts with partners"],
  ["Security safeguard gap assessment", "Check for gaps in your security"],
  ["Access control and data minimization", "Limit access and collect only what is needed"],
  ["Encryption and masking implementation", "Set up encryption and data masking"],
  ["72-hour breach notification plan", "A 72-hour data-leak reporting plan"],
  ["Incident response playbook", "A step-by-step plan for incidents"],
  ["Department-specific SOP rollout", "Roll out steps for each department"],
  ["Privacy notice and consent deployment", "Put privacy notices and permission live"],
  ["Employee training by role", "Staff training by role"],
  ["Vendor DPA execution and tracking", "Sign and track partner contracts"],
  ["Evidence vault for compliance activities", "A store of proof for your privacy work"],
  ["DPDP Maturity Scorecard (10 dimensions)", "DPDP maturity scorecard (10 areas)"],
  ["Board-ready compliance dashboard", "A dashboard ready for your board"],
  ["Risk heatmap for leadership", "A risk heatmap for leaders"],
  ["Regulator-ready documentation package", "A document pack ready for the authority"],
  ["DPO / Responsible Person support", "DPO / responsible-person support"],
  ["Quarterly rights and grievance review", "Quarterly review of rights and complaints"],
  ["AI / GenAI privacy quarterly assessment", "Quarterly AI privacy check"],

  // ---- PlatformShowcase ----
  [
    "From a boardroom dashboard to your phone - Discover to Drive, every discipline and its evidence, always in sync.",
    "From a boardroom dashboard to your phone - Discover to Drive, every step and its proof, always in sync.",
  ],
  ["Live readiness across all seven disciplines", "Live readiness across all seven steps"],
  ["Evidence vault and audit trail on the go", "A store of proof and history, on the go"],
  ["Board-ready maturity score, updated continuously", "A board-ready score, always up to date"],
  ["Maturity by discipline", "Progress by step"],

  // ---- BadgeShowcase ----
  ["Gamified journey", "A fun journey"],
  [
    "Every tool you use lifts your readiness score and earns a badge. Here's the whole journey - watch it play, then start earning your own.",
    "Every tool you use raises your score and earns a badge. Here's the whole journey - watch it play, then start your own.",
  ],
  ["Compliance-ready", "Ready to comply"],
  ["Leveling up", "Levelling up"],
  ["All 8 badges earned - compliance-ready!", "All 8 badges earned - ready to comply!"],
  ["Completed the risk self-assessment", "Finished the risk self-check"],
  ["Modelled penalty exposure", "Worked out possible fines"],
  ["Set consent preferences", "Set permission choices"],
  ["Generated a DPDP document", "Made a DPDP document"],
  ["Reached compliance-ready", "Reached ready-to-comply"],
  [
    "A live preview of TrustStack's gamified journey - earn all eight as you complete the tools. Your real progress saves privately in your browser, never uploaded.",
    "A live preview of TrustStack's fun journey - earn all eight as you finish the tools. Your real progress is saved privately in your browser, never uploaded.",
  ],
];
