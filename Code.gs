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
    if (assignedRole === "admin" || normalizeRole(data.role) !== assignedRole) {
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
    var role = getCellByHeader(row, headers, ["role"]) || "Student";
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
  if (!data || !data.zodiac) missingFields.push("zodiac");
  if (!data || !data.color) missingFields.push("color");
  if (missingFields.length) throw new Error("Some required fields are missing: " + missingFields.join(", ") + ".");
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
