import type { Finding, ScanReport, Severity } from "@/content/scanner";

type PdfDocs = {
  reference: string;
  privacyText: string;
  termsText?: string;
  cookieText?: string;
};

function hasAny(text: string, patterns: RegExp[]): boolean {
  return patterns.some((p) => p.test(text));
}

function scoreFromFlags(flags: boolean[]): number {
  if (!flags.length) return 0;
  const hit = flags.filter(Boolean).length;
  return Math.round((hit / flags.length) * 100);
}

function gradeFor(score: number): string {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 65) return "C";
  if (score >= 50) return "D";
  return "F";
}

function riskFor(score: number): string {
  if (score >= 80) return "low";
  if (score >= 60) return "medium";
  if (score >= 40) return "high";
  return "critical";
}

function finding(
  id: string,
  category: string,
  title: string,
  severity: Severity,
  extras: Partial<Finding> = {}
): Finding {
  return { id, category, title, severity, ...extras };
}

/** Build a ScanReport from uploaded policy PDF text (TrustStack in-app path). */
export function buildPdfPolicyReport(docs: PdfDocs): ScanReport {
  const privacy = docs.privacyText || "";
  const terms = docs.termsText || "";
  const cookie = docs.cookieText || "";
  const combined = `${privacy}\n${terms}\n${cookie}`.toLowerCase();

  const checks = {
    mentionsConsent: hasAny(combined, [/consent/, /opt[- ]?in/, /opt[- ]?out/]),
    mentionsPurpose: hasAny(combined, [/purpose/, /processing/, /collect/]),
    mentionsRights: hasAny(combined, [
      /right to access/,
      /data principal/,
      /correction/,
      /erasure/,
      /withdrawal of consent/,
    ]),
    mentionsRetention: hasAny(combined, [/retain/, /retention/, /storage period/]),
    mentionsSecurity: hasAny(combined, [/encrypt/, /security measure/, /safeguard/]),
    mentionsGrievance: hasAny(combined, [/grievance/, /data protection officer/, /\bdpo\b/, /complaint/]),
    mentionsChildren: hasAny(combined, [/child/, /minor/, /under\s*18/]),
    mentionsCookies: hasAny(cookie || combined, [/cookie/, /tracking/, /analytics/]),
    mentionsThirdParty: hasAny(combined, [/third[- ]party/, /share with/, /processor/, /vendor/]),
    mentionsTransfer: hasAny(combined, [/cross[- ]border/, /transfer outside/, /outside india/]),
    hasDpdpMention: hasAny(combined, [/digital personal data protection/, /\bdpdp\b/, /data protection board/]),
    privacyLongEnough: privacy.replace(/\s+/g, " ").trim().length >= 800,
  };

  const findings: Finding[] = [];

  if (!checks.privacyLongEnough) {
    findings.push(
      finding("pdf-privacy-short", "privacy_notice", "Privacy policy appears thin or incomplete", "high", {
        recommendation: "Expand the notice to cover purposes, rights, retention, security and contact details.",
        dpdp_reference: "DPDP Act s.5",
      })
    );
  } else {
    findings.push(
      finding("pdf-privacy-present", "privacy_notice", "Privacy policy document provided", "pass", {
        evidence: `${privacy.split(/\s+/).filter(Boolean).length} words extracted`,
      })
    );
  }

  if (!checks.mentionsConsent) {
    findings.push(
      finding("pdf-consent", "consent", "Consent language not clearly described", "high", {
        recommendation: "Describe how consent is obtained, withdrawn, and recorded for each purpose.",
        dpdp_reference: "DPDP Act s.6",
      })
    );
  } else {
    findings.push(finding("pdf-consent-ok", "consent", "Consent practices described", "pass"));
  }

  if (!checks.mentionsPurpose) {
    findings.push(
      finding("pdf-purpose", "purpose", "Processing purposes are unclear", "medium", {
        recommendation: "List each processing purpose in plain language tied to the data collected.",
        dpdp_reference: "DPDP Act s.5",
      })
    );
  }

  if (!checks.mentionsRights) {
    findings.push(
      finding("pdf-rights", "rights", "Data principal rights incomplete", "high", {
        recommendation: "Cover access, correction, erasure, and withdrawal of consent.",
        dpdp_reference: "DPDP Act ss.11-12",
      })
    );
  } else {
    findings.push(finding("pdf-rights-ok", "rights", "Data principal rights mentioned", "pass"));
  }

  if (!checks.mentionsRetention) {
    findings.push(
      finding("pdf-retention", "retention", "Retention periods not stated", "medium", {
        recommendation: "State how long personal data is kept for each purpose.",
        dpdp_reference: "DPDP Act s.8",
      })
    );
  }

  if (!checks.mentionsSecurity) {
    findings.push(
      finding("pdf-security", "security", "Security safeguards not described", "medium", {
        recommendation: "Summarise technical and organisational measures protecting personal data.",
        dpdp_reference: "DPDP Act s.8",
      })
    );
  }

  if (!checks.mentionsGrievance) {
    findings.push(
      finding("pdf-grievance", "grievance", "Grievance / contact channel missing", "high", {
        recommendation: "Publish a grievance officer name, email and response timeline.",
        dpdp_reference: "DPDP Act s.13",
      })
    );
  } else {
    findings.push(finding("pdf-grievance-ok", "grievance", "Grievance contact described", "pass"));
  }

  if (!checks.mentionsCookies && !docs.cookieText) {
    findings.push(
      finding("pdf-cookies", "cookies", "Cookie / tracking disclosure not found", "medium", {
        recommendation: "Add a cookie policy covering categories, purposes and controls.",
        dpdp_reference: "DPDP Rules - notice & consent",
      })
    );
  }

  if (checks.mentionsThirdParty) {
    findings.push(
      finding("pdf-third-party", "sharing", "Third-party sharing disclosed", "info", {
        evidence: "Policy references processors, vendors or sharing.",
      })
    );
  } else {
    findings.push(
      finding("pdf-third-party-gap", "sharing", "Third-party / processor sharing not disclosed", "low", {
        recommendation: "Name categories of recipients if personal data is shared.",
      })
    );
  }

  if (!checks.hasDpdpMention) {
    findings.push(
      finding("pdf-dpdp", "framework", "No explicit DPDP Act reference", "info", {
        recommendation: "Reference the Digital Personal Data Protection Act, 2023 where applicable.",
      })
    );
  }

  const catConsent = scoreFromFlags([checks.mentionsConsent, checks.mentionsPurpose]);
  const catNotice = scoreFromFlags([checks.privacyLongEnough, checks.hasDpdpMention, checks.mentionsRetention]);
  const catRights = scoreFromFlags([checks.mentionsRights, checks.mentionsGrievance]);
  const catCookies = scoreFromFlags([checks.mentionsCookies || Boolean(docs.cookieText), checks.mentionsThirdParty]);
  const catSecurity = scoreFromFlags([checks.mentionsSecurity, checks.mentionsTransfer || true]);

  const overall = Math.round(
    catConsent * 0.25 + catNotice * 0.25 + catRights * 0.25 + catCookies * 0.15 + catSecurity * 0.1
  );

  const policies = [
    {
      kind: "privacy",
      found: privacy.trim().length > 0,
      word_count: privacy.split(/\s+/).filter(Boolean).length,
      excerpt: privacy.slice(0, 280),
    },
    {
      kind: "terms",
      found: terms.trim().length > 0,
      word_count: terms.split(/\s+/).filter(Boolean).length,
      excerpt: terms.slice(0, 280),
    },
    {
      kind: "cookie",
      found: cookie.trim().length > 0,
      word_count: cookie.split(/\s+/).filter(Boolean).length,
      excerpt: cookie.slice(0, 280),
    },
  ];

  return {
    url: docs.reference,
    scanned_at: new Date().toISOString(),
    overall_score: overall,
    grade: gradeFor(overall),
    risk_level: riskFor(overall),
    summary: `PDF policy assessment for “${docs.reference}”. Analysed ${policies.filter((p) => p.found).length} uploaded document(s) for DPDP-relevant disclosures (consent, rights, retention, grievance and cookies).`,
    categories: [
      { key: "consent", label: "Consent", score: catConsent, weight: 0.25 },
      { key: "privacy_notice", label: "Privacy notice", score: catNotice, weight: 0.25 },
      { key: "rights", label: "Rights & grievance", score: catRights, weight: 0.25 },
      { key: "cookies", label: "Cookies & sharing", score: catCookies, weight: 0.15 },
      { key: "security", label: "Security signals", score: catSecurity, weight: 0.1 },
    ],
    findings,
    cookies: [],
    trackers: [],
    policies,
    meta: {
      https: true,
      final_url: docs.reference,
      status: 200,
      consent_banner_detected: checks.mentionsConsent,
      security_headers: {},
      cookies_total: 0,
      third_party_trackers: 0,
      model_mode: "pdf-text",
      engine: "truststack-pdf",
      notes: [
        "Assessment based on uploaded PDF text extraction (not a live website crawl).",
        docs.termsText ? "Terms PDF included." : "Terms PDF not provided.",
        docs.cookieText ? "Cookie PDF included." : "Cookie PDF not provided.",
      ],
    },
  };
}
