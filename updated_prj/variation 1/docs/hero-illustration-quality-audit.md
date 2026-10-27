# Hero Illustration Quality Audit

Audit evidence is captured with `scripts/audit-hero-illustrations.mjs`. PNGs and JSON reports are written outside the repository under `%TEMP%\truststack-hero-audit\<route>\<phase>` and are removed after final review. Measurements below use CSS pixels from the real route under exact CDP device metrics.

## Batch sign-off

### Batch A - complete

- **Routes:** `/industries`, `/tools`, `/blog`, `/solutions`.
- **States reviewed:** 20 normal-motion and 20 reduced-motion states across four before/after contact-sheet pairs.
- **Root causes fixed:** detached universal platforms; underspecified locale tracks; globally scaled workbench labels; clipped document and article inserts; rotating full-width press roller; near-zero engine clearance; detached engine extrusions; low-contrast dark title ink.
- **Viewport/theme/locale matrix:** 1280, 1366, 1440, 1024 and true 390 widths; light/dark; normal/reduced motion; `en`, `hi`, `ml`, `ur`. All route matrices pass, including `scrollWidth === innerWidth` at 390px.
- **Engineering gate:** focused ESLint passed for all four heroes; `npx tsc --noEmit` passed; editor diagnostics are clean; all four routes returned HTTP 200 with their expected hero marker; newly appended dev logs contained no matching runtime/build/hydration errors.
- **Unresolved risks:** none in Batch A hero components.
- **Recommendation:** proceed to Batch B.

## Route matrix

