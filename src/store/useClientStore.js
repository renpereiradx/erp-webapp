import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { clientService } from '../services/clientService';
import { telemetry } from '../utils/telemetry';
import { 
  DEMO_CONFIG_CLIENTS,
  getDemoClients,
  getDemoClientStatistics,
  createDemoClient,
  updateDemoClient,
  deleteDemoClient
} from '../config/demoData';

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
          // Si demo está habilitado, usar datos demo
          if (DEMO_CONFIG_CLIENTS.enabled && !DEMO_CONFIG_CLIENTS.useRealAPI) {
            console.log('👥 Clients: Loading demo data...');
            
            const params = { page, pageSize };
            if (searchTerm) params.name = searchTerm;
            
            const result = await getDemoClients(params);
            const data = result.data.clients || [];
            const total = result.data.total || 0;
            const totalPages = Math.ceil(total / pageSize);
            
            set({ 
              clients: data, 
              totalClients: total,
              totalPages: totalPages,
              loading: false 
            });
            
            console.log('✅ Clients: Demo data loaded successfully');
            return;
          }
          
          // Si demo está deshabilitado, usar API real
          console.log('🌐 Clients: Loading data from API...');
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
          
          console.log('✅ Clients: API data loaded successfully');
          
          telemetry.record('feature.client.load', { 
            duration: Date.now() - startTime,
            count: data.length,
            page: page
          });
          
        } catch (error) {
          console.error('❌ Clients: Error loading data:', error.message);
          
          // Si falla la API y demo está habilitado como fallback
          if (DEMO_CONFIG_CLIENTS.enabled) {
            console.log('🔄 Clients: Falling back to demo data...');
            const params = { page, pageSize };
            if (searchTerm) params.name = searchTerm;
            
            const demoResult = await getDemoClients(params);
            const data = demoResult.data.clients || [];
            const total = demoResult.data.total || 0;
            const totalPages = Math.ceil(total / pageSize);
            
            set({ 
              clients: data, 
              totalClients: total,
              totalPages: totalPages,
              loading: false,
              error: null // Clear error since we have fallback data
            });
            console.log('✅ Clients: Demo fallback data loaded');
          } else {
            set({ error: error.message || 'Error al cargar', loading: false });
            telemetry.record('feature.client.error', { 
              error: error.message 
            });
          }
        }
      },

      // Cargar estadísticas
      fetchStatistics: async () => {
        set({ statsLoading: true });
        try {
          // Si demo está habilitado, usar datos demo
          if (DEMO_CONFIG_CLIENTS.enabled && !DEMO_CONFIG_CLIENTS.useRealAPI) {
            const result = await getDemoClientStatistics();
            const stats = result.data.client_statistics;
            set({ stats, statsLoading: false });
            return;
          }
          
          // Si demo está deshabilitado, usar API real
          const result = await clientService.getStatistics();
          let stats = null;
          if (result.success !== false) {
            const raw = result.data || result;
            stats = raw.client_statistics || raw;
          }
          set({ stats, statsLoading: false });
        } catch (error) {
          // Si falla la API y demo está habilitado como fallback
          if (DEMO_CONFIG_CLIENTS.enabled) {
            const demoResult = await getDemoClientStatistics();
            const stats = demoResult.data.client_statistics;
            set({ stats, statsLoading: false });
          } else {
            set({ stats: null, statsLoading: false });
            telemetry.record('feature.client.stats.error', { 
              error: error.message 
            });
          }
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
          // Si demo está habilitado, usar datos demo
          if (DEMO_CONFIG_CLIENTS.enabled && !DEMO_CONFIG_CLIENTS.useRealAPI) {
            await createDemoClient(data);
            get().fetchClients(); // Recargar lista
            return { success: true };
          }
          
          // Si demo está deshabilitado, usar API real
          const result = await clientService.create(data);
          if (result.success !== false) {
            get().fetchClients(); // Recargar lista
          }
          return { success: true };
        } catch (error) {
          // Si falla la API y demo está habilitado como fallback
          if (DEMO_CONFIG_CLIENTS.enabled) {
            await createDemoClient(data);
            get().fetchClients(); // Recargar lista
            return { success: true };
          }
          set({ error: error.message || 'Error al crear' });
          return { success: false, error: error.message };
        }
      },

      updateClient: async (id, data) => {
        try {
          // Si demo está habilitado, usar datos demo
          if (DEMO_CONFIG_CLIENTS.enabled && !DEMO_CONFIG_CLIENTS.useRealAPI) {
            await updateDemoClient(id, data);
            get().fetchClients(); // Recargar lista
            return { success: true };
          }
          
          // Si demo está deshabilitado, usar API real
          const result = await clientService.update(id, data);
          if (result.success !== false) {
            get().fetchClients(); // Recargar lista
          }
          return { success: true };
        } catch (error) {
          // Si falla la API y demo está habilitado como fallback
          if (DEMO_CONFIG_CLIENTS.enabled) {
            try {
              await updateDemoClient(id, data);
              get().fetchClients(); // Recargar lista
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

      deleteClient: async (id) => {
        try {
          // Si demo está habilitado, usar datos demo
          if (DEMO_CONFIG_CLIENTS.enabled && !DEMO_CONFIG_CLIENTS.useRealAPI) {
            await deleteDemoClient(id);
            get().fetchClients(); // Recargar lista
            return { success: true };
          }
          
          // Si demo está deshabilitado, usar API real
          const result = await clientService.delete(id);
          if (result.success !== false) {
            get().fetchClients(); // Recargar lista
          }
          return { success: true };
        } catch (error) {
          // Si falla la API y demo está habilitado como fallback
          if (DEMO_CONFIG_CLIENTS.enabled) {
            try {
              await deleteDemoClient(id);
              get().fetchClients(); // Recargar lista
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
    {
      name: 'client-store',
    }
  )
);

export default useClientStore;
