import type { LucideIcon } from "lucide-react";
import {
  FileText,
  ScrollText,
  FileCheck2,
  Scale,
  GraduationCap,
  Newspaper,
  LayoutGrid,
  Compass,
  Wrench,
} from "lucide-react";

export const HERO = {
  kicker: "Digital Personal Data Protection Act · 2023",
  titleLead: "Read the ",
  titleEm1: "DPDP Act",
  titleMid: " like a ",
  titleEm2: "story",
  titleTail: ", not a statute.",
  subhead:
    "India's data-protection law - all 44 sections and the 2025 Rules - woven into one clear, searchable thread. Plain meaning beside the official text, cross-linked to penalties, templates and case law.",
  sealMain: "DPDP Act · 2023",
  sealRing: "· GAZETTE OF INDIA · ENACTED 2023 · PRIVACY ",
  stamp: ["Government of India", "Digital Personal Data Protection Act"],
  stampHindi: "निजता · आपका मौलिक अधिकार",
  searchPlaceholder: "Search sections, rules, templates, penalties?",
  searchChips: ["Consent", "Data breach", "Children's data", "Penalties"],
};

export const MARQUEE_LINES = [
  "Digital Personal Data Protection Act, 2023",
  "डिजिटल व्यक्तिगत डेटा संरक्षण अधिनियम",
  "निजता आपका अधिकार",
  "Privacy is your right",
  "Consent · सहमति",
];

export const RISK_CHECK = {
  eyebrow: "Anix TrustStack™ · DPDP Risk Self-Assessment",
  heading: "Can your organization answer these 7 questions?",
  subheading:
    "One question for each stage of our 7D DPDP framework - Discover to Drive. Mark each and your readiness score updates live.",
  questions: [
    "Discover - Do you have a complete, current inventory of every personal-data flow across cloud, on-premise, vendors, and AI tools?",
    "Define - Can you show a documented purpose, lawful basis, and retention period for each category of personal data you process?",
    "Design - Are your privacy notices, consent capture, and consent-withdrawal flows DPDP-ready and in clear, plain language?",
    "Defend - If a breach happened today, could you contain it and notify the Board and affected people within 72 hours?",
    "Deploy - Have DPDP processes, role-based training, and signed vendor DPAs actually rolled out across every department?",
    "Demonstrate - Could you hand an auditor or the Data Protection Board evidence of your compliance on demand?",
    "Drive - Does someone own DPDP day-to-day, with regular Data Principal rights, grievance, and AI-privacy reviews?",
  ],
  ctaText:
    "Don't guess your compliance status. DPDP Compass™ gives you a professional, evidence-based assessment with a 90-day action roadmap.",
  ctaPrimary: "Book DPDP Compass™",
  ctaSecondary: "See the 7D Framework",
};

export type ExploreCard = {
  label: string;
  href: string;
  desc: string;
  icon: LucideIcon;
};

export const EXPLORE: ExploreCard[] = [
  {
    label: "Solutions",
    href: "/solutions",
    desc: "The complete DPDP service stack, industry playbooks, AI Privacy Shield and how we compare.",
    icon: LayoutGrid,
  },
  {
    label: "Framework",
    href: "/framework",
    desc: "Our end-to-end 7D methodology and a dashboard to track your readiness.",
    icon: Compass,
  },
  {
    label: "Tools",
    href: "/tools",
    desc: "Model penalty, ROI and breach cost, then generate DPDP documents.",
    icon: Wrench,
  },
  {
    label: "The Act",
    href: "/act",
    desc: "All 44 sections, nine chapters - official text beside plain meaning.",
    icon: FileText,
  },
  {
    label: "DPDP Rules 2025",
    href: "/rules",
    desc: "Every rule shown beside the section it gives effect to.",
    icon: ScrollText,
  },
  {
    label: "Templates",
    href: "/templates",
    desc: "Editable, DPDP-aligned policies, agreements and notices.",
    icon: FileCheck2,
  },
  {
    label: "Case Laws",
    href: "/cases",
    desc: "The privacy judgments that shaped the law, distilled.",
    icon: Scale,
  },
  {
    label: "Learn & Certify",
    href: "/learn",
    desc: "A structured course, an adaptive quiz and free tools.",
    icon: GraduationCap,
  },
  {
    label: "Insights",
    href: "/blog",
    desc: "Plain-spoken analysis of the Act, the Rules and what they mean.",
    icon: Newspaper,
  },
];

// DPDP Scanner - native TrustStack page (Pilot). Same chrome as /security.
export const DPDP_SCANNER_URL = "/scanner";

export const FINAL_CTA = {
  heading: "Turn the DPDP Act into a compliance program you can prove.",
  subheading:
    "From a free DPDP risk check to a board-ready roadmap, Anix TrustStack helps you manage AI and DPDP together - securely and sustainably.",
  primary: { label: "Free DPDP risk check", href: "/#risk-check" },
  secondary: { label: "Explore the service stack", href: "/solutions" },
  scanner: { label: "DPDP Scanner", href: DPDP_SCANNER_URL },
};

export const MAP_TAGLINE = {
  lead: "Protecting ",
  em: "every state of India",
  tail: " · under the DPDP Act, 2023",
};
