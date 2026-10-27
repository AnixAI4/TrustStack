/**
 * Shared DPDP marketing data - used across home, /solutions, /framework, /tools.
 * Copy is preserved verbatim from the original TrustStack site.
 */
import type { LucideIcon } from "lucide-react";
import {
  Search,
  ClipboardList,
  PencilRuler,
  ShieldCheck,
  Rocket,
  BarChart3,
  RefreshCw,
  Sparkles,
  Compass,
  Hammer,
  BrainCircuit,
  Headset,
  LayoutGrid,
  GraduationCap,
  Landmark,
  HeartPulse,
  BookOpen,
  Cloud,
  ShoppingCart,
  Building2,
} from "lucide-react";

export type HeroStat = { value: string; label: string };

export const HERO_STATS: HeroStat[] = [
  { value: "44", label: "Sections" },
  { value: "9", label: "Chapters" },
  { value: "23", label: "DPDP Rules" },
  { value: "₹250cr", label: "Max penalty" },
];

export type FrameworkStage = {
  id: string;
  name: string;
  tagline: string;
  icon: LucideIcon;
  points: string[];
};

export const FRAMEWORK: FrameworkStage[] = [
  {
    id: "discover",
    name: "Discover",
    tagline: "Find all personal data",
    icon: Search,
    points: [
      "Personal data inventory across systems",
      "Vendor and processor identification",
      "AI/GenAI data touchpoints",
      "Shadow IT and cloud data stores",
      "Employee and customer data categories",
    ],
  },
  {
    id: "define",
    name: "Define",
    tagline: "Map purpose and accountability",
    icon: ClipboardList,
    points: [
      "Purpose of processing documentation",
      "Legal basis determination",
      "Consent and legitimate interest mapping",
      "Data retention schedule definition",
      "RoPA (Record of Processing Activities) creation",
    ],
  },
  {
    id: "design",
    name: "Design",
    tagline: "Build compliant workflows",
    icon: PencilRuler,
    points: [
      "Privacy notice redesign (22 Indian languages)",
      "Consent capture and withdrawal workflows",
      "Data Principal rights processes",
      "Grievance redressal mechanism",
      "Data Processing Agreements with vendors",
    ],
  },
  {
    id: "defend",
    name: "Defend",
    tagline: "Security & breach readiness",
    icon: ShieldCheck,
    points: [
      "Security safeguard gap assessment",
      "Access control and data minimization",
      "Encryption and masking implementation",
      "72-hour breach notification plan",
      "Incident response playbook",
    ],
  },
  {
    id: "deploy",
    name: "Deploy",
    tagline: "Implement across the organization",
    icon: Rocket,
    points: [
      "Department-specific SOP rollout",
      "Privacy notice and consent deployment",
      "TrustDeck™ configuration",
      "Employee training by role",
      "Vendor DPA execution and tracking",
    ],
  },
  {
    id: "demonstrate",
    name: "Demonstrate",
    tagline: "Build evidence and board dashboards",
    icon: BarChart3,
    points: [
      "Evidence vault for compliance activities",
      "DPDP Maturity Scorecard (10 dimensions)",
      "Board-ready compliance dashboard",
      "Risk heatmap for leadership",
      "Regulator-ready documentation package",
    ],
  },
  {
    id: "drive",
    name: "Drive",
    tagline: "Continuous compliance operations",
    icon: RefreshCw,
    points: [
      "Monthly DPDP TrustOps™ managed service",
      "DPO / Responsible Person support",
      "Quarterly rights and grievance review",
      "AI / GenAI privacy quarterly assessment",
      "Annual DPDP audit and board report",
    ],
  },
];

export type Service = {
  name: string;
  tag: string;
  subtitle: string;
  desc: string;
  icon: LucideIcon;
  featured?: boolean;
  points: string[];
};

