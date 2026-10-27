/**
 * Easy read pairs for /act (and shared with /section pages, which reuse these
 * chapter + section titles). The section-card SUMMARIES already swap to plain
 * English via data-rm spans in ActBrowser, so only titles/headings/chrome are
 * mapped here. "Notice", "Consent" and "Penalties" are already mapped in home.ts.
 *
 * The official Gazette text on /section/[n] is legal text and stays exact (it is
 * hidden in easy mode anyway). Statute numbers/₹ figures are kept exact.
 */
export const PAIRS: [string, string][] = [
  // ---- hero ----
  [
    "Nine chapters, forty-four sections - each opening into a clean reading view with the official text, plain-English meaning, examples and related rules.",
    "Nine chapters, forty-four sections - each opens into a clean reading view with the official text, plain-English meaning, examples and related rules.",
  ],

  // ---- chapter titles ----
  ["Preliminary", "The basics"],
  ["Obligations of Data Fiduciary", "Duties of the organisation responsible for data"],
  ["Rights & Duties of Data Principal", "Rights and duties of the person the data is about"],
  ["Special Provisions", "Special rules"],
  ["Powers, Functions & Procedure of Board", "The Board's powers, jobs and process"],
  ["Appeal & Alternate Dispute Resolution", "Appeals and other ways to settle disputes"],
  ["Penalties & Adjudication", "Fines and decisions"],
  ["Miscellaneous", "Other matters"],

  // ---- section titles ----
  ["Short Title and Commencement", "Name and start date"],
  ["Definitions", "Key words explained"],
  ["Application of Act", "Where the Act applies"],
  ["Grounds for processing personal data", "When you can use personal data"],
  ["Certain legitimate uses", "Some allowed uses without fresh permission"],
  ["General obligations of Data Fiduciary", "Main duties of the responsible organisation"],
  ["Processing of personal data of children", "Using children's data"],
  ["Additional obligations of Significant Data Fiduciary", "Extra duties for large, high-risk organisations"],
  ["Right to access information about personal data", "Right to see your data"],
  ["Right to correction and erasure of personal data", "Right to fix or delete your data"],
  ["Right of grievance redressal", "Right to have complaints handled"],
  ["Right to nominate", "Right to name someone to act for you"],
  ["Duties of Data Principal", "Duties of the person the data is about"],
  ["Processing of personal data outside India", "Using personal data outside India"],
  ["Exemptions", "When the rules don't apply"],
  ["Establishment of Board", "Setting up the Board"],
  ["Composition and qualifications", "Who is on the Board"],
  ["Salary, allowances & term of office", "Pay and time in office"],
  ["Disqualifications", "Who cannot be a Member"],
  ["Resignation & filling of vacancy", "Leaving and replacing Members"],
  ["Proceedings of Board", "How the Board works"],
  ["Officers & employees of Board", "The Board's staff"],
  ["Members & officers to be public servants", "Members and staff count as public servants"],
  ["Powers of Chairperson", "The Chairperson's powers"],
  ["Powers & functions of Board", "The Board's powers and jobs"],
  ["Procedure to be followed by Board", "How the Board handles cases"],
  ["Appeal to Appellate Tribunal", "Appealing to the Tribunal"],
  ["Orders executable as a decree", "Enforcing orders like a court order"],
  ["Alternate dispute resolution", "Other ways to settle disputes"],
  ["Voluntary undertaking", "Settling by a promise"],
  ["Crediting penalties to the Consolidated Fund", "Where fine money goes"],
  ["Protection of action taken in good faith", "Protection for honest actions"],
  ["Power to call for information", "Power to ask for information"],
  ["Power of Central Government to issue directions", "Government's power to give directions"],
  ["Consistency with other laws", "How it fits with other laws"],
  ["Bar of jurisdiction", "Which courts cannot step in"],
  ["Laying of rules & certain notifications", "Placing rules before Parliament"],
  ["Power to amend Schedule", "Power to change the penalty Schedule"],
  ["Power to remove difficulties", "Power to fix problems"],
  ["Amendments to certain Acts", "Changes to other laws"],
];
