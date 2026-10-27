"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import { usePathname } from "next/navigation";
import { Languages } from "lucide-react";

export function LegalTranslationNotice() {
  const locale = useLocale();
  const pathname = usePathname();
  if (locale === "en") return null;

  const isAct = pathname === "/act" || pathname.startsWith("/section/");
  const isRules = pathname === "/rules" || pathname.startsWith("/rules/");
  if (!isAct && !isRules) return null;

  const source = isAct ? "/DPDP-Act-2023-official.pdf" : "/DPDP-Rules-2025.pdf";

  return (
    <div className="border-b border-line bg-amber/[0.08]">
      <div className="container-x flex items-start gap-3 py-3 text-sm leading-relaxed text-text-muted">
        <Languages className="mt-0.5 h-4 w-4 shrink-0 text-amber" />
        <p>
          The translated wording on this page is automated and is not an
          official legal translation. Verify legal wording against the{" "}
          <Link
            href={source}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-text underline decoration-line underline-offset-4 hover:text-accent"
          >
            official gazette source
          </Link>
          .
        </p>
      </div>
    </div>
  );
}