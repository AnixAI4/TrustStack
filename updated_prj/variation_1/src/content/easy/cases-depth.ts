import { CASES, type CaseBlock } from "../cases";

type EasyCase = {
  question: string;
  holding: string;
  summary: string[];
  whyItMatters: string[];
  takeaways: string[];
};

const EASY_CASES: Record<string, EasyCase> = {
  "puttaswamy-right-to-privacy": {
    question:
      "Is privacy a fundamental right under the Indian Constitution, or only a common-law interest that the state can override whenever it wants?",
    holding:
      "Yes. All nine judges held that privacy is a basic part of life, liberty and dignity under Article 21. It also runs through all of Part III of the Constitution.",
    summary: [
      "The case began with a 91-year-old retired judge and a national ID card. Justice K.S. Puttaswamy, a former Karnataka High Court judge, challenged the Aadhaar programme. He said that collecting the fingerprints and iris scans of a billion people, then linking them to services from bank accounts to school lunches, invaded privacy. The Union government gave a blunt answer: it said the Indian Constitution contains no fundamental right to privacy.",
      "The government based its argument on two old Supreme Court rulings: M.P. Sharma (1954), decided by eight judges, and Kharak Singh (1962), decided by six. Only a larger Bench could overrule them. The Chief Justice therefore formed a nine-judge Bench. The judges had to answer one basic question: does an Indian citizen have a constitutional right to be left alone?",
      "The deeper question",
      "Privacy is hard to define. It includes a diary kept from family, a phone call the state does not hear, a medical diagnosis hidden from an employer, the choice of whom to love, and the freedom to be forgotten by a search engine. The government used this difficulty in its argument. It said privacy was too unclear for courts to enforce and should be left to Parliament. It also said that concerns about data should not block welfare in a country with widespread poverty.",
      "The Bench rejected that view. It held that privacy is not a luxury for the rich. A poor person has the same interest in control over their body, freedom from surveillance and private choices as a rich person. Privacy is not the only right that needs case-by-case meaning. Courts also do this for liberty and equality. That is part of deciding constitutional cases.",
      "What the Court decided",
      "The judges wrote six opinions covering more than five hundred pages, but all nine agreed on the result. Privacy is a fundamental right. It is protected not because one clause names it, but because it is a basic part of rights that the Constitution does name. It comes from life and personal liberty under Article 21. It also runs through speech, movement and conscience under Article 19, and equality under Article 14. The Court repeatedly said that human dignity is at its centre.",
      "Privacy is at the centre of human dignity under the Constitution. It is needed before a person can fully enjoy any guarantee in Part III.",
      "Justice D.Y. Chandrachud, for the plurality",
      "The Court described three connected areas of privacy: the body and home; personal information, including the data trail created by each transaction; and personal choice, including decisions about family, marriage, having children and sexual orientation. It clearly recognised privacy over personal information as an urgent right in the digital age. It also called on Parliament to pass a data-protection law.",
      "The right has limits",
      "The judges made clear that privacy is fundamental but not absolute. The state may interfere only if it passes a strict test. A law must allow the interference. The law must pursue a legitimate state aim. The interference must also be proportionate: it must be carefully limited to what is needed for that aim. This test of legality, legitimacy and proportionality still guides courts today.",
      "The Bench also corrected important past errors. It overruled M.P. Sharma and the majority ruling in Kharak Singh where they denied a right to privacy. It rejected the reasoning in Koushal, the 2013 ruling that had again made gay sex a crime. It said LGBTQ Indians have real fundamental rights, not 'so-called rights'. This helped lead to the decriminalisation of Section 377 one year later.",
      "Why it still matters",
      "Puttaswamy is the constitutional base of India's data-protection law. Parliament passed the Digital Personal Data Protection Act in 2023 after this Bench called for such a law. Rules about permission, using data only for its stated purpose, collecting only what is needed, and the rights of a Data Principal all come from the judges' focus on dignity. This is the central case in Indian privacy law.",
    ],
    whyItMatters: [
      "It is the constitutional basis of the DPDP Act, 2023. It explains why India needs a data-protection law.",
      "It created the legality, legitimacy and proportionality test for every state use of personal data.",
      "It clearly recognised privacy over personal information as a separate right for the digital age and told Parliament to make a law.",
    ],
    takeaways: [
      "All nine judges agreed that privacy is a fundamental right and a basic part of dignity under Article 21.",
      "Privacy is not absolute. Any interference needs a valid law, a legitimate aim and proportionate means.",
      "The ruling overruled M.P. Sharma and Kharak Singh. It also helped lead to decriminalising Section 377 and passing the DPDP Act.",
    ],
  },
  "kharak-singh-surveillance": {
    question:
      "Can police keep a man under permanent watch by visiting his home at night, tracking him and keeping a file, only because they suspect him?",
    holding:
      "The Court struck down night-time visits to his home as unconstitutional. But the majority denied a general right to privacy. Puttaswamy later overruled that part of the ruling.",
    summary: [
      "Kharak Singh was charged in a robbery case and then released because the charge was not proved. Uttar Pradesh police still opened a 'history sheet' on him under the state Police Regulations and put him under 'surveillance'. Officers knocked on his door at night and woke him to check that he was home. They followed him and asked about him wherever he went.",
      "Kharak Singh told the Supreme Court that this constant watching violated his freedom of movement under Article 19 and personal liberty under Article 21. For the first time, the Court had to ask how much the state may watch a citizen who has not been convicted of anything.",
      "A knock at night",
      "The Court's clearest ruling was about the night visits. The judges said that entering a man's home and disturbing his sleep invaded the home, 'the last refuge of a citizen'. They relied on the old idea that a person's home is their castle. The majority struck down the rule allowing these visits because it violated personal liberty under Article 21. Kharak Singh won on this point.",
      "Personal liberty means freedom from direct limits on a person's body and from indirect limits created by planned government action.",
      "Kharak Singh v. State of U.P.",
      "What the majority missed",
      "The majority allowed the rest of the surveillance, including following him, making inquiries and keeping the history sheet. It said the Constitution does not use the word 'privacy', so there was no fundamental right to privacy that these milder actions could violate. In its view, watching did not restrict his body and therefore did not affect his liberty.",
      "Justice Subba Rao disagreed, and history later proved him right. He said mental pressure can also limit freedom. A person who knows they are always watched is not truly free, even if no one touches them. He said privacy was an essential part of personal liberty even though the Constitution did not name it.",
      "The lasting effect of the disagreement",
      "For decades, governments used the majority ruling in Kharak Singh to argue that no right to privacy existed. In 2017, a nine-judge Bench was needed because only a larger Bench could overrule the six judges in this case. Puttaswamy overruled the majority and accepted Justice Subba Rao's dissent as the correct law. His losing view in 1962 became the law decades later.",
      "Today, Kharak Singh shows the harm caused by constant watching. Surveillance can limit the mind without touching the body. Striking down night visits was an early defence of the home. The majority's error about privacy later helped drive the development of modern Indian privacy law.",
    ],
    whyItMatters: [
      "It began the debate about surveillance and liberty that still affects the DPDP Act and its exceptions.",
      "Puttaswamy clearly overruled the majority's denial of privacy. The 2017 ruling cannot be fully understood without this 1962 case.",
      "Justice Subba Rao's view that the mental pressure of surveillance limits liberty is now accepted law.",
    ],
    takeaways: [
      "The Court struck down police visits at night because they violated personal liberty and the privacy of the home.",
      "The majority wrongly said there was no right to privacy. Puttaswamy (2017) later overruled this.",
      "Justice Subba Rao said privacy is a basic part of liberty. Courts accepted his view decades later.",
    ],
  },
  "gobind-privacy-zone": {
    question:
      "If the Constitution protects a 'zone of privacy', how strong must the state's reason be before police may watch a suspect?",
    holding:
      "For the first time, the Court accepted a limited right to privacy. It held that only a 'compelling state interest' can outweigh it. This was an early proportionality test.",
    summary: [
      "Gobind was treated as a repeat offender in Madhya Pradesh. State police rules allowed surveillance like that challenged in Kharak Singh, including home visits, guards and tracking. He said this watching violated his fundamental rights. By 1975, the law was changing. The three-judge Bench took an important step that earlier judges had refused to take.",
      "Learning from other countries",
      "Justice K.K. Mathew looked at recent privacy rulings from the United States, including Griswold, about a married couple's use of contraception, and Roe. Those cases said that several constitutional rights together protect private life from state interference. He concluded that India's Constitution also protects a zone of privacy. It includes family, marriage, having children, motherhood, childbirth and education.",
      "Courts must carefully examine claims based on privacy and dignity. They should reject them only when a more important competing interest is shown.",
      "Justice K.K. Mathew in Gobind",
      "Only a compelling interest can outweigh the right",
      "This was the case's main contribution. Justice Mathew said privacy exists but can be outweighed. The state may interfere only for a 'compelling state interest', and the law must be narrowly written. This was an early form of the proportionality test that Puttaswamy formally adopted forty-two years later. It gave courts a structured way to balance a person's rights against the state's needs.",
      "The Court then applied this test carefully. It read the surveillance rules narrowly. They could cover only genuine, serious offenders where there was a real threat to public order. With those limits, the Court upheld the rules. Gobind stayed on the watch list, but the legal rule announced by the case mattered more than his result.",
      "The case that connected two eras",
      "Gobind connects Kharak Singh's denial of privacy with Puttaswamy's full recognition of it. The Court was careful and said privacy would develop case by case and was not absolute. But it established two key ideas: Article 21 contains a zone of privacy, and the state needs a compelling reason and a narrowly written law to enter it.",
      "When the nine-judge Puttaswamy Bench later reviewed the history of Indian privacy law, Gobind marked the first clear acceptance of a constitutional privacy right that the text does not name. It is the turning point between having no privacy right against the state and having rights over one's own data.",
    ],
    whyItMatters: [
      "It first recognised a constitutional 'zone of privacy' under Article 21. This idea led directly to rights under the DPDP Act.",
      "The 'compelling state interest' rule is an early form of the proportionality test now central to data law.",
      "It connects Kharak Singh's denial of privacy with Puttaswamy's acceptance of it.",
    ],
    takeaways: [
      "This was the first Indian case to accept a limited right to privacy covering family, marriage and having children.",
      "Only a 'compelling state interest' under a narrowly written law could override privacy.",
      "Its reasoning prepared the way for the proportionality test later adopted in Puttaswamy.",
    ],
  },
  "rajagopal-auto-shankar": {
    question:
      "Can the state stop a magazine from publishing a prisoner's autobiography before publication? Who controls the story of a person's life?",
    holding:
      "The state could not block publication in advance. The Court recognised a 'right to be let alone', but held that public records and the official work of public servants may be published.",
    summary: [
      "Auto Shankar was a Tamil Nadu auto-rickshaw driver who became a serial killer. He was convicted of six murders and sentenced to death. On death row, he wrote an autobiography. He claimed it described links with senior police and prison officials who, he said, helped with his crimes. The Tamil weekly Nakkheeran, edited by R. Rajagopal, planned to publish it in parts. Before publication, prison officials and the state tried to stop it. They said Shankar had rejected the manuscript and that it would defame the named officials.",
      "The magazine went to the Supreme Court. The case balanced freedom of the press against the right of people, including public officials, to keep their private lives out of print. It was the first Indian ruling to closely examine the conflict between privacy and free speech.",
      "The right to be left alone",
      "Justice B.P. Jeevan Reddy used American and English law to accept privacy as 'the right to be let alone' in India. He held that a citizen may protect private matters involving their own life, family, marriage, having children, motherhood, childbirth and education. No one may publish these intimate details without permission. A publisher who does so may have to pay damages.",
      "A citizen may protect private matters involving their own life, family, marriage, having children, motherhood, childbirth and education. No one may publish these matters without permission.",
      "R. Rajagopal v. State of Tamil Nadu",
      "Privacy has limits, and so does state censorship",
      "The Court set limits on privacy and protected the press. First, privacy normally cannot block publication of information already in public records, including court records. Second, public officials cannot use the same privacy shield for acts done as part of their jobs. People may criticise and report on official conduct, even when every statement cannot be proved true, unless it is published with reckless disregard for truth. This adapted the American 'actual malice' rule from New York Times v. Sullivan.",
      "Most importantly, the Court refused to allow a ban before publication. The state and its officials had no power to stop material in advance because it might defame them. If defamed, they could sue after publication. The government cannot decide in advance what may be said about it.",
      "Why it remains important",
      "Rajagopal still shapes Indian law in two ways. It confirmed that a person can enforce privacy against a private publisher, not only against the state. This matters when companies hold large amounts of data. It also protected journalism and public accountability from broad privacy claims. The case remains the starting point for debates about the 'right to be forgotten', leaked data and the balance between privacy and the public's right to know.",
    ],
    whyItMatters: [
      "It established that privacy can be enforced against private publishers, not only against the state. This is important in a data economy.",
      "Its exceptions for public records and official conduct protect journalism and the public's right to know.",
      "Its ban on stopping publication in advance guides disputes between publishing data and protecting privacy.",
    ],
    takeaways: [
      "India accepted the 'right to be let alone'. Intimate parts of life cannot be published without permission.",
      "Public records and the official conduct of public servants may still be published and criticised.",
      "The state cannot censor the press in advance. A person who is defamed may sue after publication.",
    ],
  },
  "pucl-telephone-tapping": {
    question:
      "When may the state legally tap a citizen's phone, and what prevents secret abuse of this power?",
    holding:
      "Phone tapping violates privacy unless it follows a lawful process. The Court set binding safeguards for approving and reviewing interceptions.",
    summary: [
      "In the mid-1990s, a Central Bureau of Investigation report showed that the government had tapped politicians' phones. The People's Union for Civil Liberties filed a public-interest case. It challenged Section 5(2) of the Indian Telegraph Act, 1885. This colonial law allowed interception during a 'public emergency' or for 'public safety'. The power was broad and secret. There was no clear process, oversight or way for a citizen to know that the state had listened.",
      "A phone call is private",
      "The Court started with basic rights. A phone conversation is an exercise of privacy and free speech. Two people speaking by phone are communicating privately. Tapping the line enters their private lives. Phone tapping therefore violates Article 21 unless it follows a procedure established by law, as the Constitution requires whenever the state limits life or liberty.",
      "A phone conversation is an important part of private life. The right to privacy includes calls made from a person's home or office.",
      "PUCL v. Union of India",
      "Adding safeguards to the law",
      "The Court did not cancel the interception power because it accepted that the state sometimes needs it. Instead, it found that the Telegraph Act lacked safeguards and added them. These binding rules applied to every interception until Parliament or the government made proper rules.",
      "Normally, only the Union or State Home Secretary may issue an interception order, not a junior officer.",
      "Each order must give reasons and identify the material, addresses or people whose communications will be intercepted.",
      "An order ends after two months unless renewed. It may last no more than six months in total.",
      "Intercepted material may be used only as much as needed and must be destroyed when it is no longer needed.",
      "A senior Review Committee must examine every interception order and check that it follows the law.",
      "These safeguards later became rules under the Telegraph law. Updated versions now guide lawful interception under India's information-technology laws. The case turned an unchecked power into one with limits and review.",
      "The model for lawful surveillance",
      "PUCL guides modern arguments about state surveillance in India. It established a simple rule: the state may listen only under a legal rule, through a set process and with independent review. Critics use this standard when examining surveillance and national-security exceptions in the DPDP Act. Questions about government access to personal data without notice are still PUCL questions.",
    ],
    whyItMatters: [
      "It set the process for lawful state surveillance used to judge the DPDP Act's security exceptions.",
      "It confirmed that privacy and free-speech rights both protect private communications.",
      "Its safeguards, including senior approval, time limits and review committees, remain the standard for interception law.",
    ],
    takeaways: [
      "Phone tapping violates Article 21 unless it follows a lawful process with recorded reasons.",
      "The Court added binding safeguards to the Telegraph Act, including senior approval, time limits and independent review.",
      "Surveillance powers need clear limits and oversight. This rule remains central to data-protection debates.",
    ],
  },
  "mr-x-v-hospital-z": {
    question:
      "Can a hospital reveal that a patient has HIV, or does its duty to keep medical information private always prevent disclosure?",
    holding:
      "Keeping medical information private is the rule. But disclosure is allowed when needed to protect a known person from a real risk of harm. Here, that person was the patient's fiancée.",
    summary: [
      "A doctor learned that a patient, called Mr X in the judgment to protect his identity, had HIV. Mr X was engaged to marry. The hospital disclosed his condition, the engagement ended and his community rejected him. Mr X sued. He said medical information is private, trust is essential between a doctor and patient, and the disclosure violated his privacy and ruined his life.",
      "The case put medical confidentiality under serious pressure. On the other side was the woman Mr X planned to marry. Without disclosure, she would have faced a life-threatening infection without knowing the risk.",
      "Medical confidentiality is a right, but it has limits",
      "The Supreme Court strongly confirmed that a patient's medical condition is protected by privacy and that doctors must keep it confidential. Health data belongs in an important sense to the patient. People who hold it must protect it. If the Court had stopped there, privacy would have won completely.",
      "But the Court held that confidentiality is not absolute. It can give way when disclosure is needed to protect a known person from a real and serious risk. The woman Mr X planned to marry had a right to protection from a deadly infection. In these facts, that right outweighed his claim to secrecy. Disclosure to the person at risk was lawful.",
      "The patient's claim to confidentiality and the girl's right to a healthy life had to be balanced. In this situation, the doctor's duty to keep the information private had to give way.",
      "Mr. X v. Hospital Z",
      "A narrow exception",
      "The ruling must be read carefully. It did not make health data open to anyone. Confidentiality remains the strong rule. It may be overridden only when a known person, not the general public, faces a real risk of serious harm and disclosure is truly needed to prevent it. The disclosure must be limited to the person needing protection and made for that strong reason. The Court later withdrew some wider comments about the right to marry, leaving this narrow exception in place.",
      "Why it matters for data protection",
      "Mr X v. Hospital Z is an early Indian case about highly sensitive personal data. It established two ideas also found in the DPDP system. Some information needs stronger protection and care from whoever holds it. Even a strong duty of confidentiality can have a narrow exception when another person's life or safety is at real risk. The case still guides when an organisation responsible for data may disclose sensitive data without permission to prevent harm.",
    ],
    whyItMatters: [
      "It is India's main early case on health data, one of the most sensitive kinds of personal data.",
      "It shows that a strong duty to keep information private can have narrow, principled exceptions to prevent harm to another person.",
      "It provides a balancing test for when the organisation responsible for data may disclose sensitive data without permission.",
    ],
    takeaways: [
      "Privacy protects a patient's medical condition, and doctors must keep it confidential.",
      "That duty gives way only when disclosure is needed to protect a known person from a real and serious risk.",
      "The exception is narrow and proportionate. It does not allow careless use of health data.",
    ],
  },
  "canara-bank-informational-privacy": {
    question:
      "Can a state official enter a bank and seize customers' private documents? Does privacy stay with a document outside the home?",
    holding:
      "The Court struck down an overly broad law that let officials seize bank documents. Privacy protects a person and their information, not only a physical place.",
    summary: [
      "A change to the Andhra Pradesh Stamp Act gave the District Registrar or a delegate broad power to enter any property, including a bank, and inspect and seize documents while looking for unpaid stamp duty. Canara Bank challenged the change. The case concerned ordinary customers' private financial records. They had trusted the bank with those documents and did not know a government officer could take them.",
      "Privacy stays with the information",
      "The case made an important change in how privacy was understood. The state could have claimed that a document was no longer private after a customer gave it to a bank because it was stored elsewhere. The Court firmly rejected this. Privacy protects the person and the information, not only the place where a document is kept. Private papers do not lose protection because they are held by a bank.",
      "Once privacy is accepted as part of Article 21, it does not lose that protection only because documents are held by a bank or another person.",
      "District Registrar & Collector v. Canara Bank",
      "This idea was very modern in 2005 and fits today's data economy. Most digital information is stored outside our homes on the servers of banks, hospitals, phone companies and online platforms. Privacy would mean little if it ended at the front door. The ruling tied privacy to the person and the information. The Court called this 'informational privacy'. It connected privacy in physical places with privacy over data.",
      "Why the seizure power was invalid",
      "The Court struck down the seizure power as unconstitutional because it lacked safeguards. An official had uncontrolled power to seize documents. The law did not require a reasonable belief, provide process checks or protect customers who were not suspected of anything. A law that allows access to private information must be reasonable and prevent arbitrary use. This law did neither, so it unreasonably limited rights and violated privacy.",
      "The legal beginning of DPDP",
      "Canara Bank is an important privacy case from before 2017, and Puttaswamy relied on it. It recognised that people keep rights over their information after giving it to someone else. Modern data-protection law rests on this idea. Under the DPDP Act, a Data Principal keeps rights over personal data held and used by a Data Fiduciary. Giving someone data is not the same as giving up all rights to it.",
    ],
    whyItMatters: [
      "It established 'informational privacy': people keep rights over data after giving it to someone else.",
      "That idea supports the DPDP Act's relationship between a Data Principal and a Data Fiduciary.",
      "Any law allowing access to personal information must have real safeguards against arbitrary use.",
    ],
    takeaways: [
      "Privacy protects people and their information, not only homes or other physical places.",
      "Records do not lose privacy protection when they are given to a bank or another person.",
      "A power to seize records without safeguards or a reasonable-belief check is unconstitutional.",
    ],
  },
  "selvi-narco-analysis": {
    question:
      "Can investigators force a suspect to take narco-analysis, polygraph or brain-mapping tests to extract information from their mind?",
    holding:
      "No. Forcing these tests is unconstitutional. It violates the right against self-incrimination and the right to 'mental privacy'.",
    summary: [
      "By the 2000s, Indian investigators often used three methods that seemed to offer a shortcut to the truth. Narco-analysis uses a drug such as sodium pentothal to lower a suspect's control. A polygraph is a lie-detector test. Brain electrical activation profiling is a type of brain-mapping. Suspects often took these tests without real permission. Several appeals reached the Supreme Court, which had to decide whether the state may go past a person's silence and enter their mind.",
      "A new view of the right to remain silent",
      "The Court first relied on Article 20(3), which says an accused person cannot be forced to be a witness against themselves. These tests force spoken or mental responses from a person who does not agree. The results are different from fingerprints or blood samples, which are physical evidence. They are communications taken from mental processes. Forcing them makes the accused an unwilling witness against themselves, which Article 20(3) forbids.",
      "A new boundary: mental privacy",
      "The Court went further. It held that these methods also violate privacy under Article 21 and named a new part of privacy: privacy of the mind. Making a person hand over an item from a pocket is different from forcing access to thoughts. The second act enters mental privacy, the protected inner space holding thoughts, memories and beliefs.",
      "People must be free to choose between silence and speech. No law allows forced interference with mental processes, and it conflicts with the right against self-incrimination.",
      "Selvi v. State of Karnataka",
      "Personal choice was central to the ruling. A person may choose whether to speak or remain silent and may control access to their mind. A drug that removes this choice, or a machine that uses involuntary body reactions to bypass it, removes that control. No person may be forced to take these tests. Doing so violates both the right against self-incrimination and personal liberty.",
      "The narrow option to agree, with safeguards",
      "The Court did not ban every test. It banned forced tests. A person may freely agree, but the permission must be real and recorded before a magistrate after the person understands the results and has access to a lawyer. Information later found with help from a voluntary test may be used as evidence, but the test results cannot themselves be treated as confessions. These safeguards help make sure permission is not caused by pressure in custody.",
      "Why it matters now",
      "Puttaswamy approved Selvi's idea of mental privacy. It is even more important with brain technology, emotion-recognition AI and behaviour profiling. Machines can now infer thoughts and feelings from data people did not knowingly share. The rule protects an inner area that the state and others cannot force open. Data protection is ultimately about personal choice: each person decides what to reveal about themselves.",
    ],
    whyItMatters: [
      "It named 'mental privacy', which now protects against brain technology, profiling and data-based inferences.",
      "It links privacy to personal choice: deciding what to reveal about yourself. This supports permission under the DPDP Act.",
      "It requires real and informed permission, the same high standard used in data-protection law.",
    ],
    takeaways: [
      "Forced narco-analysis, polygraph and brain-mapping tests are unconstitutional.",
      "They violate the right against self-incrimination under Article 20(3) and mental privacy under Article 21.",
      "Permission for these tests must be real, informed, supported by a lawyer and recorded before a magistrate.",
    ],
  },
  "shreya-singhal-section-66a": {
    question:
      "Can the state jail people for posting 'offensive' or 'annoying' online messages under a law with unclear words?",
    holding:
      "No. The Court struck down all of Section 66A of the IT Act because it was an unconstitutional, vague and overly broad limit on free speech.",
    summary: [
      "The case began with a Facebook post about a traffic jam. In 2012, Mumbai closed down for a powerful political leader's funeral. A young woman posted a mild question about why the whole city had to stop. A friend 'liked' it. Police arrested both under Section 66A of the Information Technology Act. That section allowed jail for sending computer or phone information that was 'grossly offensive', 'menacing', false and meant to cause 'annoyance', 'inconvenience', 'danger', 'insult', 'injury', 'criminal intimidation', 'enmity', 'hatred' or 'ill will'.",
      "These were not the only arrests. Across India, people were jailed for cartoons, political Facebook posts and satire. Law student Shreya Singhal challenged the section. Her case led a group of cases asking whether free speech is protected online.",
      "The danger of unclear words",
      "The Court's main concern was that the law was vague. Words such as 'grossly offensive' and 'annoying' have no fixed legal meaning. Something that annoys one person may please another. If people cannot know what a criminal law forbids, it has a 'chilling effect'. They stay silent rather than risk arrest based on an official's later opinion. The Court held that Section 66A was unconstitutionally vague and overly broad. It covered a large amount of protected speech.",
      "Section 66A was so broad that it could cover almost any opinion. Any serious view that went against common beliefs at the time could be caught by it.",
      "Shreya Singhal v. Union of India",
      "Discussion, support and calls to act",
      "The Court drew a clear line between discussion, advocacy and incitement. The Constitution protects discussion and support for an idea, even when unpopular. The state may act only when speech becomes incitement, meaning a direct push toward immediate illegal action or public disorder. Section 66A ignored this difference. It made annoyance and offence crimes, though Article 19(2) does not list them among the limited reasons for restricting speech. Annoying someone is not a reason for jail.",
      "The Court struck down all of Section 66A. This was a complete victory for free speech and a rare case where the Supreme Court removed an entire law restricting speech. It also limited Section 79 and the rules for online platforms. A platform must remove content only after an order from a court or proper government authority, not merely because a private person demands it. This was an important early protection for the open internet.",
      "The link to privacy and data",
      "A free-speech case belongs in a privacy library because privacy and expression both protect personal choice from excessive power. Fear of punishment for online speech makes people censor themselves. Data collection used to profile and target people can reduce the same freedom. Shreya Singhal is a central ruling on digital liberty, alongside Puttaswamy. Together they show that constitutional rights continue online. The DPDP Act protects personal data, while this case protects personal expression. Both protect individual choice in the digital age.",
    ],
    whyItMatters: [
      "It is the main Indian ruling on free speech online and works alongside Puttaswamy's privacy ruling.",
      "It shows how vague laws make people afraid to use their freedom. The same concern supports clear purpose and information rules in the DPDP Act.",
      "Its limits on platform takedowns shaped how online services handle user content and speech linked to data.",
    ],
    takeaways: [
      "The Court struck down all of Section 66A because it was vague and overly broad. Being 'offensive' or 'annoying' is not a valid reason for jail.",
      "Article 19(2) allows limits on incitement, not on discussion or support for an idea.",
      "Platforms must remove content only after a court or authorised government order, not any private demand.",
    ],
  },
  "navtej-johar-section-377": {
    question:
      "Can the state make consensual intimacy between same-sex adults a crime, or does the Constitution protect the private choice of whom a person loves?",
    holding:
      "The Court limited Section 377 so it no longer criminalised consensual same-sex relations. Privacy, dignity and personal choice protect intimate decisions.",
    summary: [
      "For more than 150 years, a colonial law made criminals of millions of Indians in their private lives. Section 377 of the Indian Penal Code, passed in 1861, punished 'carnal intercourse against the order of nature'. In practice, it was used against gay, lesbian, bisexual and transgender people because of who they were and whom they loved. In 2018, five Supreme Court judges directly reviewed the law in a case brought by dancer Navtej Singh Johar and others affected by it.",
      "The path to the case was long. The Delhi High Court struck down the rule in 2009. The Supreme Court restored it in the 2013 Koushal case, calling LGBTQ Indians a 'minuscule minority' with 'so-called' rights. In 2017, the nine-judge Puttaswamy Bench clearly rejected that reasoning. This prepared the way for a new decision.",
      "Privacy includes freedom to be yourself",
      "The Court relied directly on Puttaswamy, which recognised 'privacy of choice'. This is freedom to make intimate decisions about family, marriage, having children and sexual orientation. Section 377 made the most private expression of identity a crime and therefore struck at the centre of this freedom. The Court held that sexual orientation is an inborn and essential part of a person. Punishing it denies the right to define and express one's identity, a deep part of the right to be left alone.",
      "Privacy lets a person make choices away from social pressure. The power to decide deeply personal matters is a protected part of being human.",
      "Navtej Singh Johar v. Union of India",
      "Dignity, equality and majority power",
      "All four opinions agreed and connected several rights. Under Article 14, Section 377 was arbitrary because it had no legitimate purpose and unfairly targeted people for their identity. Under Article 15, the ban on discrimination because of 'sex' also covered sexual orientation. Under Article 21, dignity and personal choice controlled the result. Constitutional morality, not changing popular or 'social' morality, decides fundamental rights. A majority cannot define the constitutional freedoms of a minority.",
      "The Court clearly overruled Koushal and recognised the harm caused by both the law and its earlier ruling. Chief Justice Dipak Misra wrote that history owed the community an apology for the delay in protecting its rights. The Court limited Section 377 so it no longer covered consensual acts between adults. It still covered non-consensual acts and offences against children and animals.",
      "Why it is part of data protection",
      "Navtej Johar shows the human purpose of privacy. Privacy is not only about hiding information. It protects personal choice and the freedom to define one's life without state punishment or forced public exposure. The DPDP Act protects the same value in data: control over what others know and freedom from being reduced to a profile by those holding information. Data about sexual orientation or health therefore needs great care. The case confirms that some personal choices belong only to the individual.",
    ],
    whyItMatters: [
      "It clearly states that privacy protects personal choice and identity, which are at the human centre of data protection.",
      "It explains why data about sexual orientation needs the highest level of protection.",
      "It confirms that constitutional morality, not majority opinion, sets the limits of personal freedom.",
    ],
    takeaways: [
      "The Court limited Section 377 so it no longer criminalised consensual same-sex relations between adults.",
      "Privacy includes freedom to make intimate choices about identity and love.",
      "The Court overruled Koushal. A majority's moral views cannot override a minority's fundamental rights.",
    ],
  },
};

