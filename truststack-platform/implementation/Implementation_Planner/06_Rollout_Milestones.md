# TrustStack™ — Production-Grade Rollout Plan
## 3 Milestones: Validate → Launch → Scale

**Version:** 1.0 — June 2026  
**Philosophy:** Every milestone must (a) generate revenue, (b) validate assumptions, and (c) unlock the next milestone.

---

## PRE-ROLLOUT: Platform Hardening (P1.5)
**Before ANY beta customer is onboarded, complete:**

- [ ] FIX1: M4 grievance reference number global-unique bug fixed
- [ ] FIX2: M6 ropa.sql + M8 breach_incidents.sql applied in Supabase
- [ ] FIX3: M9 Board Dashboard aggregates M5–M8 data
- [ ] FIX4: CRON_SECRET set, Vercel Cron wired, truststack.in Resend domain, full QA
- [ ] M11: Team Management (at minimum invite + role for admin/DPO)
- [ ] M12: Billing Engine (Razorpay subscriptions live)
- [ ] M14: Onboarding Wizard (30-day guided plan)

---

## MILESTONE 1 — Controlled Beta: "Validate & Earn"
**Timeline:** Month 1–3 from go-live  
**Revenue Target:** ₹5–15 Lakhs  
**Primary Goal:** Validate the platform with real DPDP-eligible companies across all sizes

### Target Company Matrix

| Segment | Size | Count | DPDP Eligibility | Target Sectors |
|---|---|---|---|---|
| **Micro** | 1–10 employees | 2–3 | Data volume triggers DPDP (e.g., fintech app, health platform) | Fintech app, EdTech startup, D2C brand |
| **Small** | 11–100 employees | 3–4 | Revenue ₹10–100 Cr or significant personal data processing | SaaS startups, D2C, healthcare clinics |
| **Mid** | 101–500 employees | 3–4 | Revenue ₹100–500 Cr, multiple departments handling data | Funded EdTechs, NBFCs, e-commerce, HR SaaS |
| **Large** | 500+ employees | 2–3 | Revenue ₹500 Cr+, complex multi-dept data flows | NBFC, retail chain, IT services company |

**Total Beta Cohort:** 10–14 companies, hand-picked

### Beta Pricing (Early Adopter)
| Tier | Standard Price | Beta Price | Saving |
|---|---|---|---|
| Micro | ₹12,000/year | ₹6,000/year | 50% |
| Starter | ₹75,000/year | ₹37,500/year | 50% |
| Growth | ₹2,00,000/year | ₹1,00,000/year | 50% |
| Business | ₹5,00,000/year | ₹2,50,000/year | 50% |

*Early adopters get: 50% discount, dedicated onboarding support, direct feedback channel to product team, "Founding Customer" badge on Trust Center.*

### What We're Validating
1. Does the 30-day onboarding actually work for each company size?
2. Which modules create immediate value vs. require more hand-holding?
3. What breaks for 1-person companies that works fine for 500-person orgs?
4. Does the Board Dashboard resonate with CEOs and Boards?
5. Which features do DPOs use daily vs. rarely?
6. Is the PAYG model actually used, or do customers prefer subscriptions?
7. What support load does each tier generate?

### Go-To-Market Strategy for Milestone 1
- **Channel 1: Direct Outreach** — Identify 50 target companies via LinkedIn, reach CEO/CFO/CTO/DPO directly. Message: "DPDP enforcement is coming. TrustStack is the only India-native compliance platform. We're offering 50% off for founding customers."
- **Channel 2: DSCI / NASSCOM Network** — DSCI (Data Security Council of India) community is the #1 trust gateway for DPDP-aware companies. Attend events, sponsor one session.
- **Channel 3: CA / CS Firms** — Chartered Accountants and Company Secretaries are the compliance gatekeepers for SMEs. Partner with 5–10 firms: they refer clients, we offer referral commission (10% first year).
- **Channel 4: LinkedIn Thought Leadership** — Publish weekly DPDP articles explaining obligations, penalties, practical steps. Each article ends with TrustStack CTA. Target DPOs, CFOs, legal teams.
- **Channel 5: MeitY Ecosystem** — Engage with startup India programs, Digital India stakeholders. DPDP awareness is a government priority.

### Milestone 1 Success Criteria
- [ ] 10+ beta companies onboarded and actively using the platform
- [ ] At least ₹5 Lakhs collected
- [ ] 3+ case studies documented (one per size category)
- [ ] NPS from beta cohort: > 50
- [ ] All 10 modules tested end-to-end with real data
- [ ] Identified top 3 friction points per company size
- [ ] Billing engine handling real transactions without issues

---

## MILESTONE 2 — Public Launch: "Market Entry"
**Timeline:** Month 4–9  
**Revenue Target:** ₹50–75 Lakhs ARR  
**Primary Goal:** Self-serve funnel live, 50–100 paying customers, WhatsApp consent differentiator live

### Platform Requirements for Milestone 2
| Requirement | Module | Priority |
|---|---|---|
| Self-serve signup → billing → compliance active | M12 Billing | MUST |
| Multi-user management | M11 Team Mgmt | MUST |
| Guided 30-day onboarding | M14 Onboarding | MUST |
| WhatsApp Consent (unique differentiator) | M15 WhatsApp | SHOULD |
| Alert Center for DPO monitoring | M18 Alerts | SHOULD |
| DPDP Trust Center (public profile) | M17 Trust Center | SHOULD |
| PAYG credits live | M13 PAYG | SHOULD |
| truststack.in email domain verified | Infrastructure | MUST |
| Mobile-responsive all modules | QA | MUST |

### Pricing Page Goes Live
Full pricing displayed publicly. All 5 tiers + PAYG credit packs. 14-day free trial (configurable in DB — not hardcoded) for Starter and above.

