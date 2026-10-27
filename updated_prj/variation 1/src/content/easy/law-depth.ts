import { ACT_CHAPTERS } from "@/content/act";
import { RULE_FILTERS, RULES } from "@/content/rules";
import { getAllSections } from "@/content/section-enrichment";
import { PAIRS as ACT_PAIRS } from "@/content/easy/act";
import { PAIRS as RULE_PAIRS } from "@/content/easy/rules";

type Pair = [string, string];

const EXISTING = new Set([
  ...[...ACT_PAIRS, ...RULE_PAIRS].map(([normal]) => normal),
  "Consent",
]);

/**
 * Ordered, conservative changes for explanatory law content. Numbers, dates,
 * money, section/rule references, exceptions and legal duties are untouched.
 */
const REWRITES: Pair[] = [
  ["Data Principal's", "person's"],
  ["Data Fiduciary's", "data-handling organisation's"],
  ["Fiduciary's", "data-handling organisation's"],
  ["Data Fiduciaries", "data-handling organisations"],
  ["Data Fiduciary", "data-handling organisation"],
  ["Fiduciaries", "data-handling organisations"],
  ["Fiduciary", "data-handling organisation"],
  ["Data Principals", "people"],
  ["Data Principal", "person"],
  ["Data Processors", "service providers that handle data"],
  ["Data Processor", "service provider that handles data"],
  ["Processors", "service providers that handle data"],
  ["Processor", "service provider that handles data"],
  ["Significant Data Fiduciaries", "large, high-risk organisations with extra duties"],
  ["Significant Data Fiduciary", "large, high-risk organisation with extra duties"],
  ["personal data breach", "personal data leak"],
  ["personal data breaches", "personal data leaks"],
  ["data breach", "data leak"],
  ["breaches", "failures to follow the law"],
  ["breach", "failure to follow the law"],
  ["grievance redressal", "complaint handling"],
  ["grievance mechanism", "complaint process"],
  ["grievances", "complaints"],
  ["grievance", "complaint"],
  ["erasure", "deletion"],
  ["erase", "delete"],
  ["the processing it carries out", "how it uses that data"],
  ["process data", "use data"],
  ["processing", "handling"],
  ["processed", "handled"],
  ["processes", "handles"],
  ["process", "handle"],
  ["Consent Manager", "Consent Manager"],
  ["Consent Managers", "Consent Managers"],
  ["consented", "agreed"],
  ["consents", "agrees"],
  ["consent", "permission"],
  ["obligations", "duties"],
  ["obligation", "duty"],
  ["compliance", "following the law"],
  ["cross-border transfer", "sending data outside India"],
  ["cross-border data flows", "data sent outside India"],
  ["retention", "keeping data"],
  ["remedial measures", "steps to fix the problem"],
  ["remedial or mitigation measures", "steps to fix or reduce the harm"],
  ["mitigation", "steps to reduce harm"],
  ["lawful basis", "legal reason"],
  ["lawful ground", "legal reason"],
  ["instrumentalities", "agencies"],
  ["instrumentality", "agency"],
  ["intermediaries", "online service providers"],
  ["intermediary", "online service provider"],
  ["commencement", "start"],
  ["comes into force", "starts"],
  ["come into force", "start"],
  ["give effect to", "put into practice"],
  ["in force", "currently in effect"],
  ["furnish information", "provide information"],
  ["furnish", "provide"],
  ["intimation", "notice"],
  ["particulars", "details"],
  ["prescribed", "set by the Rules"],
  ["adjudged insolvent", "legally declared unable to pay debts"],
  ["moral turpitude", "serious dishonest or immoral conduct"],
  ["bodily infirmity", "physical illness or weakness"],
  ["unsoundness of mind", "a mental condition"],
  ["perpetual succession", "the ability to continue even when its members change"],
  ["body corporate", "legal organisation"],
  ["natural justice", "fair decision-making"],
  ["casting vote", "deciding vote when votes are tied"],
  ["quorum", "minimum number of Members needed"],
  ["recuse", "step away from the decision"],
  ["ratification", "later approval"],
  ["inquiry", "formal investigation"],
  ["inquiries", "formal investigations"],
  ["proceedings", "cases"],
  ["proceeding", "case"],
  ["exemptions", "exceptions"],
  ["exemption", "exception"],
  ["exempt", "not covered"],
  ["convenes", "meets"],
  ["endeavours to", "aims to"],
  ["dispose of", "decide"],
  ["invalidate", "cancel"],
  ["annul", "cancel"],
  ["derogation of", "replacement of"],
  ["prevails", "controls"],
  ["specified", "named"],
  ["notified", "told"],
  ["notify", "tell"],
  ["notification", "official announcement"],
  ["authentic", "real"],
  ["unambiguous", "clear"],
  ["clear affirmative action", "clear action"],
  ["affirmative action", "an action that clearly shows agreement"],
  ["due diligence", "careful checks"],
  ["algorithmic systems", "automated computer systems"],
  ["algorithmic measures", "automated computer systems"],
  ["techno-legal measures", "digital and legal tools"],
  ["digital processes", "digital systems"],
  ["data minimisation", "collecting only the data needed"],
  ["purpose limitation", "using data only for the stated reason"],
  ["standalone", "separate"],
  ["itemised", "listed item by item"],
  ["prominently", "clearly"],
  ["periodic", "regular"],
  ["compromised", "leaked or exposed"],
  ["feasible", "possible"],
  ["applicable law", "the law that applies"],
  ["applicable laws", "laws that apply"],
  ["legislation", "laws"],
  ["statute", "law"],
  ["regulator", "authority"],
  ["regulators", "authorities"],
  ["remuneration", "pay"],
  ["allowances", "extra payments"],
];

