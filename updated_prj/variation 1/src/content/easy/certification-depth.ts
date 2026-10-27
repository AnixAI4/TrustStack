import { CERT_FAQ, CERT_OUTCOMES, CERT_STEPS } from "../certification";
import { MODULES, type Lesson, type ModuleLesson } from "../curriculum";
import { PAIRS as EXISTING_PAIRS } from "./certification";

const existingNormal = new Set(EXISTING_PAIRS.map(([normal]) => normal));
const globallyOwned = new Set([
  "Certain legitimate uses",
  "Consent",
  "Consent Manager",
  "Data Principal",
  "Data Processor",
  "Data Fiduciary",
  "Data Protection Impact Assessments",
  "Reasonable security safeguards",
  "Right to erasure",
  "Significant Data Fiduciaries",
  "Significant Data Fiduciary",
  "Verifiable parental consent",
  "Verifiable parental and guardian consent",
]);

/** Longer legal phrases come first so shorter replacements cannot split them. */
const WORDING: [string, string][] = [
  ["a Data Fiduciary", "an organisation responsible for the data"],
  ["A Data Fiduciary", "An organisation responsible for the data"],
  ["a Data Processor", "a company that handles data for another"],
  ["A Data Processor", "A company that handles data for another"],
  ["a Data Principal", "a person the data is about"],
  ["A Data Principal", "A person the data is about"],
  ["notify a Data Fiduciary", "name an organisation responsible for the data"],
  ["a breach by a Data Fiduciary", "a violation by an organisation responsible for the data"],
  ["Children's-data breaches", "Violations involving children's data"],
  ["personal data breaches", "personal data leaks"],
  ["breaches", "data leaks"],
  ["processing activities undertaken", "ways the data is used"],
  ["processing undertaken", "data use carried out"],
  ["processing a child's personal data", "using a child's personal data"],
  ["processing of Indian users' data", "use of Indian users' data"],
  ["the processing", "the use of data"],
  ["only to that extent", "only for that part"],
  ["a India-based", "an India-based"],
  ["prescribed by the Rules", "required by the Rules"],
  ["voluntary undertaking to settle", "promise to settle"],
  ["Data Protection Impact Assessments", "checks of risks to people's data rights"],
  ["Data Protection Impact Assessment", "check of risks to people's data rights"],
  ["reasonable security safeguards", "reasonable security measures"],
  ["Reasonable security safeguards", "Reasonable security measures"],
  ["Significant Data Fiduciaries", "large, high-risk organisations with extra duties"],
  ["Significant Data Fiduciary", "large, high-risk organisation with extra duties"],
  ["Data Protection Board of India", "Data Protection Board of India"],
  ["Data Protection Board", "Data Protection Board"],
  ["Data Protection Officer", "Data Protection Officer"],
  ["Data Principals", "people the data is about"],
  ["Data Principal", "person the data is about"],
  ["principal's", "person's"],
  ["principals'", "people's"],
  ["principals", "people"],
  ["principal", "person"],
  ["Data Fiduciaries", "organisations responsible for the data"],
  ["Data Fiduciary", "organisation responsible for the data"],
  ["Fiduciaries", "responsible organisations"],
  ["Fiduciary", "responsible organisation"],
  ["Data Processors", "companies that handle data for another"],
  ["Data Processor", "company that handles data for another"],
  ["Processors", "data-handling companies"],
  ["Processor", "data-handling company"],
  ["Consent Managers", "services that manage permissions"],
  ["Consent Manager", "service that manages permissions"],
  ["personal data breach", "personal data leak"],
  ["Personal data breach", "Personal data leak"],
  ["breach notification", "data-leak notice"],
  ["Breach notification", "Data-leak notice"],
  ["breach-notification", "data-leak notice"],
  ["breach response", "data-leak response"],
  ["breach", "data leak"],
  ["Breach", "Data leak"],
  ["cross-border data transfers", "sending data outside India"],
  ["cross-border transfer", "sending data outside India"],
  ["Cross-border transfer", "Sending data outside India"],
  ["grievance redressal", "complaint handling"],
  ["grievance-redressal", "complaint-handling"],
  ["grievance mechanism", "complaint process"],
  ["grievance route", "complaint process"],
  ["grievances", "complaints"],
  ["grievance", "complaint"],
  ["lawful basis", "legal reason"],
  ["lawful-basis", "legal-reason"],
  ["lawful grounds", "legal reasons"],
  ["lawful ground", "legal reason"],
  ["purpose limitation", "using data only for the stated reason"],
  ["data minimisation", "collecting only the data needed"],
  ["retention limitation", "keeping data only as long as needed"],
  ["retention limits", "limits on how long data is kept"],
  ["retention periods", "periods for keeping data"],
  ["retention", "keeping data"],
  ["erasure", "deletion"],
  ["Erasure", "Deletion"],
  ["erase", "delete"],
  ["processing activities", "ways the data is used"],
  ["processing activity", "way the data is used"],
  ["processing operations", "ways the data is used"],
  ["processing personal data", "using personal data"],
  ["processing of personal data", "use of personal data"],
  ["processing", "using data"],
  ["Processing", "Using data"],
  ["withdrawal of consent", "withdrawal of permission"],
  ["withdrawing consent", "withdrawing permission"],
  ["withdraw consent", "withdraw permission"],
  ["consent request", "permission request"],
  ["consent", "permission"],
  ["Consent", "Permission"],
  ["statutory timelines", "legal time limits"],
  ["statutory timeline", "legal time limit"],
  ["operational obligations", "duties you must carry out"],
  ["heightened obligations", "extra duties"],
  ["general obligations", "general duties"],
  ["obligations", "duties"],
  ["obligation", "duty"],
  ["extra-territorial reach", "reach outside India"],
  ["extra-territorial arm", "reach outside India"],
  ["extra-territorial limb", "rule for activity outside India"],
  ["extra-territoriality", "reach outside India"],
  ["legitimate uses", "uses the law allows without fresh permission"],
  ["legitimate use", "use the law allows without fresh permission"],
  ["legitimate-use", "allowed-use"],
  ["clear affirmative action", "clear action showing agreement"],
  ["verifiable parental consent", "permission that proves it came from a parent"],
  ["verifiable consent", "permission that can be checked"],
  ["behavioural monitoring", "tracking behaviour"],
  ["algorithmic software", "automated software"],
  ["algorithmic-risk", "automated-system risk"],
  ["algorithmic risk", "automated-system risk"],
  ["personal data", "personal information"],
  ["Personal data", "Personal information"],
  ["accountability", "legal responsibility"],
  ["Accountability", "Legal responsibility"],
  ["comply with", "follow"],
  ["compliance with", "following"],
  ["compliance", "following the law"],
  ["remedial or mitigation measures", "steps to fix the problem or reduce harm"],
  ["mitigation", "steps to reduce harm"],
  ["mitigate", "reduce harm"],
  ["intimation", "notice"],
  ["intimate", "tell"],
  ["notify", "tell"],
  ["notification", "notice"],
  ["disclosed", "shared"],
  ["disclosure", "sharing"],
  ["undertake", "carry out"],
  ["establish", "set up"],
  ["cease", "stop"],
  ["furnish", "give"],
  ["obtain", "get"],
  ["prescribed", "set by the Rules"],
  ["in accordance with", "as required by"],
  ["in the event of", "if there is"],
  ["without delay", "right away"],
  ["as soon as reasonably practicable", "as soon as reasonably possible"],
  ["is entitled to", "may get"],
  ["is required to", "must"],
  ["are required to", "must"],
  ["must provide a readily available means", "must provide an easy way"],
  ["subject to", "limited by"],
  ["to that extent", "for that part"],
  ["where relevant", "when needed"],
  ["where applicable", "when it applies"],
  ["regulator", "authority"],
  ["operational detail", "practical detail"],
  ["operationalise", "put into practice"],
  ["operational", "practical"],
  ["omnibus law", "single broad law"],
  ["scaffolding", "basic rules"],
  ["delegated legislation", "supporting rules made under the Act"],
  ["exhaustive", "complete"],
  ["carve-out", "exception"],
  ["carve-outs", "exceptions"],
  ["residuary penalty", "penalty for any other breach"],
  ["residuary", "for any other breach"],
  ["voluntary undertaking", "promise made to settle a case"],
  ["alternate dispute resolution", "other ways to settle disputes"],
  ["amenable to it", "suitable for it"],
  ["aggrieved by", "harmed by or unhappy with"],
  ["executable as a decree", "enforceable like a court order"],
  ["commences", "starts"],
  ["enacted", "passed into law"],
];

