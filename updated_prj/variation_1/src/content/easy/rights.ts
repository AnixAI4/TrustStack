/**
 * Easy read pairs for /rights (citizen "Know Your Rights" track):
 * the six rights, request-letter generator UI, grievance ladder, children's
 * protections, duties and FAQ (content/rights.ts).
 *
 * PageHero + EasyIntro + several SectionHeaders already swap via data-rm props.
 * The generated letter bodies are dynamic legal text (interpolated) and are not
 * mapped. Statute refs (Section 11-14, ₹250 crore, Rule 4) are kept exact.
 */
export const PAIRS: [string, string][] = [
  // ---- section headers without easy props ----
  ["The six rights", "Your six rights"],
  ["If you're not heard", "If no one listens"],
  ["Citizen FAQ", "Common questions"],

  // ---- the six rights: titles ----
  ["Correct & complete", "Correct and complete"],
  ["Erase your data", "Delete your data"],
  ["Grievance redressal", "Complaint handling"],
  ["Withdraw consent", "Withdraw permission"],

  // ---- the six rights: plain descriptions ----
  [
    "Ask any company what personal data of yours it is processing, what it does with that data, and the names of everyone else it has shared your data with.",
    "Ask any company what personal data of yours it is using, what it does with it, and the names of everyone else it has shared your data with.",
  ],
  [
    "Have inaccurate or misleading data corrected, incomplete data filled in, and out-of-date details updated - so decisions about you are made on the right facts.",
    "Have wrong or misleading data corrected, missing data filled in, and old details updated - so decisions about you use the right facts.",
  ],
  [
    "Ask for your personal data to be erased once the purpose it was collected for is over - unless a law specifically requires the company to keep it.",
    "Ask for your personal data to be deleted once the reason it was collected for is over - unless a law requires the company to keep it.",
  ],
  [
    "Every company must give you an easy way to complain and respond within a set time. You use this before escalating to the Data Protection Board.",
    "Every company must give you an easy way to complain and must reply within a set time. Use this before going to the Data Protection Board.",
  ],
  [
    "Name another individual to exercise your rights on your behalf if you die or are no longer able to act for yourself.",
    "Name another person to use your rights for you if you die or can no longer act for yourself.",
  ],
  [
    "Take back consent as easily as you gave it. Once you withdraw it, the company must stop processing your data for that purpose.",
    "Take back permission as easily as you gave it. Once you do, the company must stop using your data for that reason.",
  ],

  // ---- request-letter generator: header + labels ----
  ["Request studio · ready-to-send letters", "Letter maker · ready-to-send letters"],
  [
    "Pick what you want to ask for, fill in a few details, and a formal letter that cites the right section of the Act assembles live on screen. Preview only - download, print and copy are disabled. Everything is built on your device, nothing is uploaded.",
    "Pick what you want to ask for, fill in a few details, and a formal letter that quotes the right section of the Act builds live on screen. Preview only - you cannot download, print or copy. All made on your device, nothing uploaded.",
  ],
  ["Raise a grievance", "Raise a complaint"],
  ["Get inaccurate, incomplete or out-of-date data put right.", "Get wrong, incomplete or old data put right."],
  ["Ask for your data to be deleted once its purpose is over.", "Ask for your data to be deleted once its reason is over."],
  [
    "Take back consent you gave earlier - it should be as easy as giving it.",
    "Take back permission you gave earlier - it should be as easy as giving it.",
  ],
  ["Appoint someone to exercise your rights if you can't.", "Appoint someone to use your rights if you can't."],
  ["What you are withdrawing consent for", "What you are withdrawing permission for"],
  ["Describe your grievance", "Describe your complaint"],

  // ---- grievance ladder ----
  [
    "Every Data Fiduciary must give you a readily available way to complain - usually a Data Protection Officer or a Responsible Person. Start here and keep a written record.",
    "Every organisation responsible for your data must give you an easy way to complain - usually a Data Protection Officer or a Responsible Person. Start here and keep a written record.",
  ],
  [
    "If you gave consent through a Consent Manager - a Board-registered platform - you can review, manage and withdraw consent and raise concerns through it.",
    "If you gave permission through a Consent Manager - a service, registered with the Board, that manages your permissions - you can review, manage and withdraw permission and raise concerns through it.",
  ],
  [
    "If the company doesn't resolve your grievance in the prescribed time, file a complaint with the Data Protection Board of India. It can inquire and impose penalties of up to ₹250 crore.",
    "If the company doesn't fix your complaint in the set time, file a complaint with the Data Protection Board of India. It can investigate and impose fines of up to ₹250 crore.",
  ],
  [
    "A Board order can be appealed to the Telecom Disputes Settlement and Appellate Tribunal (TDSAT) within the prescribed period.",
    "You can appeal a Board order to the Telecom Disputes Settlement and Appellate Tribunal (TDSAT) within the set time.",
  ],

  // ---- children & guardians ----
  ["For parents & guardians", "For parents and guardians"],
  [
    "Anyone under 18 is a child under the Act. If a service processes a child's data, stricter rules apply - and a parent or lawful guardian holds the rights.",
    "Anyone under 18 is a child under the Act. If a service uses a child's data, stricter rules apply - and a parent or legal guardian holds the rights.",
  ],
  ["Consent comes first", "Permission comes first"],
  [
    "A company must get the verifiable consent of a parent or lawful guardian before processing a child's personal data.",
    "A company must get the confirmed permission of a parent or legal guardian before using a child's personal data.",
  ],
  [
    "No processing that is likely to have a detrimental effect on the well-being of a child is allowed.",
    "No use of data that is likely to harm a child's well-being is allowed.",
  ],
  [
    "Behavioural tracking, monitoring and targeted advertising directed at children are prohibited.",
    "Tracking, monitoring and targeted ads aimed at children are not allowed.",
  ],
  [
    "The same protection applies to a person with a disability who has a lawful guardian.",
    "The same protection applies to a person with a disability who has a legal guardian.",
  ],

  // ---- duties ----
  ["Don't impersonate anyone else when exercising a right.", "Don't pretend to be someone else when using a right."],
  ["Don't suppress material information or give false particulars.", "Don't hide important facts or give false details."],
  ["Don't file a false or frivolous grievance or complaint.", "Don't file a false or time-wasting complaint."],
  ["Share only information that is verifiably authentic.", "Share only information that is genuine and can be checked."],

  // ---- FAQ ----
  [
    "It's you - the individual the personal data is about. For a child, the parent or lawful guardian is the Data Principal; for a person with a disability, it's their lawful guardian.",
    "It's you - the person the data is about. For a child, the parent or legal guardian is the Data Principal; for a person with a disability, it's their legal guardian.",
  ],
  [
    "No. Exercising your rights under the DPDP Act is free. A company cannot charge you for accessing, correcting or erasing your own data.",
    "No. Using your rights under the DPDP Act is free. A company cannot charge you to see, fix or delete your own data.",
  ],
  [
    "Within the time period prescribed by the DPDP Rules, 2025. Each company must publish its grievance timeline, and you can escalate to the Data Protection Board if it lapses.",
    "Within the time set by the DPDP Rules, 2025. Each company must publish its complaint timeline, and you can go to the Data Protection Board if it misses it.",
  ],
  [
    "Follow the grievance ladder: raise it with the company, then complain to the Data Protection Board of India, which can investigate and impose penalties.",
    "Follow the complaint steps: raise it with the company, then complain to the Data Protection Board of India, which can investigate and impose fines.",
  ],
  [
    "Yes. Every letter is assembled entirely in your browser. Nothing you type is uploaded, stored or sent anywhere by this site.",
    "Yes. Every letter is made entirely in your browser. Nothing you type is uploaded, stored or sent anywhere by this site.",
  ],
];
