export type RuleCat =
  | "general"
  | "consent"
  | "breach"
  | "children"
  | "board"
  | "transfers";

export type Rule = {
  n: number;
  title: string;
  summary: string;
  plainEnglish: string;
  highlights: string[];
  mapsTo: string;
  cat: RuleCat;
};

export const RULE_FILTERS: { key: RuleCat | "all"; label: string }[] = [
  { key: "all", label: "All rules" },
  { key: "general", label: "General" },
  { key: "consent", label: "Consent & Notice" },
  { key: "breach", label: "Breach & Security" },
  { key: "children", label: "Children" },
  { key: "board", label: "The Board" },
  { key: "transfers", label: "Transfers" },
];

export const RULES: Rule[] = [
  {
    n: 1,
    title: "Short title and commencement",
    summary: "Official name of the Rules and when each rule comes into force",
    plainEnglish:
      "These are formally called the Digital Personal Data Protection Rules, 2025. Rules 1, 2, and 17-21 take effect immediately on publication. Rule 4 (Consent Managers) starts one year later. Rules 3, 5-16, 22, and 23 start eighteen months after publication - giving organisations time to prepare.",
    highlights: [
      "Rules 1, 2, 17-21: effective on publication (13 Nov 2025)",
      "Rule 4 (Consent Managers): effective 13 Nov 2026",
      "Rules 3, 5-16, 22, 23: effective 13 May 2027",
    ],
    mapsTo: "Section 40",
    cat: "general",
  },
  {
    n: 2,
    title: "Definitions",
    summary: "Key terms used throughout the Rules and how they link to the Act",
    plainEnglish:
      "This rule defines four terms used in the Rules: “Act” (the DPDP Act 2023), “techno-legal measures” (digital processes for the Board and appeals), “user account” (any online profile or handle a person uses with a Fiduciary), and “verifiable consent” (parental or guardian consent under Rules 10-11). Any other term already defined in the Act keeps its Act meaning.",
    highlights: [
      "“Verifiable consent” points to Rules 10 and 11",
      "“User account” covers profiles, handles, email, and mobile numbers",
      "Undefined terms inherit definitions from the DPDP Act",
    ],
    mapsTo: "Section 40",
    cat: "general",
  },
  {
    n: 3,
    title: "Notice given by Data Fiduciary",
    summary: "Itemised, plain-language notice with the means to withdraw consent",
    plainEnglish:
      "Before collecting data, a Fiduciary must give a standalone notice in clear language. It must list exactly what data is collected, why, and what product or service it enables. It must also tell people how to withdraw consent as easily as they gave it, exercise their rights, and complain to the Board.",
    highlights: [
      "Notice must stand on its own - not buried in terms and conditions",
      "Minimum: itemised data list + specific purpose + goods/services description",
      "Must include a link and other ways to withdraw consent, exercise rights, and complain",
    ],
    mapsTo: "Section 5",
    cat: "consent",
  },
  {
    n: 4,
    title: "Registration of Consent Managers",
    summary: "Eligibility, obligations and the duties of a registered Consent Manager",
    plainEnglish:
      "Consent Managers help people give, review, and withdraw consent across platforms. To register, a company must meet First Schedule conditions (Indian incorporation, ₹2 crore net worth, sound management, etc.). The Board can register, reject, suspend, or cancel registrations and require information.",
    highlights: [
      "Apply to the Board with particulars published on its website",
      "Must meet First Schedule Part A conditions and Part B obligations",
      "Board may suspend or cancel registration after hearing the Manager",
    ],
    mapsTo: "Section 6",
    cat: "consent",
  },
  {
    n: 5,
    title: "Processing for State subsidies & services",
    summary: "Conditions for legitimate processing by the State and its instrumentalities",
    plainEnglish:
      "When government bodies process personal data to provide subsidies, benefits, services, certificates, licences, or permits, they must follow standards in the Second Schedule. This covers processing under law, under policy, or using public funds from consolidated or public accounts.",
    highlights: [
      "Applies to State and its instrumentalities",
      "Covers subsidies, benefits, services, certificates, licences, and permits",
      "Must follow Second Schedule standards",
    ],
    mapsTo: "Section 7",
    cat: "consent",
  },
  {
    n: 6,
    title: "Reasonable security safeguards",
    summary: "Encryption, access control, logging and backups expected of a Fiduciary",
    plainEnglish:
      "Every Fiduciary must protect personal data with reasonable safeguards - at minimum encryption or tokenisation, access controls, audit logs, backups for continuity, one-year log retention, contractual security clauses with Processors, and organisational measures. This applies to data they hold and processing done on their behalf.",
    highlights: [
      "Minimum: encryption, access control, logging, backups, contracts with Processors",
      "Retain logs and personal data for one year unless law requires otherwise",
      "Covers processing by Data Processors on the Fiduciary's behalf",
    ],
    mapsTo: "Section 8",
    cat: "breach",
  },
  {
    n: 7,
    title: "Intimation of a personal data breach",
    summary: "What to tell affected principals and the Board, and how quickly",
    plainEnglish:
      "When a breach happens, the Fiduciary must promptly tell each affected person what was compromised, what harm may result, what the Fiduciary has done, and what the person should do. The Board must also be informed within 72 hours with details of the breach, impact, and remedial steps.",
    highlights: [
      "Notify affected Data Principals with concise, clear information",
      "Inform the Board within 72 hours of becoming aware",
      "Include nature of breach, likely consequences, and remedial measures",
    ],
    mapsTo: "Section 8(6)",
    cat: "breach",
  },
  {
    n: 8,
    title: "Time period for erasure of data",
    summary: "When personal data must be deleted once its purpose is served",
    plainEnglish:
      "Once the purpose for which data was collected is no longer being served - for example, when consent is withdrawn or the retention period ends - the Fiduciary must erase the data within a reasonable time. If erasure is not feasible, the Fiduciary must take reasonable steps to ensure the data is not used further.",
    highlights: [
      "Erase data when the specified purpose is no longer served",
      "Reasonable time limit applies after purpose ends or consent is withdrawn",
      "If erasure is impossible, prevent further use of the data",
    ],
    mapsTo: "Section 8(7)",
    cat: "breach",
  },
  {
    n: 9,
    title: "Contact information of DPO",
    summary: "Publishing a clear point of contact for data-protection queries",
    plainEnglish:
      "Every Fiduciary must publish contact details of a person who can answer questions about how personal data is processed. This must be prominently available on the Fiduciary's website or app so Data Principals know who to reach.",
    highlights: [
      "Publish name and contact details on website or app",
      "Contact person answers questions about data processing",
      "Must be prominently displayed",
    ],
    mapsTo: "Section 8(9)",
    cat: "breach",
  },
  {
    n: 10,
    title: "Verifiable parental consent",
    summary: "Reliable methods to confirm a parent's identity and age before processing",
    plainEnglish:
      "Before processing a child's data, a Fiduciary must get verifiable consent from a parent (an adult aged 18+). Verification can use identity details already held by the Fiduciary, details voluntarily provided, or a virtual token from a government-authorised entity or Digital Locker.",
    highlights: [
      "Parent must be verified as an identifiable adult (18+)",
      "Accept reliable existing records, voluntary ID, or government-issued tokens",
      "Digital Locker services count as authorised verification",
    ],
    mapsTo: "Section 9",
    cat: "children",
  },
  {
    n: 11,
    title: "Verifiable consent for persons with disability",
    summary: "How lawful guardians give consent on behalf of persons with disability",
    plainEnglish:
      "When a lawful guardian consents on behalf of a person with disability, the Fiduciary must verify the guardian was appointed by a court, designated authority, or local level committee under the Rights of Persons with Disabilities Act or the National Trust Act.",
    highlights: [
      "Guardian must be court-appointed or designated under applicable law",
      "Covers RPwD Act 2016 and National Trust Act 1999 guardianship",
      "Fiduciary must exercise due diligence on guardian status",
    ],
    mapsTo: "Section 9",
    cat: "children",
  },
  {
    n: 12,
    title: "Exemptions for certain child-data processing",
    summary: "Classes of Fiduciaries and purposes given limited relief",
    plainEnglish:
      "Certain classes of Fiduciaries listed in Fourth Schedule Part A, and certain purposes in Part B, are exempt from the general ban on tracking, behavioural monitoring, and targeted advertising for children. Exemptions apply only subject to conditions in the Schedule.",
    highlights: [
      "Part A: exempt Fiduciary classes (e.g. healthcare, education)",
      "Part B: exempt purposes with conditions",
      "Does not remove verifiable parental consent requirement under Rule 10",
    ],
    mapsTo: "Section 9(5)",
    cat: "children",
  },
  {
    n: 13,
    title: "Additional obligations of Significant Data Fiduciaries",
    summary: "DPIA, annual audit and algorithmic-risk diligence",
    plainEnglish:
      "Significant Data Fiduciaries must conduct a Data Protection Impact Assessment and audit every 12 months, file reports with the Board, review algorithmic systems for risks to people's rights, and comply with any government restrictions on transferring specified categories of data outside India.",
    highlights: [
      "Annual DPIA and audit with Board reporting",
      "Algorithmic measures must not pose risk to Data Principal rights",
      "Certain data categories may be restricted from cross-border transfer",
    ],
    mapsTo: "Section 10",
    cat: "breach",
  },
  {
    n: 14,
    title: "Exercising the rights of Data Principals",
    summary: "How to make access, correction, erasure and grievance requests",
    plainEnglish:
      "Fiduciaries and Consent Managers must publish how people can exercise their rights (access, correction, erasure, nomination, grievance). Requests go to the Fiduciary that holds the consent. Grievance systems must respond within 90 days, with technical measures to meet that deadline.",
    highlights: [
      "Publish means to exercise rights on website or app",
      "Grievance redressal within 90 days",
      "Data Principals may nominate someone to exercise rights on their behalf",
    ],
    mapsTo: "Sections 11-14",
    cat: "consent",
  },
  {
    n: 15,
    title: "Processing of personal data outside India",
    summary: "Conditions and restrictions on cross-border data flows",
    plainEnglish:
      "Personal data may be transferred outside India, but only if the Fiduciary meets requirements the Central Government may specify by order - particularly when making data available to foreign governments, persons, or entities under their control.",
    highlights: [
      "Cross-border transfer is permitted subject to government orders",
      "Government may impose general or special requirements",
      "Extra scrutiny for transfers to foreign States and their agencies",
    ],
    mapsTo: "Section 16",
    cat: "transfers",
  },
  {
    n: 16,
    title: "Exemption for research & statistics",
    summary: "Relief for research, archiving and statistical purposes, with standards",
    plainEnglish:
      "The DPDP Act does not apply to personal data processed purely for research, archiving, or statistical purposes - provided processing follows standards in the Second Schedule. This enables academic and statistical work without full Act compliance burdens.",
    highlights: [
      "Act exempt for research, archiving, and statistical processing",
      "Must follow Second Schedule standards",
      "Processing must be necessary for the stated purpose",
    ],
    mapsTo: "Section 17(2)",
    cat: "transfers",
  },
  {
    n: 17,
    title: "Appointment of Chairperson & Members",
    summary: "Search-cum-selection process for the Data Protection Board",
    plainEnglish:
      "The Central Government appoints the Board's Chairperson and Members through search-cum-selection committees. The Chairperson committee is chaired by the Cabinet Secretary; the Member committee by the MeitY Secretary. Each includes legal and tech experts. Government appoints from committee recommendations.",
    highlights: [
      "Cabinet Secretary chairs Chairperson selection committee",
      "MeitY Secretary chairs Member selection committee",
      "Two domain experts on each committee",
    ],
    mapsTo: "Section 19",
    cat: "board",
  },
  {
    n: 18,
    title: "Salary, allowances and service terms",
    summary: "Compensation and conditions for Board Chairperson and Members",
    plainEnglish:
      "The Chairperson and Members receive salary, allowances, and other terms of service as specified in the Fifth Schedule. This includes pay matrix levels, leave, travel, and conduct rules aligned with senior Central Government officers.",
    highlights: [
      "Terms set out in Fifth Schedule",
      "Includes salary, allowances, leave, and travel",
      "Conduct rules apply as for Group A Central Government officers",
    ],
    mapsTo: "Section 20",
    cat: "board",
  },
  {
    n: 19,
    title: "Board meetings and proceedings",
    summary: "How the Board convenes, decides matters, and completes inquiries",
    plainEnglish:
      "The Chairperson sets meeting dates and agendas. One-third of Members form a quorum. Decisions are by majority; the Chairperson has a casting vote. Members with conflicts must recuse. In emergencies the Chairperson may act alone with Board ratification. Inquiries must finish within six months (extendable by three months).",
    highlights: [
      "One-third membership quorum; majority voting with casting vote",
      "Conflicted Members must not vote",
      "Inquiries completed within 6 months (extendable by 3 months)",
    ],
    mapsTo: "Section 28",
    cat: "board",
  },
  {
    n: 20,
    title: "The Board as a digital office",
    summary: "Tech-driven, paperless functioning of the Board and proceedings",
    plainEnglish:
      "The Board operates as a digital office. It can use techno-legal measures so proceedings do not require anyone's physical presence - while still retaining powers to summon witnesses and examine them on oath.",
    highlights: [
      "Board functions as a fully digital office",
      "Techno-legal measures replace physical presence where possible",
      "Retains power to summon and examine on oath",
    ],
    mapsTo: "Section 28",
    cat: "board",
  },
  {
    n: 21,
    title: "Terms & conditions of Board staff",
    summary: "Appointment and service conditions for Board officers and employees",
    plainEnglish:
      "The Board may appoint officers and employees with Central Government approval. Their terms of service - appointment classes, gratuity, medical, leave, and conduct - are set out in the Sixth Schedule, largely mirroring Central Government service rules.",
    highlights: [
      "Board appoints staff with Central Government approval",
      "Sixth Schedule governs service terms",
      "Includes deputation, gratuity, medical, and leave rules",
    ],
    mapsTo: "Section 20",
    cat: "board",
  },
  {
    n: 22,
    title: "Appeal to the Appellate Tribunal",
    summary: "The digital process for appealing the Board's decisions",
    plainEnglish:
      "Anyone aggrieved by a Board order may appeal digitally to the Appellate Tribunal. Appeals carry a fee (same as TRAI appeals, waivable by the Tribunal Chairperson) paid via UPI or RBI-authorised systems. The Tribunal also functions as a digital office guided by natural justice.",
    highlights: [
      "Appeals filed in digital form",
      "Fee payable digitally via UPI or authorised payment systems",
      "Tribunal operates as a digital office with natural justice principles",
    ],
    mapsTo: "Section 29",
    cat: "board",
  },
  {
    n: 23,
    title: "Calling for information",
    summary: "What the Government may require from a Fiduciary or intermediary",
    plainEnglish:
      "For purposes listed in the Seventh Schedule - national security, lawful government functions, and SDF assessment - authorised government officers may require Fiduciaries or intermediaries to furnish information within a specified period. In sensitive cases, the Fiduciary may be barred from disclosing the request without written permission.",
    highlights: [
      "Government may call for information for Seventh Schedule purposes",
      "Includes sovereignty, security, and SDF assessment purposes",
      "Non-disclosure orders possible for sensitive national-security requests",
    ],
    mapsTo: "Section 36",
    cat: "board",
  },
];

export function getRule(n: number): Rule | undefined {
  return RULES.find((r) => r.n === n);
}
