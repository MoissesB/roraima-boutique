(function () {
  const local = /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname);
  // La revisión queda completamente aislada: no carga catálogos ni recursos
  // desde propiedades públicas de terceros ni desde el origen de Innova.
  const alfredLocalUrl = `${window.location.origin}/alfred-kerbs/`;
  const silhouetteLocalUrl = `${window.location.origin}/silhouette/`;
  window.RORAIMA_CATALOG_CONFIG = {
    local,
    maintenanceMode: false,
    portalUrl: window.location.origin,
    allowedOrigins: [window.location.origin],
    brands: {
      "alfred-kerbs": "/alfred-kerbs/",
      silhouette: "/silhouette/",
    },
    brandAssets: {
      "alfred-kerbs": alfredLocalUrl,
      silhouette: silhouetteLocalUrl,
    },
  };
})();
