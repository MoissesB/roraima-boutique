// Account screens for the Odoo-backed professional portal: login, register,
// forgot password, profile, change password, orders, and the token pages
// (/cuenta/activar/, /cuenta/restablecer/). Plain DOM, es-MX copy.

const ACCOUNT_URL = "/profesionales/vista/cuenta/";
const ORDER_STATES = {
  draft: "En revisión",
  sent: "Cotización enviada",
  sale: "Confirmado",
  done: "Completado",
  cancel: "Cancelado",
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

function field(name, label, { type = "text", required = false, autocomplete = "", maxlength = 120, value = "", hint = "", minlength = 0 } = {}) {
  const id = `acct-${name}-${Math.random().toString(36).slice(2, 8)}`;
  return `<label class="account-field" for="${id}"><span>${label}${required ? " *" : ""}</span>
    <input id="${id}" name="${name}" type="${type}" ${required ? "required" : ""} ${autocomplete ? `autocomplete="${autocomplete}"` : ""} maxlength="${maxlength}" ${minlength ? `minlength="${minlength}"` : ""} value="${escapeHtml(value)}">
    ${hint ? `<small>${hint}</small>` : ""}</label>`;
}

function formValues(form) {
  return Object.fromEntries([...new FormData(form).entries()].map(([key, value]) => [key, String(value).trim()]));
}

// Runs an async form action with a busy button and an aria-live message.
async function runForm(form, action, { success = "" } = {}) {
  const button = form.querySelector("button[type=submit]");
  const message = form.querySelector("[data-form-message]");
  if (!form.reportValidity()) return null;
  button.disabled = true;
  message.dataset.tone = "info";
  message.textContent = "Procesando…";
  try {
    const result = await action(formValues(form));
    message.dataset.tone = "ok";
    message.textContent = success;
    return result ?? true;
  } catch (error) {
    message.dataset.tone = "error";
    message.textContent = error.message || "No fue posible completar la operación.";
    message.focus?.();
    return null;
  } finally {
    button.disabled = false;
  }
}

const MESSAGE = '<p class="account-message" data-form-message role="status" aria-live="polite" tabindex="-1"></p>';
const PASSWORD_HINT = "Mínimo 8 caracteres.";

function signedOutView() {
  return `<div class="account-grid">
    <section class="account-card" aria-labelledby="login-title">
      <h2 id="login-title">Iniciar sesión</h2>
      <form data-login novalidate>
        ${field("email", "Correo", { type: "email", required: true, autocomplete: "username", maxlength: 254 })}
        ${field("password", "Contraseña", { type: "password", required: true, autocomplete: "current-password", maxlength: 128 })}
        <button class="account-primary" type="submit">Entrar</button>
        ${MESSAGE}
      </form>
      <details class="account-forgot">
        <summary>¿Olvidaste tu contraseña?</summary>
        <form data-forgot novalidate>
          ${field("email", "Correo de tu cuenta", { type: "email", required: true, autocomplete: "email", maxlength: 254 })}
          <button type="submit">Enviar enlace</button>
          ${MESSAGE}
        </form>
      </details>
    </section>
    <section class="account-card" aria-labelledby="register-title">
      <h2 id="register-title">Crear cuenta profesional</h2>
      <p>Para ópticas y compradores profesionales en México. Te enviaremos un correo para confirmar tu dirección y elegir tu contraseña.</p>
      <form data-register novalidate>
        <div class="account-two">
          ${field("name", "Nombre del contacto", { required: true, autocomplete: "name" })}
          ${field("optical", "Nombre de la óptica", { required: true, autocomplete: "organization", maxlength: 160 })}
          ${field("company", "Razón social", { maxlength: 160 })}
          ${field("vat", "RFC", { maxlength: 20 })}
          ${field("email", "Correo", { type: "email", required: true, autocomplete: "email", maxlength: 254 })}
          ${field("phone", "Teléfono con lada", { type: "tel", required: true, autocomplete: "tel", maxlength: 32, hint: "Ejemplo: +52 55 1234 5678" })}
          ${field("street", "Dirección", { autocomplete: "street-address", maxlength: 160 })}
          ${field("city", "Ciudad", { required: true, autocomplete: "address-level2", maxlength: 80 })}
          ${field("zip", "Código postal", { autocomplete: "postal-code", maxlength: 16 })}
          ${field("country", "País", { required: true, autocomplete: "country-name", maxlength: 80, value: "México" })}
        </div>
        <button class="account-primary" type="submit">Crear cuenta</button>
        ${MESSAGE}
      </form>
    </section>
  </div>`;
}

function signedInView(user) {
  const rows = [
    ["Contacto", user.name],
    ["Correo", user.email],
    ["Óptica", user.optical || user.company],
    ["Teléfono", user.phone],
    ["Ciudad", [user.city, user.country].filter(Boolean).join(", ")],
  ].filter(([, value]) => value);
  return `<div class="account-grid">
    <section class="account-card" aria-labelledby="profile-title">
      <h2 id="profile-title">Mi cuenta</h2>
      <dl class="account-profile">${rows.map(([label, value]) => `<dt>${label}</dt><dd>${escapeHtml(value)}</dd>`).join("")}</dl>
      <p class="account-note">Para cambiar estos datos escríbenos a <a href="mailto:ventas@roraimamx.net">ventas@roraimamx.net</a>.</p>
      <div class="account-actions">
        <a class="account-primary" href="/profesionales/vista/pedido/">Ver mi pedido</a>
        <button type="button" data-logout>Cerrar sesión</button>
      </div>
      ${MESSAGE}
    </section>
    <section class="account-card" aria-labelledby="orders-title">
      <h2 id="orders-title">Mis pedidos</h2>
      <div data-orders><p>Cargando pedidos…</p></div>
    </section>
    <section class="account-card" aria-labelledby="password-title">
      <h2 id="password-title">Cambiar contraseña</h2>
      <form data-change-password novalidate>
        ${field("old_password", "Contraseña actual", { type: "password", required: true, autocomplete: "current-password", maxlength: 128 })}
        ${field("new_password", "Nueva contraseña", { type: "password", required: true, autocomplete: "new-password", maxlength: 128, minlength: 8, hint: PASSWORD_HINT })}
        ${field("confirm", "Repite la nueva contraseña", { type: "password", required: true, autocomplete: "new-password", maxlength: 128, minlength: 8 })}
        <button type="submit">Cambiar contraseña</button>
        ${MESSAGE}
      </form>
    </section>
  </div>`;
}

function renderOrders(target, orders) {
  if (!orders.length) {
    target.innerHTML = "<p>Aún no has enviado pedidos desde el portal.</p>";
    return;
  }
  target.innerHTML = `<ul class="account-orders">${orders.map((order) => `<li>
    <strong>${escapeHtml(order.name)}</strong>
    <span>${escapeHtml(new Date(`${String(order.date).replace(" ", "T")}Z`).toLocaleDateString("es-MX", { dateStyle: "medium" }))}</span>
    <span>${Number(order.units) || 0} piezas</span>
    <span class="account-state">${escapeHtml(ORDER_STATES[order.state] || order.state)}</span>
  </li>`).join("")}</ul>`;
}

export function mountAccountPage({ service, container }) {
  if (!service || !container) return;
  let renderedStatus = null;

  function render(snapshot) {
    const account = snapshot.account || {};
    const status = snapshot.mode !== "odoo" ? "disabled" : account.status;
    if (status === renderedStatus) return;
    renderedStatus = status;

    if (status === "disabled") {
      container.innerHTML = `<div class="account-card"><h2>Cuentas profesionales en preparación</h2>
        <p>En este entorno el inicio de sesión no está conectado. Puedes seleccionar productos y descargar el PDF desde «Mi pedido».</p>
        <a class="account-primary" href="/profesionales/vista/">Volver a los catálogos</a></div>`;
      return;
    }
    if (status === "unavailable") {
      container.innerHTML = `<div class="account-card" role="alert"><h2>Servicio no disponible</h2>
        <p>${escapeHtml(account.error || "No pudimos conectar con el servidor de Roraima.")}</p>
        <button type="button" data-retry>Reintentar</button></div>`;
      container.querySelector("[data-retry]").addEventListener("click", () => {
        renderedStatus = null;
        service.refreshAccount();
      });
      return;
    }
    if (status !== "signed-in" && status !== "signed-out") {
      container.innerHTML = '<p class="account-loading" role="status">Comprobando tu sesión…</p>';
      return;
    }
    if (status === "signed-out") {
      container.innerHTML = signedOutView();
      const login = container.querySelector("[data-login]");
      login.addEventListener("submit", (event) => {
        event.preventDefault();
        runForm(login, (values) => service.login(values.email, values.password), { success: "Sesión iniciada." });
      });
      const forgot = container.querySelector("[data-forgot]");
      forgot.addEventListener("submit", (event) => {
        event.preventDefault();
        runForm(forgot, (values) => service.forgotPassword(values.email), {
          success: "Si el correo pertenece a una cuenta, recibirás un enlace para restablecer tu contraseña.",
        });
      });
      const register = container.querySelector("[data-register]");
      register.addEventListener("submit", async (event) => {
        event.preventDefault();
        const done = await runForm(register, (values) => service.register(values), {
          success: "Listo. Te enviamos un correo para activar tu cuenta; revisa también la carpeta de spam. El enlace caduca en 48 horas.",
        });
        if (done) register.querySelectorAll("input:not([name=country])").forEach((input) => { input.value = ""; });
      });
      return;
    }

    container.innerHTML = signedInView(account.user || {});
    container.querySelector("[data-logout]").addEventListener("click", () => {
      service.logout().catch((error) => {
        const message = container.querySelector("[data-form-message]");
        message.dataset.tone = "error";
        message.textContent = error.message;
      });
    });
    const change = container.querySelector("[data-change-password]");
    change.addEventListener("submit", (event) => {
      event.preventDefault();
      runForm(change, async (values) => {
        if (values.new_password !== values.confirm) throw new Error("Las contraseñas nuevas no coinciden.");
        try {
          await service.changePassword(values.old_password, values.new_password);
        } catch (error) {
          if (error.code === "invalid_credentials") throw new Error("La contraseña actual no es correcta.");
          throw error;
        }
        change.reset();
      }, { success: "Contraseña actualizada." });
    });
    const orders = container.querySelector("[data-orders]");
    service.listOrders()
      .then((list) => renderOrders(orders, list))
      .catch((error) => { orders.innerHTML = `<p role="alert">${escapeHtml(error.message)}</p>`; });
  }

  service.subscribe(render);
  service.start().catch(() => undefined);
}

// /cuenta/activar/ and /cuenta/restablecer/: choose a password from an
// emailed token, then continue signed in.
export function mountTokenPage({ service, container, kind }) {
  if (!service || !container) return;
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token") || "";
  // Keep the token out of the address bar, history and referrers.
  if (token) window.history.replaceState(null, "", window.location.pathname);
  const activate = kind === "activate";

  if (!service.isOdoo) {
    container.innerHTML = '<div class="account-card"><h2>Cuentas no disponibles</h2><p>En este entorno el servidor de cuentas no está conectado.</p></div>';
    return;
  }
  if (!token) {
    container.innerHTML = `<div class="account-card" role="alert"><h2>Enlace incompleto</h2>
      <p>Abre el enlace completo que te enviamos por correo o solicita uno nuevo.</p>
      <a class="account-primary" href="${ACCOUNT_URL}">Ir a mi cuenta</a></div>`;
    return;
  }
  container.innerHTML = `<div class="account-card">
    <h2>${activate ? "Activa tu cuenta" : "Elige una nueva contraseña"}</h2>
    <p>${activate ? "Elige la contraseña con la que entrarás al portal profesional de Roraima." : "Tu enlace es válido durante 2 horas y solo se puede usar una vez."}</p>
    <form data-token-form novalidate>
      ${field("password", "Contraseña", { type: "password", required: true, autocomplete: "new-password", maxlength: 128, minlength: 8, hint: PASSWORD_HINT })}
      ${field("confirm", "Repite la contraseña", { type: "password", required: true, autocomplete: "new-password", maxlength: 128, minlength: 8 })}
      <button class="account-primary" type="submit">${activate ? "Activar cuenta" : "Guardar contraseña"}</button>
      ${MESSAGE}
    </form>
  </div>`;
  const form = container.querySelector("[data-token-form]");
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const done = await runForm(form, async (values) => {
      if (values.password !== values.confirm) throw new Error("Las contraseñas no coinciden.");
      return activate ? service.activate(token, values.password) : service.resetPassword(token, values.password);
    }, { success: activate ? "Cuenta activada. Ya iniciaste sesión." : "Contraseña actualizada. Ya iniciaste sesión." });
    if (done) {
      form.querySelectorAll("input").forEach((element) => { element.value = ""; });
      form.querySelectorAll("input, button").forEach((element) => { element.disabled = true; });
      const next = document.createElement("a");
      next.className = "account-primary";
      next.href = ACCOUNT_URL;
      next.textContent = "Ir a mi cuenta";
      form.after(next);
      next.focus();
    }
  });
  service.start().catch(() => undefined);
}
