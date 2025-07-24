import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { clientService } from '@/services/clientService';

const useClientStore = create(
  devtools(
    (set, get) => ({
      // Estado inicial
      clients: [],
      loading: false,
      error: null,
      pagination: {
        current_page: 1,
        per_page: 10,
        total: 0,
        total_pages: 0,
      },

      // Acciones
      fetchClients: async (page = 1, pageSize = 10) => {
        set({ loading: true, error: null });
        try {
          const response = await clientService.getClients({ page, limit: pageSize });
          set({
            clients: response.data,
            pagination: response.pagination,
            loading: false,
          });
        } catch (error) {
          set({ error: error.message, loading: false });
        }
      },

      createClient: async (clientData) => {
        set({ loading: true });
        try {
          const newClient = await clientService.createClient(clientData);
          set((state) => ({ 
            clients: [...state.clients, newClient],
            loading: false 
          }));
        } catch (error) {
          set({ loading: false, error: error.message });
          throw error;
        }
      },

      updateClient: async (id, clientData) => {
        set({ loading: true });
        try {
          const updatedClient = await clientService.updateClient(id, clientData);
          set((state) => ({
            clients: state.clients.map((c) => (c.id === id ? updatedClient : c)),
            loading: false,
          }));
        } catch (error) {
          set({ loading: false, error: error.message });
          throw error;
        }
      },

      deleteClient: async (id) => {
        set({ loading: true });
        try {
          await clientService.deleteClient(id);
          set((state) => ({
            clients: state.clients.filter((c) => c.id !== id),
            loading: false,
          }));
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