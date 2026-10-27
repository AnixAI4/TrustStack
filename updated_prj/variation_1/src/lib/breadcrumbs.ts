import { getArticle } from "@/content/blog";
import { getRule } from "@/content/rules";
import { getSection } from "@/content/section-enrichment";
import { COURSES } from "@/content/courses";
import { MODULES } from "@/content/curriculum";
import { getTemplate } from "@/content/templates";
import type { Crumb } from "@/components/sections/PageHero";

const STATIC: Record<string, Crumb[]> = {
  "/": [{ label: "Home", href: "/" }],
  "/act": [
    { label: "Home", href: "/" },
    { label: "The Act", href: "/act" },
  ],
  "/rules": [
    { label: "Home", href: "/" },
    { label: "DPDP Rules 2025", href: "/rules" },
  ],
  "/rights": [
    { label: "Home", href: "/" },
    { label: "Your rights", href: "/rights" },
  ],
  "/templates": [
    { label: "Home", href: "/" },
    { label: "Templates & Policies", href: "/templates" },
  ],
  "/cases": [
    { label: "Home", href: "/" },
    { label: "Case Laws", href: "/cases" },
  ],
  "/courses": [
    { label: "Home", href: "/" },
    { label: "Courses", href: "/courses" },
  ],
  "/learn": [
    { label: "Home", href: "/" },
    { label: "Learn & Certify", href: "/learn" },
  ],
  "/certification": [
    { label: "Home", href: "/" },
    { label: "Learn & Certify", href: "/learn" },
    { label: "Certification", href: "/certification" },
  ],
  "/blog": [
    { label: "Home", href: "/" },
    { label: "Insights", href: "/blog" },
  ],
  "/framework": [
    { label: "Home", href: "/" },
    { label: "Framework", href: "/framework" },
  ],
  "/industries": [
    { label: "Home", href: "/" },
    { label: "Industries", href: "/industries" },
  ],
  "/solutions": [
    { label: "Home", href: "/" },
    { label: "Services", href: "/solutions" },
  ],
  "/why-us": [
    { label: "Home", href: "/" },
    { label: "Why us", href: "/why-us" },
  ],
  "/tools": [
    { label: "Home", href: "/" },
    { label: "Tools", href: "/tools" },
  ],
  "/scanner": [
    { label: "Home", href: "/" },
    { label: "DPDP Scanner", href: "/scanner" },
  ],
  "/privacy": [
    { label: "Home", href: "/" },
    { label: "Privacy Policy", href: "/privacy" },
  ],
  "/cookies": [
    { label: "Home", href: "/" },
    { label: "Cookie Policy", href: "/cookies" },
  ],
  "/terms": [
    { label: "Home", href: "/" },
    { label: "Terms and Disclaimer", href: "/terms" },
  ],
};

export function getBreadcrumbs(
  pathname: string,
  searchParams?: URLSearchParams | null
): Crumb[] {
  // Strip .html suffix so rewrites (e.g. /solutions.html) match the canonical keys (/solutions)
  // during server-side rendering, preventing hydration mismatches on array length.
  const canonicalPath = pathname.replace(/\.html$/, "");

  if (STATIC[canonicalPath]) return STATIC[canonicalPath];

  if (canonicalPath === "/section") {
    const sectionNumber = Number(searchParams?.get("n"));
    const section = Number.isInteger(sectionNumber) ? getSection(sectionNumber) : null;
    return [
      { label: "Home", href: "/" },
      { label: "The Act", href: "/act" },
      section
        ? { label: `Section ${section.n}`, href: `/section/${section.n}` }
        : { label: "Section reader", href: "/act" },
    ];
  }

  const sectionMatch = canonicalPath.match(/^\/section\/(\d+)$/);
  if (sectionMatch) {
    const sec = getSection(Number(sectionMatch[1]));
    if (sec) {
      return [
        { label: "Home", href: "/" },
        { label: "The Act", href: "/act" },
        { label: `Section ${sec.n}`, href: `/section/${sec.n}` },
      ];
    }
  }

  const courseMatch = canonicalPath.match(/^\/courses\/([^/]+)$/);
  if (courseMatch) {
    const course = COURSES.find((c) => c.slug === courseMatch[1]);
    if (course) {
      return [
        { label: "Home", href: "/" },
        { label: "Courses", href: "/courses" },
        { label: course.title, href: `/courses/${course.slug}` },
      ];
    }
  }

  const moduleMatch = canonicalPath.match(/^\/certification\/([^/]+)$/);
  if (moduleMatch && moduleMatch[1] !== "exam") {
    const mod = MODULES.find((m) => m.slug === moduleMatch[1]);
    if (mod) {
      return [
        { label: "Home", href: "/" },
        { label: "Certification", href: "/certification" },
        { label: `Module ${mod.n}`, href: `/certification/${mod.slug}` },
      ];
    }
  }

  const blogMatch = canonicalPath.match(/^\/blog\/([^/]+)$/);
  if (blogMatch) {
    const article = getArticle(blogMatch[1]);
    if (article) {
      return [
        { label: "Home", href: "/" },
        { label: "Insights", href: "/blog" },
        { label: article.title, href: `/blog/${article.slug}` },
      ];
    }
  }

  const ruleMatch = canonicalPath.match(/^\/rules\/(\d+)$/);
  if (ruleMatch) {
    const rule = getRule(Number(ruleMatch[1]));
    if (rule) {
      return [
        { label: "Home", href: "/" },
        { label: "DPDP Rules 2025", href: "/rules" },
        { label: `Rule ${rule.n}`, href: `/rules/${rule.n}` },
      ];
    }
  }

  const templateMatch = canonicalPath.match(/^\/templates\/([^/]+)$/);
  if (templateMatch) {
    const template = getTemplate(templateMatch[1]);
    if (template) {
      return [
        { label: "Home", href: "/" },
        { label: "Templates & Policies", href: "/templates" },
        { label: template.title, href: `/templates/${template.slug}` },
      ];
    }
  }

  const scannerReportMatch = canonicalPath.match(/^\/scanner\/report\/([^/]+)$/);
  if (scannerReportMatch) {
    return [
      { label: "Home", href: "/" },
      { label: "DPDP Scanner", href: "/scanner" },
      {
        label: "Assessment report",
        href: `/scanner/report/${scannerReportMatch[1]}`,
      },
    ];
  }

  return [{ label: "Home", href: "/" }];
}
