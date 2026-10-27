/**
 * Easy read pairs for /cases and /cases/[slug].
 *
 * The case entries are long-form editorial narrative already written for general
 * readers, so the essays (summary blocks / whyItMatters / takeaways / question /
 * holding) are left to fallbackEasyText for residual jargon. Case names, courts,
 * citations and Article/Section references stay exact. Here we map the list-page
 * filters + chrome, the hero, and the detail-page disclaimer.
 */
export const PAIRS: [string, string][] = [
  // ---- hero ----
  [
    "India's data-protection framework rests on decades of privacy jurisprudence. These are the judgments worth knowing - distilled to the issue, the holding and why it matters.",
    "India's data-protection system is built on decades of privacy court rulings. These are the judgments worth knowing - boiled down to the issue, the ruling and why it matters.",
  ],

  // ---- filters / category labels ----
  ["Consent & confidentiality", "Permission & confidentiality"],
  ["Surveillance & the state", "State surveillance"],

  // ---- detail-page disclaimer ----
  [
    "This summary is an editorial explainer for general understanding, not legal advice. For any compliance or litigation decision, read the full judgment and consult a qualified lawyer.",
    "This summary is an easy explainer for general understanding, not legal advice. For any compliance or court decision, read the full judgment and consult a qualified lawyer.",
  ],
  [
    "Verified full judgment - open the complete text to read it in the Court's own words.",
    "Checked full judgment - open the complete text to read it in the Court's own words.",
  ],
];
