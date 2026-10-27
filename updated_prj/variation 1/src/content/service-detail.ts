/**
 * "Extra information" content model for the Service Explorer on /solutions.
 *
 * SERVICE_DETAIL is the deep, plain-English copy that removes the vagueness of
 * the flat services grid - what each service actually is, who it's for, the
 * problem it removes, what you get, a real scenario, the outcome, and what it
 * pairs with. Written to be accurate to the DPDP Act 2023 + DPDP Rules 2025.
 *
 * SERVICE_ACCENT mirrors SECTOR_ACCENT (industry-advisor.ts): the seven services
 * map 1:1 onto the seven accent hues, so the explorer and the ServiceScenery pop
 * share one source of truth for theming via `--c`.
 *
 * Keyed by the EXACT SERVICES[].name (src/content/dpdp.ts) - including the ™.
 */

export const SERVICE_ACCENT: Record<string, string> = {
  "DPDP Ignite™": "var(--accent-rgb)",
  "DPDP Compass™": "var(--gold-rgb)",
  "DPDP Build™": "var(--blue-rgb)",
  "AI Privacy Shield™": "var(--brand-rgb)",
  "DPDP TrustOps™": "var(--green-rgb)",
  "TrustDeck™": "var(--amber-rgb)",
  "CDPP Certification™": "var(--red-rgb)",
};

/** Where each service sits on the compliance journey (for the ribbon/label). */
export type ServiceStage =
  | "Learn"
  | "Assess"
  | "Implement"
  | "Govern"
  | "Operate"
  | "Certify";

export type ServiceDetail = {
  stage: ServiceStage;
  /** Punchy headline stat for the briefing header (like the sector briefing). */
  stat: { value: string; label: string };
  /** One plain-English sentence: what this actually is. */
  oneLiner: string;
  /** Who it's genuinely for (rendered as chips). */
  bestFor: string[];
  /** The concrete pain it removes (2 sentences). */
  problem: string;
  /** What you walk away with - outcomes, not features (can extend SERVICES[].points). */
  youGet: string[];
  /** A plausible, specific day-in-the-life story (rendered italic, like the sector scenario). */
  scenario: string;
  /** The after-state - what's different once it's done. */
  outcome: string;
  /** Rough effort/duration. */
  timeline: string;
  /** Other SERVICES[].name this combines with (rendered as links). */
  pairsWith: string[];
};

