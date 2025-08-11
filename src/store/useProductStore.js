/**
 * Store de Zustand para la gestión de productos en el ERP
 * Requiere autenticación para acceder a los datos
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { productService } from '@/services/productService';
import { categoryCacheService } from '@/services/categoryCacheService';
import { apiClient } from '@/services/api';
import { toApiError } from '@/utils/ApiError';
import { telemetry } from '@/utils/telemetry';

const useProductStore = create(
  devtools(
    (set, get) => ({
      // =================== ESTADO ===================
      products: [],
      selectedProduct: null,
      loading: false,
      error: null,
  // Caché simple para búsquedas (SWR-like)
  searchCache: {}, // { [cacheKey]: { ts: number, data: array } }
  cacheTTL: 120000, // 2 minutos
      
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
      clearError: () => set({ error: null }),

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
        set({ loading: true, error: null });
        try {
          const response = await productService.getAllCategories();
          console.log('Respuesta cruda de categorías en store:', response);
          
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
          console.log(`${categories.length} categorías cargadas en store`);
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
          
          if (error.message.includes('500')) {
            console.warn('Error 500 en categorías, usando categorías por defecto');
            set({ 
              categories: fallbackCategories, 
              loading: false, 
              error: 'Usando categorías por defecto debido a error del servidor'
            });
            return fallbackCategories;
          }
          
          set({ 
            categories: [], 
            loading: false, 
            error: 'Error al cargar categorías: ' + (error.message || 'Error desconocido') 
          });
          return [];
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

      fetchProducts: async (page = null, pageSize = null, searchTerm = '') => {
        const state = get();
        const currentPage = page || state.currentPage;
        const currentPageSize = pageSize || state.pageSize;

        set({ loading: true, error: null });

        try {
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
                totalProducts: 0,
                totalPages: 0,
                currentPage: 1,
                pageSize: currentPageSize,
                loading: false,
                lastSearchTerm: searchTerm.trim(),
                error: null
              });
              return { data: [], total: 0, message: `No se encontraron productos para "${searchTerm.trim()}"` };
            }
            
            const startIndex = (currentPage - 1) * currentPageSize;
            const endIndex = startIndex + currentPageSize;
            const paginatedProducts = products.slice(startIndex, endIndex);
            
            set({
              products: paginatedProducts,
              totalProducts: totalCount,
              totalPages: Math.ceil(totalCount / currentPageSize),
              currentPage: currentPage,
              pageSize: currentPageSize,
              loading: false,
              lastSearchTerm: searchTerm.trim(),
              error: null
            });

            return { data: paginatedProducts, total: totalCount };
          } else {
            response = await productService.getProducts(currentPage, currentPageSize);
            products = Array.isArray(response) ? response : [response];
            totalCount = products.length;
            
            set({
              products: products,
              totalProducts: totalCount,
              totalPages: Math.ceil(totalCount / currentPageSize),
              currentPage: currentPage,
              pageSize: currentPageSize,
              loading: false,
              lastSearchTerm: searchTerm
            });

            return { data: products, total: totalCount };
          }
        } catch (apiError) {
          const norm = toApiError(apiError, 'Error al cargar productos');
          const errorMessage = `Error al cargar productos: ${norm.message}`;
          set({
            products: [],
            totalProducts: 0,
            totalPages: 0,
            loading: false,
            error: errorMessage
          });

          throw norm;
        }
      },

      // Nueva función para búsqueda específica (con caché y cancelación)
  searchProducts: async (searchTerm, options = {}) => {
        if (!searchTerm.trim()) {
          // Si no hay término, limpiar productos
          set({ 
            products: [], 
            totalProducts: 0, 
            totalPages: 0,
            currentPage: 1,
            lastSearchTerm: '',
            error: null
          });
          return { data: [], total: 0 };
        }

        try {
          const term = searchTerm.trim();
          const state = get();
          const { searchCache, cacheTTL } = state;
          const now = Date.now();
          const pageSize = state.pageSize || 10;
          // Expandir clave de caché para cubrir filtros y tamaño
          const cacheKey = JSON.stringify({ term, pageSize, category: state.filters?.category || 'all', status: state.filters?.status || 'all' });
          const cached = searchCache[cacheKey];
          const isValidCache = cached && now - cached.ts < cacheTTL;

          // Si hay caché válida y no se fuerza refresco, devolver de caché
          if (isValidCache && !options.force) {
            const totalCount = cached.data.length;
            const paginated = cached.data.slice(0, pageSize);

            set({
              products: paginated,
              totalProducts: totalCount,
              totalPages: Math.ceil(totalCount / pageSize),
              currentPage: 1,
              pageSize,
              loading: false,
              lastSearchTerm: term,
              error: null
            });

            // Revalidación opcional en background cuando no hay signal
            if (options.revalidate && !options.signal) {
              (async () => {
                try {
                  const fresh = await productService.searchProducts(term);
                  const freshArr = Array.isArray(fresh) ? fresh : [fresh];
                  // Si cambió el tamaño, actualizar estado y caché
                  if (freshArr.length !== totalCount) {
                    const pag = freshArr.slice(0, pageSize);
                    set({
                      products: pag,
                      totalProducts: freshArr.length,
                      totalPages: Math.ceil(freshArr.length / pageSize),
                      currentPage: 1,
                      pageSize,
                      lastSearchTerm: term,
                    });
                  }
                  // Actualizar caché
                  set((s) => ({
                    searchCache: { ...s.searchCache, [cacheKey]: { ts: Date.now(), data: freshArr } }
                  }));
                } catch (_) { /* silencioso */ }
              })();
            }

            return { data: paginated, total: totalCount };
          }

          // Si llega un AbortController signal, usar ruta directa con cancelación
          if (options.signal) {
            const response = await productService.searchProducts(term, { signal: options.signal });
            const products = Array.isArray(response) ? response : [response];
            const totalCount = products.length;
            const paginated = products.slice(0, pageSize);

            // Guardar en caché
            set((s) => ({ searchCache: { ...s.searchCache, [cacheKey]: { ts: Date.now(), data: products } } }));

            set({
              products: paginated,
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

          // Camino estándar (sin signal): reutiliza fetchProducts
          // Obtener resultados completos para cachear correctamente y luego paginar en memoria
          const t = telemetry.startTimer('products.search');
          const response = await productService.searchProducts(term);
          const products = Array.isArray(response) ? response : [response];
          const totalCount = products.length;
          const paginated = products.slice(0, pageSize);

          // Guardar en caché el conjunto completo
          set((s) => ({ searchCache: { ...s.searchCache, [cacheKey]: { ts: Date.now(), data: products } } }));

          set({
            products: paginated,
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
          return { data: paginated, total: totalCount };
        } catch (error) {
          // Manejo específico de errores de búsqueda con normalización
          console.error('Error en searchProducts:', error);

          if (error?.name === 'AbortError') {
            // No actualizar estado en cancelación; salir silenciosamente
            telemetry.record('products.search.abort');
            return { data: [], total: 0, aborted: true };
          }

          const norm = toApiError(error, 'Error al buscar productos');
          let errorMessage = norm.message || 'Error al buscar productos';
          if (norm.code === 'INTERNAL') {
            errorMessage = 'Error interno del servidor al buscar. Intenta con términos diferentes.';
          } else if (norm.code === 'NOT_FOUND') {
            errorMessage = 'No se encontraron productos con ese término de búsqueda.';
          } else if (norm.code === 'NETWORK') {
            errorMessage = 'Error de conexión. Verifica tu internet e intenta nuevamente.';
          }

          set({
            products: [],
            totalProducts: 0,
            totalPages: 0,
            currentPage: 1,
            loading: false,
            error: errorMessage,
          });

          telemetry.record('products.search.error', { code: norm.code, message: norm.message });

          return { error: errorMessage, data: [], total: 0 };
        }
      },

      // Función para cargar página específica
      loadPage: async (page) => {
        const state = get();
        return await get().fetchProducts(page, state.pageSize, state.lastSearchTerm || '');
      },

      // Función para cambiar tamaño de página y recargar
      changePageSize: async (newPageSize) => {
        const state = get();
        get().setPageSize(newPageSize);
  return await get().fetchProducts(1, newPageSize, state.lastSearchTerm || '');
      },

      // Limpiar productos (para estado inicial)
      clearProducts: () => {
        set({ 
          products: [], 
          totalProducts: 0, 
          totalPages: 0,
          currentPage: 1,
          lastSearchTerm: '',
          loading: false,
          error: null
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

        try {
          productService.validateProductData(productData);
          const response = await productService.createProduct(productData);
          const newProduct = response.data || response;

          set((state) => ({
            products: [newProduct, ...state.products],
            totalProducts: state.totalProducts + 1,
            loading: false
          }));

          return newProduct;
        } catch (error) {
          set({
            error: error.message || 'Error al crear producto',
            loading: false
          });
          throw error;
        }
      },

      updateProduct: async (productId, productData) => {
        set({ loading: true, error: null });

        try {
          productService.validateProductData(productData);
          const response = await productService.updateProduct(productId, productData);
          const updatedProduct = response.data || response;

          set((state) => ({
            products: state.products.map(product =>
              product.id === productId ? { ...product, ...updatedProduct } : product
            ),
            selectedProduct: state.selectedProduct?.id === productId 
              ? { ...state.selectedProduct, ...updatedProduct }
              : state.selectedProduct,
            loading: false
          }));

          return updatedProduct;
        } catch (error) {
          set({
            error: error.message || 'Error al actualizar producto',
            loading: false
          });
          throw error;
        }
      },

      deleteProduct: async (productId) => {
        set({ loading: true, error: null });

        try {
          await productService.deleteProduct(productId);

          set((state) => ({
            products: state.products.filter(product => product.id !== productId),
            totalProducts: Math.max(0, state.totalProducts - 1),
            selectedProduct: state.selectedProduct?.id === productId ? null : state.selectedProduct,
            loading: false
          }));

          return true;
        } catch (error) {
          set({
            error: error.message || 'Error al eliminar producto',
            loading: false
          });
          throw error;
        }
      },

      // Utilidades
      setSelectedProduct: (product) => set({ selectedProduct: product }),
      
      // Filtro local (para productos ya cargados)
      setLocalFilters: (newFilters) => 
        set((state) => ({
          filters: { ...state.filters, ...newFilters }
        })),

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
        selectedProduct: null,
        loading: false,
        error: null,
  searchCache: {},
        currentPage: 1,
        pageSize: 10,
        totalProducts: 0,
        totalPages: 0,
        lastSearchTerm: '',
        filters: {
          search: '',
          category: '',
          status: '',
          sortBy: 'name',
          sortOrder: 'asc'
        }
      }),

      // Selectores memoizados (para consumo en componentes)
      selectors: {
        selectProducts: (state) => state.products,
        selectBasicMeta: (state) => ({
          totalProducts: state.totalProducts,
          currentPage: state.currentPage,
          totalPages: state.totalPages,
          pageSize: state.pageSize,
        }),
        selectCategories: (state) => state.categories,
        selectLoadingError: (state) => ({ loading: state.loading, error: state.error }),
        selectLastSearchTerm: (state) => state.lastSearchTerm,
      }
    }),
    {
      name: 'product-store',
      version: 2
    }
  )
);

export default useProductStore;