const PROTECTED = /(?:₹[\d,.]+(?:\s*crore)?|\b(?:Section|Rule|Schedule)\s+[\w()&.\-]+|\b\d{1,2}\s+(?:August|January|February|March|April|May|June|July|September|October|November|December)\s+\d{4}\b|\b\d+(?:\.\d+)?%\b|\b\d+-hour\b|\b\d+ hours?\b|\b\d+ Indian languages\b)/gi;

function simplify(normal: string): string {
  const tokens: string[] = [];
  let plain = normal.replace(PROTECTED, (token) => {
    tokens.push(token);
    return `\u0000${tokens.length - 1}\u0000`;
  });

  for (const [formal, simple] of WORDING) {
    if (formal !== simple) plain = plain.split(formal).join(simple);
  }

  plain = plain
    .replace(/\bThe purpose and means of\b/g, "Why and how")
    .replace(/\bthe purpose and means of\b/g, "why and how")
    .replace(/\bfor the purpose of\b/g, "to")
    .replace(/\bFor the purposes of\b/g, "For")
    .replace(/\bThe assessment weighs factors such as\b/g, "The Government considers")
    .replace(/\bdoes not pose a risk to\b/g, "does not risk")
    .replace(/\bhas no legal effect\b/g, "does not count under the law")
    .replace(/\bcomes into force\b/g, "starts to apply")
    .replace(/\bis not absolute\b/g, "has legal limits")
    .replace(/\bfall squarely within\b/g, "clearly fit")
    .replace(/\bfalls within\b/g, "fits")
    .replace(/\bfalls outside\b/g, "is not covered by")
    .replace(/\bcarry the primary duties\b/g, "have the main legal duties")
    .replace(/\bcarries the legal duties\b/g, "has the legal duties")
    .replace(/\bis fully bound by\b/g, "must fully follow")
    .replace(/\bbound by\b/g, "required to follow")
    .replace(/\bcomes to\b/g, "contacts")
    .replace(/\bthe clock runs from awareness\b/g, "the time limit starts when you learn of it")
    .replace(/\s{2,}/g, " ")
    .trim();

  return plain.replace(/\u0000(\d+)\u0000/g, (_, index: string) => tokens[Number(index)]);
}

