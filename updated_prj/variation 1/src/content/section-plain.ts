/**
 * Hand-authored, plain-English companion for every section of the DPDP Act, 2023.
 *
 * The per-section reading view (`/section/[n]`) pairs the official Gazette text
 * with a clear explanation. This file is the source of truth for that
 * explanation: a well-written paragraph, a short list of concrete key points,
 * and - only where it genuinely aids understanding - a real-world example.
 *
 * Written originally for TrustStack's DPDP Academy. Faithful to Act 22 of 2023;
 * not a substitute for legal advice or the official text.
 */
export type SectionPlain = {
  /** One or two well-crafted paragraphs in plain English. */
  plainEnglish: string;
  /** 3-5 concrete, scannable points. */
  keyPoints: string[];
  /** A short worked example - present only where it clarifies. */
  example?: string;
};

export const SECTION_PLAIN: Record<number, SectionPlain> = {
  1: {
    plainEnglish:
      "This is the section that names the law and switches it on. It gives the Act its official title - the Digital Personal Data Protection Act, 2023 - and makes clear the law does not all start at once. The Central Government notifies commencement dates in the Official Gazette, and it may bring different provisions into force on different dates. So each provision only binds you from the day it is actually notified.",
    keyPoints: [
      "Names the law: the Digital Personal Data Protection Act, 2023.",
      "Comes into force on dates the Central Government notifies in the Official Gazette.",
      "Different provisions can be switched on at different times - not everything starts on one day.",
      "A reference to 'commencement' means the day that particular provision comes into force.",
    ],
    example:
      "The sections setting up the Data Protection Board may be notified months before the consent and notice obligations, so you track each provision's own start date rather than a single 'go-live' date.",
  },
  2: {
    plainEnglish:
      "This is the Act's dictionary. Almost every later obligation turns on the precise meaning of a handful of terms, so the Act defines them once, here. The four roles you must know are the Data Principal (the individual the data is about), the Data Fiduciary (whoever decides why and how personal data is processed - the party that carries the legal duties), the Data Processor (who processes on a Fiduciary's behalf), and the Consent Manager (a Board-registered platform for managing consent). It also fixes edges like 'child' (anyone under eighteen) and 'personal data' (any data about an identifiable individual).",
    keyPoints: [
      "Data Principal - the individual the personal data is about (includes a child's parent or guardian).",
      "Data Fiduciary - decides the purpose and means of processing; carries the Act's obligations.",
      "Data Processor - processes personal data on a Fiduciary's behalf, under instruction.",
      "'Child' means anyone under eighteen; 'personal data' is any data about an identifiable individual.",
      "Consent Manager and the Data Protection Board of India are also defined here.",
    ],
    example:
      "An online store that decides what customer data to collect and why is the Data Fiduciary; the cloud vendor that merely stores that data for the store is a Data Processor.",
  },
  3: {
    plainEnglish:
      "This section draws the boundary of the law - where it applies and where it does not. It covers digital personal data processed in India, including data first collected on paper and later digitised. Crucially, it reaches beyond India's borders: a business outside India is still bound if it processes personal data in connection with offering goods or services to people in India. It does not apply to purely personal or domestic use, or to personal data an individual has themselves made public.",
    keyPoints: [
      "Applies to digital personal data processed within India - including paper data later digitised.",
      "Extra-territorial: reaches foreign businesses offering goods or services to people in India.",
      "Does not apply to personal or domestic processing by an individual.",
      "Does not apply to personal data made publicly available by the individual (or by someone legally required to publish it).",
    ],
    example:
      "A US-based app with no Indian office is still bound by the Act the moment it signs up and serves users in India.",
  },
  4: {
    plainEnglish:
      "You cannot process someone's personal data simply because you hold it - you need a lawful ground. This section says there are only two: the person's consent, or one of the specific 'legitimate uses' listed in Section 7. On top of that, the purpose itself must be lawful, meaning only that it is not expressly forbidden by law. Notably, there is no open-ended 'legitimate interest' basis like the one in the GDPR.",
    keyPoints: [
      "Personal data may be processed only for a lawful purpose.",
      "Two grounds only: (a) the Data Principal's consent, or (b) certain legitimate uses under Section 7.",
      "'Lawful purpose' means any purpose not expressly forbidden by law.",
      "There is no broad 'legitimate interest' ground - if it isn't consent or a listed use, you can't process.",
    ],
    example:
      "Sending marketing emails needs consent; a hospital treating you in a medical emergency can instead rely on a legitimate use under Section 7.",
  },
  5: {
    plainEnglish:
      "Before or when you ask someone for consent, you must give them a clear notice. The notice has to spell out what personal data you want and the purpose it will be used for, how the person can exercise their rights, and how they can complain to the Data Protection Board. For data you already collected with consent before the Act, you must send an equivalent notice as soon as it is reasonably practicable. The person can also ask to read the notice in English or any language in the Eighth Schedule to the Constitution.",
    keyPoints: [
      "A notice must accompany or precede every consent request.",
      "It must state the personal data collected and the purpose of processing.",
      "It must explain how to exercise rights and how to complain to the Board.",
      "For data consented to before the Act, send an equivalent notice as soon as practicable.",
      "Must be available in English or any Eighth Schedule language.",
    ],
    example:
      "A bank opening an account by video-KYC must, before capturing your data, tell you exactly what it is collecting and why.",
  },
  6: {
    plainEnglish:
      "This section sets the quality bar for consent. It must be free, specific, informed, unconditional and unambiguous, given by a clear affirmative action, and limited to only the data actually needed for the stated purpose - bundling in unnecessary permissions does not count. People must be able to withdraw consent as easily as they gave it, and withdrawal does not undo processing already carried out lawfully. Consent requests must be in clear, plain language, and can be routed through a Consent Manager.",
    keyPoints: [
      "Consent must be free, specific, informed, unconditional, unambiguous and by clear affirmative action.",
      "It is limited to the data necessary for the specified purpose - no bundling of extras.",
      "Any part of a consent that breaches the Act is invalid to that extent.",
      "Withdrawal must be as easy as giving consent; past lawful processing stays valid.",
      "Requests must be in clear, plain language and available in scheduled Indian languages.",
    ],
    example:
      "A telemedicine app cannot force you to hand over your phone contacts to get a consultation - your consent stays limited to what the service genuinely needs.",
  },
  7: {
    plainEnglish:
      "Section 7 is a closed list of 'certain legitimate uses' that can support processing without relying on consent under Section 6. It covers data a person voluntarily gives for a stated purpose and does not object to; specified State benefits using data the person previously consented to provide or data from a notified State record; State functions and legally required disclosures; compliance with court or similar orders; medical and public-health emergencies; disasters or breakdowns of public order; and specified employment or employer-protection purposes. Outside this list, a Fiduciary needs consent or another exemption expressly provided by the Act.",
    keyPoints: [
      "Covers a stated purpose for which a person voluntarily provides data and does not object.",
      "State benefits may use previously consented data or data from a notified State record.",
      "Also covers specified State functions, legal disclosures, orders, emergencies and public safety.",
      "Includes specified employment and employer-protection purposes.",
      "Outside this closed list, consent or a separate exemption under the Act is needed.",
    ],
    example:
      "A doctor treating an unconscious patient can process their data to save their life without stopping to collect consent.",
  },
  8: {
    plainEnglish:
      "This section is the Fiduciary's core duty list. You remain accountable for compliance even when a Processor does the actual work, and even if the Data Principal fails to do their part. You must keep data accurate and complete where it is used to make decisions or is shared, protect it with reasonable security safeguards, notify the Board and every affected person of any breach, and erase data once its purpose is served unless a law requires keeping it. You must also publish a contact point for answering data questions.",
    keyPoints: [
      "The Fiduciary stays responsible for compliance even when a Processor handles the data.",
      "Keep personal data complete, accurate and consistent where it drives decisions or is shared.",
      "Apply reasonable technical and organisational security safeguards to prevent breaches.",
      "Report any personal data breach to the Board and to each affected person.",
      "Erase data when the purpose is met (unless retention is legally required); publish a contact point.",
    ],
    example:
      "Once you close your account and no law requires keeping the records, the company must delete your personal data rather than hold it indefinitely.",
  },
  9: {
    plainEnglish:
      "Children get extra protection. Before processing the personal data of a child - anyone under eighteen - or of a person with a disability who has a lawful guardian, you must obtain verifiable consent from the parent or guardian. You must not process children's data in ways likely to harm their well-being, and you must not track them, monitor their behaviour, or direct targeted advertising at them. The Government can relax some of this for specified, verifiably safe purposes or raise the exempt age for trusted Fiduciaries.",
    keyPoints: [
      "'Child' means under eighteen; processing needs verifiable parental or guardian consent.",
      "No processing likely to harm a child's well-being.",
      "No tracking, behavioural monitoring or targeted advertising directed at children.",
      "The Government may exempt specified safe uses or lower the age threshold for trusted Fiduciaries.",
    ],
    example:
      "An ed-tech app must obtain verifiable parental consent before signing up a 15-year-old, and cannot profile that student to serve targeted ads.",
  },
  10: {
    plainEnglish:
      "Some organisations handle so much, or such sensitive, personal data that the Central Government can designate them a 'Significant Data Fiduciary'. This tier carries heavier duties: appoint a Data Protection Officer based in India who answers to the governing body and serves as the grievance contact, appoint an independent data auditor, and run periodic Data Protection Impact Assessments and audits to find and manage risks to Data Principals.",
    keyPoints: [
      "The Government designates SDFs based on data volume, sensitivity and risk factors.",
      "Must appoint a Data Protection Officer based in India, answerable to the governing body.",
      "Must undertake periodic Data Protection Impact Assessments (DPIAs).",
      "Must undergo periodic independent audits and any other prescribed measures.",
    ],
    example:
      "A large social-media platform processing the data of millions of Indians is a likely candidate for designation as a Significant Data Fiduciary.",
  },
  11: {
    plainEnglish:
      "This is your right to ask a Fiduciary what it is doing with your data. On request, it must give you a summary of the personal data it processes about you and the processing it carries out, plus the identities of everyone it has shared your data with and a description of what was shared. There is one carve-out: it need not reveal sharing done with authorised bodies for preventing, detecting or investigating offences.",
    keyPoints: [
      "Request a summary of your personal data and how it is being processed.",
      "Learn the identities of other Fiduciaries and Processors it was shared with, and what was shared.",
      "Applies to data you consented to (including certain legitimate-use data).",
      "Sharing for offence prevention or investigation is exempt from disclosure.",
    ],
    example:
      "You can ask an e-commerce site which delivery, payment and analytics partners received your address and order details.",
  },
  12: {
    plainEnglish:
      "If a Fiduciary holds wrong, incomplete or outdated data about you, this right lets you require them to correct, complete or update it. You can also ask them to erase your personal data, and they must comply - unless keeping it is still necessary for the original purpose or is required by another law.",
    keyPoints: [
      "Require correction, completion or updating of your personal data.",
      "Require erasure of your personal data on request.",
      "Erasure can be refused only where retention is needed for the purpose or by law.",
      "Applies to data processed on your consent (including certain legitimate uses).",
    ],
    example:
      "You can have a misspelt name fixed, or ask a service you have stopped using to delete your account data.",
  },
  13: {
    plainEnglish:
      "Every Fiduciary - and every Consent Manager - must give you an easy, readily available way to raise complaints about how they handle your data or your rights, and must respond within the time the Rules set. You are expected to use this channel first: only after exhausting it can you take the matter to the Data Protection Board.",
    keyPoints: [
      "Fiduciaries and Consent Managers must provide a readily available grievance mechanism.",
      "They must respond within the period prescribed by the Rules.",
      "You must exhaust this channel before approaching the Board.",
    ],
  },
  14: {
    plainEnglish:
      "This right lets you name another person to step into your shoes and exercise your data rights if you die or become unable to act for yourself. It works like a nominee - but for your digital personal data rather than a bank account.",
    keyPoints: [
      "Nominate someone to exercise your rights on your death or incapacity.",
      "'Incapacity' means being unable to act due to unsoundness of mind or bodily infirmity.",
      "Functions like a nominee for your personal data.",
    ],
  },
  15: {
    plainEnglish:
      "Rights come with responsibilities. As a Data Principal you must comply with the law while exercising your rights, must not impersonate someone else, must not suppress material information where the law requires it (for example on official identity documents), must not file false or frivolous complaints, and must give only genuine, verifiable information when asking for a correction or erasure.",
    keyPoints: [
      "Comply with applicable laws while exercising your rights.",
      "Do not impersonate another person.",
      "Do not suppress material information for official documents or identifiers.",
      "Do not file false or frivolous grievances; provide only authentic information.",
    ],
    example:
      "Filing a fake data-breach complaint to harass a company breaches this duty and can itself attract a penalty.",
  },
  16: {
    plainEnglish:
      "This section governs sending personal data abroad. The default is open - transfers are allowed - but the Central Government may notify specific countries or territories to which transfers are restricted (a 'blacklist' rather than a 'whitelist' model). It also makes clear that any stricter transfer rules in other Indian laws - say, sectoral rules for banking or health data - continue to apply on top of this section.",
    keyPoints: [
      "Cross-border transfers are permitted by default.",
      "The Government may restrict transfers to specified countries or territories.",
      "Stricter transfer rules in other Indian laws continue to apply.",
    ],
    example:
      "A bank may transfer data to a cloud region abroad unless that country is on a restricted list - but sectoral rules requiring local storage still bind it.",
  },
  17: {
    plainEnglish:
      "Not every obligation fits every situation, so this section lists where large parts of the Act are switched off. Exemptions cover processing needed to enforce a legal right or claim, work done by courts and regulators, preventing or investigating offences, certain corporate mergers and restructurings, and recovering loan defaults. The Central Government can also exempt its own instrumentalities in the interests of security or public order, exempt notified classes such as start-ups, and exempt research, archiving or statistical processing that meets prescribed standards.",
    keyPoints: [
      "Switches off specified obligations for defined situations.",
      "Covers enforcing legal rights, courts and regulators, and crime prevention or investigation.",
      "Covers mergers, amalgamations and loan-default recovery.",
      "The Government may exempt State agencies (security or public order) and notified classes like start-ups.",
      "Research, archiving and statistical processing can be exempt if it meets prescribed standards.",
    ],
  },
  18: {
    plainEnglish:
      "This section creates the regulator - the Data Protection Board of India. It is set up as a body corporate, which means it has a legal personality of its own: it can hold property, enter contracts, and sue or be sued in its own name. Its headquarters sits wherever the Central Government notifies.",
    keyPoints: [
      "Establishes the Data Protection Board of India as the regulator.",
      "It is a body corporate with perpetual succession and a common seal.",
      "It can hold property, contract, and sue or be sued in its own name.",
    ],
  },
  19: {
    plainEnglish:
      "This sets who runs the Board. It consists of a Chairperson and however many Members the Central Government notifies, all appointed by the Government. They must be people of ability, integrity and standing with relevant expertise - in fields such as data governance, law, technology, the digital economy or consumer protection - and at least one Member must be an expert in law.",
    keyPoints: [
      "A Chairperson plus a notified number of Members, appointed by the Central Government.",
      "Members must have ability, integrity, standing and relevant expertise.",
      "At least one Member must be an expert in the field of law.",
    ],
  },
  20: {
    plainEnglish:
      "This fixes the Board members' terms of service. Their salary, allowances and conditions are set by the Rules and cannot be changed to their disadvantage after appointment. They serve a two-year term and are eligible for re-appointment.",
    keyPoints: [
      "Salary, allowances and service conditions are prescribed by the Rules.",
      "Terms cannot be varied to a member's disadvantage after appointment.",
      "Two-year term, eligible for re-appointment.",
    ],
  },
  21: {
    plainEnglish:
      "This lists what bars someone from being appointed, or continuing, as Chairperson or Member - being adjudged insolvent, a conviction involving moral turpitude, becoming physically or mentally incapable, acquiring a conflicting financial interest, or abusing the office. A member cannot be removed without first being given an opportunity to be heard.",
    keyPoints: [
      "Grounds include insolvency, conviction for moral turpitude, incapacity, conflict of interest or abuse of office.",
      "Applies both to appointment and to continuation in office.",
      "No removal without an opportunity to be heard.",
    ],
  },
  22: {
    plainEnglish:
      "This covers how members leave and how their seats are filled. A member resigns by written notice, which takes effect when the Government permits, after three months, or when a successor takes over - whichever is earliest. Vacancies are filled by fresh appointment. To prevent revolving-door conflicts, for one year after leaving a member cannot, without Government approval, take a job with a Fiduciary they had proceeded against.",
    keyPoints: [
      "Members resign by written notice; effective on permission or after three months.",
      "Vacancies from resignation, removal or death are filled by fresh appointment.",
      "A one-year cooling-off applies before joining a Fiduciary they acted against, without approval.",
    ],
  },
  23: {
    plainEnglish:
      "This lets the Board run its own business - including meeting by digital means - and authenticate its orders and directions in the manner the Rules prescribe. Its acts stay valid despite vacancies or technical defects in how it was constituted, and the senior-most Member covers for the Chairperson when they are unavailable.",
    keyPoints: [
      "The Board sets its own meeting procedure, including digital meetings.",
      "Its acts are not invalid merely because of vacancies or procedural defects.",
      "The senior-most Member acts when the Chairperson is unavailable.",
    ],
  },
  24: {
    plainEnglish:
      "This lets the Board hire the officers and employees it needs to function effectively, with the prior approval of the Central Government and on the terms and conditions prescribed.",
    keyPoints: [
      "The Board may appoint officers and employees with the Government's prior approval.",
      "Appointments are on prescribed terms and conditions.",
      "Staffing is scaled to the efficient discharge of the Board's functions.",
    ],
  },
  25: {
    plainEnglish:
      "When acting under the Act, the Board's Chairperson, Members, officers and employees count as 'public servants' in law. That status carries both the protections and the accountability the law attaches to public servants.",
    keyPoints: [
      "Board members, officers and staff are deemed public servants when acting under the Act.",
      "'Public servant' carries its meaning under the Indian Penal Code.",
      "The status brings both legal protection and accountability.",
    ],
  },
  26: {
    plainEnglish:
      "This gives the Chairperson the levers to run the Board: general superintendence and direction over all administrative matters, authority to have officers scrutinise complaints and correspondence, and the power to allocate the Board's proceedings among individual Members or groups of Members.",
    keyPoints: [
      "General superintendence and direction over the Board's administration.",
      "Can authorise officers to scrutinise complaints and correspondence.",
      "Can allocate proceedings among Members or groups of Members.",
    ],
  },
  27: {
    plainEnglish:
      "This is what the Board actually does. When a breach is reported by a Fiduciary, complained of by a Data Principal, or referred by a government or court, the Board can inquire into it, direct urgent remedial or mitigation measures, and impose the penalties the Act provides. It can also issue binding directions after hearing the person concerned, and can vary its own directions on a reasoned request.",
    keyPoints: [
      "Inquires into personal data breaches and breaches of the Act's obligations.",
      "Can direct urgent remedial or mitigation measures after a breach.",
      "Can impose the penalties provided in the Act.",
      "Can issue binding directions after hearing the person concerned.",
    ],
  },
  28: {
    plainEnglish:
      "This tells the Board how to work: as an independent body, digital by design, that receives complaints and hears and decides them online. It first checks whether there are sufficient grounds to inquire, follows the principles of natural justice, and records its reasons. For an inquiry it has the powers of a civil court - summoning people, taking evidence and inspecting documents - but it cannot casually seize equipment or block access to premises.",
    keyPoints: [
      "Functions as an independent, digital-by-design office.",
      "Screens whether there are sufficient grounds before inquiring.",
      "Follows natural justice and records reasons for its actions.",
      "Has civil-court powers of summoning, taking evidence and inspecting documents.",
    ],
  },
  29: {
    plainEnglish:
      "If you are unhappy with a Board order, you can appeal to the Appellate Tribunal - the Telecom Disputes Settlement and Appellate Tribunal (TDSAT). You have sixty days to file, extendable for good reason. The Tribunal hears both sides and can confirm, modify or set aside the order, and aims to decide within six months. Its proceedings are meant to be digital.",
    keyPoints: [
      "Appeals against Board orders go to the Appellate Tribunal (TDSAT).",
      "File within sixty days, extendable for sufficient cause.",
      "The Tribunal can confirm, modify or set aside the order.",
      "It endeavours to dispose of appeals within six months; proceedings are digital.",
    ],
  },
  30: {
    plainEnglish:
      "This gives the Tribunal's orders real teeth. An order it passes is enforceable as if it were a decree of a civil court. The Tribunal can execute the order itself using a civil court's powers, or send it to a local civil court to enforce.",
    keyPoints: [
      "Tribunal orders are executable as a decree of a civil court.",
      "The Tribunal has all the powers of a civil court to execute them.",
      "It can also transmit an order to a local civil court for execution.",
    ],
  },
  31: {
    plainEnglish:
      "The Board does not have to litigate everything. If it thinks a complaint could be resolved by mediation, it can direct the parties to attempt settlement through a mediator they mutually agree on, or as provided under any other law in force - a faster, less adversarial route than a full inquiry.",
    keyPoints: [
      "The Board can refer suitable complaints to mediation.",
      "Parties choose a mutually agreed mediator, or one provided by law.",
      "Offers a quicker, less adversarial alternative to an inquiry.",
    ],
  },
  32: {
    plainEnglish:
      "A person facing a proceeding can offer the Board a voluntary undertaking - a promise to take, or refrain from, specified action within a set time. If the Board accepts it, that generally bars further proceedings on the same matter. But breaking the undertaking is treated as a breach of the Act, and the Board can then move to impose penalties.",
    keyPoints: [
      "A person may offer, and the Board may accept, a voluntary undertaking to resolve a matter.",
      "Acceptance generally bars further proceedings on that matter.",
      "Its terms can be varied with the person's consent.",
      "Breaking the undertaking is a breach of the Act and can trigger penalties.",
    ],
  },
  33: {
    plainEnglish:
      "This is the enforcement backbone of the Act. If the Board concludes after an inquiry that a person's breach is significant, it can - after giving them a hearing - impose the monetary penalties set out in the Schedule, which run up to ₹250 crore for failing to keep data secure. In fixing the amount, the Board weighs the nature, gravity and duration of the breach, whether it was repeated, any gain made or loss avoided, and what steps the person took to mitigate it.",
    keyPoints: [
      "The Board imposes the monetary penalties listed in the Schedule for significant breaches.",
      "The top penalty is up to ₹250 crore, for failure of reasonable security safeguards.",
      "A penalty follows only after an inquiry and an opportunity to be heard.",
      "The amount reflects gravity, duration, repetition, gain or loss, and mitigation.",
    ],
    example:
      "A company that suffers a breach because it skipped basic security safeguards can face a penalty of up to ₹250 crore.",
  },
  34: {
    plainEnglish:
      "This simply says where the money goes. Every penalty the Board collects is paid into the Consolidated Fund of India - the Government's principal account. Penalties are a deterrent paid to the State, not compensation to affected individuals.",
    keyPoints: [
      "All penalties collected by the Board go to the Consolidated Fund of India.",
      "Penalties are paid to the State, not as compensation to individuals.",
    ],
  },
  35: {
    plainEnglish:
      "This shields the Government, the Board and its people from lawsuits for anything done, or intended to be done, in good faith under the Act. It protects honest official action taken in the course of enforcing the law - not conduct in bad faith.",
    keyPoints: [
      "No suit, prosecution or legal proceeding for acts done in good faith under the Act.",
      "Protects the Government, the Board and its members, officers and employees.",
      "Covers honest official action, not bad-faith conduct.",
    ],
  },
  36: {
    plainEnglish:
      "This lets the Central Government require the Board, or any Data Fiduciary or intermediary, to furnish information it needs for the purposes of the Act.",
    keyPoints: [
      "The Central Government can call for information from the Board, Fiduciaries or intermediaries.",
      "The information must be for the purposes of the Act.",
    ],
  },
  37: {
    plainEnglish:
      "This is the 'blocking' power, and it is a measure of last resort. If the Board has penalised a Fiduciary in two or more instances and advises, in the interests of the general public, that public access to its service should be blocked, the Central Government - after giving the Fiduciary a hearing - can direct its agencies or any intermediary to block that content or service. Every intermediary that receives such a direction must comply.",
    keyPoints: [
      "Triggered only after a Fiduciary is penalised in two or more instances.",
      "The Board advises blocking in the interests of the general public.",
      "The Government can, after a hearing, direct that the service or content be blocked.",
      "Intermediaries receiving the direction are bound to comply.",
    ],
  },
  38: {
    plainEnglish:
      "This positions the Act among India's other laws. It is in addition to, and does not override, existing laws - so other protections keep working. But where a provision of another law directly conflicts with this Act, the DPDP Act prevails to the extent of that conflict.",
    keyPoints: [
      "The Act is in addition to, not in derogation of, other laws.",
      "On a direct conflict, the DPDP Act prevails to the extent of the conflict.",
    ],
  },
  39: {
    plainEnglish:
      "This keeps data-protection disputes with the Board rather than the ordinary courts. Civil courts cannot entertain suits on matters the Board is empowered to decide, and no court may grant an injunction against action taken under the Act. Disputes are instead channelled to the Board and, on appeal, the Appellate Tribunal.",
    keyPoints: [
      "Civil courts cannot entertain matters the Board is empowered to decide.",
      "No court injunctions against action taken under the Act.",
      "Disputes are channelled to the Board and the Appellate Tribunal.",
    ],
  },
  40: {
    plainEnglish:
      "The Act sets the framework and deliberately leaves the operational detail to delegated rules. This section empowers the Central Government to make those rules - the DPDP Rules - on the many matters the Act flags as 'prescribed', from the content of notices and the format for breach reporting to Consent Manager registration and the detail of Data Protection Impact Assessments.",
    keyPoints: [
      "Empowers the Central Government to make rules to carry out the Act.",
      "Covers every matter the Act leaves 'as may be prescribed'.",
      "It is the legal basis for the DPDP Rules (notice, breach, consent managers, DPIAs and more).",
    ],
  },
  41: {
    plainEnglish:
      "This is a parliamentary check on delegated law. Every rule made, and certain notifications issued, must be laid before both Houses of Parliament for a total of thirty days. Parliament can modify or annul them within that window - but any change does not unsettle action already validly taken under the rule or notification.",
    keyPoints: [
      "Rules and specified notifications must be laid before both Houses of Parliament.",
      "Parliament may modify or annul them within the thirty-day window.",
      "Changes do not invalidate action already taken under the rule or notification.",
    ],
  },
  42: {
    plainEnglish:
      "This lets the Central Government update the penalty Schedule by notification - but with a guardrail: it cannot raise any penalty to more than twice the amount originally enacted. An amendment takes effect as if it had been written into the Act, from the date of notification.",
    keyPoints: [
      "The Government can amend the penalty Schedule by notification.",
      "It cannot raise any penalty beyond twice the originally enacted amount.",
      "An amendment takes effect as if enacted in the Act.",
    ],
  },
  43: {
    plainEnglish:
      "This is a transitional safety valve. If a genuine difficulty arises in giving effect to the Act, the Central Government can issue orders to smooth it over - but only for the first three years after commencement, and only in ways consistent with the Act. Any such order is laid before Parliament.",
    keyPoints: [
      "Lets the Government issue orders to resolve difficulties in implementing the Act.",
      "Available only for three years from commencement.",
      "Orders must be consistent with the Act and are laid before Parliament.",
    ],
  },
  44: {
    plainEnglish:
      "This final section tidies up the wider statute book to fit the new law. It amends the TRAI Act so the Appellate Tribunal recognises appeals under this Act, repeals the old Section 43A of the Information Technology Act, 2000 (which the DPDP Act now replaces), and narrows the Right to Information Act's exemption for personal information. The Act's Schedule of penalties is appended here.",
    keyPoints: [
      "Amends the TRAI Act, 1997 to recognise the DPDP Appellate Tribunal.",
      "Repeals Section 43A of the IT Act, 2000, now superseded by this Act.",
      "Amends the Right to Information Act's exemption for personal information.",
      "The Schedule of penalties (up to ₹250 crore) is appended to the Act.",
    ],
  },
};
