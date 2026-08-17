(function () {
  const local = /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname);
  const portalUrl = local
    ? window.location.origin
    : window.location.hostname.endsWith(".github.io")
      ? `${window.location.origin}/roraima-boutique`
      : window.location.origin;
  // Alfred Kerbs se sirve dentro de la propiedad Roraima para que las rutas,
  // fichas e imágenes nunca salgan del dominio del distribuidor.
  const alfredPublicUrl = `${portalUrl}/alfred-kerbs/`;
  const silhouettePublicUrl = `${portalUrl}/silhouette/`;
  window.RORAIMA_CATALOG_CONFIG = {
    local,
    maintenanceMode: false,
    portalUrl,
    allowedOrigins: [new URL(portalUrl).origin, new URL(alfredPublicUrl).origin],
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