const SENTENCE_REWRITES: Pair[] = [
  ["The vocabulary of the Act", "The key words used in the Act"],
  ["The lawful bases on which data may be processed", "The legal reasons for using personal data"],
  ["Free, specific, informed, unambiguous - the gold standard", "Permission must be freely given, specific, informed and clear"],
  ["DPIA, audits and a Data Protection Officer", "Impact checks, audits and a Data Protection Officer"],
  ["A readily available means to raise complaints", "An easy way to make a complaint"],
  ["What the law expects of individuals in return", "What people must do when using their rights"],
  ["Grounds that bar appointment or continuation", "Reasons a Member cannot start or stay in the job"],
  ["Inquiry, direction and remedial powers", "Powers to investigate, give directions and fix problems"],
  ["How matters are heard and decided", "How cases are heard and decided"],
  ["Mediation as an alternative path", "Using mediation instead of a full case"],
  ["Settling a matter by commitment", "Settling a case by making a promise"],
  ["Binding directions in specified circumstances", "Directions that must be followed in named situations"],
  ["Civil courts barred from matters the Board decides", "Civil courts cannot decide matters handled by the Board"],
  ["Removing difficulties in giving effect to the Act", "Fixing problems when putting the Act into practice"],
  ["Consequential changes to other legislation", "Related changes to other laws"],
];

function replaceTerms(text: string): string {
  const replacements = new Map(
    REWRITES.map(([normal, easy]) => [normal.toLowerCase(), easy]),
  );
  const alternatives = [...REWRITES]
    .sort(([left], [right]) => right.length - left.length)
    .map(([normal]) => normal.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));

  return text.replace(new RegExp(`\\b(?:${alternatives.join("|")})\\b`, "gi"), (match) => {
    const easy = replacements.get(match.toLowerCase()) ?? match;
    if (match === match.toUpperCase()) return easy.toUpperCase();
    return easy;
  });
}

function simplify(text: string): string {
  let easy = text;
  for (const [normal, replacement] of SENTENCE_REWRITES) {
    easy = easy.replace(normal, replacement);
  }
  return replaceTerms(easy)
    .replace(/\bmust be able to\b/gi, "must be allowed to")
    .replace(/\bwith the prior approval of\b/gi, "after getting approval from")
    .replace(/\bon behalf of\b/gi, "for")
    .replace(/\bin the event of\b/gi, "if there is")
    .replace(/\bwhere it is used\b/gi, "when it is used")
    .replace(/\bdoes not cover ([^.]*)\bor to\b/gi, "does not cover $1or")
    .replace(/\bdoes not apply to\b/gi, "does not cover")
    .replace(/\bdo not apply\b/gi, "do not cover")
    .replace(/\bmay be\b/gi, "can be")
    .replace(/\bshall be\b/gi, "must be")
    .replace(/\bso as to\b/gi, "to")
    .replace(/\bin order to\b/gi, "to")
    .replace(/\s{2,}/g, " ")
    .trim();
}

