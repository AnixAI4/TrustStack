import {
  Compass,
  FileSignature,
  UserCheck,
  ShieldAlert,
  Baby,
  Gavel,
  type LucideIcon,
} from "lucide-react";

export type TrailModule = {
  n: number; // also maps to exam_questions.module
  title: string;
  summary: string;
  objectives: string[];
  minutes: number;
  xp: number;
  badge: string;
  icon: LucideIcon;
};

// The 6-stop DPDP compliance journey. Each stop ends in a module check drawn
// from the certificate-exam bank (exam_questions / EXAM_BANK) for that module.
export const TRAIL: TrailModule[] = [
  {
    n: 1,
    title: "Foundations of the DPDP Act",
    summary: "Scope, key definitions and the people the law cares about.",
    objectives: [
      "Why the Act exists and who it binds",
      "Data Principal, Fiduciary and Processor",
      "What counts as digital personal data",
    ],
    minutes: 12,
    xp: 100,
    badge: "Foundations",
    icon: Compass,
  },
  {
    n: 2,
    title: "Notice & consent",
    summary: "Lawful grounds, valid consent and the 2025 Rules.",
    objectives: [
      "Sections 5-7 and legitimate uses",
      "What makes consent valid and withdrawable",
      "Consent Managers under the Rules",
    ],
    minutes: 14,
    xp: 100,
    badge: "Consent Pro",
    icon: FileSignature,
  },
  {
    n: 3,
    title: "Rights of the Data Principal",
    summary: "Access, correction, erasure, nomination and grievance.",
    objectives: [
      "The full set of Data Principal rights",
      "Handling requests within deadline",
      "Grievance redressal mechanics",
    ],
    minutes: 12,
    xp: 100,
    badge: "Rights Guardian",
    icon: UserCheck,
  },
  {
    n: 4,
    title: "Obligations & breach response",
    summary: "Security safeguards and 72-hour breach reporting.",
    objectives: [
      "Reasonable security safeguards",
      "Data minimisation and retention",
      "Breach intimation to Board & principals",
    ],
    minutes: 15,
    xp: 100,
    badge: "Breach Ready",
    icon: ShieldAlert,
  },
  {
    n: 5,
    title: "Children & significant fiduciaries",
    summary: "Section 9, Section 10, DPOs and DPIAs.",
    objectives: [
      "Verifiable parental consent",
      "Who is a Significant Data Fiduciary",
      "DPO, audits and impact assessments",
    ],
    minutes: 13,
    xp: 100,
    badge: "SDF Specialist",
    icon: Baby,
  },
  {
    n: 6,
    title: "The Board, penalties & appeals",
    summary: "Enforcement end to end and the road to appeal.",
    objectives: [
      "The Data Protection Board",
      "Graded penalties up to ₹250 crore",
      "Appeals to the TDSAT",
    ],
    minutes: 11,
    xp: 100,
    badge: "Enforcement Expert",
    icon: Gavel,
  },
];

export type Rank = { name: string; minXp: number; tagline: string };

// XP ladder - completing all 6 module checks (600 XP) reaches Champion.
export const RANKS: Rank[] = [
  { name: "DPDP Recruit", minXp: 0, tagline: "Just getting started" },
  { name: "DPDP Aware", minXp: 100, tagline: "You know the basics" },
  { name: "DPDP Practitioner", minXp: 250, tagline: "Putting it into practice" },
  { name: "DPDP Specialist", minXp: 450, tagline: "Deep, applied knowledge" },
  { name: "DPDP Champion", minXp: 600, tagline: "Certification-ready" },
];

export const PASS_THRESHOLD = 0.7; // 70% to clear a module check
export const CHECK_SIZE = 6; // questions served per module check
export const TOTAL_XP = TRAIL.reduce((s, m) => s + m.xp, 0);

export function rankFor(xp: number): Rank {
  let r = RANKS[0];
  for (const rank of RANKS) if (xp >= rank.minXp) r = rank;
  return r;
}

export function nextRankFor(xp: number): Rank | null {
  return RANKS.find((r) => r.minXp > xp) ?? null;
}
