(() => {
  "use strict";

  document.addEventListener("DOMContentLoaded", () => {
    const $ = (selector, root = document) => root.querySelector(selector);
    const $$ = (selector, root = document) =>
      Array.from(root.querySelectorAll(selector));

    // Safe local storage
    const storage = {
      get(key) {
        try {
          return localStorage.getItem(key);
        } catch (error) {
          return null;
        }
      },
      set(key, value) {
        try {
          localStorage.setItem(key, value);
        } catch (error) {}
      },
      remove(key) {
        try {
          localStorage.removeItem(key);
        } catch (error) {}
      }
    };

    // Toast notifications
    let toastTimer;

    function showToast(message) {
      let toast = $("#toast");

      if (!toast) {
        toast = document.createElement("div");
        toast.id = "toast";
        toast.className = "toast";
        toast.setAttribute("role", "status");
        toast.setAttribute("aria-live", "polite");
        document.body.appendChild(toast);
      }

      toast.textContent = message;
      toast.classList.add("show");

      window.clearTimeout(toastTimer);
      toastTimer = window.setTimeout(() => {
        toast.classList.remove("show");
      }, 2800);
    }

    // Dark mode
    const themeButton = $(".theme-toggle");

    function applyTheme(theme) {
      const isLight = theme === "light";

      document.body.classList.toggle("light-theme", isLight);
      storage.set("noir-theme", isLight ? "light" : "dark");

      if (themeButton) {
        const label = themeButton.querySelector("span");

        if (label) {
          label.textContent = isLight ? "Light" : "Dark";
        }

        themeButton.setAttribute(
          "aria-label",
          isLight ? "Switch to dark mode" : "Switch to light mode"
        );

        themeButton.setAttribute("aria-pressed", String(isLight));
        themeButton.title = isLight
          ? "Switch to dark mode"
          : "Switch to light mode";
      }
    }

    applyTheme(storage.get("noir-theme") === "light" ? "light" : "dark");

    themeButton?.addEventListener("click", () => {
      const nextTheme = document.body.classList.contains("light-theme")
        ? "dark"
        : "light";

      applyTheme(nextTheme);
      showToast(nextTheme === "light" ? "Light mode enabled" : "Dark mode enabled");
    });

    // RTL / LTR toggle
    const rtlButton = $(".rtl-toggle");

    function applyDirection(direction) {
      const dir = direction === "rtl" ? "rtl" : "ltr";

      document.documentElement.setAttribute("dir", dir);
      storage.set("noir-direction", dir);

      if (rtlButton) {
        rtlButton.textContent = dir === "rtl" ? "LTR" : "RTL";
        rtlButton.setAttribute("aria-pressed", String(dir === "rtl"));
        rtlButton.setAttribute(
          "aria-label",
          dir === "rtl"
            ? "Switch to left-to-right layout"
            : "Switch to right-to-left layout"
        );
        rtlButton.title = dir === "rtl" ? "Switch to LTR" : "Switch to RTL";
      }
    }

    applyDirection(storage.get("noir-direction") === "rtl" ? "rtl" : "ltr");

    rtlButton?.addEventListener("click", () => {
      const nextDirection =
        document.documentElement.getAttribute("dir") === "rtl" ? "ltr" : "rtl";

      applyDirection(nextDirection);
      showToast(nextDirection === "rtl" ? "RTL layout enabled" : "LTR layout enabled");
    });

    // Homepage nav: make sure there is a separate "Dashboard" link in the menu.
    // Login always lands on the homepage; the dashboard opens only from this link.
    try {
      const mainNav = $(".main-nav");
      if (mainNav && !mainNav.querySelector('a[href="dashboard.html"]')) {
        const dashLink = document.createElement("a");
        dashLink.className = "nav-link";
        dashLink.href = "dashboard.html";
        dashLink.textContent = "Dashboard";
        const navLinks = mainNav.querySelectorAll(":scope > a.nav-link");
        const lastLink = navLinks[navLinks.length - 1];
        if (lastLink) lastLink.after(dashLink);
        else mainNav.appendChild(dashLink);
      }
    } catch (error) {}

    // Mobile navigation
    const menuButton = $(".menu-toggle");
    const nav = $(".main-nav");

    function closeNav() {
      nav?.classList.remove("open");
      menuButton?.setAttribute("aria-expanded", "false");
    }

    menuButton?.addEventListener("click", () => {
      const isOpen = menuButton.getAttribute("aria-expanded") !== "true";

      menuButton.setAttribute("aria-expanded", String(isOpen));
      nav?.classList.toggle("open", isOpen);
    });

    // FIX: the Home toggle is excluded so it does not close the mobile menu
    $$(".nav-link:not(.nav-home-toggle), .nav-dropdown-link").forEach(link => {
      link.addEventListener("click", closeNav);
    });

    // Navigation dropdown
    const dropdown = $(".nav-dropdown");
    const dropdownButton = $(".nav-home-toggle");

    // FIX: Home now navigates on desktop; mobile tap toggles the submenu
    dropdownButton?.addEventListener("click", event => {
      event.preventDefault();

      if (!window.matchMedia("(max-width:760px)").matches) {
        const onHome = /(^|\/)(index\.html)?$/.test(location.pathname);
        if (onHome) window.scrollTo({ top: 0, behavior: "smooth" });
        else location.href = "index.html";
        return;
      }

      event.stopPropagation();
      const isOpen = dropdown?.classList.toggle("open") || false;
      dropdownButton.setAttribute("aria-expanded", String(isOpen));
    });

    // FIX: back/forward button restores a clean, visible page
    window.addEventListener("pageshow", event => {
      if (!event.persisted) return;
      closeNav();
      dropdown?.classList.remove("open");
      $$(".reveal").forEach(element => element.classList.add("is-visible"));
    });

    document.addEventListener("click", event => {
      if (dropdown && !dropdown.contains(event.target)) {
        dropdown.classList.remove("open");
        dropdownButton?.setAttribute("aria-expanded", "false");
      }
    });

    // Scroll reveal animations
    const revealItems = $$(".reveal");

    if ("IntersectionObserver" in window) {
      const revealObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12 });

      revealItems.forEach(element => revealObserver.observe(element));
    } else {
      revealItems.forEach(element => element.classList.add("is-visible"));
    }

    // Animated counters (suffix comes from data-suffix, e.g. "+" or "%")
    const counterElements = $$("[data-count]");

    function formatCount(element, value) {
      return value.toLocaleString() + (element.dataset.suffix || "");
    }

    if ("IntersectionObserver" in window) {
      const counterObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;

          const element = entry.target;
          const target = Number(element.dataset.count);

          if (!Number.isFinite(target)) {
            counterObserver.unobserve(element);
            return;
          }

          const start = performance.now();
          const duration = 1300;

          function animate(now) {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 4);

            element.textContent = formatCount(element, Math.round(target * eased));

            if (progress < 1) requestAnimationFrame(animate);
          }

          requestAnimationFrame(animate);
          counterObserver.unobserve(element);
        });
      }, { threshold: 0.6 });

      counterElements.forEach(element => counterObserver.observe(element));
    } else {
      counterElements.forEach(element => {
        element.textContent = formatCount(element, Number(element.dataset.count));
      });
    }

    // Booking date validation
    const dateInput = $("#bookingDate");

    if (dateInput) {
      const today = new Date();
      today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
      dateInput.min = today.toISOString().slice(0, 10);
    }

    // Booking form (demo mode)
    const bookingForm = $("#bookingForm");

    bookingForm?.addEventListener("submit", event => {
      event.preventDefault();

      if (!bookingForm.reportValidity()) return;

      const formData = new FormData(bookingForm);
      const booking = {};

      formData.forEach((value, key) => {
        booking[key] = value;
      });

      booking.id =
        "NA-" + Math.random().toString(36).slice(2, 7).toUpperCase();
      booking.status = "Requested";
      booking.createdAt = new Date().toISOString();

      storage.set("noir-latest-booking", JSON.stringify(booking));

      try {
        const pending = JSON.parse(storage.get("noir-pending") || "[]");
        pending.push(booking);
        storage.set("noir-pending", JSON.stringify(pending));
      } catch (error) {}

      const success = $(".form-success");

      if (success) {
        success.hidden = false;
        success.textContent =
          "Request saved. Reference: " + booking.id +
          ". Sign in to your dashboard to track it. This demo does not send a booking to the studio.";
      }

      const submitButton = bookingForm.querySelector('[type="submit"]');

      if (submitButton) {
        submitButton.textContent = "Request Saved ✓";
      }

      showToast("Appointment request saved");
      updateDashboard();
    });

    // Login / dashboard modal
    const modal = $("#loginModal");
    const loginView = $("#loginView");
    const dashboardView = $("#dashboardView");

    function getLatestBooking() {
      try {
        return JSON.parse(storage.get("noir-latest-booking") || "null");
      } catch (error) {
        return null;
      }
    }

    function updateDashboard() {
      const booking = getLatestBooking();
      const service = $("#dashService");
      const details = $("#dashBooking");

      if (service) {
        service.textContent = booking?.service || "No upcoming booking";
      }

      if (details) {
        details.textContent = booking
          ? [
              booking.vehicle,
              booking.date,
              booking.time,
              booking.id ? "Ref " + booking.id : ""
            ].filter(Boolean).join(" · ")
          : "Your booking details will appear here.";
      }
    }

    function openDashboard(email) {
      if (loginView) loginView.hidden = true;
      if (dashboardView) dashboardView.hidden = false;

      const emailElement = $("#dashboardEmail");
      const greeting = $("#dashboardGreeting");

      if (emailElement) emailElement.textContent = email;
      if (greeting) greeting.textContent = "Your garage.";

      updateDashboard();
    }

    function openLogin() {
      if (!modal) {
        showToast("Login modal is missing from index.html");
        return;
      }

      modal.hidden = false;
      document.body.style.overflow = "hidden";

      const savedEmail = storage.get("noir-demo-user");

      if (savedEmail) {
        openDashboard(savedEmail);
      } else {
        if (loginView) loginView.hidden = false;
        if (dashboardView) dashboardView.hidden = true;

        window.setTimeout(() => $("#loginEmail")?.focus(), 50);
      }
    }

    function closeLogin() {
      if (modal) modal.hidden = true;
      document.body.style.overflow = "";
    }

    // Login is its own page (login.html); the dashboard is its own page (dashboard.html)
    $$("[data-open-login]").forEach(element => {
      element.setAttribute("href", "login.html");
      element.addEventListener("click", event => {
        event.preventDefault();
        location.href = "login.html";
      });
    });

    $$("[data-close-login]").forEach(element => {
      element.addEventListener("click", closeLogin);
    });

    modal?.addEventListener("click", event => {
      if (event.target === modal) closeLogin();
    });

    // Sign-in is handled on login.html only (no legacy popup login here).

    $("#dashboardBook")?.addEventListener("click", () => {
      closeLogin();
      $("#booking")?.scrollIntoView({ behavior: "smooth" });
    });
    // Keep each section image independent; do not replace failed images with one shared photo.

    // Smooth scrolling
    $$('a[href^="#"]').forEach(link => {
      link.addEventListener("click", event => {
        const href = link.getAttribute("href");

        if (!href || href === "#") return;

        let target;

        try {
          target = $(href);
        } catch (error) {
          return;
        }

        if (target) {
          event.preventDefault();
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    });

    // Gallery lightbox
    const lightbox = $("#imageLightbox");
    const lightboxImage = $("#lightboxImage");
    const lightboxCaption = $("#lightboxCaption");

    function closeLightbox() {
      if (lightbox) lightbox.hidden = true;
      document.body.style.overflow = "";
    }

    $$(".gallery-item").forEach(item => {
      item.addEventListener("click", () => {
        const image = $("img", item);

        if (!image || !lightbox || !lightboxImage) return;

        lightboxImage.src = image.currentSrc || image.src;
        lightboxImage.alt = image.alt || "Selected studio work";

        if (lightboxCaption) {
          lightboxCaption.textContent =
            item.dataset.galleryTitle || image.alt || "Selected work";
        }

        lightbox.hidden = false;
        document.body.style.overflow = "hidden";
        $(".lightbox-close", lightbox)?.focus();
      });
    });

    $(".lightbox-close")?.addEventListener("click", closeLightbox);

    lightbox?.addEventListener("click", event => {
      if (event.target === lightbox) closeLightbox();
    });

    // Privacy and terms popover
    const legalPopover = $("#legalPopover");
    const legalTitle = $("#legalTitle");
    const legalText = $("#legalText");

    const policies = {
      privacy: [
        "Privacy policy",
        "This demo stores booking requests and the demo sign-in email only in this browser. No data is sent to a server. Clear this browser's site data to remove locally stored demo information."
      ],
      terms: [
        "Terms & conditions",
        "Appointments submitted here are demo requests and are not transmitted to the studio. Pricing and treatment descriptions are illustrative. Confirm availability and final pricing directly with the studio before service."
      ]
    };

    function closeLegal() {
      if (legalPopover) legalPopover.hidden = true;
    }

    $$("[data-legal]").forEach(link => {
      link.addEventListener("click", event => {
        event.preventDefault();

        const policy = policies[link.dataset.legal];
        if (!policy || !legalPopover) return;

        if (legalTitle) legalTitle.textContent = policy[0];
        if (legalText) legalText.textContent = policy[1];

        legalPopover.hidden = false;
        $(".legal-close", legalPopover)?.focus();
      });
    });

    $(".legal-close")?.addEventListener("click", closeLegal);

    // Close the policy popover when clicking anywhere outside it
    document.addEventListener("click", event => {
      if (
        legalPopover &&
        !legalPopover.hidden &&
        !legalPopover.contains(event.target) &&
        !event.target.closest("[data-legal]")
      ) {
        closeLegal();
      }
    });

    // Single Escape handler for every overlay
    document.addEventListener("keydown", event => {
      if (event.key !== "Escape") return;

      if (modal && !modal.hidden) closeLogin();
      if (lightbox && !lightbox.hidden) closeLightbox();
      closeLegal();
      closeNav();
    });

    updateDashboard();

    // =====================================================
    // INTERACTIVE EXPERIENCE
    // =====================================================
    const reduceMotion =
      window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isLight = () => document.body.classList.contains("light-theme");
    const rand = (min, max) => min + Math.random() * (max - min);
    const hero = $(".hero");
    const header = $(".site-header");
    const progress = $("#scrollProgress");

    // Scroll progress, header shadow, hero parallax
    let scrollTicking = false;

    function onScroll() {
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;

      if (progress) progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
      header?.classList.toggle("scrolled", y > 20);

      if (hero && !reduceMotion && y < window.innerHeight) {
        hero.style.setProperty("--py", `${y * 0.16}px`);
      }

      scrollTicking = false;
    }

    window.addEventListener("scroll", () => {
      if (!scrollTicking) {
        scrollTicking = true;
        requestAnimationFrame(onScroll);
      }
    }, { passive: true });

    onScroll();

    // Highlight the nav link of the section in view
    const spyLinks = $$('.main-nav a.nav-link[href^="#"]');

    if ("IntersectionObserver" in window && spyLinks.length) {
      const spy = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          spyLinks.forEach(link => {
            link.classList.toggle("active", link.getAttribute("href") === "#" + entry.target.id);
          });
        });
      }, { rootMargin: "-40% 0px -55% 0px" });

      spyLinks.forEach(link => {
        const section = $(link.getAttribute("href"));
        if (section) spy.observe(section);
      });
    }

    // Service arrows pre-select the treatment in the booking form
    $$(".circle-arrow").forEach(link => {
      link.addEventListener("click", () => {
        const name = $("h3", link.closest(".service-card"))?.textContent.trim();
        const select = $("#serviceSelect");

        if (name && select) {
          select.value = Array.from(select.options).some(o => o.text === name) ? name : "";
        }
      });
    });

    // Service cards: 3D tilt + cursor spotlight
    $$(".service-card").forEach(card => {
      card.addEventListener("pointermove", event => {
        const rect = card.getBoundingClientRect();
        const px = (event.clientX - rect.left) / rect.width;
        const py = (event.clientY - rect.top) / rect.height;

        card.style.setProperty("--sx", px * 100 + "%");
        card.style.setProperty("--sy", py * 100 + "%");

        if (reduceMotion || event.pointerType !== "mouse" || !card.classList.contains("is-visible")) return;

        card.style.transform =
          `perspective(900px) rotateX(${(0.5 - py) * 7}deg) rotateY(${(px - 0.5) * 9}deg) translateY(-7px)`;
      });

      card.addEventListener("pointerleave", () => {
        card.style.transform = "";
      });
    });

    // Magnetic call-to-action buttons
    if (!reduceMotion) {
      $$(".hero-actions .button, .footer-cta .button, .home2-copy .button").forEach(button => {
        button.addEventListener("pointermove", event => {
          const rect = button.getBoundingClientRect();
          const dx = (event.clientX - rect.left - rect.width / 2) * 0.18;
          const dy = (event.clientY - rect.top - rect.height / 2) * 0.28;
          button.style.transform = `translate(${dx}px, ${dy}px)`;
        });

        button.addEventListener("pointerleave", () => {
          button.style.transform = "";
        });
      });
    }

    // Before / after paint-correction comparison
    const compare = $("#compare");

    if (compare) {
      const handle = $(".compare-handle", compare);
      let dragging = false;

      function setPosition(percent) {
        const value = Math.max(0, Math.min(100, percent));
        compare.style.setProperty("--pos", value + "%");
        handle?.setAttribute("aria-valuenow", String(Math.round(value)));
      }

      function fromPointer(event) {
        const rect = compare.getBoundingClientRect();
        setPosition(((event.clientX - rect.left) / rect.width) * 100);
      }

      compare.addEventListener("pointerdown", event => {
        dragging = true;
        compare.setPointerCapture?.(event.pointerId);
        fromPointer(event);
      });

      compare.addEventListener("pointermove", event => {
        if (dragging || event.pointerType === "mouse") fromPointer(event);
      });

      ["pointerup", "pointercancel"].forEach(type => {
        compare.addEventListener(type, () => { dragging = false; });
      });

      handle?.addEventListener("keydown", event => {
        const current = Number(handle.getAttribute("aria-valuenow")) || 50;

        if (event.key === "ArrowLeft") { event.preventDefault(); setPosition(current - 5); }
        if (event.key === "ArrowRight") { event.preventDefault(); setPosition(current + 5); }
      });

      // Intro sweep the first time it scrolls into view
      if ("IntersectionObserver" in window && !reduceMotion) {
        const sweep = new IntersectionObserver(entries => {
          if (!entries[0].isIntersecting) return;
          sweep.disconnect();

          const startTime = performance.now();
          const step = now => {
            const t = Math.min((now - startTime) / 1400, 1);
            setPosition(100 - 50 * (1 - Math.pow(1 - t, 3)));
            if (t < 1) requestAnimationFrame(step);
          };

          requestAnimationFrame(step);
        }, { threshold: 0.5 });

        sweep.observe(compare);
      }
    }

    // FAQ: keep one answer open at a time
    $$(".faq-item").forEach(item => {
      item.addEventListener("toggle", () => {
        if (!item.open) return;
        $$(".faq-item").forEach(other => { if (other !== item) other.open = false; });
      });
    });

    // Footer newsletter (demo: saved in this browser only)
    $("#newsletterForm")?.addEventListener("submit", event => {
      event.preventDefault();

      const form = event.currentTarget;
      if (!form.reportValidity()) return;

      storage.set("noir-newsletter", $("#newsletterEmail").value.trim());
      form.reset();
      showToast("Thanks — you're on the studio list");
    });

    // Hero: live studio status, cursor glow, floating chips
    function updateStudioStatus() {
      const text = $("#studioStatusText");
      const chip = $("#studioStatus");
      if (!text) return;

      let now;
      try {
        now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
      } catch (error) {
        now = new Date();
      }

      const day = now.getDay();
      const hour = now.getHours() + now.getMinutes() / 60;
      const open = day !== 0 && hour >= 9 && hour < 19;

      chip?.classList.toggle("is-open", open);

      if (open) {
        text.textContent = "Studio open · closes 7 PM";
      } else {
        const next = day === 0 || (day === 6 && hour >= 19) ? "Mon 9 AM" : hour >= 19 ? "tomorrow 9 AM" : "today 9 AM";
        text.textContent = "Studio closed · opens " + next;
      }
    }

    updateStudioStatus();
    window.setInterval(updateStudioStatus, 60000);

    hero?.addEventListener("pointermove", event => {
      const rect = hero.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      hero.style.setProperty("--mx", x + "px");
      hero.style.setProperty("--my", y + "px");

      if (!reduceMotion) {
        hero.style.setProperty("--cx", (x / rect.width - 0.5).toFixed(3));
        hero.style.setProperty("--cy", (y / rect.height - 0.5).toFixed(3));
      }
    });

    // Treatment explorer tabs
    const tabs = $$(".tab");
    const panels = $$(".tab-panel");

    function selectTab(name, focus) {
      tabs.forEach(tab => {
        const on = tab.dataset.tab === name;
        tab.classList.toggle("active", on);
        tab.setAttribute("aria-selected", String(on));
        tab.tabIndex = on ? 0 : -1;
        if (on && focus) tab.focus();
      });

      panels.forEach(panel => panel.classList.toggle("active", panel.id === "panel-" + name));
    }

    tabs.forEach((tab, index) => {
      tab.addEventListener("click", () => selectTab(tab.dataset.tab));

      tab.addEventListener("keydown", event => {
        if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
        const step = event.key === "ArrowRight" ? 1 : -1;
        selectTab(tabs[(index + step + tabs.length) % tabs.length].dataset.tab, true);
      });
    });

    $$("[data-service]").forEach(button => {
      button.addEventListener("click", () => {
        const select = $("#serviceSelect");
        if (select) select.value = button.dataset.service;
      });
    });

    // Price estimator
    const estimator = $("#estimator");

    if (estimator) {
      const money = value => "₹" + Math.round(value).toLocaleString("en-IN");
      const lines = $("#estLines");
      const bookButton = $("#estBook");

      function calculate() {
        const multiplier = Number($('input[name="size"]:checked', estimator)?.value || 1);
        const chosen = $$(".est-treatments input:checked", estimator);
        let subtotal = 0;
        let days = 0;

        lines.textContent = "";

        chosen.forEach(input => {
          const price = Number(input.dataset.price) * multiplier;
          subtotal += price;
          days += Number(input.dataset.days);

          const item = document.createElement("li");
          const name = document.createElement("span");
          const amount = document.createElement("b");

          name.textContent = input.dataset.name;
          amount.textContent = money(price);
          item.append(name, amount);
          lines.appendChild(item);
        });

        if (!chosen.length) {
          const empty = document.createElement("li");
          empty.className = "empty";
          empty.textContent = "Select at least one treatment";
          lines.appendChild(empty);
        }

        const rate = chosen.length >= 3 ? 0.1 : chosen.length === 2 ? 0.05 : 0;
        const discount = subtotal * rate;

        $("#estDiscount").textContent = rate ? "− " + money(discount) + " (" + rate * 100 + "%)" : "—";
        $("#estTotal").textContent = money(subtotal - discount);
        $("#estTime").textContent = chosen.length ? "Estimated time: up to " + days + (days > 1 ? " days" : " day") : "";
        bookButton.disabled = !chosen.length;
      }

      estimator.addEventListener("change", calculate);
      calculate();

      bookButton.addEventListener("click", () => {
        const names = $$(".est-treatments input:checked", estimator).map(input => input.dataset.name);
        const select = $("#serviceSelect");

        if (select && names.length) {
          const single = names.length === 1 && Array.from(select.options).some(o => o.text === names[0]);
          select.value = single ? names[0] : "Full detail package";
        }

        showToast("Plan added to your booking request");
        $("#booking")?.scrollIntoView({ behavior: "smooth" });
      });
    }

    // Reviews carousel
    const slides = $$(".quote-slide");
    const dotsWrap = $(".q-dots");

    if (slides.length && dotsWrap) {
      let index = 0;
      let timer;

      const dots = slides.map((_, i) => {
        const dot = document.createElement("button");
        dot.type = "button";
        dot.className = "q-dot";
        dot.setAttribute("aria-label", "Show review " + (i + 1));
        dot.addEventListener("click", () => { show(i); restart(); });
        dotsWrap.appendChild(dot);
        return dot;
      });

      function show(i) {
        index = (i + slides.length) % slides.length;
        slides.forEach((slide, k) => slide.classList.toggle("active", k === index));
        dots.forEach((dot, k) => dot.classList.toggle("active", k === index));
      }

      function restart() {
        window.clearInterval(timer);
        if (!reduceMotion) timer = window.setInterval(() => show(index + 1), 6500);
      }

      $$(".q-btn").forEach(button => {
        button.addEventListener("click", () => { show(index + Number(button.dataset.dir)); restart(); });
      });

      const box = $(".quote-slides");
      box?.addEventListener("pointerenter", () => window.clearInterval(timer));
      box?.addEventListener("pointerleave", restart);

      show(0);
      restart();
    }

    // =====================================================
    // NOIR v7: NEW SECTIONS
    // =====================================================

    // Photos in the new sections: if one fails, the gradient panel behind it stays visible
    $$(".roads-photo img, .tour-photo img").forEach(image => {
      image.addEventListener("error", () => { image.style.display = "none"; });
    });

    // ---------- Car Care Advisor ----------
    const advQuestions = [
      { q: "How does your paint look right now?", o: [
        ["Brand new or under a year old", "", { ceramic: 3, full: 1 }],
        ["Dull, hazy or full of swirl marks", "", { correction: 3, full: 2 }],
        ["Fine outside, tired inside", "", { interior: 3, full: 1 }]
      ] },
      { q: "What matters most to you?", o: [
        ["Long-term protection", "Lasts years, easier washing", { ceramic: 3, full: 1 }],
        ["Maximum gloss and depth", "Showroom-level shine", { correction: 2, full: 3 }],
        ["A fresh, healthy cabin", "Clean air and soft surfaces", { interior: 3 }]
      ] },
      { q: "How do you use the car?", o: [
        ["Daily city commute", "Heat, traffic and dust", { ceramic: 2, interior: 1 }],
        ["Weekends and long drives", "Highway chips and bugs", { ceramic: 1, correction: 1, full: 2 }],
        ["Family car with kids", "Spills, crumbs and odours", { interior: 3, full: 1 }]
      ] }
    ];

    const advResults = {
      ceramic: ["Ceramic coating", "Your paint is in good shape, so the best move is to lock that in. A 9H ceramic layer shields against UV, rain and dust for up to five years."],
      correction: ["Paint correction", "Swirls and haze are hiding your paint's real depth. Multi-stage polishing restores clarity before anything gets sealed on top."],
      interior: ["Interior atelier", "The cabin is where you spend your time. A deep steam, extraction and leather conditioning will make it feel new."],
      full: ["Full detail package", "You want it all, and your car would benefit. One inspection and one hand-over covers correction, coating and interior, with a free first maintenance wash."]
    };

    const advCard = $("#advCard");

    if (advCard) {
      const advQ = $("#advQ");
      const advOpts = $("#advOpts");
      const advResult = $("#advResult");
      let advStep = 0;
      let advScore = {};
      let advPick = "ceramic";

      function renderAdvisor() {
        advResult.hidden = true;
        advOpts.hidden = false;
        advQ.hidden = false;

        const current = advQuestions[advStep];

        $("#advStep").textContent = "Question " + (advStep + 1) + " of " + advQuestions.length;
        $("#advBar").style.width = (advStep / advQuestions.length) * 100 + "%";
        advQ.textContent = current.q;
        advOpts.textContent = "";

        current.o.forEach(([label, sub, points]) => {
          const button = document.createElement("button");
          button.type = "button";
          button.className = "adv-opt";
          button.textContent = label;

          if (sub) {
            const small = document.createElement("small");
            small.textContent = sub;
            button.appendChild(small);
          }

          button.addEventListener("click", () => {
            for (const key in points) advScore[key] = (advScore[key] || 0) + points[key];
            advStep++;
            if (advStep < advQuestions.length) renderAdvisor();
            else finishAdvisor();
          });

          advOpts.appendChild(button);
        });
      }

      function finishAdvisor() {
        advPick = Object.keys(advScore).sort((a, b) => advScore[b] - advScore[a])[0] || "ceramic";

        $("#advBar").style.width = "100%";
        $("#advStep").textContent = "Done";
        advQ.hidden = true;
        advOpts.hidden = true;
        advResult.hidden = false;
        $("#advName").textContent = advResults[advPick][0];
        $("#advWhy").textContent = advResults[advPick][1];
      }

      $("#advRestart")?.addEventListener("click", () => {
        advStep = 0;
        advScore = {};
        renderAdvisor();
      });

      $("#advBook")?.addEventListener("click", () => {
        const select = $("#serviceSelect");
        if (select) select.value = advResults[advPick][0];

        showToast("Treatment added to your booking");
        $("#booking")?.scrollIntoView({ behavior: "smooth" });
      });

      renderAdvisor();
    }

    // ---------- Built for Indian roads: threat tabs ----------
    const threatTexts = [
      "<strong>UV and heat.</strong> Chennai summers push paint past 45°C, fading clear coat and cooking dashboards. Ceramic coating and tint cut both.",
      "<strong>Monsoon.</strong> Acidic rain leaves etched water spots. Hydrophobic coatings make water slide off before it dries on the surface.",
      "<strong>Dust and salt air.</strong> Coastal salt and fine road dust grind into paint during washes. A slick coating and regular safe washes prevent micro-scratches."
    ];
    const threatPanel = $("#threatPanel");

    if (threatPanel) {
      const showThreat = i => {
        $$(".threat").forEach((button, k) => button.classList.toggle("active", k === i));
        threatPanel.innerHTML = threatTexts[i];
      };

      $$(".threat").forEach((button, i) => button.addEventListener("click", () => showThreat(i)));
      showThreat(0);
    }

    // ---------- Care plans: per visit / yearly ----------
    const planMoney = value => "₹" + Number(value).toLocaleString("en-IN");

    $$(".bill").forEach(button => {
      button.addEventListener("click", () => {
        $$(".bill").forEach(other => other.classList.toggle("active", other === button));

        const yearly = button.dataset.period === "year";

        $$(".plan-price strong").forEach(price => {
          price.textContent = planMoney(yearly ? price.dataset.year : price.dataset.visit);
          price.nextElementSibling.textContent = yearly ? "/ year" : "/ visit";
        });
      });
    });

    // ---------- Aftercare timeline ----------
    const aftercareSteps = [
      ["First 24 hours", [
        "Keep the car dry and covered. Avoid rain contact if possible.",
        "No washing, wiping or parking under trees.",
        "Expect a slightly streaky look while the coating settles."
      ]],
      ["First week", [
        "Park in shade where you can.",
        "Do not use automatic brush washes or wax.",
        "Wipe bird droppings or sap gently with a damp microfibre."
      ]],
      ["First 30 days", [
        "Wash only after 7 days, with pH-neutral shampoo.",
        "Use the two-bucket method and a soft mitt.",
        "Book your free first maintenance wash with us."
      ]],
      ["Every 12 months", [
        "Annual coating inspection and decontamination.",
        "Top-up spray restores hydrophobic behaviour.",
        "Warranty stays valid with yearly check-ups."
      ]]
    ];
    const afterBody = $("#afterBody");

    if (afterBody) {
      const showAftercare = i => {
        $$(".astep").forEach((button, k) => button.classList.toggle("active", k === i));
        afterBody.textContent = "";

        const heading = document.createElement("h3");
        heading.textContent = aftercareSteps[i][0];

        const list = document.createElement("ul");
        aftercareSteps[i][1].forEach(text => {
          const item = document.createElement("li");
          item.textContent = text;
          list.appendChild(item);
        });

        afterBody.append(heading, list);
        afterBody.style.animation = "none";
        void afterBody.offsetWidth;
        afterBody.style.animation = "";
      };

      $$(".astep").forEach(button => {
        button.addEventListener("click", () => showAftercare(Number(button.dataset.i)));
      });

      showAftercare(0);
    }

    // ---------- Footer: live studio status + copy email ----------
    const footStatus = $("#footStatus");

    if (footStatus) {
      const updateFooterStatus = () => {
        let now;
        try {
          now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
        } catch (error) {
          now = new Date();
        }

        const day = now.getDay();
        const hour = now.getHours() + now.getMinutes() / 60;
        const open = day !== 0 && hour >= 9 && hour < 19;

        footStatus.classList.toggle("is-open", open);
        footStatus.lastElementChild.textContent = open
          ? "Open now · until 7 PM"
          : "Closed · opens Mon–Sat 9 AM";
      };

      updateFooterStatus();
      window.setInterval(updateFooterStatus, 60000);
    }

    $("#copyEmail")?.addEventListener("click", () => {
      const email = "studio@noiratelier.example";

      (navigator.clipboard ? navigator.clipboard.writeText(email) : Promise.reject())
        .then(() => showToast("Email copied"), () => showToast(email));
    });

    // =====================================================
    // NOIR v8: inner-page sections
    // =====================================================
    $$(".gt").forEach(group => {
      const buttons = $$(".gt-btn", group);
      const panes = $$(".gt-pane", group);

      buttons.forEach((button, i) => {
        button.addEventListener("click", () => {
          buttons.forEach((b, k) => b.classList.toggle("active", k === i));
          panes.forEach((p, k) => p.classList.toggle("active", k === i));
        });
      });
    });

    // Estimator: load a sample plan
    $$("[data-load]").forEach(button => {
      button.addEventListener("click", () => {
        const box = $("#estimator");
        if (!box) return;

        const wanted = button.dataset.items.split("|");
        const size = $('input[name="size"][value="' + button.dataset.size + '"]', box);
        if (size) size.checked = true;

        $$(".est-treatments input", box).forEach(input => {
          input.checked = wanted.includes(input.dataset.name);
        });

        box.dispatchEvent(new Event("change", { bubbles: true }));
        showToast("Plan loaded into the estimator");
        box.scrollIntoView({ behavior: "smooth" });
      });
    });

    // Value calculator: coating vs wax
    const yearsRange = $("#yrs");

    if (yearsRange) {
      const rupees = n => "₹" + Math.round(n).toLocaleString("en-IN");

      const updateYears = () => {
        const years = Number(yearsRange.value);
        const ceramic = Math.ceil(years / 5) * 24999;
        const wax = years * 1500 * 4;
        const top = Math.max(ceramic, wax);

        $("#yrsOut").textContent = years;
        $("#valC").textContent = rupees(ceramic);
        $("#valW").textContent = rupees(wax);
        $("#barC").style.width = (ceramic / top) * 100 + "%";
        $("#barW").style.width = (wax / top) * 100 + "%";
      };

      yearsRange.addEventListener("input", updateYears);
      updateYears();
    }
  });
})();
(() => {
  "use strict";
  document.addEventListener("DOMContentLoaded", () => {
    const $ = (s, r = document) => r.querySelector(s);
    const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
    const inr = n => "₹" + Math.round(n).toLocaleString("en-IN");
    const save = (k, v) => { try { const a = JSON.parse(localStorage.getItem(k) || "[]"); a.push(v); localStorage.setItem(k, JSON.stringify(a)); } catch (e) {} };
    const toast = msg => {
      let t = $("#toast");
      if (!t) { t = document.createElement("div"); t.id = "toast"; t.className = "toast"; document.body.appendChild(t); }
      t.textContent = msg; t.classList.add("show");
      clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove("show"), 2800);
    };

    // ---- floating WhatsApp, back to top, mobile booking bar (all pages) ----
    if (!$(".nx-fab")) {
      const fab = document.createElement("div");
      fab.className = "nx-fab";
      fab.innerHTML = '<button class="nx-top" type="button" aria-label="Back to top"><svg viewBox="0 0 24 24"><path d="M12 5l7 8h-4.5v6h-5v-6H5z"/></svg></button><a class="nx-wa" href="https://wa.me/919876543210" target="_blank" rel="noopener noreferrer" aria-label="Chat on WhatsApp"><svg viewBox="0 0 24 24"><path d="M20.5 3.5A11.8 11.8 0 0 0 2 17.7L.5 23.5l6-1.6A11.8 11.8 0 0 0 20.5 3.5ZM12 21a9.1 9.1 0 0 1-4.6-1.2l-3.5.9.9-3.4A9.2 9.2 0 1 1 12 21Zm5-6.9c-.3-.2-1.7-.9-2-.9s-.5-.2-.7.2-.8.9-1 1.1-.4.2-.7.1a7.5 7.5 0 0 1-2.2-1.4 8.2 8.2 0 0 1-1.5-1.9c-.2-.3 0-.5.1-.6l.5-.6c.2-.2.2-.4.3-.5s0-.4 0-.5l-.9-2.1c-.2-.5-.5-.4-.7-.4h-.6c-.2 0-.5.1-.8.4s-1 1-1 2.4 1 2.7 1.2 2.9a11.2 11.2 0 0 0 4.3 3.8c.6.3 1.1.5 1.5.6.6.2 1.2.2 1.6.1.5-.1 1.7-.7 1.9-1.3s.2-1.2.2-1.3-.2-.2-.5-.4z"/></svg></a>';
      document.body.appendChild(fab);
      const top = $(".nx-top", fab);
      top.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
      addEventListener("scroll", () => top.classList.toggle("show", scrollY > 700), { passive: true });
      const bar = document.createElement("div");
      bar.className = "nx-bar";
      bar.innerHTML = '<a href="#booking">Book a session</a><a href="tel:+919876543210">Call now</a>';
      document.body.appendChild(bar);
    }

    // ---- vehicle finder ----
    const tabsEl = $("#nxTabs"), card = $("#nxFitCard");
    if (tabsEl && card) {
      const fitImages = {
        "fit-hatch": "https://images.unsplash.com/photo-1730577220440-d89e0726c6ee?auto=format&fit=crop&w=1400&q=80",
        "fit-sedan": "https://images.unsplash.com/photo-1485291571150-772bcfc10da5?auto=format&fit=crop&w=1400&q=80",
        "fit-suv": "https://images.unsplash.com/photo-1598248691267-4a62dfdfd8a8?auto=format&fit=crop&w=1400&q=80",
        "fit-lux": "https://images.unsplash.com/photo-1619431856706-ca2cc58258f6?auto=format&fit=crop&w=1400&q=80",
        "fit-bike": "https://images.pexels.com/photos/1715189/pexels-photo-1715189.jpeg?auto=compress&cs=tinysrgb&w=1400"
      };
      const U = id => fitImages[id] || fitImages["fit-sedan"];
      const V = [
        ["Hatchback", "fit-hatch", "Compact and city-ready", "Tight panels collect dust and parking scuffs fast. Interior atelier with wheel and glass protection keeps a daily hatchback fresh.", "Half a day", "Interior + wheels", 9498, "Interior atelier"],
        ["Sedan", "fit-sedan", "Long panels, long-term shine", "More paint area means more chances for swirls. Paint correction followed by a ceramic coating gives the deepest result.", "2 to 3 days", "Correction + ceramic", 28749, "Ceramic coating"],
        ["SUV", "fit-suv", "Tall, large and dusty", "Big glass and tall bodies take real time and product. A ceramic coating with a full interior reset suits family SUVs.", "3 days", "Ceramic + interior", 32499, "Full detail package"],
        ["Luxury / sports", "fit-lux", "Soft paint, high stakes", "Specialist paint needs measured, gentle work. We map paint depth first, then correct, coat and add film on impact zones.", "4 to 5 days", "Full detail package", 49498, "Full detail package"],
        ["Motorcycle", "fit-bike", "Metal, chrome and tight corners", "Hand polishing of tank and fairings, chain and engine detailing, and a ceramic coat that resists heat and rain.", "1 day", "Polish + ceramic", 9999, "Ceramic coating"]
      ];
      const draw = i => {
        const v = V[i];
        $$(".gt-btn", tabsEl).forEach((b, k) => { b.classList.toggle("active", k === i); b.setAttribute("aria-selected", k === i); });
        card.innerHTML = `<div class="nx-fit-img"><img src="${U(v[1])}" alt="${v[0]} detailing example" loading="lazy" onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1518306727298-4c17e1bf6942?auto=format&fit=crop&w=1600&q=80'"></div><div class="nx-fit-body"><h3>${v[2]}</h3><p>${v[3]}</p><div class="nx-facts"><div><span>Time</span><strong>${v[4]}</strong></div><div><span>Package</span><strong>${v[5]}</strong></div><div><span>From</span><strong>${inr(v[6])}</strong></div></div><a class="button button-gold" href="#booking" data-pick="${v[7]}">Book for my ${v[0].toLowerCase()} <span>↗</span></a></div>`;
        card.style.animation = "none"; void card.offsetWidth; card.style.animation = "";
      };
      V.forEach((v, i) => {
        const b = document.createElement("button");
        b.type = "button"; b.className = "gt-btn"; b.setAttribute("role", "tab"); b.textContent = v[0];
        b.addEventListener("click", () => draw(i)); tabsEl.appendChild(b);
      });
      card.addEventListener("click", e => {
        const a = e.target.closest("[data-pick]"); const s = $("#serviceSelect");
        if (a && s) s.value = a.dataset.pick;
      });
      draw(0);
    }

    // ---- fleet quote ----
    $("#nxLead")?.addEventListener("submit", e => {
      e.preventDefault();
      save("noir-fleet-leads", { name: $("#nxLName").value, phone: $("#nxLPhone").value, company: $("#nxLCo").value, size: $("#nxLSize").value, at: new Date().toISOString() });
      e.target.reset(); toast("Fleet quote request saved. We will call you.");
    });

    // ---- job tracker (demo) ----
    const stages = ["Checked in", "Inspection", "Wash and decontamination", "Paint correction", "Coating and curing", "Final quality check", "Ready for pickup"];
    $("#nxTrackForm")?.addEventListener("submit", e => {
      e.preventDefault();
      const ref = $("#nxRef").value.trim().toUpperCase(), out = $("#nxTrackOut");
      let latest = null; try { latest = JSON.parse(localStorage.getItem("noir-latest-booking") || "null"); } catch (x) {}
      let step;
      if (ref === "NA-DEMO1") step = 3;
      else if (latest && latest.id === ref) step = 0;
      else if (/^NA-[A-Z0-9]{5}$/.test(ref)) step = [...ref].reduce((a, c) => a + c.charCodeAt(0), 0) % 7;
      out.hidden = false;
      if (step === undefined) { out.innerHTML = "<h3>Reference not found</h3><p>Check the code from your confirmation. It looks like NA-7K2QX.</p>"; return; }
      out.innerHTML = "<h3>" + ref + " · " + stages[step] + "</h3><p>" + (step === 6 ? "Your car is ready. Bring your ID and booking reference." : "We will send a photo update at the next stage.") + '</p><ol class="track">' + stages.map((s, i) => '<li class="' + (i < step ? "done" : i === step ? "now done" : "") + '">' + s + "</li>").join("") + '</ol><small class="form-note">Demo tracker: statuses are simulated in this browser.</small>';
    });

    // ---- gift card ----
    if ($("#gcAmt")) {
      const upd = () => {
        $("#gcAmt").textContent = inr($('input[name="gamt"]:checked').value);
        $("#gcTo").textContent = $("#gTo").value.trim() || "you";
        $("#gcFrom").textContent = $("#gFrom").value.trim() || "a friend";
        $("#gcMsg").textContent = $("#gMsg").value.trim() || "A gift of a perfect finish.";
      };
      $(".nx-gift-form").addEventListener("input", upd);
      $("#gBuy").addEventListener("click", () => {
        save("noir-gift-requests", { amount: $('input[name="gamt"]:checked').value, to: $("#gTo").value, from: $("#gFrom").value, msg: $("#gMsg").value, at: new Date().toISOString() });
        toast("Gift card request saved. The studio will confirm payment.");
      });
      upd();
    }

    // ---- EMI calculator ----
    const emiAmt = $("#emiAmt");
    if (emiAmt) {
      const calc = () => {
        const P = +emiAmt.value, n = +$('input[name="emi"]:checked').value, r = 0.14 / 12;
        const m = P * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
        $("#emiAmtOut").textContent = inr(P); $("#emiMo").textContent = inr(m); $("#emiTot").textContent = inr(m * n);
      };
      $(".nx-emi").addEventListener("input", calc); calc();
    }

    // ---- highlight today in opening hours ----
    const day = (() => { try { return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })).getDay(); } catch (e) { return new Date().getDay(); } })();
    $("#nxHours tr[data-d='" + day + "']")?.classList.add("today");
  });
})();

