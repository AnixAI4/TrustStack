import type { ArticleBlock } from "./blog";

/** Full article bodies keyed by slug. */
export const ARTICLE_BODIES: Record<string, ArticleBlock[]> = {
  "dpdp-rules-2025-industry-implications": [
    { type: "p", text: "For two years, the Digital Personal Data Protection Act, 2023 sat on the books as a framework without an engine. Founders, DPOs and engineering leads had principles to work from but no operating detail: how a breach notice should actually read, what a Consent Manager has to look like, how long a log has to live on a server. That changed when the Ministry of Electronics and Information Technology notified the Digital Personal Data Protection Rules, 2025, turning the Act from a statement of intent into an enforceable compliance regime. Here is what actually changed for organisations operating in India, without the hype." },
    { type: "h2", text: "The staggered compliance clock" },
    { type: "p", text: "The Rules do not switch on all at once. They are staggered, and which speed applies to you depends on which part of the framework you are looking at." },
    { type: "ul", items: [
      "Immediate: the rules establishing and operationalising the Data Protection Board take effect, so the regulator now formally exists and can begin acting.",
      "12 months out: Rule 4 and the First Schedule switch on, opening formal registration for Consent Managers.",
      "18 months out: the remaining operational rules covering notice, consent, security safeguards, breach reporting, retention and Data Principal rights become fully effective."
    ] },
    { type: "p", text: "It is tempting to read that timeline as a grace period to do nothing for a year and a half. It is not. Building consent flows, retention schedules and breach playbooks takes longer than most organisations expect, and the 18-month window is best treated as a build deadline, not a buffer." },
    { type: "h2", text: "Notice and consent in the real world" },
    { type: "p", text: "Rule 3 requires a standalone notice: an itemised list of the personal data being collected, the specified purpose described in terms a Data Principal can actually understand, and a direct link for both withdrawing consent and complaining to the Board. Imagine an e-commerce checkout. Consent buried inside a forty-clause terms-of-service page no longer satisfies the notice requirement; it has to stand on its own, in plain language, right at the point of collection. If a user cannot easily find how to withdraw that consent later, your notice fails the test." },
    { type: "h2", text: "Breach reporting: The 72-hour reality" },
    { type: "p", text: "Rule 7 layers a strict breach response on top of your security safeguards: notify the Board within 72 hours, and notify affected Data Principals without unreasonable delay, in plain language. There is no materiality threshold to hide behind. Picture a misconfigured cloud storage bucket that exposes a few hundred customer email addresses for an hour. Under other global regimes, you might log it and move on. Under DPDP, every personal data breach has to be reported. You need a named individual who can authorise a breach notification without waiting for a committee, a pre-drafted template, and log retention configured for at least twelve months." },
    { type: "h2", text: "Retention defaults and the Significant Data Fiduciary tier" },
    { type: "p", text: "Rule 8 sets default retention windows for high-volume intermediaries, while Rule 8(3) sets a baseline requiring every Data Fiduciary to retain personal data and associated logs for at least one year before erasure. Above all of this sits the Significant Data Fiduciary tier under Section 10. Organisations notified by the government face an annual Data Protection Impact Assessment and a due-diligence obligation under Rule 13 to confirm that the algorithmic software they use does not pose a risk to Data Principal rights. The headline penalties are real, but the true shift is that India's regime has moved from principle to procedure. The months ahead are the time to build the procedure." }
  ],
  "cybersecurity-role-dpdp-act": [
    { type: "p", text: "Cybersecurity plays a central but carefully defined role in India's DPDP framework. The Act is not a cybersecurity law in the narrow sense; it is a personal-data protection law. But its core outcomes - lawful processing, purpose limitation, data minimisation, rights fulfilment, breach notification and accountability - only become real when security and data-governance controls are embedded into daily operations." },
    { type: "p", text: "For Boards and CXOs, the message is direct: DPDP is not just a legal compliance project. It is an operating model for digital trust. For practitioners, that means mapping personal data, controlling access, securing processors, logging activity, detecting misuse, responding to incidents and retaining enough evidence to prove what happened." },
    { type: "h2", text: "The core thesis" },
    { type: "p", text: "Under DPDP, cybersecurity is the control layer that allows a Data Fiduciary to protect personal data in its possession or control, including processing performed through Data Processors. Reasonable security safeguards are not an isolated checkbox. They support consent, purpose limitation, data minimisation, retention, grievance handling and breach response." },
    { type: "p", text: "A weak security programme turns privacy into a promise nobody can verify. If an organisation cannot identify where personal data sits, who touched it, why it moved, whether it was exposed and how it can be corrected or erased, then its DPDP readiness is mostly paper." },
    { type: "h2", text: "Lifecycle control map" },
    { type: "table", headers: ["DPDP objective", "Practical cybersecurity controls", "Why it matters"], rows: [
      ["Discover and classify personal data", "Data inventories, data-flow maps, automated classification, KYC/document tagging, processor and sub-processor inventories.", "The Act regulates processing across the full lifecycle, from collection and storage to sharing, erasure and destruction. You cannot protect or delete what you cannot locate."],
      ["Collect only what is needed", "Privacy-by-design intake forms, field minimisation, purpose-bound consent, consent logs, just-in-time notices and permission controls.", "Consent and notice are tied to specified purposes. Cybersecurity and product design must prevent quiet over-collection."],
      ["Control access and prevent misuse", "IAM, MFA, RBAC or ABAC, privileged access management, conditional access, just-in-time admin, segregation of duties and periodic access reviews.", "Most privacy failures begin as excessive access, stale privileges or compromised credentials."],
      ["Secure storage, processing and transfer", "Encryption at rest and in transit, tokenisation, masking, key management, secure APIs, secrets vaulting, secure deletion and processor controls.", "Technical controls preserve confidentiality and reduce blast radius when systems fail."],
      ["Monitor access and detect misuse", "Central logging, SIEM, DLP, anomaly detection, API monitoring, database activity monitoring and exfiltration alerts.", "Breach duties only work if the organisation can detect unauthorised access or disclosure in time."],
      ["Maintain audit trails and evidence", "Tamper-resistant logs, time synchronisation, retention, incident records, consent audit trails and chain-of-custody discipline.", "DPDP accountability depends on being able to reconstruct decisions, access and remediation after the fact."],
      ["Enable Data Principal rights", "Rights portals, identity verification, consent-withdrawal workflows, correction and erasure workflows, processor propagation and grievance tracking.", "Rights under the Act need backend systems that can find, verify, update, restrict or erase data reliably."]
    ] },
    { type: "h2", text: "Breach management under DPDP" },
    { type: "p", text: "A personal-data breach is not only a security incident. It is a governance event. DPDP requires the Data Fiduciary to intimate the Data Protection Board and affected Data Principals in the prescribed form and manner when a personal-data breach occurs. The Rules add operational detail around clear communication, likely consequences, mitigation steps, contact information and follow-up information to the Board." },
    { type: "ul", items: [
      "Prevent: classify personal data, encrypt or tokenise sensitive fields, enforce least privilege and MFA, secure APIs, test backups and bind processors through strong contractual obligations.",
      "Detect: run SIEM, DLP, API monitoring and anomaly detection; preserve relevant logs; investigate unusual access, bulk exports and exfiltration signals.",
      "Contain: disable compromised accounts or API keys, isolate workloads, block exfiltration paths, rotate secrets and preserve evidence before systems are overwritten.",
      "Notify: assess whether the DPDP personal-data breach threshold is met, notify affected Data Principals and the Board as required, and separately assess whether CERT-In reporting is triggered for the same cyber incident.",
      "Remediate: complete root-cause analysis, patch the defect, review access, revisit processor controls, retest safeguards and record lessons learned for the Board, CISO and DPO."
    ] },
    { type: "h2", text: "Strategic value beyond compliance" },
    { type: "p", text: "For Boards, DPDP turns cybersecurity into trust, resilience and accountability governance. The penalty schedule makes failures in safeguards and breach notification financially material, but the reputational issue is often larger: customers, partners and regulators want proof that personal data is handled with discipline." },
    { type: "p", text: "For CISOs and DPOs, the value is operational. A serious DPDP programme improves data inventories, identity governance, vendor contracts, breach response, audit trails and customer commitments. It also aligns security with privacy outcomes instead of leaving privacy trapped in policy documents." },
    { type: "h2", text: "Beyond firewalls and antivirus" },
    { type: "p", text: "A mature DPDP cybersecurity scope should include privacy engineering for purpose limitation and minimisation; zero-trust access for identity, device posture and per-session authorisation; encryption, masking and tokenisation for confidentiality; logging and monitoring for misuse detection; incident simulations for breach readiness; secure consent systems for proof and withdrawal; AI and data governance for algorithmic processing risks; and human process discipline through SOPs, training and vendor governance." },
    { type: "p", text: "The regulated object is not the network. It is personal data and the rights attached to it. That is why DPDP security has to follow the data across applications, cloud services, vendors, employees, APIs, archives and incident workflows." },
    { type: "h2", text: "India-specific example: fintech and KYC data" },
    { type: "p", text: "Consider an Indian fintech or SaaS platform that supports digital onboarding, KYC, underwriting and loan servicing for a regulated lender. It may handle identity documents, bank details, contact data, income or occupation data, device/session data and repayment records." },
    { type: "ul", items: [
      "Onboarding should use a clear DPDP notice, collect only data needed for the stated purpose, log consent and avoid unnecessary device permissions.",
      "KYC documents and recordings should be encrypted, tokenised where possible, restricted to authorised teams and monitored through access logs.",
      "Cloud providers, lending-service providers, analytics tools and other processors should be contractually bound to security, breach-cooperation, deletion and audit obligations.",
      "Rights workflows should support access, correction, updating, erasure, withdrawal and grievance handling, while routing erasure through legal-retention checks where another law requires preservation.",
      "If an API misconfiguration exposes KYC records, the team should revoke keys, disable the endpoint, preserve logs, identify affected Data Principals, notify under DPDP as required and assess parallel CERT-In reporting."
    ] },
    { type: "h2", text: "Implementation guardrails" },
    { type: "ul", items: [
      "Do not describe DPDP as only a cybersecurity law. It is a privacy law whose obligations depend heavily on cybersecurity controls.",
      "Keep DPDP, DPDP Rules, CERT-In and sectoral obligations separate in internal playbooks. One incident may trigger more than one reporting route.",
      "Do not publish internal links, private customer material or vendor-confidential implementation notes on public pages.",
      "Avoid fear-based claims. Explain the control, the evidence it creates and the risk it reduces.",
      "Make legal review part of the final publication workflow where statutory duties, penalties or timelines are discussed."
    ] },
    { type: "h2", text: "Board-ready takeaway" },
    { type: "p", text: "Cybersecurity is the DPDP control plane. The Act creates the privacy obligations; the Rules define many operational expectations; and Indian cyber and sectoral regimes can add parallel duties. For Boards, the ask is oversight of risk, accountability, vendors, resilience and customer trust. For CISOs and DPOs, the ask is an integrated privacy-security operating model: know the data, minimise collection, control access, encrypt or tokenise, monitor misuse, retain evidence, respond fast, notify correctly and continuously improve." },
    { type: "p", text: "Under DPDP, cybersecurity is not merely a technical control. It is the operating system of digital trust." }
  ],
  "consent-manager-role": [
    { type: "p", text: "If you are deciding whether your product needs to build consent infrastructure from scratch or hand the job to a regulated intermediary, the Consent Manager is the piece of the DPDP framework built specifically for that question. The Act defines it as a registered entity that acts as a single point of contact, enabling a Data Principal to give, manage, review and withdraw consent through an accessible, transparent and interoperable platform." },
    { type: "h2", text: "The Account Aggregator blueprint" },
    { type: "p", text: "A Consent Manager relays consent requests from a Data Fiduciary to a Data Principal, records both the consent given and the notice that preceded it, and routes that consent to the right fiduciary without being able to read the contents passing through it. The architecture borrows directly from India's Account Aggregator system in financial services, relying on data-blind routing. The Data Principal gets one dashboard to review and withdraw consent across every connected app, rather than chasing settings pages across a dozen different platforms." },
    { type: "h2", text: "The high bar for registration" },
    { type: "p", text: "Rule 4 and the First Schedule of the DPDP Rules, 2025 set a deliberately high registration bar, since Consent Managers will be trusted with consent records across an entire ecosystem." },
    { type: "ul", items: [
      "Incorporation as a company in India only; no foreign entities or unincorporated platforms.",
      "A minimum net worth of two crore rupees, with capital structure commensurate with the role.",
      "Demonstrated technical, operational and financial capacity to run the platform reliably.",
      "Leadership with a reputation for fairness, and governing documents that hard-wire fiduciary duties.",
      "An independent certification confirming the platform meets the data-protection standards the Board publishes."
    ] },
    { type: "h2", text: "Do you actually need one?" },
    { type: "p", text: "No. The Rules do not compel a Data Fiduciary to route consent through a Consent Manager. Collecting consent directly is entirely fine if you can independently meet the same notice, withdrawal and record-keeping bar. Where a Consent Manager earns its place is in ecosystems with frequent cross-entity sharing, like healthcare networks or public benefit schemes, where a common, auditable consent layer beats every fiduciary quietly building its own version of the same thing. For most product teams, the near-term task is simply making sure your own direct consent flow already meets the standard." }
  ],
  "data-localization-transfers": [
    { type: "p", text: "If you are choosing between a Mumbai data centre and a Singapore one, the DPDP framework probably matters less to that decision than you would expect, but not zero. Here is what the Act and Rules actually require when personal data crosses a border, and what they deliberately leave open for businesses operating across jurisdictions." },
    { type: "h2", text: "The negative list approach" },
    { type: "p", text: "Section 16 of the Act gives the Central Government the power to restrict transfer of personal data to specific countries by notification. Everywhere else, transfer is permitted by default. This is the inverse of the EU's adequacy-list model, which prohibits transfer unless a destination is pre-approved. That mandatory localisation requirement proposed in earlier draft bills was dropped before the final Act, in favour of this much more liberal negative-list approach." },
    { type: "h2", text: "Sectoral overrides still apply" },
    { type: "p", text: "Open by default under DPDP does not mean unregulated. Sectoral localisation rules sit on top of DPDP and are explicitly preserved by Section 16(2)." },
    { type: "ul", items: [
      "The RBI's payment-data localisation requirement continues to apply at full strength.",
      "SEBI's data-residency rules for regulated entities remain entirely unaffected.",
      "No restricted-country list has been notified under Section 16 as of writing, so transfer is open to every destination by default for now."
    ] },
    { type: "h2", text: "Contractual safeguards and liability" },
    { type: "p", text: "Rule 15 operationalises Section 16, but it does not introduce Standard Contractual Clauses the way GDPR does. However, Section 8 keeps a Data Fiduciary responsible for what its Data Processor does with personal data, including a processor sitting overseas. Many organisations are layering contractual safeguards in anyway for vendor accountability. You must map where personal data physically sits, get data-processing terms with every overseas vendor that name the DPDP Act, and watch for Section 16 restricted-country notifications that could take effect on the date of publication with little lead time." }
  ],
  "detecting-unauthorised-use": [
    { type: "p", text: "You can write the cleanest consent notice in India, but if you cannot tell when someone inside or outside the organisation has touched personal data they should not have, none of that notice actually protects anyone. This is a practical playbook for building that detection capability, aimed at the people who have to make it work: security engineers, DPOs and whoever owns the breach-response decision." },
    { type: "h2", text: "Logging as a legal requirement" },
    { type: "p", text: "Rule 6 sets a floor for security safeguards: encryption, access control, masking or tokenisation, and a minimum retention period for logs. Rule 8(3) extends that retention requirement to at least one year for all processing, not only for incidents already flagged as breaches. If you do not have access logs reaching back twelve months, you cannot reconstruct unauthorised use even after someone raises a concern about it." },
    { type: "h2", text: "Signals of unauthorised use" },
    { type: "p", text: "Detection is not just about external hacks. Most unauthorised use is an internal permissions issue or a compromised credential. You need to monitor the right signals." },
    { type: "ul", items: [
      "Bulk exports of customer databases or financial records to external drives or personal emails.",
      "Off-hours access to sensitive HR or payroll systems that fall outside a role's normal scope.",
      "API keys or service accounts querying personal data at volumes that exceed normal application behaviour.",
      "A sudden spike in Data Principal grievances under Section 13 regarding data they never shared with you."
    ] },
    { type: "h2", text: "Building the 72-hour workflow" },
    { type: "p", text: "Rule 7 does not allow a risk-based threshold before notification kicks in. Every personal data breach has to be reported to the Board within 72 hours. Ambiguity about who decides is the single most common reason organisations miss that deadline." },
    { type: "ul", items: [
      "Name one specific individual who can authorise a Board notification without waiting for a committee to convene.",
      "Treat every Data Processor contract as a real control point, ensuring audit rights and breach-notification clauses have teeth.",
      "Run periodic access reviews against least privilege to revoke permissions nobody remembered to remove.",
      "Document every investigation, even the false alarms, as a documented conclusion of no breach is a far stronger position than no investigation at all."
    ] },
    { type: "p", text: "Detection is the underlying muscle that makes every other DPDP obligation, from the 72-hour breach clock to grievance redressal, actually achievable on time." }
  ],
  "dpdpa-ai-systems": [
    { type: "p", text: "The DPDP Act does not use the words artificial intelligence anywhere in its text. That does not mean it is silent on what your model can do with personal data. For AI and product teams, the relevant obligations were already there; they just were not written with a neural network in mind." },
    { type: "h2", text: "The training data dilemma" },
    { type: "p", text: "Every input that contains personal data needs a basis under Section 4: consent under Section 6, or one of the legitimate uses under Section 7. The often-assumed shortcut, that scraped public web data is automatically free to use, is narrower than it looks. Section 3(c)(ii) excludes from the Act personal data that the individual has voluntarily made public, not personal data that is simply discoverable online. Where voluntarily public ends and merely accessible begins is one of the most actively contested points in current practice, and industry bodies are still seeking clearer carve-outs for AI training." },
    { type: "h2", text: "Purpose limitation and model drift" },
    { type: "p", text: "Consent under Section 6 is tied to a specified purpose. Data collected for customer support, account creation or transaction processing does not automatically carry a licence to fine-tune a model later. That is a new purpose, and a new purpose usually means fresh notice and consent. This is the provision most likely to catch out product teams who quietly repurpose old datasets for new AI features without checking the original consent boundaries." },
    { type: "h2", text: "Algorithmic due diligence" },
    { type: "p", text: "Rule 13(3) requires Significant Data Fiduciaries to exercise due diligence confirming that algorithmic software used in hosting, displaying, modifying or sharing personal data does not pose a risk to Data Principal rights. It is not a model-auditing regime in the style of the EU's AI-specific rules, but it is the clearest hook anywhere in the framework for scrutinising what an algorithm does with personal data, rather than only whether the data was collected lawfully in the first place. Map your datasets, treat repurposing as a new activity, and build output review for models that could infer personal data." }
  ],
  "chatgpt-generative-ai-risks": [
    { type: "p", text: "Pasting a customer's complaint email into a chatbot to draft a reply feels like a private moment between you and a tool. Under the DPDP Act, it is a disclosure of personal data to a third party, and that carries real consequences for whoever made the call to paste it. Shadow AI is currently the largest blind spot in corporate data protection." },
    { type: "h2", text: "Prompts as personal data disclosures" },
    { type: "p", text: "When a generative AI tool is contracted by your organisation, it is typically acting as a Data Processor on your behalf. Pasting personal data into it for a purpose the original notice and consent under Section 6 never covered raises the same purpose-creep risk as repurposing a dataset for model training. The convenience of a chat window does not exempt it from the basic question of what basis you have to process that data in the first place." },
    { type: "h2", text: "The Data Processor trap" },
    { type: "p", text: "Many consumer-grade generative AI tools retain prompts to improve their own models by default, and a number of them run on infrastructure outside India. Section 8 keeps a Data Fiduciary responsible for its Data Processor's conduct, so an organisation that hands customer data to a tool without checking its retention and training settings carries that risk regardless of where the underlying server sits. Section 16 permits this kind of cross-border flow by default, but the responsibility for the data's security travels with it." },
    { type: "h2", text: "Securing the generative workflow" },
    { type: "p", text: "A workable policy does not have to be a total ban on AI tools, but it requires strict operational guardrails." },
    { type: "ul", items: [
      "Classify what counts as personal data before anyone pastes it into a tool: names, identifiers, health or financial detail.",
      "Default to enterprise tiers that contractually exclude prompts from training data, over free consumer tiers that do not.",
      "Redact or tokenise identifiers where the task genuinely does not need them.",
      "Put generative AI vendors through the same Data Processor due diligence you would apply to any other cloud vendor."
    ] },
    { type: "p", text: "The risk in generative AI tools is rarely the model itself. It is the personal data an employee feeds it without thinking about where that data was supposed to stop." }
  ],
  "dpdpa-small-businesses": [
    { type: "p", text: "There is no small-business carve-out in the Digital Personal Data Protection Act today, and that surprises almost every founder who hears it for the first time. Here is what actually applies if you run a small operation, and where the genuine relief sits amidst the compliance noise." },
    { type: "h2", text: "The startup exemption myth" },
    { type: "p", text: "Section 17(3) lets the Central Government notify certain Data Fiduciaries, including startups, as exempt from specific obligations like the Section 5 notice requirement or parts of Section 8. As things stand, no such notification has been issued, so this relief is not yet operative. Building a compliance plan around a hypothetical future exemption is a gamble rather than a strategy. Every business processing personal data in India today, regardless of size or revenue, has to comply with the Act as it currently stands." },
    { type: "h2", text: "Proportionate safeguards" },
    { type: "p", text: "What that means in practice is proportionate. A five-person shop with a customer spreadsheet does not need an enterprise security operations centre, but it does need basic access control, a backup plan, and a lawful basis for every category of personal data it collects. Most small operations will not be designated a Significant Data Fiduciary under Section 10, meaning you will avoid the heavy Data Protection Impact Assessment and audit obligations reserved for high-volume, high-risk organisations." },
    { type: "h2", text: "The minimal viable compliance stack" },
    { type: "p", text: "You do not need a massive legal department to get the foundations right. Focus on these practical steps." },
    { type: "ul", items: [
      "List every place personal data enters your business: signup forms, payment gateways, support tickets, vendor tools.",
      "Write one standalone notice that actually describes what you collect and why, in language a customer would understand.",
      "Set up one inbox or contact point for grievances and consent withdrawal requests under Section 13.",
      "Check your vendors. Section 8 makes you liable for your Data Processors, so ensure your SaaS tools are DPDP-compliant.",
      "Write down, even briefly, what you would do in the first 72 hours of a suspected breach to meet the Rule 7 clock."
    ] },
    { type: "p", text: "None of this requires a massive budget. It requires deciding, once, what data you actually need and being honest with yourself about where it goes afterwards." }
  ],
  "right-to-be-forgotten": [
    { type: "p", text: "Ask whether India has a right to be forgotten and the honest answer is: not by that name, but something narrower and more specific exists, and it is worth knowing exactly what it covers before you go looking for it." },
    { type: "h2", text: "The mechanics of Section 12" },
    { type: "p", text: "Section 12 gives a Data Principal the right to request correction, completion, updating or erasure of personal data held by a Data Fiduciary. This is a right exercised against a specific organisation holding your data, like your bank or your e-commerce account. It is not a general right to disappear from the internet or compel a search engine to delist a webpage about you, which is closer to what the European right to be forgotten actually does. India's version is deliberately narrower and more transactional." },
    { type: "h2", text: "The retention floor conflict" },
    { type: "p", text: "Erasure under DPDP is not purely something you have to ask for. Section 8(7) places an independent duty on the Data Fiduciary to erase personal data once consent is withdrawn, or once the specified purpose is no longer being served. However, a Data Fiduciary can decline an erasure request where retention is necessary to comply with another law. Rule 8 also sets default retention windows for some sectors, and a separate floor requires every Data Fiduciary to keep personal data and processing logs for at least one year before erasure. Erasure rights sit on top of these retention floors, not in place of them." },
    { type: "h2", text: "Handling the erasure workflow" },
    { type: "p", text: "For DPOs and engineering teams, building the backend to support this right requires clear data mapping." },
    { type: "ul", items: [
      "Identify the specific Data Fiduciary holding the data and use the consent-withdrawal or grievance link its notice is required to provide.",
      "State exactly what you want corrected, completed or erased, rather than a general request to delete everything.",
      "Expect a response within the 90-day window the DPDP Rules set for Data Fiduciaries to resolve this kind of request.",
      "If it goes unresolved, Section 13 gives you a path to raise a formal grievance with the Data Protection Board."
    ] },
    { type: "p", text: "Call it erasure rather than forgetting, and the right makes more sense for what it actually is: a tool for cleaning up your own data trail with specific organisations, not a single switch that wipes your digital footprint everywhere at once." }
  ],
  "privacy-in-india-history": [
    { type: "p", text: "Privacy in India has had an unusually long and uneven path to becoming a right anyone could actually rely on, and the story of how it got there says almost as much about Indian governance as the law itself does." },
    { type: "h2", text: "The Puttaswamy watershed" },
    { type: "p", text: "For decades, Indian courts circled the question of whether privacy was protected by the Constitution at all, without a definitive answer for the country as a whole. Earlier judgments found pieces of a privacy interest tucked inside other rights, but no single ruling settled the matter outright. That uncertainty ended in August 2017, when a nine-judge bench of the Supreme Court in Justice K.S. Puttaswamy versus Union of India unanimously held that privacy is a fundamental right protected under Article 21 of the Constitution. The judgment explicitly noted that a right of this significance needed legislative backing, effectively setting the agenda for the decade that followed." },
    { type: "h2", text: "The false starts" },
    { type: "p", text: "The path from Puttaswamy to an actual statute was not quick. A committee led by Justice B.N. Srikrishna proposed a draft data protection bill in 2018, a revised version was introduced in Parliament in 2019, and it was withdrawn in 2022 after extended committee review and public feedback. The debate over data localisation, state exemptions and corporate compliance costs slowed the process, leaving citizens with a constitutional guarantee but no statutory mechanism to enforce it against private companies." },
    { type: "h2", text: "The 2023 Act and 2025 Rules" },
    { type: "p", text: "A fresh draft followed, and the Digital Personal Data Protection Act, 2023 finally received Parliamentary passage and Presidential assent in August 2023, six years after the Court had said this needed to happen. Even with the Act passed, India's privacy framework remained largely theoretical until the Digital Personal Data Protection Rules, 2025 were notified, establishing the Data Protection Board and setting out the operational details on a phased timeline running into 2027. So was privacy there? In one sense, the Supreme Court said it always had been. Whether it is meaningfully there now depends on how consistently the Board and the businesses they govern actually behave over the years ahead." }
  ],
  "childrens-data-consent": [
    { type: "p", text: "If your product could plausibly have a user under 18, and for most consumer apps it could, the DPDP Act's children's data provisions apply whether or not you built your platform with children in mind. The penalties for getting this wrong are among the steepest in the entire framework." },
    { type: "h2", text: "Verifiable parental consent" },
    { type: "p", text: "Section 9(1) requires a Data Fiduciary to obtain verifiable consent from a parent or lawful guardian before processing a child's personal data. Rule 10 sets out how: the Data Fiduciary must apply due diligence to confirm that whoever is identifying themselves as the parent is genuinely an identifiable adult, checking either reliable identity and age details it already holds, or details the parent voluntarily provides, including through identity mechanisms like a Digital Locker. A simple tick-box confirming the parent is over 18, filled in on the parent's behalf, does not meet this bar." },
    { type: "h2", text: "The absolute ban on tracking" },
    { type: "p", text: "Section 9(3) is unconditional in a way few other parts of the Act are. A Data Fiduciary must not undertake tracking or behavioural monitoring of children, or target advertising at them, regardless of whether a parent has consented to it. Section 9(2) adds a further requirement that processing must not cause any detrimental effect on a child's wellbeing. Consent can authorise the processing a service genuinely needs to function. It cannot authorise building an advertising profile of a minor." },
    { type: "h2", text: "Age-gating in practice" },
    { type: "p", text: "Product teams need to build these constraints directly into the user onboarding flow." },
    { type: "ul", items: [
      "Implement real age-gating at signup, rather than a single self-declared checkbox that anyone can click past.",
      "Build a parental verification flow that checks an identifiable adult, not just a click, before unlocking the account.",
      "Ensure analytics and advertising SDKs are hardcoded to default off for any account flagged as belonging to a minor.",
      "Run periodic audits of third-party SDKs to confirm none of them are quietly profiling or targeting minor accounts behind the scenes."
    ] },
    { type: "p", text: "The bar here is deliberately high. With penalties running up to two hundred crore rupees for violations of these specific obligations, the law's seriousness is calibrated to match the population least able to consent for itself." }
  ]
};
