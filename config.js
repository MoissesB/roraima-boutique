(function () {
  const local = /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname);
  const portalUrl = local
    ? window.location.origin
    : window.location.hostname.endsWith(".github.io")
      ? `${window.location.origin}/roraima-boutique`
      : window.location.origin;
  // Public base URL of the Odoo portal API (roraima_portal_api module, see
  // docs/odoo-integration.md). The session is Odoo's session_id cookie on the
  // API host, which browsers only send from a same-site page: localhost to
  // localhost, or roraimamx.com to a roraimamx.com subdomain. On *.github.io
  // the API stays off and the professional pages remain a visual preview.
  const apiEnvironments = {
    local: "http://localhost:8080",
    staging: "https://api-staging.roraimamx.com",
    production: "https://api.roraimamx.com",
  };
  // Flip to true once api.roraimamx.com is deployed.
  const productionApiEnabled = false;
  const apiBaseUrl = (() => {
    if (local) return apiEnvironments.local;
    if (!/(^|\.)roraimamx\.com$/.test(window.location.hostname)) return null;
    // Testers can pick an environment with ?roraima-api=staging|production|off;
    // the choice is remembered in this browser only.
    let choice = null;
    try {
      const requested = new URLSearchParams(window.location.search).get("roraima-api");
      if (requested && (requested === "off" || apiEnvironments[requested])) {
        window.localStorage.setItem("roraima-api-environment", requested);
      }
      choice = window.localStorage.getItem("roraima-api-environment");
    } catch {
      choice = null;
    }
    if (choice === "off") return null;
    if (choice === "staging" || choice === "production") return apiEnvironments[choice];
    return productionApiEnabled ? apiEnvironments.production : null;
  })();
  const alfredPublicUrl = `${portalUrl}/alfred-kerbs/`;
  const silhouettePublicUrl = `${portalUrl}/silhouette/`;
  window.RORAIMA_CATALOG_CONFIG = {
    local,
    maintenanceMode: false,
    portalUrl,
    apiBaseUrl,
    allowedOrigins: [new URL(portalUrl).origin],
    brands: {
      "alfred-kerbs": alfredPublicUrl,
      // Los enlaces de marca siempre llegan a su portada. Las rutas de
      // categoría y catálogo se generan de forma explícita en app.js.
      silhouette: silhouettePublicUrl,
    },
    brandAssets: {
      "alfred-kerbs": alfredPublicUrl,
      silhouette: silhouettePublicUrl,
    },
  };
})();
