import apiService from './api';
import { mockReservationsAPI } from './mockReservationsAPI';

/**
 * Servicio de reservaciones con cache avanzado y fallback automático
 */
class ReservationService {
  constructor() {
    this.baseURL = '/api/reserve';
    this.useApi = true; // Flag para controlar si usar API real o mock
  }

  /**
   * Wrapper para manejar fallback automático API -> Mock
   */
  async withFallback(apiCall, mockCall, operation = 'unknown') {
    try {
      if (!this.useApi) {
        console.log(`[telemetry] reservations.service.mock.${operation}`);
        return await mockCall();
      }

      console.log(`[telemetry] reservations.service.api.${operation}.attempt`);
      const result = await apiCall();
      console.log(`[telemetry] reservations.service.api.${operation}.success`);
      return result;
    } catch (error) {
      console.warn(`API call failed for ${operation}, falling back to mock:`, error.message);
      console.log(`[telemetry] reservations.service.api.${operation}.fallback`, {
        error: error.message,
        code: error.code
      });
      
      // Usar mock como fallback
      this.useApi = false;
      return await mockCall();
    }
  }

  /**
   * Obtener lista de reservaciones con soporte de cache
   */
  async getReservations(params = {}) {
    const apiCall = async () => {
      const response = await apiService.get(`${this.baseURL}/manage`, { params });
      return response.data;
    };

    const mockCall = async () => {
      return await mockReservationsAPI.getReservations(params);
    };

    return this.withFallback(apiCall, mockCall, 'getReservations');
  }

  /**
   * Obtener reservación por ID
   */
  async getReservationById(id) {
    const apiCall = async () => {
      const response = await apiService.get(`${this.baseURL}/by-id/${id}`);
      return response.data;
    };

    const mockCall = async () => {
      return await mockReservationsAPI.getReservationById(id);
    };

    return this.withFallback(apiCall, mockCall, 'getReservationById');
  }

  /**
   * Crear nueva reservación
   */
  async createReservation(reservationData) {
    const apiCall = async () => {
      const response = await apiService.post(`${this.baseURL}/manage`, reservationData);
      return response.data;
    };

    const mockCall = async () => {
      return await mockReservationsAPI.createReservation(reservationData);
    };

    return this.withFallback(apiCall, mockCall, 'createReservation');
  }

  /**
   * Actualizar reservación existente
   */
  async updateReservation(id, reservationData) {
    const apiCall = async () => {
      const response = await apiService.put(`${this.baseURL}/manage/${id}`, reservationData);
      return response.data;
    };

    const mockCall = async () => {
      return await mockReservationsAPI.updateReservation(id, reservationData);
    };

    return this.withFallback(apiCall, mockCall, 'updateReservation');
  }

  /**
   * Eliminar reservación
   */
  async deleteReservation(id) {
    const apiCall = async () => {
      const response = await apiService.delete(`${this.baseURL}/manage/${id}`);
      return response.data;
    };

    const mockCall = async () => {
      return await mockReservationsAPI.deleteReservation(id);
    };

    return this.withFallback(apiCall, mockCall, 'deleteReservation');
  }

  /**
   * Obtener horarios disponibles para un producto/fecha
   */
  async getAvailableSchedules(productId, date) {
    const apiCall = async () => {
      const response = await apiService.get(`${this.baseURL}/available-schedules`, {
        params: { productId, date }
      });
      return response.data;
    };

    const mockCall = async () => {
      return await mockReservationsAPI.getAvailableSchedules(productId, date);
    };

    return this.withFallback(apiCall, mockCall, 'getAvailableSchedules');
  }

  /**
   * Obtener reservaciones por producto
   */
  async getReservationsByProduct(productId, params = {}) {
    const apiCall = async () => {
      const response = await apiService.get(`${this.baseURL}/by-product/${productId}`, { params });
      return response.data;
    };

    const mockCall = async () => {
      return await mockReservationsAPI.getReservationsByProduct(productId, params);
    };

    return this.withFallback(apiCall, mockCall, 'getReservationsByProduct');
  }