| Route | Component | States | Baseline captured | Root cause | Files changed | Desktop | Tablet | Mobile | Light | Dark | Reduced motion | Locales | Result |
| --- | --- | ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/industries` | `IndustryModelsHero.tsx` | 6 | Yes | Detached universal ellipse platform; unconstrained locale grid items | `IndustryModelsHero.tsx` | Pass | Pass | Pass | Pass | Pass | 6/6 | `en`, `hi`, `ml`, `ur` | Pass |
| `/tools` | `ToolsConsoleHero.tsx` | 2 | Yes | Global assembly scale; detached shared ellipse; underspecified header and sheet slot | `ToolsConsoleHero.tsx` | Pass | Pass | Pass | Pass | Pass | 2/2 | `en`, `hi`, `ml`, `ur` | Pass |
| `/blog` | `EditorialPressHero.tsx` | 5 | Yes | Full roller rotation crossed the machine; clipped article insert; shifted frame | `EditorialPressHero.tsx` | Pass | Pass | Pass | Pass | Pass | 5/5 | `en`, `hi`, `ml`, `ur` | Pass |
| `/solutions` | `SolutionsHero.tsx` | 7 | Yes | Near-zero scaled fit; detached chassis extrusions; weak dark title ink | `SolutionsHero.tsx` | Pass | Pass | Pass | Pass | Pass | 7/7 | `en`, `hi`, `ml`, `ur` | Pass |
| `/scanner` | `ScannerGantryHero.tsx` | 6 | Yes | Whole-frame 3D transform; stacked exiting copy; no live region; near-zero clearance | `ScannerGantryHero.tsx` | Pass | Pass | Pass | Pass | Pass | 6/6 | `en`, `hi`, `ml`, `ur` | Pass |
| `/security` | `SecurityFortressHero.tsx` | 6 | Yes | Whole-fortress 3D transform; stale exiting copy; transformed rings/sweep exceeded stage | `SecurityFortressHero.tsx` | Pass | Pass | Pass | Pass | Pass | 6/6 | `en`, `hi`, `ml`, `ur` | Pass |
| `/templates` | `TemplateArchiveHero.tsx` | 4 | Yes | Whole-cabinet tilt; detached side flap; 62px drawer travel; opacity-gated nested paper | `TemplateArchiveHero.tsx` | Pass | Pass | Pass | Pass | Pass | 4/4 | `en`, `hi`, `ml`, `ur` | Pass |
| `/rules` | `RulesIndexHero.tsx` | 6 | Yes | Whole-machine tilt; 40px row travel; header/counter collision; all 23 cells blinking | `RulesIndexHero.tsx` | Pass | Pass | Pass | Pass | Pass | 6/6 | `en`, `hi`, `ml`, `ur` | Pass |
| `/act` | `ActCodexHero.tsx` | 9 | Pending | Pending | Pending | Pending | Pending | Pending | Pending | Pending | Pending | Pending | Pending |
| `/certification` | `CertificationPressHero.tsx` | 8 | Pending | Pending | Pending | Pending | Pending | Pending | Pending | Pending | Pending | Pending | Pending |
| `/cases` | `CaseBalanceHero.tsx` | 4 | Yes | Disconnected beam/pans, floating dossier, redundant icon toolbar | `CaseBalanceHero.tsx`, `globals.css`, audit script | Pass | Pass | Pass | Pass | Pass | 4/4 | `en`, `hi`, `ml`, `ur` | Pass |
| `/courses` | `CoursesRouterHero.tsx` | 6 | Pending | Pending | Pending | Pending | Pending | Pending | Pending | Pending | Pending | Pending | Pending |
| `/learn` | `LearnPathHero.tsx` | 6 | Pending | Pending | Pending | Pending | Pending | Pending | Pending | Pending | Pending | Pending | Pending |
| `/rights` | `RightsWheelHero.tsx` | 6 | Pending | Pending | Pending | Pending | Pending | Pending | Pending | Pending | Pending | Pending | Pending |
| `/why-us` | `WhyUsIntegrationHero.tsx` | 6 | Pending | Pending | Pending | Pending | Pending | Pending | Pending | Pending | Pending | Pending | Pending |
| `/framework` | `FrameworkMethodHero.tsx` | 7 | Pending | Pending | Pending | Pending | Pending | Pending | Pending | Pending | Pending | Pending | Pending |
| `/privacy` | `LegalUtilityHeroes.tsx` (`PrivacyVaultHero`) | 6 | Pending | Pending | Pending | Pending | Pending | Pending | Pending | Pending | Pending | Pending | Pending |
| `/terms` | `LegalUtilityHeroes.tsx` (`TermsLedgerHero`) | 6 | Pending | Pending | Pending | Pending | Pending | Pending | Pending | Pending | Pending | Pending | Pending |
| `/cookies` | `LegalUtilityHeroes.tsx` (`ConsentConsoleHero`) | 4 | Pending | Pending | Pending | Pending | Pending | Pending | Pending | Pending | Pending | Pending | Pending |

## Route evidence

### `/industries`

- **Baseline evidence:** `industries-before-states-contact-sheet.png`; responsive/theme samples `industries-before-{standard-light,wide-light,tablet-light,mobile-light,desktop-dark,desktop-reduced}.png`.
- **Diagnosis:** The six native model coordinate sets already fit the 450px internal frame, but two independently bordered ellipses formed a universal pedestal that did not correspond to any model footprint. Long Malayalam title and tab strings also retained intrinsic grid/flex widths, shifting the 450px model frame 54.6px beyond the stage and spilling labels into adjacent icon slots.
- **Controlling code path:** `IndustryModelsHero` renders the copy and tab grid; `IndustryModelStage` owns the 450px coordinate frame, platform geometry and per-model assembly.
- **Smallest edit:** Preserve all native model coordinates; replace both ellipses with a borderless contact shadow sized from factual per-model footprints, reduce hover lift from 6px to 4px, and add `min-w-0` plus locale-safe wrapping to the owning copy, stage and tab slots.
- **Before measurements:** stage `667.2 x 320`; internal frame `450 x 286`; frame bottom `435` versus stage bottom `452`; rail top `464`. In Malayalam, intrinsic track expansion moved the frame right edge to `1299.6` versus stage right `1245`.
- **After measurements:** stage `667.2 x 320`; internal frame `450 x 286`; frame bottom `435` versus stage bottom `452`; rail top `464`. Malayalam frame right edge is `1136.4` versus stage right `1245`. True mobile is `innerWidth=390`, `scrollWidth=390`, and the hidden desktop stage contributes zero height.
- **State results:** BFSI, Healthcare, Education, SaaS & IT, E-Commerce and Government all captured in normal and reduced-motion modes. Every sample has exactly one selected tab, one visible live region, no zero-opacity essential node and no descendant outside the stage.
- **After evidence:** `industries-after-states-contact-sheet.png`, `industries-after-reduced-states-contact-sheet.png`, plus nine viewport/theme/locale samples. Light, dark, 1280, 1366, 1440, 1024, 390, Hindi, Malayalam and Urdu/RTL pass.
- **Validation:** focused ESLint passed; editor diagnostics are clean. Batch TypeScript, HTTP and log checks remain due at the Batch A boundary.
- **Residual risk:** None identified in the hero. The global translated header is outside this component and was not modified.

### `/tools`

- **Baseline evidence:** `tools-before-states-contact-sheet.png`, `tools-before-reduced-states-contact-sheet.png`, and nine responsive/theme/locale samples.
- **Diagnosis:** The shared `route-hero-stage-scale` reduced the 600px workbench to `528 x 316.8`, making the 12px model labels effectively 10.56px and leaving both instruments unnecessarily small. A detached universal glow ellipse ignored the two chassis footprints; the calculator header lacked explicit control tracks, long locale copy could widen the grid into the stage, and the document sheet depended on large travel from a clipped starting position.
- **Controlling code path:** `ToolWorkbench` owns the shared coordinate frame and grounding; `CalculatorConsole` owns the header, meters and keypad; `DocumentPress` owns the roller, output slot, sheet and footer rail.
- **Smallest edit:** Remove only the Tools scale class; fit a native `600 x 344` coordinate frame to the existing stage; add footprint-specific contact shadows; give the calculator a three-track header; constrain locale grid/tab items; render the complete sheet in its slot with a 3px local motion; replace the rounded overlay base with an integrated footer rail.
- **Before measurements:** stage `722.8 x 344`; scaled coordinate frame `528 x 316.8`, ending at `436.8` versus rail top `464`. Calculator chassis was `431.2 x 237.6`; document press was approximately `400.4 x 251.7` after the `0.88` scale.
- **After measurements:** stage `722.8 x 344`; calculator chassis `490 x 270`, bottom `418`, with `46px` rail clearance; document press `455 x 286`, bottom `426`, with `38px` rail clearance. True mobile is `innerWidth=390`, `scrollWidth=390`, with no desktop-stage hole.
- **State results:** Calculators and Document Studio both captured in normal and reduced-motion modes. Every sample has exactly one selected tab, one visible live region, no zero-opacity essential node and no descendant outside the stage.
- **After evidence:** `tools-after-states-contact-sheet.png`, `tools-after-reduced-states-contact-sheet.png`, plus 1280, 1366, 1440, 1024, 390, light, dark, Hindi, Malayalam and Urdu/RTL samples.
- **Validation:** focused ESLint passed; editor diagnostics are clean. The route returned HTTP 200 during the resumed capture, and the current dev-server stderr is empty. Batch TypeScript and combined HTTP/log checks remain due at the Batch A boundary.
- **Residual risk:** None identified in the hero. Model-local instrument labels remain factual source labels and do not overlap in the tested locales.

### `/blog`

- **Baseline evidence:** `blog-before-states-contact-sheet.png`, `blog-before-reduced-states-contact-sheet.png`, and nine responsive/theme/locale samples.
- **Diagnosis:** The native 560px frame was correctly top-anchored, but it retained a 16px left translation outside the stage. More importantly, a 396px horizontal roller used `rotate: 360`, turning into a diagonal bar through the header, article and base, while the `180px` article sheet was permanently clipped by a `150px` slot and extended 6px below the stage.
- **Controlling code path:** `PressModel` owns the frame, chassis, roller, article slot, base and state controls; `TopicTabs` owns the five selectable desks.
- **Smallest edit:** Center the native frame without scaling; keep the roller horizontal and move only a contained highlight; fit a complete `214 x 134` article inside its slot; constrain locale grid/tab items; mark chassis/base/controls so their union is measured as the model footprint.
- **Before measurements:** stage `733.9 x 320`; coordinate frame `560 x 320`, left edge `501.1` versus stage left `517.1`; article sheet bottom `458` versus stage bottom `452`; rotating roller reached approximately `457` at sampled states; rail top `464`.
- **After measurements:** stage `733.9 x 320`; measured chassis/base/control union `540 x 310`, bottom `448` versus rail top `464`, leaving `16px` clearance. No measured descendant extends outside the stage.
- **State results:** Compliance, AI, SMEs, Children and Rights all captured in normal and reduced-motion modes. Each sample has one selected tab, one visible live region, no zero-opacity essential node, a complete article and a horizontal roller.
- **After evidence:** `blog-after-states-contact-sheet.png`, `blog-after-reduced-states-contact-sheet.png`, plus 1280, 1366, 1440, 1024, 390, light, dark, Hindi, Malayalam and Urdu/RTL samples.
- **Validation:** focused ESLint passed; editor diagnostics are clean; the final harness run exited successfully. Batch TypeScript, combined HTTP and log checks remain due at the Batch A boundary.
- **Residual risk:** The roller highlight is intentionally ambient; reduced motion fixes it at a complete static position without changing information.

### `/solutions`

- **Baseline evidence:** `solutions-before-states-contact-sheet.png`, `solutions-before-reduced-states-contact-sheet.png`, and nine responsive/theme/locale samples.
- **Diagnosis:** A centered `560 x 390` coordinate frame depended on the shared `0.88` scale and ended at `463.6` against a rail starting at `464`, leaving effectively no margin. Independent back plate, side polygon and bottom extrusion surrounded the front chassis, the aura escaped the stage in several states, and the gradient-clipped interactive title became nearly invisible in dark theme.
- **Controlling code path:** `ServiceStackEngine` owns the seven-row chassis, aura, grounding and active-row travel; `SolutionsHero` owns the title, active copy grid and tab rail.
- **Smallest edit:** Preserve the seven-module front elevation; remove the detached back/side/bottom geometry; render a native `476 x 320` chassis in a matching coordinate frame; constrain the aura and contact shadow; reduce active-row travel from 6px to 4px; constrain locale tracks; use explicit theme ink for the interactive title.
- **Before measurements:** stage `622.7 x 344`; scaled coordinate frame `492.8 x 343.2`, bottom `463.6` versus rail top `464`, leaving `0.4px`. The tablet coordinate frame extended beyond its stage, and sampled aura bounds reached below the stage.
- **After measurements:** chassis `476 x 320`, bottom `448` versus rail top `464`, leaving `16px`. At 1024px, stage bounds are `462.5..980` and chassis bounds are `483.3..959.3`; all descendants remain bounded.
- **State results:** DPDP Ignite, DPDP Compass, DPDP Build, AI Privacy Shield, DPDP TrustOps, TrustStack Platform and CDPP Certification all captured in normal and reduced-motion modes. Every sample has one selected tab, one visible live region, no zero-opacity essential node and no descendant outside the stage.
- **After evidence:** `solutions-after-states-contact-sheet.png`, `solutions-after-reduced-states-contact-sheet.png`, plus 1280, 1366, 1440, 1024, 390, light, dark, Hindi, Malayalam and Urdu/RTL samples.
- **Validation:** focused ESLint passed; editor diagnostics are clean; final capture exited successfully and the route returned HTTP 200. Batch TypeScript and combined checks are recorded below.
- **Residual risk:** The clickable title still controls the existing engagement state, but its fill remains readable instead of switching to a low-contrast clipped gradient.

### `/scanner`

- **Baseline evidence:** `scanner-before-states-contact-sheet.png`, `scanner-before-reduced-states-contact-sheet.png`, and nine responsive/theme/locale samples.
- **Diagnosis:** The complete 580×380 text-bearing browser and gantry rotated in 3D and depended on the shared `0.88` scale, producing state-dependent rasterized bounds and as little as 2.1px clearance. `AnimatePresence` retained fading prior descriptions in normal captures, but no visible element actually owned `aria-live`; active signal rows also traveled 12px.
- **Controlling code path:** `HeroCopy` owns the active description; `ScannerModel` owns the browser, gantry, six signal rows and scan beam; `SignalTabs` owns selection.
- **Smallest edit:** Render one direct keyed live region; remove the assembly perspective/rotation/scale; recompose a native `580 x 336` coordinate frame; retain only a 3px hover lift and local beam travel; reduce row travel to 6px; constrain locale copy/tab slots.
- **Before measurements:** stage `733.9 x 344`; transformed frame ranged from approximately `510.4 x 334.4` to `508.6 x 339.8`, ending at `459.2..461.9` versus rail top `464`, leaving `4.8..2.1px`.
- **After measurements:** native assembly `580 x 336`, bottom `456` versus rail top `464`, leaving `8px`. Every measured descendant remains inside the stage.
- **State results:** HTTPS, Consent banner, Privacy policy, Cookie policy, Cookies and Third-party trackers all captured in normal and reduced-motion modes. Each sample has one selected tab, one visible live region, no zero-opacity essential node and no stale exiting description.
- **After evidence:** `scanner-after-states-contact-sheet.png`, `scanner-after-reduced-states-contact-sheet.png`, plus 1280, 1366, 1440, 1024, 390, light, dark, Hindi, Malayalam and Urdu/RTL samples.
- **Validation:** focused ESLint passed; editor diagnostics are clean; the route returned HTTP 200 and the capture exited successfully.
- **Residual risk:** The gantry uses 8px rail clearance by design; its local beam glow is contained and does not affect layout.

### `/security`

- **Baseline evidence:** `security-before-states-contact-sheet.png`, `security-before-reduced-states-contact-sheet.png`, and nine responsive/theme/locale samples.
- **Diagnosis:** The complete 560×380 fortress rotated/scaled in 3D and left only 2.2px clearance in several states. Exiting descriptions remained visibly stacked, while rotating 330/260/190px structural octagons and a foreground 300px conic sweep produced transformed bounds below the stage and crossed the perimeter controls.
- **Controlling code path:** `SecurityFortressHero` owns active copy; `FortressModel` owns structural rings, core, six controls and sweep; `ControlTabs` owns selection.
- **Smallest edit:** Render one direct keyed live region; remove whole-assembly 3D transforms and shared scale; compact perimeter controls into a native `560 x 336` frame; keep structural octagons static; retain one 220px sweep behind controls; reduce selected scale; constrain locale copy/tab slots.
- **Before measurements:** stage `733.9 x 344`; transformed frame approximately `492.8 x 334.4` to `491 x 339.6`, ending at `459.2..461.8` versus rail top `464`. Rotated structural layers exceeded the stage in five states.
- **After measurements:** native assembly `560 x 336`, bottom `456` versus rail top `464`, leaving `8px`. All transformed and static descendants remain inside the stage.
- **State results:** Transport / TLS, Security headers, Data exposure, Cookies, Third-party surface and Breach contactability all captured in normal and reduced-motion modes. Each sample has one selected tab, one visible live region and no zero-opacity essential node.
- **After evidence:** `security-after-states-contact-sheet.png`, `security-after-reduced-states-contact-sheet.png`, plus 1280, 1366, 1440, 1024, 390, light, dark, Hindi, Malayalam and Urdu/RTL samples.
- **Validation:** focused ESLint passed; editor diagnostics are clean; the route returned HTTP 200 and the final capture exited successfully.
- **Residual risk:** The 220px sweep remains continuous ambient motion; reduced motion freezes it while preserving the complete perimeter.

### `/templates`

- **Baseline evidence:** `templates-before-states-contact-sheet.png`, `templates-before-reduced-states-contact-sheet.png`, and nine responsive/theme/locale samples.
- **Diagnosis:** A centered 540×390 cabinet used whole-assembly 3D rotation and shared scaling, with a detached skewed side strip. Selected drawers traveled 62px and scaled, while each paper was nested above its selected row and entered from `opacity: 0`, causing state-dependent clipping and making the first drawer visually paperless.
- **Controlling code path:** `TemplateArchiveHero` owns active copy; `ArchiveCabinet` owns cabinet, drawers, selected paper, base and side flap; `ArchiveTabs` owns selection.
- **Smallest edit:** Render one direct keyed live region; replace the stage with a native `520 x 336` front elevation; remove the side flap; keep four stable 48px drawers with 8px active travel; render one fixed complete current paper; widen the route-local copy track enough to keep “Templates” intact; constrain locale tabs.
- **Before measurements:** stage `728.8 x 344`; transformed frame approximately `475.2 x 343.2` to `473.5 x 348.3`, ending at `456.7..459.2` versus rail top `464`. At least one transformed descendant exceeded the stage in every matrix group.
- **After measurements:** native assembly `520 x 336`, bottom `456` versus rail top `464`, leaving `8px`. At 1024px the stage is `563.6px` wide, so the 520px archive retains horizontal margin.
- **State results:** Policies, Agreements, Forms & notices and Breach all captured in normal and reduced-motion modes. Every state shows one complete paper, one selected tab, one live region and no out-of-stage descendant.
- **After evidence:** `templates-after-states-contact-sheet.png`, `templates-after-reduced-states-contact-sheet.png`, plus 1280, 1366, 1440, 1024, 390, light, dark, Hindi, Malayalam and Urdu/RTL samples.
- **Validation:** focused ESLint passed; editor diagnostics are clean; the route returned HTTP 200 and the final capture exited successfully.
- **Residual risk:** The document paper is intentionally offset in front of the cabinet but remains fully inside the measured assembly and does not obscure drawer labels.

### `/rules`

- **Baseline evidence:** `rules-before-states-contact-sheet.png`, `rules-before-reduced-states-contact-sheet.png`, and nine matrix samples.
- **Diagnosis:** The complete index rotated in 3D, selected rows traveled 40px, “Operational index” collided with the factual `23` counter, and all 23 rail cells blinked continuously.
- **Controlling code path:** `RulesIndexHero` owns copy/tabs; `RulesMachine` owns header, six rows, base and factual cell rail.
- **Smallest edit:** Use one direct live region; render a native `500 x 336` front elevation; allocate header/count tracks; reduce row travel to 6px; keep all 23 cells stable; constrain labels.
- **Before/after measurements:** transformed frame `437.7 x 331`, bottom `457.5`; after assembly `500 x 336`, bottom `456` versus rail top `464`, leaving `8px`.
- **State results:** General, Consent & Notice, Breach & Security, Children, The Board and Transfers pass in normal/reduced motion, both themes and all required locales.
- **Evidence:** `rules-after-states-contact-sheet.png`, `rules-after-reduced-states-contact-sheet.png`, and nine after-matrix samples.
- **Validation/residual risk:** focused ESLint and diagnostics pass; HTTP 200; no residual hero risk identified.

### `/cases`

- **Baseline evidence:** `cases-before-states-contact-sheet.png`, `cases-before-reduced-states-contact-sheet.png`, and nine responsive/theme/locale samples under `%TEMP%\truststack-hero-audit\cases\before`.
- **Diagnosis:** Earlier local work already removed the whole-assembly 3D transform, duplicate icon grid and stacked live regions. The remaining beam still owns both suspension lines and pans, however, so all three rotate as one rigid frame; the dossier independently alternates left/right and floats above a flat outlined ellipse instead of resting in a pan. The rectangular mast, beam, pivot badge and narrow base also read as separate wireframe parts rather than one load-bearing instrument.
- **Controlling code path:** `JurisprudenceBalance` owns the mast, beam, suspensions, pans and dossier; `CaseBalanceHero` owns the stable live copy, timer and four category tabs.
- **Smallest intended edit:** Replace only the structural artwork with a front-facing SVG whose beam endpoints, vertical suspension triangles, horizontal pans and fixed right-hand dossier share one geometry model; retain the current timer, direct live copy and real bottom tabs.
- **Before measurements:** at 1366px the stage is `722.8 x 288`, the artwork frame is `600 x 280`, artwork bottom is `396` versus rail top `400`, leaving `4px`. At 1024px the stage is `600.6px` wide around a `600px` artwork, leaving approximately `0.3px` per side. True mobile is `innerWidth=390`, `scrollWidth=390`, and the hidden stage is `0 x 0`.
- **Baseline state results:** all four categories captured in normal and reduced-motion modes with one selected tab, one visible live region and no zero-opacity essential node. These are baseline behavior checks, not a visual pass.
- **After measurements:** the stage remains `722.8 x 288` at 1366px while the contained artwork is `584 x 272`, ending `12px` above the rail. At 1024px the `584px` artwork fits inside the `600.6px` stage with no out-of-stage descendant. True mobile remains `innerWidth=390`, `scrollWidth=390`, and the hidden stage contributes no height.
- **Physical construction:** a single front-facing SVG now connects a warm-stone plinth, brass socket and tapered mast, pivot collar, beam, endpoint-derived suspension triangles and two horizontal shallow pans. The dossier remains on the left loaded pan in every state, overlaps its interior, casts a close contact shadow and uses only the factual dossier number/category. Beam angles stay between `1.7deg` and `2.8deg`; pan geometry is never rotated with the beam.
- **Final state results:** Right to privacy, Consent & confidentiality, Surveillance & the state and Speech & the internet pass in normal and reduced-motion modes. Every capture has one selected tab, one visible live region, no zero-opacity essential node and no out-of-stage descendant. The complete balance and dossier are present on the first frame.
- **After evidence:** `cases-after-final-states-contact-sheet.png`, `cases-after-final-reduced-states-contact-sheet.png`, and nine final samples under `%TEMP%\truststack-hero-audit\cases\after-final`. Light, dark, 1280, 1366, 1440, 1024, true 390, Hindi, Malayalam and Urdu/RTL pass; the decorative SVG is explicitly LTR so its English dossier labels remain contained in RTL pages.
- **Validation:** focused ESLint, `npx tsc --noEmit`, audit-script syntax and editor diagnostics pass. The final audit route returned HTTP 200 throughout capture with no build, runtime or hydration error.
- **Residual risk:** None identified in the hero. The dossier uses source-language category labels inside an `aria-hidden` decorative SVG; translated accessible state copy remains outside the model.