function lessonStrings(lesson: Lesson): string[] {
  return [
    lesson.heading,
    ...lesson.body,
    ...(lesson.bullets ?? []),
    ...(lesson.plainEnglish ? [lesson.plainEnglish] : []),
  ];
}

function moduleStrings(module: ModuleLesson): string[] {
  return [
    module.title,
    ...module.points,
    module.summary,
    module.whyItMatters,
    ...module.lessons.flatMap(lessonStrings),
    ...module.keyTerms.flatMap(({ term, definition }) => [term, definition]),
    module.scenario.title,
    module.scenario.situation,
    module.scenario.analysis,
    module.scenario.lesson,
    ...module.pitfalls,
    ...module.checklist,
    ...module.takeaways,
    ...module.quiz.flatMap(({ q, options, explanation }) => [q, ...options, explanation]),
  ];
}

const RENDERER_COPY = [
  "The theory",
  "Work through the module",
  "Lock in the key terms",
  "The exact vocabulary the Act uses. Read the term, define it in your head, then flip to check yourself.",
  "Apply it",
  "Make the call",
  "Theory sticks when you use it. Read the situation, decide what the Act requires, then reveal the verdict.",
  "Self-check",
  "Test what you've learned",
  "Answer these before you move on. They mirror the style of the certification exam - instant feedback, no pressure.",
  "Tap a card to flip it",
  "Reveal definition",
  "Tap to reveal the definition.",
  "The situation",
  "Decide what the Act requires here - then check yourself.",
  "Reveal the verdict",
  "The analysis",
  "The verdict",
  "Check your understanding",
  "3 quick questions with instant feedback - no score is saved.",
  "Not started",
  "Complete",
  "Correct. ",
  "Not quite. ",
  "You're ready to move on.",
  "Worth a quick re-read before the next module.",
  "Try again",
  "Certification overview",
  "You've finished the modules",
  "Sit the certification exam",
  "All modules",
  "Eight section-mapped modules feed one employer-verifiable DPDP credential.",
];

