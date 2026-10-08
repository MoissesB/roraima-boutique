import {
  LEGACY_ORDER_SOURCES,
  ORDER_BRANDS,
  applyLegacyBrandSnapshot,
  buildOrderSubmission,
  cartCount,
  emptyOrderState,
  mergeLegacyOrders,
  migrationWasPersisted,
  normalizeOptic,
  normalizeOrderItem,
  normalizeOrderState,
  parseLegacyStorage,
  replaceBrandCart,
} from "./order-core.mjs";

function createId(prefix = "id") {
  if (globalThis.crypto?.randomUUID) return `${prefix}-${globalThis.crypto.randomUUID()}`;
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function stableHash(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

async function resolveSupabaseClient(config, globalObject) {
  const existing = config.supabaseClient
    || config.client
    || globalObject?.RORAIMA_B2B_CONFIG?.supabaseClient
    || globalObject?.RORAIMA_SUPABASE?.client
    || globalObject?.supabaseClient
    || null;
  if (existing) return existing;
  if (typeof config.getSupabaseClient === "function") return config.getSupabaseClient();
  if (config.supabaseUrl && config.supabaseAnonKey) {
    const moduleUrl = config.supabaseModule || "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
    const module = await import(moduleUrl);
    return module.createClient(String(config.supabaseUrl).replace(/\/$/, ""), config.supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: "pkce",
      },
    });
  }
  return null;
}

async function resolveSession(config, client) {
  if (typeof config.getSession === "function") return config.getSession();
  if (config.session?.user?.id) return config.session;
  if (!client?.auth?.getSession) return null;
  const result = await client.auth.getSession();
  if (result?.error) throw result.error;
  return result?.data?.session || null;
}

export function createSupabaseOrderRepository(client, config = {}) {
  const table = config.table || "b2b_order_drafts";
  const payloadColumn = config.payloadColumn || "payload";

  return {
    async load(userId) {
      const query = client
        .from(table)
        .select(payloadColumn)
        .eq("user_id", userId);
      const result = typeof query.maybeSingle === "function"
        ? await query.maybeSingle()
        : await query.single();
      if (result?.error && result.error.code !== "PGRST116") throw result.error;
      return result?.data?.[payloadColumn] || null;
    },

    async save(userId, state) {
      const row = {
        user_id: userId,
        [payloadColumn]: state,
        updated_at: new Date().toISOString(),
      };
      let query = client.from(table).upsert(row, { onConflict: "user_id" });
      if (typeof query.select === "function") query = query.select(payloadColumn);
      const result = typeof query.single === "function" ? await query.single() : await query;
      if (result?.error) throw result.error;
      return result?.data?.[payloadColumn] || state;
    },
  };
}

