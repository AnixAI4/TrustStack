"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Logo } from "./Logo";
import { SOCIAL } from "@/content/site";
import { OPEN_CONSENT_EVENT } from "@/lib/progress";
import { PilotLockLink } from "@/components/gates/PilotLockLink";
import { featureForHref } from "@/lib/paid-routes";

const FOOTER_COLS = [
  {
    titleKey: "col_law",
    links: [
      { key: "law_all_sections", href: "/act" },
      { key: "law_rules", href: "/rules" },
      { key: "law_mapping", href: "/rules" },
      { key: "law_timeline", href: "/framework" },
      { key: "law_schedule", href: "/act" },
    ],
  },
  {
    titleKey: "col_resources",
    links: [
      { key: "res_rights", href: "/rights" },
      { key: "res_templates", href: "/templates" },
      { key: "res_blog", href: "/blog" },
      { key: "res_cases", href: "/cases" },
      { key: "res_tools", href: "/tools" },
      { key: "res_scanner", href: "/scanner", label: "DPDP Scanner" },
      { key: "res_security", href: "/security", label: "Security Scan" },
      { key: "res_assurance", href: "/assurance", label: "Assurance evidence" },
    ],
  },
  {
    titleKey: "col_learn",
    links: [
      { key: "learn_courses", href: "/courses" },
      { key: "learn_certificate", href: "/certification" },
      { key: "learn_quiz", href: "/learn" },
      { key: "learn_faqs", href: "/learn" },
      { key: "learn_interview", href: "/learn" },
      { key: "learn_verify", href: "/learn" },
    ],
  },
];

const SOCIAL_KEYS: Record<string, string> = {
  Email: "social_email",
};

export function Footer() {
  const t = useTranslations("footer");
  const tBrand = useTranslations("brand");
  const year = new Date().getFullYear();
  const openCookiePreferences = () => {
    window.dispatchEvent(new Event(OPEN_CONSENT_EVENT));
  };

  return (
    <footer className="relative mt-10 border-t border-line bg-bg-2/60">
      <div className="container-x grid gap-12 py-16 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="max-w-sm">
          <Logo />
          <p className="mt-4 text-sm leading-relaxed text-text-muted">
            {tBrand("description")}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {SOCIAL.map((s) => (
              <a
                key={s.label}
                href={s.href}
                {...(s.external
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
                className="rounded-pill border border-line bg-glass px-3 py-1.5 text-xs font-medium text-text-muted transition-colors hover:border-accent/50 hover:text-text"
              >
                {t(SOCIAL_KEYS[s.label] as "social_email")}
              </a>
            ))}
          </div>
        </div>

        {FOOTER_COLS.map((col) => (
          <div key={col.titleKey}>
            <h3 className="font-mono text-label uppercase tracking-[0.2em] text-text-faint">
              {t(col.titleKey)}
            </h3>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((link) => {
                const paid = Boolean(featureForHref(link.href));
                const ItemLink = paid ? PilotLockLink : Link;
                return (
                <li key={link.key}>
                  <ItemLink
                    href={link.href}
                    prefetch={false}
                    className="inline-flex items-center gap-1.5 text-sm text-text-muted transition-colors hover:text-accent"
                  >
                    {"label" in link ? link.label : t(link.key)}
                  </ItemLink>
                </li>
              );
              })}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-line">
        <div className="container-x flex flex-col items-center justify-between gap-3 py-6 text-xs text-text-faint sm:flex-row">
          <p>{t("copyright", { year })}</p>
          <div className="flex items-center gap-5">
            <a href="/privacy" className="transition-colors hover:text-text">
              {t("privacy")}
            </a>
            <a href="/cookies" className="transition-colors hover:text-text">
              {t("cookies")}
            </a>
            <button
              type="button"
              onClick={openCookiePreferences}
              className="transition-colors hover:text-text"
            >
              Manage cookies
            </button>
            <a href="/terms" className="transition-colors hover:text-text">
              {t("disclaimer")}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
