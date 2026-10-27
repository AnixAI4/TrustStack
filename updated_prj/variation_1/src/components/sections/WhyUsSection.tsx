import { WHY_US } from "@/content/dpdp";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { RevealGroup, RevealItem } from "@/components/ui/Reveal";
import { Easy } from "@/components/site/EasyContent";

export function WhyUsSection({ id }: { id?: string }) {
  return (
    <section id={id} className="section scroll-mt-24">
      <div className="container-x">
        <SectionHeader
          eyebrow="What sets us apart"
          title="The only firm at the intersection"
          lede={
            <Easy>DPDP + AI governance + data governance + cybersecurity - integrated into one program, because compliance in the AI era requires exactly that.</Easy>
          }
        />

        <RevealGroup className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {WHY_US.map((w, i) => (
            <RevealItem key={w.label}>
              <div className="card card-hover h-full">
                <span className="font-mono text-sm text-text-faint">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-3 font-display text-xl font-semibold text-text">
                  {w.stat}
                </h3>
                <p className="mt-2 font-mono text-label uppercase tracking-wider text-accent">
                  {w.label}
                </p>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}

