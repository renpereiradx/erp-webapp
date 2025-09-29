/**
 * Store de Zustand para la gestión de productos en el ERP
 * Requiere autenticación para acceder a los datos
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { productService } from '@/services/productService';
import { categoryCacheService } from '@/services/categoryCacheService';
import { apiService as apiClient } from '@/services/api';
import { toApiError } from '@/utils/ApiError';
import { telemetry } from '@/utils/telemetry';
import { isConnectionError, getConnectionErrorMessage } from '@/utils/connectionUtils';

// Jitter helper
const _jitter = (base) => {
  const rand = Math.random();
  return base + (rand * 0.3 * base); // +-30%
};

const useProductStore = create()(
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
      // para pruebas podemos ajustar TTL
      _testing: { overrideTTL: null, fastRetries: false, overrideRetryConfig: null },

      // Circuit breaker state
      circuit: { openUntil: 0, failures: 0, threshold: 4, cooldownMs: 30000 },
      circuitOpen: false,
      circuitTimeoutId: null,

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
      _recordFailure: () => {
        const state = get();
        const failures = state.circuit.failures + 1;
        let openUntil = state.circuit.openUntil;
        let timeoutId = state.circuitTimeoutId;
        if (failures >= state.circuit.threshold) {
          openUntil = Date.now() + state.circuit.cooldownMs;
          // reset any previous timeout
          try { if (timeoutId) clearTimeout(timeoutId); } catch (e) {}
          // schedule a new timeout that will reliably close the circuit
          const id = setTimeout(() => {
            try { get()._closeCircuit('timeout'); } catch (e) {}
          }, state.circuit.cooldownMs);
          timeoutId = id;
          // mark circuit open flag
          set({ circuit: { ...state.circuit, failures, openUntil }, circuitTimeoutId: timeoutId, circuitOpen: true });
          try { telemetry.record('circuit.open', { component: 'products', failures, openUntil }); } catch {}
          return;
        }
        set({ circuit: { ...state.circuit, failures, openUntil } });
      },
      _recordSuccess: () => {
        const state = get();
        try { if (state.circuitTimeoutId) { clearTimeout(state.circuitTimeoutId); } } catch (e) {}
        get()._closeCircuit('success');
      },
      _circuitOpen: () => {
        const state = get();
        const openUntil = state.circuit?.openUntil || 0;
        if (openUntil && Date.now() >= openUntil) {
          try { if (state.circuitTimeoutId) clearTimeout(state.circuitTimeoutId); } catch (e) {}
          get()._closeCircuit('cooldown-expired');
          return false;
        }
        return !!state.circuitOpen && openUntil && Date.now() < openUntil;
      },
      // Helper centralizado para cerrar circuito (DRY)
      _closeCircuit: (reason = 'manual') => {
        set((s) => ({ circuit: { ...s.circuit, failures: 0, openUntil: 0 }, circuitTimeoutId: null, circuitOpen: false }));
        try { telemetry.record('circuit.close', { component: 'products', reason }); } catch {}
      },

      // Helper para ejecutar una función con reintentos (backoff + jitter)
      _withRetry: async (fn, opts = {}) => {
        let attempts = opts.attempts ?? 3;
        let baseDelay = opts.baseDelay ?? 300;
        const telemetryKey = opts.telemetryKey;

        // Apply testing overrides if present to make retry behavior deterministic in tests
        try {
          const testing = get()._testing || {};
          if (testing.fastRetries) {
            attempts = 1;
            baseDelay = 0;
          } else if (testing.overrideRetryConfig) {
            attempts = testing.overrideRetryConfig.attempts ?? attempts;
            baseDelay = testing.overrideRetryConfig.baseDelay ?? baseDelay;
          }
        } catch (e) {}

        let lastErr;
        for (let attempt = 0; attempt < attempts; attempt++) {
          try {
            const res = await fn();
            // registro de éxito y reseteo de circuito
            get()._recordSuccess?.();
            return res;
          } catch (err) {
            lastErr = err;
            // record failure for circuit
            try { get()._recordFailure(); } catch (e) {}
            // No reintentar en AbortError
            if (err?.name === 'AbortError') throw err;
            // Si es el último intento, volver a lanzar
            if (attempt === attempts - 1) break;
            // Esperar con backoff exponencial y jitter
            const delay = Math.round(baseDelay * Math.pow(2, attempt) * (1 + (Math.random() - 0.5) * 0.3));
            // Registrar intento en telemetry si aplica
            try { if (telemetryKey) telemetry.record(`${telemetryKey}.retry`, { attempt: attempt + 1 }); } catch (e) {}
            await new Promise(r => setTimeout(r, delay));
          }
        }
        // después de agotar intentos, lanzar último error
        throw lastErr;
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
            const byId = Object.fromEntries(products.map(p => [p.product_id || p.id, p]));
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
            const response = await get()._withRetry(() => productService.getProducts(currentPage, currentPageSize), { telemetryKey: 'products.fetch' });
            products = Array.isArray(response) ? response : [response];
            totalCount = products.length;
            const byId = Object.fromEntries(products.map(p => [p.product_id || p.id, p]));
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
              const keys = Object.keys(s.pageCache);
              if (keys.length <= 20) return {};
              const sorted = keys
                .map(k => ({ k, ts: s.pageCache[k].ts }))
                .sort((a,b) => a.ts - b.ts);
              const toRemove = sorted.slice(0, keys.length - 20);
              if (!toRemove.length) return {};
              const clone = { ...s.pageCache };
              toRemove.forEach(r => { delete clone[r.k]; });
              return { pageCache: clone };
            });
            telemetry.record('products.pageCache.trim');
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
          if (prev.length) get()._persistOfflineSnapshot(prev);
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
        const byId = Object.fromEntries(cached.data.map(p => [p.product_id || p.id, p]));
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
              const fresh = await get()._withRetry(() => productService.searchProductsFinancial(term), { attempts: 2, telemetryKey: 'products.search.revalidate' });
              const freshArr = Array.isArray(fresh) ? fresh : [fresh];
              set((s) => ({ searchCache: { ...s.searchCache, [cacheKey]: { ts: Date.now(), data: freshArr } } }));
              telemetry.record('products.search.revalidate.auto.success', { term, total: freshArr.length });
              // Si cambió el tamaño, actualizar vista
              if (freshArr.length !== totalCount) {
                const pag = freshArr.slice(0, pageSize);
                const freshById = Object.fromEntries(freshArr.map(p => [p.product_id || p.id, p]));
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
        // Usar financial search para obtener datos completos con precios y costos
        const response = await productService.searchProductsFinancial(term, { signal: options.signal });
        const products = Array.isArray(response) ? response : [response];
        const totalCount = products.length;
        const paginated = products.slice(0, pageSize);
        const byId = Object.fromEntries(products.map(p => [p.product_id || p.id, p]));
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
      // Usar financial search para obtener datos completos con precios y costos
      const response = await get()._withRetry(() => productService.searchProductsFinancial(term), { telemetryKey: 'products.search' });
      const products = Array.isArray(response) ? response : [response];
      const totalCount = products.length;
      const paginated = products.slice(0, pageSize);
      const byId = Object.fromEntries(products.map(p => [p.product_id || p.id, p]));
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

      // =================== FINANCIAL ENRICHED PRODUCTS ===================
      
      // Obtener producto financieramente enriquecido por ID
      fetchProductByIdFinancial: async (productId) => {
        set({ loading: true, error: null });
        
        try {
          const response = await get()._withRetry(
            () => productService.getProductByIdFinancial(productId),
            { telemetryKey: 'products.fetch_financial_by_id' }
          );
          
          const product = response.data || response;
          
          set({
            selectedProduct: product,
            loading: false
          });
          
          telemetry.record('products.fetch_financial_by_id.success', {
            productId,
            hasFinancialHealth: !!product?.financial_health,
            hasCosts: !!product?.unit_costs_summary?.length,
            hasPrices: !!product?.unit_prices?.length
          });
          
          return product;
        } catch (error) {
          const errorMsg = error.message || 'Error al cargar producto financiero';
          set({
            error: errorMsg,
            loading: false
          });
          
          telemetry.record('products.fetch_financial_by_id.error', {
            productId,
            error: error.message
          });
          
          throw error;
        }
      },
      
      // Buscar productos financieramente enriquecidos por código de barras
      searchProductByBarcodeFinancial: async (barcode) => {
        set({ loading: true, error: null });
        
        try {
          const response = await get()._withRetry(
            () => productService.getProductByBarcodeFinancial(barcode),
            { telemetryKey: 'products.search_financial_by_barcode' }
          );
          
          const product = response.data || response;
          
          set({
            selectedProduct: product,
            loading: false
          });
          
          telemetry.record('products.search_financial_by_barcode.success', {
            barcode,
            productId: product?.product_id,
            canSell: product?.financial_health?.has_prices && product?.has_valid_stock,
            bestMargin: product?.best_margin_percent
          });
          
          return product;
        } catch (error) {
          const errorMsg = error.message || 'Error al buscar producto por código de barras';
          set({
            error: errorMsg,
            loading: false
          });
          
          telemetry.record('products.search_financial_by_barcode.error', {
            barcode,
            error: error.message
          });
          
          throw error;
        }
      },
      
      // Buscar productos financieramente enriquecidos por nombre
      searchProductsFinancial: async (searchTerm, options = {}) => {
        const { limit = 10, signal } = options;
        const correlationId = `search_financial_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
        
        if (!searchTerm?.trim()) {
          return { data: [], total: 0 };
        }
        
        // Short-circuit if circuit is open
        if (get()._circuitOpen()) {
          const stateNow = get();
          const openUntil = stateNow.circuit?.openUntil || 0;
          if (openUntil && Date.now() >= openUntil) {
            try { if (stateNow.circuitTimeoutId) clearTimeout(stateNow.circuitTimeoutId); } catch (e) {}
            get()._closeCircuit('cooldown-search-financial');
          } else {
            return { data: [], total: 0, circuitOpen: true };
          }
        }
        
        set({ loading: true, error: null });
        
        try {
          const response = await get()._withRetry(
            () => productService.searchProductsFinancial(searchTerm.trim(), { limit, signal }),
            { telemetryKey: 'products.search_financial' }
          );
          
          const products = Array.isArray(response) ? response : [response];
          const totalCount = products.length;
          const pageSize = get().pageSize || 10;
          const paginated = products.slice(0, pageSize);
          const byId = Object.fromEntries(products.map(p => [p.product_id || p.id, p]));
          
          set({
            products: paginated,
            productsById: byId,
            totalProducts: totalCount,
            totalPages: Math.ceil(totalCount / pageSize),
            currentPage: 1,
            pageSize,
            loading: false,
            lastSearchTerm: searchTerm.trim(),
            error: null
          });
          
          telemetry.record('products.search_financial.success', {
            searchTerm,
            total: totalCount,
            withMargins: products.filter(p => p.best_margin_percent != null).length,
            correlationId
          });
          
          get()._recordSuccess();
          return { data: paginated, total: totalCount };
        } catch (error) {
          if (!(error?.name === 'AbortError')) {
            try { get()._recordFailure(); } catch (e) {}
          }
          
          if (error?.name === 'AbortError') {
            telemetry.record('products.search_financial.abort');
            return { data: [], total: 0, aborted: true };
          }
          
          const norm = toApiError(error, 'Error al buscar productos financieros', correlationId);
          const code = norm.code || (isConnectionError(error) ? 'NETWORK' : null);
          const hintKey = code ? get()._mapErrorCodeToHintKey(code) : null;
          
          let errorMessage = norm.message || 'Error al buscar productos financieros';
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
          
          telemetry.record('products.search_financial.error', { 
            searchTerm, 
            code: norm.code, 
            message: norm.message, 
            correlationId 
          });
          
          return { error: errorMessage, data: [], total: 0 };
        }
      },

      // Limpiar productos (para estado inicial)
      // Obtener servicios de canchas para reservas (usando endpoint enriquecido)
      fetchServiceCourts: async () => {
        const startTime = Date.now();
        set({ loading: true, error: null });
        
        try {
          const result = await get()._withRetry(
            async () => {
              return await apiClient.get('/products/enriched/service-courts');
            },
            { telemetryKey: 'products.fetch_service_courts' }
          );
          
          let services = [];
          if (Array.isArray(result)) {
            services = result;
          } else if (result?.data && Array.isArray(result.data)) {
            services = result.data;
          }
          
          // Enriquecer servicios con información de precios y datos procesados
          const { createProductSummary } = await import('@/utils/productUtils');
          const enrichedServices = services.map(service => {
            const summary = createProductSummary(service);
            return {
              ...service,
              // Añadir las propiedades que necesita la UI de reservas
              price_formatted: summary?.priceFormatted || 
                              (service.price ? `PYG ${service.price.toLocaleString('es-ES')}` : null) ||
                              (service.purchase_price ? `PYG ${service.purchase_price.toLocaleString('es-ES')}` : null),
              has_valid_price: summary?.hasValidPrice || 
                              !!(service.price || service.purchase_price || service.unit_prices?.length),
              state: service.state !== undefined ? service.state : service.is_active !== undefined ? service.is_active : true
            };
          });
          
          // Actualizar productos con los servicios específicos enriquecidos
          const servicesById = Object.fromEntries(enrichedServices.map(s => [s.id, s]));
          set({
            products: enrichedServices,
            productsById: servicesById,
            totalProducts: enrichedServices.length,
            totalPages: 1,
            currentPage: 1,
            loading: false,
            error: null
          });
          
          telemetry.record('products.fetch_service_courts.success', {
            duration: Date.now() - startTime,
            count: enrichedServices.length,
            withPrices: enrichedServices.filter(s => s.has_valid_price).length
          });
          
          return enrichedServices;
        } catch (error) {
          const errorMsg = error.message || 'Error al cargar servicios de canchas';
          set({ 
            products: [],
            productsById: {},
            totalProducts: 0,
            totalPages: 0,
            loading: false, 
            error: errorMsg 
          });
          
          telemetry.record('products.fetch_service_courts.error', {
            duration: Date.now() - startTime,
            error: error.message
          });
          
          throw error;
        }
      },

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

      // Limpiar búsquedas y cache al cambiar de página
      clearSearchState: () => {
        set({
          products: [],
          productsById: {},
          searchCache: {},
          lastSearchTerm: '',
          totalProducts: 0,
          totalPages: 0,
          currentPage: 1,
          rawProducts: [],
          error: null,
          lastErrorCode: null,
          lastErrorHintKey: null
        });
      },

      // Invalidar cache de un producto específico después de cambios de precio
      invalidateProductCache: (productId) => {
        const state = get();
        
        // Limpiar de searchCache todas las entradas que contengan este producto
        const newSearchCache = {};
        Object.keys(state.searchCache).forEach(key => {
          const cached = state.searchCache[key];
          if (cached && cached.data) {
            // Filtrar este producto del cache
            const filteredData = cached.data.filter(p => 
              (p.product_id || p.id) !== productId
            );
            // Solo mantener la entrada si todavía tiene productos
            if (filteredData.length > 0) {
              newSearchCache[key] = {
                ...cached,
                data: filteredData
              };
            }
          }
        });

        // Limpiar de productos actuales si está presente
        const newProducts = state.products.filter(p => 
          (p.product_id || p.id) !== productId
        );
        
        // Limpiar de productsById
        const newProductsById = { ...state.productsById };
        delete newProductsById[productId];

        set({
          searchCache: newSearchCache,
          products: newProducts,
          productsById: newProductsById,
          totalProducts: newProducts.length
        });

        telemetry.record('products.cache.invalidate', { productId });
      },

      // Refrescar datos de un producto específico después de cambios
      refreshProductData: async (productId) => {
        try {
          // Obtener datos actualizados del producto
          const updatedProduct = await productService.getProductByIdFinancial(productId);
          const product = updatedProduct.data || updatedProduct;
          
          const state = get();
          
          // Actualizar en productos actuales si está presente
          const updatedProducts = state.products.map(p => 
            (p.product_id || p.id) === productId ? { ...p, ...product } : p
          );
          
          // Actualizar en productsById
          const updatedProductsById = { ...state.productsById };
          if (updatedProductsById[productId]) {
            updatedProductsById[productId] = { ...updatedProductsById[productId], ...product };
          }
          
          // Actualizar en searchCache
          const updatedSearchCache = {};
          Object.keys(state.searchCache).forEach(key => {
            const cached = state.searchCache[key];
            if (cached && cached.data) {
              const updatedCachedData = cached.data.map(p => 
                (p.product_id || p.id) === productId ? { ...p, ...product } : p
              );
              updatedSearchCache[key] = {
                ...cached,
                data: updatedCachedData
              };
            } else {
              updatedSearchCache[key] = cached;
            }
          });

          set({
            products: updatedProducts,
            productsById: updatedProductsById,
            searchCache: updatedSearchCache
          });

          telemetry.record('products.refresh.success', { productId });
          return product;
        } catch (error) {
          telemetry.record('products.refresh.error', { productId, error: error.message });
          // Si falla, al menos invalidar el cache
          get().invalidateProductCache(productId);
          throw error;
        }
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
          const newProduct = response?.data || response;
          let createdProduct = newProduct;
          if (!newProduct || !newProduct.id) {
            // La API retorna solo mensaje; refrescar lista para obtener producto real
            try { await get().fetchProducts(1, get().pageSize); } catch {}
            createdProduct = null;
            set((s) => ({ loading: false }));
          } else {
            set((state) => {
              const productsById = { ...state.productsById, [newProduct.id]: newProduct };
              return {
                products: [newProduct, ...state.products],
                productsById,
                totalProducts: state.totalProducts + 1,
                loading: false
              };
            });
          }
          telemetry.endTimer(t, { ok: true, messageOnly: !createdProduct });
            telemetry.record('products.create.success');
          return createdProduct;
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
          const updatedProduct = response?.data || response;
          let finalProduct = updatedProduct;
          if (!updatedProduct || !updatedProduct.id) {
            // Mensaje sin datos => refrescar productos
            try { await get().fetchProducts(get().currentPage, get().pageSize); } catch {}
            finalProduct = null;
            set((s) => ({ loading: false }));
          } else {
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
          }
          telemetry.endTimer(t, { ok: true, messageOnly: !finalProduct });
          telemetry.record('products.update.success');
          return finalProduct;
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
            const products = state.products.map(p => p.id === productId ? { ...p, state: false } : p);
            const productsById = {
              ...state.productsById,
              [productId]: state.productsById[productId] ? { ...state.productsById[productId], state: false } : state.productsById[productId]
            };
            return {
              products,
              productsById,
              // totalProducts no cambia; seguimos contando aunque esté inactivo (para métricas)
              selectedProduct: state.selectedProduct?.id === productId ? { ...state.selectedProduct, state: false } : state.selectedProduct,
              selectedIds: state.selectedIds.filter(id => id !== productId),
              loading: false
            };
          });
          telemetry.endTimer(t, { ok: true });
          telemetry.record('products.delete.success');
          return true;
        } catch (error) {
          telemetry.record('products.delete.error', { message: error?.message });
          set({ error: error.message || 'Error al eliminar producto', loading: false });
          throw error;
        }
      },

      // Reactivar producto (cambiar state de false a true)
      reactivateProduct: async (productId) => {
        set({ loading: true, error: null });
        const t = telemetry.startTimer('products.reactivate');
        try {
          await productService.reactivateProduct(productId);
          set((state) => {
            const products = state.products.map(p => p.id === productId ? { ...p, state: true } : p);
            const productsById = {
              ...state.productsById,
              [productId]: state.productsById[productId] ? { ...state.productsById[productId], state: true } : state.productsById[productId]
            };
            return {
              products,
              productsById,
              selectedProduct: state.selectedProduct?.id === productId ? { ...state.selectedProduct, state: true } : state.selectedProduct,
              loading: false
            };
          });
          telemetry.endTimer(t, { ok: true });
          telemetry.record('products.reactivate.success');
          return true;
        } catch (error) {
          telemetry.record('products.reactivate.error', { message: error?.message });
          set({ error: error.message || 'Error al reactivar producto', loading: false });
          throw error;
        }
      },

      // Utilidades
      setSelectedProduct: (product) => set({ selectedProduct: product }),
      
      // Filtro local (para productos ya cargados)
      setLocalFilters: (newFilters) => set((state) => ({
        filters: { ...state.filters, ...newFilters }
      })), // fixed

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
      // Attempt to hydrate offline snapshot on startup
      hydrateFromStorage: () => {
        try {
          const raw = window.localStorage.getItem('products_last_offline_snapshot');
          if (!raw) return null;
          const parsed = JSON.parse(raw);
          set({ products: parsed, productsById: Object.fromEntries(parsed.map(p => [p.id, p])), totalProducts: parsed.length });
          return parsed;
        } catch (e) {
          return null;
        }
      },

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
        const prevSnapshot = get().productsById; // snapshot for rollback event
        // Optimista
        const prev = get().productsById;
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
        const prev = get().productsById;
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
      _persistOfflineSnapshot: (snapshot) => {
        try {
          window.localStorage.setItem('products_last_offline_snapshot', JSON.stringify(snapshot));
        } catch (e) {
          // ignore
        }
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
    try { 
      useProductStore.getState().setIsOffline(false); 
      telemetry.record('app.online'); 
    } catch (e) {
      console.warn('Error handling online event:', e);
    }
  });
  window.addEventListener('offline', () => {
    try { 
      useProductStore.getState().setIsOffline(true); 
      telemetry.record('app.offline'); 
    } catch (e) {
      console.warn('Error handling offline event:', e);
    }
  });

  // Expose store for debugging and test helpers
  try {
    window.useProductStore = useProductStore;
  } catch (e) {
    // ignore in restricted environments
  }
}

export default useProductStore;
