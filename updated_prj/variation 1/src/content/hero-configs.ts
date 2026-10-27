export type HeroIconKey =
  | "sparkles"
  | "compass"
  | "hammer"
  | "brain-circuit"
  | "headset"
  | "layout-grid"
  | "graduation-cap"
  | "search"
  | "clipboard-list"
  | "pencil-ruler"
  | "shield-check"
  | "rocket"
  | "bar-chart"
  | "refresh"
  | "database"
  | "heart-pulse"
  | "school"
  | "shopping-cart"
  | "landmark"
  | "scale"
  | "calculator"
  | "file-text"
  | "book-open"
  | "cloud"
  | "building-2"
  | "eye"
  | "pencil-line"
  | "trash-2"
  | "life-buoy"
  | "user-plus"
  | "power-off"
  | "layers"
  | "shield-alert"
  | "sliders"
  | "cookie"
  | "radar"
  | "lock-keyhole"
  | "network"
  | "gavel"
  | "file-signature"
  | "user-check"
  | "baby"
  | "cpu";

export type HeroColorKey =
  | "accent"
  | "gold"
  | "amber"
  | "blue"
  | "brand"
  | "green"
  | "red";

export type HeroVariant =
  | "orbit"
  | "sequence"
  | "hexagon"
  | "converge"
  | "pulse"
  | "scan"
  | "radar"
  | "legal"
  | "document-stack"
  | "industry-models"
  | "act-codex"
  | "integration-core"
  | "tools-console"
  | "rights-wheel"
  | "rules-index"
  | "learning-path"
  | "credential-press"
  | "case-balance"
  | "scanner-gantry"
  | "security-fortress"
  | "course-router"
  | "template-archive"
  | "editorial-press"
  | "privacy-vault"
  | "terms-ledger"
  | "consent-console"
  | "restrained";

export type HeroNodeStyle = "tiles" | "labels" | "seals" | "tabs";

export type HeroModelKey =
  | "finance-city"
  | "hospital-campus"
  | "school-campus"
  | "technology-hub"
  | "commerce-store"
  | "civic-complex";

export type HeroNode = {
  name: string;
  short: string;
  iconKey: HeroIconKey;
  colorKey: HeroColorKey;
  model?: HeroModelKey;
  meta?: string;
};

export type ConstellationHeroConfig = {
  word: string;
  easyWord?: string;
  instruction?: string;
  nodes?: readonly HeroNode[];
  variant?: HeroVariant;
  nodeStyle?: HeroNodeStyle;
  showShellBlobs?: boolean;
};

export type HeroConfigKey =
  | "solutions"
  | "industries"
  | "rights"
  | "whyUs"
  | "tools"
  | "scanner"
  | "security"
  | "act"
  | "rules"
  | "learn"
  | "certification"
  | "courses"
  | "templates"
  | "blog"
  | "cases"
  | "privacy"
  | "terms"
  | "cookies";

