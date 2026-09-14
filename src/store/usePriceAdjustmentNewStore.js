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

      // Buscar unidades vendibles (variantes planas) para ajuste de precios
      searchProducts: async (searchTerm = '', page = 1, pageSize = 10) => {
        set({ loading: true, error: null });
        const startTime = Date.now();

        try {
          // Búsqueda plana (granularity=variant,
          // PLAN_VARIANTES_PLANAS_AJUSTES_PRODUCTOS F-A): cada fila es una
          // unidad vendible — variante o producto — con su precio efectivo
          // (current_price variante-primero, fallback padre). La variante
          // llega elegida: sin segundo paso. El término matchea también
          // SKU/código de variante. Paginación server-side real.
          const response = await productService.searchAdvanced({
            search: searchTerm.trim() || undefined,
            granularity: 'variant',
            page,
            page_size: pageSize,
          });

          const rows = Array.isArray(response?.products) ? response.products : [];
          const products = rows.filter(product => product.state !== false);
          const total = response?.total_count ?? products.length;
          const pagination = {
            page,
            page_size: pageSize,
            total,
            total_pages: Math.max(1, Math.ceil(total / pageSize)),
          };

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
      createPriceAdjustment: async adjustmentData => {
        set({ creating: true, error: null })
        const startTime = Date.now()

        try {
          const result = await priceAdjustmentService.createPriceAdjustment(
            adjustmentData,
          )

          set({ creating: false })

          if (result.success) {
            telemetry.record('feature.priceAdjustmentNew.create', {
              duration: Date.now() - startTime,
              productId: adjustmentData.product_id,
            })
            return result
          } else {
            const errorMessage =
              result.message || result.error || 'Error al crear ajuste de precio'
            set({ error: errorMessage, creating: false })
            return result
          }
        } catch (error) {
          const errorMessage =
            error.message || 'Error al crear ajuste de precio'
          set({ error: errorMessage, creating: false })

          telemetry.record('feature.priceAdjustmentNew.error', {
            error: errorMessage,
            operation: 'createAdjustment',
          })

          return { success: false, error: errorMessage }
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
