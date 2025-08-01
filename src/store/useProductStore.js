/**
 * Store de Zustand para la gestión de productos en el ERP
 * Requiere autenticación para acceder a los datos
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { productService } from '@/services/productService';
import { categoryCacheService } from '@/services/categoryCacheService';
import { apiClient } from '@/services/api';

const useProductStore = create(
  devtools(
    (set, get) => ({
      // =================== ESTADO ===================
      products: [],
      selectedProduct: null,
      loading: false,
      error: null,
      
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
          const errorMessage = `Error al cargar productos: ${apiError.message}`;
          set({
            products: [],
            totalProducts: 0,
            totalPages: 0,
            loading: false,
            error: errorMessage
          });

          throw apiError;
        }
      },

      // Nueva función para búsqueda específica
      searchProducts: async (searchTerm) => {
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
          return await get().fetchProducts(1, 10, searchTerm);
        } catch (error) {
          // Manejo específico de errores de búsqueda
          console.error('Error en searchProducts:', error);
          
          let errorMessage = 'Error al buscar productos';
          if (error.message.includes('500')) {
            errorMessage = 'Error interno del servidor al buscar. Intenta con términos diferentes.';
          } else if (error.message.includes('404')) {
            errorMessage = 'No se encontraron productos con ese término de búsqueda.';
          } else if (error.message.includes('network') || error.message.includes('fetch')) {
            errorMessage = 'Error de conexión. Verifica tu internet e intenta nuevamente.';
          } else {
            errorMessage = error.message || 'Error desconocido al buscar productos';
          }

          set({ 
            products: [], 
            totalProducts: 0, 
            totalPages: 0,
            currentPage: 1,
            loading: false,
            error: errorMessage
          });

          // No re-lanzar el error para que no se propague al componente
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
      })
    }),
    {
      name: 'product-store',
      version: 2
    }
  )
);

export default useProductStore;