export const SERVICES: Service[] = [
  {
    name: "DPDP Ignite™",
    tag: "Entry point",
    subtitle: "Executive Awareness Workshop",
    desc: "A focused workshop for boards, CXOs, legal, IT, HR and AI teams - building urgency and alignment at leadership level.",
    icon: Sparkles,
    points: [
      "What DPDP means for your organization",
      "Director personal liability",
      "DPDP Rules 2025 key obligations",
      "Top 10 gaps most companies have",
      "90-day action priorities",
    ],
  },
  {
    name: "DPDP Compass™",
    tag: "Most popular",
    subtitle: "Readiness Assessment",
    desc: "A comprehensive DPDP readiness assessment - exactly where you stand, what's at risk and what to fix first, with a board-ready report.",
    icon: Compass,
    featured: true,
    points: [
      "DPDP applicability review",
      "Personal data inventory snapshot",
      "Notice & consent gap review",
      "AI / GenAI privacy risk assessment",
      "DPDP Maturity Scorecard & 90-day roadmap",
    ],
  },
  {
    name: "DPDP Build™",
    tag: "Full stack",
    subtitle: "Implementation Accelerator",
    desc: "End-to-end DPDP implementation - from data inventory to breach playbook - across every requirement of the Act 2023 and Rules 2025.",
    icon: Hammer,
    points: [
      "Complete data inventory & purpose mapping",
      "Privacy notice redesign (22 Indian languages)",
      "Consent workflow design & implementation",
      "Data Principal rights request process",
      "72-hour breach notification playbook",
    ],
  },
  {
    name: "AI Privacy Shield™",
    tag: "AI-powered",
    subtitle: "GenAI & AI Governance",
    desc: "Specialized DPDP governance for organizations using AI, GenAI, RAG systems, agents and copilots - AI governance as a core pillar, not an afterthought.",
    icon: BrainCircuit,
    points: [
      "GenAI and AI chatbot privacy risk assessment",
      "Prompt data leakage identification",
      "RAG system personal data review",
      "AI vendor governance framework",
      "Machine unlearning advisory",
    ],
  },
  {
    name: "DPDP TrustOps™",
    tag: "Ongoing",
    subtitle: "Managed Compliance Office",
    desc: "Your outsourced DPDP compliance team - a monthly managed service from DPO support and grievances to vendor reviews and board reporting.",
    icon: Headset,
    points: [
      "DPO / Responsible Person function",
      "Monthly privacy operations management",
      "Grievance workflow management",
      "Quarterly vendor / processor review",
      "Board compliance dashboard",
    ],
  },
  {
    name: "TrustDeck™",
    tag: "Compliance workspace",
    subtitle: "Privacy Operations SaaS",
    desc: "A 12-module TrustDeck workspace for real-time DPDP compliance tracking - from data inventory to board dashboard, always up to date.",
    icon: LayoutGrid,
    points: [
      "Data Inventory & RoPA Builder",
      "Consent Register with audit trail",
      "Rights Request Tracker",
      "Breach Tracker (72-hr countdown)",
      "Board Dashboard - real-time scorecard",
    ],
  },
  {
    name: "CDPP Certification™",
    tag: "India first",
    subtitle: "Certified DPDP Professional",
    desc: "India's first employer-verifiable DPDP professional certification - with a LinkedIn badge, unique certificate number and 2-year validity.",
    icon: GraduationCap,
    points: [
      "6-module DPDP curriculum",
      "Unique certificate number (employer-verifiable)",
      "Employer verification portal",
      "LinkedIn digital badge integration",
      "Hindi + English delivery",
    ],
  },
];

export type Industry = {
  name: string;
  risk: string;
  icon: LucideIcon;
  data: string[];
  risks: string[];
  services: string[];
};

