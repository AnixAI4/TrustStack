import {
  BookOpen,
  Users,
  ShieldCheck,
  UserCheck,
  Gavel,
  Sparkles,
  CalendarClock,
  Globe2,
  FileX2,
  Building2,
  User,
  Workflow,
  MousePointerClick,
  Undo2,
  FileText,
  Eye,
  MessageCircleWarning,
  UserPlus,
  BellRing,
  Scale,
  Landmark,
  FileStack,
  ScanSearch,
  type LucideIcon,
} from "lucide-react";

export type ExplainerPoint = {
  icon: LucideIcon;
  title: string;
  desc: string;
};

export type ExplainerSlide = {
  icon: LucideIcon;
  colorKey: "accent" | "brand" | "green" | "amber" | "red";
  eyebrow: string;
  title: string;
  body: string;
  points: ExplainerPoint[];
  tip: string;
};

export const DPDP_EXPLAINER_SLIDES: ExplainerSlide[] = [
  {
    icon: BookOpen,
    colorKey: "accent",
    eyebrow: "1 of 6 · The basics",
    title: "What is the DPDP Act?",
    body: "India's Digital Personal Data Protection Act, 2023 sets the rules for how any personal data - yours or your customers' - can be collected, used and stored.",
    points: [
      { icon: CalendarClock, title: "2023 → 2025", desc: "Signed into law in 2023, rules notified in 2025." },
      { icon: Globe2, title: "Digital data, India", desc: "Covers digital personal data processed in India." },
      { icon: FileX2, title: "Replaces old rules", desc: "Replaces the old, vague IT Rules approach." },
    ],
    tip: "Think of it as India's rulebook for anyone who touches your personal data.",
  },
  {
    icon: Users,
    colorKey: "brand",
    eyebrow: "2 of 6 · Who it covers",
    title: "Who has to follow it?",
    body: "Any person or business that decides how personal data is used - a \"Data Fiduciary\" - must comply, whether they're a startup, a bank, or a hospital.",
    points: [
      { icon: Building2, title: "Every organisation", desc: "Applies to Indian entities and foreign ones serving Indian users." },
      { icon: User, title: "Data Principal = you", desc: "\u201cData Principal\u201d is simply the person the data belongs to." },
      { icon: Workflow, title: "Processors included", desc: "Processors acting on a fiduciary's behalf are covered too." },
    ],
    tip: "If you collect names, emails or phone numbers from Indian users, this law applies to you.",
  },
  {
    icon: UserCheck,
    colorKey: "green",
    eyebrow: "3 of 6 · Consent",
    title: "Consent has to mean something",
    body: "Consent must be free, specific, informed, unconditional and unambiguous - given through a clear, affirmative action. No pre-ticked boxes, no buried clauses.",
    points: [
      { icon: MousePointerClick, title: "Active yes only", desc: "People must actively say yes - silence isn't consent." },
      { icon: Undo2, title: "Easy withdrawal", desc: "Withdrawing consent must be as easy as giving it." },
      { icon: FileText, title: "Purpose-specific", desc: "Each purpose needs its own clear notice." },
    ],
    tip: "A confusing checkbox maze is exactly what this section was written to stop.",
  },
  {
    icon: ShieldCheck,
    colorKey: "amber",
    eyebrow: "4 of 6 · Your rights",
    title: "You get real rights over your data",
    body: "Every Data Principal can ask a company to show, correct, erase or explain how their data is used - and even name someone to act on their behalf.",
    points: [
      { icon: Eye, title: "Access & correct", desc: "Access, correction and erasure of your personal data." },
      { icon: MessageCircleWarning, title: "Grievance channel", desc: "A clear grievance-redressal channel at every company." },
      { icon: UserPlus, title: "Nominate someone", desc: "Nomination of another person in case of death or incapacity." },
    ],
    tip: "You don't need a lawyer - a simple written request is enough to start.",
  },
  {
    icon: Gavel,
    colorKey: "red",
    eyebrow: "5 of 6 · Enforcement",
    title: "Breaking it gets expensive",
    body: "The Data Protection Board of India can investigate complaints and impose penalties of up to ₹250 crore per breach, based on how serious and repeated it is.",
    points: [
      { icon: BellRing, title: "Breach notice", desc: "Breach notification to the Board and affected users." },
      { icon: Scale, title: "Board can act", desc: "Board can inquire, penalise or accept voluntary undertakings." },
      { icon: Landmark, title: "Appeals process", desc: "Appeals go to the Telecom Disputes Settlement Tribunal." },
    ],
    tip: "Penalties scale with harm - the Board isn't just a rubber stamp.",
  },
  {
    icon: Sparkles,
    colorKey: "accent",
    eyebrow: "6 of 6 · Next step",
    title: "Now you know the shape of it",
    body: "That's the DPDP Act in six short chunks. The full Act has 44 sections and 9 chapters - all mapped out, in plain language, right here on TrustStack.",
    points: [
      { icon: BookOpen, title: "Every section mapped", desc: "Every section, side by side with what it actually means." },
      { icon: FileStack, title: "Free templates", desc: "Free templates, rights letters and a live risk check." },
      { icon: ScanSearch, title: "DPDP Scanner", desc: "A DPDP Scanner to check your own website." },
    ],
    tip: "Curious about a specific section? The Act page is searchable by topic.",
  },
];
