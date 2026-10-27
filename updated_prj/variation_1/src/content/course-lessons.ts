/**
 * The actual teaching content behind each persona-course module. The course
 * cards list *what* a module covers; this file is the *content* a learner
 * reads when they expand a module - a short framing, two or three explained
 * topics, and a one-line takeaway.
 *
 * Legal content maps to the Digital Personal Data Protection Act, 2023 and the
 * DPDP Rules, 2025 (reference hub: dpdpa.com). Plain-language and persona-tuned
 * - not legal advice.
 */

export type LessonExample = { good?: string; bad?: string };
export type CourseTopic = {
  heading: string;
  body: string;
  /** a concrete lawful-vs-not illustration */
  example?: LessonExample;
};
export type CourseLesson = {
  intro: string;
  topics: CourseTopic[];
  /** quick-reference facts (numbers, timelines, definitions) */
  keyFacts?: string[];
  /** common mistakes / things to watch out for */
  mistakes?: string[];
  takeaway?: string;
  /** section numbers to deep-link into the on-site reader (/section?s=N) */
  sections?: number[];
};

/** slug → module number → lesson */
export const COURSE_LESSONS: Record<string, Record<number, CourseLesson>> = {
  // ───────────────────────────────────────────────────────────── citizens ──
  citizens: {
    1: {
      intro:
        "Before you can use your rights, it helps to know what kind of law this is, what its key words mean, and where you sit inside it.",
      topics: [
        {
          heading: "Why India finally has a data law",
          body: "For years, what companies did with your personal data was governed only by a thin set of IT-Act rules. The Digital Personal Data Protection Act, 2023 - coming into force in stages from 2025 - is India's first dedicated law that treats your personal data as something you have rights over, not just an asset a company collects. It binds almost any organisation that handles the digital personal data of people in India, even one based abroad.",
        },
        {
          heading: "The four words that decide everything",
          body: "The Act runs on four roles. You are the Data Principal - the person the data is about. The company that decides why and how to use it is the Data Fiduciary. A vendor it hires to crunch that data is a Data Processor. And the Data Protection Board of India is the regulator that enforces it all.",
          example: {
            good: "A hospital (Fiduciary) hires a billing-software vendor (Processor) to email you (Principal) your invoice.",
            bad: "“It's just an app, so no one's really responsible.” Wrong - the Fiduciary always carries the legal duty, even for what its processors do.",
          },
        },
        {
          heading: "Your six rights at a glance",
          body: "The law gives you the right to be clearly told before your data is taken, to access what's held, to correct it, to have it erased, to raise a grievance, and to nominate someone to act for you. Everything else in this course is about using them in real life.",
        },
      ],
      keyFacts: [
        "“Personal data” = any data about an identifiable person - name, phone, photo, location.",
        "The Act covers digital data (or paper later digitised), not purely paper records.",
        "It reaches foreign companies that offer goods or services to people in India.",
      ],
      takeaway:
        "You're the Data Principal - the law exists to give you control, and the company holding your data owes you specific, enforceable duties.",
      sections: [2, 3, 11],
    },
    2: {
      intro:
        "Most of your data is collected on the basis of consent, and the Act sets a high bar for what counts as a real “yes” - a bar a lot of apps quietly fail.",
      topics: [
        {
          heading: "The six marks of valid consent",
          body: "Under Section 6, consent must be free, specific, informed, unconditional, unambiguous and as easy to withdraw as to give. All six must be present at once - five out of six is still invalid. In plain terms: a clear yes, to one clear purpose, that you chose, understood, and can take back.",
        },
        {
          heading: "Free means no arm-twisting",
          body: "Consent isn't free if a service is held hostage to it. A company can insist on data it genuinely needs to do the job you asked for - but it can't force you to accept unrelated tracking or data-sharing as the price of entry.",
          example: {
            good: "A food app asks for your address to deliver your order, and lets you decline marketing separately.",
            bad: "A flashlight app demands your contacts, location and SMS just to turn the light on.",
          },
        },
        {
          heading: "Specific, and a clear yes",
          body: "Consent must be for one stated purpose; if the purpose changes, they have to ask again. And it must be a clear affirmative action - ticking an unticked box. Silence, a pre-ticked box, or “by continuing you agree” is not consent.",
          example: {
            good: "Separate, unticked checkboxes - one for delivery, one for offers - so you choose each.",
            bad: "A single pre-ticked box bundling Terms + marketing + data-sharing that you can't untick.",
          },
        },
        {
          heading: "Withdrawing is your right",
          body: "Where consent is the basis, you can withdraw it at any time, and it must be as easy to withdraw as it was to give. Once you do, the company must stop that processing - though what it lawfully did before stays valid, and it can keep what another law requires.",
        },
      ],
      keyFacts: [
        "Valid consent is Free, Informed, Specific, Unconditional, Unambiguous, Withdrawable.",
        "Notice (Section 5) must come before consent - you can't validly agree to what you weren't told.",
        "Withdrawing must be as easy as giving - comparable clicks and speed.",
      ],
      mistakes: [
        "Pre-ticked boxes, or “continued use = consent”.",
        "“Accept all or you can't use the app” for data the service doesn't need.",
        "One tap to accept, but a phone call or form to withdraw.",
        "Vague blanket consent “for business purposes”.",
      ],
      takeaway:
        "Real consent is a free, specific “yes” you understood and can take back as easily as you gave it - anything less is a dark pattern.",
      sections: [5, 6],
    },
    3: {
      intro:
        "Rights only matter if you use them. Here's what each one does, and exactly how to exercise it so a company has to act.",
      topics: [
        {
          heading: "Access - see what they hold",
          body: "You can ask a company for a summary of the personal data it holds about you, what it's doing with it, and the identities of everyone it has shared it with. It's the starting point for every other right - you can't correct or erase what you don't know they have.",
        },
        {
          heading: "Correction & erasure",
          body: "You can require a company to correct data that's wrong, complete what's incomplete, update what's outdated, and erase data once its purpose is done - unless a law requires it be kept. Erasure should reach the copies they shared, too.",
          example: {
            good: "You ask a lender to fix a misspelt name and delete your data after the loan closes.",
            bad: "“We'll keep your data forever, just in case.” Indefinite retention with no live purpose isn't allowed.",
          },
        },
        {
          heading: "Grievance & nomination",
          body: "Every company must give you a readily available way to complain, and respond within the time the Rules set. You can also nominate another person to exercise your rights on your behalf if you die or become unable to.",
        },
        {
          heading: "Making a request that gets actioned",
          body: "Put it in writing, name the exact right you're using, give enough detail to identify yourself, and keep a dated copy. If they miss the deadline or refuse without good reason, that record is what lets you escalate.",
        },
      ],
      keyFacts: [
        "Six rights: be informed, access, correction, erasure, grievance, nominate.",
        "Companies must publish how to reach their grievance officer / Data Protection Officer.",
        "Keep dates and copies - they're your evidence if you escalate.",
      ],
      takeaway: "Name the right, ask in writing, keep the date - that's all it takes to put a company on the clock.",
      sections: [11, 12, 13, 14],
    },
    4: {
      intro:
        "The Act gives anyone under 18 special protection, and hands parents a clear set of levers most don't know they have.",
      topics: [
        {
          heading: "A parent's verifiable yes",
          body: "For a child under 18, a company must obtain verifiable consent from a parent or lawful guardian before processing the child's data. A self-declared “I am over 18” tick isn't enough where the service should reasonably know it has child users.",
          example: {
            good: "A learning app verifies a parent through an ID or OTP step before a child can sign up.",
            bad: "A social app just asks “Are you 18?” and accepts a tap as proof.",
          },
        },
        {
          heading: "Two hard bans",
          body: "Regardless of consent, a company must not track or behaviourally monitor children, and must not direct targeted advertising at them. It also can't process children's data in ways likely to harm their wellbeing.",
          example: {
            good: "A kids' game shows the same general ad to everyone and stores only game progress.",
            bad: "A kids' app profiles play patterns to push personalised ads and in-app purchases.",
          },
        },
        {
          heading: "Red flags in your family's apps",
          body: "Watch for apps that ask for far more than the activity needs, have no parental controls, or serve personalised ads on a child's account. Where a service is likely to be used by children, the safest design treats every user as a child.",
        },
      ],
      keyFacts: [
        "“Child” = anyone under 18 in India.",
        "Parental consent must be verifiable - not just a checkbox.",
        "No tracking, behavioural monitoring or targeted ads at children - even with consent.",
      ],
      takeaway:
        "Under-18 data needs a verified parent's “yes” - and children must never be tracked or ad-targeted, consent or not.",
      sections: [9],
    },
    5: {
      intro:
        "If a company mishandles your data or ignores a request, there's a clear ladder - and it ends with a regulator that can impose serious penalties.",
      topics: [
        {
          heading: "Step 1 - the company's grievance channel",
          body: "Start with the company's own grievance mechanism - every Data Fiduciary must provide one and respond within the prescribed time. Put your complaint in writing, reference your earlier request, and keep the record. Give them a real chance to fix it first.",
        },
        {
          heading: "Step 2 - the Data Protection Board",
          body: "If they don't resolve it, complain to the Data Protection Board of India - the regulator that inquires into breaches, can summon the company, examine evidence and order corrective action. The process is designed to be digital and accessible.",
        },
        {
          heading: "What the Board can do",
          body: "The Board can investigate and impose financial penalties - up to ₹250 crore for serious failures such as not taking reasonable security safeguards. Penalties go to the government, not to you; the Board's role is enforcement, not compensation.",
          example: {
            bad: "A company leaks your data through weak security and ignores you - exactly what the Board's penalty regime is built to punish.",
          },
        },
      ],
      keyFacts: [
        "Ladder: company grievance officer → Data Protection Board → Appellate Tribunal (TDSAT).",
        "Top penalty in the Schedule: up to ₹250 crore.",
        "Penalties are paid to the government, not as compensation to you.",
      ],
      takeaway:
        "Company grievance first, then the Data Protection Board - which can levy penalties up to ₹250 crore for serious failures.",
      sections: [13, 27, 33],
    },
  },

  // ───────────────────────────────────────────────────────────── founders ──
  founders: {
    1: {
      intro: "Before building anything, work out whether - and how - the Act binds you.",
      topics: [
        {
          heading: "Fiduciary or processor?",
          body: "If you decide why and how personal data is processed, you're a Data Fiduciary and carry the legal duties. If you only process data on another company's instructions (a typical SaaS vendor), you're a Data Processor, with duties flowing from your contract.",
          example: {
            good: "You run a D2C store and decide what customer data to collect and why - you're the Fiduciary.",
            bad: "“We just use Shopify, so it's their problem.” The platform is your Processor; the legal duty stays yours.",
          },
        },
        {
          heading: "Extra-territorial reach",
          body: "Being incorporated abroad is no escape. If you offer goods or services to people in India and process their personal data, the Act applies to you under Section 3.",
        },
        {
          heading: "What counts as personal data",
          body: "The Act covers digital personal data about an identifiable individual. Truly anonymous or aggregate data is out of scope - but only if it genuinely can't be re-identified back to a person.",
        },
      ],
      takeaway: "If you decide the “why” of processing and serve Indian users, you're a Data Fiduciary - wherever you're based.",
      keyFacts: [
        "Fiduciary decides purpose & means; Processor only acts on instructions.",
        "Section 3 can reach you with no India office if you serve Indian users.",
        "Anonymous data that can't be re-identified falls outside the Act.",
      ],
      sections: [2, 3],
    },
    2: {
      intro: "You can't process personal data without a lawful basis. The good news: not everything needs a consent pop-up.",
      topics: [
        {
          heading: "Consent vs legitimate uses",
          body: "Consent is the default basis, but Section 7 lists “legitimate uses” where you don't need it - such as fulfilling something the user voluntarily asked for, employment purposes, or a medical emergency.",
          example: {
            good: "Shipping an order to the address a buyer gave you - a legitimate use.",
            bad: "Emailing those same buyers about an unrelated product line - that needs fresh consent.",
          },
        },
        {
          heading: "A consent request that's actually valid",
          body: "Where you do rely on consent, make it specific and granular: separate toggles per purpose, plain language, only the data you need, and an equally easy way to withdraw later.",
        },
        {
          heading: "Dark patterns to avoid",
          body: "Pre-ticked boxes, bundled all-or-nothing consent, and “withdraw” flows that are harder than “accept” are exactly what the Act treats as invalid - and what draws regulator attention.",
        },
      ],
      takeaway: "Map each purpose to a basis: lean on legitimate uses where they fit, and make consent genuinely free where they don't.",
      keyFacts: [
        "Two lawful bases: consent (Section 6) or a listed legitimate use (Section 7).",
        "Section 7 covers the voluntarily-given purpose, employment, medical emergencies.",
        "Targeted advertising always needs consent - never a legitimate use.",
      ],
      mistakes: [
        "Treating “legitimate use” as a catch-all for marketing.",
        "Bundling unrelated consents into one mandatory box.",
        "Keeping no record of which basis you rely on per purpose.",
      ],
      sections: [4, 6, 7],
    },
    3: {
      intro: "Compliance for a small team is a handful of artifacts done well - not a binder of policies.",
      topics: [
        {
          heading: "Notice + consent capture",
          body: "A Section 5 notice tells users what you collect, the purposes, how to exercise their rights and how to withdraw - shown at or before collection, with the consent recorded against it.",
        },
        {
          heading: "A lightweight record (RoPA-lite)",
          body: "Keep a simple record of what personal data you hold, why, where it lives and who you share it with. It's the backbone of every other obligation and the first thing an auditor or enterprise buyer asks for.",
        },
        {
          heading: "Vendor agreements",
          body: "Any processor you use - analytics, email, cloud - should be bound by a contract that limits them to your instructions and your stated purposes.",
        },
      ],
      takeaway: "Notice, a consent record, a data map and vendor contracts - that lean stack covers most of the Act.",
      keyFacts: [
        "A Section 5 notice states the data, purposes, rights and how to withdraw.",
        "RoPA-lite = what data, why, where it lives, and who you share it with.",
        "Every processor needs a contract limiting them to your instructions.",
      ],
      sections: [5, 8],
    },
    4: {
      intro: "Once you hold personal data, users can exercise rights - and you have to be ready to answer.",
      topics: [
        {
          heading: "A simple process",
          body: "A monitored inbox (say, privacy@) plus a checklist for access, correction and erasure requests is enough for most small teams. The key is responding within the timelines the Rules set.",
        },
        {
          heading: "Who owns it",
          body: "Name one person accountable for privacy even in a team of five. The Act expects a contactable grievance point; ambiguity over ownership is how requests quietly get dropped.",
        },
        {
          heading: "Templates you can adapt",
          body: "You don't need to draft from scratch - adapt standard notice, consent and response templates so your team is consistent and fast under time pressure.",
        },
      ],
      takeaway: "One owner, one inbox, a response checklist and the statutory clock - that's a working rights process.",
      keyFacts: [
        "Be ready for access, correction, erasure, grievance and nomination.",
        "Respond within the timelines the Rules prescribe.",
        "Publish a reachable grievance / DPO contact.",
      ],
      mistakes: [
        "No single owner for privacy requests.",
        "Missing the statutory response window.",
        "Acting on a request with no identity check.",
      ],
      sections: [11, 12, 13],
    },
    5: {
      intro: "Knowing what to do in the first hours of a breach is worth more than any policy document.",
      topics: [
        {
          heading: "The notification duty",
          body: "On a personal-data breach you must intimate the Data Protection Board and the affected users in the manner and time the Rules prescribe. Staying silent is itself a violation.",
        },
        {
          heading: "What ₹250 crore really means",
          body: "The Schedule allows penalties up to ₹250 crore, notably for failing to take reasonable security safeguards. For a small firm the existential risk is often reputational and contractual as much as financial.",
          example: {
            bad: "Storing customer data with no access control, then going silent after a leak - the exact failure the Schedule punishes.",
          },
        },
        {
          heading: "A one-page playbook",
          body: "Write down in advance who declares a breach, who contains it, who notifies the Board and users, and where it's all logged. Decide it now - not at 2am during the incident.",
        },
      ],
      takeaway: "Detect, contain, notify the Board and users on time, and log everything - decided in advance on one page.",
      keyFacts: [
        "On a breach: intimate the Board and affected users as prescribed.",
        "Top Schedule penalty: up to ₹250 crore.",
        "Keep a one-page incident playbook ready in advance.",
      ],
      sections: [8, 33],
    },
  },

  // ─────────────────────────────────────────────────────────── practitioner ──
  practitioner: {
    1: {
      intro: "Set the scope precisely - most compliance errors trace back to a wrong call made right here.",
      topics: [
        {
          heading: "Territorial reach",
          body: "The Act governs digital personal data processed in India, and processing outside India where it's tied to offering goods or services to Data Principals in India (Section 3).",
        },
        {
          heading: "The three roles",
          body: "Distinguish the Data Principal, the Data Fiduciary (determines purpose and means) and the Data Processor (acts on the Fiduciary's instructions). Accountability sits with the Fiduciary, always.",
        },
        {
          heading: "What's in and out of scope",
          body: "Digital - or digitised - personal data is in scope; purely personal or domestic processing and certain published data sit outside it (Section 3).",
        },
      ],
      takeaway: "Pin down who the Fiduciary is and whether the processing is in scope before designing a single control.",
      keyFacts: [
        "In scope: digital or digitised personal data; out: purely personal/domestic.",
        "Section 3 extends reach to offshore processing tied to offers in India.",
        "Accountability always sits with the Data Fiduciary.",
      ],
      sections: [1, 2, 3],
    },
    2: {
      intro: "Notice and consent are where most user-facing compliance is won or lost.",
      topics: [
        {
          heading: "Itemised notice",
          body: "A Section 5 notice must state the personal data collected and the purpose, plus how to exercise rights and how to complain to the Board - in clear language, with access in English or a Schedule-8 language.",
          example: {
            good: "A sign-up notice listing each purpose, the rights, and a DPO contact, offered in English and Hindi.",
            bad: "A vague “we process data for business purposes” line with no rights or contact.",
          },
        },
        {
          heading: "Valid consent",
          body: "Consent must be free, specific, informed, unconditional and unambiguous with a clear affirmative action, and limited to the data necessary for the stated purpose.",
        },
        {
          heading: "Withdrawal & Consent Managers",
          body: "Withdrawal must be as easy as giving consent; a registered Consent Manager gives principals an accountable, interoperable way to manage it across services.",
        },
      ],
      takeaway: "Specific notice, granular consent, frictionless withdrawal - documented end to end.",
      keyFacts: [
        "Notice (Section 5) must precede consent (Section 6).",
        "Consent: free, specific, informed, unconditional, unambiguous, withdrawable.",
        "Withdrawal as easy as giving; Consent Managers operationalise it.",
      ],
      sections: [5, 6],
    },
    3: {
      intro: "Section 7 is the consent-free lane - powerful, but narrow and easily over-claimed.",
      topics: [
        {
          heading: "The permitted grounds",
          body: "They include the purpose a user voluntarily provided data for, employment, certain State functions and benefits, medical emergencies, and safety during disasters or epidemics.",
        },
        {
          heading: "Where it doesn't stretch",
          body: "Legitimate use can't justify behavioural advertising or re-purposing data for something the principal never had in view. Reach for consent there instead.",
        },
        {
          heading: "Documenting reliance",
          body: "Record which ground you rely on for each purpose and why. An undocumented legitimate use is effectively indefensible before the Board.",
        },
      ],
      takeaway: "Use Section 7 where it genuinely fits, never as a catch-all - and write down your reasoning.",
      keyFacts: [
        "Section 7 grounds are a closed list, read narrowly.",
        "Includes voluntary purpose, employment, medical emergency, disaster.",
        "Document the ground and reasoning per purpose.",
      ],
      mistakes: [
        "Stretching Section 7 to cover advertising.",
        "Relying on a legitimate use you can't evidence.",
      ],
      sections: [7],
    },
    4: {
      intro: "Operationalising rights within statutory timelines is the day-to-day of the role.",
      topics: [
        {
          heading: "The rights",
          body: "Access (including who data was shared with), correction, erasure, grievance redressal and nomination - each with its own intake and evidence trail.",
        },
        {
          heading: "Meeting the clock",
          body: "Build intake, identity verification and response workflows that hit the Rules' timelines, capturing evidence of each step as you go.",
        },
        {
          heading: "The principal's duties (Section 15)",
          body: "Principals must not file false or frivolous complaints or impersonate others - a defensive point worth keeping in your back pocket.",
        },
      ],
      takeaway: "Stand up auditable workflows that resolve each right within time - and remember the principal has duties too.",
      keyFacts: [
        "Rights: access, correction, erasure, grievance, nomination.",
        "Hit the Rules' response timelines, with evidence.",
        "Section 15 imposes duties on principals too.",
      ],
      sections: [11, 12, 13, 14, 15],
    },
    5: {
      intro: "Section 8 is the accountability core: security, accuracy, minimisation and breach response.",
      topics: [
        {
          heading: "Safeguards & minimisation",
          body: "Take reasonable security safeguards, keep data accurate for its purpose, and retain it only as long as needed before erasing it.",
          example: {
            good: "Encrypting data and deleting it on a retention schedule once its purpose ends.",
            bad: "Keeping everything forever, unencrypted, in case it's useful later.",
          },
        },
        {
          heading: "Breach intimation",
          body: "On a breach, intimate the Board and affected principals as prescribed - promptly, and with the detail the Rules require.",
        },
        {
          heading: "Evidence the Board expects",
          body: "Keep logs, decisions and notifications. Accountability means being able to show compliance, not merely assert it.",
        },
      ],
      takeaway: "Secure, minimise, and be ready to evidence a timely breach notification.",
      keyFacts: [
        "Section 8 = security, accuracy, minimisation, retention, breach.",
        "Intimate the Board and affected principals on a breach.",
        "Keep logs and decisions - prove compliance, don't just assert it.",
      ],
      mistakes: [
        "Indefinite retention with no live purpose.",
        "No breach-notification runbook or evidence trail.",
      ],
      sections: [8],
    },
    6: {
      intro: "Heightened duties apply to children and to those who act through guardians.",
      topics: [
        {
          heading: "Verifiable consent",
          body: "Process a child's personal data only with verifiable consent of a parent or lawful guardian.",
        },
        {
          heading: "The prohibitions",
          body: "No tracking, behavioural monitoring or targeted advertising of children, and nothing likely to harm their wellbeing - even with consent.",
        },
        {
          heading: "Age assurance in practice",
          body: "Adopt proportionate age-assurance measures; exemptions may apply to classes of fiduciaries or purposes the government notifies.",
        },
      ],
      takeaway: "Verified guardian consent, no child tracking or ad-targeting, and proportionate age checks.",
      keyFacts: [
        "Verifiable parental / guardian consent for under-18s.",
        "No tracking, monitoring or targeted ads at children - even with consent.",
        "Use proportionate age assurance; watch for notified exemptions.",
      ],
      sections: [9],
    },
    7: {
      intro: "Higher-risk fiduciaries carry extra, named obligations under Section 10.",
      topics: [
        {
          heading: "When Section 10 bites",
          body: "The government designates Significant Data Fiduciaries by the volume and sensitivity of data and the risk to rights, the security of the State and public order.",
        },
        {
          heading: "The extra duties",
          body: "Appoint a Data Protection Officer based in India, engage an independent data auditor, and conduct periodic Data Protection Impact Assessments and audits.",
        },
        {
          heading: "Beyond the baseline",
          body: "The Board may require additional measures - treat SDF status as a standing programme, not a one-time checkbox.",
        },
      ],
      takeaway: "If you're an SDF: a DPO in India, independent audits, and DPIAs as standing practice.",
      keyFacts: [
        "SDF status is notified by volume, sensitivity and risk to rights.",
        "Duties: DPO in India, independent auditor, periodic DPIAs.",
        "The Board may add further measures.",
      ],
      sections: [10],
    },
    8: {
      intro: "Know the enforcement machinery you're accountable to.",
      topics: [
        {
          heading: "The Board",
          body: "The Data Protection Board inquires into breaches, can act on complaints, and follows the procedure in Sections 27-28, with civil-court powers for certain matters.",
        },
        {
          heading: "The Schedule",
          body: "Penalties are graded by the nature of the failure, up to ₹250 crore for inadequate security safeguards.",
        },
        {
          heading: "Appeals",
          body: "Appeals lie to the Appellate Tribunal (TDSAT), with onward routes from there.",
        },
      ],
      takeaway: "The Board enforces, the Schedule prices failure up to ₹250 crore, and TDSAT hears appeals.",
      keyFacts: [
        "The Board inquires and acts under Sections 27-28.",
        "Schedule penalties up to ₹250 crore.",
        "Appeals go to the Appellate Tribunal (TDSAT).",
      ],
      sections: [18, 27, 33],
    },
  },

  // ──────────────────────────────────────────────────────────────── legal ──
  legal: {
    1: {
      intro: "Read the Act as a structured instrument before advising on any single duty.",
      topics: [
        {
          heading: "Nine chapters",
          body: "Preliminary; obligations of the Data Fiduciary; rights and duties of the Principal; special provisions; the Board; its powers and procedure; appeals and ADR; penalties; and miscellaneous.",
        },
        {
          heading: "Definitions decide outcomes",
          body: "Section 2 does the heavy lifting - “personal data”, “processing”, “Data Fiduciary” and “Consent Manager” frame every later argument you'll make.",
        },
        {
          heading: "“Shall” vs “may”",
          body: "Track the operative verbs: mandatory obligations versus enabling powers and delegated rule-making change the advice you give.",
        },
      ],
      takeaway: "Master Section 2 and the chapter architecture; the operative verbs tell you what's mandatory.",
      keyFacts: [
        "Nine chapters; Section 2 definitions drive outcomes.",
        "“Shall” = mandatory; “may” = enabling or delegated.",
        "44 sections plus one Schedule of penalties.",
      ],
      sections: [1, 2],
    },
    2: {
      intro: "The Act sets principles; the 2025 Rules supply the operative detail you actually advise on.",
      topics: [
        {
          heading: "Rule-to-section mapping",
          body: "Each Rule gives effect to a section - notice content, Consent Manager registration, breach timelines, children's data and security expectations.",
        },
        {
          heading: "What's operative now",
          body: "Track the enforcement timeline: provisions and rules switch on by notification rather than all at once, so “in force” is a moving target.",
        },
        {
          heading: "What's still delegated",
          body: "Some detail remains for further rules and Board practice; flag those gaps explicitly when you advise.",
        },
      ],
      takeaway: "Advise from the Rules, not just the Act - and watch the staged enforcement timeline.",
      keyFacts: [
        "Rules give operative effect to each section.",
        "They cover notice, consent managers, breach, children, security.",
        "Enforcement switches on in stages by notification.",
      ],
      sections: [5, 6, 8],
    },
    3: {
      intro: "Building and defending a lawful basis is the heart of advisory work.",
      topics: [
        {
          heading: "A defensible basis per purpose",
          body: "Section 4 permits processing only on consent or a legitimate use; advise purpose-by-purpose, never in bulk.",
          example: {
            good: "Mapping each purpose - delivery, fraud-check, marketing - to its own lawful basis.",
            bad: "One blanket consent “for all business purposes” covering everything.",
          },
        },
        {
          heading: "Limits of legitimate uses",
          body: "Section 7's grounds are specific and closed; they don't cover advertising or open-ended re-purposing.",
        },
        {
          heading: "Documentation that survives scrutiny",
          body: "Records of purpose, basis and necessity are what hold up before the Board when reliance is challenged.",
        },
      ],
      takeaway: "Pin a specific, documented basis to each purpose; treat Section 7 narrowly.",
      keyFacts: [
        "Section 4: processing only on consent or a legitimate use.",
        "Advise purpose-by-purpose, never in bulk.",
        "Documentation is the defence before the Board.",
      ],
      mistakes: [
        "Open-ended “any purpose” clauses.",
        "Treating Section 7 as an open-ended balancing test.",
      ],
      sections: [4, 7],
    },
    4: {
      intro: "The edges of the Act - transfers, exemptions and the State - are where the nuance lives.",
      topics: [
        {
          heading: "Cross-border transfers",
          body: "Transfers abroad are permitted except to countries the Central Government restricts by notification (Section 16) - a negative-list rather than an allow-list approach.",
          example: {
            good: "Checking the restricted-country list before signing a US cloud contract.",
            bad: "Assuming every transfer is banned unless a country is whitelisted.",
          },
        },
        {
          heading: "Exemptions",
          body: "Section 17 exempts certain processing - research, archiving and statistical purposes, and notified instrumentalities - subject to safeguards.",
        },
        {
          heading: "State processing",
          body: "Specified government processing carries tailored treatment; always advise on the precise notification being relied upon.",
        },
      ],
      takeaway: "Section 16 is a negative list; Section 17 exemptions are conditional - always cite the specific notification.",
      keyFacts: [
        "Section 16: transfers allowed except to restricted countries (negative list).",
        "Section 17 exemptions: research, archiving, statistical, notified bodies.",
        "Cite the precise notification relied on.",
      ],
      sections: [16, 17],
    },
    5: {
      intro: "The Act sits atop a decade of privacy jurisprudence that courts will read it against.",
      topics: [
        {
          heading: "Privacy as a fundamental right",
          body: "Puttaswamy (2017) held that privacy is intrinsic to Article 21 - the constitutional anchor the Act rests on.",
        },
        {
          heading: "Proportionality & minimisation",
          body: "Aadhaar jurisprudence built out the proportionality test and minimisation expectations that courts now apply to data processing.",
        },
        {
          heading: "How courts may read it",
          body: "Expect ambiguous provisions to be interpreted through proportionality and the primacy of consent.",
        },
      ],
      takeaway: "Frame advice against Puttaswamy and proportionality - the lens courts will use.",
      keyFacts: [
        "Puttaswamy (2017): privacy is a fundamental right under Art. 21.",
        "Aadhaar case built the proportionality and minimisation tests.",
        "Courts read ambiguity through proportionality and consent.",
      ],
      sections: [3],
    },
    6: {
      intro: "Anticipating enforcement risk is what clients actually pay for.",
      topics: [
        {
          heading: "Board powers & procedure",
          body: "The Board inquires, can act on complaints, and follows the Sections 27-28 procedure with the powers of a civil court for certain matters.",
        },
        {
          heading: "The graded Schedule",
          body: "Penalties scale by the nature of the failure, up to ₹250 crore at the top of the band.",
        },
        {
          heading: "Appeals to TDSAT",
          body: "Appeals lie to the Appellate Tribunal (TDSAT); advise on timelines and grounds early, before they lapse.",
        },
      ],
      takeaway: "Map likely failures to the Schedule and the appeal route before the Board ever calls.",
      keyFacts: [
        "Board: Sections 27-28 procedure, civil-court powers for some matters.",
        "Schedule penalties up to ₹250 crore.",
        "Appeals to the Appellate Tribunal (TDSAT).",
      ],
      sections: [27, 33],
    },
  },

  // ────────────────────────────────────────────────────────── engineering ──
  engineering: {
    1: {
      intro: "Translate Section 8's duties into architecture, not afterthoughts.",
      topics: [
        {
          heading: "From duty to design",
          body: "Security, accuracy, minimisation and retention limits are system requirements - encode them as constraints in the design, not as policies bolted on later.",
        },
        {
          heading: "Purpose limitation in code",
          body: "Tie data fields and pipelines to declared purposes, and block use outside those purposes by construction rather than by convention.",
        },
        {
          heading: "Default-private",
          body: "Ship settings off-by-default and collect the minimum. Privacy by default is the cheapest, most reliable control you have.",
          example: {
            good: "A new analytics toggle ships off by default - opt-in only.",
            bad: "Every new feature collects data on by default, with opt-out buried in settings.",
          },
        },
      ],
      takeaway: "Turn Section 8 duties into constraints, scope data to purpose, and default everything to private.",
      keyFacts: [
        "Encode Section 8 duties (security, accuracy, minimisation, retention) as constraints.",
        "Bind data fields and pipelines to declared purposes.",
        "Default settings off; collect the minimum.",
      ],
      sections: [8],
    },
    2: {
      intro: "You can't protect or minimise what you can't see.",
      topics: [
        {
          heading: "Inventory everything",
          body: "Discover personal data across services, logs, warehouses and vendors - automated scanning beats a stale spreadsheet every time.",
        },
        {
          heading: "A machine-readable RoPA",
          body: "Maintain your record of processing as data, not a document, so it stays current and queryable as systems change.",
        },
        {
          heading: "Retention & deletion",
          body: "Encode retention schedules and run automated deletion jobs. Minimisation is a continuous process, not a one-off clean-up.",
        },
      ],
      takeaway: "Continuously discover personal data, keep a queryable RoPA, and automate retention and deletion.",
      keyFacts: [
        "Automated discovery beats stale spreadsheets.",
        "Keep the RoPA as queryable data, not a document.",
        "Encode retention schedules with automated deletion.",
      ],
      sections: [5, 8],
    },
    3: {
      intro: "Section 8 expects reasonable safeguards - and a working breach response.",
      topics: [
        {
          heading: "Controls",
          body: "Access control, encryption in transit and at rest, and masking or tokenisation of sensitive fields are the baseline.",
          example: {
            good: "Card data encrypted and tokenised, with access scoped by role.",
            bad: "Plaintext PII written to app logs for “easier debugging”.",
          },
        },
        {
          heading: "Tamper-evident logs",
          body: "Audit trails that can't be quietly edited are what let you prove what happened during an incident.",
        },
        {
          heading: "Breach-ready detection",
          body: "Build detection plus an automated notification workflow so intimation to the Board and users is fast and complete when it counts.",
        },
      ],
      takeaway: "Encrypt, control access, log tamper-evidently, and automate breach detection and notification.",
      keyFacts: [
        "Encryption in transit and at rest; mask or tokenise sensitive fields.",
        "Tamper-evident audit logs prove what happened.",
        "Detection plus automated Board / user notification.",
      ],
      mistakes: [
        "Sensitive data in plaintext logs.",
        "No detection, so breaches surface far too late.",
      ],
      sections: [8],
    },
    4: {
      intro: "Consent and rights become engineering surfaces - APIs, events and jobs.",
      topics: [
        {
          heading: "Consent as data",
          body: "Capture granular, versioned consent with timestamps and a withdrawal endpoint, and treat consent state as a first-class signal your pipelines check.",
        },
        {
          heading: "Automating rights",
          body: "Expose access, correction and erasure as workflows so requests resolve within statutory time without heroics.",
        },
        {
          heading: "Erasure that reaches everywhere",
          body: "Propagate deletion to replicas, caches and backups. Erasure that misses your backups isn't erasure.",
          example: {
            good: "Deleting a user cascades to replicas, caches and backups per the retention policy.",
            bad: "Deleting the row in production but leaving copies in backups and the warehouse.",
          },
        },
      ],
      takeaway: "Version consent, gate pipelines on it, and make erasure cascade to every copy.",
      keyFacts: [
        "Granular, versioned consent with a withdrawal endpoint.",
        "Rights as workflows: access, correction, erasure.",
        "Erasure must reach replicas, caches and backups.",
      ],
      sections: [6, 11, 12],
    },
    5: {
      intro: "AI systems concentrate privacy risk - govern the data, not just the model.",
      topics: [
        {
          heading: "Prompt & RAG leakage",
          body: "Personal data in prompts, embeddings or retrieved context can leak across users; isolate, filter and minimise it before it reaches the model.",
        },
        {
          heading: "Training-data governance",
          body: "Track provenance and lawful basis for training data. Re-purposing identifiable data for training needs a fresh basis - consent doesn't transfer automatically.",
        },
        {
          heading: "Erasure & unlearning",
          body: "Plan for the right to erasure against models, through retrieval filtering, periodic retraining or machine-unlearning strategies.",
        },
      ],
      takeaway: "Govern AI data provenance and basis, contain prompt/RAG leakage, and plan for erasure against models.",
      keyFacts: [
        "Filter personal data out of prompts, embeddings and RAG context.",
        "Track training-data provenance and lawful basis.",
        "Plan erasure: retrieval filtering, retraining, or unlearning.",
      ],
      mistakes: [
        "Re-using identifiable data for training with no fresh basis.",
        "PII leaking across users via shared context or embeddings.",
      ],
      sections: [8],
    },
  },

  // ───────────────────────────────────────────────────────────── students ──
  students: {
    1: {
      intro: "Start with the vocabulary and scope that the whole exam is built on.",
      topics: [
        {
          heading: "The roles",
          body: "Data Principal (the individual), Data Fiduciary (decides purpose and means), Data Processor (acts on instructions) and the Data Protection Board (the regulator).",
        },
        {
          heading: "Scope & definitions",
          body: "Digital personal data, the meaning of “processing”, and the Section 3 application - including extra-territorial reach - are perennial exam fodder.",
        },
        {
          heading: "DPDP vs GDPR",
          body: "Both are consent-centric and rights-based, but DPDP is leaner: no separate “sensitive data” tier, and it uses “legitimate uses” rather than the GDPR's six bases.",
        },
      ],
      takeaway: "Lock the four roles, Section 3 scope, and the GDPR contrast - they anchor everything else.",
      keyFacts: [
        "Four roles: Principal, Fiduciary, Processor, Board.",
        "Section 3 scope includes extra-territorial reach.",
        "DPDP has no “sensitive data” tier; it uses “legitimate uses”.",
      ],
      sections: [1, 2, 3],
    },
    2: {
      intro: "Notice → consent → withdrawal is the spine of the Act and a frequent exam theme.",
      topics: [
        {
          heading: "Notice, consent, withdrawal",
          body: "A Section 5 notice precedes Section 6 consent, which must be free, specific and informed - and withdrawable as easily as it was given.",
        },
        {
          heading: "Consent Managers & legitimate uses",
          body: "Consent Managers operationalise consent across services; Section 7 legitimate uses are the consent-free grounds you must be able to list.",
        },
        {
          heading: "Worked examples",
          body: "Practise classifying scenarios as consent vs legitimate use - the exam leans heavily on exactly this distinction.",
        },
      ],
      takeaway: "Trace notice → consent → withdrawal, and tell consent apart from legitimate uses.",
      keyFacts: [
        "Notice (Section 5) → consent (Section 6) → withdrawal.",
        "Section 7 legitimate uses = the consent-free grounds.",
        "Classify scenarios: consent vs legitimate use.",
      ],
      sections: [5, 6, 7],
    },
    3: {
      intro: "Both sides of the relationship - what fiduciaries owe and what principals can demand.",
      topics: [
        {
          heading: "Fiduciary obligations",
          body: "Security safeguards, accuracy, data minimisation, retention limits and breach intimation under Section 8.",
        },
        {
          heading: "Principal's rights & duties",
          body: "Access, correction, erasure, grievance and nomination (Sections 11-14), plus the principal's own duties under Section 15.",
        },
        {
          heading: "Breach & timelines",
          body: "Know who must be told on a breach - the Board and affected principals - and within what time.",
        },
      ],
      takeaway: "Pair Section 8 obligations with Sections 11-15 rights and duties - examiners test both directions.",
      keyFacts: [
        "Section 8: security, accuracy, minimisation, retention, breach.",
        "Sections 11-14 rights; Section 15 duties of the principal.",
        "Breach: tell the Board and affected principals.",
      ],
      sections: [8, 11, 15],
    },
    4: {
      intro: "The exceptions and heightened duties that exam questions love to probe.",
      topics: [
        {
          heading: "Children & disability",
          body: "Verifiable guardian consent and the ban on tracking and targeted advertising of children (Section 9).",
        },
        {
          heading: "Significant Data Fiduciaries",
          body: "DPO, independent audit and DPIA duties for fiduciaries the government designates (Section 10).",
        },
        {
          heading: "Exemptions",
          body: "Research, archiving, statistical purposes and notified State processing under Section 17.",
        },
      ],
      takeaway: "Children (Section 9), SDFs (Section 10) and exemptions (Section 17) are the high-yield “special” topics.",
      keyFacts: [
        "Section 9 children: verifiable consent; no tracking or ads.",
        "Section 10 SDF: DPO, independent audit, DPIA.",
        "Section 17 exemptions: research, archiving, statistical, State.",
      ],
      sections: [9, 10, 17],
    },
    5: {
      intro: "How the Act is enforced - and what it costs to get it wrong.",
      topics: [
        {
          heading: "The Board",
          body: "The composition, powers and procedure of the Data Protection Board (Sections 18-28).",
        },
        {
          heading: "Penalties",
          body: "The Schedule grades penalties by failure, up to ₹250 crore at the top.",
        },
        {
          heading: "Appeals",
          body: "Appeals run to the Appellate Tribunal (TDSAT) and onward (Section 29).",
        },
      ],
      takeaway: "Board → Schedule penalties → TDSAT appeals is the enforcement chain to memorise.",
      keyFacts: [
        "Board: composition, powers, procedure (Sections 18-28).",
        "Schedule penalties up to ₹250 crore.",
        "Appeals to the Appellate Tribunal (TDSAT) (Section 29).",
      ],
      sections: [18, 33],
    },
    6: {
      intro: "The last mile: turning knowledge into a passed exam.",
      topics: [
        {
          heading: "How the exam works",
          body: "The certification exam is five questions in 10 minutes, drawn at random from the 224-question bank. Answer all five correctly to unlock the certificate.",
        },
        {
          heading: "Timing & the palette",
          body: "Budget up to two minutes per question, use the palette to revisit answers, and never leave an answer blank - every question must be correct.",
        },
        {
          heading: "Targeted practice",
          body: "Drill by difficulty against the bank until your weak chapters are as strong as your best; the adaptive quiz shows you where you're losing marks.",
        },
      ],
      takeaway: "Five questions, 10 minutes: check every answer carefully and review your weakest chapters before retrying.",
      keyFacts: [
        "Five questions in 10 minutes, drawn from the 224-question bank.",
        "All five answers must be correct to unlock the certificate.",
        "Drill by difficulty against your weak chapters.",
      ],
    },
  },
};

export function getCourseLessons(slug: string): Record<number, CourseLesson> | undefined {
  return COURSE_LESSONS[slug];
}
