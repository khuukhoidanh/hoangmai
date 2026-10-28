# MIYO — Console / Error Test Report

**Date:** 2026-10-28
**Scope:** Local source, mocked Apps Script endpoint, and headless Chrome user-flow simulation
**Production data/Telegram:** Not contacted. All Apps Script, Sheet, Cache, and Telegram responses were mocked in memory.

## Test code and command

- Test file: `tests/Miyo_consolelogerror.test.js`
- Run with: `node --test tests/Miyo_consolelogerror.test.js`
- Browser simulation: `tests/Miyo_browser_simulation.js`
- Run with: `node tests/Miyo_browser_simulation.js`

## Result

**Unit/smoke: 7 passed, 0 failed. Browser simulation: 11 passed, 0 failed.**

| Test | Result |
|---|---|
| Student application page includes a separate privacy notice, acknowledgment gate, and English/Vietnamese selector | PASS |
| Frontend JavaScript parses and has system-error, offline/online, and user-input paths | PASS |
| First system error writes one log row and Telegram receives only the error code | PASS |
| Repeated identical system error is deduplicated | PASS |
| Telegram failure can be retried without adding another Sheet row | PASS |
| Invalid metadata is normalized; long diagnostics are bounded | PASS |
| 21st unique error inside the rate-limit window is rejected | PASS |

### Headless browser user-flow simulation

| Simulated action | Result |
|---|---|
| Wrong admin code, then valid mock admin code | PASS |
| Invalid student code does not generate a system-error report | PASS |
| Successful mock student login | PASS |
| Privacy checkbox keeps Start disabled until acknowledged; Vietnamese can be selected before starting | PASS |
| Empty required fields show local validation and do not report an error | PASS |
| Oversized photo is rejected before submission | PASS |
| Synthetic valid application reaches the success screen | PASS |
| Previously saved response opens in review/edit flow | PASS |
| Simulated browser error appears in the error banner and calls the mocked endpoint | PASS |
| Offline error waits in the browser queue and sends after reconnection | PASS |
| No uncaught JavaScript exceptions or console errors in tested flows | PASS |

## Scope limitations

The browser simulation uses the installed headless Chrome and a temporary local HTTP server. Its Apps Script requests are intercepted and answered by an in-memory mock. It does **not** use real student/admin credentials, write to Google Sheets/Drive, or contact Telegram. Synthetic names and responses are test-only. Responsive appearance still needs manual checks on an actual phone and desktop browser.

## Existing issues noticed during source review

1. The `/neededaccess/miyo/` page uses `sessionStorage` as its access gate. Since the site is static on GitHub Pages, this is not strong protection; a visitor can set the storage value in their browser.
2. `verifyAdminCode()` in `Code.gs` returns the same `{ok:false}` for an incorrect code and for backend exceptions, so some admin backend failures look like a wrong password and do not trigger system-error reporting.
3. Configuration checks in `validateSubmission()` are currently wrapped as `USER_INPUT`; a missing Spreadsheet/Drive ID can therefore be misclassified as a user error.
4. The error endpoint is public. Its new deduplication and 20-unique-errors-per-10-minute cap reduce accidental floods, but do not authenticate callers or stop a determined attacker from exhausting the shared limit.
5. `Code.gs` in the repository contains placeholder Spreadsheet/Drive IDs. Do not replace the live Apps Script file wholesale with it; preserve the real IDs when deploying.
