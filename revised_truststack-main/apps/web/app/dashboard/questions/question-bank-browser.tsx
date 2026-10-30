"use client";

import { useEffect, useState } from "react";
import { DataTable } from "@/components/data/data-table";
import { Notice } from "@/components/feedback/notice";
import { apiFetch } from "@/lib/client/api";

/**
 * Read-only bank browser — Anix staff only (`question.read_bank`, D-068; the
 * database refuses the bank to anyone else, D-071). Shows what the bank
 * actually holds, including packs that are not approved for generation and
 * the reference pool — a missing priority or legal basis shows as "—" rather
 * than being filled in (§13.2).
 */

interface Domain {
  code: string;
  domainId: string;
  name: string;
  weight: number;
  sortOrder: number;
}

interface Pack {
  code: string;
  tier: string;
  industryCode: string | null;
  name: string;
  version: string;
  status: string;
  questionCount: number;
}

interface Question {
  questionCode: string;
  questionText: string;
  domainCode: string;
  secondaryDomainCodes: string[];
  applicability: string;
  triggerText: string | null;
  priority: string | null;
  criticality: string | null;
  evidenceGuidance: string | null;
  suggestedOwner: string | null;
  legalControlBasis: string | null;
  version: string;
  status: string;
}

const TIER_LABEL: Record<string, string> = {
  core: "Core — every assessment",
  overlay: "Industry overlay",
  conditional: "Conditional — loaded by a trigger",
  reference: "Reference only — never generated",
};

/** A pack's or a question's status in words (F2.7) — never `draft` / `approved`. */
const STATUS_LABEL: Record<string, string> = { draft: "Draft", approved: "Approved", retired: "Retired" };
const statusLabel = (status: string) => STATUS_LABEL[status] ?? status;

/** "1 question", "201 questions" — a unit on every count. */
const questionsCount = (n: number) => `${n} question${n === 1 ? "" : "s"}`;

const APPLICABILITY_LABEL: Record<string, string> = {
  mandatory: "Mandatory",
  conditional: "Conditional",
  potentially_applicable: "Potentially Applicable",
};

