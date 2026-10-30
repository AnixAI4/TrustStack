# Slice 10 · Stage 4a — walk-through: the processor register, the questionnaire, its controls

**Branch** `slice/10-workflow-modules` · **draft PR #28** · **migration**
`20261015000000_processor_register` (additive; **local only** — it goes to
hosted when you approve Stage 4a) · **calls** D-091 · **manual test**
`docs/testing/SLICE_10_stage4a_manual_test.md` · **exposure model 1.4.0**.

## What you are approving

1. **The processor register** — every vendor, whether a valid contract with
   DPDP clauses is recorded (s.8(2), Rule 6(1)(f)), and the documents behind it.
2. **The questionnaire, entered by staff** — the old app's 45 questions, with
   where the answers came from.
3. **The seven accuracy controls** you made required (D-089) — §3 shows where
   each one is enforced.
4. **The 1.4.0 rows** on heads 1 and 7 (§5) — the effect you settled
   (`not_mitigated`), plus the "out of date" reason.
5. **Four calls to confirm** (§8).

## 1. The processor register (top menu → **Processors**)

One row per vendor in the vendor register (vendors are still added in the
scope wizard). Counts across the top: *Processors · No contract with DPDP
clauses recorded · Never assessed · Awaiting review · Assessment out of date*.
Anyone **not** recorded as an independent fiduciary counts as a processor —
"not known" counts (D-026).

A vendor's page has three parts:

