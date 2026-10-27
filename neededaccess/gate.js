(() => {
  const SCRIPT_URL = window.MIYO_CONFIG.scriptUrl;
  const SESSION_KEY = "miyo-admin-session";
  const toggle = document.querySelector("#adminToggle");
  const form = document.querySelector("#adminForm");
  const input = document.querySelector("#adminCode");
  const submit = document.querySelector("#adminSubmit");
  const message = document.querySelector("#adminMessage");
  const visibilityToggle = document.querySelector("#toggleCodeVisibility");

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
      if (!response.ok || !result || !result.ok) throw new Error("The admin code is incorrect. Please try again.");
      sessionStorage.setItem(SESSION_KEY, "1");
      window.location.assign("miyo/");
    } catch (error) {
      message.textContent = error.message === "Failed to fetch"
        ? "Could not connect. Please try again later."
        : error.message || "Could not verify the password. Please try again.";
      message.hidden = false;
    } finally {
      submit.disabled = false;
      submit.firstChild.textContent = "Enter ";
    }
  });
})();
