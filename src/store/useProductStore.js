/**
 * Store de Zustand para la gestión de productos en el ERP
 * Requiere autenticación para acceder a los datos
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { productService } from '@/services/productService';

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
          console.log('Obteniendo categorías desde la API...');
          
          // Verificar que haya token disponible (más robusto)
          const token = localStorage.getItem('authToken');
          console.log('Token check:', token ? 'Token presente' : 'Token ausente');
          
          if (!token || token.trim() === '') {
            throw new Error('AUTHENTICATION_REQUIRED');
          }
          
          console.log('Token disponible, haciendo petición a /categories...');
          const response = await productService.getCategories();
          console.log('Respuesta recibida:', response);
          
          // La respuesta viene en formato { "categories": [...] } según el ejemplo de Postman
          const categories = response.categories || response.data || (Array.isArray(response) ? response : []);
          
          if (categories && categories.length > 0) {
            console.log('Categorías obtenidas de la API:', categories);
            set({ categories: categories, loading: false });
            return categories;
          } else {
            throw new Error('API_EMPTY_RESPONSE');
          }
        } catch (error) {
          console.error('Error obteniendo categorías:', error.message);
          
          // Determinar el tipo de error para mostrar mensaje apropiado
          let errorMessage = 'Error desconocido';
          if (error.message === 'AUTHENTICATION_REQUIRED') {
            errorMessage = 'Debe iniciar sesión para cargar categorías';
          } else if (error.message === 'API_EMPTY_RESPONSE') {
            errorMessage = 'No se encontraron categorías en el servidor';
          } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
            errorMessage = 'Sesión expirada. Debe iniciar sesión nuevamente';
          } else if (error.message.includes('Network') || error.message.includes('fetch')) {
            errorMessage = 'Error de conexión. Verifique su conexión a internet';
          } else {
            errorMessage = 'Error del servidor al cargar categorías';
          }
          
          set({ categories: [], loading: false, error: errorMessage });
          throw new Error(errorMessage);
        }
      },

      fetchProducts: async (page = null, pageSize = null, searchTerm = '') => {
        const state = get();
        const currentPage = page || state.currentPage;
        const currentPageSize = pageSize || state.pageSize;

        set({ loading: true, error: null });

        try {
          // Verificar si hay token (consistente con categorías)
          const token = localStorage.getItem('authToken');
          console.log('Token check para productos:', token ? 'Token presente' : 'Token ausente');
          
          if (!token || token.trim() === '') {
            const errorMessage = 'Debe iniciar sesión para acceder a los productos';
            set({ 
              products: [], 
              totalProducts: 0, 
              totalPages: 0, 
              loading: false, 
              error: errorMessage 
            });
            throw new Error(errorMessage);
          }

          let response;
          let products = [];
          let totalCount = 0;
          
          console.log('🚀 Intentando obtener productos desde API...');
          
          if (searchTerm && searchTerm.trim()) {
            console.log('📊 Búsqueda con término:', searchTerm.trim());
            // Usar búsqueda por ID o nombre
            response = await productService.searchProducts(searchTerm.trim());
            products = Array.isArray(response) ? response : [response];
            totalCount = products.length;
            
            // Para búsquedas, simular paginación local
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
              lastSearchTerm: searchTerm.trim()
            });

            return { data: paginatedProducts, total: totalCount };
          } else {
            console.log('📋 Obteniendo productos paginados:', { currentPage, currentPageSize });
            // Usar paginación normal de la API
            response = await productService.getProducts(currentPage, currentPageSize);
            console.log('📦 Respuesta de productos:', response);
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
          console.error('❌ Error obteniendo productos:', apiError.message);
          
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
            lastSearchTerm: ''
          });
          return { data: [], total: 0 };
        }

        return await get().fetchProducts(1, 10, searchTerm);
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
          console.error('Error fetching product:', error);
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
          console.error('Error creating product:', error);
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
          console.error('Error updating product:', error);
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
          console.error('Error deleting product:', error);
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
