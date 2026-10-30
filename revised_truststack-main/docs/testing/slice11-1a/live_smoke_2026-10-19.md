# Slice 11 Stage 1a — live smoke test, 2026-10-19

Run by hand by Claude on the **local stack** (§0.4: never in CI), against the real
provider (`AI_PROVIDER=anthropic`, the key in `.env.local`), on Mumbai University's
**fictional** demo data (§6.6), with `node tools/ai_ask.mjs`. Two calls. Prompt
version `2026-10-20.1a` (renamed `2026-10-19.1a` afterwards, the date of the run;
the instructions did not change). Both drafts were removed when the local database
was rebuilt from the seed.

## Usage, from the two `ai_drafts` rows

| Call | Model that answered | Input | Output | Cache read | Cache write | Latency |
|---|---|---|---|---|---|---|
| 1 · S1.1 + a question | `claude-opus-5-5` | 401 | 1,453 | 0 | **43,623** | 21.0 s |
| 2 · R1.1 | `claude-opus-5-5` | 383 | 1,396 | **43,623** | 0 | 16.4 s |

The second call read the whole corpus prefix from the cache: pitfall 3 is met (the
prefix is byte-stable). The prefix is **43,623 tokens**, above §4.2's estimate of
≈30,000, because the Act and the Rules tokenise at about 2.1 tokens a word. At Opus
5.5's prices ($4 / $20 per million, cache reads $0.20, one-hour cache writes at twice
the input price) a cached call costs about **$0.04** and the first call in an hour
about **$0.38**.

## Call 1 — S1.1, "We are a university. What would a reviewer accept as evidence here?"

`HTTP 200 in 21.6s`

**ANSWER** — This question asks whether Mumbai University protects personal data with
encryption, masking, obfuscation or tokenisation where appropriate. A reviewer would
typically look for architecture diagrams, configuration screenshots and a short
written standard showing where each technique is used.

**WHY IT MATTERS** — A university holds a lot of personal data: student records,
marks, admissions files, fee payments, staff and health details. Some of it relates to
children, meaning anyone under eighteen. The Rules name encryption, masking,
obfuscation and tokenisation as minimum security measures. Failing to take reasonable
security safeguards carries the highest maximum penalty in the Act.

**NEXT STEP** — Answer this question `[answer_question]`

**THE LAW**
- s.8(5) (the law) — The organisation must protect personal data it holds or controls,
  including data processed by its vendors, by taking reasonable security safeguards to
  prevent a breach.
- Rule 6(1) (the law) — Minimum safeguards include encryption, obfuscation, masking or
  virtual tokens, access control, logging, backups and security clauses in vendor
  contracts.
- Rule 1(4) (the law) — Rule 6 comes into force eighteen months after publication,
  which is 13 May 2027.
- s.33 (the law) — The Board may impose a penalty from the Schedule after an inquiry.
  For failing to take reasonable security safeguards, the penalty may extend to two
  hundred and fifty crore rupees.

**EVIDENCE** — Architecture or data-flow diagram of key university systems showing
encryption at rest and in transit · Screenshots of database, disk and backup
encryption settings (with personal data removed) · Screenshots of TLS/HTTPS
configuration on student, admissions and results portals · Examples of masked
identifiers (e.g. Aadhaar, bank, phone) in screens or reports · Approved encryption or
cryptography standard, with an owner and review date · Key management procedure and
records · Vendor contract clauses on security safeguards and vendor security
attestations

**MISSING** — Which systems hold student, staff and applicant personal data, and where
they are hosted · Which vendors or cloud providers process this data on the
university's behalf · Whether an encryption or data-classification policy already
exists

**TELL ME MORE** (abridged) — glosses Data Fiduciary, personal data breach and Data
Processor on first use; cites Rule 6(1)(a) and 6(1)(f); lists six kinds of evidence; says
"where appropriate" lets the university explain system by system; asks for real
personal data to be removed from screenshots; ends "Reviewers decide whether the
evidence is sufficient. This explanation does not approve anything." and "Rule 6
applies from 13 May 2027."

`flags: requiresHumanReview=true legalReviewRequired=false injectionFlagged=false citationsDropped=0 · model claude-opus-5-5`

## Call 2 — R1.1 (no question of the person's own)

`HTTP 200 in 16.6s`

**ANSWER** — This question asks whether Mumbai University has a written, published way
for students, staff, applicants and alumni to ask what personal data it holds about
them, how it uses it and who it has shared it with.

**THE LAW**
- s.11(1) (the law) — A Data Principal can ask for a summary of their personal data and
  processing, the identities of others it was shared with, and other prescribed
  information.
- s.2(j) (the law) — For a child, the Data Principal includes the parent or lawful
  guardian, which matters for students under eighteen.
- Rule 14(1) (the law) — The organisation must prominently publish how to make a rights
  request and what identifier it needs, such as an enrolment ID.
- Rule 9 (the law) — Every response to a rights request must give the business contact
  details of a person who can answer questions about processing.
- Rule 14(3) (the law) — The organisation must publish a grievance response period not
  exceeding ninety days.
- s.11(2) (the law) — Sharing with authorities for the prevention or investigation of
  offences, made on a written request, need not be disclosed.
- Rule 1(4) (the law) — Rules 9 and 14 come into force eighteen months after
  publication, which is 13 May 2027.
- **s.8(10) (TrustStack default)** — The organisation must have an effective mechanism
  to deal with grievances.

`flags: requiresHumanReview=true legalReviewRequired=false injectionFlagged=false citationsDropped=0 · model claude-opus-5-5`

## Claude's reading, as a DPDP consultant (checked in `docs/legal/`)

- Every citation exists and says what the answer says it says: s.8(5); Rule 6(1)(a),
  (f); Rule 1(4) (13 May 2027); s.33 with the Schedule's item 1 (₹250 crore); s.11(1),
  (2); s.2(j); Rule 9 ("mention in every response to a communication for the exercise of
  the rights"); Rule 14(1), (3) (ninety days).
- No "compliant", no certification, no approval. Statute and dates are right, and the
  answers are about a university, not generic.
- **Finding 1 — a mislabelled source.** s.8(10) ("shall establish an effective
  mechanism to redress the grievances") is **statute**, not a TrustStack default. The
  guardrails cannot catch this: the citation is real and the wording is calm. → a
  reference-set case for Stage 1b, and walk-through call 15.
- **Finding 2 — "one sentence".** Call 1's ANSWER is two sentences. Stage 1b's panel
  shows ANSWER as the headline, so the reference set should check its length.
