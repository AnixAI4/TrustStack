/**
 * Persona-driven course catalogue. Each learner type gets its own
 * section-mapped curriculum, audience, outcomes and a path to the right
 * tool or assessment - rather than one generic certificate for everyone.
 * Content maps to the DPDP Act, 2023 and the DPDP Rules, 2025.
 */
import type { LucideIcon } from "lucide-react";
import {
  ShieldCheck,
  Rocket,
  GraduationCap,
  Scale,
  Cpu,
  BookOpen,
} from "lucide-react";

export type CourseModule = {
  n: number;
  title: string;
  refs: string;
  points: string[];
  minutes: number;
};

export type CourseAction = { label: string; href: string; primary?: boolean };

export type Course = {
  slug: string;
  persona: string;
  title: string;
  tagline: string;
  level: string;
  hours: string;
  icon: LucideIcon;
  blurb: string;
  forWho: string[];
  outcomes: string[];
  modules: CourseModule[];
  actions: CourseAction[];
  certificate?: boolean;
};

export const COURSE_INTRO = {
  kicker: "Courses by role",
  kickerHindi: "पाठ्यक्रम",
  title: "A different course for every person",
  subhead:
    "The DPDP Act lands differently on a citizen, a founder, a DPO, a lawyer, an engineer and a student. So instead of one generic certificate, pick the track written for your role - each maps to the same Act, but teaches what you actually need to do with it.",
};