export function createRoraimaB2BService({
  globalObject = globalThis,
  storage = globalObject?.localStorage,
  initialConfig = {},
} = {}) {
  let config = { ...(globalObject?.RORAIMA_B2B_CONFIG || {}), ...initialConfig };
  let state = emptyOrderState();
  let status = "idle";
  let error = null;
  let session = null;
  let repository = null;
  let supabaseClient = null;
  let submission = null;
  let initialized = false;
  let initializePromise = null;
  let writeChain = Promise.resolve();
  let authSubscription = null;
  const subscribers = new Set();

  function localMockMode() {
    return config.mode === "mock"
      && /^(localhost|127\.0\.0\.1)$/.test(globalObject?.location?.hostname || "");
  }

  function visualPreviewMode() {
    return config.mode === "visual-preview"
      && /^(localhost|127\.0\.0\.1|roraimamx\.com|www\.roraimamx\.com)$/.test(globalObject?.location?.hostname || "");
  }

  function mockRepository() {
    const key = visualPreviewMode()
      ? "roraima-b2b-visual-draft-v1"
      : "roraima-b2b-mock-draft-v1";
    return {
      async load() {
        try { return JSON.parse(storage?.getItem(key) || "null"); } catch { return null; }
      },
      async save(_userId, nextState) {
        storage?.setItem(key, JSON.stringify(nextState));
        return nextState;
      },
    };
  }

  function snapshot() {
    return {
      status,
      error,
      session,
      submission,
      state: clone(state),
      totals: Object.fromEntries([
        ...ORDER_BRANDS.map((brand) => [brand, cartCount(state, brand)]),
        ["global", cartCount(state)],
      ]),
    };
  }

  function notify() {
    const value = snapshot();
    for (const callback of subscribers) callback(value);
    if (typeof globalObject?.dispatchEvent === "function" && typeof globalObject.CustomEvent === "function") {
      globalObject.dispatchEvent(new globalObject.CustomEvent("roraima-b2b:state", { detail: value }));
    }
  }

  function setStatus(nextStatus, nextError = null) {
    status = nextStatus;
    error = nextError ? String(nextError.message || nextError) : null;
    notify();
  }

  function resolveRepository(client) {
    if (config.repository?.load && config.repository?.save) return config.repository;
    return client ? createSupabaseOrderRepository(client, config) : null;
  }

  async function loadForSession(nextSession) {
    session = nextSession?.user?.id ? nextSession : null;
    if (!session) {
      state = emptyOrderState();
      setStatus("signed-out");
      return snapshot();
    }
    if (!repository) {
      state = emptyOrderState(session.user.id);
      setStatus("configuration-required");
      return snapshot();
    }

    setStatus("loading");
    const remote = await repository.load(session.user.id);
    state = normalizeOrderState(remote, session.user.id);
    // The public visual preview must not consume or clear existing catalog carts.
    const legacyEntries = visualPreviewMode() ? [] : parseLegacyStorage(storage);
    const migration = mergeLegacyOrders(state, legacyEntries);

    if (migration.migratedKeys.length) {
      setStatus("migrating");
      const persisted = await repository.save(session.user.id, migration.state);
      if (!migrationWasPersisted(persisted, migration.state, migration.migratedKeys)) {
        throw new Error("La persistencia no confirmó la migración completa del pedido.");
      }
      state = normalizeOrderState(persisted, session.user.id);
      for (const key of migration.migratedKeys) storage?.removeItem(key);
    }

    setStatus("ready");
    return snapshot();
  }

  async function initialize() {
    if (initializePromise) return initializePromise;
    initializePromise = (async () => {
      try {
        if (localMockMode() || visualPreviewMode()) {
          repository = config.repository || mockRepository();
          await loadForSession(config.session || {
            access_token: "mock-local-preview-token",
            user: { id: "00000000-0000-4000-8000-000000000001" },
          });
          initialized = true;
          return snapshot();
        }
        const client = await resolveSupabaseClient(config, globalObject);
        supabaseClient = client;
        repository = resolveRepository(client);
        const nextSession = await resolveSession(config, client);
        await loadForSession(nextSession);

        if (!authSubscription && client?.auth?.onAuthStateChange) {
          const result = client.auth.onAuthStateChange((_event, changedSession) => {
            writeChain = writeChain
              .catch(() => undefined)
              .then(() => loadForSession(changedSession))
              .catch((authError) => setStatus("error", authError));
          });
          authSubscription = result?.data?.subscription || result?.subscription || null;
        }
        initialized = true;
        return snapshot();
      } catch (initializationError) {
        setStatus("error", initializationError);
        throw initializationError;
      } finally {
        initializePromise = null;
      }
    })();
    return initializePromise;
  }

  function enqueueMutation(mutator) {
    writeChain = writeChain
      .catch(() => undefined)
      .then(async () => {
        if (!initialized) await initialize();
        if (!session?.user?.id || !repository) throw new Error("Se requiere una sesión Supabase activa.");
        const previous = state;
        const changedAt = new Date().toISOString();
        const next = normalizeOrderState(mutator(clone(state), changedAt), session.user.id);
        next.submissionIntent = null;
        next.updatedAt = changedAt;
        state = next;
        submission = null;
        setStatus("saving");
        try {
          const persisted = await repository.save(session.user.id, next);
          state = normalizeOrderState(persisted || next, session.user.id);
          setStatus("ready");
          return snapshot();
        } catch (mutationError) {
          state = previous;
          setStatus("error", mutationError);
          throw mutationError;
        }
      });
    return writeChain;
  }

  const service = {
    get version() { return 1; },
    get isVisualPreview() { return visualPreviewMode(); },
    getSnapshot: snapshot,
    start: initialize,
    configure(nextConfig = {}) {
      config = { ...config, ...nextConfig };
      if (globalObject) globalObject.RORAIMA_B2B_CONFIG = config;
      repository = null;
      initialized = false;
      return initialize();
    },
    subscribe(callback) {
      subscribers.add(callback);
      callback(snapshot());
      return () => subscribers.delete(callback);
    },
    dispose() {
      authSubscription?.unsubscribe?.();
      authSubscription = null;
      subscribers.clear();
    },
    replaceBrand(brand, items) {
      return enqueueMutation((current, changedAt) => replaceBrandCart(current, brand, items, changedAt));
    },
    ingestLegacySnapshot(brand, previousItems, nextItems, options = {}) {
      return enqueueMutation((current, changedAt) => applyLegacyBrandSnapshot(
        current,
        brand,
        previousItems,
        nextItems,
        { ...options, updatedAt: changedAt },
      ));
    },
    addItem(rawItem) {
      return enqueueMutation((current, changedAt) => {
        const item = normalizeOrderItem(rawItem, rawItem?.brand);
        if (!item) return current;
        const items = current.carts[item.brand].items;
        const existing = items.find((entry) => entry.key === item.key);
        if (existing) existing.quantity = Math.min(9999, existing.quantity + item.quantity);
        else items.push(item);
        current.carts[item.brand].updatedAt = changedAt;
        return current;
      });
    },
    setQuantity(brand, key, quantity) {
      return enqueueMutation((current, changedAt) => {
        const item = current.carts?.[brand]?.items.find((entry) => entry.key === key);
        if (!item) return current;
        const nextQuantity = Math.floor(Number(quantity) || 0);
        if (nextQuantity < 1) {
          current.carts[brand].items = current.carts[brand].items.filter((entry) => entry.key !== key);
        } else {
          item.quantity = Math.min(9999, nextQuantity);
        }
        current.carts[brand].updatedAt = changedAt;
        return current;
      });
    },
    removeItem(brand, key) {
      return service.setQuantity(brand, key, 0);
    },
    saveOptic(rawOptic) {
      return enqueueMutation((current) => {
        const optic = normalizeOptic({ ...rawOptic, id: rawOptic?.id || createId("optic") });
        if (!optic) throw new Error("La óptica necesita al menos un nombre o correo.");
        const index = current.optics.findIndex((entry) => entry.id === optic.id);
        if (index >= 0) current.optics[index] = optic;
        else current.optics.push(optic);
        current.activeOpticId = optic.id;
        return current;
      });
    },
    selectOptic(opticId) {
      return enqueueMutation((current) => {
        current.activeOpticId = current.optics.some((entry) => entry.id === opticId)
          ? opticId
          : null;
        return current;
      });
    },
    deleteOptic(opticId) {
      return enqueueMutation((current) => {
        current.optics = current.optics.filter((entry) => entry.id !== opticId);
        if (current.activeOpticId === opticId) current.activeOpticId = current.optics[0]?.id || null;
        return current;
      });
    },
    async submitOrder({ idempotencyKey = null } = {}) {
      if (visualPreviewMode()) throw new Error("El envío de pedidos se habilitará al conectar el portal profesional.");
      if (!initialized) await initialize();
      if (!session?.user?.id) throw new Error("Se requiere una sesión Supabase activa.");
      const payload = buildOrderSubmission(state);
      if (!payload.items.length) throw new Error("Añade al menos una referencia al pedido.");
      if (!payload.customer) throw new Error("Selecciona o guarda la óptica del pedido.");

      const required = ["company_name", "optical_name", "contact_name", "email", "phone_e164", "city", "country"];
      const missing = required.filter((field) => !payload.customer[field]);
      if (missing.length) throw new Error("Completa los datos obligatorios de la óptica.");

      const fingerprint = stableHash(JSON.stringify(payload));
      let requestKey = String(idempotencyKey || "").trim();
      if (!requestKey && state.submissionIntent?.fingerprint === fingerprint) {
        requestKey = state.submissionIntent.key;
      }
      if (!requestKey) {
        requestKey = `order:${session.user.id}:${fingerprint}:${stableHash(state.updatedAt || "new")}`;
      }

      if (state.submissionIntent?.key !== requestKey || state.submissionIntent?.fingerprint !== fingerprint) {
        const nextState = normalizeOrderState(state, session.user.id);
        nextState.submissionIntent = { key: requestKey, fingerprint };
        const persisted = await repository.save(session.user.id, nextState);
        state = normalizeOrderState(persisted || nextState, session.user.id);
      }

      setStatus("submitting");
      try {
        let result;
        if (typeof config.submitOrder === "function") {
          result = await config.submitOrder({ payload, idempotencyKey: requestKey, session });
        } else if (supabaseClient?.functions?.invoke) {
          const functionName = config.functionNames?.ordersSubmit || "orders-submit";
          const response = await supabaseClient.functions.invoke(functionName, {
            body: payload,
            headers: { "Idempotency-Key": requestKey },
          });
          if (response?.error) throw response.error;
          result = response?.data;
        } else {
          throw new Error("La función orders-submit todavía no está conectada.");
        }
        const submittedAt = new Date().toISOString();
        const nextState = normalizeOrderState(state, session.user.id);
        for (const brand of ORDER_BRANDS) {
          nextState.carts[brand].items = [];
          nextState.carts[brand].updatedAt = submittedAt;
        }
        nextState.submissionIntent = null;
        nextState.updatedAt = submittedAt;
        const persisted = await repository.save(session.user.id, nextState);
        state = normalizeOrderState(persisted || nextState, session.user.id);
        submission = { idempotencyKey: requestKey, fingerprint, result: result || null, submittedAt };
        setStatus("ready");
        return submission;
      } catch (submissionError) {
        setStatus("error", submissionError);
        throw submissionError;
      }
    },
    async listOrders(limit = 50) {
      if (!initialized) await initialize();
      if (!session?.user?.id) throw new Error("Se requiere una sesión Supabase activa.");
      if (localMockMode()) {
        return [{ id: "00000000-0000-4000-8000-000000000101", order_number: "RRM-PREVIEW-0001", status: "under_review", total_units: 3, created_at: "2026-10-07T12:00:00.000Z", summary: { customer: { optical_name: "Óptica de prueba" }, brands: { silhouette: 2, alfred_kerbs: 1 } } }];
      }
      if (!supabaseClient) throw new Error("La conexión Supabase todavía no está disponible.");
      const result = await supabaseClient
        .from("orders")
        .select("id,order_number,status,total_units,created_at,submitted_at,confirmed_at,summary")
        .order("created_at", { ascending: false })
        .limit(Math.max(1, Math.min(100, Number(limit) || 50)));
      if (result.error) throw result.error;
      return result.data || [];
    },
    async listCustomers(limit = 100) {
      if (!initialized) await initialize();
      if (!session?.user?.id) throw new Error("Se requiere una sesión Supabase activa.");
      if (localMockMode()) {
        return [{ id: "00000000-0000-4000-8000-000000000201", optical_name: "Óptica de prueba", company_name: "Ópticas de prueba SA de CV", contact_name: "Contacto sintético", email: "cliente@localhost.invalid", city: "Ciudad de México", country: "México", status: "active" }];
      }
      if (!supabaseClient) throw new Error("La conexión Supabase todavía no está disponible.");
      const result = await supabaseClient
        .from("customers")
        .select("id,optical_name,company_name,contact_name,email,phone_e164,city,country,status,updated_at")
        .order("updated_at", { ascending: false })
        .limit(Math.max(1, Math.min(200, Number(limit) || 100)));
      if (result.error) throw result.error;
      return result.data || [];
    },
  };

  return service;
}

export function installRoraimaB2B(globalObject = window) {
  if (globalObject.RoraimaB2B?.version === 1) return globalObject.RoraimaB2B;
  const service = createRoraimaB2BService({ globalObject });
  globalObject.RoraimaB2B = service;
  globalObject.addEventListener?.("roraima-b2b:config-ready", (event) => {
    service.configure(event.detail || globalObject.RORAIMA_B2B_CONFIG || {}).catch(() => undefined);
  });
  return service;
}

export { LEGACY_ORDER_SOURCES };
