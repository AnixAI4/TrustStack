import type { LucideIcon } from "lucide-react";
import {
  ShoppingCart,
  HeartPulse,
  Landmark,
  GraduationCap,
  Cloud,
} from "lucide-react";

/**
 * Scenario data that powers the interactive "See TrustStack work" demo
 * (`SmartDemo`). Each scenario is a self-contained, simulated DPDP assessment
 * for one industry - realistic data flows, gaps mapped to the Act/Rules, a
 * headline penalty exposure and a costed 90-day roadmap. Numbers are
 * illustrative, tuned to feel credible, and never leave the browser.
 */

export type DemoSeverity = "critical" | "high" | "medium";

export type DemoGap = {
  label: string;
  severity: DemoSeverity;
  /** DPDP Act section / Rule the gap maps to. */
  ref: string;
};

export type DemoRoadmapPhase = {
  window: string;
  title: string;
  items: string[];
};

export type DemoScenario = {
  key: string;
  industry: string;
  tagline: string;
  icon: LucideIcon;
  /** Personal-data categories "discovered" in the scan. */
  dataTypes: string[];
  fields: number;
  systems: number;
  vendors: number;
  crossBorder: number;
  /** DPDP obligations checked against. */
  obligations: number;
  gaps: DemoGap[];
  /** Headline penalty exposure, in ₹ crore. */
  exposureCr: number;
  /** Simulated readiness score, 0-100. */
  readiness: number;
  roadmap: DemoRoadmapPhase[];
};

