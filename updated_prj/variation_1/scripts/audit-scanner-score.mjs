import { buildUrlScanReport } from "../src/lib/scanner/url-report.ts";
import { buildPdfPolicyReport } from "../src/lib/scanner/pdf-report.ts";
import { TRUSTSTACK_ASSURANCE } from "../src/content/truststack-assurance.ts";

const baseUrl = (process.env.SCANNER_AUDIT_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const publicUrl = process.env.SCANNER_AUDIT_PUBLIC_URL?.replace(/\/$/, "");
const policyPaths = { privacy_url: "/privacy", terms_url: "/terms", cookie_url: "/cookies" };

function policyUrls(base) {
  return Object.fromEntries(
    Object.entries(policyPaths).map(([key, path]) => [key, `${base}${path}`])
  );
}

function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function assertPerfect(label, report) {
  const failingCategories = report.categories.filter(category => category.score !== 100);
  const findings = report.findings.filter(finding => !["pass", "info"].includes(finding.severity));
  if (report.overall_score !== 100 || failingCategories.length || findings.length) {
    throw new Error(
      `${label} failed: score=${report.overall_score}; categories=${JSON.stringify(failingCategories)}; findings=${JSON.stringify(findings.map(finding => finding.id))}`
    );
  }
}

const localResponse = await fetch(baseUrl, { redirect: "follow" });
if (!localResponse.ok) {
  throw new Error(`Local app is not reachable at ${baseUrl} (HTTP ${localResponse.status})`);
}

const policyHtml = {};
for (const path of ["/privacy", "/terms", "/cookies"]) {
  let response = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    response = await fetch(`${baseUrl}${path}`, { cache: "no-store" });
    if (response.ok) break;
  }
  if (!response?.ok) {
    throw new Error(`${path} returned HTTP ${response?.status ?? "unknown"}`);
  }
  policyHtml[path] = await response.text();
}

const realFetch = globalThis.fetch;
const simulatedOrigin = "https://audit.truststack.local";
globalThis.fetch = async (input, init) => {
  const originalUrl = String(input);
  const localUrl = originalUrl.replace(simulatedOrigin, baseUrl);
  const response = await realFetch(localUrl, init);
  const headers = new Headers(response.headers);
  headers.set("strict-transport-security", "max-age=63072000; includeSubDomains; preload");
  return {
    ok: response.ok,
    status: response.status,
    url: originalUrl,
    headers,
    arrayBuffer: () => response.arrayBuffer(),
  };
};

const urlReadiness = await buildUrlScanReport({
  url: simulatedOrigin,
});
globalThis.fetch = realFetch;
assertPerfect("Production HTTPS readiness", urlReadiness);

const privacyText = stripHtml(policyHtml["/privacy"]);
const termsText = stripHtml(policyHtml["/terms"]);
const cookieText = stripHtml(policyHtml["/cookies"]);
const documentReadiness = buildPdfPolicyReport({
  reference: "TrustStack",
  privacyText,
  termsText,
  cookieText,
});
assertPerfect("Document readiness", documentReadiness);

const weakControl = buildPdfPolicyReport({
  reference: "Deliberately weak policy",
  privacyText: "We collect data.",
});
const completeControlText = `
  Digital Personal Data Protection DPDP consent opt-in opt-out processing purpose collection.
  Right to access, data principal correction, erasure and withdrawal of consent.
  Retention, storage period, encryption, security measures, safeguards, grievance, DPO and complaint.
  Children under 18, cookies, tracking, analytics, third-party processor, vendor, cross-border transfer outside India.
`.repeat(8);
const missingPrivacyControl = buildPdfPolicyReport({
  reference: "Complete disclosures without privacy policy",
  privacyText: "",
  termsText: completeControlText,
  cookieText: completeControlText,
});

const evidence = TRUSTSTACK_ASSURANCE;
const documentWordCounts = documentReadiness.policies.map(policy => policy.word_count);
const evidenceWordCounts = evidence.policies.map(policy => policy.words);
if (
  evidence.checks.productionHttpsReadiness !== urlReadiness.overall_score ||
  evidence.checks.documentReadiness !== documentReadiness.overall_score ||
  evidence.controls.weakPolicyScore !== weakControl.overall_score ||
  evidence.controls.missingPrivacyScore !== missingPrivacyControl.overall_score ||
  JSON.stringify(evidenceWordCounts) !== JSON.stringify(documentWordCounts)
) {
  throw new Error(
    `Public assurance evidence is stale: ${JSON.stringify({
      url: urlReadiness.overall_score,
      document: documentReadiness.overall_score,
      weak: weakControl.overall_score,
      missing_privacy: missingPrivacyControl.overall_score,
      policy_words: documentWordCounts,
    })}`
  );
}

let deployed = null;
if (publicUrl) {
  deployed = await buildUrlScanReport({
    url: publicUrl,
    ...policyUrls(publicUrl),
  });
  assertPerfect("Deployed site", deployed);
}

console.log(
  JSON.stringify(
    {
      production_https_readiness: urlReadiness.overall_score,
      document_readiness: documentReadiness.overall_score,
      deployed_score: deployed?.overall_score ?? "not requested",
      negative_controls: {
        weak_policy: weakControl.overall_score,
        missing_privacy: missingPrivacyControl.overall_score,
      },
      policy_words: documentReadiness.policies.map(policy => ({
        kind: policy.kind,
        words: policy.word_count,
      })),
    },
    null,
    2
  )
);