const RENDERER_PLAIN = new Map<string, string>([
  ["The theory", "What the law means"],
  ["Work through the module", "Learn this module"],
  ["Lock in the key terms", "Learn the key words"],
  ["The exact vocabulary the Act uses. Read the term, define it in your head, then flip to check yourself.", "These are the exact words used by the Act. Read each term, think of its meaning, then flip the card to check."],
  ["Apply it", "Use what you learned"],
  ["Make the call", "Decide what the law requires"],
  ["Theory sticks when you use it. Read the situation, decide what the Act requires, then reveal the verdict.", "Learning lasts when you use it. Read the situation, decide what the Act requires, then check the answer."],
  ["Self-check", "Quick check"],
  ["Test what you've learned", "Check what you learned"],
  ["Answer these before you move on. They mirror the style of the certification exam - instant feedback, no pressure.", "Answer these before moving on. They are like the certification exam questions, but give an answer right away and do not save a score."],
  ["Tap a card to flip it", "Tap a card to see its meaning"],
  ["Reveal definition", "Show meaning"],
  ["Tap to reveal the definition.", "Tap to show the meaning."],
  ["The situation", "What happened"],
  ["Decide what the Act requires here - then check yourself.", "Decide what the Act requires, then check your answer."],
  ["Reveal the verdict", "Show the answer"],
  ["The analysis", "Why"],
  ["The verdict", "Answer"],
  ["Check your understanding", "Check what you understand"],
  ["3 quick questions with instant feedback - no score is saved.", "3 quick questions show the answer right away. Your score is not saved."],
  ["Not started", "Not started"],
  ["Complete", "Done"],
  ["Correct. ", "Correct. "],
  ["Not quite. ", "Not correct yet. "],
  ["You're ready to move on.", "You are ready for the next module."],
  ["Worth a quick re-read before the next module.", "Read this module once more before moving on."],
  ["Try again", "Try again"],
  ["Certification overview", "Certification details"],
  ["You've finished the modules", "You finished all modules"],
  ["Sit the certification exam", "Take the certification exam"],
  ["All modules", "All modules"],
  ["Eight section-mapped modules feed one employer-verifiable DPDP credential.", "Eight modules cover the Act section by section and lead to one DPDP certificate that employers can verify."],
]);

