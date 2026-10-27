/**
 * Interactive practice content for the persona courses. Each course gets a
 * small "learn by doing" arena - a Make-the-call judgement game, an optional
 * branching decision tool, and a term-matching game. Purely educational and
 * engagement-focused (no capture-the-flag mechanics).
 *
 * Legal content maps to the Digital Personal Data Protection Act, 2023 and the
 * DPDP Rules, 2025 (reference hub: dpdpa.com).
 */

/** A single judgement card: read the situation, pick the right verdict. */
export type SorterOption = { label: string; correct?: boolean };
export type SorterCard = {
  prompt: string;
  options: SorterOption[];
  /** shown after answering, regardless of right/wrong */
  explain: string;
  /** section / source reference, e.g. "Section 6(1)" */
  ref?: string;
};
export type SorterDeck = {
  title: string;
  lede: string;
  cards: SorterCard[];
};

/** A branching decision tool. Nodes ask questions; outcomes end the path. */
export type DecisionOption = { label: string; next: string };
export type DecisionNode = {
  id: string;
  question: string;
  hint?: string;
  options: DecisionOption[];
};
export type DecisionTone = "yes" | "no" | "info";
export type DecisionOutcome = {
  id: string;
  verdict: string;
  detail: string;
  ref?: string;
  tone?: DecisionTone;
};
export type DecisionTree = {
  title: string;
  lede: string;
  start: string;
  nodes: DecisionNode[];
  outcomes: DecisionOutcome[];
};

/** A click-to-match game: pair each term with its definition. */
export type MatchPair = { term: string; def: string };
export type MatchSet = {
  title: string;
  lede: string;
  pairs: MatchPair[];
};

export type CourseActivities = {
  intro?: string;
  sorter?: SorterDeck;
  decision?: DecisionTree;
  match?: MatchSet;
};

