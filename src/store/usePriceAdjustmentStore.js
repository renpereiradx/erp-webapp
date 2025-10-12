/**
 * Store Zustand para Manual Price Adjustments - Patrón MVP
 * Seguindo arquitectura simplificada para desarrollo rápido
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { priceAdjustmentService } from '@/services/priceAdjustmentService';
import { telemetry } from '@/utils/telemetry';

const usePriceAdjustmentStore = create(
  devtools(
    (set, get) => ({
      // Estado simple (NO normalizar en MVP)
      adjustments: [],
      productHistory: {},
      loading: false,
      error: null,
      creating: false,

      // Acciones básicas
      clearError: () => set({ error: null }),
      
      clearAdjustments: () => set({ adjustments: [], error: null }),

      // Crear ajuste de precio
      createPriceAdjustment: async (adjustmentData) => {
        set({ creating: true, error: null });
        const startTime = Date.now();
        
        try {
          const result = await priceAdjustmentService.createPriceAdjustment(adjustmentData);
          
          // Si se creó exitosamente, agregarlo a la lista local
          if (result && result.id) {
            const currentAdjustments = get().adjustments;
            set({ 
              adjustments: [result, ...currentAdjustments],
              creating: false 
            });

            // Invalidar cache de productos para que se reflejen los cambios de precio
            try {
              // Importar dinámicamente el store para evitar dependencias circulares
              const { default: useProductStore } = await import('./useProductStore');
              const productStore = useProductStore.getState();
              
              // Invalidar cache del producto con precio actualizado
              if (productStore.invalidateProductCache) {
                productStore.invalidateProductCache(adjustmentData.product_id);
              }
              
              telemetry.record('products.cache.invalidated_after_price_change', { 
                productId: adjustmentData.product_id 
              });
            } catch (err) {
              console.warn('No se pudo invalidar cache de productos:', err);
            }
          } else {
            set({ creating: false });
          }
          
          telemetry.record('feature.priceAdjustment.create', { 
            duration: Date.now() - startTime,
            productId: adjustmentData.product_id,
            newPrice: adjustmentData.new_price
          });
          
          return { success: true, data: result };
        } catch (error) {
          const errorMessage = error.message || 'Error al crear ajuste de precio';
          set({ error: errorMessage, creating: false });
          
          telemetry.record('feature.priceAdjustment.error', { 
            error: errorMessage,
            operation: 'create'
          });
          
          return { success: false, error: errorMessage };
        }
      },

      // Obtener historial de ajustes de un producto
      fetchProductHistory: async (productId, options = {}) => {
        set({ loading: true, error: null });
        const startTime = Date.now();
        const { limit = 10, offset = 0 } = options;
        
        try {
          const result = await priceAdjustmentService.getProductHistory(productId, limit, offset);
          
          // Manejar diferentes formatos de respuesta
          let history = [];
          if (result && result.history) {
            history = Array.isArray(result.history) ? result.history : [];
          } else if (Array.isArray(result)) {
            history = result;
          }
          
          // Actualizar cache de historial por producto
          set(state => ({
            productHistory: {
              ...state.productHistory,
              [productId]: {
                ...history,
                lastFetch: Date.now(),
                limit,
                offset,
                hasMore: history.length === limit
              }
            },
            loading: false
          }));
          
          telemetry.record('feature.priceAdjustment.fetchHistory', { 
            duration: Date.now() - startTime,
            productId,
            count: history.length
          });
          
          return { success: true, data: history };
        } catch (error) {
          const errorMessage = error.message || 'Error al cargar historial';
          set({ error: errorMessage, loading: false });
          
          telemetry.record('feature.priceAdjustment.error', { 
            error: errorMessage,
            operation: 'fetchHistory',
            productId
          });
          
          return { success: false, error: errorMessage };
        }
      },

      // Obtener todos los ajustes recientes (para dashboard)
      fetchRecentAdjustments: async (limit = 20) => {
        set({ loading: true, error: null });
        const startTime = Date.now();
        
        try {
          // Como la API no tiene endpoint para "todos los ajustes", 
          // simulamos con datos demo o implementamos cuando esté disponible
          const result = await priceAdjustmentService.getRecentAdjustments(limit);
          
          let adjustments = [];
          if (result.success !== false) {
            const raw = result.data || result;
            adjustments = Array.isArray(raw) ? raw : 
                         Array.isArray(raw?.data) ? raw.data :
                         Array.isArray(raw?.results) ? raw.results : [];
          }
          
          set({ adjustments, loading: false });
          
          telemetry.record('feature.priceAdjustment.fetchRecent', { 
            duration: Date.now() - startTime,
            count: adjustments.length 
          });
          
          return { success: true, data: adjustments };
        } catch (error) {
          const errorMessage = error.message || 'Error al cargar ajustes';
          set({ error: errorMessage, loading: false });
          
          telemetry.record('feature.priceAdjustment.error', { 
            error: errorMessage,
            operation: 'fetchRecent'
          });
          
          return { success: false, error: errorMessage };
        }
      },

      // Verificar integridad del sistema
      verifySystemIntegrity: async () => {
        set({ loading: true, error: null });
        const startTime = Date.now();
        
        try {
          const result = await priceAdjustmentService.verifySystemIntegrity();
          
          telemetry.record('feature.priceAdjustment.verifyIntegrity', { 
            duration: Date.now() - startTime,
            integrationStatus: result?.integration_status || false
          });
          
          set({ loading: false });
          return { success: true, data: result };
        } catch (error) {
          const errorMessage = error.message || 'Error al verificar integridad';
          set({ error: errorMessage, loading: false });
          
          telemetry.record('feature.priceAdjustment.error', { 
            error: errorMessage,
            operation: 'verifyIntegrity'
          });
          
          return { success: false, error: errorMessage };
        }
      },

      // Limpiar historial de un producto específico
      clearProductHistory: (productId) => {
        set(state => {
          const newHistory = { ...state.productHistory };
          delete newHistory[productId];
          return { productHistory: newHistory };
        });
      },

      // Obtener historial cacheado de un producto
      getCachedProductHistory: (productId) => {
        const state = get();
        return state.productHistory[productId] || null;
      },

      // Selectors para facilitar acceso a datos
      getAdjustmentsByProduct: (productId) => {
        const state = get();
        return state.adjustments.filter(adj => adj.product_id === productId);
      },

      getRecentAdjustments: (limit = 10) => {
        const state = get();
        return state.adjustments
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, limit);
      }
    }),
    {
      name: 'price-adjustment-store', // Para DevTools
    }
  )
);

export default usePriceAdjustmentStore;
