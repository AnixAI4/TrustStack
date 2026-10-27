"use client";

import { Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { getBreadcrumbs } from "@/lib/breadcrumbs";
import { BreadcrumbBar } from "./BreadcrumbBar";
import type { Crumb } from "@/components/sections/PageHero";

function translateCrumbs(
  items: Crumb[],
  tNav: (key: string) => string
): Crumb[] {
  const labelKeys: Record<string, string> = {
    Home: "home",
    "The Act": "act",
    "DPDP Rules 2025": "rules",
    "Your rights": "rights",
    "Templates & Policies": "templates",
    "Case Laws": "cases",
    Courses: "courses",
    "Learn & Certify": "learn",
    Certification: "certification",
    Insights: "blog",
    Framework: "framework",
    Industries: "industries",
    Services: "services",
    "Why us": "why_us",
    Tools: "tools",
    "Section reader": "act",
    "DPDP Scanner": "scanner",
    "Assessment report": "scanner_report",
  };

  return items.map((c) => {
    const key = labelKeys[c.label];
    return key ? { ...c, label: tNav(key) } : c;
  });
}

function SectionBreadcrumbInner() {
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const tNav = useTranslations("nav");
  const items = translateCrumbs(
    getBreadcrumbs(pathname, searchParams),
    tNav
  );
  return <BreadcrumbBar items={items} />;
}

function PathBreadcrumb() {
  const pathname = usePathname() ?? "/";
  const tNav = useTranslations("nav");
  const items = translateCrumbs(getBreadcrumbs(pathname), tNav);
  return <BreadcrumbBar items={items} />;
}

export function SiteBreadcrumb() {
  const pathname = usePathname() ?? "/";

  if (pathname === "/section") {
    return (
      <Suspense
        fallback={
          <BreadcrumbBar
            items={[{ label: "Home", href: "/" }, { label: "The Act", href: "/act" }]}
          />
        }
      >
        <SectionBreadcrumbInner />
      </Suspense>
    );
  }

  return <PathBreadcrumb />;
}
