/**
 * Easy read pairs for site-wide chrome that renders on (nearly) every page:
 * Footer, CtaBand, ExploreBand, header/nav bits. These strings come from
 * next-intl messages (messages/en.json); the runtime sees the resolved English,
 * so we map the exact English values here.
 *
 * Brand names, statute identifiers and already-simple labels are left as-is.
 */
export const PAIRS: [string, string][] = [
  // brand / footer intro
  [
    "A clear, modern home for India's Digital Personal Data Protection Act, 2023 and the DPDP Rules 2025. Built for awareness in the public interest.",
    "A clear, modern home for India's data privacy law - the DPDP Act 2023 and the DPDP Rules 2025. Made to help the public understand it.",
  ],

  // footer links
  ["Act ↔ Rules mapping", "How the Act and Rules match up"],
  ["Enforcement timeline", "When the law takes effect"],
  ["The Schedule & penalties", "Fines and penalties"],
  ["Your rights as a citizen", "Your rights as a person"],
  ["Templates & policies", "Ready-made documents"],
  ["Blogs & insights", "Articles and tips"],
  ["Case laws", "Court cases"],
  ["Tools & generators", "Free tools"],
  ["Courses by role", "Courses for your role"],
  ["Verify a certificate", "Check a certificate is real"],
  ["Cookie preferences", "Cookie settings"],

  // final CTA band
  [
    "Turn the DPDP Act into a compliance program you can prove.",
    "Turn the DPDP Act into a plan you can show works.",
  ],
  [
    "From a free DPDP risk check to a board-ready roadmap, Anix TrustStack helps you manage AI and DPDP together - securely and sustainably.",
    "From a free DPDP risk check to a board-ready plan, Anix TrustStack helps you handle AI and DPDP together - safely and for the long run.",
  ],
  ["Explore the service stack", "See our services"],

  // explore band (home)
  ["Everything for DPDP, in focused workspaces", "Everything for DPDP, in simple sections"],
  [
    "We split the platform into focused areas so each one stays fast and easy to use.",
    "We split the site into clear areas so each one is fast and easy to use.",
  ],
  [
    "The complete DPDP service stack, industry playbooks, AI Privacy Shield and how we compare.",
    "Our full DPDP services, industry plans, AI safety help, and how we compare.",
  ],
  [
    "Our end-to-end 7D methodology and a dashboard to track your readiness.",
    "Our step-by-step 7D method and a dashboard to track how ready you are.",
  ],
  [
    "Model penalty, ROI and breach cost, then generate DPDP documents.",
    "Estimate fines, savings and data-leak costs, then make DPDP documents.",
  ],
  [
    "All 44 sections, nine chapters - official text beside plain meaning.",
    "All 44 sections and nine chapters - the official text next to plain meaning.",
  ],
  ["Every rule shown beside the section it gives effect to.", "Each rule shown next to the section it supports."],
  ["Editable, DPDP-aligned policies, agreements and notices.", "Editable DPDP policies, agreements and notices."],
  ["Case Laws", "Court cases"],
  ["Insights", "Articles"],
  [
    "The privacy judgments that shaped the law, distilled.",
    "The key privacy court rulings that shaped the law, made simple.",
  ],
  ["A structured course, an adaptive quiz and free tools.", "A step-by-step course, a smart quiz and free tools."],
  [
    "Plain-spoken analysis of the Act, the Rules and what they mean.",
    "Plain-English analysis of the Act, the Rules and what they mean.",
  ],

  // header + mega-menu descriptions
  ["Get assessment", "Get a free check"],
  ["Learn & Certify", "Learn and get certified"],
  ["Rules 2025, mapped", "Rules 2025, matched to sections"],
  ["Privacy jurisprudence", "Court decisions on privacy"],
  ["For citizens · request letters", "For people · ready-made letters"],
  ["Policies & documents", "Policies and documents"],
  ["Analysis & guides", "Articles and guides"],
  ["By role · 6 tracks", "By job · 6 paths"],
  ["Course · quiz · FAQ", "Course, quiz and FAQ"],
  ["Certified DPDP Practitioner", "Certified DPDP professional"],

  // home explore heading
  ["Everything for DPDP, in one clear thread", "Everything for DPDP, in one clear place"],

  // control attributes (tooltips, titles and accessible labels)
  ["The grievance ladder", "How to make a complaint"],
  ["Consent Form", "Permission Form"],
  ["Data Principal rights", "Rights of the person the data is about"],
];
