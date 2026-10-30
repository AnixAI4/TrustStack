"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AVAILABLE_REPORT_KINDS,
  DPDP_REPORT_CAVEAT,
  REPORT_KIND_DEFINITIONS,
  type ReportKind,
  type ReportKindDefinition,
} from "@truststack/core";
import { DraftButton } from "@/components/ai/draft-panel";
import { DataTable } from "@/components/data/data-table";
import { Notice } from "@/components/feedback/notice";
import { useToast } from "@/components/feedback/toast";
import { Tabs } from "@/components/ui/tabs";
import { apiFetch } from "@/lib/client/api";
import { formatDate } from "@/lib/client/exposure";
import { Can, usePermissions } from "@/lib/client/permissions";
import { formatBytes, formatWhen, type GeneratedReport, type ReportItem, type ReportMember } from "@/lib/client/reports";

/**
 * Reports (Slice 9, Stages 3–4): generate a stored, versioned report or
 * working file and download it. A report never changes — generating again
 * adds a version — and a download is a one-minute signed link, logged every
 * time. An owner may generate and download their OWN Owner Action Pack
 * (decision 9). The page computes nothing: every report is built and
 * rendered on the server.
 *
 * Three tabs (Slice 10.5 B4, F4.8): PDF reports · Working files · Stored, each
 * generating tab led by "Which report do I need?" — one line per audience.
 * Generating a report opens the Stored tab, where it is.
 *
 * Slice 11 Stage 2b (D-133.1): a finished Exposure Brief, Programme Status Report or
 * evidence pack may carry a narrative. "Draft a narrative" asks the assistant to read
 * THAT version's stored figures; once a person accepts it, "Print the narrated
 * version" makes a NEW version — the same figures with the narrative in front. Never
 * automatic, and the version it was drafted from is never touched.
 */
