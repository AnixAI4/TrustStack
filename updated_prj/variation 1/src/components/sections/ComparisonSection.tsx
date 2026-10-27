import { Check, CheckCheck, Minus, X } from "lucide-react";
import {
  COMPARISON_COLUMNS,
  COMPARISON_ROWS,
  type Cell,
} from "@/content/dpdp";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Reveal } from "@/components/ui/Reveal";
import { cn } from "@/lib/cn";

function CellMark({ value }: { value: Cell }) {
  if (value === "strong")
    return <CheckCheck className="mx-auto h-5 w-5 text-green-soft" />;
  if (value === "yes")
    return <Check className="mx-auto h-5 w-5 text-green-soft" />;
  if (value === "partial")
    return <Minus className="mx-auto h-5 w-5 text-amber" />;
  return <X className="mx-auto h-5 w-5 text-text-faint/60" />;
}

export function ComparisonSection({ id }: { id?: string }) {
  return (
    <section id={id} className="section scroll-mt-24">
      <div className="container-x">
        <SectionHeader
          eyebrow="How we compare"
          title="Anix TrustStack vs Big 4 vs Boutiques vs OneTrust"
          lede="India's most complete DPDP stack - DPDP + AI + data governance + cybersecurity in one place."
        />

        <Reveal className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[640px] border-separate border-spacing-0">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-bg px-4 py-4 text-left font-mono text-label uppercase tracking-wider text-text-faint">
                  Capability
                </th>
                {COMPARISON_COLUMNS.map((c, i) => (
                  <th
                    key={c}
                    className={cn(
                      "px-4 py-4 text-center text-sm font-semibold",
                      i === 0
                        ? "rounded-t-lg bg-accent/10 text-text"
                        : "text-text-muted"
                    )}
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map((row, ri) => (
                <tr key={row.label} className="group">
                  <td
                    className={cn(
                      "sticky left-0 z-10 bg-bg px-4 py-3.5 text-sm text-text",
                      ri !== COMPARISON_ROWS.length - 1 && "border-b border-line"
                    )}
                  >
                    {row.label}
                  </td>
                  {row.cells.map((cell, ci) => (
                    <td
                      key={ci}
                      className={cn(
                        "px-4 py-3.5 text-center",
                        ci === 0 && "bg-accent/[0.06]",
                        ci === 0 &&
                          ri === COMPARISON_ROWS.length - 1 &&
                          "rounded-b-lg",
                        ri !== COMPARISON_ROWS.length - 1 && "border-b border-line"
                      )}
                    >
                      <CellMark value={cell} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </Reveal>
      </div>
    </section>
  );
}

