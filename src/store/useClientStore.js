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
          let clientsData = [];
          let paginationInfo = null;

          if (searchTerm.trim() !== '') {
            // Si se proporciona un término de búsqueda, usar el endpoint getClientByName
            const clientByNameResponse = await clientService.getClientByName(searchTerm);

            let parsedResponse = clientByNameResponse;
            if (typeof clientByNameResponse === 'string') {
                try {
                    parsedResponse = JSON.parse(clientByNameResponse);
                } catch (e) {
                    parsedResponse = []; // Fallback to empty array if parsing fails
                }
            }

            // La API podría devolver un solo objeto o un array. Normalizar a un array.
            clientsData = Array.isArray(parsedResponse) ? parsedResponse : (parsedResponse ? [parsedResponse] : []);
            // Para una búsqueda de nombre específico, la información de paginación no es típicamente relevante,
            // así que podemos establecer totalPages y totalClients basándonos en los clientes encontrados.
            paginationInfo = {
                current_page: 1,
                per_page: clientsData.length,
                total: clientsData.length,
                total_pages: 1
            };
          } else {
            // Si no hay término de búsqueda, obtener todos los clientes con paginación
            const response = await clientService.getClients({ page, limit, search: searchTerm });
            
            if (response && typeof response === 'object') {
              if (response.data && response.pagination) {
                clientsData = Array.isArray(response.data) ? response.data : [];
                paginationInfo = response.pagination;
              } else if (Array.isArray(response)) {
                clientsData = response;
              } else if (response.clients && Array.isArray(response.clients)) {
                clientsData = response.clients;
              } else {
                const possibleArrays = Object.values(response).filter(val => Array.isArray(val));
                if (possibleArrays.length > 0) {
                  clientsData = possibleArrays[0];
                }
              }
            } else if (Array.isArray(response)) {
              clientsData = response;
            }
          }
          
          // Filtrar elementos inválidos
          const validClients = clientsData.filter(c => c && typeof c === 'object');
          
          set({
            clients: validClients,
            currentPage: paginationInfo ? paginationInfo.current_page : 1,
            totalPages: paginationInfo ? paginationInfo.total_pages : 1,
            totalClients: paginationInfo ? paginationInfo.total : validClients.length,
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
