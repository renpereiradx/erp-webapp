/**
 * Servicio para la gestión de clientes en el sistema ERP
 * Migrado para usar el cliente oficial del Business Management API
 */

import { apiClient } from './api';

export const clientService = {
  // Obtener todos los clientes con paginación y filtros
  getClients: async (params = {}) => {
    try {
      // El cliente API oficial devuelve todos los clientes
      // Implementamos filtrado local hasta que el backend soporte parámetros
      const clients = await apiClient.getClients();
      
      let filteredClients = [...clients];
      
      // Aplicar filtro de búsqueda si existe
      if (params.search) {
        const searchTerm = params.search.toLowerCase();
        filteredClients = filteredClients.filter(client => 
          client.name?.toLowerCase().includes(searchTerm) ||
          client.email?.toLowerCase().includes(searchTerm) ||
          client.phone?.toLowerCase().includes(searchTerm) ||
          client.company?.toLowerCase().includes(searchTerm)
        );
      }
      
      // Aplicar filtro de tipo si existe
      if (params.type) {
        filteredClients = filteredClients.filter(client => 
          client.type === params.type
        );
      }
      
      // Aplicar filtro de estado si existe
      if (params.status) {
        filteredClients = filteredClients.filter(client => 
          client.status === params.status
        );
      }
      
      // Aplicar ordenamiento
      const sortBy = params.sortBy || 'name';
      const sortOrder = params.sortOrder || 'asc';
      
      filteredClients.sort((a, b) => {
        let valueA = a[sortBy] || '';
        let valueB = b[sortBy] || '';
        
        if (typeof valueA === 'string') {
          valueA = valueA.toLowerCase();
          valueB = valueB.toLowerCase();
        }
        
        if (sortOrder === 'desc') {
          return valueA < valueB ? 1 : valueA > valueB ? -1 : 0;
        }
        return valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
      });
      
      // Aplicar paginación
      const page = parseInt(params.page) || 1;
      const limit = parseInt(params.limit) || 10;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      
      const paginatedClients = filteredClients.slice(startIndex, endIndex);
      
      return {
        data: paginatedClients,
        pagination: {
          current_page: page,
          per_page: limit,
          total: filteredClients.length,
          total_pages: Math.ceil(filteredClients.length / limit)
        }
      };
    } catch (error) {
      console.error('Error obteniendo clientes:', error);
      throw new Error(error.message || 'Error al obtener la lista de clientes');
    }
  },

  // Obtener un cliente por ID
  getClientById: async (id) => {
    try {
      return await apiClient.getClient(id);
    } catch (error) {
      console.error('Error obteniendo cliente:', error);
      throw new Error(error.message || 'Error al obtener el cliente');
    }
  },

  // Crear un nuevo cliente
  createClient: async (clientData) => {
    try {
      return await apiClient.createClient(clientData);
    } catch (error) {
      console.error('Error creando cliente:', error);
      throw new Error(error.message || 'Error al crear el cliente');
    }
  },

  // Actualizar un cliente existente
  updateClient: async (id, clientData) => {
    try {
      return await apiClient.updateClient(id, clientData);
    } catch (error) {
      console.error('Error actualizando cliente:', error);
      throw new Error(error.message || 'Error al actualizar el cliente');
    }
  },

  // Eliminar un cliente
  deleteClient: async (id) => {
    try {
      return await apiClient.deleteClient(id);
    } catch (error) {
      console.error('Error eliminando cliente:', error);
      throw new Error(error.message || 'Error al eliminar el cliente');
    }
  },

  // Obtener historial de pedidos de un cliente
  getClientOrders: async (clientId, params = {}) => {
    try {
      // Por ahora simulamos esto con datos básicos hasta que el backend lo implemente
      console.warn('getClientOrders no está implementado en el cliente API oficial aún');
      return {
        data: [],
        pagination: {
          current_page: 1,
          per_page: 10,
          total: 0,
          total_pages: 0
        }
      };
    } catch (error) {
      console.error('Error obteniendo pedidos del cliente:', error);
      throw new Error(error.message || 'Error al obtener el historial de pedidos');
    }
  },

  // Obtener estadísticas de un cliente
  getClientStats: async (clientId) => {
    try {
      // Por ahora simulamos esto con datos básicos hasta que el backend lo implemente
      console.warn('getClientStats no está implementado en el cliente API oficial aún');
      return {
        total_orders: 0,
        total_spent: 0,
        last_order_date: null,
        average_order_value: 0
      };
    } catch (error) {
      console.error('Error obteniendo estadísticas del cliente:', error);
      throw new Error(error.message || 'Error al obtener las estadísticas del cliente');
    }
  },

  // Buscar clientes por email o teléfono
  searchClients: async (query) => {
    try {
      const clients = await apiClient.getClients();
      
      if (!query || query.trim() === '') {
        return clients;
      }
      
      const searchTerm = query.toLowerCase().trim();
      
      return clients.filter(client => 
        client.name?.toLowerCase().includes(searchTerm) ||
        client.email?.toLowerCase().includes(searchTerm) ||
        client.phone?.toLowerCase().includes(searchTerm) ||
        client.company?.toLowerCase().includes(searchTerm)
      );
    } catch (error) {
      console.error('Error buscando clientes:', error);
      throw new Error(error.message || 'Error al buscar clientes');
    }
  },

  // Obtener clientes más activos
  getTopClients: async (limit = 10) => {
    try {
      // Por ahora devolvemos los primeros clientes hasta que el backend implemente ranking
      const clients = await apiClient.getClients();
      return clients.slice(0, limit);
    } catch (error) {
      console.error('Error obteniendo top clientes:', error);
      throw new Error(error.message || 'Error al obtener los clientes más activos');
    }
  },

  // Activar/desactivar cliente
  toggleClientStatus: async (id, status) => {
    try {
      // Por ahora simulamos esto hasta que el backend lo implemente
      console.warn('toggleClientStatus no está implementado en el cliente API oficial aún');
      return { success: true, message: 'Estado actualizado' };
    } catch (error) {
      console.error('Error cambiando estado del cliente:', error);
      throw new Error(error.message || 'Error al cambiar el estado del cliente');
    }
  },
};

export default clientService;

