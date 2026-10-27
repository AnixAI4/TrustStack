import type {
  CookieItem,
  Finding,
  PolicyDoc,
  ScanReport,
  Severity,
  TrackerItem,
} from "@/content/scanner";

const FETCH_TIMEOUT_MS = 25_000;
const MAX_HTML_BYTES = 2_500_000;

const TRACKER_HINTS: Array<{ domain: string; category: string }> = [
  { domain: "google-analytics.com", category: "analytics" },
  { domain: "googletagmanager.com", category: "tag-manager" },
  { domain: "googleadservices.com", category: "ads" },
  { domain: "doubleclick.net", category: "ads" },
  { domain: "facebook.net", category: "social" },
  { domain: "facebook.com", category: "social" },
  { domain: "connect.facebook.net", category: "social" },
  { domain: "hotjar.com", category: "analytics" },
  { domain: "clarity.ms", category: "analytics" },
  { domain: "segment.com", category: "analytics" },
  { domain: "segment.io", category: "analytics" },
  { domain: "mixpanel.com", category: "analytics" },
  { domain: "amplitude.com", category: "analytics" },
  { domain: "linkedin.com", category: "social" },
  { domain: "twitter.com", category: "social" },
  { domain: "ads-twitter.com", category: "ads" },
  { domain: "tiktok.com", category: "social" },
  { domain: "snapchat.com", category: "social" },
  { domain: "cdn.cookielaw.org", category: "consent" },
  { domain: "onetrust.com", category: "consent" },
];

const CONSENT_PATTERNS = [
  /cookie\s*(consent|banner|notice|preferences)/i,
  /accept\s*(all\s*)?cookies/i,
  /manage\s*cookies/i,
  /consent[-_ ]?manager/i,
  /onetrust/i,
  /cookiebot/i,
  /cookielaw/i,
  /we\s+use\s+cookies/i,
  /by\s+continuing\s+to\s+(use|browse)/i,
];

const PRIVACY_LINK_RE =
  /href=["']([^"']*(privacy|data-protection|personal-data)[^"']*)["']/gi;
const TERMS_LINK_RE =
  /href=["']([^"']*(terms|conditions|tos)[^"']*)["']/gi;
const COOKIE_LINK_RE =
  /href=["']([^"']*cookie[^"']*)["']/gi;

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

function scoreFromFlags(flags: boolean[]): number {
  if (!flags.length) return 0;
  return Math.round((flags.filter(Boolean).length / flags.length) * 100);
}

function stripTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function absolutize(base: string, href: string): string | null {
  try {
    return new URL(href, base).toString();
  } catch {
    return null;
  }
}

function firstMatch(html: string, re: RegExp, base: string): string | null {
  re.lastIndex = 0;
  const m = re.exec(html);
  if (!m?.[1]) return null;
  return absolutize(base, m[1]);
}

function parseSetCookies(
  header: string | null,
  pageHost: string
): CookieItem[] {
  if (!header) return [];
  // fetch may join multiple set-cookie; also try getSetCookie if available via headers
  const parts = header.split(/,(?=\s*[^;=]+=[^;]+)/);
  const out: CookieItem[] = [];
  for (const raw of parts) {
    const segs = raw.split(";").map((s) => s.trim());
    const [nv, ...attrs] = segs;
    if (!nv) continue;
    const eq = nv.indexOf("=");
    if (eq <= 0) continue;
    const name = nv.slice(0, eq).trim();
    const attrMap = new Map<string, string>();
    for (const a of attrs) {
      const i = a.indexOf("=");
      if (i === -1) attrMap.set(a.toLowerCase(), "1");
      else attrMap.set(a.slice(0, i).trim().toLowerCase(), a.slice(i + 1).trim());
    }
    const domain = (attrMap.get("domain") || pageHost).replace(/^\./, "");
    const thirdParty = !domain.endsWith(pageHost.replace(/^www\./, "")) &&
      !pageHost.endsWith(domain.replace(/^www\./, ""));
    out.push({
      name,
      domain,
      third_party: thirdParty,
      secure: attrMap.has("secure"),
      http_only: attrMap.has("httponly"),
      same_site: attrMap.get("samesite") ?? null,
      session: !attrMap.has("max-age") && !attrMap.has("expires"),
      category: /(_ga|gid|utm|fbp|ajs_)/i.test(name) ? "tracking" : "functional",
    });
  }
  return out;
}

function detectTrackers(html: string): TrackerItem[] {
  const lower = html.toLowerCase();
  const found: TrackerItem[] = [];
  for (const t of TRACKER_HINTS) {
    if (lower.includes(t.domain)) {
      found.push({ domain: t.domain, category: t.category, requests: 1 });
    }
  }
  return found;
}

async function fetchText(
  url: string,
  signal: AbortSignal
): Promise<{
  ok: boolean;
  status: number;
  finalUrl: string;
  html: string;
  headers: Headers;
}> {
  const res = await fetch(url, {
    method: "GET",
    redirect: "follow",
    signal,
    headers: {
      "user-agent":
        "TrustStackDPDPScanner/1.0 (+https://truststack.in; compliance audit bot)",
      accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
    },
    cache: "no-store",
  });

  const buf = Buffer.from(await res.arrayBuffer());
  const slice = buf.subarray(0, Math.min(buf.length, MAX_HTML_BYTES));
  const html = slice.toString("utf8");

  return {
    ok: res.ok,
    status: res.status,
    finalUrl: res.url || url,
    html,
    headers: res.headers,
  };
}

async function fetchPolicyExcerpt(
  url: string | null,
  signal: AbortSignal
): Promise<PolicyDoc & { analysisText: string }> {
  if (!url) {
    return {
      kind: "privacy",
      found: false,
      word_count: 0,
      excerpt: "",
      url: null,
      analysisText: "",
    };
  }
  let lastText = "";
  let lastWords: string[] = [];

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const page = await fetchText(url, signal);
      const text = stripTags(page.html);
      const words = text.split(/\s+/).filter(Boolean);
      lastText = text;
      lastWords = words;

      if (page.ok && words.length > 40) {
        return {
          kind: "privacy",
          url,
          found: true,
          word_count: words.length,
          excerpt: text.slice(0, 280),
          analysisText: text,
        };
      }
      if (signal.aborted) break;
    } catch {
      if (signal.aborted) break;
    }
  }

  return {
    kind: "privacy",
    url,
    found: false,
    word_count: lastWords.length,
    excerpt: lastText.slice(0, 280),
    analysisText: lastText,
  };
}

