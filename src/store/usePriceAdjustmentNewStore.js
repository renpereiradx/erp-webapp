/**
 * Store Zustand para Ajuste de Precios Nuevo - Patrón MVP
 * Página de búsqueda y selección de productos para ajuste de precios
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import useProductStore from '@/store/useProductStore';
import { priceAdjustmentService } from '@/services/priceAdjustmentService';
import { telemetry } from '@/utils/telemetry';

const usePriceAdjustmentNewStore = create(
  devtools(
    (set, get) => ({
      // Estado simple (NO normalizar en MVP)
      products: [],
      selectedProduct: null,
      loading: false,
      creating: false,
      error: null,
      searchTerm: '',
      pagination: {
        page: 1,
        page_size: 10,
        total: 0,
        total_pages: 0
      },

      // Acciones básicas
      clearError: () => set({ error: null }),

      clearProducts: () => set({ products: [], error: null, pagination: { page: 1, page_size: 10, total: 0, total_pages: 0 } }),

      setSearchTerm: (term) => set({ searchTerm: term }),

      setSelectedProduct: (product) => set({ selectedProduct: product }),

      clearSelectedProduct: () => set({ selectedProduct: null }),

      // Buscar productos usando el store de productos
      searchProducts: async (searchTerm = '', page = 1, pageSize = 10) => {
        set({ loading: true, error: null });
        const startTime = Date.now();

        try {
          // Usar el searchProducts del store de productos que ya tiene la lógica de búsqueda
          const productStore = useProductStore.getState();
          const result = await productStore.searchProducts(searchTerm, { limit: pageSize });

          // Manejar diferentes formatos de respuesta
          let products = [];
          let pagination = { page: 1, page_size: pageSize, total: 0, total_pages: 0 };

          if (result && !result.circuitOpen) {
            // Filtrar solo productos activos
            const allProducts = result.data || [];
            products = allProducts.filter(product => {
              // Un producto está activo si ninguno de estos campos es false
              return product.state !== false && product.is_active !== false;
            });

            const total = products.length;
            pagination = {
              page: page,
              page_size: pageSize,
              total: total,
              total_pages: Math.ceil(total / pageSize)
            };
          }

          set({
            products,
            pagination,
            loading: false,
            searchTerm
          });

          telemetry.record('feature.priceAdjustmentNew.search', {
            duration: Date.now() - startTime,
            count: products.length,
            searchTerm
          });

          return { success: true, data: products };
        } catch (error) {
          const errorMessage = error.message || 'Error al buscar productos';
          set({ error: errorMessage, loading: false });

          telemetry.record('feature.priceAdjustmentNew.error', {
            error: errorMessage,
            operation: 'searchProducts'
          });

          return { success: false, error: errorMessage };
        }
      },

      // Cambiar página
      changePage: async (newPage) => {
        const { searchTerm, pagination } = get();
        if (newPage < 1 || newPage > pagination.total_pages) {
          return;
        }
        await get().searchProducts(searchTerm, newPage, pagination.page_size);
      },

      // Seleccionar producto para ajuste de precio
      selectProductForAdjustment: async (productId) => {
        set({ loading: true, error: null });

        try {
          // Usar el fetchProductById del store de productos
          const productStore = useProductStore.getState();
          const product = await productStore.fetchProductById(productId);

          set({
            selectedProduct: product,
            loading: false
          });

          telemetry.record('feature.priceAdjustmentNew.selectProduct', {
            productId
          });

          return { success: true, data: product };
        } catch (error) {
          const errorMessage = error.message || 'Error al cargar producto';
          set({ error: errorMessage, loading: false });

          telemetry.record('feature.priceAdjustmentNew.error', {
            error: errorMessage,
            operation: 'selectProduct',
            productId
          });

          return { success: false, error: errorMessage };
        }
      },

      // Crear ajuste de precio
      createPriceAdjustment: async (adjustmentData) => {
        set({ creating: true, error: null });
        const startTime = Date.now();

        try {
          const result = await priceAdjustmentService.createPriceAdjustment(adjustmentData);

          set({ creating: false });

          telemetry.record('feature.priceAdjustmentNew.create', {
            duration: Date.now() - startTime,
            productId: adjustmentData.product_id
          });

          return { success: true, data: result };
        } catch (error) {
          const errorMessage = error.message || 'Error al crear ajuste de precio';
          set({ error: errorMessage, creating: false });

          telemetry.record('feature.priceAdjustmentNew.error', {
            error: errorMessage,
            operation: 'createAdjustment'
          });

          return { success: false, error: errorMessage };
        }
      },

      // Resetear todo el estado del store
      resetState: () => {
        set({
          products: [],
          selectedProduct: null,
          loading: false,
          creating: false,
          error: null,
          searchTerm: '',
          pagination: {
            page: 1,
            page_size: 10,
            total: 0,
            total_pages: 0
          }
        });

        // También limpiar el estado del product store para evitar contaminación
        const productStore = useProductStore.getState();
        productStore.clearSearchState();

        telemetry.record('feature.priceAdjustmentNew.resetState');
      }
    }),
    {
      name: 'price-adjustment-new-store', // Para DevTools
    }
  )
);

export default usePriceAdjustmentNewStore;
