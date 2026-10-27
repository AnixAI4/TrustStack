/**
 * Citizen / Data Principal track - "Know Your Rights".
 * Plain-language rights, a request-letter generator, the grievance ladder,
 * children's protections and duties. Sourced from the DPDP Act, 2023 and the
 * DPDP Rules, 2025. Written for the public, not for lawyers.
 */
import type { LucideIcon } from "lucide-react";
import {
  Eye,
  PencilLine,
  Trash2,
  PowerOff,
  LifeBuoy,
  UserPlus,
  Building2,
  UserCheck,
  Landmark,
  Gavel,
  ShieldCheck,
  EyeOff,
  HeartHandshake,
  Baby,
} from "lucide-react";

export const RIGHTS_HERO = {
  kicker: "For citizens · Your rights",
  kickerHindi: "आपके अधिकार",
  title: "Your data, your rights",
  subhead:
    "The Digital Personal Data Protection Act, 2023 gives every person in India real, enforceable rights over their own personal data - and you don't need a lawyer to use them. Here's what you can ask for, in plain language, with a ready-to-send letter for each request.",
  stats: [
    { value: "6", label: "Your rights" },
    { value: "Section 11-14", label: "Of the Act" },
    { value: "Free", label: "To exercise" },
    { value: "Under 18", label: "Counts as a child" },
  ],
};

// ── The rights themselves ────────────────────────────────────────────────
export type DataPrincipalRight = {
  title: string;
  hook: string;
  section: string;
  plain: string;
  icon: LucideIcon;
};

export const DATA_PRINCIPAL_RIGHTS: DataPrincipalRight[] = [
  {
    title: "Access your data",
    hook: "See what's held about you",
    section: "Section 11",
    plain:
      "Ask any company what personal data of yours it is processing, what it does with that data, and the names of everyone else it has shared your data with.",
    icon: Eye,
  },
  {
    title: "Correct & complete",
    hook: "Fix what's wrong",
    section: "Section 12",
    plain:
      "Have inaccurate or misleading data corrected, incomplete data filled in, and out-of-date details updated - so decisions about you are made on the right facts.",
    icon: PencilLine,
  },
  {
    title: "Erase your data",
    hook: "Have it deleted",
    section: "Section 12",
    plain:
      "Ask for your personal data to be erased once the purpose it was collected for is over - unless a law specifically requires the company to keep it.",
    icon: Trash2,
  },
  {
    title: "Grievance redressal",
    hook: "Be heard, quickly",
    section: "Section 13",
    plain:
      "Every company must give you an easy way to complain and respond within a set time. You use this before escalating to the Data Protection Board.",
    icon: LifeBuoy,
  },
  {
    title: "Nominate someone",
    hook: "Appoint a person you trust",
    section: "Section 14",
    plain:
      "Name another individual to exercise your rights on your behalf if you die or are no longer able to act for yourself.",
    icon: UserPlus,
  },
  {
    title: "Withdraw consent",
    hook: "Change your mind",
    section: "Section 6",
    plain:
      "Take back consent as easily as you gave it. Once you withdraw it, the company must stop processing your data for that purpose.",
    icon: PowerOff,
  },
];

// ── Request-letter generator ─────────────────────────────────────────────
export type RequestValues = {
  name: string;
  org: string;
  email: string;
  ref: string;
  details: string;
  date: string;
};

export type RightRequest = {
  id: string;
  label: string;
  section: string;
  icon: LucideIcon;
  blurb: string;
  subject: string;
  detailsLabel: string;
  detailsPlaceholder: string;
  build: (v: RequestValues) => string;
};

const sign = (v: RequestValues) => ["", "Yours faithfully,", v.name || "[Your name]"];
const head = (v: RequestValues, subject: string) => [
  `To: ${v.org || "[Organisation / Data Fiduciary]"}`,
  `Date: ${v.date || "[Date]"}`,
  "",
  `Subject: ${subject}`,
  "",
  "Dear Sir or Madam,",
  "",
];
const ref = (v: RequestValues) => (v.ref ? ["", `My account or reference number: ${v.ref}`] : []);
const contact = (v: RequestValues) => [
  "",
  `Please respond within the period prescribed under the Act and the DPDP Rules, 2025. You can reach me at ${
    v.email || "[your email]"
  }.`,
];

