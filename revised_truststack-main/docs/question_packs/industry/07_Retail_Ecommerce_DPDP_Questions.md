# 07 — Retail / E-commerce DPDP Questions
## TrustStack™ DPDP Compass — Industry Question Bank

**Industry:** Retail / E-commerce / D2C / Marketplace / Omnichannel Retail / Quick Commerce / Consumer Apps  
**Use in product:** Industry overlay on top of the Core 16-Domain DPDP Compass Assessment  
**Version:** v1.0  
**Prepared for:** TrustStack™ DPDP Compass assessment engine, consultant-led assessments, ROPA module, evidence review, dashboards/reports, and AI Assistant guidance

---

## 1. How to use this industry file

This file is an **industry overlay**. It should not replace the core DPDP Compass assessment.

The correct assessment design is:

```text
Core DPDP Compass 16-domain assessment
+ Retail / E-commerce industry overlay
+ Conditional packs: payment, loyalty, marketplace sellers, logistics, marketing/adtech, app tracking, cookies, AI personalisation, fraud scoring, children/minors, cloud/cross-border, breach
+ Organisation-specific dynamic questions for channels, websites, mobile apps, stores, warehouses, vendors, franchises, sellers, delivery partners and ROPA records
```

The Retail / E-commerce overlay should be used for:

- online marketplaces,
- inventory-led e-commerce entities,
- D2C brands,
- omnichannel retailers with website/app and physical stores,
- quick-commerce and grocery platforms,
- fashion, electronics, lifestyle, furniture, FMCG, beauty, wellness, consumer durables and pharmacy-like retail flows,
- B2B marketplaces and distributor portals,
- loyalty-led retail businesses,
- franchise-led or multi-store retail chains,
- subscription commerce,
- consumer apps using wallets, coupons, personalization, referral, marketing automation, analytics or AI recommendation engines.

Important positioning:

> Retail and e-commerce organisations are often high-volume personal-data processors. They collect data continuously across browsing, search, cart, checkout, payment, delivery, returns, refunds, customer support, loyalty, marketing, reviews, fraud prevention, personalization, seller onboarding and physical-store interactions. DPDP readiness for this sector must therefore assess both digital trust and operational execution.

---

## 2. Research and regulatory baseline used

This question bank is designed around the DPDP Compass framework and retail/e-commerce operating reality in India.

### 2.1 DPDP baseline

The Retail / E-commerce template must map to the same 16 domains used across all DPDP Compass assessments:

1. Governance, accountability and DPDP ownership
2. Personal data discovery and inventory
3. ROPA / Processing Activity Register
4. Purpose, lawful basis and data minimisation
5. Notice management
6. Consent and consent withdrawal
7. Data Principal rights
8. Grievance redressal and contact publication
9. Retention, erasure and archival
10. Data accuracy and quality
11. Security safeguards
12. Personal data breach readiness
13. Vendor / Data Processor governance
14. Children’s data and guardian consent
15. Cross-border transfer and cloud/SaaS risk
16. SDF, DPIA, audit and AI/algorithmic risk readiness

### 2.2 Retail / e-commerce sector references to consider

These references should be used as **sector context**, not as a replacement for DPDP legal analysis:

| Reference area | Why it matters for DPDP Compass retail/e-commerce assessment |
|---|---|
| Digital Personal Data Protection Act, 2023 | Main legal baseline for processing digital personal data in India |
| Digital Personal Data Protection Rules, 2025 | Operational baseline for notice, safeguards, breach intimation, rights, children and implementation controls |
| Consumer Protection (E-Commerce) Rules, 2020 | Useful context for e-commerce roles, responsibilities, marketplace/inventory distinctions and consumer grievance workflows |
| CCPA Guidelines for Prevention and Regulation of Dark Patterns, 2023 | Useful context for consent UX, choice architecture, misleading design, forced action, drip pricing, false urgency and manipulative interfaces |
| RBI Payment Aggregator / Payment Gateway and Card-on-File tokenisation circulars | Important context for card-data storage, saved card/token flows, payment chain data and payment-vendor evidence |
| RBI Storage of Payment System Data direction/FAQ | Relevant where the entity is part of payment-system data processing or uses payment service providers |
| CERT-In Directions under Section 70B | Useful cyber incident, log, clock synchronisation and reporting context for digital platforms where applicable |
| OWASP API Security Top 10 2023 | Useful security reference because retail/e-commerce depends heavily on APIs, mobile apps, checkout, seller portals and partner integrations |
| PCI-DSS and payment security practices | Useful evidence reference for card/payment-security controls, but not a substitute for DPDP assessment |
| Advertising, analytics and cookie/tracking governance | Important where the retailer uses ad pixels, retargeting, campaign audiences, SDKs, customer-data platforms and personalization engines |

### 2.3 Retail / e-commerce-specific DPDP distinction

Retail organisations must distinguish between:

| Processing context | DPDP Compass implication |
|---|---|
| Account creation and guest checkout | Different notice, consent, retention and deletion expectations may apply |
| Browsing and behavioural data | Cookies, SDKs, profiling, retargeting and personalization must be mapped |
| Cart, wishlist and search history | May reveal preferences and require purpose clarity and retention limits |
| Order fulfilment | Customer and recipient details are shared with warehouses, stores, logistics and delivery partners |
| Payment processing | Card, UPI, wallet, refund and reconciliation data must be mapped carefully; actual card credentials should not be stored by merchants where RBI restrictions apply |
| Saved cards/tokenisation | Tokenisation consent, de-registration, payment-provider roles and audit trails need review |
| Returns and refunds | Bank/UPI/refund details, address, product issues and complaint data may be retained longer than needed |
| Loyalty and membership | Loyalty IDs, points, purchase history, birthday/anniversary data and personalization rules create profiling risk |
| Marketing and adtech | Consent, preference management, suppression lists, pixels, retargeting and third-party sharing are high-priority checks |
| Marketplace sellers | Seller KYC, seller staff data, customer sharing and seller access to buyer details create governance complexity |
| Customer support | Calls, chats, tickets and recordings may contain personal data and require retention/access controls |
| Product reviews and UGC | Reviews may contain names, photos, videos, location, product usage and moderation decisions |
| Offline stores / POS | Omnichannel retail links in-store data with online customer profiles, loyalty and marketing |
| AI recommendation/pricing/fraud | AI use can create privacy, fairness, profiling, transparency and human-review questions |

The product should not assume all retail/e-commerce organisations have the same risk profile. Risk should be based on the actual channels, data flows, vendors, processing purposes and automation level.

---

## 3. Typical retail / e-commerce organisation types

| Organisation type | Examples | Assessment emphasis |
|---|---|---|
| D2C brand | Brand-owned website/app | customer registration, checkout, logistics, marketing, loyalty, support |
| Inventory-led e-commerce | Retailer owns inventory | order management, warehouse, returns, payment, logistics, customer support |
| Marketplace e-commerce | Multiple third-party sellers | seller onboarding, seller access to customer data, marketplace liability, grievance and vendor governance |
| Omnichannel retail chain | Website/app + physical stores | POS, loyalty, in-store data capture, CCTV, store staff access, central CRM |
| Quick commerce / grocery | Fast delivery, hyperlocal | location data, delivery partner sharing, address precision, fraud, high order volume |
| Pharmacy / wellness commerce | OTC/regulated healthcare-like flows | health-related purchase inference, prescription-like documents, higher privacy review, healthcare pack trigger |
| Electronics / consumer durables | Warranty, installation, service | delivery, installation partners, warranty registration, high-value fraud checks |
| Fashion / lifestyle | high marketing and return volume | personalization, returns, size/profile data, reviews, loyalty, influencer data |
| Subscription commerce | recurring orders | payment mandates, cancellation, retention, preference management |
| B2B marketplace | retailers, distributors, sole proprietors | business contact data, proprietor KYC, GST/contact details, credit and vendor checks |
| Franchise-led retail | franchise stores | data sharing, access controls, responsibility matrix, local store compliance |
| Social commerce / creator commerce | influencers, referrals, community sales | referrals, UGC, creator data, messaging platforms, platform/intermediary triggers |

---

## 4. Typical Data Principal groups

