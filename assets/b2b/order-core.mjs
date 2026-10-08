export const ORDER_SCHEMA_VERSION = 1;

export const ORDER_BRANDS = Object.freeze(["silhouette", "alfred-kerbs"]);

export const LEGACY_ORDER_SOURCES = Object.freeze([
  { key: "roraima-order-v1", brand: null },
  { key: "roraima-catalog-order-v1", brand: null },
  { key: "roraima-silhouette-professional-order-v1", brand: "silhouette" },
  { key: "roraima-alfred-kerbs-professional-order-v1", brand: "alfred-kerbs" },
]);

const ITEM_FIELDS = Object.freeze([
  "productId",
  "slug",
  "sku",
  "name",
  "model",
  "color",
  "colorCode",
  "collection",
  "category",
  "material",
  "measurements",
  "image",
  "catalogUrl",
]);

const OPTIC_FIELDS = Object.freeze([
  "company_name",
  "optical_name",
  "contact_name",
  "email",
  "phone_e164",
  "address",
  "city",
  "country",
  "notes",
]);

function cleanText(value, maxLength = 500) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function isBrand(value) {
  return ORDER_BRANDS.includes(value);
}

function quantityOf(value) {
  return Math.max(1, Math.min(9999, Math.floor(Number(value) || 1)));
}

function stableHash(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

export function emptyOrderState(userId = null) {
  return {
    schemaVersion: ORDER_SCHEMA_VERSION,
    userId: userId || null,
    carts: {
      silhouette: { brand: "silhouette", items: [], updatedAt: null },
      "alfred-kerbs": { brand: "alfred-kerbs", items: [], updatedAt: null },
    },
    optics: [],
    activeOpticId: null,
    submissionIntent: null,
    migrations: {},
    updatedAt: null,
  };
}

export function normalizeOrderItem(input, fallbackBrand = null) {
  if (!input || typeof input !== "object") return null;
  const brand = isBrand(input.brand) ? input.brand : fallbackBrand;
  if (!isBrand(brand)) return null;

  const normalized = { brand, quantity: quantityOf(input.quantity) };
  for (const field of ITEM_FIELDS) {
    const value = cleanText(input[field], field === "catalogUrl" || field === "image" ? 1600 : 300);
    if (value) normalized[field] = value;
  }

  const identity = normalized.sku
    || normalized.productId
    || normalized.slug
    || cleanText(input.key, 500);
  if (!identity) return null;
  normalized.key = identity.startsWith(`${brand}:`) ? identity : `${brand}:${identity}`;
  return normalized;
}

export function normalizeOptic(input, fallbackId = "") {
  if (!input || typeof input !== "object") return null;
  const aliased = {
    ...input,
    company_name: input.company_name ?? input.legalName ?? input.company ?? "",
    optical_name: input.optical_name ?? input.name ?? input.optical ?? "",
    contact_name: input.contact_name ?? input.contactName ?? "",
    phone_e164: input.phone_e164 ?? input.phone ?? "",
    address: input.address ?? input.addressLine1 ?? "",
  };
  const normalized = {};
  for (const field of OPTIC_FIELDS) {
    const value = cleanText(aliased[field], field === "notes" ? 1000 : 500);
    if (value) normalized[field] = value;
  }
  if (!normalized.optical_name && !normalized.company_name && !normalized.email) return null;
  const seed = [normalized.optical_name, normalized.company_name, normalized.email, normalized.phone_e164]
    .filter(Boolean)
    .join("|")
    .toLocaleLowerCase("es");
  normalized.id = cleanText(input.id, 120) || fallbackId || `optic-${stableHash(seed)}`;
  return normalized;
}

export function opticFromLegacyClient(client) {
  if (!client || typeof client !== "object") return null;
  return normalizeOptic({
    optical_name: client.optical || client.optical_name || client.company || "",
    company_name: client.company || client.company_name || "",
    contact_name: client.name || client.contact_name || "",
    email: client.email || "",
    phone_e164: client.phone || client.phone_e164 || "",
    address: client.address || client.addressLine1 || "",
    city: client.city || "",
    country: client.country || "",
    notes: client.notes || "",
  });
}

function slugify(value) {
  return cleanText(value, 160)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 160) || "producto";
}