export function QuestionBankBrowser() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [weightTotal, setWeightTotal] = useState<number | null>(null);
  const [packs, setPacks] = useState<Pack[] | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<{ domains: Domain[]; weightTotal: number }>("/api/v1/dpdp-domains").then((r) => {
      if (r.success) {
        setDomains(r.data.domains);
        setWeightTotal(r.data.weightTotal);
      } else setError(r.error.message);
    });
    apiFetch<{ packs: Pack[] }>("/api/v1/question-packs").then((r) => {
      if (r.success) setPacks(r.data.packs);
      else setError(r.error.message);
    });
  }, []);

  useEffect(() => {
    if (!selected) return;
    setQuestions(null);
    apiFetch<{ questions: Question[] }>(`/api/v1/question-packs/${selected}/questions`).then((r) => {
      if (r.success) setQuestions(r.data.questions);
      else setError(r.error.message);
    });
  }, [selected]);

  if (error) {
    return (
      <Notice tone="error" testId="questions-error">
        {error}
      </Notice>
    );
  }

  return (
    <div className="space-y-8">
      <p data-testid="bank-purpose" className="text-sm text-slate-600">
        The question bank every assessment is generated from — for Anix consultants only; clients never see it. Read it
        here: the domains and their weights, the packs and their questions. Only an approved pack is used when an
        assessment is generated, and an assessment keeps the questions it was generated with.
      </p>
      <section>
        <h2 className="text-lg font-semibold">The 16-domain model</h2>
        <p className="text-sm text-slate-600">
          Every question scores into exactly one domain. Weights total{" "}
          <strong data-testid="weight-total">{weightTotal === null ? "…" : weightTotal}</strong> of 100, whatever
          overlay or conditional questions a domain gains.
        </p>
        <ul data-testid="domain-list" className="mt-3 grid gap-2 sm:grid-cols-2">
          {domains.map((d) => (
            <li key={d.code} className="flex items-baseline justify-between rounded-lg border border-slate-200 px-3 py-2">
              <span className="text-sm">
                <span className="font-mono text-xs text-slate-500">{d.domainId}</span> {d.name}
              </span>
              <span className="ml-3 shrink-0 text-sm font-semibold">weight {d.weight}</span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Question packs</h2>
        {packs === null ? (
          <p className="text-sm text-slate-500">Loading packs…</p>
        ) : (
          <ul data-testid="pack-list" className="mt-3 space-y-2">
            {packs.map((p) => (
              <li key={p.code} className="rounded-lg border border-slate-200 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <button
                      type="button"
                      data-testid={`pack-${p.code}`}
                      onClick={() => setSelected(selected === p.code ? null : p.code)}
                      className="text-left text-sm font-semibold text-indigo-700 hover:underline"
                    >
                      {p.name}
                    </button>
                    <p className="font-mono text-xs text-slate-500">{p.code} · v{p.version}</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-700">{TIER_LABEL[p.tier] ?? p.tier}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 ${
                        p.status === "approved" ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-900"
                      }`}
                    >
                      {statusLabel(p.status)}
                    </span>
                    <span data-testid={`pack-count-${p.code}`} className="font-semibold">
                      {questionsCount(p.questionCount)}
                    </span>
                  </div>
                </div>

                {selected === p.code && (
                  <div className="mt-3 border-t border-slate-100 pt-3">
                    {questions === null ? (
                      <p className="text-sm text-slate-500">Loading questions…</p>
                    ) : questions.length === 0 ? (
                      <p data-testid="pack-empty" className="text-sm text-slate-500">
                        No questions authored for this pack yet.
                      </p>
                    ) : (
                      <QuestionsByDomain domains={domains} questions={questions} />
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function QuestionsByDomain({ domains, questions }: { domains: Domain[]; questions: Question[] }) {
  const order = new Map(domains.map((d) => [d.code, d]));
  // The pack's questions, grouped by the domain model's order, then paged (25 a page).
  const rows = [...questions].sort((a, b) => (order.get(a.domainCode)?.sortOrder ?? 99) - (order.get(b.domainCode)?.sortOrder ?? 99));
  const domainCount = new Set(questions.map((q) => q.domainCode)).size;

  return (
    <div data-testid="pack-questions" className="space-y-2">
      <p className="text-xs text-slate-600">
        {questionsCount(questions.length)} across {domainCount} domain{domainCount === 1 ? "" : "s"}, in the domain model&apos;s order.
      </p>
      <DataTable
        testId="pack-question-table"
        rows={rows}
        rowKey={(q) => q.questionCode}
        rowTestId={(q) => `question-${q.questionCode}`}
        noun="questions"
        search={{
          label: "Search this pack",
          placeholder: "Search by code, words or domain",
          text: (q) => `${q.questionCode} ${q.questionText} ${order.get(q.domainCode)?.name ?? q.domainCode} ${q.suggestedOwner ?? ""}`,
        }}
        columns={[
          {
            key: "question",
            header: "Question",
            sortValue: (q) => q.questionCode,
            cell: (q) => (
              <>
                <p>
                  <span className="font-mono text-xs text-slate-500">{q.questionCode}</span> {q.questionText}
                </p>
                <p className="mt-1 flex flex-wrap gap-x-3 text-xs text-slate-600">
                  <span>
                    v{q.version} · {statusLabel(q.status)}
                  </span>
                  <span>{APPLICABILITY_LABEL[q.applicability] ?? q.applicability}</span>
                  <span>Priority {q.priority ?? "—"}</span>
                  {q.criticality && <span>Criticality {q.criticality}</span>}
                  {q.secondaryDomainCodes.length > 0 && <span>Also tagged {q.secondaryDomainCodes.join(", ")} (does not score there)</span>}
                </p>
                {q.triggerText && <p className="mt-1 text-xs text-slate-600">When: {q.triggerText}</p>}
                {q.evidenceGuidance && <p className="mt-1 text-xs text-slate-600">Evidence: {q.evidenceGuidance}</p>}
                <p className="mt-1 text-xs text-slate-500">
                  Owner: {q.suggestedOwner ?? "—"} · Legal basis: {q.legalControlBasis ?? "— (pending counsel review)"}
                </p>
              </>
            ),
          },
          {
            key: "domain",
            header: "Domain",
            className: "text-xs w-56",
            sortValue: (q) => order.get(q.domainCode)?.sortOrder ?? 99,
            cell: (q) => (
              <>
                <span className="font-medium text-slate-800">{order.get(q.domainCode)?.name ?? q.domainCode}</span>
                <span className="block text-slate-500">weight {order.get(q.domainCode)?.weight ?? "—"}</span>
              </>
            ),
          },
        ]}
      />
    </div>
  );
}