export const COURSES: Course[] = [
  {
    slug: "citizens",
    persona: "For citizens & families",
    title: "Know Your Rights",
    tagline: "Use your privacy rights with confidence.",
    level: "Beginner",
    hours: "~45 min",
    icon: ShieldCheck,
    blurb:
      "A plain-language course for everyday people. Understand what the DPDP Act gives you, how consent really works, and exactly how to act when a company mishandles your data - no legal background needed.",
    forWho: ["Everyday internet users", "Parents & guardians", "Anyone whose data is online"],
    outcomes: [
      "Spot a weak or unlawful consent request",
      "Send a rights request that gets a response",
      "Escalate effectively if you're ignored",
      "Keep your children's data safer online",
    ],
    modules: [
      {
        n: 1,
        title: "What the law gives you",
        refs: "Section 2, 11 · The basics",
        points: [
          "Why India has a data-protection law, in one minute",
          "You are the “Data Principal” - and what that means",
          "The six rights, seen at a glance",
        ],
        minutes: 8,
      },
      {
        n: 2,
        title: "Consent, in plain words",
        refs: "Section 6 · Saying yes and no",
        points: [
          "What genuine, free and informed consent looks like",
          "How to refuse without losing a service you need",
          "Withdrawing consent - it must be as easy as giving it",
        ],
        minutes: 10,
      },
      {
        n: 3,
        title: "Your six rights, and how to use them",
        refs: "Section 11-14 · In practice",
        points: [
          "Access, correction, erasure, grievance, nomination",
          "Writing a request that a company must act on",
          "Realistic timelines and what to keep on record",
        ],
        minutes: 12,
      },
      {
        n: 4,
        title: "Protecting children online",
        refs: "Section 9 · Under 18",
        points: [
          "Why apps need a parent's verifiable consent",
          "No tracking, profiling or targeted ads at children",
          "Red flags to watch for in the apps your family uses",
        ],
        minutes: 8,
      },
      {
        n: 5,
        title: "When something goes wrong",
        refs: "Section 13, 27-28 · The grievance ladder",
        points: [
          "Complain to the company the right way, first",
          "Escalate to the Data Protection Board of India",
          "What the Board can do - including ₹250 crore penalties",
        ],
        minutes: 7,
      },
    ],
    actions: [
      { label: "Open “Your Rights” & the letter tool", href: "/rights", primary: true },
      { label: "Take the basics quiz", href: "/learn" },
    ],
  },
  {
    slug: "founders",
    persona: "For founders & SMEs",
    title: "DPDP for Startups",
    tagline: "Get compliant without a legal team.",
    level: "Beginner → Intermediate",
    hours: "~1.5 hrs",
    icon: Rocket,
    blurb:
      "A pragmatic course for people building a business. Work out whether DPDP applies to you, stand up the minimum compliant stack quickly and cheaply, and avoid the mistakes that draw penalties or lose you enterprise deals.",
    forWho: ["Startup founders", "Small-business owners", "Product managers"],
    outcomes: [
      "Decide if and how DPDP applies to your product",
      "Stand up notice and consent fast",
      "Avoid the costliest compliance mistakes",
      "Answer enterprise customers' DPA questionnaires",
    ],
    modules: [
      {
        n: 1,
        title: "Does DPDP apply to you?",
        refs: "Section 2, 3 · Scope",
        points: [
          "Data Fiduciary vs Data Processor - which are you?",
          "Extra-territorial reach: serving Indian users from abroad",
          "What counts as digital personal data (and what's exempt)",
        ],
        minutes: 18,
      },
      {
        n: 2,
        title: "Lawful basis on a budget",
        refs: "Section 4, 6, 7 · Why you can process",
        points: [
          "Consent vs the “legitimate uses” you don't need consent for",
          "Designing a consent request that's actually valid",
          "Common dark-pattern traps to avoid",
        ],
        minutes: 20,
      },
      {
        n: 3,
        title: "The minimum viable compliance stack",
        refs: "Section 5, 8 · What to build",
        points: [
          "A Section 5 privacy notice and consent capture",
          "A lightweight record of processing (RoPA-lite)",
          "Data-processing agreements with your vendors",
        ],
        minutes: 22,
      },
      {
        n: 4,
        title: "Handling rights & grievances",
        refs: "Section 11-14 · Day-to-day",
        points: [
          "A simple inbox and process that satisfies the rights",
          "Who owns it when you're a team of five",
          "Templates you can adapt in an afternoon",
        ],
        minutes: 15,
      },
      {
        n: 5,
        title: "Breach & penalties",
        refs: "Section 8(6), Schedule · The stakes",
        points: [
          "The 72-hour breach-notification duty",
          "What ₹250 crore exposure really means for a small firm",
          "A one-page incident playbook",
        ],
        minutes: 15,
      },
    ],
    actions: [
      { label: "Generate a notice & consent form", href: "/tools#generators", primary: true },
      { label: "Estimate your penalty exposure", href: "/tools" },
      { label: "Take the readiness quiz", href: "/learn" },
    ],
  },
  {
    slug: "practitioner",
    persona: "For DPOs & privacy leads",
    title: "The Practitioner Track",
    tagline: "Run DPDP compliance end to end.",
    level: "Advanced",
    hours: "~3.5 hrs",
    icon: GraduationCap,
    certificate: true,
    blurb:
      "The full, practitioner-grade certification. Eight section-mapped modules take you across the whole Act and Rules, then a timed exam from a 272-question bank earns you a verifiable Certified DPDP Practitioner certificate.",
    forWho: ["Data Protection Officers", "Privacy & GRC leads", "Responsible Persons"],
    outcomes: [
      "Build a defensible inventory of personal-data flows",
      "Operate lawful notice, consent and withdrawal",
      "Run rights and grievances within statutory timelines",
      "Stand up a 72-hour breach response with evidence",
    ],
    modules: [
      {
        n: 1,
        title: "Foundations of the DPDP Act",
        refs: "Section 1-3 · Scope & definitions",
        points: [
          "Territorial and extra-territorial reach",
          "Data Principal, Fiduciary and Processor roles",
          "What is digital personal data, and what's exempt",
        ],
        minutes: 25,
      },
      {
        n: 2,
        title: "Notice & consent",
        refs: "Section 5-6 · Lawful basis",
        points: [
          "Itemised notice - what every notice must say",
          "Free, specific, informed, unambiguous consent",
          "Withdrawal and the role of a Consent Manager",
        ],
        minutes: 30,
      },
      {
        n: 3,
        title: "Legitimate uses",
        refs: "Section 7 · Beyond consent",
        points: [
          "The permitted non-consent grounds",
          "Employment, state functions and emergencies",
          "Documenting your reliance defensibly",
        ],
        minutes: 25,
      },
      {
        n: 4,
        title: "Rights & duties of the Data Principal",
        refs: "Section 11-15 · Operations",
        points: [
          "Access, correction, erasure, grievance, nomination",
          "Statutory timelines and how to meet them",
          "The principal's own duties under Section 15",
        ],
        minutes: 30,
      },
      {
        n: 5,
        title: "Fiduciary obligations & breach",
        refs: "Section 8 · Accountability",
        points: [
          "Security safeguards and data minimisation",
          "The 72-hour breach-notification duty",
          "Building the evidence the Board expects",
        ],
        minutes: 30,
      },
      {
        n: 6,
        title: "Children & persons with disability",
        refs: "Section 9 · Special protection",
        points: [
          "Verifiable parental and guardian consent",
          "The ban on tracking and targeted advertising",
          "Practical age-assurance approaches",
        ],
        minutes: 20,
      },
      {
        n: 7,
        title: "Significant Data Fiduciaries",
        refs: "Section 10 · Higher duties",
        points: [
          "Appointing a DPO and an independent auditor",
          "Data Protection Impact Assessments",
          "Additional measures the Board may require",
        ],
        minutes: 20,
      },
      {
        n: 8,
        title: "Board, penalties & appeals",
        refs: "Section 18-29 · Enforcement",
        points: [
          "How the Data Protection Board inquires and acts",
          "The Schedule of penalties up to ₹250 crore",
          "Appeals to the Appellate Tribunal (TDSAT)",
        ],
        minutes: 25,
      },
    ],
    actions: [
      { label: "Open the certification programme", href: "/certification", primary: true },
      { label: "Sit the certification exam", href: "/certification/exam" },
    ],
  },
  {
    slug: "legal",
    persona: "For legal, risk & compliance",
    title: "Law & Enforcement",
    tagline: "Read the Act like a lawyer - and advise like one.",
    level: "Intermediate",
    hours: "~2.5 hrs",
    icon: Scale,
    blurb:
      "A close reading for advisors. Work through the Act section by section and the Rules that give it effect, ground it in privacy jurisprudence, and map the enforcement and penalty regime so you can advise with precision.",
    forWho: ["In-house counsel", "Risk & compliance teams", "External advisors"],
    outcomes: [
      "Advise on lawful basis with confidence",
      "Map each obligation to the operative Rule",
      "Draft DPDP-ready notices, consents and clauses",
      "Anticipate enforcement and penalty risk",
    ],
    modules: [
      {
        n: 1,
        title: "The Act, section by section",
        refs: "Section 1-44 · Structure",
        points: [
          "The nine chapters and how they fit together",
          "Definitions that decide outcomes",
          "Reading the operative verbs - “shall” vs “may”",
        ],
        minutes: 30,
      },
      {
        n: 2,
        title: "The DPDP Rules 2025, mapped",
        refs: "Rules 1-23 · Operative detail",
        points: [
          "How each Rule gives effect to a section",
          "Notice, consent, breach and children's rules",
          "What is still left to delegated legislation",
        ],
        minutes: 25,
      },
      {
        n: 3,
        title: "Lawful processing & legitimate uses",
        refs: "Section 4, 7 · Drafting the basis",
        points: [
          "Building a defensible basis for each purpose",
          "The limits of “legitimate uses”",
          "Documentation that survives scrutiny",
        ],
        minutes: 25,
      },
      {
        n: 4,
        title: "Cross-border, exemptions & the State",
        refs: "Section 16, 17 · Edges of the Act",
        points: [
          "Restricting transfers to notified countries",
          "Research, archiving and statistical exemptions",
          "Government processing and notified exemptions",
        ],
        minutes: 20,
      },
      {
        n: 5,
        title: "Case law & constitutional grounding",
        refs: "Puttaswamy → today",
        points: [
          "Privacy as a fundamental right (Puttaswamy, 2017)",
          "Aadhaar, proportionality and data minimisation",
          "How courts are likely to read the Act",
        ],
        minutes: 25,
      },
      {
        n: 6,
        title: "Enforcement, penalties & appeals",
        refs: "Section 27-29, Schedule",
        points: [
          "The Data Protection Board's powers and procedure",
          "The graded Schedule of penalties",
          "Appeals to TDSAT and onward",
        ],
        minutes: 25,
      },
    ],
    actions: [
      { label: "Read the Act, section by section", href: "/act", primary: true },
      { label: "Browse the Rules 2025", href: "/rules" },
      { label: "Study the case law", href: "/cases" },
    ],
  },
  {
    slug: "engineering",
    persona: "For engineering & security",
    title: "Privacy Engineering",
    tagline: "Build privacy into the product, not on top of it.",
    level: "Intermediate",
    hours: "~2.5 hrs",
    icon: Cpu,
    blurb:
      "A builder's course. Translate the Act's duties into architecture - data discovery, minimisation, security safeguards, consent and rights automation, and governance for AI and GenAI systems that touch personal data.",
    forWho: ["Software & data engineers", "Security teams", "Platform & ML teams"],
    outcomes: [
      "Design a lawful, minimised data model",
      "Automate consent capture and rights requests",
      "Stand up breach detection and reporting",
      "Govern AI/GenAI use of personal data",
    ],
    modules: [
      {
        n: 1,
        title: "Privacy by design & default",
        refs: "Section 8 · From duty to design",
        points: [
          "Turning Section 8 obligations into architecture",
          "Purpose limitation as a system constraint",
          "Default-private settings and data flows",
        ],
        minutes: 25,
      },
      {
        n: 2,
        title: "Data discovery & minimisation",
        refs: "Section 5, 8 · Know your data",
        points: [
          "Inventorying personal data across systems and vendors",
          "Building a machine-readable RoPA",
          "Retention schedules and automated deletion",
        ],
        minutes: 25,
      },
      {
        n: 3,
        title: "Security safeguards",
        refs: "Section 8(5)-(6) · Defence",
        points: [
          "Access control, encryption and masking",
          "Logging and tamper-evident audit trails",
          "Detecting and reporting a breach in 72 hours",
        ],
        minutes: 25,
      },
      {
        n: 4,
        title: "Consent & rights, technically",
        refs: "Section 6, 11-12 · Automation",
        points: [
          "Consent capture, storage and withdrawal APIs",
          "Automating access, correction and erasure",
          "Erasure that reaches backups and caches",
        ],
        minutes: 25,
      },
      {
        n: 5,
        title: "AI, GenAI & personal data",
        refs: "Section 8 · The hard part",
        points: [
          "Prompt and RAG data-leakage risks",
          "Training-data governance and provenance",
          "The right to erasure and machine unlearning",
        ],
        minutes: 20,
      },
    ],
    actions: [
      { label: "Explore the compliance tools", href: "/tools", primary: true },
      { label: "Take the advanced quiz", href: "/learn" },
    ],
  },
  {
    slug: "students",
    persona: "For students & aspirants",
    title: "Foundations & Exam Prep",
    tagline: "From zero to certified - the exam-prep path.",
    level: "Beginner → Certificate",
    hours: "~3 hrs",
    icon: BookOpen,
    certificate: true,
    blurb:
      "A study path that starts at first principles and ends at the certificate. Build the fundamentals chapter by chapter, then practise against the full 272-question exam bank and sit the timed examination.",
    forWho: ["Law, management & tech students", "Career switchers", "Certification candidates"],
    outcomes: [
      "Master the vocabulary and structure of the Act",
      "Practise with the real question bank",
      "Pass the timed certification exam",
      "Earn a verifiable certificate",
    ],
    modules: [
      {
        n: 1,
        title: "DPDP foundations",
        refs: "Section 1-3 · Vocabulary",
        points: [
          "The roles: Principal, Fiduciary, Processor, Board",
          "Scope, application and key definitions",
          "How DPDP compares to the GDPR",
        ],
        minutes: 30,
      },
      {
        n: 2,
        title: "The lifecycle of consent",
        refs: "Section 5-7 · The core flow",
        points: [
          "Notice, consent and withdrawal",
          "Consent Managers and legitimate uses",
          "Worked examples you'll see in the exam",
        ],
        minutes: 30,
      },
      {
        n: 3,
        title: "Rights, duties & obligations",
        refs: "Section 8-15 · Both sides",
        points: [
          "Fiduciary obligations and security safeguards",
          "The Data Principal's rights and duties",
          "Breach response and timelines",
        ],
        minutes: 30,
      },
      {
        n: 4,
        title: "Special regimes",
        refs: "Section 9, 10, 17 · The exceptions",
        points: [
          "Children and persons with disability",
          "Significant Data Fiduciaries",
          "Exemptions and government processing",
        ],
        minutes: 25,
      },
      {
        n: 5,
        title: "Enforcement & the Board",
        refs: "Section 18-29 · Consequences",
        points: [
          "The Data Protection Board and its powers",
          "The Schedule of penalties",
          "Appeals to the Tribunal",
        ],
        minutes: 25,
      },
      {
        n: 6,
        title: "Exam strategy",
        refs: "Exam · 224-question bank",
        points: [
          "How the five-question, 10-minute exam works",
          "Perfect-score strategy and answer review",
          "Targeted practice by difficulty",
        ],
        minutes: 20,
      },
    ],
    actions: [
      { label: "Practise with the adaptive quiz", href: "/learn", primary: true },
      { label: "Open the certification programme", href: "/certification" },
      { label: "Sit the exam", href: "/certification/exam" },
    ],
  },
];

export function getCourse(slug: string): Course | undefined {
  return COURSES.find((c) => c.slug === slug);
}
