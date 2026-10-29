import { ORDER_BRANDS } from "./order-core.mjs?v=20261028-stock-1";

const BRAND_LABELS = {
  silhouette: "Silhouette",
  "alfred-kerbs": "Alfred Kerbs",
};

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}

const ACCOUNT_URL = "/profesionales/vista/cuenta/";

function optionLabel(option, backorder) {
  const parts = [option.size ? `Talla ${option.size}` : option.option];
  if (option.rim) parts.push(`aro ${option.rim}${option.preferred ? " (como en el catálogo)" : ""}`);
  parts.push(option.available > 0 ? `${option.available} disp.` : (backorder ? "sobre pedido" : "sin existencias"));
  return parts.join(" · ");
}

// Brands supplied on order (Alfred Kerbs) accept quantities above free stock.
const BACKORDER_COPY = "Las piezas sin existencias se surten sobre pedido; Roraima te confirmará la fecha de entrega.";

// Stock line for one cart item (Odoo mode, signed in).
function renderStock(item, ctx) {
  if (!ctx.signedIn) return "";
  const entry = ctx.stockByKey[item.key];
  const lineError = ctx.errorLines.get(item.key);
  let body = "";
  if (!entry) {
    body = ctx.stockStatus === "error"
      ? "<span class=\"stock\">No se pudieron consultar las existencias.</span>"
      : "<span class=\"stock\">Consultando existencias…</span>";
  } else if (entry.status === "unknown_product" || entry.status === "invalid_item") {
    body = "<span class=\"stock stock-out\">No disponible</span><small>Esta referencia no está en el inventario de Roraima. Quítala para enviar el pedido.</small>";
  } else {
    const options = entry.options || [];
    if (options.length > 1) {
      body += `<label class="option-picker"><span>${entry.status === "needs_option" ? "Elige talla para continuar" : "Talla"}</span>
        <select data-focus="option:${escapeHtml(item.key)}" data-option-brand="${item.brand}" data-option-key="${escapeHtml(item.key)}">
          <option value="">Elige una opción…</option>
          ${options.map((option) => `<option value="${escapeHtml(option.option)}" ${option.option === entry.option ? "selected" : ""} ${!entry.backorder && option.available < 1 && option.option !== entry.option ? "disabled" : ""}>${escapeHtml(optionLabel(option, entry.backorder))}</option>`).join("")}
        </select></label>`;
    }
    if (entry.status === "ok" && entry.backorder) {
      const quantity = Number(item.quantity) || 0;
      body += entry.available > 0
        ? `<span class="stock ${quantity > entry.available ? "stock-low" : "stock-ok"}">Disponible: ${entry.available}</span>`
        : "<span class=\"stock stock-low\">Sobre pedido</span>";
      if (quantity > entry.available) body += `<small>${BACKORDER_COPY}</small>`;
    } else if (entry.status === "ok") {
      const quantity = Number(item.quantity) || 0;
      body += entry.available > 0
        ? `<span class="stock ${quantity > entry.available ? "stock-low" : "stock-ok"}">Disponible: ${entry.available}</span>`
        : "<span class=\"stock stock-out\">No disponible</span>";
      if (entry.available > 0 && quantity > entry.available) {
        body += `<small>Solo hay ${entry.available} piezas. Ajusta la cantidad para enviar el pedido.</small>`;
      }
    }
  }
  if (lineError) body += `<small class="line-error">${escapeHtml(lineError)}</small>`;
  return `<div class="item-stock">${body}</div>`;
}

function renderItems(state, view, ctx = { odoo: false }) {
  const brands = view === "global" ? ORDER_BRANDS : [view];
  const sections = brands.map((brand) => {
    const items = state.carts[brand]?.items || [];
    const total = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    const missing = ctx.odoo && total > 0 ? Math.max(0, ctx.minimum - total) : 0;
    return `
      <section class="brand-cart" data-brand-cart="${brand}">
        <header><h3>${BRAND_LABELS[brand]}</h3><span>${items.length} referencias · ${total} piezas</span></header>
        ${missing ? `<p class="minimum">Mínimo ${ctx.minimum} piezas por marca: faltan ${missing}.</p>` : ""}
        ${items.length ? `<div class="items">${items.map((item) => `
          <article class="item${ctx.errorLines?.has(item.key) ? " has-error" : ""}">
            ${item.image ? `<img src="${escapeHtml(item.image)}" alt="">` : "<span class=\"placeholder\" aria-hidden=\"true\">RD</span>"}
            <div class="item-copy">
              <strong>${escapeHtml(item.name || item.model || item.sku)}</strong>
              <small>${escapeHtml([item.sku, item.color].filter(Boolean).join(" · "))}</small>
            </div>
            <label class="quantity"><span>Cantidad</span><input type="number" min="1" max="${ctx.odoo ? 999 : 9999}" value="${Number(item.quantity) || 1}" data-focus="qty:${escapeHtml(item.key)}" data-quantity-brand="${brand}" data-quantity-key="${escapeHtml(item.key)}"></label>
            <button class="remove" type="button" data-remove-brand="${brand}" data-remove-key="${escapeHtml(item.key)}" aria-label="Quitar ${escapeHtml(item.name || item.model || item.sku)}">×</button>
            ${ctx.odoo ? renderStock(item, ctx) : ""}
          </article>`).join("")}</div>` : `
          <div class="empty">
            <p>Aún no hay referencias de ${BRAND_LABELS[brand]}.</p>
            <small>Puedes añadir cualquier cantidad desde el catálogo profesional.</small>
          </div>`}
      </section>`;
  });
  return sections.join("");
}