| Data Principal group | Typical data points | Notes for assessment |
|---|---|---|
| Website visitors | device IDs, cookies, IP, browsing behaviour | often captured before account creation |
| Registered customers | name, email, phone, login, profile | central Data Principal group |
| Guest checkout customers | name, phone, delivery address, email | retention and account creation clarity needed |
| App users | device ID, location, permissions, app events | app permissions and SDK mapping required |
| Loyalty members | loyalty ID, points, purchase history, preferences | profiling/personalization risk |
| Gift recipients | name, address, phone, message | Data Principal may not be account holder |
| Delivery recipients | address, landmark, phone, OTP, proof of delivery | shared with logistics/delivery partners |
| Customer support users | call recordings, chats, tickets, complaint details | retention, access and masking controls needed |
| Product reviewers / UGC contributors | name, photo, review, rating, media | public disclosure and moderation review needed |
| Marketplace sellers | individual/proprietor KYC, contacts, bank details | seller data often overlooked |
| Seller staff / seller users | portal users, contact, role, access logs | B2B data but still personal data |
| Store customers | POS invoices, loyalty lookup, phone number | offline notice and consent capture needed |
| Store employees and franchise staff | attendance, payroll, performance, access | employee data pack may apply |
| Delivery partners / drivers | name, phone, ID, location, payouts | direct or vendor-managed roles need clarity |
| Influencers / affiliates | contact, payout, campaign performance | marketing/vendor processing |
| Job applicants | CVs, contact, assessments | HR data retention and access |
| Children / minors | accounts, orders, games/toys, teen users | child-data trigger if applicable |

---

## 5. Typical personal data categories

| Category | Examples | Risk notes |
|---|---|---|
| Identity and contact | name, phone, email, customer ID | core customer data |
| Address and delivery | home/office address, landmark, geolocation, pincode | high misuse risk if leaked |
| Account and authentication | username, password hash, OTP, session data | security-critical |
| Order and transaction | order history, product details, invoices, returns | profiling and retention risk |
| Payment-related | payment method, token, last four digits, UPI reference, refund account | card credentials require special payment compliance review |
| Device and tracking | cookies, device ID, IP, SDK events, app permissions | consent/notice and adtech governance required |
| Behavioural/profile | search, wishlist, cart, browsing, preferences, recommendations | profiling and AI/personalization risk |
| Loyalty | points, tiers, membership ID, offers, referrals | retention and marketing consent needed |
| Support and complaints | chat transcripts, calls, recordings, ticket history | may contain sensitive user-provided data |
| Returns/refunds | reason, photos, pickup address, bank/UPI details | retention and vendor sharing risk |
| Seller/proprietor data | KYC, PAN/GST, bank details, contact, payout info | B2B but can be personal data |
| Employee/store staff data | HRMS, payroll, attendance, performance, CCTV | employee DPDP workflows needed |
| UGC and reviews | ratings, photos, videos, names, public profile | disclosure and moderation controls |
| Fraud/risk signals | device fingerprint, risk score, velocity, blacklist flags | AI/profiling and accuracy risk |
| Children’s data | DOB/age, guardian details, teen account info | high-risk conditional assessment |

---

## 6. Typical systems and applications

| System/application | DPDP assessment focus |
|---|---|
| Website storefront | notices, cookies, forms, checkout, analytics, account creation |
| Mobile app | permissions, SDKs, location, push notifications, app analytics |
| Order Management System | order lifecycle, address, customer data, returns, refunds |
| Payment gateway / aggregator | payment data, tokenisation, settlement, disputes, vendor contract |
| Customer Data Platform / CRM | unified profiles, segmentation, marketing, rights fulfilment |
| Marketing automation | consent, unsubscribe, suppression lists, campaign audiences |
| Adtech and analytics | pixels, retargeting, cookie IDs, lookalike audiences, cross-site tracking |
| Warehouse Management System | packing, shipping labels, warehouse access, staff visibility |
| Transport / Delivery Management | rider/driver access, recipient data, proof of delivery |
| Return Management System | pickup data, refunds, customer complaints, product photos |
| Helpdesk / call centre | chats, recordings, tickets, escalations |
| Loyalty platform | points, tiers, purchase history, personalization |
| Review / UGC platform | public reviews, moderation, display preferences |
| Fraud/risk engine | device fingerprinting, risk scores, order blocking, blacklists |
| Recommendation engine | personalization, AI/ML models, behavioural data |
| Seller portal | seller KYC, seller-user access, buyer details, fulfilment data |
| POS / store billing | phone capture, loyalty lookup, in-store notices |
| ERP / finance | invoices, GST, settlement, refunds, vendor data |
| HRMS / payroll | employee data, store staff, warehouse staff |
| BI/data lake | consolidated customer, order, campaign and behavioural data |
| Cloud/CDN/logging tools | data location, logs, access, retention, security |

---

## 7. Typical vendors / Data Processors

| Vendor / processor type | Personal data exposure |
|---|---|
| Payment gateway / payment aggregator | payment references, transaction IDs, refund status, card token flows |
| Logistics / courier / 3PL | name, phone, address, delivery OTP, proof of delivery |
| Warehouse / fulfilment partner | shipping labels, returns, packing data |
| Call centre / BPO | customer identity, orders, complaints, recordings |
| CRM / CDP vendor | customer profiles, order history, marketing preferences |
| Email/SMS/WhatsApp provider | contact details, campaign or transactional messages |
| Marketing/adtech platform | cookies, device IDs, segments, campaign audiences |
| Analytics and tag manager | event logs, behaviour, device data |
| Cloud provider / CDN | application data, logs, backups, location risk |
| Fraud detection vendor | device fingerprint, order risk, blacklist, identity indicators |
| Loyalty platform vendor | loyalty ID, purchase history, tier data |
| Review/UGC provider | user names, ratings, photos/videos, moderation data |
| Returns/refund vendor | pickup address, bank/UPI references, complaint info |
| Installation/service partner | customer address, phone, product details |
| Marketplace sellers | buyer delivery details, order details, return/refund details |
| Franchisees / store operators | POS, loyalty, customer support, CCTV/store access |
| AI/ML provider | prompts, behavioural features, support transcripts, recommendation logs |

---

## 8. Key retail / e-commerce data flows to map

| Data flow | Why it should be mapped |
|---|---|
| Visitor lands on website/app | cookies, SDKs, analytics and tracking may start before login |
| User creates account | notice, consent, purpose, authentication and retention begin |
| Guest checkout | accountless personal-data processing and retention must be clear |
| Search/cart/wishlist | behaviour profile and personalization risk |
| Checkout | notices, delivery data, payment method, marketing prompts |
| Payment | payment-vendor roles, tokenisation, reconciliation, refunds |
| Order fulfilment | sharing with warehouse, seller, courier and delivery staff |
| Delivery | address, phone, location, OTP, proof of delivery |
| Returns/refunds | bank/UPI details, photos, pickup address, complaint data |
| Customer support | call/chat data, authentication, access controls, recordings |
| Loyalty programme | profiling, points, segmentation, offers |
| Marketing campaign | consent, unsubscribe, suppression, audience sharing |
| Product review | public disclosure, moderation, retention |
| Fraud prevention | risk scoring, device fingerprinting, blocking and accuracy |
| Marketplace seller fulfilment | seller access to buyer data and accountability |
| Store/POS transaction | offline capture linked with online profile |
| AI recommendation | model features, logs, personalization and human review |
| Account closure/deletion | retention exemptions, erasure workflow, downstream vendor deletion |

---

## 9. Key DPDP risks in retail / e-commerce

| Risk | Why it matters |
|---|---|
| Over-collection at checkout | More data than needed may be collected for simple purchases |
| Hidden marketing consent | Marketing bundled with account/checkout can weaken consent quality |
| Cookie and adtech sprawl | Data sharing through pixels/SDKs is often poorly inventoried |
| Excess retention | Old orders, tickets, carts, leads and call recordings may remain indefinitely |
| Weak vendor governance | Logistics, BPO, marketing and SaaS vendors process customer data daily |
| Payment-data misunderstanding | Retailers may incorrectly store card or payment credentials |
| Marketplace role confusion | Buyer data may flow to sellers without clear responsibility or controls |
| Customer support exposure | Agents may access too much order/customer history |
| Delivery-address leakage | Home address and phone data can create real-world safety risks |
| Account takeover | Customer accounts contain orders, addresses, loyalty and payment tokens |
| AI/profiling opacity | Recommendations, dynamic offers and fraud blocks may be unexplained |
| Dark-pattern consent UX | Interface design can undermine free, specific and informed choices |
| In-store capture without notice | Phone numbers collected at billing counters may be used for marketing |
| Public review leakage | Review text/photos may disclose personal data unintentionally |
| Cross-border SaaS/adtech | Data location and vendor onward transfer may be unclear |

---
## 10. Industry-specific assessment questions

