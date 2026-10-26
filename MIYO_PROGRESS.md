# MIYO development progress

## Current milestone
Replaced the single-screen Coming Soon concept with a local, multi-section editorial website. This is a static HTML/CSS/vanilla-JavaScript implementation; no dependency install or external animation library is required.

## Implemented
- Cinematic text-led hero: oversized Hanoi × Kaohsiung, original SVG connection thread, coordinates, subtle parallax, and city-specific captioning; the globe/world map is removed.
- Editorial sections: About MIYO, Our Story, Experience interaction, FAQ, review-marked Privacy Notes, Contact, and a clear link to the existing Questions application.
- Motion system: CSS type/route entrance, restrained route pulses, intersection-observer reveals, pointer parallax, hover states, and `prefers-reduced-motion` fallback.
- Accessibility/responsive: semantic landmarks, skip link, visible focus, native `<details>` FAQ, responsive layouts, and no required interaction dependent on pointer hover.
- Questionnaire/backend files were not edited. No Timeline section or gift reveal was added.
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
- No Lighthouse score or dedicated axe/accessibility audit was run; neither tool is installed. Browser screenshot inspection cannot replace a human assistive-technology review.
- `MIYO_FINAL_REPORT.md` created with completed features, actual checks, review blockers, and local run instructions.
