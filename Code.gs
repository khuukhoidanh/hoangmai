// Google Apps Script backend for the Make It Yours website.
// Replace these values with your own Google IDs before deploying.
var SPREADSHEET_ID = "PASTE_YOUR_SPREADSHEET_ID_HERE";
var SHEET_NAME = "Responses";
var DRIVE_FOLDER_ID = "PASTE_YOUR_DRIVE_FOLDER_ID_HERE";
var ADMIN_SHEET_NAME = "AdminCodes";

var HEADERS = [
  "Timestamp",
  "Full name",
  "Nickname",
  "Role",
  "Gender",
  "Position",
  "Class",
  "Zodiac sign",
  "Interests",
  "Favorite color",
  "Food to try in Taiwan",
  "Photo URL",
  "Photo consent",
  "code"
];

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error("No submission data received.");
    }

    var data = JSON.parse(e.postData.contents);
    if (data && data.action === "adminLogin") {
      return verifyAdminCode(data.code);
    }
    if (data && data.action === "reportError") {
      return reportSystemError(data.error || {});
    }
    if (data && data.action === "login") {
      return verifyStudentCode(data.code);
    }
    if (data && data.action === "adminResponses") {
      return getAdminResponses(data.code);
    }
    if (data && data.action === "supportChatStart") return startSupportChat_(data);
    if (data && data.action === "supportChatSend") return sendSupportChatMessage_(data);
    if (data && data.action === "supportChatPoll") return pollSupportChat_(data);
    if (data && data.action === "supportChatCancel") return closeSupportChatForUser_(data);
    if (data && data.action === "supportChatTelegramWebhook") return receiveSupportChatTelegramWebhook_(data);
    try {
      validateSubmission(data);
    } catch (validationError) {
      return jsonResponse({ ok: false, type: "USER_INPUT", error: validationError.message || "Please check the required fields." });
    }
    lock.waitLock(30000);
    var enrolledStudent = findStudentByCode(data.code);
    if (!enrolledStudent) {
      return jsonResponse({ ok: false, error: "This student code is invalid or inactive." });
    }
    var assignedRole = normalizeRole(enrolledStudent.role);
    var submittedRole = normalizeRole(data.role);
    if (assignedRole === "admin" ||
        ["student", "teacher", "interpreter"].indexOf(submittedRole) < 0 ||
        (["student", "teacher"].indexOf(assignedRole) >= 0 && submittedRole !== assignedRole)) {
      return jsonResponse({ ok: false, error: "The role does not match the role assigned to this code." });
    }

    var spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = spreadsheet.getSheetByName(SHEET_NAME) || spreadsheet.insertSheet(SHEET_NAME);
    var headers = ensureResponseHeaders(sheet);
    var codeColumn = findHeaderColumn(headers, ["access code", "code", "student code", "login code"]);
    var oldRowNumber = findResponseRow(sheet, headers, codeColumn, data.code);
    var oldRow = oldRowNumber ? sheet.getRange(oldRowNumber, 1, 1, headers.length).getDisplayValues()[0] : [];
    var photoColumn = findHeaderColumn(headers, ["photo url", "photo link", "photo"]);
    var oldPhotoUrl = oldRow.length && photoColumn >= 0 ? oldRow[photoColumn] : "";
    var photoUrl = data.photo ? savePhoto(data.photo, data.fullName, data.nick) : (data.photoUrl || oldPhotoUrl);
    if (!photoUrl) throw new Error("A photo is required. Please choose your photo again.");

    // Preserve any existing/unrecognized columns while replacing this student's known fields.
    var row = oldRowNumber ? oldRow.slice() : new Array(headers.length).fill("");
    setResponseValue(row, headers, ["timestamp", "submitted at"], new Date());
    setResponseValue(row, headers, ["full name", "fullname", "name"], cleanCell(data.fullName));
    setResponseValue(row, headers, ["nickname", "nick name", "nick", "your nick name"], cleanCell(data.nick));
    setResponseValue(row, headers, ["role"], cleanCell(data.role));
    setResponseValue(row, headers, ["gender", "sex"], cleanCell(data.gender));
    setResponseValue(row, headers, ["position"], cleanCell(data.position));
    setResponseValue(row, headers, ["class", "class name", "classname", "grade"], cleanCell(data.className));
    setResponseValue(row, headers, ["zodiac sign", "zodiac"], cleanCell(data.zodiac));
    setResponseValue(row, headers, ["interests", "hobbies"], cleanCell(data.hobbies));
    setResponseValue(row, headers, ["favorite color", "color"], cleanCell(data.color));
    setResponseValue(row, headers, ["food to try in taiwan", "food to try", "foods"], cleanCell(data.foods));
    setResponseValue(row, headers, ["photo url", "photo link", "photo"], photoUrl);
    setResponseValue(row, headers, ["photo consent", "consent"], data.consent === true ? "Yes" : "No");
    setResponseValue(row, headers, ["access code", "code", "student code", "login code"], cleanCell(data.code));

    if (oldRowNumber) {
      sheet.getRange(oldRowNumber, 1, 1, headers.length).setValues([row]);
    } else {
      sheet.appendRow(row);
    }
    if (data.photo && oldPhotoUrl && oldPhotoUrl !== photoUrl) trashDriveFile(oldPhotoUrl);

    return jsonResponse({ ok: true, updated: Boolean(oldRowNumber) });
  } catch (error) {
    return jsonResponse({ ok: false, error: error.message || "Submission failed." });
  } finally {
    if (lock.hasLock()) lock.releaseLock();
  }
}

