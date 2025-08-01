import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { clientService } from '@/services/clientService';

const useClientStore = create(
  devtools(
    (set, get) => ({
      // Estado inicial mejorado
      clients: [],
      loading: false,
      error: null,
      lastSearchTerm: '',
      currentPage: 1,
      totalPages: 1,
      totalClients: 0,
      pageSize: 10,

      // Limpiar errores
      clearError: () => set({ error: null }),

      // Limpiar la lista de clientes
      clearClients: () => set({ clients: [], totalClients: 0, currentPage: 1, totalPages: 1, lastSearchTerm: '' }),

      // Cambiar tamaño de página
      changePageSize: async (newPageSize) => {
        const { lastSearchTerm } = get();
        set({ pageSize: newPageSize, currentPage: 1 });
        await get().searchClients(lastSearchTerm, 1, newPageSize);
      },

      // Cargar una página específica
      loadPage: async (page) => {
        const { lastSearchTerm, pageSize } = get();
        await get().searchClients(lastSearchTerm, page, pageSize);
      },

      // Acción principal de búsqueda y paginación
      searchClients: async (searchTerm = '', page = 1, limit = 10) => {
        set({ loading: true, error: null, lastSearchTerm: searchTerm });
        try {
          // Asumimos que el servicio puede manejar la búsqueda y paginación
          const response = await clientService.getClients({ page, limit, search: searchTerm });
          
          // La respuesta del servicio debe tener un formato consistente
          // con paginación o ser un array plano si no hay paginación.
          const isPaginated = response.data && response.pagination;
          
          set({
            clients: isPaginated ? (response.data || []).filter(c => c) : (response || []).filter(c => c),
            currentPage: isPaginated ? response.pagination.current_page : 1,
            totalPages: isPaginated ? response.pagination.total_pages : 1,
            totalClients: isPaginated ? response.pagination.total : response.length,
            loading: false,
          });

        } catch (error) {
          set({ error: error.message, loading: false });
        }
      },

      // Acciones CRUD (sin cambios, pero se benefician del estado mejorado)
      createClient: async (clientData) => {
        set({ loading: true });
        try {
          await clientService.createClient(clientData);
          // Refrescar la última búsqueda para ver el nuevo cliente
          await get().loadPage(get().currentPage);
        } catch (error) {
          set({ loading: false, error: error.message });
          throw error;
        }
      },

      updateClient: async (id, clientData) => {
        set({ loading: true });
        try {
          await clientService.updateClient(id, clientData);
          await get().loadPage(get().currentPage);
        } catch (error) {
          set({ loading: false, error: error.message });
          throw error;
        }
      },

      deleteClient: async (id) => {
        set({ loading: true });
        try {
          await clientService.deleteClient(id);
          await get().loadPage(get().currentPage);
        } catch (error) {
          set({ loading: false, error: error.message });
          throw error;
        }
      },
    }),
    {
      name: 'client-store',
    }
  )
);

export default useClientStore;
