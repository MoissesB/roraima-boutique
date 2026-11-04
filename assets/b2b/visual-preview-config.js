(function () {
  "use strict";
  // Load /config.js first. With an API base URL the professional pages talk
  // to Odoo (accounts, stock, checkout); without one they stay a local-only
  // visual preview (selection + PDF).
  const apiBaseUrl = window.RORAIMA_CATALOG_CONFIG && window.RORAIMA_CATALOG_CONFIG.apiBaseUrl;
  window.RORAIMA_B2B_CONFIG = apiBaseUrl
    ? { mode: "odoo", apiBaseUrl }
    : { mode: "visual-preview" };
})();
