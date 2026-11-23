const BRAND_ROUTES = Object.freeze({
  "alfred-kerbs": "/profesionales/vista/alfred-kerbs/",
  silhouette: "/profesionales/vista/silhouette/",
  jisco: "/profesionales/vista/jisco/",
  akoni: "/profesionales/vista/akoni/",
});

const LABELS = Object.freeze({
  es: { consumer: "Para consumidor", order: "Mi pedido", quantity: "Cantidad", add: "Añadir a mi pedido", review: "Revisar mi pedido", added: "Referencia añadida a Mi pedido.", unavailable: "El pedido no está disponible en esta vista." },
  en: { consumer: "For consumers", order: "My order", quantity: "Quantity", add: "Add to my order", review: "Review my order", added: "Item added to My order.", unavailable: "Orders are unavailable in this view." },
  fr: { consumer: "Pour particuliers", order: "Ma commande", quantity: "Quantité", add: "Ajouter à ma commande", review: "Voir ma commande", added: "Référence ajoutée à Ma commande.", unavailable: "La commande n'est pas disponible dans cette vue." },
});

function professionalContext(brand) {
  try {
    return window.parent !== window
      && window.parent.location.origin === window.location.origin
      && window.parent.document.body?.dataset.professionalBrand === brand
      && new URLSearchParams(window.location.search).get("audience") === "professional";
  } catch {
    return false;
  }
}

function routeToTop(anchor, href) {
  anchor.href = href;
  anchor.target = "_top";
  anchor.addEventListener("click", (event) => {
    event.preventDefault();
    window.top.location.assign(new URL(href, window.location.origin).href);
  }, true);
}

function copy() {
  return LABELS[document.documentElement.lang] || LABELS.es;
}

function setText(element, value) {
  if (element && element.textContent !== value) element.textContent = value;
}

function installStyles() {
  if (document.getElementById("roraima-professional-collection-style")) return;
  const style = document.createElement("style");
  style.id = "roraima-professional-collection-style";
  style.textContent = `
    .roraima-mini-header .roraima-mini-audience,
    .roraima-mini-header .roraima-mini-order { min-height:27px; padding:6px 9px; border:1px solid #8d8985; color:#fff; text-decoration:none; white-space:nowrap; }
    .roraima-mini-header .roraima-mini-audience:hover,
    .roraima-mini-header .roraima-mini-audience:focus-visible,
    .roraima-mini-header .roraima-mini-order:hover,
    .roraima-mini-header .roraima-mini-order:focus-visible { background:#f2bd24; border-color:#f2bd24; color:#151414!important; }
    .roraima-professional-selection { display:grid; gap:11px; margin:20px 0; padding:20px; border:1px solid #d8d2c8; background:#f8f7f5; color:#1d1b1b; font:14px/1.4 Arial,sans-serif; }
    .roraima-professional-selection label { display:grid; gap:7px; font-weight:700; }
    .roraima-professional-selection input { width:100%; max-width:145px; min-height:42px; padding:8px 12px; border:1px solid #aaa49b; color:#1d1b1b; background:#fff; font:inherit; }
    .roraima-professional-selection button { min-height:44px; padding:10px 15px; border:0; color:#fff; background:#1d1b1b; font:700 12px/1.3 Arial,sans-serif; cursor:pointer; text-transform:uppercase; letter-spacing:.06em; }
    .roraima-professional-selection button:hover,.roraima-professional-selection button:focus-visible { background:#3a3532; }
    .roraima-professional-selection a { color:#1d1b1b; font-weight:700; text-underline-offset:3px; }
    .roraima-professional-selection output { min-height:20px; }
    .product-info .visit-optician { display:none; }
    @media(max-width:760px){
      .roraima-mini-header .roraima-mini-back,.roraima-mini-header .roraima-mini-menu{display:none}
      .roraima-mini-header .roraima-mini-nav{gap:4px}
      .roraima-mini-header .roraima-mini-audience,.roraima-mini-header .roraima-mini-order{font-size:7px;letter-spacing:0;padding:5px 4px}
      .roraima-mini-header .roraima-brand-rail a{padding:5px 2px;font-size:6px}
      .roraima-professional-selection{margin:14px 0;padding:15px}
    }
  `;
  document.head.appendChild(style);
}

