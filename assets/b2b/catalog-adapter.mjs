import { LEGACY_ORDER_SOURCES, dedupeItems } from "./order-core.mjs";
import { installRoraimaB2B } from "./roraima-b2b-service.mjs";
import { mountOrderUI } from "./order-ui.mjs?v=20261008-3";

function sameOriginTop(currentWindow) {
  try {
    if (currentWindow.top?.location?.origin === currentWindow.location.origin) return currentWindow.top;
  } catch {
    // Cross-origin frames keep their own isolated service.
  }
  return currentWindow;
}

function parseLegacyValue(storage, source) {
  try {
    const raw = JSON.parse(storage.getItem(source.key) || "null");
    if (!raw || typeof raw !== "object") return null;
    return {
      raw,
      items: dedupeItems(raw.items, source.brand),
      signature: JSON.stringify(raw),
    };
  } catch {
    return null;
  }
}

function hideLegacyOrderUI(documentObject) {
  documentObject.documentElement.classList.add("roraima-b2b-orders-active");
  if (documentObject.getElementById("roraima-b2b-legacy-order-style")) return;
  const style = documentObject.createElement("style");
  style.id = "roraima-b2b-legacy-order-style";
  style.textContent = `
    .roraima-b2b-orders-active .order-fab,
    .roraima-b2b-orders-active .order-backdrop,
    .roraima-b2b-orders-active .sil-order-fab,
    .roraima-b2b-orders-active .sil-order-backdrop,
    .roraima-b2b-orders-active .roraima-boutique-order-bridge {
      display: none !important;
    }
  `;
  documentObject.head.appendChild(style);
}

function allowedOrigin(event, hostWindow) {
  const configured = hostWindow.RORAIMA_B2B_CONFIG?.allowedOrigins || [];
  return event.origin === hostWindow.location.origin || configured.includes(event.origin);
}

function installSharedListeners(hostWindow, service, registry) {
  if (registry.listenersInstalled) return;
  registry.listenersInstalled = true;
  const messageItems = new Map();
  const seenMessage = new Set();

  hostWindow.addEventListener("message", (event) => {
    if (!allowedOrigin(event, hostWindow)) return;
    const payload = event.data;
    if (payload?.type === "roraima-catalog:add-item" && payload.item?.brand) {
      service.addItem(payload.item).catch(() => undefined);
      return;
    }
    if (payload?.type !== "roraima-catalog:replace-brand" || !payload.brand || !Array.isArray(payload.items)) return;
    const previous = messageItems.get(payload.brand) || [];
    const next = dedupeItems(payload.items, payload.brand);
    service.ingestLegacySnapshot(payload.brand, previous, next, {
      initial: !seenMessage.has(payload.brand),
    }).then(() => {
      messageItems.set(payload.brand, next);
      seenMessage.add(payload.brand);
    }).catch(() => undefined);
  });
}

function observeLegacyStorage(hostWindow, service, registry) {
  if (registry.storageObserverInstalled) return;
  registry.storageObserverInstalled = true;
  const storage = hostWindow.localStorage;
  const baselines = new Map();

  for (const source of LEGACY_ORDER_SOURCES) {
    const value = parseLegacyValue(storage, source);
    baselines.set(source.key, {
      signature: value?.signature || null,
      items: value?.items || [],
    });
  }

  const inspect = () => {
    for (const source of LEGACY_ORDER_SOURCES) {
      const nextValue = parseLegacyValue(storage, source);
      const previous = baselines.get(source.key) || { signature: null, items: [] };
      if (!nextValue || nextValue.signature === previous.signature) continue;

      const brands = source.brand
        ? [source.brand]
        : [...new Set(nextValue.items.map((item) => item.brand))];
      const operations = brands.map((brand) => service.ingestLegacySnapshot(
        brand,
        previous.items.filter((item) => item.brand === brand),
        nextValue.items.filter((item) => item.brand === brand),
      ));
      Promise.all(operations).then(() => {
        baselines.set(source.key, {
          signature: nextValue.signature,
          items: nextValue.items,
        });
      }).catch(() => undefined);
    }
  };

  const interval = hostWindow.setInterval(inspect, 500);
  hostWindow.addEventListener("storage", inspect);
  hostWindow.addEventListener("pagehide", () => hostWindow.clearInterval(interval), { once: true });
}

export function mountCatalogAdapter({
  brand,
  mount = true,
  observeStorage = true,
  currentWindow = window,
} = {}) {
  hideLegacyOrderUI(currentWindow.document);
  const hostWindow = sameOriginTop(currentWindow);
  const registry = hostWindow.__RORAIMA_B2B_ADAPTERS__ ||= {};
  const service = installRoraimaB2B(hostWindow);
  installSharedListeners(hostWindow, service, registry);
  if (observeStorage) observeLegacyStorage(hostWindow, service, registry);

  if (mount && hostWindow === currentWindow && !registry.drawer) {
    registry.drawer = mountOrderUI({ service, brand, container: currentWindow.document.body });
  }
  service.start().catch(() => undefined);
  return service;
}