/** Keyed by the EXACT SERVICES[].name. */
export const SERVICE_DETAIL: Record<string, ServiceDetail> = {
  "DPDP Ignite™": {
    stage: "Learn",
    stat: { value: "Leadership", label: "For your board & CXOs" },
    oneLiner:
      "A focused workshop that turns \u201CDPDP is Legal's problem\u201D into a board-level priority \u2014 with the personal-liability and penalty facts that actually make leaders act.",
    bestFor: [
      "Boards & CXOs who set the mandate",
      "Legal, IT, HR & AI leads who'll own the work",
      "Founders who haven't started yet",
    ],
    problem:
      "Most leadership teams badly under-rate the DPDP Act - they treat it as a compliance checkbox while the Act makes directors and senior management personally accountable, with penalties up to ₹250cr per breach. Without urgency at the top, the programme never gets funded, staffed or owned.",
    youGet: [
      "A plain-English briefing on what the DPDP Act 2023 + Rules 2025 actually require",
      "The director & senior-management personal-liability picture, spelled out",
      "The top 10 gaps we find in almost every Indian organisation",
      "A shared view of your biggest exposures - before a regulator finds them",
      "90-day action priorities the room agrees on",
    ],
    scenario:
      "A 1,200-person manufacturer's board had 'noted DPDP' twice and moved on. Forty minutes into Ignite, the personal-liability slide landed - the same directors green-lit a funded programme and a DPO hire that afternoon, months before their first enterprise-customer audit.",
    outcome:
      "Leadership stops delegating DPDP downward and starts sponsoring it - you leave with an aligned room, a shared risk picture, and the mandate to move.",
    timeline: "A single session",
    pairsWith: ["DPDP Compass™"],
  },

  "DPDP Compass™": {
    stage: "Assess",
    stat: { value: "Baseline", label: "See where you stand today" },
    oneLiner:
      "A structured assessment that tells you exactly where you stand against the DPDP Act 2023 and Rules 2025 - and what to fix first.",
    bestFor: [
      "Boards & CXOs who need a clear risk picture",
      "DPOs building the business case",
      "Teams that started but aren't sure it's enough",
    ],
    problem:
      "Most teams can't answer the first question a regulator or enterprise client asks: 'where does personal data live, and can you prove consent for it?' Without a baseline, every rupee of later spend is a guess.",
    youGet: [
      "DPDP applicability review - is the Act triggering on you, and where",
      "A personal-data inventory snapshot across your key systems",
      "Notice & consent gap review against DPDP Rules 2025",
      "AI / GenAI privacy risk assessment",
      "A DPDP Maturity Scorecard + a prioritised 90-day roadmap",
    ],
    scenario:
      "A 400-person fintech thought it was 'mostly compliant'. Compass found KYC data flowing into three analytics tools with no consent basis and no retention limit - exactly the exposure a ₹250cr penalty is written for. They fixed it before a bank partner's audit, not after.",
    outcome:
      "You leave with a board-ready scorecard, a ranked list of gaps, and a 90-day plan - so spend is targeted, not scattered.",
    timeline: "A short engagement",
    pairsWith: ["DPDP Ignite™", "DPDP Build™"],
  },

  "DPDP Build™": {
    stage: "Implement",
    stat: { value: "Hands-on", label: "Implementation, not just policy" },
    oneLiner:
      "A hands-on implementation sprint that takes you from a personal-data inventory all the way to a working 72-hour breach playbook - every requirement of the Act, actually built.",
    bestFor: [
      "Teams with an assessment done and gaps to close",
      "DPOs who need real workflows, not just policies",
      "Orgs facing an enterprise or regulator deadline",
    ],
    problem:
      "Knowing your gaps doesn't close them - and DPDP compliance isn't a document, it's a set of working processes: consent capture, notices in the languages your users read, a way for people to exercise their rights, and a breach drill that meets the Board's timeline. Most teams stall because turning the Act into day-to-day operations is the hard part.",
    youGet: [
      "A complete personal-data inventory & purpose mapping (your RoPA foundation)",
      "Privacy notices redesigned and translated across 22 Indian languages",
      "Consent capture & withdrawal workflows wired into your systems",
      "A Data Principal rights-request process (access, correction, erasure, grievance)",
      "A tested 72-hour breach-notification playbook for the Board and affected users",
    ],
    scenario:
      "A health-tech firm had policies but no plumbing - when a vendor exposed patient records, it had no way to notify affected users or the Board in time. Post-Build, its next incident was contained and reported inside the 72-hour window, turning a potential ₹250cr-class penalty into a logged, defensible response.",
    outcome:
      "DPDP stops being a binder and becomes how you operate - consent, notices, rights and breach response all run as real workflows your team can prove.",
    timeline: "A focused sprint",
    pairsWith: ["DPDP Compass™", "AI Privacy Shield™", "TrustDeck™"],
  },

  "AI Privacy Shield™": {
    stage: "Govern",
    stat: { value: "AI-first", label: "For GenAI, agents & RAG" },
    oneLiner:
      "DPDP governance built specifically for GenAI, RAG systems, agents and copilots - so the personal data flowing through your AI stays lawful, and 'delete my data' still means something.",
    bestFor: [
      "Teams shipping GenAI, RAG or agent features",
      "AI / ML & product leads handling personal data",
      "DPOs who can't assess AI risk alone",
    ],
    problem:
      "GenAI breaks the assumptions most privacy programmes are built on: models memorise training data, prompts leak personal information into third-party APIs, and RAG pipelines quietly pull in personal data no one inventoried. The DPDP right to erasure collides head-on with a model that can't easily forget - and standard governance simply doesn't cover it.",
    youGet: [
      "A GenAI & AI-chatbot privacy risk assessment against DPDP duties",
      "Prompt-and-output data-leakage identification across your AI surfaces",
      "A personal-data review of your RAG / retrieval pipelines",
      "An AI vendor & model governance framework (sub-processors, cross-border, contracts)",
      "Machine-unlearning & retention advisory for the right-to-erasure problem",
    ],
    scenario:
      "A SaaS company wired customer support tickets - names, emails, complaints - straight into a third-party LLM with no data agreement. Shield found personal data leaving India through prompts with no lawful basis; they fenced it, added consent and a processor contract, and avoided exactly the cross-border exposure the Act polices.",
    outcome:
      "Your AI ships with privacy guardrails, not surprises - every model, prompt and retrieval path has a known lawful basis and a plan for erasure.",
    timeline: "Scoped to your AI stack",
    pairsWith: ["DPDP Compass™", "DPDP Build™", "DPDP TrustOps™"],
  },

  "DPDP TrustOps™": {
    stage: "Operate",
    stat: { value: "Ongoing", label: "A managed privacy office" },
    oneLiner:
      "An ongoing managed compliance office - your outsourced DPO / Responsible Person function that keeps DPDP running every month instead of decaying after the project ends.",
    bestFor: [
      "Orgs without a full-time DPO or privacy team",
      "Companies that finished a project and need to sustain it",
      "Boards wanting continuous assurance, not annual panic",
    ],
    problem:
      "DPDP compliance isn't a one-off - grievances arrive, vendors change, rights requests need answering inside statutory timelines, and the Board expects evidence it's all still working. Most teams don't have the bandwidth to run a privacy office month after month, so hard-won compliance quietly erodes.",
    youGet: [
      "A named DPO / Responsible Person function on call for your organisation",
      "Month-to-month privacy operations management",
      "An end-to-end grievance & rights-request workflow within DPDP timelines",
      "Quarterly vendor / data-processor reviews",
      "A board compliance dashboard and annual DPDP audit & report",
    ],
    scenario:
      "A mid-market lender kept missing the statutory clock on data-rights requests because no one owned them. With TrustOps, every request now routes to a named responsible person and closes on time - turning a recurring grievance risk into a monthly report the board actually trusts.",
    outcome:
      "Compliance stays alive between projects - someone accountable owns it, requests close on time, and the board sees continuous proof, not a stale certificate.",
    timeline: "Ongoing · monthly",
    pairsWith: ["DPDP Build™", "TrustDeck™", "AI Privacy Shield™"],
  },

  "TrustDeck™": {
    stage: "Operate",
    stat: { value: "TrustDeck", label: "DPDP ops in one place" },
    oneLiner:
      "A 12-module SaaS control-plane for DPDP - your RoPA, consent register, rights tracker, 72-hour breach countdown and board scorecard, all live in one place instead of scattered across spreadsheets.",
    bestFor: [
      "Privacy & DPO teams drowning in spreadsheets",
      "Orgs that need audit-ready evidence on demand",
      "Groups managing DPDP across many entities or systems",
    ],
    problem:
      "Once DPDP is live, the operational load is relentless - consent records, processing activities, rights requests and breach clocks all need tracking, and when a regulator or enterprise client asks for evidence, hunting through spreadsheets doesn't cut it. Manual tracking simply doesn't scale to the Act's expectations.",
    youGet: [
      "A Data Inventory & RoPA builder that stays current",
      "A consent register with a full, exportable audit trail",
      "A rights-request tracker that enforces statutory timelines",
      "A breach tracker with a live 72-hour countdown",
      "A real-time board dashboard & DPDP maturity scorecard",
    ],
    scenario:
      "A retail group ran DPDP across nine business units in disconnected sheets; an enterprise customer's audit request took three weeks and still had gaps. On TrustStack, they exported a complete consent-and-RoPA trail in an afternoon - and closed the deal instead of the audit closing them.",
    outcome:
      "Compliance becomes a live system of record - evidence is one export away, breach clocks never slip, and the board sees your real posture in real time.",
    timeline: "Always-on",
    pairsWith: ["DPDP Build™", "DPDP TrustOps™"],
  },

  "CDPP Certification™": {
    stage: "Certify",
    stat: { value: "Verifiable", label: "Employer-checkable credential" },
    oneLiner:
      "India's first employer-verifiable DPDP professional certification - a structured way to prove you can actually operate the Act 2023 and Rules 2025, not just quote them.",
    bestFor: [
      "DPOs & privacy professionals proving their expertise",
      "Legal, IT, security & compliance staff moving into privacy",
      "Employers who need DPDP-ready people they can verify",
    ],
    problem:
      "DPDP created overnight demand for people who can run it - but 'I read the Act' isn't a credential, and employers have no reliable way to tell real DPDP capability from a LinkedIn line. That leaves professionals unable to prove their skill and organisations unable to hire with confidence.",
    youGet: [
      "A 6-module DPDP curriculum covering the Act 2023 & Rules 2025 in practice",
      "A unique, employer-verifiable certificate number",
      "An employer verification portal to confirm any credential",
      "A LinkedIn digital badge that links back to verification",
      "Delivery in Hindi + English, with 2-year validity",
    ],
    scenario:
      "A compliance manager kept losing DPO shortlists to candidates who 'sounded' qualified. After earning the CDPP, her verifiable certificate number and badge let a hiring panel confirm her credential in seconds - she got the role, and the employer got proof, not a claim.",
    outcome:
      "Your DPDP expertise becomes provable - a verifiable credential employers can check in seconds, backing your role and your rate.",
    timeline: "Self-paced",
    pairsWith: ["DPDP Ignite™", "DPDP TrustOps™"],
  },
};
