(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

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

  document.querySelectorAll(".faq-list details").forEach((item) => {
    item.addEventListener("toggle", () => {
      if (!item.open) return;
      document.querySelectorAll(".faq-list details[open]").forEach((other) => {
        if (other !== item) other.open = false;
      });
    });
  });
})();
