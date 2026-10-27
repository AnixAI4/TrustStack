// Case-law library for the DPDP knowledge hub.
// Each entry is a self-contained, richly written read that lives INSIDE the app.
// External links point only to verified, working full-judgment sources.

export type CaseCat = "privacy" | "consent" | "surveillance" | "speech";

export type CaseBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "quote"; text: string; cite?: string };

export type CaseEntry = {
  slug: string;
  title: string;
  shortTitle: string;
  court: string;
  bench: string;
  citation: string;
  year: string;
  meta: string;
  cat: CaseCat;
  /** One-line framing question for the card. */
  question: string;
  /** One-line outcome for the card. */
  holding: string;
  /** The long, engaging read. */
  summary: CaseBlock[];
  /** Why this matters for the DPDP Act, 2023. */
  whyItMatters: string[];
  /** Crisp, memorable takeaways. */
  takeaways: string[];
  /** Verified, working link to the full judgment. */
  sourceUrl: string;
  sourceLabel: string;
  featured?: boolean;
};

export const CASE_FILTERS: { key: CaseCat | "all"; label: string }[] = [
  { key: "all", label: "All landmark cases" },
  { key: "privacy", label: "Right to privacy" },
  { key: "consent", label: "Consent & confidentiality" },
  { key: "surveillance", label: "Surveillance & the state" },
  { key: "speech", label: "Speech & the internet" },
];