export const DEMO_SCENARIOS: DemoScenario[] = [
  {
    key: "ecommerce",
    industry: "E-Commerce",
    tagline: "Consumer marketplace",
    icon: ShoppingCart,
    dataTypes: [
      "Customer profiles",
      "Payment cards",
      "Delivery addresses",
      "Order history",
      "Device & location",
      "Support chats",
    ],
    fields: 148,
    systems: 7,
    vendors: 22,
    crossBorder: 4,
    obligations: 41,
    gaps: [
      { label: "No 72-hour breach-notification playbook", severity: "critical", ref: "S.8(6)" },
      { label: "Consent bundled with account creation", severity: "high", ref: "S.6" },
      { label: "No consent artifact or withdrawal log", severity: "high", ref: "Rule 4" },
      { label: "Data Principal rights requests unhandled", severity: "high", ref: "S.13" },
      { label: "Cross-border transfers unmapped", severity: "medium", ref: "S.16" },
      { label: "Vendors processing data without a DPA", severity: "medium", ref: "S.8(2)" },
    ],
    exposureCr: 84,
    readiness: 34,
    roadmap: [
      { window: "0-30 days", title: "Stabilise", items: ["Unbundle & log consent", "Data inventory + purpose map"] },
      { window: "31-60 days", title: "Operationalise", items: ["Rights-request workflow", "Vendor DPAs + processing map"] },
      { window: "61-90 days", title: "Prove", items: ["72-hour breach playbook + drill", "Board-ready compliance dashboard"] },
    ],
  },
  {
    key: "healthcare",
    industry: "Healthcare",
    tagline: "Hospital network",
    icon: HeartPulse,
    dataTypes: [
      "Patient records",
      "Diagnostic reports",
      "Prescriptions",
      "Insurance claims",
      "Genomic data",
      "Minor patients",
    ],
    fields: 213,
    systems: 9,
    vendors: 17,
    crossBorder: 2,
    obligations: 44,
    gaps: [
      { label: "Sensitive health data without reasonable safeguards", severity: "critical", ref: "S.8(5)" },
      { label: "No verifiable parental consent for minors", severity: "critical", ref: "S.9 + Rule 10" },
      { label: "Insurance-claim sharing without notice", severity: "high", ref: "S.5" },
      { label: "No breach-notification process", severity: "high", ref: "S.8(6)" },
      { label: "Records retained beyond purpose", severity: "medium", ref: "S.8(7)" },
    ],
    exposureCr: 162,
    readiness: 28,
    roadmap: [
      { window: "0-30 days", title: "Stabilise", items: ["Encrypt & safeguard clinical data", "Parental-consent for minors (Rule 10)"] },
      { window: "31-60 days", title: "Operationalise", items: ["Notice at every collection point", "Retention & deletion schedule"] },
      { window: "61-90 days", title: "Prove", items: ["Breach playbook + DPB drill", "Auditable evidence dashboard"] },
    ],
  },
  {
    key: "fintech",
    industry: "Fintech / BFSI",
    tagline: "Digital lending",
    icon: Landmark,
    dataTypes: [
      "KYC & Aadhaar",
      "Bank transactions",
      "Credit scores",
      "Income proofs",
      "Device fingerprints",
      "App-permission data",
    ],
    fields: 176,
    systems: 8,
    vendors: 26,
    crossBorder: 5,
    obligations: 46,
    gaps: [
      { label: "Data collected beyond the loan purpose", severity: "critical", ref: "S.6 · minimisation" },
      { label: "No breach notification to Board + DPB", severity: "critical", ref: "S.8(6)" },
      { label: "RBI + DPDP consent not reconciled", severity: "high", ref: "S.6" },
      { label: "Credit-bureau sharing without valid consent", severity: "high", ref: "S.6" },
      { label: "SDF duties - no DPO or DPIA", severity: "medium", ref: "S.10" },
    ],
    exposureCr: 197,
    readiness: 31,
    roadmap: [
      { window: "0-30 days", title: "Stabilise", items: ["Minimise app permissions & data", "Reconcile RBI + DPDP consent"] },
      { window: "31-60 days", title: "Operationalise", items: ["Bureau-sharing consent artifacts", "Appoint DPO + start DPIA"] },
      { window: "61-90 days", title: "Prove", items: ["Board + DPB breach reporting", "SDF governance evidence pack"] },
    ],
  },
  {
    key: "edtech",
    industry: "EdTech",
    tagline: "Online learning",
    icon: GraduationCap,
    dataTypes: [
      "Student records",
      "Parent data",
      "Performance & attendance",
      "Behavioural analytics",
      "Proctoring video",
      "Minor learners",
    ],
    fields: 132,
    systems: 6,
    vendors: 14,
    crossBorder: 3,
    obligations: 40,
    gaps: [
      { label: "No verifiable parental consent for minors", severity: "critical", ref: "S.9 + Rule 10" },
      { label: "Behavioural tracking of children", severity: "high", ref: "S.9" },
      { label: "Notice not in clear, plain language", severity: "high", ref: "S.5" },
      { label: "Rights-request workflow missing", severity: "medium", ref: "S.13" },
      { label: "International transfers unmapped", severity: "medium", ref: "S.16" },
    ],
    exposureCr: 76,
    readiness: 37,
    roadmap: [
      { window: "0-30 days", title: "Stabilise", items: ["Parental-consent gate (Rule 10)", "Turn off tracking for minors"] },
      { window: "31-60 days", title: "Operationalise", items: ["Plain-language notices", "Rights-request workflow"] },
      { window: "61-90 days", title: "Prove", items: ["Transfer map + safeguards", "Compliance evidence dashboard"] },
    ],
  },
  {
    key: "saas",
    industry: "SaaS / GCC",
    tagline: "B2B platform & GCC",
    icon: Cloud,
    dataTypes: [
      "Customer (processor) data",
      "Employee data",
      "Product usage analytics",
      "Support tickets",
      "Sub-processor data",
      "AI/ML training data",
    ],
    fields: 189,
    systems: 11,
    vendors: 31,
    crossBorder: 6,
    obligations: 43,
    gaps: [
      { label: "Processor obligations & DPAs missing", severity: "high", ref: "S.8(2)" },
      { label: "Analytics on personal data without basis", severity: "high", ref: "S.4" },
      { label: "No breach notification to fiduciary clients", severity: "high", ref: "S.8(6)" },
      { label: "Sub-processor chain unmapped", severity: "medium", ref: "S.8(2)" },
      { label: "Employee-data notices missing", severity: "medium", ref: "S.5" },
    ],
    exposureCr: 58,
    readiness: 41,
    roadmap: [
      { window: "0-30 days", title: "Stabilise", items: ["Sign DPAs with clients & sub-processors", "Map the sub-processor chain"] },
      { window: "31-60 days", title: "Operationalise", items: ["Lawful basis for analytics/AI", "Employee-data notices"] },
      { window: "61-90 days", title: "Prove", items: ["Client breach-notification SLA", "Trust-centre evidence portal"] },
    ],
  },
];
