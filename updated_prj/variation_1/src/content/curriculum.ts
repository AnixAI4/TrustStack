/**
 * The full certification curriculum - the actual study material behind the
 * eight section-mapped modules. Each module carries real theory: a narrative
 * overview, section-by-section lessons with plain-English translations, a
 * glossary, a worked real-world scenario, common pitfalls, an actionable
 * checklist, key takeaways and a self-check knowledge quiz.
 *
 * Legal content maps to the Digital Personal Data Protection Act, 2023 and the
 * Draft DPDP Rules, 2025. Question material is aligned with the dpdpa.com bank
 * (Adv. (Dr.) Prashant Mali), used with permission. The explanatory writing,
 * scenarios and learning aids are original to TrustStack's DPDP Academy.
 */
import {
  Layers,
  FileSignature,
  Scale,
  UserCheck,
  Lock,
  Baby,
  Building2,
  Landmark,
  type LucideIcon,
} from "lucide-react";

export type KeyTerm = { term: string; definition: string };

export type Scenario = {
  title: string;
  situation: string;
  analysis: string;
  lesson: string;
};

export type Lesson = {
  heading: string;
  ref?: string;
  body: string[];
  bullets?: string[];
  plainEnglish?: string;
};

export type QuizQuestion = {
  q: string;
  options: string[];
  answer: number;
  explanation: string;
};

export type ModuleLesson = {
  n: number;
  slug: string;
  title: string;
  refs: string;
  minutes: number;
  icon: LucideIcon;
  /** short bullets shown on the certification card */
  points: string[];
  /** one-paragraph overview shown in the hero */
  summary: string;
  /** narrative motivation */
  whyItMatters: string;
  lessons: Lesson[];
  keyTerms: KeyTerm[];
  scenario: Scenario;
  pitfalls: string[];
  checklist: string[];
  takeaways: string[];
  quiz: QuizQuestion[];
};