// Support chat uses one Telegram forum topic per anonymous website conversation.
// Configure SUPPORT_BOT_TOKEN, SUPPORT_GROUP_ID and SUPPORT_ARCHIVE_FOLDER_ID
// in Apps Script Properties, then run setupSupportChat() once.
var SUPPORT_INACTIVE_DAYS = 7;
var SUPPORT_MAX_MESSAGE_LENGTH = 1200;
var SUPPORT_STARTS_PER_HOUR = 20;
var SUPPORT_SENDS_PER_MINUTE = 12;
var SUPPORT_SESSION_HEADERS = ["Chat ID", "Token Hash", "Thread ID", "Opened At", "Last Activity", "Status", "Archive File ID"];
var SUPPORT_MESSAGE_HEADERS = ["Chat ID", "Timestamp", "Sender", "Message", "Telegram Message ID", "Sequence"];

function supportProperties_() {
  var properties = PropertiesService.getScriptProperties();
  var config = {
    token: properties.getProperty("SUPPORT_BOT_TOKEN"),
    groupId: properties.getProperty("SUPPORT_GROUP_ID"),
    archiveFolderId: properties.getProperty("SUPPORT_ARCHIVE_FOLDER_ID")
  };
  if (!config.token || !config.groupId || !config.archiveFolderId) {
    throw new Error("Support chat is not configured. Set SUPPORT_BOT_TOKEN, SUPPORT_GROUP_ID, and SUPPORT_ARCHIVE_FOLDER_ID in Apps Script Properties.");
  }
  return config;
}

function supportSheets_() {
  var config = supportProperties_();
  var folder = DriveApp.getFolderById(config.archiveFolderId);
  if (folder.getSharingAccess() !== DriveApp.Access.PRIVATE) throw new Error("The support archive folder must be private.");
  var spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sessions = spreadsheet.getSheetByName("SupportChats") || spreadsheet.insertSheet("SupportChats");
  var messages = spreadsheet.getSheetByName("SupportMessages") || spreadsheet.insertSheet("SupportMessages");
  if (sessions.getLastRow() === 0) sessions.appendRow(SUPPORT_SESSION_HEADERS);
  if (messages.getLastRow() === 0) messages.appendRow(SUPPORT_MESSAGE_HEADERS);
  return { config: config, folder: folder, sessions: sessions, messages: messages };
}

function ensureSupportMessageSequence_(sheet) {
  if (String(sheet.getRange(1, 6).getValue()) !== "Sequence") sheet.getRange(1, 6).setValue("Sequence");
  var properties = PropertiesService.getScriptProperties();
  var migrated = properties.getProperty("SUPPORT_MESSAGE_SEQUENCE_MIGRATED") === "1";
  if (migrated || sheet.getLastRow() < 2) return;
  var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, SUPPORT_MESSAGE_HEADERS.length).getValues();
  var sequence = Number(properties.getProperty("SUPPORT_MESSAGE_SEQUENCE") || 0);
  for (var i = 0; i < values.length; i++) {
    if (values[i][0] && !Number(values[i][5])) {
      sequence++;
      sheet.getRange(i + 2, 6).setValue(sequence);
    } else {
      sequence = Math.max(sequence, Number(values[i][5]) || 0);
    }
  }
  properties.setProperty("SUPPORT_MESSAGE_SEQUENCE", String(sequence));
  properties.setProperty("SUPPORT_MESSAGE_SEQUENCE_MIGRATED", "1");
}

function nextSupportMessageSequence_() {
  var properties = PropertiesService.getScriptProperties();
  var sequence = Number(properties.getProperty("SUPPORT_MESSAGE_SEQUENCE") || 0) + 1;
  properties.setProperty("SUPPORT_MESSAGE_SEQUENCE", String(sequence));
  return sequence;
}

function supportTelegram_(method, payload, config) {
  var response = UrlFetchApp.fetch("https://api.telegram.org/bot" + config.token + "/" + method, {
    method: "post", contentType: "application/json", payload: JSON.stringify(payload || {}), muteHttpExceptions: true
  });
  var result;
  try { result = JSON.parse(response.getContentText()); } catch (error) { throw new Error("Telegram returned an unreadable response."); }
  if (response.getResponseCode() < 200 || response.getResponseCode() >= 300 || !result.ok) {
    throw new Error("Telegram " + method + " failed: " + String(result.description || response.getResponseCode()).slice(0, 250));
  }
  return result.result;
}

function supportHash_(value) {
  return Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(value))).replace(/=+$/g, "");
}

function supportSessionRow_(sheet, chatId) {
  if (sheet.getLastRow() < 2) return 0;
  var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, SUPPORT_SESSION_HEADERS.length).getValues();
  for (var i = 0; i < values.length; i++) if (String(values[i][0]) === String(chatId)) return i + 2;
  return 0;
}

function supportAuthorizedSession_(chatId, token, requireActive) {
  var stores = supportSheets_();
  var rowNumber = supportSessionRow_(stores.sessions, chatId);
  if (!rowNumber) return { stores: stores, closed: true };
  var row = stores.sessions.getRange(rowNumber, 1, 1, SUPPORT_SESSION_HEADERS.length).getValues()[0];
  if (!token || supportHash_(token) !== String(row[1])) return { stores: stores, denied: true };
  if (requireActive && String(row[5]) !== "ACTIVE") return { stores: stores, closed: true };
  return { stores: stores, rowNumber: rowNumber, row: row };
}

