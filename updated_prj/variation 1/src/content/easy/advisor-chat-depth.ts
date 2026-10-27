import { SECTOR_ADVICE, READINESS_STAGES } from "../industry-advisor";
import { LEX_KB } from "../lexbot-kb";
import { RISK_EXPLAINERS } from "../risk-explainers";
import { RANKS, TRAIL } from "../trail";

type Pair = [string, string];

const EXACT: Record<string, string> = {
  "DPDP Industry Advisor": "DPDP guide for your industry",
  "Your result": "Your result",
  "What the law expects": "What the law asks you to do",
  "What's at stake": "What could happen",
  "Where to start": "What to do first",
  "Ready to move beyond the briefing?": "Ready to take the next step?",
  "See the services": "See our services",
  "Check your readiness": "Check how ready you are",
  "Not sure yet": "I don't have that answer yet",
  "I couldn't find that. Try asking about consent, notice, penalties, breach, children, rights, cross-border transfers, the Board, or who must comply.":
    "I couldn't find that. Ask about permission, notices, fines, data leaks, children, rights, sending data abroad, the Board, or who must follow the law.",
  "DPDP assistant · on-device": "DPDP helper · runs on your device",
  "Ask about the DPDP Act…": "Ask about the DPDP Act…",
  "What is valid consent?": "What counts as valid permission?",
  "Penalties for a breach?": "What are the fines for a data leak?",
  "Children's data rules": "Rules for children's data",
  "Who must comply?": "Who must follow the law?",
  "Your DPDP guide · plain-English help": "Your DPDP guide · simple help",
  "In short": "The short answer",
  "Need an example?": "Show me an example",
  "See the full 7D framework": "See the full 7D guide",
  "Foundations of the DPDP Act": "DPDP Act basics",
  "Scope, key definitions and the people the law cares about.": "Who the law covers, its key terms, and the people it protects.",
  "Why the Act exists and who it binds": "Why the Act exists and who must follow it",
  "Data Principal, Fiduciary and Processor": "The person, responsible organisation, and data-handling company",
  "What counts as digital personal data": "What digital personal data means",
  "Lawful grounds, valid consent and the 2025 Rules.": "Legal reasons, valid permission, and the 2025 Rules.",
  "Sections 5-7 and legitimate uses": "Sections 5-7 and uses allowed by law",
  "What makes consent valid and withdrawable": "What makes permission valid and easy to take back",
  "Consent Managers under the Rules": "Services that manage permission under the Rules",
  "Rights of the Data Principal": "Rights of the person the data is about",
  "Access, correction, erasure, nomination and grievance.": "Seeing, correcting and deleting data, naming someone, and making a complaint.",
  "The full set of Data Principal rights": "All rights of the person the data is about",
  "Handling requests within deadline": "Answering requests by the deadline",
  "Grievance redressal mechanics": "How complaint handling works",
  "Obligations & breach response": "Duties and data-leak response",
  "Security safeguards and 72-hour breach reporting.": "Security protections and 72-hour data-leak reporting.",
  "Reasonable security safeguards": "Sensible security protections",
  "Data minimisation and retention": "Collecting only what is needed and deciding how long to keep it",
  "Breach intimation to Board & principals": "Telling the Board and affected people about a data leak",
  "Children & significant fiduciaries": "Children and large, high-risk organisations",
  "Section 9, Section 10, DPOs and DPIAs.": "Section 9, Section 10, Data Protection Officers and privacy risk checks.",
  "Verifiable parental consent": "Confirmed permission from a parent",
  "Who is a Significant Data Fiduciary": "Who is a large, high-risk organisation with extra duties",
  "DPO, audits and impact assessments": "Data Protection Officers, audits and privacy risk checks",
  "The Board, penalties & appeals": "The Board, fines and appeals",
  "Enforcement end to end and the road to appeal.": "How the law is enforced and how to appeal.",
  "Graded penalties up to ₹250 crore": "Different fines up to ₹250 crore",
  "Appeals to the TDSAT": "Appeals to TDSAT",
  "Just getting started": "Starting now",
  "Putting it into practice": "Using what you know",
  "Deep, applied knowledge": "Strong practical knowledge",
  "Certification-ready": "Ready for certification",
  "Process client data only on their documented instructions, with security you can actually evidence.":
    "Use client data only as their written instructions allow. Keep clear proof that your security works.",
  "You're aware and exploring - the job now is to convert that into a documented, evidence-backed programme you can actually show an auditor or a client.":
    "You know the issue and are learning more. Now write down your plan and keep proof that you can show an auditor or client.",
  "Tax records expose income, assets and transactions in fine detail. Even with the State's exemptions, DPDP expects lawful, purpose-limited handling and real security - and citizens increasingly expect transparency about how their data is used.":
    "Tax records show income, assets and transactions in detail. Even where the State has exemptions, DPDP expects legal use for a clear purpose and strong security. People also expect clear information about how their data is used.",
  "You're right on time - honestly, most teams in your sector are exactly here, and starting clean beats retrofitting a rushed programme after a notice lands.":
    "This is a good time to start. Many teams in your industry are at the same point. It is better to build the work properly now than rush to fix it after receiving a notice.",
  "Loyalty programmes hoover up rich personal data in exchange for perks, and DPDP is fine with that - IF you're clear about the purpose and don't quietly repurpose or resell it. The real risk is mission creep: using CRM data for things the customer never actually agreed to.":
    "Loyalty programmes collect detailed personal data in return for benefits. DPDP allows this when you clearly state why you need the data and do not quietly reuse or sell it. The main risk is using CRM data for something the customer did not agree to.",
  "Opt-in before analytics cookies and promotional messages - with an opt-out that genuinely works.":
    "Ask people to choose yes before using analytics cookies or sending promotional messages. Give them a working way to choose no later.",
  "Use purchase data for what the customer agreed to, not silent resale or unrelated targeting.":
    "Use purchase data only for what the customer agreed to. Do not quietly sell it or use it for unrelated targeting.",
  "Holdings and portfolio data reveal a person's wealth, risk appetite and intentions - sensitive by any measure. DPDP requires you to justify every use, secure it strongly, and honour a client's right to access or erase it when they walk away.":
    "Holdings and portfolio data show a person's wealth, risk choices and plans. DPDP requires a reason for each use, strong security, and a way for clients to access or delete their data when they leave.",
  "A leaked account dump must be reported to the Data Protection Board and to affected customers, quickly and completely.":
    "You must quickly give the Data Protection Board and affected customers a full report when account data leaks.",
  "Consent you can prove": "Permission you can prove",
  "Vendor & GenAI accountability": "Responsibility for outside partners and GenAI",
  "Up to ₹250 crore for failing to safeguard financial data - on top of RBI/SEBI action.":
    "Up to ₹250 crore for failing to keep financial data safe - in addition to RBI/SEBI action.",
  "A collections vendor leaks 40,000 loan records. Under DPDP the penalty lands on you - the fiduciary - not just the vendor.":
    "A collections company leaks 40,000 loan records. Under DPDP, the fine applies to your organisation - the responsible organisation - not only to the outside company.",
  "Put every vendor under a DPDP processing contract":
    "Put every outside partner under a DPDP data-handling contract",
  "Grades and assessments are sensitive to a child's future. DPDP expects you to limit who can see them, use them only for education, and resist the temptation to feed them into profiling or 'edu-scoring' that quietly follows the student around.":
    "Grades and assessments can affect a child's future. Limit who can see them and use them only for education. Do not use them for profiles or 'edu-scoring' that follows the student.",
  "Attendance looks harmless, but it's a location-and-behaviour trail of a minor. Under DPDP you collect only what you actually need, keep it briefly, and never repurpose it for surveillance or targeting of the child or their family.":
    "Attendance records can show a child's location and behaviour. Under DPDP, collect only what you need, keep it for a short time, and never reuse it to watch or target the child or their family.",
  "You're starting from zero, which is genuinely the best place to be - you get to build it right the first time instead of patching a legacy mess.":
    "You are starting from the beginning. This lets you build the work correctly instead of fixing an old system.",
  "You're already moving - so the real win is closing the sector-specific blind spots that most programmes quietly miss until they're tested.":
    "You have already started. Now find and fix the gaps that are specific to your industry before a real test finds them.",
  "Every cart, click and delivery address is personal data - and marketing is where most e-commerce brands break DPDP first. The channels you rely on most (cookies, WhatsApp, retargeting) are exactly the ones the law polices hardest.":
    "Each cart, click and delivery address is personal data. Marketing is often where online shops first break DPDP. The law closely controls cookies, WhatsApp and ads aimed at past visitors.",
  "Good - awareness is genuinely half the battle, and you're already past the hardest part: admitting it matters. Now it's about turning that intent into something written down and provable.":
    "You know this matters. Now turn that aim into a written plan and keep proof that it works.",
  "Very relevant for cloud-native and GCC setups. DPDP conditions where personal data can travel and who can access it across borders. Mapping your data residency and access paths now saves a painful, expensive retrofit later - and answers the first question a client will ask.":
    "This matters for cloud-native and GCC setups. DPDP controls where personal data can go and who can access it across borders. Record where your data is stored and how people access it now. This avoids an expensive fix later and helps answer client questions.",
  "Govern what personal data feeds your AI": "Control which personal data your AI uses",
  "Personal data is any data about an individual who is identifiable by or in relation to such data. The DPDP Act governs personal data in digital form, or non-digital data later digitised.":
    "Personal data is information that identifies a person, either by itself or when linked with other information. The DPDP Act covers digital personal data and paper data that is later made digital.",
  "Personal data may be transferred outside India except to countries the Government restricts. Sectoral laws with stricter rules continue to apply (Section 16, Rule 14).":
    "You may send personal data outside India unless the Government restricts a country. Stricter laws for your industry still apply (Section 16, Rule 14).",
  "data principal": "person the data is about",
  "data fiduciary": "organisation responsible for data",
  "data processor": "company handling data for another organisation",
  "personal data": "information about an identifiable person",
  "what is personal data": "what information about an identifiable person means",
  "definition personal data": "meaning of information about an identifiable person",
  "valid consent": "valid permission",
  "withdraw consent": "take back permission",
  "revoke consent": "cancel permission",
  "security safeguards": "security protections",
  "types of personal data": "types of information about identifiable people",
  "Categories of personal data": "Groups of information about identifiable people",
  "grievance officer": "complaint officer",
  "without consent": "without permission",
  "consent manager": "service that manages permission",
  "retention conflict": "conflict about how long data is kept",
  "multiple regulators": "several authorities",
  "regulatory stack": "set of rules and authorities",
  "which regulators": "which authorities",
  "multi regulator": "several authorities",
  "This checks whether your policies are actually live across the whole organisation - not just written down.":
    "This checks whether everyone in your organisation follows the policies, instead of only having them on paper.",
  "This is really asking: do you know exactly what personal data you hold, and everywhere it goes?":
    "This asks whether you know exactly what information you hold about people and every place it goes.",
};

