import { mountCatalogAdapter } from "./catalog-adapter.mjs?v=20261123-fourbrands-1";
import { installProfessionalHeader } from "./professional-header.mjs?v=20261123-fourbrands-1";
import { installProfessionalCollection } from "./professional-collection.mjs?v=20261123-1";

try {
  const brand = window.parent !== window
    && window.parent.location.origin === window.location.origin
    ? window.parent.document.body?.dataset.professionalBrand
    : null;
  if (["silhouette", "alfred-kerbs", "jisco", "akoni"].includes(brand)) {
    if (brand === "jisco" || brand === "akoni") installProfessionalCollection({ brand });
    else installProfessionalHeader({ brand });
    mountCatalogAdapter({ brand, mount: false });
  }
} catch {
  // Leave public and cross-origin catalog views unchanged.
}