Each question below is an **industry overlay question**. It should map into the 16 DPDP Compass domains and should be used with core DPDP questions, not instead of them.
### 10.1 GOV — Governance, accountability and DPDP ownership
| Code | Assessment question | Type | Evidence to check | Suggested owner | Priority |
|---|---|---|---|---|---|
| RET-GOV-001 | Has a formal DPDP owner been appointed for the retail/e-commerce business, covering website, app, stores, logistics, support, marketing, vendors and marketplace operations? | Mandatory / High-risk | DPDP owner appointment note, governance charter, RACI, committee minutes | Executive Sponsor / DPDP Owner | P0 |
| RET-GOV-002 | Has the organisation mapped whether it acts as Data Fiduciary, Data Processor, marketplace operator, seller, franchise operator, or technology provider in different data flows? | Mandatory / ROPA-linked | Role classification matrix, contracts, platform terms, seller/franchise agreements | Legal / Compliance | P0 |
| RET-GOV-003 | Is there a DPDP governance framework for all customer-facing digital channels, including website, mobile app, POS, support, seller portal and loyalty programme? | Mandatory | Policy, operating model, channel inventory, governance cadence | DPDP Owner / Product / IT | P1 |
| RET-GOV-004 | Are privacy, legal, IT security, product, marketing, customer support, logistics and procurement represented in DPDP governance? | Mandatory | Committee structure, meeting records, stakeholder RACI | DPDP Owner | P1 |
| RET-GOV-005 | Does the product-release process require privacy review for new forms, checkout changes, app permissions, cookies, pixels, campaigns, AI models and vendor integrations? | High-risk / AI-linked | Product privacy review checklist, release gate, Jira workflow, approval evidence | Product / Legal / Security | P1 |
| RET-GOV-006 | Are offline stores, franchisees, warehouse teams and call-centre teams included in the DPDP operating model? | Conditional / Omnichannel | Store SOPs, franchise RACI, training records, access matrix | Operations / Retail Head | P1 |
| RET-GOV-007 | Is there an approved policy for fair, transparent and non-manipulative consent/user-interface design, especially for marketing, cookies, subscriptions, saved cards and cancellation flows? | High-risk / UX-linked | UX policy, dark-pattern review checklist, consent screenshots, design approvals | Product / Legal / UX | P1 |
| RET-GOV-008 | Does management review DPDP risk metrics such as evidence confidence, vendor risk, breach readiness, cookie inventory, customer rights requests and open P0/P1 actions? | Mandatory | Dashboard, management report, review minutes, action tracker | Executive Sponsor / DPDP Owner | P1 |

### 10.2 INV — Personal data discovery and inventory
| Code | Assessment question | Type | Evidence to check | Suggested owner | Priority |
|---|---|---|---|---|---|
| RET-INV-001 | Has personal data collected across website, mobile app, POS, call centre, store, seller portal, warehouse, delivery and marketing systems been inventoried? | Mandatory / High-risk | Data inventory, system list, field map, channel data map | DPDP Owner / IT / Business | P0 |
| RET-INV-002 | Are checkout data fields mapped separately for registered users and guest checkout users? | Mandatory | Checkout field list, guest checkout flow, data dictionary | Product / IT | P1 |
| RET-INV-003 | Are cart, wishlist, search history, product-view history and browsing behaviour captured in the inventory? | High-risk / Profiling | Event taxonomy, analytics data map, CDP schema | Product Analytics / IT | P1 |
| RET-INV-004 | Are cookies, pixels, SDKs, tag managers and app analytics tools inventoried with purpose and vendor mapping? | High-risk / Marketing-linked | Cookie inventory, tag audit, SDK list, vendor list | Marketing / Product / IT | P0 |
| RET-INV-005 | Are delivery-recipient and gift-recipient data categories separately identified from account-holder data? | Conditional / Logistics-linked | Order/delivery data model, gift flow, delivery sharing map | Operations / Logistics | P1 |
| RET-INV-006 | Are payment-related data categories documented, including payment method, token/reference, last four digits, UPI/reference IDs, refund data and reconciliation data? | High-risk / Payment-linked | Payment data flow, PG/PA documentation, payment data field map | Finance / IT / Security | P0 |
| RET-INV-007 | Are customer support data categories captured, including call recordings, chats, attachments, complaint notes and authentication questions? | Mandatory | Helpdesk fields, call recording policy, transcript retention list | Customer Support / IT | P1 |
| RET-INV-008 | Are seller, seller-staff, franchisee, influencer, affiliate and service-partner personal data categories inventoried where applicable? | Conditional / Vendor-linked | Seller onboarding fields, franchise records, affiliate records | Marketplace / Procurement / Legal | P1 |

### 10.3 ROPA — Processing Activity Register
| Code | Assessment question | Type | Evidence to check | Suggested owner | Priority |
|---|---|---|---|---|---|
| RET-ROPA-001 | Is there a ROPA record for customer account registration and profile management? | Mandatory | ROPA record, account flow, data categories, purpose, retention | DPDP Owner / Product | P0 |
| RET-ROPA-002 | Is there a ROPA record for browsing, search, cart, wishlist and personalization processing? | High-risk / Profiling | ROPA record, event taxonomy, analytics/CDP map | Product / Data Team | P1 |
| RET-ROPA-003 | Is there a ROPA record for checkout, order creation, invoicing and order lifecycle management? | Mandatory | ROPA record, order process SOP, OMS data map | Operations / Finance / IT | P0 |
| RET-ROPA-004 | Is there a ROPA record for payment processing, reconciliation, refunds, chargebacks and saved payment token flows? | High-risk / Payment-linked | Payment ROPA, PG/PA contracts, tokenisation flow | Finance / IT / Security | P0 |
| RET-ROPA-005 | Is there a ROPA record for fulfilment, warehouse processing, shipment label generation and delivery partner sharing? | Mandatory / Vendor-linked | ROPA record, warehouse/logistics SOP, data-sharing map | Operations / Logistics | P1 |
| RET-ROPA-006 | Is there a ROPA record for returns, refunds, replacement, warranty and service partner processing? | Mandatory | Returns SOP, ROPA record, vendor/service mapping | Operations / Customer Support | P1 |
| RET-ROPA-007 | Is there a ROPA record for marketing, loyalty, referrals, campaign audiences, retargeting and suppression lists? | High-risk / Marketing-linked | Marketing ROPA, consent/preference logs, campaign tool map | Marketing / Legal | P0 |
| RET-ROPA-008 | Is there a ROPA record for AI recommendation, fraud scoring, automated segmentation, chatbot and dynamic-offer processing? | Conditional / AI-linked | AI use-case register, ROPA, DPIA-style review | Data Science / Product / Legal | P1 |

### 10.4 PURPOSE — Purpose, lawful basis and data minimisation
| Code | Assessment question | Type | Evidence to check | Suggested owner | Priority |
|---|---|---|---|---|---|
| RET-PUR-001 | Is every customer data field collected during registration and checkout mapped to a specific business purpose? | Mandatory | Field-to-purpose matrix, form inventory, product requirements | Product / Legal | P0 |
| RET-PUR-002 | Are optional profile fields such as DOB, gender, anniversary, preferences and lifestyle data separated from mandatory purchase fields? | High-risk / Minimisation | Profile form screenshots, optional/mandatory mapping, purpose note | Product / Marketing / Legal | P1 |
| RET-PUR-003 | Is delivery address, landmark and geolocation collected only where necessary for fulfilment or specific user-enabled services? | High-risk / Location-linked | Address/location flow, app permission purpose, delivery SOP | Product / Logistics | P1 |
| RET-PUR-004 | Is marketing/personalization purpose separated from fulfilment, payment, invoice, support and statutory/record purposes? | Mandatory / Consent-linked | Purpose matrix, privacy notice, consent design | Marketing / Legal | P0 |
| RET-PUR-005 | Are fraud-prevention and risk-scoring data elements limited to what is necessary and proportionate for fraud control? | High-risk / AI-linked | Fraud system data dictionary, model feature list, risk review | Risk / Data Science / Security | P1 |
| RET-PUR-006 | Are returns/refund data fields, photos and bank/UPI details limited to what is required to process the request? | Mandatory | Returns form, refund workflow, data minimisation review | Operations / Finance | P1 |
| RET-PUR-007 | Are product reviews, photos, videos and public profiles collected and displayed only for clear review/community purposes? | Conditional / UGC-linked | Review submission UI, display policy, moderation policy | Product / Legal | P2 |
| RET-PUR-008 | Are seller, franchisee and partner data fields collected only for onboarding, due diligence, fulfilment, payment and compliance purposes? | Conditional | Seller onboarding forms, partner KYC purpose map | Marketplace / Procurement / Legal | P1 |