const REPLACEMENTS: [RegExp, string][] = [
  [/\ba Data Fiduciary\b/gi, "an organisation responsible for personal data"],
  [/\ba regulator\b/gi, "an authority"],
  [/Significant Data Fiduciaries/g, "large, high-risk organisations with extra duties"],
  [/Significant Data Fiduciary/g, "large, high-risk organisation with extra duties"],
  [/Data Fiduciaries/g, "organisations responsible for personal data"],
  [/Data Fiduciary/g, "organisation responsible for personal data"],
  [/Data Principals/g, "people the data is about"],
  [/Data Principal/g, "person the data is about"],
  [/Data Processors/g, "companies handling data for another organisation"],
  [/Data Processor/g, "company handling data for another organisation"],
  [/Processors/g, "data-handling companies"],
  [/Processor/g, "data-handling company"],
  [/Fiduciaries/g, "responsible organisations"],
  [/Fiduciary/g, "responsible organisation"],
  [/Consent Managers/g, "services that manage permissions"],
  [/Consent Manager/g, "service that manages permissions"],
  [/grievance redressal/gi, "complaint handling"],
  [/grievance mechanism/gi, "complaint process"],
  [/grievances/gi, "complaints"],
  [/grievance/gi, "complaint"],
  [/cross-border transfers/gi, "sending data outside India"],
  [/cross-border movement/gi, "movement outside India"],
  [/lawful basis/gi, "legal reason"],
  [/lawful purpose/gi, "legal purpose"],
  [/legitimate uses/gi, "uses allowed by law"],
  [/purpose limitation/gi, "using data only for the stated reason"],
  [/purpose-bound/gi, "for a stated reason"],
  [/data minimisation/gi, "collecting only what is needed"],
  [/retention periods/gi, "how long data is kept"],
  [/retention period/gi, "how long data is kept"],
  [/retention/gi, "how long data is kept"],
  [/erasure requests/gi, "requests to delete data"],
  [/right to erasure/gi, "right to delete data"],
  [/erasure/gi, "deletion"],
  [/personal data breaches/gi, "personal data leaks"],
  [/personal data breach/gi, "personal data leak"],
  [/personal-data breaches/gi, "personal-data leaks"],
  [/personal-data breach/gi, "personal-data leak"],
  [/breach-response/gi, "data-leak response"],
  [/breach response/gi, "data-leak response"],
  [/breach reporting/gi, "data-leak reporting"],
  [/breaches/gi, "data leaks"],
  [/breach/gi, "data leak"],
  [/non-compliance/gi, "breaking the law"],
  [/compliance programme/gi, "plan for following the law"],
  [/compliance program/gi, "plan for following the law"],
  [/compliance/gi, "following the law"],
  [/obligations/gi, "duties"],
  [/accountability/gi, "responsibility"],
  [/safeguards/gi, "protections"],
  [/remedial action/gi, "steps to fix the problem"],
  [/intimate affected/gi, "tell affected"],
  [/without undue delay/gi, "as soon as reasonably possible"],
  [/explicit consent/gi, "clear permission"],
  [/parental consent/gi, "permission from a parent"],
  [/consent records/gi, "permission records"],
  [/consent record/gi, "permission record"],
  [/consent notices/gi, "permission notices"],
  [/consent notice/gi, "permission notice"],
  [/consent logs/gi, "permission logs"],
  [/consent log/gi, "permission log"],
  [/consent/gi, "permission"],
  [/processing personal data/gi, "using personal data"],
  [/process personal data/gi, "use personal data"],
  [/processing activity/gi, "use of data"],
  [/processing/gi, "using data"],
  [/processors/gi, "data-handling companies"],
  [/processor/gi, "data-handling company"],
  [/regulators/gi, "authorities"],
  [/regulator/gi, "authority"],
  [/statutory/gi, "required by law"],
  [/operational detail/gi, "practical detail"],
  [/interoperable intermediary/gi, "service that works across systems"],
  [/unambiguous affirmative action/gi, "a clear yes"],
  [/clear affirmative action/gi, "a clear yes"],
  [/affirmative action/gi, "clear yes"],
  [/unambiguous/gi, "clear"],
  [/itemised/gi, "detailed"],
  [/remediation/gi, "fixing the problem"],
  [/evidencing/gi, "showing proof of"],
  [/evidence of/gi, "proof of"],
  [/on-premise/gi, "on-site"],
  [/on demand/gi, "when asked"],
  [/crore-scale/gi, "fines worth crores"],
  [/reputational/gi, "damage to trust and reputation"],
  [/behavioural monitoring/gi, "tracking behaviour"],
  [/behavioral monitoring/gi, "tracking behavior"],
  [/targeted advertising/gi, "targeted ads"],
  [/DPIAs/g, "privacy impact checks"],
  [/DPIA/g, "privacy impact check"],
  [/DPAs/g, "data-handling contracts"],
  [/DPA/g, "data-handling contract"],
];