function startSupportChat_(data) {
  var lock = LockService.getScriptLock();
  var stores = null;
  var topic = null;
  try {
    lock.waitLock(15000);
    stores = supportSheets_();
    var cache = CacheService.getScriptCache();
    var hourKey = "support-chat-starts-" + Utilities.formatDate(new Date(), "UTC", "yyyyMMddHH");
    var starts = Number(cache.get(hourKey) || 0);
    if (starts >= SUPPORT_STARTS_PER_HOUR) return jsonResponse({ ok: false, rateLimited: true, error: "Too many new support chats. Please try again later." });
    var chatId = Utilities.getUuid().replace(/-/g, "").toLowerCase();
    var accessToken = Utilities.getUuid() + Utilities.getUuid();
    topic = supportTelegram_("createForumTopic", { chat_id: stores.config.groupId, name: "MIYO support · " + chatId.slice(0, 8) }, stores.config);
    var now = new Date();
    stores.sessions.appendRow([chatId, supportHash_(accessToken), topic.message_thread_id, now, now, "ACTIVE", ""]);
    var greeting = String(data && data.language || "en").toLowerCase().indexOf("vi") === 0
      ? "Xin chào! Bạn đang trò chuyện với MIYO Assistant. Người trả lời bạn là thành viên thật của đội ngũ MIYO. Nếu có việc thật sự gấp, vui lòng liên hệ Zalo: 0335695572."
      : "Hello! You’re chatting with MIYO Assistant. Replies come from a real member of the MIYO team. If something is urgent, please contact us on Zalo: 0335695572.";
    stores.messages.appendRow([chatId, now, "assistant", greeting, "", nextSupportMessageSequence_()]);
    cache.put(hourKey, String(starts + 1), 3600);
    return jsonResponse({ ok: true, chatId: chatId, accessToken: accessToken, messages: [] });
  } catch (error) {
    if (topic && stores) {
      try { supportTelegram_("deleteForumTopic", { chat_id: stores.config.groupId, message_thread_id: topic.message_thread_id }, stores.config); }
      catch (cleanupError) { console.error("Could not remove an untracked support topic."); }
    }
    return jsonResponse({ ok: false, error: "Could not start a support chat. Please try again later." });
  } finally {
    if (lock.hasLock()) lock.releaseLock();
  }
}

function sendSupportChatMessage_(data) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    var auth = supportAuthorizedSession_(data.chatId, data.accessToken, true);
    if (auth.denied) return jsonResponse({ ok: false, error: "This chat session is not valid." });
    if (auth.closed) return jsonResponse({ ok: false, closed: true });
    var text = String(data.message || "").trim();
    if (!text || text.length > SUPPORT_MAX_MESSAGE_LENGTH) return jsonResponse({ ok: false, error: "Messages must be between 1 and " + SUPPORT_MAX_MESSAGE_LENGTH + " characters." });
    var cache = CacheService.getScriptCache();
    var rateKey = "support-chat-send-" + supportHash_(data.chatId + ":" + data.accessToken).slice(0, 30);
    var count = Number(cache.get(rateKey) || 0);
    if (count >= SUPPORT_SENDS_PER_MINUTE) return jsonResponse({ ok: false, rateLimited: true, error: "Please wait a moment before sending more messages." });
    var timestamp = new Date();
    var messageRow = auth.stores.messages.getLastRow() + 1;
    var sequence = nextSupportMessageSequence_();
    auth.stores.messages.appendRow([data.chatId, timestamp, "user", text, "", sequence]);
    try {
      var sent = supportTelegram_("sendMessage", {
        chat_id: auth.stores.config.groupId,
        message_thread_id: auth.row[2],
        text: "<b>Visitor</b>\n" + escapeTelegramHtml_(text),
        parse_mode: "HTML"
      }, auth.stores.config);
      auth.stores.messages.getRange(messageRow, 5).setValue(sent.message_id);
    } catch (telegramError) {
      auth.stores.messages.deleteRow(messageRow);
      return jsonResponse({ ok: false, error: "Message could not be delivered. Please try again." });
    }
    auth.stores.sessions.getRange(auth.rowNumber, 5).setValue(timestamp);
    cache.put(rateKey, String(count + 1), 60);
    return jsonResponse({ ok: true, messageId: sequence });
  } catch (error) {
    return jsonResponse({ ok: false, error: "Could not send the message." });
  } finally {
    if (lock.hasLock()) lock.releaseLock();
  }
}

function pollSupportChat_(data) {
  try {
    var auth = supportAuthorizedSession_(data.chatId, data.accessToken, false);
    if (auth.denied) return jsonResponse({ ok: false, error: "This chat session is not valid." });
    if (auth.closed) return jsonResponse({ ok: true, closed: true, messages: [] });
    var after = Math.max(0, Number(data.after) || 0);
    var messages = [];
    var cursor = after;
    var lastRow = auth.stores.messages.getLastRow();
    if (lastRow >= 2) {
      var rows = auth.stores.messages.getRange(2, 1, lastRow - 1, SUPPORT_MESSAGE_HEADERS.length).getValues();
      for (var i = 0; i < rows.length; i++) {
        var sequence = Number(rows[i][5]) || 0;
        if (String(rows[i][0]) !== String(data.chatId)) continue;
        cursor = Math.max(cursor, sequence);
        if (sequence <= after) continue;
        messages.push({ id: sequence, sender: String(rows[i][2]), text: String(rows[i][3]), timestamp: rows[i][1] instanceof Date ? rows[i][1].toISOString() : String(rows[i][1]) });
      }
    }
    return jsonResponse({ ok: true, closed: String(auth.row[5]) !== "ACTIVE", messages: messages, cursor: cursor });
  } catch (error) {
    return jsonResponse({ ok: false, error: "Could not load chat messages." });
  }
}

