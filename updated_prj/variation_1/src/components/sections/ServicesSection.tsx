import { Check } from "lucide-react";
import Link from "next/link";
import { SERVICES } from "@/content/dpdp";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/Reveal";
import { cn } from "@/lib/cn";

export function ServicesSection({ id }: { id?: string }) {
  return (
    <section id={id} className="section scroll-mt-24 pt-12">
      <div className="container-x">
        <RevealGroup className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((s) => {
            const Icon = s.icon;
            return (
              <RevealItem key={s.name}>
                <div
                  className={cn(
                    "card card-hover group flex h-full flex-col",
                    s.featured && "border-accent/40 bg-accent/[0.06]"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="grid h-11 w-11 place-items-center rounded-lg border border-line bg-glass text-accent">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span
                      className={cn(
                        "font-mono text-label uppercase tracking-wider",
                        s.featured ? "badge" : "text-text-faint"
                      )}
                    >
                      {s.tag}
                    </span>
                  </div>
                  <h3 className="mt-5 font-display text-xl font-semibold text-text">
                    {s.name}
                  </h3>
                  <p className="mt-1 font-mono text-label uppercase tracking-wider text-accent">
                    {s.subtitle}
                  </p>
                  <p className="mt-3 text-sm text-text-muted">{s.desc}</p>
                  <ul className="mt-4 flex-1 space-y-2.5">
                    {s.points.map((p) => (
                      <li key={p} className="flex items-start gap-2.5">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-soft" />
                        <span className="text-sm text-text-muted">{p}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-5 text-xs text-text-faint">
                    Custom quote · based on organization size
                  </p>
                  <a
                    href="mailto:consult@anixai.io?subject=Request a quote"
                    className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-accent transition-colors hover:text-accent-soft"
                  >
                    Request a quote →
                  </a>
                </div>
              </RevealItem>
            );
          })}
          <RevealItem>
            <Reveal className="flex h-full">
              <div className="card flex h-full w-full flex-col items-start justify-center gap-3 border-dashed bg-transparent">
                <h3 className="font-display text-xl font-semibold text-text">
                  Not sure where to start?
                </h3>
                <p className="text-sm text-text-muted">
                  Begin with a free DPDP risk check, then let DPDP Compass™ map
                  your 90-day roadmap.
                </p>
                <Link href="/#risk-check" className="btn btn-accent mt-2">
                  Start the risk check
                </Link>
              </div>
            </Reveal>
          </RevealItem>
        </RevealGroup>
      </div>
    </section>
  );
}