export function buildOrderSubmission(state) {
  const normalized = normalizeOrderState(state);
  const optic = normalized.optics.find((entry) => entry.id === normalized.activeOpticId);
  const items = ORDER_BRANDS.flatMap((brand) => normalized.carts[brand].items.map((item) => {
    const fallbackIdentity = item.sku || item.productId || item.slug || item.key;
    return {
      brand: brand === "alfred-kerbs" ? "alfred_kerbs" : brand,
      product_id: cleanText(item.productId || fallbackIdentity, 160),
      product_slug: slugify(item.slug || item.name || item.model || fallbackIdentity),
      sku: cleanText(item.sku || fallbackIdentity, 160),
      name: cleanText(item.name || item.model || item.sku || fallbackIdentity, 240),
      color: cleanText(item.color, 160) || undefined,
      quantity: quantityOf(item.quantity),
      metadata: {
        collection: cleanText(item.collection, 200) || undefined,
        category: cleanText(item.category, 200) || undefined,
        color_code: cleanText(item.colorCode, 100) || undefined,
        material: cleanText(item.material, 300) || undefined,
        measurements: cleanText(item.measurements, 300) || undefined,
        catalog_url: cleanText(item.catalogUrl, 1200) || undefined,
        image: cleanText(item.image, 1200) || undefined,
      },
    };
  }));
  return {
    schema_version: ORDER_SCHEMA_VERSION,
    source: "roraimamx.com",
    currency: "MXN",
    customer: optic ? Object.fromEntries(OPTIC_FIELDS.map((field) => [field, optic[field] || ""])) : null,
    items,
  };
}

export function normalizeOrderState(input, userId = null) {
  const state = emptyOrderState(userId || input?.userId || null);
  if (!input || typeof input !== "object") return state;

  for (const brand of ORDER_BRANDS) {
    const items = Array.isArray(input.carts?.[brand]?.items)
      ? input.carts[brand].items
      : [];
    state.carts[brand].items = dedupeItems(items, brand);
    state.carts[brand].updatedAt = cleanText(input.carts?.[brand]?.updatedAt, 80) || null;
  }

  const seenOptics = new Set();
  state.optics = (Array.isArray(input.optics) ? input.optics : [])
    .map((optic) => normalizeOptic(optic))
    .filter((optic) => optic && !seenOptics.has(optic.id) && seenOptics.add(optic.id));

  const activeOpticId = cleanText(input.activeOpticId, 120);
  state.activeOpticId = state.optics.some((optic) => optic.id === activeOpticId)
    ? activeOpticId
    : state.optics[0]?.id || null;
  const intent = input.submissionIntent;
  if (intent && typeof intent === "object") {
    const key = cleanText(intent.key, 128);
    const fingerprint = cleanText(intent.fingerprint, 80);
    if (key && fingerprint) state.submissionIntent = { key, fingerprint };
  }
  state.migrations = input.migrations && typeof input.migrations === "object"
    ? { ...input.migrations }
    : {};
  state.updatedAt = cleanText(input.updatedAt, 80) || null;
  return state;
}

export function dedupeItems(items, fallbackBrand = null) {
  const byKey = new Map();
  for (const rawItem of Array.isArray(items) ? items : []) {
    const item = normalizeOrderItem(rawItem, fallbackBrand);
    if (!item) continue;
    const previous = byKey.get(item.key);
    byKey.set(item.key, previous
      ? { ...previous, ...item, quantity: Math.max(previous.quantity, item.quantity) }
      : item);
  }
  return [...byKey.values()];
}

export function cartCount(state, brand = null) {
  const brands = brand && isBrand(brand) ? [brand] : ORDER_BRANDS;
  return brands.reduce((total, currentBrand) => total + (
    state?.carts?.[currentBrand]?.items || []
  ).reduce((subtotal, item) => subtotal + quantityOf(item.quantity), 0), 0);
}

export function replaceBrandCart(inputState, brand, items, updatedAt = new Date().toISOString()) {
  const state = normalizeOrderState(inputState);
  if (!isBrand(brand)) return state;
  state.carts[brand] = {
    brand,
    items: dedupeItems(items, brand),
    updatedAt,
  };
  state.updatedAt = updatedAt;
  return state;
}