function renderOpticOptions(state) {
  return state.optics.map((optic) => `
    <option value="${escapeHtml(optic.id)}" ${optic.id === state.activeOpticId ? "selected" : ""}>
      ${escapeHtml(optic.optical_name || optic.company_name || optic.email)}
    </option>`).join("");
}

function currentOptic(state) {
  return state.optics.find((optic) => optic.id === state.activeOpticId) || {};
}

function statusCopy(snapshot) {
  if (snapshot.submission) {
    const orderNumber = snapshot.submission.result?.order_number;
    return orderNumber
      ? `Solicitud ${orderNumber} enviada para revisión.`
      : "Solicitud enviada para revisión.";
  }
  if (snapshot.status === "ready") return "Guardado en tu sesión profesional.";
  if (snapshot.status === "saving" || snapshot.status === "migrating") return "Guardando…";
  if (snapshot.status === "submitting") return "Enviando pedido…";
  if (snapshot.status === "loading" || snapshot.status === "idle") return "Cargando selección…";
  if (snapshot.status === "signed-out") return "Inicia sesión para consultar y guardar tu pedido.";
  if (snapshot.status === "configuration-required") return "La sesión profesional todavía no está disponible.";
  if (snapshot.status === "error") return snapshot.error || "No fue posible guardar. Tus datos anteriores no se eliminaron.";
  return "";
}

function renderVisualCustomerForm(customer, total) {
  const field = (name, label, options = {}) => `<label class="field${options.wide ? " field-wide" : ""}"><span>${label}${options.required ? " *" : ""}</span><input data-focus="pdf:${name}" name="${name}" type="${options.type || "text"}" ${options.required ? "required" : ""} maxlength="${options.maxlength || 120}" value="${escapeHtml(customer[name] || "")}"></label>`;
  return `<section class="optic visual-customer">
    <h3>Datos del cliente para el PDF</h3>
    <p>Completa los datos de la óptica. Se usarán solo para generar el PDF en este dispositivo: no se envían ni se guardan en el servidor.</p>
    <form data-visual-pdf-form>
      <div class="optic-grid">
        ${field("optical_name", "Nombre de la óptica", { required: true })}
        ${field("company_name", "Razón social", { required: true })}
        ${field("contact_name", "Nombre del contacto", { required: true })}
        ${field("email", "Correo del cliente", { required: true, type: "email" })}
        ${field("phone", "Teléfono", { required: true, type: "tel", maxlength: 32 })}
        ${field("city", "Ciudad", { required: true })}
        ${field("country", "País", { required: true })}
        ${field("address", "Dirección", { wide: true, maxlength: 200 })}
        <label class="field field-wide"><span>Observaciones</span><textarea data-focus="pdf:notes" name="notes" rows="2" maxlength="500">${escapeHtml(customer.notes || "")}</textarea></label>
      </div>
      <div class="signature-head"><strong>Firma del cliente</strong><button type="button" data-clear-signature>Limpiar firma</button></div>
      <canvas class="signature-pad" data-signature width="520" height="140" aria-label="Espacio para firmar con el dedo o el cursor"></canvas>
      <small class="signature-help">Firma con el dedo o el cursor. Es una constancia visual, no una firma electrónica certificada.</small>
      <button class="pdf-button" type="submit" ${total < 1 ? "disabled" : ""}>Descargar PDF del pedido</button>
      <p class="pdf-feedback" data-pdf-feedback role="status" aria-live="polite"></p>
    </form>
  </section>`;
}

