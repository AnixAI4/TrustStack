import type { ReactNode } from "react";
import { Check, Lightbulb } from "lucide-react";
import { cn } from "@/lib/cn";
import { EASY_MAP } from "@/content/easy-generated";
import { fallbackEasyText, lookupEasyText } from "@/content/easy-static";
import { easyKey } from "@/lib/easy-hash";

/**
 * Inline copy swap for server components. Renders BOTH variants; plain CSS
 * (see globals.css, driven by `html[data-reading]`) shows only the one that
 * matches the active reading mode. Use for headings / short copy.
 */
export function Swap({
  children,
  easy,
}: {
  children: ReactNode;
  easy: ReactNode;
}) {
  return (
    <>
      <span data-rm="normal">{children}</span>
      <span data-rm="easy">{easy}</span>
    </>
  );
}

/**
 * Wrap any plain-string body text in `<Easy>…</Easy>`. The build-time generator
 * (scripts/generate-easy-content.mjs) discovers these strings, and the AI writes
 * a plain-language version into the committed cache; here we look that version
 * up by content hash and render both variants for the CSS swap.
 *
 * If no simplification exists yet (nothing generated, or the text was just
 * edited so its hash changed), we render the original untouched - so the page
 * is never broken and coverage can grow incrementally.
 *
 * Children MUST be a single plain string (that's what gets hashed and sent for
 * simplification). For anything richer, hand-author with {@link Swap}.
 */
export function Easy({ children }: { children: string }) {
  const easy =
    typeof children === "string"
      ? EASY_MAP[easyKey(children)] ??
        lookupEasyText(children) ??
        fallbackEasyText(children)
      : undefined;

  if (!easy) return <>{children}</>;

  return (
    <>
      <span data-rm="normal">{children}</span>
      <span data-rm="easy">{easy}</span>
    </>
  );
}

/**
 * A warm, plain-language "In simple words" card that only appears when Easy
 * read is on. Drop it near the top of a page to tell a non-specialist, in one
 * friendly paragraph, what the page is and what they can do here.
 */
export function EasyIntro({
  title,
  children,
  points,
  className,
}: {
  title?: string;
  children: ReactNode;
  points?: string[];
  className?: string;
}) {
  return (
    <div data-rm="easy" className={cn("container-x pt-8 sm:pt-10", className)}>
      <div className="relative overflow-hidden rounded-2xl border border-accent/25 bg-accent/[0.06] p-6 sm:p-7">
        <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-accent/10 blur-3xl" />
        <div className="relative flex items-start gap-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-accent/40 bg-accent/10 text-accent">
            <Lightbulb className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-label font-semibold uppercase tracking-[0.1em] text-accent">
              In simple words
            </p>
            {title && (
              <h2 className="mt-1 font-display text-xl font-semibold text-text sm:text-2xl">
                {title}
              </h2>
            )}
            <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-text-muted sm:text-base">
              {children}
            </p>
            {points && points.length > 0 && (
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {points.map((p) => (
                  <li
                    key={p}
                    className="flex items-start gap-2 text-sm leading-relaxed text-text-muted"
                  >
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