export const INDUSTRIES: Industry[] = [
  {
    name: "BFSI",
    risk: "Highest risk",
    icon: Landmark,
    data: [
      "KYC data",
      "Financial transactions",
      "Credit scores",
      "Account details",
      "Investment portfolios",
    ],
    risks: [
      "RBI/SEBI mandates",
      "Credit bureau consent",
      "Vendor data processing",
      "GenAI models on customer data",
    ],
    services: ["Compass Enterprise", "AI Privacy Shield", "TrustOps", "CDPP for DPOs"],
  },
  {
    name: "Healthcare",
    risk: "Critical",
    icon: HeartPulse,
    data: [
      "Patient records",
      "Diagnostic reports",
      "Prescription history",
      "Genomic data",
      "Mental health data",
    ],
    risks: [
      "Health data sensitivity",
      "Children's consent",
      "Insurance claim sharing",
      "AI diagnostic tools",
    ],
    services: ["Compass Enterprise", "Build", "AI Privacy Shield", "TrustOps"],
  },
  {
    name: "Education",
    risk: "High",
    icon: BookOpen,
    data: [
      "Student records",
      "Parent data",
      "Academic performance",
      "Attendance",
      "Online learning behavior",
    ],
    risks: [
      "Student minors",
      "Parental consent (Rule 10)",
      "EdTech behavioral data",
      "International transfers",
    ],
    services: ["Compass Standard", "Build", "Training", "CDPP"],
  },
  {
    name: "SaaS & IT",
    risk: "High",
    icon: Cloud,
    data: [
      "User accounts",
      "Usage analytics",
      "Employee data (GCCs)",
      "Customer data",
      "AI training data",
    ],
    risks: [
      "Processor obligations",
      "AI/GenAI training",
      "Cross-border transfers",
      "Client contractual obligations",
    ],
    services: ["AI Privacy Shield", "Compass", "TrustOps", "TrustDeck"],
  },
  {
    name: "E-Commerce",
    risk: "High",
    icon: ShoppingCart,
    data: [
      "Customer profiles",
      "Purchase history",
      "Delivery addresses",
      "Payment data",
      "Behavioral data",
    ],
    risks: [
      "Cookie consent",
      "WhatsApp marketing",
      "Loyalty/CRM data",
      "Delivery partner sharing",
    ],
    services: ["Compass", "WhatsApp Kit", "Cookie Scanner", "Build"],
  },
  {
    name: "Government",
    risk: "Strategic",
    icon: Building2,
    data: [
      "Citizen data",
      "Aadhaar-linked data",
      "Service delivery",
      "Tax data",
      "Benefits data",
    ],
    risks: [
      "Fiduciary status",
      "Citizen consent",
      "Smart city IoT",
      "GeM procurement governance",
    ],
    services: ["Compass Government", "Build for PSUs", "CERT-In audit", "Training"],
  },
];

export type WhyCard = { stat: string; label: string };

export const WHY_US: WhyCard[] = [
  { stat: "100% Rules 2025 coverage", label: "DPDP Compliance Depth" },
  { stat: "AI-first approach to DPDP", label: "AI + GenAI Governance" },
  { stat: "3-in-1: Privacy + Data + AI", label: "Data Governance Integration" },
  { stat: "72-hr breach readiness", label: "Cybersecurity Alignment" },
  { stat: "12 TrustDeck modules", label: "TrustDeck + Human Hybrid" },
  { stat: "6 industry playbooks", label: "Industry-Specific Playbooks" },
];

export type Cell = "yes" | "no" | "partial" | "strong";

export const COMPARISON_COLUMNS = [
  "Anix TrustStack",
  "Big 4",
  "Boutiques",
  "OneTrust",
] as const;

export const COMPARISON_ROWS: { label: string; cells: Cell[] }[] = [
  { label: "DPDP Readiness Assessment", cells: ["yes", "yes", "yes", "yes"] },
  { label: "AI / GenAI Governance", cells: ["yes", "no", "no", "partial"] },
  { label: "Machine Unlearning Advisory", cells: ["yes", "no", "no", "no"] },
  { label: "Managed DPO Service", cells: ["strong", "partial", "yes", "no"] },
  { label: "SaaS TrustDeck", cells: ["yes", "no", "no", "yes"] },
  { label: "India-specific TrustDeck", cells: ["yes", "no", "no", "no"] },
  { label: "CDPP Certification Program", cells: ["yes", "no", "no", "no"] },
  { label: "Hindi + Regional Language", cells: ["yes", "no", "no", "no"] },
  { label: "Affordable SME Pricing", cells: ["yes", "no", "partial", "no"] },
];

export type TimelineItem = {
  when: string;
  title: string;
  body: string;
  active?: boolean;
};

export const TIMELINE: TimelineItem[] = [
  {
    when: "Aug 2023",
    title: "The Act receives assent",
    body: "DPDP Act, 2023 is enacted, setting the framework for personal data protection in India.",
  },
  {
    when: "2025",
    title: "DPDP Rules 2025 notified",
    body: "Operational detail arrives - notice, consent managers, breach reporting and more.",
  },
  {
    when: "Now · Transition",
    title: "Build your compliance program",
    body: "Map data flows, fix consent, appoint a DPO where required, and prepare breach playbooks.",
    active: true,
  },
  {
    when: "Phased",
    title: "Obligations take effect",
    body: "Provisions become enforceable in phases - significant fiduciaries should move first.",
  },
];
