/**
 * Store para gestión de inventarios y transacciones de stock
 * Siguiendo patrón MVP: simple, directo, sin optimizaciones prematuras
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { inventoryService } from '@/services/inventoryService';
import { telemetryService } from '@/services/telemetryService';

const useInventoryStore = create(
  devtools(
    (set, get) => ({
      // Estado simple (NO normalizar en MVP)
      inventories: [],
      stockTransactions: [],
      selectedInventory: null,
      loading: false,
      error: null,

      // Estados específicos para operaciones
      loadingCreate: false,
      loadingValidate: false,

      // Acciones básicas
      clearError: () => set({ error: null }),
      
      clearInventories: () => set({ inventories: [], error: null }),
      
      clearTransactions: () => set({ stockTransactions: [], error: null }),

      // Cargar inventarios
      fetchInventories: async (page = 1, pageSize = 10) => {
        set({ loading: true, error: null });
        const startTime = Date.now();

        try {
          const result = await inventoryService.getInventories(page, pageSize);

          // Manejar diferentes formatos de respuesta
          let data = [];
          if (result.success !== false) {
            const raw = result.inventories || result.data || result;
            data = Array.isArray(raw) ? raw :
                   Array.isArray(raw?.inventories) ? raw.inventories :
                   Array.isArray(raw?.data) ? raw.data : [];
          }

          set({ inventories: data, loading: false });

          telemetryService.recordEvent('inventory_fetch_success', {
            duration: Date.now() - startTime,
            count: data.length,
            page,
            pageSize
          });

        } catch (error) {
          set({ error: error.message || 'Error al cargar inventarios', loading: false });
          telemetryService.recordEvent('inventory_fetch_error', {
            error: error.message,
            operation: 'fetchInventories'
          });
        }
      },

      // Cargar historial de inventarios usando endpoint específico
      fetchInventoryHistory: async (page = 1, pageSize = 5) => {
        set({ loading: true, error: null });
        const startTime = Date.now();

        try {
          const result = await inventoryService.getInventoryHistory(page, pageSize);

          // Normalizar respuesta
          let data = [];
          if (result.success !== false) {
            data = result.data || [];
          }

          set({ inventories: data, loading: false });

          telemetryService.recordEvent('inventory_history_fetch_success', {
            duration: Date.now() - startTime,
            count: data.length,
            page,
            pageSize
          });

          return { success: true, data, pagination: result.pagination };

        } catch (error) {
          set({ error: error.message || 'Error al cargar historial de inventarios', loading: false });
          telemetryService.recordEvent('inventory_history_fetch_error', {
            error: error.message,
            operation: 'fetchInventoryHistory'
          });
          return { success: false, error: error.message };
        }
      },

      // Obtener detalles de un inventario específico
      fetchInventoryDetails: async (inventoryId) => {
        set({ loading: true, error: null });
        const startTime = Date.now();
        
        try {
          const result = await inventoryService.getInventoryDetails(inventoryId);
          
          if (result.success !== false) {
            set({ selectedInventory: result, loading: false });
            
            telemetryService.recordEvent('inventory_details_success', {
              duration: Date.now() - startTime,
              inventoryId
            });
            
            return { success: true, data: result };
          }
        } catch (error) {
          set({ error: error.message || 'Error al cargar detalles', loading: false });
          telemetryService.recordEvent('inventory_details_error', {
            error: error.message,
            operation: 'fetchInventoryDetails'
          });
          return { success: false, error: error.message };
        }
      },

      // Crear inventario masivo
      createInventory: async (inventoryData) => {
        set({ loadingCreate: true, error: null });
        const startTime = Date.now();

        try {
          const result = await inventoryService.createInventory(inventoryData);

          if (result.success !== false) {
            // Recargar lista después de crear
            get().fetchInventories();

            telemetryService.recordEvent('inventory_create_success', {
              duration: Date.now() - startTime,
              itemsCount: inventoryData.products?.length || inventoryData.details?.length || 0,
              inventory_id: result.inventory_id
            });

            set({ loadingCreate: false });

            // Return response with inventory_id and message from server
            return {
              success: true,
              data: result.data,
              message: result.message,
              inventory_id: result.inventory_id
            };
          }
        } catch (error) {
          set({ error: error.message || 'Error al crear inventario', loadingCreate: false });
          telemetryService.recordEvent('inventory_create_error', {
            error: error.message,
            operation: 'createInventory'
          });
          return { success: false, error: error.message };
        }
      },

      // Invalidar inventario
      invalidateInventory: async (inventoryId) => {
        set({ loading: true, error: null });
        const startTime = Date.now();
        
        try {
          const result = await inventoryService.invalidateInventory(inventoryId);
          
          if (result.success !== false) {
            // Recargar lista después de invalidar
            get().fetchInventories();
            
            telemetryService.recordEvent('inventory_invalidate_success', {
              duration: Date.now() - startTime,
              inventoryId
            });
            
            set({ loading: false });
            return { success: true };
          }
        } catch (error) {
          set({ error: error.message || 'Error al invalidar inventario', loading: false });
          telemetryService.recordEvent('inventory_invalidate_error', {
            error: error.message,
            operation: 'invalidateInventory'
          });
          return { success: false, error: error.message };
        }
      },

      // === Transacciones de Stock ===
      
      // Cargar historial de transacciones por producto
      fetchProductTransactions: async (productId, limit = 20, offset = 0) => {
        set({ loading: true, error: null });
        const startTime = Date.now();
        
        try {
          const result = await inventoryService.getProductTransactionHistory(productId, limit, offset);
          
          let data = [];
          if (result.success !== false) {
            data = Array.isArray(result) ? result : result.data || [];
          }
          
          set({ stockTransactions: data, loading: false });
          
          telemetryService.recordEvent('inventory_transactions_success', {
            duration: Date.now() - startTime,
            productId,
            count: data.length
          });
          
        } catch (error) {
          set({ error: error.message || 'Error al cargar transacciones', loading: false });
          telemetryService.recordEvent('inventory_transactions_error', {
            error: error.message,
            operation: 'fetchProductTransactions'
          });
        }
      },

      // Registrar nueva transacción de stock
      createStockTransaction: async (transactionData) => {
        set({ loadingCreate: true, error: null });
        const startTime = Date.now();
        
        try {
          const result = await inventoryService.createStockTransaction(transactionData);
          
          if (result.success !== false) {
            telemetryService.recordEvent('inventory_transaction_create_success', {
              duration: Date.now() - startTime,
              transactionType: transactionData.transaction_type
            });
            
            set({ loadingCreate: false });
            return { success: true, data: result };
          }
        } catch (error) {
          set({ error: error.message || 'Error al registrar transacción', loadingCreate: false });
          telemetryService.recordEvent('inventory_transaction_create_error', {
            error: error.message,
            operation: 'createStockTransaction'
          });
          return { success: false, error: error.message };
        }
      },

      // Crear ajuste manual de stock
      createManualAdjustment: async (adjustmentData) => {
        set({ loadingCreate: true, error: null });
        const startTime = Date.now();
        
        try {
          const result = await inventoryService.createManualAdjustment(adjustmentData);
          
          if (result.success !== false) {
            telemetryService.recordEvent('inventory_adjustment_create_success', {
              duration: Date.now() - startTime,
              productId: adjustmentData.product_id
            });
            
            set({ loadingCreate: false });
            return { success: true, data: result };
          }
        } catch (error) {
          set({ error: error.message || 'Error al crear ajuste', loadingCreate: false });
          telemetryService.recordEvent('inventory_adjustment_create_error', {
            error: error.message,
            operation: 'createManualAdjustment'
          });
          return { success: false, error: error.message };
        }
      },

      // Validar consistencia de stock
      validateStockConsistency: async (productId = null) => {
        set({ loadingValidate: true, error: null });
        const startTime = Date.now();
        
        try {
          const result = await inventoryService.validateStockConsistency(productId);
          
          if (result.success !== false) {
            telemetryService.recordEvent('inventory_validate_consistency_success', {
              duration: Date.now() - startTime,
              productId: productId || 'all'
            });
            
            set({ loadingValidate: false });
            return { success: true, data: result };
          }
        } catch (error) {
          set({ error: error.message || 'Error al validar consistencia', loadingValidate: false });
          telemetryService.recordEvent('inventory_validate_consistency_error', {
            error: error.message,
            operation: 'validateStockConsistency'
          });
          return { success: false, error: error.message };
        }
      },

      // Obtener tipos de transacciones disponibles
      getTransactionTypes: async () => {
        try {
          const result = await inventoryService.getTransactionTypes();
          return { success: true, data: result };
        } catch (error) {
          telemetryService.recordEvent('inventory_transaction_types_error', {
            error: error.message,
            operation: 'getTransactionTypes'
          });
          return { success: false, error: error.message };
        }
      },

      // === Métodos Adicionales según Documentación ===

      // Obtener historial de ajustes manuales por producto
      getManualAdjustmentHistory: async (productId, limit = 50, offset = 0) => {
        set({ loading: true, error: null });
        const startTime = Date.now();
        
        try {
          const result = await inventoryService.getManualAdjustmentHistory(productId, limit, offset);
          
          telemetryService.recordEvent('inventory_manual_adjustment_history_success', {
            duration: Date.now() - startTime,
            productId,
            count: result?.length || 0
          });
          
          set({ loading: false });
          return { success: true, data: result };
        } catch (error) {
          set({ error: error.message || 'Error al cargar historial de ajustes', loading: false });
          telemetryService.recordEvent('inventory_manual_adjustment_history_error', {
            error: error.message,
            operation: 'getManualAdjustmentHistory'
          });
          return { success: false, error: error.message };
        }
      },

      // Obtener transacciones por rango de fechas
      getStockTransactionsByDate: async (startDate, endDate, type = null, limit = 50, offset = 0) => {
        set({ loading: true, error: null });
        const startTime = Date.now();
        
        try {
          const result = await inventoryService.getStockTransactionsByDate(startDate, endDate, type, limit, offset);
          
          telemetryService.recordEvent('inventory_transactions_by_date_success', {
            duration: Date.now() - startTime,
            startDate,
            endDate,
            type,
            count: result?.length || 0
          });
          
          set({ loading: false });
          return { success: true, data: result };
        } catch (error) {
          set({ error: error.message || 'Error al cargar transacciones por fecha', loading: false });
          telemetryService.recordEvent('inventory_transactions_by_date_error', {
            error: error.message,
            operation: 'getStockTransactionsByDate'
          });
          return { success: false, error: error.message };
        }
      },

      // Obtener transacción por ID
      getStockTransactionById: async (transactionId) => {
        set({ loading: true, error: null });
        const startTime = Date.now();
        
        try {
          const result = await inventoryService.getStockTransactionById(transactionId);
          
          telemetryService.recordEvent('inventory_transaction_by_id_success', {
            duration: Date.now() - startTime,
            transactionId
          });
          
          set({ loading: false });
          return { success: true, data: result };
        } catch (error) {
          set({ error: error.message || 'Error al cargar transacción', loading: false });
          telemetryService.recordEvent('inventory_transaction_by_id_error', {
            error: error.message,
            operation: 'getStockTransactionById'
          });
          return { success: false, error: error.message };
        }
      },

      // Obtener reporte de discrepancias de inventario
      getInventoryDiscrepancies: async (dateFrom = null, dateTo = null) => {
        set({ loading: true, error: null });
        const startTime = Date.now();
        
        try {
          const result = await inventoryService.getInventoryDiscrepancies(dateFrom, dateTo);
          
          telemetryService.recordEvent('inventory_discrepancies_success', {
            duration: Date.now() - startTime,
            dateFrom,
            dateTo,
            count: result?.length || 0
          });
          
          set({ loading: false });
          return { success: true, data: result };
        } catch (error) {
          set({ error: error.message || 'Error al cargar discrepancias', loading: false });
          telemetryService.recordEvent('inventory_discrepancies_error', {
            error: error.message,
            operation: 'getInventoryDiscrepancies'
          });
          return { success: false, error: error.message };
        }
      },

      // Verificar integridad del sistema
      checkSystemIntegrity: async () => {
        set({ loading: true, error: null });
        const startTime = Date.now();
        
        try {
          const result = await inventoryService.checkSystemIntegrity();
          
          telemetryService.recordEvent('inventory_system_integrity_success', {
            duration: Date.now() - startTime
          });
          
          set({ loading: false });
          return { success: true, data: result };
        } catch (error) {
          set({ error: error.message || 'Error al verificar integridad', loading: false });
          telemetryService.recordEvent('inventory_system_integrity_error', {
            error: error.message,
            operation: 'checkSystemIntegrity'
          });
          return { success: false, error: error.message };
        }
      }
    }),
    {
      name: 'inventory-store', // Para DevTools
    }
  )
);

export default useInventoryStore;