(() => {
  document.addEventListener("DOMContentLoaded", () => {
    const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
    const inr = n => "₹" + Math.round(n).toLocaleString("en-IN");
    const toast = m => { let t = $("#toast"); if (!t) { t = document.createElement("div"); t.id = "toast"; t.className = "toast"; document.body.appendChild(t); } t.textContent = m; t.classList.add("show"); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove("show"), 2800); };
    const save = (k, v) => { try { const a = JSON.parse(localStorage.getItem(k) || "[]"); a.push(v); localStorage.setItem(k, JSON.stringify(a)); } catch (e) {} };
    // generic demo forms
    $$("form[data-nx-save]").forEach(f => f.addEventListener("submit", e => {
      e.preventDefault(); const d = { at: new Date().toISOString() };
      $$("input,select", f).forEach(x => d[x.id] = x.value); save("noir-" + f.dataset.nxSave, d); f.reset(); toast("Saved. The studio will be in touch.");
    }));
    // PPF zones
    const ppf = $(".nz-ppf");
    if (ppf) {
      const upd = () => { let t = 0; $$("[data-zone]", ppf).forEach(c => { const on = c.checked; if (on) t += +c.dataset.price; $$('[data-z="' + c.dataset.zone + '"]', ppf).forEach(el => el.classList.toggle("on", on)); }); $("#nzPpfTot").textContent = inr(t); };
      ppf.addEventListener("change", upd);
      $$("[data-z]", ppf).forEach(el => el.addEventListener("click", () => { const c = $('[data-zone="' + el.dataset.z + '"]', ppf); c.checked = !c.checked; upd(); }));
      upd();
    }
    // tint preview
    if ($("#nzGlass")) {
      const upd = () => { const v = +$('input[name="vlt"]:checked').value; $("#nzGlass").style.opacity = (1 - v / 100).toFixed(2); $("#nzVlt").textContent = v + "% light passes" + (v <= 20 ? " · very dark" : v >= 50 ? " · legal-friendly" : ""); };
      $(".nz-vlt").addEventListener("change", upd); upd();
    }
    // portfolio filter
    $$(".nz-filter .gt-btn").forEach(b => b.addEventListener("click", () => {
      $$(".nz-filter .gt-btn").forEach(x => x.classList.toggle("active", x === b));
      $$(".nz-pf .gallery-item").forEach(i => { i.hidden = b.dataset.f !== "all" && i.dataset.cat !== b.dataset.f; i.classList.add("is-visible"); });
    }));
    // budget finder
    const bg = $("#bgt");
    if (bg) {
      const plans = [[5000, "Wash plan", "Maintenance washes and a quick interior vacuum."], [10000, "Interior atelier", "Deep clean and conditioning for the cabin."], [20000, "Paint correction", "Swirls and haze removed for deeper gloss."], [40000, "Ceramic coating", "Up to 5 years of protection with a polish first."], [999999, "Full detail package", "Interior, correction and coating in one booking."]];
      const upd = () => { const v = +bg.value, p = plans.find(x => v < x[0]) || plans[4]; $("#bgtOut").textContent = inr(v); $("#bgtPlan").textContent = p[1]; $("#bgtText").textContent = p[2]; };
      bg.addEventListener("input", upd); upd();
    }
    // resale illustration
    const rs = $("#rsVal");
    if (rs) { const upd = () => { const v = +rs.value; $("#rsOut").textContent = inr(v); $("#rsUp").textContent = inr(v * .02) + " – " + inr(v * .05); }; rs.addEventListener("input", upd); upd(); }
    // service planner
    const nd = $("#nxDate");
    if (nd) {
      const upd = () => { if (!nd.value) return; const d = new Date(nd.value); d.setMonth(d.getMonth() + +$("#nxLast").value); $("#nxDue").textContent = d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }); };
      nd.addEventListener("change", upd); $("#nxLast").addEventListener("change", upd);
    }
    // referral code
    $("#refGo")?.addEventListener("click", () => {
      const n = $("#refName").value.trim().replace(/[^a-z]/gi, "").toUpperCase().slice(0, 4);
      if (!n) { toast("Enter your name first"); return; }
      const c = "NOIR-" + n + Math.floor(100 + Math.random() * 900), box = $("#refCode"); box.hidden = false; box.textContent = c;
      navigator.clipboard?.writeText(c).then(() => toast("Code copied"), () => {});
    });
    // wrap colour preview
    $$(".sw").forEach(b => b.addEventListener("click", () => { $$(".sw").forEach(x => x.classList.toggle("active", x === b)); $("#nzPrev i").style.backgroundColor = b.dataset.c; $("#nzPrevN").textContent = b.dataset.n; }));
    // care shop enquiry
    $$("[data-enq]").forEach(b => b.addEventListener("click", () => toast(b.dataset.enq + " added to your enquiry")));
    // inner-page "data-service" buttons also pre-select the form
    $$("[data-service]").forEach(a => a.addEventListener("click", () => { const s = $("#serviceSelect"); if (s) s.value = a.dataset.service; }));
  });
})();

