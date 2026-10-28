(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  const translations = {
    en: {
      pageTitle: "MIYO — Two Cities, One Connection", description: "MIYO — Make It Yours. A creative exchange connecting Hanoi and Kaohsiung.",
      selectLanguageLabel: "Choose language", skipToContent: "Skip to content", mainNavLabel: "Main navigation", homeLabel: "MIYO home", andLabel: "and",
      navStatus: "TWO CITIES, ONE CONNECTION", navAbout: "About", navStory: "Story", navExperience: "Experience", navFaq: "FAQ",
      projectLabel: "INDEPENDENT PROJECT", connectionTitle: "A line connecting Hanoi and Kaohsiung", connectionDescription: "A fine animated line travels between two points, a visual metaphor for the student exchange.", vietnam: "VIETNAM", taiwan: "TAIWAN",
      heroSubtitle: "A little closer,<br>across the distance.", heroAside: "A student exchange between<br>Trường Ngôi Sao Hoàng Mai and<br>Trường Trung Sơn.", scrollExplore: "SCROLL TO EXPLORE",
      ideaLabel: "01 — THE IDEA", aboutLabel: "ABOUT MIYO", makeIt: "Make it", yours: "yours.", introLead: "MIYO is a small creative project about the details that make each of us unmistakably ourselves—and the connections that let us share them.",
      introBody: "Made in the spirit of a student exchange between Trường Ngôi Sao Hoàng Mai in Hanoi and Trường Trung Sơn in Kaohsiung, MIYO creates room for curiosity, conversation, and memories made together.", storyLink: "A little more about the connection", marginNote: "MAKE / SHARE / REMEMBER",
      connectionLabel: "02 — THE CONNECTION", ourStory: "OUR STORY", storyKicker: "FROM HANOI, WITH CURIOSITY", differentStreets: "Different<br>streets.", sharedMoments: "Shared moments.",
      storyLead: "An exchange begins before anyone gets on a plane. It begins with a question, a name remembered, a small detail offered across the distance.", storyBody: "MIYO takes its inspiration from the student exchange between Trường Ngôi Sao Hoàng Mai and Trường Trung Sơn. Two school communities, two cities, and the chance to meet one another with openness.",
      storyInvitation: "This is an invitation to take part in that connection. The best parts are still being made together.", hanoiVietnam: "HANOI, VIETNAM", kaohsiungTaiwan: "KAOHSIUNG, TAIWAN",
      takePart: "03 — TAKE PART", openInvitation: "AN OPEN INVITATION", experienceKicker: "A NOTE FROM ONE CITY TO ANOTHER", connection: "Connection", isSomething: "is something", weMake: "we make.", moveWords: "MOVE THROUGH THE WORDS", wordFieldLabel: "Move through the words: curiosity, kindness, memory, you", curiosity: "curiosity", kindness: "kindness", memory: "memory", you: "you",
      experienceCopy: "Every exchange is made of small things: a story told, a new perspective, a familiar feeling in an unfamiliar place.", noTwoStories: "NO TWO STORIES ARE THE SAME.", thatsThePoint: "THAT'S THE POINT.",
      goodToKnow: "04 — GOOD TO KNOW", faqLabel: "FAQ", few: "A few", answers: "answers.", whatIsMiyo: "What is MIYO?", faqMiyo: "MIYO means “Make It Yours.” It is a creative project inspired by the student exchange between Trường Ngôi Sao Hoàng Mai in Hanoi and Trường Trung Sơn in Kaohsiung.", whoFor: "Who is the project for?", faqAudience: "It is for the students and educators taking part in this exchange.", whereAsk: "Where can I ask a question?", faqContact: "Contact the developer on Zalo: 0335695572.",
      keepInTouch: "05 — KEEP IN TOUCH", contactLabel: "CONTACT", stillMaking: "TWO CITIES, STILL IN THE MAKING", more: "More,", soon: "soon.", contactHelp: "For help or questions, contact the developer on Zalo: 0335695572.", closingLabel: "MIYO closing message", closingMeta: "MIYO — AN EXCHANGE IN MOTION", backToTop: "BACK TO THE BEGINNING ↑", footerProject: "AN INDEPENDENT STUDENT EXCHANGE PROJECT", footerNotice: 'For exchange participants only. Please submit only your own information and review the <a href="../../applications/privacy.html">privacy notice</a> before continuing.'
    },
    vi: {
      pageTitle: "MIYO — Hai thành phố, một kết nối", description: "MIYO — Hãy tạo nên dấu ấn của bạn. Dự án giao lưu kết nối Hà Nội và Cao Hùng.",
      selectLanguageLabel: "Chọn ngôn ngữ", skipToContent: "Đến nội dung chính", mainNavLabel: "Điều hướng chính", homeLabel: "Trang chủ MIYO", andLabel: "và",
      navStatus: "HAI THÀNH PHỐ, MỘT KẾT NỐI", navAbout: "Giới thiệu", navStory: "Câu chuyện", navExperience: "Trải nghiệm", navFaq: "Hỏi đáp",
      projectLabel: "DỰ ÁN ĐỘC LẬP", connectionTitle: "Đường nối Hà Nội và Cao Hùng", connectionDescription: "Đường nét chuyển động giữa hai điểm, tượng trưng cho chương trình giao lưu học sinh.", vietnam: "VIỆT NAM", taiwan: "ĐÀI LOAN",
      heroSubtitle: "Gần nhau hơn,<br>vượt qua khoảng cách.", heroAside: "Chương trình giao lưu giữa trường Ngôi Sao Hoàng Mai và trường Trung Sơn.", scrollExplore: "KHÁM PHÁ THÊM",
      ideaLabel: "01 — Ý TƯỞNG", aboutLabel: "VỀ MIYO", makeIt: "Hãy tạo nên", yours: "dấu ấn riêng.", introLead: "MIYO là một dự án sáng tạo nhỏ, tôn vinh những điều làm nên bản sắc riêng của mỗi người và những kết nối giúp chúng ta chia sẻ điều đó.",
      introBody: "Lấy cảm hứng từ chương trình giao lưu giữa Trường Ngôi Sao Hoàng Mai tại Hà Nội và Trường Trung Sơn tại Cao Hùng, MIYO mở ra không gian cho sự tò mò, trò chuyện và những kỷ niệm chung.", storyLink: "Tìm hiểu thêm về sự kết nối", marginNote: "SÁNG TẠO / CHIA SẺ / GHI NHỚ",
      connectionLabel: "02 — SỰ KẾT NỐI", ourStory: "CÂU CHUYỆN CỦA CHÚNG TA", storyKicker: "TỪ HÀ NỘI, VỚI LÒNG TÒ MÒ", differentStreets: "Những con phố<br>khác biệt.", sharedMoments: "Khoảnh khắc chung.",
      storyLead: "Một cuộc giao lưu bắt đầu trước cả khi ai đó lên máy bay. Nó bắt đầu bằng một câu hỏi, một cái tên được nhớ đến, một điều nhỏ bé được sẻ chia qua khoảng cách.", storyBody: "MIYO lấy cảm hứng từ chương trình giao lưu giữa Trường Ngôi Sao Hoàng Mai và Trường Trung Sơn. Hai cộng đồng trường học, hai thành phố và cơ hội gặp gỡ nhau bằng sự cởi mở.",
      storyInvitation: "Đây là lời mời cùng góp phần tạo nên sự kết nối ấy. Những điều đẹp nhất vẫn đang được chúng ta cùng nhau viết tiếp.", hanoiVietnam: "HÀ NỘI, VIỆT NAM", kaohsiungTaiwan: "CAO HÙNG, ĐÀI LOAN",
      takePart: "03 — THAM GIA", openInvitation: "LỜI MỜI RỘNG MỞ", experienceKicker: "LỜI NHẮN TỪ THÀNH PHỐ NÀY ĐẾN THÀNH PHỐ KIA", connection: "Kết nối", isSomething: "là điều", weMake: "chúng ta cùng tạo nên.", moveWords: "KHÁM PHÁ NHỮNG TỪ NGỮ", wordFieldLabel: "Khám phá các từ: tò mò, tử tế, ký ức, bạn", curiosity: "tò mò", kindness: "tử tế", memory: "ký ức", you: "bạn",
      experienceCopy: "Mỗi cuộc giao lưu được tạo nên từ những điều nhỏ bé: một câu chuyện, một góc nhìn mới, một cảm giác thân thuộc giữa nơi xa lạ.", noTwoStories: "KHÔNG CÓ HAI CÂU CHUYỆN NÀO GIỐNG NHAU.", thatsThePoint: "ĐÓ CHÍNH LÀ ĐIỀU ĐẶC BIỆT.",
      goodToKnow: "04 — ĐIỀU CẦN BIẾT", faqLabel: "HỎI ĐÁP", few: "Đôi điều", answers: "giải đáp.", whatIsMiyo: "MIYO là gì?", faqMiyo: "MIYO là viết tắt của “Make It Yours” (Hãy tạo nên dấu ấn của bạn). Đây là dự án sáng tạo lấy cảm hứng từ chương trình giao lưu giữa Trường Ngôi Sao Hoàng Mai tại Hà Nội và Trường Trung Sơn tại Cao Hùng.", whoFor: "Dự án dành cho ai?", faqAudience: "Dự án dành cho học sinh và nhà giáo dục tham gia chương trình giao lưu này.", whereAsk: "Tôi có thể hỏi thêm thông tin ở đâu?", faqContact: "Liên hệ với người phát triển dự án qua Zalo: 0335695572.",
      keepInTouch: "05 — GIỮ LIÊN LẠC", contactLabel: "LIÊN HỆ", stillMaking: "HAI THÀNH PHỐ, CÂU CHUYỆN VẪN ĐANG VIẾT TIẾP", more: "Hẹn gặp", soon: "sớm nhé.", contactHelp: "Nếu cần hỗ trợ hoặc có câu hỏi, hãy liên hệ người phát triển dự án qua Zalo: 0335695572.", closingLabel: "Lời kết MIYO", closingMeta: "MIYO — HÀNH TRÌNH GIAO LƯU ĐANG TIẾP DIỄN", backToTop: "QUAY LẠI ĐẦU TRANG ↑", footerProject: "DỰ ÁN GIAO LƯU HỌC SINH ĐỘC LẬP", footerNotice: 'Trang dành cho người tham gia giao lưu. Vui lòng chỉ gửi thông tin của chính bạn và đọc <a href="../../applications/privacy.html">thông báo quyền riêng tư</a> trước khi tiếp tục.'
    }
  };

  const languageToggle = document.querySelector("[data-language-toggle]");
  const languageOptions = document.querySelector("[data-language-options]");
  const currentLanguage = document.querySelector("[data-current-language]");
  const descriptionMeta = document.querySelector("[data-i18n-description]");
  function setLanguage(language) {
    const selected = language === "vi" ? "vi" : "en";
    const dictionary = translations[selected];
    document.documentElement.lang = selected;
    document.title = dictionary.pageTitle;
    if (descriptionMeta) descriptionMeta.content = dictionary.description;
    document.querySelectorAll("[data-i18n]").forEach((element) => {
      const value = dictionary[element.dataset.i18n];
      if (value !== undefined) element.innerHTML = value;
    });
    document.querySelectorAll("[data-i18n-aria]").forEach((element) => {
      const value = dictionary[element.dataset.i18nAria];
      if (value !== undefined) element.setAttribute("aria-label", value);
    });
    if (languageToggle) {
      languageToggle.setAttribute("aria-label", dictionary.selectLanguageLabel);
      languageToggle.setAttribute("aria-expanded", "false");
    }
    if (currentLanguage) currentLanguage.textContent = selected.toUpperCase();
    if (languageOptions) {
      languageOptions.hidden = true;
      languageOptions.querySelectorAll("[data-set-language]").forEach((option) => {
        option.setAttribute("aria-pressed", String(option.dataset.setLanguage === selected));
      });
    }
    try { localStorage.setItem("miyo-public-language", selected); } catch (error) { /* Language switching still works without storage. */ }
  }
  let initialLanguage = "en";
  try { initialLanguage = localStorage.getItem("miyo-public-language") === "vi" ? "vi" : "en"; } catch (error) { /* Use English when storage is unavailable. */ }
  setLanguage(initialLanguage);
  if (languageToggle && languageOptions) {
    languageToggle.addEventListener("click", () => {
      const opening = languageOptions.hidden;
      languageOptions.hidden = !opening;
      languageToggle.setAttribute("aria-expanded", String(opening));
    });
    languageOptions.addEventListener("click", (event) => {
      const option = event.target.closest("[data-set-language]");
      if (option) setLanguage(option.dataset.setLanguage);
    });
    document.addEventListener("click", (event) => {
      if (!event.target.closest(".language-menu")) {
        languageOptions.hidden = true;
        languageToggle.setAttribute("aria-expanded", "false");
      }
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !languageOptions.hidden) {
        languageOptions.hidden = true;
        languageToggle.setAttribute("aria-expanded", "false");
        languageToggle.focus();
      }
    });
  }

  document.querySelectorAll("a[data-scroll-target]").forEach((link) => {
    link.addEventListener("click", (event) => {
      const target = document.querySelector(link.getAttribute("href"));
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    });
  });

  if ("IntersectionObserver" in window && !reduceMotion) {
    document.documentElement.classList.add("js-ready");
    const revealItems = document.querySelectorAll(".section-label, .intro-grid > *, .story-grid > *, .experience-grid > *, .faq-grid > *, .privacy-grid > *, .contact-main, .contact-aside");
    revealItems.forEach((item) => item.setAttribute("data-reveal", ""));
    const observer = new IntersectionObserver((entries, currentObserver) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          currentObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.14, rootMargin: "0px 0px -35px 0px" });
    revealItems.forEach((item) => observer.observe(item));
  }

  const stage = document.querySelector("[data-parallax]");
  if (stage && finePointer && !reduceMotion) {
    let frame = 0;
    let pointer = null;
    const render = () => {
      frame = 0;
      if (!pointer) return;
      const rect = stage.getBoundingClientRect();
      const x = (pointer.clientX - rect.left) / rect.width - .5;
      const y = (pointer.clientY - rect.top) / rect.height - .5;
      stage.style.setProperty("--stage-x", `${x * -5}px`);
      stage.style.setProperty("--stage-y", `${y * -4}px`);
    };
    stage.addEventListener("pointermove", (event) => {
      pointer = event;
      if (!frame) frame = requestAnimationFrame(render);
    }, { passive: true });
    stage.addEventListener("pointerleave", () => {
      pointer = null;
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      stage.style.removeProperty("--stage-x");
      stage.style.removeProperty("--stage-y");
    }, { passive: true });
  }

  const wordField = document.querySelector(".word-field");
  if (wordField) {
    wordField.addEventListener("click", () => {
      const active = wordField.getAttribute("aria-pressed") !== "true";
      wordField.setAttribute("aria-pressed", String(active));
      wordField.classList.toggle("is-active", active);
    });
  }

  document.querySelectorAll(".faq-list details").forEach((item) => {
    item.addEventListener("toggle", () => {
      if (!item.open) return;
      document.querySelectorAll(".faq-list details[open]").forEach((other) => {
        if (other !== item) other.open = false;
      });
    });
  });
})();
