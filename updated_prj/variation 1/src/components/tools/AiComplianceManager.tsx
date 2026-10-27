"use client";

import Link from "next/link";
import {
  BrainCircuit,
  Check,
  CircleAlert,
  Clock3,
  Eye,
  FileCheck2,
  Info,
  ListChecks,
  Loader2,
  RefreshCw,
  Scale,
  Send,
  ShieldQuestion,
  Sparkles,
  TriangleAlert,
  UserRoundCheck,
  X,
} from "lucide-react";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { SECURITY_LEGAL_REFS } from "@/content/security-compliance-legal";
import type { SecurityReport } from "@/content/security-scanner";
import type {
  ActionHorizon,
  ManagerAction,
  ManagerAnalysis,
  ManagerConfigResponse,
  ManagerContext,
  ManagerErrorCode,
  ManagerQuestionResponse,
} from "@/lib/security-compliance-contract";

export type ManagerState =
  | { phase: "idle" }
  | { phase: "checking" }
  | { phase: "ready"; mode: "live" | "mock" | "off" }
  | { phase: "analyzing"; mode: "live" | "mock" }
  | { phase: "done"; analysis: ManagerAnalysis }
  | { phase: "error"; code: ManagerErrorCode; detail: string; runId?: string };

type Preferences = { locale: string; readingMode: "normal" | "easy" };
type ManagerTab = "brief" | "actions" | "questions";
type WorkflowStatus = "open" | "in_progress" | "human_verified";
type WorkflowState = { status: WorkflowStatus; note: string };
type ClientErrorBody = { error: ManagerErrorCode; detail?: string; runId?: string };

type AiComplianceManagerProps = {
  report: SecurityReport;
  onAnalysisChange: (analysis: ManagerAnalysis | null) => void;
};

const DEFAULT_CONTEXT: ManagerContext = {
  sector: "unspecified",
  perspective: "unspecified",
  highImpactData: [],
  activeBreach: "no",
};

const TABS: Array<{ id: ManagerTab; label: string; icon: typeof Eye }> = [
  { id: "brief", label: "Brief", icon: Eye },
  { id: "actions", label: "Action queue", icon: ListChecks },
  { id: "questions", label: "Questions to verify", icon: ShieldQuestion },
];

const HORIZONS: Array<{ id: ActionHorizon; label: string; description: string }> = [
  { id: "do_now", label: "Do now", description: "Visible signals needing prompt human review." },
  { id: "plan_next", label: "Plan next", description: "Evidence and remediation work to schedule." },
  { id: "monitor", label: "Monitor", description: "Controls to re-check and retain evidence for." },
];

const OWNER_LABELS: Record<ManagerAction["ownerRole"], string> = {
  leadership: "Leadership",
  privacy_legal: "Privacy / Legal",
  security_engineering: "Security / Engineering",
  operations: "Operations",
  vendor_management: "Vendor management",
  cross_functional: "Cross-functional",
};

const ATTENTION_LABELS: Record<ManagerAnalysis["attentionLevel"], string> = {
  urgent_review: "Urgent review",
  important_review: "Important review",
  monitor: "Monitor",
};

const ERROR_FALLBACKS: Record<ManagerErrorCode, string> = {
  invalid_request: "The request could not be validated. Review the report and try again.",
  request_too_large: "The report is too large for this demo request.",
  rate_limited: "This demo has received too many requests. Try again later.",
  ai_not_configured: "AI-assisted analysis is not configured on this server.",
  provider_unavailable: "The configured AI provider is unavailable or needs attention.",
  provider_timeout: "The configured AI provider did not respond in time.",
  invalid_model_output: "The generated response failed the safety contract and was not shown.",
};

