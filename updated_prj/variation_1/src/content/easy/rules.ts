/**
 * Easy read pairs for /rules and /rules/[n]:
 * hero, filter chips, RulesBrowser chrome, the 23 rule titles + summaries, and
 * the rule-detail chrome (content/rules.ts).
 *
 * Rule-detail hero summaries swap via <Swap> (data-rm) and the official gazette
 * text is hidden in easy mode. plainEnglish/highlights are authored plain, so
 * residual jargon is handled by fallbackEasyText. "Definitions" and "Processing
 * of personal data outside India" are already mapped in act.ts. Statute refs,
 * ₹ figures, dates and G.S.R. numbers stay exact.
 */
export const PAIRS: [string, string][] = [
  // ---- hero ----
  [
    "The operational detail of the Act - every rule shown beside the section it gives effect to, so you always know how the law works in practice.",
    "The practical detail of the Act - every rule shown beside the section it supports, so you always know how the law works in practice.",
  ],

  // ---- filter chips ----
  ["Consent & Notice", "Permission & Notice"],
  ["Breach & Security", "Data leaks & Security"],
  ["Transfers", "Data transfers"],

  // ---- RulesBrowser chrome ----
  [
    "Each card is one of the 23 notified rules. Click a card for a plain-English summary, key points, and the official gazette text - or download the full PDF above.",
    "Each card is one of the 23 official rules. Click a card for a plain-English summary, key points, and the official gazette text - or download the full PDF above.",
  ],
  [
    "The mapping view puts the statute and the 2025 Rules side by side, so nothing is lost in translation.",
    "The mapping view puts the law and the 2025 Rules side by side, so nothing is lost.",
  ],

  // ---- rule titles ----
  ["Short title and commencement", "Name and start dates"],
  ["Notice given by Data Fiduciary", "Notice from the responsible organisation"],
  ["Registration of Consent Managers", "Registering Consent Managers"],
  ["Processing for State subsidies & services", "Using data for government benefits and services"],
  ["Reasonable security safeguards", "Sensible security measures"],
  ["Intimation of a personal data breach", "Reporting a data leak"],
  ["Time period for erasure of data", "When data must be deleted"],
  ["Contact information of DPO", "How to contact the data officer"],
  ["Verifiable parental consent", "Confirmed parent permission"],
  ["Verifiable consent for persons with disability", "Confirmed permission for persons with disability"],
  ["Exemptions for certain child-data processing", "Exceptions for some children's-data uses"],
  ["Additional obligations of Significant Data Fiduciaries", "Extra duties for large, high-risk organisations"],
  ["Exercising the rights of Data Principals", "Using your rights"],
  ["Exemption for research & statistics", "Exception for research and statistics"],
  ["Appointment of Chairperson & Members", "Choosing the Chairperson and Members"],
  ["Salary, allowances and service terms", "Pay and service terms"],
  ["Board meetings and proceedings", "Board meetings and decisions"],
  ["The Board as a digital office", "The Board works digitally"],
  ["Terms & conditions of Board staff", "Terms for Board staff"],
  ["Appeal to the Appellate Tribunal", "Appealing to the Tribunal"],
  ["Calling for information", "Asking for information"],

  // ---- rule summaries ----
  ["Official name of the Rules and when each rule comes into force", "The official name of the Rules and when each one starts"],
  ["Key terms used throughout the Rules and how they link to the Act", "Key words used in the Rules and how they link to the Act"],
  ["Itemised, plain-language notice with the means to withdraw consent", "A clear, itemised notice with a way to withdraw permission"],
  ["Eligibility, obligations and the duties of a registered Consent Manager", "Who can be a Consent Manager and what they must do"],
  ["Conditions for legitimate processing by the State and its instrumentalities", "When the government may use data for benefits and services"],
  ["Encryption, access control, logging and backups expected of a Fiduciary", "Encryption, access control, logging and backups the organisation must have"],
  ["What to tell affected principals and the Board, and how quickly", "What to tell affected people and the Board, and how quickly"],
  ["When personal data must be deleted once its purpose is served", "When personal data must be deleted once its reason is over"],
  ["Publishing a clear point of contact for data-protection queries", "Publishing a clear contact for data-protection questions"],
  ["Reliable methods to confirm a parent's identity and age before processing", "Reliable ways to confirm a parent's identity and age before using a child's data"],
  ["How lawful guardians give consent on behalf of persons with disability", "How legal guardians give permission for persons with disability"],
  ["Classes of Fiduciaries and purposes given limited relief", "Types of organisations and uses given limited relief"],
  ["DPIA, annual audit and algorithmic-risk diligence", "Impact checks, yearly audits and reviewing AI risks"],
  ["How to make access, correction, erasure and grievance requests", "How to ask to see, fix or delete data, or complain"],
  ["Conditions and restrictions on cross-border data flows", "Rules and limits on sending data outside India"],
  ["Relief for research, archiving and statistical purposes, with standards", "Relief for research, archiving and statistics, with standards"],
  ["Search-cum-selection process for the Data Protection Board", "How Board members are searched for and chosen"],
  ["Compensation and conditions for Board Chairperson and Members", "Pay and conditions for the Board Chairperson and Members"],
  ["How the Board convenes, decides matters, and completes inquiries", "How the Board meets, decides and finishes inquiries"],
  ["Tech-driven, paperless functioning of the Board and proceedings", "The Board runs digitally and paper-free"],
  ["Appointment and service conditions for Board officers and employees", "How Board staff are hired and their service terms"],
  ["The digital process for appealing the Board's decisions", "The digital way to appeal the Board's decisions"],
  ["What the Government may require from a Fiduciary or intermediary", "What the Government may ask from an organisation or intermediary"],

  // ---- rule-detail chrome ----
  ["This rule gives effect to", "This rule puts into practice"],
  ["Read the parent section", "Read the main section"],
];
