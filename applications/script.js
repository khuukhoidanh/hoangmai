/* ==========================================================
   script.js - toàn bộ logic của trang (viết bằng jQuery).
   Muốn đổi danh sách lựa chọn: sửa phần "2. DANH SÁCH LỰA CHỌN".
   Đường dẫn gửi dữ liệu được đặt chung trong ../shared/miyo-config.js.
   ========================================================== */
$(function () {

  var language = "en";
  try { language = localStorage.getItem("miyo-language") === "vi" ? "vi" : "en"; } catch (storageError) {}
  var translations = {
    "MAKE IT YOURS · HANOI × KAOHSIUNG 2026": "MAKE IT YOURS · HÀ NỘI × CAO HÙNG 2026",
    "Student access": "Quyền truy cập học sinh", "Enter your personal access code. If it does not work, contact the developer on Zalo: 0335695572.": "Nhập mã truy cập cá nhân. Nếu mã không hoạt động, liên hệ dev qua Zalo: 0335695572.",
    "Access code": "Mã truy cập", "Enter your access code": "Nhập mã truy cập", "Continue": "Tiếp tục", "Checking…": "Đang kiểm tra…", "Could not connect. Please try again.": "Không thể kết nối. Vui lòng thử lại.",
    "Before you begin": "Trước khi bắt đầu", "Please review the privacy notice before starting. You can change the language using the menu below.": "Vui lòng xem thông báo quyền riêng tư trước khi bắt đầu. Bạn có thể đổi ngôn ngữ bằng menu bên dưới.", "MIYO Privacy Notice": "Thông báo quyền riêng tư MIYO",
    "Open the full privacy notice in a new tab": "Mở toàn bộ thông báo quyền riêng tư trong tab mới", "I have read the privacy notice and understand how my information will be used.": "Tôi đã đọc thông báo quyền riêng tư và hiểu thông tin của mình sẽ được sử dụng như thế nào.",
    "Start application": "Bắt đầu điền thông tin", "Language": "Ngôn ngữ", "Choose language": "Chọn ngôn ngữ",
    "Please upload a clear, sharp portrait or close-up showing your upper body (from the waist up), facing the camera. Avoid blurry photos so we can edit it easily.": "Vui lòng tải lên ảnh chân dung hoặc ảnh cận chụp từ nửa thân trên (từ eo trở lên), nhìn về phía máy ảnh. Ảnh cần rõ nét, không bị mờ để thuận tiện cho việc chỉnh sửa.",
    "Invalid code. Contact the developer on Zalo: 0335695572.": "Mã không hợp lệ. Vui lòng liên hệ dev qua Zalo: 0335695572.", "System problem": "Lỗi hệ thống", "Connection lost.": "Mất kết nối mạng.",
    "Connection lost. {code} Please refresh this page when your internet connection returns. The error will be sent automatically. For faster help, contact the developer on Zalo: 0335695572.": "Mất kết nối mạng.{code} Vui lòng tải lại trang khi có kết nối. Lỗi sẽ được tự động gửi đi. Nếu cần hỗ trợ nhanh, liên hệ dev qua Zalo: 0335695572.",
    "A system error occurred. {code} The error is being sent to the developer. For faster help, contact the developer on Zalo: 0335695572.": "Đã xảy ra lỗi hệ thống.{code} Lỗi đang được gửi cho dev. Nếu cần hỗ trợ nhanh, liên hệ dev qua Zalo: 0335695572.",
    "Error code {code} has been sent to the developer. For faster help, contact the developer on Zalo: 0335695572.": "Mã lỗi {code} đã được gửi cho dev. Nếu cần hỗ trợ nhanh, liên hệ dev qua Zalo: 0335695572.",
    "Selected: {count}/{max}": "Đã chọn: {count}/{max}",
    "Make It Yours.": "Dành riêng cho bạn.", "After our exchange in Hanoi, we’d love to know more about you before we meet again in Kaohsiung. It takes about 3 minutes.": "Sau chuyến giao lưu tại Hà Nội, chúng tôi muốn hiểu thêm về bạn trước khi gặp lại ở Cao Hùng. Bạn sẽ mất khoảng 3 phút.", "Who are you?": "Bạn là ai?", "Tell us what to call you.": "Hãy cho chúng tôi biết nên gọi bạn là gì.",
    "Full name": "Họ và tên", "(Please enter your real full name)": "(vui lòng nhập họ và tên thật)", "Your Nick Name": "Biệt danh", "(Recommended: 5–12 characters)": "(khuyến khích 5–12 ký tự)", "Your role": "Vai trò của bạn", "Your position": "Chức vụ", "Your grade / class": "Khối / lớp của bạn", "Gender": "Giới tính", "Male": "Nam", "Female": "Nữ", "Zodiac sign": "Cung hoàng đạo",
    "Please complete the highlighted required fields before continuing.": "Vui lòng hoàn thành các mục bắt buộc được tô nổi bật để tiếp tục.", "Couldn’t submit. Check your connection and press Submit again. Your answers are still here.": "Chưa thể gửi. Hãy kiểm tra kết nối rồi nhấn Gửi lại. Câu trả lời của bạn vẫn được giữ lại.", "Sending…": "Đang gửi…",
    "Your favorites": "Những điều bạn yêu thích", "Quick picks. There are no right or wrong answers.": "Chọn nhanh nhé. Không có câu trả lời đúng hay sai.", "Interests": "Sở thích", "choose up to 3": "chọn tối đa 3", "Other: anything else you love?": "Khác: bạn còn yêu thích điều gì?", "The color that feels most like you": "Màu sắc thể hiện con người bạn", "What kind of food would you like to try in Taiwan?": "Bạn muốn thử món gì ở Đài Loan?", "Choose up to 3": "Chọn tối đa 3", "Other: what would you like to try?": "Khác: bạn muốn thử món gì?", "Selected: 0/3": "Đã chọn: 0/3", "Visual style you like": "Phong cách hình ảnh bạn thích",
    "Things to avoid": "Những điều cần tránh", "So we can plan a comfortable trip for you. Skip anything that doesn’t apply.": "Để chúng tôi chuẩn bị chuyến đi thoải mái cho bạn. Có thể bỏ qua mục không phù hợp.", "Allergies or dietary needs": "Dị ứng hoặc chế độ ăn", "Other: please describe": "Khác: vui lòng mô tả", "Foods you don’t like": "Những món bạn không thích", "Other: which foods?": "Khác: món nào?", "Places or activities you’d rather skip": "Địa điểm hoặc hoạt động bạn muốn tránh", "Other: where or what?": "Khác: địa điểm hoặc hoạt động nào?",
    "A photo of you": "Ảnh của bạn", "A clear, well-lit photo looking straight at the camera.": "Ảnh rõ nét, đủ sáng, nhìn thẳng vào máy ảnh.", "Tap to choose a photo": "Chạm để chọn ảnh", "Your selected photo": "Ảnh bạn đã chọn", "I agree to let the Trường Trung Sơn team use and edit this photo. It will only be used internally.": "Tôi đồng ý để nhóm Trường Trung Sơn sử dụng và chỉnh sửa ảnh này. Ảnh chỉ được sử dụng nội bộ.",
    "Review": "Xem lại", "Does everything look right? You can edit any part.": "Mọi thông tin đã chính xác chưa? Bạn có thể chỉnh sửa bất kỳ mục nào.", "Thank you.": "Cảm ơn bạn.", "See you in Kaohsiung.": "Hẹn gặp bạn tại Cao Hùng.", "Back": "Quay lại", "Start": "Bắt đầu", "Continue": "Tiếp tục", "Submit": "Gửi", "Step": "Bước",
    "Teacher": "Giáo viên", "Interpreter": "Phiên dịch viên", "Student": "Học sinh", "Other": "Khác", "Minimal": "Tối giản", "Clean, lots of space": "Gọn gàng, thoáng đãng", "Vibrant": "Rực rỡ", "Bold, high-contrast color": "Màu sắc nổi bật, tương phản cao", "Nostalgic": "Hoài niệm", "Warm tones, like old film": "Tông ấm như phim cũ", "Dreamy": "Mơ màng", "Soft, light, pastel": "Nhẹ nhàng, tông pastel",
    "Role": "Vai trò", "Position": "Chức vụ", "Class": "Lớp", "Gender": "Giới tính", "Male": "Nam", "Female": "Nữ", "Favorite color": "Màu yêu thích", "Style": "Phong cách", "Food to try in Taiwan": "Món muốn thử ở Đài Loan", "Allergies / dietary needs": "Dị ứng / chế độ ăn", "Foods you dislike": "Món không thích", "Places to skip": "Địa điểm muốn tránh", "Not provided": "Chưa cung cấp", "None": "Không có", "Edit details": "Chỉnh sửa thông tin", "Edit favorites": "Sửa sở thích", "Change photo": "Đổi ảnh",
    "Aries": "Bạch Dương", "Taurus": "Kim Ngưu", "Gemini": "Song Tử", "Cancer": "Cự Giải", "Leo": "Sư Tử", "Virgo": "Xử Nữ", "Libra": "Thiên Bình", "Scorpio": "Bọ Cạp", "Sagittarius": "Nhân Mã", "Capricorn": "Ma Kết", "Aquarius": "Bảo Bình", "Pisces": "Song Ngư",
    "Music": "Âm nhạc", "Drawing": "Vẽ", "Reading": "Đọc sách", "Gaming": "Chơi trò chơi", "Sports": "Thể thao", "Photography": "Nhiếp ảnh", "Cooking": "Nấu ăn", "Travel": "Du lịch", "Movies": "Xem phim", "Dancing": "Nhảy", "Tech": "Công nghệ", "Fashion": "Thời trang",
    "Hot Pot": "Lẩu", "BBQ / Grilled Meat": "Thịt nướng", "Noodles": "Mì", "Rice Dishes": "Các món cơm", "Dumplings": "Bánh bao / há cảo", "Fried Chicken": "Gà rán", "Sushi": "Sushi", "Curry": "Cà ri", "Taiwanese Street Food": "Ẩm thực đường phố Đài Loan", "Western Food": "Món Âu", "Desserts": "Món tráng miệng", "Bubble Tea": "Trà sữa"
  };
  var reverseTranslations = {};
  Object.keys(translations).forEach(function (english) { reverseTranslations[translations[english]] = english; });

  function tr(text) {
    text = String(text === undefined || text === null ? "" : text);
    if (language === "vi") return translations[text] || text.split(", ").map(function (part) { return translations[part] || part; }).join(", ");
    return reverseTranslations[text] || text.split(", ").map(function (part) { return reverseTranslations[part] || part; }).join(", ");
  }

  function captureEnglishText() {
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    var node;
    while ((node = walker.nextNode())) node.__miyoEnglishText = node.nodeValue;
    $("[placeholder], [aria-label], [title]").each(function () {
      this.__miyoEnglishAttributes = {};
      ["placeholder", "aria-label", "title"].forEach(function (attribute) {
        if (this.hasAttribute(attribute)) this.__miyoEnglishAttributes[attribute] = this.getAttribute(attribute);
      }, this);
    });
  }

  function localizedStaticText(englishText) {
    var trimmed = englishText.trim();
    if (!trimmed) return englishText;
    var translated = language === "vi" ? (translations[trimmed] || trimmed) : (reverseTranslations[trimmed] || trimmed);
    var start = englishText.indexOf(trimmed);
    return englishText.slice(0, start) + translated + englishText.slice(start + trimmed.length);
  }

  function applyLanguage(nextLanguage) {
    language = nextLanguage === "vi" ? "vi" : "en";
    document.documentElement.lang = language;
    try { localStorage.setItem("miyo-language", language); } catch (storageError) {}

    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    var node;
    while ((node = walker.nextNode())) {
      if (node.__miyoEnglishText !== undefined) node.nodeValue = localizedStaticText(node.__miyoEnglishText);
    }
    $("[placeholder], [aria-label], [title]").each(function () {
      var originals = this.__miyoEnglishAttributes || {};
      Object.keys(originals).forEach(function (attribute) {
        this.setAttribute(attribute, tr(originals[attribute]));
      }, this);
    });
    $(".chips .chip").each(function () { $(this).text(tr($(this).data("value"))); });
    $("#hobbiesCount").text(tr("Selected: {count}/{max}").replace("{count}", data.hobbies.length).replace("{max}", 3));
    $("#foodsCount").text(tr("Selected: {count}/{max}").replace("{count}", data.foods.length).replace("{max}", 3));
    $("#languageSelect").val(language);
    $(".privacy-full-link").attr("href", "privacy.html?lang=" + language);
    if (currentStep === REVIEW_STEP) buildReview();
    $("#stepLabel").text(currentStep > 0 && currentStep < SUCCESS_STEP ? tr("Step") + " " + currentStep + "/" + REVIEW_STEP : "");
    $("#backBtn").text(tr("Back"));
    $("#nextBtn").text(tr(currentStep === 0 ? "Start" : currentStep === REVIEW_STEP ? "Submit" : "Continue"));
    refreshErrorBannerLanguage();
    sendLanguageToPrivacyFrame();
  }

  /* ---------- 1. CÀI ĐẶT ---------- */
  var SCRIPT_URL = window.MIYO_CONFIG.scriptUrl;
  var REVIEW_STEP = 4;    // bước xem lại
  var SUCCESS_STEP = 5;   // bước cảm ơn

  /* ---------- 2. DANH SÁCH LỰA CHỌN ---------- */
  var OPTIONS = {
    roles:     ["Teacher", "Interpreter", "Student"],
    gender:    ["Male", "Female"],
    zodiac:    ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"],
    hobbies:   ["Music", "Drawing", "Reading", "Gaming", "Sports", "Photography", "Cooking", "Travel", "Movies", "Dancing", "Tech", "Fashion"],
    foods:     ["Hot Pot", "BBQ / Grilled Meat", "Noodles", "Rice Dishes", "Dumplings", "Fried Chicken", "Sushi", "Curry", "Taiwanese Street Food", "Western Food", "Desserts", "Bubble Tea"],
    colors:    ["#e63946", "#ff7a1a", "#f5c518", "#2bb673", "#14b8c4", "#2a3cff", "#7b3fe4", "#ff5fa2", "#12171f", "#f3f4f1"]
  };

  /* ---------- 3. CÂU TRẢ LỜI CỦA NGƯỜI DÙNG ---------- */
  var data = {
    loginCode: "", fullName: "", nick: "", gender: "",
    role: "", position: "", className: "",
    zodiac: "",
    hobbies: [], hobbyOther: "",
    color: "",
    foods: [], foodOther: "",
    photo: "", photoUrl: "", photoPreview: "", consent: false
  };
  var currentStudent = null;
  var currentStep = 0;
  var sending = false;
  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  captureEnglishText();

  /* ---------- 4. HÀM TIỆN ÍCH ---------- */

  // Lấy danh sách đã chọn, thay "Other" bằng chữ người dùng gõ
  function finalList(key, otherKey) {
    var list = $.grep(data[key], function (v) { return v !== "Other"; });
    if (data[key].indexOf("Other") > -1 && data[otherKey]) {
      list.push(data[otherKey]);
    }
    return list;
  }

  function showMessage(selector, text) {
    $(selector).text(text).prop("hidden", false);
  }

  var ERROR_QUEUE_KEY = "miyo-pending-system-errors";
  var currentAction = "page";
  var errorBanner = null;
  var errorBannerState = null;

  function errorDetails(message, stack, status) {
    return {
      code: "ERR-" + new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 8) + "-" + Math.random().toString(36).slice(2, 6).toUpperCase(),
      page: location.pathname,
      action: currentAction,
      message: String(message || "Unknown system error").slice(0, 500),
      stack: String(stack || "").slice(0, 1500),
      status: status || "",
      userAgent: navigator.userAgent
    };
  }

  function refreshErrorBannerLanguage() {
    if (!errorBanner || !errorBannerState) return;
    var codeText = errorBannerState.code ? " (" + errorBannerState.code + ")" : "";
    var message = errorBannerState.offline
      ? tr("Connection lost. {code} Please refresh this page when your internet connection returns. The error will be sent automatically. For faster help, contact the developer on Zalo: 0335695572.")
      : errorBannerState.sent
        ? tr("Error code {code} has been sent to the developer. For faster help, contact the developer on Zalo: 0335695572.")
        : tr("A system error occurred. {code} The error is being sent to the developer. For faster help, contact the developer on Zalo: 0335695572.");
    errorBanner.querySelector(".system-error-text").textContent = message.replace("{code}", codeText);
  }

  function sendLanguageToPrivacyFrame() {
    var frame = document.getElementById("privacyFrame");
    if (frame && frame.contentWindow) {
      frame.contentWindow.postMessage({ type: "miyo-language", language: language }, location.origin);
    }
  }

  function showSystemError(offline, errorCode) {
    if (!errorBanner) {
      errorBanner = document.createElement("aside");
      errorBanner.className = "system-error-banner";
      errorBanner.setAttribute("role", "alert");
      errorBanner.innerHTML = '<strong></strong><p class="system-error-text"></p><button type="button" class="system-error-refresh"></button>';
      document.body.appendChild(errorBanner);
      errorBanner.querySelector(".system-error-refresh").addEventListener("click", function () { location.reload(); });
    }
    errorBanner.querySelector("strong").textContent = tr("System problem");
    errorBanner.querySelector(".system-error-refresh").textContent = tr("Refresh page");
    errorBannerState = { offline: Boolean(offline), code: errorCode || "", sent: false };
    refreshErrorBannerLanguage();
    errorBanner.hidden = false;
  }

  function getQueuedErrors() {
    try { return JSON.parse(localStorage.getItem(ERROR_QUEUE_KEY) || "[]"); }
    catch (error) { return []; }
  }

  function queueError(report) {
    try {
      var queue = getQueuedErrors();
      if (!queue.some(function (entry) { return entry.code === report.code; })) queue.push(report);
      localStorage.setItem(ERROR_QUEUE_KEY, JSON.stringify(queue.slice(-10)));
    } catch (error) {
      // Reporting must never interrupt the student's form.
    }
  }

  function sendQueuedErrors() {
    if (!navigator.onLine) return;
    var queue = getQueuedErrors();
    if (!queue.length) return;
    var report = queue[0];
    $.ajax({
      url: SCRIPT_URL,
      method: "POST",
      data: JSON.stringify({ action: "reportError", error: report }),
      contentType: "text/plain;charset=utf-8",
      dataType: "json",
      timeout: 20000
    }).done(function (result) {
      if (!result || !result.ok) return;
      try { localStorage.setItem(ERROR_QUEUE_KEY, JSON.stringify(getQueuedErrors().filter(function (entry) { return entry.code !== report.code; }))); }
      catch (error) { return; }
      if (getQueuedErrors().length) sendQueuedErrors();
       else if (errorBanner) {
         errorBannerState = { offline: false, code: report.code, sent: true };
         refreshErrorBannerLanguage();
       }
    });
  }

  function reportSystemError(message, stack, status) {
    var report = errorDetails(message, stack, status);
    queueError(report);
    showSystemError(!navigator.onLine, report.code);
    sendQueuedErrors();
  }

  window.addEventListener("online", sendQueuedErrors);
  window.addEventListener("offline", function () { showSystemError(true); });
  window.addEventListener("error", function (event) {
    reportSystemError(event.message || "Unhandled browser error", event.error && event.error.stack);
  });
  window.addEventListener("unhandledrejection", function (event) {
    var reason = event.reason;
    reportSystemError(reason && reason.message || String(reason || "Unhandled promise rejection"), reason && reason.stack);
  });
  sendQueuedErrors();

  // Chọn 1 nút duy nhất (role, zodiac)
  function buildSingleChips($box, list, key, onPick) {
    $.each(list, function (i, text) {
      $("<button>", { type: "button", "class": "chip", text: tr(text), "aria-pressed": "false" }).data("value", text)
        .on("click", function () {
          if (key === "role" && currentStudent && currentStudent.roleLocked && data.role === currentStudent.role) return;
          var value = $(this).data("value");
          data[key] = (data[key] === value) ? "" : value;   // bấm lại để bỏ chọn
          $box.children().each(function () {
            $(this).attr("aria-pressed", $(this).data("value") === data[key]);
          });
          if (onPick) { onPick(); }
          refreshNext();
        })
        .appendTo($box);
    });
  }

  // Chọn nhiều nút (tối đa max), có thêm nút "Other"
  function buildMultiChips($box, list, key, otherKey, max) {
    var $other = $("#" + otherKey);
    $.each(list.concat(["Other"]), function (i, text) {
      $("<button>", { type: "button", "class": "chip", text: tr(text), "aria-pressed": "false" }).data("value", text)
        .on("click", function () {
          var picked = data[key];
          var pos = picked.indexOf(text);
          if (pos > -1) { picked.splice(pos, 1); }              // bỏ chọn
          else if (picked.length < max) { picked.push(text); }  // chọn thêm

          $box.children().each(function () {
            $(this).attr("aria-pressed", picked.indexOf($(this).data("value")) > -1);
          });
          $other.prop("hidden", picked.indexOf("Other") < 0);   // hiện ô điền khi chọn Other
          if (!$other.prop("hidden")) { $other.focus(); }
          $("#" + key + "Count").text(tr("Selected: {count}/{max}").replace("{count}", picked.length).replace("{max}", max));
          refreshNext();
        })
        .appendTo($box);
    });
  }

  /* ---------- 5. TẠO CÁC LỰA CHỌN TRÊN TRANG ---------- */

  // Role: Interpreter không cần điền thêm, Teacher hỏi chức vụ, Student hỏi lớp
  buildSingleChips($("#roleChips"), OPTIONS.roles, "role", function () {
    $("#teacherBox").prop("hidden", data.role !== "Teacher");
    $("#studentBox").prop("hidden", data.role !== "Student");
    if (data.role !== "Teacher") { data.position = "";  $("#position").val(""); }
    if (data.role !== "Student") { data.className = ""; $("#className").val(""); }
  });

  buildSingleChips($("#genderChips"), OPTIONS.gender, "gender");

  buildSingleChips($("#zodiacChips"), OPTIONS.zodiac, "zodiac");

  buildMultiChips($("#hobbiesChips"),   OPTIONS.hobbies,   "hobbies",   "hobbyOther",   3);
  buildMultiChips($("#foodsChips"),     OPTIONS.foods,     "foods",     "foodOther",    3);

  // Màu: các ô màu có sẵn + ô chọn màu tự do
  var $colors = $("#colors");

  function pickColor(color) {
    data.color = color;
    $colors.find("button").each(function () {
      $(this).attr("aria-pressed", $(this).data("color") === color);
    });
    refreshNext();
  }

  $.each(OPTIONS.colors, function (i, color) {
    $("<button>", { type: "button", "aria-label": "Color " + color, "aria-pressed": "false" })
      .css("background", color)
      .data("color", color)
      .on("click", function () {
        $("#customColor").removeClass("set");
        pickColor(color);
      })
      .appendTo($colors);
  });

  $("<input>", { type: "color", id: "customColor", value: "#2a3cff", "aria-label": "Choose another color" })
    .on("input", function () {
      $(this).addClass("set");
      pickColor(this.value);
    })
    .appendTo($colors);

  $("<p>", { "class": "hint", text: "Don’t see your color? Tap the rainbow circle to pick any color you like." })
    .insertAfter($colors);

  function applyStudentProfile(student) {
    var saved = student.response || null;
    var assignedRole = student.role || "";
    var lockedRole = assignedRole === "Student" || assignedRole === "Teacher" ? assignedRole : "";
    currentStudent = { code: student.code, response: saved, role: lockedRole, roleLocked: Boolean(lockedRole) };
    data.loginCode = student.code;
    data.fullName = "";
    data.nick = "";
    data.role = "";
    data.position = "";
    data.className = "";
    data.zodiac = "";
    data.hobbies = [];
    data.hobbyOther = "";
    data.color = "";
    data.foods = [];
    data.foodOther = "";
    data.photo = "";
    data.photoUrl = "";
    data.consent = false;

    $("#fullName").val(data.fullName).prop("readonly", true);
    $("#nick").val(data.nick);
    $("#className").val(data.className);
    $("#position").val(data.position);
    $("#roleChips .chip").each(function () {
      var selected = $(this).data("value") === data.role;
      $(this).attr("aria-pressed", selected ? "true" : "false").prop("hidden", !selected);
    });
    $("#teacherBox").prop("hidden", data.role !== "Teacher");
    $("#studentBox").prop("hidden", data.role !== "Student");
    $("#zodiacChips .chip").each(function () {
      $(this).attr("aria-pressed", $(this).data("value") === data.zodiac ? "true" : "false");
    });
    [["hobbiesChips", data.hobbies], ["foodsChips", data.foods]].forEach(function (entry) {
      $("#" + entry[0] + " .chip").each(function () {
        $(this).attr("aria-pressed", entry[1].indexOf($(this).data("value")) > -1 ? "true" : "false");
      });
    });
    $("#hobbyOther").val(data.hobbyOther).prop("hidden", data.hobbies.indexOf("Other") < 0);
    $("#foodOther").val(data.foodOther).prop("hidden", data.foods.indexOf("Other") < 0);
    $("#hobbiesCount").text(tr("Selected: {count}/{max}").replace("{count}", data.hobbies.length).replace("{max}", 3));
    $("#foodsCount").text(tr("Selected: {count}/{max}").replace("{count}", data.foods.length).replace("{max}", 3));
    $colors.find("button").each(function () {
      $(this).attr("aria-pressed", $(this).data("color") === data.color ? "true" : "false");
    });
    if (data.color && OPTIONS.colors.indexOf(data.color) < 0) {
      $("#customColor").val(data.color).addClass("set");
    } else {
      $("#customColor").removeClass("set");
    }
    $("#consent").prop("checked", data.consent);
    if (data.photoUrl) {
      $("#preview").attr("src", data.photoUrl).prop("hidden", false);
      $("#dropText").hide();
    } else {
      $("#preview").attr("src", "").prop("hidden", true);
      $("#dropText").show();
    }
    // StudentCodes only validates the access code; every response field starts blank.
    data.fullName = data.nick = data.role = data.position = data.className = "";
    data.gender = "";
    data.zodiac = data.color = data.hobbyOther = data.foodOther = "";
    data.hobbies = [];
    data.foods = [];
    data.photo = data.photoUrl = data.photoPreview = "";
    data.consent = false;
    $("#fullName, #nick, #className, #position, #hobbyOther, #foodOther")
      .val("").prop("readonly", false);
    $("#roleChips .chip, #genderChips .chip, #zodiacChips .chip, #hobbiesChips .chip, #foodsChips .chip, .sw button")
      .attr("aria-pressed", "false").prop("hidden", false);
    $("#teacherBox, #studentBox, #hobbyOther, #foodOther").prop("hidden", true);
    $("#hobbiesCount, #foodsCount").text(tr("Selected: {count}/{max}").replace("{count}", 0).replace("{max}", 3));
    $("#customColor").val("#2a3cff").removeClass("set");
    $("#consent").prop("checked", false);
    $("#photoInput").val("");
    $("#preview").attr("src", "").prop("hidden", true);
    $("#dropText").show();

    if (saved) {
      data.fullName = saved.fullName || "";
      data.nick = saved.nick || "";
      data.role = lockedRole || saved.role || "";
      data.gender = saved.gender || "";
      data.position = saved.position || "";
      data.className = saved.className || "";
      data.zodiac = saved.zodiac || "";
      data.hobbies = Array.isArray(saved.hobbies) ? saved.hobbies.slice() : [];
      data.hobbyOther = saved.hobbyOther || "";
      data.color = saved.color || "";
      data.foods = Array.isArray(saved.foods) ? saved.foods.slice() : [];
      data.foodOther = saved.foodOther || "";
      data.photoUrl = saved.photoUrl || "";
      data.photoPreview = saved.photoDataUrl || "";
      data.consent = saved.consent === true;

      $("#fullName").val(data.fullName);
      $("#nick").val(data.nick);
      $("#className").val(data.className);
      $("#position").val(data.position);
      $("#roleChips .chip, #genderChips .chip, #zodiacChips .chip, #hobbiesChips .chip, #foodsChips .chip").each(function () {
        var key = $(this).closest("#roleChips").length ? "role" :
          $(this).closest("#genderChips").length ? "gender" :
          $(this).closest("#zodiacChips").length ? "zodiac" :
          $(this).closest("#hobbiesChips").length ? "hobbies" : "foods";
        var selected = key === "role" || key === "gender" || key === "zodiac"
          ? data[key] === $(this).data("value")
          : data[key].indexOf($(this).data("value")) !== -1;
        $(this).attr("aria-pressed", selected ? "true" : "false").prop("hidden", false);
      });
      $("#teacherBox").prop("hidden", data.role !== "Teacher");
      $("#studentBox").prop("hidden", data.role !== "Student");
      $("#hobbyOther").val(data.hobbyOther).prop("hidden", data.hobbies.indexOf("Other") === -1);
      $("#foodOther").val(data.foodOther).prop("hidden", data.foods.indexOf("Other") === -1);
      $("#hobbiesCount").text(tr("Selected: {count}/{max}").replace("{count}", data.hobbies.length).replace("{max}", 3));
      $("#foodsCount").text(tr("Selected: {count}/{max}").replace("{count}", data.foods.length).replace("{max}", 3));
      $colors.find("button").each(function () {
        $(this).attr("aria-pressed", $(this).data("color") === data.color ? "true" : "false");
      });
      if (data.color && OPTIONS.colors.indexOf(data.color) === -1) {
        $("#customColor").val(data.color).addClass("set");
      }
      $("#consent").prop("checked", data.consent);
      if (data.photoPreview || data.photoUrl) {
        $("#preview").attr("src", data.photoPreview || data.photoUrl).prop("hidden", false);
        $("#dropText").hide();
      }
    }
    // Lock the role to the value assigned in StudentCodes.
    if (lockedRole) data.role = lockedRole;
    $("#roleChips .chip").each(function () {
      var selected = $(this).data("value") === data.role;
      $(this).attr("aria-pressed", selected ? "true" : "false").prop("hidden", lockedRole ? !selected : false);
    });
    $("#teacherBox").prop("hidden", data.role !== "Teacher");
    $("#studentBox").prop("hidden", data.role !== "Student");
    $("#className").val(data.role === "Student" ? data.className : "");
    $("#position").val(data.role === "Teacher" ? data.position : "");
    refreshNext();
  }

  $("#languageSelect").on("change", function () { applyLanguage(this.value); });
  $("#privacyFrame").on("load", sendLanguageToPrivacyFrame);
  $("#privacyAgree").on("change", function () {
    $("#startApplication").prop("disabled", !this.checked);
  });
  $("#startApplication").on("click", function () {
    if (!$("#privacyAgree").prop("checked")) return;
    $("#privacyScreen").prop("hidden", true);
    $(".bar, .wrap").prop("hidden", false);
    $("#nextBtn").prop("hidden", false);
    showStep(currentStudent && currentStudent.response ? REVIEW_STEP : 0);
  });

  $("#loginForm").on("submit", function (event) {
    event.preventDefault();
    var code = $.trim($("#accessCode").val()).toLowerCase();
    if (!code) { return; }
    $("#loginMsg").prop("hidden", true);
    currentAction = "student-login";
    $("#loginBtn").prop("disabled", true).attr("aria-busy", "true").text("Checking…");
    $.ajax({
      url: SCRIPT_URL,
      method: "POST",
      data: JSON.stringify({ action: "login", code: code }),
      contentType: "text/plain;charset=utf-8",
      dataType: "json",
      timeout: 30000
    }).done(function (res) {
      if (res && res.ok && res.student) {
        if (res.student.role === "Admin") {
          sessionStorage.setItem("miyo-admin-code", res.student.code);
          window.location.assign("../neededaccess/admin.html");
          return;
        }
        applyStudentProfile(res.student);
        $("#loginScreen").prop("hidden", true);
        $("#privacyScreen").prop("hidden", false);
        $("#nav").prop("hidden", false);
        $("#backBtn, #nextBtn").prop("hidden", true);
        $("#privacyAgree").prop("checked", false);
        $("#startApplication").prop("disabled", true);
        sendLanguageToPrivacyFrame();
      } else {
        var loginError = res && res.error;
        if (res && res.type === "SYSTEM_ERROR") reportSystemError(loginError || "Student login backend failed");
        $("#loginMsg").text(loginError || "Invalid code. Contact the developer on Zalo: 0335695572.").prop("hidden", false);
      }
    }).fail(function (xhr, status, error) {
      reportSystemError(error || status || "Student login request failed", "", xhr && xhr.status);
      $("#loginMsg").text("Could not connect. Please try again.").prop("hidden", false);
    }).always(function () {
      $("#loginBtn").prop("disabled", false).attr("aria-busy", "false").html("Continue <span aria-hidden='true'>↗</span>");
    });
  });

  /* ---------- 6. Ô NHẬP CHỮ, ẢNH, ĐỒNG Ý ---------- */

  // Mọi ô chữ có id trùng tên với data (fullName, nick, position, className, ...Other)
  $(".wrap input[type=text]").on("input", function () {
    data[this.id] = $.trim(this.value);
    refreshNext();
  });

  $("#photoInput").on("change", function () {
    var file = this.files[0];
    $("#photoMsg").prop("hidden", true);
    if (!file) { return; }
    if (file.size > 15 * 1024 * 1024) {
      showMessage("#photoMsg", "That photo is too large. Please choose one under 15 MB.");
      return;
    }
    var reader = new FileReader();
    reader.onload = function () {
      data.photo = reader.result;
      $("#preview").attr("src", reader.result).prop("hidden", false);
      $("#dropText").hide();
      refreshNext();
    };
    reader.onerror = function () {
      showMessage("#photoMsg", "Couldn’t read that photo. Please try another one.");
    };
    reader.readAsDataURL(file);
  });

  // Cho phép dùng bàn phím (Enter / Space) để mở chọn ảnh
  $("#drop").on("keydown", function (e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      $("#photoInput").trigger("click");
    }
  });

  $("#consent").on("change", function () {
    data.consent = this.checked;
    refreshNext();
  });

  /* ---------- 7. KIỂM TRA & CHUYỂN BƯỚC ---------- */

  // Kiểm tra dữ liệu khi người dùng nhấn Continue.
  function isValid(step) {
    switch (step) {
      case 1:
        return data.fullName && data.nick && data.role && data.gender && data.zodiac &&
               (data.role !== "Teacher" || data.position) &&
               (data.role !== "Student" || data.className);
      case 2:
        return finalList("hobbies", "hobbyOther").length > 0 &&
               data.color &&
               finalList("foods", "foodOther").length > 0;
      case 3:
        return (data.photo || data.photoUrl) && data.consent;
      case REVIEW_STEP:
        return !sending;
      default:
        return true;
    }
  }

  function refreshNext() {
    $("#nextBtn").prop("disabled", currentStep === REVIEW_STEP && sending);
  }

  var validationShown = false;

  function clearValidationHighlights() {
    $(".invalid-label").removeClass("invalid-label").removeAttr("aria-invalid");
    $("[aria-invalid='true']").removeAttr("aria-invalid");
    if (validationShown && !isValid(currentStep)) {
      highlightMissing(false);
    } else {
      validationShown = false;
      $("#validationMsg").prop("hidden", true);
    }
  }

  $(document).on("click change", ".chip, #colors button, #customColor, #photoInput, #consent", clearValidationHighlights);
  $(".wrap input[type=text]").on("input", clearValidationHighlights);

  function highlightMissing(shouldFocus) {
    if (shouldFocus === undefined) shouldFocus = true;
    $(".invalid-label").removeClass("invalid-label");
    validationShown = true;
    $("#validationMsg").text(tr("Please complete the highlighted required fields before continuing.")).prop("hidden", false);
    var $firstMissing = $();
    function mark(selector) {
      $(selector).each(function () {
        var $item = $(this);
        if (!$firstMissing.length) $firstMissing = $item;
        if ($item.is("input")) $item.attr("aria-invalid", "true").closest("label").addClass("invalid-label");
        if ($item.is("#drop")) $item.attr("aria-invalid", "true");
        var $group = $item.closest(".grp");
        if ($group.length) {
          $group.children("b").addClass("invalid-label");
          $item.attr("aria-invalid", "true");
        }
        if ($item.hasClass("ck")) $item.addClass("invalid-label").attr("aria-invalid", "true");
      });
    }
    if (currentStep === 1) {
      if (!data.fullName) mark("#fullName");
      if (!data.nick) mark("#nick");
      if (!data.role) mark("#roleChips");
      if (!data.gender) mark("#genderChips");
      if (data.role === "Teacher" && !data.position) mark("#position");
      if (data.role === "Student" && !data.className) mark("#className");
      if (!data.zodiac) mark("#zodiacChips");
    } else if (currentStep === 2) {
      if (!finalList("hobbies", "hobbyOther").length) {
        mark(data.hobbies.indexOf("Other") > -1 ? "#hobbyOther" : "#hobbiesChips");
      }
      if (!data.color) mark("#colors");
      if (!finalList("foods", "foodOther").length) {
        mark(data.foods.indexOf("Other") > -1 ? "#foodOther" : "#foodsChips");
      }
    } else if (currentStep === 3) {
      if (!data.photo && !data.photoUrl) mark("#drop");
      if (!data.consent) mark(".ck");
    }
    if (shouldFocus && $firstMissing.length) {
      var focusTarget = $firstMissing;
      if ($firstMissing.is(".grp") || $firstMissing.is("#roleChips, #genderChips, #zodiacChips, #hobbiesChips, #foodsChips, #colors")) {
        focusTarget = $firstMissing.find("button").first();
      } else if ($firstMissing.is(".ck")) {
        focusTarget = $firstMissing.find("input").first();
      }
      var focusElement = focusTarget.get(0);
      if (focusElement) {
        focusElement.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "center" });
        if (typeof focusElement.focus === "function") focusElement.focus({ preventScroll: true });
      }
    }
  }

  function showStep(n) {
    currentStep = n;
    $(".step").removeClass("on").filter("[data-step='" + n + "']").addClass("on");
    $("#progress").css("width", (n / SUCCESS_STEP * 100) + "%");
    $("#stepLabel").text(n > 0 && n < SUCCESS_STEP ? tr("Step") + " " + n + "/" + REVIEW_STEP : "");
    $(".bar").attr("aria-valuenow", Math.min(n, SUCCESS_STEP));
    $("#backBtn").prop("hidden", n === 0 || n === SUCCESS_STEP);
    $("#nav").prop("hidden", n === SUCCESS_STEP);
    $("#nextBtn").text(tr(n === 0 ? "Start" : n === REVIEW_STEP ? "Submit" : "Continue"));
    $("#nextBtn").attr("aria-busy", "false");
    if (n === REVIEW_STEP) { buildReview(); }
    refreshNext();
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
  }

  $("#nextBtn").on("click", function () {
    if (currentStep === REVIEW_STEP) { submitForm(); }
    else if (isValid(currentStep)) { clearValidationHighlights(); showStep(currentStep + 1); }
    else { highlightMissing(); }
  });
  $("#backBtn").on("click", function () { showStep(currentStep - 1); });

  applyLanguage(language);

  /* ---------- 8. MÀN REVIEW ---------- */
  function buildReview() {
    var $review = $("#review").empty();
    if (data.photo || data.photoPreview || data.photoUrl) {
      $("<img>", { src: data.photo || data.photoPreview || data.photoUrl, alt: "Your photo" }).appendTo($review);
    }

    var rows = [
      ["Full name", data.fullName],
      ["Your Nick Name", data.nick],
      ["Role", data.role],
      ["Gender", data.gender]
    ];
    if (data.role === "Teacher") { rows.push(["Position", data.position]); }
    if (data.role === "Student") { rows.push(["Class", data.className]); }
    rows.push(
      ["Zodiac sign", data.zodiac],
      ["Interests", finalList("hobbies", "hobbyOther").join(", ")],
      ["Favorite color", data.color],
      ["Food to try in Taiwan", finalList("foods", "foodOther").join(", ") || "Not provided"]
    );

    var $list = $("<dl>").appendTo($review);
    $.each(rows, function (i, row) {
      $("<dt>", { text: tr(row[0]) }).appendTo($list);
      var $value = $("<dd>", { text: tr(row[1]) }).appendTo($list);   // .text() để an toàn
      if (row[0] === "Favorite color") {
        $("<span>", { "class": "dot" }).css("background", data.color).prependTo($value);
      }
    });

    $("<button>", { type: "button", "class": "e", text: tr("Edit details") })
      .on("click", function () { showStep(1); }).appendTo($review);
    $("<button>", { type: "button", "class": "e", text: tr("Edit favorites") })
      .on("click", function () { showStep(2); }).appendTo($review);
    $("<button>", { type: "button", "class": "e", text: tr("Change photo") })
      .on("click", function () { showStep(3); }).appendTo($review);
  }

  /* ---------- 9. GỬI DỮ LIỆU VỀ GOOGLE SHEET ---------- */

  // Thu nhỏ ảnh (tối đa 1400px) để gửi nhanh hơn
  function resizePhoto(onDone, onError) {
    var img = new Image();
    img.onload = function () {
      try {
        var scale = Math.min(1, 1400 / Math.max(img.width, img.height));
        var canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        var context = canvas.getContext("2d");
        if (!context) throw new Error("Photo could not be prepared.");
        context.drawImage(img, 0, 0, canvas.width, canvas.height);
        onDone(canvas.toDataURL("image/jpeg", 0.88));
      } catch (error) {
        onError(error);
      }
    };
    img.onerror = onError;
    img.src = data.photo;
  }

  function sendFailed(error) {
    if (error && error.type === "USER_INPUT") {
      sending = false;
      $("#nextBtn").text(tr("Submit")).attr("aria-busy", "false");
      refreshNext();
      showMessage("#sendMsg", error.error || tr("Please check the required fields."));
      return;
    }
    var errorMessage = "";
    if (typeof error === "string") {
      errorMessage = error;
    } else if (error && error.responseJSON) {
      var responseError = error.responseJSON.error;
      errorMessage = typeof responseError === "string" ? responseError :
        responseError && (responseError.message || responseError.error) || "";
    } else if (error && error.responseText) {
      try {
        var response = JSON.parse(error.responseText);
        var responseError = response && response.error;
        errorMessage = typeof responseError === "string" ? responseError :
          responseError && (responseError.message || responseError.error) || "";
      } catch (parseError) {
        errorMessage = "";
      }
    } else if (error && typeof error.message === "string") {
      errorMessage = error.message;
    } else if (error && typeof error.error === "string") {
      errorMessage = error.error;
    }
    sending = false;
    $("#nextBtn").text(tr("Submit")).attr("aria-busy", "false");
    refreshNext();
    showMessage("#sendMsg", errorMessage || tr("Couldn’t submit. Check your connection and press Submit again. Your answers are still here."));
    reportSystemError(errorMessage || "Form submission failed", error && error.stack, error && (error.status || error.statusCode));
  }

  function submitForm() {
    if (sending) { return; }
    sending = true;
    currentAction = "form-submit";
    $("#sendMsg").prop("hidden", true);
    $("#nextBtn").text(tr("Sending…")).attr("aria-busy", "true");
    refreshNext();

    function sendSubmission(photo) {
      var row = {
        code:      data.loginCode,
        fullName:  data.fullName,
        nick:      data.nick,
        role:      data.role,
        gender:    data.gender,
        position:  data.position,
        className: data.className,
        zodiac:    data.zodiac,
        hobbies:   finalList("hobbies", "hobbyOther"),
        color:     data.color,
        foods:     finalList("foods", "foodOther"),
        consent:   data.consent,
        photo:     photo,
        photoUrl:  data.photoUrl
      };

      $.ajax({
        url: SCRIPT_URL,
        method: "POST",
        data: JSON.stringify(row),
        contentType: "text/plain;charset=utf-8",   // để trình duyệt không chặn (không cần preflight)
        dataType: "json",
        timeout: 30000
      })
      .done(function (res) {
        if (res && res.ok) { sending = false; showStep(SUCCESS_STEP); }
        else { sendFailed(res || "Couldn’t submit. Check your connection and try again."); }
      })
      .fail(sendFailed);
    }

    if (data.photo) { resizePhoto(sendSubmission, sendFailed); }
    else { sendSubmission(""); }
  }

  /* ---------- 10. BẮT ĐẦU ---------- */
});
