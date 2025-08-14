import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { supplierService } from '@/services/supplierService';

const useSupplierStore = create(
  devtools(
    (set, get) => ({
      suppliers: [],
      loading: false,
      error: null,
      pagination: {},

      clearSuppliers: () => set({ suppliers: [], pagination: {}, error: null }),

      fetchSuppliers: async (page = 1, pageSize = 10, search = '') => {
        set({ loading: true, error: null });
        try {
          let result = await supplierService.getSuppliers({ page, limit: pageSize, search });
          // Asegurar estructura consistente del servicio
          if (!result) {
            result = { success: false, data: null, error: 'Respuesta vacía del servicio' };
          }

          if (result.success === false) {
            set({ error: result.error || 'Error al obtener proveedores', loading: false });
            return;
          }

          const raw = result.data;

          // Detectar si viene paginado con { data, pagination }
          const hasPagination = raw && typeof raw === 'object' && Array.isArray(raw.data) && raw.pagination;

          // Normalizar la lista de proveedores
          let list = [];
          if (hasPagination) {
            list = Array.isArray(raw.data) ? raw.data : [];
          } else if (Array.isArray(raw)) {
            list = raw;
          } else if (raw && Array.isArray(raw.results)) {
            list = raw.results;
          } else if (raw && typeof raw === 'object') {
            // A veces el backend puede devolver un único objeto
            list = [raw];
          } else {
            list = [];
          }

          // Filtrar nulos/indefinidos
          const safeList = list.filter(Boolean);

          set({
            suppliers: safeList,
            pagination: hasPagination
              ? raw.pagination
              : {
                  current_page: page,
                  per_page: safeList.length,
                  total: safeList.length,
                  total_pages: 1,
                },
            loading: false,
          });
        } catch (error) {
          set({ error: error.message || 'Error inesperado al obtener proveedores', loading: false });
        }
      },

      createSupplier: async (supplierData) => {
        set({ loading: true });
        try {
          const result = await supplierService.createSupplier(supplierData);
          if (result && result.success === false) {
            throw new Error(result.error || 'Error al crear el proveedor');
          }
          const newSupplier = result?.data ?? result; // compat
          set((state) => ({ suppliers: [...state.suppliers, newSupplier], loading: false }));
          return newSupplier;
        } catch (error) {
          set({ loading: false, error: error.message || 'Error al crear el proveedor' });
          throw error;
        }
      },

      updateSupplier: async (id, supplierData) => {
        set({ loading: true });
        try {
          const result = await supplierService.updateSupplier(id, supplierData);
          if (result && result.success === false) {
            throw new Error(result.error || 'Error al actualizar el proveedor');
          }
          const updatedSupplier = result?.data ?? result; // compat
          set((state) => ({
            suppliers: state.suppliers.map((s) => (s.id === id ? updatedSupplier : s)),
            loading: false,
          }));
          return updatedSupplier;
        } catch (error) {
          set({ loading: false, error: error.message || 'Error al actualizar el proveedor' });
          throw error;
        }
      },

      deleteSupplier: async (id) => {
        set({ loading: true });
        try {
          const result = await supplierService.deleteSupplier(id);
          if (result && result.success === false) {
            throw new Error(result.error || 'Error al eliminar el proveedor');
          }
          set((state) => ({
            suppliers: state.suppliers.filter((s) => s.id !== id),
            loading: false,
          }));
          return true;
        } catch (error) {
          set({ loading: false, error: error.message || 'Error al eliminar el proveedor' });
          throw error;
        }
      },
    }),
    { name: 'supplier-store' }
  )
);

export default useSupplierStore;