function closeSupportChatForUser_(data) {
  var lock = LockService.getScriptLock();
  var locked = false;
  try {
    lock.waitLock(15000);
    locked = true;
    var auth = supportAuthorizedSession_(data.chatId, data.accessToken, false);
    if (auth.denied) return jsonResponse({ ok: false, error: "This chat session is not valid." });
    if (auth.closed) return jsonResponse({ ok: true, closed: true });
    var closed = closeSupportChat_(auth.stores, auth.rowNumber, "cancelled");
    return jsonResponse({ ok: closed, closed: closed, error: closed ? "" : "The chat could not be archived yet. Please try again." });
  } catch (error) {
    return jsonResponse({ ok: false, error: "The chat could not be closed." });
  } finally {
    if (locked && lock.hasLock()) lock.releaseLock();
  }
}

function closeSupportChat_(stores, sessionRow, reason) {
  var row = stores.sessions.getRange(sessionRow, 1, 1, SUPPORT_SESSION_HEADERS.length).getValues()[0];
  if (!row[0]) return true;
  if (String(row[5]) === "ACTIVE") stores.sessions.getRange(sessionRow, 6).setValue("CLOSING");
  var archiveFileId = String(row[6] || "");
  if (!archiveFileId) {
    var transcript = [];
    var lastMessageRow = stores.messages.getLastRow();
    if (lastMessageRow >= 2) {
      var rows = stores.messages.getRange(2, 1, lastMessageRow - 1, SUPPORT_MESSAGE_HEADERS.length).getValues();
      rows.forEach(function (message) {
        if (String(message[0]) === String(row[0])) transcript.push({ timestamp: message[1] instanceof Date ? message[1].toISOString() : String(message[1]), sender: String(message[2]), text: String(message[3]) });
      });
    }
    var archive = { chatId: String(row[0]), openedAt: row[3] instanceof Date ? row[3].toISOString() : String(row[3]), closedAt: new Date().toISOString(), reason: reason, messages: transcript };
    var file = stores.folder.createFile("MIYO-chat-" + String(row[0]).slice(0, 8) + "-" + new Date().getTime() + ".json", JSON.stringify(archive, null, 2), MimeType.PLAIN_TEXT);
    archiveFileId = file.getId();
    stores.sessions.getRange(sessionRow, 7).setValue(archiveFileId);
  }
  try {
    supportTelegram_("deleteForumTopic", { chat_id: stores.config.groupId, message_thread_id: row[2] }, stores.config);
  } catch (error) {
    return false;
  }
  deleteSupportMessages_(stores.messages, String(row[0]));
  stores.sessions.deleteRow(sessionRow);
  return true;
}

function deleteSupportMessages_(sheet, chatId) {
  for (var rowNumber = sheet.getLastRow(); rowNumber >= 2; rowNumber--) {
    if (String(sheet.getRange(rowNumber, 1).getValue()) === chatId) sheet.deleteRow(rowNumber);
  }
}

function escapeTelegramHtml_(text) {
  return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function pollTelegramSupportInbox() {
  var lock = LockService.getScriptLock();
  var locked = false;
  try {
    lock.waitLock(20000);
    locked = true;
    var stores = supportSheets_();
    var properties = PropertiesService.getScriptProperties();
    var offset = Number(properties.getProperty("SUPPORT_TELEGRAM_UPDATE_OFFSET") || 0);
    var updates = supportTelegram_("getUpdates", { offset: offset, timeout: 0, allowed_updates: ["message"] }, stores.config);
    for (var i = 0; i < updates.length; i++) {
      try {
        processSupportTelegramUpdate_(updates[i], stores);
        properties.setProperty("SUPPORT_TELEGRAM_UPDATE_OFFSET", String(updates[i].update_id + 1));
      } catch (updateError) {
        console.error("Support inbox update failed: " + updates[i].update_id);
        break;
      }
    }
  } catch (error) {
    console.error("Support inbox polling failed: " + error.message);
  } finally {
    if (locked && lock.hasLock()) lock.releaseLock();
  }
}

function receiveSupportChatTelegramWebhook_(data) {
  var expectedSecret = PropertiesService.getScriptProperties().getProperty("SUPPORT_BRIDGE_SECRET");
  if (!expectedSecret || String(data.bridgeSecret || "") !== expectedSecret) {
    return jsonResponse({ ok: false, error: "Unauthorized webhook bridge." });
  }
  var update = data.update;
  if (!update || !Number.isFinite(Number(update.update_id))) {
    return jsonResponse({ ok: false, error: "Invalid Telegram update." });
  }
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    var properties = PropertiesService.getScriptProperties();
    var lastUpdateId = Number(properties.getProperty("SUPPORT_WEBHOOK_LAST_UPDATE_ID") || 0);
    if (Number(update.update_id) <= lastUpdateId) return jsonResponse({ ok: true, duplicate: true });
    var stores = supportSheets_();
    processSupportTelegramUpdate_(update, stores);
    properties.setProperty("SUPPORT_WEBHOOK_LAST_UPDATE_ID", String(update.update_id));
    return jsonResponse({ ok: true });
  } catch (error) {
    console.error("Support webhook update failed: " + error.message);
    return jsonResponse({ ok: false, error: "Could not process Telegram update." });
  } finally {
    if (lock.hasLock()) lock.releaseLock();
  }
}