export function applyLegacyBrandSnapshot(
  inputState,
  brand,
  previousItems,
  nextItems,
  { initial = false, updatedAt = new Date().toISOString() } = {},
) {
  const state = normalizeOrderState(inputState);
  if (!isBrand(brand)) return state;

  const canonical = new Map(state.carts[brand].items.map((item) => [item.key, item]));
  const previous = new Map(dedupeItems(previousItems, brand).map((item) => [item.key, item]));
  const next = new Map(dedupeItems(nextItems, brand).map((item) => [item.key, item]));
  const keys = new Set([...previous.keys(), ...next.keys()]);

  for (const key of keys) {
    const before = previous.get(key);
    const after = next.get(key);
    const current = canonical.get(key);
    const delta = (after?.quantity || 0) - (before?.quantity || 0);

    if (initial && after) {
      canonical.set(key, {
        ...(current || after),
        ...after,
        quantity: Math.max(current?.quantity || 0, after.quantity),
      });
      continue;
    }
    if (delta > 0 && after) {
      canonical.set(key, {
        ...(current || after),
        ...after,
        quantity: Math.min(9999, (current?.quantity || 0) + delta),
      });
    } else if (delta < 0 && current) {
      const quantity = (current.quantity || 0) + delta;
      if (quantity > 0) canonical.set(key, { ...current, quantity });
      else canonical.delete(key);
    }
  }

  state.carts[brand] = { brand, items: [...canonical.values()], updatedAt };
  state.updatedAt = updatedAt;
  return state;
}

export function mergeLegacyOrders(
  inputState,
  legacyEntries,
  migratedAt = new Date().toISOString(),
) {
  let state = normalizeOrderState(inputState);
  const migratedKeys = [];

  for (const source of LEGACY_ORDER_SOURCES) {
    if (state.migrations[source.key]) continue;
    const raw = legacyEntries?.[source.key];
    if (!raw || typeof raw !== "object") continue;

    const items = dedupeItems(raw.items, source.brand);
    const optic = opticFromLegacyClient(raw.client);
    if (!items.length && !optic) continue;

    for (const brand of ORDER_BRANDS) {
      const brandItems = items.filter((item) => item.brand === brand);
      if (!brandItems.length) continue;
      const current = state.carts[brand].items;
      state = replaceBrandCart(state, brand, [...current, ...brandItems], migratedAt);
    }

    if (optic) {
      const existing = state.optics.find((entry) => entry.id === optic.id);
      if (existing) Object.assign(existing, optic);
      else state.optics.push(optic);
      state.activeOpticId ||= optic.id;
    }

    state.migrations[source.key] = {
      migratedAt,
      itemCount: items.length,
      opticId: optic?.id || null,
    };
    migratedKeys.push(source.key);
  }

  state.updatedAt = migratedKeys.length ? migratedAt : state.updatedAt;
  return { state, migratedKeys };
}

export function migrationWasPersisted(persistedState, expectedState, migratedKeys) {
  const persisted = normalizeOrderState(persistedState);
  const expected = normalizeOrderState(expectedState);
  for (const key of migratedKeys) {
    if (!persisted.migrations[key]) return false;
  }
  for (const brand of ORDER_BRANDS) {
    const persistedItems = new Map(persisted.carts[brand].items.map((item) => [item.key, item.quantity]));
    for (const item of expected.carts[brand].items) {
      if ((persistedItems.get(item.key) || 0) < item.quantity) return false;
    }
  }
  for (const optic of expected.optics) {
    if (!persisted.optics.some((entry) => entry.id === optic.id)) return false;
  }
  return true;
}

export function parseLegacyStorage(storage) {
  const entries = {};
  for (const source of LEGACY_ORDER_SOURCES) {
    try {
      const value = JSON.parse(storage?.getItem(source.key) || "null");
      if (value && typeof value === "object") entries[source.key] = value;
    } catch {
      // Malformed legacy values are retained for manual recovery.
    }
  }
  return entries;
}
