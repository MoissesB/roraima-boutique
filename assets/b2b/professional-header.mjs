const BRAND_ROUTES = Object.freeze({
  "alfred-kerbs": "/profesionales/alfred-kerbs/",
  silhouette: "/profesionales/silhouette/catalogo/",
});

const ACCOUNT_ICON = `
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <circle cx="12" cy="8" r="3.25"></circle>
    <path d="M5.5 20c.55-4.15 2.72-6.25 6.5-6.25s5.95 2.1 6.5 6.25"></path>
  </svg>
`;

function professionalContext(expectedBrand) {
  try {
    return window.parent !== window
      && window.parent.location.origin === window.location.origin
      && window.parent.document.body?.dataset.professionalBrand === expectedBrand;
  } catch {
    return false;
  }
}

function visualPreviewContext() {
  try {
    return window.parent !== window
      && window.parent.location.origin === window.location.origin
      && window.parent.document.body?.dataset.professionalPreview === "true";
  } catch {
    return false;
  }
}

function brandRoute(brand) {
  if (!visualPreviewContext()) return BRAND_ROUTES[brand];
  return `/profesionales/vista/${brand}/`;
}

function orderRoute() {
  return visualPreviewContext() ? "/profesionales/vista/pedido/" : "/profesionales/pedidos/";
}

function topRoute(anchor, href) {
  if (!anchor) return;
  if (anchor.getAttribute("href") !== href) anchor.setAttribute("href", href);
  if (anchor.getAttribute("target") !== "_top") anchor.setAttribute("target", "_top");
  anchor.dataset.roraimaTopRoute = href;
  if (anchor.dataset.roraimaTopRouteListener !== href) {
    anchor.dataset.roraimaTopRouteListener = href;
    anchor.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      window.top.location.href = new URL(href, window.location.origin).href;
    }, true);
  }
}

function labelOf(element) {
  return element?.textContent?.replace(/\s+/g, " ").trim().toLowerCase() || "";
}

function setText(element, value) {
  if (element && element.textContent !== value) element.textContent = value;
}

function accountLink(compact = false) {
  const link = document.createElement("a");
  link.className = `roraima-professional-account${compact ? " is-mobile" : ""}`;
  link.href = visualPreviewContext() ? "/profesionales/vista/cuenta/" : "/profesionales/cuenta/";
  link.target = "_top";
  link.setAttribute("aria-label", "Abrir mi cuenta profesional");
  link.innerHTML = `<span>Mi cuenta</span><b>${ACCOUNT_ICON}</b>`;
  return link;
}

