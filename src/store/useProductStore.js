/**
 * Store de Zustand para la gestión de productos en el ERP
 * Incluye estado local y funciones para interactuar con la API
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { productService } from '@/services/productService';

const useProductStore = create(
  devtools(
    (set, get) => ({
      // Estado inicial
      products: [],
      categories: [],
      currentProduct: null,
      loading: false,
      error: null,
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
      },
      filters: {
        search: '',
        category: '',
        sortBy: 'name',
        sortOrder: 'asc',
      },

      // Acciones para manejo de loading y errores
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),

      // Acciones para filtros y paginación
      setFilters: (filters) => set((state) => ({
        filters: { ...state.filters, ...filters }
      })),
      
      setPagination: (pagination) => set((state) => ({
        pagination: { ...state.pagination, ...pagination }
      })),

      // Obtener productos con filtros y paginación
      fetchProducts: async (params = {}) => {
        set({ loading: true, error: null });
        try {
          const { filters, pagination } = get();
          const queryParams = {
            ...filters,
            ...pagination,
            ...params,
          };

          const response = await productService.getProducts(queryParams);
          
          set({
            products: response.data || response,
            pagination: {
              page: response.page || 1,
              limit: response.limit || 10,
              total: response.total || response.length || 0,
              totalPages: response.totalPages || Math.ceil((response.total || response.length || 0) / (response.limit || 10)),
            },
            loading: false,
          });
        } catch (error) {
          set({
            error: error.response?.data?.message || 'Error al cargar productos',
            loading: false,
          });
        }
      },

      // Obtener un producto por ID
      fetchProductById: async (id) => {
        set({ loading: true, error: null });
        try {
          const product = await productService.getProductById(id);
          set({
            currentProduct: product,
            loading: false,
          });
          return product;
        } catch (error) {
          set({
            error: error.response?.data?.message || 'Error al cargar producto',
            loading: false,
          });
          throw error;
        }
      },

      // Crear nuevo producto
      createProduct: async (productData) => {
        set({ loading: true, error: null });
        try {
          const newProduct = await productService.createProduct(productData);
          
          set((state) => ({
            products: [newProduct, ...state.products],
            loading: false,
          }));
          
          return newProduct;
        } catch (error) {
          set({
            error: error.response?.data?.message || 'Error al crear producto',
            loading: false,
          });
          throw error;
        }
      },

      // Actualizar producto existente
      updateProduct: async (id, productData) => {
        set({ loading: true, error: null });
        try {
          const updatedProduct = await productService.updateProduct(id, productData);
          
          set((state) => ({
            products: state.products.map(product =>
              product.id === id ? updatedProduct : product
            ),
            currentProduct: state.currentProduct?.id === id ? updatedProduct : state.currentProduct,
            loading: false,
          }));
          
          return updatedProduct;
        } catch (error) {
          set({
            error: error.response?.data?.message || 'Error al actualizar producto',
            loading: false,
          });
          throw error;
        }
      },

      // Eliminar producto
      deleteProduct: async (id) => {
        set({ loading: true, error: null });
        try {
          await productService.deleteProduct(id);
          
          set((state) => ({
            products: state.products.filter(product => product.id !== id),
            currentProduct: state.currentProduct?.id === id ? null : state.currentProduct,
            loading: false,
          }));
        } catch (error) {
          set({
            error: error.response?.data?.message || 'Error al eliminar producto',
            loading: false,
          });
          throw error;
        }
      },

      // Obtener categorías
      fetchCategories: async () => {
        try {
          const categories = await productService.getCategories();
          set({ categories });
          return categories;
        } catch (error) {
          console.error('Error al cargar categorías:', error);
        }
      },

      // Actualizar stock de producto
      updateProductStock: async (id, stockData) => {
        set({ loading: true, error: null });
        try {
          const updatedProduct = await productService.updateStock(id, stockData);
          
          set((state) => ({
            products: state.products.map(product =>
              product.id === id ? { ...product, ...updatedProduct } : product
            ),
            loading: false,
          }));
          
          return updatedProduct;
        } catch (error) {
          set({
            error: error.response?.data?.message || 'Error al actualizar stock',
            loading: false,
          });
          throw error;
        }
      },

      // Obtener productos con stock bajo
      fetchLowStockProducts: async (threshold = 10) => {
        set({ loading: true, error: null });
        try {
          const lowStockProducts = await productService.getLowStockProducts(threshold);
          set({ loading: false });
          return lowStockProducts;
        } catch (error) {
          set({
            error: error.response?.data?.message || 'Error al cargar productos con stock bajo',
            loading: false,
          });
          throw error;
        }
      },

      // Limpiar producto actual
      clearCurrentProduct: () => set({ currentProduct: null }),

      // Reset del store
      reset: () => set({
        products: [],
        categories: [],
        currentProduct: null,
        loading: false,
        error: null,
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
        },
        filters: {
          search: '',
          category: '',
          sortBy: 'name',
          sortOrder: 'asc',
        },
      }),
    }),
    {
      name: 'product-store', // Nombre para DevTools
    }
  )
);

export default useProductStore;

