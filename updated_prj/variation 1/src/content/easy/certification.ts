/**
 * Easy read pairs for /certification (overview), /certification/[module] and
 * /certification/exam. Covers the overview hero, section ledes, outcomes,
 * audience, steps and FAQ (content/certification.ts).
 *
 * The module reader draws deep theory from content/curriculum.ts and the exam
 * questions come from a 224-question bank - both are instructional/test prose
 * behind the module/exam flows and rely on fallbackEasyText. Numbers (5, 10,
 * 5/5, 224, 3.5 hours) and brand/credential names stay exact.
 */
export const PAIRS: [string, string][] = [
  // ---- hero ----
  [
    "Master India's Digital Personal Data Protection Act, 2023 and the DPDP Rules 2025 through a structured, practitioner-grade curriculum - then prove it on a timed exam drawn from a comprehensive question bank and earn a verifiable certificate. Free, and built in the public interest.",
    "Learn India's Digital Personal Data Protection Act, 2023 and the DPDP Rules 2025 through a clear, professional course - then prove it on a timed exam drawn from a large question bank and earn a verifiable certificate. Free, and built in the public interest.",
  ],

  // ---- section ledes ----
  [
    "Eight modules cover the DPDP Act, 2023 and the DPDP Rules 2025 - section by section. Rather than repeat them here, study the ground through our role-based courses, then come back to sit the exam and earn your certificate.",
    "Eight modules cover the DPDP Act, 2023 and the DPDP Rules 2025 - section by section. Rather than repeat them here, learn the material through our role-based courses, then come back to sit the exam and earn your certificate.",
  ],
  [
    "Skills you carry into the role - each maps to a duty the Act actually imposes on a data fiduciary.",
    "Skills you take into the job - each matches a duty the Act actually places on the responsible organisation.",
  ],
  ["Certification FAQ", "Certification questions"],

  // ---- outcomes ----
  ["Map the data estate", "Map all your data"],
  [
    "Build a defensible inventory of personal-data flows across systems, vendors and AI tools.",
    "Build a solid list of where personal data flows across systems, partners and AI tools.",
  ],
  ["Operate lawful consent", "Run lawful permission"],
  [
    "Design notice, consent and withdrawal flows that satisfy the Act and the DPDP Rules 2025.",
    "Design notice, permission and withdrawal steps that meet the Act and the DPDP Rules 2025.",
  ],
  ["Honour data-principal rights", "Respect people's rights"],
  [
    "Run access, correction, erasure and grievance processes within statutory timelines.",
    "Run access, correction, deletion and complaint processes within the legal time limits.",
  ],
  ["Respond to a breach", "Respond to a data leak"],
  [
    "Stand up a 72-hour breach response and the evidence the Data Protection Board expects.",
    "Set up a 72-hour data-leak response and the proof the Data Protection Board expects.",
  ],

  // ---- audience ----
  ["Data Protection Officers & privacy leads", "Data Protection Officers and privacy leads"],
  ["Legal, risk & compliance teams", "Legal, risk and compliance teams"],
  ["Security & engineering", "Security and engineering"],
  ["Founders & product managers", "Founders and product managers"],

  // ---- steps ----
  [
    "Eight focused modules walk the DPDP Act, 2023 and the DPDP Rules 2025 section by section.",
    "Eight focused modules walk through the DPDP Act, 2023 and the DPDP Rules 2025 section by section.",
  ],
  [
    "Answer questions drawn at random from the question bank, under timed exam conditions.",
    "Answer questions picked at random from the question bank, under timed exam conditions.",
  ],

  // ---- FAQ ----
  ["How is it assessed?", "How is it tested?"],
  [
    "The full DPDP Act, 2023 and DPDP Rules 2025 - scope and definitions, notice and consent, legitimate uses, data-principal rights, fiduciary obligations, children's data, significant data fiduciaries, breach response, cross-border transfers and penalties.",
    "The full DPDP Act, 2023 and DPDP Rules 2025 - scope and key words, notice and permission, legitimate uses, people's rights, organisation duties, children's data, large high-risk organisations, data-leak response, sending data abroad and fines.",
  ],
  [
    "A 5-question, 10-minute exam, drawn at random from 224 questions. Answer all 5 correctly to earn the certificate - retake as often as you like.",
    "A 5-question, 10-minute exam, picked at random from 224 questions. Get all 5 right to earn the certificate - try again as often as you like.",
  ],

  // ---- exam + certificate preview copy ----
  ["Study the Practitioner track", "Study the Practitioner course"],
  [
    "A timed, 5-question exam drawn at random from the 224-question bank. Answer all 5 correctly to earn your certificate.",
    "A timed, 5-question exam picked at random from the 224-question bank. Get all 5 right to earn your certificate.",
  ],
  [
    "Here's the credential you'll earn - a verifiable, on-screen certificate. Pass the exam to unlock and claim it with your name.",
    "Here's the certificate you'll earn - a real, on-screen certificate you can check. Pass the exam to unlock it and add your name.",
  ],
  [
    "Pass the exam to unlock and claim your certificate.",
    "Pass the exam to unlock and get your certificate.",
  ],
  ["has successfully completed the certification programme", "has successfully completed the certification course"],
  ["Yes - the modules, the assessment and the certificate are free and in the public interest.", "Yes - the modules, the test and the certificate are free and for the public good."],
  [
    "It is an awareness credential issued by TrustStack's DPDP Academy, built on material mapped to the DPDP Act, 2023 and DPDP Rules 2025.",
    "It is an awareness certificate from TrustStack's DPDP Academy, built on material matched to the DPDP Act, 2023 and DPDP Rules 2025.",
  ],
];