const DEPTH_PLAIN = new Map<string, string>([
  ["Any data about an individual who is identifiable by or in relation to such data.", "Any information about a person who can be identified from that information or linked information."],
  ["Identify which data is digital or will be digitised (in scope) versus purely paper (out of scope).", "Find data that is digital now or will be made digital. The Act covers it. The Act does not cover records that stay only on paper."],
  ["The 22 official Indian languages in which a notice must be made available, alongside English.", "A notice must be available in English and in each of India's 22 official languages."],
  ["Provision of medical treatment or health services during an epidemic or threat to public health", "Giving medical care or health services during an epidemic or a threat to public health"],
  ["Safety and assistance during a disaster or breakdown of public order", "Keeping people safe and helping them during a disaster or a breakdown of public order"],
  ["Employment purposes - safeguarding the employer, providing services or benefits to employees", "Employment needs, such as protecting the employer or giving workers services and benefits"],
  ["Voluntary provision", "Information given by choice"],
  ["Using the employment ground to justify marketing or unrelated profiling of staff.", "Do not use the employment rule to market to workers or build profiles for reasons unrelated to their jobs."],
  ["It allows any purpose a business considers reasonable", "It does not allow every purpose that a business thinks is reasonable"],
  ["Only a court order can authorise it", "A court order is not the only way the law can allow it"],
  ["Deleting data that another law actually requires you to retain.", "Do not delete data while another law still requires you to keep it."],
  ["Keep decision-grade data correct, and lock the data down with real controls - encryption, access limits, logging, backups - not just a policy document.", "Keep data used for decisions correct. Protect it with encryption, access limits, logs and backups, not only a written policy."],
  ["Retention limitation", "Keep data only as long as needed"],
  ["Treating security as an IT checkbox rather than encryption, access control, logging and backups.", "Security needs real steps such as encryption, access controls, logs and backups. A checked box is not enough."],
  ["Put a valid, security-bearing contract in place with every processor.", "Use a valid contract with every data-handling company. The contract must require proper security."],
  ["Forgetting persons with disability who have a lawful guardian.", "Remember people with a disability who have a legal guardian."],
  ["Build an age-assurance step that does real due diligence, not a self-declared checkbox.", "Use a careful age check. Do not rely only on a box where users state their own age."],
  ["Remove all behavioural tracking and targeted advertising from flows reachable by children.", "Do not track children's behaviour or show them ads aimed at a specific person."],
  ["Appoint a Data Protection Officer based in India, answerable to the board", "Appoint a Data Protection Officer in India who reports to the organisation's board"],
  ["Big-platform duties: a real DPO in India who reports to the top, outside audits, and impact assessments before you ship risky features.", "Large, high-risk platforms need a DPO in India who reports to senior leaders. They also need outside audits and risk checks before releasing risky features."],
  ["Expect yearly DPIAs and audits, a duty to check your algorithms aren't harming users, and possible localisation of certain sensitive data.", "Expect yearly data-risk checks and audits. Check that automated systems do not harm users. The Rules may also require some sensitive data to stay in India."],
  ["Algorithmic risk verification", "Check risks from automated systems"],
  ["Engage an independent data auditor and schedule periodic audits.", "Hire an independent data auditor and arrange regular audits."],
  ["The Government notifies SDFs based on data volume, sensitivity and systemic risk - it is not self-selected.", "The Government names large, high-risk organisations. It considers how much data they use, how sensitive it is and the wider risk. An organisation cannot choose this status for itself."],
  ["Two caveats: sector-specific laws with stricter localisation (for example in banking) continue to apply, and an SDF may face additional localisation duties for specified categories of data under the Rules.", "Two limits apply. Stricter industry laws, such as banking rules, still apply. The Rules may also require a large, high-risk organisation to keep certain types of data in India."],
  ["A fintech's security team detects unauthorised access to a customer database at 9pm on a Friday. Leadership wants to wait until Monday to 'understand the full picture' before telling anyone.", "At 9pm on Friday, a finance company's security team finds that someone entered a customer database without permission. Leaders want to wait until Monday before telling anyone."],
  ["Thinking penalties are criminal - they are civil and financial, credited to the Consolidated Fund.", "The penalties are not criminal. They are civil fines paid into the Consolidated Fund."],
  ["Claim a verifiable certificate naming you a Certified DPDP Practitioner.", "Get a certificate that others can check and that names you as a Certified DPDP Practitioner."],
]);

const overviewStrings = [
  ...CERT_OUTCOMES.flatMap(({ title, desc }) => [title, desc]),
  ...CERT_STEPS.flatMap(({ title, desc }) => [title, desc]),
  ...CERT_FAQ.flatMap(({ q, a }) => [q, a]),
];

/**
 * Exact normal-to-plain pairs for the certification overview and all eight
 * module readers. The separate exam bank and dpdpa-questions are not imported.
 */
export const PAIRS: [string, string][] = Array.from(
  new Set([...overviewStrings, ...MODULES.flatMap(moduleStrings), ...RENDERER_COPY])
)
  .filter((normal) => !existingNormal.has(normal))
  .filter((normal) => !globallyOwned.has(normal))
  .map((normal): [string, string] => [
    normal,
    DEPTH_PLAIN.get(normal) ?? RENDERER_PLAIN.get(normal) ?? simplify(normal),
  ])
  .filter(([normal, plain]) => normal !== plain);