  /**
   * Obtener reservaciones por cliente
   */
  async getReservationsByClient(clientId, params = {}) {
    const apiCall = async () => {
      const response = await apiService.get(`${this.baseURL}/by-client/${clientId}`, { params });
      return response.data;
    };

    const mockCall = async () => {
      return await mockReservationsAPI.getReservationsByClient(clientId, params);
    };

    return this.withFallback(apiCall, mockCall, 'getReservationsByClient');
  }

  /**
   * Obtener reporte de reservaciones
   */
  async getReservationReport(params = {}) {
    const apiCall = async () => {
      const response = await apiService.get(`${this.baseURL}/report`, { params });
      return response.data;
    };

    const mockCall = async () => {
      return await mockReservationsAPI.getReservationReport(params);
    };

    return this.withFallback(apiCall, mockCall, 'getReservationReport');
  }

  /**
   * Verificar consistencia reservas-ventas
   */
  async checkConsistency() {
    const apiCall = async () => {
      const response = await apiService.get(`${this.baseURL}/consistency/check`);
      return response.data;
    };

    const mockCall = async () => {
      return await mockReservationsAPI.checkConsistency();
    };

    return this.withFallback(apiCall, mockCall, 'checkConsistency');
  }

  /**
   * Reprogramar reservación (reschedule)
   */
  async rescheduleReservation(id, newSchedule) {
    const apiCall = async () => {
      const response = await apiService.put(`${this.baseURL}/manage/${id}/reschedule`, newSchedule);
      return response.data;
    };

    const mockCall = async () => {
      return await mockReservationsAPI.rescheduleReservation(id, newSchedule);
    };

    return this.withFallback(apiCall, mockCall, 'rescheduleReservation');
  }

  /**
   * Confirmar reservación
   */
  async confirmReservation(id) {
    const apiCall = async () => {
      const response = await apiService.put(`${this.baseURL}/manage/${id}/confirm`);
      return response.data;
    };

    const mockCall = async () => {
      return await mockReservationsAPI.confirmReservation(id);
    };

    return this.withFallback(apiCall, mockCall, 'confirmReservation');
  }

  /**
   * Cancelar reservación
   */
  async cancelReservation(id, reason = '') {
    const apiCall = async () => {
      const response = await apiService.put(`${this.baseURL}/manage/${id}/cancel`, { reason });
      return response.data;
    };

    const mockCall = async () => {
      return await mockReservationsAPI.cancelReservation(id, reason);
    };

    return this.withFallback(apiCall, mockCall, 'cancelReservation');
  }

  /**
   * Completar reservación
   */
  async completeReservation(id) {
    const apiCall = async () => {
      const response = await apiService.put(`${this.baseURL}/manage/${id}/complete`);
      return response.data;
    };

    const mockCall = async () => {
      return await mockReservationsAPI.completeReservation(id);
    };

    return this.withFallback(apiCall, mockCall, 'completeReservation');
  }

  // =================================
  // SCHEDULE MANAGEMENT ENDPOINTS
  // =================================

  /**
   * Obtener horario por ID
   */
  async getScheduleById(id) {
    const apiCall = async () => {
      const response = await apiService.get(`/api/schedules/${id}`);
      return response.data;
    };

    const mockCall = async () => {
      return await mockReservationsAPI.getScheduleById(id);
    };

    return this.withFallback(apiCall, mockCall, 'getScheduleById');
  }

  /**
   * Obtener horarios disponibles para producto/fecha
   */
  async getAvailableSchedulesForDate(productId, date) {
    const apiCall = async () => {
      const response = await apiService.get(`/api/schedules/product/${productId}/date/${date}/available`);
      return response.data;
    };

    const mockCall = async () => {
      return await mockReservationsAPI.getAvailableSchedulesForDate(productId, date);
    };

    return this.withFallback(apiCall, mockCall, 'getAvailableSchedulesForDate');
  }

