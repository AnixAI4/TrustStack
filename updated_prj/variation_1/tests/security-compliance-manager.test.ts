import assert from "node:assert/strict";
import test from "node:test";
import type { ManagerAnalysisRequest, ManagerModelAnalysis } from "@/lib/security-compliance-contract";
import {
  ManagerServiceError,
  analyzeSecurityReport,
  answerSecurityReportQuestion,
} from "@/lib/server/security-compliance-manager";

const report: ManagerAnalysisRequest["report"] = {
  url: "https://example.com/private?secret=value",
  scanned_at: "2026-07-14T10:00:00.000Z",
  overall_score: 48,
  grade: "C",
  risk_level: "medium",
  summary: "Visible controls need review.",
  capabilities: [
    {
      key: "headers",
      label: "Public security headers",
      icon: "shield",
      score: 48,
      weight: 100,
      dpdp_reference: "Section 8(5); Rule 6",
      checks: [
        {
          id: "headers.csp",
          label: "Content Security Policy",
          status: "fail",
          evidence: "Content-Security-Policy header was not observed.",
          dpdp_reference: "Section 8(5); Rule 6",
          remediation: "Add and test a restrictive policy.",
        },
      ],
    },
  ],
  remediation: [
    {
      id: "headers.csp",
      label: "Content Security Policy",
      status: "fail",
      evidence: "Content-Security-Policy header was not observed.",
      dpdp_reference: "Section 8(5); Rule 6",
      remediation: "Add and test a restrictive policy.",
    },
  ],
  deeper_assessment: [],
  meta: {
    final_url: "https://example.com/private?secret=value",
    https: true,
    tls_version: "TLS 1.3",
    tls_days_to_expiry: 45,
    third_party_domains: 1,
    engine: "test-fixture",
    notes: [],
  },
};

const request: ManagerAnalysisRequest = {
  action: "analyze",
  report,
  context: {
    sector: "unspecified",
    perspective: "security_engineering",
    highImpactData: [],
    activeBreach: "no",
  },
  locale: "en",
  readingMode: "normal",
};

const questionRequest = {
  ...request,
  action: "question" as const,
  question: "Does this report prove an internal control not present in its findings?",
};

const validModelAnalysis: ManagerModelAnalysis = {
  attentionLevel: "important_review",
  headline: "A visible security signal needs human review",
  executiveSummary:
    "The public scan found one visible security signal. A human should verify the production response and internal context.",
  supportedConclusions: ["The named public header was not observed at scan time."],
  unsupportedConclusions: ["The scan cannot establish internal operating effectiveness."],
  evidenceLinks: [
    { findingId: "headers.csp", relevance: "The action is grounded in this scanner result." },
  ],
  explanations: [
    {
      findingId: "headers.csp",
      observedFact: "Content-Security-Policy header was not observed.",
      interpretation: "This is a visible security signal that should be reviewed by a person.",
      legalReferenceIds: ["DPDP_ACT_S8_5", "DPDP_RULE_6"],
      uncertainty: "The public response does not establish the internal control design.",
      humanChecks: ["Capture and review a fresh production response."],
      confidence: "high",
    },
  ],
  actions: [
    {
      id: "action-headers-csp",
      horizon: "do_now",
      title: "Review the missing visible header",
      findingIds: ["headers.csp"],
      ownerRole: "security_engineering",
      action: "Review the current production policy and prepare a tested change for approval.",
      rationale: "The scanner did not observe the named public header.",
      legalReferenceIds: ["DPDP_ACT_S8_5", "DPDP_RULE_6"],
      verificationSteps: ["Capture a dated production response after review."],
      assumptions: ["The scanner response represents the public site at scan time."],
      confidence: "high",
    },
  ],
  verificationQuestions: [
    {
      id: "verify-headers-csp",
      question: "Who owns review of the production policy?",
      whyItMatters: "A responsible owner must verify the tested configuration.",
      evidenceToInspect: ["A dated response and reviewer approval."],
      relatedFindingIds: ["headers.csp"],
      legalReferenceIds: ["DPDP_ACT_S8_5", "DPDP_RULE_6"],
      externallyObservable: false,
    },
  ],
};

