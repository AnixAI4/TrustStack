"use client";

import { useMemo, useState } from "react";
import { FileText, Eye } from "lucide-react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { useReadingMode } from "@/components/site/ReadingMode";
import { cn } from "@/lib/cn";

const DATA_TYPES = [
  "Name",
  "Email",
  "Phone",
  "Postal address",
  "Financial info",
  "Health data",
  "Location data",
  "Device & cookies",
  "Children's data",
];

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

function Checks({
  selected,
  onToggle,
}: {
  selected: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {DATA_TYPES.map((d) => {
        const on = selected.includes(d);
        return (
          <button
            key={d}
            type="button"
            onClick={() => onToggle(d)}
            aria-pressed={on}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-pill border px-3 py-1.5 text-xs transition-all",
              on
                ? "border-accent/50 bg-accent/10 text-text"
                : "border-line text-text-muted hover:border-accent/30"
            )}
          >
            {on && <span className="text-accent">✓</span>}
            {d}
          </button>
        );
      })}
    </div>
  );
}

function Preview({ title, body }: { title: string; body: string }) {
  return (
    <div className="lg:sticky lg:top-24 lg:self-start">
      <div className="mb-3 inline-flex items-center gap-1.5 rounded-pill border border-line bg-glass px-3 py-1.5 text-xs font-medium text-text-muted">
        <Eye className="h-3.5 w-3.5 text-accent" />
        On-screen preview · view only
      </div>
      <div
        className="max-h-[560px] overflow-auto rounded-xl border border-line bg-bg-2/60 p-6 select-none"
        style={{ WebkitUserSelect: "none", userSelect: "none" }}
        onContextMenu={(e) => e.preventDefault()}
        onCopy={(e) => e.preventDefault()}
        onCut={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
      >
        <h3 className="font-serif text-xl font-semibold text-text">{title}</h3>
        <div className="mt-4 space-y-3 font-serif text-sm leading-relaxed text-text-muted">
          {body.split("\n").map((l, i) =>
            l.trim() ? <p key={i}>{l}</p> : <div key={i} className="h-1" />
          )}
        </div>
      </div>
      <p className="mt-3 text-xs text-text-faint">
        Preview only - download, print and copy are disabled for Document Studio
        drafts.
      </p>
    </div>
  );
}

function PrivacyNotice() {
  const { easy } = useReadingMode();
  const [org, setOrg] = useState("");
  const [role, setRole] = useState("Data Fiduciary");
  const [email, setEmail] = useState("");
  const [dpo, setDpo] = useState("");
  const [types, setTypes] = useState<string[]>(["Name", "Email"]);
  const [purpose, setPurpose] = useState("");
  const [retention, setRetention] = useState("");

  const name = org || "[Organisation]";
  const easyRole =
    role === "Significant Data Fiduciary"
      ? "large, high-risk organisation with extra duties"
      : "organisation responsible for the data";
  const body = useMemo(
    () => easy
      ? `${name} (the "${easyRole}") must protect your personal data under the Digital Personal Data Protection Act, 2023 and the DPDP Rules, 2025.
\nData we collect: ${types.join(", ") || "[types of data]"}.
\nWhy we collect it: ${purpose || "[stated reasons]"}. We use your data only for these reasons, with your permission or for a use the law allows without permission.
\nHow long we keep it: ${retention || "We keep personal data only as long as needed for the stated reason. We then delete it."}
\nYour rights: You may ask to see, correct, update or delete your personal data. You may name another person to use your rights and may make a complaint. Taking back permission must be as easy as giving it.
\nContact: For a privacy request, contact ${email || "[contact email]"}${dpo ? `, for the attention of ${dpo} (Data Protection Officer)` : ""}.`
      : `${name} (the "${role}") is committed to protecting your personal data under the Digital Personal Data Protection Act, 2023 and the DPDP Rules, 2025.
\nData we collect: ${types.join(", ") || "[data categories]"}.
\nWhy we collect it: ${purpose || "[stated purposes]"}. We process your data only for these purposes, on the lawful basis of your consent or a permitted legitimate use.
\nRetention: ${retention || "We retain personal data only as long as necessary for the stated purpose, after which it is erased."}
\nYour rights: You may access, correct, update or erase your personal data, nominate another person to exercise your rights, and raise a grievance. Consent may be withdrawn as easily as it was given.
\nContact: For any privacy request, contact ${email || "[contact email]"}${dpo ? `, attention ${dpo} (Data Protection Officer)` : ""}.`,
  [name, role, easyRole, types, purpose, retention, email, dpo, easy]
  );

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-4">
        <Field label="Organisation name" value={org} onChange={setOrg} placeholder="Acme Pvt Ltd" />
        <label className="block">
          <span className="text-sm text-text-muted">Role</span>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-line bg-bg-2/60 px-3 py-2.5 text-sm text-text outline-none focus:border-accent/50"
          >
            <option value="Data Fiduciary" className="bg-bg-2">Data Fiduciary</option>
            <option value="Significant Data Fiduciary" className="bg-bg-2">Significant Data Fiduciary</option>
          </select>
        </label>
        <Field label="Contact email" value={email} onChange={setEmail} placeholder="privacy@acme.in" />
        <Field label="DPO name (optional)" value={dpo} onChange={setDpo} />
        <div>
          <span className="text-sm text-text-muted">Data we collect</span>
          <div className="mt-2">
            <Checks
              selected={types}
              onToggle={(v) =>
                setTypes((p) => (p.includes(v) ? p.filter((x) => x !== v) : [...p, v]))
              }
            />
          </div>
        </div>
        <Field label="Purposes" value={purpose} onChange={setPurpose} placeholder="To provide and improve our services" />
        <Field label="Retention" value={retention} onChange={setRetention} placeholder="24 months after account closure" />
      </div>
      <Preview title="Privacy Notice" body={body} />
    </div>
  );
}