### 10.5 NOTICE — Notice management
| Code | Assessment question | Type | Evidence to check | Suggested owner | Priority |
|---|---|---|---|---|---|
| RET-NOT-001 | Is a clear privacy notice available at all major online collection points: sign-up, checkout, guest checkout, app install, loyalty enrolment, support and seller onboarding? | Mandatory / High-risk | Privacy notice, screenshots, version history, collection-point mapping | Legal / Product | P0 |
| RET-NOT-002 | Does the checkout page provide appropriate notice or link before collecting delivery, contact and payment-related data? | Mandatory | Checkout screenshots, UX evidence, notice version | Product / Legal | P1 |
| RET-NOT-003 | Does the mobile app explain data processing linked to app permissions such as location, camera, contacts, notifications, storage and device identifiers? | Conditional / App-linked | App permission screens, app privacy notice, permission rationale | Product / Mobile Team | P1 |
| RET-NOT-004 | Is cookie/tracking notice provided before or at the point where cookies, pixels, SDKs or analytics tools collect personal data? | High-risk / Marketing-linked | Cookie banner, cookie policy, tag map, consent/preference screen | Marketing / Product / Legal | P0 |
| RET-NOT-005 | Are loyalty programme terms and privacy notice clear about purchase-history use, profiling, offers, points, expiry and partner sharing? | Conditional / Loyalty-linked | Loyalty terms, privacy notice, enrolment screenshots | Marketing / Legal | P1 |
| RET-NOT-006 | Are call recording and chat support notices presented before or during customer support interactions? | Mandatory | IVR scripts, chat notice, helpdesk screenshots | Customer Support / Legal | P1 |
| RET-NOT-007 | For offline/POS capture, is notice available where customers provide phone/email for invoice, loyalty, warranty or marketing? | Conditional / Omnichannel | Store signage, POS screen, bill counter notice, staff SOP | Retail Operations / Legal | P1 |
| RET-NOT-008 | Are notices version-controlled and linked to relevant ROPA records, consent records and systems? | Mandatory / ROPA-linked | Notice register, version log, ROPA linkage, approval record | Legal / DPDP Owner | P1 |

### 10.6 CONSENT — Consent and consent withdrawal
| Code | Assessment question | Type | Evidence to check | Suggested owner | Priority |
|---|---|---|---|---|---|
| RET-CON-001 | Is consent for marketing communications separated from account creation, checkout and order fulfilment? | Mandatory / High-risk | Consent UI, opt-in logs, preference centre, campaign settings | Marketing / Legal | P0 |
| RET-CON-002 | Are consent requests free, specific, informed, affirmative and not bundled through pre-ticked boxes or forced action? | Mandatory / UX-linked | Consent screenshots, design review, dark-pattern review checklist | Product / Legal / UX | P0 |
| RET-CON-003 | Is there a preference centre or equivalent mechanism for users to withdraw marketing consent or manage channels such as email, SMS, WhatsApp and push notifications? | Mandatory | Preference centre, unsubscribe logs, suppression list evidence | Marketing Ops / Product | P1 |
| RET-CON-004 | Are cookie/tracking choices recorded and respected across website, app, tag manager and marketing platforms? | High-risk / Adtech-linked | Cookie consent logs, CMP settings, tag firing tests | Marketing / IT / Legal | P1 |
| RET-CON-005 | Is saved-card/tokenisation consent captured and managed where the platform enables card-on-file/token-based convenience? | Conditional / Payment-linked | Payment screens, PG/token documentation, consent logs | Finance / Product / Payment Team | P0 |
| RET-CON-006 | Can users withdraw or de-register saved payment tokens/cards through account settings or payment-provider flow where applicable? | Conditional / Payment-linked | Saved card UI, token deletion logs, PG evidence | Product / Payment Team | P1 |
| RET-CON-007 | Is consent or appropriate review captured for personalization, profiling, recommendation, loyalty segmentation and targeted campaigns where required by internal policy/legal review? | Conditional / AI/Marketing-linked | Personalisation settings, campaign rules, profiling review | Marketing / Data Science / Legal | P1 |
| RET-CON-008 | Are consent records linked to Data Principal identity, notice version, purpose, timestamp, channel and withdrawal status? | Mandatory / Evidence-heavy | Consent logs, schema, audit record, notice linkage | IT / Product / Legal | P1 |

### 10.7 RIGHTS — Data Principal rights
| Code | Assessment question | Type | Evidence to check | Suggested owner | Priority |
|---|---|---|---|---|---|
| RET-RGT-001 | Can customers submit DPDP rights requests through account settings, support, email or a published request form? | Mandatory | Rights request form, support SOP, privacy notice link | Legal / Customer Support | P1 |
| RET-RGT-002 | Can the organisation identify and retrieve a customer’s personal data across website/app, OMS, CRM, loyalty, support, returns, marketing and vendor systems? | High-risk / Integration-linked | Data discovery map, DSAR SOP, system owner list | DPDP Owner / IT | P0 |
| RET-RGT-003 | Is there a process to correct customer profile, address, phone, email, invoice and loyalty data across downstream systems? | Mandatory | Correction workflow, CRM/OMS sync, audit logs | Customer Support / IT | P1 |
| RET-RGT-004 | Is account deletion/erasure handled with clear distinction between erasable data and data retained for legal, tax, accounting, fraud or dispute purposes? | High-risk | Erasure SOP, retention exception matrix, customer UI copy | Legal / IT / Finance | P1 |
| RET-RGT-005 | Can guest checkout users and gift recipients exercise rights even if they do not have a registered account? | Conditional / Guest-linked | Identity verification SOP, guest order retrieval process | Customer Support / Legal | P1 |
| RET-RGT-006 | Can seller/proprietor users and franchise contacts exercise rights over their own personal data? | Conditional / Marketplace-linked | Seller privacy process, seller portal rights request flow | Marketplace / Legal | P2 |
| RET-RGT-007 | Are rights requests tracked with status, owner, due date, verification method, response and closure evidence? | Mandatory | Rights request register, ticket workflow, SLA report | DPDP Owner / Support | P1 |
| RET-RGT-008 | Are rights responses reviewed where requests involve fraud flags, disputes, chargebacks, ongoing returns or marketplace seller data? | Conditional / High-risk | Escalation SOP, legal review notes, exception register | Legal / Risk / Support | P1 |

### 10.8 GRIEVANCE — Grievance redressal and contact publication
| Code | Assessment question | Type | Evidence to check | Suggested owner | Priority |
|---|---|---|---|---|---|
| RET-GRV-001 | Is DPDP contact information published clearly on the website, app and privacy notice? | Mandatory | Website/app screenshots, privacy notice, contact page | Legal / DPDP Owner | P0 |
| RET-GRV-002 | Is DPDP grievance handling integrated with customer support without confusing normal order complaints with data-protection grievances? | Mandatory | Support SOP, ticket categories, escalation matrix | Customer Support / DPDP Owner | P1 |
| RET-GRV-003 | Are customer complaints involving misuse of personal data, unsolicited marketing, wrong delivery disclosure, account takeover or vendor misuse escalated to DPDP/security teams? | High-risk | Ticket categories, escalation workflow, incident examples | Support / Security / Legal | P1 |
| RET-GRV-004 | Does the organisation maintain a grievance register with complainant, issue type, owner, action taken, response date and closure evidence? | Mandatory | Grievance register, helpdesk exports, closure evidence | DPDP Owner / Support | P1 |
| RET-GRV-005 | Are marketplace seller-related grievances involving buyer data handled through a clear marketplace escalation path? | Conditional / Marketplace | Seller support SOP, buyer-data misuse escalation | Marketplace Ops / Legal | P1 |
| RET-GRV-006 | Are offline store/franchise complaints related to personal data routed into the central grievance process? | Conditional / Omnichannel | Store SOP, staff training, franchise escalation evidence | Retail Operations | P2 |
| RET-GRV-007 | Are grievance SLAs monitored and reported to management? | Mandatory | SLA dashboard, monthly report, escalation records | Support Head / DPDP Owner | P2 |
| RET-GRV-008 | Are repeated grievance patterns used to improve notices, consent flows, vendor controls, marketing practices and user-rights workflows? | Improvement | Root-cause analysis, change requests, governance minutes | DPDP Owner / Product | P2 |

### 10.9 RETENTION — Retention, erasure and archival
| Code | Assessment question | Type | Evidence to check | Suggested owner | Priority |
|---|---|---|---|---|---|
| RET-RET-001 | Is there a retention schedule for customer accounts, orders, invoices, payments, returns, refunds, support tickets, call recordings, marketing leads and loyalty data? | Mandatory / High-risk | Retention policy, data-retention matrix, system settings | Legal / IT / Finance | P0 |
| RET-RET-002 | Are cart, wishlist, abandoned checkout, browsing behaviour and campaign lead data deleted or anonymised after defined periods? | High-risk / Marketing-linked | CDP/analytics retention settings, lifecycle rules | Product / Marketing / IT | P1 |
| RET-RET-003 | Are transactional records retained only as long as required for tax, accounting, legal, warranty, fraud, dispute or consumer-service obligations? | Mandatory | Retention exception matrix, finance/legal sign-off | Finance / Legal | P1 |
| RET-RET-004 | Are call recordings, chat transcripts and support attachments subject to defined retention and access limits? | Mandatory | Call recording retention setting, helpdesk policy | Support / IT / Legal | P1 |
| RET-RET-005 | Are delivery proofs, OTP logs, route/location traces and courier data retained only for defined fulfilment/dispute periods? | High-risk / Logistics | Logistics data retention policy, vendor controls | Logistics / Operations | P1 |
| RET-RET-006 | Are payment tokens, refund details, UPI references and reconciliation data retained according to payment and legal requirements without storing prohibited card credentials? | High-risk / Payment-linked | Payment data retention map, PG confirmation, token deletion logs | Finance / Payment Team | P0 |
| RET-RET-007 | Are seller KYC, seller bank details and franchise/partner records retained according to contract, tax and legal requirements? | Conditional / Marketplace | Seller retention schedule, archive/delete SOP | Marketplace / Finance / Legal | P2 |
| RET-RET-008 | Are deletion and anonymisation actions logged and linked to rights requests, account closure and retention rules? | Mandatory / Evidence-heavy | Deletion logs, purge jobs, audit trail, data warehouse deletion evidence | IT / DPDP Owner | P1 |