function readProduct(brand, quantity) {
  const path = decodeURIComponent(window.location.hash.replace(/^#\/?/, "").split("?")[0]);
  const parts = path.split("/");
  if (parts[0] !== "modelo" || !parts[1]) return null;
  const info = brand === "jisco" ? document.querySelector("#productContent .product-info") : document.querySelector("#app .product-info");
  if (!info) return null;
  const name = info.querySelector("h1")?.textContent?.trim() || "";
  const sku = info.querySelector(".sku")?.textContent?.trim() || "";
  const color = brand === "jisco"
    ? info.querySelector('.colors [data-variant][aria-pressed="true"] span')?.textContent?.trim() || ""
    : info.querySelector('.variant-list [data-variant][aria-pressed="true"] small')?.textContent?.trim() || "";
  const image = brand === "jisco" ? document.querySelector("#mainProductImage") : document.querySelector("#app .product-photo img");
  if (!name || !sku) return null;
  const imageUrl = image?.getAttribute("src") ? new URL(image.getAttribute("src"), window.location.href) : null;
  return {
    brand,
    productId: parts[1],
    slug: parts[1],
    sku,
    name,
    color,
    image: imageUrl?.origin === window.location.origin ? imageUrl.pathname : "",
    catalogUrl: `/${brand}/${window.location.hash}`,
    quantity,
  };
}

function ensureHeader(brand) {
  const header = document.querySelector(".roraima-mini-header");
  if (!header) return;
  const rail = header.querySelector(".roraima-brand-rail");
  rail?.querySelectorAll("a").forEach((anchor) => {
    const key = Object.keys(BRAND_ROUTES).find((entry) => anchor.pathname === `/${entry}/`);
    if (key && anchor.getAttribute("href") !== BRAND_ROUTES[key]) routeToTop(anchor, BRAND_ROUTES[key]);
  });
  const menu = header.querySelector(".roraima-mini-menu > div");
  menu?.querySelectorAll("a").forEach((anchor) => {
    const key = Object.keys(BRAND_ROUTES).find((entry) => anchor.pathname === `/${entry}/`);
    if (key && anchor.getAttribute("href") !== BRAND_ROUTES[key]) routeToTop(anchor, BRAND_ROUTES[key]);
  });
  const switchLink = header.querySelector(".roraima-mini-audience");
  if (switchLink && switchLink.getAttribute("href") !== `/${brand}/`) routeToTop(switchLink, `/${brand}/`);
  setText(switchLink, copy().consumer);
  const nav = header.querySelector(".roraima-mini-nav");
  if (nav && !nav.querySelector(".roraima-mini-order")) {
    const link = document.createElement("a");
    link.className = "roraima-mini-order";
    routeToTop(link, "/profesionales/vista/pedido/");
    nav.appendChild(link);
  }
  const order = nav?.querySelector(".roraima-mini-order");
  setText(order, copy().order);
}

function ensureProductControl(brand) {
  const info = brand === "jisco" ? document.querySelector("#productContent .product-info") : document.querySelector("#app .product-info");
  if (!info || !/^#\/modelo\//.test(window.location.hash)) return;
  let panel = info.querySelector(".roraima-professional-selection");
  if (!panel) {
    panel = document.createElement("section");
    panel.className = "roraima-professional-selection";
    panel.innerHTML = '<label><span data-quantity-label></span><input type="number" inputmode="numeric" min="1" max="9999" value="1" aria-label="Cantidad"></label><button type="button" data-add></button><a href="/profesionales/vista/pedido/" target="_top" data-review></a><output aria-live="polite"></output>';
    info.querySelector(".purchase, .visit-optician")?.before(panel);
    if (!panel.isConnected) info.appendChild(panel);
    panel.querySelector("[data-add]").addEventListener("click", async () => {
      const feedback = panel.querySelector("output");
      const button = panel.querySelector("[data-add]");
      const quantityInput = panel.querySelector("input");
      if (!quantityInput.reportValidity()) return;
      const quantity = Math.floor(Number(quantityInput.value));
      if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 9999) return;
      const item = readProduct(brand, quantity);
      const service = window.parent.RoraimaB2B;
      if (!item || !service?.addItem) { feedback.textContent = copy().unavailable; return; }
      button.disabled = true;
      try { await service.addItem(item); feedback.textContent = copy().added; }
      catch { feedback.textContent = copy().unavailable; }
      finally { button.disabled = false; }
    });
  }
  const labels = copy();
  setText(panel.querySelector("[data-quantity-label]"), labels.quantity);
  setText(panel.querySelector("[data-add]"), labels.add);
  setText(panel.querySelector("[data-review]"), labels.review);
}

export function installProfessionalCollection({ brand } = {}) {
  if (!(["jisco", "akoni"].includes(brand) && professionalContext(brand))) return false;
  document.documentElement.dataset.roraimaProfessionalCatalog = "true";
  installStyles();
  let scheduled = false;
  const update = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      ensureHeader(brand);
      ensureProductControl(brand);
    });
  };
  new MutationObserver(update).observe(document.body, { childList: true, subtree: true });
  window.addEventListener("hashchange", update);
  document.getElementById("langButton")?.addEventListener("change", update);
  update();
  return true;
}
