/**
 * Servicio para la gestión de clientes en el sistema ERP
 * Contiene todas las funciones relacionadas con la API de clientes
 */

import { apiService } from './api';

export const clientService = {
  // Obtener todos los clientes con paginación y filtros
  getClients: async (params = {}) => {
    const queryParams = new URLSearchParams({
      page: params.page || 1,
      limit: params.limit || 10,
      search: params.search || '',
      type: params.type || '', // individual, empresa
      status: params.status || '', // activo, inactivo
      sortBy: params.sortBy || 'name',
      sortOrder: params.sortOrder || 'asc',
    }).toString();

    return await apiService.get(`/clientes?${queryParams}`);
  },

  // Obtener un cliente por ID
  getClientById: async (id) => {
    return await apiService.get(`/clientes/${id}`);
  },

  // Crear un nuevo cliente
  createClient: async (clientData) => {
    return await apiService.post('/clientes', clientData);
  },

  // Actualizar un cliente existente
  updateClient: async (id, clientData) => {
    return await apiService.put(`/clientes/${id}`, clientData);
  },

  // Eliminar un cliente
  deleteClient: async (id) => {
    return await apiService.delete(`/clientes/${id}`);
  },

  // Obtener historial de pedidos de un cliente
  getClientOrders: async (clientId, params = {}) => {
    const queryParams = new URLSearchParams({
      page: params.page || 1,
      limit: params.limit || 10,
      status: params.status || '',
      dateFrom: params.dateFrom || '',
      dateTo: params.dateTo || '',
    }).toString();

    return await apiService.get(`/clientes/${clientId}/pedidos?${queryParams}`);
  },

  // Obtener estadísticas de un cliente
  getClientStats: async (clientId) => {
    return await apiService.get(`/clientes/${clientId}/estadisticas`);
  },

  // Buscar clientes por email o teléfono
  searchClients: async (query) => {
    return await apiService.get(`/clientes/buscar?q=${encodeURIComponent(query)}`);
  },

  // Obtener clientes más activos
  getTopClients: async (limit = 10) => {
    return await apiService.get(`/clientes/top?limit=${limit}`);
  },

  // Activar/desactivar cliente
  toggleClientStatus: async (id, status) => {
    return await apiService.put(`/clientes/${id}/status`, { status });
  },
};

export default clientService;