export function ReportsCentre() {
  const toast = useToast();
  const permissions = usePermissions();
  const organizationId = permissions.kind === "ready" ? permissions.value.organizationId : null;
  const held = permissions.kind === "ready" ? permissions.value.permissions : [];
  const canGenerate = held.includes("report.generate");
  const canDownload = held.includes("report.download");
  const [reports, setReports] = useState<ReportItem[] | null>(null);
  const [me, setMe] = useState<string | null>(null);
  const [members, setMembers] = useState<ReportMember[]>([]);
  const [owner, setOwner] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [tab, setTab] = useState<string>("pdf");

  const load = useCallback(async () => {
    if (!organizationId) return;
    const res = await apiFetch<{ reports: ReportItem[] }>(`/api/v1/organizations/${organizationId}/reports`);
    if (res.success) setReports(res.data.reports);
    else setError(res.error.message);
  }, [organizationId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    apiFetch<{ user: { id: string } }>("/api/v1/auth/me").then((r) => {
      if (r.success) setMe(r.data.user.id);
    });
  }, []);

  // Whose pack to generate: the members list, for those who may generate anyone's.
  useEffect(() => {
    if (!organizationId || !canGenerate || !held.includes("organization.users.read")) return;
    apiFetch<{ members: ReportMember[] }>(`/api/v1/organizations/${organizationId}/users`).then((r) => {
      if (r.success) setMembers(r.data.members.filter((m) => m.status === "active"));
    });
    // `held` is a fresh array each render; the permission set itself is stable per page.
  }, [organizationId, canGenerate]);

  async function generate(kind: ReportKind, options: { fromReportId?: string; ownerUserId?: string } = {}) {
    if (!organizationId) return;
    setBusy(options.fromReportId ?? kind);
    setNotice(null);
    setError(null);
    const res = options.fromReportId
      ? await apiFetch<GeneratedReport>(`/api/v1/organizations/${organizationId}/reports/${options.fromReportId}/regenerate`, {
          method: "POST",
        })
      : await apiFetch<GeneratedReport>(`/api/v1/organizations/${organizationId}/reports`, {
          method: "POST",
          body: JSON.stringify(options.ownerUserId ? { kind, ownerUserId: options.ownerUserId } : { kind }),
        });
    setBusy(null);
    if (res.success) {
      const r = res.data.report;
      const also = res.data.companion ? ` ${res.data.companion.kindLabel} version ${res.data.companion.version} was generated with it.` : "";
      setNotice(`${r.kindLabel} version ${r.version} is ready (${(res.data.generation.totalMs / 1000).toFixed(1)} s).${also}`);
      toast.success(`${r.kindLabel} is ready`, `Version ${r.version} — it is in the Stored tab.`);
      setTab("stored");
      if (typeof window !== "undefined") window.history.replaceState(null, "", "#stored");
    } else {
      setError(res.error.message);
    }
    await load();
  }

  const ownPack = (r: ReportItem) => r.kind === "owner_action_pack" && me !== null && r.subjectUserId === me;

  async function printNarrated(report: ReportItem) {
    if (!organizationId || !report.pendingNarrativeDraftId) return;
    setBusy(`narrate-${report.id}`);
    setNotice(null);
    setError(null);
    const res = await apiFetch<{ report: ReportItem; narratedFrom: { version: number }; generation: { totalMs: number } }>(
      `/api/v1/organizations/${organizationId}/reports/${report.id}/narrate`,
      { method: "POST", body: JSON.stringify({ draftId: report.pendingNarrativeDraftId }) },
    );
    setBusy(null);
    if (res.success) {
      const r = res.data.report;
      setNotice(`${r.kindLabel} version ${r.version} is ready: version ${res.data.narratedFrom.version}'s figures with the narrative in front.`);
      toast.success(`${r.kindLabel} version ${r.version} is ready`, "Narrated — the version it was drafted from is unchanged.");
    } else {
      setError(res.error.message);
    }
    await load();
  }

  async function download(report: ReportItem) {
    if (!organizationId) return;
    setError(null);
    const res = await apiFetch<{ url: string }>(`/api/v1/organizations/${organizationId}/reports/${report.id}/download-url`);
    if (res.success) window.location.assign(res.data.url);
    else setError(res.error.message);
  }

  if (permissions.kind === "loading" || (organizationId && reports === null && !error)) {
    return <p className="text-sm text-slate-500">Loading reports…</p>;
  }

  const offered = REPORT_KIND_DEFINITIONS.filter((k) => (AVAILABLE_REPORT_KINDS as readonly string[]).includes(k.kind));
  const ownerChoice = owner || me || "";
  const canOwnPack = held.includes("gap.read");
  const cards = (format: "pdf" | "xlsx") => (
    <div className="grid gap-4 sm:grid-cols-2">
      {offered
        .filter((k) => k.format === format)
        .map((k) => (
          <KindCard key={k.kind} k={k}>
            {k.perOwner && (
              <label className="mt-3 block text-sm text-slate-700">
                <span className="sr-only">Whose pack</span>
                <select
                  data-testid="owner-select"
                  value={ownerChoice}
                  onChange={(e) => setOwner(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                >
                  {me && !members.some((m) => m.userId === me) && <option value={me}>My own pack</option>}
                  {members.map((m) => (
                    <option key={m.userId} value={m.userId}>
                      {m.fullName ?? "Unnamed member"} · {m.roleName}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <button
              type="button"
              data-testid={`generate-${k.kind}`}
              disabled={busy !== null || (k.perOwner && !ownerChoice)}
              onClick={() => void generate(k.kind, k.perOwner ? { ownerUserId: ownerChoice } : {})}
              className="mt-3 rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {busy === k.kind ? "Generating…" : "Generate"}
            </button>
          </KindCard>
        ))}
    </div>
  );

  return (
    <div className="space-y-8">
      <header>
        <p className="max-w-3xl text-sm text-slate-600">
          Stored, versioned reports for the Board and the programme. A report is never edited: generating it again adds a new
          version, and every earlier version stays downloadable. Downloads use a link that lasts one minute, and each one is
          logged.
        </p>
      </header>

      {notice && (
        <Notice tone="success" testId="reports-notice">
          {notice}
        </Notice>
      )}
      {error && (
        <Notice tone="error" testId="reports-error">
          {error}
        </Notice>
      )}

      <Tabs
        label="Reports"
        testId="reports-tabs"
        value={tab}
        onValueChange={setTab}
        tabs={[
          {
            id: "pdf",
            label: "PDF reports",
            // Shown to whoever may generate; otherwise to an owner for their own pack (decision 9).
            hidden: !canGenerate && !(canOwnPack && me),
            content: canGenerate ? (
              <section aria-labelledby="generate-pdf-heading" className="space-y-4">
                <h2 id="generate-pdf-heading" className="sr-only">
                  Generate a PDF report
                </h2>
                <ReportGuide kinds={offered.filter((k) => k.format === "pdf")} />
                {cards("pdf")}
              </section>
            ) : (
              <Can permission="gap.read">
                {me && (
                  <section aria-labelledby="own-pack-heading">
                    <h2 id="own-pack-heading" className="text-lg font-semibold text-slate-900">
                      Your actions
                    </h2>
                    <div className="mt-3 grid gap-4 sm:grid-cols-2">
                      {offered
                        .filter((k) => k.perOwner)
                        .map((k) => (
                          <KindCard key={k.kind} k={k}>
                            <button
                              type="button"
                              data-testid="generate-own-pack"
                              disabled={busy !== null}
                              onClick={() => void generate(k.kind, { ownerUserId: me })}
                              className="mt-3 rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                            >
                              {busy === k.kind ? "Generating…" : "Generate my pack"}
                            </button>
                          </KindCard>
                        ))}
                    </div>
                  </section>
                )}
              </Can>
            ),
          },
          {
            id: "working-files",
            label: "Working files",
            hidden: !canGenerate,
            content: (
              <section aria-labelledby="generate-xlsx-heading" className="space-y-4">
                <h2 id="generate-xlsx-heading" className="sr-only">
                  Generate a working file
                </h2>
                <ReportGuide kinds={offered.filter((k) => k.format === "xlsx")} />
                {cards("xlsx")}
              </section>
            ),
          },
          {
            id: "stored",
            label: "Stored",
            badge: reports && reports.length > 0 ? String(reports.length) : undefined,
            content: (
              <section aria-labelledby="stored-heading">
                <h2 id="stored-heading" className="sr-only">
                  Stored reports
                </h2>
                {reports && reports.length === 0 ? (
                  <p data-testid="reports-empty" className="text-sm text-slate-500">
                    No report has been generated yet. Generate one from the PDF reports or Working files tab.
                  </p>
                ) : (
                  <div>
                    <DataTable
                      testId="reports-table"
                      rows={reports ?? []}
                      rowKey={(r) => r.id}
                      rowTestId={(r) => `report-row-${r.id}`}
                      noun="reports"
                      search={{ label: "Search reports", placeholder: "Search by report or person", text: (r) => `${r.kindLabel} ${r.subjectName ?? ""} ${r.generatedByName ?? ""}` }}
                      columns={[
                        {
                          key: "report",
                          header: "Report",
                          className: "font-medium text-slate-900",
                          sortValue: (r) => r.kindLabel,
                          cell: (r) => (
                            <>
                              {r.kindLabel}
                              {r.subjectName && <span className="font-normal text-slate-600"> — {r.subjectName}</span>}
                              <span className="ml-1 text-xs font-normal uppercase text-slate-400">{r.format}</span>
                              {r.narratedFromId && (
                                <span data-testid={`narrated-${r.id}`} className="ml-2 rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-normal text-indigo-800">
                                  With narrative
                                  {reports?.find((x) => x.id === r.narratedFromId) ? ` · figures of v${reports.find((x) => x.id === r.narratedFromId)!.version}` : ""}
                                </span>
                              )}
                            </>
                          ),
                        },
                        { key: "version", header: "Version", className: "text-slate-700", sortValue: (r) => r.version, cell: (r) => `v${r.version}` },
                        { key: "status", header: "Status", cell: (r) => <StatusChip report={r} /> },
                        { key: "asOf", header: "As of", className: "text-slate-700 whitespace-nowrap", sortValue: (r) => r.asOf, cell: (r) => formatDate(r.asOf) },
                        { key: "by", header: "Generated by", className: "text-slate-700", sortValue: (r) => r.generatedByName, cell: (r) => r.generatedByName ?? "—" },
                        {
                          key: "when",
                          header: "When",
                          className: "text-slate-700 whitespace-nowrap",
                          sortValue: (r) => r.generatedAt ?? r.requestedAt,
                          cell: (r) => formatWhen(r.generatedAt ?? r.requestedAt),
                        },
                        { key: "size", header: "Size", className: "text-slate-700 whitespace-nowrap", sortValue: (r) => r.byteSize, cell: (r) => formatBytes(r.byteSize) },
                        {
                          key: "actions",
                          header: <span className="sr-only">Actions</span>,
                          className: "space-x-2 whitespace-nowrap text-right",
                          cell: (r) => (
                            <>
                              {r.status === "ready" && (canDownload || ownPack(r)) && (
                                <button
                                  type="button"
                                  data-testid={`download-${r.id}`}
                                  onClick={() => void download(r)}
                                  className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                                >
                                  Download
                                </button>
                              )}
                              {(AVAILABLE_REPORT_KINDS as readonly string[]).includes(r.kind) &&
                                r.status !== "running" &&
                                (canGenerate || ownPack(r)) && (
                                  <button
                                    type="button"
                                    data-testid={`regenerate-${r.id}`}
                                    disabled={busy !== null}
                                    onClick={() => void generate(r.kind as ReportKind, { fromReportId: r.id })}
                                    className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                                  >
                                    {busy === r.id ? "Generating…" : "New version"}
                                  </button>
                                )}
                              {r.narratable && organizationId && !r.pendingNarrativeDraftId && (
                                <DraftButton
                                  organizationId={organizationId}
                                  task="report_narrative_draft"
                                  body={{ reportId: r.id }}
                                  subject={`${r.kindLabel}, version ${r.version} — from its stored figures`}
                                  onAccepted={() => void load()}
                                  testId={`narrative-draft-${r.id}`}
                                  size="xs"
                                />
                              )}
                              {r.pendingNarrativeDraftId && canGenerate && (
                                <button
                                  type="button"
                                  data-testid={`narrative-print-${r.id}`}
                                  disabled={busy !== null}
                                  onClick={() => void printNarrated(r)}
                                  className="rounded-md bg-indigo-700 px-2.5 py-1 text-xs font-medium text-white hover:bg-indigo-800 disabled:opacity-50"
                                >
                                  {busy === `narrate-${r.id}` ? "Printing…" : "Print the narrated version"}
                                </button>
                              )}
                            </>
                          ),
                        },
                      ]}
                    />
                  </div>
                )}
              </section>
            ),
          },
        ]}
      />

      <p className="max-w-3xl text-xs text-slate-500">{DPDP_REPORT_CAVEAT}</p>
    </div>
  );
}

/** "Which report do I need?" — one line per audience, naming the report made for it (F4.8). */
function ReportGuide({ kinds }: { kinds: ReportKindDefinition[] }) {
  return (
    <div data-testid="reports-guide" className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <h3 className="text-sm font-semibold text-slate-900">Which report do I need?</h3>
      <ul className="mt-2 space-y-1 text-sm text-slate-700">
        {kinds.map((k) => (
          <li key={k.kind}>
            <span className="font-medium text-slate-900">{k.audience}:</span> {k.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

function KindCard({ k, children }: { k: ReportKindDefinition; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h4 className="font-semibold text-slate-900">{k.label}</h4>
      <p className="text-xs uppercase tracking-wide text-slate-500">
        {k.format.toUpperCase()} · {k.audience}
      </p>
      <p className="mt-2 text-sm text-slate-700">{k.question}</p>
      {k.recordsExposure && <p className="mt-1 text-xs text-slate-500">Records an exposure snapshot first, and prints from it.</p>}
      {k.kind === "evidence_pack" && (
        <p className="mt-1 text-xs text-slate-500">Also generates the Evidence Index (Excel) from the same data, and names it.</p>
      )}
      {children}
    </div>
  );
}

function StatusChip({ report }: { report: ReportItem }) {
  if (report.status === "ready") {
    return <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800">Ready</span>;
  }
  if (report.status === "failed" || report.stalled) {
    return (
      <span title={report.error ?? "It did not finish."} className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-800">
        Failed
      </span>
    );
  }
  return <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800">Generating</span>;
}