### 10.10 ACCURACY — Data accuracy and quality
| Code | Assessment question | Type | Evidence to check | Suggested owner | Priority |
|---|---|---|---|---|---|
| RET-ACC-001 | Are customer phone and email verified where used for order communication, OTP, account security and rights-request verification? | Mandatory | OTP/email verification logs, account settings | Product / IT | P1 |
| RET-ACC-002 | Can customers update delivery address, billing details and profile information with proper audit trail? | Mandatory | Account settings, change logs, support SOP | Product / Support | P1 |
| RET-ACC-003 | Are address changes synchronised correctly across OMS, logistics, marketplace seller, warehouse and customer support systems? | High-risk / Logistics | Integration test, workflow evidence, sync logs | IT / Operations | P1 |
| RET-ACC-004 | Are incorrect delivery, wrong phone number and misdelivered order incidents analysed as data accuracy/privacy risks? | Conditional | Incident logs, RCA, support ticket categories | Operations / Support | P2 |
| RET-ACC-005 | Are loyalty, points, purchase history and customer segmentation data kept accurate and rectifiable? | Conditional / Loyalty | Loyalty audit, reconciliation reports, correction SOP | Marketing / Loyalty Team | P2 |
| RET-ACC-006 | Are seller profile, bank, tax and authorised-user records periodically validated? | Conditional / Marketplace | Seller verification logs, periodic review records | Marketplace Ops / Finance | P2 |
| RET-ACC-007 | Are fraud flags, risk scores and blacklists reviewed to prevent inaccurate denial of orders/services? | High-risk / AI-linked | Fraud review SOP, override logs, model validation | Risk / Data Science / Support | P1 |
| RET-ACC-008 | Are customer profile enrichment and third-party marketing data sources reviewed for accuracy before use? | Conditional / Marketing-linked | Data source list, vendor accuracy review, campaign rules | Marketing / Data Team | P2 |

### 10.11 SECURITY — Security safeguards
| Code | Assessment question | Type | Evidence to check | Suggested owner | Priority |
|---|---|---|---|---|---|
| RET-SEC-001 | Are customer account, order, address, payment-token and loyalty data protected by role-based access controls? | Mandatory / High-risk | RBAC matrix, admin roles, access review | IT / Security | P0 |
| RET-SEC-002 | Are admin panels, seller portals, support consoles and warehouse tools protected with MFA and least-privilege access? | High-risk | MFA settings, access logs, privileged access review | Security / IT | P0 |
| RET-SEC-003 | Are payment flows designed so the retailer does not store actual card credentials where prohibited, and relies on token/payment-provider controls? | High-risk / Payment-linked | Payment architecture, PG confirmation, tokenisation documents | Payment Team / Security | P0 |
| RET-SEC-004 | Are APIs protected against broken object-level authorisation, excessive data exposure, mass assignment and unsafe third-party API consumption? | High-risk / API-linked | API test reports, OWASP checklist, access-control tests | Engineering / Security | P0 |
| RET-SEC-005 | Is sensitive customer data encrypted or otherwise protected in databases, backups, logs, data lake, exports and reports? | Mandatory | Encryption settings, backup policy, log masking evidence | Security / DevOps | P1 |
| RET-SEC-006 | Are customer support agents prevented from viewing full payment details, passwords, unnecessary address history or excessive customer profile data? | High-risk / Support | Support access controls, masking screenshots, access logs | Support / IT / Security | P1 |
| RET-SEC-007 | Are mobile app SDKs, app permissions, API keys, secrets and push-notification services securely configured? | Conditional / App-linked | Mobile security assessment, SDK inventory, secret scanning | Mobile Team / Security | P1 |
| RET-SEC-008 | Are logs, monitoring, backups, vulnerability scans, penetration tests and incident alerts in place for website/app, APIs, seller portal and admin systems? | Mandatory / Evidence-heavy | VAPT report, monitoring dashboard, backup restore test, SIEM/logs | Security / DevOps | P1 |

### 10.12 BREACH — Personal data breach readiness
| Code | Assessment question | Type | Evidence to check | Suggested owner | Priority |
|---|---|---|---|---|---|
| RET-BR-001 | Is there a DPDP-aligned personal data breach response playbook covering customer database exposure, account takeover, seller portal breach, logistics data leakage, marketing-vendor breach and payment-token exposure? | Mandatory / High-risk | Breach playbook, incident scenarios, escalation matrix | Security / Legal / DPDP Owner | P0 |
| RET-BR-002 | Does the breach process classify incidents involving address, phone, order history, payment references, support transcripts, loyalty data and login credentials? | Mandatory | Incident classification matrix, data impact assessment template | Security / Legal | P1 |
| RET-BR-003 | Are affected Data Principal notification templates prepared for retail/e-commerce breach scenarios? | High-risk | Notification templates, legal review evidence | Legal / Communications | P1 |
| RET-BR-004 | Is there a Board/intimation workflow and 72-hour information-gathering checklist aligned to DPDP Rules requirements? | High-risk | Regulatory notification checklist, incident timeline template | Legal / Security | P0 |
| RET-BR-005 | Are payment-vendor, logistics-vendor, marketing-vendor and cloud-vendor breach notification obligations contractually defined? | High-risk / Vendor-linked | Vendor contracts, incident notification clauses, DPA/addendum | Procurement / Legal / Security | P1 |
| RET-BR-006 | Is there a process to preserve logs and evidence for account takeover, coupon abuse, scraping, API abuse and seller portal incidents? | Mandatory | Forensic SOP, log retention settings, incident evidence procedure | Security / Engineering | P1 |
| RET-BR-007 | Are breach tabletop exercises conducted for major retail scenarios, including customer address leakage and marketing platform compromise? | Improvement / Evidence-heavy | Tabletop records, lessons learned, closure actions | Security / DPDP Owner | P2 |
| RET-BR-008 | Are customer support and store/franchise teams trained to escalate suspected data leakage, wrong disclosure or account takeover quickly? | Mandatory | Training records, escalation card, helpdesk categories | Support / Operations | P2 |

### 10.13 VENDOR — Vendor / Data Processor governance
| Code | Assessment question | Type | Evidence to check | Suggested owner | Priority |
|---|---|---|---|---|---|
| RET-VEN-001 | Is there a complete vendor/Data Processor register for payment, logistics, warehouse, support, marketing, analytics, cloud, loyalty, fraud, review, seller and franchise partners? | Mandatory / High-risk | Vendor register, processor classification, data map | Procurement / DPDP Owner | P0 |
| RET-VEN-002 | Are payment gateways/aggregators reviewed for payment-data roles, card/token handling, settlement, refund and data retention responsibilities? | High-risk / Payment-linked | PG/PA contract, compliance attestation, data flow | Finance / Legal / Security | P0 |
| RET-VEN-003 | Are logistics and delivery partners contractually restricted to using customer data only for fulfilment, return pickup and dispute handling? | High-risk / Logistics | Courier contracts, DPA clauses, delivery SOP | Operations / Legal | P1 |
| RET-VEN-004 | Are marketing/adtech vendors reviewed for audience sharing, cookie IDs, retargeting, lookalike audiences, consent sync and deletion/suppression obligations? | High-risk / Marketing-linked | Marketing vendor review, consent sync evidence, DPA | Marketing / Legal / IT | P0 |
| RET-VEN-005 | Are call centre/BPO vendors required to apply access controls, recording retention, agent monitoring and breach notification obligations? | High-risk / Support | BPO contract, security SOP, access review evidence | Support / Procurement | P1 |
| RET-VEN-006 | For marketplaces, are sellers restricted in how they may use buyer personal data received for fulfilment? | Conditional / Marketplace | Seller terms, seller privacy clause, buyer-data misuse policy | Marketplace / Legal | P1 |
| RET-VEN-007 | Are franchisees and offline stores covered by contractual and operational data-protection obligations where they capture customer data? | Conditional / Omnichannel | Franchise agreement, POS access controls, training records | Retail Ops / Legal | P1 |
| RET-VEN-008 | Are vendor reviews repeated periodically and when new data categories, AI tools, countries, sub-processors or integrations are added? | Mandatory | Vendor review calendar, risk scores, reassessment records | Procurement / DPDP Owner | P1 |

