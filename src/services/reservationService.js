/**
 * Servicio para la gestión de reservas en el sistema ERP
 * Contiene todas las funciones relacionadas con la API de reservas
 */

import { apiService } from './api';

export const reservationService = {
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

  // Actualizar una reserva existente
  updateReservation: async (id, reservationData) => {
    return await apiService.put(`/reservas/${id}`, {
      action: 'update',
      reserve_id: parseInt(id),
      ...reservationData
    });
  },

  // Cancelar una reserva
  cancelReservation: async (id) => {
    return await apiService.put(`/reservas/${id}`, {
      action: 'cancel',
      reserve_id: parseInt(id)
    });
  },

  // Confirmar una reserva
  confirmReservation: async (id) => {
    return await apiService.put(`/reservas/${id}`, {
      action: 'confirm',
      reserve_id: parseInt(id)
    });
  },

  // Completar una reserva
  completeReservation: async (id) => {
    return await apiService.put(`/reservas/${id}`, {
      action: 'complete',
      reserve_id: parseInt(id)
    });
  },

  // Obtener reservas por cliente
  getReservationsByClient: async (clientId, params = {}) => {
    const queryParams = new URLSearchParams({
      page: params.page || 1,
      limit: params.limit || 10,
      dateFrom: params.dateFrom || '',
      dateTo: params.dateTo || '',
      status: params.status || '',
    }).toString();

    return await apiService.get(`/clientes/${clientId}/reservas?${queryParams}`);
  },

  // Obtener reservas por producto/servicio
  getReservationsByProduct: async (productId, params = {}) => {
    const queryParams = new URLSearchParams({
      page: params.page || 1,
      limit: params.limit || 10,
      dateFrom: params.dateFrom || '',
      dateTo: params.dateTo || '',
      status: params.status || '',
    }).toString();

    return await apiService.get(`/productos/${productId}/reservas?${queryParams}`);
  },

  // Obtener reservas del día
  getTodayReservations: async () => {
    const today = new Date().toISOString().split('T')[0];
    return await apiService.get(`/reservas/dia/${today}`);
  },

  // Obtener horarios disponibles para un servicio en una fecha
  getAvailableSlots: async (productId, date) => {
    return await apiService.get(`/reservas/disponibles/${productId}/${date}`);
  },

  // Obtener horarios (schedules) para un producto específico
  getSchedules: async (productId, params = {}) => {
    const queryParams = new URLSearchParams({
      start_date: params.startDate || '',
      end_date: params.endDate || '',
      is_available: params.isAvailable !== undefined ? params.isAvailable : '',
    }).toString();

    return await apiService.get(`/productos/${productId}/horarios?${queryParams}`);
  },

  // Crear un nuevo horario (schedule) para un producto
  createSchedule: async (productId, scheduleData) => {
    return await apiService.post(`/productos/${productId}/horarios`, {
      action: 'create',
      product_id: productId,
      start_time: scheduleData.startTime,
      end_time: scheduleData.endTime,
      is_available: scheduleData.isAvailable !== false
    });
  },

  // Actualizar disponibilidad de un horario
  updateScheduleAvailability: async (scheduleId, isAvailable) => {
    return await apiService.put(`/horarios/${scheduleId}`, {
      action: 'update_availability',
      schedule_id: parseInt(scheduleId),
      is_available: isAvailable
    });
  },

  // Verificar disponibilidad de un horario específico
  checkScheduleAvailability: async (productId, startTime, endTime) => {
    const queryParams = new URLSearchParams({
      product_id: productId,
      start_time: startTime,
      end_time: endTime
    }).toString();

    return await apiService.get(`/horarios/verificar-disponibilidad?${queryParams}`);
  },

  // Obtener estadísticas de reservas
  getReservationStats: async (params = {}) => {
    const queryParams = new URLSearchParams({
      dateFrom: params.dateFrom || '',
      dateTo: params.dateTo || '',
      groupBy: params.groupBy || 'day', // day, week, month
    }).toString();

    return await apiService.get(`/reservas/estadisticas?${queryParams}`);
  },

  // Reprogramar una reserva
  rescheduleReservation: async (id, newStartTime, newDuration) => {
    return await apiService.put(`/reservas/${id}`, {
      action: 'reschedule',
      reserve_id: parseInt(id),
      start_time: newStartTime,
      duration: newDuration
    });
  },
};

export default reservationService;
