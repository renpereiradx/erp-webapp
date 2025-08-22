import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { supplierService } from '@/services/supplierService';
import { telemetry } from '@/utils/telemetry';
import { classifyError, withRetry as baseWithRetry } from './helpers/reliability';
import { createCircuitHelpers } from './helpers/circuit';
import { lruTrim, invalidatePages as sharedInvalidatePages } from './helpers/cache';
import { createOfflineSnapshotHelpers } from './helpers/offline';

/**
 * @typedef {Object} Supplier
 * @property {string|number} id
 * @property {string} [name]
 * @property {string} [email]
 * @property {string} [phone]
 * @property {boolean} [active]
 * @property {Record<string,any>} [meta]
 *
 * @typedef {Object} Pagination
 * @property {number} current_page
 * @property {number} per_page
 * @property {number} total
 * @property {number} total_pages
 *
 * @typedef {Object} CircuitState
 * @property {number} openUntil
 * @property {number} failures
 * @property {number} threshold
 * @property {number} cooldownMs
 *
 * @typedef {Object} CircuitHistoryEvent
 * @property {number} openedAt
 * @property {number} [closedAt]
 *
 * @typedef {Object} PageCacheEntry
 * @property {Supplier[]} suppliers
 * @property {Pagination} pagination
 * @property {number} ts timestamp ms
 *
 * @typedef {Object} CacheStats
 * @property {number} hits
 * @property {number} misses
 * @property {number} ratio 0..1
 *
 * @typedef {Object} CircuitStats
 * @property {number} failures
 * @property {boolean} open
 * @property {number} openUntil
 * @property {number} openCount
 * @property {number} avgOpenDurationMs
 *
 * @typedef {Object} SupplierStoreSelectors
 * @property {(s: SupplierStoreState)=>CacheStats} selectCacheStats
 * @property {(s: SupplierStoreState)=>CircuitStats} selectCircuitStats
 * @property {(s: SupplierStoreState)=>{ts: number|null, halfTTL:number}} selectCurrentCacheMeta
 * @property {(s: SupplierStoreState)=>number} selectCircuitOpenPctLastHr
 *
 * @typedef {Object} SupplierStoreState
 * @property {Supplier[]} suppliers
 * @property {boolean} loading
 * @property {string|null} error
 * @property {string|null} lastErrorCode
 * @property {string|null} lastErrorHintKey
 * @property {Pagination} pagination
 * @property {Record<string, PageCacheEntry>} pageCache
 * @property {number} pageCacheTTL
 * @property {number} cacheHits
 * @property {number} cacheMisses
 * @property {number} retryCount
 * @property {CircuitState} circuit
 * @property {boolean} circuitOpen
 * @property {any} circuitTimeoutId
 * @property {number} circuitOpenCount
 * @property {number} circuitTotalOpenDurationMs
 * @property {number|null} circuitLastOpenedAt
 * @property {CircuitHistoryEvent[]} circuitOpenHistory
 * @property {boolean} isOffline
 * @property {Supplier[]|null} lastOfflineSnapshot
 * @property {boolean} offlineBannerShown
 * @property {number|null} lastOfflineAt
 * @property {number|null} lastOnlineAt
 * @property {{page:number,pageSize:number,search:string}} lastQuery
 * @property {boolean} autoRefetchOnReconnect
 * @property {SupplierStoreSelectors} selectors
 * // Actions
 * @property {(value:boolean)=>void} setAutoRefetchOnReconnect
 * @property {(limit?:number)=>void} _trimPageCache
 * @property {(search:string,page:number,radius?:number,reason?:string)=>number[]} _invalidatePages
 * @property {()=>void} clearSuppliers
 * @property {()=>void} _recordFailure
 * @property {()=>void} _recordSuccess
 * @property {()=>boolean} _circuitOpen
 * @property {(reason?:string)=>void} _closeCircuit
 * @property {(snapshot:Supplier[])=>void} _persistOfflineSnapshot
 * @property {()=>Supplier[]|null} hydrateFromStorage
 * @property {(flag:boolean)=>void} setIsOffline
 * @property {(page:number,pageSize:number,search:string)=>Promise<void|{data:Supplier[],circuitOpen?:boolean}>} fetchSuppliers
 * @property {(page:number,pageSize:number,search:string)=>Promise<void|{data:Supplier[],circuitOpen?:boolean}>} loadPage
 * @property {(data:Partial<Supplier>)=>Promise<Supplier>} createSupplier
 * @property {(id:Supplier['id'],data:Partial<Supplier>)=>Promise<Supplier>} updateSupplier
 * @property {(id:Supplier['id'])=>Promise<boolean>} deleteSupplier
 */

