/**
 * Content for the Industry Advisor - a guided, button-only conversation on
 * /industries that helps a visitor discover *why* the DPDP Act actually
 * matters for their specific sector.
 *
 * The conversation reuses the sector name / icon / data / risks / services from
 * INDUSTRIES (src/content/dpdp.ts) and layers on the advisory copy below:
 *   • a hook shown the moment they pick a sector,
 *   • a headline stat,
 *   • a "why it matters" narrative,
 *   • the concrete obligations the Act triggers,
 *   • what's at stake (penalty + a plausible real-world scenario),
 *   • three first moves.
 * Copy is written to be accurate to the DPDP Act 2023 + DPDP Rules 2025.
 */

export type SectorAdvice = {
  /** Two-sentence opener shown right after the sector is chosen. */
  hook: string;
  /** Tailored reply for each data-type the visitor can pick (keyed by exact label). */
  dataReplies: Record<string, string>;
  /** Tailored reply for each risk/worry the visitor can pick (keyed by exact label). */
  worryReplies: Record<string, string>;
  /** Punchy headline stat for the result card. */
  stat: { value: string; label: string };
  /** Why DPDP genuinely matters for this sector. */
  why: string;
  /** What the law expects - concrete, sector-specific obligations. */
  obligations: { title: string; body: string }[];
  /** What's at stake if it's ignored. */
  penalty: string;
  /** A plausible, sector-specific breach scenario. */
  scenario: string;
  /** Three concrete first moves. */
  actions: string[];
};

/** Per-sector accent hue (rgb triplet var) - mirrors IndustriesSection. */
export const SECTOR_ACCENT: Record<string, string> = {
  BFSI: "var(--blue-rgb)",
  Healthcare: "var(--green-rgb)",
  Education: "var(--amber-rgb)",
  "SaaS & IT": "var(--brand-rgb)",
  "E-Commerce": "var(--accent-rgb)",
  Government: "var(--red-rgb)",
};

