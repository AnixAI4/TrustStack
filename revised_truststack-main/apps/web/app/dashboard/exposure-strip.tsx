"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CEILINGS_AT_STAKE_HEADING } from "@truststack/core";
import { apiFetch } from "@/lib/client/api";
import { daysToDeadlineText, finishDateText, formatCrore, type ExposurePayload } from "@/lib/client/exposure";

/**
 * The exposure strip at the top of the overview (Slice 9, §10): the headline
 * of the live exposure model, linking to the Command Centre. It reads
 * `GET …/exposure` and formats it — the ceilings are CEILINGS, labelled so,
 * never a predicted fine. A caller who may not read exposure sees nothing.
 */
export function ExposureStrip({ organizationId }: { organizationId: string }) {
  const [payload, setPayload] = useState<ExposurePayload | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiFetch<ExposurePayload>(`/api/v1/organizations/${organizationId}/exposure`).then((r) => {
      if (!cancelled && r.success) setPayload(r.data);
    });
    return () => {
      cancelled = true;
    };
  }, [organizationId]);

  if (!payload) return null;
  const { headline } = payload;
  const all = payload.intelligence.forecast.all;
  return (
    <section data-testid="overview-exposure" className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-indigo-800">DPDP penalty exposure</h2>
        <Link href="/dashboard/exposure" data-testid="overview-exposure-link" className="text-sm text-indigo-700 hover:underline">
          Open the Exposure Command Centre →
        </Link>
      </div>
      <dl className="mt-2 grid gap-3 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-xs text-slate-600">{CEILINGS_AT_STAKE_HEADING}</dt>
          <dd data-testid="overview-exposure-ceilings" className="text-xl font-semibold">
            {formatCrore(headline.ceilingsAtStakeCrore)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-slate-600">Penalty heads at stake</dt>
          <dd className="text-xl font-semibold">
            {headline.exposedHeads} <span className="text-sm font-normal text-slate-500">of {headline.applicableHeads}</span>
          </dd>
        </div>
        <div>
          <dt className="text-xs text-slate-600">Until most of the DPDP Rules apply</dt>
          <dd data-testid="overview-exposure-days" className="text-xl font-semibold">
            {daysToDeadlineText(headline.daysToDeadline, headline.deadline)}
            <span className="block text-sm font-normal text-slate-500">
              {finishDateText(all, payload.intelligence.forecast.notEnoughHistory)}
            </span>
          </dd>
        </div>
      </dl>
      <p className="mt-2 text-xs text-slate-600">
        {headline.ceilingsLabel} {payload.basis === "provisional" && "Provisional: the assessment is still in progress."}
      </p>
    </section>
  );
}
