# DPDP Readiness in RBI-Regulated Lending

25 Oct 2026 · Aniket Mhala

Observations and a proposed sector baseline. Discussion note from Anix AI LLP. Draft for counsel review; not for publication.

> Repo snapshot of the live Claude Doc: https://claude.ai/artifact/4iL2eEhZY5YK6xEqce3VQT — edit the live doc, then refresh this copy.

## 1. Purpose

India's roughly 11,400 RBI-regulated lenders must meet the Digital Personal Data Protection Act, 2023 from 13 May 2027, alongside RBI's own customer-data expectations issued during 2026. This note sets out what we observe about the sector's readiness, the points where clarity would help, and a voluntary, reusable baseline the sector could adopt. We also offer to share anonymised findings from a pilot with one lender, due by February 2027.

## 2. The situation in brief

| Date | Instrument | Effect on lenders |
| --- | --- | --- |
| 13 May 2027 | DPDP Rules 2025, Rules 3 and 5–16 (G.S.R. 846(E)) | Notice, security safeguards, breach intimation (72-hour report to the Board), erasure, published contact, rights and grievances within 90 days |
| 1 Jan 2027 | RBI Responsible Business Conduct (Second Amendment) Directions, 2026 | Explicit, recorded consent for each product sold; consent records kept for one year after the contract |
| 13 Nov 2026 | DPDP Rules 2025, Rule 4 | Consent Manager registration with the Data Protection Board |
| 31 Jul 2026 | RBI Cybersecurity and Digital Payment Security Directions | Cyber incidents reported to RBI within six hours |
| 15 Jul 2026 | RBI Draft Guidance on Data Governance | Board-level data governance, data owners, classification and lineage for all regulated entities |
| 25 Mar 2026 | RBI Advisory 3/2026 | Good practice in customer data protection, drawn from a 2025 thematic study |

The population is large and uneven. At end-March 2025 RBI regulated 139 commercial banks, 1,842 cooperative banks and 9,382 NBFCs (RBI, Trend and Progress 2024-25). About nine in ten are small NBFCs and cooperative banks.

## 3. Observations

These draw on public documents, 2026 bank procurement notices and our assessment work. They will be tested and refined in the pilot.

1. **Two rulebooks, one dataset.** The same customer data now falls under DPDP and several RBI instruments at once. Lenders that treat these as separate projects duplicate effort and risk inconsistent answers. The Act applies in addition to other laws and prevails only on genuine conflict (s.38).
2. **Several clocks for one incident.** A single event can require a six-hour report to RBI, a six-hour report to CERT-In, and intimation to the Data Protection Board and affected customers with a detailed report within 72 hours (Rule 7). The definitions also differ: a personal data breach includes accidental disclosure, not only cyber attacks.
3. **Retention and erasure need mapping, record by record.** The Act keeps data that another law requires to be kept (s.8(7)); its own illustration describes a bank keeping a closed account's identity records. In practice lenders need a record-by-record map of which law keeps which data, and for how long. Data no law protects should be erased, such as rejected applications and stale marketing lists.
4. **The extended enterprise is the weak point.** DSAs, lending service providers, collection agencies, cloud and communication vendors handle large volumes of customer data. Recent public incidents in the sector have involved employee email compromise and service-provider exposure. Both regimes keep the lender accountable.
5. **Capacity is uneven.** Large banks have begun structured programmes; at least five issued DPDP procurement notices in 2026. Most of the roughly 10,000 smaller NBFCs and cooperative banks have no dedicated privacy function and limited budgets.

## 4. Points where clarity would help lenders

We raise these as practical questions the sector is asking, not as legal positions. Counsel is reviewing our own reading of each.

- **Record-retention periods.** A consolidated view of which RBI, PMLA and other requirements set retention for which banking records would let lenders apply s.8(7) consistently.
- **RBI instruments and DPDP's legitimate uses.** Lenders would benefit from knowing how RBI directions relate to processing "for fulfilling any obligation under any law" (s.7(d)) and to retention required by law (s.8(7)).
- **One incident, several reports.** A common incident record that feeds RBI, CERT-In and Data Protection Board reporting would reduce error under time pressure.
- **Account Aggregators and Consent Managers.** Lenders that provide and use AA data would welcome clarity on how the AA framework and Rule 4 Consent Managers relate from 13 November 2026.
- **Small-lender proportionality.** Guidance on what a proportionate DPDP programme looks like for a small NBFC or a Tier 1 cooperative bank would help these lenders spend scarce resources well.

## 5. What we propose

Three contributions, each voluntary and offered for the sector's use.

1. **A common DPDP-to-RBI control baseline.** An open, citation-backed map linking each DPDP duty to the RBI instruments that already address it, with one common control per line (draft at Annex A). We suggest it be held and maintained through the NBFC self-regulatory organisation (FIDC), the urban cooperative bank umbrella body (NUCFDC) or the Indian Banks' Association, so members can adopt it freely.
2. **A capacity programme for small lenders.** A guided, low-cost path for small NBFCs and cooperative banks: template notices, consent and retention schedules, a breach playbook, and short training. It would be delivered through the same bodies before 13 May 2027.
3. **Shared learning from a pilot.** We are proposing a ten-week readiness pilot with one lender, from November 2026 to January 2027. With the lender's consent, we will share anonymised findings by February 2027: where consent, retention, incident response and vendor control break down in practice, and what fixed them.

