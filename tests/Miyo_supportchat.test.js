const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("support chat backend parses and enforces the planned lifecycle configuration", () => {
  const code = read("Code.gs");
  assert.doesNotThrow(() => new vm.Script(code, { filename: "Code.gs" }));
  assert.match(code, /supportChatStart/);
  assert.match(code, /supportChatSend/);
  assert.match(code, /supportChatPoll/);
  assert.match(code, /supportChatCancel/);
  assert.match(code, /SUPPORT_INACTIVE_DAYS = 7/);
  assert.match(code, /thành viên thật của đội ngũ MIYO/);
  assert.match(code, /0335695572/);
  assert.match(code, /"assistant"/);
  assert.match(code, /"Sequence"/);
  assert.match(code, /nextSupportMessageSequence_\(\)/);
  assert.match(code, /sequence <= after/);
  assert.doesNotMatch(code, /rowNumber <= after/);
  assert.match(code, /inactive-7-days/);
  assert.match(code, /\.json/);
  assert.match(code, /folder\.getSharingAccess\(\) !== DriveApp\.Access\.PRIVATE/);
  assert.match(code, /everyMinutes\(1\)/);
  assert.match(code, /everyHours\(1\)/);
});

test("support chat messages are escaped for Telegram and rendered as text in the browser", () => {
  const context = {};
  vm.createContext(context);
  vm.runInContext(read("Code.gs"), context);
  assert.equal(context.escapeTelegramHtml_(`<hello & "world">`), "&lt;hello &amp; \"world\"&gt;");
  const widget = read("shared/miyo-chat.js");
  assert.match(widget, /body\.textContent = message\.text/);
  assert.match(widget, /if \(session\) \{[\s\S]*?setHistoryLoaded\(false\);[\s\S]*?poll\(\);/);
  assert.match(widget, /if \(!historyLoaded\) setHistoryLoaded\(true\)/);
  assert.match(widget, /sendQueue\.then\(\(\) => request\("supportChatSend"/);
  assert.match(widget, /setOperationLoading\(true, "creating"\)/);
  assert.match(widget, /setOperationLoading\(true, "ending"\)/);
  assert.doesNotMatch(widget, /body\.innerHTML\s*=/);
  assert.doesNotThrow(() => new vm.Script(widget, { filename: "shared/miyo-chat.js" }));
});

test("the support widget is included on the public landing, access, application, and MIYO pages", () => {
  for (const [file, url] of [
    ["index.html", "shared/miyo-chat.js"],
    ["neededaccess/index.html", "../shared/miyo-chat.js"],
    ["applications/index.html", "../shared/miyo-chat.js"],
    ["neededaccess/miyo/index.html", "../../shared/miyo-chat.js"]
  ]) {
    assert.ok(read(file).includes(url), `missing widget on ${file}`);
  }
});
