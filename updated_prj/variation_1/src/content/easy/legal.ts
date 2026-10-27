/**
 * Easy read pairs for /privacy, /terms and /cookies (inline page copy).
 *
 * These are the site's own legal notices. The dense body paragraphs are
 * jargon-heavy and are simplified by fallbackEasyText (consent→permission,
 * Data Fiduciary→…, breach→data leak, processing→using, etc.). Here we map the
 * section headings, hero subheads, snapshot bullets and control chrome so the
 * structure reads plainly too. Statute refs (Section 5, 8(5)) stay exact.
 */
export const PAIRS: [string, string][] = [
  // ================= PRIVACY =================
  [
    "Our own DPDP-aligned privacy notice for TrustStack visitors, learners, customers and scanner users.",
    "Our own DPDP privacy notice for TrustStack visitors, learners, customers and scanner users.",
  ],
  ["Compliance snapshot", "Quick summary"],
  ["Grievance Officer", "Complaint Officer"],
  // snapshot bullets
  ["Itemised notice before or at collection of personal data", "A clear, itemised notice before or when we collect personal data"],
  ["Clear lawful purposes for every category of personal data", "Clear legal reasons for every type of personal data"],
  ["Consent withdrawal as easy as consent collection", "Withdrawing permission is as easy as giving it"],
  ["Rights to access, correction, erasure, grievance and nomination", "Rights to access, correction, deletion, complaints and nomination"],
  ["Retention limited to live purpose, legal need or user request", "We keep data only for the current reason, a legal need or your request"],
  ["Named grievance contact and escalation channel", "A named complaint contact and a way to escalate"],
  // section headings
  ["Personal data we collect", "The personal data we collect"],
  ["Purposes and lawful basis", "Why we use it and our legal reason"],
  ["Consent and withdrawal", "Permission and withdrawal"],
  ["Sharing and processors", "Sharing and data handlers"],
  ["Retention and deletion", "How long we keep data and deletion"],

  // ================= TERMS =================
  [
    "The operating terms for using TrustStack content, templates, learning modules and scanner demonstrations.",
    "The rules for using TrustStack content, templates, learning modules and scanner demos.",
  ],
  ["Educational and operational content", "Learning and service content"],
  ["Using templates and tools", "Using the templates and tools"],
  ["Acceptable use", "Allowed use"],
  ["Liability", "Our responsibility"],

  // ================= COOKIES =================
  [
    "How TrustStack uses cookies, local storage and similar technologies, with optional categories kept under your control.",
    "How TrustStack uses cookies, local storage and similar tools, with optional types kept under your control.",
  ],
  ["Optional consent", "Optional (needs permission)"],
  ["Consent controls", "Permission controls"],
  ["Your choices stay reversible", "You can change your choices anytime"],
  [
    "Non-essential cookies are not required to browse TrustStack. Giving consent is a choice, and withdrawing it is built into the same preference layer.",
    "Optional cookies are not needed to browse TrustStack. Giving permission is a choice, and withdrawing it is built into the same settings.",
  ],
  // control bullets
  ["Reject non-essential cookies from the banner without losing access to the site.", "Turn off optional cookies from the banner without losing access to the site."],
  ["Accept all optional categories only through a clear affirmative action.", "Accept all optional types only through a clear yes."],
  ["Customise functional, analytics and marketing categories separately.", "Set functional, analytics and marketing types separately."],
  [
    "Withdraw consent at any time by reopening cookie preferences from the footer or by clearing browser storage.",
    "Withdraw permission at any time by reopening cookie settings from the footer or by clearing browser storage.",
  ],
  ["Use browser controls to block or delete cookies, noting that essential features may then reset.", "Use browser settings to block or delete cookies, noting that essential features may then reset."],

  // ================= PRIVACY - section bodies =================
  [
    "TrustStack is a DPDP education, template and compliance-tool website operated by Anix for Indian organisations, founders, privacy teams and Data Principals. This Privacy Policy is our Section 5 notice under the Digital Personal Data Protection Act, 2023 and explains what personal data we process, why we process it, how long we keep it and how you can exercise your rights.",
    "TrustStack is a DPDP learning, template and compliance-tool website run by Anix for Indian organisations, founders, privacy teams and the people their data is about. This Privacy Policy is our Section 5 notice under the Digital Personal Data Protection Act, 2023. It explains what personal data we use, why we use it, how long we keep it and how you can use your rights.",
  ],
  [
    "We act as the Data Fiduciary for personal data collected through this website, our learning tools, template downloads, scanner demos, contact forms, newsletter flows and support channels.",
    "We are the organisation responsible for the personal data collected through this website, our learning tools, template downloads, scanner demos, contact forms, newsletters and support channels.",
  ],
  [
    "Account, contact and enquiry data: name, organisation, role, email address, phone number, message content and communication preferences when you contact us, request a demo, subscribe or use support.",
    "Account and contact data: name, organisation, role, email address, phone number, message content and contact choices when you contact us, request a demo, subscribe or use support.",
  ],
  [
    "Learning and certificate data: course progress, quiz answers, generated certificates, completion records and feedback when you use our learning modules.",
    "Learning and certificate data: course progress, quiz answers, certificates, completion records and feedback when you use our learning modules.",
  ],
  [
    "Scanner and template data: website URLs, policy-page URLs, cookie-scan observations, uploaded or generated document metadata and the compliance findings needed to provide the tool output you requested.",
    "Scanner and template data: website links, policy-page links, cookie-scan results, document details and the findings needed to give you the tool result you asked for.",
  ],
  [
    "Device, cookie and usage data: IP address, browser type, approximate location, language preference, theme, accessibility settings, consent preferences, page views and diagnostic logs. Non-essential cookies are controlled through our cookie banner and Cookie Policy.",
    "Device, cookie and usage data: IP address, browser type, rough location, language choice, theme, accessibility settings, permission choices, page views and diagnostic logs. Optional cookies are controlled through our cookie banner and Cookie Policy.",
  ],
  [
    "We process personal data to provide the website, courses, templates, scanner results, certificates, support, security, fraud prevention, preference management and service communications that you request.",
    "We use personal data to provide the website, courses, templates, scanner results, certificates, support, security, fraud prevention, settings and service messages that you ask for.",
  ],
  [
    "Where processing is necessary to deliver a feature you asked for, we rely on the legitimate uses permitted by the DPDP Act. Where we use optional analytics, marketing, newsletters, demos, non-essential cookies or similar tracking, we rely on free, specific, informed, unconditional and unambiguous consent that you may withdraw at any time.",
    "Where we need the data to give you a feature you asked for, we rely on the legitimate uses allowed by the DPDP Act. For optional analytics, marketing, newsletters, demos, optional cookies or similar tracking, we rely on your clear permission, which you can take back at any time.",
  ],
  [
    "We do not process personal data for a new incompatible purpose without fresh notice and, where required, fresh consent.",
    "We do not use personal data for a new, different purpose without telling you first and, where needed, getting fresh permission.",
  ],
  [
    "Consent on TrustStack is purpose-specific. Optional analytics, marketing and preference cookies are off unless you choose to accept them or enable them in the banner.",
    "Permission on TrustStack is for each purpose separately. Optional analytics, marketing and preference cookies are off unless you choose to accept or turn them on in the banner.",
  ],
  [
    "You can withdraw consent as easily as you gave it by reopening cookie preferences from the footer, using unsubscribe links in email, changing your account or course settings where available, or emailing consult@anixai.io. Withdrawal does not affect lawful processing completed before withdrawal or data we must keep under law.",
    "You can take back permission as easily as you gave it: reopen cookie settings from the footer, use unsubscribe links in email, change your account or course settings where available, or email consult@anixai.io. Taking it back does not affect lawful use done before, or data we must keep by law.",
  ],
  [
    "We share personal data only with service providers who help us host the site, deliver email, secure the service, run analytics that you consent to, process support requests, generate certificates or operate scanner and template features.",
    "We share personal data only with service providers who help us host the site, send email, keep the service secure, run analytics you allow, handle support requests, make certificates or run scanner and template features.",
  ],
  [
    "Processors must use personal data only on our instructions, protect it with appropriate security safeguards, keep it confidential, assist with rights requests and delete or return it when the processing purpose ends unless law requires retention.",
    "These data handlers must use personal data only on our instructions, protect it with suitable security, keep it private, help with rights requests, and delete or return it when the purpose ends - unless the law requires it to be kept.",
  ],
  [
    "We use proportionate technical and organisational safeguards including access controls, encryption in transit, least-privilege administration, logging, backup discipline, dependency review and incident-response procedures. If we become aware of a personal data breach, we will assess and contain it promptly, notify affected Data Principals where required, and notify the Data Protection Board of India without delay and within the applicable 72-hour reporting timeline under the DPDP Rules.",
    "We use suitable technical and staff protections including access controls, encryption in transit, least-access admin, logging, careful backups, dependency review and incident-response steps. If we learn of a personal data leak, we will contain it quickly, tell affected people where required, and notify the Data Protection Board of India within the applicable 72-hour timeline.",
  ],
  [
    "We keep personal data only for as long as needed for the purpose stated in this notice, for a legal or security requirement, or to resolve a request or dispute. Contact enquiries are normally reviewed for deletion or anonymisation within 24 months. Cookie consent logs are retained only as long as needed to prove and manage preferences. Scanner input and generated reports are deleted or anonymised when no longer needed to provide the requested result, debug abuse or comply with law.",
    "We keep personal data only as long as needed for the purpose in this notice, for a legal or security need, or to settle a request or dispute. Contact messages are normally reviewed for deletion or made anonymous within 24 months. Cookie permission logs are kept only as long as needed to prove and manage choices. Scanner input and reports are deleted or made anonymous when no longer needed to give the result, stop abuse or follow the law.",
  ],
  [
    "When the purpose ends, we delete, anonymise or archive personal data under restricted access unless another law requires continued retention.",
    "When the purpose ends, we delete, make anonymous or archive personal data under limited access, unless another law requires us to keep it.",
  ],
  [
    "TrustStack is intended for adults and professional users. We do not knowingly offer child-directed services, track children, behaviourally monitor children or target advertising at children. If a child uses a feature that requires personal data, a parent or lawful guardian must provide verifiable consent where required by law.",
    "TrustStack is meant for adults and work users. We do not knowingly offer services aimed at children, track children, monitor children's behaviour or target ads at children. If a child uses a feature that needs personal data, a parent or legal guardian must give confirmed permission where the law requires it.",
  ],
  [
    "We may use service providers located outside India where needed to operate the website and tools. We will not transfer personal data to a country or territory restricted by the Government of India under the DPDP Act, and we require processors to protect transferred data consistently with this policy.",
    "We may use service providers outside India where needed to run the website and tools. We will not send personal data to a country or area blocked by the Government of India under the DPDP Act, and we require data handlers to protect sent data in line with this policy.",
  ],
  [
    "You may request access to your personal data and a summary of processing, correction of inaccurate data, completion of incomplete data, erasure when retention is no longer necessary, grievance redressal, and nomination of another person to exercise your rights in case of death or incapacity. Where processing relies on consent, you may also withdraw that consent at any time.",
    "You can ask to see your personal data, get a summary of how it is used, correct wrong data, complete missing data, delete data no longer needed, have complaints handled, and name another person to use your rights if you die or cannot act. You can also take back permission at any time where we rely on it.",
  ],
  [
    "Send rights and grievance requests to the Anix Privacy Team at consult@anixai.io. Please include enough information for us to verify your identity and understand the request. We will respond within the timelines required by applicable law. If you are not satisfied, you may escalate to the Data Protection Board of India after first using our grievance channel.",
    "Send rights and complaint requests to the Anix Privacy Team at consult@anixai.io. Please include enough information for us to check who you are and understand the request. We will reply within the time limits the law requires. If you are not happy, you can go to the Data Protection Board of India after first using our complaint channel.",
  ],

  // ================= TERMS - section bodies =================
  [
    "TrustStack provides DPDP education, templates, scanner demonstrations, checklists and operational guidance. The site is not a substitute for legal advice from counsel who understands your facts.",
    "TrustStack provides DPDP learning, templates, scanner demos, checklists and practical guidance. The site is not a replacement for legal advice from a lawyer who knows your facts.",
  ],
  [
    "Templates, generated notices, scanner findings and examples must be reviewed and tailored before use. Your organisation remains responsible for its own legal basis, notices, consents, processor contracts, security controls, retention schedule and grievance process.",
    "Templates, generated notices, scanner findings and examples must be checked and adjusted before use. Your organisation stays responsible for its own legal reason, notices, permissions, data-handler contracts, security controls, data-keeping plan and complaint process.",
  ],
  [
    "Do not misuse the scanner, submit unlawful content, attempt to disrupt the service, probe systems without authorisation, upload confidential third-party data without authority, or remove notices and attribution from materials where they are required.",
    "Do not misuse the scanner, submit unlawful content, try to disrupt the service, probe systems without permission, upload private outside data without authority, or remove notices and credits from materials where they are required.",
  ],
  [
    "We work to keep content aligned with the DPDP Act, 2023, DPDP Rules, 2025 and official guidance, but the law and enforcement practice can change. We may update content, features and policies as the regulatory position develops.",
    "We work to keep content in line with the DPDP Act, 2023, DPDP Rules, 2025 and official guidance, but the law and how it is enforced can change. We may update content, features and policies as the rules develop.",
  ],
  [
    "To the fullest extent permitted by law, TrustStack is provided on an as-is and as-available basis. We are not liable for indirect, incidental, special, consequential or punitive loss arising from use of educational content, templates or scanner outputs.",
    "As far as the law allows, TrustStack is provided as-is and as-available. We are not responsible for indirect, incidental, special, knock-on or punishment-based loss from using the learning content, templates or scanner results.",
  ],
  [
    "Personal data and cookie choices are governed by our Privacy Policy and Cookie Policy. Those notices explain purposes, consent withdrawal, retention, rights and grievance channels.",
    "Personal data and cookie choices are covered by our Privacy Policy and Cookie Policy. Those notices explain purposes, taking back permission, how long data is kept, rights and complaint channels.",
  ],

  // ================= COOKIES - category bodies =================
  [
    "Required for core site operation, security, load balancing, language routing, cookie preference storage, accessibility settings and fraud prevention. These are not used for optional advertising or analytics.",
    "Needed for the site to work: core operation, security, load balancing, language routing, saving your cookie choices, accessibility settings and fraud prevention. These are not used for optional ads or analytics.",
  ],
  [
    "Remember preferences such as theme, language, learning state, saved generators and user interface choices so the site works the way you selected.",
    "Remember choices such as theme, language, learning progress, saved generators and screen settings so the site works the way you chose.",
  ],
  [
    "Help us understand aggregate site usage, broken journeys and feature performance. We use analytics only when you opt in, and we configure it to minimise personal data where possible.",
    "Help us understand overall site use, broken journeys and how features perform. We use analytics only when you opt in, and we set it up to use as little personal data as possible.",
  ],
  [
    "May support relevant communications, campaign measurement or demo follow-up. These remain off unless you choose to accept them.",
    "May support relevant messages, campaign measurement or demo follow-up. These stay off unless you choose to accept them.",
  ],
];
