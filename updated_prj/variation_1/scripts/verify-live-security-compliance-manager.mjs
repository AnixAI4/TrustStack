import assert from "node:assert/strict";

const BASE_URL = process.env.COMPLIANCE_MANAGER_BASE_URL ?? "http://localhost:3000";
const ENDPOINT = `${BASE_URL}/api/security-compliance-manager`;
const FINDING_IDS = new Set([
  "headers.csp",
  "cookies.secure",
  "internal.access",
  "transport.tls",
]);
const LEGAL_IDS = new Set([
  "DPDP_ACT_S8",
  "DPDP_ACT_S8_1",
  "DPDP_ACT_S8_5",
  "DPDP_ACT_S8_6",
  "DPDP_RULE_6",
  "DPDP_RULE_7",
]);

const finding = (id, label, status, evidence, remediation) => ({
  id,
  label,
  status,
  evidence,
  dpdp_reference: "Section 8(5); Rule 6",
  remediation,
});

const failed = finding(
  "headers.csp",
  "Content Security Policy",
  "fail",
  "Content-Security-Policy header was not observed.",
  "Add and test a restrictive Content-Security-Policy header.",
);
const partial = finding(
  "cookies.secure",
  "Secure cookie attributes",
  "partial",
  "Some public cookies did not expose every recommended attribute.",
  "Review production cookie attributes.",
);
const unknown = finding(
  "internal.access",
  "Internal access review",
  "unknown",
  "Not externally observable.",
  "Inspect the current access review record.",
);
const passed = finding(
  "transport.tls",
  "TLS transport",
  "pass",
  "TLS 1.3 was observed.",
  "Continue routine monitoring.",
);

const report = {
  url: "https://example.com/path?token=removed",
  scanned_at: "2026-07-15T00:00:00.000Z",
  overall_score: 48,
  grade: "C",
  risk_level: "medium",
  summary: "Visible controls need human review.",
  capabilities: [
    {
      key: "public_security",
      label: "Public security controls",
      icon: "shield",
      score: 48,
      weight: 100,
      dpdp_reference: "Section 8(5); Rule 6",
      checks: [failed, partial, unknown, passed],
    },
  ],
  remediation: [failed, partial],
  deeper_assessment: [
    {
      key: "access",
      label: "Access-control review",
      icon: "lock",
      dpdp_reference: "Rule 6",
      why: "Internal access cannot be observed publicly.",
      needs: "Current access review record and reviewer approval.",
    },
  ],
  meta: {
    final_url: "https://example.com/path?token=removed",
    https: true,
    tls_version: "TLS 1.3",
    tls_days_to_expiry: 45,
    third_party_domains: 2,
    engine: "live-verification-fixture",
    notes: [],
  },
};

const response = await fetch(ENDPOINT, {
  method: "POST",
  headers: {
    "content-type": "application/json",
    "x-forwarded-for": `live-verifier-${Date.now()}`,
  },
  body: JSON.stringify({
    action: "analyze",
    report,
    context: {
      sector: "saas_it",
      perspective: "security_engineering",
      highImpactData: [],
      activeBreach: "no",
    },
    locale: "en",
    readingMode: "normal",
  }),
});

const body = await response.json().catch(() => null);
if (!response.ok) {
  console.error(
    JSON.stringify(
      {
        status: response.status,
        error: body?.error ?? "request_failed",
        detail: body?.detail ?? "The live request failed without a structured response.",
        runIdPresent: Boolean(body?.runId),
      },
      null,
      2,
    ),
  );
  process.exitCode = 1;
} else {
  const findingIds = [
    ...body.actions.flatMap((action) => action.findingIds),
    ...body.explanations.map((explanation) => explanation.findingId),
    ...body.verificationQuestions.flatMap((question) => question.relatedFindingIds),
  ];
  const legalIds = [
    ...body.actions.flatMap((action) => action.legalReferenceIds),
    ...body.explanations.flatMap((explanation) => explanation.legalReferenceIds),
    ...body.verificationQuestions.flatMap((question) => question.legalReferenceIds),
  ];

  assert.equal(body.engine.kind, "anthropic");
  assert.equal(body.engine.provider, "anthropic");
  assert.equal(body.schemaVersion, "1.0");
  assert.ok(body.runId);
  assert.ok(findingIds.every((id) => FINDING_IDS.has(id)));
  assert.ok(legalIds.every((id) => LEGAL_IDS.has(id)));
  assert.equal(
    body.explanations.find((explanation) => explanation.findingId === failed.id)?.observedFact,
    failed.evidence,
  );
  assert.equal(
    body.disclaimer,
    "AI-generated decision support, not a compliance determination or legal advice.",
  );

  const questionResponse = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": `live-verifier-question-${Date.now()}`,
    },
    body: JSON.stringify({
      action: "question",
      report,
      context: {
        sector: "saas_it",
        perspective: "security_engineering",
        highImpactData: [],
        activeBreach: "no",
      },
      question: "What should engineering verify first?",
      locale: "en",
      readingMode: "normal",
    }),
  });
  const questionBody = await questionResponse.json().catch(() => null);
  if (!questionResponse.ok) {
    console.error(
      JSON.stringify(
        {
          status: questionResponse.status,
          error: questionBody?.error ?? "question_failed",
          detail:
            questionBody?.detail ?? "The live question failed without a structured response.",
          runIdPresent: Boolean(questionBody?.runId),
        },
        null,
        2,
      ),
    );
    process.exitCode = 1;
  } else {
    assert.ok(questionBody.findingIds.length > 0);
    assert.ok(questionBody.findingIds.every((id) => FINDING_IDS.has(id)));
    assert.ok(questionBody.legalReferenceIds.every((id) => LEGAL_IDS.has(id)));

    console.log(
      JSON.stringify(
        {
          status: response.status,
          engine: body.engine.kind,
          provider: body.engine.provider,
          model: body.engine.model,
          schemaVersion: body.schemaVersion,
          language: body.language,
          actions: body.actions.length,
          explanations: body.explanations.length,
          verificationQuestions: body.verificationQuestions.length,
          knownFindingIds: true,
          allowedLegalReferenceIds: true,
          observedFactPreserved: true,
          serverOwnedDisclaimer: true,
          runIdPresent: true,
          cacheControl: response.headers.get("cache-control"),
          focusedQuestionStatus: questionResponse.status,
          focusedQuestionGrounded: true,
          focusedQuestionLegalReferencesAllowed: true,
          focusedQuestionConfidence: questionBody.confidence,
        },
        null,
        2,
      ),
    );
  }
}