function renderAccountBar(snapshot) {
  const account = snapshot.account || {};
  if (account.status === "signed-in") {
    const user = account.user || {};
    return `<div class="account-bar"><p>Sesión iniciada: <strong>${escapeHtml(user.name || user.email)}</strong>${user.optical ? ` · ${escapeHtml(user.optical)}` : ""}</p>
      <div><a href="${ACCOUNT_URL}" target="_top">Mi cuenta</a><button type="button" data-logout>Cerrar sesión</button></div></div>`;
  }
  if (account.status === "signed-out") {
    return `<div class="account-bar is-muted"><p>Inicia sesión para ver existencias y enviar tu pedido a Roraima. Al iniciar sesión se quitan las referencias que Roraima no puede surtir.</p>
      <div><a class="account-cta" href="${ACCOUNT_URL}" target="_top">Iniciar sesión o crear cuenta</a></div></div>`;
  }
  if (account.status === "unavailable") {
    return "<div class=\"account-bar is-muted\"><p>El servidor de pedidos no responde en este momento. Puedes seguir armando tu selección y descargar el PDF.</p></div>";
  }
  return "<div class=\"account-bar is-muted\"><p>Comprobando tu sesión…</p></div>";
}

// Reasons the Odoo checkout button is disabled, in plain Spanish.
function checkoutBlockers(snapshot) {
  const blockers = [];
  const minimum = snapshot.minimumPerBrand || 50;
  const byKey = snapshot.stock?.byKey || {};
  let stockMissing = false;
  for (const brand of ORDER_BRANDS) {
    const items = snapshot.state.carts[brand]?.items || [];
    const total = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    if (total > 0 && total < minimum) blockers.push(`${BRAND_LABELS[brand]}: faltan ${minimum - total} piezas para el mínimo de ${minimum}.`);
    for (const item of items) {
      const entry = byKey[item.key];
      const label = item.name || item.model || item.sku;
      if (!entry) { stockMissing = true; continue; }
      if (entry.status === "unknown_product" || entry.status === "invalid_item") blockers.push(`${label}: no disponible. Quítala del pedido.`);
      else if (entry.status === "needs_option") blockers.push(`${label}: elige una talla.`);
      else if (entry.backorder) continue;
      else if (entry.available < 1) blockers.push(`${label}: sin existencias. Quítala del pedido.`);
      else if (entry.available < Number(item.quantity || 0)) blockers.push(`${label}: solo hay ${entry.available} piezas.`);
    }
  }
  if (!(snapshot.totals.global > 0)) blockers.push("Añade referencias desde los catálogos.");
  if (stockMissing || snapshot.stock?.status === "loading") blockers.push("Esperando la consulta de existencias…");
  return blockers;
}

function renderRemoved(removed = []) {
  if (!removed.length) return "";
  const unknown = removed.filter((entry) => entry.reason === "unknown_product");
  const empty = removed.filter((entry) => entry.reason !== "unknown_product");
  const list = (entries) => entries.map((entry) => `<li>${escapeHtml(entry.label)}${entry.detail ? ` <small>${escapeHtml(entry.detail)}</small>` : ""}</li>`).join("");
  return `<section class="removed" role="status">
    <p><strong>Quitamos del pedido referencias que Roraima no puede surtir.</strong></p>
    ${empty.length ? `<p>Sin existencias:</p><ul>${list(empty)}</ul>` : ""}
    ${unknown.length ? `<p>No están en el inventario de Roraima:</p><ul>${list(unknown)}</ul>` : ""}
    <button type="button" data-dismiss-removed>Entendido</button>
  </section>`;
}

function renderOdooCheckout(snapshot, draft) {
  const account = snapshot.account || {};
  const checkout = snapshot.checkout || {};
  if (checkout.status === "done" && checkout.order) {
    return `<section class="submit-order is-done" role="status">
      <h3>Pedido recibido</h3>
      <p>Tu pedido <strong>${escapeHtml(checkout.order.name)}</strong> llegó a Roraima (${Number(checkout.order.units) || 0} piezas). El equipo comercial lo revisará y te contactará para confirmarlo. Tu selección se vació.</p>
    </section>`;
  }
  if (account.status !== "signed-in") return "";
  const blockers = checkoutBlockers(snapshot);
  const submitting = checkout.status === "submitting";
  return `<section class="submit-order">
    <h3>Enviar pedido a Roraima</h3>
    <p>Se crea una cotización en Roraima con los precios de tu lista. No se cobra nada en línea.</p>
    <label class="field field-wide"><span>Referencia interna (opcional)</span><input data-focus="checkout-reference" data-checkout-reference maxlength="60" value="${escapeHtml(draft.reference)}"></label>
    <label class="field field-wide"><span>Notas para Roraima (opcional)</span><textarea data-focus="checkout-notes" data-checkout-notes rows="3" maxlength="1000">${escapeHtml(draft.notes)}</textarea></label>
    ${blockers.length ? `<ul class="blockers">${blockers.map((text) => `<li>${escapeHtml(text)}</li>`).join("")}</ul>` : ""}
    ${checkout.status === "error" ? `<p class="checkout-error" role="alert">${escapeHtml(checkout.error)}</p>` : ""}
    <button type="button" data-submit-order ${blockers.length || submitting ? "disabled" : ""}>${submitting ? "Enviando pedido…" : "Enviar pedido"}</button>
  </section>`;
}

