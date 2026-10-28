// Local end-to-end simulation using installed Chrome + Chrome DevTools Protocol.
// All Apps Script requests are intercepted and answered in memory; no production API is called.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");
const { spawn } = require("node:child_process");

const ROOT = path.resolve(__dirname, "..");
const CHROME = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe"
].find((candidate) => fs.existsSync(candidate));
if (!CHROME) throw new Error("Chrome or Edge was not found. Install a Chromium browser to run this simulation.");

const mimeTypes = { ".css": "text/css", ".gif": "image/gif", ".html": "text/html", ".ico": "image/x-icon", ".jpg": "image/jpeg", ".js": "text/javascript", ".png": "image/png", ".svg": "image/svg+xml" };
const calls = { invalidLogins: 0, validLogins: 0, adminFailures: 0, adminSuccesses: 0, submissions: 0, supportStarts: 0, supportSends: 0, supportPolls: 0, supportCancels: 0, errorReports: [] };
const consoleErrors = [];

function startLocalServer() {
  const server = http.createServer((request, response) => {
    let pathname;
    try { pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname); }
    catch { response.writeHead(400).end("Bad request"); return; }
    const relative = path.normalize(pathname.replace(/^\/+/, "")).replace(/^\.\.(?:[\\/]|$)/, "");
    let filePath = path.join(ROOT, relative || "index.html");
    if (!filePath.startsWith(ROOT)) { response.writeHead(403).end("Forbidden"); return; }
    try {
      if (fs.statSync(filePath).isDirectory()) filePath = path.join(filePath, "index.html");
      response.writeHead(200, { "Content-Type": mimeTypes[path.extname(filePath)] || "application/octet-stream" });
      fs.createReadStream(filePath).pipe(response);
    } catch { response.writeHead(404).end("Not found"); }
  });
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve({ server, port: server.address().port })));
}

function connectCdp(url) {
  const ws = new WebSocket(url);
  const pending = new Map();
  const listeners = new Map();
  let nextId = 0;
  ws.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const waiter = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) waiter.reject(new Error(message.error.message));
      else waiter.resolve(message.result || {});
      return;
    }
    (listeners.get(message.method) || []).forEach((listener) => listener(message.params || {}));
  });
  return new Promise((resolve, reject) => {
    ws.addEventListener("open", () => resolve({
      send(method, params = {}) {
        const id = ++nextId;
        ws.send(JSON.stringify({ id, method, params }));
        return new Promise((res, rej) => pending.set(id, { resolve: res, reject: rej }));
      },
      on(method, listener) {
        if (!listeners.has(method)) listeners.set(method, []);
        listeners.get(method).push(listener);
      },
      close: () => ws.close()
    }));
    ws.addEventListener("error", reject, { once: true });
  });
}

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function waitFor(cdp, expression, label, timeout = 15000) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    const result = await cdp.send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    if (result.result && result.result.value) return result.result.value;
    await delay(100);
  }
  throw new Error("Timed out waiting for " + label);
}

async function evaluate(cdp, expression) {
  const result = await cdp.send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || "Browser evaluation failed");
  return result.result && result.result.value;
}

async function click(cdp, selector) {
  const didClick = await evaluate(cdp, `(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (!el) return false; el.click(); return true; })()`);
  assert.equal(didClick, true, "could not click " + selector);
}

async function fill(cdp, selector, value) {
  const filled = await evaluate(cdp, `(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (!el) return false; el.value = ${JSON.stringify(value)}; el.dispatchEvent(new Event('input', { bubbles: true })); return true; })()`);
  assert.equal(filled, true, "could not fill " + selector);
}