function setupSupportChatWebhook() {
  var properties = PropertiesService.getScriptProperties();
  var workerUrl = String(properties.getProperty("SUPPORT_WEBHOOK_URL") || "").replace(/\/+$/, "");
  var secret = properties.getProperty("SUPPORT_TELEGRAM_WEBHOOK_SECRET");
  if (!/^https:\/\/[a-z0-9-]+(?:\.[a-z0-9-]+)*\.workers\.dev$/i.test(workerUrl)) throw new Error("Set SUPPORT_WEBHOOK_URL to the deployed https://<worker>.<account>.workers.dev URL first.");
  if (!secret || !/^[A-Za-z0-9_-]{1,256}$/.test(secret)) throw new Error("Set SUPPORT_TELEGRAM_WEBHOOK_SECRET using 1–256 letters, numbers, underscores, or hyphens.");
  var stores = supportSheets_();
  ensureSupportMessageSequence_(stores.messages);
  supportTelegram_("setWebhook", { url: workerUrl + "/telegram", secret_token: secret, allowed_updates: ["message"], max_connections: 1, drop_pending_updates: false }, stores.config);
  ScriptApp.getProjectTriggers().forEach(function (trigger) {
    if (trigger.getHandlerFunction() === "pollTelegramSupportInbox") ScriptApp.deleteTrigger(trigger);
  });
  return "Telegram webhook enabled; the one-minute polling trigger was removed.";
}

function processSupportTelegramUpdate_(update, stores) {
  var message = update && update.message;
  if (!message || !message.message_thread_id || !message.from || message.from.is_bot) return;
  var sessionRow = findSupportSessionByThread_(stores.sessions, message.message_thread_id);
  if (!sessionRow) return;
  var session = stores.sessions.getRange(sessionRow, 1, 1, SUPPORT_SESSION_HEADERS.length).getValues()[0];
  if (String(session[5]) !== "ACTIVE") return;
  var text = String(message.text || message.caption || "").trim();
  if (supportTelegramMessageExists_(stores.messages, message.message_id)) return;
  if (/^\/(cancel|close)(?:@\w+)?(?:\s|$)/i.test(text)) {
    closeSupportChat_(stores, sessionRow, "cancelled-by-support");
    return;
  }
  if (!text) return;
  text = text.slice(0, SUPPORT_MAX_MESSAGE_LENGTH);
  stores.messages.appendRow([session[0], new Date(message.date * 1000), "support", text, message.message_id, nextSupportMessageSequence_()]);
  stores.sessions.getRange(sessionRow, 5).setValue(new Date(message.date * 1000));
}

function supportTelegramMessageExists_(sheet, telegramMessageId) {
  if (sheet.getLastRow() < 2) return false;
  var ids = sheet.getRange(2, 5, sheet.getLastRow() - 1, 1).getValues();
  return ids.some(function (row) { return String(row[0]) === String(telegramMessageId); });
}

function findSupportSessionByThread_(sheet, threadId) {
  if (sheet.getLastRow() < 2) return 0;
  var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, SUPPORT_SESSION_HEADERS.length).getValues();
  for (var i = 0; i < values.length; i++) if (String(values[i][2]) === String(threadId)) return i + 2;
  return 0;
}

function cleanupExpiredSupportChats() {
  var lock = LockService.getScriptLock();
  var locked = false;
  try {
    lock.waitLock(20000);
    locked = true;
    var stores = supportSheets_();
    var cutoff = Date.now() - SUPPORT_INACTIVE_DAYS * 24 * 60 * 60 * 1000;
    for (var rowNumber = stores.sessions.getLastRow(); rowNumber >= 2; rowNumber--) {
      var session = stores.sessions.getRange(rowNumber, 1, 1, SUPPORT_SESSION_HEADERS.length).getValues()[0];
      var lastActivity = session[4] instanceof Date ? session[4].getTime() : new Date(session[4]).getTime();
      if (String(session[5]) === "CLOSING" || (String(session[5]) === "ACTIVE" && lastActivity <= cutoff)) {
        closeSupportChat_(stores, rowNumber, String(session[5]) === "CLOSING" ? "previously-closed" : "inactive-7-days");
      }
    }
  } catch (error) {
    console.error("Support chat cleanup failed: " + error.message);
  } finally {
    if (locked && lock.hasLock()) lock.releaseLock();
  }
}

function setupSupportChat() {
  var stores = supportSheets_();
  ensureSupportMessageSequence_(stores.messages);
  var webhook = supportTelegram_("getWebhookInfo", {}, stores.config);
  if (webhook && webhook.url) throw new Error("This bot currently has a Telegram webhook. Use a dedicated support bot or remove its webhook before enabling polling.");
  var triggers = ScriptApp.getProjectTriggers();
  if (!triggers.some(function (trigger) { return trigger.getHandlerFunction() === "pollTelegramSupportInbox"; })) {
    ScriptApp.newTrigger("pollTelegramSupportInbox").timeBased().everyMinutes(1).create();
  }
  if (!triggers.some(function (trigger) { return trigger.getHandlerFunction() === "cleanupExpiredSupportChats"; })) {
    ScriptApp.newTrigger("cleanupExpiredSupportChats").timeBased().everyHours(1).create();
  }
  return "Support chat sheets and polling/cleanup triggers are ready.";
}