### 10.14 CHILD — Children’s data and guardian consent
| Code | Assessment question | Type | Evidence to check | Suggested owner | Priority |
|---|---|---|---|---|---|
| RET-CHD-001 | Does the platform assess whether children or users below 18 can create accounts, place orders, participate in reviews, contests or loyalty programmes? | Conditional / High-risk | Age gate review, terms, account flow, campaign rules | Product / Legal | P1 |
| RET-CHD-002 | Are product categories such as toys, games, education items, baby products or teen fashion reviewed for child/minor data triggers? | Conditional | Product category risk review, age-related campaign policy | Product / Marketing / Legal | P2 |
| RET-CHD-003 | If children’s data is processed, is guardian/parental consent review built into the onboarding or campaign process where required? | High-risk | Guardian consent workflow, legal review, evidence logs | Legal / Product | P0 |
| RET-CHD-004 | Are children excluded from behavioural tracking, targeted advertising, profiling or other high-risk personalization unless legally reviewed and permitted? | High-risk / Marketing-linked | Campaign exclusion rules, CMP/adtech settings, legal review | Marketing / Legal / Data Team | P0 |
| RET-CHD-005 | Are contests, giveaways, creator campaigns or UGC features involving minors reviewed before launch? | Conditional / UGC-linked | Campaign review checklist, parental approval workflow | Marketing / Legal | P1 |
| RET-CHD-006 | Are vendors processing children’s data identified and subject to enhanced contractual and security review? | Conditional / Vendor-linked | Vendor register, child-data flag, DPA clauses | Procurement / Legal | P1 |
| RET-CHD-007 | Are support agents trained to handle minor-related accounts, guardian requests and deletion/correction requests carefully? | Conditional | Support SOP, training records, escalation matrix | Support / Legal | P2 |
| RET-CHD-008 | Is child-data processing excluded or minimised by design where the retail service is not intended for children? | Improvement / Privacy-by-design | Terms, age warning, product design review, data minimisation evidence | Product / Legal | P2 |

### 10.15 CROSSBORDER — Cross-border transfer and cloud/SaaS risk
| Code | Assessment question | Type | Evidence to check | Suggested owner | Priority |
|---|---|---|---|---|---|
| RET-CB-001 | Does the organisation know where customer, order, support, marketing, analytics, loyalty, seller and backup data is hosted or accessed from? | Mandatory / High-risk | Data location register, vendor questionnaires, cloud region evidence | IT / Procurement / Legal | P0 |
| RET-CB-002 | Are cloud, CDN, analytics, marketing, helpdesk, CRM, CDP and AI vendors reviewed for data location and cross-border access? | High-risk / Vendor-linked | Sub-processor list, DPA, data transfer review | IT / Legal / Procurement | P1 |
| RET-CB-003 | Are international marketplace sellers, global support teams or offshore technology teams restricted from accessing unnecessary customer data? | Conditional | Access logs, role restrictions, seller terms, support location matrix | Marketplace / IT / Legal | P1 |
| RET-CB-004 | Are cross-border transfers reviewed before activating new SaaS tools, pixels, SDKs, AI APIs, fraud tools or marketing platforms? | High-risk / Change-linked | Procurement privacy review, vendor approval workflow | Procurement / Legal / IT | P1 |
| RET-CB-005 | Are customer exports, BI/data lake copies and campaign audience uploads assessed for cross-border storage or access? | High-risk / Marketing/Data | BI architecture, campaign upload logs, vendor locations | Data Team / Marketing / IT | P1 |
| RET-CB-006 | Are payment-system data flows reviewed separately where RBI/payment-system data localisation requirements may be relevant? | Conditional / Payment-linked | Payment data flow, PG/PA confirmations, legal review | Finance / Payment Team / Legal | P1 |
| RET-CB-007 | Are backups, logs and disaster-recovery copies included in data-location review? | Mandatory | Backup region settings, DR architecture, log platform details | IT / DevOps | P1 |
| RET-CB-008 | Are contractual protections, access restrictions and reassessment triggers documented for vendors with cross-border processing? | Mandatory / Vendor-linked | DPA, SCC-like clauses if used, vendor review record, reassessment plan | Legal / Procurement | P1 |

### 10.16 SDF_AI — SDF, DPIA, audit and AI/algorithmic risk readiness
| Code | Assessment question | Type | Evidence to check | Suggested owner | Priority |
|---|---|---|---|---|---|
| RET-AI-001 | Is there an inventory of AI/ML systems using customer, order, browsing, loyalty, support, fraud or marketing data? | High-risk / AI-linked | AI inventory, model/use-case register, system owner list | Data Science / Product | P0 |
| RET-AI-002 | Are recommendation engines and personalization models reviewed for purpose, data minimisation, profiling impact and opt-out/preference considerations? | High-risk | Model review note, feature list, preference controls | Product / Data Science / Legal | P1 |
| RET-AI-003 | Are dynamic pricing, dynamic discounting, coupon eligibility or offer-ranking models reviewed for privacy and fairness concerns? | Conditional / AI-linked | Pricing/offer model governance, business rules, legal review | Product / Data Science / Legal | P1 |
| RET-AI-004 | Are fraud/risk scoring models reviewed for accuracy, explainability, appeal/escalation and human review when orders are blocked or accounts restricted? | High-risk | Fraud model documentation, override logs, support escalation SOP | Risk / Data Science / Support | P1 |
| RET-AI-005 | Are chatbots and generative AI support tools prevented from exposing customer account, address, payment, order or support history unnecessarily? | High-risk / GenAI-linked | Chatbot prompt/data policy, access controls, test cases | Product / Support / Security | P1 |
| RET-AI-006 | Are prompts, uploaded files, product-review moderation inputs and support transcripts checked for personal data before being sent to external AI providers? | High-risk / Vendor-linked | AI usage policy, vendor DPA, prompt logging/redaction controls | AI Owner / Security / Legal | P1 |
| RET-AI-007 | Are periodic audits or DPIA-style reviews performed for high-volume/high-impact AI systems? | Improvement / SDF-readiness | DPIA-style templates, audit reports, model review minutes | DPDP Owner / AI Governance | P2 |
| RET-AI-008 | If the organisation may qualify as a Significant Data Fiduciary in future, are governance, DPIA, audit and algorithmic-due-diligence readiness actions tracked? | Conditional / SDF-readiness | SDF readiness checklist, board report, roadmap | Executive Sponsor / Legal | P2 |


**Total retail/e-commerce overlay questions in this file:** 128

---

## 11. Suggested ROPA records for retail / e-commerce

The platform should suggest these ROPA / Processing Activity Register records during onboarding. The organisation may accept, edit, merge or reject them.

| ROPA activity code | Suggested processing activity | Typical owner | Default risk | Key linked domains |
|---|---|---|---|---|
| RET-ROPA-TPL-001 | Website visitor analytics and cookie tracking | Product / Marketing | High | INV, NOTICE, CONSENT, VENDOR, CROSSBORDER |
| RET-ROPA-TPL-002 | Customer account registration and login | Product / IT | High | INV, PURPOSE, NOTICE, SECURITY, RIGHTS |
| RET-ROPA-TPL-003 | Guest checkout processing | Product / Operations | Medium/High | PURPOSE, NOTICE, RETENTION, RIGHTS |
| RET-ROPA-TPL-004 | Cart, wishlist and browsing-history processing | Product / Data | High | ROPA, PURPOSE, CONSENT, SDF_AI |
| RET-ROPA-TPL-005 | Checkout, order creation and invoicing | Operations / Finance | High | PURPOSE, RETENTION, SECURITY |
| RET-ROPA-TPL-006 | Payment gateway / payment aggregator processing | Finance / Payments | High | VENDOR, SECURITY, BREACH, CROSSBORDER |
| RET-ROPA-TPL-007 | Saved card / tokenised payment flow | Product / Payments | High | CONSENT, SECURITY, VENDOR, RETENTION |
| RET-ROPA-TPL-008 | Order fulfilment and warehouse processing | Operations | Medium/High | VENDOR, SECURITY, RETENTION |
| RET-ROPA-TPL-009 | Logistics and last-mile delivery processing | Logistics | High | VENDOR, PURPOSE, SECURITY, BREACH |
| RET-ROPA-TPL-010 | Return pickup, replacement and refund processing | Operations / Finance | Medium/High | RETENTION, VENDOR, RIGHTS |
| RET-ROPA-TPL-011 | Warranty, installation and service partner processing | Service Operations | Medium/High | VENDOR, NOTICE, SECURITY |
| RET-ROPA-TPL-012 | Customer support calls, chats and tickets | Support | High | NOTICE, SECURITY, RETENTION, GRIEVANCE |
| RET-ROPA-TPL-013 | Loyalty programme enrolment and management | Marketing / Loyalty | High | CONSENT, PURPOSE, RIGHTS, AI |
| RET-ROPA-TPL-014 | Marketing communication and campaign management | Marketing | High | CONSENT, NOTICE, VENDOR, RETENTION |
| RET-ROPA-TPL-015 | Adtech retargeting and campaign audience processing | Marketing / Data | High | CONSENT, VENDOR, CROSSBORDER, AI |
| RET-ROPA-TPL-016 | Product recommendations and personalization | Product / Data Science | High | PURPOSE, CONSENT, SDF_AI |
| RET-ROPA-TPL-017 | Fraud detection and order-risk scoring | Risk / Security | High | SECURITY, ACCURACY, SDF_AI |
| RET-ROPA-TPL-018 | Marketplace seller onboarding and KYC | Marketplace | High | INV, PURPOSE, RETENTION, VENDOR |
| RET-ROPA-TPL-019 | Seller access to buyer order and delivery data | Marketplace / Operations | High | VENDOR, SECURITY, BREACH |
| RET-ROPA-TPL-020 | Product reviews, ratings and user-generated content | Product | Medium | NOTICE, RIGHTS, RETENTION |
| RET-ROPA-TPL-021 | Referral, affiliate and influencer campaign processing | Marketing | Medium | CONSENT, VENDOR, RETENTION |
| RET-ROPA-TPL-022 | POS billing and offline customer data capture | Retail Operations | Medium/High | NOTICE, CONSENT, INVENTORY |
| RET-ROPA-TPL-023 | Store CCTV and physical-security logs | Retail Operations / Security | Medium/High | PURPOSE, NOTICE, RETENTION, SECURITY |
| RET-ROPA-TPL-024 | Employee, store staff and warehouse staff HR processing | HR | Medium | INV, RETENTION, SECURITY, RIGHTS |
| RET-ROPA-TPL-025 | Business intelligence, data lake and executive reporting | Data / IT | High | SECURITY, RETENTION, SDF_AI |