(() => {
  document.addEventListener("DOMContentLoaded", () => {
    const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

    // ===== Colour & finish visualiser =====
    const body = $("#nzBody");
    if (body) {
      const F = {
        gloss: [.6, 0, "Deep mirror reflections. The classic showroom look, best with ceramic coating.", "Ceramic coating"],
        metallic: [.4, .55, "Metal flake that sparkles in sun. Correction brings out the depth.", "Paint correction"],
        satin: [.22, 0, "A soft sheen between gloss and matte. Needs gentle, matte-safe care.", "Paint protection film"],
        matte: [0, 0, "No shine at all. Never polished, cleaned with matte-safe products only.", "Paint protection film"]
      };
      let color = "#0b0b0e", name = "Obsidian";
      const draw = () => {
        const f = $('input[name="vf"]:checked').value, coat = $("#nzCoat").checked, d = F[f];
        body.setAttribute("fill", color);
        $("#nzHl").setAttribute("opacity", Math.min(.85, d[0] + (coat && f !== "matte" ? .15 : 0)));
        $("#nzSp").setAttribute("opacity", d[1]);
        $("#nzBeads").setAttribute("opacity", coat ? .75 : 0);
        $("#nzVizName").textContent = name + " · " + f[0].toUpperCase() + f.slice(1) + (coat ? " · Coated" : "");
        $("#nzVizInfo").textContent = d[2];
        $("#nzVizBook").dataset.service = coat ? "Ceramic coating" : d[3];
      };
      $$(".nz-vs .sw").forEach(b => b.addEventListener("click", () => {
        $$(".nz-vs .sw").forEach(x => x.classList.toggle("active", x === b));
        color = b.dataset.vc; name = b.dataset.n; draw();
      }));
      $("#nzCustom").addEventListener("input", e => {
        $$(".nz-vs .sw").forEach(x => x.classList.remove("active"));
        color = e.target.value; name = "Custom " + color; draw();
      });
      $(".nz-vf").addEventListener("change", draw);
      $("#nzCoat").addEventListener("change", draw);
      draw();
    }

    // ===== Lightbox: next/prev, swipe, keyboard, click to zoom and pan =====
    const lb = $("#imageLightbox"), img = $("#lightboxImage");
    if (!lb || !img) return;
    const mk = (cls, label, txt) => { const b = document.createElement("button"); b.type = "button"; b.className = "lb-nav " + cls; b.setAttribute("aria-label", label); b.textContent = txt; lb.appendChild(b); return b; };
    const prev = mk("lb-prev", "Previous photo", "←"), next = mk("lb-next", "Next photo", "→");
    const count = document.createElement("p"); count.className = "lb-count"; lb.appendChild(count);
    let list = [], idx = 0, zoomed = false, tx = 0, ty = 0;

    const resetZoom = () => { zoomed = false; tx = ty = 0; img.classList.remove("zoomed"); img.style.transform = ""; };
    const show = i => {
      idx = (i + list.length) % list.length;
      const it = list[idx], im = $("img", it); if (!im) return;
      resetZoom();
      img.src = im.currentSrc || im.src; img.alt = im.alt || "Selected studio work";
      const cap = $("#lightboxCaption"); if (cap) cap.textContent = it.dataset.galleryTitle || im.alt || "Selected work";
      count.textContent = (idx + 1) + " / " + list.length;
      const one = list.length < 2; prev.hidden = next.hidden = one;
    };
    document.addEventListener("click", e => {
      const it = e.target.closest(".gallery-item"); if (!it) return;
      list = $$(".gallery-item").filter(x => !x.hidden && $("img", x) && $("img", x).style.display !== "none");
      show(Math.max(0, list.indexOf(it)));
    });
    prev.addEventListener("click", e => { e.stopPropagation(); show(idx - 1); });
    next.addEventListener("click", e => { e.stopPropagation(); show(idx + 1); });
    document.addEventListener("keydown", e => {
      if (lb.hidden) return;
      if (e.key === "ArrowRight") show(idx + 1);
      if (e.key === "ArrowLeft") show(idx - 1);
      if (e.key === "+" || e.key === "=") { zoomed = true; img.classList.add("zoomed"); img.style.transform = "scale(2.2)"; }
      if (e.key === "-" || e.key === "0") resetZoom();
    });

    // pointer: swipe when not zoomed, pan when zoomed, tap to toggle zoom
    let sx = 0, sy = 0, ox = 0, oy = 0, moved = false, down = false, was = false;
    img.addEventListener("pointerdown", e => { down = true; was = zoomed; moved = false; sx = e.clientX; sy = e.clientY; ox = tx; oy = ty; img.setPointerCapture?.(e.pointerId); });
    img.addEventListener("pointermove", e => {
      if (!down) return;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      if (Math.abs(dx) + Math.abs(dy) > 6) moved = true;
      if (zoomed) { tx = ox + dx; ty = oy + dy; img.style.transform = `translate(${tx}px,${ty}px) scale(2.2)`; }
      else if (moved) img.style.transform = `translateX(${dx}px)`;
    });
    const end = e => {
      if (!down) return; down = false;
      const dx = e.clientX - sx;
      if (zoomed) return;
      if (!moved) { zoomed = true; img.classList.add("zoomed"); img.style.transform = "scale(2.2)"; return; }
      img.style.transform = "";
      if (Math.abs(dx) > 60 && list.length > 1) show(idx + (dx < 0 ? 1 : -1));
    };
    img.addEventListener("pointerup", end);
    img.addEventListener("pointercancel", end);
    img.addEventListener("click", e => { e.stopPropagation(); if (was && !moved) resetZoom(); });
    img.addEventListener("dblclick", resetZoom);
    img.addEventListener("wheel", e => { if (lb.hidden) return; e.preventDefault(); if (e.deltaY < 0) { zoomed = true; img.classList.add("zoomed"); img.style.transform = `translate(${tx}px,${ty}px) scale(2.2)`; } else resetZoom(); }, { passive: false });
  });
})();

/* ---- global image safety net: if any <img> fails to load, swap in a backup car photo once ---- */
(function () {
  var BACKUP = [
    "https://images.unsplash.com/photo-1518306727298-4c17e1bf6942?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1621639532859-8b26570b96fc?auto=format&fit=crop&w=1600&q=80"
  ];
  var used = 0;
  document.addEventListener("error", function (e) {
    var el = e.target;
    if (!el || el.tagName !== "IMG" || el.dataset.fb) return;
    el.dataset.fb = "1";
    el.src = BACKUP[used++ % BACKUP.length];
  }, true);
})();