// Accept only technical diagnostics from the browser; never include form/student data.
function reportSystemError(error) {
  var lock = LockService.getScriptLock();
  var locked = false;
  try {
    error = error && typeof error === "object" ? error : {};
    var page = String(error.page || "unknown").split(/[?#]/)[0].slice(0, 160);
    if (!/^\/[A-Za-z0-9_./-]*$/.test(page)) page = "unknown";
    var action = String(error.action || "unknown").slice(0, 60);
    if (!/^[A-Za-z0-9_-]+$/.test(action)) action = "unknown";
    var message = String(error.message || "Unspecified system error").replace(/[\r\n\t]+/g, " ").slice(0, 500);
    var stack = String(error.stack || "").slice(0, 1500);
    var userAgent = String(error.userAgent || "").slice(0, 300);
    var status = String(error.status || "").slice(0, 20);
    var fingerprint = [page, action, message, stack].join("|");
    var fingerprintHash = Utilities.base64EncodeWebSafe(
      Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, fingerprint)
    ).replace(/=+$/g, "");
    var cache = CacheService.getScriptCache();
    var fingerprintKey = "miyo-error-" + fingerprintHash;

    // Serialize deduplication, quota, logging, and notification to prevent concurrent spam.
    lock.waitLock(10000);
    locked = true;
    var state = cache.get(fingerprintKey);
    if (state && state.indexOf("sent:") === 0) {
      return jsonResponse({ ok: true, code: state.substring(5), duplicate: true });
    }

    var providedCode = String(error.code || "");
    if (!/^ERR-[A-Za-z0-9-]{1,27}$/.test(providedCode)) {
      providedCode = "ERR-" + Utilities.getUuid().slice(0, 8).toUpperCase();
    }
    var code = state && state.indexOf("pending:") === 0 ? state.substring(8) : providedCode;

    if (!state) {
      var quotaKey = "miyo-error-report-window";
      var reportsInWindow = Number(cache.get(quotaKey) || 0);
      if (reportsInWindow >= 20) {
        return jsonResponse({ ok: false, rateLimited: true });
      }
      getErrorsSheet_().appendRow([new Date(), code, page, action, message, stack, status, userAgent]);
      // Keep one Sheet row per identical error; retries reuse this code and row.
      cache.put(fingerprintKey, "pending:" + code, 21600);
      cache.put(quotaKey, String(reportsInWindow + 1), 600);
    }

    try {
      notifyDeveloper_(code, page, action, message, stack, status, userAgent);
      cache.put(fingerprintKey, "sent:" + code, 21600);
      return jsonResponse({ ok: true, code: code, notified: true });
    } catch (notifyError) {
      // Leave the fingerprint pending so the browser's queued retry can resend without another row.
      console.error("Telegram error notification failed for " + code + ".");
      return jsonResponse({ ok: false, code: code });
    }
  } catch (err) {
    console.error("Error report handling failed: " + err.message);
    return jsonResponse({ ok: false });
  } finally {
    if (locked && lock.hasLock()) lock.releaseLock();
  }
}

function getErrorsSheet_() {
  var spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = spreadsheet.getSheetByName("Errors") || spreadsheet.insertSheet("Errors");
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["Timestamp", "Error code", "Page", "Action", "Message", "Stack", "HTTP status", "Browser"]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function setupErrorsSheet() {
  getErrorsSheet_();
}

function notifyDeveloper_(code, page, action, message, stack, status, userAgent) {
  var properties = PropertiesService.getScriptProperties();
  var token = properties.getProperty("TELEGRAM_TOKEN");
  var chatId = properties.getProperty("TELEGRAM_CHAT_ID");
  if (!token || !chatId) throw new Error("Telegram Script Properties are not configured.");
  var text = "MIYO error report received. Error code: " + code;
  var response = UrlFetchApp.fetch("https://api.telegram.org/bot" + token + "/sendMessage", {
    method: "post",
    payload: { chat_id: chatId, text: text },
    muteHttpExceptions: true
  });
  if (response.getResponseCode() < 200 || response.getResponseCode() >= 300) {
    throw new Error("Telegram returned HTTP " + response.getResponseCode());
  }
}

// Store one admin code per row in column A, below the header in A1, on "AdminCodes".
function verifyAdminCode(code) {
  try {
    if (!code || SPREADSHEET_ID.indexOf("PASTE_") === 0) {
      return jsonResponse({ ok: false });
    }
    var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(ADMIN_SHEET_NAME);
    if (!sheet) return jsonResponse({ ok: false });
    var lastRow = sheet.getLastRow();
    if (lastRow < 2) return jsonResponse({ ok: false });
    var configuredCodes = sheet.getRange(2, 1, lastRow - 1, 1).getDisplayValues().flat();
    var submittedCode = String(code).trim().toLowerCase();
    var isValid = configuredCodes.some(function (value) {
      return String(value).trim().toLowerCase() === submittedCode;
    });
    return jsonResponse({ ok: isValid });
  } catch (error) {
    return jsonResponse({ ok: false });
  }
}

// Admin response access is authorized against an active admin code on every request.
function getAdminResponses(code) {
  try {
    var admin = findStudentByCode(code);
    if (!admin || normalizeRole(admin.role) !== "admin") return jsonResponse({ ok: false });
    var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
    if (!sheet || sheet.getLastRow() < 2) return jsonResponse({ ok: true, headers: [], rows: [] });
    var values = sheet.getDataRange().getDisplayValues();
    return jsonResponse({ ok: true, headers: values[0], rows: values.slice(1) });
  } catch (error) {
    return jsonResponse({ ok: false, error: "Could not load student responses." });
  }
}

function normalizeRole(role) {
  var value = String(role || "").trim().toLowerCase();
  if (["hs", "học sinh", "hoc sinh", "student"].indexOf(value) >= 0) return "student";
  if (["gv", "giáo viên", "giao vien", "teacher"].indexOf(value) >= 0) return "teacher";
  if (value === "admin" || value === "administrator") return "admin";
  if (value === "interpreter") return "interpreter";
  return value;
}

// Read StudentCodes on every login request (no cache), so Sheet edits take effect immediately.
// StudentCodes uses only: code, role, active. Column A is used for codes if no code header exists.
function verifyStudentCode(code) {
  try {
    if (!code || SPREADSHEET_ID.indexOf("PASTE_") === 0) {
      return jsonResponse({ ok: false, type: "SYSTEM_ERROR", error: "Student login is not configured in Apps Script." });
    }
    var student = findStudentByCode(code);
    if (!student) return jsonResponse({ ok: false });
    student.response = getSavedResponse(code);
    return jsonResponse({ ok: true, student: student });
  } catch (error) {
      return jsonResponse({ ok: false, type: "SYSTEM_ERROR", error: "Could not read StudentCodes. Check the spreadsheet ID and Apps Script permissions." });
  }
}

function findStudentByCode(code) {
  var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("StudentCodes");
  if (!sheet || sheet.getLastRow() < 2) return null;
  var rows = sheet.getDataRange().getDisplayValues();
  var headers = rows[0].map(normalizeHeader);
  var codeColumn = findHeaderColumn(headers, ["code", "access code", "student code", "login code"]);
  if (codeColumn < 0) codeColumn = 0;
  var activeColumn = findHeaderColumn(headers, ["active", "enabled", "status"]);
  var submittedCode = String(code || "").trim().toLowerCase();

  for (var rowIndex = 1; rowIndex < rows.length; rowIndex++) {
    var row = rows[rowIndex];
    if (String(row[codeColumn] || "").trim().toLowerCase() !== submittedCode) continue;
    if (activeColumn >= 0 && ["false", "no", "0", "inactive", "disabled"].indexOf(String(row[activeColumn]).trim().toLowerCase()) !== -1) return null;
    var role = getCellByHeader(row, headers, ["role"]);
    var normalizedRole = normalizeRole(role);
    return {
      code: row[codeColumn],
      role: normalizedRole === "student" ? "Student" : normalizedRole === "teacher" ? "Teacher" : normalizedRole === "interpreter" ? "Interpreter" : normalizedRole === "admin" ? "Admin" : role
    };
  }
  return null;
}

function isActiveStudentCode(code) {
  return Boolean(findStudentByCode(code));
}

function getSavedResponse(code) {
  var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
  if (!sheet || sheet.getLastRow() < 2) return null;
  var rows = sheet.getDataRange().getDisplayValues();
  var headers = rows[0].map(normalizeHeader);
  var codeColumn = findHeaderColumn(headers, ["access code", "code", "student code", "login code"]);
  if (codeColumn < 0) return null;
  var submittedCode = String(code || "").trim().toLowerCase();

  for (var rowIndex = 1; rowIndex < rows.length; rowIndex++) {
    var row = rows[rowIndex];
    if (String(row[codeColumn] || "").trim().toLowerCase() !== submittedCode) continue;
    var hobbies = splitSavedList(getCellByHeader(row, headers, ["interests", "hobbies"]));
    var foods = splitSavedList(getCellByHeader(row, headers, ["food to try in taiwan", "food to try", "foods"]));
    var knownHobbies = ["Music", "Drawing", "Reading", "Gaming", "Sports", "Photography", "Cooking", "Travel", "Movies", "Dancing", "Tech", "Fashion"];
    var knownFoods = ["Hot Pot", "BBQ / Grilled Meat", "Noodles", "Rice Dishes", "Dumplings", "Fried Chicken", "Sushi", "Curry", "Taiwanese Street Food", "Western Food", "Desserts", "Bubble Tea"];
    var customHobbies = hobbies.filter(function (value) { return knownHobbies.indexOf(value) < 0; });
    var customFoods = foods.filter(function (value) { return knownFoods.indexOf(value) < 0; });
    return {
      fullName: getCellByHeader(row, headers, ["full name", "fullname", "name"]),
      nick: getCellByHeader(row, headers, ["nickname", "nick name", "nick", "your nick name"]),
      role: getCellByHeader(row, headers, ["role"]),
      gender: getCellByHeader(row, headers, ["gender", "sex"]),
      position: getCellByHeader(row, headers, ["position"]),
      className: getCellByHeader(row, headers, ["class", "class name", "classname", "grade"]),
      zodiac: getCellByHeader(row, headers, ["zodiac sign", "zodiac"]),
      hobbies: hobbies.filter(function (value) { return knownHobbies.indexOf(value) >= 0; }).concat(customHobbies.length ? ["Other"] : []),
      hobbyOther: customHobbies.join(", "),
      color: getCellByHeader(row, headers, ["favorite color", "color"]),
      foods: foods.filter(function (value) { return knownFoods.indexOf(value) >= 0; }).concat(customFoods.length ? ["Other"] : []),
      foodOther: customFoods.join(", "),
      photoUrl: getCellByHeader(row, headers, ["photo url", "photo link", "photo"]),
      photoDataUrl: getDriveImageDataUrl(getCellByHeader(row, headers, ["photo url", "photo link", "photo"])),
      consent: ["yes", "true", "1"].indexOf(getCellByHeader(row, headers, ["photo consent", "consent"]).toLowerCase()) >= 0
    };
  }
  return null;
}

function splitSavedList(value) {
  return String(value || "").split(",").map(function (item) { return item.trim(); }).filter(Boolean);
}

// Read the private Drive image server-side and return a data URL for the authenticated student's preview.
function getDriveImageDataUrl(fileUrl) {
  var match = String(fileUrl || "").match(/[-\w]{25,}/);
  if (!match) return "";
  try {
    var blob = DriveApp.getFileById(match[0]).getBlob();
    var mimeType = blob.getContentType() || "image/jpeg";
    if (mimeType.indexOf("image/") !== 0) return "";
    return "data:" + mimeType + ";base64," + Utilities.base64Encode(blob.getBytes());
  } catch (error) {
    return "";
  }
}

function ensureResponseHeaders(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
  }
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0];
  var normalized = headers.map(normalizeHeader);
  var codeColumn = findHeaderColumn(normalized, ["access code", "code", "student code", "login code"]);
  if (codeColumn < 0) {
    headers.push("code");
    sheet.getRange(1, headers.length).setValue("code");
  } else if (headers[codeColumn] !== "code") {
    sheet.getRange(1, codeColumn + 1).setValue("code");
    headers[codeColumn] = "code";
  }
  if (findHeaderColumn(headers.map(normalizeHeader), ["gender", "sex"]) < 0) {
    headers.push("Gender");
    sheet.getRange(1, headers.length).setValue("Gender");
  }
  return headers.map(normalizeHeader);
}