const STYLE = `
  :host { color: #1f1d1c; font-family: Montserrat, Arial, sans-serif; }
  * { box-sizing: border-box; }
  button, input, select, textarea { font: inherit; }
  .fab { position: fixed; z-index: 2147483000; right: 22px; bottom: 22px; border: 0; border-radius: 999px; padding: 14px 18px; background: #211f20; color: #fff; box-shadow: 0 10px 30px #0004; cursor: pointer; }
  .fab b { display: inline-grid; min-width: 23px; min-height: 23px; margin-left: 8px; place-items: center; border-radius: 99px; background: #fff; color: #211f20; }
  .backdrop { position: fixed; z-index: 2147482999; inset: 0; background: #1118; }
  .drawer { position: fixed; z-index: 2147483000; top: 0; right: 0; width: min(620px, 100vw); height: 100dvh; overflow: auto; background: #f8f7f5; box-shadow: -16px 0 48px #0003; }
  .inline { min-height: 70vh; background: #f8f7f5; }
  .shell-header { position: sticky; z-index: 2; top: 0; display: flex; justify-content: space-between; gap: 20px; padding: 22px 24px; background: #211f20; color: #fff; }
  .shell-header span { display: block; margin-bottom: 5px; font-size: 11px; letter-spacing: .18em; text-transform: uppercase; opacity: .75; }
  .shell-header h2 { margin: 0; font-size: 23px; }
  .close { width: 38px; height: 38px; border: 1px solid #fff5; border-radius: 50%; background: transparent; color: #fff; font-size: 25px; cursor: pointer; }
  .body { padding: 22px 24px 40px; }
  .status { margin: 0 0 16px; padding: 11px 13px; border-left: 3px solid #83786f; background: #fff; font-size: 13px; }
  .status[data-status=error] { border-color: #a33; color: #7e1f1f; }
  .tabs { display: flex; gap: 8px; overflow-x: auto; margin-bottom: 20px; }
  .tabs button { white-space: nowrap; border: 1px solid #d2ceca; border-radius: 99px; padding: 9px 13px; background: #fff; cursor: pointer; }
  .tabs button[aria-pressed=true] { border-color: #211f20; background: #211f20; color: #fff; }
  .brand-cart { margin-bottom: 20px; border: 1px solid #ddd9d4; background: #fff; }
  .brand-cart > header { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; padding: 15px 16px; border-bottom: 1px solid #ece9e5; }
  .brand-cart h3 { margin: 0; font-size: 17px; }
  .brand-cart header span, .empty small { color: #68615d; font-size: 12px; }
  .item { display: grid; grid-template-columns: 62px minmax(0,1fr) 75px 34px; align-items: center; gap: 12px; padding: 12px 15px; border-bottom: 1px solid #eee; }
  .item:last-child { border-bottom: 0; }
  .item img, .placeholder { width: 62px; height: 45px; object-fit: contain; background: #f1efec; }
  .placeholder { display: grid; place-items: center; color: #817870; font-weight: 700; }
  .item-copy { min-width: 0; }
  .item-copy strong, .item-copy small { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .item-copy small { margin-top: 4px; color: #68615d; }
  .quantity span { display: block; margin-bottom: 4px; font-size: 10px; text-transform: uppercase; }
  .quantity input { width: 72px; padding: 8px; border: 1px solid #ccc; }
  .remove { border: 0; background: transparent; font-size: 24px; cursor: pointer; }
  .empty { padding: 22px 16px; }
  .empty p { margin: 0 0 5px; }
  .optic { margin-top: 24px; padding: 18px; border: 1px solid #d8d3ce; background: #eeebe7; }
  .optic h3 { margin: 0 0 4px; }
  .optic > p { margin: 0 0 15px; color: #68615d; font-size: 13px; }
  .optic-picker { display: grid; grid-template-columns: 1fr auto; gap: 8px; margin-bottom: 14px; }
  .optic-picker select, .field input, .field textarea { width: 100%; border: 1px solid #c8c2bc; background: #fff; padding: 10px; }
  .optic-picker button, .form-actions button { border: 1px solid #211f20; padding: 10px 13px; background: #fff; cursor: pointer; }
  .optic-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .field span { display: block; margin: 0 0 4px; font-size: 11px; }
  .field-wide { grid-column: 1 / -1; }
  .form-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 12px; }
  .form-actions .primary { background: #211f20; color: #fff; }
  .global-link { display: inline-block; margin-top: 20px; color: #211f20; font-weight: 650; }
  .submit-order { margin-top: 20px; padding: 18px; border: 1px solid #211f20; background: #fff; }
  .submit-order p { margin: 0 0 12px; color: #68615d; font-size: 13px; }
  .submit-order button { width: 100%; border: 1px solid #211f20; padding: 12px 16px; background: #211f20; color: #fff; cursor: pointer; }
  .submit-order button:disabled { cursor: not-allowed; opacity: .5; }
  .visual-customer { background: #fff; }
  .visual-customer .field input, .visual-customer .field textarea { border-radius: 4px; }
  .signature-head { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-top: 18px; }
  .signature-head strong { font-size: 13px; }
  .signature-head button { border: 0; background: transparent; color: #4b4540; text-decoration: underline; cursor: pointer; }
  .signature-pad { display: block; width: 100%; height: 140px; margin-top: 8px; border: 1px solid #a9a39d; border-radius: 4px; background: #fff; touch-action: none; cursor: crosshair; }
  .signature-help { display: block; margin: 6px 0 14px; color: #68615d; line-height: 1.5; }
  .pdf-button { width: 100%; min-height: 44px; border: 1px solid #211f20; background: #211f20; color: #fff; font-weight: 700; cursor: pointer; }
  .pdf-button:disabled { opacity: .5; cursor: not-allowed; }
  .pdf-feedback { min-height: 1.2em; margin: 8px 0 0; color: #5a3c19; font-size: 12px; }
  .account-bar { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px 16px; margin: 0 0 16px; padding: 12px 14px; border: 1px solid #d8d3ce; background: #fff; font-size: 13px; }
  .account-bar p { margin: 0; }
  .account-bar.is-muted { background: #eeebe7; }
  .account-bar div { display: flex; gap: 12px; align-items: center; }
  .account-bar a { color: #211f20; font-weight: 650; }
  .account-bar button { border: 1px solid #211f20; padding: 7px 10px; background: #fff; cursor: pointer; }
  .account-bar .account-cta { padding: 8px 12px; background: #211f20; color: #fff; text-decoration: none; }
  .removed { margin: 0 0 12px; padding: 12px 14px; border-radius: 8px; background: #f7e1de; color: #5c1a1a; font-size: 12px; line-height: 1.5; }
  .removed p { margin: 0 0 4px; }
  .removed ul { margin: 0 0 8px; padding-left: 18px; }
  .removed small { color: #7a4a45; }
  .removed button { border: 1px solid #5c1a1a; border-radius: 99px; padding: 4px 12px; background: transparent; color: inherit; cursor: pointer; }
  .minimum { margin: 0; padding: 9px 16px; background: #fff7e0; color: #5a3c19; font-size: 12px; }
  .item-stock { grid-column: 2 / -1; min-width: 0; display: flex; flex-wrap: wrap; align-items: center; gap: 6px 12px; font-size: 12px; }
  .item-stock small { color: #68615d; }
  .item.has-error { background: #fff4f2; }
  .stock { padding: 3px 8px; border-radius: 99px; background: #eeebe7; }
  .stock-ok { background: #e3f1e5; color: #1f5a2a; }
  .stock-low { background: #fff1d6; color: #6b4300; }
  .stock-out { background: #f7e1de; color: #7e1f1f; }
  .line-error { color: #7e1f1f !important; }
  .option-picker { flex: 1 1 100%; min-width: 0; display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
  .option-picker select { width: 100%; max-width: 100%; min-width: 0; padding: 6px; border: 1px solid #c8c2bc; background: #fff; }
  .submit-order h3 { margin: 0 0 6px; }
  .submit-order .field { display: block; margin-bottom: 10px; }
  .submit-order .field input, .submit-order .field textarea { width: 100%; border: 1px solid #c8c2bc; padding: 10px; }
  .blockers { margin: 0 0 12px; padding-left: 18px; color: #6b4300; font-size: 12px; line-height: 1.5; }
  .checkout-error { color: #7e1f1f !important; font-weight: 600; }
  .submit-order.is-done { border-color: #1f5a2a; background: #f1f8f2; }
  .pdf-details { margin-top: 24px; }
  .pdf-details > summary { cursor: pointer; font-weight: 650; padding: 12px 0; }
  @media (max-width: 560px) {
    .body { padding: 18px 14px 32px; }
    .item { grid-template-columns: 50px minmax(0,1fr) 68px 28px; gap: 8px; padding: 10px; }
    .item img, .placeholder { width: 50px; height: 40px; }
    .optic-grid { grid-template-columns: 1fr; }
    .field-wide { grid-column: auto; }
  }
`;

