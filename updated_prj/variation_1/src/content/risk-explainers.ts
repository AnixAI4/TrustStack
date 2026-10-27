// Plain-language explainers for each of the 7D risk-check questions.
//
// This content is 100% STATIC. The in-app guide ("Dee") reads these strings
// directly and never calls an LLM - opening the helper is instant and costs
// zero tokens. Keep the tone clear and professional (not childish): explain
// what the question is really asking, then give one concrete, relatable example.
//
// Order matches the 7D framework questions in `RISK_CHECK.questions`
// (Discover → Define → Design → Defend → Deploy → Demonstrate → Drive), so the
// explainer at index `i` maps to question `i`.

export type RiskExplainer = {
  /** 7D stage name (matches the question order). */
  stage: string;
  /** A one-line gist the guide opens with. */
  gist: string;
  /** Plain explanation of what the question is really asking. */
  explain: string;
  /** A concrete, everyday example that makes it click. */
  example: string;
};

export const RISK_EXPLAINERS: RiskExplainer[] = [
  {
    stage: "Discover",
    gist: "This is really asking: do you know exactly what personal data you hold, and everywhere it goes?",
    explain:
      "You can't protect or report on data you haven't found. This question checks whether you keep a complete, up-to-date map of every place personal data lives and moves - cloud apps, on-premise servers, spreadsheets, third-party vendors, and any AI tools. That map is usually called a data inventory (or Record of Processing). If even one system is missing from it, you don't yet have a full picture, so it isn't truly \u2018Covered\u2019.",
    example:
      "A retailer lists it out: customer names and emails in Shopify (cloud), card payments through Razorpay (a vendor), support chats in Zendesk, employee records in an on-premise HR system, and a marketing list synced into an AI tool. Together that\u2019s their data inventory. If the marketing-AI flow was left off the list, this should be marked \u2018In progress\u2019 \u2014 not \u2018Covered\u2019.",
  },
  {
    stage: "Define",
    gist: "This is asking whether, for each type of data, you can state why you have it, what allows you to, and how long you keep it.",
    explain:
      "For every category of personal data you hold, DPDP expects three things written down: the purpose (why you collect it), the lawful basis (what legally permits it \u2014 usually the person\u2019s consent, or a recognised \u2018legitimate use\u2019), and the retention period (how long you keep it before deleting). \u2018Documented\u2019 means it\u2019s actually recorded somewhere, not just understood informally in someone\u2019s head.",
    example:
      "One line from a bank\u2019s records: \u2018Customer phone number \u2014 Purpose: sending transaction alerts; Lawful basis: consent given at account opening; Retention: 3 years after the account closes, then deleted.\u2019 If you can produce a clear line like that for each kind of data, you\u2019re \u2018Covered\u2019.",
  },
  {
    stage: "Design",
    gist: "This is about telling people clearly what you collect, getting proper consent, and letting them withdraw it just as easily.",
    explain:
      "DPDP wants you to give people a clear notice of what data you take and why, obtain consent that is specific and freely given (never pre-ticked or bundled), and make withdrawing consent as easy as giving it was. \u2018Plain language\u2019 means a normal person understands it without a lawyer \u2014 and notices should be available in the languages listed in the Constitution\u2019s Eighth Schedule.",
    example:
      "A signup form shows a short notice: \u2018We use your email to send order updates and offers.\u2019 Below it is an un-ticked consent box (the person chooses to tick it), and later, one click in \u2018Account settings \u2192 Withdraw consent\u2019 stops it. Clear notice + real choice + easy withdrawal = \u2018Covered\u2019.",
  },
  {
    stage: "Defend",
    gist: "This is asking: if data leaked today, could you contain it and notify the Board and the affected people fast?",
    explain:
      "A personal-data breach is any unauthorised access, loss, or exposure of personal data. DPDP requires you to notify both the Data Protection Board of India and every affected person without undue delay. Being able to do that quickly means having an incident plan ready in advance: who to call, how to judge the impact, and notification templates you can send immediately.",
    example:
      "A laptop holding a customer database is stolen. Within hours the team cuts off its access, works out whose data was on it, alerts those customers, and files a report with the Board \u2014 because a breach-response runbook and ready-made notification templates already existed. No plan in place? That\u2019s a \u2018Gap\u2019.",
  },
  {
    stage: "Deploy",
    gist: "This checks whether your policies are actually live across the whole organisation \u2014 not just written down.",
    explain:
      "Good policies mean nothing until they run in day-to-day work. This question asks whether staff are trained for their specific role (support, marketing and HR each handle data differently), and whether every vendor that processes data for you has signed a Data Processing Agreement (DPA) binding them to DPDP. \u2018Every department\u2019 is the real test \u2014 it has to be organisation-wide, not just an IT project.",
    example:
      "Marketing knows not to buy email lists, support verifies identity before sharing account data, HR locks down employee files \u2014 and your cloud, email and analytics vendors have each signed a DPA. If the training or the DPAs are missing anywhere, mark it \u2018In progress\u2019 until it\u2019s truly everywhere.",
  },
  {
    stage: "Demonstrate",
    gist: "This is about being able to prove your compliance on demand \u2014 not just claim it.",
    explain:
      "DPDP is accountability-based: if asked, you must show evidence that you comply. That means keeping records \u2014 your data inventory, consent logs, privacy notices, signed DPAs, training attendance, breach reports and audit trails \u2014 and being able to hand them over quickly to an auditor or the Data Protection Board.",
    example:
      "The Board asks you to prove consent for a marketing campaign. You pull up a consent log showing, for each recipient, the exact time they agreed, the precise notice they saw, and their opt-out status \u2014 produced in minutes, not weeks. Evidence ready = \u2018Covered\u2019.",
  },
  {
    stage: "Drive",
    gist: "This asks whether someone actually owns DPDP every day \u2014 rights requests, grievances, and AI reviews included.",
    explain:
      "Compliance is ongoing, so it needs a clear owner. This question checks whether someone continuously runs it: reviewing new uses of data, handling people\u2019s rights requests (to access, correct or erase their data), operating a grievance-redressal process, and reviewing AI or automated tools for privacy risk. A \u2018Data Principal\u2019 is simply the individual whose data you hold; large processors must also appoint a Data Protection Officer.",
    example:
      "A named privacy lead (or DPO) runs a monthly review, answers data-access requests within a set deadline, publishes a grievance email that\u2019s actually monitored, and signs off on any new AI feature before launch. Clear, ongoing ownership = \u2018Covered\u2019; nobody clearly responsible = \u2018Gap\u2019.",
  },
];