---

## 12. Evidence checklist

### 12.1 Governance and accountability evidence

| Evidence item | Why it matters |
|---|---|
| DPDP owner appointment letter | Establishes accountability |
| DPDP steering committee minutes | Shows active governance |
| Retail/e-commerce privacy RACI | Clarifies ownership across product, marketing, support, logistics and IT |
| Privacy impact review checklist for product releases | Ensures new forms, pixels, campaigns and AI tools are reviewed |
| Omnichannel/store/franchise privacy SOP | Extends DPDP controls beyond website/app |
| Dark-pattern/consent UX checklist | Prevents manipulative consent and choice design |

### 12.2 Notice and consent evidence

| Evidence item | Why it matters |
|---|---|
| Privacy notice and version history | Shows transparency baseline |
| Checkout notice screenshots | Verifies notice at collection point |
| Guest checkout notice screenshot | Covers accountless users |
| Cookie banner and consent-management settings | Supports tracking consent governance |
| Marketing opt-in/opt-out logs | Supports consent and withdrawal proof |
| Preference centre screenshots | Shows user control |
| Saved card/tokenisation consent screens | Payment-related consent evidence |
| Loyalty programme terms and privacy notice | Supports profiling and loyalty processing |
| POS/store notice signage | Supports offline capture |

### 12.3 Inventory and ROPA evidence

| Evidence item | Why it matters |
|---|---|
| Personal data inventory | Core data visibility |
| Channel-wise data map | Website, app, POS, support, warehouse, seller portal |
| Cookie/pixel/SDK inventory | Critical for adtech and behavioural data |
| Data-flow diagram | Shows collection, storage, sharing and deletion |
| ROPA records | Shows processing activity visibility |
| System and API inventory | Important for security and rights fulfilment |
| Vendor and sub-processor register | Supports Data Processor governance |

### 12.4 Security and breach evidence

| Evidence item | Why it matters |
|---|---|
| RBAC/access matrix | Restricts access to customer/order data |
| Admin-panel MFA evidence | Reduces account takeover risk |
| API security test report | E-commerce APIs are high-value attack targets |
| VAPT report | Supports security maturity |
| Payment architecture and PG/PA confirmation | Supports card/token/payment-data controls |
| Encryption and masking evidence | Protects customer, address, payment and support data |
| Log monitoring and incident alert evidence | Supports breach readiness |
| Breach response playbook | Supports incident handling |
| Breach notification templates | Supports response to affected customers |
| Tabletop exercise report | Evidence of operational readiness |

### 12.5 Vendor evidence

| Evidence item | Why it matters |
|---|---|
| Payment gateway/aggregator contract | Payment data and token flow governance |
| Logistics/courier contracts | Customer address/phone sharing controls |
| Warehouse/3PL agreement | Shipping label and fulfilment data controls |
| Marketing/adtech vendor DPA | Tracking, segmentation and campaign sharing controls |
| CRM/CDP/helpdesk contracts | Large-volume customer profile processing |
| Cloud/CDN/sub-processor list | Data location and security review |
| Seller terms and buyer-data restrictions | Marketplace risk control |
| Franchise data-protection clauses | Omnichannel governance |

---

## 13. Dynamic question triggers for DPDP Compass

The platform should add questions based on these triggers.

| Trigger | Add question pack / logic |
|---|---|
| `industryCode = retail_ecommerce` | Load Retail / E-commerce overlay |
| `hasMobileApp = true` | Add app permissions, SDK, push notification and mobile security questions |
| `guestCheckout = true` | Add guest rights, notice, retention and identity-verification questions |
| `savedCardOrTokenisation = true` | Add payment/tokenisation consent, de-registration and payment-vendor controls |
| `marketplaceModel = true` | Add seller onboarding, seller access to buyer data and marketplace role questions |
| `loyaltyProgram = true` | Add profiling, loyalty notice, preference and retention questions |
| `marketingAutomation = true` | Add consent, unsubscribe, campaign audience and suppression-list questions |
| `cookiesPixelsSdk = true` | Add cookie inventory, consent, vendor and cross-border questions |
| `usesAdtechRetargeting = true` | Add adtech sharing, audience upload and dark-pattern review questions |
| `usesAIRecommendations = true` | Add AI personalization, ROPA, DPIA-style and user preference questions |
| `usesFraudScoring = true` | Add fraud model accuracy, explainability, appeal and human review questions |
| `usesChatbotOrGenAI = true` | Add chatbot data minimisation, AI vendor and prompt/data retention questions |
| `usesLogisticsPartners = true` | Add logistics/vendor/delivery proof retention and breach questions |
| `usesCallCentre = true` | Add support access, call recording notice, BPO vendor and retention questions |
| `hasOfflineStores = true` | Add POS, store notice, staff access, CCTV and franchise questions |
| `franchiseModel = true` | Add franchise contract, local data capture and central reporting questions |
| `childrenOrMinors = true` | Add children’s data and guardian-consent questions |
| `pharmacyOrHealthProductFlow = true` | Add healthcare/health-data review trigger |
| `cloudOrSaaS = true` | Add data location, sub-processor and cross-border questions |
| `internationalSellersOrSupport = true` | Add cross-border access and seller restriction questions |
| `highVolumeCustomers = true` | Add SDF-readiness, audit and stronger governance questions |

---

## 14. Red flags and scoring considerations

These retail/e-commerce situations should trigger red flags, score caps or P0/P1 remediation actions.

| Red flag | Suggested severity | Possible score cap / action |
|---|---|---|
| No DPDP owner for customer-facing digital channels | Critical | Cap score at 60; appoint owner |
| No personal data inventory across website/app/POS/support/vendor systems | Critical | Cap score at 55; run data discovery sprint |
| No ROPA for checkout, payments, logistics and marketing | Critical | Cap score at 60; create processing register |
| Marketing consent bundled with checkout/account creation | High/Critical | Generate consent remediation action |
| Cookies/pixels/SDKs not inventoried | High | Generate adtech inventory and consent action |
| Actual card credentials stored by merchant where prohibited | Critical | Immediate payment security and legal review |
| Logistics vendors receive customer data without contractual restriction | High | Vendor DPA/action required |
| Sellers can use buyer data outside fulfilment purpose | High/Critical | Marketplace seller terms/control action |
| No breach playbook for customer/address/payment/support data exposure | Critical | Cap breach domain; create playbook |
| Support agents have excessive access to customer/payment/address data | High | Access review and masking action |
| No retention schedule for orders, carts, support recordings and marketing leads | High | Retention policy/action required |
| AI recommendation/fraud scoring operates without privacy review | High | AI/privacy review required |
| Children’s data processed without guardian-consent review | Critical | Immediate legal/privacy review |
| Cross-border data location unknown for adtech/cloud/CDP/helpdesk vendors | High | Vendor/data-location review |
| Reported maturity high but evidence confidence below 25% | High | Cap score and request evidence review |

---

## 15. Retail / e-commerce dashboard and report additions

### 15.1 Industry process dashboard

| Process | Dashboard metrics |
|---|---|
| Website/app onboarding | notice coverage, consent, data fields, app permissions |
| Checkout and order lifecycle | purpose, minimisation, payment, retention, security |
| Payment and saved cards | tokenisation, PG/PA vendor, retention, breach readiness |
| Fulfilment and logistics | vendor sharing, address protection, delivery data retention |
| Customer support | access controls, recordings, grievance, rights requests |
| Loyalty and marketing | consent, profiling, adtech, unsubscribe, retention |
| Marketplace seller operations | seller KYC, seller buyer-data access, seller restrictions |
| Returns/refunds | retention, refund details, support tickets, vendor sharing |
| AI/recommendation/fraud | AI inventory, ROPA, privacy review, human review |
| Omnichannel/POS/stores | POS notice, store staff access, CCTV, franchise controls |

