import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Reveal } from "./Reveal";
import { Swap } from "@/components/site/EasyContent";

/**
 * THE RULE: when this section is the first one rendered under a PageHero, its
 * `eyebrow` must differ from that hero's `kicker` (not equal, nor a
 * prefix/suffix). The hero already labels the band - the section must add a
 * distinct sub-label or none. See docs/eyebrow-labels-master-prompt.md.
 */
export function SectionHeader({
  eyebrow,
  title,
  lede,
  align = "left",
  className,
  easyEyebrow,
  easyTitle,
  easyLede,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  lede?: ReactNode;
  align?: "left" | "center";
  className?: string;
  /** Plain-language variants, shown when "Easy read" is on. */
  easyEyebrow?: ReactNode;
  easyTitle?: ReactNode;
  easyLede?: ReactNode;
}) {
  return (
    <Reveal
      className={cn(
        "max-w-3xl",
        align === "center" && "mx-auto text-center",
        className
      )}
    >
      {eyebrow && (
        <p className="eyebrow mb-4">
          {easyEyebrow ? <Swap easy={easyEyebrow}>{eyebrow}</Swap> : eyebrow}
        </p>
      )}
      <h2 className="font-display text-3xl font-semibold leading-[1.08] tracking-tight text-balance sm:text-4xl lg:text-[2.7rem]">
        {easyTitle ? <Swap easy={easyTitle}>{title}</Swap> : title}
      </h2>
      {lede && (
        <p className="mt-5 text-lg leading-relaxed text-text-muted text-pretty">
          {easyLede ? <Swap easy={easyLede}>{lede}</Swap> : lede}
        </p>
      )}
    </Reveal>
  );
}