export const RIGHT_REQUESTS: RightRequest[] = [
  {
    id: "access",
    label: "Access my data",
    section: "Section 11",
    icon: Eye,
    blurb: "Ask an organisation for a summary of your data and who it was shared with.",
    subject:
      "Request to access my personal data under Section 11 of the DPDP Act, 2023",
    detailsLabel: "Anything specific you want (optional)",
    detailsPlaceholder: "e.g. data collected in the last 12 months",
    build: (v) =>
      [
        ...head(v, "Request to access my personal data under Section 11 of the Digital Personal Data Protection Act, 2023"),
        `I am a Data Principal whose personal data is processed by ${
          v.org || "your organisation"
        }. Under Section 11 of the Digital Personal Data Protection Act, 2023, I request:`,
        "",
        "1. A summary of the personal data of mine that you are processing, and of the processing activities you undertake.",
        "2. The identities of all other Data Fiduciaries and Data Processors with whom you have shared my personal data, with a description of what was shared.",
        "3. Any other information about my personal data and its processing, as prescribed under the DPDP Rules, 2025.",
        ...(v.details ? ["", `Further details: ${v.details}`] : []),
        ...ref(v),
        ...contact(v),
        ...sign(v),
      ].join("\n"),
  },
  {
    id: "correct",
    label: "Correct my data",
    section: "Section 12",
    icon: PencilLine,
    blurb: "Get inaccurate, incomplete or out-of-date data put right.",
    subject: "Request to correct my personal data under Section 12 of the DPDP Act, 2023",
    detailsLabel: "What should be corrected, completed or updated",
    detailsPlaceholder: "e.g. my address is wrong - it should read…",
    build: (v) =>
      [
        ...head(v, "Request to correct my personal data under Section 12 of the Digital Personal Data Protection Act, 2023"),
        `I am a Data Principal whose personal data is processed by ${
          v.org || "your organisation"
        }. Under Section 12 of the Act, I request that you correct, complete and update my personal data as follows:`,
        "",
        v.details || "[Describe what is inaccurate, incomplete or out of date, and what it should say.]",
        ...ref(v),
        ...contact(v),
        ...sign(v),
      ].join("\n"),
  },
  {
    id: "erase",
    label: "Erase my data",
    section: "Section 12",
    icon: Trash2,
    blurb: "Ask for your data to be deleted once its purpose is over.",
    subject: "Request to erase my personal data under Section 12 of the DPDP Act, 2023",
    detailsLabel: "Which data, and why (optional)",
    detailsPlaceholder: "e.g. close my account and delete my profile",
    build: (v) =>
      [
        ...head(v, "Request to erase my personal data under Section 12 of the Digital Personal Data Protection Act, 2023"),
        `I am a Data Principal whose personal data is processed by ${
          v.org || "your organisation"
        }. Under Section 12 of the Act, I request that you erase my personal data, as the purpose for which it was collected is no longer being served and I am not withdrawing from any service that legally requires it.`,
        ...(v.details ? ["", `Details: ${v.details}`] : []),
        "",
        "Please erase the data unless you are required by law to retain it, and confirm once this is done.",
        ...ref(v),
        ...contact(v),
        ...sign(v),
      ].join("\n"),
  },
  {
    id: "withdraw",
    label: "Withdraw consent",
    section: "Section 6",
    icon: PowerOff,
    blurb: "Take back consent you gave earlier - it should be as easy as giving it.",
    subject: "Withdrawal of consent under Section 6 of the DPDP Act, 2023",
    detailsLabel: "What you are withdrawing consent for",
    detailsPlaceholder: "e.g. marketing emails and SMS",
    build: (v) =>
      [
        ...head(v, "Withdrawal of consent under Section 6 of the Digital Personal Data Protection Act, 2023"),
        `I previously gave ${
          v.org || "your organisation"
        } consent to process my personal data. Under Section 6 of the Act, I now withdraw that consent for: ${
          v.details || "[the processing described below]"
        }.`,
        "",
        "Please stop processing my personal data for this purpose and, unless retention is required by law, erase it. I understand the withdrawal does not affect processing already carried out lawfully before this notice.",
        ...ref(v),
        ...contact(v),
        ...sign(v),
      ].join("\n"),
  },
  {
    id: "grievance",
    label: "Raise a grievance",
    section: "Section 13",
    icon: LifeBuoy,
    blurb: "Formally complain to the company before approaching the Board.",
    subject: "Grievance regarding the processing of my personal data - Section 13",
    detailsLabel: "Describe your grievance",
    detailsPlaceholder: "e.g. you have not responded to my access request from…",
    build: (v) =>
      [
        ...head(v, "Grievance regarding the processing of my personal data under Section 13 of the Digital Personal Data Protection Act, 2023"),
        `I am a Data Principal and I am raising a grievance with ${
          v.org || "your organisation"
        } under Section 13 of the Act. The grievance is as follows:`,
        "",
        v.details || "[Describe what happened, what you asked for, and what remains unresolved.]",
        ...ref(v),
        "",
        "Please redress this grievance within the period prescribed under the DPDP Rules, 2025. If it is not resolved, I may make a complaint to the Data Protection Board of India.",
        ...contact(v),
        ...sign(v),
      ].join("\n"),
  },
  {
    id: "nominate",
    label: "Nominate a person",
    section: "Section 14",
    icon: UserPlus,
    blurb: "Appoint someone to exercise your rights if you can't.",
    subject: "Nomination to exercise my rights under Section 14 of the DPDP Act, 2023",
    detailsLabel: "Nominee's name and relationship to you",
    detailsPlaceholder: "e.g. Priya Sharma, my spouse",
    build: (v) =>
      [
        ...head(v, "Nomination to exercise my rights under Section 14 of the Digital Personal Data Protection Act, 2023"),
        `I am a Data Principal whose personal data is processed by ${
          v.org || "your organisation"
        }. Under Section 14 of the Act, I nominate the following individual to exercise my rights on my behalf in the event of my death or incapacity:`,
        "",
        v.details || "[Nominee's full name and relationship to you.]",
        ...ref(v),
        "",
        "Please record this nomination against my account and confirm.",
        ...contact(v),
        ...sign(v),
      ].join("\n"),
  },
];