function installStyles() {
  if (document.getElementById("roraima-professional-header-style")) return;
  const style = document.createElement("style");
  style.id = "roraima-professional-header-style";
  style.textContent = `
    html[data-roraima-professional-catalog="true"] .innova-global-header,
    .innova-global-header {
      display: grid !important;
      position: sticky !important;
      top: 0 !important;
      z-index: 2500 !important;
      width: 100%;
      isolation: isolate;
    }
    .roraima-professional-advisor-hidden {
      display: none !important;
    }
    .roraima-professional-quick-add {
      position: fixed;
      z-index: 2147483000;
      left: 18px;
      bottom: 20px;
      max-width: calc(100vw - 180px);
      min-height: 48px;
      padding: 11px 20px;
      border: 1px solid #fff;
      border-radius: 999px;
      background: #211f20;
      color: #fff;
      box-shadow: 0 8px 24px #0004;
      font: 700 13px/1.2 Inter, Arial, sans-serif;
      cursor: pointer;
    }
    .roraima-professional-quick-add:focus-visible {
      outline: 3px solid #f5bd27;
      outline-offset: 2px;
    }
    @media (max-width: 700px) {
      .roraima-professional-quick-add {
        bottom: 86px;
        left: 12px;
        max-width: calc(100vw - 24px);
        min-height: 46px;
      }
    }
    .roraima-professional-account {
      min-height: 30px;
      display: inline-flex !important;
      align-items: center;
      gap: 7px;
      color: #fff !important;
      text-decoration: none;
      white-space: nowrap;
    }
    .roraima-professional-account > span {
      font: 700 8px/1 Inter, Arial, sans-serif;
      letter-spacing: .12em;
      text-transform: uppercase;
    }
    .roraima-professional-account > b {
      width: 23px;
      height: 23px;
      display: grid;
      place-items: center;
      color: #171514;
      background: #fff;
      border-radius: 999px;
    }
    .roraima-professional-account svg {
      width: 14px;
      height: 14px;
      fill: none;
      stroke: currentColor;
      stroke-width: 1.8;
      stroke-linecap: round;
    }
    .roraima-professional-account:focus-visible {
      outline: 2px solid #f5bd27;
      outline-offset: 2px;
    }
    .innova-global-mobile .roraima-professional-account.is-mobile {
      min-height: 46px;
      justify-content: space-between;
      color: #171514 !important;
      border-bottom: 1px solid rgba(23,21,20,.16);
    }
    .innova-global-mobile .roraima-professional-account.is-mobile > span {
      font-size: 11px;
      letter-spacing: 0;
      text-transform: none;
    }
    .innova-global-mobile .roraima-professional-account.is-mobile > b {
      color: #fff;
      background: #171514;
    }
    .roraima-professional-account.is-mobile-icon {
      display: none !important;
    }
    @media (max-width: 900px) {
      .innova-global-header {
        grid-template-columns: auto minmax(0, 1fr) auto auto !important;
        gap: 8px !important;
      }
      .innova-global-nav {
        display: none !important;
      }
      .innova-global-mobile {
        display: block !important;
      }
      .roraima-professional-account.is-mobile-icon {
        min-width: 28px;
        min-height: 34px;
        display: inline-flex !important;
        justify-content: center;
      }
      .roraima-professional-account.is-mobile-icon > span {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip: rect(0 0 0 0);
        white-space: nowrap;
      }
    }
  `;
  document.head.appendChild(style);
}

function updateBrandRail(header) {
  header.querySelectorAll(".roraima-brand-rail a").forEach((anchor) => {
    const label = labelOf(anchor);
    if (label.includes("alfred")) topRoute(anchor, brandRoute("alfred-kerbs"));
    if (label.includes("silhouette")) topRoute(anchor, brandRoute("silhouette"));
  });
}

function updateOrderLinks(header) {
  header.querySelectorAll("a").forEach((anchor) => {
    const label = labelOf(anchor);
    if (label.includes("pedido global") || label.includes("commande globale") || label.includes("global order")) {
      topRoute(anchor, orderRoute());
      setText(anchor, "Mi pedido");
    }
  });

  const order = header.querySelector(".innova-global-order");
  if (order) {
    topRoute(order, orderRoute());
    setText(order, "Mi pedido");
  }

  const desktop = header.querySelector(".innova-global-nav");
  if (desktop && !order && !desktop.querySelector(".roraima-professional-order-link")) {
    const link = document.createElement("a");
    link.className = "roraima-professional-order-link";
    link.textContent = "Mi pedido";
    topRoute(link, orderRoute());
    desktop.appendChild(link);
  }

  const mobilePanel = header.querySelector(".innova-global-mobile > div");
  if (mobilePanel && !mobilePanel.querySelector(".roraima-professional-order-link")) {
    const link = document.createElement("a");
    link.className = "roraima-professional-order-link";
    link.textContent = "Mi pedido";
    topRoute(link, orderRoute());
    mobilePanel.appendChild(link);
  }

  const visual = header.querySelector(".innova-global-mega-visual__content");
  if (visual) {
    const kicker = visual.querySelector("span");
    const title = visual.querySelector("strong");
    const copy = visual.querySelector("p");
    const action = visual.querySelector("a");
    setText(kicker, "PEDIDO RORAIMA");
    setText(title, "Una selección para dos firmas.");
    setText(copy, visualPreviewContext()
      ? "Combina referencias de Alfred Kerbs y Silhouette en esta vista visual."
      : "Combina referencias de Alfred Kerbs y Silhouette y envía cualquier pedido no vacío para revisión.");
    if (action) {
      topRoute(action, orderRoute());
      setText(action, "Abrir mi pedido →");
    }
  }
}

