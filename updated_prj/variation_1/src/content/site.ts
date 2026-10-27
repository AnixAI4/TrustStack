export type NavLink = { label: string; href: string; desc?: string; key?: string };

export const BRAND = {
  name: "TrustStack",
  tld: "™",
  tagline: "Read the DPDP Act like a story, not a statute.",
  description:
    "A clear, modern home for India's Digital Personal Data Protection Act, 2023 and the DPDP Rules 2025. Built for awareness in the public interest.",
};

export const PRIMARY_NAV: NavLink[] = [
  { key: "services", label: "Services", href: "/solutions" },
  { key: "framework", label: "Framework", href: "/framework" },
  { key: "industries", label: "Industries", href: "/industries" },
  { key: "why_us", label: "Why us", href: "/why-us" },
  { key: "tools", label: "Tools", href: "/tools" },
  { key: "platform", label: "TrustDeck", href: "/trustdeck" },
];

export const RESOURCES: NavLink[] = [
  { label: "The Act", href: "/act", desc: "All 44 sections" },
  { label: "DPDP Rules", href: "/rules", desc: "Rules 2025, mapped" },
  { label: "Your Rights", href: "/rights", desc: "For citizens · request letters" },
  { label: "Templates", href: "/templates", desc: "Policies & documents" },
  { label: "Case Laws", href: "/cases", desc: "Privacy jurisprudence" },
  { label: "Courses", href: "/courses", desc: "By role · 6 tracks" },
  { label: "Learn & Certify", href: "/learn", desc: "Course · quiz · FAQ" },
  { label: "Certification", href: "/certification", desc: "Certified DPDP Practitioner" },
  { label: "Insights", href: "/blog", desc: "Analysis & guides" },
];

export const MOBILE_NAV: NavLink[] = [
  { key: "home", label: "Home", href: "/" },
  { key: "platform", label: "TrustDeck", href: "/trustdeck" },
  { key: "services", label: "Services", href: "/solutions" },
  { key: "framework", label: "Framework", href: "/framework" },
  { key: "industries", label: "Industries", href: "/industries" },
  { key: "why_us", label: "Why us", href: "/why-us" },
  { key: "tools", label: "Tools", href: "/tools" },
  { key: "act", label: "The Act", href: "/act" },
  { key: "rules", label: "DPDP Rules", href: "/rules" },
  { key: "rights", label: "Your Rights", href: "/rights" },
  { key: "templates", label: "Templates", href: "/templates" },
  { key: "cases", label: "Case Laws", href: "/cases" },
  { key: "courses", label: "Courses", href: "/courses" },
  { key: "learn", label: "Learn & Certify", href: "/learn" },
  { key: "certification", label: "Certification", href: "/certification" },
  { key: "blog", label: "Insights", href: "/blog" },
];

export const FOOTER_COLUMNS: { title: string; links: NavLink[] }[] = [
  {
    title: "The Law",
    links: [
      { label: "All sections", href: "/act" },
      { label: "DPDP Rules 2025", href: "/rules" },
      { label: "Act ↔ Rules mapping", href: "/rules" },
      { label: "Enforcement timeline", href: "/framework" },
      { label: "The Schedule & penalties", href: "/act" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Your rights as a citizen", href: "/rights" },
      { label: "Templates & policies", href: "/templates" },
      { label: "Blogs & insights", href: "/blog" },
      { label: "Case laws", href: "/cases" },
      { label: "Tools & generators", href: "/tools" },
    ],
  },
  {
    title: "Learn",
    links: [
      { label: "Courses by role", href: "/courses" },
      { label: "Certificate course", href: "/certification" },
      { label: "DPDP quiz", href: "/learn" },
      { label: "FAQs", href: "/learn" },
      { label: "Interview questions", href: "/learn" },
      { label: "Verify a certificate", href: "/learn" },
    ],
  },
];

export const SOCIAL: { label: string; href: string; external?: boolean }[] = [
  {
    label: "Email",
    href: "mailto:consult@anixai.io?subject=TrustStack%20enquiry",
  },
];
