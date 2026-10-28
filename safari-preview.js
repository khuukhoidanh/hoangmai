(() => {
  const devices = {
    se: { width: 375, height: 667 },
    standard: { width: 390, height: 844 },
    plus: { width: 430, height: 932 }
  };
  const stage = document.getElementById("stage");
  const phone = document.getElementById("phone");
  const frame = document.getElementById("page");
  const address = document.getElementById("address");
  const deviceSelect = document.getElementById("device");
  const landscape = document.getElementById("landscape");
  const backButtons = [document.getElementById("back"), document.getElementById("bottomBack")];
  const forwardButton = document.getElementById("forward");
  let scale = 1;

  function normalizeUrl(value) {
    const entered = value.trim();
    if (!entered) return "/";
    if (/^https?:\/\//i.test(entered)) return entered;
    return new URL(entered.startsWith("/") ? entered : `/${entered}`, window.location.origin).href;
  }
  function updateAddress() {
    try {
      const current = new URL(frame.contentWindow.location.href);
      address.value = current.host + current.pathname + current.search + current.hash;
    } catch (error) {
      address.value = frame.src;
    }
    updateHistoryButtons();
  }
  function navigate(value) {
    frame.src = normalizeUrl(value);
  }
  function updateHistoryButtons() {
    let canGoBack = false;
    let canGoForward = false;
    try {
      canGoBack = frame.contentWindow.history.length > 1;
    } catch (error) { /* Cross-origin pages may restrict history inspection. */ }
    backButtons.forEach((button) => { button.disabled = !canGoBack; });
    forwardButton.disabled = !canGoForward;
  }
  function setDevice() {
    const selected = devices[deviceSelect.value] || devices.standard;
    const width = landscape.checked ? selected.height : selected.width;
    const height = landscape.checked ? selected.width : selected.height;
    phone.style.setProperty("--device-width", `${width}px`);
    phone.style.setProperty("--device-height", `${height}px`);
    frame.style.flexBasis = `${Math.max(180, height - 175)}px`;
    fitPhone();
  }
  function fitPhone() {
    const rect = stage.getBoundingClientRect();
    const width = phone.offsetWidth;
    const height = phone.offsetHeight;
    scale = Math.min(1, (rect.width - 24) / width, (rect.height - 20) / height);
    phone.style.transform = `scale(${Math.max(.35, scale)})`;
  }

  document.getElementById("addressForm").addEventListener("submit", (event) => {
    event.preventDefault();
    navigate(address.value);
  });
  document.getElementById("reload").addEventListener("click", () => frame.contentWindow.location.reload());
  backButtons.forEach((button) => button.addEventListener("click", () => frame.contentWindow.history.back()));
  forwardButton.addEventListener("click", () => frame.contentWindow.history.forward());
  deviceSelect.addEventListener("change", setDevice);
  landscape.addEventListener("change", setDevice);
  document.getElementById("fit").addEventListener("click", fitPhone);
  frame.addEventListener("load", updateAddress);
  window.addEventListener("resize", fitPhone);
  document.getElementById("clock").textContent = new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(new Date());
  setDevice();
  navigate("/");
})();