/** Keyed by the exact INDUSTRIES[].name. */
export const SECTOR_ADVICE: Record<string, SectorAdvice> = {
  BFSI: {
    hook: "Banking, insurance and fintech sit on the richest pool of personal data in India - and the tightest web of regulators. That combination makes you both a prime target for attackers and the sector the Data Protection Board will watch most closely.",
    dataReplies: {
      "KYC data":
        "KYC is the most regulated data you hold - identity proofs, PAN, Aadhaar, address, income. Under the DPDP Act it's personal data you must collect with clear consent, use only for the stated purpose, and be able to delete once the relationship ends. 'We needed it for onboarding' no longer justifies keeping it forever.",
      "Financial transactions":
        "Every transaction is a behavioural fingerprint of a person's life - where they shop, travel, borrow and give. DPDP treats it as personal data you must protect, and it lets customers ask what you hold and why. Routing it to analytics or cross-sell teams now needs a lawful basis, not just internal convenience.",
      "Credit scores":
        "Credit scores are inferred personal data, and among the most consequential a person carries. DPDP means a customer can question how their data is used to score them, and consent for pulling bureau data must be genuine and revocable - not buried in fine print. Getting this wrong invites both DPDP and RBI scrutiny.",
      "Account details":
        "Account numbers, balances and statements are exactly what attackers want and what DPDP makes you accountable for. You'll need to prove who can access them and why - and that a leak triggers a 72-hour breach report to the Board and to every affected customer.",
      "Investment portfolios":
        "Holdings and portfolio data reveal a person's wealth, risk appetite and intentions - sensitive by any measure. DPDP requires you to justify every use, secure it strongly, and honour a client's right to access or erase it when they walk away.",
    },
    worryReplies: {
      "RBI/SEBI mandates":
        "You're right to lead with this. The good news: DPDP largely rhymes with what the RBI and SEBI already expect - consent, purpose limitation, security, breach reporting. Treat DPDP as the connective layer that makes your existing regulatory controls provable in one place, rather than a second, separate burden.",
      "Credit bureau consent":
        "This is where a lot of BFSI players are quietly exposed. Pulling or sharing bureau data without fresh, specific, revocable consent is precisely what DPDP targets. You need a consent record you can produce on demand - timestamped, purpose-tagged, and genuinely easy for the customer to withdraw.",
      "Vendor data processing":
        "Sharp worry - because under DPDP a vendor's breach becomes YOUR liability. Collection agencies, KYC vendors and analytics partners are all 'processors' you must bind by contract and be able to audit. If they leak, the penalty lands on you as the fiduciary, not on them.",
      "GenAI models on customer data":
        "This is the fastest-growing risk in BFSI. Feeding customer data into a model needs a lawful basis, and DPDP's right to erasure collides hard with models that memorise what they're trained on. You need governance over what data trains which model - before a regulator or a customer asks the question.",
    },
    stat: { value: "₹250cr", label: "Maximum penalty per breach" },
    why: "Every KYC record, transaction and credit score you hold is personal data under the DPDP Act. You already answer to the RBI, SEBI and IRDAI - DPDP adds a citizen's legal right to know, correct and erase that data. For BFSI, consent stops being a checkbox and becomes the first audit trail a regulator asks to see.",
    obligations: [
      {
        title: "Consent you can prove",
        body: "Capture, timestamp and store consent for every KYC and cross-sell - with a genuinely easy way for customers to withdraw it.",
      },
      {
        title: "The 72-hour breach clock",
        body: "A leaked account dump must be reported to the Data Protection Board and to affected customers, quickly and completely.",
      },
      {
        title: "Vendor & GenAI accountability",
        body: "Credit bureaus, collection agents and AI models are all processors - and their mistakes become your liability.",
      },
    ],
    penalty: "Up to ₹250 crore for failing to safeguard financial data - on top of RBI/SEBI action.",
    scenario: "A collections vendor leaks 40,000 loan records. Under DPDP the penalty lands on you - the fiduciary - not just the vendor.",
    actions: [
      "Map where KYC and transaction data actually flows",
      "Stand up a consent register with a full audit trail",
      "Put every vendor under a DPDP processing contract",
    ],
  },
  Healthcare: {
    hook: "Health data is the most sensitive category a person owns - and hospitals, labs and health-techs hold it in bulk. That makes DPDP less of a paperwork exercise for you and more of a genuine duty of care.",
    dataReplies: {
      "Patient records":
        "Patient records sit right at the top of DPDP's sensitivity ladder - diagnoses, history and identifiers all in one place. You need explicit, purpose-bound consent, tight access controls, and the ability to show a patient exactly what you hold about them. 'The doctor needed it' doesn't justify open-ended retention.",
      "Diagnostic reports":
        "Lab and imaging reports can reveal conditions a person hasn't told their own family. DPDP treats them as data demanding your highest duty of care - encrypted, access-logged, and shared only with consent that names each recipient, whether that's an insurer, a referral or a research study.",
      "Prescription history":
        "Prescriptions quietly expose chronic illness, mental-health treatment and fertility choices. Under DPDP that's personal data you must minimise, secure and delete on a schedule - and never quietly repurpose for marketing or pharma tie-ups without separate, specific consent.",
      "Genomic data":
        "Genomic data is uniquely identifying and permanent - you can't re-issue someone's DNA after a breach. DPDP expects the strongest safeguards here, explicit consent for every distinct use, and a real answer to 'what happens to my sample and my data if I withdraw?'",
      "Mental health data":
        "This is the most stigma-laden data a person can share, and the most damaging if it leaks. DPDP demands explicit consent, strict access limits and airtight security - plus a rehearsed plan for the 72-hour breach notice that a leak here would inevitably trigger.",
    },
    worryReplies: {
      "Health data sensitivity":
        "Exactly the right instinct. DPDP doesn't carve out a separate 'sensitive data' tier the way some laws do, but health data attracts the highest expectations of care in practice - and the harshest fallout when it's mishandled. Build your entire programme around protecting it first, and the rest follows.",
      "Children's consent":
        "This one catches many providers off guard. For any under-18 patient, DPDP (Rule 10) requires verifiable parental consent and bans behavioural tracking of the child. Paediatrics, vaccination drives and school health camps all need a consent flow purpose-built for minors, not the adult one reused.",
      "Insurance claim sharing":
        "A real pinch point. Sending records to an insurer or TPA is a separate purpose that needs its own clear consent - you can't ride it on the treatment consent the patient already gave. DPDP expects the patient to know exactly what's shared, with whom, and to be able to say no.",
      "AI diagnostic tools":
        "Powerful, but a DPDP minefield. Patient data feeding an AI tool needs a lawful basis, and the right to erasure is genuinely hard to honour once data is inside a model. You need to govern what the tool sees, where it runs, and how a patient can opt out without losing care.",
    },
    stat: { value: "Highest", label: "Duty of care under the Act" },
    why: "Patient records, diagnoses and mental-health notes are exactly the data the DPDP Act expects you to guard most carefully. Add children's records and insurance sharing, and a single clinic becomes a high-value target. DPDP gives every patient the right to see, correct and erase what you hold - and holds you liable when it leaks.",
    obligations: [
      {
        title: "Explicit, purpose-bound consent",
        body: "Treatment, research and insurance sharing each need their own clear, separate consent - not one blanket form.",
      },
      {
        title: "Parental consent for minors",
        body: "Under-18 patient data needs verifiable parental consent (Rule 10), with no behavioural tracking of the child.",
      },
      {
        title: "Breach-ready security",
        body: "Encryption, access logs and a rehearsed 72-hour breach plan for every system that touches records.",
      },
    ],
    penalty: "Severe penalties plus reputational collapse - patients rarely return after a health-data leak.",
    scenario: "A diagnostics portal exposes HIV and mental-health reports. The harm is irreversible - and so is the DPDP liability.",
    actions: [
      "Classify records by sensitivity",
      "Fix consent for insurance & research sharing",
      "Lock down portal and vendor access",
    ],
  },
  Education: {
    hook: "Schools, colleges and EdTech run almost entirely on children's data - the sharpest edge of the DPDP Act. When your users are minors, the law's strictest protections apply by default, not as an add-on.",
    dataReplies: {
      "Student records":
        "Student records belong to minors, which puts them behind DPDP's strongest fence. You need verifiable parental consent to process them, a strict and stated purpose, and deletion when the student leaves - not a permanent file that follows a child through life.",
      "Parent data":
        "Parent contact and payment data is adult personal data you're also fully accountable for. DPDP means clear consent for how you use it - school communication is fine, but reselling it or blasting unrelated offers is exactly the kind of use the law restricts.",
      "Academic performance":
        "Grades and assessments are sensitive to a child's future. DPDP expects you to limit who can see them, use them only for education, and resist the temptation to feed them into profiling or 'edu-scoring' that quietly follows the student around.",
      "Attendance":
        "Attendance looks harmless, but it's a location-and-behaviour trail of a minor. Under DPDP you collect only what you actually need, keep it briefly, and never repurpose it for surveillance or targeting of the child or their family.",
      "Online learning behavior":
        "This is where EdTech most often gets into trouble. Clickstreams, time-on-task and engagement scores on children are precisely the behavioural data DPDP won't let you use for profiling or ads. Collect the bare minimum, and switch off any tracking that isn't strictly educational.",
    },
    worryReplies: {
      "Student minors":
        "Right at the heart of it. Because your users are children, almost everything you do needs verifiable parental consent and a no-tracking, no-targeting posture. In effect, DPDP flips your default from 'collect and figure it out later' to 'justify everything up front.'",
      "Parental consent (Rule 10)":
        "You've named the exact obligation most schools and apps miss. Rule 10 means confirming a real parent or guardian consented - not a child ticking a box on a signup screen. Building that verification flow properly is the single highest-value thing you can do for compliance.",
      "EdTech behavioral data":
        "This is the classic EdTech trap. Behavioural analytics on minors - to nudge, rank or upsell - is exactly what DPDP prohibits for children. The fix is to strip tracking back to genuine learning needs and be able to prove you're not profiling students.",
      "International transfers":
        "A real concern if your platform or cloud sits abroad. DPDP restricts and conditions the cross-border movement of personal data, and children's data raises the stakes further. You need to know where student data physically lives and precisely who can reach it.",
    },
    stat: { value: "Rule 10", label: "Verifiable parental consent" },
    why: "Student records, performance data and online-learning behaviour belong to minors, and DPDP puts a hard fence around them. You cannot track, profile or advertise to children, and you need a parent's verifiable consent before processing their data. For EdTech especially, the old 'collect everything' model is now unlawful.",
    obligations: [
      {
        title: "Verifiable parental consent",
        body: "Confirm a real parent or guardian consented before you process a child's data (Rule 10).",
      },
      {
        title: "No tracking or targeting of children",
        body: "Behavioural monitoring and targeted advertising aimed at minors are prohibited outright.",
      },
      {
        title: "Data minimisation",
        body: "Collect only what the class genuinely needs - and delete it when the course ends.",
      },
    ],
    penalty: "Steep fines, and for EdTech a fast route to losing parent and school trust.",
    scenario: "An app profiles students to push paid courses. That's a prohibited use of children's data under DPDP.",
    actions: [
      "Add verifiable parental-consent gates",
      "Switch off behavioural tracking for minors",
      "Set retention limits per academic year",
    ],
  },
  "SaaS & IT": {
    hook: "If you build software or run a GCC, you process other people's personal data for a living - as a Processor, and often a Fiduciary too. That dual role is exactly what enterprise clients now audit before they'll sign with you.",
    dataReplies: {
      "User accounts":
        "Every account - email, profile, login trail - is personal data you're the Fiduciary for. DPDP gives your users the legal right to access, correct and delete it, so 'export my data' and 'delete my account' can't stay backlog items; they're obligations you must be able to fulfil.",
      "Usage analytics":
        "Product analytics quietly builds behavioural profiles of real people. DPDP means you need a lawful basis to collect it, clear disclosure of what you track, and a working way to honour opt-outs - especially once that data is tied to an identifiable user.",
      "Employee data (GCCs)":
        "If you run a GCC, you hold rich employee and often client-employee data. DPDP applies to HR data just as much as customer data - consent, purpose limits, security and the same access-and-correction rights all apply to your own people.",
      "Customer data":
        "Here you're usually a Processor, handling data on your clients' behalf. DPDP says you may only use it on their documented instructions, secure it provably, and support their obligations - which is exactly why enterprise buyers now demand DPDP-ready contracts before onboarding.",
      "AI training data":
        "The sharpest edge for SaaS. Personal data in a training set needs a lawful basis, and DPDP's erasure right is hard to satisfy once a model has learned from it. You need to govern what data trains which model - and keep a way to exclude or unlearn a person's data on request.",
    },
    worryReplies: {
      "Processor obligations":
        "Exactly the right lens. As a Processor you act only on your client's documented instructions, with security you can evidence and sub-processors you keep under control. Get your DPA and controls right and DPDP becomes a sales asset in security reviews, not a blocker.",
      "AI/GenAI training":
        "The risk everyone's racing to catch up on. Training or fine-tuning on personal data needs a lawful basis, and a model that memorises data collides directly with the right to erasure. Governance over data-in and model-out is what auditors and enterprise clients will ask you to show.",
      "Cross-border transfers":
        "Very relevant for cloud-native and GCC setups. DPDP conditions where personal data can travel and who can access it across borders. Mapping your data residency and access paths now saves a painful, expensive retrofit later - and answers the first question a client will ask.",
      "Client contractual obligations":
        "Smart to flag - this is where DPDP hits revenue first. Enterprise clients increasingly make DPDP compliance a contract condition, often with indemnities attached. Being demonstrably compliant wins deals; being vague about it quietly loses them.",
    },
    stat: { value: "2 hats", label: "Processor and Fiduciary" },
    why: "Your product stores user accounts, usage analytics and often your clients' customers' data. Under DPDP you wear two hats - Processor for client data, Fiduciary for your own users and employees. Enterprise clients now make DPDP compliance a condition of the contract, and GenAI trained on personal data is the fastest-growing risk of all.",
    obligations: [
      {
        title: "Processor obligations, by contract",
        body: "Process client data only on their documented instructions, with security you can actually evidence.",
      },
      {
        title: "Cross-border discipline",
        body: "Know where data lives and moves - transfers must respect DPDP's restrictions.",
      },
      {
        title: "AI / GenAI governance",
        body: "Personal data in a training set needs a lawful basis and a way to honour erasure requests.",
      },
    ],
    penalty: "Lost enterprise deals today; crore-scale penalties and client indemnity claims tomorrow.",
    scenario: "A model fine-tuned on support tickets memorises personal data and leaks it in its outputs - a DPDP breach you caused.",
    actions: [
      "Sign DPDP-ready DPAs with every client",
      "Map data residency and transfers",
      "Govern what personal data feeds your AI",
    ],
  },
  "E-Commerce": {
    hook: "Every cart, click and delivery address is personal data - and marketing is where most e-commerce brands break DPDP first. The channels you rely on most (cookies, WhatsApp, retargeting) are exactly the ones the law polices hardest.",
    dataReplies: {
      "Customer profiles":
        "A customer profile stitches together identity, preferences and history - textbook personal data under DPDP. You need consent for how you build and use it, and customers can ask to see or delete it. Silently enriching profiles from third-party sources is precisely what the law restricts.",
      "Purchase history":
        "Purchase history reveals health, habits and income more than customers realise. DPDP lets you use it to fulfil the order they placed - but reusing it for profiling, resale or unrelated marketing needs its own separate, clear consent.",
      "Delivery addresses":
        "Addresses are sensitive location data, and you routinely hand them to delivery partners. Under DPDP those partners are Processors you must bind by contract, and the customer should know their address is being passed on and to whom.",
      "Payment data":
        "Payment data is high-value and high-liability. DPDP expects strong security and a fast breach response, and it means you can't quietly store or reuse card and UPI details beyond the exact purpose the customer agreed to.",
      "Behavioral data":
        "Clicks, dwell time and cart behaviour power your personalisation - and sit right in DPDP's crosshairs. Analytics cookies and behavioural tracking need genuine opt-in consent, paired with an opt-out that actually works, not a buried setting.",
    },
    worryReplies: {
      "Cookie consent":
        "You've picked the one most brands get wrong. DPDP means analytics and marketing cookies need real opt-in - pre-ticked boxes and 'by using this site you agree' don't cut it anymore. A proper consent-mode banner is the fastest fix and the most visible signal that you're compliant.",
      "WhatsApp marketing":
        "A huge exposure. Blasting promotions to numbers you don't have consent for is a clear DPDP violation - and it's the kind of thing that gets your sender access cut off too. You need a consented, opt-out-friendly list, not a scraped or bought one.",
      "Loyalty/CRM data":
        "Loyalty programmes hoover up rich personal data in exchange for perks, and DPDP is fine with that - IF you're clear about the purpose and don't quietly repurpose or resell it. The real risk is mission creep: using CRM data for things the customer never actually agreed to.",
      "Delivery partner sharing":
        "Right to flag it - sharing is where liability spreads. Your logistics and delivery partners are Processors, so their mishandling of a customer's address and phone number becomes your problem under DPDP. Bind them by contract and limit exactly what you pass on.",
    },
    stat: { value: "Consent", label: "Before every cookie & message" },
    why: "You collect profiles, purchase history and behaviour to personalise and re-market - exactly the processing DPDP now gates behind clear consent. Cookie banners, WhatsApp blasts and CRM enrichment all need a lawful basis, and your delivery and payment partners are processors you remain answerable for.",
    obligations: [
      {
        title: "Real cookie & marketing consent",
        body: "Opt-in before analytics cookies and promotional messages - with an opt-out that genuinely works.",
      },
      {
        title: "Purpose-limited profiling",
        body: "Use purchase data for what the customer agreed to, not silent resale or unrelated targeting.",
      },
      {
        title: "Partner accountability",
        body: "Delivery, logistics and ad partners must be bound by proper processing terms.",
      },
    ],
    penalty: "Large fines - and the marketing channels you depend on (WhatsApp, retargeting) getting cut off.",
    scenario: "You buy a third-party contact list and blast offers. No consent means a clear DPDP violation.",
    actions: [
      "Deploy a real consent-mode cookie banner",
      "Clean marketing lists down to consented contacts",
      "Contract delivery & ad partners as processors",
    ],
  },
  Government: {
    hook: "Government bodies and PSUs are Data Fiduciaries for the entire citizenry - the highest-trust, highest-scrutiny role under DPDP. Citizens are starting to expect the same data rights from the State that they already get from private companies.",
    dataReplies: {
      "Citizen data":
        "You hold citizen data as a Fiduciary for the whole public - the highest-trust role DPDP defines. Every field you collect needs a lawful, communicated purpose, and citizens gain the right to see and correct what you hold. 'The government needs it' is no longer a blank cheque.",
      "Aadhaar-linked data":
        "Aadhaar linkage makes a dataset uniquely powerful and uniquely risky. DPDP expects the strongest safeguards here and a clear purpose for every linkage - plus a real breach plan, because an Aadhaar-linked leak is a mass-scale event, not an incident.",
      "Service delivery":
        "Service-delivery data shows who used which scheme, when and where - sensitive by its nature. DPDP means you collect only what the service genuinely needs, secure it, and give citizens a way to query and correct their own records.",
      "Tax data":
        "Tax records expose income, assets and transactions in fine detail. Even with the State's exemptions, DPDP expects lawful, purpose-limited handling and real security - and citizens increasingly expect transparency about how their data is used.",
      "Benefits data":
        "Benefits and welfare data concerns the most vulnerable citizens, where a leak or an error causes real, immediate harm. DPDP pushes you to collect the minimum, secure it well, and run a grievance channel so people can actually fix mistakes in their records.",
    },
    worryReplies: {
      "Fiduciary status":
        "Exactly the right frame. As a Data Fiduciary the State carries real obligations - lawful purpose, security and citizen rights - and the exemptions are narrower than many assume. Owning that role early builds public trust instead of quietly eroding it.",
      "Citizen consent":
        "The heart of the matter. Even for public services, DPDP expects citizens to be told what's collected and why, in language they genuinely understand. Notice and choice - delivered in regional languages - is where most departments have the most work to do.",
      "Smart city IoT":
        "A fast-emerging risk. Sensors, cameras and connected services quietly generate personal and location data on citizens at scale. DPDP means each of those flows needs a purpose, safeguards and accountability - not just a deployment order and a dashboard.",
      "GeM procurement governance":
        "Good governance instinct. When you procure systems that touch citizen data, DPDP obligations flow down to your vendors. Baking data-protection terms into procurement is how you avoid inheriting someone else's breach after go-live.",
    },
    stat: { value: "Fiduciary", label: "For every citizen you serve" },
    why: "Citizen records, Aadhaar-linked services and benefits data all fall under the DPDP Act, and the State's exemptions are narrower than many assume. As services digitise and smart-city IoT multiplies, every department becomes a Fiduciary that must justify what it collects and secure how it is stored.",
    obligations: [
      {
        title: "Lawful, notified processing",
        body: "Collect citizen data for a clear, communicated purpose - never 'just in case'.",
      },
      {
        title: "Security built for scale",
        body: "Aadhaar-linked and benefits data need strong safeguards and a CERT-In-aligned response plan.",
      },
      {
        title: "Grievance & rights handling",
        body: "Citizens can ask what you hold and have it corrected - you need a real channel for it.",
      },
    ],
    penalty: "Public accountability, audit findings and a lasting erosion of citizen trust in digital services.",
    scenario: "A benefits portal exposes ration-card and Aadhaar links - a mass-scale breach of citizen data.",
    actions: [
      "Inventory citizen data across departments",
      "Harden Aadhaar-linked systems",
      "Set up a citizen rights & grievance desk",
    ],
  },
};

