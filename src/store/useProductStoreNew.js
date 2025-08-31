/**
 * Store de Zustand para la gestión de productos en el ERP
 * Actualizado para trabajar con la Business Management API
 * Incluye estado local y funciones para interactuar con la API
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { productService } from '@/services/productService';

const useProductStore = create()(
  devtools(
    (set, get) => ({
      // =================== ESTADO ===================
      products: [],
      selectedProduct: null,
      loading: false,
      error: null,
      
      // Pagination
      currentPage: 1,
      pageSize: 10,
      totalProducts: 0,
      totalPages: 0,
      
      // Filtros
      filters: {
        search: '',
        category: '',
        status: '',
        sortBy: 'name',
        sortOrder: 'asc'
      },

      // =================== ACTIONS ===================

      // Establecer estado de carga
      setLoading: (loading) => set({ loading }),

      // Establecer error
      setError: (error) => set({ error }),

      // Limpiar error
      clearError: () => set({ error: null }),

      // Establecer filtros
      setFilters: (newFilters) => 
        set((state) => ({
          filters: { ...state.filters, ...newFilters },
          currentPage: 1 // Reset página al filtrar
        })),

      // Establecer página actual
      setCurrentPage: (page) => set({ currentPage: page }),

      // =================== API CALLS ===================

      // Obtener productos paginados
      fetchProducts: async (page = null, pageSize = null) => {
        const state = get();
        const currentPage = page || state.currentPage;
        const currentPageSize = pageSize || state.pageSize;

        set({ loading: true, error: null });

        try {
          // Para desarrollo/testing, usar datos mock si la API no está disponible
          const mockProducts = [
            {
              id: 'bcYdWdKNR',
              name: 'Puma MB.01',
              id_category: 5,
              state: true,
              product_type: 'PHYSICAL'
            },
            {
              id: '2rr9sbbqEtNE7L2ZAti0TNr8Yn9',
              name: 'Nike Air Jordan',
              id_category: 5,
              state: true,
              product_type: 'PHYSICAL'
            },
            {
              id: 'xyz123abc',
              name: 'Adidas Ultraboost',
              id_category: 5,
              state: false,
              product_type: 'PHYSICAL'
            }
          ];

          try {
            const response = await productService.getProducts(currentPage, currentPageSize);
            
            set({
              products: response.data || response.products || [],
              totalProducts: response.total || response.count || 0,
              totalPages: Math.ceil((response.total || response.count || 0) / currentPageSize),
              currentPage,
              pageSize: currentPageSize,
              loading: false
            });

            return response;
          } catch (apiError) {
            // Fallback a datos mock si la API no está disponible
            console.warn('API not available, using mock data:', apiError.message);
            
            set({
              products: mockProducts,
              totalProducts: mockProducts.length,
              totalPages: Math.ceil(mockProducts.length / currentPageSize),
              currentPage,
              pageSize: currentPageSize,
              loading: false
            });

            return { data: mockProducts, total: mockProducts.length };
          }
        } catch (error) {
          console.error('Error fetching products:', error);
          set({
            error: error.message || 'Error al cargar productos',
            loading: false
          });
          throw error;
        }
      },

      // Obtener producto por ID
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

      // Crear nuevo producto
      createProduct: async (productData) => {
        set({ loading: true, error: null });

        try {
          // Validar datos
          productService.validateProductData(productData);

          const response = await productService.createProduct(productData);
          const newProduct = response.data || response;

          // Actualizar lista de productos
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

      // Actualizar producto
      updateProduct: async (productId, productData) => {
        set({ loading: true, error: null });

        try {
          // Validar datos
          productService.validateProductData(productData);

          const response = await productService.updateProduct(productId, productData);
          const updatedProduct = response.data || response;

          // Actualizar en la lista
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

      // Eliminar producto (soft delete)
      deleteProduct: async (productId) => {
        set({ loading: true, error: null });

        try {
          await productService.deleteProduct(productId);

          // Remover de la lista local o marcar como eliminado
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

      // =================== DESCRIPCIÓN ===================

      // Crear descripción de producto
      createProductDescription: async (productId, descriptionData) => {
        set({ loading: true, error: null });

        try {
          productService.validateDescriptionData(descriptionData);
          const response = await productService.createProductDescription(productId, descriptionData);
          
          set({ loading: false });
          return response.data || response;
        } catch (error) {
          console.error('Error creating description:', error);
          set({
            error: error.message || 'Error al crear descripción',
            loading: false
          });
          throw error;
        }
      },

      // Actualizar descripción
      updateDescription: async (descId, descriptionData) => {
        set({ loading: true, error: null });

        try {
          productService.validateDescriptionData(descriptionData);
          const response = await productService.updateDescription(descId, descriptionData);
          
          set({ loading: false });
          return response.data || response;
        } catch (error) {
          console.error('Error updating description:', error);
          set({
            error: error.message || 'Error al actualizar descripción',
            loading: false
          });
          throw error;
        }
      },

      // =================== PRECIOS ===================

      // Crear precio de producto
      createProductPrice: async (productId, priceData) => {
        set({ loading: true, error: null });

        try {
          productService.validatePriceData(priceData);
          const response = await productService.createProductPrice(productId, priceData);
          
          set({ loading: false });
          return response.data || response;
        } catch (error) {
          console.error('Error creating price:', error);
          set({
            error: error.message || 'Error al crear precio',
            loading: false
          });
          throw error;
        }
      },

      // Actualizar precio por Product ID
      updateProductPrice: async (productId, priceData) => {
        set({ loading: true, error: null });

        try {
          productService.validatePriceData(priceData);
          const response = await productService.updateProductPriceByProductId(productId, priceData);
          
          set({ loading: false });
          return response.data || response;
        } catch (error) {
          console.error('Error updating price:', error);
          set({
            error: error.message || 'Error al actualizar precio',
            loading: false
          });
          throw error;
        }
      },

      // =================== STOCK ===================

      // Crear stock
      createStock: async (productId, stockData) => {
        set({ loading: true, error: null });

        try {
          productService.validateStockData(stockData);
          const response = await productService.createStock(productId, stockData);
          
          set({ loading: false });
          return response.data || response;
        } catch (error) {
          console.error('Error creating stock:', error);
          set({
            error: error.message || 'Error al crear stock',
            loading: false
          });
          throw error;
        }
      },

      // Obtener stock por Product ID
      getStockByProductId: async (productId) => {
        set({ loading: true, error: null });

        try {
          const response = await productService.getStockByProductId(productId);
          
          set({ loading: false });
          return response.data || response;
        } catch (error) {
          console.error('Error fetching stock:', error);
          set({
            error: error.message || 'Error al obtener stock',
            loading: false
          });
          throw error;
        }
      },

      // Actualizar stock por Product ID
      updateStock: async (productId, stockData) => {
        set({ loading: true, error: null });

        try {
          productService.validateStockData(stockData);
          const response = await productService.updateStockByProductId(productId, stockData);
          
          set({ loading: false });
          return response.data || response;
        } catch (error) {
          console.error('Error updating stock:', error);
          set({
            error: error.message || 'Error al actualizar stock',
            loading: false
          });
          throw error;
        }
      },

      // =================== UTILIDADES ===================

      // Limpiar productos
      clearProducts: () => set({ products: [], selectedProduct: null }),

      // Establecer producto seleccionado
      setSelectedProduct: (product) => set({ selectedProduct: product }),

      // Buscar productos (filtro local)
      searchProducts: (searchTerm) => {
        set((state) => ({
          filters: { ...state.filters, search: searchTerm },
          currentPage: 1
        }));
      },

      // Obtener productos con stock bajo (legacy)
      getLowStockProducts: async (threshold = 10) => {
        const state = get();
        return state.products.filter(product => 
          product.stock && product.stock < threshold
        );
      },

      // Refrescar datos
      refresh: async () => {
        const state = get();
        await state.fetchProducts(state.currentPage, state.pageSize);
      },

      // Reset store
      reset: () => set({
        products: [],
        selectedProduct: null,
        loading: false,
        error: null,
        currentPage: 1,
        pageSize: 10,
        totalProducts: 0,
        totalPages: 0,
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
