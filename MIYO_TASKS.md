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

## Remaining / review required
- [ ] School owners review and approve the privacy draft before public use.
- [ ] Confirm public contact details, privacy contact, retention/deletion process, photo permissions, and AI/external image processing.
- [ ] Confirm deployed Apps Script behavior, Google account access/sharing, and any guardian-consent requirements.
- [ ] Run a Lighthouse/performance score and a dedicated automated accessibility audit (not available in the current installed toolchain).
- [ ] Human review of full content and in-browser screen-reader/keyboard experience.
- [ ] No publish, deploy, remote repository write, or real student-data access is authorized.
