// Google Apps Script backend for MIYO student access and applications.
// Import student-codes.csv into the "StudentCodes" sheet before deployment.
var SPREADSHEET_ID = "PASTE_YOUR_SPREADSHEET_ID_HERE";
var STUDENT_SHEET_NAME = "StudentCodes";
var RESPONSE_SHEET_NAME = "Responses";
var DRIVE_FOLDER_ID = "PASTE_YOUR_DRIVE_FOLDER_ID_HERE";

var RESPONSE_HEADERS = [
  "Access code", "Timestamp", "Full name", "Nickname", "Role", "Position", "Class",
  "Zodiac sign", "Interests", "Favorite color", "Food to try in Taiwan", "Photo URL",
  "Photo consent", "Response JSON"
];

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    if (!e || !e.postData || !e.postData.contents) throw new Error("No request data received.");
    var data = JSON.parse(e.postData.contents);
    var action = data.action || "submit";

    if (action === "login") return jsonResponse(loginStudent(data.code));
    if (action !== "submit") throw new Error("Unknown request.");

    lock.waitLock(30000);
    return jsonResponse(saveSubmission(data));
  } catch (error) {
    return jsonResponse({ ok: false, error: error.message || "Request failed." });
  } finally {
    if (lock.hasLock()) lock.releaseLock();
  }
}

function loginStudent(code) {
  var normalizedCode = normalizeCode(code);
  if (!normalizedCode) throw new Error("Enter your access code.");

  var spreadsheet = openSpreadsheet();
  var student = findStudent(spreadsheet, normalizedCode);
  if (!student) throw new Error("That access code was not found. Please check it with your teacher.");

  var responseSheet = spreadsheet.getSheetByName(RESPONSE_SHEET_NAME);
  var existing = responseSheet ? findResponse(responseSheet, normalizedCode) : null;
  var saved = existing ? readSavedResponse(existing.values, existing.columns) : null;

  return {
    ok: true,
    student: {
      code: normalizedCode,
      fullName: student.fullName,
      role: student.role,
      className: student.className,
      position: student.position,
      response: saved ? saved.response : null,
      photoUrl: saved ? saved.photoUrl : ""
    }
  };
}

function saveSubmission(data) {
  var spreadsheet = openSpreadsheet();
  var code = normalizeCode(data.code);
  if (!code) throw new Error("Please sign in with a valid access code first.");
  var student = findStudent(spreadsheet, code);
  if (!student) throw new Error("Please sign in with a valid access code first.");

  data.fullName = student.fullName;
  data.role = student.role;
  data.position = student.position || data.position || "";
  var sheet = getResponseSheet(spreadsheet);
  var existing = findResponse(sheet, code);
  validateSubmission(data, existing);

  var photoUrl = data.photo ? savePhoto(data.photo, student.fullName, data.nick) :
    (existing ? String(existing.values[existing.columns["Photo URL"]] || "") : "");
  var storedResponse = {};
  Object.keys(data).forEach(function (key) {
    if (key !== "photo" && key !== "action") storedResponse[key] = data[key];
  });
  storedResponse.photoUrl = photoUrl;

  var row = {
    "Access code": code,
    "Timestamp": new Date(),
    "Full name": student.fullName,
    "Nickname": data.nick,
    "Role": student.role,
    "Position": data.position,
    "Class": data.className,
    "Zodiac sign": data.zodiac,
    "Interests": data.hobbies,
    "Favorite color": data.color,
    "Food to try in Taiwan": data.foods,
    "Photo URL": photoUrl,
    "Photo consent": data.consent === true ? "Yes" : "No",
    "Response JSON": JSON.stringify(storedResponse)
  };
  var values = RESPONSE_HEADERS.map(function (header) {
    return row[header] instanceof Date ? row[header] : cleanCell(row[header]);
  });

  if (existing) {
    var updated = existing.values.slice();
    while (updated.length < existing.columns.count) updated.push("");
    RESPONSE_HEADERS.forEach(function (header) {
      updated[existing.columns[header]] = row[header] instanceof Date ? row[header] : cleanCell(row[header]);
    });
    sheet.getRange(existing.rowNumber, 1, 1, existing.columns.count).setValues([updated]);
  } else {
    sheet.appendRow(values);
  }
  return { ok: true, updated: Boolean(existing) };
}

function validateSubmission(data, existing) {
  if (!data || !data.nick || !data.zodiac || !data.color) {
    throw new Error("Some required fields are missing.");
  }
  if (["Teacher", "Interpreter", "Student"].indexOf(data.role) < 0) {
    throw new Error("The role assigned to this access code is invalid.");
  }
  if (data.role === "Teacher" && !data.position) throw new Error("Teacher position is required.");
  if (data.role === "Student" && !data.className) throw new Error("Student class is required.");
  if (!Array.isArray(data.hobbies) || data.hobbies.length === 0) {
    throw new Error("At least one interest is required.");
  }
  if (!Array.isArray(data.foods) || data.foods.length === 0) {
    throw new Error("At least one food choice is required.");
  }
  if (data.consent !== true) throw new Error("Photo consent is required.");
  if (data.photo) {
    if (typeof data.photo !== "string" || data.photo.length > 12 * 1024 * 1024) {
      throw new Error("Photo data is missing or too large.");
    }
  } else if (!existing || !existing.values[existing.columns["Photo URL"]]) {
    throw new Error("Please choose a photo first.");
  }
}