function ConsentForm() {
  const { easy } = useReadingMode();
  const [org, setOrg] = useState("");
  const [purpose, setPurpose] = useState("");
  const [email, setEmail] = useState("");
  const [types, setTypes] = useState<string[]>(["Name", "Email"]);
  const [withdrawal, setWithdrawal] = useState("");

  const name = org || "[Organisation]";
  const body = useMemo(
    () => easy
      ? `I give ${name} permission to collect and use my personal data - ${types.join(", ") || "[types of data]"} - for this reason: ${purpose || "[reason]"}.
\nI give this permission freely and for this specific reason after receiving clear information. My choice is unconditional and clear, shown by an action saying yes. The permission covers only the reason stated above (Section 6, DPDP Act 2023).
\nTaking back permission: I may take back this permission at any time, as easily as I gave it, by ${withdrawal || "contacting the organisation"}. The organisation must then stop using my data and delete it unless another law requires the data to be kept.
\nContact: ${email || "[contact email]"}.
\nSignature: ____________________   Date: ____________`
      : `I consent to ${name} collecting and processing my personal data - ${types.join(", ") || "[data categories]"} - for the following purpose: ${purpose || "[purpose]"}.
\nThis consent is free, specific, informed, unconditional and unambiguous, given by clear affirmative action, and is limited to the purpose stated above (Section 6, DPDP Act 2023).
\nWithdrawing consent: I understand I can withdraw this consent at any time, as easily as I gave it, by ${withdrawal || "contacting the organisation"}. On withdrawal, processing stops and my data is erased unless retention is required by law.
\nContact: ${email || "[contact email]"}.
\nSignature: ____________________   Date: ____________`,
  [name, types, purpose, withdrawal, email, easy]
  );

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-4">
        <Field label="Organisation name" value={org} onChange={setOrg} placeholder="Acme Pvt Ltd" />
        <Field label="Purpose" value={purpose} onChange={setPurpose} placeholder="Marketing communications" />
        <Field label="Contact email" value={email} onChange={setEmail} placeholder="privacy@acme.in" />
        <Field label="Withdrawal method" value={withdrawal} onChange={setWithdrawal} placeholder="emailing privacy@acme.in" />
        <div>
          <span className="text-sm text-text-muted">Data to collect</span>
          <div className="mt-2">
            <Checks
              selected={types}
              onToggle={(v) =>
                setTypes((p) => (p.includes(v) ? p.filter((x) => x !== v) : [...p, v]))
              }
            />
          </div>
        </div>
      </div>
      <Preview title="Consent Form" body={body} />
    </div>
  );
}

const TABS = [
  { label: "Privacy Notice", sub: "Section 5", Comp: PrivacyNotice },
  { label: "Consent Form", sub: "Section 6", Comp: ConsentForm },
];

export function Generators({ id }: { id?: string }) {
  const [tab, setTab] = useState(0);
  const Active = TABS[tab].Comp;
  return (
    <section id={id} className="section scroll-mt-24">
      <div className="container-x">
        <SectionHeader
          eyebrow="Document Studio · build-ready drafts"
          title="Generate DPDP documents in minutes"
          lede="Answer a few prompts and watch a DPDP-aligned document assemble live on screen. Preview only - download, print and copy are disabled. Assembled entirely on your device, nothing uploaded."
        />
        <div className="mt-10 rounded-xl border border-line bg-surface-2/40 p-6 sm:p-8">
          <div className="flex flex-wrap gap-2">
            {TABS.map((t, i) => (
              <button
                key={t.label}
                type="button"
                onClick={() => setTab(i)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-pill border px-4 py-2 text-sm font-medium transition-all",
                  i === tab
                    ? "border-accent/50 bg-accent/10 text-text"
                    : "border-line text-text-muted hover:border-accent/30 hover:text-text"
                )}
              >
                <FileText className="h-4 w-4" />
                {t.label}
                <span className="font-mono text-label uppercase tracking-wider text-text-faint">
                  {t.sub}
                </span>
              </button>
            ))}
          </div>
          <div className="mt-8">
            <Active />
          </div>
        </div>
      </div>
    </section>
  );
}