### Go-To-Market Strategy for Milestone 2
- **PR Push:** "India's First DPDP-Native Compliance Platform Launches." Press releases to:
  - DSCI NewsWatch, BW CIO World, Inc42, YourStory, Economic Times Tech
  - Angle: "DPDP enforcement is months away — TrustStack makes 30-day compliance possible at ₹75K/year"
- **Case Studies:** 3+ Milestone 1 testimonials go live on website
- **Partner Channel:** CA/CS firm network from Milestone 1 formally onboarded as resellers
- **SEO Content:** "DPDP compliance checklist", "How to appoint a grievance officer India", "DPDP penalty calculator" — 20 articles targeting DPO search intent
- **LinkedIn Ads:** Targeting DPOs, CFOs, Legal Heads in India (B2B)
- **DPDP Webinar Series:** Monthly webinar "30-day DPDP compliance masterclass" — 500 attendees target, converts 5–10% to trial

### Milestone 2 Success Criteria
- [ ] 50+ paying customers (mix of tiers)
- [ ] ₹50L+ ARR from subscriptions + PAYG
- [ ] Self-serve onboarding: customer can go live without human support
- [ ] WhatsApp consent module live and used by at least 5 customers
- [ ] Trust Center live and used by customers in B2B sales
- [ ] Zero critical bugs in production
- [ ] Support ticket volume < 20/week (low = product works)
- [ ] Churn rate < 5% monthly

---

## MILESTONE 3 — Scale & Enterprise: "Market Leadership"
**Timeline:** Month 10–18  
**Revenue Target:** ₹2.5–5 Crore ARR  
**Primary Goal:** 500+ customers, enterprise contracts, DPO-as-a-Service live, sector leadership

### Platform Requirements for Milestone 3
| Requirement | Module | Priority |
|---|---|---|
| BFSI Sector Pack (RBI/SEBI overlay) | M20 Sector Packs | MUST for BFSI segment |
| Healthtech Sector Pack (DISHA overlay) | M20 Sector Packs | MUST for Healthtech |
| DPO-as-a-Service Platform | M23 | MUST for ₹3–6L tier |
| India SaaS DSR Connectors | M24 | HIGH — reduces manual work |
| DPDP Compliance API | M25 | HIGH — developer ecosystem |
| TrustStack Academy (training) | M21 | MEDIUM |
| TrustStack Compliance Badge | M22 | MEDIUM |

### Enterprise Customer Profile (Milestone 3)
- Revenue: ₹200 Cr+ or 1000+ employees
- DPO function exists or is needed
- Multi-subsidiary / multi-location operations
- Already GDPR-compliant or working with Big 4 (cost of switching is pain point)
- Need DPBI-ready evidence package at any time

### Enterprise Sales Motion
- Direct enterprise sales (AE + SE pair)
- POC: 30-day evaluation with real company data
- Legal review: TrustStack agreement + DPA with enterprise as customer
- Integration proof: Connect enterprise's top 3 India SaaS tools
- Executive briefing: Board Dashboard demo to C-suite

### Partner Ecosystem for Milestone 3
| Partner Type | Count | Revenue Share | What They Get |
|---|---|---|---|
| CA / CS Resellers | 30+ firms | 15% commission | White-label reporting, co-branded Trust Center |
| Legal Firms (Ikigai Law type) | 5 firms | Referral | "TrustStack-certified" legal review seal on notices |
| HRMS Integration Partners | 3 (Darwinbox, Keka, Zoho People) | Co-marketing | DPDP HR data templates in TrustStack |
| Cloud Providers | AWS India, Azure India | Co-sell | TrustStack on marketplace |

### Milestone 3 Success Criteria
- [ ] 500+ paying customers across all tiers
- [ ] ₹2.5 Cr+ ARR
- [ ] 3+ enterprise contracts (₹5L+/year each)
- [ ] DPO-as-a-Service: 10+ clients on the advisory tier
- [ ] BFSI + Healthtech sector packs live
- [ ] India SaaS connectors for Zoho + Freshworks + Razorpay live
- [ ] NPS > 60 sustained
- [ ] Annual churn < 10%
- [ ] 1 major analyst recognition (DSCI / Gartner India mention)

---

## Revenue Model Summary

| Source | Milestone 1 | Milestone 2 | Milestone 3 |
|---|---|---|---|
| Micro subscriptions | ₹30K | ₹5L | ₹20L |
| Starter subscriptions | ₹2L | ₹15L | ₹50L |
| Growth subscriptions | ₹5L | ₹20L | ₹80L |
| Business subscriptions | ₹5L | ₹10L | ₹70L |
| Enterprise contracts | — | — | ₹60L |
| DPO-as-a-Service | — | — | ₹40L |
| PAYG credits | ₹1L | ₹10L | ₹30L |
| Training / Academy | — | — | ₹10L |
| **Total ARR** | **~₹13L** | **~₹60L** | **~₹3.6 Cr** |

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| DPDP enforcement delayed further | Medium | High | Frame platform as "compliance readiness" not just "enforcement deadline" |
| Big 4 launches competing SaaS | Low | High | Speed + price moat. Big 4 culture doesn't build self-serve SaaS. |
| OneTrust launches India tier | Medium | Medium | Language moat (22 Indian languages) + WhatsApp channel unique to India |
| Low beta conversion to paid | Medium | High | Milestone 1 is paid (discounted) from day 1. No free beta. |
| WhatsApp Business API approval delay | Medium | Medium | Milestone 2 doesn't depend solely on WhatsApp. Multiple moats. |
| Payment gateway reliability | Low | High | Razorpay has 99.9% uptime SLA. Secondary: CCAvenue as fallback. |
