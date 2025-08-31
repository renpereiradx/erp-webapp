import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import supplierService from '../services/supplierService';
import { telemetry } from '../utils/telemetry';
import { 
  DEMO_CONFIG_SUPPLIERS,
  getDemoSuppliers,
  getDemoSupplierStatistics,
  createDemoSupplier,
  updateDemoSupplier,
  deleteDemoSupplier
} from '../config/demoData';

const useSupplierStore = create()(
  devtools(
    (set, get) => ({
      // Estado de la lista
      suppliers: [],
      
      // Estados de carga y error
      loading: false,
      error: null,

      // Acciones básicas
      clearError: () => set({ error: null }),
      clearSuppliers: () => set({ suppliers: [], error: null }),

      fetchSuppliers: async () => {
        set({ loading: true, error: null });
        const startTime = Date.now();
        
        try {
          // Si demo está habilitado, usar datos demo
          if (DEMO_CONFIG_SUPPLIERS.enabled && !DEMO_CONFIG_SUPPLIERS.useRealAPI) {
            console.log('🏭 Suppliers: Loading demo data...');
            
            const result = await getDemoSuppliers();
            const data = result.data.suppliers || [];
            
            set({ 
              suppliers: data, 
              loading: false 
            });
            
            console.log('✅ Suppliers: Demo data loaded successfully');
            return;
          }
          
          // Si demo está deshabilitado, usar API real
          console.log('🌐 Suppliers: Loading data from API...');
          const result = await supplierService.getAll();
          let data = [];
          if (result.success !== false) {
            const raw = result.data || result;
            data = raw.suppliers || (Array.isArray(raw) ? raw : []);
          }
          set({ suppliers: data, loading: false });
          
          console.log('✅ Suppliers: API data loaded successfully');
          
          telemetry.record('feature.supplier.load', { 
            duration: Date.now() - startTime,
            count: data.length
          });
          
        } catch (error) {
          console.error('❌ Suppliers: Error loading data:', error.message);
          
          // Si falla la API y demo está habilitado como fallback
          if (DEMO_CONFIG_SUPPLIERS.enabled) {
            console.log('🔄 Suppliers: Falling back to demo data...');
            const demoResult = await getDemoSuppliers();
            const data = demoResult.data.suppliers || [];
            
            set({ 
              suppliers: data, 
              loading: false,
              error: null // Clear error since we have fallback data
            });
            console.log('✅ Suppliers: Demo fallback data loaded');
          } else {
            set({ error: error.message || 'Error al cargar', loading: false });
            telemetry.record('feature.supplier.error', { 
              error: error.message 
            });
          }
        }
      },

      createSupplier: async (data) => {
        try {
          // Si demo está habilitado, usar datos demo
          if (DEMO_CONFIG_SUPPLIERS.enabled && !DEMO_CONFIG_SUPPLIERS.useRealAPI) {
            await createDemoSupplier(data);
            get().fetchSuppliers(); // Recargar lista
            return { success: true };
          }
          
          // Si demo está deshabilitado, usar API real
          const result = await supplierService.create(data);
          if (result.success !== false) {
            get().fetchSuppliers(); // Recargar lista
          }
          return { success: true };
        } catch (error) {
          // Si falla la API y demo está habilitado como fallback
          if (DEMO_CONFIG_SUPPLIERS.enabled) {
            await createDemoSupplier(data);
            get().fetchSuppliers(); // Recargar lista
            return { success: true };
          }
          set({ error: error.message || 'Error al crear' });
          return { success: false, error: error.message };
        }
      },

      updateSupplier: async (id, data) => {
        try {
          // Si demo está habilitado, usar datos demo
          if (DEMO_CONFIG_SUPPLIERS.enabled && !DEMO_CONFIG_SUPPLIERS.useRealAPI) {
            await updateDemoSupplier(id, data);
            get().fetchSuppliers(); // Recargar lista
            return { success: true };
          }
          
          // Si demo está deshabilitado, usar API real
          const result = await supplierService.update(id, data);
          if (result.success !== false) {
            get().fetchSuppliers(); // Recargar lista
          }
          return { success: true };
        } catch (error) {
          // Si falla la API y demo está habilitado como fallback
          if (DEMO_CONFIG_SUPPLIERS.enabled) {
            try {
              await updateDemoSupplier(id, data);
              get().fetchSuppliers(); // Recargar lista
              return { success: true };
            } catch (demoError) {
              set({ error: demoError.message || 'Error al actualizar' });
              return { success: false, error: demoError.message };
            }
          }
          set({ error: error.message || 'Error al actualizar' });
          return { success: false, error: error.message };
        }
      },

      deleteSupplier: async (id) => {
        try {
          // Si demo está habilitado, usar datos demo
          if (DEMO_CONFIG_SUPPLIERS.enabled && !DEMO_CONFIG_SUPPLIERS.useRealAPI) {
            await deleteDemoSupplier(id);
            get().fetchSuppliers(); // Recargar lista
            return { success: true };
          }
          
          // Si demo está deshabilitado, usar API real
          const result = await supplierService.delete(id);
          if (result.success !== false) {
            get().fetchSuppliers(); // Recargar lista
          }
          return { success: true };
        } catch (error) {
          // Si falla la API y demo está habilitado como fallback
          if (DEMO_CONFIG_SUPPLIERS.enabled) {
            try {
              await deleteDemoSupplier(id);
              get().fetchSuppliers(); // Recargar lista
              return { success: true };
            } catch (demoError) {
              set({ error: demoError.message || 'Error al eliminar' });
              return { success: false, error: demoError.message };
            }
          }
          set({ error: error.message || 'Error al eliminar' });
          return { success: false, error: error.message };
        }
      }
    }),
    { name: 'supplier-store' }
  )
);

export default useSupplierStore;