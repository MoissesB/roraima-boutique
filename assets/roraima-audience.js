(function () {
  "use strict";

  var path = window.location.pathname;
  var audienceParams = new URLSearchParams(window.location.search);
  var explicitProfessionalCatalog = path.indexOf("/silhouette/") === 0 &&
    audienceParams.get("audience") === "professional" &&
    audienceParams.get("embedded") === "1";
  var professionalParent = window.self === window.top;
  if (explicitProfessionalCatalog && !professionalParent) {
    try {
      professionalParent = window.top.location.pathname.indexOf("/profesionales/silhouette/catalogo/") === 0;
    } catch (_) {
      professionalParent = false;
    }
  }
  if (explicitProfessionalCatalog && professionalParent) {
    document.documentElement.dataset.roraimaAudience = "b2b";
    document.documentElement.dataset.roraimaProfessionalCatalog = "true";
    var professionalStylesheet = document.createElement("link");
    professionalStylesheet.rel = "stylesheet";
    professionalStylesheet.href = "/assets/roraima-professional-catalog-frame.css?v=20260830-b2b-map-1";
    professionalStylesheet.dataset.roraimaProfessionalCatalogCss = "true";
    document.head.appendChild(professionalStylesheet);

    function lockProfessionalCatalogNavigation() {
      document.querySelectorAll("a").forEach(function (link) {
        var href = String(link.getAttribute("href") || "").trim();
        if (href === "#/" || href === "#") link.setAttribute("href", "#/catalogo");
        if (link.getAttribute("target") === "_top" || link.getAttribute("target") === "_parent") {
          link.setAttribute("target", "_self");
        }
      });
    }

    var professionalNavigationScheduled = false;
    function scheduleProfessionalCatalogNavigation() {
      if (professionalNavigationScheduled) return;
      professionalNavigationScheduled = true;
      window.requestAnimationFrame(function () {
        professionalNavigationScheduled = false;
        lockProfessionalCatalogNavigation();
      });
    }

    lockProfessionalCatalogNavigation();
    new MutationObserver(scheduleProfessionalCatalogNavigation).observe(document.body, { childList: true, subtree: true });
    window.addEventListener("hashchange", scheduleProfessionalCatalogNavigation);
    return;
  }
  if (path.indexOf("/profesionales/") === 0 || window.__RORAIMA_AUDIENCE_UI__) return;
  window.__RORAIMA_AUDIENCE_UI__ = true;

  var officialLocator = "/opticas/";
  var professionalRoute = "/profesionales/silhouette/";
  var isSilhouette = path.indexOf("/silhouette/") === 0;
  var isAlfred = path.indexOf("/alfred-kerbs/") === 0;
  if (!isSilhouette && !isAlfred && path !== "/") return;

  if (!document.querySelector("link[data-roraima-audience-css]")) {
    var stylesheet = document.createElement("link");
    stylesheet.rel = "stylesheet";
    stylesheet.href = "/assets/roraima-audience.css?v=20260830-b2b-map-1";
    stylesheet.dataset.roraimaAudienceCss = "true";
    document.head.appendChild(stylesheet);
  }

  var replacements = [
    [/DISTRIBUCI[ÓO]N PROFESIONAL · SILHOUETTE/gi, "COLECCIÓN OFICIAL · SILHOUETTE"],
    [/PROFESSIONAL DISTRIBUTION · SILHOUETTE/gi, "OFFICIAL COLLECTION · SILHOUETTE"],
    [/DISTRIBUTION PROFESSIONNELLE · SILHOUETTE/gi, "COLLECTION OFFICIELLE · SILHOUETTE"],
    [/DISTRIBUCI[ÓO]N PROFESIONAL · ALFRED KERBS/gi, "COLECCIÓN OFICIAL · ALFRED KERBS"],
    [/PROFESSIONAL DISTRIBUTION · ALFRED KERBS/gi, "OFFICIAL COLLECTION · ALFRED KERBS"],
    [/DISTRIBUTION PROFESSIONNELLE · ALFRED KERBS/gi, "COLLECTION OFFICIELLE · ALFRED KERBS"],
    [/Colección Alfred Kerbs para ópticas/gi, "Colección Alfred Kerbs"],
    [/Colección profesional Alfred Kerbs/gi, "Colección Alfred Kerbs"],
    [/Selección profesional gestionada por Roraima Distribuciones/gi, "Colección oficial presentada por Roraima Distribuciones"],
    [/selección profesional de Roraima Mexico/gi, "colección oficial de Roraima México"],
    [/Blog profesional/gi, "Inspiración"],
    [/Professional blog/gi, "Inspiration"],
    [/Blog professionnel/gi, "Inspiration"],
    [/Distribucion profesional por Roraima Distribuciones para opticas, cadenas retail y departamentos opticos\./gi, "Colecciones presentadas en México por Roraima Distribuciones."],
    [/ALFRED KERBS - DISTRIBUCION PROFESIONAL/gi, "ALFRED KERBS · COLECCIÓN OFICIAL"],
    [/AÑADE LA REFERENCIA Y LA CANTIDAD A TU PEDIDO\.[\s\S]*?ANTES DE CONFIRMAR LA OPERACIÓN\./gi, "REVISA LOS ACABADOS Y DETALLES DEL MODELO. PARA CONOCER DISPONIBILIDAD, CONSULTA CON UNA ÓPTICA AUTORIZADA."],
    [/amplía la propuesta profesional de Alfred Kerbs/gi, "amplía la colección de Alfred Kerbs"],
    [/Pensada para ópticas, cadenas y departamentos ópticos que buscan diferenciar su oferta, /gi, "Con el lenguaje contemporáneo de la marca, "],
    [/para facilitar la comparación y construir un surtido coherente/gi, "para facilitar la comparación entre modelos y acabados"],
    [/El equipo de Roraima Distribuciones puede ayudarte a definir el mix de colores, consultar disponibilidad y desarrollar una propuesta de colección adaptada al perfil de tu negocio y de tus clientes\./gi, "Explora todos los acabados y consulta disponibilidad con una óptica autorizada."],
    [/para aportar identidad y nuevas posibilidades de recomendación a tu surtido/gi, "con identidad, color y proporciones contemporáneas"]
  ];

  var hiddenSelectors = [
    ".innova-global-order",
    ".innova-global-mega-visual__content",
    ".selection-pill",
    ".catalog-card__select",
    ".order-fab",
    ".footer-order-link",
    ".product-order-panel",
    ".professional-purchase",
    ".sil-order-fab",
    ".btn-card-order"
  ];

  function markHidden() {
    hiddenSelectors.forEach(function (selector) {
      document.querySelectorAll(selector).forEach(function (node) {
        node.classList.add("roraima-b2c-hidden");
        node.setAttribute("aria-hidden", "true");
      });
    });

    document.querySelectorAll("button, a").forEach(function (node) {
      var label = String(node.textContent || "").trim().replace(/\s+/g, " ");
      if (/^(AÑADIR AL PEDIDO|REVISAR MI PEDIDO|AÑADIR A MI PEDIDO|MI PEDIDO\s*\d*)$/i.test(label)) {
        node.classList.add("roraima-b2c-hidden");
        node.setAttribute("aria-hidden", "true");
      }
    });
  }

  function replaceCopy() {
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    var node;
    while ((node = walker.nextNode())) {
      if (!node.nodeValue || !node.parentElement || node.parentElement.closest("script, style, noscript")) continue;
      var next = node.nodeValue;
      replacements.forEach(function (entry) { next = next.replace(entry[0], entry[1]); });
      if (next !== node.nodeValue) node.nodeValue = next;
    }
  }

  function decorateOpticianAction() {
    if (!isSilhouette) return;
    document.querySelectorAll("button, a").forEach(function (node) {
      var label = String(node.textContent || "").trim().replace(/\s+/g, " ");
      if (!/^(CONTACTAR UN ASESOR|CONTACT AN ADVISOR|CONTACTER UN CONSEILLER)$/i.test(label)) return;
      node.textContent = document.documentElement.lang === "fr"
        ? "TROUVER UN OPTICIEN"
        : document.documentElement.lang === "en"
          ? "FIND AN OPTICIAN"
          : "ENCONTRAR UNA ÓPTICA";
      node.dataset.roraimaFindOptician = "true";
      node.dataset.analyticsEvent = "find_optician";
      node.dataset.analyticsBrand = "silhouette";
      node.dataset.analyticsRoute = window.location.hash || "/silhouette/";
    });
  }

  function ensureConsumerRail() {
    if (!isSilhouette || document.querySelector(".roraima-b2c-rail")) return;
    var rail = document.createElement("nav");
    rail.className = "roraima-b2c-rail";
    rail.setAttribute("aria-label", "Acciones para consumidor");
    rail.innerHTML = '<a class="roraima-b2c-rail__consumer" href="/silhouette/#/catalogo" data-analytics-event="consumer_catalog" data-analytics-brand="silhouette" data-analytics-route="/silhouette/#/catalogo">Ver catálogo como consumidor</a>' +
      '<a class="roraima-find-optician" href="' + officialLocator + '" data-analytics-event="find_optician" data-analytics-brand="silhouette" data-analytics-route="/opticas/">Encontrar mi óptica</a>' +
      '<a class="roraima-b2c-rail__professional" href="' + professionalRoute + '" data-analytics-event="professional_distribution" data-analytics-brand="silhouette" data-analytics-route="' + professionalRoute + '">Soy una óptica profesional · Quiero distribuir</a>';
    document.body.appendChild(rail);
  }

  function removeUpperAudienceSwitch() {
    if (!isSilhouette) return;
    document.querySelectorAll(".roraima-audience-switch").forEach(function (node) { node.remove(); });
  }

  function applyAudienceMode() {
    document.documentElement.dataset.roraimaAudience = "b2c";
    if (isAlfred) {
      document.title = document.title
        .replace(/Distribuci[oó]n profesional/gi, "Colección oficial")
        .replace(/para [oó]pticas y grandes cuentas/gi, "colección oficial");
      var description = document.querySelector('meta[name="description"]');
      if (description) description.content = description.content.replace(/distribuci[oó]n profesional[^.]*\.?/gi, "colección oficial presentada por Roraima México.");
    }
    markHidden();
    replaceCopy();
    decorateOpticianAction();
    removeUpperAudienceSwitch();
    ensureConsumerRail();
  }

  document.addEventListener("click", function (event) {
    var action = event.target instanceof Element && event.target.closest("[data-roraima-find-optician='true']");
    if (!action) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    window.location.assign(officialLocator);
  }, true);

  var scheduled = false;
  function scheduleApply() {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(function () {
      scheduled = false;
      applyAudienceMode();
    });
  }

  applyAudienceMode();
  new MutationObserver(scheduleApply).observe(document.body, { childList: true, subtree: true });
  window.addEventListener("hashchange", scheduleApply);
  window.addEventListener("roraima-catalog:languagechange", scheduleApply);
})();