## 6. What we are not asking for, and our interest

We are not asking for endorsement, for any mandate to use a particular product or provider, or for preferential treatment of any kind.

**Disclosure:** Anix AI LLP provides DPDP consulting services and develops TrustStack, a DPDP compliance platform, and may offer these commercially to regulated entities. The baseline in Annex A is offered without charge and without any requirement to use our services. Nothing in this note is legal advice.

## Annex A. Draft DPDP-to-RBI control baseline

One common control per DPDP duty, mapped to the RBI and other instruments that already touch it. Draft for consultation; every reference is to be verified against final texts before adoption.

| # | DPDP duty | Related RBI and other instruments | Common control | Evidence a supervisor can check |
| --- | --- | --- | --- | --- |
| 1 | Notice (s.5, Rule 3) | RBC (Second Amendment) Directions 2026: disclosure before consent; Digital Lending Directions 2025 | One itemised notice per customer journey, in the customer's language | Notice versions by channel |
| 2 | Consent and withdrawal (s.6) | RBC Directions 2026: explicit consent per product; Digital Lending Directions 2025; Account Aggregator framework | Consent recorded per purpose and product, "No" by default, withdrawal as easy as giving | Consent log with timestamps; withdrawal test |
| 3 | Legitimate uses (s.7) | KYC Directions; PMLA | Lawful basis recorded for each processing activity | Processing register (ROPA) |
| 4 | Security safeguards (s.8(5), Rule 6) | Cybersecurity Directions (31 Jul 2026); Advisory 3/2026 | Encryption, access control, logging kept at least one year, leak prevention | Control tests; log retention |
| 5 | Breach intimation (s.8(6), Rule 7) | Cybersecurity Directions: 6 hours to RBI; CERT-In Directions 2022: 6 hours | One incident record driving all three reporting clocks | Incident register; drill reports |
| 6 | Retention and erasure (s.8(7)–(8), Rule 8) | PMLA s.12; KYC Directions; Advisory 3/2026 | Retention schedule per record type citing the law; logged erasure reaching processors and backups | Schedule; erasure log |
| 7 | Processors (s.8(1)–(2)) | IT Outsourcing Directions 2023; outsourcing rules; Digital Lending Directions (service providers) | Vendor register, contract clauses, breach flow-down, periodic review | Register; contracts; reviews |
| 8 | Accuracy (s.8(3)) | Credit Information Companies (Regulation) Act 2005; KYC updating | Correction route that reaches credit bureaus | Correction log |
| 9 | Contact and grievances (s.8(9)–(10), s.13, Rule 14) | Integrated Ombudsman Scheme 2021; Advisory 3/2026 | One rights-and-grievance register; 90-day ceiling, shorter where RBI requires | Register; turnaround report |
| 10 | Rights of access, correction, erasure, nomination (ss.11–12, 14) | — | Procedures that reach every system holding the data | Request log |
| 11 | Children (s.9, Rule 10) | KYC Directions on minors' accounts | Verifiable guardian consent; no tracking or targeted advertising | Minor-account procedure |
| 12 | Transfers abroad (s.16) | Storage of Payment System Data (6 Apr 2018); Digital Lending Directions | Data-location register; storage in India where required | Location register |
| 13 | Accountability; SDF duties (s.8(1), s.10, Rule 13) | Draft Data Governance Guidance 2026; Advisory 3/2026; FREE-AI framework 2025 | Board-approved policy, data owners, AI-use register; yearly DPIA and audit where notified as SDF | Board minutes; DPIA; audit report |

## Sources

- Digital Personal Data Protection Act, 2023; DPDP Rules, 2025 (G.S.R. 846(E), 13 Nov 2025; corrigendum G.S.R. 892(E))
- [RBI, Report on Trend and Progress of Banking in India 2024-25](https://rbi.org.in/Scripts/PublicationsView.aspx?id=23639), 29 Dec 2025
- RBI Advisory 3/2026 on Best Practices relating to Customer Data Protection, 25 Mar 2026
- RBI Responsible Business Conduct (Second Amendment) Directions, 2026
- RBI Draft Guidance on Regulatory Expectations for Data Governance, 15 Jul 2026
- RBI Cybersecurity, Technology Risk, Resilience and Assurance Framework Directions and Digital Payment Security Controls Directions, 31 Jul 2026
- RBI Digital Lending Directions, 2025 (8 May 2025); RBI Storage of Payment System Data (6 Apr 2018)
- CERT-In Directions under section 70B(6) of the IT Act, 28 Apr 2022
- [RBI, Recognition of Self-Regulatory Organisation for NBFCs](https://website.rbi.org.in/web/rbi/-/press-releases/recognition-of-self-regulatory-organisation-for-nbfcs), October 2025
- Bank procurement notices for DPDP services and platforms, 2026 (Indian Bank, Bank of Baroda, Punjab National Bank, India Post Payments Bank, Dhanlaxmi Bank)
