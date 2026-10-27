import { TEMPLATE_DOCUMENTS, type DocSection } from "../template-documents";
import { TEMPLATES } from "../templates";

type Pair = [string, string];
type Replacement = string | ((match: string, capture?: string) => string);

// Already covered by easy/templates.ts. Keep this module additive when both are
// aggregated by the site dictionary.
const EXISTING_NORMALS = new Set([
  "Consent form for data processing",
  "Data subject rights request form",
  "Consent withdrawal request",
  "Data retention policy",
  "Cross-border transfer agreement",
  "Vendor / sub-processor DPA",
  "Notice of data breach",
  "Breach response playbook",
  "Data Protection Impact Assessment",
  "Retention",
  "A Data Protection Impact Assessment for high-risk processing",
  "Contractual safeguards for processing personal data outside India",
  "Disclose cookies and trackers with consent categories",
  "Flow-down obligations for vendors handling personal data on your behalf",
  "How employee personal data is collected, used and retained",
  "Intake form for access, correction, erasure and nomination requests",
  "Storage-limitation schedule with erasure timelines by data category",
]);

const EXACT_UI_PAIRS: Pair[] = [
  ["When to use it", "When to use this document"],
  ["What's inside", "What this document contains"],
  ["Document details", "Document information"],
  ["View the document - PDF, Word or reader", "Read the document as a PDF, Word file, or web page"],
  ["Editable Word document and print-ready PDF. Free to use - tailor to your organisation before publishing.", "Editable Word file and print-ready PDF. Free to use. Adjust it for your organisation before publishing."],
  ["Notice.", "Important."],
  ["This template uses illustrative organisation details for guidance only. Replace them with your entity's particulars and obtain qualified legal review before execution or publication. It does not constitute legal advice.", "This template uses sample organisation details only. Replace them with your organisation's details and get a qualified lawyer to review it before you sign or publish it. This is not legal advice."],
  ["Clean, responsive reading view of the same content.", "A clear reading view of the same content that fits your screen."],
  ["Your browser can't display the PDF inline.", "Your browser cannot show the PDF on this page."],
  ["Rendering the Word document…", "Preparing the Word document…"],
  ["Couldn't render the .docx here.", "The Word file could not be shown here."],
  ["Acme Digital Solutions Private Limited, Unit 402, Peninsula Business Park, Senapati Bapat Marg, Lower Parel, Mumbai 400013, Maharashtra, India", "Sample organisation and address: Acme Digital Solutions Private Limited, Unit 402, Peninsula Business Park, Senapati Bapat Marg, Lower Parel, Mumbai 400013, Maharashtra, India"],
  ["Accuracy - keep personal data correct and up to date", "Accuracy - keep personal data correct and current"],
  ["You may block cookies via browser settings. Instructions: Chrome - Settings → Privacy and security → Cookies; Firefox - Settings → Privacy & Security; Safari - Preferences → Privacy. Blocking necessary cookies will prevent login.", "You may block cookies in your browser settings. In Chrome, go to Settings → Privacy and security → Cookies. In Firefox, go to Settings → Privacy & Security. In Safari, go to Preferences → Privacy. If you block necessary cookies, you will not be able to log in."],
  ["\"Act\" means the Digital Personal Data Protection Act, 2023.", "In this document, \"Act\" means the Digital Personal Data Protection Act, 2023."],
  ["\"Rules\" means the Digital Personal Data Protection Rules, 2025.", "In this document, \"Rules\" means the Digital Personal Data Protection Rules, 2025."],
  ["\"Personal Data\" has the meaning in Section 2(t) of the Act.", "In this document, \"Personal Data\" means what Section 2(t) of the Act says it means."],
  ["From: Acme Digital Solutions Private Limited, CIN U72900MH2019PTC328417, Unit 402, Peninsula Business Park, Senapati Bapat Marg, Lower Parel, Mumbai 400013, Maharashtra, India", "Sent by: Acme Digital Solutions Private Limited, CIN U72900MH2019PTC328417, Unit 402, Peninsula Business Park, Senapati Bapat Marg, Lower Parel, Mumbai 400013, Maharashtra, India"],
  ["Contact our incident helpline: 1800-XXX-ACME (24×7) or incident@acmedigital.in", "For help with this incident, call 1800-XXX-ACME (24×7) or email incident@acmedigital.in"],
  ["Yours faithfully, Rahul Mehta Chief Compliance Officer Acme Digital Solutions Private Limited", "Yours faithfully, Rahul Mehta, Chief Compliance Officer, Acme Digital Solutions Private Limited"],
];

