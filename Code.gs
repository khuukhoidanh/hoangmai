// Google Apps Script backend for the Make It Yours website.
// Replace these values with your own Google IDs before deploying.
var SPREADSHEET_ID = "PASTE_YOUR_SPREADSHEET_ID_HERE";
var SHEET_NAME = "Responses";
var DRIVE_FOLDER_ID = "PASTE_YOUR_DRIVE_FOLDER_ID_HERE";

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
  "Photo consent"
];

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error("No submission data received.");
    }

    var data = JSON.parse(e.postData.contents);
    validateSubmission(data);

    var photoUrl = savePhoto(data.photo, data.fullName, data.nick);
    var spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = spreadsheet.getSheetByName(SHEET_NAME) || spreadsheet.insertSheet(SHEET_NAME);

    lock.waitLock(30000);
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS);
      sheet.setFrozenRows(1);
    }

    sheet.appendRow([
      new Date(),
      cleanCell(data.fullName),
      cleanCell(data.nick),
      cleanCell(data.role),
      cleanCell(data.position),
      cleanCell(data.className),
      cleanCell(data.zodiac),
      cleanCell(data.hobbies),
      cleanCell(data.color),
      cleanCell(data.foods),
      photoUrl,
      data.consent === true ? "Yes" : "No"
    ]);

    return jsonResponse({ ok: true });
  } catch (error) {
    return jsonResponse({ ok: false, error: error.message || "Submission failed." });
  } finally {
    if (lock.hasLock()) lock.releaseLock();
  }
}

function validateSubmission(data) {
  if (SPREADSHEET_ID.indexOf("PASTE_") === 0 || DRIVE_FOLDER_ID.indexOf("PASTE_") === 0) {
    throw new Error("Set the Spreadsheet ID and Drive folder ID in Code.gs first.");
  }
  if (!data || !data.fullName || !data.nick || !data.role || !data.zodiac || !data.color) {
    throw new Error("Some required fields are missing.");
  }
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
