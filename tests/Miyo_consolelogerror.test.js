const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");

function createAppsScriptHarness() {
  const cacheData = new Map();
  const errorRows = [];
  const telegramRequests = [];
  const logs = [];
  let telegramStatus = 200;
  let uuidCounter = 0;

  const errorsSheet = {
    getLastRow: () => errorRows.length,
    appendRow: (row) => errorRows.push(row.slice()),
    setFrozenRows: () => {}
  };
  const spreadsheet = {
    getSheetByName: (name) => name === "Errors" && errorRows.length ? errorsSheet : null,
    insertSheet: (name) => {
      assert.equal(name, "Errors");
      return errorsSheet;
    }
  };

  const context = {
    console: { error: (...args) => logs.push(args.join(" ")) },
    LockService: {
      getScriptLock: () => ({
        waitLock: () => {},
        hasLock: () => true,
        releaseLock: () => {}
      })
    },
    CacheService: {
      getScriptCache: () => ({
        get: (key) => cacheData.has(key) ? cacheData.get(key).value : null,
        put: (key, value) => cacheData.set(key, { value })
      })
    },
    SpreadsheetApp: { openById: () => spreadsheet },
    PropertiesService: {
      getScriptProperties: () => ({
        getProperty: (key) => ({ TELEGRAM_TOKEN: "mock-token", TELEGRAM_CHAT_ID: "123456" })[key] || null
      })
    },
    UrlFetchApp: {
      fetch: (url, options) => {
        telegramRequests.push({ url, options });
        return { getResponseCode: () => telegramStatus };
      }
    },
    Utilities: {
      DigestAlgorithm: { SHA_256: "sha256" },
      computeDigest: (_algorithm, input) => crypto.createHash("sha256").update(String(input)).digest(),
      base64EncodeWebSafe: (input) => Buffer.from(input).toString("base64url"),
      getUuid: () => `test-uuid-${++uuidCounter}`
    },
    ContentService: {
      MimeType: { JSON: "application/json" },
      createTextOutput: (content) => ({ getContent: () => content, setMimeType: () => ({ getContent: () => content }) })
    }
  };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(root, "Code.gs"), "utf8"), context, { filename: "Code.gs" });

  return {
    report: (error) => JSON.parse(context.reportSystemError(error).getContent()),
    errorRows,
    telegramRequests,
    logs,
    setTelegramStatus: (status) => { telegramStatus = status; }
  };
}

test("privacy gate, live language selector, and form steps are present", () => {
  const html = fs.readFileSync(path.join(root, "applications/index.html"), "utf8");
  for (const id of ["loginForm", "accessCode", "loginMsg", "privacyScreen", "privacyFrame", "privacyAgree", "startApplication", "languageSelect", "nextBtn", "backBtn", "photoInput", "consent", "sendMsg"]) {
    assert.match(html, new RegExp(`id=[\"']${id}[\"']`), `missing #${id}`);
  }
  for (let step = 0; step <= 5; step++) assert.match(html, new RegExp(`data-step=[\"']${step}[\"']`));
  assert.match(html, /privacy\.html/);
  assert.match(html, /value="vi">Tiếng Việt/);
  const privacy = fs.readFileSync(path.join(root, "applications/privacy.html"), "utf8");
  assert.match(privacy, /id="noticeEnglish"/);
  assert.match(privacy, /id="noticeVietnamese"/);
  assert.match(privacy, /addEventListener\("message"/);
});

test("frontend scripts parse and wire user/system error paths", () => {
  for (const file of ["applications/script.js", "neededaccess/gate.js", "neededaccess/miyo/miyo.js"]) {
    assert.doesNotThrow(() => new vm.Script(fs.readFileSync(path.join(root, file), "utf8"), { filename: file }));
  }
  const appScript = fs.readFileSync(path.join(root, "applications/script.js"), "utf8");
  const gateScript = fs.readFileSync(path.join(root, "neededaccess/gate.js"), "utf8");
  assert.match(appScript, /action:\s*"reportError"/);
  assert.match(appScript, /USER_INPUT/);
  assert.match(appScript, /addEventListener\("offline"/);
  assert.match(appScript, /addEventListener\("online"/);
  assert.match(gateScript, /action:\s*"reportError"/);
  assert.match(gateScript, /The admin code is incorrect/);
});

test("first technical error is logged and sends only its error code to Telegram", () => {
  const harness = createAppsScriptHarness();
  const result = harness.report({
    code: "ERR-20261028-A1B2", page: "/applications/", action: "form-submit",
    message: "mock technical failure", stack: "mock stack", userAgent: "test browser"
  });
  assert.equal(result.ok, true);
  assert.equal(harness.errorRows.length, 2); // header + one report
  assert.equal(harness.telegramRequests.length, 1);
  const text = harness.telegramRequests[0].options.payload.text;
  assert.match(text, /ERR-20261028-A1B2/);
  assert.doesNotMatch(text, /mock technical failure|mock stack/);
});

test("identical reports are deduplicated and reuse the first code", () => {
  const harness = createAppsScriptHarness();
  const error = { code: "ERR-20261028-A1B2", page: "/applications/", action: "submit", message: "same failure", stack: "same stack" };
  const first = harness.report(error);
  const duplicate = harness.report({ ...error, code: "ERR-DIFFERENT" });
  assert.equal(first.ok, true);
  assert.equal(duplicate.ok, true);
  assert.equal(duplicate.duplicate, true);
  assert.equal(duplicate.code, first.code);
  assert.equal(harness.errorRows.length, 2);
  assert.equal(harness.telegramRequests.length, 1);
});

test("Telegram failure can be retried without writing a duplicate Sheet row", () => {
  const harness = createAppsScriptHarness();
  const error = { code: "ERR-20261028-RETRY", page: "/applications/", action: "submit", message: "temporary failure", stack: "stack" };
  harness.setTelegramStatus(503);
  const failed = harness.report(error);
  harness.setTelegramStatus(200);
  const retried = harness.report(error);
  assert.equal(failed.ok, false);
  assert.equal(retried.ok, true);
  assert.equal(harness.errorRows.length, 2);
  assert.equal(harness.telegramRequests.length, 2);
});

test("invalid metadata is normalized and oversized diagnostics are bounded", () => {
  const harness = createAppsScriptHarness();
  const result = harness.report({
    code: "bad\ncode", page: "https://example.test/?private=1", action: "bad action",
    message: "x".repeat(900), stack: "s".repeat(2000), userAgent: "u".repeat(500)
  });
  assert.equal(result.ok, true);
  assert.match(result.code, /^ERR-[A-Z0-9-]+$/);
  const row = harness.errorRows[1];
  assert.equal(row[2], "unknown");
  assert.equal(row[3], "unknown");
  assert.equal(row[4].length, 500);
  assert.equal(row[5].length, 1500);
  assert.equal(row[7].length, 300);
});

test("more than 20 new unique errors are rejected in the rate-limit window", () => {
  const harness = createAppsScriptHarness();
  for (let index = 0; index < 20; index++) {
    assert.equal(harness.report({ page: "/applications/", action: "test", message: `unique-${index}` }).ok, true);
  }
  const rejected = harness.report({ page: "/applications/", action: "test", message: "unique-over-limit" });
  assert.equal(rejected.ok, false);
  assert.equal(rejected.rateLimited, true);
  assert.equal(harness.errorRows.length, 21); // header + 20 accepted reports
  assert.equal(harness.telegramRequests.length, 20);
});