const REPLACEMENTS: ReadonlyArray<readonly [RegExp, Replacement]> = [
  [/\bmeans any person who processes personal data on behalf of a Data Fiduciary\b/gi, "means any person who uses personal data for an organisation responsible for the data"],
  [/\bacts as a Data Fiduciary\b/gi, "is an organisation responsible for the data"],
  [/\ba Data Fiduciary\b/g, "an organisation responsible for the data"],
  [/\bverifiable consent\b/gi, "permission that can be checked"],
  [/\bfreely give the consents I have ticked above\b/gi, "freely give the permissions I ticked above"],
  [/\boptional third-party partners\b/gi, "optional outside partners"],
  [/\bexecutes deletion from production systems\b/gi, "deletes the data from live systems"],
  [/\bticket logged\b/gi, "a ticket is recorded"],
  [/\bProcessors instructed to delete copies\b/g, "Data handlers are told to delete their copies"],
  [/\bconfirmation received\b/gi, "they must confirm deletion"],
  [/\bWithdraw via\b/gi, "Withdraw permission using the"],
  [/\bmay audit once per year\b/gi, "may check the data handler once a year"],
  [/\bmay audit annually\b/gi, "may check the vendor once a year"],
  [/\bISO 27001 certified data centres\b/gi, "data centres certified to ISO 27001"],
  [/\bLikely consequences\b/gi, "Likely effects"],
  [/\bmoderate phishing risk\b/gi, "some risk of scam messages"],
  [/\bcredential-stuffing attacks\b/gi, "attacks that try stolen passwords"],
  [/\bMonitoring for ([^.]+) initiated\b/gi, "Checks for $1 have started"],
  [/\bContainment\b/gi, "Steps taken to limit the leak"],
  [/\baffected endpoint disabled pending review\b/gi, "affected connection disabled until it is checked"],
  [/\bforensic image captured\b/gi, "a system copy was saved for investigation"],
  [/\borganisation-wide policy covering governance, roles and safeguards\b/gi, "policy for the whole organisation covering oversight, roles and protections"],
  [/\bAccount registration, authentication and profile management\b/gi, "Creating an account, signing in and managing a profile"],
  [/\bPromotional emails and SMS\b/gi, "Marketing emails and SMS messages"],
  [/\bPersonalised product recommendations based on purchase and browsing history\b/gi, "Product suggestions based on what you bought and viewed"],
  [/\bParticipation in beta programmes and user research interviews\b/gi, "Taking part in product trials and user interviews"],
  [/\binaccurate or incomplete personal data updated\b/gi, "wrong or missing personal data corrected"],
  [/\bwith as much specificity as possible\b/gi, "as clearly as you can"],
  [/\bmarketing distribution lists\b/gi, "marketing lists"],
  [/\bnon-essential cookies\b/gi, "optional cookies"],
  [/\bData Fiduciary\b/g, "organisation responsible for the data"],
  [/\bPersonal data we collect\b/gi, "Personal data we get"],
  [/\bConsent only\b/gi, "Permission only"],
  [/\bChildren's personal data\b/gi, "Personal data about children"],
  [/\bBoard \/ Compliance\b/g, "Board / law-following team"],
  [/\bModel provider breach\b/gi, "Data leak at the AI provider"],
  [/\bdietary preferences\b/gi, "food choices"],
  [/\bdevice identifiers\b/gi, "device IDs"],
  [/\bapproximate location derived from IP\b/gi, "general location found from the IP address"],
  [/\bsimilar technologies\b/gi, "similar tracking tools"],
  [/\bRole-based access control\b/gi, "Access based on each person's job"],
  [/\badministrative access\b/gi, "administrator access"],
  [/\bquarterly access reviews\b/gi, "access checks every three months"],
  [/\bautomated fraud-scoring\b/gi, "automatic fraud checks"],
  [/\blegal or similarly significant effects\b/gi, "legal or similarly serious effects"],
  [/\bautomated decisions affecting you\b/gi, "automatic decisions that affect you"],
  [/\broll off within\b/gi, "are removed within"],
  [/\bUltimate accountability\b/gi, "Final responsibility"],
  [/\bdemonstrate compliance through documentation and audit\b/gi, "show through records and audits that the law is followed"],
  [/\bdata centre colocation\b/gi, "the shared data centre"],
  [/\bequal prominence\b/gi, "equal visibility"],
  [/\bbrowser fingerprint hash\b/gi, "coded browser identifier"],
  [/\bemail metadata\b/gi, "email details"],
  [/\bCompany laptop usage monitored\b/gi, "Company laptop use checked"],
  [/\bnotified in employment contract\b/gi, "explained in the employment contract"],
  [/\bproduction customer data\b/gi, "live customer data"],
  [/\bBiometric attendance\b/gi, "Fingerprint or face-scan attendance"],
  [/\balternative manual sign-in available\b/gi, "manual sign-in is also available"],
  [/\bAI-powered customer support chatbot\b/gi, "AI customer-support chat tool"],
  [/\blarge language model APIs\b/gi, "AI language services"],
  [/\bcustomer's account context\b/gi, "customer's account information"],
  [/\bconversation samples\b/gi, "sample conversations"],
  [/\bPROCEED with conditions\b/g, "GO AHEAD with conditions"],
  [/\bfinancial dispute queries\b/gi, "questions about financial disputes"],
  [/\bData Processor register\b/g, "register of companies handling data for another"],
  [/\bPermit ([^.]+) to inspect compliance\b/gi, "Allow $1 to check that the law is followed"],
  [/\bApproximate Data Principals affected\b/g, "Approximate number of people affected"],
  [/\bImportantly\b/gi, "Please note"],
  [/\bidentity monitoring\b/gi, "identity-theft monitoring"],
  [/\bsincerely apologise for any inconvenience or concern\b/gi, "are sorry for any trouble or worry"],
  [/\bAppoint Incident Commander\b/gi, "Choose the person leading the incident response"],
  [/\bIsolate affected systems\b/gi, "Separate affected systems"],
  [/\bforensic preservation\b/gi, "evidence is saved for investigation"],
  [/\bholding statement only\b/gi, "only an approved short statement"],
  [/\bother jurisdictions if applicable\b/gi, "other countries when required"],
  [/\badmit liability beyond facts\b/gi, "accept legal responsibility beyond the known facts"],
  [/\bspelling out the exact actions and timelines you must honour\b/gi, "stating the exact steps and timelines you must follow"],
  [/\borganisation-wide policy covering governance, roles and safeguards\b/gi, "policy for the whole organisation covering oversight, roles and protections"],
  [/\bcore accountability record\b/gi, "main record showing responsibility"],
  [/\bAttach to vendor and MSA contracts\b/gi, "Add to vendor and MSA contracts"],
  [/\bConsent Form for Processing of Personal Data\b/g, "Permission Form for Using Personal Data"],
  [/\bconsent to each purpose I tick\b/gi, "give permission for each purpose I tick"],
  [/\bconsent to\b/gi, "give permission for"],
  [/\bproof of consent\b/gi, "proof of permission"],
  [/\bconsent choices\b/gi, "permission choices"],
  [/\bconsent logs\b/gi, "permission records"],
  [/\bconsent management\b/gi, "permission management"],
  [/\bconsent works\b/gi, "permission works"],
  [/\bon a consent basis\b/gi, "because the person gave permission"],
  [/\bLawful processing framework\b/gi, "Framework for lawful use of data"],
  [/\blawful processing\b/gi, "lawful use of data"],
  [/\bprocessing purposes\b/gi, "reasons for using the data"],
  [/\bpurposes? for which (?:my|the) personal data will be processed\b/gi, "reasons the personal data will be used"],
  [/\bpersonal data being processed\b/gi, "personal data being used"],
  [/\bprocessed through\b/gi, "used through"],
  [/\bprocessed by\b/gi, "used by"],
  [/\bprocesses personal data\b/gi, "uses personal data"],
  [/\bprocessing personal data\b/gi, "using personal data"],
  [/\bprocessing of my personal data\b/gi, "use of my personal data"],
  [/\bprocessing of children's data\b/gi, "use of children's data"],
  [/\bprocessing of personal data\b/gi, "use of personal data"],
  [/\bprocessing activities\b/gi, "ways personal data is used"],
  [/\bprocessing activity\b/gi, "way personal data is used"],
  [/\bprocessing operations\b/gi, "ways data is used"],
  [/\bprocessing operation\b/gi, "way data is used"],
  [/\bprocessing purposes?\b/gi, "reasons for using the data"],
  [/\bprocessing\b/gi, "using data"],
  [/\bidentities of fiduciaries and processors\b/gi, "names of responsible organisations and data handlers"],
  [/\bData Fiduciary for personal data\b/g, "organisation responsible for the personal data"],
  [/\bmeans any data about an individual who is identifiable by or in relation to such data\b/gi, "means any data about a person who can be identified from that data or related data"],
  [/\bmeans the individual to whom the personal data relates\b/gi, "means the person the personal data is about"],
  [/\bLawful basis\b/g, "Legal reason"],
  [/\bLegal & Compliance\b/g, "Legal and law-following work"],
  [/\bCompliance Team\b/g, "Team responsible for following the law"],
  [/\bLabour compliance\b/gi, "following labour law"],
  [/\bCompliance archive\b/gi, "records kept to show the law was followed"],
  [/\bStatutory archive\b/gi, "records kept because the law requires it"],
  [/\bStatutory filings\b/gi, "filings required by law"],
  [/\bMarketing and promotional communications\b/gi, "Marketing messages"],
  [/\bPayment processing\b/gi, "Handling payments"],
  [/\bPayroll processing\b/gi, "Running payroll"],
  [/\bISO 27001-aligned information security management system\b/gi, "information security system aligned with ISO 27001"],
  [/\bAssess harm likelihood\b/gi, "Check how likely each harm is"],
  [/\breputational harm\b/gi, "damage to reputation"],
  [/\bfinancial reporting\b/gi, "financial reports"],
  [/\bhuman resources administration\b/gi, "human resources work"],
  [/\bmanagement oversight\b/gi, "management supervision"],
  [/\bproposes to transfer\b/gi, "plans to send"],
  [/\bprovides written certification\b/gi, "confirms this in writing"],
  [/\bcertif(?:y|ies) deletion\b/gi, "confirm deletion in writing"],
  [/\bwritten certification\b/gi, "written confirmation"],
  [/\bsecurity incident involving\b/gi, "security event affecting"],
  [/\bcommitted to being transparent\b/gi, "committed to explaining clearly"],
  [/\bis in scope\b/gi, "is covered"],
  [/\bgovern employee personal data lawfully\b/gi, "set lawful rules for employee personal data"],
  [/\binternational or intra-group transfer\b/gi, "transfer abroad or within a company group"],
  [/\bdocumented instructions\b/gi, "written instructions"],
  [/\bdetails sufficient for\b/gi, "enough details for"],
  [/\bwithin (twenty-four|thirty|ninety) \((24|30|90)\) hours? of\b/gi, "within $1 ($2) hours after"],
  [/\bwithin (twenty-four|thirty|ninety) \((24|30|90)\) days? of\b/gi, "within $1 ($2) days after"],
  [/\bOn termination\b/gi, "When the agreement ends"],
  [/\btermination\b/gi, "the agreement ending"],
  [/\bCross-Border Personal Data Transfer Agreement\b/g, "Personal Data Transfer Abroad Agreement"],
  [/\bPersonal Data Breach Response Playbook\b/g, "Personal Data Leak Response Plan"],
  [/\bEmployee Personal Data Protection Policy\b/g, "Policy for Protecting Employee Personal Data"],
  [/\bhigh-risk vendors subject to\b/gi, "high-risk vendors must undergo"],
  [/\bwritten confidentiality obligations\b/gi, "written duties to keep data confidential"],
  [/\bpursuant to\b/gi, "under"],
  [/\bconstitutes?\b/gi, "is"],
  [/\bshall be\b/gi, "must be"],
  [/\bshall\b/gi, "must"],
  [/\bhereby\b/gi, ""],
  [/\bthereafter\b/gi, "after that"],
  [/\bprior to\b/gi, "before"],
  [/\bin the event of\b/gi, "if"],
  [/\bwith regard to\b/gi, "for"],
  [/\bin accordance with\b/gi, "under"],
  [/\bnotwithstanding\b/gi, "despite"],
  [/\bsolely\b/gi, "only"],
  [/\bcommence\b/gi, "start"],
  [/\bcease\b/gi, "stop"],
  [/\bretain(ed|ing)?\b/gi, (_, ending: string | undefined) => ending?.toLowerCase() === "ed" ? "kept" : ending?.toLowerCase() === "ing" ? "keeping" : "keep"],
  [/\bretention\b/gi, "keeping"],
  [/\berasure\b/gi, "deletion"],
  [/\berase(d)?\b/gi, (_, ending: string | undefined) => ending ? "deleted" : "delete"],
  [/\bgrievance redressal\b/gi, "complaint handling"],
  [/\bgrievance\b/gi, "complaint"],
  [/\bremediation\b/gi, "fixes"],
  [/\bmitigations?\b/gi, "risk controls"],
  [/\bparticulars\b/gi, "details"],
  [/\bpersons?\b/gi, (word: string) => word.toLowerCase() === "persons" ? "people" : "person"],
  [/\bindividuals\b/gi, "people"],
  [/\bnotify\b/gi, "tell"],
  [/\bnotification\b/gi, "notice"],
  [/\bcommence\b/gi, "start"],
  [/\bterminate(d|s|ion)?\b/gi, (_, ending: string | undefined) => ending?.toLowerCase() === "d" ? "ended" : ending?.toLowerCase() === "s" ? "ends" : ending?.toLowerCase() === "ion" ? "ending" : "end"],
  [/\bfulfilment\b/gi, "completion"],
  [/\bdisclose(d|s|ure)?\b/gi, (_, ending: string | undefined) => ending?.toLowerCase() === "d" ? "shared" : ending?.toLowerCase() === "s" ? "shares" : ending?.toLowerCase() === "ure" ? "sharing" : "share"],
  [/\bunauthorised\b/gi, "not allowed"],
  [/\bmandatory\b/gi, "required"],
  [/\butilise\b/gi, "use"],
  [/\bapproximately\b/gi, "about"],
  [/\badditional\b/gi, "extra"],
  [/\bsubsequent\b/gi, "later"],
  [/\bregarding\b/gi, "about"],
  [/\brequest that\b/gi, "ask that"],
  [/\bmake available\b/gi, "provide"],
  [/\bfor the purpose of\b/gi, "to"],
  [/\bfor purposes of\b/gi, "to"],
  [/\bacts as\b/gi, "serves as"],
  [/\baffiliated entities\b/gi, "companies in the same group"],
  [/\baffirmative action\b/gi, "a clear action showing agreement"],
  [/\banonymised\b/gi, "made anonymous"],
  [/\bappropriate\b/gi, "suitable"],
  [/\bassessment\b/gi, "review"],
  [/\bauthorisation\b/gi, "permission"],
  [/\bauthorised\b/gi, "approved"],
  [/\bbecoming aware of\b/gi, "learning about"],
  [/\bbound by\b/gi, "required to follow"],
  [/\bcategories\b/gi, "types"],
  [/\bcategory\b/gi, "type"],
  [/\bcompliant\b/gi, "lawful"],
  [/\bcompliance with\b/gi, "following"],
  [/\bconducted\b/gi, "done"],
  [/\bconfidentiality obligations\b/gi, "written duties to keep data confidential"],
  [/\bconferred under\b/gi, "given by"],
  [/\bconsolidated\b/gi, "combined"],
  [/\bcore services\b/gi, "main services"],
  [/\bdata categories\b/gi, "types of data"],
  [/\bdata minimisation\b/gi, "collecting only the data needed"],
  [/\bdesignation\b/gi, "job title"],
  [/\bdissemination\b/gi, "sharing"],
  [/\bduration of\b/gi, "time that"],
  [/\bengage(d|s)?\b/gi, (_, ending: string | undefined) => ending?.toLowerCase() === "d" ? "hired" : ending?.toLowerCase() === "s" ? "hires" : "hire"],
  [/\bensure\b/gi, "make sure"],
  [/\bequivalent to\b/gi, "as strong as"],
  [/\bexcessive\b/gi, "unreasonably large"],
  [/\bexecute(d)?\b/gi, (_, ending: string | undefined) => ending ? "signed" : "sign"],
  [/\bexercise (my|your|their) rights\b/gi, "use $1 rights"],
  [/\bexternal notification\b/gi, "notice outside the organisation"],
  [/\bgoverned by\b/gi, "controlled by"],
  [/\bimplement(ed)?\b/gi, (_, ending: string | undefined) => ending ? "put in place" : "put in place"],
  [/\bin conjunction with\b/gi, "together with"],
  [/\bintegral part\b/gi, "required part"],
  [/\bmanifestly unfounded\b/gi, "clearly without a valid basis"],
  [/\bmechanism\b/gi, "process"],
  [/\bmonitor\b/gi, "check"],
  [/\bnecessity and proportionality\b/gi, "need and fair scope"],
  [/\bobligations\b/gi, "duties"],
  [/\bobligation\b/gi, "duty"],
  [/\bobtain(ed)?\b/gi, (_, ending: string | undefined) => ending ? "received" : "get"],
  [/\bperform(ed|ance)?\b/gi, (_, ending: string | undefined) => ending?.toLowerCase() === "ed" ? "done" : ending?.toLowerCase() === "ance" ? "carrying out" : "carry out"],
  [/\bprescribed\b/gi, "required"],
  [/\bprovision of\b/gi, "providing"],
  [/\breasonable grounds\b/gi, "valid reasons"],
  [/\brecipients\b/gi, "people or organisations receiving data"],
  [/\bregulatory\b/gi, "authority"],
  [/\bremains accountable\b/gi, "remains responsible"],
  [/\brepresentatives\b/gi, "people acting for someone else"],
  [/\bresponding to\b/gi, "handling"],
  [/\bsafeguards\b/gi, "protections"],
  [/\bsignatory\b/gi, "person signing"],
  [/\bspecified\b/gi, "stated"],
  [/\bsubject to\b/gi, "depending on"],
  [/\bsuspend\b/gi, "pause"],
  [/\btransparency\b/gi, "openness"],
  [/\bverification\b/gi, "checking"],
  [/\bverify\b/gi, "check"],
  [/\bwhere applicable\b/gi, "when this applies"],
  [/\bas applicable\b/gi, "when relevant"],
  [/\bis required to\b/gi, "must"],
  [/\bare required to\b/gi, "must"],
  [/\bhas the right to\b/gi, "may"],
  [/\bincluding but not limited to\b/gi, "including"],
];

const MALFORMED = [
  /\b(?:a|an|the|each|every|affected)\s+(?:a|an|the)\b/i,
  /\bI permission\b/i,
  /\b(\w+)\s+\1\b/i,
  /\busing data purposes\b/i,
];

const PROTECTED_TOKEN = /https?:\/\/[^\s),;]+[\w/#]|\{\{[^}]+\}\}|\[[A-Z][A-Z0-9 _/-]+\]|\b(?:Section|Rule|Chapter)\s+\d+(?:\([a-z0-9]+\))*|\b(?:Acme Digital Solutions Private Limited|Acme Digital Pte\. Ltd\.|Data Protection Board(?: of India)?|Digital Personal Data Protection Act, 2023|Digital Personal Data Protection Rules, 2025)\b|(?:₹|\bRs\.?\s*)[\d,.]+(?:\s*(?:crore|lakh))?|\b\d+(?:[.,:]\d+)*(?:%|st|nd|rd|th)?\b/gi;

function protectedTokens(text: string): string[] {
  return [...text.matchAll(PROTECTED_TOKEN)].map(([token]) => token);
}

function validatePair(normal: string, plain: string): void {
  const before = protectedTokens(normal);
  const after = protectedTokens(plain);
  if (before.length !== after.length || before.some((token, index) => token !== after[index])) {
    throw new Error(`Easy-read mapping changed a protected token: ${normal} -> ${plain}`);
  }
  if (MALFORMED.some((pattern) => pattern.test(plain))) {
    throw new Error(`Easy-read mapping produced malformed text: ${normal} -> ${plain}`);
  }
}

function plainText(normal: string): string {
  let plain = normal;
  for (const [pattern, replacement] of REPLACEMENTS) {
    plain = typeof replacement === "string"
      ? plain.replace(pattern, replacement)
      : plain.replace(pattern, replacement);
  }
  return plain
    .replace(/\s+([,.;:])/g, "$1")
    .replace(/ {2,}/g, " ")
    .trim();
}

function sectionStrings(section: DocSection): string[] {
  switch (section.type) {
    case "doccontrol":
      return section.rows
        .filter(([key]) => ["Classification", "Document owner", "Applicable law"].includes(key))
        .flat();
    case "meta":
    case "heading":
    case "subheading":
    case "para":
      return [section.text];
    case "clause":
      return [section.text];
    case "bullets":
      return section.items;
    case "table":
      return [...section.headers, ...section.rows.flat()];
    case "divider":
      return [];
  }
}

function isProfessionalProse(text: string): boolean {
  const value = text.trim();
  if (!value || /^[_\s☐/ \-]+$/.test(value)) return false;
  if (/^(https?:|[\w.+-]+@[\w.-]+\.|\+?\d[\d\s()\-]+$)/i.test(value)) return false;
  if (/^[A-Z0-9._#+\/-]{1,24}$/.test(value) && !/[a-z]{3}/.test(value)) return false;
  return value.split(/\s+/).length >= 3 || REPLACEMENTS.some(([pattern]) => {
    pattern.lastIndex = 0;
    return pattern.test(value);
  });
}

const sourcePairs: Pair[] = [];

for (const template of TEMPLATES) {
  for (const normal of [template.summary, template.overview, template.use]) {
    const plain = plainText(normal);
    if (plain !== normal) {
      validatePair(normal, plain);
      sourcePairs.push([normal, plain]);
    }
  }

  const document = TEMPLATE_DOCUMENTS[template.slug];
  if (!document) continue;
  for (const normal of [document.title, ...document.sections.flatMap(sectionStrings)]) {
    if (!isProfessionalProse(normal)) continue;
    const plain = plainText(normal);
    if (plain !== normal) {
      validatePair(normal, plain);
      sourcePairs.push([normal, plain]);
    }
  }
}

const seen = new Set<string>();

export const PAIRS: [string, string][] = [...EXACT_UI_PAIRS, ...sourcePairs].filter(
  ([normal, plain]) =>
    normal.replace(/\s+/g, " ").trim() !== plain.replace(/\s+/g, " ").trim() &&
    !EXISTING_NORMALS.has(normal) &&
    !seen.has(normal) &&
    seen.add(normal)
);