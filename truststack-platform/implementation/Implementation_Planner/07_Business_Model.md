# TrustStack™ — Business Model
## Subscription Engine + Pay-as-You-Go

**Version:** 1.0 — June 2026  
**Key Principle:** Every plan detail (price, limits, trial days, features) lives in the DB — never hardcoded. Gateway abstraction layer allows Razorpay → Stripe/CCAvenue swap without business logic changes.

---

## SUBSCRIPTION TIERS

### Tier 1: Micro — ₹12,000/year
**Target:** 1–10 employees, sole proprietors, CA offices, small shops, early-stage founders  
**Pain point:** DPDP applies due to data volume (app with 10K users), but budget is tight  

| What's Included | Limits |
|---|---|
| M1: DPDP Compass Assessment | 1 assessment/year |
| M4: Grievance Officer Portal | Public form + dashboard |
| M10: TrustChat™ | 50 questions/month |
| M9: Board Dashboard | Read-only |
| 1 user seat | — |
| Email support (48-hour SLA) | — |

**Key design decision:** Micro tier is the "DPDP awareness + basics" tier. Enough to appoint a grievance officer, run one assessment, and have TrustChat for questions. Company grows → upgrades to Starter.

---

### Tier 2: Starter — ₹75,000/year (₹6,250/month)
**Target:** 10–100 employees, D2C brands, SaaS startups, early-stage fintech/edtech  
**Pain point:** Have a website collecting personal data, need consent + notice + grievance officer  

| What's Included | Limits |
|---|---|
| All Micro features + | — |
| M2: Consent Management | 50,000 consents/month |
| M3: Privacy Notice Builder | 1 active notice |
| M5: DSR Management | 10 DSR requests/month |
| M9: Board Dashboard + PDF report | 2 PDF reports/month |
| 2 user seats | — |
| English + Hindi + 1 regional language | — |
| Email support (24-hour SLA) | — |
| 14-day free trial (configurable) | — |

---

### Tier 3: Growth — ₹2,00,000/year (₹16,667/month)
**Target:** 100–500 employees, funded startups, mid-market NBFCs, EdTechs, HealthTechs  
**Pain point:** Have DPO, processing significant personal data, need full compliance stack  

| What's Included | Limits |
|---|---|
| All Starter features + | — |
| M1: Unlimited assessments | — |
| M5: DSR Management | Unlimited requests |
| M6: ROPA Builder | Unlimited entries |
| M7: Vendor DPA Manager | 25 vendors |
| M8: Breach Response | — |
| M9: Board Dashboard | Unlimited PDF reports |
| Hindi + 3 regional languages | — |
| 5 user seats | — |
| Email + Chat support (8-hour SLA) | — |
| 14-day free trial (configurable) | — |

---

### Tier 4: Business — ₹5,00,000/year (₹41,667/month)
**Target:** 500–5000 employees, large NBFCs, retail chains, IT/ITeS companies  
**Pain point:** Complex compliance, multiple business units, need advisory layer  

| What's Included | Limits |
|---|---|
| All Growth features + | — |
| M7: Vendor DPA Manager | Unlimited vendors |
| M2: All 22 Indian languages | — |
| M15: WhatsApp Consent | — |
| M16: Aadhaar OTP (via Leegality) | — |
| M17: DPDP Trust Center | — |
| M18: Alert Center | — |
| M20: Sector Pack (choose 1: BFSI/Healthtech/EdTech) | — |
| 1 DPO Advisory Hour/month | — |
| Unlimited user seats | — |
| SLA-backed support (4-hour) | — |
| Dedicated account manager | — |

---

### Tier 5: Enterprise — Custom ₹8L–15L+/year
**Target:** 5000+ employees, banks, large enterprises, multi-subsidiary groups  
**Pain point:** Need a complete, auditable DPDP program, DPBI-ready at any time  

| What's Included |
|---|
| All Business features |
| M23: DPO-as-a-Service (Expert Advisor assigned) |
| M24: India SaaS DSR Connectors (custom connector set) |
| M25: DPDP Compliance API access |
| M20: All Sector Packs |
| Multi-org support (subsidiaries) |
| Custom SLA (2-hour support) |
| Quarterly Board Presentation by Anix AI team |
| DPBI correspondence handling |
| Annual third-party audit support |

---

### Tier 6: DPO-as-a-Service — ₹3,00,000–6,00,000/year (add-on to any Business+ tier)
**Target:** Companies that want to outsource their DPO function  