/** Q4 - where the visitor is on their DPDP journey; shapes the closing line. */
export type ReadinessStage = {
  key: string;
  label: string;
  /** Conversational acknowledgement shown before the result. */
  reply: string;
  /** Short verdict woven into the result card. */
  verdict: string;
};

export const READINESS_STAGES: ReadinessStage[] = [
  {
    key: "new",
    label: "We haven't really started",
    reply: "You're right on time - honestly, most teams in your sector are exactly here, and starting clean beats retrofitting a rushed programme after a notice lands.",
    verdict: "You're starting from zero, which is genuinely the best place to be - you get to build it right the first time instead of patching a legacy mess.",
  },
  {
    key: "exploring",
    label: "We're looking into it",
    reply: "Good - awareness is genuinely half the battle, and you're already past the hardest part: admitting it matters. Now it's about turning that intent into something written down and provable.",
    verdict: "You're aware and exploring - the job now is to convert that into a documented, evidence-backed programme you can actually show an auditor or a client.",
  },
  {
    key: "active",
    label: "We're already working on it",
    reply: "Impressive - that already puts you ahead of most of your peers. At this stage the value isn't starting; it's finding the sector-specific gaps that trip up even mature programmes.",
    verdict: "You're already moving - so the real win is closing the sector-specific blind spots that most programmes quietly miss until they're tested.",
  },
];