export const COURSE_ACTIVITIES: Record<string, CourseActivities> = {
  // ───────────────────────────────────────────────────────────── citizens ──
  citizens: {
    intro:
      "You've read your rights - now use them. Three quick drills to make consent, your rights and the key players click into place.",
    sorter: {
      title: "Consent: real or rubbish?",
      lede: "Real consent is free, specific and informed. Judge each request the way the law would.",
      cards: [
        {
          prompt:
            "An app shows one checkbox: “I agree to the Privacy Policy, Terms, marketing emails and sharing my data with partners.” You must tick it to sign up.",
          options: [
            { label: "Valid consent" },
            { label: "Dark pattern", correct: true },
          ],
          explain:
            "Consent must be specific and free. Bundling unrelated purposes into one mandatory checkbox is neither - you can't agree to delivery but refuse ad-sharing.",
          ref: "Section 6(1)",
        },
        {
          prompt:
            "Before you touch anything, a news site has already pre-ticked “Allow personalised ads” for you.",
          options: [
            { label: "Valid consent" },
            { label: "Dark pattern", correct: true },
          ],
          explain:
            "Consent needs a clear affirmative action. A pre-ticked box is not a yes - silence or inactivity can never be consent.",
          ref: "Section 6(1)",
        },
        {
          prompt:
            "A shopping app lets you tick “Use my address to deliver orders” separately from “Send me offers”, and you can leave either unticked.",
          options: [
            { label: "Valid consent", correct: true },
            { label: "Dark pattern" },
          ],
          explain:
            "Granular, purpose-specific, optional toggles are exactly what free, specific and informed consent looks like.",
          ref: "Section 6",
        },
        {
          prompt:
            "Giving consent took one tap. Today, “Withdraw consent” is a six-step, email-only process buried in settings.",
          options: [
            { label: "That's fine" },
            { label: "Not allowed", correct: true },
          ],
          explain:
            "Withdrawing consent must be as easy as giving it. Making it harder is a breach of the withdrawal duty.",
          ref: "Section 6(4)",
        },
      ],
    },
    decision: {
      title: "Which right should I use?",
      lede: "Tell us what you want to do - we'll point you to the right under the Act.",
      start: "q1",
      nodes: [
        {
          id: "q1",
          question: "What do you want to do about data a company holds on you?",
          options: [
            { label: "See what they hold & who they shared it with", next: "o_access" },
            { label: "Fix something wrong or out of date", next: "o_correct" },
            { label: "Have it deleted", next: "o_erase" },
            { label: "I already asked and was ignored", next: "q2" },
          ],
        },
        {
          id: "q2",
          question: "Have you used the company's own grievance channel yet?",
          hint: "The Act expects you to give the Data Fiduciary a chance to fix it first.",
          options: [
            { label: "Yes - I used their grievance officer and waited", next: "o_board" },
            { label: "Not yet - I only emailed support", next: "o_grievance" },
          ],
        },
      ],
      outcomes: [
        {
          id: "o_access",
          verdict: "Right to access information",
          detail:
            "Ask for a summary of your personal data and the identities of everyone it has been shared with.",
          ref: "Section 11",
          tone: "info",
        },
        {
          id: "o_correct",
          verdict: "Right to correction",
          detail:
            "Require the company to correct inaccurate or misleading data, and complete or update what's incomplete.",
          ref: "Section 12",
          tone: "info",
        },
        {
          id: "o_erase",
          verdict: "Right to erasure",
          detail:
            "Ask for your data to be erased once the purpose is served - unless the law requires it be kept.",
          ref: "Section 12",
          tone: "info",
        },
        {
          id: "o_grievance",
          verdict: "Right to grievance redressal - start here",
          detail:
            "Raise it with the company's grievance officer / Data Protection Officer first. They must respond within the prescribed time.",
          ref: "Section 13",
          tone: "info",
        },
        {
          id: "o_board",
          verdict: "Escalate to the Data Protection Board",
          detail:
            "You've exhausted the company's channel - now you can complain to the Data Protection Board of India.",
          ref: "Section 13, 27",
          tone: "yes",
        },
      ],
    },
    match: {
      title: "Who's who under the Act",
      lede: "Match each player to what they actually do.",
      pairs: [
        { term: "Data Principal", def: "The person the data is about - that's you" },
        { term: "Data Fiduciary", def: "The company that decides why and how your data is used" },
        { term: "Consent Manager", def: "A registered platform to give and withdraw consent in one place" },
        { term: "Data Protection Board", def: "The regulator you escalate to when a company ignores you" },
      ],
    },
  },

  // ───────────────────────────────────────────────────────────── founders ──
  founders: {
    intro:
      "Stop guessing whether the Act applies and what you can process. Work the tools below until the answers feel obvious.",
    decision: {
      title: "Does DPDP apply to us?",
      lede: "Answer three questions to see where your startup stands.",
      start: "q1",
      nodes: [
        {
          id: "q1",
          question: "Do you process digital personal data - anything that can identify a person?",
          options: [
            { label: "Only anonymous / aggregate data", next: "o_no" },
            { label: "Yes, we handle identifiable data", next: "q2" },
          ],
        },
        {
          id: "q2",
          question: "Is that processing purely for a personal or household purpose?",
          hint: "Think a personal contacts app - not a business activity.",
          options: [
            { label: "Yes, personal / domestic only", next: "o_exempt" },
            { label: "No, it's for the business", next: "q3" },
          ],
        },
        {
          id: "q3",
          question: "Where are the people whose data you process?",
          options: [
            { label: "We serve users in India (even from abroad)", next: "o_yes" },
            { label: "No India users, and we're outside India", next: "o_outside" },
          ],
        },
      ],
      outcomes: [
        {
          id: "o_no",
          verdict: "Likely outside the Act",
          detail:
            "The Act covers personal data about identifiable people. Truly anonymous data isn't personal data - but be certain it can't be re-identified.",
          ref: "Section 2",
          tone: "info",
        },
        {
          id: "o_exempt",
          verdict: "Exempt - personal / domestic use",
          detail:
            "Processing for a purely personal or domestic purpose sits outside the Act's obligations.",
          ref: "Section 3",
          tone: "info",
        },
        {
          id: "o_yes",
          verdict: "Yes - DPDP applies to you",
          detail:
            "You're a Data Fiduciary. You need a lawful basis, a clear notice, valid consent or a legitimate use, and the rights-and-grievance machinery.",
          ref: "Section 3",
          tone: "yes",
        },
        {
          id: "o_outside",
          verdict: "Probably out of scope - for now",
          detail:
            "The Act reaches offshore processing only when it's tied to offering goods or services to people in India. Revisit this the day you target Indian users.",
          ref: "Section 3",
          tone: "info",
        },
      ],
    },
    sorter: {
      title: "Consent, or a legitimate use?",
      lede: "Not everything needs a consent pop-up. Decide what each case really needs.",
      cards: [
        {
          prompt:
            "A customer types their address at checkout so you can ship the item they just bought.",
          options: [
            { label: "Needs fresh consent" },
            { label: "Legitimate use", correct: true },
          ],
          explain:
            "Data voluntarily given for a specific purpose can be used for that purpose - fulfilling the order - as a legitimate use.",
          ref: "Section 7(a)",
        },
        {
          prompt:
            "You want to email your existing customers about a brand-new, unrelated product line.",
          options: [
            { label: "Needs consent", correct: true },
            { label: "Legitimate use" },
          ],
          explain:
            "A new, unrelated marketing purpose goes beyond what the data was given for, so it needs fresh consent.",
          ref: "Section 6",
        },
        {
          prompt: "Your HR system processes employees' data to run payroll.",
          options: [
            { label: "Needs consent" },
            { label: "Legitimate use", correct: true },
          ],
          explain:
            "Processing for purposes of employment is a listed legitimate use - you don't need separate consent for payroll.",
          ref: "Section 7(i)",
        },
        {
          prompt: "A clinic uses a patient's data to respond to a medical emergency.",
          options: [
            { label: "Needs consent" },
            { label: "Legitimate use", correct: true },
          ],
          explain:
            "Responding to a medical emergency threatening life or health is a legitimate use - consent isn't required first.",
          ref: "Section 7",
        },
      ],
    },
    match: {
      title: "Build the minimum viable stack",
      lede: "Match each compliance artifact to the job it does.",
      pairs: [
        { term: "Section 5 notice", def: "Tells users what you collect, why, and how to withdraw" },
        { term: "Consent record", def: "Proof of what each user agreed to, and when" },
        { term: "RoPA-lite", def: "Your internal map of what data you hold and where" },
        { term: "Processing agreement", def: "Binds each vendor to act only on your instructions" },
      ],
    },
  },

  // ─────────────────────────────────────────────────────────── practitioner ──
  practitioner: {
    intro:
      "Pressure-test your judgement the way an audit would. Call compliance gaps, decide your SDF status, and keep the vocabulary sharp.",
    sorter: {
      title: "Compliant, or a violation?",
      lede: "Read each practice and make the call an auditor would.",
      cards: [
        {
          prompt:
            "A fiduciary keeps closed-account KYC documents for ten years “just in case”, with no legal requirement to.",
          options: [
            { label: "Compliant" },
            { label: "Violation", correct: true },
          ],
          explain:
            "Once the purpose is served and no law requires retention, the data must be erased. Indefinite “just in case” storage breaches retention limits.",
          ref: "Section 8(7)",
        },
        {
          prompt:
            "On discovering a personal-data breach, the fiduciary promptly intimates both the Board and the affected Data Principals.",
          options: [
            { label: "Compliant", correct: true },
            { label: "Violation" },
          ],
          explain:
            "Intimating the Board and each affected principal on a breach is exactly the obligation.",
          ref: "Section 8(6)",
        },
        {
          prompt:
            "A processor quietly sub-contracts part of the work to another vendor, though its contract with the fiduciary never permitted sub-processing.",
          options: [
            { label: "Compliant" },
            { label: "Violation", correct: true },
          ],
          explain:
            "A processor may act only under a valid contract with the fiduciary. Sub-contracting outside that contract isn't allowed.",
          ref: "Section 8(2)",
        },
        {
          prompt:
            "A Significant Data Fiduciary publishes the business contact details of its Data Protection Officer so principals can reach them.",
          options: [
            { label: "Compliant", correct: true },
            { label: "Violation" },
          ],
          explain:
            "SDFs must appoint a DPO and make their contact details available - publishing them is correct.",
          ref: "Section 10",
        },
      ],
    },
    decision: {
      title: "Are we a Significant Data Fiduciary?",
      lede: "A quick triage of whether the heavier Section 10 duties apply.",
      start: "q1",
      nodes: [
        {
          id: "q1",
          question:
            "Has the Central Government notified your class as a Significant Data Fiduciary?",
          options: [
            { label: "Yes - we're notified", next: "o_sdf" },
            { label: "No / not sure", next: "q2" },
          ],
        },
        {
          id: "q2",
          question:
            "Do you process a high volume of sensitive personal data with real risk to people's rights, security or public order?",
          hint: "Volume, sensitivity and risk to rights are the factors the government weighs.",
          options: [
            { label: "Yes - high volume / high risk", next: "o_sdf" },
            { label: "No - small-scale, low-risk", next: "o_ordinary" },
          ],
        },
      ],
      outcomes: [
        {
          id: "o_sdf",
          verdict: "Treat yourself as a Significant Data Fiduciary",
          detail:
            "Appoint a DPO based in India, engage an independent data auditor, and run periodic Data Protection Impact Assessments.",
          ref: "Section 10",
          tone: "yes",
        },
        {
          id: "o_ordinary",
          verdict: "Ordinary Data Fiduciary",
          detail:
            "The core duties still bind you - notice, consent, security, breach reporting and rights - but not the extra Section 10 measures.",
          ref: "Section 8",
          tone: "info",
        },
      ],
    },
    match: {
      title: "Practitioner vocabulary",
      lede: "Match each term to its precise meaning.",
      pairs: [
        { term: "Significant Data Fiduciary", def: "A fiduciary notified for higher-risk, higher-volume processing" },
        { term: "DPIA", def: "A structured assessment of risks to Data Principals' rights" },
        { term: "Consent Manager", def: "Board-registered platform for managing consent interoperably" },
        { term: "Data Protection Officer", def: "The accountable contact an SDF must appoint in India" },
      ],
    },
  },

  // ──────────────────────────────────────────────────────────────── legal ──
  legal: {
    intro:
      "Advise with precision. Map sections to subjects, then judge whether drafting and reliance would survive the Board.",
    match: {
      title: "Section to subject",
      lede: "Match each section of the Act to what it governs.",
      pairs: [
        { term: "Section 5", def: "Notice - what every notice must tell the principal" },
        { term: "Section 6", def: "Consent - free, specific, informed, unambiguous" },
        { term: "Section 7", def: "Certain legitimate uses - processing without consent" },
        { term: "Section 9", def: "Processing of children's personal data" },
        { term: "Section 10", def: "Additional obligations of Significant Data Fiduciaries" },
        { term: "Section 33", def: "Penalties for breach of the Act" },
      ],
    },
    sorter: {
      title: "Will it hold before the Board?",
      lede: "Judge each drafting or advisory choice as defensible - or not.",
      cards: [
        {
          prompt:
            "A privacy notice states: “We may use your data for any purpose we deem fit.”",
          options: [
            { label: "Defensible" },
            { label: "Won't hold", correct: true },
          ],
          explain:
            "Notice must specify the personal data and the purposes. Open-ended “any purpose” clauses defeat the very point of notice.",
          ref: "Section 5",
        },
        {
          prompt:
            "Consent is captured in plain English, with the same notice offered in Hindi and other Eighth-Schedule languages.",
          options: [
            { label: "Defensible", correct: true },
            { label: "Won't hold" },
          ],
          explain:
            "Giving the principal access to the notice in English or a language in the Eighth Schedule supports valid, informed consent.",
          ref: "Section 5(3)",
        },
        {
          prompt:
            "A client wants to rely on “legitimate uses” to run behavioural ad targeting across its app.",
          options: [
            { label: "Defensible" },
            { label: "Won't hold", correct: true },
          ],
          explain:
            "Targeted advertising is not among the legitimate uses. It needs consent - and never against children.",
          ref: "Section 7, 9",
        },
        {
          prompt:
            "Before transferring data abroad, the client checks whether the destination is a country the Central Government has restricted.",
          options: [
            { label: "Sound advice", correct: true },
            { label: "Misreads the Act" },
          ],
          explain:
            "Cross-border transfer is permitted except to countries the Central Government restricts by notification - checking the list is exactly right.",
          ref: "Section 16",
        },
      ],
    },
  },

  // ────────────────────────────────────────────────────────── engineering ──
  engineering: {
    intro:
      "Turn duties into design. Map obligations to controls, judge architecture choices, and decide when data may feed a model.",
    match: {
      title: "Duty to control",
      lede: "Match each statutory duty to the engineering control that satisfies it.",
      pairs: [
        { term: "Security safeguards", def: "Encryption, access control and masking of personal data" },
        { term: "Breach reporting", def: "Detection plus an automated notification workflow" },
        { term: "Retention limits", def: "Retention schedule with automated deletion jobs" },
        { term: "Rights fulfilment", def: "Self-serve access, correction and erasure endpoints" },
        { term: "Valid consent", def: "Granular, versioned capture with a withdrawal endpoint" },
      ],
    },
    sorter: {
      title: "Privacy by design: pass or fail?",
      lede: "Each is a real architecture decision. Would it pass a privacy review?",
      cards: [
        {
          prompt:
            "To gate adult content, you store every user's full date of birth - when all you need is an “is 18+” flag.",
          options: [
            { label: "Pass" },
            { label: "Fail", correct: true },
          ],
          explain:
            "Collect the minimum necessary. Store the over-18 boolean, not the full DOB - that's data minimisation in practice.",
          ref: "Section 8(7)",
        },
        {
          prompt: "New analytics events ship opt-in and default-off for every user.",
          options: [
            { label: "Pass", correct: true },
            { label: "Fail" },
          ],
          explain:
            "Default-private settings are the essence of privacy by design and by default.",
          ref: "Section 8",
        },
        {
          prompt:
            "For easier debugging, the app writes raw card numbers and full names into plaintext application logs.",
          options: [
            { label: "Pass" },
            { label: "Fail", correct: true },
          ],
          explain:
            "Sensitive data sprayed into logs defeats your security safeguards and widens breach blast-radius. Mask or omit it.",
          ref: "Section 8(5)",
        },
        {
          prompt:
            "Deleting a user cascades the deletion through replicas and backups in line with the retention policy.",
          options: [
            { label: "Pass", correct: true },
            { label: "Fail" },
          ],
          explain:
            "Erasure has to propagate everywhere the data lives - replicas and backups included - to actually honour the right.",
          ref: "Section 8(7), 12",
        },
      ],
    },
    decision: {
      title: "Can we train a model on this data?",
      lede: "A common engineering call, walked through the Act.",
      start: "q1",
      nodes: [
        {
          id: "q1",
          question:
            "Was the personal data collected with consent for a purpose that already includes model training?",
          options: [
            { label: "Yes - consent covers training", next: "o_ok" },
            { label: "No / unclear", next: "q2" },
          ],
        },
        {
          id: "q2",
          question:
            "Can you irreversibly anonymise it so individuals can't be re-identified?",
          hint: "Pseudonymisation isn't enough if re-identification is feasible.",
          options: [
            { label: "Yes - truly anonymised", next: "o_anon" },
            { label: "No - still identifiable", next: "o_stop" },
          ],
        },
      ],
      outcomes: [
        {
          id: "o_ok",
          verdict: "Proceed - within the consented purpose",
          detail:
            "Training is covered by the purpose the principal consented to. Keep the purpose linkage documented.",
          ref: "Section 6",
          tone: "yes",
        },
        {
          id: "o_anon",
          verdict: "Proceed on anonymised data",
          detail:
            "Truly anonymised data falls outside the Act - but validate re-identification risk before you rely on this.",
          ref: "Section 2",
          tone: "info",
        },
        {
          id: "o_stop",
          verdict: "Stop - get a lawful basis first",
          detail:
            "Re-purposing identifiable personal data for training needs fresh consent or another lawful ground. Don't ship it yet.",
          ref: "Section 6",
          tone: "no",
        },
      ],
    },
  },

  // ───────────────────────────────────────────────────────────── students ──
  students: {
    intro:
      "Warm up for the exam. Lock the vocabulary, then fire through quick-recall questions in the style of the real paper.",
    match: {
      title: "Exam vocabulary",
      lede: "Match each defined term to its meaning.",
      pairs: [
        { term: "Data Principal", def: "The individual the personal data is about" },
        { term: "Data Fiduciary", def: "Decides the purpose and means of processing" },
        { term: "Data Processor", def: "Processes data on a fiduciary's instructions" },
        { term: "Consent Manager", def: "Board-registered platform for managing consent" },
        { term: "Significant Data Fiduciary", def: "Higher-risk fiduciary with extra Section 10 duties" },
        { term: "Data Protection Board", def: "The adjudicating and enforcement authority" },
      ],
    },
    sorter: {
      title: "Exam warm-up",
      lede: "Quick-fire recall. Pick the answer the Act supports.",
      cards: [
        {
          prompt:
            "An Indian user's data is processed by a company in Singapore that offers services in India. The Act is…",
          options: [
            { label: "Outside this case" },
            { label: "Applicable", correct: true },
          ],
          explain:
            "Section 3 gives the Act extra-territorial reach where processing connects to offering goods or services in India.",
          ref: "Section 3",
        },
        {
          prompt: "Paper records that are never digitised are…",
          options: [
            { label: "Covered by the Act" },
            { label: "Outside the Act", correct: true },
          ],
          explain:
            "The Act covers digital personal data - collected digitally, or collected on paper and then digitised.",
          ref: "Section 2",
        },
        {
          prompt: "The maximum penalty the Schedule allows is…",
          options: [
            { label: "₹50 crore" },
            { label: "₹250 crore", correct: true },
          ],
          explain:
            "The Schedule tops out at up to ₹250 crore - for instance, failing to take reasonable security safeguards.",
          ref: "Schedule",
        },
        {
          prompt: "Processing a child's personal data requires…",
          options: [
            { label: "Nothing special" },
            { label: "Verifiable parental consent", correct: true },
          ],
          explain:
            "A child's data needs verifiable consent of a parent or lawful guardian - and no tracking or targeted ads.",
          ref: "Section 9",
        },
        {
          prompt: "Withdrawing consent must be…",
          options: [
            { label: "Harder than giving it" },
            { label: "As easy as giving it", correct: true },
          ],
          explain:
            "The ease of withdrawing consent must be comparable to the ease with which it was given.",
          ref: "Section 6(4)",
        },
      ],
    },
  },
};

export function getCourseActivities(slug: string): CourseActivities | undefined {
  return COURSE_ACTIVITIES[slug];
}
