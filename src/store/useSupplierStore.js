import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { supplierService } from '@/services/supplierService';

const useSupplierStore = create(
  devtools(
    (set) => ({
      suppliers: [],
      loading: false,
      error: null,
      pagination: {},

      fetchSuppliers: async (page = 1, pageSize = 10) => {
        set({ loading: true, error: null });
        try {
          const response = await supplierService.getSuppliers({ page, limit: pageSize });
          set({ suppliers: response.data, pagination: response.pagination, loading: false });
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