| Part | What it holds | Who changes it |
|---|---|---|
| **Contract** | A contract exists · it has DPDP clauses (the register's yes / no / not known) · signed on · review by | `scope.write` — the programme leads (D-091.2) |
| **Documents** | The signed contract, certificates, reports — **stored files**, never a link | `vendor.assess` |
| **Assessments** | Every version, with its status, risk, who entered and who accepted it | `vendor.assess` to enter; `vendor.review` to accept |

A red note says when no contract with DPDP clauses is recorded, and that heads
1 and 7 cannot be Mitigated until it is. An amber note says when the
contract's own review date has passed (shown only — not a model input).

## 2. The questionnaire

The old bank, as data: **A** Company and certifications · **B** Data handling ·
**C** Security · **D** Sub-processors · **E** Residency and transfers ·
**F** Incident response · **G** DPDP obligations — 45 questions, 44 scored,
the old weights and the old tiers (≤ 25 Low · ≤ 50 Medium · ≤ 75 High ·
above that Critical). **The risk score is TrustStack's indicator, 0–100,
higher is riskier — not statute, not a status, and it does not feed the
model** (pitfall 1). Wording changes (D-091.4): **G1** now asks whether a
signed contract with DPDP clauses **is in place** (the old "will the vendor
sign" could be answered yes with nothing signed); F2–F3 cite Rule 7; E4 drops
"SCC-equivalent".

Each question: its answers (Yes / No / Partly, or a list), **Not applicable**
with a reason, and — for the five that need one — a list of the vendor's
documents to cite. A draft may be partial; **Save** keeps it, **Submit for
review** sends it to a second person, **Discard** deletes a draft.

## 3. The accuracy controls (D-089) — where each is enforced

| Control | What happens | Enforced by |
|---|---|---|
| **Complete** | Submitting is refused until every scored question is answered or marked not applicable **with a reason**, and the source is stated. The refusal names the questions. | `submit_vendor_assessment` (database) |
| **Evidence-backed** | **A3** ISO 27001 · **A4** SOC 2 · **C4** penetration test · **D2** sub-processor list · **G1** signed contract: a "Yes" or "Partly" with no document cited scores as the **risky answer** and is listed "**Claimed, no evidence**". A cited document counts unless its evidence review says rejected or outdated. | `app.vendor_assessment_risk` (database); the screen says so |
| **Consistency** | Seven rules flag answers that disagree with the vendor register (or each other) — **for the reviewer, never resolved**. E.g. "stored in India" vs the register's "sends it outside India"; G1 "yes" vs "no DPDP clauses recorded". | core `VENDOR_CONSISTENCY_RULES`, on the page |
| **A second person** | Only an **accepted** assessment counts. Nobody who **started, answered or submitted** it may accept or return it (D-091.9 — stricter than "entered"). Returning needs a reason. | `review_vendor_assessment` (database) |
| **Attributed** | Who started, answered, submitted and reviewed it, and when; the stated source. Stamped — never sent by the browser. Each step audited once, without free text. | the five functions |
| **Frozen** | An accepted assessment and its answers never change — for tooling too. A correction is a **new version**, which starts from it. | guard triggers |
| **Current** | Review by **12 months** after acceptance (a TrustStack default, labelled so); the reviewer may pick any date within 36 months. After it: "**Assessment out of date**" — on the vendor, in the counts, and a reason in the model. | `review_vendor_assessment`; core |

## 4. Permissions (a matrix change, core + migration — D-020)

| | `vendor.assess` (enter, submit, attach) | `vendor.review` (accept, return) |
|---|---|---|
| Super Admin · Consultant · Organisation Admin · DPDP Programme Owner | ✓ | ✓ |
| Legal User · Procurement User | ✓ | ✓ |
| Department Owner · IT/Security User | ✓ | — |
| Executive Sponsor · Auditor/Reviewer | — (read) | — |

## 5. Model 1.4.0

| Row | Head | Provision | Effect |
|---|---|---|---|
| `vendor_contract_missing` — a processor with no contract, or no DPDP clauses, recorded | H1 | s.8(5), Rule 6(1)(f) | **bars Mitigated** (never Exposed) |
| the same fact | H7 | s.8(2) | **bars Mitigated** |
| `vendor_assessment_out_of_date` — an accepted assessment past its review-by date | H1, H7 | TrustStack default | a **reason**, never a status |

Counted over the **whole** vendor register (linked to a processing record or
not) — the same test as the register rule `processor_contract_missing`, which
stays as it was. As 1.1.0's breach row, a not-mitigated fact **does not make a
head "assessed" on its own**: a new tenant with no assessment keeps heads 1 and 7
"Not yet assessed", and the processor register shows the gap.

**Mumbai University**: the LMS provider (clauses "no") and the AI proctoring
vendor (clauses "not known") are the two; the payment gateway (yes / yes) is
not counted. On your laptop MU's register gaps were generated by earlier tests,
so heads 1 and 7 are assessed — both **Partially mitigated**, and each now says
"*2 processors have no contract with DPDP clauses recorded — …*" beside the
register's own "*Processor without a valid contract (1 open gap)*". They could
not be Mitigated before either (that register gap is High); 1.4.0 adds the
reason, and it holds even for a processor no processing record links to.

1.4.0 is in core and in this stage's own migration; both mirror tests pass
(the generator now carries vendors — every role, contract answer and a
review-by date on, before and after today).

## 6. Gate 5 and what the tests prove

- **RLS** (`tests/rls/vendors.test.ts`, 21): another tenant reads and writes
  nothing, and its ids are the same 404 as none; nobody writes either table
  directly; each control; documents; the audit; an organisation's deletion still
  removes everything; **the questionnaire and the score equal core's — 120
  generated answer sets, digit for digit**; a stored 1.4.0 snapshot.
- **API** (`e2e/api/processors.spec.ts`, 7, disposable tenant `…a01b`): the
  contract dates, a document, the whole lifecycle with three people, a new
  version, the model, cross-tenant 404s. **Sweep**: 8 new probes.
- **UI** (`e2e/ui/processors.spec.ts`, 3, `…a01c`): the Dean reads MU's register
  and the LMS flags; the Registrar is told someone else must review; an admin
  submits and Legal accepts.
- **CI**: a new gate (no client writes either table, the guard triggers, the
  questionnaire as approved, the 1.4.0 rows, the seed reviewed by someone else),
  seed counts, the model pin 1.4.0.

**CI green on `92ebae9`**: core 1,126 · web unit 492 · RLS 484 · e2e 355/355.

## 7. Not in 4a

The vendor-facing link (Stage 4b); the reports (Stage 6); an AI-drafted DPA or
AI review of a contract (Slice 11); reminders on a timer (Slice 13); a fifth
action parent (a vendor's fix is the register's — D-091.16).

## 8. Four calls to confirm

1. **Who may change the contract facts** — today `scope.write` (the programme
   leads). Legal and Procurement assess and review but cannot mark "DPDP clauses:
   yes". Widen to them? (D-091.2)
2. **A pending document counts** for the evidence rule; only rejected or outdated
   ones do not. The second person reviewing the assessment is the check. (D-091.6)
3. **Nobody who answered** may review — stricter than "entered". (D-091.9)
4. **The out-of-date reason on both heads** 1 and 7, and review-by up to 36 months.
   (D-091.13, D-091.15)

## Then

Approve with **"Stage 4a approved"** (or "Stage 4a approved with changes: …").
The migration then goes to hosted (additive), and Stage 4b — the vendor-facing
questionnaire link — is next.