// ── Grievance escalation ladder ──────────────────────────────────────────
export type LadderStep = {
  step: number;
  title: string;
  section: string;
  body: string;
  icon: LucideIcon;
};

export const GRIEVANCE_LADDER: LadderStep[] = [
  {
    step: 1,
    title: "Ask the company first",
    section: "Section 13",
    body: "Every Data Fiduciary must give you a readily available way to complain - usually a Data Protection Officer or a Responsible Person. Start here and keep a written record.",
    icon: Building2,
  },
  {
    step: 2,
    title: "Use your Consent Manager",
    section: "Section 6 · Rule 4",
    body: "If you gave consent through a Consent Manager - a Board-registered platform - you can review, manage and withdraw consent and raise concerns through it.",
    icon: UserCheck,
  },
  {
    step: 3,
    title: "Complain to the Data Protection Board",
    section: "Section 13(3) · 27-28",
    body: "If the company doesn't resolve your grievance in the prescribed time, file a complaint with the Data Protection Board of India. It can inquire and impose penalties of up to ₹250 crore.",
    icon: Landmark,
  },
  {
    step: 4,
    title: "Appeal to the Tribunal",
    section: "Section 29",
    body: "A Board order can be appealed to the Telecom Disputes Settlement and Appellate Tribunal (TDSAT) within the prescribed period.",
    icon: Gavel,
  },
];

// ── Children & guardians ─────────────────────────────────────────────────
export const CHILDREN = {
  eyebrow: "For parents & guardians",
  title: "Extra protection for children",
  lede: "Anyone under 18 is a child under the Act. If a service processes a child's data, stricter rules apply - and a parent or lawful guardian holds the rights.",
  points: [
    {
      title: "Consent comes first",
      body: "A company must get the verifiable consent of a parent or lawful guardian before processing a child's personal data.",
      icon: UserCheck,
    },
    {
      title: "Nothing harmful",
      body: "No processing that is likely to have a detrimental effect on the well-being of a child is allowed.",
      icon: ShieldCheck,
    },
    {
      title: "No tracking or targeted ads",
      body: "Behavioural tracking, monitoring and targeted advertising directed at children are prohibited.",
      icon: EyeOff,
    },
    {
      title: "Guardians of persons with disability",
      body: "The same protection applies to a person with a disability who has a lawful guardian.",
      icon: HeartHandshake,
    },
  ],
  icon: Baby,
};

// ── Duties of a Data Principal (Section 15) ──────────────────────────────
export const DUTIES = {
  eyebrow: "The fine print",
  title: "What the Act asks of you",
  lede: "Your rights come with a few duties under Section 15. They exist to keep the system honest.",
  items: [
    "Don't impersonate anyone else when exercising a right.",
    "Don't suppress material information or give false particulars.",
    "Don't file a false or frivolous grievance or complaint.",
    "Share only information that is verifiably authentic.",
  ],
};

// ── FAQ ──────────────────────────────────────────────────────────────────
export const RIGHTS_FAQ: { q: string; a: string }[] = [
  {
    q: "Who is a “Data Principal”?",
    a: "It's you - the individual the personal data is about. For a child, the parent or lawful guardian is the Data Principal; for a person with a disability, it's their lawful guardian.",
  },
  {
    q: "Does it cost anything to use my rights?",
    a: "No. Exercising your rights under the DPDP Act is free. A company cannot charge you for accessing, correcting or erasing your own data.",
  },
  {
    q: "How quickly must a company respond?",
    a: "Within the time period prescribed by the DPDP Rules, 2025. Each company must publish its grievance timeline, and you can escalate to the Data Protection Board if it lapses.",
  },
  {
    q: "What if the company just ignores me?",
    a: "Follow the grievance ladder: raise it with the company, then complain to the Data Protection Board of India, which can investigate and impose penalties.",
  },
  {
    q: "Is my information safe when I use the letter tool here?",
    a: "Yes. Every letter is assembled entirely in your browser. Nothing you type is uploaded, stored or sent anywhere by this site.",
  },
];
