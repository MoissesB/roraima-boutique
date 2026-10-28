// Client for the roraima_portal_api Odoo module (/roraima/api/*).
// The session is Odoo's own session_id cookie on the API host, so every call
// uses credentials: "include". Nothing secret is stored in the browser.

export class RoraimaApiError extends Error {
  constructor(code, message, lines = null) {
    super(message || "No fue posible completar la operación.");
    this.name = "RoraimaApiError";
    this.code = code;
    this.lines = Array.isArray(lines) ? lines : null;
  }
}

const NETWORK_MESSAGE = "No se pudo conectar con el servidor de pedidos de Roraima. Revisa tu conexión e inténtalo de nuevo.";

export function createOdooClient({ baseUrl, fetchImpl = globalThis.fetch?.bind(globalThis) } = {}) {
  const root = String(baseUrl || "").replace(/\/+$/, "");
  if (!root || typeof fetchImpl !== "function") return null;

  async function call(path, params = {}) {
    let response;
    try {
      response = await fetchImpl(`${root}/roraima/api/${path}`, {
        method: "POST",
        mode: "cors",
        credentials: "include",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", method: "call", id: Date.now(), params }),
      });
    } catch {
      throw new RoraimaApiError("network", NETWORK_MESSAGE);
    }
    if (!response.ok) {
      throw new RoraimaApiError(response.status === 404 ? "unavailable" : "network", NETWORK_MESSAGE);
    }
    let body;
    try {
      body = await response.json();
    } catch {
      throw new RoraimaApiError("server_error", "Respuesta no válida del servidor.");
    }
    const result = body?.result;
    if (!result || body.error) throw new RoraimaApiError("server_error", "No fue posible completar la operación.");
    if (!result.ok) throw new RoraimaApiError(result.error?.code || "server_error", result.error?.message, result.lines);
    return result;
  }

  return {
    baseUrl: root,
    call,
    me: () => call("me"),
    emailAvailable: (email) => call("auth/email-available", { email }),
    register: (values) => call("auth/register", values),
    activate: (token, password) => call("auth/activate", { token, password }),
    login: (email, password) => call("auth/login", { email, password }),
    logout: () => call("auth/logout"),
    forgot: (email) => call("auth/forgot", { email }),
    reset: (token, password) => call("auth/reset", { token, password }),
    changePassword: (oldPassword, newPassword) => call("auth/change-password", {
      old_password: oldPassword,
      new_password: newPassword,
    }),
    stock: (items) => call("stock", { items }),
    checkout: (payload) => call("checkout", payload),
    orders: () => call("orders"),
  };
}

// Only the fields the server reads to resolve a product; never ids or prices.
export function apiItem(item) {
  const entry = { key: item.key, brand: item.brand };
  for (const field of ["sku", "model", "colorCode", "option"]) {
    if (typeof item[field] === "string" && item[field]) entry[field] = item[field];
  }
  return entry;
}
