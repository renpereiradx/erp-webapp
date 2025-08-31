/**
 * Servicio para la gestión de reservas en el sistema ERP
 * Contiene todas las funciones relacionadas con la API de reservas
 */

import { apiService } from './api';

const reservationService = {
  // Obtener todas las reservas con paginación y filtros
  getReservations: async (params = {}) => {
    const queryParams = new URLSearchParams({
      page: params.page || 1,
      limit: params.limit || 10,
      clientId: params.clientId || '',
      productId: params.productId || '',
      dateFrom: params.dateFrom || '',
      dateTo: params.dateTo || '',
      status: params.status || '', // pending, confirmed, completed, cancelled
      sortBy: params.sortBy || 'startTime',
      sortOrder: params.sortOrder || 'asc',
    }).toString();

    return await apiService.get(`/reservas?${queryParams}`);
  },

  // Obtener una reserva por ID
  getReservationById: async (id) => {
    return await apiService.get(`/reservas/${id}`);
  },

  // Crear una nueva reserva
  createReservation: async (reservationData) => {
    return await apiService.post('/reservas', {
      action: 'create',
      ...reservationData
    });
  },

  // etc...
};

export default reservationService;