export const HERO_CONFIGS = {
  solutions: {
    word: "Services",
    variant: "orbit",
    nodeStyle: "tiles",
    showShellBlobs: true,
    nodes: [
      { name: "DPDP Ignite", short: "Ignite", iconKey: "sparkles", colorKey: "accent" },
      { name: "DPDP Compass", short: "Compass", iconKey: "compass", colorKey: "gold" },
      { name: "DPDP Build", short: "Build", iconKey: "hammer", colorKey: "blue" },
      { name: "AI Privacy Shield", short: "AI Shield", iconKey: "brain-circuit", colorKey: "brand" },
      { name: "DPDP TrustOps", short: "TrustOps", iconKey: "headset", colorKey: "green" },
      { name: "TrustDeck", short: "TrustDeck", iconKey: "layout-grid", colorKey: "amber" },
      { name: "CDPP Certification", short: "Certify", iconKey: "graduation-cap", colorKey: "red" },
    ],
  },
  industries: {
    word: "Industries",
    variant: "industry-models",
    nodeStyle: "labels",
    nodes: [
      { name: "BFSI", short: "BFSI", iconKey: "landmark", colorKey: "blue", model: "finance-city" },
      { name: "Healthcare", short: "Healthcare", iconKey: "heart-pulse", colorKey: "green", model: "hospital-campus" },
      { name: "Education", short: "Education", iconKey: "book-open", colorKey: "amber", model: "school-campus" },
      { name: "SaaS & IT", short: "SaaS & IT", iconKey: "cloud", colorKey: "brand", model: "technology-hub" },
      { name: "E-Commerce", short: "E-Commerce", iconKey: "shopping-cart", colorKey: "accent", model: "commerce-store" },
      { name: "Government", short: "Government", iconKey: "building-2", colorKey: "red", model: "civic-complex" },
    ],
  },
  rights: {
    word: "Your Rights",
    variant: "rights-wheel",
    nodes: [
      { name: "Access your data", short: "Access", iconKey: "eye", colorKey: "blue", meta: "Section 11" },
      { name: "Correct & complete", short: "Correct", iconKey: "pencil-line", colorKey: "green", meta: "Section 12" },
      { name: "Erase your data", short: "Erase", iconKey: "trash-2", colorKey: "gold", meta: "Section 12" },
      { name: "Grievance redressal", short: "Grievance", iconKey: "life-buoy", colorKey: "blue", meta: "Section 13" },
      { name: "Nominate someone", short: "Nominate", iconKey: "user-plus", colorKey: "green", meta: "Section 14" },
      { name: "Withdraw consent", short: "Withdraw", iconKey: "power-off", colorKey: "gold", meta: "Section 6" },
    ],
  },
  whyUs: {
    word: "Why us",
    variant: "integration-core",
    nodes: [
      { name: "100% Rules 2025 coverage", short: "Rules 2025", iconKey: "clipboard-list", colorKey: "accent" },
      { name: "AI-first approach to DPDP", short: "AI-first", iconKey: "brain-circuit", colorKey: "amber" },
      { name: "3-in-1: Privacy + Data + AI", short: "3-in-1", iconKey: "layers", colorKey: "accent" },
      { name: "72-hr breach readiness", short: "Breach ready", iconKey: "shield-alert", colorKey: "amber" },
      { name: "12 TrustDeck modules", short: "12 modules", iconKey: "layout-grid", colorKey: "accent" },
      { name: "6 industry playbooks", short: "6 playbooks", iconKey: "book-open", colorKey: "amber" },
    ],
  },
  tools: {
    word: "Tools",
    variant: "tools-console",
    nodes: [
      { name: "Calculators", short: "Calculators", iconKey: "calculator", colorKey: "blue" },
      { name: "Document Studio", short: "Document Studio", iconKey: "file-text", colorKey: "green" },
    ],
  },
  scanner: {
    word: "Scan",
    variant: "scanner-gantry",
    nodes: [
      { name: "HTTPS", short: "HTTPS", iconKey: "lock-keyhole", colorKey: "green" },
      { name: "Consent banner", short: "Consent", iconKey: "shield-check", colorKey: "accent" },
      { name: "Privacy policy", short: "Privacy", iconKey: "file-text", colorKey: "blue" },
      { name: "Cookie policy", short: "Policy", iconKey: "file-text", colorKey: "gold" },
      { name: "Cookies", short: "Cookies", iconKey: "cookie", colorKey: "amber" },
      { name: "Third-party trackers", short: "Trackers", iconKey: "radar", colorKey: "red" },
    ],
  },
  security: {
    word: "Security",
    variant: "security-fortress",
    nodes: [
      { name: "Transport / TLS", short: "TLS", iconKey: "lock-keyhole", colorKey: "blue" },
      { name: "Security headers", short: "Headers", iconKey: "shield-check", colorKey: "green" },
      { name: "Data exposure", short: "Exposure", iconKey: "eye", colorKey: "red" },
      { name: "Cookies", short: "Cookies", iconKey: "cookie", colorKey: "amber" },
      { name: "Third-party surface", short: "Third parties", iconKey: "network", colorKey: "brand" },
      { name: "Breach contactability", short: "Breach contact", iconKey: "headset", colorKey: "accent" },
    ],
  },
  act: {
    word: "The Act",
    variant: "act-codex",
    nodes: [
      { name: "Preliminary", short: "Preliminary", iconKey: "book-open", colorKey: "gold", meta: "Sections 1-3" },
      { name: "Obligations of Data Fiduciary", short: "Obligations", iconKey: "clipboard-list", colorKey: "amber", meta: "Sections 4-10" },
      { name: "Rights & Duties of Data Principal", short: "Rights & Duties", iconKey: "scale", colorKey: "gold", meta: "Sections 11-15" },
      { name: "Special Provisions", short: "Special Provisions", iconKey: "file-text", colorKey: "amber", meta: "Sections 16-17" },
      { name: "Data Protection Board of India", short: "The Board", iconKey: "landmark", colorKey: "gold", meta: "Sections 18-26" },
      { name: "Powers, Functions & Procedure of Board", short: "Board Procedure", iconKey: "gavel", colorKey: "amber", meta: "Sections 27-28" },
      { name: "Appeal & Alternate Dispute Resolution", short: "Appeals & ADR", iconKey: "scale", colorKey: "gold", meta: "Sections 29-32" },
      { name: "Penalties & Adjudication", short: "Penalties", iconKey: "gavel", colorKey: "amber", meta: "Sections 33-34" },
      { name: "Miscellaneous", short: "Miscellaneous", iconKey: "file-text", colorKey: "gold", meta: "Sections 35-44" },
    ],
  },
  rules: {
    word: "Rules",
    variant: "rules-index",
    nodes: [
      { name: "General", short: "General", iconKey: "file-text", colorKey: "gold" },
      { name: "Consent & Notice", short: "Consent", iconKey: "clipboard-list", colorKey: "amber" },
      { name: "Breach & Security", short: "Breach", iconKey: "shield-alert", colorKey: "gold" },
      { name: "Children", short: "Children", iconKey: "baby", colorKey: "amber" },
      { name: "The Board", short: "The Board", iconKey: "landmark", colorKey: "gold" },
      { name: "Transfers", short: "Transfers", iconKey: "database", colorKey: "amber" },
    ],
  },
  learn: {
    word: "Learn",
    variant: "learning-path",
    nodeStyle: "labels",
    nodes: [
      { name: "Courses by role", short: "Courses", iconKey: "graduation-cap", colorKey: "green" },
      { name: "Adaptive quiz", short: "Quiz", iconKey: "sparkles", colorKey: "blue" },
      { name: "Privacy Notice Generator", short: "Notice", iconKey: "file-text", colorKey: "green" },
      { name: "Legitimate Interest tool", short: "Lawful basis", iconKey: "scale", colorKey: "blue" },
      { name: "Consent checklist", short: "Consent", iconKey: "clipboard-list", colorKey: "green" },
      { name: "Frequently asked questions", short: "FAQ", iconKey: "book-open", colorKey: "blue" },
    ],
  },
  certification: {
    word: "Certify",
    variant: "credential-press",
    nodeStyle: "seals",
    nodes: [
      { name: "Foundations of the DPDP Act", short: "Foundations", iconKey: "layers", colorKey: "gold" },
      { name: "Notice & Consent", short: "Consent", iconKey: "file-signature", colorKey: "green" },
      { name: "Legitimate Uses", short: "Uses", iconKey: "scale", colorKey: "gold" },
      { name: "Data Principal Rights & Duties", short: "Rights", iconKey: "user-check", colorKey: "green" },
      { name: "Data Fiduciary Obligations", short: "Obligations", iconKey: "lock-keyhole", colorKey: "gold" },
      { name: "Children & Persons with Disabilities", short: "Children", iconKey: "baby", colorKey: "green" },
      { name: "Significant Data Fiduciaries", short: "SDFs", iconKey: "building-2", colorKey: "gold" },
      { name: "Breach, the Board & Penalties", short: "Breach & Board", iconKey: "landmark", colorKey: "green" },
    ],
  },
  courses: {
    word: "Courses",
    variant: "course-router",
    nodeStyle: "tabs",
    nodes: [
      { name: "For citizens & families", short: "Citizens", iconKey: "shield-check", colorKey: "blue" },
      { name: "For founders & SMEs", short: "Founders", iconKey: "rocket", colorKey: "green" },
      { name: "For DPOs & privacy leads", short: "DPOs", iconKey: "graduation-cap", colorKey: "gold" },
      { name: "For legal, risk & compliance", short: "Legal & risk", iconKey: "scale", colorKey: "brand" },
      { name: "For engineering & security", short: "Engineering", iconKey: "cpu", colorKey: "accent" },
      { name: "For students & aspirants", short: "Students", iconKey: "book-open", colorKey: "amber" },
    ],
  },
  templates: {
    word: "Templates",
    variant: "template-archive",
    nodes: [
      { name: "Policies", short: "Policies", iconKey: "file-text", colorKey: "blue" },
      { name: "Agreements", short: "Agreements", iconKey: "file-signature", colorKey: "gold" },
      { name: "Forms & notices", short: "Forms", iconKey: "clipboard-list", colorKey: "amber" },
      { name: "Breach", short: "Breach", iconKey: "shield-alert", colorKey: "red" },
    ],
  },
  blog: {
    word: "Insights",
    variant: "editorial-press",
    nodeStyle: "labels",
    nodes: [
      { name: "Compliance", short: "Compliance", iconKey: "clipboard-list", colorKey: "accent" },
      { name: "AI", short: "AI", iconKey: "brain-circuit", colorKey: "brand" },
      { name: "SMEs", short: "SMEs", iconKey: "rocket", colorKey: "amber" },
      { name: "Children", short: "Children", iconKey: "baby", colorKey: "green" },
      { name: "Rights", short: "Rights", iconKey: "user-check", colorKey: "blue" },
    ],
  },
  cases: {
    word: "Cases",
    variant: "case-balance",
    nodeStyle: "tabs",
    nodes: [
      { name: "Right to privacy", short: "Privacy", iconKey: "shield-check", colorKey: "gold" },
      { name: "Consent & confidentiality", short: "Consent", iconKey: "file-signature", colorKey: "amber" },
      { name: "Surveillance & the state", short: "Surveillance", iconKey: "radar", colorKey: "red" },
      { name: "Speech & the internet", short: "Speech", iconKey: "network", colorKey: "blue" },
    ],
  },
  privacy: {
    word: "Privacy Policy",
    variant: "privacy-vault",
    nodes: [
      { name: "Personal data we collect", short: "Personal data", iconKey: "database", colorKey: "blue" },
      { name: "Purposes and lawful basis", short: "Purposes", iconKey: "scale", colorKey: "gold" },
      { name: "Consent and withdrawal", short: "Consent", iconKey: "clipboard-list", colorKey: "green" },
      { name: "Security safeguards", short: "Security", iconKey: "shield-check", colorKey: "red" },
      { name: "Retention and deletion", short: "Retention", iconKey: "refresh", colorKey: "amber" },
      { name: "Your DPDP rights", short: "Rights", iconKey: "user-check", colorKey: "brand" },
    ],
  },
  terms: {
    word: "Terms",
    variant: "terms-ledger",
    nodes: [
      { name: "Educational and operational content", short: "Content", iconKey: "book-open", colorKey: "blue" },
      { name: "Using templates and tools", short: "Tools", iconKey: "file-text", colorKey: "green" },
      { name: "Acceptable use", short: "Acceptable use", iconKey: "shield-check", colorKey: "gold" },
      { name: "Accuracy and updates", short: "Updates", iconKey: "refresh", colorKey: "amber" },
      { name: "Liability", short: "Liability", iconKey: "scale", colorKey: "red" },
      { name: "Privacy and cookies", short: "Privacy", iconKey: "lock-keyhole", colorKey: "brand" },
    ],
  },
  cookies: {
    word: "Cookies",
    variant: "consent-console",
    nodes: [
      { name: "Essential cookies", short: "Essential", iconKey: "lock-keyhole", colorKey: "green", meta: "Always on" },
      { name: "Functional cookies", short: "Functional", iconKey: "sliders", colorKey: "blue", meta: "Optional" },
      { name: "Analytics cookies", short: "Analytics", iconKey: "bar-chart", colorKey: "gold", meta: "Optional consent" },
      { name: "Marketing cookies", short: "Marketing", iconKey: "sparkles", colorKey: "accent", meta: "Optional consent" },
    ],
  },
} as const satisfies Record<HeroConfigKey, ConstellationHeroConfig>;