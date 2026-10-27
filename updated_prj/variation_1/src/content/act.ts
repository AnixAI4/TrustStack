export type ActSection = { n: number; title: string; summary: string };
export type ActChapter = {
  n: number;
  title: string;
  range: string;
  sections: ActSection[];
};

export const ACT_CHAPTERS: ActChapter[] = [
  {
    n: 1,
    title: "Preliminary",
    range: "Sections 1-3",
    sections: [
      { n: 1, title: "Short Title and Commencement", summary: "When and how the Act comes into force" },
      { n: 2, title: "Definitions", summary: "The vocabulary of the Act - Data Principal, Fiduciary, and more" },
      { n: 3, title: "Application of Act", summary: "Where the Act applies - within India and beyond" },
    ],
  },
  {
    n: 2,
    title: "Obligations of Data Fiduciary",
    range: "Sections 4-10",
    sections: [
      { n: 4, title: "Grounds for processing personal data", summary: "The lawful bases on which data may be processed" },
      { n: 5, title: "Notice", summary: "What a Data Principal must be told, and how" },
      { n: 6, title: "Consent", summary: "Free, specific, informed, unambiguous - the gold standard" },
      { n: 7, title: "Certain legitimate uses", summary: "When data may be used without fresh consent" },
      { n: 8, title: "General obligations of Data Fiduciary", summary: "Accuracy, security safeguards and breach duties" },
      { n: 9, title: "Processing of personal data of children", summary: "Verifiable parental consent and a ban on tracking" },
      { n: 10, title: "Additional obligations of Significant Data Fiduciary", summary: "DPIA, audits and a Data Protection Officer" },
    ],
  },
  {
    n: 3,
    title: "Rights & Duties of Data Principal",
    range: "Sections 11-15",
    sections: [
      { n: 11, title: "Right to access information about personal data", summary: "Know what is processed and with whom it is shared" },
      { n: 12, title: "Right to correction and erasure of personal data", summary: "Fix, update or delete your personal data" },
      { n: 13, title: "Right of grievance redressal", summary: "A readily available means to raise complaints" },
      { n: 14, title: "Right to nominate", summary: "Name someone to exercise your rights if needed" },
      { n: 15, title: "Duties of Data Principal", summary: "What the law expects of individuals in return" },
    ],
  },
  {
    n: 4,
    title: "Special Provisions",
    range: "Sections 16-17",
    sections: [
      { n: 16, title: "Processing of personal data outside India", summary: "Cross-border transfers and government restrictions" },
      { n: 17, title: "Exemptions", summary: "Where certain obligations do not apply" },
    ],
  },
  {
    n: 5,
    title: "Data Protection Board of India",
    range: "Sections 18-26",
    sections: [
      { n: 18, title: "Establishment of Board", summary: "Creating the Data Protection Board of India" },
      { n: 19, title: "Composition and qualifications", summary: "Who sits on the Board and how they are chosen" },
      { n: 20, title: "Salary, allowances & term of office", summary: "Terms of service for Members" },
      { n: 21, title: "Disqualifications", summary: "Grounds that bar appointment or continuation" },
      { n: 22, title: "Resignation & filling of vacancy", summary: "How Members leave and seats are refilled" },
      { n: 23, title: "Proceedings of Board", summary: "How the Board conducts its business" },
      { n: 24, title: "Officers & employees of Board", summary: "The Board's supporting staff" },
      { n: 25, title: "Members & officers to be public servants", summary: "Their status under the law" },
      { n: 26, title: "Powers of Chairperson", summary: "Management and administrative powers" },
    ],
  },
  {
    n: 6,
    title: "Powers, Functions & Procedure of Board",
    range: "Sections 27-28",
    sections: [
      { n: 27, title: "Powers & functions of Board", summary: "Inquiry, direction and remedial powers" },
      { n: 28, title: "Procedure to be followed by Board", summary: "How matters are heard and decided" },
    ],
  },
  {
    n: 7,
    title: "Appeal & Alternate Dispute Resolution",
    range: "Sections 29-32",
    sections: [
      { n: 29, title: "Appeal to Appellate Tribunal", summary: "Challenging the Board's orders" },
      { n: 30, title: "Orders executable as a decree", summary: "Enforcing Tribunal orders" },
      { n: 31, title: "Alternate dispute resolution", summary: "Mediation as an alternative path" },
      { n: 32, title: "Voluntary undertaking", summary: "Settling a matter by commitment" },
    ],
  },
  {
    n: 8,
    title: "Penalties & Adjudication",
    range: "Sections 33-34",
    sections: [
      { n: 33, title: "Penalties", summary: "Financial penalties up to ₹250 crore per breach" },
      { n: 34, title: "Crediting penalties to the Consolidated Fund", summary: "Where penalty sums are directed" },
    ],
  },
  {
    n: 9,
    title: "Miscellaneous",
    range: "Sections 35-44",
    sections: [
      { n: 35, title: "Protection of action taken in good faith", summary: "No suit lies for acts done in good faith under the Act" },
      { n: 36, title: "Power to call for information", summary: "The Government may require information from a Fiduciary or intermediary" },
      { n: 37, title: "Power of Central Government to issue directions", summary: "Binding directions in specified circumstances" },
      { n: 38, title: "Consistency with other laws", summary: "How the Act sits alongside other legislation" },
      { n: 39, title: "Bar of jurisdiction", summary: "Civil courts barred from matters the Board decides" },
      { n: 40, title: "Power to make rules", summary: "The basis for the DPDP Rules, 2025" },
      { n: 41, title: "Laying of rules & certain notifications", summary: "Rules and notifications placed before Parliament" },
      { n: 42, title: "Power to amend Schedule", summary: "The Government may amend the penalty Schedule" },
      { n: 43, title: "Power to remove difficulties", summary: "Removing difficulties in giving effect to the Act" },
      { n: 44, title: "Amendments to certain Acts", summary: "Consequential changes to other legislation" },
    ],
  },
];