// TTL configurable via env (fallback 60000)
const SUPPLIERS_CACHE_TTL = (() => {
  try {
    const raw = import.meta?.env?.VITE_SUPPLIERS_CACHE_TTL_MS;
    const n = parseInt(raw, 10);
    return Number.isFinite(n) && n > 0 ? n : 60000;
  } catch (_) { return 60000; }
})();

const circuit = createCircuitHelpers('suppliers', telemetry);
const offline = createOfflineSnapshotHelpers('suppliers_last_offline_snapshot','suppliers', telemetry);
const domainRetry = (fn, opts = {}) => baseWithRetry(fn, {
  ...opts,
  telemetryRecord: (event, data) => {
    if (event === 'feature.retry') {
      telemetry.record?.('feature.suppliers.retry', data);
      try { useSupplierStore.setState(s => ({ retryCount: (s.retryCount || 0) + 1 })); } catch {}
    } else {
      telemetry.record?.(event, data);
    }
  }
});

const useSupplierStore = create(
  devtools(
    (set, get) => ({
      suppliers: [],
      loading: false,
      error: null,
      lastErrorCode: null,
      lastErrorHintKey: null,
      pagination: {},
      // Cache simple por (search||'__') + page -> { suppliers, pagination, ts }
      pageCache: {},
      pageCacheTTL: SUPPLIERS_CACHE_TTL, // 60s default or env override
      // Métricas cache / retry
      cacheHits: 0,
      cacheMisses: 0,
      retryCount: 0,
      // Circuit breaker (similar a products)
      circuit: { openUntil: 0, failures: 0, threshold: 4, cooldownMs: 30000 },
      circuitOpen: false,
      circuitTimeoutId: null,
      // Métricas circuito
      circuitOpenCount: 0,
      circuitTotalOpenDurationMs: 0,
      circuitLastOpenedAt: null,
      circuitOpenHistory: [],
      // Offline state & snapshot
      isOffline: false,
      lastOfflineSnapshot: null,
      offlineBannerShown: false,
      lastOfflineAt: null,
      lastOnlineAt: null,
      lastQuery: { page: 1, pageSize: 10, search: '' },
      autoRefetchOnReconnect: true,
      setAutoRefetchOnReconnect: (value) => {
        set({ autoRefetchOnReconnect: value });
        try { telemetry.record?.('feature.suppliers.offline.auto_refetch.toggle', { enabled: value }); } catch (_) {}
      },

      // Implementación de recorte LRU simple para pageCache
      _trimPageCache: (limit = 30) => {
        const state = get();
        const { cache: trimmed, removed } = lruTrim(state.pageCache, limit);
        if (removed.length) {
          state.pageCache = trimmed; // mutate store directly then emit telemetry
          try { telemetry.record?.('feature.suppliers.cache.trim', { removed: removed.length, remaining: Object.keys(trimmed).length, limit }); } catch {}
        }
      },

      // Invalida páginas en cache alrededor de una página dada (radio configurable)
      _invalidatePages: (search = '', page = 1, radius = 1, reason = 'mutation') => {
        const state = get();
        const before = Object.keys(state.pageCache).length;
        const { removed } = sharedInvalidatePages(state.pageCache, { search, page, radius });
        const after = Object.keys(state.pageCache).length;
        if (removed.length) {
          try { telemetry.record?.('feature.suppliers.cache.invalidate', { reason, search: !!search, pages: removed, removed: removed.length, radius, remaining: after }); } catch {}
        }
        return removed;
      },

      clearSuppliers: () => set({ suppliers: [], pagination: {}, error: null }),

      // ================= CIRCUIT BREAKER HELPERS =================
      _recordFailure: () => circuit.recordFailure(get, set),
      _recordSuccess: () => circuit.recordSuccess(get, set),
      _circuitOpen: () => circuit.isOpen(get, set),
      _closeCircuit: (reason = 'manual') => circuit.close(get, set, reason),

      // ================= OFFLINE SNAPSHOT HELPERS =================
      _persistOfflineSnapshot: (snapshot) => { offline.persist(snapshot); },
      hydrateFromStorage: () => {
        const parsed = offline.hydrate();
        if (parsed) { set({ suppliers: parsed, lastOfflineSnapshot: parsed }); }
        return parsed;
      },
      setIsOffline: (flag) => {
        const becoming = !!flag;
        set((s) => {
          const was = s.isOffline;
          if (!was && becoming) {
            try { telemetry.record?.('feature.suppliers.offline.banner.show'); } catch (_) {}
            return { isOffline: true, offlineBannerShown: true, lastOfflineAt: Date.now() };
          }
          if (was && !becoming) {
            try { telemetry.record?.('feature.suppliers.offline.banner.hide'); } catch (_) {}
            return { isOffline: false, lastOnlineAt: Date.now() };
          }
          return { isOffline: becoming };
        });
      },

      // Forzar refetch ignorando cache
      forceRefetch: async (page = 1, pageSize = 10, search = '') => {
        const key = `${search || '__'}|${page}`;
        try { delete get().pageCache[key]; } catch (_) {}
        telemetry.record?.('feature.suppliers.force_refetch', { page, search: !!search });
        await get().fetchSuppliers(page, pageSize, search);
      },

      // Carga directa desde API (respeta retry). No chequea cache.
      fetchSuppliers: async (page = 1, pageSize = 10, search = '') => {
        const started = performance.now?.() || Date.now();
        set({ lastQuery: { page, pageSize, search } });
        // Circuit short-circuit
        if (get()._circuitOpen()) {
          telemetry.record?.('feature.suppliers.circuit.skip', { page, search: !!search });
          return { data: [], circuitOpen: true };
        }
  set({ loading: true, error: null, lastErrorCode: null, lastErrorHintKey: null });
        try {
          const result = await domainRetry(() => supplierService.getSuppliers({ page, limit: pageSize, search }), { op: 'fetch' });
          let normalized = result;
          if (!normalized) normalized = { success: false, data: null, error: 'Respuesta vacía del servicio' };
          if (normalized.success === false) {
            const code = classifyError(normalized.error);
            telemetry.record?.('feature.suppliers.error', { code, page, search: !!search, latencyMs: (performance.now?.() || Date.now()) - started });
            set({ error: normalized.error || 'Error al obtener proveedores', loading: false, lastErrorCode: code, lastErrorHintKey: `errors.hint.${code}` });
            if (code === 'NETWORK') {
              const snapshot = get().suppliers || [];
              if (snapshot.length) get()._persistOfflineSnapshot(snapshot);
              set({ isOffline: true, lastOfflineSnapshot: snapshot });
            }
            get()._recordFailure();
            return;
          }
          const raw = normalized.data;
          const hasPagination = raw && typeof raw === 'object' && Array.isArray(raw.data) && raw.pagination;
          const list = hasPagination ? (Array.isArray(raw.data) ? raw.data : []) : (Array.isArray(raw) ? raw : []);
          const safeList = list.filter(Boolean);
          const paginationObj = hasPagination ? raw.pagination : { current_page: page, per_page: safeList.length, total: safeList.length, total_pages: 1 };
          set({ suppliers: safeList, pagination: paginationObj, loading: false });
          // cachear
          const key = `${search || '__'}|${page}`;
          get().pageCache[key] = { suppliers: safeList, pagination: paginationObj, ts: Date.now() };
          // recortar cache si excede límite
          try { get()._trimPageCache?.(); } catch (_) {}
          // prefetch siguiente página si procede
          if (paginationObj.total_pages > page) {
            const nextKey = `${search || '__'}|${page + 1}`;
            if (!get().pageCache[nextKey]) {
              // lanzar prefetch sin bloquear
              (async () => {
                try {
                  const r2 = await domainRetry(
                    () => supplierService.getSuppliers({ page: page + 1, limit: pageSize, search }),
                    { op: 'fetch-prefetch', retries: 0 } // retries=0: fallo rápido en prefetch (no crítico) => telemetría inmediata y menor flakiness tests
                  );
                  if (r2 && r2.success !== false) {
                    const raw2 = r2.data;
                    const hasPag2 = raw2 && typeof raw2 === 'object' && Array.isArray(raw2.data) && raw2.pagination;
                    const list2 = hasPag2 ? (Array.isArray(raw2.data) ? raw2.data : []) : (Array.isArray(raw2) ? raw2 : []);
                    const safe2 = list2.filter(Boolean);
                    const pag2 = hasPag2 ? raw2.pagination : { current_page: page + 1, per_page: safe2.length, total: safe2.length, total_pages: (paginationObj.total_pages || page + 1) };
                    get().pageCache[nextKey] = { suppliers: safe2, pagination: pag2, ts: Date.now() };
                    try { get()._trimPageCache?.(); } catch (_) {}
                    telemetry.record?.('feature.suppliers.prefetch.success', { page: page + 1, count: safe2.length });
                  } else {
                    telemetry.record?.('feature.suppliers.prefetch.skip', { reason: 'failed', page: page + 1 });
                  }
                } catch (e) {
                  telemetry.record?.('feature.suppliers.prefetch.error', { page: page + 1, message: e.message });
                }
              })();
            } else {
              telemetry.record?.('feature.suppliers.prefetch.skip', { reason: 'cached', page: page + 1 });
            }
          }
          telemetry.record?.('feature.suppliers.load', { page, count: safeList.length, search: !!search, latencyMs: (performance.now?.() || Date.now()) - started });
          get()._recordSuccess();
        } catch (err) {
          const code = classifyError(err.message);
            telemetry.record?.('feature.suppliers.error', { code, page, search: !!search, latencyMs: (performance.now?.() || Date.now()) - started });
          set({ error: err.message || 'Error inesperado al obtener proveedores', loading: false, lastErrorCode: code, lastErrorHintKey: `errors.hint.${code}` });
          if (code === 'NETWORK') {
            const snapshot = get().suppliers || [];
            if (snapshot.length) get()._persistOfflineSnapshot(snapshot);
            set({ isOffline: true, lastOfflineSnapshot: snapshot });
          }
          if (err?.name !== 'AbortError') get()._recordFailure();
        }
      },

      // Intenta usar cache; si stale o no existe, recurre a fetchSuppliers.
      loadPage: async (page = 1, pageSize = 10, search = '') => {
        set({ lastQuery: { page, pageSize, search } });
        const key = `${search || '__'}|${page}`;
        const cached = get().pageCache[key];
        const ttl = get().pageCacheTTL;
        if (get()._circuitOpen()) {
          telemetry.record?.('feature.suppliers.circuit.skip', { page, search: !!search, context: 'loadPage' });
          return { data: [], circuitOpen: true };
        }
        if (cached && Date.now() - cached.ts < ttl) {
          set({ suppliers: cached.suppliers, pagination: cached.pagination, loading: false, error: null });
          telemetry.record?.('feature.suppliers.cache.hit', { page, search: !!search });
          set(s => ({ cacheHits: s.cacheHits + 1 }));
          // si se acerca expiración, revalidar en background
          if (Date.now() - cached.ts > ttl / 2) {
            try { telemetry.record?.('feature.suppliers.cache.stale.detected', { page, search: !!search, ageMs: Date.now() - cached.ts }); } catch (_) {}
            (async () => {
              try {
                await get().fetchSuppliers(page, pageSize, search);
                telemetry.record?.('feature.suppliers.cache.revalidate.success', { page });
              } catch (e) {
                telemetry.record?.('feature.suppliers.cache.revalidate.error', { page, message: e.message });
              }
            })();
          }
          return;
        }
        telemetry.record?.('feature.suppliers.cache.miss', { page, search: !!search });
        set(s => ({ cacheMisses: s.cacheMisses + 1 }));
        await get().fetchSuppliers(page, pageSize, search);
      },

      createSupplier: async (supplierData) => {
        set({ loading: true, lastErrorCode: null, lastErrorHintKey: null });
        const started = performance.now?.() || Date.now();
        try {
          const result = await domainRetry(() => supplierService.createSupplier(supplierData), { op: 'create' });
          if (result && result.success === false) throw new Error(result.error || 'Error al crear el proveedor');
          const newSupplier = (result?.data && result.data.data) ? result.data.data : (result?.data ?? result);
          set((state) => ({ suppliers: [...state.suppliers, newSupplier], loading: false }));
          telemetry.record?.('feature.suppliers.create', { latencyMs: (performance.now?.() || Date.now()) - started });
          // Invalida página actual y adyacentes para rehidratar datos consistentes
          try {
            const { page, pageSize, search } = get().lastQuery || { page: 1, pageSize: 10, search: '' };
            get()._invalidatePages(search, page, 1, 'create');
            // Refetch en background la página actual (no await para no bloquear UX)
            (async () => { try { await get().fetchSuppliers(page, pageSize, search); } catch (_) {} })();
          } catch (_) {}
          return newSupplier;
        } catch (error) {
          telemetry.record?.('feature.suppliers.error', { code: classifyError(error.message), op: 'create', latencyMs: (performance.now?.() || Date.now()) - started });
          set({ loading: false, error: error.message || 'Error al crear el proveedor', lastErrorCode: classifyError(error.message), lastErrorHintKey: `errors.hint.${classifyError(error.message)}` });
          throw error;
        }
      },

      updateSupplier: async (id, supplierData) => {
        set({ loading: true, lastErrorCode: null, lastErrorHintKey: null });
        const started = performance.now?.() || Date.now();
        try {
          const result = await domainRetry(() => supplierService.updateSupplier(id, supplierData), { op: 'update' });
          if (result && result.success === false) throw new Error(result.error || 'Error al actualizar el proveedor');
          const updatedSupplier = (result?.data && result.data.data) ? result.data.data : (result?.data ?? result);
          set((state) => ({ suppliers: state.suppliers.map((s) => (s.id === id ? updatedSupplier : s)), loading: false }));
          telemetry.record?.('feature.suppliers.update-success', { latencyMs: (performance.now?.() || Date.now()) - started });
          return updatedSupplier;
        } catch (error) {
          telemetry.record?.('feature.suppliers.error', { code: classifyError(error.message), op: 'update', latencyMs: (performance.now?.() || Date.now()) - started });
          set({ loading: false, error: error.message || 'Error al actualizar el proveedor', lastErrorCode: classifyError(error.message), lastErrorHintKey: `errors.hint.${classifyError(error.message)}` });
          throw error;
        }
      },

      deleteSupplier: async (id) => {
        set({ loading: true, lastErrorCode: null, lastErrorHintKey: null });
        const started = performance.now?.() || Date.now();
        try {
          const result = await domainRetry(() => supplierService.deleteSupplier(id), { op: 'delete' });
          if (result && result.success === false) throw new Error(result.error || 'Error al eliminar el proveedor');
          set((state) => ({ suppliers: state.suppliers.filter((s) => s.id !== id), loading: false }));
          telemetry.record?.('feature.suppliers.delete-success', { latencyMs: (performance.now?.() || Date.now()) - started });
          // Invalida página actual y adyacentes y revalida
          try {
            const { page, pageSize, search } = get().lastQuery || { page: 1, pageSize: 10, search: '' };
            get()._invalidatePages(search, page, 1, 'delete');
            (async () => { try { await get().fetchSuppliers(page, pageSize, search); } catch (_) {} })();
          } catch (_) {}
          return true;
        } catch (error) {
          telemetry.record?.('feature.suppliers.error', { code: classifyError(error.message), op: 'delete', latencyMs: (performance.now?.() || Date.now()) - started });
          set({ loading: false, error: error.message || 'Error al eliminar el proveedor', lastErrorCode: classifyError(error.message), lastErrorHintKey: `errors.hint.${classifyError(error.message)}` });
          throw error;
        }
      },

      // ================= SELECTORES =================
      selectors: {
        selectCacheStats: (state) => {
          const hits = state.cacheHits;
          const misses = state.cacheMisses;
          const ratio = hits + misses === 0 ? 0 : hits / (hits + misses);
          return { hits, misses, ratio };
        },
        selectCircuitStats: (state) => ({
          failures: state.circuit.failures,
          open: state.circuitOpen,
          openUntil: state.circuit.openUntil,
          openCount: state.circuitOpenCount,
          avgOpenDurationMs: state.circuitOpenCount === 0 ? 0 : Math.round(state.circuitTotalOpenDurationMs / state.circuitOpenCount)
        }),
        selectCurrentCacheMeta: (state) => {
          // Evitar usar Date.now() directo para snapshots inestables
          const { page, search } = state.lastQuery || { page: 1, search: '' };
          const key = `${search || '__'}|${page}`;
          const entry = state.pageCache[key];
          if (!entry) return { ts: null, halfTTL: state.pageCacheTTL / 2 };
          return { ts: entry.ts, halfTTL: state.pageCacheTTL / 2 };
        },
        selectCircuitOpenPctLastHr: (state) => {
          const now = Date.now();
          const windowStart = now - 3600000;
          const history = state.circuitOpenHistory || [];
          let openMs = 0;
          for (const ev of history) {
            const start = Math.max(ev.openedAt, windowStart);
            const end = Math.min(ev.closedAt || now, now);
            if (end > start) openMs += (end - start);
          }
          return openMs / 3600000; // 0..1
        }
      }
    }),
    { name: 'supplier-store' }
  )
);

export default useSupplierStore;

// Global offline listeners (solo en navegador)
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    try { useSupplierStore.getState().setIsOffline(false); telemetry.record?.('app.online'); } catch {}
  });
  window.addEventListener('offline', () => {
    try { useSupplierStore.getState().setIsOffline(true); telemetry.record?.('app.offline'); } catch {}
  });
  try { window.useSupplierStore = useSupplierStore; } catch {}
}
