# DPDP & Indian Banking — Research Brief

> Repo snapshot of the live Claude Doc, taken 25 Oct 2026: https://claude.ai/artifact/KEYuH7VCArzdjLDEeTuSKv — edit the live doc, then refresh this copy. Diagrams appear as placeholders.

Oct 25, 2026 · @Aniket Mhala · Step 1 of 6 · Internal working brief, not yet for external circulation

## Key findings

Banking is the best-timed market for DPDP in India: the rules are fixed, RBI is already supervising to them, large banks are buying, and mid-sized lenders have no one serving them.

1. **The universe is about 11,400 lenders.** At end-March 2025 RBI regulated 139 commercial banks, 1,842 cooperative banks and 9,382 NBFCs, plus AIFIs, ARCs, credit bureaus, Account Aggregators and payment firms. Every one is a Data Fiduciary.
2. **Two hard deadlines are coming.** RBI's explicit-consent rules for selling products apply on 1 Jan 2027. DPDP's main duties apply on 13 May 2027, 200 days from today.
3. **No banking carve-out.** DPDP applies in full. The helpful exemptions are narrow: legal claims, fraud and offence detection, and tracing a loan defaulter's assets (s.17(1)(a), (c), (f)).
4. **Large banks will likely be Significant Data Fiduciaries.** That means a DPO, an independent data auditor, a yearly DPIA and audit, and algorithm checks. None has been notified yet.
5. **RBI got there first.** Advisory 3/2026 on customer data protection, draft data governance guidance (Jul 2026) and new cyber Directions (Jul 2026) already ask for what DPDP asks.
6. **The real problem is one bank, many rulebooks.** Retention, breach clocks (6 hours for RBI and CERT-In, 72 hours for DPDP), consent, vendors and grievances each sit under two or three regimes. Banks need one inventory, one control map, one incident clock and one rights register.
7. **Big banks are buying now.** Indian Bank, Bank of Baroda, PNB, IPPB and Dhanlaxmi issued DPDP tenders in 2026: assessment first, then implementation, then a platform.
8. **Breaches are front-page news.** SBI disclosed 3,897 leaked customer records on 21 Oct 2026, and Bank of Baroda had an incident in July 2026. Vendors are a frequent weak link.
9. **Competitors are either consultants or consent tools.** Few offer assessment, evidence, registers, workflows and Board reporting together with an RBI overlay. That is TrustStack's opening, as long as we are honest that it is not a data-discovery or consent-capture engine yet.
10. **Start mid-sized, earn the reference, then go big.** The sweet spot is about 800 mid-sized lenders, roughly ₹140 crore one-time and ₹80 crore a year. Public sector tenders need a prior banking reference, so the first pilot bank or NBFC is strategic, not just revenue.

## 1. Who RBI regulates

RBI regulated about 11,400 lending institutions at end-March 2025, and every one of them is a Data Fiduciary under DPDP for its customers' and staff's personal data. Nine in ten are small NBFCs and cooperative banks with thin compliance teams. Counts are from RBI's [Report on Trend and Progress of Banking in India 2024-25](https://rbi.org.in/Scripts/PublicationsView.aspx?id=23639) (released 29 Dec 2025) unless marked.