// Run once from the Apps Script editor to create/normalize the code column immediately.
function setupResponsesSheet() {
  if (SPREADSHEET_ID.indexOf("PASTE_") === 0) throw new Error("Set the real Spreadsheet ID first.");
  var spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = spreadsheet.getSheetByName(SHEET_NAME) || spreadsheet.insertSheet(SHEET_NAME);
  ensureResponseHeaders(sheet);
}

function findResponseRow(sheet, headers, codeColumn, code) {
  if (codeColumn < 0 || sheet.getLastRow() < 2) return 0;
  var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length).getDisplayValues();
  var submittedCode = String(code || "").trim().toLowerCase();
  for (var index = 0; index < values.length; index++) {
    if (String(values[index][codeColumn] || "").trim().toLowerCase() === submittedCode) return index + 2;
  }
  return 0;
}

function setResponseValue(row, headers, candidates, value) {
  var column = findHeaderColumn(headers, candidates);
  if (column >= 0) row[column] = value;
}

function trashDriveFile(fileUrl) {
  var match = String(fileUrl || "").match(/[-\w]{25,}/);
  if (!match) return;
  try {
    DriveApp.getFileById(match[0]).setTrashed(true);
  } catch (error) {
    // Keep submission successful if the old photo is no longer accessible.
  }
}

