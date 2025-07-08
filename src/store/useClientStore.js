/**
 * Store de Zustand para la gestión de clientes en el ERP
 * Incluye estado local y funciones para interactuar con la API
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { clientService } from '@/services/clientService';

const useClientStore = create(
  devtools(
    (set, get) => ({
      // Estado inicial
      clients: [],
      currentClient: null,
      clientOrders: [],
      clientStats: null,
      loading: false,
      error: null,
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
      },
      filters: {
        search: '',
        type: '',
        status: '',
        sortBy: 'name',
        sortOrder: 'asc',
      },

      // Acciones para manejo de loading y errores
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),

      // Acciones para filtros y paginación
      setFilters: (filters) => set((state) => ({
        filters: { ...state.filters, ...filters }
      })),
      
      setPagination: (pagination) => set((state) => ({
        pagination: { ...state.pagination, ...pagination }
      })),

      // Obtener clientes con filtros y paginación
      fetchClients: async (params = {}) => {
        set({ loading: true, error: null });
        try {
          const { filters, pagination } = get();
          const queryParams = {
            ...filters,
            ...pagination,
            ...params,
          };

          const response = await clientService.getClients(queryParams);
          
          set({
            clients: response.data || response,
            pagination: {
              page: response.page || 1,
              limit: response.limit || 10,
              total: response.total || response.length || 0,
              totalPages: response.totalPages || Math.ceil((response.total || response.length || 0) / (response.limit || 10)),
            },
            loading: false,
          });
        } catch (error) {
          set({
            error: error.response?.data?.message || 'Error al cargar clientes',
            loading: false,
          });
        }
      },

      // Obtener un cliente por ID
      fetchClientById: async (id) => {
        set({ loading: true, error: null });
        try {
          const client = await clientService.getClientById(id);
          set({
            currentClient: client,
            loading: false,
          });
          return client;
        } catch (error) {
          set({
            error: error.response?.data?.message || 'Error al cargar cliente',
            loading: false,
          });
          throw error;
        }
      },

      // Crear nuevo cliente
      createClient: async (clientData) => {
        set({ loading: true, error: null });
        try {
          const newClient = await clientService.createClient(clientData);
          
          set((state) => ({
            clients: [newClient, ...state.clients],
            loading: false,
          }));
          
          return newClient;
        } catch (error) {
          set({
            error: error.response?.data?.message || 'Error al crear cliente',
            loading: false,
          });
          throw error;
        }
      },

      // Actualizar cliente existente
      updateClient: async (id, clientData) => {
        set({ loading: true, error: null });
        try {
          const updatedClient = await clientService.updateClient(id, clientData);
          
          set((state) => ({
            clients: state.clients.map(client =>
              client.id === id ? updatedClient : client
            ),
            currentClient: state.currentClient?.id === id ? updatedClient : state.currentClient,
            loading: false,
          }));
          
          return updatedClient;
        } catch (error) {
          set({
            error: error.response?.data?.message || 'Error al actualizar cliente',
            loading: false,
          });
          throw error;
        }
      },

      // Eliminar cliente
      deleteClient: async (id) => {
        set({ loading: true, error: null });
        try {
          await clientService.deleteClient(id);
          
          set((state) => ({
            clients: state.clients.filter(client => client.id !== id),
            currentClient: state.currentClient?.id === id ? null : state.currentClient,
            loading: false,
          }));
        } catch (error) {
          set({
            error: error.response?.data?.message || 'Error al eliminar cliente',
            loading: false,
          });
          throw error;
        }
      },

      // Obtener pedidos de un cliente
      fetchClientOrders: async (clientId, params = {}) => {
        set({ loading: true, error: null });
        try {
          const orders = await clientService.getClientOrders(clientId, params);
          set({
            clientOrders: orders.data || orders,
            loading: false,
          });
          return orders;
        } catch (error) {
          set({
            error: error.response?.data?.message || 'Error al cargar pedidos del cliente',
            loading: false,
          });
          throw error;
        }
      },

      // Obtener estadísticas de un cliente
      fetchClientStats: async (clientId) => {
        set({ loading: true, error: null });
        try {
          const stats = await clientService.getClientStats(clientId);
          set({
            clientStats: stats,
            loading: false,
          });
          return stats;
        } catch (error) {
          set({
            error: error.response?.data?.message || 'Error al cargar estadísticas del cliente',
            loading: false,
          });
          throw error;
        }
      },

      // Buscar clientes
      searchClients: async (query) => {
        set({ loading: true, error: null });
        try {
          const results = await clientService.searchClients(query);
          set({ loading: false });
          return results;
        } catch (error) {
          set({
            error: error.response?.data?.message || 'Error en la búsqueda',
            loading: false,
          });
          throw error;
        }
      },

      // Obtener clientes más activos
      fetchTopClients: async (limit = 10) => {
        set({ loading: true, error: null });
        try {
          const topClients = await clientService.getTopClients(limit);
          set({ loading: false });
          return topClients;
        } catch (error) {
          set({
            error: error.response?.data?.message || 'Error al cargar clientes principales',
            loading: false,
          });
          throw error;
        }
      },

      // Cambiar estado de cliente
      toggleClientStatus: async (id, status) => {
        set({ loading: true, error: null });
        try {
          const updatedClient = await clientService.toggleClientStatus(id, status);
          
          set((state) => ({
            clients: state.clients.map(client =>
              client.id === id ? { ...client, status } : client
            ),
            currentClient: state.currentClient?.id === id 
              ? { ...state.currentClient, status } 
              : state.currentClient,
            loading: false,
          }));
          
          return updatedClient;
        } catch (error) {
          set({
            error: error.response?.data?.message || 'Error al cambiar estado del cliente',
            loading: false,
          });
          throw error;
        }
      },

      // Limpiar cliente actual
      clearCurrentClient: () => set({ 
        currentClient: null, 
        clientOrders: [], 
        clientStats: null 
      }),

      // Reset del store
      reset: () => set({
        clients: [],
        currentClient: null,
        clientOrders: [],
        clientStats: null,
        loading: false,
        error: null,
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
        },
        filters: {
          search: '',
          type: '',
          status: '',
          sortBy: 'name',
          sortOrder: 'asc',
        },
      }),
    }),
    {
      name: 'client-store', // Nombre para DevTools
    }
  )
);

export default useClientStore;