export function AiComplianceManager({
  report,
  onAnalysisChange,
}: AiComplianceManagerProps) {
  const [state, setState] = useState<ManagerState>({ phase: "checking" });
  const [config, setConfig] = useState<ManagerConfigResponse | null>(null);
  const [configAttempt, setConfigAttempt] = useState(0);
  const [context, setContext] = useState<ManagerContext>(DEFAULT_CONTEXT);
  const [emptyImpactReason, setEmptyImpactReason] = useState<"none" | "unsure">("none");
  const [activeTab, setActiveTab] = useState<ManagerTab>("brief");
  const [preferences, setPreferences] = useState<Preferences>({
    locale: "en",
    readingMode: "normal",
  });
  const [generatedPreferences, setGeneratedPreferences] = useState<Preferences | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const generateButtonRef = useRef<HTMLButtonElement | null>(null);
  const errorRef = useRef<HTMLDivElement | null>(null);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    fetch("/api/security-compliance-manager", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("configuration request failed");
        return (await response.json()) as ManagerConfigResponse;
      })
      .then((nextConfig) => {
        if (!active) return;
        setConfig(nextConfig);
        setState({ phase: "ready", mode: nextConfig.mode });
      })
      .catch((error: unknown) => {
        if (!active || (error instanceof Error && error.name === "AbortError")) return;
        setState({
          phase: "error",
          code: "provider_unavailable",
          detail: "The compliance manager configuration could not be loaded.",
        });
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [configAttempt]);

  useEffect(() => {
    const updatePreferences = () => setPreferences(readDocumentPreferences());
    queueMicrotask(updatePreferences);
    const observer = new MutationObserver(updatePreferences);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["lang", "data-reading"],
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => () => abortRef.current?.abort(), []);

  useEffect(() => {
    if (state.phase === "error") errorRef.current?.focus();
  }, [state.phase]);

  async function generatePlan() {
    if (!config || config.mode === "off" || !config.configured) return;
    const requestPreferences = readDocumentPreferences();
    const controller = new AbortController();
    abortRef.current?.abort();
    abortRef.current = controller;
    onAnalysisChange(null);
    setState({ phase: "analyzing", mode: config.mode });

    try {
      const response = await fetch("/api/security-compliance-manager", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "analyze",
          report,
          context,
          locale: requestPreferences.locale,
          readingMode: requestPreferences.readingMode,
        }),
        signal: controller.signal,
        cache: "no-store",
      });
      const body = (await response.json().catch(() => null)) as
        | ManagerAnalysis
        | ClientErrorBody
        | null;
      if (!response.ok || !body || "error" in body) {
        const code = body && "error" in body ? body.error : "provider_unavailable";
        const detail =
          body && "detail" in body && body.detail ? body.detail : ERROR_FALLBACKS[code];
        setState({
          phase: "error",
          code,
          detail,
          runId: body && "runId" in body ? body.runId : undefined,
        });
        return;
      }
      setGeneratedPreferences({
        locale: body.language,
        readingMode: requestPreferences.readingMode,
      });
      setActiveTab("brief");
      setState({ phase: "done", analysis: body });
      onAnalysisChange(body);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        setState({ phase: "ready", mode: config.mode });
        window.setTimeout(() => generateButtonRef.current?.focus(), 0);
        return;
      }
      setState({
        phase: "error",
        code: "provider_unavailable",
        detail: ERROR_FALLBACKS.provider_unavailable,
      });
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
    }
  }

  function cancelAnalysis() {
    abortRef.current?.abort();
  }

  function retry() {
    if (!config) {
      setState({ phase: "checking" });
      setConfigAttempt((attempt) => attempt + 1);
      return;
    }
    void generatePlan();
  }

  function toggleHighImpact(value: ManagerContext["highImpactData"][number]) {
    setContext((current) => {
      const selected = current.highImpactData.includes(value);
      return {
        ...current,
        highImpactData: selected
          ? current.highImpactData.filter((item) => item !== value)
          : [...current.highImpactData, value],
      };
    });
  }

  function clearHighImpact(reason: "none" | "unsure") {
    setEmptyImpactReason(reason);
    setContext((current) => ({ ...current, highImpactData: [] }));
  }

  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let targetIndex = index;
    if (event.key === "ArrowRight") targetIndex = (index + 1) % TABS.length;
    else if (event.key === "ArrowLeft") targetIndex = (index - 1 + TABS.length) % TABS.length;
    else if (event.key === "Home") targetIndex = 0;
    else if (event.key === "End") targetIndex = TABS.length - 1;
    else return;
    event.preventDefault();
    setActiveTab(TABS[targetIndex].id);
    tabRefs.current[targetIndex]?.focus();
  }

  const analysis = state.phase === "done" ? state.analysis : null;
  const isStale = Boolean(
    analysis &&
      generatedPreferences &&
      (generatedPreferences.locale !== preferences.locale ||
        generatedPreferences.readingMode !== preferences.readingMode)
  );

  return (
    <section
      className="card overflow-hidden p-0"
      aria-labelledby="compliance-manager-title"
      data-compliance-manager
    >
      <header className="border-b border-line px-5 py-5 sm:px-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="badge">
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
                Demo - AI-assisted, human-approved
              </span>
              {config?.mode === "mock" && (
                <span className="badge badge-blue">Deterministic demo - no AI model called</span>
              )}
              {config?.mode === "live" && <span className="badge badge-blue">Live Groq</span>}
              {config?.mode === "off" && <span className="badge">AI analysis off</span>}
            </div>
            <h2
              id="compliance-manager-title"
              className="mt-3 font-display text-xl font-semibold text-text sm:text-2xl"
            >
              Automated AI Compliance Manager
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-text-muted">
              Turn these scan findings into an explainable, prioritised review plan.
            </p>
          </div>
          <BrainCircuit className="hidden h-7 w-7 shrink-0 text-accent sm:block" aria-hidden />
        </div>
      </header>

      {context.activeBreach === "yes" && (
        <div className="border-b border-red/40 bg-red/10 px-5 py-4 sm:px-6" role="alert">
          <div className="flex items-start gap-3">
            <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-red" aria-hidden />
            <p className="text-sm leading-relaxed text-text">
              A public website scan cannot assess an active breach. Escalate now to your incident,
              legal, privacy and security leads. Review Section 8(6) and Rule 7; do not wait for this
              AI analysis.
            </p>
          </div>
        </div>
      )}

      {(state.phase === "idle" || state.phase === "checking") && (
        <div className="flex min-h-32 items-center gap-3 px-5 py-6 sm:px-6" aria-live="polite">
          <Loader2 className="h-5 w-5 animate-spin text-accent motion-reduce:animate-none" aria-hidden />
          <p className="text-sm text-text-muted">Checking the available analysis mode...</p>
        </div>
      )}

      {state.phase === "ready" && (
        <div className="divide-y divide-line">
          <DisclosureSection mode={state.mode} />
          <ContextControls
            context={context}
            emptyImpactReason={emptyImpactReason}
            onContextChange={setContext}
            onToggleHighImpact={toggleHighImpact}
            onClearHighImpact={clearHighImpact}
          />
          <div className="px-5 py-5 sm:px-6">
            {state.mode === "off" ? (
              <div className="flex items-start gap-3 rounded border border-line bg-bg/40 p-4">
                <Info className="mt-0.5 h-5 w-5 shrink-0 text-accent" aria-hidden />
                <div>
                  <p className="font-medium text-text">AI-assisted analysis is not configured</p>
                  <p className="mt-1 text-sm leading-relaxed text-text-muted">
                    The deterministic scanner remains fully available. A server operator can enable
                    mock or live mode; visitors are never asked for an API key.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                  ref={generateButtonRef}
                  type="button"
                  className="btn btn-accent min-h-11"
                  onClick={() => void generatePlan()}
                  disabled={!config?.configured}
                  aria-describedby={!config?.configured ? "manager-config-warning" : undefined}
                >
                  <Sparkles className="h-4 w-4" aria-hidden />
                  Generate explainable plan
                </button>
                {!config?.configured && (
                  <p id="manager-config-warning" className="text-sm text-red" role="alert">
                    Live mode needs server configuration. No browser key can be entered here.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {state.phase === "analyzing" && (
        <div className="px-5 py-6 sm:px-6" aria-live="polite" aria-busy="true">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-accent motion-reduce:animate-none" aria-hidden />
            <p className="font-medium text-text">Building an evidence-linked review plan...</p>
          </div>
          <ul className="mt-4 grid gap-2 text-sm text-text-muted sm:grid-cols-3">
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-accent" aria-hidden /> Validating findings
            </li>
            <li className="flex items-center gap-2">
              <Scale className="h-4 w-4 text-accent" aria-hidden /> Checking allowed legal anchors
            </li>
            <li className="flex items-center gap-2">
              <BrainCircuit className="h-4 w-4 text-accent" aria-hidden /> Preparing explanations
            </li>
          </ul>
          <button type="button" className="btn btn-ghost mt-5 min-h-11" onClick={cancelAnalysis}>
            <X className="h-4 w-4" aria-hidden /> Cancel analysis
          </button>
        </div>
      )}

      {state.phase === "error" && (
        <div
          ref={errorRef}
          className="px-5 py-6 sm:px-6"
          role="alert"
          tabIndex={-1}
          data-manager-error={state.code}
        >
          <div className="flex items-start gap-3">
            <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-red" aria-hidden />
            <div className="min-w-0">
              <h3 className="font-medium text-text">The review plan was not generated</h3>
              <p className="mt-1 break-words text-sm leading-relaxed text-text-muted">
                {state.detail || ERROR_FALLBACKS[state.code]}
              </p>
              <p className="mt-2 font-mono text-xs text-text-faint">Error code: {state.code}</p>
              {state.runId && (
                <p className="mt-1 font-mono text-xs text-text-faint">
                  Run ID:{" "}
                  <span data-easy-ignore data-i18n-ignore translate="no">
                    {state.runId}
                  </span>
                </p>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" className="btn btn-accent min-h-11" onClick={retry}>
                  <RefreshCw className="h-4 w-4" aria-hidden /> Retry
                </button>
                {config && (
                  <button
                    ref={generateButtonRef}
                    type="button"
                    className="btn btn-ghost min-h-11"
                    onClick={() => setState({ phase: "ready", mode: config.mode })}
                  >
                    Back to settings
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {analysis && (
        <div>
          {isStale && (
            <div className="flex flex-col gap-3 border-b border-amber/40 bg-amber/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <p className="text-sm leading-relaxed text-text">
                This result was generated in {analysis.language} with {generatedPreferences?.readingMode}
                {" "}reading. Your current language or reading mode is different.
              </p>
              <button
                type="button"
                className="btn btn-ghost min-h-11 shrink-0"
                onClick={() => void generatePlan()}
              >
                <RefreshCw className="h-4 w-4" aria-hidden /> Regenerate in current language
              </button>
            </div>
          )}

          <div
            className="grid grid-cols-3 border-b border-line bg-bg/30"
            role="tablist"
            aria-label="Compliance manager views"
          >
            {TABS.map((tab, index) => {
              const Icon = tab.icon;
              const selected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  ref={(element) => {
                    tabRefs.current[index] = element;
                  }}
                  id={`manager-tab-${tab.id}`}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  aria-controls={`manager-panel-${tab.id}`}
                  tabIndex={selected ? 0 : -1}
                  className={`flex min-h-14 min-w-0 items-center justify-center gap-2 border-r border-line px-2 py-3 text-center text-xs font-semibold last:border-r-0 sm:px-4 sm:text-sm ${
                    selected ? "bg-surface-2 text-text" : "text-text-muted hover:bg-surface-2/50 hover:text-text"
                  }`}
                  onClick={() => setActiveTab(tab.id)}
                  onKeyDown={(event) => handleTabKeyDown(event, index)}
                >
                  <Icon className="hidden h-4 w-4 shrink-0 sm:block" aria-hidden />
                  <span className="break-words">{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div
            id={`manager-panel-${activeTab}`}
            role="tabpanel"
            aria-labelledby={`manager-tab-${activeTab}`}
            tabIndex={0}
          >
            {activeTab === "brief" && <BriefPanel analysis={analysis} />}
            {activeTab === "actions" && <ActionQueue analysis={analysis} report={report} />}
            {activeTab === "questions" && (
              <VerificationQuestions analysis={analysis} report={report} />
            )}
          </div>

          <QuestionArea report={report} context={context} />
        </div>
      )}
    </section>
  );
}

function DisclosureSection({ mode }: { mode: "live" | "mock" | "off" }) {
  return (
    <div className="grid gap-0 sm:grid-cols-2">
      <details className="group border-b border-line px-5 py-4 sm:border-b-0 sm:border-r sm:px-6">
        <summary className="min-h-11 cursor-pointer list-none py-2 text-sm font-semibold text-text [&::-webkit-details-marker]:hidden">
          <span className="flex items-center gap-2">
            <Info className="h-4 w-4 text-accent" aria-hidden /> What the AI receives
          </span>
        </summary>
        <ul className="space-y-2 pb-2 text-sm leading-relaxed text-text-muted">
          <li>Finding labels, statuses, scanner evidence, DPDP references and score metadata.</li>
          <li>Optional categorical context, active language and Easy Read preference.</li>
          <li>No raw HTML, credentials, internal system data, secret headers or browser notes.</li>
        </ul>
      </details>
      <details className="group px-5 py-4 sm:px-6">
        <summary className="min-h-11 cursor-pointer list-none py-2 text-sm font-semibold text-text [&::-webkit-details-marker]:hidden">
          <span className="flex items-center gap-2">
            <ShieldQuestion className="h-4 w-4 text-accent" aria-hidden /> What it cannot determine
          </span>
        </summary>
        <p className="pb-2 text-sm leading-relaxed text-text-muted">
          A public scan cannot prove internal access control, encryption at rest, backup recovery,
          log retention, processor contracts, incident readiness or actual breach handling.
        </p>
      </details>
      <details className="border-t border-line px-5 py-4 sm:col-span-2 sm:px-6">
        <summary className="min-h-11 cursor-pointer list-none py-2 text-sm font-semibold text-text [&::-webkit-details-marker]:hidden">
          <span className="flex items-center gap-2">
            <BrainCircuit className="h-4 w-4 text-accent" aria-hidden /> How Groq is used
          </span>
        </summary>
        <p className="pb-2 text-sm leading-relaxed text-text-muted">
          {mode === "live"
            ? "The sanitised scan findings and optional categorical context are sent to the configured Groq API when you choose Generate. Data handling is governed by the configured Groq account and provider terms."
            : mode === "mock"
              ? "Mock mode makes no provider request. A deterministic rules fixture builds the preview from this report."
              : "Provider processing is disabled. The scanner continues to work without AI analysis."}
        </p>
      </details>
    </div>
  );
}

function ContextControls({
  context,
  emptyImpactReason,
  onContextChange,
  onToggleHighImpact,
  onClearHighImpact,
}: {
  context: ManagerContext;
  emptyImpactReason: "none" | "unsure";
  onContextChange: React.Dispatch<React.SetStateAction<ManagerContext>>;
  onToggleHighImpact: (value: ManagerContext["highImpactData"][number]) => void;
  onClearHighImpact: (reason: "none" | "unsure") => void;
}) {
  return (
    <div className="px-5 py-5 sm:px-6">
      <h3 className="text-sm font-semibold text-text">Optional non-confidential context</h3>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium text-text">
          Sector
          <select
            value={context.sector}
            onChange={(event) =>
              onContextChange((current) => ({
                ...current,
                sector: event.target.value as ManagerContext["sector"],
              }))
            }
            className="mt-2 min-h-11 w-full rounded border border-line bg-bg px-3 py-2 text-text outline-none focus:border-accent/60"
          >
            <option value="unspecified">Not specified</option>
            <option value="bfsi">BFSI</option>
            <option value="healthcare">Healthcare</option>
            <option value="education">Education</option>
            <option value="saas_it">SaaS and IT</option>
            <option value="ecommerce">E-commerce</option>
            <option value="government">Government</option>
            <option value="other">Other</option>
          </select>
        </label>
        <label className="text-sm font-medium text-text">
          User perspective
          <select
            value={context.perspective}
            onChange={(event) =>
              onContextChange((current) => ({
                ...current,
                perspective: event.target.value as ManagerContext["perspective"],
              }))
            }
            className="mt-2 min-h-11 w-full rounded border border-line bg-bg px-3 py-2 text-text outline-none focus:border-accent/60"
          >
            <option value="unspecified">Not specified</option>
            <option value="leadership">Leadership</option>
            <option value="privacy_legal">Privacy / Legal</option>
            <option value="security_engineering">Security / Engineering</option>
            <option value="operations">Operations</option>
          </select>
        </label>

        <fieldset className="rounded border border-line p-3 sm:col-span-2">
          <legend className="px-1 text-sm font-medium text-text">High-impact data context</legend>
          <div className="mt-1 grid gap-2 sm:grid-cols-3">
            {([
              ["children", "Children's data"],
              ["health", "Health data"],
              ["financial", "Financial data"],
            ] as const).map(([value, label]) => (
              <label key={value} className="flex min-h-11 items-center gap-2 text-sm text-text-muted">
                <input
                  type="checkbox"
                  checked={context.highImpactData.includes(value)}
                  onChange={() => onToggleHighImpact(value)}
                  className="h-4 w-4 accent-accent"
                />
                {label}
              </label>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap gap-x-6 gap-y-2 border-t border-line pt-2">
            <label className="flex min-h-11 items-center gap-2 text-sm text-text-muted">
              <input
                type="radio"
                name="high-impact-empty"
                checked={context.highImpactData.length === 0 && emptyImpactReason === "none"}
                onChange={() => onClearHighImpact("none")}
                className="h-4 w-4 accent-accent"
              />
              None selected
            </label>
            <label className="flex min-h-11 items-center gap-2 text-sm text-text-muted">
              <input
                type="radio"
                name="high-impact-empty"
                checked={context.highImpactData.length === 0 && emptyImpactReason === "unsure"}
                onChange={() => onClearHighImpact("unsure")}
                className="h-4 w-4 accent-accent"
              />
              Unsure
            </label>
          </div>
          {context.highImpactData.length === 0 && emptyImpactReason === "unsure" && (
            <p className="mt-1 text-xs text-text-faint">
              The request sends no declared high-impact category; it does not guess one.
            </p>
          )}
        </fieldset>

        <label className="text-sm font-medium text-text sm:col-span-2">
          Active personal-data breach
          <select
            value={context.activeBreach}
            onChange={(event) =>
              onContextChange((current) => ({
                ...current,
                activeBreach: event.target.value as ManagerContext["activeBreach"],
              }))
            }
            className="mt-2 min-h-11 w-full rounded border border-line bg-bg px-3 py-2 text-text outline-none focus:border-accent/60 sm:max-w-xs"
          >
            <option value="no">No</option>
            <option value="yes">Yes</option>
            <option value="unsure">Unsure</option>
          </select>
        </label>
      </div>
      <p className="mt-4 flex items-start gap-2 text-sm leading-relaxed text-amber">
        <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        Do not enter names, account numbers, personal data, credentials, or confidential evidence.
      </p>
    </div>
  );
}

function BriefPanel({ analysis }: { analysis: ManagerAnalysis }) {
  return (
    <div className="px-5 py-6 sm:px-6">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`badge ${
            analysis.attentionLevel === "urgent_review"
              ? "badge-red"
              : analysis.attentionLevel === "important_review"
                ? "badge-gold"
                : "badge-blue"
          }`}
        >
          {ATTENTION_LABELS[analysis.attentionLevel]}
        </span>
        <span className="badge">AI-generated</span>
      </div>
      <h3
        className="mt-3 font-display text-xl font-semibold text-text"
        data-easy-ignore
        data-i18n-ignore
        translate="no"
      >
        {analysis.headline}
      </h3>
      <p
        className="mt-2 max-w-prose text-sm leading-relaxed text-text-muted"
        data-easy-ignore
        data-i18n-ignore
        translate="no"
      >
        {analysis.executiveSummary}
      </p>

      <div className="mt-6 grid border-y border-line sm:grid-cols-2">
        <section className="py-5 sm:border-r sm:border-line sm:pr-5">
          <h4 className="flex items-center gap-2 text-sm font-semibold text-text">
            <Check className="h-4 w-4 text-green" aria-hidden /> What this scan can support
          </h4>
          <BulletList items={analysis.supportedConclusions} />
        </section>
        <section className="border-t border-line py-5 sm:border-t-0 sm:pl-5">
          <h4 className="flex items-center gap-2 text-sm font-semibold text-text">
            <TriangleAlert className="h-4 w-4 text-amber" aria-hidden /> What this scan cannot prove
          </h4>
          <BulletList items={analysis.unsupportedConclusions} />
        </section>
      </div>

      <dl className="mt-5 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
        <Metadata label="Engine">
          {analysis.engine.kind === "anthropic" ? "Live Claude" : "Deterministic mock"}
        </Metadata>
        <Metadata label="Configured model">{analysis.engine.model}</Metadata>
        <Metadata label="Generated time">
          <time dateTime={analysis.generatedAt}>{formatDate(analysis.generatedAt)}</time>
        </Metadata>
        <Metadata label="Generated language">{analysis.language}</Metadata>
        <Metadata label="Schema version">{analysis.schemaVersion}</Metadata>
        <Metadata label="Run ID">
          <span className="break-all font-mono text-xs">{analysis.runId}</span>
        </Metadata>
      </dl>

      {analysis.engine.kind === "deterministic_mock" && (
        <p className="mt-5 rounded border border-blue/30 bg-blue/10 p-3 text-sm text-text-muted">
          Deterministic demo - no AI model called. This preview demonstrates the workflow and
          explanation layout. Mock prose is currently generated in English.
        </p>
      )}
      <p className="mt-5 border-t border-line pt-4 text-sm font-medium text-text">
        {analysis.disclaimer}
      </p>
    </div>
  );
}

function ActionQueue({ analysis, report }: { analysis: ManagerAnalysis; report: SecurityReport }) {
  const findingLabels = createFindingLabelMap(report);
  return (
    <div>
      {HORIZONS.map((horizon) => {
        const actions = analysis.actions.filter((action) => action.horizon === horizon.id);
        return (
          <section key={horizon.id} aria-labelledby={`horizon-${horizon.id}`}>
            <div className="border-b border-line bg-bg/25 px-5 py-4 sm:px-6">
              <h3 id={`horizon-${horizon.id}`} className="flex items-center gap-2 font-semibold text-text">
                <Clock3 className="h-4 w-4 text-accent" aria-hidden /> {horizon.label}
              </h3>
              <p className="mt-1 text-xs text-text-faint">{horizon.description}</p>
            </div>
            {actions.length > 0 ? (
              <div className="divide-y divide-line">
                {actions.map((action) => (
                  <ActionRow
                    key={action.id}
                    action={action}
                    report={report}
                    findingLabels={findingLabels}
                  />
                ))}
              </div>
            ) : (
              <p className="border-b border-line px-5 py-4 text-sm text-text-faint sm:px-6">
                No draft actions in this horizon.
              </p>
            )}
          </section>
        );
      })}
    </div>
  );
}

function ActionRow({
  action,
  report,
  findingLabels,
}: {
  action: ManagerAction;
  report: SecurityReport;
  findingLabels: Map<string, string>;
}) {
  const evidenceId = useId();
  const selectRef = useRef<HTMLSelectElement | null>(null);
  const evidenceRef = useRef<HTMLTextAreaElement | null>(null);
  const storageKey = workflowStorageKey(report, action.id);
  const [workflow, setWorkflow] = useState<WorkflowState>({ status: "open", note: "" });
  const [editingEvidence, setEditingEvidence] = useState(false);
  const [draftEvidence, setDraftEvidence] = useState("");
  const [evidenceError, setEvidenceError] = useState("");

  useEffect(() => {
    const stored = readWorkflow(storageKey);
    if (stored) setWorkflow(stored);
  }, [storageKey]);

  function persist(next: WorkflowState) {
    setWorkflow(next);
    writeWorkflow(storageKey, next);
  }

  function changeStatus(status: WorkflowStatus) {
    if (status === "human_verified") {
      setDraftEvidence(workflow.note);
      setEvidenceError("");
      setEditingEvidence(true);
      window.setTimeout(() => evidenceRef.current?.focus(), 0);
      return;
    }
    setEditingEvidence(false);
    persist({ status, note: "" });
  }

  function saveEvidence() {
    const note = draftEvidence.trim();
    if (!note) {
      setEvidenceError("Add a short evidence note before marking this item Human verified.");
      evidenceRef.current?.focus();
      return;
    }
    persist({ status: "human_verified", note });
    setEditingEvidence(false);
    setEvidenceError("");
    window.setTimeout(() => selectRef.current?.focus(), 0);
  }

  function cancelEvidence() {
    setEditingEvidence(false);
    setEvidenceError("");
    setDraftEvidence(workflow.note);
    window.setTimeout(() => selectRef.current?.focus(), 0);
  }

  return (
    <article className="px-5 py-5 sm:px-6" data-action-id={action.id}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="badge">{HORIZONS.find((item) => item.id === action.horizon)?.label}</span>
            <span className="text-xs text-text-faint">
              Confidence in evidence link:{" "}
              <span data-easy-ignore data-i18n-ignore translate="no">
                {capitalize(action.confidence)}
              </span>
            </span>
          </div>
          <h4
            className="mt-2 font-display text-lg font-semibold text-text"
            data-easy-ignore
            data-i18n-ignore
            translate="no"
          >
            {action.title}
          </h4>
          <p
            className="mt-2 text-sm leading-relaxed text-text-muted"
            data-easy-ignore
            data-i18n-ignore
            translate="no"
          >
            {action.action}
          </p>
        </div>
        <span className="shrink-0 text-xs font-medium text-text-muted">
          Suggested owner: {OWNER_LABELS[action.ownerRole]}
        </span>
      </div>

      <div className="mt-4 grid gap-4 border-y border-line py-4 sm:grid-cols-2">
        <div>
          <h5 className="text-xs font-semibold uppercase text-text-muted">Related findings</h5>
          <ul
            className="mt-2 space-y-1 text-sm text-text-muted"
            data-easy-ignore
            data-i18n-ignore
            translate="no"
          >
            {action.findingIds.map((findingId) => (
              <li key={findingId} className="break-words">
                <span className="font-mono text-xs text-accent">{findingId}</span>
                {" - "}
                {findingLabels.get(findingId) ?? "Current scanner finding"}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h5 className="text-xs font-semibold uppercase text-text-muted">DPDP connection</h5>
          <LegalLinks ids={action.legalReferenceIds} />
        </div>
        <div>
          <h5 className="text-xs font-semibold uppercase text-text-muted">Proof / verification steps</h5>
          <BulletList items={action.verificationSteps} />
        </div>
        <div>
          <h5 className="text-xs font-semibold uppercase text-text-muted">Uncertainty / assumptions</h5>
          <BulletList items={action.assumptions.length > 0 ? action.assumptions : [action.rationale]} />
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,16rem)_1fr] sm:items-start">
        <label className="text-sm font-medium text-text">
          Local workflow status
          <select
            ref={selectRef}
            value={editingEvidence ? "human_verified" : workflow.status}
            onChange={(event) => changeStatus(event.target.value as WorkflowStatus)}
            className="mt-2 min-h-11 w-full rounded border border-line bg-bg px-3 py-2 text-text outline-none focus:border-accent/60"
          >
            <option value="open">Open</option>
            <option value="in_progress">In progress</option>
            <option value="human_verified">Human verified</option>
          </select>
        </label>
        <div className="text-xs leading-relaxed text-text-faint sm:pt-7">
          Demo state - cleared when this browser session ends. It is not a compliance system of
          record and is never sent to Groq.
        </div>
      </div>

      {editingEvidence && (
        <div className="mt-4 rounded border border-green/30 bg-green/10 p-4">
          <label htmlFor={evidenceId} className="text-sm font-medium text-text">
            Evidence note required for Human verified
          </label>
          <textarea
            ref={evidenceRef}
            id={evidenceId}
            value={draftEvidence}
            onChange={(event) => setDraftEvidence(event.target.value)}
            maxLength={240}
            rows={3}
            aria-describedby={evidenceError ? `${evidenceId}-error` : `${evidenceId}-help`}
            className="mt-2 w-full resize-y rounded border border-line bg-bg px-3 py-2 text-sm text-text outline-none focus:border-accent/60"
            placeholder="Example: Header observed in production response"
          />
          <p id={`${evidenceId}-help`} className="mt-1 text-xs text-text-faint">
            Demo state - stored only in this browser session. {draftEvidence.length}/240
          </p>
          {evidenceError && (
            <p id={`${evidenceId}-error`} className="mt-1 text-sm text-red" role="alert">
              {evidenceError}
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className="btn btn-accent min-h-11" onClick={saveEvidence}>
              <UserRoundCheck className="h-4 w-4" aria-hidden /> Save Human verified
            </button>
            <button type="button" className="btn btn-ghost min-h-11" onClick={cancelEvidence}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {workflow.status === "human_verified" && !editingEvidence && (
        <div className="mt-4 flex flex-col gap-3 rounded border border-green/30 bg-green/10 p-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold text-text">
              <FileCheck2 className="h-4 w-4 text-green" aria-hidden /> Human verified
            </p>
            <p className="mt-1 break-words text-sm text-text-muted">{workflow.note}</p>
          </div>
          <button
            type="button"
            className="btn btn-ghost min-h-11 shrink-0"
            onClick={() => changeStatus("human_verified")}
          >
            Edit evidence note
          </button>
        </div>
      )}
    </article>
  );
}

function VerificationQuestions({
  analysis,
  report,
}: {
  analysis: ManagerAnalysis;
  report: SecurityReport;
}) {
  const findingLabels = createFindingLabelMap(report);
  return (
    <div className="divide-y divide-line">
      {analysis.verificationQuestions.length > 0 ? (
        analysis.verificationQuestions.map((question, index) => (
          <article key={question.id} className="px-5 py-5 sm:px-6">
            <div className="flex gap-3">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded border border-line bg-bg text-sm font-semibold text-accent">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <h3
                  className="font-medium leading-relaxed text-text"
                  data-easy-ignore
                  data-i18n-ignore
                  translate="no"
                >
                  {question.question}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-text-muted">
                  <span className="font-semibold text-text">Why it matters: </span>
                  <span data-easy-ignore data-i18n-ignore translate="no">
                    {question.whyItMatters}
                  </span>
                </p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <h4 className="text-xs font-semibold uppercase text-text-muted">
                      Evidence to inspect
                    </h4>
                    <BulletList items={question.evidenceToInspect} />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold uppercase text-text-muted">
                      Related controls
                    </h4>
                    <ul
                      className="mt-2 space-y-1 text-sm text-text-muted"
                      data-easy-ignore
                      data-i18n-ignore
                      translate="no"
                    >
                      {question.relatedFindingIds.map((id) => (
                        <li key={id}>{findingLabels.get(id) ?? id}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="mt-4 flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:items-start sm:justify-between">
                  <p className="text-xs font-medium text-text-faint">
                    Public scan observable: No
                  </p>
                  <LegalLinks ids={question.legalReferenceIds} />
                </div>
              </div>
            </div>
          </article>
        ))
      ) : (
        <p className="px-5 py-6 text-sm text-text-muted sm:px-6">
          No verification questions were generated. Review the deeper-assessment controls below.
        </p>
      )}
    </div>
  );
}

function QuestionArea({ report, context }: { report: SecurityReport; context: ManagerContext }) {
  const inputId = useId();
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const [question, setQuestion] = useState("");
  const [status, setStatus] = useState<"idle" | "asking" | "done" | "error">("idle");
  const [answer, setAnswer] = useState<ManagerQuestionResponse | null>(null);
  const [error, setError] = useState("");
  const [errorRunId, setErrorRunId] = useState("");

  async function submitQuestion(event: FormEvent) {
    event.preventDefault();
    const cleanQuestion = question.trim();
    if (!cleanQuestion || status === "asking") return;
    const requestPreferences = readDocumentPreferences();
    setStatus("asking");
    setError("");
    setErrorRunId("");
    try {
      const response = await fetch("/api/security-compliance-manager", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "question",
          report,
          context,
          question: cleanQuestion,
          locale: requestPreferences.locale,
          readingMode: requestPreferences.readingMode,
        }),
        cache: "no-store",
      });
      const body = (await response.json().catch(() => null)) as
        | ManagerQuestionResponse
        | ClientErrorBody
        | null;
      if (!response.ok || !body || "error" in body) {
        setStatus("error");
        const detail =
          body && "detail" in body && body.detail
            ? body.detail
            : "This question could not be answered safely.";
        setError(detail);
        setErrorRunId(body && "runId" in body && body.runId ? body.runId : "");
        return;
      }
      setAnswer(body);
      setStatus("done");
    } catch {
      setStatus("error");
      setError("The question request could not reach the compliance manager.");
    }
  }

  function applyPrompt(prompt: string) {
    setQuestion(prompt);
    inputRef.current?.focus();
  }

  return (
    <section className="border-t border-line px-5 py-6 sm:px-6" aria-labelledby="manager-question-title">
      <div className="flex items-center gap-2">
        <ShieldQuestion className="h-5 w-5 text-accent" aria-hidden />
        <h3 id="manager-question-title" className="font-display text-lg font-semibold text-text">
          Ask about this report
        </h3>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {[
          "Why is this the first priority?",
          "What should engineering verify?",
          "What can this public scan not prove?",
        ].map((prompt) => (
          <button
            key={prompt}
            type="button"
            className="chip min-h-11 text-left"
            onClick={() => applyPrompt(prompt)}
          >
            {prompt}
          </button>
        ))}
      </div>
      <form className="mt-4" onSubmit={submitQuestion}>
        <label htmlFor={inputId} className="text-sm font-medium text-text">
          Focused question
        </label>
        <textarea
          ref={inputRef}
          id={inputId}
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          maxLength={500}
          rows={3}
          disabled={status === "asking"}
          aria-describedby={`${inputId}-help`}
          className="mt-2 w-full resize-y rounded border border-line bg-bg px-3 py-2 text-sm text-text outline-none focus:border-accent/60"
        />
        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p id={`${inputId}-help`} className="text-xs leading-relaxed text-text-faint">
            Ask only about this report. Do not paste files, HTML, source code, credentials, personal
            data or confidential policies. {question.length}/500
          </p>
          <button
            type="submit"
            className="btn btn-accent min-h-11 shrink-0"
            disabled={!question.trim() || status === "asking"}
          >
            {status === "asking" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden />
                Checking report...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" aria-hidden /> Ask focused question
              </>
            )}
          </button>
        </div>
      </form>

      {status === "error" && (
        <div className="mt-4 rounded border border-red/30 bg-red/10 p-3 text-sm text-text" role="alert">
          <p>{error}</p>
          {errorRunId && (
            <p className="mt-1 font-mono text-xs text-text-faint">
              Run ID:{" "}
              <span data-easy-ignore data-i18n-ignore translate="no">
                {errorRunId}
              </span>
            </p>
          )}
        </div>
      )}

      {status === "done" && answer && (
        <div className="mt-5 border-y border-line py-5" aria-live="polite">
          <div className="flex flex-wrap items-center gap-2">
            <span className="badge">AI-generated</span>
            <span className="text-xs text-text-faint">
              Confidence in evidence link:{" "}
              <span data-easy-ignore data-i18n-ignore translate="no">
                {capitalize(answer.confidence)}
              </span>
            </span>
          </div>
          <p
            className="mt-3 text-sm leading-relaxed text-text"
            data-easy-ignore
            data-i18n-ignore
            translate="no"
          >
            {answer.answer}
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <h4 className="text-xs font-semibold uppercase text-text-muted">Related findings</h4>
              <p
                className="mt-2 break-words font-mono text-xs text-text-muted"
                data-easy-ignore
                data-i18n-ignore
                translate="no"
              >
                {answer.findingIds.length > 0 ? answer.findingIds.join(", ") : "Report cannot support this question"}
              </p>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase text-text-muted">DPDP connection</h4>
              <LegalLinks ids={answer.legalReferenceIds} />
            </div>
            <div>
              <h4 className="flex items-center gap-2 text-xs font-semibold uppercase text-text-muted">
                <TriangleAlert className="h-4 w-4 text-amber" aria-hidden /> Uncertainty
              </h4>
              <p
                className="mt-2 text-sm leading-relaxed text-text-muted"
                data-easy-ignore
                data-i18n-ignore
                translate="no"
              >
                {answer.uncertainty}
              </p>
            </div>
            <div>
              <h4 className="flex items-center gap-2 text-xs font-semibold uppercase text-text-muted">
                <UserRoundCheck className="h-4 w-4 text-green" aria-hidden /> Human check
              </h4>
              <p
                className="mt-2 text-sm leading-relaxed text-text-muted"
                data-easy-ignore
                data-i18n-ignore
                translate="no"
              >
                {answer.humanCheck}
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function LegalLinks({ ids }: { ids: Array<keyof typeof SECURITY_LEGAL_REFS> }) {
  if (ids.length === 0) {
    return <p className="mt-2 text-sm text-text-faint">No legal anchor asserted.</p>;
  }
  return (
    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-sm">
      {ids.map((id) => {
        const reference = SECURITY_LEGAL_REFS[id];
        return (
          <Link
            key={id}
            href={reference.href}
            className="font-medium text-accent underline decoration-accent/40 underline-offset-4 hover:decoration-accent"
          >
            {reference.label}
          </Link>
        );
      })}
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  if (items.length === 0) return <p className="mt-2 text-sm text-text-faint">None stated.</p>;
  return (
    <ul
      className="mt-2 space-y-2 text-sm leading-relaxed text-text-muted"
      data-easy-ignore
      data-i18n-ignore
      translate="no"
    >
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <span className="text-accent" aria-hidden>
            &bull;
          </span>
          <span className="min-w-0 break-words">{item}</span>
        </li>
      ))}
    </ul>
  );
}

function Metadata({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-semibold uppercase text-text-faint">{label}</dt>
      <dd
        className="mt-1 break-words text-text-muted"
        data-easy-ignore
        data-i18n-ignore
        translate="no"
      >
        {children}
      </dd>
    </div>
  );
}

function readDocumentPreferences(): Preferences {
  if (typeof document === "undefined") return { locale: "en", readingMode: "normal" };
  return {
    locale: document.documentElement.lang || "en",
    readingMode: document.documentElement.dataset.reading === "easy" ? "easy" : "normal",
  };
}

function createFindingLabelMap(report: SecurityReport): Map<string, string> {
  const labels = new Map<string, string>();
  for (const capability of report.capabilities) {
    for (const check of capability.checks) {
      if (!labels.has(check.id)) labels.set(check.id, check.label);
    }
  }
  for (const finding of report.remediation) {
    if (!labels.has(finding.id)) labels.set(finding.id, finding.label);
  }
  return labels;
}

function workflowStorageKey(report: SecurityReport, actionId: string): string {
  let host = "unknown-host";
  try {
    const source = report.meta.final_url ?? report.url;
    host = new URL(/^https?:\/\//i.test(source) ? source : `https://${source}`).hostname;
  } catch {
    host = "unknown-host";
  }
  return `truststack-compliance-demo:${fnv1a(`${host}|${report.scanned_at}|${actionId}`)}`;
}

function fnv1a(value: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36);
}

function readWorkflow(key: string): WorkflowState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<WorkflowState>;
    if (
      value.status !== "open" &&
      value.status !== "in_progress" &&
      value.status !== "human_verified"
    ) {
      return null;
    }
    const note = typeof value.note === "string" ? value.note.slice(0, 240) : "";
    if (value.status === "human_verified" && !note.trim()) return null;
    return { status: value.status, note };
  } catch {
    return null;
  }
}

function writeWorkflow(key: string, value: WorkflowState) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Demo state remains usable in memory when session storage is unavailable.
  }
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function capitalize(value: string): string {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}