/**
 * Store de Zustand para la gestión de productos en el ERP
 * Actualizado para trabajar con la Business Management API
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

      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),

      setFilters: (newFilters) => 
        set((state) => ({
          filters: { ...state.filters, ...newFilters },
          currentPage: 1
        })),

      setCurrentPage: (page) => set({ currentPage: page }),

      // =================== API CALLS ===================

      fetchProducts: async (page = null, pageSize = null) => {
        const state = get();
        const currentPage = page || state.currentPage;
        const currentPageSize = pageSize || state.pageSize;

        set({ loading: true, error: null });

        try {
          // Mock data para desarrollo
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
      clearProducts: () => set({ products: [], selectedProduct: null }),
      setSelectedProduct: (product) => set({ selectedProduct: product }),
      
      searchProducts: (searchTerm) => {
        set((state) => ({
          filters: { ...state.filters, search: searchTerm },
          currentPage: 1
        }));
      },

      refresh: async () => {
        const state = get();
        await state.fetchProducts(state.currentPage, state.pageSize);
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
