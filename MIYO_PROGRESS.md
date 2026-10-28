# MIYO development progress

## Current milestone
Replaced the single-screen Coming Soon concept with a local, multi-section editorial website. This is a static HTML/CSS/vanilla-JavaScript implementation; no dependency install or external animation library is required.

## Implemented
- Cinematic text-led hero: oversized Hanoi × Kaohsiung, original SVG connection thread, coordinates, subtle parallax, and city-specific captioning; the globe/world map is removed.
- Editorial sections: About MIYO, Our Story, Experience interaction, FAQ, review-marked Privacy Notes, Contact, and a clear link to the existing Questions application.
- Motion system: CSS type/route entrance, restrained route pulses, intersection-observer reveals, pointer parallax, hover states, and `prefers-reduced-motion` fallback.
- Accessibility/responsive: semantic landmarks, skip link, visible focus, native `<details>` FAQ, responsive layouts, and no required interaction dependent on pointer hover.
- Questionnaire/backend files were not edited. No Timeline section or gift reveal was added.
- Applications now uses natural document scrolling with a fixed bottom action bar; buttons, validation focus/error feedback, busy states, photo handling, selection counters, and review edit links were refined. The configured Apps Script URL and payload shape remain unchanged.
- Earlier work removed minimum heights from the Applications flow; the manager follow-up below also removes forced viewport-height sections from `neededaccess/miyo/`. Preserved `overflow: hidden` only for decorative artwork.
- Local checkpoint: `39c98b7` (“Checkpoint current MIYO landing page”). No remote changes.

## Technical decisions
- Kept the existing static stack; vanilla CSS/JS avoids adding a dependency for modest animation needs.
- Used natural CSS scrolling rather than scroll hijacking.
- Research: reviewed Awwwards portfolio inspiration, Codrops creative showcases/tutorials, Godly's visual inspiration index, and GSAP Showcase. Used broad principles (strong typographic composition, small purposeful interactions, motion tied to content) without copying a specific site. Search API queries failed, but direct page browsing worked.
- Privacy page is explicitly a draft. Local backend source indicates Sheets/Drive handling, but the deployed configuration and access controls were not verified.

## Test record
- `node --check miyo.js`: passed.
- `git diff --check`: passed.
- Python HTML parser: no duplicate IDs or broken local anchors/files.
- Python local HTTP server: homepage and `/applications/` returned HTTP 200; `miyo.css`/`miyo.js` also served successfully.
- Headless Chrome/CDP: rendered and visually inspected desktop, tablet, and mobile views; no document horizontal overflow at 1440, 1024, 768, 390, or 320 CSS px.
- Headless Chrome/CDP: all 18 scroll-reveal targets became visible while scrolling; native FAQ behavior checked (opening a second item closes the first); reduced-motion CSS checked; no console exceptions or failed HTTP resources observed in the final browser pass.
- Existing questionnaire page loaded with login form and script present; no login/submission was attempted, so no real records or production endpoint were touched.
- Synthetic browser checks intercepted login locally and exercised required-field validation/focus, three-item selection limits, photo preview, review contents, edit-favorites, and back navigation. A synthetic test image/profile was used; requests were intercepted before the Apps Script endpoint.
- Applications login screen was measured at 1440, 1024, 768, 390, and 320 CSS px with no horizontal overflow. Desktop/mobile wizard screenshots were inspected; mobile review content extends below the viewport and remains document-scrollable.
- Synthetic submit loading, failure/retry, and success states were observed with requests intercepted locally before the Apps Script endpoint. A later repeat attempt was interrupted by the CDP test harness; no live submission or real data was involved.
- Homepage reduced-motion preference was verified in headless Chrome; the Applications reduced-motion CSS rule disables animation/transition and its JavaScript scroll behavior uses the preference.
- `node --check applications/script.js` and `git diff --check` passed for the current changes.
- No Lighthouse score or dedicated axe/accessibility audit was run; neither tool is installed. Browser screenshot inspection cannot replace a human assistive-technology review.
- `MIYO_FINAL_REPORT.md` created with completed features, actual checks, review blockers, and local run instructions.

## Manager follow-up — 2026-10-28

### Delegated work and review
- **miyo-designer — completed:** reviewed `neededaccess/miyo/` and prioritized natural content-led sections, visible Questions access, and mobile navigation/readability while preserving the editorial palette/type system.
- **miyo-developer — completed:** added Questions links in the editorial header and Experience section; removed forced viewport-height section minimums; retained all navigation links on mobile. Changed only `neededaccess/miyo/index.html` and `neededaccess/miyo/miyo.css`.
- **miyo-motion — completed after manager recovery:** added an accessible pressed-state button for the Experience word interaction, using native keyboard/touch activation and reduced-motion styling. The agent reported a Unicode encoding problem; the manager restored the HTML from its clean tracked baseline and reapplied the approved markup. No unrelated text corruption remains.
- **miyo-qa — completed:** flagged a possible wrapped-nav/header overlap at narrow widths. Manager changed the mobile nav grid row to auto sizing and adjusted hero index/content spacing. QA's static re-review found no remaining source-level overlap. Manager independently verified rendered layout.

### Verification
- Headless Chrome at 1440×900, 1024×768, 768×900, 390×844, and 320×700: no horizontal overflow; all six nav links rendered; page document scrolls naturally; no mobile header/index overlap; non-hero section min-heights are not viewport-forced.
- Questions header and Experience links resolve to the local `/applications/` path. No application form, Google Sheets configuration, or Apps Script source was changed.
- Experience button is a native button; keyboard Space toggles `aria-pressed`. `prefers-reduced-motion` is honored and disables the word transition.
- `node --check neededaccess/miyo/miyo.js`, `git diff --check`, `node --test tests/Miyo_consolelogerror.test.js` (7 passed), and `node tests/Miyo_browser_simulation.js` (11 synthetic checks passed; Apps Script intercepted in memory).
- No push, publish, deployment, live Google Sheets request, or real student data used.

### Remaining
- Human screen-reader/accessibility review and an automated dedicated accessibility audit are still outstanding.
- Existing school privacy and production Sheets/Drive access confirmations remain blocked/review-required; this design pass did not alter them.
