(() => {
  const status = document.querySelector("#status");
  const head = document.querySelector("#tableHead");
  const body = document.querySelector("#tableBody");
  const code = sessionStorage.getItem("miyo-admin-code");

  document.querySelector("#logout").addEventListener("click", () => {
    sessionStorage.removeItem("miyo-admin-code");
    location.replace("../applications/");
  });

  fetch(window.MIYO_CONFIG.scriptUrl, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action: "adminResponses", code })
  }).then((response) => response.json()).then((result) => {
    if (!result || !result.ok) {
      sessionStorage.removeItem("miyo-admin-code");
      status.textContent = "Mã admin không hợp lệ hoặc đã bị vô hiệu hóa. Hãy đăng nhập lại.";
      return;
    }
    const headers = result.headers || [];
    const rows = result.rows || [];
    const headerRow = document.createElement("tr");
    headers.forEach((label) => {
      const th = document.createElement("th");
      th.textContent = label;
      headerRow.appendChild(th);
    });
    head.appendChild(headerRow);
    rows.forEach((values) => {
      const tr = document.createElement("tr");
      headers.forEach((_, index) => {
        const td = document.createElement("td");
        td.textContent = values[index] || "";
        tr.appendChild(td);
      });
      body.appendChild(tr);
    });
    status.innerHTML = `Có ${rows.length}<strong>/18</strong> học sinh đã đăng ký.`;
  }).catch(() => { status.textContent = "Không tải được dữ liệu. Vui lòng thử tải lại trang."; });
})();
