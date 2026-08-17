(() => {
  const base = "/alfred-kerbs";
  const internalRoots = [
    "/assets/",
    "/catalog/",
    "/media/",
    "/catalogo",
    "/colecciones",
    "/marca",
    "/historia",
    "/filosofia",
    "/distribucion",
    "/contacto",
    "/solicitar-catalogo",
    "/blog",
  ];

  const prefixInternalPath = (value) => {
    if (!value || value.startsWith(base) || value.startsWith("//")) return value;
    if (value === "/") return `${base}/`;
    if (internalRoots.some((root) => value.startsWith(root))) return `${base}${value}`;
    return value;
  };

  const unwrapImageUrl = (value) => {
    if (!value) return value;
    try {
      const url = new URL(value, window.location.origin);
      if (url.pathname === "/_vinext/image") {
        return prefixInternalPath(decodeURIComponent(url.searchParams.get("url") || ""));
      }
    } catch {
      return value;
    }
    return prefixInternalPath(value);
  };

  const fixAnchor = (anchor) => {
    const raw = anchor.getAttribute("href");
    if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return;
    const corrected = prefixInternalPath(raw);
    if (corrected !== raw) anchor.setAttribute("href", corrected);
  };

  const fixImage = (image) => {
    const raw = image.getAttribute("src");
    const corrected = unwrapImageUrl(raw);
    if (corrected && corrected !== raw) image.setAttribute("src", corrected);
    if (image.hasAttribute("srcset")) image.removeAttribute("srcset");
  };

  const fixNode = (node) => {
    if (!(node instanceof Element)) return;
    if (node.matches("a[href]")) fixAnchor(node);
    if (node.matches("img")) fixImage(node);
    node.querySelectorAll("a[href]").forEach(fixAnchor);
    node.querySelectorAll("img").forEach(fixImage);
  };

  fixNode(document.documentElement);
  new MutationObserver((records) => {
    for (const record of records) {
      if (record.type === "attributes") fixNode(record.target);
      record.addedNodes.forEach(fixNode);
    }
  }).observe(document.documentElement, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ["href", "src", "srcset"],
  });
})();
