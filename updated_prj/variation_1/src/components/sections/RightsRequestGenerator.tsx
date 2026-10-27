"use client";

import { useEffect, useState } from "react";
import { Eye, Mail, ShieldCheck } from "lucide-react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { RIGHT_REQUESTS, type RequestValues } from "@/content/rights";
import { cn } from "@/lib/cn";

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm text-text-muted">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1.5 w-full rounded-lg border border-line bg-bg-2/60 px-3 py-2.5 text-sm text-text outline-none placeholder:text-text-faint focus:border-accent/50"
      />
    </label>
  );
}

function LetterPreview({ body }: { body: string }) {
  return (
    <div className="lg:sticky lg:top-24 lg:self-start">
      <div className="mb-3 inline-flex items-center gap-1.5 rounded-pill border border-line bg-glass px-3 py-1.5 text-xs font-medium text-text-muted">
        <Eye className="h-3.5 w-3.5 text-accent" />
        On-screen preview · view only
      </div>
      <div
        className="max-h-[600px] overflow-auto rounded-xl border border-line bg-bg-2/60 p-6 select-none"
        style={{ WebkitUserSelect: "none", userSelect: "none" }}
        onContextMenu={(e) => e.preventDefault()}
        onCopy={(e) => e.preventDefault()}
        onCut={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
      >
        <div className="space-y-3 font-serif text-sm leading-relaxed text-text-muted">
          {body.split("\n").map((l, i) =>
            l.trim() ? (
              <p key={i} className={cn(l.startsWith("Subject:") && "font-semibold text-text")}>
                {l}
              </p>
            ) : (
              <div key={i} className="h-1.5" />
            )
          )}
        </div>
      </div>
      <p className="mt-3 text-xs text-text-faint">
        Preview only - download, print and copy are disabled for request letters.
      </p>
    </div>
  );
}

export function RightsRequestGenerator({ id }: { id?: string }) {
  const [active, setActive] = useState(RIGHT_REQUESTS[0].id);
  const [name, setName] = useState("");
  const [org, setOrg] = useState("");
  const [email, setEmail] = useState("");
  const [ref, setRef] = useState("");
  const [details, setDetails] = useState("");
  const [date, setDate] = useState("");

  // Set the date on the client only, to avoid a hydration mismatch.
  useEffect(() => {
    setDate(
      new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
    );
  }, []);

  const req = RIGHT_REQUESTS.find((r) => r.id === active) ?? RIGHT_REQUESTS[0];

  const values: RequestValues = { name, org, email, ref, details, date };
  const body = req.build(values);

  return (
    <section id={id} className="section scroll-mt-24">
      <div className="container-x">
        <SectionHeader
          eyebrow="Request studio · ready-to-send letters"
          title="Write the letter, free, in a minute"
          lede="Pick what you want to ask for, fill in a few details, and a formal letter that cites the right section of the Act assembles live on screen. Preview only - download, print and copy are disabled. Everything is built on your device, nothing is uploaded."
        />

        <div className="mt-10 rounded-xl border border-line bg-surface-2/40 p-6 sm:p-8">
          {/* request selector */}
          <div className="flex flex-wrap gap-2">
            {RIGHT_REQUESTS.map((r) => {
              const Icon = r.icon;
              const on = r.id === active;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setActive(r.id)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-pill border px-4 py-2 text-sm font-medium transition-all",
                    on
                      ? "border-accent/50 bg-accent/10 text-text"
                      : "border-line text-text-muted hover:border-accent/30 hover:text-text"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {r.label}
                  <span className="font-mono text-label uppercase tracking-wider text-text-faint">
                    {r.section}
                  </span>
                </button>
              );
            })}
          </div>

          <p className="mt-5 text-sm leading-relaxed text-text-muted">{req.blurb}</p>

          <div className="mt-7 grid gap-8 lg:grid-cols-2">
            <div className="space-y-4">
              <Field label="Your full name" value={name} onChange={setName} placeholder="Aarav Mehta" />
              <Field
                label="Organisation (the company holding your data)"
                value={org}
                onChange={setOrg}
                placeholder="Acme Pvt Ltd"
              />
              <Field label="Your email" value={email} onChange={setEmail} placeholder="aarav@email.com" />
              <Field
                label="Account / reference number (optional)"
                value={ref}
                onChange={setRef}
                placeholder="e.g. customer ID 48213"
              />
              <label className="block">
                <span className="text-sm text-text-muted">{req.detailsLabel}</span>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder={req.detailsPlaceholder}
                  rows={4}
                  className="mt-1.5 w-full resize-y rounded-lg border border-line bg-bg-2/60 px-3 py-2.5 text-sm text-text outline-none placeholder:text-text-faint focus:border-accent/50"
                />
              </label>
              <Field label="Date" value={date} onChange={setDate} placeholder="1 January 2026" />

              <p className="flex items-start gap-2 rounded-lg border border-line bg-bg-2/40 p-3 text-xs leading-relaxed text-text-faint">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                Built entirely in your browser. Nothing you type here is uploaded or stored by this
                site.
              </p>
            </div>

            <LetterPreview body={body} />
          </div>
        </div>

        <p className="mt-4 flex items-center gap-2 text-sm text-text-faint">
          <Mail className="h-4 w-4" />
          Send the finished letter to the company&apos;s privacy or grievance contact, and keep a copy
          for your records.
        </p>
      </div>
    </section>
  );
}
