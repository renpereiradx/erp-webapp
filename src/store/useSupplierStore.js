import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import supplierService from '../services/supplierService';
import { telemetry } from '../utils/telemetry';

const useSupplierStore = create()(
  devtools(
    (set, get) => ({
      // Estado de la lista y búsqueda
      suppliers: [],
      searchResults: [],
      lastSearchTerm: '',
      
      // Estados de carga y error
      loading: false,
      error: null,

      // Acciones básicas
      clearError: () => set({ error: null }),
      clearSuppliers: () => set({ suppliers: [], error: null }),

      fetchSuppliers: async (params = {}) => {
        set({ loading: true, error: null });
        const startTime = Date.now();
        
        try {
          let endpoint;
          // Usar paginación si se proporcionan parámetros
          if (params.page && params.pageSize) {
            endpoint = `/${params.page}/${params.pageSize}`;
          }
          
          const result = await supplierService.getAll(endpoint ? { endpoint } : {});
          let data = [];
          if (result && result.success !== false) {
            data = Array.isArray(result) ? result : (result.data || result.suppliers || []);
          }
          
          // Normalizar estructura de datos
          const normalizedData = data.map(supplier => ({
            ...supplier,
            id: supplier.id || supplier.ID,
            name: supplier.name || supplier.Name || 'Sin nombre',
            contact_info: supplier.contact_info || supplier.contactInfo || {},
            tax_id: supplier.tax_id || supplier.taxId || supplier.ruc,
            status: supplier.status !== undefined ? supplier.status : true
          })).filter(s => s.id);
          
          set({ suppliers: normalizedData, loading: false });
          
          telemetry.record('supplier.service.load', { 
            duration: Date.now() - startTime,
            count: normalizedData.length
          });
          
        } catch (error) {
          set({ error: error.message || 'Error al cargar proveedores', loading: false });
          telemetry.record('supplier.service.error', { 
            error: error.message,
            operation: 'fetchSuppliers'
          });
        }
      },

      // Búsqueda de proveedores
      searchSuppliers: async (term) => {
        const trimmed = (term || '').trim();
        if (!trimmed) return [];
        
        set({ loading: true, error: null });
        
        try {
          // Detectar si parece un ID numérico
          const looksLikeId = /^\d+$/.test(trimmed) && trimmed.length >= 1;
          let result;
          
          if (looksLikeId) {
            // Buscar por ID
            result = await supplierService.getById(trimmed);
            result = result ? [result] : [];
          } else {
            // Buscar por nombre
            if (trimmed.length < 2) {
              set({ loading: false });
              return [];
            }
            result = await supplierService.searchByName(trimmed);
            result = Array.isArray(result) ? result : (result ? [result] : []);
          }
          
          // Normalizar resultados
          const normalized = result.map(supplier => ({
            ...supplier,
            id: supplier.id || supplier.ID,
            name: supplier.name || supplier.Name || 'Sin nombre',
            contact_info: supplier.contact_info || supplier.contactInfo || {},
            tax_id: supplier.tax_id || supplier.taxId || supplier.ruc,
            status: supplier.status !== undefined ? supplier.status : true
          })).filter(s => s.id);
          
          set({ searchResults: normalized, lastSearchTerm: trimmed, loading: false });
          return normalized;
          
        } catch (error) {
          set({ error: error.message || 'Error en búsqueda', loading: false, searchResults: [] });
          throw error;
        }
      },

      createSupplier: async (data) => {
        try {
          const result = await supplierService.create(data);
          return { success: true, data: result };
        } catch (error) {
          set({ error: error.message || 'Error al crear proveedor' });
          return { success: false, error: error.message };
        }
      },

      updateSupplier: async (id, data) => {
        try {
          const result = await supplierService.update(id, data);
          return { success: true, data: result };
        } catch (error) {
          set({ error: error.message || 'Error al actualizar proveedor' });
          return { success: false, error: error.message };
        }
      },

      deleteSupplier: async (id) => {
        try {
          const result = await supplierService.delete(id);
          return { success: true, data: result };
        } catch (error) {
          set({ error: error.message || 'Error al eliminar proveedor' });
          return { success: false, error: error.message };
        }
      },

      // Reactivar proveedor (si existe endpoint específico, si no, usar update)
      reactivateSupplier: async (id) => {
        try {
          // Intentar con endpoint específico de reactivación primero
          let result;
          try {
            result = await supplierService.reactivate(id);
          } catch (reactivateError) {
            // Si no existe endpoint específico, usar update con status: true
            console.log('No reactivate endpoint, using update with status=true');
            result = await supplierService.update(id, { status: true });
          }
          return { success: true, data: result };
        } catch (error) {
          set({ error: error.message || 'Error al reactivar proveedor' });
          return { success: false, error: error.message };
        }
      }
    }),
    { name: 'supplier-store' }
  )
);

export default useSupplierStore;
