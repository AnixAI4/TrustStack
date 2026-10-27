import { ARTICLE_BODIES } from "./blog-articles";

export type BlogCat = "compliance" | "ai" | "smes" | "children" | "rights";

export type ArticleBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "table"; headers: string[]; rows: string[][] };

export type Article = {
  slug: string;
  title: string;
  kind: string;
  read: string;
  cat: BlogCat;
  desc: string;
  featured?: boolean;
  badge?: string;
  meta?: string;
  body: ArticleBlock[];
};

export const BLOG_FILTERS: { key: BlogCat | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "compliance", label: "Compliance" },
  { key: "ai", label: "AI" },
  { key: "smes", label: "SMEs" },
  { key: "children", label: "Children" },
  { key: "rights", label: "Rights" },
];

const CATALOG: Omit<Article, "body">[] = [
  {
    slug: "dpdp-rules-2025-industry-implications",
    title: "DPDP Rules 2025: a clear-eyed analysis of industry implications",
    kind: "Analysis",
    read: "12 min read",
    cat: "compliance",
    desc: "From consent managers to breach timelines, the operational detail finally lands. Here's what every Data Fiduciary should action first - and what can wait.",
    featured: true,
    badge: "Featured · Analysis",
    meta: "12 min read · Compliance",
  },
  {
    slug: "consent-manager-role",
    title: "Understanding the role of a Consent Manager",
    kind: "Guide",
    read: "6 min read",
    cat: "compliance",
    desc: "How consent managers work under the Act and the 2025 Rules",
  },
  {
    slug: "cybersecurity-role-dpdp-act",
    title: "Cybersecurity's role in India's DPDP Act",
    kind: "Brief",
    read: "11 min read",
    cat: "compliance",
    desc: "Why cybersecurity is the control layer that makes DPDP obligations work in real organisations.",
  },
  {
    slug: "data-localization-transfers",
    title: "Data localization & transfers under the DPDPA",
    kind: "Analysis",
    read: "7 min read",
    cat: "compliance",
    desc: 'What "outside India" really means for your data flows',
  },
  {
    slug: "detecting-unauthorised-use",
    title: "Detecting unauthorised use of personal data",
    kind: "Playbook",
    read: "8 min read",
    cat: "compliance",
    desc: "Monitoring patterns that catch misuse before it becomes a breach",
  },
  {
    slug: "dpdpa-ai-systems",
    title: "Impact of the DPDPA on AI systems",
    kind: "Analysis",
    read: "8 min read",
    cat: "ai",
    desc: "What model builders must know about training data and consent",
  },
  {
    slug: "chatgpt-generative-ai-risks",
    title: "ChatGPT, generative AI and DPDP data-protection risks",
    kind: "Analysis",
    read: "9 min read",
    cat: "ai",
    desc: "Where large models bump into consent, purpose and erasure",
  },
  {
    slug: "dpdpa-small-businesses",
    title: "The DPDPA conundrum for small businesses",
    kind: "Playbook",
    read: "5 min read",
    cat: "smes",
    desc: "Practical, low-cost steps to get compliant without a big team",
  },
  {
    slug: "right-to-be-forgotten",
    title: "The right to be forgotten under the DPDPA",
    kind: "Explainer",
    read: "7 min read",
    cat: "rights",
    desc: "How erasure works in practice - and its limits",
  },
  {
    slug: "privacy-in-india-history",
    title: "Privacy in India: was it there, will it be there?",
    kind: "Essay",
    read: "10 min read",
    cat: "rights",
    desc: "A short history of privacy - and where the DPDP Act takes it",
  },
  {
    slug: "childrens-data-consent",
    title: "Children's data: consent, age-gating and tracking bans",
    kind: "Guide",
    read: "6 min read",
    cat: "children",
    desc: "What Section 9 and Rule 10 demand of platforms",
  },
];

export const ARTICLES: Article[] = CATALOG.map((entry) => ({
  ...entry,
  body: ARTICLE_BODIES[entry.slug] ?? [],
}));

export const FEATURED_POST = ARTICLES.find((a) => a.featured) ?? ARTICLES[0];

/** Grid posts - everything except the featured card on the index. */
export const POSTS = ARTICLES.filter((a) => !a.featured);

export function getArticle(slug: string): Article | undefined {
  return ARTICLES.find((a) => a.slug === slug);
}

export function getArticleSlugs(): string[] {
  return ARTICLES.map((a) => a.slug);
}