export const MODULES: ModuleLesson[] = [
  // ─────────────────────────────────────────────────────────────────────────
  {
    n: 1,
    slug: "foundations",
    title: "Foundations of the DPDP Act",
    refs: "Section 1-3 · Scope & definitions",
    minutes: 25,
    icon: Layers,
    points: [
      "Who the Act binds - territorial and extra-territorial reach",
      "Data Principal, Data Fiduciary and Data Processor roles",
      "What counts as digital personal data, and what's exempt",
    ],
    summary:
      "The Digital Personal Data Protection Act, 2023 is India's first standalone, omnibus law for digital personal data. This module sets the foundations every later obligation rests on: when the law came into being, the precise vocabulary it uses, and exactly when and where it applies - including its long extra-territorial arm.",
    whyItMatters:
      "Every duty in the rest of the Act hangs on three questions: is this digital personal data, who is the Data Fiduciary, and does the Act even reach this processing? Misjudge the foundations and every control you build afterwards is pointed in the wrong direction.",
    lessons: [
      {
        heading: "A short history, and the shape of the law",
        ref: "Section 1",
        body: [
          "The DPDP Act was enacted on 11 August 2023 (Act 22 of 2023) and comes into force on dates the Central Government notifies - different provisions can be switched on at different times. It runs to 44 sections and a single Schedule of penalties.",
          "It replaces the thin data-protection scaffolding India relied on earlier - Section 43A of the Information Technology Act, 2000 and the 2011 'Sensitive Personal Data' rules. The Draft DPDP Rules, 2025 supply the operational detail the Act leaves to delegated legislation: timelines, security expectations, breach formats and Consent Manager registration.",
        ],
        plainEnglish:
          "Think of the Act as the constitution and the 2025 Rules as the operating manual. You need both to know what to actually do.",
      },
      {
        heading: "The cast - who's who under the Act",
        ref: "Section 2",
        body: [
          "Four roles do most of the work. The Data Principal is the individual the data is about. For a child it includes the parent or lawful guardian; for a person with disability it includes their lawful guardian. The Data Fiduciary is the person who, alone or with others, determines the purpose and means of processing - the decision-maker. The Data Processor processes personal data on a Fiduciary's behalf, under its instructions.",
          "Two more roles matter early: a Consent Manager is a Board-registered platform through which a principal can give, manage, review and withdraw consent; and the Data Protection Board of India is the regulator that enforces the Act.",
        ],
        bullets: [
          "Data Principal - the individual the data is about (and their guardian, where relevant)",
          "Data Fiduciary - decides why and how data is processed (carries the legal duties)",
          "Data Processor - does the processing under the Fiduciary's instructions",
          "Consent Manager - a registered platform for managing consent",
        ],
        plainEnglish:
          "Fiduciary = decides the 'why and how'. Processor = does the work under instruction. The Fiduciary keeps the legal responsibility either way.",
      },
      {
        heading: "What is 'digital personal data'?",
        ref: "Section 2",
        body: [
          "Personal data is any data about an individual who is identifiable by or in relation to that data. The Act protects the digital form of it: data collected in digital form, or collected in non-digital form and then digitised. Purely paper records that are never digitised fall outside the Act.",
          "'Processing' is deliberately broad - any wholly or partly automated operation on personal data: collection, recording, organisation, storage, retrieval, use, sharing, disclosure, alignment, restriction, erasure or destruction. If you so much as store a name, you are processing.",
        ],
        plainEnglish:
          "If a human is identifiable from it and it lives in (or will be put into) a computer, it's in scope. 'Processing' covers basically anything you do with it, including just keeping it.",
      },
      {
        heading: "Where the Act reaches - application and extra-territoriality",
        ref: "Section 3",
        body: [
          "The Act applies to the processing of digital personal data within India. Crucially, it also reaches processing outside India when that processing is in connection with offering goods or services to Data Principals in India. A company with no Indian office is still bound if it serves Indian users.",
          "Two carve-outs sit at the edge. The Act does not apply to personal data processed by an individual for any personal or domestic purpose, nor to personal data the principal has themselves made publicly available - or that someone under a legal obligation to publish has made public (for example, a company director's details in a public filing).",
        ],
        plainEnglish:
          "'We're not based in India' is not a defence. If you target or serve people in India, the Act follows the data to you.",
      },
    ],
    keyTerms: [
      { term: "Data Principal", definition: "The identifiable individual to whom the personal data relates; includes the parent/lawful guardian of a child and the lawful guardian of a person with disability." },
      { term: "Data Fiduciary", definition: "Any person who alone or with others determines the purpose and means of processing personal data - the party that carries the Act's obligations." },
      { term: "Data Processor", definition: "Any person who processes personal data on behalf of a Data Fiduciary, under a valid contract and the Fiduciary's instructions." },
      { term: "Personal data", definition: "Any data about an individual who is identifiable by or in relation to such data." },
      { term: "Processing", definition: "A wholly or partly automated operation on personal data - collection, storage, use, sharing, erasure and everything in between." },
      { term: "Consent Manager", definition: "A platform registered with the Board that lets a Data Principal give, manage, review and withdraw consent through an accessible, interoperable interface." },
    ],
    scenario: {
      title: "The overseas SaaS startup",
      situation:
        "A US analytics startup with no office, server or staff in India sells software to Indian retailers and, through it, processes the personal data of those retailers' Indian customers.",
      analysis:
        "Because the processing is in connection with offering services to Data Principals in India, Section 3's extra-territorial limb applies. The startup is a Data Fiduciary (or a Processor for the retailers, depending on who sets purpose and means) and is fully bound by the Act despite having no Indian presence.",
      lesson:
        "No Indian entity, office or server is required for the Act to bite. Targeting Indian users is enough.",
    },
    pitfalls: [
      "Assuming 'we have no India entity' means the Act doesn't apply - extra-territorial reach defeats that.",
      "Believing paper files are covered - only digital, or digitised, personal data is in scope.",
      "Treating any public data as fair game - the carve-out is narrow (data the principal themselves made public, or a legally required publication).",
      "Confusing Fiduciary and Processor - only the party that decides purpose and means carries the primary duties.",
    ],
    checklist: [
      "List every dataset of personal data your organisation touches.",
      "For each, decide whether you are the Data Fiduciary or a Data Processor.",
      "Identify which data is digital or will be digitised (in scope) versus purely paper (out of scope).",
      "Confirm whether each processing activity is caught by Section 3, including anything done from abroad.",
    ],
    takeaways: [
      "The DPDP Act, 2023 is India's first omnibus digital-personal-data law; the 2025 Rules operationalise it.",
      "Four roles drive everything: Data Principal, Data Fiduciary, Data Processor and the Board.",
      "Scope is digital personal data about an identifiable individual; 'processing' is almost anything you do with it.",
      "Section 3 reaches outside India whenever you offer goods or services to people in India.",
    ],
    quiz: [
      {
        q: "A company based entirely outside India offers a service to users located in India and processes their personal data abroad. Does the DPDP Act apply?",
        options: [
          "No - the Act only applies to processing physically carried out in India",
          "Yes - Section 3 extends the Act to processing outside India done in connection with offering goods or services to people in India",
          "Only if the company has a registered office in India",
          "Only if the data is later transferred into India",
        ],
        answer: 1,
        explanation:
          "Section 3 gives the Act extra-territorial reach: it applies to processing outside India where that processing is in connection with offering goods or services to Data Principals in India.",
      },
      {
        q: "Who is the 'Data Fiduciary' under the Act?",
        options: [
          "The individual whose data is processed",
          "The vendor that processes data on instructions",
          "The person who alone or with others determines the purpose and means of processing",
          "The Data Protection Board of India",
        ],
        answer: 2,
        explanation:
          "The Data Fiduciary is the decision-maker - the person who determines the purpose and means of processing - and carries the Act's obligations even when a processor does the actual work.",
      },
      {
        q: "Which of these falls outside the DPDP Act?",
        options: [
          "Personal data collected online by a business",
          "Paper records later scanned into a system",
          "Personal data processed by an individual purely for a personal or domestic purpose",
          "Personal data of Indian users processed by an overseas service",
        ],
        answer: 2,
        explanation:
          "Section 3 exempts processing by an individual for personal or domestic purposes. Digitised paper records and overseas processing of Indian users' data are in scope.",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    n: 2,
    slug: "notice-consent",
    title: "Notice & Consent",
    refs: "Section 5-6 · Lawful basis",
    minutes: 30,
    icon: FileSignature,
    points: [
      "Itemised notice - what every notice must tell the principal",
      "Free, specific, informed and unambiguous consent",
      "Withdrawal, and the role of a Consent Manager",
    ],
    summary:
      "Consent is the headline lawful basis of the DPDP Act, and it only counts when it is built on a clear notice. This module walks the twin engine of lawful processing: the Section 5 notice that must come first, and the Section 6 standard that makes consent valid - including the right to withdraw it as easily as it was given.",
    whyItMatters:
      "A consent that is bundled, pre-ticked or buried is not consent at all - and processing on the back of it is unlawful from the first record. Getting notice-and-consent right is the difference between a defensible data estate and a penalty waiting to happen.",
    lessons: [
      {
        heading: "Two doors to lawful processing",
        ref: "Section 4",
        body: [
          "Section 4 says personal data may be processed only for a lawful purpose, and only on one of two grounds: the consent of the Data Principal, or one of the 'certain legitimate uses' listed in Section 7. Everything in this module is about the first door - consent. The second door is the subject of Module 3.",
        ],
        plainEnglish:
          "You always need a reason the law accepts. There are only two: the person said yes, or the law lets you proceed without asking.",
      },
      {
        heading: "Notice - the thing that must come first",
        ref: "Section 5",
        body: [
          "Every request for consent must be accompanied or preceded by a notice. The notice must, in clear and plain language, tell the principal: the personal data to be collected and the purpose of processing; how they can exercise their rights (including withdrawing consent and lodging a grievance); and how to complain to the Data Protection Board.",
          "The principal must be able to read that notice in English or in any language listed in the Eighth Schedule to the Constitution. Where consent was taken before the Act began, the Fiduciary must give a fresh notice as soon as reasonably practicable.",
        ],
        bullets: [
          "What data is collected, and the specific purpose",
          "How to exercise rights - including withdrawing consent",
          "How to lodge a grievance with the Fiduciary",
          "How to complain to the Data Protection Board",
          "Available in English or any of the 22 Eighth-Schedule languages",
        ],
        plainEnglish:
          "Before you ask 'do you agree?', you must plainly tell people what you'll do with their data and how they can push back.",
      },
      {
        heading: "Consent - the Section 6 standard",
        ref: "Section 6",
        body: [
          "Valid consent is free, specific, informed, unconditional and unambiguous, given by a clear affirmative action. It must signify agreement to processing only the personal data necessary for the specified purpose - a built-in data-minimisation rule. If a request goes beyond what the purpose needs, the excess is invalid even if the user clicked 'agree'.",
          "Consent cannot be hidden inside a wall of text, and it cannot be bundled with unrelated terms. A consent request that infringes the Act, the Rules or any other law has no legal effect to that extent.",
        ],
        plainEnglish:
          "Consent must be a clear, deliberate 'yes' to a specific, necessary use - not a side-effect of accepting a giant terms-and-conditions blob.",
      },
      {
        heading: "Withdrawal and the Consent Manager",
        ref: "Section 6",
        body: [
          "A principal can withdraw consent at any time, and withdrawing must be as easy as giving it was. The principal bears the consequences of withdrawal (a service may stop), but on withdrawal the Fiduciary - and its processors - must cease processing within a reasonable time unless some other law permits it.",
          "Consent can be given, managed, reviewed and withdrawn through a Consent Manager: a platform registered with the Board, accountable to the principal, that presents an accessible, transparent and interoperable interface.",
        ],
        plainEnglish:
          "If turning data collection on took one tap, turning it off must take about one tap too. A Consent Manager is the dashboard that makes that real.",
      },
    ],
    keyTerms: [
      { term: "Notice", definition: "The Section 5 statement that must accompany or precede a consent request, describing the data, the purpose, and how to exercise rights and complain." },
      { term: "Consent", definition: "A free, specific, informed, unconditional and unambiguous agreement given by a clear affirmative action, limited to data necessary for the stated purpose." },
      { term: "Clear affirmative action", definition: "A deliberate opt-in signal - a tap, tick or click. Silence, inactivity or pre-ticked boxes do not qualify." },
      { term: "Data minimisation", definition: "The rule that consent (and collection) extends only to the personal data necessary for the specified purpose." },
      { term: "Withdrawal of consent", definition: "The principal's right to revoke consent at any time, as easily as it was given, after which processing must stop within a reasonable time." },
      { term: "Eighth Schedule languages", definition: "The 22 official Indian languages in which a notice must be made available, alongside English." },
    ],
    scenario: {
      title: "The bundled checkbox",
      situation:
        "A food-delivery app shows a single 'I agree' checkbox that combines order processing, location tracking and consent to share data with advertising partners. You cannot use the app without ticking it.",
      analysis:
        "This fails Section 6 on two counts. Consent is not 'free' or 'unconditional' because access to the core service is conditioned on agreeing to unrelated marketing sharing, and it is not 'specific' because separate purposes are bundled into one tick. The marketing-sharing consent is invalid.",
      lesson:
        "Separate the purposes. Necessary processing can be a condition of service; non-necessary processing (like ad sharing) must be an independent, refusable choice.",
    },
    pitfalls: [
      "Bundling unrelated purposes into a single 'accept all' tick.",
      "Pre-ticked boxes or 'consent by continuing' - neither is a clear affirmative action.",
      "Vague purposes ('to improve our services') instead of a specific, stated use.",
      "No withdrawal path, or one far harder than the original opt-in.",
      "Offering the notice only in English when a principal needs an Eighth-Schedule language.",
    ],
    checklist: [
      "Draft a Section 5 notice for each purpose, in plain language and in the languages your users need.",
      "Unbundle consents so each non-necessary purpose is an independent, refusable choice.",
      "Replace pre-ticked boxes with explicit opt-in actions.",
      "Build a withdrawal control that is as easy as the original opt-in.",
      "Decide whether to integrate a registered Consent Manager.",
    ],
    takeaways: [
      "Lawful processing needs a lawful purpose plus one of two grounds - consent or a legitimate use.",
      "A notice must come first: what data, what purpose, what rights, and how to complain.",
      "Valid consent is free, specific, informed, unconditional and unambiguous, limited to necessary data.",
      "Withdrawal must be as easy as giving consent, and a Consent Manager can broker the whole lifecycle.",
    ],
    quiz: [
      {
        q: "Which of the following is NOT a requirement of valid consent under Section 6?",
        options: [
          "It is free, specific and informed",
          "It is given by a clear affirmative action",
          "It is permanent and cannot be withdrawn",
          "It is limited to the data necessary for the specified purpose",
        ],
        answer: 2,
        explanation:
          "Consent is explicitly withdrawable at any time, and withdrawal must be as easy as giving consent. Permanence is the opposite of the Section 6 standard.",
      },
      {
        q: "What must a notice under Section 5 include?",
        options: [
          "Only the name of the company collecting the data",
          "The personal data and purpose, how to exercise rights, and how to complain to the Board",
          "Just a link to the privacy policy",
          "The company's annual revenue",
        ],
        answer: 1,
        explanation:
          "A Section 5 notice must describe the personal data and the purpose, explain how to exercise rights (including withdrawal), and explain how to make a grievance and a complaint to the Board.",
      },
      {
        q: "A principal withdraws consent. What must the Data Fiduciary do?",
        options: [
          "Continue processing because consent was once given",
          "Cease processing within a reasonable time, unless another law permits it, and ensure its processors do too",
          "Charge a fee before stopping",
          "Wait for the Board to order it to stop",
        ],
        answer: 1,
        explanation:
          "On withdrawal, the Fiduciary and its processors must stop processing within a reasonable time unless some other legal ground applies. The principal bears the consequences of withdrawal.",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    n: 3,
    slug: "legitimate-uses",
    title: "Legitimate Uses",
    refs: "Section 4, Section 7 · Beyond consent",
    minutes: 20,
    icon: Scale,
    points: [
      "When processing is lawful without fresh consent",
      "The certain-legitimate-uses list and its limits",
      "Mapping a use to the right lawful ground",
    ],
    summary:
      "Consent is not the only door. The Act recognises a closed list of 'certain legitimate uses' where processing is lawful without asking again. This module maps that list, and - just as importantly - its boundaries, because a legitimate use removes the consent requirement, not the duty of care.",
    whyItMatters:
      "Organisations routinely over-rely on consent for things the law already permits, and over-stretch 'legitimate use' for things it never covered. Knowing the exact list keeps you both compliant and practical.",
    lessons: [
      {
        heading: "The second door",
        ref: "Section 4",
        body: [
          "Section 4 offers two lawful grounds: consent, or the 'certain legitimate uses' in Section 7. The legitimate-use list is exhaustive - if your purpose is not on it, you are back to needing consent. There is no open-ended 'legitimate interest' balancing test like the GDPR's; the Indian list is specific and closed.",
        ],
        plainEnglish:
          "'Legitimate use' is a fixed menu, not a catch-all. If your purpose isn't on the menu, you must get consent.",
      },
      {
        heading: "The list of certain legitimate uses",
        ref: "Section 7",
        body: [
          "Section 7 permits processing without fresh consent in a defined set of situations. The most-used grounds in practice are voluntary provision, State delivery of benefits, legal obligations, and employment purposes - but the full list is broader, covering emergencies and public-interest situations.",
        ],
        bullets: [
          "Voluntary provision - the principal gives data for a purpose and has not indicated they object to its use for that purpose",
          "State benefits - a subsidy, benefit, service, certificate, licence or permit, where consent was given earlier or the data sits in a notified registry",
          "State functions, sovereignty, security and India's obligations under law",
          "Compliance with a legal obligation to disclose information to the State",
          "Compliance with a court judgment or order",
          "Medical emergency involving a threat to life or health",
          "Provision of medical treatment or health services during an epidemic or threat to public health",
          "Safety and assistance during a disaster or breakdown of public order",
          "Employment purposes - safeguarding the employer, providing services or benefits to employees",
        ],
        plainEnglish:
          "Emergencies, lawful State delivery, court orders, your duties as an employer, and data someone hands you voluntarily for a clear purpose - these don't need a fresh consent click.",
      },
      {
        heading: "What a legitimate use does NOT switch off",
        ref: "Section 7 & Section 8",
        body: [
          "Relying on a legitimate use removes the need to obtain consent. It does not remove the Section 8 obligations - accuracy, reasonable security safeguards, breach notification and retention limits all still apply. Nor does it let you process for a different purpose than the one that justified the legitimate use.",
        ],
        plainEnglish:
          "Skipping consent is not skipping responsibility. You still have to secure the data, keep it accurate, and delete it when you're done.",
      },
    ],
    keyTerms: [
      { term: "Certain legitimate uses", definition: "The closed Section 7 list of situations in which personal data may be processed without obtaining fresh consent." },
      { term: "Voluntary provision", definition: "Where a principal hands over data for a particular purpose and has not indicated an objection to its use for that purpose." },
      { term: "Employment purposes", definition: "A legitimate use covering processing to safeguard the employer from loss, or to provide services and benefits to employees." },
      { term: "Medical emergency", definition: "A legitimate use permitting processing to respond to a threat to the life or immediate health of the principal or another individual." },
      { term: "Notified registry", definition: "A government-maintained database from which the State may draw personal data to deliver a benefit or service under Section 7." },
    ],
    scenario: {
      title: "The employer's two purposes",
      situation:
        "An employer processes staff attendance, payroll and performance data without taking a separate consent. Its marketing team then wants to use the same employee contact list to promote the company's consumer products.",
      analysis:
        "Processing attendance, payroll and performance falls squarely within the Section 7 employment-purposes ground - no fresh consent needed. But promoting consumer products to staff is not an employment purpose; it is ordinary marketing, which needs consent under Section 6.",
      lesson:
        "A legitimate use covers only the purpose that justifies it. The moment you repurpose the data, re-run the lawful-basis test.",
    },
    pitfalls: [
      "Treating 'legitimate use' as a free pass for any business purpose - the list is closed.",
      "Assuming a legitimate use removes the Section 8 duties of security, accuracy and erasure.",
      "Using the employment ground to justify marketing or unrelated profiling of staff.",
      "Stretching 'voluntary provision' to cover uses the principal never had in view.",
    ],
    checklist: [
      "List your processing purposes and test each against the Section 7 list.",
      "Where a legitimate use applies, document which limb and why.",
      "Where it does not, fall back to a Section 5 notice and Section 6 consent.",
      "Confirm Section 8 safeguards still apply to every legitimate-use activity.",
    ],
    takeaways: [
      "There are exactly two lawful grounds - consent, or a Section 7 certain legitimate use.",
      "The legitimate-use list is closed; there is no open 'legitimate interest' balancing test.",
      "Common grounds: voluntary provision, State benefits, legal obligations, emergencies and employment.",
      "Legitimate use waives consent, never the duties of security, accuracy and erasure.",
    ],
    quiz: [
      {
        q: "How does the DPDP Act's approach to processing without consent differ from the GDPR's 'legitimate interest'?",
        options: [
          "It uses an identical open-ended balancing test",
          "It provides a closed, exhaustive list of certain legitimate uses",
          "It never allows processing without consent",
          "It allows any purpose a business considers reasonable",
        ],
        answer: 1,
        explanation:
          "Unlike the GDPR's open balancing test, Section 7 sets out a specific, closed list. If a purpose is not on it, consent is required.",
      },
      {
        q: "An employer processes payroll data for its staff. Which lawful ground typically applies?",
        options: [
          "It is always unlawful without explicit consent",
          "The Section 7 'employment purposes' legitimate use",
          "Only a court order can authorise it",
          "The medical-emergency ground",
        ],
        answer: 1,
        explanation:
          "Processing to provide services and benefits to employees, and to safeguard the employer, falls within the employment-purposes legitimate use in Section 7.",
      },
      {
        q: "Relying on a legitimate use means a Data Fiduciary can ignore which obligation?",
        options: [
          "Reasonable security safeguards",
          "Keeping the data accurate",
          "Erasing data when the purpose is served",
          "None - the Section 8 obligations still apply",
        ],
        answer: 3,
        explanation:
          "A legitimate use only removes the consent requirement. Security, accuracy, breach notification and retention limits under Section 8 continue to apply.",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    n: 4,
    slug: "rights-duties",
    title: "Data Principal Rights & Duties",
    refs: "Section 11-15 · The individual",
    minutes: 25,
    icon: UserCheck,
    points: [
      "Access, correction, completion and erasure",
      "Grievance redressal and the right of nomination",
      "Duties the Act places on the principal",
    ],
    summary:
      "The Act gives individuals a concrete set of rights - and, unusually, a set of duties too. This module covers the four rights a Data Principal can exercise, the grievance ladder behind them, and the duties that come with the territory.",
    whyItMatters:
      "Rights are operational obligations for the Fiduciary: each is a request you must be able to receive, verify and act on within a timeline. Build the plumbing once, and rights stop being a fire-drill.",
    lessons: [
      {
        heading: "The right to access information",
        ref: "Section 11",
        body: [
          "On request, a Data Principal is entitled to a summary of the personal data being processed and the processing activities undertaken; the identities of all other Data Fiduciaries and Processors with whom the data has been shared, along with a description of what was shared; and any other information prescribed by the Rules.",
        ],
        plainEnglish:
          "People can ask 'what do you have on me, and who have you given it to?' - and you must be able to answer.",
      },
      {
        heading: "The right to correction, completion, updating and erasure",
        ref: "Section 12",
        body: [
          "A principal can ask the Fiduciary to correct inaccurate or misleading data, complete incomplete data, update it, and erase it. The Fiduciary must comply - but may decline erasure where retention is required for a specified purpose or to comply with any law in force.",
        ],
        plainEnglish:
          "People can fix, finish or delete their data. You can refuse deletion only when the law (or the live purpose) genuinely requires you to keep it.",
      },
      {
        heading: "The right of grievance redressal",
        ref: "Section 13",
        body: [
          "Every Fiduciary (and Consent Manager) must provide a readily available means for principals to raise grievances, and must respond within the period prescribed by the Rules. A principal must exhaust this grievance route before approaching the Data Protection Board.",
        ],
        plainEnglish:
          "You must offer a real complaints channel and answer within the clock. Users go to the Board only after you've had your chance to fix it.",
      },
      {
        heading: "The right to nominate, and the duties of the principal",
        ref: "Section 14 & Section 15",
        body: [
          "A principal may nominate another individual to exercise their rights in the event of death or incapacity. Balancing the rights, Section 15 places duties on the principal: comply with applicable laws when exercising rights; never impersonate another; never suppress material information; never raise a false or frivolous grievance; and furnish only authentic information when seeking correction or erasure.",
          "Breach of these duties is the one place an individual can be penalised - up to ₹10,000 under the Schedule.",
        ],
        plainEnglish:
          "You can name a successor for your data rights. And the law expects you to be honest when you use those rights - lying or filing junk complaints can cost you.",
      },
    ],
    keyTerms: [
      { term: "Right to access", definition: "The principal's right to a summary of their processed data, the activities performed, and the identities of those it was shared with." },
      { term: "Right to erasure", definition: "The right to have personal data deleted, subject to retention required by law or for a live specified purpose." },
      { term: "Grievance redressal", definition: "The mandatory, readily-available complaints channel a Fiduciary must offer and answer within a prescribed period." },
      { term: "Right to nominate", definition: "The principal's right to name another individual to exercise their rights on death or incapacity." },
      { term: "Duties of the Data Principal", definition: "Section 15 obligations to act lawfully and honestly when exercising rights; breach can attract a penalty up to ₹10,000." },
    ],
    scenario: {
      title: "Erasure meets a legal hold",
      situation:
        "A customer asks their bank to erase all their personal data. The bank is required by RBI directions and anti-money-laundering law to retain certain transaction records for years.",
      analysis:
        "The right to erasure under Section 12 is not absolute. Where another law in force requires the data to be retained, the Fiduciary may decline erasure to that extent - but only for the data the retention obligation actually covers, and it should still erase anything outside that scope.",
      lesson:
        "Rights are balanced against legal retention duties. 'We must keep it by law' is a valid, but narrow, answer - scope it precisely.",
    },
    pitfalls: [
      "Having no grievance channel, or no defined response time.",
      "Deleting data that another law actually requires you to retain.",
      "Refusing all erasure by over-claiming a legal hold that covers only part of the data.",
      "Ignoring the right to nominate, leaving no path for a deceased principal's data.",
    ],
    checklist: [
      "Stand up an access-request process that can report what you hold and who you shared it with.",
      "Build correction and erasure workflows, with a documented legal-hold exception.",
      "Publish a grievance channel and commit to the prescribed response time.",
      "Offer a nomination facility and record nominations.",
    ],
    takeaways: [
      "Principals have rights to access, correction/erasure, grievance redressal and nomination.",
      "Erasure can be refused only where law or a live purpose requires retention - and only to that extent.",
      "Grievance redressal must be exhausted before a principal approaches the Board.",
      "Section 15 imposes duties on principals; breaching them can cost up to ₹10,000.",
    ],
    quiz: [
      {
        q: "Under the right to access, what is a Data Principal entitled to know?",
        options: [
          "Nothing until the Board orders disclosure",
          "Only whether the company holds any data at all",
          "A summary of their data, the processing done, and the identities of those it was shared with",
          "The personal data of other customers for comparison",
        ],
        answer: 2,
        explanation:
          "Section 11 entitles the principal to a summary of their personal data and processing activities, plus the identities of other Fiduciaries and Processors the data was shared with and a description of what was shared.",
      },
      {
        q: "When can a Data Fiduciary refuse a Section 12 erasure request?",
        options: [
          "Whenever it finds erasure inconvenient",
          "Where retention is required by law or for a live specified purpose",
          "It can never refuse erasure",
          "Only with the principal's permission",
        ],
        answer: 1,
        explanation:
          "Erasure is not absolute. A Fiduciary may retain data where a law in force, or a continuing specified purpose, requires it - but only to that extent.",
      },
      {
        q: "What is the maximum penalty an individual Data Principal can face for breaching their Section 15 duties?",
        options: ["No penalty applies to individuals", "₹10,000", "₹50 crore", "₹250 crore"],
        answer: 1,
        explanation:
          "The Schedule sets a penalty of up to ₹10,000 for breach of a Data Principal's duties - the only place the Act penalises individuals rather than Fiduciaries.",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    n: 5,
    slug: "fiduciary-obligations",
    title: "Data Fiduciary Obligations",
    refs: "Section 8 · Accountability",
    minutes: 30,
    icon: Lock,
    points: [
      "Accuracy, reasonable security safeguards and retention limits",
      "Processor contracts and erasure on withdrawal",
      "The evidence that proves you met the standard",
    ],
    summary:
      "Section 8 is the spine of the Act - the general obligations every Data Fiduciary carries. This module covers accountability for processors, accuracy, security safeguards, breach notification, retention limits and the duty to publish a contact and a grievance route.",
    whyItMatters:
      "Most enforcement risk lives here. The single largest penalty in the Schedule - up to ₹250 crore - attaches to failing the Section 8 security-safeguards duty. This is where compliance is won or lost.",
    lessons: [
      {
        heading: "You can outsource the work, not the accountability",
        ref: "Section 8(1)-(2)",
        body: [
          "A Data Fiduciary is responsible for complying with the Act for all processing undertaken by it or on its behalf by a Data Processor. You may engage a processor only under a valid contract. If the processor mishandles the data, the Fiduciary remains answerable.",
        ],
        plainEnglish:
          "Hiring a vendor doesn't transfer the legal duty. If they fail, you're the one the Board comes to.",
      },
      {
        heading: "Accuracy where it counts, and reasonable security safeguards",
        ref: "Section 8(3)-(5)",
        body: [
          "Where personal data is used to make a decision that affects the principal, or is disclosed to another Fiduciary, it must be complete, accurate and consistent. Separately, the Fiduciary must protect the personal data in its possession or control - including data held by its processor - by taking reasonable security safeguards to prevent a breach.",
          "The 2025 Rules give shape to 'reasonable security safeguards': measures such as encryption, masking or tokenisation; access controls; logging and monitoring to detect unauthorised access; reasonable backups; and contractual security obligations on processors.",
        ],
        plainEnglish:
          "Keep decision-grade data correct, and lock the data down with real controls - encryption, access limits, logging, backups - not just a policy document.",
      },
      {
        heading: "Breach notification",
        ref: "Section 8(6)",
        body: [
          "In the event of a personal data breach, the Fiduciary must give intimation to the Data Protection Board and to each affected Data Principal, in the form and manner the Rules prescribe. (Module 8 covers the breach timeline and content in detail.)",
        ],
        plainEnglish:
          "If data is breached, you tell the regulator and the affected people - you don't get to keep it quiet.",
      },
      {
        heading: "Retention limits, and publishing your contact and grievance route",
        ref: "Section 8(7)-(10)",
        body: [
          "Personal data must be erased when the principal withdraws consent, or as soon as it is reasonable to assume the specified purpose is no longer being served - unless retention is required by law. The 2025 Rules add concrete inactivity-based erasure rules for certain large platforms (for example, erasing after a defined period of user inactivity).",
          "Finally, the Fiduciary must publish the business contact information of a Data Protection Officer or a person able to answer questions about processing, and must establish an effective grievance-redressal mechanism.",
        ],
        plainEnglish:
          "Don't hoard data forever - delete it when the job is done or the user leaves. And always give people a real person and a real channel to ask questions.",
      },
    ],
    keyTerms: [
      { term: "Reasonable security safeguards", definition: "The Section 8(5) duty to protect personal data from breach using appropriate technical and organisational measures - encryption, access control, logging, backups and more." },
      { term: "Personal data breach", definition: "Unauthorised processing or accidental disclosure, acquisition, sharing, alteration, loss or destruction of personal data that compromises its confidentiality, integrity or availability." },
      { term: "Retention limitation", definition: "The duty to erase personal data once consent is withdrawn or the purpose is served, unless a law requires retention." },
      { term: "Processor contract", definition: "The valid contract required before a Fiduciary may engage a Data Processor to process personal data on its behalf." },
      { term: "Decision-affecting data", definition: "Personal data used to make a decision about the principal or disclosed onward, which must be complete, accurate and consistent." },
    ],
    scenario: {
      title: "The vendor breach",
      situation:
        "A company outsources payroll to a third-party processor. The processor misconfigures a storage bucket and leaks employee salary records. The company protests that 'the vendor did it'.",
      analysis:
        "Under Section 8, the Fiduciary is responsible for processing carried out on its behalf, and the security-safeguards duty extends to data in the processor's hands. The Fiduciary is accountable for the safeguards and must drive the Section 8(6) breach notification - regardless of who physically erred.",
      lesson:
        "Security and breach duties follow the data into your processor's systems. Contract for it, audit it, and own the response.",
    },
    pitfalls: [
      "Blaming the processor - accountability stays with the Fiduciary.",
      "Engaging a processor without a valid contract.",
      "Treating security as an IT checkbox rather than encryption, access control, logging and backups.",
      "Retaining data indefinitely with no erasure trigger.",
      "Not publishing a DPO/contact or a working grievance channel.",
    ],
    checklist: [
      "Put a valid, security-bearing contract in place with every processor.",
      "Implement encryption, access control, logging and backups; keep evidence you did.",
      "Define retention periods and automated erasure triggers per dataset.",
      "Stand up a breach-notification runbook for the Board and affected principals.",
      "Publish DPO/contact details and a grievance-redressal mechanism.",
    ],
    takeaways: [
      "The Fiduciary is accountable for all processing done on its behalf, including by processors.",
      "Reasonable security safeguards are the Act's highest-stakes duty - up to ₹250 crore for failure.",
      "Erase data when consent is withdrawn or the purpose ends, unless law requires retention.",
      "Publish a DPO/contact and a grievance route; keep evidence that you met each duty.",
    ],
    quiz: [
      {
        q: "A Data Processor causes a breach. Who is accountable under Section 8?",
        options: [
          "Only the processor",
          "The Data Fiduciary, which is responsible for processing done on its behalf",
          "The Data Principal",
          "No one, if a contract exists",
        ],
        answer: 1,
        explanation:
          "Section 8 makes the Fiduciary responsible for compliance for processing undertaken on its behalf. The security-safeguards duty extends to data held by the processor.",
      },
      {
        q: "When must a Data Fiduciary erase personal data?",
        options: [
          "Never - it may keep data indefinitely",
          "Only if the Board orders it",
          "When consent is withdrawn or the purpose is no longer served, unless law requires retention",
          "Exactly one year after collection in all cases",
        ],
        answer: 2,
        explanation:
          "Section 8 requires erasure on withdrawal of consent or once the specified purpose is served, unless retention is required by law. The Rules add inactivity-based erasure for certain platforms.",
      },
      {
        q: "What is the maximum penalty for failing to take reasonable security safeguards?",
        options: ["₹10,000", "₹50 crore", "₹150 crore", "Up to ₹250 crore"],
        answer: 3,
        explanation:
          "The Schedule attaches the highest penalty - up to ₹250 crore - to a breach of the obligation to take reasonable security safeguards to prevent a personal data breach.",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    n: 6,
    slug: "children",
    title: "Children & Persons with Disabilities",
    refs: "Section 9 · Vulnerable principals",
    minutes: 20,
    icon: Baby,
    points: [
      "Verifiable parental and guardian consent",
      "The ban on tracking, behavioural monitoring and targeted ads",
      "Designing age-appropriate flows",
    ],
    summary:
      "The Act gives children and persons with disabilities heightened protection. This module covers verifiable parental and guardian consent, the outright bans that consent cannot cure, and how the 2025 Rules expect you to verify an adult is really a consenting parent.",
    whyItMatters:
      "Children's-data failures carry a penalty of up to ₹200 crore, and some processing is prohibited even with consent. This is one of the few places the Act draws a hard line rather than a balancing test.",
    lessons: [
      {
        heading: "Who counts, and the consent that's required",
        ref: "Section 9(1)",
        body: [
          "A child is anyone under 18. Before processing a child's personal data, a Data Fiduciary must obtain verifiable consent from the child's parent or lawful guardian. The same protection extends to persons with disability who have a lawful guardian - their guardian's verifiable consent is required.",
        ],
        plainEnglish:
          "Under-18s and people with a legal guardian can't validly consent for themselves. You must get a verifiable yes from the parent or guardian.",
      },
      {
        heading: "The bans consent cannot cure",
        ref: "Section 9(2)-(3)",
        body: [
          "Two prohibitions apply regardless of consent. A Fiduciary must not undertake processing likely to cause any detrimental effect on the well-being of a child. And a Fiduciary must not track or behaviourally monitor children, or direct targeted advertising at them.",
          "These are absolute. Parental consent does not unlock behavioural profiling or ad targeting of a child - those uses are simply off the table.",
        ],
        plainEnglish:
          "Some things are banned outright for kids: anything harmful to their well-being, behavioural tracking, and targeted ads. A parent's consent can't switch those back on.",
      },
      {
        heading: "Verifying the parent - what the Rules expect",
        ref: "Section 9 & Rules 2025",
        body: [
          "The 2025 Rules require due diligence to confirm that the person giving consent is an identifiable adult, and is indeed the child's parent or guardian - for example, by relying on identity and age details already held, or on a virtual token issued by an authorised entity such as a Digital Locker provider.",
          "The Government may also notify classes of Fiduciaries or purposes exempt from some children's-data restrictions, and may lower the age threshold for a Fiduciary that processes children's data in a verifiably safe manner.",
        ],
        plainEnglish:
          "A self-declared 'I am over 18' tick is not enough. You have to take real steps to check the parent is an adult and is the actual parent.",
      },
    ],
    keyTerms: [
      { term: "Child", definition: "An individual under the age of 18 years." },
      { term: "Verifiable parental consent", definition: "Consent obtained from a child's parent or lawful guardian using due diligence to confirm the adult's identity and relationship." },
      { term: "Detrimental effect", definition: "Harm to the well-being of a child; processing likely to cause it is prohibited regardless of consent." },
      { term: "Behavioural monitoring", definition: "Tracking a child's behaviour or activity - prohibited under Section 9, even with parental consent." },
      { term: "Lawful guardian", definition: "The legally recognised guardian of a child or a person with disability, whose verifiable consent is required to process their data." },
    ],
    scenario: {
      title: "The edtech app that profiles students",
      situation:
        "A learning app for school students collects study behaviour and serves targeted advertisements based on it. It argues that it has parental consent at sign-up, so the targeting is fine.",
      analysis:
        "Parental consent permits processing the child's data for the learning service, but Section 9(3) bans behavioural monitoring and targeted advertising directed at children outright. Consent cannot cure a prohibited use, so the ad targeting and behavioural profiling are unlawful.",
      lesson:
        "For children, some processing is prohibited, not merely consent-gated. Design the product so those uses never occur.",
    },
    pitfalls: [
      "Relying on a self-declared age tick instead of real verification.",
      "Assuming parental consent unlocks behavioural profiling or targeted ads - it does not.",
      "Forgetting persons with disability who have a lawful guardian.",
      "Using dark patterns or persuasive design aimed at minors.",
    ],
    checklist: [
      "Build an age-assurance step that does real due diligence, not a self-declared checkbox.",
      "Capture verifiable parental/guardian consent and record how it was verified.",
      "Remove all behavioural tracking and targeted advertising from flows reachable by children.",
      "Review features for any detrimental effect on a child's well-being before launch.",
    ],
    takeaways: [
      "A child is under 18; processing their data needs verifiable parental or guardian consent.",
      "Tracking, behavioural monitoring and targeted ads at children are banned even with consent.",
      "The Rules require genuine due diligence to verify the consenting adult - not a self-declaration.",
      "Children's-data breaches can attract a penalty of up to ₹200 crore.",
    ],
    quiz: [
      {
        q: "Can a Data Fiduciary direct targeted advertising at a child if it has verifiable parental consent?",
        options: [
          "Yes, parental consent permits it",
          "No - targeting advertising at children is prohibited regardless of consent",
          "Yes, but only for educational products",
          "Only if the child is over 13",
        ],
        answer: 1,
        explanation:
          "Section 9(3) prohibits tracking, behavioural monitoring and targeted advertising directed at children outright. Parental consent cannot authorise a prohibited use.",
      },
      {
        q: "What does the Act require before processing a child's personal data?",
        options: [
          "Nothing beyond the child's own consent",
          "A self-declared age confirmation",
          "Verifiable consent of the parent or lawful guardian",
          "Approval from the Data Protection Board",
        ],
        answer: 2,
        explanation:
          "Section 9 requires verifiable consent from the parent or lawful guardian before processing the personal data of a child (anyone under 18).",
      },
      {
        q: "Section 9's protections also extend to which group?",
        options: [
          "Senior citizens automatically",
          "Persons with disability who have a lawful guardian",
          "All employees",
          "Only Indian citizens",
        ],
        answer: 1,
        explanation:
          "The verifiable-guardian-consent protection extends to persons with disability who have a lawful guardian, alongside children.",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    n: 7,
    slug: "significant-data-fiduciaries",
    title: "Significant Data Fiduciaries",
    refs: "Section 10 · Heightened duties",
    minutes: 20,
    icon: Building2,
    points: [
      "What triggers an SDF designation",
      "Appointing a DPO and an independent auditor",
      "Data Protection Impact Assessments",
    ],
    summary:
      "Some organisations carry systemic risk, and the Act gives them extra duties. This module covers what makes a Data Fiduciary 'significant', and the heightened obligations that follow - a India-based DPO, independent audits and Data Protection Impact Assessments.",
    whyItMatters:
      "SDF status is conferred, not chosen. If your platform is notified, a new tier of governance obligations switches on - and failing them carries a penalty of up to ₹150 crore.",
    lessons: [
      {
        heading: "What makes a Fiduciary 'significant'",
        ref: "Section 10(1)",
        body: [
          "The Central Government may notify any Data Fiduciary, or a class of them, as a Significant Data Fiduciary. The assessment weighs factors such as the volume and sensitivity of personal data processed; the risk to the rights of Data Principals; the potential impact on the sovereignty and integrity of India; the risk to electoral democracy; the security of the State; and public order.",
        ],
        plainEnglish:
          "It's about scale and systemic risk, not industry. The Government decides - usually big platforms handling lots of sensitive data get tapped.",
      },
      {
        heading: "The heightened obligations",
        ref: "Section 10(2)",
        body: [
          "An SDF must appoint a Data Protection Officer based in India, who represents the SDF, is responsible to its Board of Directors or governing body, and is the point of contact for the grievance mechanism. It must appoint an independent data auditor to evaluate compliance. And it must undertake periodic Data Protection Impact Assessments, periodic audits, and such other measures as the Rules prescribe.",
        ],
        bullets: [
          "Appoint a Data Protection Officer based in India, answerable to the board",
          "Appoint an independent data auditor to evaluate compliance",
          "Carry out periodic Data Protection Impact Assessments (DPIAs)",
          "Carry out periodic audits and any other prescribed measures",
        ],
        plainEnglish:
          "Big-platform duties: a real DPO in India who reports to the top, outside audits, and impact assessments before you ship risky features.",
      },
      {
        heading: "What the Rules add",
        ref: "Rules 2025",
        body: [
          "The 2025 Rules give the duties teeth: an SDF is expected to conduct a DPIA and an audit on a defined cadence (annually) and report observations to the Board, to verify that algorithmic software used for processing does not pose a risk to principals' rights, and to comply with any restrictions on transferring specified categories of personal data outside India.",
        ],
        plainEnglish:
          "Expect yearly DPIAs and audits, a duty to check your algorithms aren't harming users, and possible localisation of certain sensitive data.",
      },
    ],
    keyTerms: [
      { term: "Significant Data Fiduciary", definition: "A Data Fiduciary (or class) notified by the Central Government as carrying heightened, systemic data-protection risk." },
      { term: "Data Protection Officer (DPO)", definition: "An India-based officer an SDF must appoint, answerable to its board and serving as the grievance point of contact." },
      { term: "Independent data auditor", definition: "An external auditor an SDF must appoint to evaluate its compliance with the Act." },
      { term: "Data Protection Impact Assessment", definition: "A periodic assessment of the rights-risk a processing activity poses to Data Principals, required of SDFs." },
      { term: "Algorithmic risk verification", definition: "An SDF's duty under the Rules to verify that algorithmic software it uses does not pose a risk to principals' rights." },
    ],
    scenario: {
      title: "The platform crosses the threshold",
      situation:
        "A large social-media platform processing the data of tens of millions of Indian users is notified by the Government as a Significant Data Fiduciary.",
      analysis:
        "From notification, the platform must appoint a DPO based in India who reports to its board, engage an independent data auditor, and run DPIAs and periodic audits - including verifying that its recommendation algorithms do not pose a risk to users' rights before rolling out changes.",
      lesson:
        "SDF status turns governance from optional to mandatory. The trigger is scale and systemic risk, and it applies across sectors.",
    },
    pitfalls: [
      "Appointing a DPO who sits outside India or has no access to the board.",
      "Treating a DPIA as a one-time document rather than a periodic, evidenced process.",
      "Ignoring the duty to verify algorithmic software for rights-risk.",
      "Missing signals that certain data must be localised.",
    ],
    checklist: [
      "Confirm whether you have been (or may be) notified as an SDF.",
      "Appoint an India-based DPO answerable to the board, and publish their contact.",
      "Engage an independent data auditor and schedule periodic audits.",
      "Institutionalise periodic DPIAs and algorithmic-risk review.",
    ],
    takeaways: [
      "The Government notifies SDFs based on data volume, sensitivity and systemic risk - it is not self-selected.",
      "An SDF must appoint an India-based DPO answerable to its board, and an independent auditor.",
      "Periodic DPIAs and audits are mandatory, alongside algorithmic-risk verification under the Rules.",
      "Failing SDF obligations can attract a penalty of up to ₹150 crore.",
    ],
    quiz: [
      {
        q: "Who decides that a Data Fiduciary is a Significant Data Fiduciary?",
        options: [
          "The Fiduciary itself, by self-assessment",
          "The Central Government, by notification",
          "The Data Principal",
          "Any independent auditor",
        ],
        answer: 1,
        explanation:
          "Section 10 empowers the Central Government to notify a Data Fiduciary, or a class of them, as significant, based on factors like data volume, sensitivity and systemic risk.",
      },
      {
        q: "Where must a Significant Data Fiduciary's Data Protection Officer be based?",
        options: ["Anywhere in the world", "In India", "Only at the Board's office", "Wherever the parent company is"],
        answer: 1,
        explanation:
          "An SDF must appoint a Data Protection Officer based in India, who is responsible to its Board of Directors and acts as the grievance point of contact.",
      },
      {
        q: "Which obligation is specific to a Significant Data Fiduciary?",
        options: [
          "Obtaining consent before processing",
          "Providing a notice",
          "Conducting periodic Data Protection Impact Assessments and audits",
          "Responding to grievances",
        ],
        answer: 2,
        explanation:
          "Periodic DPIAs, periodic audits and the appointment of an independent auditor are heightened obligations unique to SDFs under Section 10. Consent, notice and grievances apply to all Fiduciaries.",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    n: 8,
    slug: "breach-board-penalties",
    title: "Breach, the Board & Penalties",
    refs: "Section 8(6), Section 16, Section 27-33 · Enforcement",
    minutes: 30,
    icon: Landmark,
    points: [
      "Breach notification and the Data Protection Board",
      "Cross-border transfer model and restrictions",
      "The penalty schedule - and how to stay off it",
    ],
    summary:
      "This is where the Act bites. The closing module covers what a breach is and the clock that starts when you find one, the cross-border transfer model, the structure and powers of the Data Protection Board, the appeal route, and the penalty Schedule that tops out at ₹250 crore.",
    whyItMatters:
      "Enforcement is the point of the whole framework. Knowing the breach timeline, the appeal ladder and exactly how the penalties are graded is what turns the Act from theory into an operational risk you can manage.",
    lessons: [
      {
        heading: "What a breach is, and the clock it starts",
        ref: "Section 8(6) & Rules 2025",
        body: [
          "A personal data breach is any unauthorised processing, or accidental disclosure, acquisition, sharing, use, alteration, destruction or loss of access, that compromises the confidentiality, integrity or availability of personal data. On discovering one, the Fiduciary must intimate both the Data Protection Board and every affected Data Principal.",
          "The 2025 Rules set the shape: notify affected principals without delay, in clear language, describing the breach, its likely consequences, the mitigation under way and a contact point. The Board gets initial information without delay and a detailed report - including events, circumstances, mitigation and findings - within 72 hours, which the Board may extend.",
        ],
        plainEnglish:
          "Find a breach? Tell the regulator and the affected people fast. Plan on a 72-hour detailed report to the Board, so have an incident runbook ready before you need it.",
      },
      {
        heading: "Cross-border transfer - a blacklist, not a whitelist",
        ref: "Section 16",
        body: [
          "The Act takes a permissive default: personal data may be transferred outside India, except to countries or territories the Central Government specifically restricts by notification. This is a 'blacklist' (negative-list) model - transfer is allowed unless the destination is restricted.",
          "Two caveats: sector-specific laws with stricter localisation (for example in banking) continue to apply, and an SDF may face additional localisation duties for specified categories of data under the Rules.",
        ],
        plainEnglish:
          "Sending data abroad is allowed by default - you only stop for countries the Government blacklists. But stricter sector rules (like RBI's) still bind you.",
      },
      {
        heading: "The Data Protection Board and the appeal ladder",
        ref: "Section 18-32",
        body: [
          "The Data Protection Board of India is an independent regulator that functions as a 'digital office' - it can conduct proceedings digitally. It inquires into breaches and complaints, directs urgent remedial or mitigation measures, and imposes penalties. It can also accept a voluntary undertaking to settle a matter.",
          "A person aggrieved by a Board order may appeal to the Appellate Tribunal (the TDSAT), whose orders are executable as a decree. The Act also encourages alternate dispute resolution, such as mediation, where a dispute is amenable to it.",
        ],
        plainEnglish:
          "The Board is the online regulator that investigates and fines. Unhappy with its order? Appeal to the Tribunal. Both sides can also settle via undertakings or mediation.",
      },
      {
        heading: "The penalty Schedule - graded by the duty you broke",
        ref: "Section 33 & Schedule",
        body: [
          "Penalties are civil and financial, not criminal, and are graded by the obligation breached. The headline figures: up to ₹250 crore for failing to take reasonable security safeguards; up to ₹200 crore for failing to notify a breach; up to ₹200 crore for breaching children's-data obligations; up to ₹150 crore for breaching SDF obligations; up to ₹10,000 for a Data Principal breaching their duties; and up to ₹50 crore as a residuary penalty for any other breach.",
          "All penalties imposed are credited to the Consolidated Fund of India. The Board sets the actual amount after considering the nature, gravity and duration of the breach, the type of data affected, repetition, and any gains or mitigation.",
        ],
        bullets: [
          "Security-safeguards failure - up to ₹250 crore",
          "Breach-notification failure - up to ₹200 crore",
          "Children's-data obligations - up to ₹200 crore",
          "SDF obligations - up to ₹150 crore",
          "Residuary (any other breach) - up to ₹50 crore",
          "Data Principal's duties - up to ₹10,000",
        ],
        plainEnglish:
          "The famous ₹250 crore is the ceiling for the worst duty (security). Each duty has its own cap, and the Board picks the number based on how bad the breach was.",
      },
    ],
    keyTerms: [
      { term: "Personal data breach", definition: "Unauthorised processing or accidental disclosure, acquisition, sharing, alteration, loss or destruction of personal data that compromises its confidentiality, integrity or availability." },
      { term: "Data Protection Board of India", definition: "The independent, digital-first regulator that inquires into breaches and complaints, directs remedial measures and imposes penalties." },
      { term: "Voluntary undertaking", definition: "A commitment a person may give, and the Board may accept, to settle proceedings without a penalty being imposed." },
      { term: "Appellate Tribunal", definition: "The TDSAT, to which a person aggrieved by a Board order may appeal; its orders are executable as a decree." },
      { term: "Blacklist transfer model", definition: "The Section 16 default permitting cross-border transfer except to countries the Government restricts by notification." },
      { term: "Penalty Schedule", definition: "The Schedule to the Act grading financial penalties by the obligation breached, up to ₹250 crore." },
    ],
    scenario: {
      title: "The 72-hour clock",
      situation:
        "A fintech's security team detects unauthorised access to a customer database at 9pm on a Friday. Leadership wants to wait until Monday to 'understand the full picture' before telling anyone.",
      analysis:
        "Detection starts the clock. Under the 2025 Rules the Fiduciary must intimate affected principals without delay and provide the Board a detailed report within 72 hours of becoming aware. Waiting for a complete picture before any notification risks a breach-notification failure carrying up to ₹200 crore.",
      lesson:
        "Notify on a timeline, not on certainty. Send the initial intimation promptly and follow with the detailed report - have the runbook pre-built.",
    },
    pitfalls: [
      "Delaying notification to 'get the full picture' - the clock runs from awareness.",
      "Assuming cross-border transfer is banned - it is permitted except to blacklisted destinations.",
      "Thinking penalties are criminal - they are civil and financial, credited to the Consolidated Fund.",
      "Having no incident runbook, so the 72-hour window is lost to coordination.",
    ],
    checklist: [
      "Write a breach runbook covering detection, the Board intimation and affected-principal notice.",
      "Pre-draft notification templates for the Board and for principals.",
      "Map your cross-border flows and check none route to a restricted destination.",
      "Track your worst-case penalty exposure by mapping each duty to its Schedule cap.",
    ],
    takeaways: [
      "On a breach, notify the Board and affected principals - plan for a 72-hour detailed report.",
      "Section 16 permits cross-border transfer except to government-restricted destinations (a blacklist).",
      "The Board is a digital-first regulator; appeals go to the Appellate Tribunal (TDSAT).",
      "Penalties are graded by duty, topping out at ₹250 crore for security-safeguard failures.",
    ],
    quiz: [
      {
        q: "Which approach does the DPDP Act take to cross-border data transfers?",
        options: [
          "A whitelist - transfers allowed only to approved countries",
          "A blanket ban on all transfers",
          "A blacklist - transfers allowed except to countries the Government restricts",
          "Transfers require Board approval each time",
        ],
        answer: 2,
        explanation:
          "Section 16 uses a negative-list (blacklist) model: transfer is permitted except to countries or territories the Central Government restricts by notification. Stricter sector laws still apply.",
      },
      {
        q: "What is the maximum penalty under the Schedule, and what triggers it?",
        options: [
          "₹50 crore, for any breach",
          "₹250 crore, for failing to take reasonable security safeguards",
          "₹10,000, for a breach by a Data Fiduciary",
          "₹200 crore, for any first offence",
        ],
        answer: 1,
        explanation:
          "The highest cap in the Schedule is up to ₹250 crore, attached to a failure to take reasonable security safeguards to prevent a personal data breach.",
      },
      {
        q: "Where does a person aggrieved by an order of the Data Protection Board appeal?",
        options: [
          "The Supreme Court directly",
          "The Central Government",
          "The Appellate Tribunal (TDSAT)",
          "There is no appeal",
        ],
        answer: 2,
        explanation:
          "Appeals from Board orders lie to the Appellate Tribunal (the TDSAT), whose orders are executable as a decree of a civil court.",
      },
    ],
  },
];

export const MODULE_SLUGS = MODULES.map((m) => m.slug);

export function getModule(slug: string): ModuleLesson | undefined {
  return MODULES.find((m) => m.slug === slug);
}

export function getModuleIndex(slug: string): number {
  return MODULES.findIndex((m) => m.slug === slug);
}
