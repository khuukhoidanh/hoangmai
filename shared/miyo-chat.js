(() => {
  const endpoint = window.MIYO_CONFIG && window.MIYO_CONFIG.scriptUrl;
  if (!endpoint || document.querySelector("[data-miyo-support-chat]")) return;

  const storageKey = "miyo-support-chat-session";
  const text = {
    en: {
      launcher: "Chat with us", title: "MIYO Assistant", intro: "A little help, whenever you need it.", privacy: "Please don’t send access codes or sensitive personal information.", start: "Start a conversation", send: "Send", cancel: "End chat", close: "Close", input: "Write a message…", waiting: "Connecting…", creating: "Creating your chat…", ending: "Ending your chat…", loadingHistory: "Loading conversation history…", active: "Replies will appear here. You can leave this page open.", connectionError: "Connection interrupted. Trying to reconnect…", closed: "This conversation has ended. Start a new chat if you still need help.", startError: "Could not start a chat. Please try again later.", sendError: "Message not sent. Please try again.", cancelError: "Could not close the chat. Please try again.", ended: "Conversation ended", you: "You", support: "MIYO Assistant", confirm: "Your conversation will be archived and can’t be reopened once ended.", confirmTitle: "End this conversation?", confirmEnd: "End chat", keepChat: "Keep chatting", sending: "Sending…"
    },
    vi: {
      launcher: "Trò chuyện cùng MIYO", title: "MIYO Assistant", intro: "MIYO luôn sẵn sàng hỗ trợ bạn.", privacy: "Vui lòng không gửi mã truy cập hoặc thông tin cá nhân nhạy cảm.", start: "Bắt đầu trò chuyện", send: "Gửi", cancel: "Kết thúc chat", close: "Đóng", input: "Viết tin nhắn…", waiting: "Đang kết nối…", creating: "Đang tạo chat…", ending: "Đang kết thúc chat…", loadingHistory: "Đang tải lịch sử trò chuyện…", active: "Phản hồi sẽ hiện tại đây. Bạn có thể để trang mở.", connectionError: "Mất kết nối. Đang thử kết nối lại…", closed: "Cuộc trò chuyện đã kết thúc. Hãy tạo chat mới nếu bạn vẫn cần hỗ trợ.", startError: "Chưa thể tạo cuộc trò chuyện. Vui lòng thử lại sau.", sendError: "Chưa gửi được tin nhắn. Vui lòng thử lại.", cancelError: "Chưa thể kết thúc chat. Vui lòng thử lại.", ended: "Cuộc trò chuyện đã kết thúc", you: "Bạn", support: "MIYO Assistant", confirm: "Cuộc trò chuyện sẽ được lưu trữ và không thể mở lại sau khi kết thúc.", confirmTitle: "Kết thúc cuộc trò chuyện?", confirmEnd: "Kết thúc chat", keepChat: "Tiếp tục trò chuyện", sending: "Đang gửi…"
    }
  };
  const language = () => (document.documentElement.lang || "en").toLowerCase().startsWith("vi") ? "vi" : "en";
  const t = (key) => text[language()][key];
  const root = document.createElement("div");
  root.dataset.miyoSupportChat = "";
  root.innerHTML = `
    <button class="miyo-chat-launcher" type="button" aria-label="Chat with MIYO Assistant" aria-expanded="false" aria-controls="miyo-chat-panel"><span class="miyo-chat-launcher-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M20 11.4a7.4 7.4 0 0 1-7.8 7.4 8.8 8.8 0 0 1-3.6-.8L4 19l1.2-3.7a7 7 0 0 1-.9-3.5A7.5 7.5 0 0 1 12 4.4a7.5 7.5 0 0 1 8 7Z"/><path d="M8.5 11.8h.01m3.5 0h.01m3.5 0h.01"/></svg></span><span class="miyo-chat-launcher-label" data-chat-label></span></button>
    <section class="miyo-chat-panel" id="miyo-chat-panel" aria-label="MIYO support chat" hidden>
      <header class="miyo-chat-header"><div><strong data-chat-title></strong><span class="miyo-chat-status"><i></i><span data-chat-status></span></span></div><button type="button" class="miyo-chat-close" aria-label="Close">×</button></header>
      <div class="miyo-chat-start"><p data-chat-intro></p><p class="miyo-chat-privacy" data-chat-privacy></p><button class="miyo-chat-start-button" type="button" data-chat-start></button></div>
      <div class="miyo-chat-conversation" data-chat-conversation hidden>
        <div class="miyo-chat-messages" aria-live="polite" aria-relevant="additions text"></div>
        <p class="miyo-chat-notice" data-chat-notice></p>
        <form class="miyo-chat-form"><label class="miyo-chat-sr" for="miyo-chat-input">Message</label><textarea id="miyo-chat-input" maxlength="1200" rows="1" required></textarea><button type="submit" data-chat-send></button></form>
        <button type="button" class="miyo-chat-cancel" data-chat-cancel></button>
      </div>
      <div class="miyo-chat-ended" data-chat-ended hidden><p data-chat-ended-text></p><button type="button" data-chat-new></button></div>
      <div class="miyo-chat-operation" data-chat-operation hidden role="status" aria-live="polite"><span class="miyo-chat-spinner" aria-hidden="true"></span><span data-chat-operation-text></span></div>
      <div class="miyo-chat-modal" data-chat-modal hidden><div class="miyo-chat-modal-card" role="dialog" aria-modal="true" aria-labelledby="miyo-chat-modal-title" aria-describedby="miyo-chat-modal-copy"><span class="miyo-chat-modal-mark" aria-hidden="true">↗</span><h2 id="miyo-chat-modal-title" data-chat-confirm-title></h2><p id="miyo-chat-modal-copy" data-chat-confirm-copy></p><div><button type="button" class="miyo-chat-modal-keep" data-chat-keep></button><button type="button" class="miyo-chat-modal-end" data-chat-confirm></button></div></div></div>
    </section>`;
  document.body.appendChild(root);

  const launcher = root.querySelector(".miyo-chat-launcher");
  const panel = root.querySelector(".miyo-chat-panel");
  const launcherPositionKey = "miyo-support-chat-launcher-position";
  const startSection = root.querySelector(".miyo-chat-start");
  const conversation = root.querySelector(".miyo-chat-conversation");
  const endedSection = root.querySelector(".miyo-chat-ended");
  const messages = root.querySelector(".miyo-chat-messages");
  const input = root.querySelector("#miyo-chat-input");
  const form = root.querySelector(".miyo-chat-form");
  let session = readSession();
  let cursor = 0;
  let pollTimer = 0;
  let busy = false;
  let polling = false;
  let hasEnded = false;
  let pollFailures = 0;
  let historyLoaded = !session;
  let pendingSends = 0;
  let sendQueue = Promise.resolve();
  const seenMessageIds = new Set();
  let pendingUserMessages = [];

  function readSession() {
    try { return JSON.parse(sessionStorage.getItem(storageKey) || "null"); }
    catch (error) { return null; }
  }
  function saveSession(value) {
    session = value;
    try {
      if (value) sessionStorage.setItem(storageKey, JSON.stringify(value));
      else sessionStorage.removeItem(storageKey);
    } catch (error) { /* Chat can still work in this tab. */ }
  }
  async function request(action, values) {
    const requestUrl = action === "supportChatPoll" && window.MIYO_CONFIG.supportChatPollUrl
      ? window.MIYO_CONFIG.supportChatPollUrl.replace(/\/+$/, "") + "/poll"
      : endpoint;
    const response = await fetch(requestUrl, {
      method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, cache: "no-store",
      body: JSON.stringify(Object.assign({ action }, values || {}))
    });
    return response.json();
  }
  function setLabels() {
    root.querySelector("[data-chat-label]").textContent = t("launcher");
    root.querySelector("[data-chat-title]").textContent = t("title");
    root.querySelector("[data-chat-intro]").textContent = t("intro");
    root.querySelector("[data-chat-privacy]").textContent = t("privacy");
    root.querySelector("[data-chat-start]").textContent = t("start");
    root.querySelector("[data-chat-send]").textContent = t("send");
    root.querySelector("[data-chat-cancel]").textContent = t("cancel");
    root.querySelector("[data-chat-ended-text]").textContent = t("closed");
    root.querySelector("[data-chat-confirm-title]").textContent = t("confirmTitle");
    root.querySelector("[data-chat-confirm-copy]").textContent = t("confirm");
    root.querySelector("[data-chat-keep]").textContent = t("keepChat");
    root.querySelector("[data-chat-confirm]").textContent = t("confirmEnd");
    root.querySelector("[data-chat-new]").textContent = t("start");
    root.querySelector("[data-chat-status]").textContent = hasEnded ? t("ended") : session ? (historyLoaded ? t("active") : t("loadingHistory")) : t("intro");
    launcher.setAttribute("aria-label", t("title") + " — " + t("launcher"));
    root.querySelector(".miyo-chat-close").setAttribute("aria-label", t("close"));
    root.querySelector(".miyo-chat-panel").setAttribute("aria-label", t("title"));
    input.placeholder = t("input");
  }
  function setHistoryLoaded(loaded) {
    historyLoaded = loaded;
    input.disabled = !loaded;
    root.querySelector("[data-chat-send]").disabled = !loaded;
    root.querySelector("[data-chat-cancel]").disabled = !loaded;
    root.querySelector("[data-chat-notice]").textContent = loaded ? t("active") : t("loadingHistory");
    root.querySelector("[data-chat-status]").textContent = loaded ? t("active") : t("loadingHistory");
  }
  function setOperationLoading(loading, messageKey) {
    const layer = root.querySelector("[data-chat-operation]");
    layer.hidden = !loading;
    root.querySelector("[data-chat-operation-text]").textContent = loading ? t(messageKey) : "";
    launcher.disabled = loading;
    root.querySelector(".miyo-chat-close").disabled = loading;
    root.querySelector("[data-chat-start]").disabled = loading;
    root.querySelector("[data-chat-new]").disabled = loading;
    root.querySelector("[data-chat-confirm]").disabled = loading;
    root.setAttribute("aria-busy", String(loading));
  }
  function resizeInput() {
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 112) + "px";
  }
  function showEnded() {
    saveSession(null);
    hasEnded = true;
    window.clearTimeout(pollTimer);
    conversation.hidden = true;
    startSection.hidden = true;
    endedSection.hidden = false;
    root.querySelector("[data-chat-status]").textContent = t("ended");
  }
  function appendMessage(message) {
    const messageId = Number(message.id) || 0;
    if (messageId && seenMessageIds.has(messageId)) return;
    if (messageId) seenMessageIds.add(messageId);
    if (message.sender === "user") {
      const pending = pendingUserMessages.find((entry) => entry.text === message.text && !entry.reconciled);
      if (pending) {
        pending.reconciled = true;
        pending.id = messageId;
        pending.element.dataset.messageId = String(messageId);
        cursor = Math.max(cursor, messageId);
        return;
      }
    }
    const item = document.createElement("article");
    item.className = "miyo-chat-message " + (message.sender === "user" ? "is-user" : "is-support");
    const author = document.createElement("strong");
    author.textContent = message.sender === "user" ? t("you") : t("support");
    const body = document.createElement("p");
    body.textContent = message.text;
    item.append(author, body);
    messages.appendChild(item);
    root.querySelector("[data-chat-notice]").textContent = t("active");
    messages.scrollTop = messages.scrollHeight;
    cursor = Math.max(cursor, Number(message.id) || 0);
  }
  async function poll() {
    if (!session || polling) return;
    polling = true;
    try {
      const result = await request("supportChatPoll", { chatId: session.chatId, accessToken: session.accessToken, after: cursor });
      if (result.closed) { showEnded(); return; }
      if (result.ok) {
        pollFailures = 0;
        (result.messages || []).forEach(appendMessage);
        cursor = Math.max(cursor, Number(result.cursor) || 0);
        if (!historyLoaded) setHistoryLoaded(true);
        root.querySelector("[data-chat-notice]").textContent = t("active");
      } else {
        throw new Error(result.error || "Chat polling failed");
      }
    } catch (error) {
      pollFailures++;
      if (pollFailures >= 3 && session) root.querySelector("[data-chat-notice]").textContent = t("connectionError");
    }
    finally {
      polling = false;
      // Continue syncing when minimized so replies are ready when chat opens again.
      if (session) pollTimer = window.setTimeout(poll, 5000);
    }
  }
  function activate(value) {
    saveSession(value);
    hasEnded = false;
    setHistoryLoaded(false);
    cursor = 0;
    seenMessageIds.clear();
    pendingUserMessages = [];
    messages.replaceChildren();
    startSection.hidden = true;
    endedSection.hidden = true;
    conversation.hidden = false;
    poll();
  }
  async function startChat() {
    if (busy) return;
    busy = true;
    setOperationLoading(true, "creating");
    const button = root.querySelector("[data-chat-start]");
    button.disabled = true;
    button.textContent = t("waiting");
    try {
      const result = await request("supportChatStart", { language: language() });
      if (!result.ok) throw new Error(result.error || t("startError"));
      activate({ chatId: result.chatId, accessToken: result.accessToken });
    } catch (error) {
      root.querySelector("[data-chat-notice]").textContent = t("startError");
      startSection.querySelector("p").textContent = t("startError");
    } finally {
      busy = false;
      setOperationLoading(false);
      button.disabled = false;
      button.textContent = t("start");
    }
  }
  async function sendMessage(event) {
    event.preventDefault();
    const message = input.value.trim();
    if (!session || !historyLoaded || !message || busy) return;
    const optimistic = document.createElement("article");
    optimistic.className = "miyo-chat-message is-user is-pending";
    const author = document.createElement("strong");
    author.textContent = t("you");
    const body = document.createElement("p");
    body.textContent = message;
    optimistic.append(author, body);
    messages.appendChild(optimistic);
    messages.scrollTop = messages.scrollHeight;
    const pending = { text: message, element: optimistic, reconciled: false, id: 0 };
    pendingUserMessages.push(pending);
    input.value = "";
    resizeInput();
    root.querySelector("[data-chat-notice]").textContent = t("active");
    const currentSession = session;
    pendingSends++;
    try {
      const sendRequest = sendQueue.then(() => request("supportChatSend", { chatId: currentSession.chatId, accessToken: currentSession.accessToken, message }));
      sendQueue = sendRequest.catch(() => {});
      const result = await sendRequest;
      if (result.closed) { showEnded(); return; }
      if (!result.ok) throw new Error(result.error || t("sendError"));
      const messageId = Number(result.messageId) || 0;
      if (messageId) {
        pending.id = messageId;
        pending.element.dataset.messageId = String(messageId);
        seenMessageIds.add(messageId);
        cursor = Math.max(cursor, messageId);
      }
      pending.element.classList.remove("is-pending");
      root.querySelector("[data-chat-notice]").textContent = t("active");
    } catch (error) {
      pending.element.classList.add("is-failed");
      root.querySelector("[data-chat-notice]").textContent = t("sendError");
    } finally {
      pendingSends = Math.max(0, pendingSends - 1);
    }
  }
  async function endChat() {
    if (!session || busy || pendingSends) return;
    root.querySelector("[data-chat-modal]").hidden = false;
    root.querySelector("[data-chat-keep]").focus();
  }
  async function confirmEndChat() {
    if (!session || busy) return;
    root.querySelector("[data-chat-modal]").hidden = true;
    busy = true;
    setOperationLoading(true, "ending");
    try {
      const result = await request("supportChatCancel", { chatId: session.chatId, accessToken: session.accessToken });
      if (!result.ok) throw new Error(result.error || t("cancelError"));
      showEnded();
    } catch (error) {
      root.querySelector("[data-chat-notice]").textContent = t("cancelError");
    } finally { busy = false; setOperationLoading(false); }
  }

  function positionPanel() {
    if (panel.hidden) return;
    if (window.matchMedia("(max-width: 480px)").matches) {
      panel.style.left = "50%";
      panel.style.top = "50%";
      panel.style.right = "auto";
      panel.style.bottom = "auto";
      return;
    }
    const margin = 8;
    const gap = 12;
    const launcherRect = launcher.getBoundingClientRect();
    const panelRect = panel.getBoundingClientRect();
    const left = Math.max(margin, Math.min(launcherRect.right - panelRect.width, window.innerWidth - panelRect.width - margin));
    const top = Math.max(margin, Math.min(launcherRect.top - panelRect.height - gap, window.innerHeight - panelRect.height - margin));
    panel.style.left = left + "px";
    panel.style.top = top + "px";
    panel.style.right = "auto";
    panel.style.bottom = "auto";
  }

  function setLauncherPosition(left, top, persist) {
    const margin = 8;
    const rect = launcher.getBoundingClientRect();
    let minLeft = margin;
    let minTop = margin;
    let maxLeft = window.innerWidth - rect.width - margin;
    let maxTop = window.innerHeight - rect.height - margin;
    if (!panel.hidden && !window.matchMedia("(max-width: 480px)").matches) {
      const panelRect = panel.getBoundingClientRect();
      minLeft = panelRect.width - rect.width + margin;
      minTop = panelRect.height + 12 + margin;
    }
    const x = Math.max(minLeft, Math.min(left, maxLeft));
    const y = Math.max(minTop, Math.min(top, maxTop));
    launcher.style.left = x + "px";
    launcher.style.top = y + "px";
    launcher.style.right = "auto";
    launcher.style.bottom = "auto";
    if (persist) {
      try { localStorage.setItem(launcherPositionKey, JSON.stringify({ x, y })); } catch (error) {}
    }
    positionPanel();
  }

  try {
    const savedPosition = JSON.parse(localStorage.getItem(launcherPositionKey) || "null");
    if (savedPosition && Number.isFinite(savedPosition.x) && Number.isFinite(savedPosition.y)) {
      setLauncherPosition(savedPosition.x, savedPosition.y, false);
    }
  } catch (error) {}

  let suppressLauncherClick = false;
  launcher.addEventListener("pointerdown", (event) => {
    if (event.button !== undefined && event.button !== 0) return;
    const rect = launcher.getBoundingClientRect();
    const startX = event.clientX;
    const startY = event.clientY;
    let moved = false;
    const onMove = (moveEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      if (!moved && Math.hypot(dx, dy) < 5) return;
      moved = true;
      setLauncherPosition(rect.left + dx, rect.top + dy, true);
      moveEvent.preventDefault();
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      if (moved) {
        suppressLauncherClick = true;
        window.setTimeout(() => { suppressLauncherClick = false; }, 0);
      }
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  });
  window.addEventListener("resize", () => {
    if (launcher.style.left) setLauncherPosition(parseFloat(launcher.style.left), parseFloat(launcher.style.top), true);
  });

  launcher.addEventListener("click", () => {
    if (suppressLauncherClick) return;
    panel.hidden = !panel.hidden;
    launcher.classList.toggle("is-open", !panel.hidden);
    launcher.setAttribute("aria-expanded", String(!panel.hidden));
    if (!panel.hidden) positionPanel();
    if (!panel.hidden && session) { startSection.hidden = true; conversation.hidden = false; endedSection.hidden = true; poll(); }
    else { startSection.hidden = false; conversation.hidden = true; endedSection.hidden = true; }
    setLabels();
  });
  root.querySelector(".miyo-chat-close").addEventListener("click", () => {
    panel.hidden = true;
    launcher.classList.remove("is-open");
    launcher.setAttribute("aria-expanded", "false");
  });
  window.addEventListener("resize", positionPanel);
  root.querySelector("[data-chat-start]").addEventListener("click", startChat);
  root.querySelector("[data-chat-new]").addEventListener("click", startChat);
  root.querySelector("[data-chat-cancel]").addEventListener("click", endChat);
  root.querySelector("[data-chat-keep]").addEventListener("click", () => { root.querySelector("[data-chat-modal]").hidden = true; root.querySelector("[data-chat-cancel]").focus(); });
  root.querySelector("[data-chat-confirm]").addEventListener("click", confirmEndChat);
  root.querySelector("[data-chat-modal]").addEventListener("click", (event) => { if (event.target === event.currentTarget) event.currentTarget.hidden = true; });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !root.querySelector("[data-chat-modal]").hidden) root.querySelector("[data-chat-keep]").click();
    if (event.key === "Enter" && event.target === input && !event.shiftKey && !event.isComposing) {
      event.preventDefault();
      form.requestSubmit();
    }
  });
  form.addEventListener("submit", sendMessage);
  input.addEventListener("input", resizeInput);
  document.addEventListener("languagechange", setLabels);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && session) {
      window.clearTimeout(pollTimer);
      poll();
    }
  });
  new MutationObserver(setLabels).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
  setLabels();
  if (session) {
    startSection.hidden = true;
    conversation.hidden = false;
    endedSection.hidden = true;
    setHistoryLoaded(false);
    poll();
  }
})();