| What's Included |
|---|
| Full platform (Business tier) |
| Dedicated Anix AI expert as Virtual DPO |
| Monthly advisory call (60 min) |
| Unlimited compliance questions (TrustChat priority + email + call) |
| DPBI correspondence handled by Anix AI |
| Quarterly Board Presentation |
| Incident response support |

**Business math:** 1 advisor can serve 20–30 DPO clients using TrustStack (platform does 80% of work). Without TrustStack: 4–5 clients max. Revenue per advisor: 4–6x with TrustStack.

---

## PAY-AS-YOU-GO (PAYG) ENGINE

### Philosophy
PAYG is for companies that:
1. Want to try one feature before committing to a subscription
2. Have occasional needs (e.g., 2 breach incidents/year — subscription not worth it)
3. Are 1-person companies that only need the grievance portal + one assessment
4. Are testing TrustStack before procurement approval

**All PAYG features are available to any registered account (no subscription required).** A company can run purely on PAYG credits.

### Credit System
Credits are purchased in advance. 1 Credit = ₹1 (rounded for simplicity). Credits never expire.

| Feature | PAYG Price | Notes |
|---|---|---|
| DPDP Compass Assessment | ₹4,000/assessment | Full 45-question + scoring + gap report |
| Privacy Notice (hosted 1 year) | ₹3,000/notice | Build + host + 1 year hosting |
| Consent Management | ₹0.01/consent event (min ₹500/month) | Charged per record in consent_records |
| DSR Request Processing | ₹500/request | Per DSR submitted + workflow |
| Vendor Assessment + DPA | ₹1,500/vendor | Questionnaire + risk score + DPA generation |
| Breach DPBI Notification | ₹5,000/incident | Log + 72h countdown + Claude letter |
| Board Report PDF | ₹2,000/report | Generate + download |
| Grievance Officer Portal | ₹1,000/month | Active portal month |
| TrustChat (Q&A) | ₹10/question or ₹500 for 100Q bundle | Per Claude API call |
| ROPA Entry | ₹200/entry (export PDF: ₹1,000) | Per processing activity record |
| Extra User Seat (above tier limit) | ₹5,000/seat/year | — |
| Extra Language (above tier limit) | ₹3,000/language/year | — |

### Credit Pack Pricing (with volume discount)
| Pack | Pay | Get | Saving |
|---|---|---|---|
| Starter Pack | ₹5,000 | ₹6,000 credits | 20% bonus |
| Growth Pack | ₹15,000 | ₹18,500 credits | 23% bonus |
| Business Pack | ₹50,000 | ₹65,000 credits | 30% bonus |
| Enterprise Pack | ₹1,00,000 | ₹1,35,000 credits | 35% bonus |

### Auto-Upgrade Prompt
When an org's PAYG spend in 30 days reaches 80% of the equivalent subscription tier price, show:
> "You've spent ₹3,400 in credits this month. The Starter plan includes all this for ₹6,250/month — you'd save ₹X by subscribing."

---

## SUBSCRIPTION ENGINE TECHNICAL REQUIREMENTS

### What must NOT be hardcoded (must be in DB):
- Trial period days (currently proposed: 14 days Starter/Growth, 30 days Business+)
- Plan prices
- Feature limits per plan (consent count, user seats, vendor count, report count)
- Which features are included in each plan
- Credit-to-feature mapping (PAYG price per feature)
- Grace period after payment failure before access revoked
- Discount codes / early-adopter overrides

### Gateway Abstraction Requirement:
The billing engine must implement a `PaymentGateway` interface so that:
- Razorpay is the V1 implementation
- Adding Stripe (for international customers) = implement the same interface
- Swapping to CCAvenue = implement the same interface + change 1 config line
- Business logic (subscription lifecycle, usage metering, invoicing) is NEVER gateway-specific

See `08_Subscription_Engine_Design.md` for full technical design.

---

## PRICING RATIONALE

| Competitor | Lowest Tier | TrustStack Savings |
|---|---|---|
| OneTrust | ₹40L+/year | 99% cheaper at Micro tier |
| Securiti.ai | ₹25L+/year | 99% cheaper |
| Tsaaro | ₹3L+/year | 60% cheaper (Starter) |
| KPMG SME | ₹5L+/year | 85% cheaper |
| Big 4 engagement | ₹15–75L one-time | 10–50x cheaper AND continuous |

**The TrustStack promise:** A mid-market Indian company should go from zero to DPDP-compliant in 30 days, self-serve, no consultants, starting at ₹75,000/year.
