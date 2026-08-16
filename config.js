(function () {
  const local = /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname);
  // La revisión queda completamente aislada: no carga catálogos ni recursos
  // desde propiedades públicas de terceros ni desde el origen de Innova.
  const alfredPublicUrl = "https://roraima-alfred-kerbs.moisses.chatgpt.site/";
  const portalUrl = local
    ? window.location.origin
    : "https://moissesb.github.io/roraima-boutique";
  const silhouettePublicUrl = `${portalUrl}/silhouette/`;
  const silhouetteCatalogUrl = `${silhouettePublicUrl}#/catalogo`;
  window.RORAIMA_CATALOG_CONFIG = {
    local,
    maintenanceMode: false,
    portalUrl,
    allowedOrigins: [new URL(portalUrl).origin, new URL(alfredPublicUrl).origin],
    brands: {
      "alfred-kerbs": alfredPublicUrl,
      silhouette: silhouetteCatalogUrl,
    },
    brandAssets: {
      "alfred-kerbs": alfredPublicUrl,
      silhouette: silhouettePublicUrl,
    },
  };
})();
