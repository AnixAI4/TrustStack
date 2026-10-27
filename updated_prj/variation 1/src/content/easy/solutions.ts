/**
 * Easy read pairs for /solutions (the service stack) and the shared SERVICES
 * data (src/content/dpdp.ts).
 *
 * Format: [exact original visible text, plain-language version]. Brand names
 * with ™ (DPDP Ignite™, DPDP Compass™, etc.) are intentionally NOT translated.
 * Every number / language count / hour / module count is preserved exactly.
 */
export const PAIRS: [string, string][] = [
  // page hero handled in solutions/page.tsx via PageHero easy props

  // service tags
  ["Entry point", "Starting point"],
  ["Most popular", "Most chosen"],
  ["Full stack", "Everything included"],
  ["AI-powered", "AI-focused"],
  ["Ongoing", "Continuous"],
  ["SaaS platform", "TrustDeck workspace"],
  ["India first", "First in India"],

  // service subtitles
  ["Executive Awareness Workshop", "Leadership awareness workshop"],
  ["Readiness Assessment", "Readiness check"],
  ["Implementation Accelerator", "Fast setup help"],
  ["GenAI & AI Governance", "Safe AI use"],
  ["Managed Compliance Office", "Ongoing compliance support"],
  ["Privacy Operations SaaS", "Privacy software"],
  ["Certified DPDP Professional", "Certified DPDP professional"],

  // service descriptions
  [
    "A focused workshop for boards, CXOs, legal, IT, HR and AI teams - building urgency and alignment at leadership level.",
    "A short workshop for your board, senior leaders, legal, IT, HR and AI teams - to build urgency and get everyone aligned at the top.",
  ],
  [
    "A comprehensive 2-week DPDP readiness assessment - exactly where you stand, what's at risk and what to fix first, with a board-ready report.",
    "A 2-week check of how ready you are for DPDP - where you stand, what's at risk, and what to fix first, with a report your board can read.",
  ],
  [
    "End-to-end DPDP implementation - from data inventory to breach playbook - across every requirement of the Act 2023 and Rules 2025.",
    "Full DPDP setup - from listing your data to a data-leak plan - covering every requirement of the Act 2023 and Rules 2025.",
  ],
  [
    "Specialized DPDP governance for organizations using AI, GenAI, RAG systems, agents and copilots - AI governance as a core pillar, not an afterthought.",
    "Special DPDP help for companies using AI, GenAI, RAG systems, agents and copilots - with AI safety built in from the start, not added later.",
  ],
  [
    "Your outsourced DPDP compliance team - a monthly managed service from DPO support and grievances to vendor reviews and board reporting.",
    "An outside team that runs your DPDP compliance every month - from DPO support and complaints to partner reviews and board reports.",
  ],
  [
    "A 12-module TrustDeck workspace for real-time DPDP compliance tracking - from data inventory to board dashboard, always up to date.",
    "A 12-part online platform that tracks your DPDP compliance live - from listing your data to a board dashboard, always up to date.",
  ],
  [
    "India's first employer-verifiable DPDP professional certification - with a LinkedIn badge, unique certificate number and 2-year validity.",
    "India's first DPDP certificate that employers can verify - with a LinkedIn badge, a unique certificate number, and 2-year validity.",
  ],

  // service points
  ["What DPDP means for your organization", "What DPDP means for your company"],
  ["Director personal liability", "Personal risk for directors"],
  ["DPDP Rules 2025 key obligations", "Main duties under the DPDP Rules 2025"],
  ["Top 10 gaps most companies have", "The 10 gaps most companies have"],
  ["90-day action priorities", "What to do first in 90 days"],
  ["DPDP applicability review", "Check if DPDP applies to you"],
  ["Personal data inventory snapshot", "A quick list of the personal data you hold"],
  ["Notice & consent gap review", "Check your notices and permission steps"],
  ["AI / GenAI privacy risk assessment", "Check the privacy risks from your AI"],
  ["DPDP Maturity Scorecard & 90-day roadmap", "A DPDP score and a 90-day plan"],
  ["Complete data inventory & purpose mapping", "A full list of your data and why you use it"],
  ["Privacy notice redesign (22 Indian languages)", "Rewrite privacy notices in 22 Indian languages"],
  ["Consent workflow design & implementation", "Design and set up permission steps"],
  ["Data Principal rights request process", "A process for people to use their data rights"],
  ["72-hour breach notification playbook", "A plan to report a data leak within 72 hours"],
  ["GenAI and AI chatbot privacy risk assessment", "Check privacy risks from AI and chatbots"],
  ["Prompt data leakage identification", "Find where prompts could leak data"],
  ["RAG system personal data review", "Check personal data in RAG systems"],
  ["AI vendor governance framework", "Rules for managing AI vendors"],
  ["Machine unlearning advisory", "Advice on removing data from AI models"],
  ["DPO / Responsible Person function", "Act as your DPO / responsible person"],
  ["Monthly privacy operations management", "Run your privacy tasks each month"],
  ["Grievance workflow management", "Handle complaints end to end"],
  ["Quarterly vendor / processor review", "Review vendors every three months"],
  ["Board compliance dashboard", "A compliance dashboard for your board"],
  ["Data Inventory & RoPA Builder", "A tool to list data and build your RoPA"],
  ["Consent Register with audit trail", "A permission record with a full history"],
  ["Rights Request Tracker", "A tracker for data-rights requests"],
  ["Breach Tracker (72-hr countdown)", "A data-leak tracker with a 72-hour countdown"],
  ["Board Dashboard - real-time scorecard", "A board dashboard with a live score"],
  ["6-module DPDP curriculum", "A 6-part DPDP course"],
  ["Unique certificate number (employer-verifiable)", "A unique certificate number employers can check"],
  ["Employer verification portal", "A portal for employers to verify"],
  ["LinkedIn digital badge integration", "A LinkedIn digital badge"],
  ["Hindi + English delivery", "Taught in Hindi and English"],

  // services grid - closing card + shared bits
  ["Custom quote · based on organization size", "Custom price · based on your company size"],
  ["Request a quote →", "Ask for a price →"],
  ["Not sure where to start?", "Not sure where to begin?"],
  [
    "Begin with a free DPDP risk check, then let DPDP Compass™ map your 90-day roadmap.",
    "Start with a free DPDP risk check. Then DPDP Compass™ maps your 90-day plan.",
  ],
  ["Start the risk check", "Start the free check"],

  // Service Explorer - briefing section labels
  ["The problem it removes", "The problem it fixes"],
  ["A real scenario", "A real example"],
  ["The outcome", "The result"],
  ["Pairs well with", "Works well with"],
  ["Tap a service above to see its briefing", "Tap a service above to see what it does"],
  ["Tap a service to see its briefing", "Tap a service to see what it does"],

  // Service Explorer - per-service "what it is" one-liners
  [
    "A focused half-day workshop that turns \u201CDPDP is Legal's problem\u201D into a board-level priority \u2014 with the personal-liability and penalty facts that actually make leaders act.",
    "A short half-day workshop that turns \u201CDPDP is Legal's problem\u201D into a top priority for your board \u2014 with the personal-risk and penalty facts that make leaders act.",
  ],
  [
    "A structured two-week assessment that tells you exactly where you stand against the DPDP Act 2023 and Rules 2025 \u2014 and what to fix first.",
    "A clear two-week check that tells you exactly where you stand against the DPDP Act 2023 and Rules 2025 \u2014 and what to fix first.",
  ],
  [
    "A hands-on implementation sprint that takes you from a personal-data inventory all the way to a working 72-hour breach playbook \u2014 every requirement of the Act, actually built.",
    "A hands-on setup sprint that takes you from listing your personal data all the way to a working 72-hour data-leak plan \u2014 every requirement of the Act, actually built.",
  ],
  [
    "DPDP governance built specifically for GenAI, RAG systems, agents and copilots \u2014 so the personal data flowing through your AI stays lawful, and 'delete my data' still means something.",
    "DPDP safeguards built just for GenAI, RAG systems, agents and copilots \u2014 so the personal data moving through your AI stays lawful, and 'delete my data' still means something.",
  ],
  [
    "An ongoing managed compliance office \u2014 your outsourced DPO / Responsible Person function that keeps DPDP running every month instead of decaying after the project ends.",
    "An ongoing compliance office we run for you \u2014 an outside DPO / Responsible Person who keeps DPDP working every month instead of fading after the project ends.",
  ],
  [
    "A 12-module SaaS control-plane for DPDP \u2014 your RoPA, consent register, rights tracker, 72-hour breach countdown and board scorecard, all live in one place instead of scattered across spreadsheets.",
    "A 12-part online platform for DPDP \u2014 your RoPA, consent register, rights tracker, 72-hour breach countdown and board scorecard, all live in one place instead of scattered across spreadsheets.",
  ],
  [
    "India's first employer-verifiable DPDP professional certification \u2014 a structured way to prove you can actually operate the Act 2023 and Rules 2025, not just quote them.",
    "India's first DPDP certificate that employers can verify \u2014 a clear way to prove you can actually run the Act 2023 and Rules 2025, not just quote them.",
  ],
];
