(function () {
  "use strict";

  var modal = document.querySelector("[data-distribution-modal]");
  var frame = document.getElementById("silhouette-b2b-distribution-form");
  var status = document.querySelector("[data-modal-status]");
  var lastFocused = null;
  var completed = false;
  var redirectStarted = false;
  var postSuccessRoute = "https://roraimamx.com/silhouette/#/catalogo";

  function modalFocusables() {
    return modal ? Array.prototype.slice.call(modal.querySelectorAll("button:not([disabled]):not([tabindex='-1']), iframe, a[href]")) : [];
  }

  function openModal(trigger) {
    if (!modal) return;
    lastFocused = trigger || document.activeElement;
    modal.hidden = false;
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    var close = modal.querySelector("[data-close-distribution]:not(.modal-backdrop)");
    if (close) close.focus();
  }

  function closeModal() {
    if (!modal || modal.hidden) return;
    modal.hidden = true;
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    if (lastFocused && typeof lastFocused.focus === "function") lastFocused.focus();
  }

  document.addEventListener("click", function (event) {
    var open = event.target instanceof Element && event.target.closest("[data-open-distribution]");
    if (open) {
      event.preventDefault();
      openModal(open);
      return;
    }
    var close = event.target instanceof Element && event.target.closest("[data-close-distribution]");
    if (close) closeModal();
  });

  document.addEventListener("keydown", function (event) {
    if (!modal || modal.hidden) return;
    if (event.key === "Escape") {
      event.preventDefault();
      closeModal();
      return;
    }
    if (event.key !== "Tab") return;
    var focusables = modalFocusables();
    if (!focusables.length) return;
    var first = focusables[0];
    var last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  window.addEventListener("message", function (event) {
    if (completed || event.origin !== "https://api.leadconnectorhq.com" || !frame || event.source !== frame.contentWindow) return;
    if (!Array.isArray(event.data) || event.data[0] !== "set-sticky-contacts") return;
    completed = true;
    if (status) status.textContent = "Solicitud recibida. El equipo de Roraima revisará la información.";
    if (typeof window.__RORAIMA_TRACK_FORM_COMPLETE__ === "function") {
      window.__RORAIMA_TRACK_FORM_COMPLETE__({
        form_id: "silhouette_b2b_distribution",
        audience: "b2b",
        product_slug: "silhouette-professionals"
      }, "silhouette-b2b-distribution");
    }
    if (!redirectStarted) {
      redirectStarted = true;
      window.setTimeout(function () { window.location.assign(postSuccessRoute); }, 900);
    }
  });

  var menuToggle = document.querySelector("[data-menu-toggle]");
  var primaryNav = document.querySelector("[data-primary-nav]");
  if (menuToggle && primaryNav) {
    menuToggle.addEventListener("click", function () {
      var open = primaryNav.classList.toggle("is-open");
      menuToggle.setAttribute("aria-expanded", String(open));
    });
    primaryNav.addEventListener("click", function (event) {
      if (!(event.target instanceof Element) || !event.target.closest("a")) return;
      primaryNav.classList.remove("is-open");
      menuToggle.setAttribute("aria-expanded", "false");
    });
  }
})();