function easy(original: string): string {
  const exact = EXACT[original];
  if (exact) return exact;
  return REPLACEMENTS.reduce(
    (text, [pattern, replacement]) => text.replace(pattern, replacement),
    original,
  );
}

const pairs: Pair[] = [];
const seen = new Set<string>();
const alreadyCovered = new Set([
  "Verifiable parental consent",
  "Data Principal",
  "Data Fiduciary",
  "Significant Data Fiduciary",
  "Data Processor",
  "Security safeguards",
  "Grievance redressal",
  "Data breach",
  "Consent Manager",
  "Cross-border transfers",
  "Notice & consent",
  "Reasonable security safeguards",
  "Retention & deletion",
  "Rights of the Data Principal",
]);
const add = (original: string, replacement = easy(original)) => {
  if (
    original &&
    replacement !== original &&
    !seen.has(original) &&
    !alreadyCovered.has(original)
  ) {
    seen.add(original);
    pairs.push([original, replacement]);
  }
};

[
  "DPDP Industry Advisor",
  "Your result",
  "What the law expects",
  "What's at stake",
  "Where to start",
  "Ready to move beyond the briefing?",
  "See the services",
  "Check your readiness",
  "Not sure yet",
  "I couldn't find that. Try asking about consent, notice, penalties, breach, children, rights, cross-border transfers, the Board, or who must comply.",
  "DPDP assistant · on-device",
  "Ask about the DPDP Act…",
  "What is valid consent?",
  "Penalties for a breach?",
  "Children's data rules",
  "Who must comply?",
  "Your DPDP guide · plain-English help",
  "In short",
  "Need an example?",
  "See the full 7D framework",
].forEach((text) => add(text));