function normalizeHeader(value) {
  return String(value || "").trim().replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
}

function findHeaderColumn(headers, candidates) {
  for (var index = 0; index < headers.length; index++) {
    if (candidates.indexOf(headers[index]) !== -1) return index;
  }
  return -1;
}

function getCellByHeader(row, headers, candidates) {
  var column = findHeaderColumn(headers, candidates);
  return column < 0 ? "" : row[column] || "";
}

function validateSubmission(data) {
  if (SPREADSHEET_ID.indexOf("PASTE_") === 0 || DRIVE_FOLDER_ID.indexOf("PASTE_") === 0) {
    throw new Error("Set the Spreadsheet ID and Drive folder ID in Code.gs first.");
  }
  var missingFields = [];
  if (!data || !data.code) missingFields.push("code");
  if (!data || !data.fullName) missingFields.push("fullName");
  if (!data || !data.nick) missingFields.push("nick");
  if (!data || !data.role) missingFields.push("role");
  if (!data || !data.gender) missingFields.push("gender");
  if (!data || !data.zodiac) missingFields.push("zodiac");
  if (!data || !data.color) missingFields.push("color");
  if (missingFields.length) throw new Error("Some required fields are missing: " + missingFields.join(", ") + ".");
  if (["Male", "Female"].indexOf(data.gender) < 0) throw new Error("Please select Male or Female.");
  if (!Array.isArray(data.hobbies) || data.hobbies.length === 0) {
    throw new Error("At least one interest is required.");
  }
  if (!Array.isArray(data.foods) || data.foods.length === 0) {
    throw new Error("At least one food choice is required.");
  }
  if (data.role === "Teacher" && !data.position) {
    throw new Error("Teacher position is required.");
  }
  if (data.role === "Student" && !data.className) {
    throw new Error("Student class is required.");
  }
  if (data.consent !== true) {
    throw new Error("Photo consent is required.");
  }
  if (typeof data.photo !== "string" || data.photo.length > 12 * 1024 * 1024) {
    throw new Error("Photo data is missing or too large.");
  }
}

function savePhoto(dataUrl, fullName, nickname) {
  var match = dataUrl.match(/^data:image\/(jpeg|jpg|png|webp);base64,([\s\S]+)$/i);
  if (!match) throw new Error("The photo format is not supported.");

  var mimeType = match[1].toLowerCase() === "png" ? "image/png" :
    match[1].toLowerCase() === "webp" ? "image/webp" : "image/jpeg";
  var extension = mimeType === "image/png" ? "png" : mimeType === "image/webp" ? "webp" : "jpg";
  var bytes = Utilities.base64Decode(match[2]);
  var safeName = (fullName + "_" + nickname)
    .replace(/[\\/:*?"<>|#%{}~&]/g, "_")
    .substring(0, 80);
  var blob = Utilities.newBlob(bytes, mimeType, safeName + "_" + new Date().getTime() + "." + extension);
  var file = DriveApp.getFolderById(DRIVE_FOLDER_ID).createFile(blob);

  // The file remains private in Drive; only users with Drive access can open this link.
  return file.getUrl();
}

function cleanCell(value) {
  if (Array.isArray(value)) value = value.join(", ");
  if (value === null || value === undefined) return "";
  // Prevent values beginning with formula characters from being interpreted as formulas.
  var text = String(value);
  return /^[=+@\-]/.test(text) ? "'" + text : text;
}

function jsonResponse(value) {
  return ContentService
    .createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}
