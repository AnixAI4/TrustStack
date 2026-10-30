"use client";

import {
  formatRetentionPeriod,
  RETENTION_BASES,
  RETENTION_BASIS_LABEL,
  RETENTION_DEEMED_MONTHS,
  RETENTION_DEEMED_NOTE,
  RETENTION_START_LABEL,
  type RetentionBasis,
} from "@truststack/core";
import { useState } from "react";
import { Notice } from "@/components/feedback/notice";

/**
 * The fields of a schedule, shared by the "add" form and the edit form. The
 * end date is never asked for: the database derives it from the start and the
 * period. The Third-Schedule period is offered only when the organisation has
 * recorded its class (Rule 8(1)); the database refuses it otherwise.
 */
export function ScheduleFields({
  initial,
  thirdSchedule,
  today,
}: {
  initial?: { basis: RetentionBasis; periodMonths: number; lawName: string | null; startsOn: string | null; notes: string | null };
  thirdSchedule: boolean;
  today: string;
}) {
  const [basis, setBasis] = useState<RetentionBasis>(initial?.basis ?? "purpose_served");
  const [months, setMonths] = useState<number>(initial?.periodMonths ?? 12);
  const input = "mt-0.5 rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900";
  const bases = RETENTION_BASES.filter((b) => b !== "deemed_inactivity" || thirdSchedule || initial?.basis === b);
  const deemed = basis === "deemed_inactivity";
  return (
    <>
      <label className="flex flex-col text-xs text-slate-600">
        What ends the retention
        <select name="basis" data-testid="retention-basis" value={basis} onChange={(e) => {
            const next = e.target.value as RetentionBasis;
            // The period input remounts when the deemed period comes or goes (its key), back at its default.
            if ((next === "deemed_inactivity") !== deemed) setMonths(initial?.periodMonths ?? 12);
            setBasis(next);
          }} className={input}>
          {bases.map((b) => (
            <option key={b} value={b}>
              {RETENTION_BASIS_LABEL[b]}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col text-xs text-slate-600">
        Kept for (months)
        <input
          name="periodMonths"
          data-testid="retention-period"
          type="number"
          min={12}
          max={1200}
          required
          key={deemed ? "deemed" : "own"}
          defaultValue={deemed ? RETENTION_DEEMED_MONTHS : (initial?.periodMonths ?? 12)}
          onChange={(e) => setMonths(Number(e.target.value))}
          readOnly={deemed}
          className={`${input} w-28`}
        />
        <span className="mt-0.5 text-[11px] text-slate-500">
          {(() => {
            // Slice 10.5 B3 (F3.9): the period in words; the stored value stays months.
            const shown = deemed ? RETENTION_DEEMED_MONTHS : months;
            return Number.isInteger(shown) && shown >= 1 && shown % 12 === 0 ? <span data-testid="retention-period-words">{formatRetentionPeriod(shown)}. </span> : null;
          })()}
          At least 12 — Rule 8(3){deemed ? "; the Third Schedule sets 36" : ""}.
        </span>
      </label>
      {basis === "legal_requirement" && (
        <label className="flex flex-col text-xs text-slate-600">
          The law that requires it
          <input name="lawName" data-testid="retention-law" required maxLength={200} defaultValue={initial?.lawName ?? ""} className={`${input} w-72`} />
        </label>
      )}
      <label className="flex flex-col text-xs text-slate-600">
        {RETENTION_START_LABEL[basis]}
        <input name="startsOn" data-testid="retention-starts-on" type="date" max={today} defaultValue={initial?.startsOn ?? ""} className={input} />
        <span className="mt-0.5 text-[11px] text-slate-500">
          {deemed ? "Leave empty while it has not happened" : "Leave empty while the data is still being processed"} — then no end is recorded.
        </span>
      </label>
      {deemed && (
        <Notice tone="warning" compact testId="retention-deemed-help" className="w-full">
          {RETENTION_DEEMED_NOTE}
        </Notice>
      )}
      <label className="flex w-full flex-col text-xs text-slate-600">
        Notes
        <textarea name="notes" maxLength={2000} rows={2} defaultValue={initial?.notes ?? ""} className={input} />
      </label>
    </>
  );
}

/** The schedule's fields from a submitted form, as the API takes them. */
export function scheduleBody(form: FormData): Record<string, unknown> {
  const basis = String(form.get("basis"));
  const startsOn = String(form.get("startsOn") ?? "");
  const notes = String(form.get("notes") ?? "").trim();
  return {
    basis,
    periodMonths: Number(form.get("periodMonths")),
    lawName: basis === "legal_requirement" ? String(form.get("lawName") ?? "").trim() || null : null,
    startsOn: startsOn || null,
    notes: notes || null,
  };
}
