/**
 * Easy read pairs for /tools:
 *  - DPDP Scanner callout (inline JSX on the page)
 *  - Calculators  (penalty / ROI / breach - swappable labels; <option>/<select>
 *    text is skipped by the runtime so those stay as-is)
 *  - Generators   (Document Studio field + tab + action labels)
 *
 * PageHero + EasyIntro already swap via data-rm. The RiskGuide "Dee" modal prose
 * (content/risk-explainers.ts) is written plain-language by design and its residual
 * jargon is handled by fallbackEasyText, so it is not duplicated here.
 * All ₹ figures, section numbers and years are kept exact.
 */
export const PAIRS: [string, string][] = [
  // ---- DPDP Scanner callout ----
  ["Stop guessing if you're compliant - scan and find out.", "Stop guessing if you follow the law - scan and find out."],
  [
    "The DPDP Scanner inspects your website for consent, notice, cookie and security gaps against the DPDP Act, 2023 - and hands you a prioritised fix-list in minutes.",
    "The DPDP Scanner checks your website for gaps in permission, notices, cookies and security against the DPDP Act, 2023 - and gives you a priority fix-list in minutes.",
  ],

  // ---- Calculators: header ----
  ["DPDP Calculators · Section 33 ready-reckoner", "DPDP calculators · Section 33 quick guide"],
  ["Model your DPDP exposure in real numbers", "See your DPDP risk in real numbers"],
  [
    "Three quick, on-device estimators - penalty exposure, compliance ROI and breach cost. Move the sliders to see how scale, sensitivity and mitigation change the picture. Indicative figures only, never legal advice.",
    "Three quick tools that run on your device - possible fines, savings from compliance, and data-leak cost. Move the sliders to see how size, sensitivity and safeguards change the result. Rough estimates only, never legal advice.",
  ],

  // ---- Calculators: tabs ----
  ["Penalty estimator", "Fine estimator"],
  ["Compliance ROI", "Savings from compliance"],
  ["Breach cost", "Data-leak cost"],

  // ---- Calculators: slider + select labels ----
  ["Data principals affected", "People affected"],
  ["Duration unaddressed", "How long it went unfixed"],
  ["Repetitive nature", "How often it repeated"],
  ["Gain realized", "Money gained from it"],
  ["Mitigation taken", "Steps taken to reduce harm"],
  ["Type of breach", "Type of data leak"],
  ["Personal-data records", "Number of data records"],
  ["Current DPDP maturity", "How ready you are now"],
  ["Planned annual investment", "Planned yearly spend"],
  ["Records exposed", "Records leaked"],
  ["Data sensitivity", "How sensitive the data is"],
  ["Time to detect", "Time to spot it"],

  // ---- Calculators: output labels ----
  ["Estimated penalty exposure", "Estimated possible fine"],
  ["Statutory cap", "Legal maximum"],
  ["Risk exposure / yr", "Risk per year"],
  ["Residual exposure", "Risk left after action"],
  ["Return on investment", "Return on your spend"],
  ["Payback period", "Time to pay back"],
  ["Total breach cost", "Total data-leak cost"],
  ["Per-record cost", "Cost per record"],
  ["Detection & response", "Finding and responding"],
  ["Notification & legal", "Telling people and legal"],

  // ---- Calculators: disclaimers ----
  [
    "Indicative only, never legal advice. Penalties are fixed by the Data Protection Board on the factors in Section 33(2).",
    "A rough guide only, never legal advice. Fines are set by the Data Protection Board using the factors in Section 33(2).",
  ],
  [
    "Indicative model comparing breach-cost exposure against compliance investment. Not a guarantee of outcomes.",
    "A rough model comparing data-leak cost against what you spend on compliance. Not a guarantee of results.",
  ],
  [
    "Indicative model across detection, notification, legal and remediation drivers. Not legal or actuarial advice.",
    "A rough model across finding, telling people, legal and fixing costs. Not legal or insurance advice.",
  ],

  // ---- Generators: header ----
  ["Document Studio · build-ready drafts", "Document maker · ready-to-use drafts"],
  ["Generate DPDP documents in minutes", "Make DPDP documents in minutes"],
  [
    "Answer a few prompts and watch a DPDP-aligned document assemble live on screen. Preview only - download, print and copy are disabled. Assembled entirely on your device, nothing uploaded.",
    "Answer a few questions and watch a DPDP document build live on screen. Preview only - you cannot download, print or copy. All made on your device, nothing uploaded.",
  ],

  // ---- Generators: field labels ----
  ["Retention", "How long you keep it"],
  ["Withdrawal method", "How to withdraw permission"],
];
