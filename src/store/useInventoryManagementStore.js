/**
 * Store Zustand para Gestión de Inventarios Masivos - Patrón MVP
 * Maneja la lista de inventarios, paginación y operaciones CRUD
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { inventoryService } from '@/services/inventoryService';
import { telemetry } from '@/utils/telemetry';

const useInventoryManagementStore = create(
  devtools(
    (set, get) => ({
      // Estado
      inventories: [],
      selectedInventory: null,
      loading: false,
      error: null,
      pagination: {
        page: 1,
        pageSize: 10,
        total: 0,
        totalPages: 0,
      },

      // Acciones básicas
      clearError: () => set({ error: null }),

      setPage: (page) => {
        set((state) => ({
          pagination: { ...state.pagination, page },
        }));
      },

      // Cargar lista de inventarios
      fetchInventories: async (page = 1, pageSize = 10) => {
        set({ loading: true, error: null });
        const startTime = Date.now();

        try {
          const result = await inventoryService.getInventories(page, pageSize);

          // La API devuelve directamente un array de inventarios
          let inventories = [];

          if (result.success && result.data) {
            inventories = Array.isArray(result.data) ? result.data : [];
          } else if (Array.isArray(result)) {
            // Si la API devuelve directamente el array
            inventories = result;
          }

          set({
            inventories,
            pagination: {
              page,
              pageSize,
              total: inventories.length,
              totalPages: Math.ceil(inventories.length / pageSize),
            },
            loading: false,
          });

          telemetry.record('feature.inventoryManagement.fetchInventories', {
            duration: Date.now() - startTime,
            count: inventories.length,
            page,
          });

          return { success: true, data: inventories };
        } catch (error) {
          const errorMessage = error.message || 'Error al cargar inventarios';
          set({ error: errorMessage, loading: false, inventories: [] });

          telemetry.record('feature.inventoryManagement.error', {
            error: errorMessage,
            operation: 'fetchInventories',
          });

          return { success: false, error: errorMessage };
        }
      },

      // Obtener detalles de un inventario
      fetchInventoryDetails: async (inventoryId) => {
        set({ loading: true, error: null });
        const startTime = Date.now();

        try {
          const result = await inventoryService.getInventoryDetails(inventoryId);

          // La API devuelve { Inventory: {...}, Items: [...] } con mayúsculas
          let selectedInventory = null;

          if (result.success && result.data) {
            selectedInventory = result.data;
          } else if (result.Inventory && result.Items) {
            // Si la API devuelve directamente con mayúsculas, normalizar
            selectedInventory = {
              inventory: result.Inventory,
              items: result.Items,
            };
          }

          if (selectedInventory) {
            set({
              selectedInventory,
              loading: false,
            });

            telemetry.record('feature.inventoryManagement.fetchDetails', {
              duration: Date.now() - startTime,
              inventoryId,
            });

            return { success: true, data: selectedInventory };
          }

          throw new Error('No se pudo cargar los detalles del inventario');
        } catch (error) {
          const errorMessage = error.message || 'Error al cargar detalles';
          set({ error: errorMessage, loading: false });

          telemetry.record('feature.inventoryManagement.error', {
            error: errorMessage,
            operation: 'fetchDetails',
            inventoryId,
          });

          return { success: false, error: errorMessage };
        }
      },

      // Crear nuevo inventario
      createInventory: async (inventoryData) => {
        set({ loading: true, error: null });
        const startTime = Date.now();

        // Validación adicional en el store
        if (!inventoryData.items || inventoryData.items.length === 0) {
          const errorMessage = 'No se pueden crear inventarios sin productos';
          set({ error: errorMessage, loading: false });
          return { success: false, error: errorMessage };
        }

        try {
          const result = await inventoryService.createInventory(inventoryData);

          if (result.success) {
            set({ loading: false });

            telemetry.record('feature.inventoryManagement.create', {
              duration: Date.now() - startTime,
              itemsCount: inventoryData.items?.length || 0,
            });

            // Recargar la lista después de crear
            await get().fetchInventories(get().pagination.page, get().pagination.pageSize);

            return { success: true, data: result.data };
          }

          throw new Error(result.error || 'Error al crear inventario');
        } catch (error) {
          const errorMessage = error.message || 'Error al crear inventario';
          set({ error: errorMessage, loading: false });

          telemetry.record('feature.inventoryManagement.error', {
            error: errorMessage,
            operation: 'createInventory',
          });

          return { success: false, error: errorMessage };
        }
      },

      // Invalidar inventario
      invalidateInventory: async (inventoryId) => {
        set({ loading: true, error: null });
        const startTime = Date.now();

        try {
          const result = await inventoryService.invalidateInventory(inventoryId);

          if (result.success) {
            set({ loading: false });

            telemetry.record('feature.inventoryManagement.invalidate', {
              duration: Date.now() - startTime,
              inventoryId,
            });

            // Recargar la lista después de invalidar
            await get().fetchInventories(get().pagination.page, get().pagination.pageSize);

            return { success: true };
          }

          throw new Error(result.error || 'Error al invalidar inventario');
        } catch (error) {
          const errorMessage = error.message || 'Error al invalidar inventario';
          set({ error: errorMessage, loading: false });

          telemetry.record('feature.inventoryManagement.error', {
            error: errorMessage,
            operation: 'invalidateInventory',
            inventoryId,
          });

          return { success: false, error: errorMessage };
        }
      },

      // Limpiar inventario seleccionado
      clearSelectedInventory: () => {
        set({ selectedInventory: null });
      },

      // Resetear todo el estado
      resetState: () => {
        set({
          inventories: [],
          selectedInventory: null,
          loading: false,
          error: null,
          pagination: {
            page: 1,
            pageSize: 10,
            total: 0,
            totalPages: 0,
          },
        });

        telemetry.record('feature.inventoryManagement.resetState');
      },
    }),
    {
      name: 'inventory-management-store', // Para DevTools
    }
  )
);

export default useInventoryManagementStore;
