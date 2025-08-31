import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { clientService } from '../services/clientService';
import { telemetry } from '../utils/telemetry';

const useClientStore = create()(
  devtools(
    (set, get) => ({
      // Estado de la lista y paginación
      clients: [],
      page: 1,
      pageSize: 10,
      totalPages: 1,
      totalClients: 0,
      searchTerm: '',

      // Estado de las estadísticas
      stats: null,
      
      // Estados de carga y error
      loading: false,
      statsLoading: false,
      error: null,

      // Acciones básicas
      clearError: () => set({ error: null }),
      clearClients: () => set({ clients: [], error: null }),

      // Cargar datos
      fetchClients: async () => {
        const { page, pageSize, searchTerm } = get();
        set({ loading: true, error: null });
        const startTime = Date.now();
        
        try {
          const params = { page, pageSize };
          if (searchTerm) params.name = searchTerm;

          const result = await clientService.getAll(params);
          
          let data = [];
          let total = 0;
          let totalPages = 1;

          if (result.success !== false) {
            const raw = result.data || result;
            data = raw.clients || [];
            total = raw.total || 0;
            totalPages = Math.ceil(total / pageSize);
          }
          
          set({ 
            clients: data, 
            totalClients: total,
            totalPages: totalPages,
            loading: false 
          });
          
          telemetry.record('feature.client.load', { 
            duration: Date.now() - startTime,
            count: data.length,
            page: page
          });
          
        } catch (error) {
          set({ error: error.message || 'Error al cargar', loading: false });
          telemetry.record('feature.client.error', { 
            error: error.message 
          });
        }
      },

      // Cargar estadísticas
      fetchStatistics: async () => {
        set({ statsLoading: true });
        try {
          const result = await clientService.getStatistics();
          let stats = null;
          if (result.success !== false) {
            const raw = result.data || result;
            stats = raw.client_statistics || raw;
          }
          set({ stats, statsLoading: false });
        } catch (error) {
          set({ stats: null, statsLoading: false });
          telemetry.record('feature.client.stats.error', { 
            error: error.message 
          });
        }
      },

      // Acciones de paginación y búsqueda
      setPage: (newPage) => {
        set({ page: newPage });
        get().fetchClients();
      },
      setSearchTerm: (term) => {
        set({ searchTerm: term });
      },
      search: () => {
        set({ page: 1 }); // Reset page to 1 on new search
        get().fetchClients();
      },

      // CRUD
      createClient: async (data) => {
        try {
          const result = await clientService.create(data);
          if (result.success !== false) {
            get().fetchClients(); // Recargar lista
          }
          return { success: true };
        } catch (error) {
          set({ error: error.message || 'Error al crear' });
          return { success: false, error: error.message };
        }
      },

      updateClient: async (id, data) => {
        try {
          const result = await clientService.update(id, data);
          if (result.success !== false) {
            get().fetchClients(); // Recargar lista
          }
          return { success: true };
        } catch (error) {
          set({ error: error.message || 'Error al actualizar' });
          return { success: false, error: error.message };
        }
      },

      deleteClient: async (id) => {
        try {
          const result = await clientService.delete(id);
          if (result.success !== false) {
            get().fetchClients(); // Recargar lista
          }
          return { success: true };
        } catch (error) {
          set({ error: error.message || 'Error al eliminar' });
          return { success: false, error: error.message };
        }
      }
    }),
    {
      name: 'client-store',
    }
  )
);

export default useClientStore;