const originalEnvironment = {
  mode: process.env.AI_COMPLIANCE_MODE,
  key: process.env.ANTHROPIC_API_KEY,
  model: process.env.ANTHROPIC_MODEL,
};
const originalFetch = globalThis.fetch;

function restoreRuntime() {
  setEnvironment("AI_COMPLIANCE_MODE", originalEnvironment.mode);
  setEnvironment("ANTHROPIC_API_KEY", originalEnvironment.key);
  setEnvironment("ANTHROPIC_MODEL", originalEnvironment.model);
  globalThis.fetch = originalFetch;
}

function setEnvironment(name: string, value: string | undefined) {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}

function configureLive() {
  process.env.AI_COMPLIANCE_MODE = "live";
  process.env.ANTHROPIC_API_KEY = "test-key-not-a-real-secret";
  process.env.ANTHROPIC_MODEL = "test-model";
}

function providerResponse(content: unknown, status = 200) {
  const text = typeof content === "string" ? content : JSON.stringify(content);
  return new Response(
    JSON.stringify({ content: [{ type: "text", text }] }),
    { status, headers: { "content-type": "application/json" } }
  );
}

function cloneAnalysis(): ManagerModelAnalysis {
  return structuredClone(validModelAnalysis);
}

async function expectManagerError(
  expectedCode: ManagerServiceError["code"],
  action: () => Promise<unknown>
) {
  await assert.rejects(action, (error: unknown) => {
    assert.ok(error instanceof ManagerServiceError);
    assert.equal(error.code, expectedCode);
    return true;
  });
}

test.afterEach(restoreRuntime);
test.after(restoreRuntime);

test("off mode rejects analysis without a provider call", async () => {
  process.env.AI_COMPLIANCE_MODE = "off";
  let called = false;
  globalThis.fetch = async () => {
    called = true;
    throw new Error("fetch should not be called");
  };

  await expectManagerError("ai_not_configured", () => analyzeSecurityReport(request, "run-off"));
  assert.equal(called, false);
});

test("live mode without a key returns a safe configuration error", async () => {
  process.env.AI_COMPLIANCE_MODE = "live";
  delete process.env.ANTHROPIC_API_KEY;
  process.env.ANTHROPIC_MODEL = "test-model";

  await expectManagerError("ai_not_configured", () =>
    analyzeSecurityReport(request, "run-missing-key")
  );
});

test("provider abort maps to provider_timeout", async () => {
  configureLive();
  globalThis.fetch = async () => {
    const error = new Error("aborted");
    error.name = "AbortError";
    throw error;
  };

  await expectManagerError("provider_timeout", () =>
    analyzeSecurityReport(request, "run-timeout")
  );
});

test("provider authentication and unavailable model errors stay safe", async (context) => {
  await context.test("authentication", async () => {
    configureLive();
    globalThis.fetch = async () => new Response("private provider body", { status: 401 });
    await assert.rejects(
      () => analyzeSecurityReport(request, "run-auth"),
      (error: unknown) => {
        assert.ok(error instanceof ManagerServiceError);
        assert.equal(error.code, "provider_unavailable");
        assert.doesNotMatch(error.message, /private provider body/);
        return true;
      }
    );
  });
  await context.test("model unavailable", async () => {
    configureLive();
    globalThis.fetch = async () => new Response("private provider body", { status: 404 });
    await assert.rejects(
      () => analyzeSecurityReport(request, "run-model"),
      (error: unknown) => {
        assert.ok(error instanceof ManagerServiceError);
        assert.equal(error.code, "provider_unavailable");
        assert.match(error.message, /test-model/);
        assert.doesNotMatch(error.message, /private provider body/);
        return true;
      }
    );
  });
});

