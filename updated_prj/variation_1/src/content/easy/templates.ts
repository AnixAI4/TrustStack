/**
 * Easy read pairs for /templates and /templates/[slug]: hero, filters, category
 * labels and the 15 template card titles + summaries (content/templates.ts).
 *
 * The "overview" and "use" lines and the document bodies
 * (template-documents.ts) are formal document text and rely on fallbackEasyText.
 * Section references stay exact. Downloads are not offered on Pilot.
 */
export const PAIRS: [string, string][] = [
  // ---- hero ----
  [
    "DPDP-aligned documents drafted to the Act and the 2025 Rules. Unlock any template to read on-screen and download Word + PDF. Pricing is confirmed at checkout.",
    "DPDP documents written to match the Act and the 2025 Rules. Unlock any template to read on-screen and download Word + PDF. Pricing is confirmed at checkout.",
  ],

  // ---- filters + category labels ----
  ["Forms & notices", "Forms and notices"],
  ["Breach", "Data leak"],

  // ---- template titles ----
  ["Consent form for data processing", "Permission form for using data"],
  ["Data subject rights request form", "Rights request form"],
  ["Consent withdrawal request", "Permission withdrawal request"],
  ["Data retention policy", "Data-keeping policy"],
  ["Cross-border transfer agreement", "Agreement for sending data abroad"],
  ["Vendor / sub-processor DPA", "Partner / sub-processor DPA"],
  ["Notice of data breach", "Notice of a data leak"],
  ["Breach response playbook", "Data-leak response plan"],

  // ---- template summaries ----
  ["Section 6-ready consent capture form with purpose and withdrawal", "Section 6-ready permission form with purpose and withdrawal"],
  ["Intake form for access, correction, erasure and nomination requests", "Intake form for access, correction, deletion and nomination requests"],
  ["A simple form letting principals withdraw consent as easily as giving it", "A simple form letting people withdraw permission as easily as giving it"],
  ["A complete website privacy policy aligned to Section 5 notice duties", "A complete website privacy policy matched to Section 5 notice duties"],
  ["Storage-limitation schedule with erasure timelines by data category", "A schedule of how long to keep and when to delete each type of data"],
  ["Disclose cookies and trackers with consent categories", "Show cookies and trackers with permission categories"],
  ["How employee personal data is collected, used and retained", "How employee personal data is collected, used and kept"],
  ["A Data Protection Impact Assessment for high-risk processing", "A Data Protection Impact Assessment for high-risk data use"],
  ["An inventory of what data you process, why, and with whom", "A list of what data you use, why, and with whom"],
  ["Controller-processor terms with security and sub-processor clauses", "Terms between data controller and handler, with security and sub-processor clauses"],
  ["Contractual safeguards for processing personal data outside India", "Contract safeguards for using personal data outside India"],
  ["Flow-down obligations for vendors handling personal data on your behalf", "Pass-down duties for partners handling personal data for you"],
  ["Templates to inform affected principals and the Data Protection Board", "Templates to tell affected people and the Data Protection Board"],
  ["A step-by-step runbook for triaging and reporting a data breach", "A step-by-step plan for sorting and reporting a data leak"],

];
