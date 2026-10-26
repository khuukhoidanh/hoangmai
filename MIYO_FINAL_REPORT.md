# MIYO local development report

## Delivered
- Replaced the Coming Soon/world-globe hero with an editorial, text-led Hanoi × Kaohsiung composition and animated SVG connection.
- Built a complete one-page experience: Home, About MIYO, Our Story, Experience, FAQ, review-marked Privacy Notes, Contact, and a link to the existing Questions application.
- Added responsive desktop/tablet/mobile layouts, subtle paper grain and grid, type/line entrances, pointer parallax, scroll reveals, hover details, and an accordion FAQ.
- Added reduced-motion support and native/accessibility basics: landmarks, skip link, focus styling, meaningful headings, SVG title/description, and native disclosure controls.
- Did not add a Timeline, disclose the personalized gift idea, or change `applications/`, `Code.gs`, or `data.js`.
- Added `MIYO_TASKS.md`, `MIYO_PROGRESS.md`, and `MIYO_PENDING_REVIEW.md` for ongoing project status and approvals.

## Art direction
Warm off-white, charcoal, muted blue, and restrained rust; oversized contrasting city typography; an animated line rather than a generic map; asymmetric editorial copy and generous negative space. Direct browsing of Awwwards, Codrops, Godly, and the GSAP Showcase informed general principles only; the design is original and uses no GSAP dependency.

## Verification performed
- `node --check miyo.js` passed; `git diff --check` passed.
- HTML structure checks found no duplicate IDs, broken in-page anchors, or missing core sections.
- Local HTTP smoke checks returned HTTP 200 for `/`, `/applications/`, `miyo.css`, and `miyo.js`.
- Headless Chrome/CDP visual inspection at desktop, tablet, and mobile sizes. Document/body widths did not exceed viewport at 1440, 1024, 768, 390, and 320 CSS px.
- Scrolled through the page and confirmed all 18 reveal targets became visible. Exercised FAQ single-open behavior.
- Checked reduced-motion CSS; the animated connection duration is reduced to `0.01ms` under the preference.
- Final browser pass reported no console exceptions or failed network resources. Questionnaire initial screen and local script loaded; no access-code login, form submission, real student data, or production endpoint was used.
- Dedicated Lighthouse and automated accessibility scores were not run; these tools are not installed. No scores are claimed.

## Review items / limitations
- Privacy text is a draft and must be reviewed/approved by both schools before public use. Confirm data purpose, responsible parties, deployed Apps Script and storage access, retention/deletion, consent withdrawal, guardian requirements, photo-editing scope, and whether any AI/external image processing occurs.
- Confirm public contact details; none were present in the reviewed project files, so no email or phone number was invented. The page currently points participants to their coordinating teacher.
- Google Fonts is requested by the public page; review this external asset provider's current data handling before release.
- The questionnaire's deployed login/submission behavior was deliberately not tested, to avoid credentials or real records. Existing application/backend files remain unchanged.
- A human screen-reader/keyboard review and Lighthouse/axe audit remain recommended.

## Local run
The static site is available at **http://127.0.0.1:8000/** while the local Python server remains running. To start it from the project directory later, run:

```powershell
python -m http.server 8000 --bind 127.0.0.1
```

The Questions page is at **http://127.0.0.1:8000/applications/**. All work is local; there has been no deployment or push. A local checkpoint exists at `39c98b7`.