test("malformed provider JSON is rejected as a whole", async () => {
  configureLive();
  globalThis.fetch = async () => providerResponse("not valid JSON");

  await expectManagerError("invalid_model_output", () =>
    analyzeSecurityReport(request, "run-malformed")
  );
});

test("unknown finding and legal IDs are rejected", async (context) => {
  await context.test("unknown finding", async () => {
    configureLive();
    const output = cloneAnalysis();
    output.actions[0].findingIds = ["invented.finding"];
    globalThis.fetch = async () => providerResponse(JSON.stringify(output));
    await expectManagerError("invalid_model_output", () =>
      analyzeSecurityReport(request, "run-unknown-finding")
    );
  });
  await context.test("unknown legal reference", async () => {
    configureLive();
    const output = cloneAnalysis();
    (output.actions[0] as unknown as { legalReferenceIds: string[] }).legalReferenceIds = [
      "DPDP_RULE_999",
    ];
    globalThis.fetch = async () => providerResponse(JSON.stringify(output));
    await expectManagerError("invalid_model_output", () =>
      analyzeSecurityReport(request, "run-unknown-legal")
    );
  });
});

test("HTML, arbitrary URLs and verdict language are rejected", async (context) => {
  configureLive();
  const cases: Array<[string, (output: ManagerModelAnalysis) => void]> = [
    ["HTML", (output) => { output.explanations[0].interpretation = "<script>alert(1)</script>"; }],
    ["URL", (output) => { output.actions[0].rationale = "See https://attacker.invalid"; }],
    ["verdict", (output) => { output.headline = "The organisation is compliant"; }],
  ];

  for (const [name, mutate] of cases) {
    await context.test(name, async () => {
      configureLive();
      const output = cloneAnalysis();
      mutate(output);
      globalThis.fetch = async () => providerResponse(JSON.stringify(output));
      await expectManagerError("invalid_model_output", () =>
        analyzeSecurityReport(request, `run-${name.toLowerCase()}`)
      );
    });
  }
});

test("valid live output is cross-checked and finalised with server metadata", async () => {
  configureLive();
  const providerRequests: Array<Record<string, unknown>> = [];
  globalThis.fetch = async (_input, init) => {
    providerRequests.push(JSON.parse(String(init?.body)) as Record<string, unknown>);
    return providerResponse(JSON.stringify(validModelAnalysis));
  };

  const result = await analyzeSecurityReport(request, "run-valid");
  assert.equal(result.runId, "run-valid");
  assert.equal(result.schemaVersion, "1.0");
  assert.equal(result.engine.kind, "anthropic");
  assert.equal(result.engine.model, "test-model");
  assert.equal(result.explanations[0].observedFact, report.capabilities[0].checks[0].evidence);
  assert.equal(
    result.disclaimer,
    "AI-generated decision support, not a compliance determination or legal advice."
  );
  assert.equal(providerRequests[0]?.model, "test-model");
  const serializedProviderRequest = JSON.stringify(providerRequests[0]);
  assert.doesNotMatch(serializedProviderRequest, /private\?secret=value/);
  assert.doesNotMatch(serializedProviderRequest, /ANTHROPIC_API_KEY|test-key-not-a-real-secret/);
});

test("an explicitly unsupported question may omit findings and legal anchors", async () => {
  configureLive();
  globalThis.fetch = async () =>
    providerResponse(
      JSON.stringify({
        answer: "The current public report cannot support this question.",
        findingIds: [],
        legalReferenceIds: [],
        confidence: "low",
        uncertainty: "The requested internal evidence is not present in the public report.",
        humanCheck: "Ask the responsible control owner for a dated record or test result.",
      })
    );

  const result = await answerSecurityReportQuestion(questionRequest, "run-unsupported");
  assert.deepEqual(result.findingIds, []);
  assert.deepEqual(result.legalReferenceIds, []);
  assert.equal(result.confidence, "low");
});