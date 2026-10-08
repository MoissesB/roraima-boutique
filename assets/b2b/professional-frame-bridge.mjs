const ENTRY_ID = "roraima-professional-frame-entry";
const ENTRY_SRC = "/assets/b2b/professional-frame-entry.mjs?v=20261008-visual-5";

function enhanceFrame(frame) {
  try {
    const documentObject = frame.contentDocument;
    if (!documentObject?.head) return;

    if (documentObject.documentElement.dataset.roraimaParentNavigation !== "true") {
      documentObject.documentElement.dataset.roraimaParentNavigation = "true";
      documentObject.addEventListener("click", (event) => {
        const link = typeof event.target?.closest === "function"
          ? event.target.closest("a[href^='/profesionales/']")
          : null;
        if (!link || !link.closest(".innova-global-header")) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        window.location.href = new URL(link.getAttribute("href"), window.location.origin).href;
      }, true);
    }

    if (!documentObject.getElementById(ENTRY_ID)) {
      const script = documentObject.createElement("script");
      script.id = ENTRY_ID;
      script.type = "module";
      script.src = ENTRY_SRC;
      documentObject.head.appendChild(script);
    }
  } catch {
    // Only same-origin professional catalogs are enhanced.
  }
}

function promoteProfessionalRoute(frame) {
  try {
    const next = frame.contentWindow.location;
    if (next.origin !== window.location.origin || !next.pathname.startsWith("/profesionales/")) return false;
    window.location.href = `${next.pathname}${next.search}${next.hash}`;
    return true;
  } catch {
    return false;
  }
}

export function installProfessionalFrame(frame) {
  if (!frame) return;
  frame.addEventListener("load", () => {
    if (!promoteProfessionalRoute(frame)) enhanceFrame(frame);
  });
  // Avoid enhancing the transient about:blank document before the real catalog loads.
  try {
    if (frame.contentDocument?.readyState === "complete" &&
        frame.contentWindow?.location?.href !== "about:blank") {
      enhanceFrame(frame);
    }
  } catch {
    // The load listener will handle the final same-origin catalog document.
  }
}
