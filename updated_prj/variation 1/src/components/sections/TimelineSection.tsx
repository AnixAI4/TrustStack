import { TIMELINE } from "@/content/dpdp";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { RevealGroup, RevealItem } from "@/components/ui/Reveal";
import { cn } from "@/lib/cn";

export function TimelineSection({ id }: { id?: string }) {
  return (
    <section id={id} className="section scroll-mt-24">
      <div className="container-x">
        <SectionHeader eyebrow="Know your deadlines" title="Enforcement timeline" />

        <RevealGroup className="relative mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {TIMELINE.map((t) => (
            <RevealItem key={t.title}>
              <div
                className={cn(
                  "card h-full",
                  t.active && "border-accent/40 bg-accent/[0.06]"
                )}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "h-2.5 w-2.5 rounded-full",
                      t.active ? "bg-accent" : "bg-text-faint/50"
                    )}
                  />
                  <span
                    className={cn(
                      "font-mono text-label uppercase tracking-wider",
                      t.active ? "text-accent" : "text-text-faint"
                    )}
                  >
                    {t.when}
                  </span>
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold text-text">
                  {t.title}
                </h3>
                <p className="mt-2 text-sm text-text-muted">{t.body}</p>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
