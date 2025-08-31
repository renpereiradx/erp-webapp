import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import supplierService from '../services/supplierService';

const useSupplierStore = create()(
  devtools(
    (set, get) => ({
      suppliers: [],
      loading: false,
      error: null,

      fetchSuppliers: async () => {
        set({ loading: true, error: null });
        try {
          const result = await supplierService.getAll();
          let data = [];
          if (result.success !== false) {
            const raw = result.data || result;
            data = raw.suppliers || (Array.isArray(raw) ? raw : []);
          }
          set({ suppliers: data, loading: false });
        } catch (error) {
          set({ error: error.message, loading: false });
        }
      },

      createSupplier: async (data) => {
        set({ loading: true });
        try {
          await supplierService.create(data);
          get().fetchSuppliers(); // Refresh list
        } catch (error) {
          set({ error: error.message, loading: false });
        }
      },

      updateSupplier: async (id, data) => {
        set({ loading: true });
        try {
          await supplierService.update(id, data);
          get().fetchSuppliers(); // Refresh list
        } catch (error) {
          set({ error: error.message, loading: false });
        }
      },

      deleteSupplier: async (id) => {
        set({ loading: true });
        try {
          await supplierService.delete(id);
          get().fetchSuppliers(); // Refresh list
        } catch (error) {
          set({ error: error.message, loading: false });
        }
      },

      clearError: () => set({ error: null }),
    }),
    { name: 'supplier-store' }
  )
);

export default useSupplierStore;