function sourceStrings(block: CaseBlock): string[] {
  if (block.type === "ul") return block.items;
  if (block.type === "quote") {
    return block.cite ? [block.text, block.cite] : [block.text];
  }
  return [block.text];
}

export const PAIRS: [string, string][] = CASES.flatMap((entry) => {
  const easy = EASY_CASES[entry.slug];
  if (!easy) throw new Error(`Missing easy-read case: ${entry.slug}`);

  const normalSummary = entry.summary.flatMap(sourceStrings);
  if (
    normalSummary.length !== easy.summary.length ||
    entry.whyItMatters.length !== easy.whyItMatters.length ||
    entry.takeaways.length !== easy.takeaways.length
  ) {
    throw new Error(`Easy-read case fields are out of sync: ${entry.slug}`);
  }

  const pairs: [string, string][] = [
    [entry.question, easy.question],
    [entry.holding, easy.holding],
    ...normalSummary.map(
      (text, index) => [text, easy.summary[index]] as [string, string],
    ),
    ...entry.whyItMatters.map(
      (text, index) => [text, easy.whyItMatters[index]] as [string, string],
    ),
    ...entry.takeaways.map(
      (text, index) => [text, easy.takeaways[index]] as [string, string],
    ),
  ];

  return pairs.filter(([normal, plain]) => normal !== plain);
});