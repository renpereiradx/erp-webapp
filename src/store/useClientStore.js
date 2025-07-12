/**
 * Store de Zustand para la gestión de clientes en el ERP
 * Incluye estado local y funciones para interactuar con la API
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { clientService } from '@/services/clientService';

// Datos mock para demostración
const mockClients = [
  {
    id: 1,
    name: 'Ana García Pérez',
    email: 'ana.garcia@email.com',
    phone: '+34 912 345 678',
    company: 'Tech Solutions S.L.',
    type: 'empresa',
    status: 'active',
    address: 'Calle Gran Vía 123, Madrid',
    city: 'Madrid',
    country: 'España',
    postalCode: '28001',
    taxId: 'B12345678',
    totalOrders: 15,
    totalSpent: 12500.75,
    lastOrderDate: '2024-01-25T14:30:00Z',
    createdAt: '2023-06-15T10:30:00Z',
    notes: 'Cliente premium con descuentos especiales',
  },
  {
    id: 2,
    name: 'Carlos Rodríguez López',
    email: 'carlos.rodriguez@gmail.com',
    phone: '+34 651 234 567',
    company: null,
    type: 'particular',
    status: 'active',
    address: 'Avenida de la Constitución 45',
    city: 'Sevilla',
    country: 'España',
    postalCode: '41001',
    taxId: '12345678Z',
    totalOrders: 8,
    totalSpent: 3250.20,
    lastOrderDate: '2024-01-20T09:15:00Z',
    createdAt: '2023-09-10T16:45:00Z',
    notes: 'Cliente frecuente, muy puntual en pagos',
  },
  {
    id: 3,
    name: 'María José Fernández',
    email: 'mjfernandez@innovacorp.es',
    phone: '+34 934 567 890',
    company: 'Innovacorp S.A.',
    type: 'empresa',
    status: 'active',
    address: 'Passeig de Gràcia 200',
    city: 'Barcelona',
    country: 'España',
    postalCode: '08008',
    taxId: 'A87654321',
    totalOrders: 23,
    totalSpent: 18750.50,
    lastOrderDate: '2024-01-28T11:20:00Z',
    createdAt: '2023-03-20T14:15:00Z',
    notes: 'Empresa líder en innovación tecnológica',
  },
  {
    id: 4,
    name: 'José Manuel Torres',
    email: 'jm.torres@yahoo.es',
    phone: '+34 618 765 432',
    company: null,
    type: 'particular',
    status: 'inactive',
    address: 'Calle del Carmen 67',
    city: 'Valencia',
    country: 'España',
    postalCode: '46001',
    taxId: '87654321B',
    totalOrders: 3,
    totalSpent: 890.30,
    lastOrderDate: '2023-11-15T16:45:00Z',
    createdAt: '2023-08-05T09:30:00Z',
    notes: 'Cliente inactivo desde noviembre',
  },
  {
    id: 5,
    name: 'Laura Martínez Silva',
    email: 'laura@designstudio.com',
    phone: '+34 987 654 321',
    company: 'Design Studio Creative',
    type: 'empresa',
    status: 'active',
    address: 'Plaza Mayor 15',
    city: 'Salamanca',
    country: 'España',
    postalCode: '37001',
    taxId: 'B98765432',
    totalOrders: 12,
    totalSpent: 8900.75,
    lastOrderDate: '2024-01-22T13:10:00Z',
    createdAt: '2023-05-12T11:20:00Z',
    notes: 'Estudio de diseño especializado en branding',
  },
  {
    id: 6,
    name: 'Roberto Sánchez Gómez',
    email: 'roberto.sanchez@hotmail.com',
    phone: '+34 756 432 198',
    company: null,
    type: 'particular',
    status: 'active',
    address: 'Ronda de Toledo 89',
    city: 'Toledo',
    country: 'España',
    postalCode: '45001',
    taxId: '56789012C',
    totalOrders: 6,
    totalSpent: 2100.40,
    lastOrderDate: '2024-01-18T15:25:00Z',
    createdAt: '2023-07-30T12:45:00Z',
    notes: 'Cliente satisfecho con el servicio',
  },
  {
    id: 7,
    name: 'Patricia López Ruiz',
    email: 'patricia@consultinglr.es',
    phone: '+34 645 321 987',
    company: 'Consulting LR',
    type: 'empresa',
    status: 'active',
    address: 'Avenida Diagonal 456',
    city: 'Barcelona',
    country: 'España',
    postalCode: '08036',
    taxId: 'B45678901',
    totalOrders: 19,
    totalSpent: 15200.85,
    lastOrderDate: '2024-01-26T10:30:00Z',
    createdAt: '2023-04-08T16:00:00Z',
    notes: 'Consultoría especializada en transformación digital',
  },
  {
    id: 8,
    name: 'Miguel Ángel Herrera',
    email: 'maherrera@gmail.com',
    phone: '+34 123 456 789',
    company: null,
    type: 'particular',
    status: 'pending',
    address: 'Calle Alcalá 234',
    city: 'Madrid',
    country: 'España',
    postalCode: '28028',
    taxId: '34567890D',
    totalOrders: 1,
    totalSpent: 450.00,
    lastOrderDate: '2024-01-30T12:00:00Z',
    createdAt: '2024-01-29T14:20:00Z',
    notes: 'Cliente nuevo, pendiente de verificación',
  },
  {
    id: 9,
    name: 'Elena Vargas Castro',
    email: 'elena@marketingpro.es',
    phone: '+34 876 543 210',
    company: 'Marketing Pro Solutions',
    type: 'empresa',
    status: 'active',
    address: 'Calle Serrano 178',
    city: 'Madrid',
    country: 'España',
    postalCode: '28002',
    taxId: 'B23456789',
    totalOrders: 28,
    totalSpent: 22400.60,
    lastOrderDate: '2024-01-27T14:45:00Z',
    createdAt: '2023-02-14T10:15:00Z',
    notes: 'Agencia de marketing digital de alto rendimiento',
  },
  {
    id: 10,
    name: 'Francisco Jiménez Morales',
    email: 'fjimenez@outlook.com',
    phone: '+34 543 210 987',
    company: null,
    type: 'particular',
    status: 'active',
    address: 'Plaza de España 12',
    city: 'Zaragoza',
    country: 'España',
    postalCode: '50001',
    taxId: '78901234E',
    totalOrders: 11,
    totalSpent: 4750.25,
    lastOrderDate: '2024-01-24T08:30:00Z',
    createdAt: '2023-06-22T13:40:00Z',
    notes: 'Cliente leal con compras regulares',
  }
];

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
          const { filters } = get();
          const queryParams = {
            ...filters,
            ...params,
          };

          // Usar datos mock para demostración
          // En producción, descomentar la línea siguiente:
          // const response = await clientService.getClients(queryParams);
          
          // Simulamos llamada a API con datos mock
          await new Promise(resolve => setTimeout(resolve, 300)); // Simular delay de red
          
          let filteredClients = [...mockClients];
          
          // Aplicar filtros
          if (queryParams.search) {
            const searchTerm = queryParams.search.toLowerCase();
            filteredClients = filteredClients.filter(client => 
              client.name.toLowerCase().includes(searchTerm) ||
              client.email.toLowerCase().includes(searchTerm) ||
              client.company?.toLowerCase().includes(searchTerm) ||
              client.phone.includes(searchTerm) ||
              client.city.toLowerCase().includes(searchTerm)
            );
          }
          
          if (queryParams.type) {
            filteredClients = filteredClients.filter(client => 
              client.type === queryParams.type
            );
          }
          
          if (queryParams.status) {
            filteredClients = filteredClients.filter(client => 
              client.status === queryParams.status
            );
          }
          
          // Aplicar ordenamiento
          if (queryParams.sortBy) {
            filteredClients.sort((a, b) => {
              const aValue = a[queryParams.sortBy];
              const bValue = b[queryParams.sortBy];
              
              if (queryParams.sortOrder === 'desc') {
                return bValue > aValue ? 1 : -1;
              }
              return aValue > bValue ? 1 : -1;
            });
          }
          
          // Aplicar paginación
          const page = queryParams.page || 1;
          const limit = queryParams.limit || 10;
          const startIndex = (page - 1) * limit;
          const endIndex = startIndex + limit;
          const paginatedClients = filteredClients.slice(startIndex, endIndex);
          
          set({
            clients: paginatedClients,
            pagination: {
              page: page,
              limit: limit,
              total: filteredClients.length,
              totalPages: Math.ceil(filteredClients.length / limit),
            },
            loading: false,
          });
        } catch (error) {
          set({
            error: error.message || 'Error al cargar clientes',
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