export function mountOrderUI({
  service,
  brand = "global",
  inline = false,
  container = document.body,
} = {}) {
  if (!service || !container) return null;
  const existing = container.querySelector?.(`[data-roraima-b2b-ui="${inline ? "inline" : "drawer"}"]`);
  if (existing) return existing;

  const host = document.createElement("div");
  host.dataset.roraimaB2bUi = inline ? "inline" : "drawer";
  const shadow = host.attachShadow({ mode: "open" });
  container.appendChild(host);
  let view = ORDER_BRANDS.includes(brand) ? brand : "global";
  let open = inline;
  let latest = service.getSnapshot();
  const visualPreview = Boolean(service.isVisualPreview);
  const visualCustomer = {};
  let visualSignature = "";
  const checkoutDraft = { notes: "", reference: "" };

  function mountSignature() {
    const canvas = shadow.querySelector("[data-signature]");
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.strokeStyle = "#211f20";
    context.fillStyle = "#211f20";
    context.lineWidth = 2.4;
    context.lineCap = "round";
    context.lineJoin = "round";
    if (visualSignature) {
      const image = new Image();
      image.onload = () => context.drawImage(image, 0, 0, canvas.width, canvas.height);
      image.src = visualSignature;
    }
    let drawing = false;
    const point = (event) => {
      const rect = canvas.getBoundingClientRect();
      return { x: (event.clientX - rect.left) * canvas.width / rect.width, y: (event.clientY - rect.top) * canvas.height / rect.height };
    };
    canvas.addEventListener("pointerdown", (event) => {
      drawing = true;
      canvas.setPointerCapture(event.pointerId);
      const { x, y } = point(event);
      context.beginPath();
      context.moveTo(x, y);
      context.fillRect(x - 1, y - 1, 2, 2);
    });
    canvas.addEventListener("pointermove", (event) => {
      if (!drawing) return;
      const { x, y } = point(event);
      context.lineTo(x, y);
      context.stroke();
    });
    const finish = () => {
      if (!drawing) return;
      drawing = false;
      visualSignature = canvas.toDataURL("image/png");
    };
    canvas.addEventListener("pointerup", finish);
    canvas.addEventListener("pointercancel", finish);
    shadow.querySelector("[data-clear-signature]")?.addEventListener("click", () => {
      context.clearRect(0, 0, canvas.width, canvas.height);
      visualSignature = "";
    });
  }

  function prefillCustomer() {
    const user = latest.account?.status === "signed-in" ? latest.account.user || {} : null;
    if (!user) return;
    const defaults = {
      optical_name: user.optical || user.company,
      company_name: user.company,
      contact_name: user.name,
      email: user.email,
      phone: user.phone,
      city: user.city,
      country: user.country,
      address: user.street,
    };
    for (const [field, value] of Object.entries(defaults)) {
      if (value && !visualCustomer[field]) visualCustomer[field] = value;
    }
  }

  // Re-rendering replaces the shadow DOM; keep the focused control and caret.
  function captureFocus() {
    const active = shadow.activeElement;
    if (!active?.dataset?.focus) return null;
    let selection = null;
    try { selection = [active.selectionStart, active.selectionEnd]; } catch { selection = null; }
    return { id: active.dataset.focus, selection };
  }

  function restoreFocus(focus) {
    if (!focus) return;
    const target = [...shadow.querySelectorAll("[data-focus]")].find((element) => element.dataset.focus === focus.id);
    if (!target) return;
    target.focus({ preventScroll: true });
    try {
      if (focus.selection && focus.selection[0] !== null) target.setSelectionRange(...focus.selection);
    } catch {
      // Number inputs and selects do not support selection ranges.
    }
  }

  function render() {
    const focus = captureFocus();
    const optic = currentOptic(latest.state);
    const total = latest.totals.global || 0;
    const submitted = Boolean(latest.submission);
    const odoo = latest.mode === "odoo";
    if (odoo) prefillCustomer();
    const errorLines = new Map();
    for (const line of latest.checkout?.lines || []) {
      if (!line?.key) continue;
      if (latest.checkout.code === "insufficient_stock") errorLines.set(line.key, `Solicitaste ${line.requested}; hay ${line.available} disponibles.`);
      else if (latest.checkout.code === "unknown_product") errorLines.set(line.key, "No disponible en Roraima.");
      else if (latest.checkout.code === "needs_option") errorLines.set(line.key, "Elige una talla.");
    }
    const itemsContext = {
      odoo,
      signedIn: odoo && latest.account?.status === "signed-in",
      stockByKey: latest.stock?.byKey || {},
      stockStatus: latest.stock?.status,
      minimum: latest.minimumPerBrand || 50,
      errorLines,
    };
    const statusText = odoo
      ? (latest.status === "ready" ? "Selección guardada en este navegador." : statusCopy(latest))
      : (visualPreview && latest.status === "ready" ? "Selección guardada solo en este navegador." : statusCopy(latest));
    shadow.innerHTML = `<style>${STYLE}</style>
      ${inline ? "" : `<button class="fab" type="button" data-open>Mi pedido <b>${total}</b></button>`}
      ${!inline && open ? "<div class=\"backdrop\" data-close></div>" : ""}
      ${(inline || open) ? `<section class="${inline ? "inline" : "drawer"}" aria-label="Pedido profesional Roraima">
        <header class="shell-header">
          <div><span>Roraima Distribuciones</span><h2>Pedido profesional</h2></div>
          ${inline ? "" : "<button class=\"close\" type=\"button\" data-close aria-label=\"Cerrar pedido\">×</button>"}
        </header>
        <div class="body">
          <p class="status" data-status="${escapeHtml(latest.status)}" aria-live="polite">${escapeHtml(statusText)}</p>
          ${odoo ? renderAccountBar(latest) : ""}
          <nav class="tabs" aria-label="Ver carrito">
            <button type="button" data-view="global" aria-pressed="${view === "global"}">Todo (${latest.totals.global || 0})</button>
            ${ORDER_BRANDS.map((entry) => `<button type="button" data-view="${entry}" aria-pressed="${view === entry}">${BRAND_LABELS[entry]} (${latest.totals[entry] || 0})</button>`).join("")}
          </nav>
          ${odoo ? renderRemoved(latest.removed) : ""}
          ${renderItems(latest.state, view, itemsContext)}
          ${odoo ? `${renderOdooCheckout(latest, checkoutDraft)}<details class="pdf-details" ${latest.account?.status === "signed-in" ? "" : "open"}><summary>Descargar PDF de la selección</summary>${renderVisualCustomerForm(visualCustomer, total)}</details>` : visualPreview ? `${renderVisualCustomerForm(visualCustomer, total)}<section class="submit-order"><p>Este PDF es un borrador descargado por ti. El inicio de sesión y el envío de pedidos todavía no están conectados.</p><button type="button" disabled>Envío de pedidos próximamente</button></section>` : `<section class="optic">
            <h3>Óptica del pedido</h3>
            <p>Guarda tus ópticas una vez y reutilízalas en futuras selecciones.</p>
            <div class="optic-picker">
              <select data-optic-select aria-label="Óptica guardada">
                <option value="">Nueva óptica</option>
                ${renderOpticOptions(latest.state)}
              </select>
              ${optic.id ? "<button type=\"button\" data-delete-optic>Eliminar</button>" : ""}
            </div>
            <form data-optic-form>
              <input type="hidden" name="id" value="${escapeHtml(optic.id || "")}">
              <div class="optic-grid">
                <label class="field"><span>Nombre de la óptica *</span><input name="optical_name" required value="${escapeHtml(optic.optical_name || "")}"></label>
                <label class="field"><span>Razón social *</span><input name="company_name" required value="${escapeHtml(optic.company_name || "")}"></label>
                <label class="field"><span>Contacto *</span><input name="contact_name" required value="${escapeHtml(optic.contact_name || "")}"></label>
                <label class="field"><span>Correo *</span><input name="email" type="email" required value="${escapeHtml(optic.email || "")}"></label>
                <label class="field"><span>Teléfono *</span><input name="phone_e164" type="tel" required pattern="\+[1-9][0-9]{6,14}" placeholder="+525500000000" value="${escapeHtml(optic.phone_e164 || "")}"></label>
                <label class="field"><span>Ciudad *</span><input name="city" required value="${escapeHtml(optic.city || "")}"></label>
                <label class="field field-wide"><span>Dirección</span><input name="address" value="${escapeHtml(optic.address || "")}"></label>
                <label class="field"><span>País *</span><input name="country" required value="${escapeHtml(optic.country || "México")}"></label>
                <label class="field field-wide"><span>Notas</span><textarea name="notes" rows="2">${escapeHtml(optic.notes || "")}</textarea></label>
              </div>
              <div class="form-actions"><button class="primary" type="submit">Guardar óptica</button></div>
            </form>
          </section>
          <section class="submit-order">
            <p>Roraima recibirá una sola solicitud con las referencias de ambas marcas. No se aplican mínimos, precios, stock ni pagos en este portal.</p>
            <button type="button" data-submit-order ${total < 1 || !latest.state.activeOpticId || latest.status === "submitting" || submitted ? "disabled" : ""}>${submitted ? "Solicitud enviada" : "Enviar pedido para revisión"}</button>
          </section>`}
          ${inline ? "" : `<a class="global-link" href="${visualPreview || odoo ? "/profesionales/vista/pedido/" : "/profesionales/pedidos/"}">Abrir vista global Roraima →</a>`}
        </div>
      </section>` : ""}`;

    shadow.querySelector("[data-open]")?.addEventListener("click", () => { open = true; render(); });
    shadow.querySelectorAll("[data-close]").forEach((button) => button.addEventListener("click", () => { open = false; render(); }));
    shadow.querySelectorAll("[data-view]").forEach((button) => button.addEventListener("click", () => { view = button.dataset.view; render(); }));
    shadow.querySelectorAll("[data-quantity-key]").forEach((input) => input.addEventListener("change", () => {
      service.setQuantity(input.dataset.quantityBrand, input.dataset.quantityKey, input.value).catch(() => undefined);
    }));
    shadow.querySelectorAll("[data-remove-key]").forEach((button) => button.addEventListener("click", () => {
      service.removeItem(button.dataset.removeBrand, button.dataset.removeKey).catch(() => undefined);
    }));
    shadow.querySelector("[data-optic-select]")?.addEventListener("change", (event) => {
      service.selectOptic(event.target.value).catch(() => undefined);
    });
    shadow.querySelector("[data-delete-optic]")?.addEventListener("click", () => {
      if (latest.state.activeOpticId) service.deleteOptic(latest.state.activeOpticId).catch(() => undefined);
    });
    shadow.querySelector("[data-optic-form]")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const values = Object.fromEntries(new FormData(event.currentTarget).entries());
      service.saveOptic(values).catch(() => undefined);
    });
    shadow.querySelector("[data-submit-order]")?.addEventListener("click", () => {
      if (!odoo) {
        service.submitOrder().catch(() => undefined);
        return;
      }
      service.submitOrder({ notes: checkoutDraft.notes, reference: checkoutDraft.reference })
        .then(() => { checkoutDraft.notes = ""; checkoutDraft.reference = ""; })
        .catch(() => undefined);
    });
    shadow.querySelectorAll("[data-option-key]").forEach((select) => select.addEventListener("change", () => {
      service.setOption(select.dataset.optionBrand, select.dataset.optionKey, select.value).catch(() => undefined);
    }));
    shadow.querySelector("[data-dismiss-removed]")?.addEventListener("click", () => service.dismissRemoved?.());
    shadow.querySelector("[data-logout]")?.addEventListener("click", () => {
      service.logout().catch(() => undefined);
    });
    shadow.querySelector("[data-checkout-notes]")?.addEventListener("input", (event) => {
      checkoutDraft.notes = event.target.value;
    });
    shadow.querySelector("[data-checkout-reference]")?.addEventListener("input", (event) => {
      checkoutDraft.reference = event.target.value;
    });
    const visualForm = shadow.querySelector("[data-visual-pdf-form]");
    visualForm?.addEventListener("input", (event) => {
      if (event.target.name) visualCustomer[event.target.name] = event.target.value;
    });
    visualForm?.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!event.currentTarget.reportValidity()) return;
      Object.assign(visualCustomer, Object.fromEntries(new FormData(event.currentTarget).entries()));
      const feedback = shadow.querySelector("[data-pdf-feedback]");
      const button = event.currentTarget.querySelector(".pdf-button");
      button.disabled = true;
      feedback.textContent = "Preparando PDF…";
      try {
        const { downloadVisualOrderPdf } = await import("./visual-order-pdf.mjs?v=20261008-3");
        const items = ORDER_BRANDS.flatMap((entry) => latest.state.carts[entry]?.items || []);
        await downloadVisualOrderPdf({ items, customer: visualCustomer, signature: visualSignature });
        feedback.textContent = "PDF descargado. El pedido no se ha enviado a Roraima.";
      } catch (error) {
        feedback.textContent = error.message || "No se pudo generar el PDF.";
      } finally {
        button.disabled = false;
      }
    });
    mountSignature();
    restoreFocus(focus);
  }

  const unsubscribe = service.subscribe((next) => {
    latest = next;
    render();
  });
  host.destroy = () => {
    unsubscribe();
    host.remove();
  };
  service.start().catch(() => undefined);
  return host;
}
