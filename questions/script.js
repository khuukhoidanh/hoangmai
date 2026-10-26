/* ==========================================================
   script.js - toàn bộ logic của trang (viết bằng jQuery).
   Muốn đổi danh sách lựa chọn: sửa phần "2. DANH SÁCH LỰA CHỌN".
   Muốn đổi đường dẫn gửi dữ liệu: sửa SCRIPT_URL ở phần 1.
   ========================================================== */
$(function () {

  var language = "en";
  var translations = {
    "Make It Yours.": "Dành riêng cho bạn.", "After our exchange in Hanoi, we’d love to know more about you before we meet again in Kaohsiung. It takes about 3 minutes.": "Sau chuyến giao lưu tại Hà Nội, chúng tôi muốn hiểu thêm về bạn trước khi gặp lại ở Cao Hùng. Bạn sẽ mất khoảng 3 phút.", "Who are you?": "Bạn là ai?", "Tell us what to call you.": "Hãy cho chúng tôi biết nên gọi bạn là gì.",
    "Full name": "Họ và tên", "(Please enter your real full name)": "(vui lòng nhập họ và tên thật)", "Your Nick Name": "Biệt danh", "(Recommended: 5–12 characters)": "(khuyến khích 5–12 ký tự)", "Your role": "Vai trò của bạn", "Your position": "Chức vụ", "Your grade / class": "Khối / lớp của bạn", "Zodiac sign": "Cung hoàng đạo",
    "Please complete the highlighted required fields before continuing.": "Vui lòng hoàn thành các mục bắt buộc được tô nổi bật để tiếp tục.",
    "Your favorites": "Những điều bạn yêu thích", "Quick picks. There are no right or wrong answers.": "Chọn nhanh nhé. Không có câu trả lời đúng hay sai.", "Interests": "Sở thích", "choose up to 3": "chọn tối đa 3", "Other: anything else you love?": "Khác: bạn còn yêu thích điều gì?", "The color that feels most like you": "Màu sắc thể hiện con người bạn", "What kind of food would you like to try in Taiwan?": "Bạn muốn thử món gì ở Đài Loan?", "Choose up to 3": "Chọn tối đa 3", "Other: what would you like to try?": "Khác: bạn muốn thử món gì?", "Selected: 0/3": "Đã chọn: 0/3", "Visual style you like": "Phong cách hình ảnh bạn thích",
    "Things to avoid": "Những điều cần tránh", "So we can plan a comfortable trip for you. Skip anything that doesn’t apply.": "Để chúng tôi chuẩn bị chuyến đi thoải mái cho bạn. Có thể bỏ qua mục không phù hợp.", "Allergies or dietary needs": "Dị ứng hoặc chế độ ăn", "Other: please describe": "Khác: vui lòng mô tả", "Foods you don’t like": "Những món bạn không thích", "Other: which foods?": "Khác: món nào?", "Places or activities you’d rather skip": "Địa điểm hoặc hoạt động bạn muốn tránh", "Other: where or what?": "Khác: địa điểm hoặc hoạt động nào?",
    "A photo of you": "Ảnh của bạn", "A clear, well-lit photo looking straight at the camera.": "Ảnh rõ nét, đủ sáng, nhìn thẳng vào máy ảnh.", "Tap to choose a photo": "Chạm để chọn ảnh", "Your selected photo": "Ảnh bạn đã chọn", "I agree to let the Trung Sơn team use and edit this photo. It will only be used internally.": "Tôi đồng ý để nhóm Trung Sơn sử dụng và chỉnh sửa ảnh này. Ảnh chỉ được sử dụng nội bộ.",
    "Review": "Xem lại", "Does everything look right? You can edit any part.": "Mọi thông tin đã chính xác chưa? Bạn có thể chỉnh sửa bất kỳ mục nào.", "Thank you.": "Cảm ơn bạn.", "See you in Kaohsiung.": "Hẹn gặp bạn tại Cao Hùng.", "Back": "Quay lại", "Start": "Bắt đầu", "Continue": "Tiếp tục", "Submit": "Gửi", "Step": "Bước",
    "Teacher": "Giáo viên", "Interpreter": "Phiên dịch viên", "Student": "Học sinh", "Other": "Khác", "Minimal": "Tối giản", "Clean, lots of space": "Gọn gàng, thoáng đãng", "Vibrant": "Rực rỡ", "Bold, high-contrast color": "Màu sắc nổi bật, tương phản cao", "Nostalgic": "Hoài niệm", "Warm tones, like old film": "Tông ấm như phim cũ", "Dreamy": "Mơ màng", "Soft, light, pastel": "Nhẹ nhàng, tông pastel",
    "Role": "Vai trò", "Position": "Chức vụ", "Class": "Lớp", "Favorite color": "Màu yêu thích", "Style": "Phong cách", "Food to try in Taiwan": "Món muốn thử ở Đài Loan", "Allergies / dietary needs": "Dị ứng / chế độ ăn", "Foods you dislike": "Món không thích", "Places to skip": "Địa điểm muốn tránh", "Not provided": "Chưa cung cấp", "None": "Không có", "Edit details": "Chỉnh sửa thông tin", "Change photo": "Đổi ảnh",
    "Aries": "Bạch Dương", "Taurus": "Kim Ngưu", "Gemini": "Song Tử", "Cancer": "Cự Giải", "Leo": "Sư Tử", "Virgo": "Xử Nữ", "Libra": "Thiên Bình", "Scorpio": "Bọ Cạp", "Sagittarius": "Nhân Mã", "Capricorn": "Ma Kết", "Aquarius": "Bảo Bình", "Pisces": "Song Ngư",
    "Music": "Âm nhạc", "Drawing": "Vẽ", "Reading": "Đọc sách", "Gaming": "Chơi trò chơi", "Sports": "Thể thao", "Photography": "Nhiếp ảnh", "Cooking": "Nấu ăn", "Travel": "Du lịch", "Movies": "Xem phim", "Dancing": "Nhảy", "Tech": "Công nghệ", "Fashion": "Thời trang",
    "Hot Pot": "Lẩu", "BBQ / Grilled Meat": "Thịt nướng", "Noodles": "Mì", "Rice Dishes": "Các món cơm", "Dumplings": "Bánh bao / há cảo", "Fried Chicken": "Gà rán", "Sushi": "Sushi", "Curry": "Cà ri", "Taiwanese Street Food": "Ẩm thực đường phố Đài Loan", "Western Food": "Món Âu", "Desserts": "Món tráng miệng", "Bubble Tea": "Trà sữa"
  };
  function tr(text) { return language === "vi" ? (translations[text] || text) : text; }

  $("[data-language]").on("click", function () {
    language = this.getAttribute("data-language");
    document.documentElement.lang = language;
    if (language === "vi") {
      var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      var node;
      while ((node = walker.nextNode())) {
        var original = $.trim(node.nodeValue);
        if (translations[original]) node.nodeValue = node.nodeValue.replace(original, translations[original]);
      }
      $("#languageTitle").text("Chọn ngôn ngữ");
      $(".language-card > p:not(.language-eyebrow)").text("Vui lòng chọn ngôn ngữ để tiếp tục.");
      $(".language-eyebrow").text("MAKE IT YOURS · HÀ NỘI × CAO HÙNG 2026");
      $("#position").attr("placeholder", "Ví dụ: Giáo viên chủ nhiệm");
      $("#className").attr("placeholder", "Ví dụ: Khối 10 hoặc 10A1");
      $("#dropText").text("Chạm để chọn ảnh");
      $("#hobbyOther").attr("placeholder", "Khác: bạn còn yêu thích điều gì?");
      $("#foodOther").attr("placeholder", "Khác: bạn muốn thử món gì?");
      $("#allergyOther").attr("placeholder", "Khác: vui lòng mô tả");
      $("#dislikeOther").attr("placeholder", "Khác: món nào?");
      $("#colors").next("p").text("Không thấy màu phù hợp? Chạm vào vòng màu để chọn màu bất kỳ.");
      $("#foodsCount").text("Đã chọn: 0/3");
      $(".chips .chip").each(function () { $(this).text(tr($(this).data("value"))); });
    }
    $("#languageScreen, .language-screen").prop("hidden", true);
    $(".bar, .wrap, #nav").prop("hidden", false);
    showStep(0);
  });

  /* ---------- 1. CÀI ĐẶT ---------- */
  var SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz_QqTsjP9CDyBLXFHlkv3BKQ-BE7Jy7wCV35KCwaa2y6bLZBR5Ln1jHzEswCGbxXrX/exec";
  var REVIEW_STEP = 4;    // bước xem lại
  var SUCCESS_STEP = 5;   // bước cảm ơn

  /* ---------- 2. DANH SÁCH LỰA CHỌN ---------- */
  var OPTIONS = {
    roles:     ["Teacher", "Interpreter", "Student"],
    zodiac:    ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"],
    hobbies:   ["Music", "Drawing", "Reading", "Gaming", "Sports", "Photography", "Cooking", "Travel", "Movies", "Dancing", "Tech", "Fashion"],
    foods:     ["Hot Pot", "BBQ / Grilled Meat", "Noodles", "Rice Dishes", "Dumplings", "Fried Chicken", "Sushi", "Curry", "Taiwanese Street Food", "Western Food", "Desserts", "Bubble Tea"],
    colors:    ["#e63946", "#ff7a1a", "#f5c518", "#2bb673", "#14b8c4", "#2a3cff", "#7b3fe4", "#ff5fa2", "#12171f", "#f3f4f1"]
  };

  /* ---------- 3. CÂU TRẢ LỜI CỦA NGƯỜI DÙNG ---------- */
  var data = {
    fullName: "", nick: "",
    role: "", position: "", className: "",
    zodiac: "",
    hobbies: [], hobbyOther: "",
    color: "",
    foods: [], foodOther: "",
    photo: "", consent: false
  };
  var currentStep = 0;
  var sending = false;

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

  // Chọn 1 nút duy nhất (role, zodiac)
  function buildSingleChips($box, list, key, onPick) {
    $.each(list, function (i, text) {
      $("<button>", { type: "button", "class": "chip", text: tr(text), "aria-pressed": "false" }).data("value", text)
        .on("click", function () {
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
          $("#" + key + "Count").text((language === "vi" ? "Đã chọn: " : "Selected: ") + picked.length + "/" + max);
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

  /* ---------- 6. Ô NHẬP CHỮ, ẢNH, ĐỒNG Ý ---------- */

  // Mọi ô chữ có id trùng tên với data (fullName, nick, position, className, ...Other)
  $("input[type=text]").on("input", function () {
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
        return data.fullName && data.nick && data.role && data.zodiac &&
               (data.role !== "Teacher" || data.position) &&
               (data.role !== "Student" || data.className);
      case 2:
        return finalList("hobbies", "hobbyOther").length > 0 &&
               data.color &&
               finalList("foods", "foodOther").length > 0;
      case 3:
        return data.photo && data.consent;
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
    $(".invalid-label").removeClass("invalid-label");
    if (validationShown && !isValid(currentStep)) {
      highlightMissing(false);
    } else {
      validationShown = false;
      $("#validationMsg").prop("hidden", true);
    }
  }

  $(document).on("click change", ".chip, #colors button, #customColor, #photoInput, #consent", clearValidationHighlights);
  $("input[type=text]").on("input", clearValidationHighlights);

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
        if ($item.is("input")) $item.closest("label").addClass("invalid-label");
        var $group = $item.closest(".grp");
        if ($group.length) $group.children("b").addClass("invalid-label");
        if ($item.hasClass("ck")) $item.addClass("invalid-label");
      });
    }
    if (currentStep === 1) {
      if (!data.fullName) mark("#fullName");
      if (!data.nick) mark("#nick");
      if (!data.role) mark("#roleChips");
      if (data.role === "Teacher" && !data.position) mark("#position");
      if (data.role === "Student" && !data.className) mark("#className");
      if (!data.zodiac) mark("#zodiacChips");
    } else if (currentStep === 2) {
      if (!finalList("hobbies", "hobbyOther").length) mark("#hobbiesChips");
      if (!data.color) mark("#colors");
      if (!finalList("foods", "foodOther").length) mark("#foodsChips");
    } else if (currentStep === 3) {
      if (!data.photo) mark("#drop");
      if (!data.consent) mark(".ck");
    }
    if (shouldFocus && $firstMissing.length) {
      var $scroll = $(".wrap");
      $scroll.stop().animate({ scrollTop: Math.max(0, $scroll.scrollTop() + $firstMissing.offset().top - 100) }, 250);
      if ($firstMissing.is("input")) $firstMissing.trigger("focus");
    }
  }

  function showStep(n) {
    currentStep = n;
    $(".step").removeClass("on").filter("[data-step='" + n + "']").addClass("on");
    $("#progress").css("width", (n / SUCCESS_STEP * 100) + "%");
    $("#stepLabel").text(n > 0 && n < SUCCESS_STEP ? tr("Step") + " " + n + "/" + REVIEW_STEP : "");
    $("#backBtn").prop("hidden", n === 0 || n === SUCCESS_STEP);
    $("#nav").prop("hidden", n === SUCCESS_STEP);
    $("#nextBtn").text(tr(n === 0 ? "Start" : n === REVIEW_STEP ? "Submit" : "Continue"));
    if (n === REVIEW_STEP) { buildReview(); }
    refreshNext();
    $(".wrap").scrollTop(0);
  }

  $("#nextBtn").on("click", function () {
    if (currentStep === REVIEW_STEP) { submitForm(); }
    else if (isValid(currentStep)) { clearValidationHighlights(); showStep(currentStep + 1); }
    else { highlightMissing(); }
  });
  $("#backBtn").on("click", function () { showStep(currentStep - 1); });

  /* ---------- 8. MÀN REVIEW ---------- */
  function buildReview() {
    var $review = $("#review").empty();
    if (data.photo) {
      $("<img>", { src: data.photo, alt: "Your photo" }).appendTo($review);
    }

    var rows = [
      ["Full name", data.fullName],
      ["Your Nick Name", data.nick],
      ["Role", data.role]
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
    $("<button>", { type: "button", "class": "e", text: tr("Change photo") })
      .on("click", function () { showStep(3); }).appendTo($review);
  }

  /* ---------- 9. GỬI DỮ LIỆU VỀ GOOGLE SHEET ---------- */

  // Thu nhỏ ảnh (tối đa 1400px) để gửi nhanh hơn
  function resizePhoto(onDone, onError) {
    var img = new Image();
    img.onload = function () {
      var scale = Math.min(1, 1400 / Math.max(img.width, img.height));
      var canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      onDone(canvas.toDataURL("image/jpeg", 0.88));
    };
    img.onerror = onError;
    img.src = data.photo;
  }

  function sendFailed() {
    sending = false;
    $("#nextBtn").text("Submit");
    refreshNext();
    showMessage("#sendMsg", "Couldn’t submit. Check your connection and press Submit again. Your answers are still here.");
  }

  function submitForm() {
    if (sending) { return; }
    sending = true;
    $("#sendMsg").prop("hidden", true);
    $("#nextBtn").text("Sending…");
    refreshNext();

    resizePhoto(function (photo) {
      var row = {
        fullName:  data.fullName,
        nick:      data.nick,
        role:      data.role,
        position:  data.position,
        className: data.className,
        zodiac:    data.zodiac,
        hobbies:   finalList("hobbies", "hobbyOther"),
        color:     data.color,
        foods:     finalList("foods", "foodOther"),
        consent:   data.consent,
        photo:     photo
      };

      $.ajax({
        url: SCRIPT_URL,
        method: "POST",
        data: JSON.stringify(row),
        contentType: "text/plain;charset=utf-8",   // để trình duyệt không chặn (không cần preflight)
        dataType: "json"
      })
      .done(function (res) {
        if (res && res.ok) { sending = false; showStep(SUCCESS_STEP); }
        else { sendFailed(); }
      })
      .fail(sendFailed);
    }, sendFailed);
  }

  /* ---------- 10. BẮT ĐẦU ---------- */
});