function updateHeader() {
  const header = document.querySelector(".innova-global-header");
  if (!header) return false;

  updateBrandRail(header);
  updateOrderLinks(header);

  const desktop = header.querySelector(".innova-global-nav");
  if (desktop && !desktop.querySelector(".roraima-professional-account")) {
    desktop.appendChild(accountLink());
  }

  const mobilePanel = header.querySelector(".innova-global-mobile > div");
  if (mobilePanel && !mobilePanel.querySelector(".roraima-professional-account")) {
    mobilePanel.appendChild(accountLink(true));
  }

  const mobileNavigation = header.querySelector(".innova-global-mobile");
  if (mobileNavigation && !header.querySelector(".roraima-professional-account.is-mobile-icon")) {
    const mobileIcon = accountLink();
    mobileIcon.classList.add("is-mobile-icon");
    mobileNavigation.before(mobileIcon);
  }
  return true;
}

function restoreProfessionalControls(brand) {
  if (brand !== "alfred-kerbs") return;
  document.documentElement.dataset.roraimaAudience = "b2b";
  document.documentElement.dataset.roraimaProfessionalCatalog = "true";
  document.querySelectorAll(`
    .catalog-card__select,
    .product-order-panel,
    .product-order-panel button,
    .professional-purchase,
    .professional-purchase button
  `).forEach((element) => {
    element.classList.remove("roraima-b2c-hidden");
    element.removeAttribute("aria-hidden");
  });
}

function updateAlfredQuickAdd(brand) {
  if (brand !== "alfred-kerbs" || !visualPreviewContext()) return;
  const original = document.querySelector(".product-order-panel button.button--dark");
  let quickAdd = document.getElementById("roraima-professional-quick-add");
  if (!original) {
    quickAdd?.remove();
    return;
  }
  if (!quickAdd) {
    quickAdd = document.createElement("button");
    quickAdd.id = "roraima-professional-quick-add";
    quickAdd.className = "roraima-professional-quick-add";
    quickAdd.type = "button";
    quickAdd.textContent = "Añadir a mi pedido";
    quickAdd.addEventListener("click", () => {
      document.querySelector(".product-order-panel button.button--dark")?.click();
    });
    document.body.appendChild(quickAdd);
  }
}

function updateSilhouetteProductActions(brand) {
  if (brand !== "silhouette") return;
  const isProductRoute = /^#\/producto\//i.test(window.location.hash);
  document.querySelectorAll("button, a").forEach((element) => {
    const label = labelOf(element);
    if (!/^(contactar (?:un|con) asesor|contact an advisor|contacter un conseiller)$/i.test(label)) return;
    element.classList.toggle("roraima-professional-advisor-hidden", isProductRoute);
    if (isProductRoute) {
      element.setAttribute("aria-hidden", "true");
      element.setAttribute("tabindex", "-1");
    } else {
      element.removeAttribute("aria-hidden");
      element.removeAttribute("tabindex");
    }
  });
}

function installProfessionalNavigation() {
  if (document.documentElement.dataset.roraimaProfessionalNavigation === "true") return;
  document.documentElement.dataset.roraimaProfessionalNavigation = "true";
  document.addEventListener("click", (event) => {
    const link = event.target instanceof Element
      ? event.target.closest("a[href^='/profesionales/']")
      : null;
    if (!link || !link.closest(".innova-global-header")) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    window.top.location.assign(new URL(link.getAttribute("href"), window.location.origin).href);
  }, true);
}

export function installProfessionalHeader({ brand } = {}) {
  if (!professionalContext(brand)) return false;
  document.documentElement.dataset.roraimaProfessionalBrand = brand;
  installStyles();
  installProfessionalNavigation();
  restoreProfessionalControls(brand);
  updateAlfredQuickAdd(brand);
  updateSilhouetteProductActions(brand);
  updateHeader();

  let updateScheduled = false;
  const observer = new MutationObserver(() => {
    if (updateScheduled) return;
    updateScheduled = true;
    window.requestAnimationFrame(() => {
      updateScheduled = false;
      restoreProfessionalControls(brand);
      updateAlfredQuickAdd(brand);
      updateSilhouetteProductActions(brand);
      updateHeader();
    });
  });
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
  window.addEventListener("hashchange", () => updateSilhouetteProductActions(brand));
  window.addEventListener("pagehide", () => observer.disconnect(), { once: true });
  return true;
}
