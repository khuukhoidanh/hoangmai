(() => {
  const SCRIPT_URL = window.MIYO_CONFIG.scriptUrl;
  const SESSION_KEY = "miyo-admin-session";
  const toggle = document.querySelector("#adminToggle");
  const form = document.querySelector("#adminForm");
  const input = document.querySelector("#adminCode");
  const submit = document.querySelector("#adminSubmit");
  const message = document.querySelector("#adminMessage");
  const visibilityToggle = document.querySelector("#toggleCodeVisibility");
  const ERROR_QUEUE_KEY = "miyo-pending-system-errors";

  function reportError(message, stack) {
    const report = {
      code: `ERR-${Date.now().toString(36).toUpperCase()}`,
      page: location.pathname,
      action: "admin-login",
      message: String(message || "Admin login request failed").slice(0, 500),
      stack: String(stack || "").slice(0, 1500),
      status: "",
      userAgent: navigator.userAgent
    };
    try {
      const queue = JSON.parse(localStorage.getItem(ERROR_QUEUE_KEY) || "[]");
      queue.push(report);
      localStorage.setItem(ERROR_QUEUE_KEY, JSON.stringify(queue.slice(-10)));
    } catch (storageError) { /* Keep the admin form usable if storage is unavailable. */ }
    showConnectionError();
    sendQueuedErrors();
  }

  function sendQueuedErrors() {
    if (!navigator.onLine) return;
    let queue;
    try { queue = JSON.parse(localStorage.getItem(ERROR_QUEUE_KEY) || "[]"); }
    catch (error) { return; }
    if (!queue.length) return;
    fetch(SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "reportError", error: queue[0] })
    }).then((response) => response.json()).then((result) => {
      if (!result || !result.ok) return;
      try {
        localStorage.setItem(ERROR_QUEUE_KEY, JSON.stringify(queue.slice(1)));
        if (queue.length > 1) sendQueuedErrors();
      } catch (error) { /* Ignore storage errors. */ }
    }).catch(() => {});
  }

  function showConnectionError() {
    message.textContent = "Connection problem. Please refresh this page when your internet returns; the error report will be sent automatically.";
    message.hidden = false;
  }

  window.addEventListener("online", sendQueuedErrors);
  window.addEventListener("offline", showConnectionError);
  window.addEventListener("error", (event) => reportError(event.message, event.error && event.error.stack));
  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    reportError(reason && reason.message || String(reason || "Unhandled promise rejection"), reason && reason.stack);
  });
  sendQueuedErrors();

  visibilityToggle.addEventListener("click", () => {
    const showing = input.type === "password";
    input.type = showing ? "text" : "password";
    visibilityToggle.setAttribute("aria-pressed", String(showing));
    visibilityToggle.setAttribute("aria-label", showing ? "Hide admin code" : "Show admin code");
  });

  toggle.addEventListener("click", () => {
    const opening = form.hidden;
    form.hidden = !opening;
    toggle.setAttribute("aria-expanded", String(opening));
    if (opening) input.focus();
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    message.hidden = true;
    submit.disabled = true;
    submit.firstChild.textContent = "Checking… ";
    try {
      const response = await fetch(SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: "adminLogin", code: input.value })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(`Admin verification returned HTTP ${response.status}`);
      if (!result || !result.ok) {
        message.textContent = "The admin code is incorrect. Please try again.";
        message.hidden = false;
        return;
      }
      sessionStorage.setItem(SESSION_KEY, "1");
      window.location.assign("miyo/");
    } catch (error) {
      reportError(error.message || "Admin verification failed", error.stack);
    } finally {
      submit.disabled = false;
      submit.firstChild.textContent = "Enter ";
    }
  });
})();
