# Repository notes

- This is a static HTML/CSS/vanilla-JS site; there is no package manifest, build step, or dependency install. Main entrypoints: `/` (`index.html`), `/applications/`, and `/neededaccess/`.
- Shared Apps Script URL lives in `shared/miyo-config.js`; `Code.gs` is its backend source. Browser tests mock/intercept requests—never use the production endpoint with real student data during tests.
- `data.js` is git-ignored and contains personal student access codes. Do not inspect, expose, or commit it.
- Focused checks: `node --test tests/Miyo_consolelogerror.test.js`; syntax-check a JS file with `node --check <file>`; run the mocked browser simulation with `node tests/Miyo_browser_simulation.js` (requires installed Chrome or Edge).
- Use `git diff --check` to check whitespace. There are no configured package scripts, lint, or build commands.