| Category | Count (end-Mar 2025) | Examples | Why DPDP bites hardest here |
| --- | --- | --- | --- |
| Public sector banks | 12 | SBI, Bank of Baroda, PNB | Largest customer bases, legacy core systems, thousands of branches: rights requests and notices at very high volume |
| Private sector banks | 21 | HDFC Bank, ICICI Bank, Axis Bank | Digital-first, heavy cross-sell and marketing, many fintech and DSA partners |
| Foreign banks | 44 | HSBC, Standard Chartered, Citi | Personal data sent to the parent group abroad (s.16 cross-border) |
| Small finance banks | 11 | AU, Equitas, Ujjivan | First-time and low-income customers: notices in regional languages, field agents |
| Payments banks | 6 | Airtel Payments Bank, India Post Payments Bank | Very high volume, low value, data shared with telecom or postal parent |
| Regional rural banks | 43, now 28 after the 1 May 2025 "One State, One RRB" merger ([DFS via NewsOnAir](https://newsonair.gov.in/finance-ministry-merges-26-rrbs-under-one-state-one-rrb-plan)) | Sponsored by public sector banks | Rural, low-literacy customers; IT run by the sponsor bank |
| Local area banks | 2 | — | Small, local |
| Urban cooperative banks | 1,457 (Tier 1: 838 · Tier 2: 535 · Tier 3: 78 · Tier 4: 6) ([RBI, co-operative banking chapter](https://rbi.org.in/Scripts/PublicationsView.aspx?id=23640)) | Saraswat, Cosmos, SVC | Thin IT and compliance teams, shared core-banking vendors: the least prepared |
| State and district cooperative banks | 34 StCBs · 351 DCCBs | State apex banks | Rural, moving to a shared technology entity under NABARD |
| NBFCs (incl. HFCs) | 9,382: Upper 15 · Middle 656 · Base 8,711 | Bajaj Finance, Shriram Finance, Tata Capital, Muthoot | Digital lending apps, DSAs, collection agents, lending service providers: data-hungry and complaint-prone |
| All-India financial institutions | 5 | NABARD, SIDBI, EXIM Bank, NHB, NaBFID | Mostly wholesale: lower personal-data exposure |
| Asset reconstruction companies | 27 | — | Buy bad loans and inherit borrower data collected for another purpose |

RBI also regulates other bodies that hold large volumes of personal data: about 17 registered Account Aggregators (secondary figure, Sep 2025), the credit information companies (TransUnion CIBIL, Equifax, Experian, CRIF High Mark), and payment system operators such as card networks, prepaid wallets and payment aggregators (new Payment Aggregator Directions, 15 Sep 2025).

**Two recent changes matter for how we pitch:**

- The NBFC Upper Layer list for 2026-27 ([RBI, 6 Aug 2026](https://rbi.org.in/scripts/BS_PressReleaseDisplay.aspx?prid=63301)) now uses a single test of ₹1,00,000 crore of assets and names 17 NBFCs, plus PNB Housing and Sammaan Capital carried over. These are the most likely NBFC candidates for Significant Data Fiduciary status.
- On 28 Nov 2025 RBI folded about 9,000 circulars into 244 consolidated Master Directions, organised by 11 categories of regulated entity ([NewsOnAir](https://www.newsonair.gov.in/rbi-repeals-9000-circulars-consolidates-rules-into-244-master-directions-to-ease-compliance/)). Our DPDP-to-RBI mapping must cite these new directions, not the old circulars.

**What it means for us:** the market splits into three buyer groups. About 150 large banks and Upper Layer NBFCs are likely Significant Data Fiduciaries and buy consulting plus platform. About 700 mid-sized lenders (Middle Layer NBFCs, small finance banks, Tier 3–4 cooperative banks) are the sweet spot: real exposure, no big in-house privacy team. About 10,000 small NBFCs and cooperative banks need a low-cost, mostly self-serve product sold through associations.

## 2. DPDP Act and Rules: what applies to banks, and when

The DPDP Act 2023 applies in full to every bank and NBFC, with no banking carve-out, and its main duties start on 13 May 2027, 200 days from today. Quotes are checked against the Act and the Rules as gazetted (G.S.R. 846(E), 13 Nov 2025).

&#91;embedded content: DPDP Rules 2025, Rule 1 (G.S.R. 846(E)); RBI Advisory 3/2026; RBI Draft Guidance on Data Governance, 15 Jul 2026\]

Consent Manager registration (Rule 4) opens on 13 Nov 2026. RBI's own explicit-consent rules for selling products apply from 1 Jan 2027. Rules 3, 5–16, 22 and 23 (notice, security, breach, erasure, rights, SDF duties, cross-border) start on 13 May 2027.

### What a bank must do

| Duty | Where in law | Banking example |
| --- | --- | --- |
| Plain, itemised notice, in English or any Eighth Schedule language | s.5, Rule 3 | Account opening, loan apps, branch forms |
| Consent that is free, specific, informed and as easy to withdraw as to give | s.6 | Marketing, cross-sell, sharing with the group's insurance arm |
| Process without consent only for a legitimate use | s.7 | s.7(a) data given for a stated purpose; s.7(d) a duty under law (KYC, PMLA); s.7(e) court orders |
| Reasonable security safeguards, with logs kept at least one year | s.8(5), Rule 6 | Core banking, CRM, data lake, every vendor |
| Tell the Board and each affected customer about a breach; full Board report within 72 hours | s.8(6), Rule 7 | Runs beside CERT-In's 6-hour report and RBI incident reporting |
| Erase once the purpose ends, unless a law requires keeping it | s.8(7) | The Act's own Illustration II: a bank keeps a closed account's identity records for ten years |
| Answer for every Data Processor | s.8(1)–(2) | DSAs, collection agencies, cloud, lending service providers |
| Publish a contact for data questions | s.8(9), Rule 9 | A Data Protection Officer for SDFs |
| Honour access, correction, erasure, grievance and nomination rights, within 90 days at most | ss.11–14, Rule 14(3) | Requests through branches, app and call centre |
| Verifiable parental consent; no tracking or targeted ads at children | s.9, Rule 10 | Minor savings accounts, student products |
| Transfer abroad unless the government restricts it; a stricter sector law still prevails | s.16(1)–(2) | RBI's payment-data localisation still applies |

### Exemptions that help banks

Section 17(1) switches off most of Chapter II, all of Chapter III and s.16 where processing is needed to enforce a legal right or claim (17(1)(a)), to prevent, detect or investigate an offence (17(1)(c): fraud and AML monitoring), or to find the assets and liabilities of a loan defaulter (17(1)(f), whose illustration names a bank). Security safeguards (s.8(5)) and overall accountability (s.8(1)) still apply.

### Significant Data Fiduciaries

The government can name a Significant Data Fiduciary on volume and sensitivity of data, risk to people's rights and wider public-interest factors (s.10(1)). An SDF must appoint an India-based DPO answerable to its board and an independent data auditor (s.10(2)). It must also run a yearly DPIA and audit and report the findings to the Board (Rule 13(1)–(2)), check that its algorithms are not a risk to people's rights (Rule 13(3)), and keep government-specified data in India (Rule 13(4)). As of late September 2026 no SDF had been notified (secondary sources; Gazette to be checked). Large banks and Upper Layer NBFCs are the obvious candidates.

### Penalties (Schedule to the Act)

Up to ₹250 crore for failing to keep reasonable security safeguards; ₹200 crore for failing to report a breach; ₹200 crore for children's-data duties; ₹150 crore for SDF duties; ₹50 crore for any other breach of the Act or Rules.

### Moving parts to watch

- **Shorter timeline proposed, not notified.** At a 23 Jan 2026 consultation MeitY floated cutting the 18-month window to 12 months, mainly for SDFs, with comments due 4 Feb 2026 ([Mondaq, 15 Apr 2026](https://www.mondaq.com/india/data-protection/1773554/meity-plans-to-cut-short-dpdp-compliance-timeline-and-notify-cross-border-restrictions-for-sdfs)). No amending notification had been found by late September 2026. If it lands, large banks could face SDF duties sooner.
- **Removal of Difficulties Order, 5 Oct 2026.** It changes "audit" to "data audit" for SDFs and clarifies guardian consent for persons with disability. It adds no new duties ([KS&K](https://ksandk.com/data-protection-and-data-privacy/dpdp-removal-of-difficulties-order-2026/); Gazette number to be checked).
- **Data Protection Board.** MeitY invited applications on 6 May 2026, but no appointments were confirmed from a primary source by late September 2026 (secondary; to be checked).

## 3. Where DPDP meets RBI rules

DPDP sits on top of RBI rules rather than replacing them: the Act applies "in addition to" other laws and prevails only where the two conflict (s.38). Most of the tension is operational, not legal. The same customer data falls under several clocks, registers and regulators at once. RBI has also moved fast in 2026: it issued an advisory on customer data protection (No. 3/2026, 25 Mar 2026) and draft data governance guidance (15 Jul 2026). New cybersecurity and digital payment security Directions followed on 31 Jul 2026. Together these turn DPDP-style practice into supervisory expectation before the DPDP Board is even staffed.

| Area | RBI or other sector rule | DPDP rule | Where they rub | What the bank needs |
| --- | --- | --- | --- | --- |
| Record retention | PMLA s.12 and RBI KYC Directions: keep KYC and transaction records for at least five years after the relationship ends | Erase when the purpose ends unless a law requires keeping it (s.8(7)); Illustration II uses a bank and ten years | No legal clash, but every data set needs a named legal reason to stay; marketing data and rejected applications have none | A retention schedule per data category, citing the law, with logged erasure |
| Breach and incident reporting | RBI: cyber incidents within 6 hours through DAKSH (31 Jul 2026 Directions, per [KPMG](https://kpmg.com/in/en/insights/2026/09/rbis-technology-focused-master-directions-issued-on-31-july-2026.html)); CERT-In: 6 hours (Directions of 28 Apr 2022) | Tell the Board and every affected customer; detailed Board report within 72 hours (s.8(6), Rule 7) | Three clocks, three regulators, two definitions ("cyber incident" and "personal data breach") | One incident workflow that runs all three clocks and drafts customer notices |
| Customer data protection practice | RBI Advisory 3/2026: governance, consent and notice, data inventory, access, third parties, incidents, retention and destruction, grievances, audit, AI, cloud, monitoring ([MediaNama](https://www.medianama.com/2026/04/223-rbi-data-protection-cybersecurity-guidelines-advisory-2026/)) | ss.5–8 | The advisory reads like a DPDP implementation guide for banks; RBI supervisors will test against it | One control map that answers both RBI and DPDP |
| Data governance | RBI draft guidance (15 Jul 2026): board committee, data function, data owners and custodians, classification, lineage, third-party accountability; applies to every RBI-regulated entity ([Cyril Amarchand](https://corporate.cyrilamarchandblogs.com/2026/07/fig-paper-no-61-rbis-draft-data-governance-guidance-an-overview/)) | Accountability (s.8(1)) implies a record of what data is processed and why | The same data inventory serves both | A processing register (ROPA) built once, used for both |
| Digital lending | Digital Lending Directions (8 May 2025): need-based collection with explicit consent, no access to contacts or media, borrower may refuse, revoke and ask for deletion, data stored in India ([Mondaq](https://www.mondaq.com/india/financial-services/1628380/reserve-bank-of-india-digital-lending-directions-2025)) | Consent (s.6), erasure (s.8(7)) | Largely aligned; RBI is stricter on app permissions and storage | Consent records for every lending app and lending service provider |
| Consent for data sharing | Account Aggregator framework: consent artefacts, data-blind AAs; about 253 million users by Dec 2025 | Consent Managers registered with the Board from 13 Nov 2026 (Rule 4) | Unresolved: whether an AA must also register as a Consent Manager ([SCC Online](https://www.scconline.com/blog/post/2026/06/26/account-aggregator-consent-manager-paradox-dpdp-rules-fintech-sector/)) | Banks, as data providers and users, reconcile AA and DPDP consent records |
| Vendors and outsourcing | RBI IT outsourcing Directions (2023) and outsourcing rules: the regulated entity stays responsible | The bank answers for its processors and must make them erase (s.8(1)–(2), s.8(7)(b)) | Aligned; DPDP adds erasure and breach duties that must flow down by contract | A vendor register with DPDP clauses, reviews and breach terms |
| Data localisation | RBI Storage of Payment System Data (6 Apr 2018): payment data only in India | A stricter sector law prevails (s.16(2)); SDFs may be told to keep specified data in India (Rule 13(4)) | Aligned; cloud and AI tools must keep data in India | Hosting in India, or on the bank's own premises |
| Grievances | RBI Integrated Ombudsman Scheme 2021: a complaint can go to the Ombudsman after 30 days | Grievance to the fiduciary first, then the Board (s.13); answer within 90 days at most (Rule 14(3)) | Two routes, two clocks; the customer can use both | One rights-and-grievance register running the shorter clock |
| Credit information | Credit Information Companies (Regulation) Act 2005 | Correction and erasure rights (s.12) | Correction requests split between the bank and the credit bureau | Rights workflow that routes to the bureau |
| AI and models | RBI FREE-AI framework (13 Aug 2025) | SDFs must check algorithms do not harm people's rights (Rule 13(3)) | Credit scoring, chatbots and collections models | An AI-use register with risk review |
| Fraud and AML monitoring | RBI fraud-risk Directions, PMLA | Exempt where processing is to prevent or detect an offence (s.17(1)(c)) | The exemption is narrow: analytics and marketing on the same data are not exempt | Purpose tags on every processing activity |

**Bottom line:** banks do not need a separate "DPDP project" and a separate "RBI project". They need one inventory, one control map, one incident clock and one rights register that satisfy both. That is exactly the gap a combined consulting and platform offer fills.

## 4. How customer data moves through a bank, and where the risk sits

A retail customer's data passes through five stages and a long chain of outside firms. Most DPDP risk sits where data leaves the bank's own systems: to agents, lending apps, vendors and analytics teams.

| Stage | Personal data | Who else touches it | Biggest DPDP risk |
| --- | --- | --- | --- |
| 1. Acquire: leads, website and app, branch walk-ins | Name, mobile, income, PAN | DSAs, lead aggregators, ad-tech, telecallers | No notice at lead capture; bought lead lists; marketing consent that cannot be withdrawn |
| 2. Onboard: KYC, video KYC, bureau pull, underwriting | ID documents, photo, video KYC recording, bureau report, bank statements through an AA | KYC and video-KYC vendors, CKYC registry, credit bureaus, AAs, lending service providers | Over-collection; consent bundled into terms and conditions; rejected applicants' data kept indefinitely |
| 3. Service: accounts, cards, UPI, app, call centre, cross-sell | Transactions, device and location data, call recordings | Card processors, cloud, SMS and WhatsApp providers, CRM tools, group insurance and fund partners | Purpose creep into marketing and analytics; group sharing; rights requests that must reach ten or more systems |
| 4. Collect: reminders, field recovery | Repayment history, references' contacts, call recordings, location | Collection agencies, field agents, recovery apps | Agents' access and misuse; vendor breaches; leaning too hard on the s.17(1)(f) defaulter exemption |
| 5. Close and keep: closure, write-off, sale to an ARC | Full customer history | Archives, ARCs, auditors | Keeping everything for ever; erasure that never reaches vendors and backups |

Staff data is a sixth flow banks often forget: HR systems, background checks, biometric attendance and call-centre monitoring are all in scope.

**What we already have for this:** our BFSI question pack (repo `docs/question_packs/industry/03_BFSI_DPDP_Questions.md`) covers all 16 DPDP domains with a banking overlay. It adds process packs for onboarding and KYC, digital lending, payments and cards, collections, insurance and capital markets, 12 triggers that switch in extra questions (for example KYC, digital lending, AI scoring, minors), suggested ROPA records and an evidence checklist. The assessment content for a bank demo already exists.

## 5. Trends and how far banks have got

Large banks moved from talking to buying in 2026. At least five banks issued DPDP tenders for consultants or platforms between January and August. Mid-sized and small lenders are mostly still at the awareness or first-assessment stage. No independent survey measures banking readiness yet. The picture below is built from tenders, RBI documents and incidents.

### Banks are buying now

| Issued | Bank | What they are buying | Source |
| --- | --- | --- | --- |
| 18 Aug 2026 | Punjab National Bank | A data protection suite for DPDP compliance | [tender listing](https://www.indiantenders.in/tenderdetail/rfp-procurement-data-protection-suit-dpdp-compliance-0d8d9c8/) |
| 23 Jul 2026 | Indian Bank | A data privacy governance and compliance platform (GEM/2026/B/7823086) | [RFP](https://indianbank.bank.in/documents/20117/518589/IBDPDPRFP2026_07_23_14_17_252026_08_14_14_40_01.pdf/485c3ed6-0326-56a8-a4b4-b84b863e6ff8) |
| 2026 | India Post Payments Bank | Consultancy for DPDP advisory, governance and implementation assurance, 24 months, quality-and-cost selection (GEM/2026/B/8039912) | [RFP](https://ippbonline.bank.in/documents/31498/129735/1790831752704.pdf) |
| 25 Mar 2026 | Bank of Baroda | An enterprise data privacy governance and compliance platform aligned to DPDP | [tender page](https://bankofbaroda.bank.in/tenders/corporate-office/rfp-for-selection-of-vendor-for-supply-implementation-and-maintenance-15-04) |
| 16 Mar 2026 | Dhanlaxmi Bank | An implementation consultant, after a gap assessment already done by another firm | [RFP](https://www.dhan.bank.in/pdf/RFP-Implementation-of-DPDP.pdf) |
| 6 Jan 2026 | Indian Bank | End-to-end DPDP implementation (GEM/2026/B/7080211) | [RFP](https://indianbank.bank.in/documents/20117/518589/RFPDPDP2026_04_14_20_54_57.pdf/d57920a4-5caf-7ac9-4534-53acdfa8c4ce) |

The pattern is clear: gap assessment first, then an implementation consultant, then a platform for consent, data discovery, rights requests, DPIA and vendor risk. Dhanlaxmi's RFP names exactly those five tool types.

**Who is allowed to bid matters for us.** Dhanlaxmi asks for a firm at least five years old, with two privacy projects, one of them in a regulated Indian financial entity. IPPB asks for an average turnover of ₹2 crore (₹1.6 crore for DPIIT-recognised start-ups), three years of privacy consulting for a bank, insurer or government body, and certified staff (CIPP, CIPM, CDPSE or DCPP). A new company cannot bid on these alone. We need a first banking reference, or a partner that already qualifies.

### RBI is pushing the same direction

- **Advisory 3/2026 (25 Mar 2026)** on customer data protection, drawn from a 2025 thematic study across supervised entities. It lists good practice in 12 areas, from board oversight to AI and cloud.
- **Responsible Business Conduct (Second Amendment) Directions 2026**: final on 15 Jun 2026, in force **1 Jan 2027**. They require explicit consent for every product sold, screens that default to "No", choice of products on multi-product forms, and consent records kept for a year after the contract ends. Mis-selling means a full refund plus compensation ([C4S summary](https://c4scourses.in/banking-finance/rbis-responsible-business-conduct-second-amendment-directions-2026/); the draft is analysed by [Khaitan](https://compass.khaitanco.com/new-business-conduct-directions-an-early-kickstart-to-dpdpa-for-banks-and-nbfcs); RBI text to be checked). This is the nearest hard consent deadline for banks, ten weeks away.
- **Draft Data Governance Guidance (15 Jul 2026)** for every RBI-regulated entity.
- **Cybersecurity and Digital Payment Security Directions (31 Jul 2026):** 6-hour incident reporting through DAKSH.
- **Authentication Directions for digital payments** require compliance with the DPDP Act (RBI Trend and Progress 2024-25, para III.54).
- **FREE-AI framework (13 Aug 2025)** for responsible AI in finance.

### Incidents keep the topic on the board's agenda

- **SBI, 21 Oct 2026:** told the stock exchanges that 3,897 customer records with personal data were found among about 375,000 records on the dark web. CERT-In and the Defence Cyber Agency alerted the bank on 16 Oct. The filing does not say whether customers were told ([Outlook Money](https://www.outlookmoney.com/personal-finance/sbi-confirms-cyberattack-3897-customer-records-stolen-leaked-on-dark-web)). From 13 May 2027 a breach like this triggers a 72-hour report to the Board and notices to every affected person.
- **Bank of Baroda, Jul 2026:** customer records exposed after an employee's email was compromised; scope not disclosed ([The Asian Banker](https://theasianbanker.com/updates-and-articles/india-s-bank-of-baroda-data-breach-exposes-customer-records-after-employee-email-compromise)).
- **Vendors are the weak link:** a 2025 cloud-storage misconfiguration at fintech Nupay exposed data for 38 banks and financial institutions, and HDB Financial's 2023 loan-data leak came from a service provider.

### Fraud is shifting to loans

RBI's Annual Report 2025-26 counts 10,114 frauds worth ₹48,021 crore in FY26, against 23,722 worth ₹32,803 crore in FY25. Card and digital-payment frauds fell to 293 cases. Loan frauds made up most of the value: 8,640 cases, ₹40,774 crore ([Outlook Business](https://www.outlookbusiness.com/news/financial-institutions-report-over-10000-cases-of-fraud-involving-48000-cr-in-fy26-rbi-data)). FY26 includes ₹30,199 crore of older cases reclassified after a Supreme Court ruling.

### Estimated readiness by segment (our judgement, not a survey)

| Segment | Where most are now | What they need next |
| --- | --- | --- |
| Large public and private banks, Upper Layer NBFCs | Gap assessment done; buying implementation help and platforms | Implementation, a platform, SDF-grade DPIA and audit |
| Mid-sized: Middle Layer NBFCs, small finance banks, larger cooperative banks | Awareness; some first assessments; policies drafted | A fast, affordable assessment and a working register, consent and rights set-up |
| Small: base-layer NBFCs, Tier 1–2 cooperative banks, RRBs | Mostly not started | A low-cost, guided, mostly self-serve kit, reached through associations and sponsors |

One vendor scan of 1,680 websites found no consent banner on 82.4% of financial-services sites ([Punjab Kesari, vendor research](https://english.punjabkesari.com/market-speaks/complydps-breakthrough-indias-dpdp-act-compliance-solved-for-banks)). It is a weak measure, but it points the same way. Training is also picking up: IIBF is running DPDP workshops for bankers in 2026 ([IIBF brochure](https://www.iibf.org.in/documents/Brochure/2026/Brochure%20-%20DPDP%20Act%20in%20Action-%20Practical%20Compliance%2010-07-2026.pdf)).

## 6. Who else sells DPDP to banks

The market splits into consultants who leave behind documents and software vendors who sell consent tools. Few offer both, and few map DPDP and RBI rules together in one place. Most vendor facts below come from vendors' own guides, checked against their sites in late September 2026 ([ConsentOS buyer's guide](https://consentos.in/learn/dpdp-compliance-software/), [Seqrite list](https://www.seqrite.com/blog/top-dpdpa-compliance-platforms-india-2026/)), so treat them as claims.

| Group | Who | Strength | Gap we can use |
| --- | --- | --- | --- |
| Big Four and large consultancies | EY, Deloitte, PwC, KPMG, Grant Thornton, Protiviti | Board access, qualify for every tender, large DPDP teams | Expensive and team-heavy; deliver reports, then resell a third-party tool |
| Law firms | Cyril Amarchand, Khaitan, AZB, Trilegal | Legal interpretation; banks trust them on grey areas | Advise, but do not implement or run anything |
| Global privacy platforms | OneTrust, Securiti, TrustArc | Broad features, GDPR pedigree | Dollar pricing (OneTrust quoted at about ₹40–50 lakh a year, 90–180 days to implement); DPDP and RBI mapping is an add-on |
| Indian consent and DPDP platforms | Privy by IDfy (Axis Bank named), Consentin by Leegality (IIFL Finance, Union Bank, SBI Card named), CAMS ConsenPro (says 80+ financial institutions), Perfios DPDP Suite (launched 30 Mar 2026, sold through an NBFC network), Digio, ComplyDP, Redacto, GoTrust, Digital Anumati, Surepass | Consent capture at scale, 22 languages, API-first, some on-premises options | Mostly consent-first point products; little assessment, scoring, evidence, Board reporting or RBI overlay |
| Small consultancies | Many, often quoting ₹1.5–4 lakh for an end-to-end programme | Cheap | Thin bank knowledge; no platform; quality varies |

**Where TrustStack stands today (from the repo, not marketing):**

- **Built and live:** assessment across 16 DPDP domains with 1,527 questions, including the BFSI pack. Scores are capped by evidence. On top sit a gap and action register, the ROPA register, dashboards, penalty-exposure modelling, and the Board brief, DPO report and regulator-ready evidence pack. Six workflow modules cover breach, rights and grievance, notice and consent, processors, retention and AI risk, and an AI assistant drafts notices, breach intimations and responses for human review.
- **Not built yet:** reassessment (Slice 12), security hardening and MFA (Slice 13), licensing and production launch (Slice 14), and the client-hosted, on-premises edition (proposed Slice 15). We also have no automated data discovery connectors to core banking, no Account Aggregator link, no SIEM link, and no 22-language consent capture (Hindi and Marathi drafts need a human reviewer).
- **What that means:** we should sell TrustStack to banks as the governance and evidence layer: assessment, registers, workflows, Board reporting and the RBI-plus-DPDP control map. We should sit beside the bank's consent and security tools, not claim to replace them.

## 7. Our opportunity

RBI-regulated lenders alone are worth roughly ₹300 crore of one-time DPDP work and about ₹175 crore a year in platform spend. This is an order-of-magnitude estimate: RBI's entity counts multiplied by price bands we assume. It is not a market study, and Step 3 will test the price bands.

| Segment | Who (count) | Assumed one-time fee | Assumed platform fee a year | One-time pool | Yearly pool |
| --- | --- | --- | --- | --- | --- |
| A. Large | Public, private, foreign and small finance banks, Upper Layer NBFCs (107) | ₹50 lakh–₹1.5 crore | ₹25–75 lakh | about ₹107 crore | about ₹54 crore |
| B. Mid-sized | Middle Layer NBFCs, payments banks, Tier 3–4 cooperative banks, RRBs, state cooperative banks (808) | ₹10–25 lakh | ₹5–15 lakh | about ₹141 crore | about ₹81 crore |
| C. Small | Base Layer NBFCs, Tier 1–2 cooperative banks, district cooperative banks (10,435); assume 30% buy | ₹1–3 lakh | ₹0.5–2 lakh | about ₹63 crore | about ₹39 crore |

Insurers (IRDAI), brokers and fund houses (SEBI) are a natural next market with similar data and our BFSI pack already covers them.

### Why now

- **1 Jan 2027:** RBI's explicit-consent rules for selling products apply (ten weeks away).
- **13 May 2027:** DPDP's main duties apply, and from then on any breach must be reported to the Board within 72 hours.
- **RBI is already supervising to the same standard:** Advisory 3/2026, the draft data governance guidance and the July 2026 cyber Directions.
- **Live incidents:** SBI (October 2026) and Bank of Baroda (July 2026) put customer-data leaks on every bank board's agenda.
- **Budgets exist:** at least five banks issued DPDP tenders in 2026.

### Where we can win first

- **Segment B is the sweet spot.** These firms have real exposure and decide in weeks, often without a public tender. No Big Four team is chasing them, and they cannot afford OneTrust.
- **Segment C is a volume play.** Reach it through associations and shared-service bodies with a low-price, guided package.
- **Segment A needs a reference first.** Tenders ask for a prior banking privacy project, three to five years in business and a turnover floor. We get there through the first bank or NBFC pilot, or by bidding with a partner that already qualifies.

TrustStack is Indian-built, which may also earn local-supplier preference in public sector tenders under the Make in India procurement rules (IPPB's RFP asks bidders to declare their local-content class).

## 8. Open points: for counsel, or still to check

Anything that goes to the RBI must clear these first. Items marked *check* need a primary source; items marked *counsel* need a lawyer's view.

- [ ] *Counsel:* do RBI Directions and advisories count as "law for the time being in force" for legitimate use (s.7(d)) and retention (s.8(7))?
- [ ] *Counsel:* PMLA s.12 sets five years after the relationship ends, but the Act's Illustration II under s.8(7) uses ten years. Which periods apply to which bank records?
- [ ] *Counsel:* how far does the defaulter exemption (s.17(1)(f)) reach into collections and recovery practice?
- [ ] *Counsel:* must an Account Aggregator also register as a DPDP Consent Manager from 13 Nov 2026?
- [ ] *Check:* final RBI text and effective date of the Responsible Business Conduct (Second Amendment) Directions 2026 (secondary sources say 15 Jun 2026, in force 1 Jan 2027).
- [ ] *Check:* RBI Advisory 3/2026 is not on RBI's public website; our copy is a watermarked version hosted by a law firm. Do not quote it to RBI without a clean copy.
- [ ] *Check:* exact names of the 31 Jul 2026 Cybersecurity and Digital Payment Security Directions, and which older circulars they replaced.
- [ ] *Check:* whether any Significant Data Fiduciary has been notified, and whether MeitY's 12-month proposal has been notified.
- [ ] *Check:* Gazette number of the DPDP (Removal of Difficulties) Order 2026, and whether Data Protection Board members are appointed.
- [ ] *Check:* Account Aggregator count (17 is a secondary figure) and every vendor claim in section 6.
- [ ] *Our side:* Anix AI LLP's age, turnover and DPIIT start-up status against tender rules; which entity signs a bank contract before the NewCo exists (planned 15 Dec 2026); a qualifying partner for public sector tenders.
- [ ] *Our side:* bank due diligence on TrustStack itself, for example ISO 27001, VAPT, data hosted in India, and RBI outsourcing clauses.

## Sources

All opened between 23 and 25 Oct 2026.

**Primary: law and regulators**

- Digital Personal Data Protection Act 2023 and DPDP Rules 2025 (G.S.R. 846(E), 13 Nov 2025; corrigendum G.S.R. 892(E)): official PDFs in the repo, `docs/legal/`
- [RBI, Report on Trend and Progress of Banking in India 2024-25](https://rbi.org.in/Scripts/PublicationsView.aspx?id=23639), 29 Dec 2025, with its [co-operative banking chapter](https://rbi.org.in/Scripts/PublicationsView.aspx?id=23640)
- [RBI, NBFC Upper Layer list 2026-27](https://rbi.org.in/scripts/BS_PressReleaseDisplay.aspx?prid=63301), 6 Aug 2026
- RBI Advisory 3/2026 on Best Practices relating to Customer Data Protection, 25 Mar 2026 ([copy hosted by Dentons](https://insights.dentons.com/528/35319/uploads/rbi-advisory-on-best-practices-for-customer-data-protection.pdf))
- Bank tenders: [Dhanlaxmi Bank](https://www.dhan.bank.in/pdf/RFP-Implementation-of-DPDP.pdf), [India Post Payments Bank](https://ippbonline.bank.in/documents/31498/129735/1790831752704.pdf), [Indian Bank, Jan 2026](https://indianbank.bank.in/documents/20117/518589/RFPDPDP2026_04_14_20_54_57.pdf/d57920a4-5caf-7ac9-4534-53acdfa8c4ce), [Indian Bank, Jul 2026](https://indianbank.bank.in/documents/20117/518589/IBDPDPRFP2026_07_23_14_17_252026_08_14_14_40_01.pdf/485c3ed6-0326-56a8-a4b4-b84b863e6ff8), [Bank of Baroda](https://bankofbaroda.bank.in/tenders/corporate-office/rfp-for-selection-of-vendor-for-supply-implementation-and-maintenance-15-04)

**Secondary: law firms, consultancies, press**

- [Cyril Amarchand Mangaldas, FIG Paper 61](https://corporate.cyrilamarchandblogs.com/2026/07/fig-paper-no-61-rbis-draft-data-governance-guidance-an-overview/), on RBI's draft data governance guidance, 27 Jul 2026
- [KPMG India](https://kpmg.com/in/en/insights/2026/09/rbis-technology-focused-master-directions-issued-on-31-july-2026.html), on RBI's 31 Jul 2026 technology Directions
- [Khaitan & Co](https://compass.khaitanco.com/new-business-conduct-directions-an-early-kickstart-to-dpdpa-for-banks-and-nbfcs) and [C4S](https://c4scourses.in/banking-finance/rbis-responsible-business-conduct-second-amendment-directions-2026/), on Responsible Business Conduct consent rules
- [Mondaq / S.S. Rana](https://www.mondaq.com/india/data-protection/1773554/meity-plans-to-cut-short-dpdp-compliance-timeline-and-notify-cross-border-restrictions-for-sdfs), on MeitY's 12-month proposal, 15 Apr 2026
- [KS&K](https://ksandk.com/data-protection-and-data-privacy/dpdp-removal-of-difficulties-order-2026/), on the Removal of Difficulties Order 2026
- [Mondaq](https://www.mondaq.com/india/financial-services/1628380/reserve-bank-of-india-digital-lending-directions-2025), on the Digital Lending Directions 2025
- [SCC Online](https://www.scconline.com/blog/post/2026/06/26/account-aggregator-consent-manager-paradox-dpdp-rules-fintech-sector/), on the Account Aggregator and Consent Manager overlap, 26 Jun 2026
- [MediaNama](https://www.medianama.com/2026/04/223-rbi-data-protection-cybersecurity-guidelines-advisory-2026/), on Advisory 3/2026, 7 Apr 2026
- [Outlook Money](https://www.outlookmoney.com/personal-finance/sbi-confirms-cyberattack-3897-customer-records-stolen-leaked-on-dark-web), on SBI's disclosure; [The Asian Banker](https://theasianbanker.com/updates-and-articles/india-s-bank-of-baroda-data-breach-exposes-customer-records-after-employee-email-compromise), on Bank of Baroda
- [Outlook Business](https://www.outlookbusiness.com/news/financial-institutions-report-over-10000-cases-of-fraud-involving-48000-cr-in-fy26-rbi-data), on RBI Annual Report 2025-26 fraud data
- [NewsOnAir](https://newsonair.gov.in/finance-ministry-merges-26-rrbs-under-one-state-one-rrb-plan), on the RRB mergers; [NewsOnAir](https://www.newsonair.gov.in/rbi-repeals-9000-circulars-consolidates-rules-into-244-master-directions-to-ease-compliance/), on RBI's consolidated Master Directions
- Vendor guides (claims, not verified): [ConsentOS](https://consentos.in/learn/dpdp-compliance-software/), [Seqrite](https://www.seqrite.com/blog/top-dpdpa-compliance-platforms-india-2026/), [Punjab Kesari / ComplyDP](https://english.punjabkesari.com/market-speaks/complydps-breakthrough-indias-dpdp-act-compliance-solved-for-banks)

**Internal**

- TrustStack repo: `docs/SLICES.md` (what is built), `docs/question_packs/industry/03_BFSI_DPDP_Questions.md` (BFSI pack)