export type UrlScanInput = {
  url: string;
  privacy_url?: string;
  terms_url?: string;
  cookie_url?: string;
};

/** Live URL first-pass scan (HTTPS fetch + HTML signals). No external agent required. */
export async function buildUrlScanReport(input: UrlScanInput): Promise<ScanReport> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const page = await fetchText(input.url, controller.signal);
    const host = new URL(page.finalUrl).hostname;
    const https = page.finalUrl.startsWith("https:");
    const html = page.html;
    const text = stripTags(html).toLowerCase();

    const h = page.headers;
    const securityHeaders: Record<string, boolean> = {
      "strict-transport-security": Boolean(h.get("strict-transport-security")),
      "content-security-policy": Boolean(h.get("content-security-policy")),
      "x-content-type-options": Boolean(h.get("x-content-type-options")),
      "x-frame-options": Boolean(h.get("x-frame-options")),
      "referrer-policy": Boolean(h.get("referrer-policy")),
      "permissions-policy": Boolean(
        h.get("permissions-policy") || h.get("feature-policy")
      ),
    };

    const setCookie =
      typeof (h as Headers & { getSetCookie?: () => string[] }).getSetCookie ===
      "function"
        ? (h as Headers & { getSetCookie: () => string[] }).getSetCookie().join(",")
        : h.get("set-cookie");
    const cookies = parseSetCookies(setCookie, host);
    const trackers = detectTrackers(html);
    const consentBanner = CONSENT_PATTERNS.some((p) => p.test(html) || p.test(text));

    const privacyUrl =
      input.privacy_url || firstMatch(html, PRIVACY_LINK_RE, page.finalUrl);
    const termsUrl =
      input.terms_url || firstMatch(html, TERMS_LINK_RE, page.finalUrl);
    const cookieUrl =
      input.cookie_url || firstMatch(html, COOKIE_LINK_RE, page.finalUrl);

    const [privacyDoc, termsDoc, cookieDoc] = await Promise.all([
      fetchPolicyExcerpt(privacyUrl, controller.signal).then((d) => ({
        ...d,
        kind: "privacy",
      })),
      fetchPolicyExcerpt(termsUrl, controller.signal).then((d) => ({
        ...d,
        kind: "terms",
      })),
      fetchPolicyExcerpt(cookieUrl, controller.signal).then((d) => ({
        ...d,
        kind: "cookie",
      })),
    ]);

    const policyBlob = [
      privacyDoc.analysisText,
      termsDoc.analysisText,
      cookieDoc.analysisText,
      text.slice(0, 4000),
    ]
      .join("\n")
      .toLowerCase();

    const mentionsConsent = /consent|opt[- ]?in|opt[- ]?out/.test(policyBlob);
    const mentionsRights =
      /right to access|data principal|correction|erasure|withdraw/.test(
        policyBlob
      );
    const mentionsGrievance =
      /grievance|data protection officer|\bdpo\b|complaint/.test(policyBlob);
    const mentionsRetention = /retain|retention|storage period/.test(policyBlob);
    const mentionsSecurity =
      /encrypt|security measure|safeguard|reasonable security/.test(policyBlob);
    const mentionsDpdp =
      /digital personal data protection|\bdpdp\b|data protection board/.test(
        policyBlob
      );

    const findings: Finding[] = [];

    if (!page.ok) {
      findings.push(
        finding(
          "http-status",
          "availability",
          `Site returned HTTP ${page.status}`,
          "high",
          {
            evidence: page.finalUrl,
            recommendation: "Ensure the public homepage is reachable over HTTPS.",
          }
        )
      );
    } else {
      findings.push(
        finding("http-ok", "availability", "Homepage reachable", "pass", {
          evidence: `HTTP ${page.status}`,
        })
      );
    }

    if (!https) {
      findings.push(
        finding("https-missing", "security", "Site is not served over HTTPS", "critical", {
          recommendation: "Enable HTTPS for all public pages that process personal data.",
          dpdp_reference: "DPDP Act s.8 - reasonable security safeguards",
        })
      );
    } else {
      findings.push(
        finding("https-ok", "security", "HTTPS enabled", "pass")
      );
    }

    if (consentBanner) {
      findings.push(
        finding("consent-banner", "consent", "Consent / cookie banner signals detected", "pass", {
          evidence: "Page HTML matches common consent-banner patterns.",
        })
      );
    } else {
      findings.push(
        finding(
          "consent-banner-missing",
          "consent",
          "No clear consent / cookie banner detected",
          "high",
          {
            recommendation:
              "Surface a consent mechanism before non-essential cookies or trackers fire.",
            dpdp_reference: "DPDP Act s.6",
          }
        )
      );
    }

    if (privacyDoc.found) {
      findings.push(
        finding("privacy-found", "privacy_notice", "Privacy notice linked / reachable", "pass", {
          evidence: privacyDoc.url || undefined,
        })
      );
    } else {
      findings.push(
        finding(
          "privacy-missing",
          "privacy_notice",
          "Privacy notice not found from homepage signals",
          "high",
          {
            recommendation:
              "Publish a clear privacy notice and link it from the homepage footer.",
            dpdp_reference: "DPDP Act s.5",
          }
        )
      );
    }

    if (!mentionsRights && privacyDoc.found) {
      findings.push(
        finding(
          "rights-thin",
          "rights",
          "Data principal rights not clearly visible in notice excerpt",
          "medium",
          {
            recommendation: "Cover access, correction, erasure and withdrawal of consent.",
            dpdp_reference: "DPDP Act ss.11-12",
          }
        )
      );
    } else if (mentionsRights) {
      findings.push(
        finding("rights-ok", "rights", "Rights language detected in notice", "pass")
      );
    }

    if (!mentionsGrievance) {
      findings.push(
        finding(
          "grievance-missing",
          "grievance",
          "Grievance / DPO contact not detected",
          "high",
          {
            recommendation: "Publish grievance officer name, email and response timeline.",
            dpdp_reference: "DPDP Act s.13",
          }
        )
      );
    } else {
      findings.push(
        finding("grievance-ok", "grievance", "Grievance contact signals present", "pass")
      );
    }

    if (trackers.length > 0 && !consentBanner) {
      findings.push(
        finding(
          "trackers-no-consent",
          "cookies",
          "Third-party trackers referenced without a clear consent banner",
          "high",
          {
            evidence: trackers
              .slice(0, 4)
              .map((t) => t.domain)
              .join(", "),
            recommendation:
              "Gate non-essential trackers behind consent and document them in a cookie notice.",
            dpdp_reference: "DPDP Act s.6",
          }
        )
      );
    } else if (trackers.length > 0) {
      findings.push(
        finding("trackers-present", "cookies", "Third-party tracker references found", "info", {
          evidence: trackers
            .slice(0, 5)
            .map((t) => t.domain)
            .join(", "),
        })
      );
    }

    const insecureCookies = cookies.filter((c) => !c.secure && https);
    if (insecureCookies.length) {
      findings.push(
        finding(
          "cookie-insecure",
          "cookies",
          "Some cookies missing Secure flag on HTTPS site",
          "medium",
          {
            evidence: insecureCookies
              .slice(0, 3)
              .map((c) => c.name)
              .join(", "),
            recommendation: "Set Secure (and ideally HttpOnly / SameSite) on session cookies.",
          }
        )
      );
    }

    const headerScore = scoreFromFlags(Object.values(securityHeaders));
    if (headerScore < 50) {
      findings.push(
        finding(
          "headers-weak",
          "security",
          "Security response headers look incomplete",
          "medium",
          {
            recommendation:
              "Add HSTS, CSP, X-Content-Type-Options, and Referrer-Policy where appropriate.",
            dpdp_reference: "DPDP Act s.8",
          }
        )
      );
    }

    if (!mentionsDpdp && privacyDoc.found) {
      findings.push(
        finding("dpdp-mention", "framework", "No explicit DPDP Act reference detected", "info", {
          recommendation:
            "Reference the Digital Personal Data Protection Act, 2023 in your privacy notice.",
        })
      );
    }

    const catConsent = scoreFromFlags([consentBanner, mentionsConsent || consentBanner]);
    const catNotice = scoreFromFlags([
      privacyDoc.found,
      mentionsRetention || privacyDoc.word_count > 200,
      mentionsDpdp || privacyDoc.found,
    ]);
    const catRights = scoreFromFlags([mentionsRights || privacyDoc.found, mentionsGrievance]);
    const catCookies = scoreFromFlags([
      cookieDoc.found || consentBanner,
      trackers.length === 0 || consentBanner,
      insecureCookies.length === 0,
    ]);
    const catSecurity = scoreFromFlags([
      https,
      headerScore >= 50,
      mentionsSecurity || securityHeaders["strict-transport-security"],
    ]);

    const overall = Math.round(
      catConsent * 0.25 +
        catNotice * 0.25 +
        catRights * 0.25 +
        catCookies * 0.15 +
        catSecurity * 0.1
    );

    const policies: PolicyDoc[] = [privacyDoc, termsDoc, cookieDoc].map((doc) => ({
      kind: doc.kind,
      url: doc.url,
      found: doc.found,
      word_count: doc.word_count,
      excerpt: doc.excerpt,
    }));

    return {
      url: input.url,
      scanned_at: new Date().toISOString(),
      overall_score: overall,
      grade: gradeFor(overall),
      risk_level: riskFor(overall),
      summary: `Live first-pass scan of ${host}. Checked HTTPS, consent/cookie signals, linked policy pages, response headers, and common third-party trackers against DPDP-relevant public signals.`,
      categories: [
        { key: "consent", label: "Consent", score: catConsent, weight: 0.25 },
        { key: "privacy_notice", label: "Privacy notice", score: catNotice, weight: 0.25 },
        { key: "rights", label: "Rights & grievance", score: catRights, weight: 0.25 },
        { key: "cookies", label: "Cookies & trackers", score: catCookies, weight: 0.15 },
        { key: "security", label: "Security signals", score: catSecurity, weight: 0.1 },
      ],
      findings,
      cookies,
      trackers,
      policies,
      meta: {
        https,
        final_url: page.finalUrl,
        status: page.status,
        consent_banner_detected: consentBanner,
        security_headers: securityHeaders,
        cookies_total: cookies.length,
        third_party_trackers: trackers.length,
        model_mode: "rules-html",
        engine: "truststack-url",
        notes: [
          "In-app HTML/HTTPS scan (no separate scanner-agent required).",
          privacyUrl ? `Privacy candidate: ${privacyUrl}` : "No privacy link auto-detected.",
          termsUrl ? `Terms candidate: ${termsUrl}` : "No terms link auto-detected.",
          cookieUrl ? `Cookie policy candidate: ${cookieUrl}` : "No cookie policy link auto-detected.",
        ],
      },
    };
  } finally {
    clearTimeout(timeout);
  }
}