### 15.2 Report sections specific to retail / e-commerce

| Report section | Content |
|---|---|
| E-commerce data-flow summary | Website/app/POS/support/logistics/payment/marketing/seller flows |
| Customer-data risk heatmap | Data by volume, sensitivity and operational exposure |
| Payment-data governance note | Payment tokens, card-data storage, PG/PA roles and evidence |
| Marketing and adtech review | Consent, cookies, pixels, campaign audience sharing |
| Logistics and address-data exposure | Delivery partner governance and data minimisation |
| Marketplace seller risk | Seller access to buyer data and contractual restrictions |
| AI/personalization risk | Recommendation, dynamic offers, fraud scoring, chatbot |
| 30/60/90-day retail remediation roadmap | Priority implementation plan |

---

## 16. UAT scenario for retail / e-commerce template

Use this scenario to test the template inside DPDP Compass.

### 16.1 Demo organisation

**Organisation:** RetailKart Demo Pvt. Ltd.  
**Industry:** Retail / E-commerce  
**Business model:** Omnichannel D2C + marketplace-like seller onboarding for selected categories  
**Channels:** Website, mobile app, POS, call centre, warehouse, logistics partners  
**Special features:** Loyalty programme, saved cards/tokenisation, ad pixels, AI recommendations, fraud scoring, customer reviews

### 16.2 Scope wizard inputs

| Field | Demo value |
|---|---|
| Website | Yes |
| Mobile app | Yes |
| Guest checkout | Yes |
| Registered accounts | Yes |
| Loyalty programme | Yes |
| Marketing automation | Yes |
| Cookies/pixels/SDKs | Yes |
| Saved cards/tokenisation | Yes |
| Payment gateway | Yes |
| Logistics partners | Yes |
| Warehouses | Yes |
| Customer support/call centre | Yes |
| Product reviews/UGC | Yes |
| AI recommendations | Yes |
| Fraud scoring | Yes |
| Marketplace sellers | Yes |
| Offline stores/POS | Yes |
| Cross-border vendor uncertainty | Yes |
| Children/minor users | Unknown |

### 16.3 Expected generated question packs

| Question pack | Expected? |
|---|---|
| Core DPDP 16-domain questions | Yes |
| Retail / E-commerce overlay | Yes |
| Payment and saved-card questions | Yes |
| Marketing/adtech/cookie questions | Yes |
| Vendor/Data Processor questions | Yes |
| Logistics/delivery questions | Yes |
| Marketplace seller questions | Yes |
| AI recommendation/fraud scoring questions | Yes |
| Mobile app/SDK questions | Yes |
| Cross-border/cloud questions | Yes |
| Children/minor review questions | Yes, because status is Unknown |
| Breach-readiness questions | Yes |

### 16.4 Expected ROPA suggestions

The system should suggest ROPA records for account registration, guest checkout, browsing analytics, payment processing, saved cards/tokenisation, fulfilment, logistics, returns/refunds, customer support, loyalty, marketing/adtech, AI recommendations, fraud scoring, seller onboarding, seller buyer-data access, reviews/UGC, POS capture and BI/data lake reporting.

### 16.5 UAT success criteria

| Area | Success criterion |
|---|---|
| Question relevance | Retail-specific questions appear and generic-only assessment is avoided |
| Evidence flow | Screenshots, contracts, consent logs and vendor evidence can be linked |
| Payment review | Saved card/token/payment controls are captured correctly |
| Marketing review | Cookie/adtech/consent issues produce gaps |
| ROPA | Major retail processes generate ROPA records |
| Scoring | Weak evidence caps high claimed scores |
| Dashboard | Executive view shows customer-data, payment, marketing, vendor and breach risk |
| Report | Report includes retail-specific process summary and roadmap |
| AI Assistant | AI explains retail questions without certifying compliance |

---

## 17. Notes for AI coding agent

Use this file as seed content for the `retail_ecommerce` industry overlay.

### 17.1 Suggested seed identifiers

| Object | Suggested code |
|---|---|
| Industry | `retail_ecommerce` |
| Template | `RETAIL_ECOMMERCE_OVERLAY_V1` |
| Question pack | `RETAIL_ECOMMERCE_CORE_OVERLAY_V1` |
| Payment pack | `RETAIL_PAYMENT_TOKENISATION_V1` |
| Marketing/adtech pack | `RETAIL_MARKETING_ADTECH_V1` |
| Logistics pack | `RETAIL_LOGISTICS_DELIVERY_V1` |
| Marketplace pack | `RETAIL_MARKETPLACE_SELLER_V1` |
| Loyalty pack | `RETAIL_LOYALTY_PROFILING_V1` |
| AI pack | `RETAIL_AI_RECOMMENDATION_FRAUD_V1` |
| Omnichannel pack | `RETAIL_POS_STORE_FRANCHISE_V1` |

### 17.2 Question metadata requirements

Each question should be stored with:

- question code,
- question text,
- DPDP domain mapping,
- industry code,
- question pack,
- trigger condition,
- question type,
- evidence guidance,
- suggested owner,
- default priority,
- red flag indicator,
- scoring hint,
- remediation mapping,
- version number.

### 17.3 Conditional logic examples

```json
{
  "ruleCode": "TRIGGER_RETAIL_MARKETING_ADTECH",
  "condition": {
    "any": [
      { "field": "marketingAutomation", "operator": "equals", "value": true },
      { "field": "cookiesPixelsSdk", "operator": "equals", "value": true },
      { "field": "usesAdtechRetargeting", "operator": "equals", "value": true }
    ]
  },
  "addQuestionPack": "RETAIL_MARKETING_ADTECH_V1"
}
```

```json
{
  "ruleCode": "TRIGGER_RETAIL_PAYMENT_TOKENISATION",
  "condition": {
    "any": [
      { "field": "savedCardOrTokenisation", "operator": "equals", "value": true },
      { "field": "paymentGatewayUsed", "operator": "equals", "value": true }
    ]
  },
  "addQuestionPack": "RETAIL_PAYMENT_TOKENISATION_V1"
}
```

```json
{
  "ruleCode": "TRIGGER_RETAIL_MARKETPLACE",
  "condition": { "field": "marketplaceModel", "operator": "equals", "value": true },
  "addQuestionPack": "RETAIL_MARKETPLACE_SELLER_V1"
}
```

### 17.4 Dashboard implementation notes

The executive dashboard for retail/e-commerce should display:

- overall DPDP Compass score,
- evidence confidence,
- ROPA completeness,
- payment-data risk,
- marketing/adtech risk,
- logistics/vendor risk,
- marketplace seller risk,
- AI/personalization risk,
- open P0/P1 actions,
- breach readiness,
- top 5 customer-data risks.

---

## 18. Final implementation note

This Retail / E-commerce industry overlay should make DPDP Compass practical for fast-moving consumer digital businesses. The assessment should not become limited to a privacy-policy review. It must check the actual operating flows: website, app, checkout, payment, delivery, returns, support, marketing, sellers, stores, vendors, AI and evidence.

The output should help a retailer answer:

> “What personal data do we collect, why do we collect it, where does it go, who can access it, which vendors process it, can customers exercise their rights, can we prove our controls, and what must we fix first?”

---

## 19. Source references used for this industry overlay

- **Digital Personal Data Protection Act, 2023:** https://www.meity.gov.in/static/uploads/2024/02/Digital-Personal-Data-Protection-Act-2023-1.pdf
- **Digital Personal Data Protection Rules, 2025:** https://www.meity.gov.in/documents/act-and-policies/digital-personal-data-protection-rules-2025-gDOxUjMtQWa?pageTitle=Digital-Personal-Data-Protection-Rules-2025
- **Department of Consumer Affairs — Consumer Protection Act / E-Commerce Rules page:** https://consumeraffairs.nic.in/acts-and-rules/consumer-protection/consumer-protection
- **PIB — CCPA Dark Patterns Guidelines, 2023:** https://www.pib.gov.in/PressReleasePage.aspx?PRID=1983994
- **RBI — Tokenisation: Card Transactions / Card-on-File Tokenisation:** https://www.rbi.org.in/scripts/BS_CircularIndexDisplay.aspx?Id=12159
- **RBI — Storage of Payment System Data FAQ:** https://systemhealth.rbi.org.in/Scripts/FAQDisplay.aspx_Id%3D130%281%29.html
- **CERT-In — Directions under Section 70B, Information Technology Act, 2000:** https://www.cert-in.org.in/Directions70B.jsp
- **OWASP API Security Top 10 — 2023:** https://owasp.org/API-Security/editions/2023/en/0x11-t10/