function openSpreadsheet() {
  if (!SPREADSHEET_ID || SPREADSHEET_ID.indexOf("PASTE_") === 0) {
    throw new Error("Set SPREADSHEET_ID in Code.gs first.");
  }
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function findStudent(spreadsheet, code) {
  var sheet = spreadsheet.getSheetByName(STUDENT_SHEET_NAME);
  if (!sheet || sheet.getLastRow() < 2) throw new Error("Student codes are not configured yet.");
  var values = sheet.getDataRange().getValues();
  var columns = headerMap(values[0]);
  ["code", "fullname", "role"].forEach(function (key) {
    if (columns[key] === undefined) throw new Error("StudentCodes sheet needs code, fullName, and role columns.");
  });

  for (var i = 1; i < values.length; i++) {
    if (normalizeCode(values[i][columns.code]) !== code) continue;
    if (columns.active !== undefined && !isActive(values[i][columns.active])) return null;
    var role = normalizeRole(values[i][columns.role]);
    if (!role) throw new Error("Role must be Teacher, Interpreter, or Student in StudentCodes.");
    return {
      fullName: String(values[i][columns.fullname] || "").trim(),
      role: role,
      className: columns.classname === undefined ? "" : String(values[i][columns.classname] || "").trim(),
      position: columns.position === undefined ? "" : String(values[i][columns.position] || "").trim()
    };
  }
  return null;
}

function getResponseSheet(spreadsheet) {
  var sheet = spreadsheet.getSheetByName(RESPONSE_SHEET_NAME) || spreadsheet.insertSheet(RESPONSE_SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, RESPONSE_HEADERS.length).setValues([RESPONSE_HEADERS]);
    sheet.setFrozenRows(1);
  } else {
    var currentHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var present = {};
    currentHeaders.forEach(function (header) { present[String(header)] = true; });
    RESPONSE_HEADERS.forEach(function (header) {
      if (!present[header]) {
        sheet.getRange(1, sheet.getLastColumn() + 1).setValue(header);
        present[header] = true;
      }
    });
  }
  return sheet;
}

function findResponse(sheet, code) {
  if (sheet.getLastRow() < 2 || sheet.getLastColumn() < 1) return null;
  var values = sheet.getDataRange().getValues();
  var columns = {};
  values[0].forEach(function (header, index) { columns[String(header)] = index; });
  if (columns["Access code"] === undefined) return null;
  for (var i = 1; i < values.length; i++) {
    if (normalizeCode(values[i][columns["Access code"]]) === code) {
      columns.count = values[0].length;
      return { rowNumber: i + 1, values: values[i], columns: columns };
    }
  }
  return null;
}

function readSavedResponse(values, columns) {
  var serialized = values[columns["Response JSON"]];
  var response = null;
  if (serialized) {
    try { response = JSON.parse(serialized); } catch (error) { response = null; }
  }
  return {
    response: response,
    photoUrl: String(values[columns["Photo URL"]] || "")
  };
}

function headerMap(headers) {
  var map = {};
  headers.forEach(function (header, index) {
    map[String(header).toLowerCase().replace(/[\s_]+/g, "")] = index;
  });
  return map;
}

function normalizeCode(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, "");
}

function normalizeRole(value) {
  var role = String(value || "").trim().toLowerCase();
  if (role === "teacher" || role === "giáo viên" || role === "giao vien") return "Teacher";
  if (role === "interpreter" || role === "phiên dịch viên" || role === "phien dich vien") return "Interpreter";
  if (role === "student" || role === "học sinh" || role === "hoc sinh") return "Student";
  return "";
}

function isActive(value) {
  var normalized = String(value).trim().toLowerCase();
  return normalized !== "false" && normalized !== "no" && normalized !== "0" && normalized !== "inactive";
}

function savePhoto(dataUrl, fullName, nickname) {
  if (!DRIVE_FOLDER_ID || DRIVE_FOLDER_ID.indexOf("PASTE_") === 0) {
    throw new Error("Set DRIVE_FOLDER_ID in Code.gs first.");
  }
  var match = dataUrl.match(/^data:image\/(jpeg|jpg|png|webp);base64,([\s\S]+)$/i);
  if (!match) throw new Error("The photo format is not supported.");
  var mimeType = match[1].toLowerCase() === "png" ? "image/png" :
    match[1].toLowerCase() === "webp" ? "image/webp" : "image/jpeg";
  var extension = mimeType === "image/png" ? "png" : mimeType === "image/webp" ? "webp" : "jpg";
  var bytes = Utilities.base64Decode(match[2]);
  var safeName = (fullName + "_" + nickname).replace(/[\\/:*?"<>|#%{}~&]/g, "_").substring(0, 80);
  var blob = Utilities.newBlob(bytes, mimeType, safeName + "_" + new Date().getTime() + "." + extension);
  return DriveApp.getFolderById(DRIVE_FOLDER_ID).createFile(blob).getUrl();
}

function cleanCell(value) {
  if (Array.isArray(value)) value = value.join(", ");
  if (value === null || value === undefined) return "";
  var text = String(value);
  return /^[=+@\-]/.test(text) ? "'" + text : text;
}

function jsonResponse(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}