Object.values(SECTOR_ADVICE).forEach((advice) => {
  add(advice.hook);
  Object.entries(advice.dataReplies).forEach(([option, response]) => {
    add(option);
    add(response);
  });
  Object.entries(advice.worryReplies).forEach(([option, response]) => {
    add(option);
    add(response);
  });
  add(advice.stat.label);
  add(advice.why);
  advice.obligations.forEach(({ title, body }) => {
    add(title);
    add(body);
  });
  add(advice.penalty);
  add(advice.scenario);
  advice.actions.forEach((action) => add(action));
});

READINESS_STAGES.forEach(({ label, reply, verdict }) => {
  add(label);
  add(reply);
  add(verdict);
});

LEX_KB.forEach(({ title, answer }) => {
  add(title);
  add(answer);
});

RISK_EXPLAINERS.forEach(({ gist, explain, example }) => {
  add(gist);
  add(explain);
  add(example);
});

[
  "data principal",
  "data fiduciary",
  "data processor",
  "personal data",
  "what is personal data",
  "definition personal data",
  "valid consent",
  "withdraw consent",
  "revoke consent",
  "security safeguards",
  "types of personal data",
  "grievance officer",
  "without consent",
  "consent manager",
  "retention conflict",
  "multiple regulators",
  "regulatory stack",
  "which regulators",
  "multi regulator",
].forEach((keyword) => add(keyword));

TRAIL.forEach(({ title, summary, objectives }) => {
  add(title);
  add(summary);
  objectives.forEach((objective) => add(objective));
});

RANKS.forEach(({ tagline }) => add(tagline));

export const PAIRS: [string, string][] = pairs;