/* ═══════════════════════════════════════════════════
   UMBRELLA BURGER — interactions
   ═══════════════════════════════════════════════════ */
(() => {
  "use strict";

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  /* ── Preloader ─────────────────────────────────── */
  const preloader = $("#preloader");
  window.addEventListener("load", () => {
    setTimeout(() => preloader.classList.add("is-done"), 500);
  });
  // Safety: never trap the user behind the preloader
  setTimeout(() => preloader.classList.add("is-done"), 3200);

  /* ── Navbar: scrolled state + back-to-top ──────── */
  const nav = $("#nav");
  const toTop = $("#toTop");
  const onScroll = () => {
    nav.classList.toggle("is-scrolled", window.scrollY > 40);
    toTop.classList.toggle("is-visible", window.scrollY > 700);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  toTop.addEventListener("click", () =>
    window.scrollTo({ top: 0, behavior: "smooth" })
  );

  /* ── Mobile menu ───────────────────────────────── */
  const navToggle = $("#navToggle");
  const navLinks = $("#navLinks");
  const closeMenu = () => {
    navToggle.classList.remove("is-open");
    navLinks.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  };
  navToggle.addEventListener("click", () => {
    const open = navLinks.classList.toggle("is-open");
    navToggle.classList.toggle("is-open", open);
    navToggle.setAttribute("aria-expanded", String(open));
    document.body.style.overflow = open ? "hidden" : "";
  });
  $$(".nav-links a").forEach((a) => a.addEventListener("click", closeMenu));

  /* ── Active nav link on scroll ─────────────────── */
  const sections = $$("section[id]");
  const linkFor = (id) => $(`.nav-link[href="#${id}"]`);
  const spy = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        $$(".nav-link").forEach((l) => l.classList.remove("is-active"));
        const link = linkFor(e.target.id);
        if (link) link.classList.add("is-active");
      });
    },
    { rootMargin: "-40% 0px -55% 0px" }
  );
  sections.forEach((s) => spy.observe(s));

  /* ── Reveal on scroll (with stagger) ───────────── */
  const reveals = $$(".reveal");
  const revealObs = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add("is-visible");
        revealObs.unobserve(e.target);
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );
  reveals.forEach((el, i) => {
    // stagger siblings that share a parent
    const siblings = [...el.parentElement.children].filter((c) =>
      c.classList.contains("reveal")
    );
    el.style.setProperty("--stagger", `${(siblings.indexOf(el) % 6) * 0.09}s`);
    revealObs.observe(el);
  });

  /* ── Animated counters ─────────────────────────── */
  const counters = $$(".stat-num");
  const fmt = (n) =>
    n >= 1000000 ? (n / 1000000).toFixed(1) + "M" : n.toLocaleString("en-IN");
  const countObs = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const el = e.target;
        countObs.unobserve(el);
        const target = +el.dataset.count;
        const decimal = el.dataset.decimal ? +el.dataset.decimal : 0;
        const suffix = el.dataset.suffix || "";
        const dur = 1600;
        const t0 = performance.now();
        const tick = (t) => {
          const p = Math.min((t - t0) / dur, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          const val = target * eased;
          el.textContent = decimal
            ? (val / Math.pow(10, decimal)).toFixed(decimal)
            : fmt(Math.round(val)) + (p === 1 ? suffix : "");
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
    },
    { threshold: 0.6 }
  );
  counters.forEach((c) => countObs.observe(c));

  /* ── Menu tabs ─────────────────────────────────── */
  const tabs = $$(".menu-tab");
  const panels = $$(".menu-panel");
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => {
        t.classList.remove("is-active");
        t.setAttribute("aria-selected", "false");
      });
      tab.classList.add("is-active");
      tab.setAttribute("aria-selected", "true");
      panels.forEach((p) =>
        p.classList.toggle("is-active", p.dataset.panel === tab.dataset.tab)
      );
      // reveal items inside freshly shown panel
      $$(".reveal", $(`.menu-panel[data-panel="${tab.dataset.tab}"]`)).forEach(
        (el) => el.classList.add("is-visible")
      );
    });
  });

  /* ── Reviews slider ────────────────────────────── */
  const track = $("#sliderTrack");
  const slides = $$(".review", track);
  const dotsWrap = $("#sliderDots");
  let current = 0;
  let autoTimer;

  slides.forEach((_, i) => {
    const dot = document.createElement("button");
    dot.className = "slider-dot" + (i === 0 ? " is-active" : "");
    dot.setAttribute("aria-label", `Review ${i + 1}`);
    dot.addEventListener("click", () => goTo(i, true));
    dotsWrap.appendChild(dot);
  });
  const dots = $$(".slider-dot", dotsWrap);

  function goTo(i, manual = false) {
    current = (i + slides.length) % slides.length;
    track.style.transform = `translateX(-${current * 100}%)`;
    dots.forEach((d, di) => d.classList.toggle("is-active", di === current));
    if (manual) restartAuto();
  }
  function restartAuto() {
    clearInterval(autoTimer);
    autoTimer = setInterval(() => goTo(current + 1), 5500);
  }
  $("#prevReview").addEventListener("click", () => goTo(current - 1, true));
  $("#nextReview").addEventListener("click", () => goTo(current + 1, true));
  restartAuto();

  // swipe support
  let touchX = null;
  track.addEventListener("touchstart", (e) => (touchX = e.touches[0].clientX), { passive: true });
  track.addEventListener("touchend", (e) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 45) goTo(current + (dx < 0 ? 1 : -1), true);
    touchX = null;
  }, { passive: true });

  /* ── Gallery lightbox ──────────────────────────── */
  const lightbox = $("#lightbox");
  const lightboxImg = $("#lightboxImg");
  $$(".gallery-item").forEach((item) => {
    item.addEventListener("click", () => {
      lightboxImg.src = item.dataset.full;
      lightbox.classList.add("is-open");
      lightbox.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
    });
  });
  const closeLightbox = () => {
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  };
  $("#lightboxClose").addEventListener("click", closeLightbox);
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) closeLightbox();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeLightbox();
      closeMenu();
    }
  });

  /* ── Toast ─────────────────────────────────────── */
  const toast = $("#toast");
  let toastTimer;
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 3400);
  }

  /* ── Form validation helper ────────────────────── */
  function validate(form) {
    let ok = true;
    $$("[required]", form).forEach((f) => {
      const bad =
        !f.value.trim() ||
        (f.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.value));
      f.classList.toggle("is-invalid", bad);
      if (bad) ok = false;
    });
    return ok;
  }
  document.addEventListener("input", (e) => {
    if (e.target.matches(".is-invalid")) e.target.classList.remove("is-invalid");
  });

  /* ── Reservation form ──────────────────────────── */
  const reserveForm = $("#reserveForm");
  const dateInput = $("#rDate");
  if (dateInput) dateInput.min = new Date().toISOString().split("T")[0];

  reserveForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!validate(reserveForm)) {
      showToast("Please fill in the highlighted fields.");
      return;
    }
    const name = $("#rName").value.trim().split(" ")[0];
    const date = new Date($("#rDate").value).toLocaleDateString("en-IN", {
      weekday: "long", day: "numeric", month: "long",
    });
    const time = $("#rTime").value;
    const guests = $("#rGuests").value;

    reserveForm.innerHTML = `
      <div class="form-success">
        <div class="success-icon">☂</div>
        <h3>You're in, ${name}!</h3>
        <p>Table for <strong>${guests}</strong> · ${date} · ${time}<br/>
        We'll hold your seat under the umbrella for 15 minutes.<br/>
        A confirmation would normally reach your phone — this is a demo.</p>
        <button type="button" class="btn btn-outline" id="reserveAgain">Make another booking</button>
      </div>`;
    $("#reserveAgain").addEventListener("click", () => location.reload());
    showToast("Reservation confirmed — see you soon! ☂");
  });

  /* ── Contact + newsletter forms ────────────────── */
  $("#contactForm").addEventListener("submit", function (e) {
    e.preventDefault();
    if (!validate(this)) {
      showToast("Please fill in the highlighted fields.");
      return;
    }
    this.reset();
    showToast("Message sent — a human will reply soon. ☂");
  });

  $("#newsForm").addEventListener("submit", function (e) {
    e.preventDefault();
    if (!validate(this)) {
      showToast("Please enter a valid email.");
      return;
    }
    this.reset();
    showToast("Welcome to The Rain Letter! ☂");
  });

  /* ── Image fallbacks ───────────────────────────── */
  const fallback = (img) => {
    const frame = img.closest(".img-frame");
    if (frame) frame.classList.add("img-fallback");
    img.remove();
  };
  $$("img").forEach((img) => {
    img.addEventListener("error", () => fallback(img));
    if (img.complete && img.naturalWidth === 0 && img.src) fallback(img);
  });
})();
