# MIYO development checklist

## Complete
- [x] Inspect existing static-site architecture and questionnaire integration.
- [x] Create local Git checkpoint before the redesign (`39c98b7`, local only).
- [x] Replace the globe hero with original Hanoi × Kaohsiung kinetic typography and an animated SVG connection.
- [x] Build About, Our Story, Experience, FAQ, Privacy Notes, Contact, and participant-questionnaire entry points.
- [x] Keep `applications/`, `Code.gs`, and `data.js` unchanged.
- [x] Add responsive styling, accessible skip/focus patterns, native FAQ disclosure, and reduced-motion handling.
- [x] Draft privacy notes with explicit unverified claims marked for review.
- [x] Add progress, pending-review, and final-report records.

## Validation
- [x] Check HTML structure, duplicate IDs, and internal links.
- [x] Check CSS/JavaScript syntax and `git diff --check`.
- [x] Serve the site locally and request the homepage and questionnaire page.
- [x] Inspect rendered desktop, tablet, and mobile hero layouts with headless Chrome/CDP.
- [x] Check horizontal overflow at 1440, 1024, 768, 390, and 320 CSS pixels.
- [x] Verify the public page contains no globe/map, Timeline, or personalized-gift reveal.
- [x] Exercise FAQ disclosure behavior, reduced-motion styling, questionnaire initial screen, and browser console/network errors.
- [x] Change Applications to natural document scrolling, retaining only the fixed bottom wizard action bar.
- [x] Refine Applications controls, focus/validation states, selection counts, photo handling, and review edit shortcuts.
- [x] Test synthetic login, required-field validation, selection caps, photo preview/review, and edit/back navigation with Apps Script requests intercepted locally.
- [x] Check Applications responsive widths at 1440, 1024, 768, 390, and 320 CSS pixels; no horizontal overflow on the login screen.
- [x] Inspect the Applications wizard on desktop and mobile, including naturally scrollable review content and no horizontal overflow.
- [x] Verify homepage content sections remain natural-height and reduced-motion preference is honored in headless Chrome.
- [x] Exercise synthetic submit loading, failure/retry, and success states with Apps Script requests intercepted locally; no live request or real data.
- [x] Remove forced viewport-height minimums from the editorial site sections and hero in `neededaccess/miyo/miyo.css`; keep document scrolling natural and decorative clipping local.
- [x] Run `node --check applications/script.js` and `git diff --check` after this pass.

## Manager follow-up — 2026-10-28
- [x] Designer reviewed the actual editorial page and prioritized natural section heights, clear Questions access, and mobile navigation/readability.
- [x] Developer updated only `neededaccess/miyo/index.html` and `neededaccess/miyo/miyo.css`; the Questions page, Sheets config, and Apps Script backend were not edited.
- [x] Motion interaction changed the Experience word field to an accessible button with keyboard/touch activation and reduced-motion styling. A transient encoding issue was caught, the HTML restored from its clean tracked baseline, and approved markup reapplied as UTF-8.
- [x] QA found a narrow-screen header/index overlap; the manager changed the mobile header nav row to auto height and adjusted hero index/content spacing.
- [x] Rechecked layout in headless Chrome at 1440, 1024, 768, 390, and 320 CSS px: no horizontal overflow, all six nav links visible, document scroll available, and no header/index collision.
- [x] Verified Questions CTAs resolve to the existing local application route, Experience button responds to Space and updates `aria-pressed`, and reduced-motion disables its transition.
- [x] `node --check neededaccess/miyo/miyo.js`, `git diff --check`, existing Node tests (7/7), and the existing mocked application browser simulation (11 checks) passed.

## Remaining / review required
- [ ] School owners review and approve the privacy draft before public use.
- [ ] Confirm public contact details, privacy contact, retention/deletion process, photo permissions, and AI/external image processing.
- [ ] Confirm deployed Apps Script behavior, Google account access/sharing, and any guardian-consent requirements.
- [ ] Run a Lighthouse/performance score and a dedicated automated accessibility audit (not available in the current installed toolchain).
- [ ] Human review of full content and in-browser screen-reader/keyboard experience.
- [ ] Recheck the complete Applications flow at all target widths and perform an assistive-technology/keyboard review.
- [ ] Human screen-reader review of the new Questions links and Experience toggle; automated browser matrix covers layout/keyboard smoke only.
- [ ] No publish, deploy, remote repository write, or real student-data access is authorized.