async function main() {
  const { server, port: sitePort } = await startLocalServer();
  const tempRoot = path.join(process.env.LOCALAPPDATA || os.tmpdir(), "Temp", "opencode");
  fs.mkdirSync(tempRoot, { recursive: true });
  const profile = fs.mkdtempSync(path.join(tempRoot, "miyo-browser-sim-"));
  const pngPath = path.join(profile, "sample.png");
  fs.writeFileSync(pngPath, Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/pS8AAAAASUVORK5CYII=", "base64"));

  const portProbe = http.createServer();
  await new Promise((resolve) => portProbe.listen(0, "127.0.0.1", resolve));
  const debugPort = portProbe.address().port;
  await new Promise((resolve) => portProbe.close(resolve));

  const chrome = spawn(CHROME, [
    "--headless=new", "--disable-gpu", "--no-sandbox", "--disable-dev-shm-usage",
    "--remote-allow-origins=*", `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${profile}`, "about:blank"
  ], { stdio: "ignore", windowsHide: true });

  let browserCdp;
  let pageCdp;
  const resultLines = [];
  try {
    let browserInfo;
    const bootStart = Date.now();
    while (Date.now() - bootStart < 15000) {
      try {
        const response = await fetch(`http://127.0.0.1:${debugPort}/json/version`);
        if (response.ok) { browserInfo = await response.json(); break; }
      } catch { /* Browser is starting. */ }
      await delay(150);
    }
    if (!browserInfo) throw new Error("Chromium DevTools did not start.");

    browserCdp = await connectCdp(browserInfo.webSocketDebuggerUrl);
    const { targetId } = await browserCdp.send("Target.createTarget", { url: "about:blank" });
    let target;
    for (let attempt = 0; attempt < 40 && !target; attempt++) {
      const targets = await (await fetch(`http://127.0.0.1:${debugPort}/json/list`)).json();
      target = targets.find((item) => item.id === targetId);
      if (!target) await delay(100);
    }
    assert.ok(target, "could not create browser page");
    pageCdp = await connectCdp(target.webSocketDebuggerUrl);
    pageCdp.on("Runtime.exceptionThrown", (event) => consoleErrors.push(event.exceptionDetails && event.exceptionDetails.text || "uncaught browser exception"));
    pageCdp.on("Log.entryAdded", (event) => {
      if (event.entry && event.entry.level === "error") consoleErrors.push(event.entry.text || "browser console error");
    });
    pageCdp.on("Fetch.requestPaused", async (event) => {
      try {
        const payload = JSON.parse(event.request.postData || "{}");
        let response;
        if (payload.action === "login") {
          if (payload.code === "mock-valid" || payload.code === "mock-existing") {
            calls.validLogins++;
            const responseData = payload.code === "mock-existing" ? {
              fullName: "Existing Test", nick: "Test", role: "Student", gender: "Female", className: "10A1", zodiac: "Aries",
              hobbies: ["Music"], hobbyOther: "", color: "#e63946", foods: ["Hot Pot"], foodOther: "", photoUrl: "", consent: true
            } : null;
            response = { ok: true, student: { code: payload.code, response: responseData } };
          } else {
            calls.invalidLogins++;
            response = { ok: false };
          }
        } else if (payload.action === "adminLogin") {
          const ok = payload.code === "mock-admin";
          if (ok) calls.adminSuccesses++;
          else calls.adminFailures++;
          response = { ok };
        } else if (payload.action === "reportError") {
          calls.errorReports.push(payload.error || {});
          response = { ok: true, code: payload.error && payload.error.code, notified: true };
        } else if (payload.action === "supportChatStart") {
          calls.supportStarts++;
          response = { ok: true, chatId: "mock-chat-" + calls.supportStarts, accessToken: "mock-private-token-" + calls.supportStarts, messages: [] };
        } else if (payload.action === "supportChatSend") {
          calls.supportSends++;
          response = { ok: true, messageId: 10 + calls.supportSends };
        } else if (payload.action === "supportChatPoll") {
          calls.supportPolls++;
          response = { ok: true, cursor: 2, messages: Number(payload.after) < 2 ? [{ id: 2, sender: "support", text: "Mock support reply" }] : [] };
        } else if (payload.action === "supportChatCancel") {
          calls.supportCancels++;
          response = { ok: true, closed: true };
        } else {
          calls.submissions++;
          response = { ok: true, updated: false };
        }
        await pageCdp.send("Fetch.fulfillRequest", {
          requestId: event.requestId,
          responseCode: 200,
          responseHeaders: [
            { name: "Content-Type", value: "application/json; charset=utf-8" },
            { name: "Access-Control-Allow-Origin", value: "*" },
            { name: "Access-Control-Allow-Methods", value: "POST, OPTIONS" },
            { name: "Access-Control-Allow-Headers", value: "Content-Type" }
          ],
          body: Buffer.from(JSON.stringify(response)).toString("base64")
        });
      } catch (error) {
        consoleErrors.push("Mock endpoint failure: " + error.message);
        await pageCdp.send("Fetch.failRequest", { requestId: event.requestId, errorReason: "Failed" });
      }
    });
    await pageCdp.send("Page.enable");
    await pageCdp.send("Runtime.enable");
    await pageCdp.send("DOM.enable");
    await pageCdp.send("Fetch.enable", { patterns: [
      { urlPattern: "https://script.google.com/macros/s/*", requestStage: "Request" },
      { urlPattern: "https://miyo.khuukhoidanh.workers.dev/*", requestStage: "Request" }
    ] });

    const local = `http://127.0.0.1:${sitePort}`;

    // Admin access: wrong code stays on page; mock correct code opens the gated MIYO page.
    await pageCdp.send("Page.navigate", { url: local + "/neededaccess/" });
    await waitFor(pageCdp, `document.readyState === 'complete' && !!document.querySelector('#adminForm')`, "admin page scripts");
    assert.equal(await evaluate(pageCdp, `!!document.querySelector('[data-miyo-support-chat]')`), true);
    await click(pageCdp, ".miyo-chat-launcher");
    await click(pageCdp, "[data-chat-start]");
    await waitFor(pageCdp, `!document.querySelector('[data-chat-conversation]').hidden`, "support conversation started");
    await waitFor(pageCdp, `!document.querySelector('#miyo-chat-input').disabled`, "initial chat history finished loading");
    await fill(pageCdp, "#miyo-chat-input", "Mock visitor question");
    await evaluate(pageCdp, `document.querySelector('#miyo-chat-input').dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))`);
    await waitFor(pageCdp, `document.querySelector('.miyo-chat-messages').textContent.includes('Mock visitor question') && document.querySelector('#miyo-chat-input').value === ''`, "optimistic message displayed immediately by Enter");
    await waitFor(pageCdp, `document.querySelector('.miyo-chat-messages').textContent.includes('Mock support reply')`, "mock Telegram response displayed");
    await waitFor(pageCdp, `!document.querySelector('[data-chat-send]').disabled`, "support message send finished");
    await fill(pageCdp, "#miyo-chat-input", "Mouse send test");
    await click(pageCdp, "[data-chat-send]");
    await waitFor(pageCdp, `document.querySelector('.miyo-chat-messages').textContent.includes('Mouse send test') && document.querySelector('#miyo-chat-input').value === ''`, "optimistic message displayed immediately by clicking send");
    await waitFor(pageCdp, `!document.querySelector('[data-chat-send]').disabled`, "mouse send finished");
    await click(pageCdp, "[data-chat-cancel]");
    assert.equal(await evaluate(pageCdp, `!document.querySelector('[data-chat-modal]').hidden`), true, "end-chat action opens the custom modal");
    assert.equal(calls.supportCancels, 0, "chat remains open until modal confirmation");
    await click(pageCdp, "[data-chat-confirm]");
    await waitFor(pageCdp, `!document.querySelector('[data-chat-ended]').hidden`, "chat cancelled");
    assert.equal(calls.supportStarts, 1);
    assert.equal(calls.supportSends, 2);
    assert.equal(calls.supportCancels, 1);
    await click(pageCdp, "[data-chat-new]");
    await waitFor(pageCdp, `!document.querySelector('[data-chat-conversation]').hidden`, "new chat after cancellation");
    assert.equal(calls.supportStarts, 2, "a cancelled conversation must be replaced with a new chat");
    resultLines.push("PASS: support chat starts a private conversation, sends/receives mocked messages, closes, and requires a new conversation");

    await click(pageCdp, "#adminToggle");
    await waitFor(pageCdp, `!document.querySelector('#adminForm').hidden`, "admin form open");
    await fill(pageCdp, "#adminCode", "mock-wrong");
    await click(pageCdp, "#adminSubmit");
    await waitFor(pageCdp, `!document.querySelector('#adminMessage').hidden`, "wrong admin code message");
    assert.match(await evaluate(pageCdp, `document.querySelector('#adminMessage').textContent`), /incorrect/i);
    resultLines.push("PASS: wrong admin code shows a user-facing message");

    await fill(pageCdp, "#adminCode", "mock-admin");
    await click(pageCdp, "#adminSubmit");
    await waitFor(pageCdp, `location.pathname.endsWith('/neededaccess/miyo/')`, "successful admin navigation");
    resultLines.push("PASS: valid mock admin code opens the gated MIYO page");

    // Student application: invalid code, successful login, local required-field validation.
    await pageCdp.send("Page.navigate", { url: local + "/applications/" });
    await waitFor(pageCdp, `!!document.querySelector('#loginForm') && !!window.jQuery`, "application form and jQuery");
    await fill(pageCdp, "#accessCode", "mock-invalid");
    await click(pageCdp, "#loginBtn");
    await waitFor(pageCdp, `!document.querySelector('#loginMsg').hidden`, "invalid student code message");
    assert.match(await evaluate(pageCdp, `document.querySelector('#loginMsg').textContent`), /invalid code/i);
    assert.equal(calls.errorReports.length, 0, "invalid student code must not be reported as a system error");
    resultLines.push("PASS: invalid student code is handled as a user error, without reporting to the error endpoint");

    await fill(pageCdp, "#accessCode", "mock-valid");
    await click(pageCdp, "#loginBtn");
    await waitFor(pageCdp, `document.querySelector('#loginScreen').hidden && !document.querySelector('#privacyScreen').hidden`, "privacy acknowledgment screen");
    assert.equal(await evaluate(pageCdp, `document.querySelector('#startApplication').disabled`), true);
    await evaluate(pageCdp, `(() => { const select = document.querySelector('#languageSelect'); select.value = 'vi'; select.dispatchEvent(new Event('change', { bubbles: true })); })()`);
    await waitFor(pageCdp, `document.querySelector('#privacyFrame').contentDocument.documentElement.lang === 'vi'`, "Vietnamese privacy notice");
    assert.equal(await evaluate(pageCdp, `document.querySelector('#privacyTitle').textContent`), "Trước khi bắt đầu");
    await evaluate(pageCdp, `(() => { const box = document.querySelector('#privacyAgree'); box.checked = true; box.dispatchEvent(new Event('change', { bubbles: true })); })()`);
    assert.equal(await evaluate(pageCdp, `document.querySelector('#startApplication').disabled`), false);
    await click(pageCdp, "#startApplication");
    await waitFor(pageCdp, `document.querySelector('.step[data-step="0"]').classList.contains('on')`, "form start after privacy acknowledgment");
    assert.equal(await evaluate(pageCdp, `document.querySelector('#languageSelect').value`), "vi");
    assert.equal(await evaluate(pageCdp, `Array.from(document.querySelectorAll('#roleChips .chip')).every((chip) => !chip.hidden && chip.getAttribute('aria-pressed') === 'false')`), true, "codes with no assigned role must let the user choose one");
    resultLines.push("PASS: privacy acknowledgment is required, and Vietnamese switching works before starting");
    await click(pageCdp, "#nextBtn");
    await click(pageCdp, "#nextBtn");
    await waitFor(pageCdp, `!document.querySelector('#validationMsg').hidden`, "required-field validation");
    assert.equal(calls.errorReports.length, 0, "missing form fields must not be reported as system errors");
    resultLines.push("PASS: missing required fields are highlighted locally and do not create system reports");

    // Fill required details and preferences with synthetic data only.
    await fill(pageCdp, "#fullName", "Local Test User");
    await fill(pageCdp, "#nick", "Tester");
    await click(pageCdp, "#roleChips .chip:nth-child(3)"); // Student
    await click(pageCdp, "#genderChips .chip:first-child"); // Male
    await fill(pageCdp, "#className", "10A1");
    await click(pageCdp, "#zodiacChips .chip:first-child"); // Aries
    await click(pageCdp, "#nextBtn");
    await waitFor(pageCdp, `document.querySelector('.step[data-step="2"]').classList.contains('on')`, "favorites step");
    await click(pageCdp, "#hobbiesChips .chip:first-child");
    await click(pageCdp, "#colors button:first-child");
    await click(pageCdp, "#foodsChips .chip:first-child");
    await click(pageCdp, "#nextBtn");
    await waitFor(pageCdp, `document.querySelector('.step[data-step="3"]').classList.contains('on')`, "photo step");

    // Simulate an oversized photo and verify it is rejected locally.
    await evaluate(pageCdp, `(() => { const input = document.querySelector('#photoInput'); const data = new Uint8Array(15 * 1024 * 1024 + 1); const transfer = new DataTransfer(); transfer.items.add(new File([data], 'too-large.jpg', { type: 'image/jpeg' })); input.files = transfer.files; input.dispatchEvent(new Event('change', { bubbles: true })); })()`);
    await waitFor(pageCdp, `!document.querySelector('#photoMsg').hidden`, "oversized photo message");
    assert.equal(calls.submissions, 0, "oversized photo must not be submitted");
    resultLines.push("PASS: oversized photo is rejected in the browser before submission");

    const documentInfo = await pageCdp.send("DOM.getDocument");
    const fileInput = await pageCdp.send("DOM.querySelector", { nodeId: documentInfo.root.nodeId, selector: "#photoInput" });
    await pageCdp.send("DOM.setFileInputFiles", { files: [pngPath], nodeId: fileInput.nodeId });
    await evaluate(pageCdp, `document.querySelector('#photoInput').dispatchEvent(new Event('change', { bubbles: true }))`);
    await waitFor(pageCdp, `!document.querySelector('#preview').hidden`, "small photo preview");
    await evaluate(pageCdp, `(() => { const box = document.querySelector('#consent'); box.checked = true; box.dispatchEvent(new Event('change', { bubbles: true })); })()`);
    await click(pageCdp, "#nextBtn");
    await waitFor(pageCdp, `document.querySelector('.step[data-step="4"]').classList.contains('on')`, "review step");
    await click(pageCdp, "#nextBtn");
    await waitFor(pageCdp, `document.querySelector('.step[data-step="5"]').classList.contains('on')`, "submission success step");
    assert.equal(calls.submissions, 1);
    resultLines.push("PASS: synthetic valid application reaches the success screen using the mocked backend");

    // Existing response is restored as editable review data.
    await pageCdp.send("Page.navigate", { url: local + "/applications/" });
    await waitFor(pageCdp, `!!document.querySelector('#loginForm') && !!window.jQuery`, "application page reload");
    await fill(pageCdp, "#accessCode", "mock-existing");
    await click(pageCdp, "#loginBtn");
    await waitFor(pageCdp, `!document.querySelector('#privacyScreen').hidden`, "existing user privacy acknowledgment");
    await evaluate(pageCdp, `(() => { const box = document.querySelector('#privacyAgree'); box.checked = true; box.dispatchEvent(new Event('change', { bubbles: true })); })()`);
    await click(pageCdp, "#startApplication");
    await waitFor(pageCdp, `document.querySelector('.step[data-step="4"]').classList.contains('on')`, "existing-response review");
    assert.equal(await evaluate(pageCdp, `document.querySelector('#fullName').value`), "Existing Test");
    assert.equal(await evaluate(pageCdp, `document.querySelector('#genderChips .chip:nth-child(2)').getAttribute('aria-pressed')`), "true");
    resultLines.push("PASS: existing response is restored to the review/edit flow");

    // Browser system error is reported through the mocked endpoint only.
    await evaluate(pageCdp, `(() => { const select = document.querySelector('#languageSelect'); select.value = 'en'; select.dispatchEvent(new Event('change', { bubbles: true })); })()`);
    await evaluate(pageCdp, `window.dispatchEvent(new ErrorEvent('error', { message: 'MIYO_BROWSER_SIMULATED_ERROR' }))`);
    await waitFor(pageCdp, `!!document.querySelector('.system-error-banner') && document.querySelector('.system-error-banner').textContent.includes('has been sent')`, "system error banner/report acknowledgement");
    assert.equal(calls.errorReports.length, 1);
    assert.equal(calls.errorReports[0].message, "MIYO_BROWSER_SIMULATED_ERROR");
    resultLines.push("PASS: simulated browser system error displays a code and is sent to the mocked endpoint");

    await pageCdp.send("Network.enable");
    await pageCdp.send("Network.emulateNetworkConditions", { offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: 0 });
    await evaluate(pageCdp, `window.dispatchEvent(new ErrorEvent('error', { message: 'MIYO_OFFLINE_SIMULATION' }))`);
    await waitFor(pageCdp, `document.querySelector('.system-error-banner').textContent.includes('Connection lost')`, "offline error guidance");
    assert.equal(calls.errorReports.length, 1, "offline error should wait until the browser reconnects");
    await pageCdp.send("Network.emulateNetworkConditions", { offline: false, latency: 0, downloadThroughput: 1000000, uploadThroughput: 1000000 });
    await waitFor(pageCdp, `document.querySelector('.system-error-banner').textContent.includes('has been sent')`, "queued offline report delivery", 15000);
    assert.equal(calls.errorReports.length, 2);
    assert.equal(calls.errorReports[1].message, "MIYO_OFFLINE_SIMULATION");
    resultLines.push("PASS: offline error is queued, asks the user to refresh/reconnect, and sends on reconnection");

    if (consoleErrors.length) {
      resultLines.push("BROWSER CONSOLE ERRORS: " + consoleErrors.join(" | "));
    } else {
      resultLines.push("PASS: no uncaught JavaScript exceptions or console errors observed in the tested flows");
    }

    console.log(resultLines.join("\n"));
    console.log("MOCK COUNTS " + JSON.stringify(calls));
    if (consoleErrors.length) process.exitCode = 1;
  } finally {
    if (pageCdp) pageCdp.close();
    if (browserCdp) browserCdp.close();
    chrome.kill();
    server.close();
  }
}

main().catch((error) => {
  console.error("SIMULATION FAILED: " + (error.stack || error.message));
  process.exitCode = 1;
});
