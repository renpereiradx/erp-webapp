/**
 * Store de Zustand para la gestión de productos en el ERP
 * Requiere autenticación para acceder a los datos
 */

/**
 * @typedef {Object} Product
 * @property {string|number} id
 * @property {string} [name]
 * @property {string} [description]
 * @property {boolean} [is_active]
 * @property {number} [price]
 * @property {Record<string,any>} [meta]
 *
 * @typedef {Object} PageCacheEntry
 * @property {number} ts Timestamp en ms
 * @property {Product[]} products
 *
 * @typedef {Object} SearchCacheEntry
 * @property {number} ts
 * @property {Product[]} data
 *
 * @typedef {Object} CircuitState
 * @property {number} openUntil
 * @property {number} failures
 * @property {number} threshold
 * @property {number} cooldownMs
 *
 * @typedef {Object} CacheStats
 * @property {number} hits
 * @property {number} misses
 * @property {number} ratio
 *
 * @typedef {Object} ProductStoreSelectors
 * @property {(s:ProductStoreState)=>Product[]} selectProducts
 * @property {(s:ProductStoreState)=>Record<string,Product>} selectProductsById
 * @property {(s:ProductStoreState)=>string[]} selectSelectedIds
 * @property {(s:ProductStoreState)=>{totalProducts:number,currentPage:number,totalPages:number,pageSize:number}} selectBasicMeta
 * @property {(s:ProductStoreState)=>Product[]} selectCategories
 * @property {(s:ProductStoreState)=>{loading:boolean,error:string|null}} selectLoadingError
 * @property {(s:ProductStoreState)=>string} selectLastSearchTerm
 * @property {(s:ProductStoreState)=>CacheStats} selectCacheStats
 *
 * @typedef {Object} ProductStoreState
 * @property {Product[]} products
 * @property {Record<string,Product>} productsById
 * @property {Record<number,PageCacheEntry>} pageCache
 * @property {Record<string,SearchCacheEntry>} searchCache
 * @property {number} pageCacheTTL
 * @property {number} cacheTTL
 * @property {number} cacheHits
 * @property {number} cacheMisses
 * @property {string[]} selectedIds
 * @property {Product|null} selectedProduct
 * @property {boolean} loading
 * @property {string|null} error
 * @property {AbortController|null} fetchAbortController
 * @property {Record<string,number>} errorCounters
 * @property {string|null} lastErrorCode
 * @property {string|null} lastErrorHintKey
 * @property {boolean} isOffline
 * @property {CircuitState} circuit
 * @property {boolean} circuitOpen
 * @property {any} circuitTimeoutId
 * @property {{overrideTTL:number|null,fastRetries:boolean,overrideRetryConfig?:{attempts?:number,baseDelay?:number}}} _testing
 * @property {number} currentPage
 * @property {number} pageSize
 * @property {number} totalProducts
 * @property {number} totalPages
 * @property {string} lastSearchTerm
 * @property {{search:string,category:string,status:string,sortBy:string,sortOrder:string}} filters
 * @property {ProductStoreSelectors} selectors
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { productService } from '@/services/productService';
import { categoryCacheService } from '@/services/categoryCacheService';
import { apiClient } from '@/services/api';
import { toApiError } from '@/utils/ApiError';
import { telemetry } from '@/utils/telemetry';
import { isConnectionError, getConnectionErrorMessage } from '@/utils/connectionUtils';
import { classifyError, withRetry as sharedWithRetry } from './helpers/reliability';
import { createCircuitHelpers } from './helpers/circuit';
import { lruTrim } from './helpers/cache';
import { createOfflineSnapshotHelpers } from './helpers/offline';

// Circuit breaker helpers
const circuit = createCircuitHelpers('products', telemetry);
const offline = createOfflineSnapshotHelpers('products_last_offline_snapshot','products', telemetry);

const useProductStore = create(
  devtools(
    (set, get) => ({
      // =================== ESTADO ===================
      products: [],
      productsById: {}, // Normalización por id
      pageCache: {}, // { pageNumber: { ts, products } }
      pageCacheTTL: 120000,
      searchCache: {}, // { cacheKey: { ts, data } }
      cacheTTL: 120000,
      cacheHits: 0,
      cacheMisses: 0,
      selectedIds: [], // Selección múltiple para acciones bulk
      selectedProduct: null,
      loading: false,
      error: null,
      fetchAbortController: null,
      errorCounters: {},
      lastErrorCode: null,
      lastErrorHintKey: null,
      isOffline: false,
      // Circuit breaker state
      circuit: { openUntil: 0, failures: 0, threshold: 4, cooldownMs: 30000 },
      circuitOpen: false,
      circuitTimeoutId: null,
      // para pruebas podemos ajustar TTL
      _testing: { overrideTTL: null, fastRetries: false, overrideRetryConfig: null },

      // Categories (inicialmente vacías, se cargan desde API)
      categories: [],
      
      // Pagination
      currentPage: 1,
      pageSize: 10,
      totalProducts: 0,
      totalPages: 0,
      
      // Search
      lastSearchTerm: '',
      
      // Filtros locales (para productos ya cargados)
      filters: {
        search: '',
        category: '',
        status: '',
        sortBy: 'name',
        sortOrder: 'asc'
      },

      // =================== ACTIONS ===================

      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null, lastErrorCode: null, lastErrorHintKey: null }),
      setIsOffline: (flag) => set({ isOffline: !!flag }),
      _recordFailure: () => circuit.recordFailure(get, set),
      _recordSuccess: () => circuit.recordSuccess(get, set),
      _circuitOpen: () => circuit.isOpen(get, set),
      // Helper para cerrar circuito (DRY)
      _closeCircuit: (reason = 'manual') => circuit.close(get, set, reason),

      // Helper para ejecutar una función con reintentos (backoff + jitter)
      _withRetry: async (fn, opts = {}) => {
        const attempts = opts.attempts ?? 3;
        const baseDelay = opts.baseDelay ?? 300;
        const testing = get()._testing || {};
        const overrideCfg = testing.overrideRetryConfig || {};
        const fast = testing.fastRetries;
        const effAttempts = overrideCfg.attempts ?? (fast ? 1 : attempts);
        const effBaseDelay = overrideCfg.baseDelay ?? (fast ? 0 : baseDelay);
        const retries = Math.max(0, effAttempts - 1);
        try {
          const res = await sharedWithRetry(() => fn(), {
            retries,
            baseDelay: effBaseDelay,
            op: opts.telemetryKey || 'products.op',
            telemetryRecord: (event, data) => {
              if (event === 'feature.retry') {
                telemetry.record?.('products.retry', { attempt: data.attempt, max: data.max, op: data.op });
              } else {
                telemetry.record?.(event, data);
              }
            },
            onRetry: (a, err) => {
              try { telemetry.record?.('products.retry.attempt', { attempt: a, op: opts.telemetryKey }); } catch {}
            }
          });
          try { circuit.recordSuccess(get, set); } catch {}
          return res;
        } catch (err) {
          try { circuit.recordFailure(get, set); } catch {}
          throw err;
        }
      },
      
      setFilters: (newFilters) => 
        set((state) => ({
          filters: { ...state.filters, ...newFilters },
          currentPage: 1
        })),

      setCurrentPage: (page) => set({ currentPage: page }),

      setPageSize: (pageSize) => set((state) => ({
        pageSize,
        currentPage: 1, // Reset to first page when changing page size
        totalPages: Math.ceil(state.totalProducts / pageSize)
      })),

      // =================== API CALLS ===================

      fetchCategories: async () => {
        const currentState = get();
        // Evitar llamadas múltiples simultáneas
        if (currentState.loading) return currentState.categories;
        
        set({ loading: true, error: null });
        try {
          const response = await productService.getAllCategories();
          
          let categories = [];
          
          // Manejar diferentes formatos de respuesta
          if (Array.isArray(response)) {
            categories = response;
          } else if (response && typeof response === 'object' && Array.isArray(response.data)) {
            categories = response.data;
          } else if (response && typeof response === 'object' && Array.isArray(response.categories)) {
            categories = response.categories;
          } else {
            console.warn('Formato de respuesta de categorías no reconocido:', response);
          }
          
          set({ categories, loading: false });
          // Registrar evento en telemetry en lugar de logs de depuración
          try { telemetry.record('categories.fetch.success', { count: categories.length }); } catch (e) { /* noop */ }
          return categories;
        } catch (error) {
          console.error('Error detallado en fetchCategories:', error);
          
           // En caso de error del servidor, usar categorías por defecto
           const fallbackCategories = [
             { id: 1, name: 'Alimentos', description: 'Productos alimenticios' },
             { id: 2, name: 'Bebidas', description: 'Bebidas variadas' },
             { id: 3, name: 'Limpieza', description: 'Productos de limpieza' },
             { id: 4, name: 'Cuidado Personal', description: 'Productos de higiene' },
             { id: 5, name: 'Hogar', description: 'Artículos para el hogar' }
           ];
          
          // Detectar errores de conexión y otros tipos de error
          if (error.message.includes('500') || isConnectionError(error)) {
            const errorMsg = isConnectionError(error) 
              ? getConnectionErrorMessage(error)
              : 'Error del servidor. Usando categorías por defecto.';
            
            console.warn(errorMsg);
            set({ 
              categories: fallbackCategories, 
              loading: false, 
              error: errorMsg
            });
            return fallbackCategories;
          }
          
          set({ 
            categories: fallbackCategories, 
            loading: false, 
            error: 'Error al cargar categorías. Usando categorías por defecto: ' + (error.message || 'Error desconocido') 
          });
          return fallbackCategories;
        }
      },

      // =================== GESTIÓN DE CACHÉ DE CATEGORÍAS ===================

      refreshCategoriesFromAPI: async () => {
        set({ loading: true, error: null });
        
        try {
          const categories = await categoryCacheService.forceRefreshFromAPI(apiClient);
          
          set({ categories: categories, loading: false, error: null });
          return categories;
        } catch (error) {
          const currentState = get();
          if (currentState.categories.length > 0) {
            set({ loading: false, error: 'No se pudo actualizar, usando caché local' });
            return currentState.categories;
          }
          
          const fallbackCategories = categoryCacheService.getFallbackCategories();
          set({ 
            categories: fallbackCategories, 
            loading: false, 
            error: 'Usando categorías offline - ' + error.message 
          });
          return fallbackCategories;
        }
      },

      clearCategoriesCache: () => {
        categoryCacheService.clearCache();
      },

      /**
       * Obtiene información del estado del caché
       */
      getCacheInfo: () => {
        return categoryCacheService.getCacheInfo();
      },

      fetchProducts: async (page = null, pageSize = null, searchTerm = '', options = {}) => {
        const correlationId = `fetch_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
        try { if (process && process.env && process.env.DEBUG_FETCH) console.debug('[store] fetchProducts called', { page, pageSize, searchTerm }); } catch (e) {}
        const state = get();
        const currentPage = page || state.currentPage;
        const currentPageSize = pageSize || state.pageSize;
        // Abort previous
        try {
          if (get().fetchAbortController) {
            get().fetchAbortController.abort();
          }
          if (!options.signal && typeof AbortController !== 'undefined') {
            const ac = new AbortController();
            set({ fetchAbortController: ac });
            options.signal = ac.signal;
          }
        } catch {}

        set({ loading: true, error: null });
        const t = telemetry.startTimer('products.fetch');
        try {
          // Short-circuit if circuit open
          if (get()._circuitOpen()) {
            const stateNow = get();
            const openUntil = stateNow.circuit?.openUntil || 0;
            if (openUntil && Date.now() >= openUntil) {
              // cooldown passed: close circuit and continue
              try { if (stateNow.circuitTimeoutId) clearTimeout(stateNow.circuitTimeoutId); } catch (e) {}
              get()._closeCircuit('cooldown-fetchProducts');
            } else {
              return { data: [], total: 0, circuitOpen: true };
            }
          }
          let response;
          let products = [];
          let totalCount = 0;
          
          if (searchTerm && searchTerm.trim()) {
            response = await productService.searchProducts(searchTerm.trim());
            products = Array.isArray(response) ? response : [response];
            totalCount = products.length;
            if (totalCount === 0) {
              set({
                products: [],
                productsById: {},
                totalProducts: 0,
                totalPages: 0,
                currentPage: 1,
                pageSize: currentPageSize,
                loading: false,
                lastSearchTerm: searchTerm.trim(),
                error: null
              });
              telemetry.endTimer(t, { total: 0, empty: true });
              return { data: [], total: 0, message: `No se encontraron productos para "${searchTerm.trim()}"` };
            }
            const startIndex = (currentPage - 1) * currentPageSize;
            const endIndex = startIndex + currentPageSize;
            const paginatedProducts = products.slice(startIndex, endIndex);
            const byId = Object.fromEntries(products.map(p => [p.id, p]));
            set({
              products: paginatedProducts,
              productsById: byId,
              totalProducts: totalCount,
              totalPages: Math.ceil(totalCount / currentPageSize),
              currentPage: currentPage,
              pageSize: currentPageSize,
              loading: false,
              lastSearchTerm: searchTerm.trim(),
              error: null
            });
            telemetry.endTimer(t, { total: totalCount, search: true });
            return { data: paginatedProducts, total: totalCount };
          } else {
            const response = await get()._withRetry(() => productService.getProducts(currentPage, currentPageSize), { telemetryKey: 'products.fetch', attempts: 3 });
            products = Array.isArray(response) ? response : [response];
            totalCount = products.length;
            const byId = Object.fromEntries(products.map(p => [p.id, p]));
            set({
              products: products,
              productsById: byId,
              totalProducts: totalCount,
              totalPages: Math.ceil(totalCount / currentPageSize),
              currentPage: currentPage,
              pageSize: currentPageSize,
              loading: false,
              lastSearchTerm: searchTerm
            });
            // cache page
            set((s) => ({ pageCache: { ...s.pageCache, [currentPage]: { ts: Date.now(), products } } }));
            // Trim pageCache (LRU-ish by timestamp) si excede 20 páginas
            set((s) => {
              const { cache: trimmed, removed } = lruTrim(s.pageCache, 20);
              if (!removed.length) return {};
              telemetry.record('products.pageCache.trim', { removed: removed.length, remaining: Object.keys(trimmed).length, limit: 20 });
              return { pageCache: trimmed };
            });
            telemetry.endTimer(t, { total: totalCount });
            return { data: products, total: totalCount };
          }
        } catch (apiError) {
          get()._recordFailure();
          const norm = toApiError(apiError, 'Error al cargar productos', correlationId);
          let errorMessage = `Error al cargar productos: ${norm.message}`;
          let code = norm.code || null;
          if (isConnectionError(apiError)) {
            errorMessage = getConnectionErrorMessage(apiError);
            code = 'NETWORK';
          }
          const hintKey = code ? get()._mapErrorCodeToHintKey(code) : null;
          set({
            products: [],
            productsById: {},
            totalProducts: 0,
            totalPages: 0,
            loading: false,
            error: errorMessage,
            lastErrorCode: code,
            lastErrorHintKey: hintKey
          });
          // Ensure global telemetry records store-level errors so UI and tests can react
          try { telemetry.record('products.error.store', { message: errorMessage, code }); } catch (e) {}
          // Offline snapshot si había datos previos
          const prev = get().products;
          if (prev.length) set({ lastOfflineSnapshot: prev });
          if (prev.length) offline.persist(prev);
          throw norm;
        } finally {
          set({ fetchAbortController: null });
        }
      },

      // Nueva función para búsqueda específica (con caché y cancelación)
  searchProducts: async (searchTerm, options = {}) => {
    const correlationId = `search_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
    const termRaw = (searchTerm || '').trim();
    if (!termRaw) {
      return { data: [], total: 0 };
    }
    // Short-circuit if circuit is open (same behavior as fetchProducts)
    if (get()._circuitOpen()) {
      const stateNow = get();
      const openUntil = stateNow.circuit?.openUntil || 0;
      if (openUntil && Date.now() >= openUntil) {
        try { if (stateNow.circuitTimeoutId) clearTimeout(stateNow.circuitTimeoutId); } catch (e) {}
  get()._closeCircuit('cooldown-search');
      } else {
        return { data: [], total: 0, circuitOpen: true };
      }
    }
    try {
      const term = termRaw;
      const state = get();
      const { searchCache, cacheTTL } = state;
      const now = Date.now();
      const pageSize = state.pageSize || 10;
      const cacheKey = JSON.stringify({ term, pageSize, category: state.filters?.category || 'all', status: state.filters?.status || 'all' });
      const cached = searchCache[cacheKey];
      const isValidCache = cached && now - cached.ts < cacheTTL;

      if (isValidCache && !options.force) {
        set((s)=>({ cacheHits: s.cacheHits + 1 }));
        telemetry.record('products.search.cache.hit', { term, age: now - cached.ts });
        const totalCount = cached.data.length;
        const paginated = cached.data.slice(0, pageSize);
        const byId = Object.fromEntries(cached.data.map(p => [p.id, p]));
        set({
          products: paginated,
          productsById: byId,
          totalProducts: totalCount,
          totalPages: Math.ceil(totalCount / pageSize),
          currentPage: 1,
          pageSize,
          loading: false,
          lastSearchTerm: term,
          error: null
        });
        // Auto revalidación si la entrada está envejecida
        if ((now - cached.ts) > cacheTTL * 0.5 && !options.revalidate) {
          (async () => {
            try {
              const fresh = await get()._withRetry(() => productService.searchProducts(term), { attempts: 2, telemetryKey: 'products.search.revalidate' });
              const freshArr = Array.isArray(fresh) ? fresh : [fresh];
              set((s) => ({ searchCache: { ...s.searchCache, [cacheKey]: { ts: Date.now(), data: freshArr } } }));
              telemetry.record('products.search.revalidate.auto.success', { term, total: freshArr.length });
              // Si cambió el tamaño, actualizar vista
              if (freshArr.length !== totalCount) {
                const pag = freshArr.slice(0, pageSize);
                const freshById = Object.fromEntries(freshArr.map(p => [p.id, p]));
                set({ products: pag, productsById: freshById, totalProducts: freshArr.length, totalPages: Math.ceil(freshArr.length / pageSize) });
              }
            } catch {
              telemetry.record('products.search.revalidate.auto.error', { term });
            }
          })();
        }
        return { data: paginated, total: totalCount };
      }

      if (options.signal) {
        set((s)=>({ cacheMisses: s.cacheMisses + 1 }));
        telemetry.record('products.search.cache.miss', { term });
        const response = await productService.searchProducts(term, { signal: options.signal });
        const products = Array.isArray(response) ? response : [response];
        const totalCount = products.length;
        const paginated = products.slice(0, pageSize);
        const byId = Object.fromEntries(products.map(p => [p.id, p]));
        set((s) => ({ searchCache: { ...s.searchCache, [cacheKey]: { ts: Date.now(), data: products } } }));
        // Trim searchCache si excede 30 entradas
        set((s) => {
          const keys = Object.keys(s.searchCache);
          if (keys.length <= 30) return {};
          const sorted = keys.map(k => ({ k, ts: s.searchCache[k].ts })).sort((a,b) => a.ts - b.ts);
          const toRemove = sorted.slice(0, keys.length - 30);
          if (!toRemove.length) return {};
          const clone = { ...s.searchCache };
          toRemove.forEach(r => { delete clone[r.k]; });
          return { searchCache: clone };
        });
        telemetry.record('products.searchCache.trim');
        set({
          products: paginated,
          productsById: byId,
          totalProducts: totalCount,
          totalPages: Math.ceil(totalCount / pageSize),
          currentPage: 1,
          pageSize,
          loading: false,
          lastSearchTerm: term,
          error: null
        });
        return { data: paginated, total: totalCount };
      }

      const t = telemetry.startTimer('products.search');
      set((s)=>({ cacheMisses: s.cacheMisses + 1 }));
      telemetry.record('products.search.cache.miss', { term });
      const response = await get()._withRetry(() => productService.searchProducts(term), { telemetryKey: 'products.search' });
      const products = Array.isArray(response) ? response : [response];
      const totalCount = products.length;
      const paginated = products.slice(0, pageSize);
      const byId = Object.fromEntries(products.map(p => [p.id, p]));
      set((s) => ({ searchCache: { ...s.searchCache, [cacheKey]: { ts: Date.now(), data: products } } }));
      // Trim searchCache si excede 30 entradas
      set((s) => {
        const keys = Object.keys(s.searchCache);
        if (keys.length <= 30) return {};
        const sorted = keys.map(k => ({ k, ts: s.searchCache[k].ts })).sort((a,b) => a.ts - b.ts);
        const toRemove = sorted.slice(0, keys.length - 30);
        if (!toRemove.length) return {};
        const clone = { ...s.searchCache };
        toRemove.forEach(r => { delete clone[r.k]; });
        return { searchCache: clone };
      });
      telemetry.record('products.searchCache.trim');
      set({
        products: paginated,
        productsById: byId,
        totalProducts: totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
        currentPage: 1,
        pageSize,
        loading: false,
        lastSearchTerm: term,
        error: null
      });
      const ms = telemetry.endTimer(t, { total: totalCount });
      telemetry.record('products.search.success', { ms, total: totalCount });
      get()._recordSuccess();
      return { data: paginated, total: totalCount };
    } catch (error) {
      // count failure for circuit behavior only if not abort
      if (!(error?.name === 'AbortError')) {
        try { get()._recordFailure(); } catch (e) {}
      }
       if (error?.name === 'AbortError') {
         telemetry.record('products.search.abort');
         return { data: [], total: 0, aborted: true };
       }
       const norm = toApiError(error, 'Error al buscar productos', correlationId);
       const code = norm.code || (isConnectionError(error) ? 'NETWORK' : null);
       const hintKey = code ? get()._mapErrorCodeToHintKey(code) : null;
       // Increment counter
       set((s) => ({ errorCounters: { ...s.errorCounters, [norm.code]: (s.errorCounters[norm.code] || 0) + 1 } }));
       let errorMessage = norm.message || 'Error al buscar productos';
       if (isConnectionError(error)) {
         errorMessage = getConnectionErrorMessage(error);
       }
       set({
         products: [],
         productsById: {},
         totalProducts: 0,
         totalPages: 0,
         currentPage: 1,
         loading: false,
         error: errorMessage,
         lastErrorCode: code,
         lastErrorHintKey: hintKey,
       });
      // Also record store-level error telemetry for UI/tests
      try { telemetry.record('products.error.store', { message: errorMessage, code }); } catch (e) {}
       telemetry.record('products.search.error', { code: norm.code, message: norm.message, correlationId });
       // Detectar errores de conexión
       try { if (isConnectionError(error)) set({ isOffline: true }); } catch {}
       return { error: errorMessage, data: [], total: 0 };
    }
  },

      // Función para cargar página específica
      loadPage: async (page) => {
        const state = get();
        const ttl = get()._testing.overrideTTL ?? state.pageCacheTTL;
        if (!state.lastSearchTerm && state.pageCache[page] && Date.now() - state.pageCache[page].ts < ttl) {
          const pc = state.pageCache[page];
          set({
            products: pc.products,
            productsById: Object.fromEntries(pc.products.map(p => [p.id, p])),
            currentPage: page
          });
          telemetry.record('products.pageCache.direct.hit', { page });
          return { data: pc.products, total: state.totalProducts };
        }
        return await get().fetchProducts(page, state.pageSize, state.lastSearchTerm || '');
      },

      // Función para prefetch de la siguiente página
      prefetchNextPage: async () => {
        const state = get();
        if (state.lastSearchTerm) return; // solo prefetch sin búsqueda
        const next = state.currentPage + 1;
        if (next > state.totalPages) return;
        if (state.pageCache[next] && Date.now() - state.pageCache[next].ts < state.pageCacheTTL) return;
  if (state.loading) return; // evitar competir con fetch principal
  if (get()._circuitOpen()) return; // no prefetch si circuito abierto
        try {
          const res = await productService.getProducts(next, state.pageSize);
          const arr = Array.isArray(res) ? res : [res];
          set((s) => ({ pageCache: { ...s.pageCache, [next]: { ts: Date.now(), products: arr } } }));
          telemetry.record('products.prefetch.success', { page: next });
        } catch (e) {
          telemetry.record('products.prefetch.error', { page: next });
        }
      },

      // Limpiar productos (para estado inicial)
      clearProducts: () => {
        set({ 
          products: [], 
          productsById: {},
          selectedIds: [],
          totalProducts: 0, 
          totalPages: 0,
          currentPage: 1,
          lastSearchTerm: '',
          loading: false,
          error: null,
          lastErrorCode: null,
          lastErrorHintKey: null,
        });
      },

      fetchProductById: async (productId) => {
        set({ loading: true, error: null });

        try {
          const response = await productService.getProductById(productId);
          const product = response.data || response;

          set({
            selectedProduct: product,
            loading: false
          });

          return product;
        } catch (error) {
          set({
            error: error.message || 'Error al cargar producto',
            loading: false
          });
          throw error;
        }
      },

      createProduct: async (productData) => {
        set({ loading: true, error: null });
        const t = telemetry.startTimer('products.create');
        try {
          productService.validateProductData(productData);
          const response = await productService.createProduct(productData);
          const newProduct = response.data || response;
          set((state) => {
            const productsById = { ...state.productsById, [newProduct.id]: newProduct };
            return {
              products: [newProduct, ...state.products],
              productsById,
              totalProducts: state.totalProducts + 1,
              loading: false
            };
          });
          telemetry.endTimer(t, { ok: true });
          telemetry.record('products.create.success');
          try {
            const st = get();
            st._invalidatePages(st.currentPage, 1, 'create');
            // background refetch de la página actual (no await)
            (async () => { try { await st.fetchProducts(st.currentPage, st.pageSize, st.lastSearchTerm || ''); } catch {} })();
          } catch {}
          return newProduct;
        } catch (error) {
          telemetry.record('products.create.error', { message: error?.message });
          set({ error: error.message || 'Error al crear producto', loading: false });
          throw error;
        }
      },

      updateProduct: async (productId, productData) => {
        set({ loading: true, error: null });
        const t = telemetry.startTimer('products.update');
        try {
          productService.validateProductData(productData);
          const response = await productService.updateProduct(productId, productData);
          const updatedProduct = response.data || response;
          set((state) => {
            const products = state.products.map(product => product.id === productId ? { ...product, ...updatedProduct } : product);
            const productsById = { ...state.productsById, [productId]: { ...state.productsById[productId], ...updatedProduct } };
            return {
              products,
              productsById,
              selectedProduct: state.selectedProduct?.id === productId ? { ...state.selectedProduct, ...updatedProduct } : state.selectedProduct,
              loading: false
            };
          });
          telemetry.endTimer(t, { ok: true });
          telemetry.record('products.update.success');
          return updatedProduct;
        } catch (error) {
          telemetry.record('products.update.error', { message: error?.message });
          set({ error: error.message || 'Error al actualizar producto', loading: false });
          throw error;
        }
      },

      deleteProduct: async (productId) => {
        set({ loading: true, error: null });
        const t = telemetry.startTimer('products.delete');
        try {
          await productService.deleteProduct(productId);
          set((state) => {
            const products = state.products.filter(product => product.id !== productId);
            const { [productId]: _removed, ...rest } = state.productsById;
            return {
              products,
              productsById: rest,
              totalProducts: Math.max(0, state.totalProducts - 1),
              selectedProduct: state.selectedProduct?.id === productId ? null : state.selectedProduct,
              selectedIds: state.selectedIds.filter(id => id !== productId),
              loading: false
            };
          });
          telemetry.endTimer(t, { ok: true });
          telemetry.record('products.delete.success');
          try {
            const st = get();
            st._invalidatePages(st.currentPage, 1, 'delete');
            (async () => { try { await st.fetchProducts(st.currentPage, st.pageSize, st.lastSearchTerm || ''); } catch {} })();
          } catch {}
          return true;
        } catch (error) {
          telemetry.record('products.delete.error', { message: error?.message });
          set({ error: error.message || 'Error al eliminar producto', loading: false });
          throw error;
        }
      },

      // Utilidades
      setSelectedProduct: (product) => set({ selectedProduct: product }),
      
      // Filtro local (para productos ya cargados)
      setLocalFilters: (newFilters) => set((state) => ({ filters: { ...state.filters, ...newFilters } })),

      refresh: async () => {
        const state = get();
        if (state.lastSearchTerm) {
          await state.searchProducts(state.lastSearchTerm);
        } else if (state.products.length > 0) {
          await state.loadPage(state.currentPage);
        }
      },

      reset: () => set({
        products: [],
        productsById: {},
        pageCache: {},
        searchCache: {},
        selectedIds: [],
        selectedProduct: null,
        loading: false,
        error: null,
        lastErrorCode: null,
        lastErrorHintKey: null,
        cacheHits: 0,
        cacheMisses: 0,
        currentPage: 1,
        pageSize: 10,
        totalProducts: 0,
        totalPages: 0,
        lastSearchTerm: '',
        isOffline: false,
        filters: {
          search: '',
          category: '',
          status: '',
          sortBy: 'name',
          sortOrder: 'asc'
        },
        circuit: { openUntil: 0, failures: 0, threshold: 4, cooldownMs: 30000 },
        circuitOpen: false,
        circuitTimeoutId: null,
        _testing: { overrideTTL: null },
        pageCacheTTL: 120000,
        cacheTTL: 120000,
      }),
      // Selectores memoizados (para consumo en componentes)
      selectors: {
        selectProducts: (state) => state.products,
        selectProductsById: (state) => state.productsById,
        selectSelectedIds: (state) => state.selectedIds,
        selectBasicMeta: (state) => ({
          totalProducts: state.totalProducts,
          currentPage: state.currentPage,
          totalPages: state.totalPages,
          pageSize: state.pageSize,
        }),
        selectCategories: (state) => state.categories,
        selectLoadingError: (state) => ({ loading: state.loading, error: state.error }),
        selectLastSearchTerm: (state) => state.lastSearchTerm,
        selectCacheStats: (state) => {
          const hits = state.cacheHits;
            const misses = state.cacheMisses;
            const ratio = hits + misses === 0 ? 0 : hits / (hits + misses);
            return { hits, misses, ratio };
        },
      },

      // =================== BULK & OPTIMISTIC ===================
      toggleSelect: (id) => set((state) => ({
        selectedIds: state.selectedIds.includes(id)
          ? state.selectedIds.filter(x => x !== id)
          : [...state.selectedIds, id]
      })),
      clearSelection: () => set({ selectedIds: [] }),
      selectAllCurrent: () => set((state) => ({ selectedIds: state.products.map(p => p.id) })),

      bulkActivate: async () => {
        const ids = get().selectedIds;
        if (!ids.length) return;
        const correlationId = `bulkAct_${Date.now()}_${ids.length}`;
        const prevSnapshot = get().productsById;
        // Optimista
        set((state) => {
          const products = state.products.map(p => ids.includes(p.id) ? { ...p, is_active: true } : p);
          const productsById = { ...state.productsById };
          ids.forEach(id => { if (productsById[id]) productsById[id] = { ...productsById[id], is_active: true }; });
          return { products, productsById };
        });
        try {
          await Promise.all(ids.map((id) => productService.updateProduct(id, { is_active: true })));
          telemetry.record('products.bulkActivate.success', { count: ids.length, correlationId });
        } catch (e) {
          // Rollback
          set({ productsById: prevSnapshot, products: Object.values(prevSnapshot).slice(0, get().products.length) });
          telemetry.record('products.bulkActivate.rollback', { count: ids.length, correlationId });
          set({ error: 'Error en activación masiva' });
        } finally { get().clearSelection(); }
      },
      bulkDeactivate: async () => {
        const ids = get().selectedIds;
        if (!ids.length) return;
        const correlationId = `bulkDeact_${Date.now()}_${ids.length}`;
        const prevSnapshot = get().productsById;
        // Optimista
        set((state) => {
          const products = state.products.map(p => ids.includes(p.id) ? { ...p, is_active: false } : p);
          const productsById = { ...state.productsById };
          ids.forEach(id => { if (productsById[id]) productsById[id] = { ...productsById[id], is_active: false }; });
          return { products, productsById };
        });
        try {
          await Promise.all(ids.map(id => productService.updateProduct(id, { is_active: false })));
          telemetry.record('products.bulkDeactivate.success', { count: ids.length, correlationId });
        } catch (e) {
          set({ productsById: prevSnapshot, products: Object.values(prevSnapshot).slice(0, get().products.length) });
          telemetry.record('products.bulkDeactivate.rollback', { count: ids.length, correlationId });
          set({ error: 'Error en desactivación masiva' });
        } finally { get().clearSelection(); }
      },
      optimisticUpdateProduct: async (id, patch) => {
        const prev = get().productsById[id];
        if (!prev) return false;
        const correlationId = `inline_${id}_${Date.now()}`;
        // Optimista
        set((state) => {
            const updated = { ...prev, ...patch };
            const productsById = { ...state.productsById, [id]: updated };
            const products = state.products.map((p) => (p.id === id ? updated : p));
            return { productsById, products };
        });
        try {
          await productService.updateProduct(id, patch);
          telemetry.record('products.inlineUpdate.success', { id, correlationId });
          return true;
        } catch (e) {
          // Rollback
            set((state) => {
              const productsById = { ...state.productsById, [id]: prev };
              const products = state.products.map((p) => (p.id === id ? prev : p));
              return { productsById, products, error: 'Error al guardar cambios inline' };
            });
          telemetry.record('products.inlineUpdate.rollback', { id, correlationId });
          return false;
        }
      },
      // Persistir snapshot offline en localStorage
      _persistOfflineSnapshot: (snapshot) => { offline.persist(snapshot); },
      hydrateFromStorage: () => {
        const parsed = offline.hydrate();
        if (parsed) set({ products: parsed, productsById: Object.fromEntries(parsed.map(p=>[p.id,p])), totalProducts: parsed.length });
        return parsed;
      },

      _mapErrorCodeToHintKey: (code) => {
        switch (code) {
          case 'NETWORK': return 'errors.hint.NETWORK';
          case 'UNAUTHORIZED': return 'errors.hint.UNAUTHORIZED';
          case 'NOT_FOUND': return 'errors.hint.NOT_FOUND';
          case 'VALIDATION': return 'errors.hint.VALIDATION';
          case 'RATE_LIMIT': return 'errors.hint.RATE_LIMIT';
          case 'CONFLICT': return 'errors.hint.CONFLICT';
          case 'INTERNAL': return 'errors.hint.INTERNAL';
          default: return 'errors.hint.UNKNOWN';
        }
      },
      setTestingTTL: (ms) => set({ pageCacheTTL: ms, cacheTTL: ms, _testing: { overrideTTL: ms } }),
      // Toggle fast retry mode (1 attempt, 0 delay) for tests
      setTestingFastRetries: (flag) => set((s) => ({ _testing: { ...s._testing, fastRetries: !!flag } })),
      // Provide custom retry config for tests: { attempts: N, baseDelay: ms }
      setTestingRetryConfig: (cfg) => set((s) => ({ _testing: { ...s._testing, overrideRetryConfig: cfg } })),
    }),
    {
      name: 'product-store',
      version: 2
    }
  )
);

// Global offline listeners
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    try { useProductStore.getState().setIsOffline(false); telemetry.record('app.online'); } catch {}
  });
  window.addEventListener('offline', () => {
    try { useProductStore.getState().setIsOffline(true); telemetry.record('app.offline'); } catch {}
  });

  // Expose store for debugging and test helpers
  try {
    window.useProductStore = useProductStore;
  } catch (e) {
    // ignore in restricted environments
  }
}

export default useProductStore;
