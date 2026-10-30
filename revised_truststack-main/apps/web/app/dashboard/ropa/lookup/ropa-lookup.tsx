"use client";

import { foldPeopleTypes, ROPA_RISK_LABEL } from "@truststack/core";
import Link from "next/link";
import { useEffect, useState } from "react";
import { DataTable } from "@/components/data/data-table";
import { Notice } from "@/components/feedback/notice";
import { apiFetch } from "@/lib/client/api";
import { usePermissions } from "@/lib/client/permissions";
import { RISK_STYLE, ROPA_POSITIONING, type RopaLookupPayload } from "@/lib/client/ropa";

type Mode = "principal" | "system" | "vendor";

/**
 * Two questions the register answers in seconds (D-066):
 *
 * - **What do we hold about…** a kind of person — the summary of personal
 *   data and processing activities, and who it is shared with, that a Data
 *   Principal may ask for under s.11(1). Read from the records' own words.
 * - **What does this system or processor touch** — the first question when
 *   something goes wrong (Rule 7 asks for the nature and extent of a breach).
 *
 * Read-only. Nothing here is computed beyond matching: linked records come
 * from the register's links, "named" ones from the record's own text.
 */
export function RopaLookup() {
  const permissions = usePermissions();
  const organizationId = permissions.kind === "ready" ? permissions.value.organizationId : null;
  const [mode, setMode] = useState<Mode>("principal");
  const [choice, setChoice] = useState("");
  const [options, setOptions] = useState<RopaLookupPayload | null>(null);
  const [result, setResult] = useState<RopaLookupPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  const base = organizationId ? `/api/v1/organizations/${organizationId}/ropa/lookup` : null;

  useEffect(() => {
    if (!base) return;
    apiFetch<RopaLookupPayload>(base).then((r) => (r.success ? setOptions(r.data) : setError(r.error.message)));
  }, [base]);

  async function ask(value: string) {
    setChoice(value);
    setResult(null);
    if (!base || !value) return;
    const key = mode === "principal" ? "principal" : mode === "system" ? "systemId" : "vendorId";
    const r = await apiFetch<RopaLookupPayload>(`${base}?${key}=${encodeURIComponent(value)}`);
    if (r.success) setResult(r.data);
    else setError(r.error.message);
  }

  if (permissions.kind === "loading") return <p className="text-sm text-slate-500">Loading…</p>;
  if (error) return <Notice tone="error" testId="ropa-lookup-error">{error}</Notice>;
  if (!options) return <p className="text-sm text-slate-500">Loading the register…</p>;

  const choices =
    mode === "principal"
      ? // F3.12: one kind of person once — "Applicant" and "Applicants" are one choice; the look-up matches either.
        foldPeopleTypes(options.principals).map((p) => ({ value: p, label: p }))
      : (mode === "system" ? options.systems : options.vendors).map((x) => ({ value: x.id, label: x.name }));
  const records = result?.records ?? [];
  const categories = [...new Set(records.flatMap((r) => (r.dataCategories ?? "").split(/[,;]/).map((c) => c.trim()).filter(Boolean)))];
  const recipients = [
    ...new Set(records.flatMap((r) => [...r.processors, ...(r.vendorsText ?? "").split(/[,;]/), ...(r.sharing ?? "").split(/[,;]/)].map((x) => x.trim()).filter((x) => x && !/^none$/i.test(x)))),
  ];

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/ropa" className="text-xs text-indigo-700 hover:underline">
          ← Back to the register
        </Link>
        <h2 className="mt-1 text-lg font-semibold">Ask the register</h2>
        <p data-testid="ropa-lookup-purpose" className="text-sm text-slate-600">
          Two questions the register answers in seconds: what personal data you hold about a kind of person — the summary a
          person may ask for (section 11(1)) — and what a system or a processor touches, the first question when something
          goes wrong.
        </p>
        <p className="mt-1 text-xs text-slate-500">{ROPA_POSITIONING}</p>
      </div>

      <div role="tablist" className="flex gap-2 border-b border-slate-200 text-sm">
        {(
          [
            ["principal", "What do we hold about…"],
            ["system", "What does a system touch"],
            ["vendor", "What does a processor touch"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={mode === key}
            data-testid={`ropa-lookup-mode-${key}`}
            onClick={() => {
              setMode(key);
              setChoice("");
              setResult(null);
            }}
            className={mode === key ? "border-b-2 border-indigo-700 px-3 py-2 font-medium text-indigo-800" : "px-3 py-2 text-slate-600 hover:text-slate-900"}
          >
            {label}
          </button>
        ))}
      </div>

      <label className="block max-w-md text-xs text-slate-700">
        {mode === "principal" ? "Whose data" : mode === "system" ? "System" : "Data Processor or vendor"}
        <select
          data-testid="ropa-lookup-choice"
          value={choice}
          onChange={(e) => void ask(e.target.value)}
          className="mt-0.5 block w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
        >
          <option value="">— Choose —</option>
          {choices.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        {choices.length === 0 && <span className="mt-1 block text-slate-500">Nothing to choose yet — the register is empty or has no links.</span>}
      </label>

      {result && (
        <section data-testid="ropa-lookup-result" className="space-y-4">
          {mode === "principal" ? (
            <div className="rounded-xl border border-slate-200 p-4 text-sm">
              <h3 className="font-semibold">About {result.subject}: a summary for an access request (s.11)</h3>
              <p className="mt-1 text-xs text-slate-600">
                Draft from the register's own words — check it before it is sent. It does not cover processing
                that is missing from the register.
              </p>
              <p data-testid="ropa-lookup-summary" className="mt-2">
                {records.length === 0
                  ? "The register names no processing activity for this kind of person."
                  : `${records.length} processing ${records.length === 1 ? "activity uses" : "activities use"} their personal data.`}
              </p>
              {categories.length > 0 && (
                <p className="mt-1"><span className="font-medium">Personal data held:</span> {categories.join(", ")}.</p>
              )}
              {recipients.length > 0 && (
                <p className="mt-1"><span className="font-medium">Shared with or processed by:</span> {recipients.join(", ")}.</p>
              )}
            </div>
          ) : (
            <p data-testid="ropa-lookup-summary" className="rounded-xl border border-slate-200 p-4 text-sm">
              {records.length === 0
                ? `No processing activity in the register uses ${result.subject}.`
                : `${result.subject} is used by ${records.length} processing ${records.length === 1 ? "activity" : "activities"} — affecting ${[...new Set(records.flatMap((r) => (r.dataPrincipalTypes ?? "").split(/[,;]/).map((x) => x.trim()).filter(Boolean)))].join(", ") || "people the records do not name"}.`}
            </p>
          )}

          {/* Slice 10.5 B3 (N7): paged and searchable — a system can touch most of a large register. */}
          <DataTable
            testId="ropa-lookup-records"
            rows={records}
            rowKey={(r) => r.id}
            rowTestId={(r) => `ropa-lookup-${r.recordCode}`}
            noun="processing activities"
            search={{
              label: "Search these processing activities",
              placeholder: "Search by name, ID, purpose or data",
              text: (r) => `${r.name} ${r.recordCode} ${r.purpose ?? ""} ${r.dataCategories ?? ""} ${r.dataPrincipalTypes ?? ""}`,
            }}
            columns={[
              {
                key: "activity",
                header: "Processing activity",
                sortValue: (r) => r.name,
                cell: (r) => (
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/dashboard/ropa/${r.id}`} className="font-medium text-indigo-800 hover:underline">
                      {r.name}
                    </Link>
                    <span className="text-xs text-slate-500">{r.recordCode}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs ${RISK_STYLE[r.riskRating]}`}>{ROPA_RISK_LABEL[r.riskRating]}</span>
                    {r.match === "named" && mode !== "principal" && (
                      <span className="text-xs text-amber-800">named in the record's text, not linked</span>
                    )}
                  </div>
                ),
              },
              {
                key: "details",
                header: "What the record says",
                cell: (r) => (
                  <dl className="grid gap-x-4 text-xs text-slate-700 sm:grid-cols-2">
                    <div><dt className="inline font-medium">Whose data: </dt><dd className="inline">{r.dataPrincipalTypes ?? "—"}</dd></div>
                    <div><dt className="inline font-medium">Data: </dt><dd className="inline">{r.dataCategories ?? "—"}</dd></div>
                    <div><dt className="inline font-medium">Purpose: </dt><dd className="inline">{r.purpose ?? "—"}</dd></div>
                    <div><dt className="inline font-medium">Ground: </dt><dd className="inline">{r.lawfulBasisLabel ?? "Not decided"}</dd></div>
                    <div><dt className="inline font-medium">Kept: </dt><dd className="inline">{r.retentionRule ?? "—"}</dd></div>
                    <div><dt className="inline font-medium">Shared with: </dt><dd className="inline">{r.sharing ?? "—"}</dd></div>
                  </dl>
                ),
              },
            ]}
          />
        </section>
      )}
    </div>
  );
}