  /**
   * Obtener horarios por rango de fechas
   */
  async getSchedulesByDateRange(startDate, endDate, params = {}) {
    const apiCall = async () => {
      const queryParams = new URLSearchParams({
        startDate,
        endDate,
        page: params.page || 1,
        pageSize: params.pageSize || 20
      });
      const response = await apiService.get(`/api/schedules/date-range?${queryParams}`);
      return response.data;
    };

    const mockCall = async () => {
      return await mockReservationsAPI.getSchedulesByDateRange(startDate, endDate, params);
    };

    return this.withFallback(apiCall, mockCall, 'getSchedulesByDateRange');
  }

  /**
   * Obtener horarios por producto
   */
  async getSchedulesByProduct(productId, params = {}) {
    const apiCall = async () => {
      const queryParams = new URLSearchParams({
        page: params.page || 1,
        pageSize: params.pageSize || 20
      });
      const response = await apiService.get(`/api/schedules/product/${productId}?${queryParams}`);
      return response.data;
    };

    const mockCall = async () => {
      return await mockReservationsAPI.getSchedulesByProduct(productId, params);
    };

    return this.withFallback(apiCall, mockCall, 'getSchedulesByProduct');
  }

  /**
   * Actualizar disponibilidad de horario
   */
  async updateScheduleAvailability(id, isAvailable) {
    const apiCall = async () => {
      const response = await apiService.put(`/api/schedules/${id}/availability`, {
        is_available: isAvailable
      });
      return response.data;
    };

    const mockCall = async () => {
      return await mockReservationsAPI.updateScheduleAvailability(id, isAvailable);
    };

    return this.withFallback(apiCall, mockCall, 'updateScheduleAvailability');
  }

  /**
   * Generar horarios diarios automáticamente
   */
  async generateDailySchedules() {
    const apiCall = async () => {
      const response = await apiService.post('/api/schedules/generate/daily');
      return response.data;
    };

    const mockCall = async () => {
      return await mockReservationsAPI.generateDailySchedules();
    };

    return this.withFallback(apiCall, mockCall, 'generateDailySchedules');
  }

  /**
   * Generar horarios para fecha específica
   */
  async generateSchedulesForDate(targetDate) {
    const apiCall = async () => {
      const response = await apiService.post('/api/schedules/generate/date', {
        target_date: targetDate
      });
      return response.data;
    };

    const mockCall = async () => {
      return await mockReservationsAPI.generateSchedulesForDate(targetDate);
    };

    return this.withFallback(apiCall, mockCall, 'generateSchedulesForDate');
  }

  /**
   * Generar horarios para próximos N días
   */
  async generateSchedulesForNextDays(days) {
    const apiCall = async () => {
      const response = await apiService.post('/api/schedules/generate/next-days', {
        days
      });
      return response.data;
    };

    const mockCall = async () => {
      return await mockReservationsAPI.generateSchedulesForNextDays(days);
    };

    return this.withFallback(apiCall, mockCall, 'generateSchedulesForNextDays');
  }

  /**
   * Actualización masiva de disponibilidad de horarios
   */
  async bulkUpdateScheduleAvailability(scheduleIds, isAvailable) {
    const results = [];
    for (const id of scheduleIds) {
      try {
        const result = await this.updateScheduleAvailability(id, isAvailable);
        results.push({ id, success: true, result });
      } catch (error) {
        results.push({ id, success: false, error: error.message });
      }
    }
    return results;
  }

  // =================================
  // UTILITY METHODS
  // =================================

  /**
   * Forzar uso de API real (para testing)
   */
  forceApiMode() {
    this.useApi = true;
  }

  /**
   * Forzar uso de mock (para desarrollo)
   */
  forceMockMode() {
    this.useApi = false;
  }

  /**
   * Verificar si está usando API o mock
   */
  isUsingApi() {
    return this.useApi;
  }
}

// Exportar instancia singleton
const reservationService = new ReservationService();
export default reservationService;