const sourceStrings = new Set<string>();

for (const chapter of ACT_CHAPTERS) {
  sourceStrings.add(chapter.title);
  for (const section of chapter.sections) {
    sourceStrings.add(section.title);
    sourceStrings.add(section.summary);
  }
}

for (const section of getAllSections()) {
  sourceStrings.add(section.plainEnglish);
  section.highlights.forEach((highlight) => sourceStrings.add(highlight));
  if (section.example) sourceStrings.add(section.example);
}

for (const filter of RULE_FILTERS) sourceStrings.add(filter.label);
for (const rule of RULES) {
  sourceStrings.add(rule.title);
  sourceStrings.add(rule.summary);
  sourceStrings.add(rule.plainEnglish);
  rule.highlights.forEach((highlight) => sourceStrings.add(highlight));
  sourceStrings.add(rule.mapsTo);
}

const RENDERER_STRINGS = [
  "All sections",
  "Download full Act (PDF)",
  "In plain English",
  "Example",
  "Key points",
  "Related rules",
  "No Rules map directly to this section.",
  "Browse all rules →",
  "The exact legal wording is hidden in Easy read to keep things simple. Turn Easy read off in the top bar to see the official Act text, or download the full Act PDF above.",
  "All rules",
  "Download full Rules (PDF)",
  "This rule gives effect to",
  "Read the parent section",
  "We've kept this view simple. The exact legal wording is hidden in Easy read - turn Easy read off in the top bar to read the official gazette text, or download the full Rules PDF above.",
] as const;

RENDERER_STRINGS.forEach((text) => sourceStrings.add(text));

