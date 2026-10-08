import { mountCatalogAdapter } from "./catalog-adapter.mjs?v=20261008-visual-2";
import { installProfessionalHeader } from "./professional-header.mjs?v=20261008-visual-3";

try {
  const brand = window.parent !== window
    && window.parent.location.origin === window.location.origin
    ? window.parent.document.body?.dataset.professionalBrand
    : null;
  if (brand === "silhouette" || brand === "alfred-kerbs") {
    installProfessionalHeader({ brand });
    mountCatalogAdapter({ brand, mount: false });
  }
} catch {
  // Leave public and cross-origin catalog views unchanged.
}
