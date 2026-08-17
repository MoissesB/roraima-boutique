(() => {
  const app = document.querySelector("#catalog-app");
  const catalogUrl = new URL("catalog-data.json", window.location.href);
  const orderStorageKey = "roraima-order-v1";
  let catalog = null;
  let productsBySlug = new Map();

  const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]);
  const escapeAttribute = (value) => escapeHtml(value).replaceAll("`", "&#96;");
  const catalogAsset = (path) => `catalog/${String(path || "").split("/").map(encodeURIComponent).join("/")}`;
  const routeValue = () => window.location.hash.replace(/^#/, "") || "/";
  const routeInfo = () => {
    const [path, query = ""] = routeValue().split("?");
    return { path: path.startsWith("/") ? path : `/${path}`, query: new URLSearchParams(query) };
  };
  const firstImage = (product) => product?.variants?.flatMap((variant) => variant.images || [])[0]?.local_path || "";
  const allImages = (product) => [...new Set(product?.variants?.flatMap((variant) => (variant.images || []).map((image) => image.local_path)) || [])];
  const productUrl = (slug) => `#/catalogo/${encodeURIComponent(slug)}`;

  function readOrder() {
    try {
      const stored = JSON.parse(localStorage.getItem(orderStorageKey) || "null");
      return stored && Array.isArray(stored.items) ? stored : { items: [], client: {} };
    } catch {
      return { items: [], client: {} };
    }
  }

  function saveOrder(order) {
    localStorage.setItem(orderStorageKey, JSON.stringify(order));
  }

  function productCard(product) {
    const images = allImages(product);
    const colors = product.variants?.length || 0;
    return `<a class="product-card" href="${productUrl(product.slug)}" data-product-slug="${escapeAttribute(product.slug)}" aria-label="Ver ${escapeAttribute(product.name)}">
      <img class="product-card__image" src="${escapeAttribute(catalogAsset(firstImage(product)))}" alt="Montura ${escapeAttribute(product.name)} Alfred Kerbs" loading="lazy" data-card-image>
      ${images.length > 1 ? '<span class="product-card__motion" aria-hidden="true">Vista 360°</span>' : ""}
      <span class="product-card__copy"><span>${escapeHtml(product.category_label || (product.collection === "sun" ? "Sol" : "Óptica"))}</span><strong>${escapeHtml(product.name)}</strong><small>${colors} ${colors === 1 ? "acabado" : "acabados"}</small></span>
    </a>`;
  }

  function renderHome() {
    document.title = "Alfred Kerbs · Roraima Distribuciones";
    app.innerHTML = `<section class="hero"><div class="hero__inner"><span class="eyebrow">Distribución profesional · Roraima Distribuciones</span><h1>Alfred Kerbs<br>para ópticas.</h1><p>Explora una selección profesional de monturas ópticas y solares con información de cada referencia, acabados y medidas.</p><a class="button" href="#/catalogo">Ver catálogo completo</a></div></section>
      <section class="home-intro"><div><span class="eyebrow">Colección para México</span><h2>Una selección con identidad propia.</h2><p>Roraima Distribuciones presenta Alfred Kerbs para ópticas, cadenas retail y departamentos ópticos. Compara modelos, acabados y medidas antes de incorporar cada referencia a tu pedido profesional.</p></div><div class="collection-links"><a href="#/catalogo?category=optical"><span>Monturas ópticas</span><span>→</span></a><a href="#/catalogo?category=sun"><span>Monturas solares</span><span>→</span></a><a href="../silhouette/"><span>Conocer Silhouette</span><span>→</span></a></div></section>`;
  }

  function renderCatalog(query) {
    const category = query.get("category") || "";
    const filtered = catalog.products.filter((product) => !category || product.collection === category);
    const label = category === "optical" ? "Óptica" : category === "sun" ? "Sol" : "Colección completa";
    document.title = `${label} · Alfred Kerbs · Roraima Distribuciones`;
    app.innerHTML = `<section class="catalog-shell"><div class="catalog-heading"><div><span class="eyebrow">Alfred Kerbs · Roraima Distribuciones</span><h1>${label}</h1></div><p>Selecciona un modelo para conocer sus acabados, medidas e imágenes. La disponibilidad se confirma con Roraima antes de cada pedido.</p></div><div class="catalog-toolbar"><nav class="filter-group" aria-label="Filtrar colección"><a href="#/catalogo" ${!category ? 'aria-current="page"' : ""}>Todos</a><a href="#/catalogo?category=optical" ${category === "optical" ? 'aria-current="page"' : ""}>Óptica</a><a href="#/catalogo?category=sun" ${category === "sun" ? 'aria-current="page"' : ""}>Sol</a></nav><span class="catalog-count">${filtered.length} ${filtered.length === 1 ? "modelo" : "modelos"}</span></div><div class="product-grid">${filtered.length ? filtered.map(productCard).join("") : '<p class="empty-state">No hay modelos en esta selección.</p>'}</div></section>`;
    setupCardMotion();
  }

  function renderProduct(slug) {
    const product = productsBySlug.get(slug);
    if (!product) {
      document.title = "Modelo no encontrado · Alfred Kerbs";
      app.innerHTML = '<section class="catalog-error"><strong>Ese modelo no está disponible en esta ruta.</strong><a href="#/catalogo">Volver al catálogo</a></section>';
      return;
    }
    const images = allImages(product);
    const firstVariant = product.variants?.[0] || {};
    const dimensions = Object.entries(firstVariant.dimensions || {}).filter(([, value]) => value);
    const materials = [...new Set(product.variants?.flatMap((variant) => variant.materials || []).filter(Boolean) || [])];
    const description = product.description_es || `${product.name} es una montura Alfred Kerbs distribuida profesionalmente por Roraima Distribuciones.`;
    document.title = `${product.name} · Alfred Kerbs · Roraima Distribuciones`;
    app.innerHTML = `<section class="product-shell"><nav class="breadcrumb" aria-label="Migas de pan"><a href="#/">Alfred Kerbs</a><span>·</span><a href="#/catalogo">Catálogo</a><span>·</span><span>${escapeHtml(product.name)}</span></nav><div class="product-layout"><section class="product-gallery"><img class="gallery-main" src="${escapeAttribute(catalogAsset(images[0]))}" alt="Montura ${escapeAttribute(product.name)} Alfred Kerbs" data-gallery-main>${images.length > 1 ? `<div class="gallery-thumbs" aria-label="Vistas del modelo">${images.map((image, index) => `<button type="button" aria-pressed="${index === 0}" data-gallery-image="${escapeAttribute(image)}"><img src="${escapeAttribute(catalogAsset(image))}" alt="Vista ${index + 1} de ${escapeAttribute(product.name)}"></button>`).join("")}</div>` : ""}</section><section class="product-copy"><span class="eyebrow">${escapeHtml(product.category_label || product.collection)}</span><h1>${escapeHtml(product.name)}</h1><p class="product-code">${product.variants?.length || 0} acabados disponibles para consulta</p><p>${escapeHtml(description)}</p><dl class="product-details"><div><dt>Colección</dt><dd>${escapeHtml(product.category_label || product.collection)}</dd></div><div><dt>Material</dt><dd>${escapeHtml(materials.join(" · ") || "Consultar ficha")}</dd></div>${dimensions.slice(0, 2).map(([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`).join("")}</dl><form class="purchase-box" data-order-form data-product-slug="${escapeAttribute(product.slug)}"><label>Acabado<select name="variant">${(product.variants || []).map((variant, index) => `<option value="${index}">${escapeHtml(variant.color || variant.reference || `Referencia ${index + 1}`)}</option>`).join("")}</select></label><label>Cantidad<input name="quantity" type="number" min="1" max="9999" value="1" inputmode="numeric"></label><div class="purchase-actions"><button class="button button--dark" type="submit">Añadir al pedido</button><a class="button" href="mailto:ventas@roraimamx.net?subject=${encodeURIComponent(`Consulta Alfred Kerbs · ${product.name}`)}">Consultar con Roraima</a></div><p class="purchase-status" aria-live="polite"></p></form></section></div><section class="product-more"><span class="eyebrow">Roraima Distribuciones</span><h2>¿Quieres revisar este modelo para tu óptica?</h2><p>Agrega la referencia a tu selección o consulta con el equipo comercial de Roraima para confirmar disponibilidad y condiciones.</p><a class="button button--dark" href="../#seleccion">Abrir pedido global</a></section></section>`;
    setupProductDetails(product, images);
  }

  function setupCardMotion() {
    if (!window.matchMedia("(hover: hover)").matches) return;
    app.querySelectorAll("[data-product-slug]").forEach((card) => {
      const product = productsBySlug.get(card.dataset.productSlug);
      const images = allImages(product);
      const image = card.querySelector("[data-card-image]");
      if (!image || images.length < 2) return;
      let frame = 0;
      let timer = null;
      const stop = () => { if (timer) window.clearTimeout(timer); timer = null; };
      const step = () => {
        if (frame >= images.length - 1) return stop();
        frame += 1;
        image.src = catalogAsset(images[frame]);
        timer = window.setTimeout(step, 140);
      };
      card.addEventListener("pointerenter", () => { if (!timer && frame < images.length - 1) timer = window.setTimeout(step, 140); });
      card.addEventListener("pointerleave", stop);
      card.addEventListener("focusin", () => { if (!timer && frame < images.length - 1) timer = window.setTimeout(step, 140); });
      card.addEventListener("focusout", stop);
    });
  }

  function setupProductDetails(product, images) {
    const mainImage = app.querySelector("[data-gallery-main]");
    app.querySelectorAll("[data-gallery-image]").forEach((button) => button.addEventListener("click", () => {
      const image = button.dataset.galleryImage;
      if (!image || !mainImage) return;
      mainImage.src = catalogAsset(image);
      app.querySelectorAll("[data-gallery-image]").forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
    }));
    const form = app.querySelector("[data-order-form]");
    form?.addEventListener("submit", (event) => {
      event.preventDefault();
      const data = new FormData(form);
      const variantIndex = Math.max(0, Number(data.get("variant")) || 0);
      const variant = product.variants?.[variantIndex] || product.variants?.[0] || {};
      const quantity = Math.max(1, Math.min(9999, Number(data.get("quantity")) || 1));
      const order = readOrder();
      const sku = variant.sap_reference || variant.reference || `${product.slug}-${variantIndex + 1}`;
      const key = `alfred-kerbs:${sku}`;
      const existing = order.items.find((item) => item.key === key);
      if (existing) existing.quantity = Math.min(9999, Number(existing.quantity || 0) + quantity);
      else order.items.push({ key, brand: "alfred-kerbs", productId: product.id, slug: product.slug, name: product.name, sku, color: variant.color || "", image: catalogAsset((variant.images || [])[0]?.local_path || images[0]), quantity });
      saveOrder(order);
      const status = form.querySelector(".purchase-status");
      if (status) status.textContent = `${product.name} fue añadido a tu pedido global.`;
    });
  }

  function render() {
    if (!catalog) return;
    const { path, query } = routeInfo();
    if (path === "/" || path === "/inicio") renderHome();
    else if (path === "/catalogo") renderCatalog(query);
    else if (path.startsWith("/catalogo/")) renderProduct(decodeURIComponent(path.slice("/catalogo/".length)));
    else renderHome();
    app.focus({ preventScroll: true });
  }

  fetch(catalogUrl)
    .then((response) => { if (!response.ok) throw new Error(`No fue posible cargar el catálogo (${response.status}).`); return response.json(); })
    .then((data) => { catalog = { products: Array.isArray(data.products) ? data.products : [] }; productsBySlug = new Map(catalog.products.map((product) => [product.slug, product])); render(); })
    .catch((error) => { app.innerHTML = `<section class="catalog-error"><strong>No se pudo cargar el catálogo Alfred Kerbs.</strong><span>${escapeHtml(error.message)}</span><a href="../#inicio">Volver a Roraima Distribuciones</a></section>`; });

  window.addEventListener("hashchange", render);
})();
