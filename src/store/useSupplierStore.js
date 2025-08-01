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
          let response = await supplierService.getSuppliers({ page, limit: pageSize, search });
          // Si la búsqueda no devuelve nada, la API puede retornar null. Lo normalizamos a un array vacío.
          if (!response) {
            response = [];
          }

          // Si la respuesta tiene una propiedad 'data' y 'pagination', la usamos
          // de lo contrario, asumimos que la respuesta es directamente el array de proveedores
          const isPaginated = response.data && response.pagination;
          
          set({
            suppliers: isPaginated ? response.data.filter(s => s) : response.filter(s => s),
            pagination: isPaginated ? response.pagination : {
              current_page: 1,
              per_page: response.length,
              total: response.length,
              total_pages: 1,
            },
            loading: false,
          });
        } catch (error) {
          set({ error: error.message, loading: false });
        }
      },

      createSupplier: async (supplierData) => {
        set({ loading: true });
        try {
          const newSupplier = await supplierService.createSupplier(supplierData);
          set((state) => ({ suppliers: [...state.suppliers, newSupplier], loading: false }));
        } catch (error) {
          set({ loading: false, error: error.message });
          throw error;
        }
      },

      updateSupplier: async (id, supplierData) => {
        set({ loading: true });
        try {
          const updatedSupplier = await supplierService.updateSupplier(id, supplierData);
          set((state) => ({
            suppliers: state.suppliers.map((s) => (s.id === id ? updatedSupplier : s)),
            loading: false,
          }));
        } catch (error) {
          set({ loading: false, error: error.message });
          throw error;
        }
      },

      deleteSupplier: async (id) => {
        set({ loading: true });
        try {
          await supplierService.deleteSupplier(id);
          set((state) => ({ 
            suppliers: state.suppliers.filter((s) => s.id !== id),
            loading: false 
          }));
        } catch (error) {
          set({ loading: false, error: error.message });
          throw error;
        }
      },
    }),
    { name: 'supplier-store' }
  )
);

export default useSupplierStore;
