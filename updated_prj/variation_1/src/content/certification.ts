import {
  Database,
  FileSignature,
  UserCheck,
  ShieldAlert,
  BookOpen,
  ClipboardCheck,
  GraduationCap,
  BadgeCheck,
  Clock,
  ScrollText,
  type LucideIcon,
} from "lucide-react";
import { MODULES, type ModuleLesson } from "./curriculum";

// Certification exam configuration. Questions are served at random from the
// database (the `exam_questions` table) via a capped server-side RPC - they are
// never bundled into the client. See supabase/secure_questions.sql.
export const EXAM_SIZE = 5;
export const EXAM_PASS_PCT = 100;
export const EXAM_MINUTES = 10;
export const EXAM_BANK_SIZE = 224;

// What a graduate can do - professional outcomes, not game rewards.
export const CERT_OUTCOMES: { title: string; desc: string; icon: LucideIcon }[] = [
  {
    title: "Map the data estate",
    desc: "Build a defensible inventory of personal-data flows across systems, vendors and AI tools.",
    icon: Database,
  },
  {
    title: "Operate lawful consent",
    desc: "Design notice, consent and withdrawal flows that satisfy the Act and the DPDP Rules 2025.",
    icon: FileSignature,
  },
  {
    title: "Honour data-principal rights",
    desc: "Run access, correction, erasure and grievance processes within statutory timelines.",
    icon: UserCheck,
  },
  {
    title: "Respond to a breach",
    desc: "Stand up a 72-hour breach response and the evidence the Data Protection Board expects.",
    icon: ShieldAlert,
  },
];

export const CERT_AUDIENCE = [
  "Data Protection Officers & privacy leads",
  "Legal, risk & compliance teams",
  "Security & engineering",
  "Founders & product managers",
];

export const CERT_STEPS: { n: number; title: string; desc: string; icon: LucideIcon }[] = [
  {
    n: 1,
    title: "Study the modules",
    desc: "Eight focused modules walk the DPDP Act, 2023 and the DPDP Rules 2025 section by section.",
    icon: BookOpen,
  },
  {
    n: 2,
    title: "Sit the certification exam",
    desc: "Answer questions drawn at random from the question bank, under timed exam conditions.",
    icon: ClipboardCheck,
  },
  {
    n: 3,
    title: "Meet the pass mark",
    desc: `Answer all ${EXAM_SIZE} questions correctly. Retake as often as you like.`,
    icon: GraduationCap,
  },
  {
    n: 4,
    title: "Earn your certificate",
    desc: "Claim a verifiable certificate naming you a Certified DPDP Practitioner.",
    icon: BadgeCheck,
  },
];

// The curriculum cards shown on the certification overview are derived from the
// full study modules, so the overview and the module reader never drift apart.
// The section-by-section theory, glossaries, scenarios and self-check quizzes
// behind each card live in content/curriculum.ts.
export type Module = ModuleLesson;
export const CERT_CURRICULUM: ModuleLesson[] = MODULES;

// Headline credential facts.
export const CERT_FORMAT: { label: string; value: string; icon: LucideIcon }[] = [
  { label: "Format", value: "Self-paced, online", icon: BookOpen },
  { label: "Effort", value: "About 3.5 hours", icon: Clock },
  { label: "Assessment", value: `${EXAM_SIZE}-question exam`, icon: ScrollText },
  { label: "Credential", value: "Verifiable certificate", icon: BadgeCheck },
];

export const EXAM_CONFIG = {
  questions: EXAM_SIZE,
  passPct: EXAM_PASS_PCT,
  minutes: EXAM_MINUTES,
};

export const MODULE_PASS_PCT = 70;
export const MODULE_CHECK_SIZE = 6;

export const CERT_FAQ: { q: string; a: string }[] = [
  {
    q: "Is the certification free?",
    a: "Yes - the modules, the assessment and the certificate are free and in the public interest.",
  },
  {
    q: "What does it cover?",
    a: "The full DPDP Act, 2023 and DPDP Rules 2025 - scope and definitions, notice and consent, legitimate uses, data-principal rights, fiduciary obligations, children's data, significant data fiduciaries, breach response, cross-border transfers and penalties.",
  },
  {
    q: "How is it assessed?",
    a: `A ${EXAM_SIZE}-question, ${EXAM_MINUTES}-minute exam, drawn at random from ${EXAM_BANK_SIZE} questions. Answer all ${EXAM_SIZE} correctly to earn the certificate - retake as often as you like.`,
  },
  {
    q: "How long does it take?",
    a: "About three to four hours, self-paced. Your progress and certificate are saved on this device.",
  },
  {
    q: "Is the credential recognised?",
    a: "It is an awareness credential issued by TrustStack's DPDP Academy, built on material mapped to the DPDP Act, 2023 and DPDP Rules 2025.",
  },
];
