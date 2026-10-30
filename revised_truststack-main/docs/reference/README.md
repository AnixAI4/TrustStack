# Reference map — everything TrustStack, in one place

Last updated 25 Oct 2026. One page that says where every piece of TrustStack material lives: this repo, the old app, the working folders on Aniket's Mac, and the Claude documents in the cloud. Start here when you need anything that is not code.

**Rules for keeping it current**

- A new document, deck or artifact gets one row here in the same commit or session that creates it.
- Claude Docs and Slides in the cloud are the **live** versions. Markdown copies in this repo are dated **snapshots** for search and history; when the live doc changes, refresh the snapshot.
- Never put confidential partner or NewCo terms in this repo; list only that they exist and who holds them.

## 1. Inside this repo (`revised_truststack`)

| What | Where | Notes |
| --- | --- | --- |
| Project rules and slice contract | `CLAUDE.md` | Auto-loaded by every Claude session |
| Current status (read first) | `docs/STATE.md` | Single status file |
| Decisions (append-only) | `docs/DECISIONS.md` | Never re-litigate an entry |
| Slice plan | `docs/SLICES.md`, `docs/slices/` | Slices 0A–15 |
| Product spec (frozen copy of the Steps A–P pack) | `docs/spec/` | Source pack lives in `DPDP_revised/truststack_dpdp_compass_md_pack/` |
| Legal texts | `docs/legal/` | DPDP Act 2023, Rules 2025 (Gazette G.S.R. 846(E)), corrigendum G.S.R. 892(E) |
| Validated Excel MVP (test oracle) | `docs/source/` | Baseline 24.7015 |
| Industry question packs (source of truth, D-013) | `docs/question_packs/industry/` | 03 is BFSI |
| UX register | `docs/UX_REVIEW.md` | Simplicity rubric |
| **Banking go-to-market** | `docs/gtm/banking/` | Research, briefing, strategy, RBI note; see its README |
| **Consolidated feature analysis** (old + new app → one platform, incl. Sentinel) | `docs/reference/CONSOLIDATED_FEATURE_ANALYSIS.md` | 7 steps, approval after each; Steps 1–2 approved 28 Oct 2026 |
| **Business models analysis** (enterprise + certified-partner network, non-confidential) | `docs/reference/BUSINESS_MODEL_ANALYSIS.md` | Steps B1–B7, approval after each; NewCo terms stay in `company_formation/` |
| **Multi-level assessment analysis** (Pulse → Proof → Sentinel, F-69) | `docs/reference/MULTI_LEVEL_ASSESSMENT_ANALYSIS.md` | 7 steps, approval after each; started 29 Oct 2026 |
| **Visual journey report** (real data: Excel MVP baseline + demo registers, F-79) | `docs/reference/assessment_visuals/VISUAL_JOURNEY_REPORT.html` (regenerate: `node tools/visual_report.mjs`) · mock-up: `assessment_visuals/PULSE_PROOF_VISUALS.html` | 10 charts + tiles, journey map and status table; table view on every chart (Apache ECharts); revised to the 4b.2a quality standard 29 Oct 2026 |
| **Feature register + live tracker** (F-61) | **`docs/reference/FEATURE_TRACKER.html` — the page to open (any browser, no sign-in), regenerated at the end of every prompt** · `docs/reference/feature_register.json` (source, edit by hand) · `tools/feature_tracker.py` (checks it against `origin/main`) · `docs/reference/feature_tracker.json` (generated) · `docs/reference/feature_tracker_page.html` (the page's copy) | Live: https://claude.ai/artifact/PZeYB4vxU8RRUSnYoB1YSq — refreshed in every Sync Step (PLAYBOOK §6.5) |

## 2. Old app (frozen, D-002)

| What | Where |
| --- | --- |
| Old TrustStack app repo (`aniketmhala/dpdp`) | `/Users/aniketmhala/Downloads/Anix/AI_Projects/DPDP/truststack-platform` |
| Its structure notes | `…/truststack-platform/PROJECT_STRUCTURE.md`, `…/implementation/` |

Nothing to migrate; six modules were ported in Slice 10. It is retired in Slice 13. Read it for history, never change it.

## 3. Working folders on Aniket's Mac

**`/Users/aniketmhala/Downloads/Anix/AI_Projects/DPDP_revised/`** (this repo's parent)

| What | File or folder |
| --- | --- |
| Validated Excel MVP (original) | `TrustStack_DPDP_Compass_Excel_MVP_Validated_Step12.xlsx` |
| Sample assessment report (Step 13) | `DPDP_Compass_Step13_Report.docx` |
| Mumbai University Dean pitch (Step 14) | `DPDP_Compass_Step14_Mumbai_University_Dean_Meeting_Pitch.docx` |
| Product PRD (Step 15) | `DPDP_Compass_Step15_TrustStack_Product_PRD.docx` |
| Commercial proposal and pricing (Step 16) | `DPDP_Compass_Step16_Commercial_Proposal_and_Pricing.docx` |
| Sales demo deck (Step 17) | `DPDP_Compass_Step17_Sales_Demo_Deck.pptx` |
| Executive article | `DPDP_Executive_Article_Dr_Aniket_Mhala.docx` / `.pdf` |
| Markdown spec pack (Steps A–P) | `truststack_dpdp_compass_md_pack/` |
| Industry question packs (originals) | `industry_specific_questions_md_files/` (the repo copy is authoritative) |
| Marketing and sales kits, per industry | `marketing material/` (BFSI–FinTech, EdTech, Healthcare, Manufacturing, Public Sector, Retail, SaaS, Professional Services, General) |
| Articles and background documents | `articles & documents/` |
| DPDP Act and Rules PDFs (originals) | `DPDP-Act-2023-official (2).pdf`, `DPDP_Rules_2025_English_only.pdf` |

Ignore the `.zip` "packs" and duplicate `(1)`, `2` copies: they match the loose files.

**`/Users/aniketmhala/Downloads/Anix/AI_Projects/DPDP/`** (early market research)

| What | File or folder |
| --- | --- |
| Master index of the early research | `00_Master_Index.md` |
| What DPDP is; industry priority; applicability | `01_What_Is_DPDP.md`, `02_Industry_Prioritization.md`, `03_Applicability_Analysis.md` |
| Government mandates; market; competition | `04_Government_Mandates.md`, `05_Market_Landscape.md`, `06_Competition_Analysis.md` |
| Opportunity map; GTM; revenue plan; proposition | `07_…` to `11_…` |
| Other research folders | `GTM/`, `Competitive_Analysis/`, `DPDPA_Com_Analysis/`, `dpdp_trainings_certification_analysis/`, `East_Africa/` |

## 4. Claude documents in the cloud (live versions)

All are private to Aniket until shared from each page's Share menu.

| Document | Link | Repo snapshot |
| --- | --- | --- |
| DPDP & Indian Banking — Research Brief (Step 1) | https://claude.ai/artifact/KEYuH7VCArzdjLDEeTuSKv | `docs/gtm/banking/01_research_brief.md` |
| DPDP & Banking — Your Meeting Briefing (Step 2) | https://claude.ai/artifact/ThzEzabJaJZhT3ngVGoaEw | `docs/gtm/banking/02_meeting_briefing.md` |
| DPDP & Banking — Go-to-Market Strategy (Step 3) | https://claude.ai/artifact/C4ZLhWnbj3fy6K8FuDVEax | `docs/gtm/banking/03_gtm_strategy.md` (one confidential line removed) |
| DPDP & Banking — Executive Deck, 19 slides (Step 4) | https://claude.ai/artifact/EWkeUGmna9ckrCBZDPjxfe | Outline in `docs/gtm/banking/README.md` |
| DPDP Readiness in RBI-Regulated Lending — Note (Step 4) | https://claude.ai/artifact/4iL2eEhZY5YK6xEqce3VQT | `docs/gtm/banking/04_rbi_note.md` |
| NewCo formation documents | Held by Aniket; deliberately not linked here | — |

## 5. Access for Claude sessions

`.claude/settings.json` in this repo grants every Claude session started here read and write access to the two working folders above (`DPDP_revised/` and `DPDP/`), so a session can open the Excel MVP, the old app or the marketing kits without asking. Treat the old app and the originals as read-only.
