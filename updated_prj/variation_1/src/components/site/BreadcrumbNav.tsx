import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { Crumb } from "@/components/sections/PageHero";

export function BreadcrumbNav({
  items,
  className,
}: {
  items: Crumb[];
  className?: string;
}) {
  if (items.length === 0) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className={className ?? "flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1 text-sm"}
    >
      {items.map((c, i) => (
        <span key={`${c.href}-${i}`} className="flex items-center gap-1.5">
          {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-text-faint" />}
          {i === items.length - 1 ? (
            <span className="font-medium text-text">{c.label}</span>
          ) : (
            <Link
              href={c.href}
              prefetch={false}
              className="text-text-faint transition-colors hover:text-accent"
            >
              {c.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