const UI_OVERRIDES = new Map<string, string>([
  ["Fix, update or delete your personal data", "Correct, update or delete your personal data"],
  ["Rules and notifications placed before Parliament", "Rules and official notices given to Parliament"],
  [
    "These are formally called the Digital Personal Data Protection Rules, 2025. Rules 1, 2, and 17-21 take effect immediately on publication. Rule 4 (Consent Managers) starts one year later. Rules 3, 5-16, 22, and 23 start eighteen months after publication - giving organisations time to prepare.",
    "Their official name is the Digital Personal Data Protection Rules, 2025. Rules 1, 2, and 17-21 start as soon as they are published. Rule 4, about Consent Managers, starts one year later. Rules 3, 5-16, 22, and 23 start eighteen months after publication, giving organisations time to prepare.",
  ],
  ["“User account” covers profiles, handles, email, and mobile numbers", "A “user account” includes profiles, usernames, email addresses, and mobile numbers"],
  ["Board may suspend or cancel registration after hearing the Manager", "The Board can pause or cancel registration after giving the Manager a chance to be heard"],
  ["Covers subsidies, benefits, services, certificates, licences, and permits", "Covers government support, benefits, services, certificates, licences, and permits"],
  ["Retain logs and personal data for one year unless law requires otherwise", "Keep logs and personal data for one year, unless another law requires a different period"],
  ["Parent must be verified as an identifiable adult (18+)", "The parent’s identity and age must be checked to confirm that the parent is an adult (18+)"],
  ["Accept reliable existing records, voluntary ID, or government-issued tokens", "Accept trusted records already held, an ID given by choice, or tokens issued by the government"],
  [
    "The Central Government appoints the Board's Chairperson and Members through search-cum-selection committees. The Chairperson committee is chaired by the Cabinet Secretary; the Member committee by the MeitY Secretary. Each includes legal and tech experts. Government appoints from committee recommendations.",
    "The Central Government appoints the Board’s Chairperson and Members using selection committees. The Cabinet Secretary leads the committee for the Chairperson. The MeitY Secretary leads the committee for Members. Each committee includes law and technology experts. The Government makes appointments from the committees’ recommendations.",
  ],
  [
    "The Board may appoint officers and employees with Central Government approval. Their terms of service - appointment classes, gratuity, medical, leave, and conduct - are set out in the Sixth Schedule, largely mirroring Central Government service rules.",
    "The Board can appoint officers and employees after the Central Government approves. The Sixth Schedule sets their service terms, including job classes, gratuity, medical benefits, leave, and conduct. These terms mostly follow Central Government service rules.",
  ],
  ["Fee payable digitally via UPI or authorised payment systems", "Pay the fee online through UPI or another payment system allowed by law"],
  ["Government may call for information for Seventh Schedule purposes", "The Government can ask for information for the purposes listed in the Seventh Schedule"],
  ["Non-disclosure orders possible for sensitive national-security requests", "For sensitive national-security requests, an order can forbid sharing the request"],
  ["Names the law: the Digital Personal Data Protection Act, 2023.", "Gives the law its name: the Digital Personal Data Protection Act, 2023."],
  ["'Child' means anyone under eighteen; 'personal data' is any data about an identifiable individual.", "A ‘child’ is anyone under eighteen. ‘Personal data’ is any data about a person who can be identified."],
  ["Extra-territorial: reaches foreign businesses offering goods or services to people in India.", "The Act also covers foreign businesses that offer goods or services to people in India."],
  ["A bank opening an account by video-KYC must, before capturing your data, tell you exactly what it is collecting and why.", "Before a bank collects your data for video-KYC to open an account, it must tell you exactly what it will collect and why."],
  ["Includes medical emergencies, disasters and threats to public safety.", "Includes medical emergencies, disasters, and dangers to public safety."],
  ["Keep personal data complete, accurate and consistent where it drives decisions or is shared.", "Keep personal data complete, correct, and consistent when it is used to make decisions or shared with others."],
  ["Once you close your account and no law requires keeping the records, the company must delete your personal data rather than hold it indefinitely.", "After you close your account, the company must delete your personal data if no law requires it to keep the records. It cannot keep the data forever."],
  ["No tracking, behavioural monitoring or targeted advertising directed at children.", "Do not track children, monitor their behaviour, or direct targeted ads at them."],
  ["The Government designates SDFs based on data volume, sensitivity and risk factors.", "The Government names SDFs by looking at how much data they use, how sensitive it is, and the risks involved."],
  ["Must appoint a Data Protection Officer based in India, answerable to the governing body.", "Must appoint a Data Protection Officer who is based in India and reports to the governing body."],
  ["You can ask an e-commerce site which delivery, payment and analytics partners received your address and order details.", "You can ask an online shop which delivery, payment, and data-analysis partners received your address and order details."],
  ["Require correction, completion or updating of your personal data.", "Ask for your personal data to be corrected, completed, or updated."],
  ["This right lets you name another person to step into your shoes and exercise your data rights if you die or become unable to act for yourself. It works like a nominee - but for your digital personal data rather than a bank account.", "This right lets you name someone to use your data rights if you die or cannot act for yourself. The person works like a nominee, but for your digital personal data instead of a bank account."],
  ["Nominate someone to exercise your rights on your death or incapacity.", "Name someone to use your rights if you die or become unable to act."],
  ["Functions like a nominee for your personal data.", "Works like a nominee for your personal data."],
  ["Do not suppress material information for official documents or identifiers.", "Do not hide important information when applying for official documents or identity numbers."],
  ["A bank may transfer data to a cloud region abroad unless that country is on a restricted list - but sectoral rules requiring local storage still bind it.", "A bank can send data to a cloud region abroad unless that country is on a restricted list. However, the bank must still follow any rules for its sector that require local storage."],
  [
    "This sets who runs the Board. It consists of a Chairperson and however many Members the Central Government notifies, all appointed by the Government. They must be people of ability, integrity and standing with relevant expertise - in fields such as data governance, law, technology, the digital economy or consumer protection - and at least one Member must be an expert in law.",
    "This says who runs the Board. The Government appoints a Chairperson and the number of Members announced by the Central Government. They must be capable, honest, respected, and experienced in areas such as data governance, law, technology, the digital economy, or consumer protection. At least one Member must be a law expert.",
  ],
  ["Members must have ability, integrity, standing and relevant expertise.", "Members must be capable, honest, respected, and experienced in a relevant field."],
  ["Terms cannot be varied to a member's disadvantage after appointment.", "After appointment, a Member’s service terms cannot be changed in a way that puts the Member at a disadvantage."],
  ["Vacancies from resignation, removal or death are filled by fresh appointment.", "If a Member resigns, is removed, or dies, the vacancy is filled by a new appointment."],
  [
    "This lets the Board run its own business - including meeting by digital means - and authenticate its orders and directions in the manner the Rules prescribe. Its acts stay valid despite vacancies or technical defects in how it was constituted, and the senior-most Member covers for the Chairperson when they are unavailable.",
    "This lets the Board manage its work, including holding online meetings. It must confirm its orders and directions in the way set by the Rules. Its actions remain valid even if a seat is empty or there is a technical defect in how the Board was formed. The most senior Member acts for the Chairperson when the Chairperson is unavailable.",
  ],
  ["Its acts are not invalid merely because of vacancies or procedural defects.", "Its actions remain valid even if a seat is empty or there is a defect in the procedure."],
  ["When acting under the Act, the Board's Chairperson, Members, officers and employees count as 'public servants' in law. That status carries both the protections and the accountability the law attaches to public servants.", "When working under the Act, the Board’s Chairperson, Members, officers, and employees are treated as ‘public servants’ in law. They receive the legal protections for public servants and are also legally accountable as public servants."],
  ["The status brings both legal protection and accountability.", "This status gives legal protection and also makes the person legally accountable."],
  ["General superintendence and direction over the Board's administration.", "Overall control and direction of the Board’s administration."],
  ["Can authorise officers to scrutinise complaints and correspondence.", "Can allow officers to closely examine complaints and official messages."],
  ["Can issue binding directions after hearing the person concerned.", "Can give directions that must be followed after giving the affected person a chance to be heard."],
  ["Functions as an independent, digital-by-design office.", "Works as an independent office built to operate online."],
  ["Has civil-court powers of summoning, taking evidence and inspecting documents.", "Has the same powers as a civil court to call people to appear, receive evidence, and inspect documents."],
  ["Tribunal orders are executable as a decree of a civil court.", "A Tribunal order can be enforced in the same way as a civil court decree."],
  ["A person may offer, and the Board may accept, a voluntary undertaking to resolve a matter.", "A person can offer a voluntary promise to settle a matter, and the Board can accept it."],
  ["It cannot raise any penalty beyond twice the originally enacted amount.", "It cannot increase a penalty to more than twice the amount first set by the Act."],
  ["Lets the Government issue orders to resolve difficulties in implementing the Act.", "Lets the Government make orders to fix problems that arise while putting the Act into effect."],
  ["The Digital Personal Data Protection Act, 2023 gives every person in India real, enforceable rights over their own personal data - and you don't need a lawyer to use them. Here's what you can ask for, in plain language, with a ready-to-send letter for each request.", "The Digital Personal Data Protection Act, 2023 gives every person in India rights over their personal data that can be enforced. You do not need a lawyer to use them. Here is what you can ask for, with a ready-to-send letter for each request."],
  ["Request to access my personal data under Section 11 of the DPDP Act, 2023", "Request to see my personal data under Section 11 of the DPDP Act, 2023"],
  ["Request to correct my personal data under Section 12 of the DPDP Act, 2023", "Request to fix my personal data under Section 12 of the DPDP Act, 2023"],
  ["Request to erase my personal data under Section 12 of the DPDP Act, 2023", "Request to delete my personal data under Section 12 of the DPDP Act, 2023"],
  ["Formally complain to the company before approaching the Board.", "Make an official complaint to the company before going to the Board."],
  ["Grievance regarding the processing of my personal data - Section 13", "Complaint about the use of my personal data - Section 13"],
  ["All sections", "All 44 sections"],
  ["Download full Act (PDF)", "Download the full Act (PDF)"],
  ["In plain English", "In simple words"],
  ["Key points", "Main points"],
  ["Related rules", "Rules linked to this section"],
  ["No Rules map directly to this section.", "No Rules link directly to this section."],
  ["Browse all rules →", "See all rules →"],
  ["All rules", "All 23 rules"],
  ["Download full Rules (PDF)", "Download all Rules (PDF)"],
  ["This rule gives effect to", "This rule puts into practice"],
  ["Read the parent section", "Read the main section"],
]);

UI_OVERRIDES.forEach((_, normal) => sourceStrings.add(normal));

export const PAIRS: [string, string][] = [...sourceStrings]
  .filter((normal) => !EXISTING.has(normal))
  .map((normal): Pair => [normal, UI_OVERRIDES.get(normal) ?? simplify(normal)])
  .filter(([normal, easy]) => normal !== easy);