export const CASES: CaseEntry[] = [
  {
    slug: "puttaswamy-right-to-privacy",
    title: "Justice K.S. Puttaswamy (Retd.) v. Union of India",
    shortTitle: "Puttaswamy - Right to Privacy",
    court: "Supreme Court of India",
    bench: "9-Judge Constitution Bench",
    citation: "(2017) 10 SCC 1",
    year: "2017",
    meta: "9 judges · Fundamental Rights · Article 21",
    cat: "privacy",
    question:
      "Is privacy a fundamental right under the Indian Constitution - or just a common-law interest the state can override at will?",
    holding:
      "Yes. A unanimous nine-judge Bench held that the right to privacy is intrinsic to life, liberty and dignity under Article 21, and runs through the whole of Part III.",
    featured: true,
    summary: [
      {
        type: "p",
        text: "It began, improbably, with a 91-year-old retired judge and a national ID card. Justice K.S. Puttaswamy, a former judge of the Karnataka High Court, challenged the Aadhaar programme on the ground that collecting the fingerprints and iris scans of a billion people, and linking them to everything from bank accounts to school lunches, invaded a citizen's privacy. The Union government's answer was startling in its bluntness: the Constitution of India, it argued, contains no fundamental right to privacy at all.",
      },
      {
        type: "p",
        text: "The government was not inventing this position. It was leaning on two old and heavy precedents - M.P. Sharma (1954), decided by eight judges, and Kharak Singh (1962), decided by six. Because those benches were larger than any that had spoken since, the only body that could authoritatively overrule them was a bench of nine. So the Chief Justice constituted one. For the first time in decades, nine judges of the Supreme Court sat together to answer a single, foundational question: does an Indian citizen have a constitutional right to be let alone?",
      },
      {
        type: "h2",
        text: "The question behind the question",
      },
      {
        type: "p",
        text: "Privacy is deceptively hard to define. It is the diary you keep from your family, the phone call the state does not listen to, the medical diagnosis your employer never learns, the choice of whom to love, and the freedom to be forgotten by a search engine. The government seized on this difficulty. If privacy is so amorphous, it argued, courts cannot police it; it is a 'wholly diffuse' notion better left to Parliament. And in a country with mass poverty, it added, elite anxieties about data should not stand in the way of welfare delivery.",
      },
      {
        type: "p",
        text: "The Bench rejected the framing entirely. Privacy, the judges held, is not an elite luxury. The poorest person in the country has as much interest in bodily integrity, in not being surveilled, and in making intimate choices as the wealthiest. And the difficulty of definition is not unique to privacy - liberty and equality are also open-textured, and courts give them meaning case by case. That is what constitutional adjudication is.",
      },
      {
        type: "h2",
        text: "What the Court decided",
      },
      {
        type: "p",
        text: "In six concurring opinions running to over five hundred pages, the nine judges spoke with one voice on the outcome. Privacy, they held, is a fundamental right - not because a specific clause spells it out, but because it is intrinsic to the rights that are spelled out. It flows from the right to life and personal liberty in Article 21, and it threads through the freedoms of speech, movement and conscience in Article 19 and the guarantee of equality in Article 14. Dignity, the Court said again and again, is the constitutional value at the core of it all.",
      },
      {
        type: "quote",
        text: "Privacy is the constitutional core of human dignity... it is the necessary condition precedent to the enjoyment of any of the guarantees in Part III.",
        cite: "Justice D.Y. Chandrachud, for the plurality",
      },
      {
        type: "p",
        text: "The Court mapped privacy across three overlapping zones: the privacy of the body and the home; the privacy of information - the data trail we now shed with every transaction; and the privacy of choice, the freedom to make intimate decisions about family, marriage, procreation and sexual orientation. Crucially, it recognised informational privacy as a distinct and urgent concern of the digital age, and expressly called on Parliament to enact a data-protection law.",
      },
      {
        type: "h2",
        text: "Not an absolute right",
      },
      {
        type: "p",
        text: "The judges were careful. Privacy is fundamental, but it is not absolute - no right is. The state can intrude, but only if it clears a demanding test. There must be a law authorising the intrusion; the law must serve a legitimate state aim; and the intrusion must be proportionate - a genuine, carefully tailored fit between the means used and the goal pursued, not a sledgehammer where a scalpel would do. This 'legality, legitimacy, proportionality' framework is the enduring legal machinery the case handed to every court that came after.",
      },
      {
        type: "p",
        text: "Along the way, the Bench did some housekeeping of historic importance. It expressly overruled M.P. Sharma and the majority in Kharak Singh to the extent they denied privacy. And it disapproved of the reasoning in Koushal - the 2013 decision that had re-criminalised gay sex - describing the rights of LGBTQ Indians as real fundamental rights, not, in the Court's memorable phrase, 'so-called rights'. That single paragraph lit the fuse for the decriminalisation of Section 377 a year later.",
      },
      {
        type: "h2",
        text: "Why it still matters",
      },
      {
        type: "p",
        text: "Puttaswamy is the constitutional bedrock on which India's entire data-protection edifice now stands. When Parliament finally passed the Digital Personal Data Protection Act in 2023, it was answering a homework assignment set by this Bench. Every argument about consent, purpose limitation, data minimisation and the rights of a 'Data Principal' ultimately traces back to the dignity-centred vision the nine judges laid down here. If you understand only one case in Indian privacy law, understand this one.",
      },
    ],
    whyItMatters: [
      "It is the constitutional foundation of the DPDP Act, 2023 - the reason a data-protection statute exists at all.",
      "It created the 'legality, legitimacy, proportionality' test that governs every state intrusion into personal data.",
      "It expressly recognised 'informational privacy' as a distinct right for the digital age and directed Parliament to legislate.",
    ],
    takeaways: [
      "Privacy is a fundamental right intrinsic to dignity under Article 21 - held unanimously by nine judges.",
      "The right is not absolute; intrusions need a valid law, a legitimate aim, and proportionate means.",
      "The decision overruled M.P. Sharma and Kharak Singh and set the stage for both decriminalising Section 377 and enacting the DPDP Act.",
    ],
    sourceUrl: "https://indiankanoon.org/doc/91938676/",
    sourceLabel: "Read the full judgment on Indian Kanoon",
  },
  {
    slug: "kharak-singh-surveillance",
    title: "Kharak Singh v. State of Uttar Pradesh",
    shortTitle: "Kharak Singh - Night-time Surveillance",
    court: "Supreme Court of India",
    bench: "6-Judge Constitution Bench",
    citation: "AIR 1963 SC 1295",
    year: "1962",
    meta: "6 judges · Police surveillance · Article 21",
    cat: "surveillance",
    question:
      "Can the police put a man under permanent watch - visiting his home at night, tracking his movements, keeping a file - merely because they suspect him?",
    holding:
      "Domiciliary night visits were struck down as unconstitutional. But the majority denied a general right to privacy - a holding later overruled by Puttaswamy.",
    summary: [
      {
        type: "p",
        text: "Kharak Singh had been charged in a dacoity case and then released - the charge was not proved against him. But the police in Uttar Pradesh were not done with him. Under a set of state Police Regulations, they opened a 'history sheet' on him and placed him under what the regulations blandly called 'surveillance'. In practice that meant something closer to persecution: officers would knock on his door in the dead of night and wake him to check he was home; they shadowed his movements; they made inquiries about him wherever he went.",
      },
      {
        type: "p",
        text: "Kharak Singh went to the Supreme Court arguing that this relentless watching violated his fundamental rights - his freedom of movement under Article 19 and his right to personal liberty under Article 21. The case forced the Court, for the first time, to grapple with a question that would only grow more urgent over the following sixty years: how much may the state watch a citizen who has been convicted of nothing?",
      },
      {
        type: "h2",
        text: "A knock in the night",
      },
      {
        type: "p",
        text: "The Court's most vivid holding concerned those night visits. Entering a man's home to disturb his sleep, the judges said, was an intrusion into the sanctity of the home - 'the last refuge of a citizen'. Drawing on the old English idea that a person's house is their castle, the majority struck down the regulation that authorised domiciliary visits as an unconstitutional violation of personal liberty under Article 21. On that narrow point, Kharak Singh won.",
      },
      {
        type: "quote",
        text: "The right of personal liberty ... is a right of an individual to be free from restrictions or encroachments on his person, whether those restrictions or encroachments are directly imposed or indirectly brought about by calculated measures.",
        cite: "Kharak Singh v. State of U.P.",
      },
      {
        type: "h2",
        text: "The majority's blind spot",
      },
      {
        type: "p",
        text: "But the rest of the surveillance - the shadowing, the inquiries, the history sheet - the majority upheld. And in doing so it made a fateful move. Because the Constitution's text nowhere uses the word 'privacy', the majority reasoned, there was no fundamental right to privacy that the milder forms of surveillance could be said to violate. Mere watching, the judges suggested, did not physically restrain a person, so it did not touch his liberty.",
      },
      {
        type: "p",
        text: "It fell to Justice Subba Rao, in a dissent that history has vindicated, to see further. He argued that psychological restraint is still restraint - that a man who knows he is always being watched is not truly free, even if no hand is laid upon him. Privacy, he insisted, was an essential ingredient of personal liberty, whether or not the Constitution named it. 'It is true our Constitution does not expressly declare a right to privacy as a fundamental right,' he wrote, 'but the said right is an essential ingredient of personal liberty.'",
      },
      {
        type: "h2",
        text: "The long afterlife of a dissent",
      },
      {
        type: "p",
        text: "For decades the Kharak Singh majority stood as an obstacle in the path of privacy law, cited by governments as proof that no such right existed. That is precisely why the privacy question in 2017 had to go to a bench of nine - only a larger bench could overrule the six who sat here. When the nine-judge Bench in Puttaswamy finally did overrule the majority, it did something rare and graceful: it adopted Justice Subba Rao's lonely dissent as the correct statement of the law. The judge who lost in 1962 had, in the end, written the future.",
      },
      {
        type: "p",
        text: "Read today, Kharak Singh is a case about the quiet violence of being watched - and a reminder that surveillance need not touch the body to cage the mind. Its striking down of night visits was an early, instinctive defence of the home; its blind spot on privacy became the very error that produced modern Indian privacy law by way of correction.",
      },
    ],
    whyItMatters: [
      "It is the origin point of the surveillance-versus-liberty debate that the DPDP Act and its exemptions still navigate.",
      "Its majority denial of privacy was expressly overruled by Puttaswamy - you cannot understand 2017 without 1962.",
      "Justice Subba Rao's dissent - that psychological surveillance restrains liberty - is now good law.",
    ],
    takeaways: [
      "Domiciliary night visits by police were struck down as violating personal liberty and the sanctity of the home.",
      "The majority wrongly held there was no right to privacy - later overruled in Puttaswamy (2017).",
      "Justice Subba Rao's dissent, treating privacy as intrinsic to liberty, became the accepted view decades later.",
    ],
    sourceUrl: "https://indiankanoon.org/doc/619152/",
    sourceLabel: "Read the full judgment on Indian Kanoon",
  },
  {
    slug: "gobind-privacy-zone",
    title: "Gobind v. State of Madhya Pradesh",
    shortTitle: "Gobind - A Zone of Privacy",
    court: "Supreme Court of India",
    bench: "3-Judge Bench",
    citation: "(1975) 2 SCC 148",
    year: "1975",
    meta: "3 judges · Compelling state interest · Article 21",
    cat: "privacy",
    question:
      "If the Constitution protects a 'zone of privacy', how strong must the state's justification be before the police may keep a suspect under watch?",
    holding:
      "The Court accepted a qualified right to privacy for the first time, holding it can yield only to a 'compelling state interest' - an early proportionality standard.",
    summary: [
      {
        type: "p",
        text: "Gobind was a habitual offender in Madhya Pradesh, and the state's police regulations subjected people like him to surveillance much like the regime challenged in Kharak Singh a decade earlier - domiciliary visits, picketing, tracking. He brought the same essential complaint: that this watching violated his fundamental rights. But by 1975 the legal weather had begun to change, and the three-judge Bench that heard him took a decisive step its predecessors had refused.",
      },
      {
        type: "h2",
        text: "Borrowing from the world",
      },
      {
        type: "p",
        text: "Justice K.K. Mathew, writing for the Court, went looking beyond India's borders. He drew on the American Supreme Court's then-recent privacy decisions - Griswold, which protected a married couple's use of contraception, and Roe - and on the idea that certain 'penumbral' zones of the Constitution shelter an individual's private life from state intrusion. From this he distilled a proposition Indian law had until then resisted: that the Constitution does protect a zone of privacy, one that covers 'the sanctities of a man's family, marriage, procreation, motherhood, child-bearing and education'.",
      },
      {
        type: "quote",
        text: "Privacy-dignity claims deserve to be examined with care, and to be denied only when an important countervailing interest is shown to be superior.",
        cite: "Justice K.K. Mathew in Gobind",
      },
      {
        type: "h2",
        text: "A right that yields only to a compelling interest",
      },
      {
        type: "p",
        text: "This was the case's great contribution. Rather than treat privacy as all-or-nothing, Justice Mathew framed it as a right that exists but can be outweighed. And he set the bar for outweighing it high: the state could intrude only where it could show a 'compelling state interest', and even then the law had to be narrowly drawn. This was, in embryo, the proportionality analysis that Puttaswamy would formalise forty-two years later. The Court was feeling its way toward a structured method for balancing the individual against the state.",
      },
      {
        type: "p",
        text: "Having built this framework, the Court then applied it cautiously. It read the surveillance regulations narrowly - as reaching only genuine, serious offenders and only where a real threat to public order existed - and, so limited, upheld them. Gobind himself did not win his freedom from the watch list. But the doctrine the case announced mattered far more than its result.",
      },
      {
        type: "h2",
        text: "The bridge case",
      },
      {
        type: "p",
        text: "Gobind is best understood as the bridge between the flat denial of privacy in Kharak Singh and its full constitutional recognition in Puttaswamy. It was tentative - the Court hedged, said privacy had to develop 'case by case', and declined to hold the right absolute. But it planted two seeds that grew into the whole forest of modern privacy law: that a zone of privacy exists within Article 21, and that the state needs a compelling, narrowly tailored justification to enter it.",
      },
      {
        type: "p",
        text: "When the nine-judge Bench later assembled the intellectual history of Indian privacy, Gobind stood out as the moment the Court first said yes - hesitantly, conditionally, but unmistakably - to a constitutional right the text never names. For anyone tracing how India moved from a citizen having no privacy against the state to a citizen having enforceable rights over their own data, this is the turning point.",
      },
    ],
    whyItMatters: [
      "It first recognised a constitutional 'zone of privacy' within Article 21 - a direct ancestor of the DPDP Act's rights.",
      "The 'compelling state interest' standard is an early form of the proportionality test now central to data law.",
      "It bridges Kharak Singh's denial and Puttaswamy's affirmation, showing privacy law's evolution.",
    ],
    takeaways: [
      "India's courts first accepted a qualified right to privacy here, protecting family, marriage and procreation.",
      "Privacy could be overridden only by a 'compelling state interest' via a narrowly drawn law.",
      "The reasoning prefigured the proportionality framework later adopted in Puttaswamy.",
    ],
    sourceUrl: "https://indiankanoon.org/doc/436241/",
    sourceLabel: "Read the full judgment on Indian Kanoon",
  },
  {
    slug: "rajagopal-auto-shankar",
    title: "R. Rajagopal v. State of Tamil Nadu",
    shortTitle: "R. Rajagopal - The 'Auto Shankar' Case",
    court: "Supreme Court of India",
    bench: "2-Judge Bench",
    citation: "(1994) 6 SCC 632",
    year: "1994",
    meta: "Press freedom · Right to be let alone · Article 19(1)(a)",
    cat: "speech",
    question:
      "Can the state stop a magazine from publishing a condemned prisoner's autobiography - and who owns the story of a person's life?",
    holding:
      "No prior restraint. The Court recognised a 'right to be let alone', but held that public records and the conduct of public officials remain open to publication.",
    summary: [
      {
        type: "p",
        text: "Auto Shankar was a Tamil Nadu auto-rickshaw driver turned serial killer, convicted of six murders and sentenced to death. On death row, he wrote an autobiography - and in it, he claimed, he described his links with several senior police and prison officials, some of whom he alleged were complicit in his crimes. A Tamil weekly, Nakkheeran, run by editor R. Rajagopal, announced it would serialise the memoir. Before a word was printed, the prison authorities and the state swung into action to stop it, claiming the condemned man had disowned the manuscript and that publication would defame the officials named.",
      },
      {
        type: "p",
        text: "The magazine went to the Supreme Court. The case pitted two great interests against each other: the freedom of the press to publish, and the right of individuals - even public officials - not to have their private lives dragged into print. It became the first Indian decision to think seriously about the collision between privacy and free speech.",
      },
      {
        type: "h2",
        text: "The right to be let alone",
      },
      {
        type: "p",
        text: "Justice B.P. Jeevan Reddy, writing for the Court, reached across to American and English law and adopted, for India, the classic formulation of privacy as 'the right to be let alone'. A citizen, he held, has a right to safeguard the privacy of his own, his family's, marriage, procreation, motherhood, child-bearing and education, among other matters. No one may publish such intimate details without consent - and if they do, they may be liable in damages.",
      },
      {
        type: "quote",
        text: "A citizen has a right to safeguard the privacy of his own, his family, marriage, procreation, motherhood, child-bearing and education among other matters. None can publish anything concerning the above matters without his consent.",
        cite: "R. Rajagopal v. State of Tamil Nadu",
      },
      {
        type: "h2",
        text: "But privacy has limits - and so does the state's power to censor",
      },
      {
        type: "p",
        text: "Having recognised the right, the Court immediately drew its boundaries, and here it protected the press. First, it laid down a public-records exception: once a matter becomes part of the public record - including court records - privacy no longer bars its publication. Second, and more powerfully, it held that public officials cannot claim the same shield for acts done in the discharge of their duties. A citizen may criticise, comment on and expose the official conduct of those who wield public power, even if what is published is not provably true, so long as it is not published with reckless disregard for the truth. This was India's adaptation of the famous American 'actual malice' rule from New York Times v. Sullivan.",
      },
      {
        type: "p",
        text: "Most important of all, the Court refused to allow prior restraint. The state and its officials, it held, had no authority to impose a prior ban on publication of material that might defame them. Their remedy, if they were defamed, was to sue after publication - not to gag the press before it. The government cannot appoint itself the censor of what may be said about the government.",
      },
      {
        type: "h2",
        text: "Why it endures",
      },
      {
        type: "p",
        text: "Rajagopal did two things that still shape Indian law. It confirmed that privacy is a right an individual can enforce even against private publishers, not just against the state - a horizontal dimension that matters enormously in a data economy where the biggest watchers are companies. And it built a careful firewall protecting journalism and public accountability from being smothered in the name of privacy. In every modern debate about the 'right to be forgotten', about publishing leaked data, or about balancing an individual's privacy against the public's right to know, this case is the starting point.",
      },
    ],
    whyItMatters: [
      "It established that privacy can be enforced against private publishers, not just the state - key in a data economy.",
      "It carved out the public-records and public-official exceptions that keep journalism and the 'right to know' alive.",
      "Its ban on prior restraint anchors every debate about publishing data versus protecting privacy.",
    ],
    takeaways: [
      "India adopted the 'right to be let alone'; intimate life cannot be published without consent.",
      "Public records and the official conduct of public servants remain open to publication and criticism.",
      "The state cannot pre-emptively censor the press; the remedy for defamation is a suit after publication.",
    ],
    sourceUrl: "https://indiankanoon.org/doc/501107/",
    sourceLabel: "Read the full judgment on Indian Kanoon",
  },
  {
    slug: "pucl-telephone-tapping",
    title: "People's Union for Civil Liberties v. Union of India",
    shortTitle: "PUCL - Telephone Tapping",
    court: "Supreme Court of India",
    bench: "2-Judge Bench",
    citation: "(1997) 1 SCC 301",
    year: "1997",
    meta: "Phone tapping · Telegraph Act · Article 21",
    cat: "surveillance",
    question:
      "When may the state legally tap a citizen's telephone - and what stops the power from being abused in secret?",
    holding:
      "Telephone tapping violates privacy unless done under a lawful procedure. The Court laid down binding safeguards for authorising and reviewing interceptions.",
    summary: [
      {
        type: "p",
        text: "In the mid-1990s, a report by the Central Bureau of Investigation revealed that the telephones of politicians had been tapped by the government. The People's Union for Civil Liberties, a leading civil-rights organisation, seized on the disclosure and filed a public-interest petition. Its target was Section 5(2) of the Indian Telegraph Act, 1885 - a colonial-era provision that let the government intercept messages in cases of 'public emergency' or in the interest of 'public safety'. The problem was not just the breadth of the power; it was that the power operated in the dark, with no procedure, no oversight, and no way for a citizen ever to know they had been listened to.",
      },
      {
        type: "h2",
        text: "A conversation is private",
      },
      {
        type: "p",
        text: "The Court began from first principles. A telephone conversation, it held, is an exercise of the right to privacy and the right to freedom of speech. When two people speak on the phone, they are engaging in private communication, and to tap that line is to intrude upon their private lives. Telephone tapping, therefore, infringes Article 21 unless it is carried out under a procedure established by law - echoing the discipline the Constitution demands whenever the state touches life or liberty.",
      },
      {
        type: "quote",
        text: "Telephone conversation is an important facet of a man's private life. Right to privacy would certainly include telephone conversation in the privacy of one's home or office.",
        cite: "PUCL v. Union of India",
      },
      {
        type: "h2",
        text: "Reading in the safeguards",
      },
      {
        type: "p",
        text: "The Court did not strike down the interception power - it accepted that a modern state sometimes needs it. Instead, it did something more constructive: finding that the Telegraph Act contained no procedural safeguards to prevent abuse, it wrote them in. Until Parliament or the executive framed proper rules, the Court laid down its own binding guidelines governing every interception.",
      },
      {
        type: "ul",
        items: [
          "Interception orders may normally be issued only by the Union or State Home Secretary - not by junior officers.",
          "Every order must record the reasons and identify the material, addresses or persons whose communications are to be intercepted.",
          "An order lapses after two months unless renewed, and can last no longer than six months in total.",
          "Intercepted material must be used only for the minimum necessary purpose and destroyed when no longer required.",
          "A high-level Review Committee must scrutinise every interception order to confirm it complies with the law.",
        ],
      },
      {
        type: "p",
        text: "These guidelines later hardened into the interception rules under the Telegraph regime and, in updated form, into the framework that governs lawful interception under India's information-technology laws today. The case turned a naked, unaccountable power into a channelled and reviewable one.",
      },
      {
        type: "h2",
        text: "The template for lawful surveillance",
      },
      {
        type: "p",
        text: "PUCL is the ancestor of every serious argument about state surveillance in India. It established a simple but powerful idea: the state may listen, but only through a door, with a key, under a rule, and subject to review by someone other than the person doing the listening. That insistence on procedure-plus-oversight is exactly the standard critics invoke today when they scrutinise the surveillance and national-security exemptions built into the DPDP Act. When you ask whether a government body can access personal data without telling you, you are asking a PUCL question.",
      },
    ],
    whyItMatters: [
      "It set the procedural template for lawful state surveillance that the DPDP Act's security exemptions are measured against.",
      "It confirmed that private communications are protected by both privacy and free-speech rights.",
      "Its safeguards - authorisation, time limits, review committees - remain the benchmark for interception law.",
    ],
    takeaways: [
      "Telephone tapping infringes Article 21 unless conducted under a lawful, reasoned procedure.",
      "The Court read binding safeguards into the Telegraph Act: senior authorisation, time limits, and independent review.",
      "Surveillance power must be channelled and overseen - a principle central to today's data-protection debates.",
    ],
    sourceUrl: "https://indiankanoon.org/doc/31276692/",
    sourceLabel: "Read the full judgment on Indian Kanoon",
  },
  {
    slug: "mr-x-v-hospital-z",
    title: "Mr. X v. Hospital Z",
    shortTitle: "Mr X v. Hospital Z - Medical Confidentiality",
    court: "Supreme Court of India",
    bench: "2-Judge Bench",
    citation: "(1998) 8 SCC 296",
    year: "1998",
    meta: "Medical confidentiality · HIV status · Duty to disclose",
    cat: "consent",
    question:
      "Can a hospital reveal a patient's HIV-positive status to others - or does the duty of confidentiality forbid it absolutely?",
    holding:
      "Confidentiality is the rule, but it yields where disclosure protects an identifiable person from a real risk of harm - here, the patient's fiancée.",
    summary: [
      {
        type: "p",
        text: "A doctor learned that his patient - referred to in the judgment only as Mr X, to protect him - was HIV-positive. Mr X was engaged to be married. The hospital disclosed his condition, the engagement was called off, and Mr X, ostracised in his community, sued. His argument was straightforward and, on its face, compelling: a patient's medical information is confidential, the doctor-patient relationship depends on that trust, and by revealing his diagnosis the hospital had violated his right to privacy and destroyed his life.",
      },
      {
        type: "p",
        text: "The case put the principle of medical confidentiality - one of the oldest ethical commitments in the world, older than the Hippocratic oath in spirit - under real pressure. Because on the other side of the ledger stood another human being: the woman Mr X was about to marry, who would have been exposed to a life-threatening infection without ever knowing the risk.",
      },
      {
        type: "h2",
        text: "Confidentiality as a right - and its limits",
      },
      {
        type: "p",
        text: "The Supreme Court began by affirming, in strong terms, that a patient's medical condition is part of the right to privacy, and that doctors owe a duty to maintain confidentiality. This was itself an important recognition: your health data belongs, in a meaningful sense, to you, and those who hold it hold it in trust. Had the Court stopped there, it would have been a clean victory for privacy.",
      },
      {
        type: "p",
        text: "But the Court held that the duty of confidentiality is not absolute. It yields, the judges reasoned, when disclosure is necessary to protect another identifiable person from a real and serious risk. The woman Mr X intended to marry had a right to be protected against a deadly infection - and that right, the Court held, outweighed Mr X's claim to secrecy in the specific circumstances. The doctor's disclosure, made to the very person who stood to be harmed, was therefore lawful.",
      },
      {
        type: "quote",
        text: "The right of confidentiality, if any, and the right to lead a healthy life ... of the girl would stand counter-balanced. In such a situation, the doctor's duty to maintain confidentiality would yield.",
        cite: "Mr. X v. Hospital Z",
      },
      {
        type: "h2",
        text: "A carefully bounded exception",
      },
      {
        type: "p",
        text: "It is important to read the case precisely, because it is often over-stated. The Court did not say health data is fair game. It said the opposite: confidentiality is the strong default, and it can be overridden only in a narrow zone - where there is an identifiable person (not the public at large), facing a real risk of serious harm, that the disclosure is genuinely necessary to prevent. This is a proportionality judgment: the smallest disclosure, to the person who needs protection, for a compelling reason. A later clarification by the Court walked back some of its broader observations about the right to marry, keeping the focus on this tightly bounded exception.",
      },
      {
        type: "h2",
        text: "Why it matters for data protection",
      },
      {
        type: "p",
        text: "Mr X v. Hospital Z is the Indian starting point for thinking about sensitive personal data - and health data is the most sensitive of all. It establishes two ideas the DPDP framework carries forward: that certain categories of information demand heightened protection and a duty of care from whoever holds them; and that even a strong duty of confidentiality can have narrow, principled exceptions where a competing life or safety interest is at stake. Every hospital privacy policy, every conversation about when a data fiduciary may disclose without consent to protect someone from harm, lives in the shadow of this case.",
      },
    ],
    whyItMatters: [
      "It is India's foundational case on health data - the most sensitive category under any data-protection regime.",
      "It shows how a strong duty of confidentiality can carry narrow, principled exceptions to protect others from harm.",
      "It frames the balancing test that informs when a data fiduciary may disclose sensitive data without consent.",
    ],
    takeaways: [
      "A patient's medical condition is protected by the right to privacy, and doctors owe a duty of confidentiality.",
      "That duty yields only where disclosure is necessary to protect an identifiable person from a real, serious risk.",
      "The exception is narrow and proportionate - not a licence to treat health data casually.",
    ],
    sourceUrl: "https://indiankanoon.org/doc/382721/",
    sourceLabel: "Read the full judgment on Indian Kanoon",
  },
  {
    slug: "canara-bank-informational-privacy",
    title: "District Registrar & Collector, Hyderabad v. Canara Bank",
    shortTitle: "Canara Bank - Documents & Informational Privacy",
    court: "Supreme Court of India",
    bench: "2-Judge Bench",
    citation: "(2005) 1 SCC 496",
    year: "2005",
    meta: "Bank records · Search & seizure · Informational privacy",
    cat: "consent",
    question:
      "Can a state official walk into a bank and seize customers' private documents - and does privacy follow the document out of the home?",
    holding:
      "An overbroad law letting officials seize documents from banks was struck down. Privacy attaches to the person and their information, not merely to physical space.",
    summary: [
      {
        type: "p",
        text: "An amendment to the Andhra Pradesh Stamp Act gave a state official - the District Registrar or his delegate - sweeping power to enter any premises, including a bank, and inspect and seize documents in order to hunt for stamp-duty evasion. Canara Bank challenged the amendment. At stake was something that sounds technical but is not: the private financial records of ordinary bank customers, who had handed their documents to the bank in confidence and had no idea a government officer could carry them away.",
      },
      {
        type: "h2",
        text: "Privacy travels with the information",
      },
      {
        type: "p",
        text: "The most important idea in the case is a conceptual leap. The state might have argued that once you hand a document to your bank, it is no longer 'yours' - it sits in someone else's premises, so you cannot claim privacy in it. The Court rejected this decisively. Privacy, it held, attaches to the person and to the information itself, not to the place where a document happens to be stored. The customer's private papers did not shed their privacy simply because they were lodged with a bank.",
      },
      {
        type: "quote",
        text: "Once we have accepted ... that privacy is a facet of Article 21, the said right does not lose its character merely because the documents are lodged with a bank or a third party.",
        cite: "District Registrar & Collector v. Canara Bank",
      },
      {
        type: "p",
        text: "This is a startlingly modern insight for 2005, and it maps almost perfectly onto the data economy. In the digital world, almost none of our information is stored in our own homes: it sits on the servers of banks, hospitals, telecom companies and platforms. If privacy stopped at the front door, it would be worthless. By anchoring privacy to the information and the individual - a concept the Court called 'informational privacy' - this decision built the bridge from a privacy of physical spaces to a privacy of data.",
      },
      {
        type: "h2",
        text: "Why the seizure power fell",
      },
      {
        type: "p",
        text: "The Court then struck down the seizure power as unconstitutional. The vice was its lack of safeguards: the provision let an official seize documents on the basis of an unguided, unstructured discretion, with no requirement of reasonable belief, no procedural checks, and no protection for the confidentiality of third-party customers who were not even suspected of anything. A law that authorises intrusion into private information must be reasonable and must contain safeguards against arbitrary use - and this one did not. It was, in the Court's analysis, both an unreasonable restriction and a violation of privacy.",
      },
      {
        type: "h2",
        text: "The doctrinal seed of DPDP",
      },
      {
        type: "p",
        text: "Canara Bank is quietly one of the most important pre-2017 privacy cases, and Puttaswamy leaned on it heavily. Its recognition of informational privacy - the notion that you retain rights over your information even after entrusting it to a third party - is the exact premise on which modern data-protection law is built. When the DPDP Act says a Data Principal keeps rights over their personal data even though a Data Fiduciary holds and processes it, it is speaking the language this case first taught Indian law. The idea that entrusting data is not surrendering it begins here.",
      },
    ],
    whyItMatters: [
      "It established 'informational privacy' - you keep rights over data even after handing it to a third party.",
      "That premise is the foundation of the DPDP Act's Data Principal / Data Fiduciary relationship.",
      "It requires that any law permitting intrusion into personal information carry real safeguards against arbitrariness.",
    ],
    takeaways: [
      "Privacy attaches to the person and their information, not just to physical premises.",
      "Records handed to a bank or third party do not lose their privacy protection.",
      "A seizure power without safeguards or reasonable-belief checks is unconstitutional.",
    ],
    sourceUrl: "https://indiankanoon.org/doc/1068532/",
    sourceLabel: "Read the full judgment on Indian Kanoon",
  },
  {
    slug: "selvi-narco-analysis",
    title: "Selvi v. State of Karnataka",
    shortTitle: "Selvi - Narco-Analysis & Mental Privacy",
    court: "Supreme Court of India",
    bench: "3-Judge Bench",
    citation: "(2010) 7 SCC 263",
    year: "2010",
    meta: "Narco-analysis · Polygraph · Article 20(3) & 21",
    cat: "privacy",
    question:
      "Can investigators force a suspect to undergo narco-analysis, polygraph or brain-mapping tests to extract what is inside their mind?",
    holding:
      "No. Compulsory administration of these tests is unconstitutional - it violates the right against self-incrimination and a newly named right to 'mental privacy'.",
    summary: [
      {
        type: "p",
        text: "By the 2000s, Indian investigating agencies had grown fond of a trio of techniques that seemed to promise a shortcut to the truth: narco-analysis, in which a drug like sodium pentothal is injected to lower a suspect's inhibitions; the polygraph, or lie-detector; and 'brain electrical activation profiling', a form of brain-mapping. Suspects were being subjected to these tests, often without genuine consent, on the theory that the results might crack a case. A batch of appeals challenging the practice reached the Supreme Court, which had to decide whether the state may reach past a person's silence and into their mind.",
      },
      {
        type: "h2",
        text: "The right to remain silent, reimagined",
      },
      {
        type: "p",
        text: "The Court's first anchor was Article 20(3) of the Constitution - the guarantee that no person accused of an offence shall be compelled to be a witness against himself. Forcing a suspect to undergo these tests, the Court held, is a form of compulsion that extracts testimonial responses from an unwilling mind. The results are not like a fingerprint or a blood sample, which are physical and 'real' evidence; they are communications drawn from the person's mental processes. To compel them is to make the accused an involuntary witness against himself - precisely what Article 20(3) forbids.",
      },
      {
        type: "h2",
        text: "A new frontier: mental privacy",
      },
      {
        type: "p",
        text: "But the Court went further, and this is what makes Selvi remarkable. It held that these techniques also violate the right to privacy under Article 21 - and it identified a dimension of privacy that Indian law had never before named: the privacy of the mind. There is a difference, the Court said, between the state compelling a person to hand over what is in their pocket and compelling access to what is in their head. The latter is an intrusion into mental privacy - the inviolable inner space where a person's thoughts, memories and beliefs reside.",
      },
      {
        type: "quote",
        text: "We must recognise the importance of personal autonomy in aspects such as the choice between remaining silent and speaking. ... forcible interference with a person's mental processes is not provided for under any statute and it most certainly comes into conflict with the right against self-incrimination.",
        cite: "Selvi v. State of Karnataka",
      },
      {
        type: "p",
        text: "Autonomy sat at the heart of the reasoning. A person has the right to choose whether to speak or stay silent, and to control access to their own mind. A drug that dissolves that choice, or a machine that reads the body's involuntary reactions to bypass it, strips away that autonomy. The Court held that no individual may be forcibly subjected to these techniques, and that doing so would violate both the right against self-incrimination and the right to personal liberty.",
      },
      {
        type: "h2",
        text: "The narrow consent window - and its safeguards",
      },
      {
        type: "p",
        text: "The Court did not ban the tests outright; it forbade compulsion. A person may voluntarily consent to undergo a test - but the consent must be genuine, recorded before a magistrate, given after the person understands the consequences, and accompanied by access to a lawyer. And even then, any information subsequently discovered with the help of a voluntarily-taken test may be admissible, but the test results themselves cannot be treated as confessions. The safeguards are designed to ensure that 'consent' is real and not the product of custodial pressure.",
      },
      {
        type: "h2",
        text: "Why it matters now",
      },
      {
        type: "p",
        text: "Selvi's concept of mental privacy was cited approvingly in Puttaswamy and has taken on new urgency in the age of neurotechnology, emotion-recognition AI and behavioural profiling. As machines get better at inferring what we think and feel from data we did not knowingly disclose, the idea that there is an inner sanctum the state and others may not forcibly enter becomes one of the most forward-looking principles in Indian privacy law. It is a reminder that data protection is ultimately about protecting autonomy - the freedom to decide what of ourselves we reveal.",
      },
    ],
    whyItMatters: [
      "It named 'mental privacy' - a principle now vital against neurotech, profiling and inference-based data collection.",
      "It ties privacy to autonomy: the freedom to decide what of yourself you reveal, which underpins consent in the DPDP Act.",
      "It sets a high bar for genuine, informed consent - the same standard data-protection law demands.",
    ],
    takeaways: [
      "Compulsory narco-analysis, polygraph and brain-mapping tests are unconstitutional.",
      "They violate both the right against self-incrimination (Article 20(3)) and mental privacy (Article 21).",
      "Consent to such tests must be genuine, informed, lawyer-assisted and recorded before a magistrate.",
    ],
    sourceUrl: "https://indiankanoon.org/doc/1508889/",
    sourceLabel: "Read the full judgment on Indian Kanoon",
  },
  {
    slug: "shreya-singhal-section-66a",
    title: "Shreya Singhal v. Union of India",
    shortTitle: "Shreya Singhal - Striking Down Section 66A",
    court: "Supreme Court of India",
    bench: "2-Judge Bench",
    citation: "(2015) 5 SCC 1",
    year: "2015",
    meta: "Free speech online · Section 66A IT Act · Article 19(1)(a)",
    cat: "speech",
    question:
      "Can the state jail people for posting 'offensive' or 'annoying' messages online under a vaguely worded law?",
    holding:
      "No. Section 66A of the IT Act was struck down in its entirety as an unconstitutional, vague and overbroad restriction on free speech.",
    summary: [
      {
        type: "p",
        text: "It started with a Facebook post about a traffic jam. In 2012, when the city of Mumbai shut down for the funeral of a powerful political leader, a young woman posted a mild comment questioning why an entire city had to come to a halt. A friend 'liked' it. Both were arrested. Their offence: Section 66A of the Information Technology Act, which made it a crime - punishable with jail - to send, through a computer or phone, any information that was 'grossly offensive', had 'menacing character', or which the sender knew to be false but sent to cause 'annoyance', 'inconvenience', 'danger', 'insult', 'injury', 'criminal intimidation', 'enmity', 'hatred' or 'ill will'.",
      },
      {
        type: "p",
        text: "The arrests were not isolated. Across the country, people were being jailed for cartoons, for Facebook posts criticising politicians, for satirical comments. A law student, Shreya Singhal, filed a petition challenging the provision, and it became the lead case in a batch that asked the Supreme Court a defining question of the internet age: does free speech survive online?",
      },
      {
        type: "h2",
        text: "The tyranny of vague words",
      },
      {
        type: "p",
        text: "The Court's central objection was vagueness. What does 'grossly offensive' mean? What is 'annoying'? These words have no fixed legal content - what annoys one person delights another. When a criminal law is so vague that people cannot know in advance what is forbidden, it produces a 'chilling effect': people fall silent, censoring themselves rather than risk arrest over words that some official might, after the fact, decide were offensive. The Court held that Section 66A was hopelessly, unconstitutionally vague and overbroad, sweeping up vast amounts of protected speech in its net.",
      },
      {
        type: "quote",
        text: "Section 66A is cast so widely that virtually any opinion on any subject would be covered by it ... Any serious opinion dissenting with the mores of the day would be caught within its net.",
        cite: "Shreya Singhal v. Union of India",
      },
      {
        type: "h2",
        text: "Discussion, advocacy, incitement",
      },
      {
        type: "p",
        text: "The Court drew a bright and enduring line. There are, it said, three stages in speech: discussion, advocacy and incitement. The Constitution protects discussion and even advocacy, however unpopular; only when speech crosses into incitement - a direct spur to imminent lawless action or public disorder - may the state restrict it. Section 66A ignored this distinction entirely, criminalising annoyance and offence, which are nowhere among the narrow, specific grounds on which Article 19(2) permits speech to be curtailed. Causing annoyance is not a ground to jail someone.",
      },
      {
        type: "p",
        text: "The Court struck down Section 66A in its entirety - a complete and unqualified victory for free speech, and one of the rare instances where the Supreme Court has voided a speech-restricting statute root and branch. It also read down Section 79 and the intermediary rules, holding that online platforms need only take down content when ordered by a court or a proper government authority, not on the say-so of any private complainant - an early and crucial protection for the open internet.",
      },
      {
        type: "h2",
        text: "The privacy and data connection",
      },
      {
        type: "p",
        text: "Why does a free-speech case belong in a privacy library? Because privacy and free expression are two sides of one coin - both are guarantees of individual autonomy against overbearing power, and both depend on the citizen being free from the fear of being watched and punished. A person who knows their online words can be criminalised will also self-censor; a person who knows their data is being harvested to profile and target them loses the same freedom. Shreya Singhal is the great charter of digital liberty in India, and it stands beside Puttaswamy as proof that the Constitution follows the citizen online. The DPDP Act's protections for personal data and this case's protection for personal expression are branches of the same tree: the autonomy of the individual in the digital age.",
      },
    ],
    whyItMatters: [
      "It is the foundational free-speech judgment for the Indian internet, a companion to Puttaswamy's privacy ruling.",
      "It shows how vague laws chill autonomy - the same concern that drives clear-purpose and notice rules in the DPDP Act.",
      "Its limits on intermediary takedowns shaped how platforms handle user content and data-linked speech.",
    ],
    takeaways: [
      "Section 66A was struck down entirely as vague and overbroad - 'offensive' and 'annoying' are not valid grounds to jail.",
      "Only incitement, not discussion or advocacy, can be restricted under Article 19(2).",
      "Platforms must remove content only on a court or authorised government order, not any private demand.",
    ],
    sourceUrl: "https://indiankanoon.org/doc/110813550/",
    sourceLabel: "Read the full judgment on Indian Kanoon",
  },
  {
    slug: "navtej-johar-section-377",
    title: "Navtej Singh Johar v. Union of India",
    shortTitle: "Navtej Johar - Decriminalising Section 377",
    court: "Supreme Court of India",
    bench: "5-Judge Constitution Bench",
    citation: "(2018) 10 SCC 1",
    year: "2018",
    meta: "Sexual autonomy · Dignity · Articles 14, 15, 21",
    cat: "privacy",
    question:
      "Can the state criminalise consensual intimacy between adults of the same sex - or is whom you love a matter of private, constitutional autonomy?",
    holding:
      "Section 377 was read down to decriminalise consensual same-sex relations. Privacy, dignity and autonomy protect the most intimate of personal choices.",
    summary: [
      {
        type: "p",
        text: "For over 150 years, a single sentence written by a colonial draftsman had criminalised the private lives of millions of Indians. Section 377 of the Indian Penal Code, enacted in 1861, punished 'carnal intercourse against the order of nature' - language used, in practice, to make criminals of gay, lesbian, bisexual and transgender people simply for being who they were and loving whom they loved. In 2018, a five-judge Constitution Bench of the Supreme Court finally confronted the provision head-on, in a petition brought by the dancer Navtej Singh Johar and others whose own lives the law had shadowed.",
      },
      {
        type: "p",
        text: "The road here had been long and painful. The Delhi High Court had struck the provision down in 2009, only for the Supreme Court to reinstate it in 2013 in the Koushal case, dismissively describing LGBTQ Indians as a 'minuscule minority' whose rights were 'so-called'. But in 2017, the nine-judge Puttaswamy Bench had gone out of its way to disapprove of that reasoning. The stage was set for a reckoning.",
      },
      {
        type: "h2",
        text: "Privacy as the freedom to be",
      },
      {
        type: "p",
        text: "The Court's reasoning drew directly on the privacy foundation laid the year before. Puttaswamy had recognised a 'privacy of choice' - the freedom to make intimate decisions about family, marriage, procreation and sexual orientation. Section 377, by criminalising the most private expression of identity, struck at the very core of that zone. Sexual orientation, the Court held, is an innate and essential attribute of personhood; to punish it is to deny a person the right to define and express their own identity, the deepest form of the right to be let alone.",
      },
      {
        type: "quote",
        text: "The right to privacy enables an individual to exercise his or her autonomy, away from the glare of societal expectations. ... The ability to make decisions on matters close to one's life is an inviolable aspect of the human personality.",
        cite: "Navtej Singh Johar v. Union of India",
      },
      {
        type: "h2",
        text: "Dignity, equality and the tyranny of the majority",
      },
      {
        type: "p",
        text: "The four concurring opinions wove together several constitutional threads. Under Article 14, the Court found the provision arbitrary - it served no legitimate purpose and irrationally targeted a class of people for their identity. Under Article 15, which forbids discrimination on grounds of 'sex', the Court read the guarantee to include sexual orientation. And under Article 21, it grounded the decision in dignity and autonomy: constitutional morality, not the shifting tides of popular or 'social' morality, must govern fundamental rights. The Court was emphatic that majoritarian views cannot dictate the scope of a minority's constitutional freedoms.",
      },
      {
        type: "p",
        text: "In a moment of institutional humility, the Court expressly overruled Koushal and apologised, in effect, for the wrong that the law and its earlier judgment had done. Chief Justice Dipak Misra wrote that history owed an apology to members of the community for the delay in securing their rights. Section 377 was read down so that it no longer applied to consensual acts between adults, while remaining in force for non-consensual acts and offences against children and animals.",
      },
      {
        type: "h2",
        text: "Why it belongs in a data-protection story",
      },
      {
        type: "p",
        text: "Navtej Johar is the most human demonstration of what privacy is really for. It is not, at bottom, about hiding information - it is about autonomy, the freedom to make the choices that define a life without fear of state punishment or social exposure. That is exactly the value the DPDP Act protects in the data context: the right to control what is known about you, and to not be reduced to a profile or a category by those with power over your information. When the DPDP framework treats data revealing sexual orientation or health as demanding the highest care, it is protecting the same dignity this case vindicated. Navtej Johar is the emotional and constitutional heart of Indian privacy: the principle that some choices are simply, inviolably, your own.",
      },
    ],
    whyItMatters: [
      "It is the clearest statement that privacy protects autonomy and identity - the human core of data protection.",
      "It shows why data revealing sexual orientation is treated as demanding the highest protection.",
      "It confirms that constitutional morality, not majority opinion, defines the limits of personal freedom.",
    ],
    takeaways: [
      "Section 377 was read down to decriminalise consensual same-sex relations between adults.",
      "Privacy includes decisional autonomy - the freedom to make intimate choices about identity and love.",
      "The Court overruled Koushal, holding that majority morality cannot override a minority's fundamental rights.",
    ],
    sourceUrl: "https://indiankanoon.org/doc/168671544/",
    sourceLabel: "Read the full judgment on Indian Kanoon",
  },
];

export const FEATURED_CASE: CaseEntry =
  CASES.find((c) => c.featured) ?? CASES[0];

export function getCase(slug: string): CaseEntry | undefined {
  return CASES.find((c) => c.slug === slug);
}
