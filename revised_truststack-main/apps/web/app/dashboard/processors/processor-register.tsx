"use client";

import { VENDOR_RISK_NOTE } from "@truststack/core";
import Link from "next/link";
import { useEffect, useState } from "react";
import { DataTable } from "@/components/data/data-table";
import { Notice } from "@/components/feedback/notice";
import { apiFetch } from "@/lib/client/api";
import { usePermissions } from "@/lib/client/permissions";
import { ASSESSMENT_STATUS_STYLE, RISK_TIER_STYLE, ROLE_LABEL, TRI_LABEL, type ProcessorRegisterPayload } from "@/lib/client/processors";
import { formatDay } from "@/lib/client/rights";

/**
 * The processor register (Slice 10, Stage 4a): every vendor in the vendor
 * register, whether a valid contract with DPDP clauses is recorded (s.8(2),
 * Rule 6(1)(f)), the documents behind it, and where its assessment stands.
 * Vendors are added in the scope wizard; their contract and assessment are
 * kept here. Only an ACCEPTED assessment counts.
 */
export function ProcessorRegister() {
  const permissions = usePermissions();
  const organizationId = permissions.kind === "ready" ? permissions.value.organizationId : null;
  const [payload, setPayload] = useState<ProcessorRegisterPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!organizationId) return;
    apiFetch<ProcessorRegisterPayload>(`/api/v1/organizations/${organizationId}/processors`).then((r) => {
      if (r.success) setPayload(r.data);
      else setError(r.error.message);
    });
  }, [organizationId]);

  if (permissions.kind === "loading") return <p className="text-sm text-slate-500">Loading…</p>;
  if (error) {
    return (
      <Notice tone="error" testId="processors-error">
        {error}
      </Notice>
    );
  }
  if (!payload) return <p className="text-sm text-slate-500">Loading the register…</p>;
  const { counts } = payload;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-slate-600">
          Every vendor that processes personal data on the organisation&apos;s behalf. A Data Processor may be engaged only
          under a valid contract (section 8(2)), and that contract is where reasonable security safeguards are provided for
          (Rule 6(1)(f)). Vendors are added in the scope wizard; their contract, documents and assessments are kept here.
        </p>
      </div>

      <section data-testid="processors-summary" className="rounded-xl border border-slate-200 p-4">
        <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-6">
          <Stat label="Processors" value={counts.processors} testId="processors-count-processors" />
          <Stat label="No contract with DPDP clauses recorded" value={counts.contractGaps} testId="processors-count-contract-gaps" alert={counts.contractGaps > 0} />
          <Stat label="No accepted assessment" value={counts.neverAssessed} testId="processors-count-never-assessed" />
          <Stat label="Awaiting review" value={counts.awaitingReview} testId="processors-count-awaiting-review" />
          <Stat label="With the vendor" value={counts.withVendor} testId="processors-count-with-vendor" />
          <Stat label="Assessment out of date" value={counts.outOfDate} testId="processors-count-out-of-date" alert={counts.outOfDate > 0} />
        </dl>
        <p className="mt-3 text-xs text-slate-500">
          {VENDOR_RISK_NOTE} Anyone not recorded as an independent fiduciary is counted as a processor — &ldquo;not known&rdquo;
          counts.
        </p>
      </section>

      {payload.vendors.length === 0 ? (
        <p data-testid="processors-empty" className="rounded-xl border border-dashed border-slate-300 p-6 text-sm text-slate-700">
          No vendor is recorded. Add the organisation&apos;s vendors in the{" "}
          <Link href="/dashboard/scope" className="font-medium text-indigo-800 hover:underline">
            scope wizard
          </Link>
          ; each one that processes personal data on its behalf then appears here, to record its contract and assess it.
        </p>
      ) : (
        <DataTable
          testId="processors-list"
          rows={payload.vendors}
          rowKey={(v) => v.id}
          rowTestId={(v) => `processor-${v.id}`}
          noun="vendors"
          search={{ label: "Search vendors", placeholder: "Search by vendor or service", text: (v) => `${v.name} ${v.service ?? ""}` }}
          columns={[
            {
              key: "vendor",
              header: "Vendor",
              sortValue: (v) => v.name,
              cell: (v) => (
                <>
                  <Link href={`/dashboard/processors/${v.id}`} className="font-medium text-indigo-800 hover:underline">
                    {v.name}
                  </Link>
                  <p className="text-xs text-slate-600">
                    {ROLE_LABEL[v.vendorRole]}
                    {v.service ? ` · ${v.service}` : ""}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1 text-xs">
                    {v.contractGap && (
                      <span data-testid={`processor-contract-gap-${v.id}`} className="rounded-full bg-red-50 px-2 py-0.5 font-medium text-red-800">
                        No contract with DPDP clauses recorded
                      </span>
                    )}
                    {v.current?.outOfDate && (
                      <span data-testid={`processor-out-of-date-${v.id}`} className="rounded-full bg-amber-50 px-2 py-0.5 font-medium text-amber-800">
                        Assessment out of date
                      </span>
                    )}
                    {v.open && (
                      <span className={`rounded-full px-2 py-0.5 font-medium ${ASSESSMENT_STATUS_STYLE[v.open.status]}`}>
                        v{v.open.version} {v.open.statusLabel.toLowerCase()}
                      </span>
                    )}
                    {v.open?.withVendor && (
                      <span data-testid={`processor-with-vendor-${v.id}`} className="rounded-full bg-sky-50 px-2 py-0.5 font-medium text-sky-800">
                        With the vendor
                      </span>
                    )}
                  </div>
                </>
              ),
            },
            {
              key: "contract",
              header: "Contract · DPDP clauses",
              className: "text-xs",
              cell: (v) => (
                <>
                  {TRI_LABEL[v.contractExists]} · {TRI_LABEL[v.dpdpClauses]}
                </>
              ),
            },
            { key: "documents", header: "Documents", className: "text-xs", sortValue: (v) => v.documents.length, cell: (v) => v.documents.length },
            {
              key: "accepted",
              header: "Accepted assessment",
              className: "text-xs",
              sortValue: (v) => v.current?.riskScore ?? null,
              cellTestId: (v) => `processor-current-${v.id}`,
              cell: (v) =>
                v.current ? (
                  <>
                    v{v.current.version} · risk{" "}
                    <span className={v.current.riskTier ? RISK_TIER_STYLE[v.current.riskTier] : ""}>
                      {v.current.riskScore} ({v.current.riskTierLabel})
                    </span>
                  </>
                ) : (
                  "None"
                ),
            },
            {
              key: "review",
              header: "Review by",
              className: "text-xs whitespace-nowrap",
              sortValue: (v) => v.current?.reviewBy ?? null,
              cell: (v) => (v.current?.reviewBy ? formatDay(v.current.reviewBy) : "—"),
            },
          ]}
        />
      )}
    </div>
  );
}

function Stat({ label, value, testId, alert }: { label: string; value: number; testId: string; alert?: boolean }) {
  return (
    <div>
      <dt className="text-xs text-slate-600">{label}</dt>
      <dd data-testid={testId} className={`text-lg font-semibold ${alert ? "text-red-800" : ""}`}>
        {value}
      </dd>
    </div>
  );
}
