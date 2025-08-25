/**
 * ReservationService - Wave 8: API Integration & Backend Alignment
 * Servicio de reservaciones alineado con RESERVE_API.md documentada
 * Implementa todos los endpoints especificados con JWT authentication
 */

import apiService from './api';
import { mockReservationsAPIV2 } from './mockReservationsAPIV2';
import { RESERVATION_ACTIONS, RESERVATION_STATUSES } from '../types/reservationTypes';

/**
 * Servicio de reservaciones con API alineada al backend documentado
 */
class ReservationServiceV2 {
  constructor() {
    this.baseURL = '/reserve';
    this.useApi = true; // Flag para controlar si usar API real o mock
  }

  /**
   * Wrapper para manejar fallback automático API -> Mock con JWT
   */
  async withFallback(apiCall, mockCall, operation = 'unknown') {
    try {
      if (!this.useApi) {
        console.log(`[telemetry] feature.reservations.service.mock.${operation}`);
        return await mockCall();
      }

      // Verificar token JWT antes de hacer llamada
      if (!this._hasValidJWT()) {
        console.warn(`[telemetry] feature.reservations.service.api.${operation}.no_jwt_fallback`);
        this.useApi = false;
        return await mockCall();
      }

      console.log(`[telemetry] feature.reservations.service.api.${operation}.attempt`);
      const result = await apiCall();
      console.log(`[telemetry] feature.reservations.service.api.${operation}.success`);
      return result;
    } catch (error) {
      console.warn(`API call failed for ${operation}, falling back to mock:`, error.message);
      console.log(`[telemetry] feature.reservations.service.api.${operation}.fallback`, {
        error: error.message,
        code: error.code,
        status: error.response?.status
      });
      
      // Fallback a mock en caso de error
      this.useApi = false;
      return await mockCall();
    }
  }

  /**
   * Verificar si hay JWT válido disponible
   * @private
   */
  _hasValidJWT() {
    const token = apiService.getToken();
    if (!token) return false;
    
    try {
      // Verificación básica del token (podría expandirse)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      return payload.exp > now;
    } catch (error) {
      console.warn('Invalid JWT token format:', error);
      return false;
    }
  }

  /**
   * Normalizar datos de reserva para compatibilidad
   * @param {Object} reservation - Datos de reserva a normalizar
   * @returns {Object} Reserva normalizada
   */
  _normalizeReservation(reservation) {
    if (!reservation) return null;
    
    return {
      id: reservation.id,
      product_id: reservation.product_id,
      client_id: reservation.client_id,
      start_time: reservation.start_time,
      end_time: reservation.end_time,
      duration: reservation.duration,
      total_amount: reservation.total_amount,
      status: reservation.status,
      user_id: reservation.user_id,
      // Campos adicionales si existen (ReserveRiched)
      ...(reservation.product_name && { product_name: reservation.product_name }),
      ...(reservation.client_name && { client_name: reservation.client_name }),
      ...(reservation.user_name && { user_name: reservation.user_name }),
      ...(reservation.product_description && { product_description: reservation.product_description })
    };
  }

  /**
   * 1. Gestionar Reserva - POST /reserve/manage
   * @param {string} action - Acción: "create", "update", "cancel"
   * @param {Object} reservationData - Datos de la reserva
   * @returns {Promise<Reserve>}
   */
  async manageReservation(action, reservationData) {
    if (!Object.values(RESERVATION_ACTIONS).includes(action)) {
      throw new Error(`Invalid action: ${action}`);
    }

    const requestBody = {
      action,
      ...reservationData
    };

    const apiCall = async () => {
      const response = await apiService.post(`${this.baseURL}/manage`, requestBody);
      return this._normalizeReservation(response.data);
    };

    const mockCall = async () => {
      // Mapear acción a método del mock
      switch (action) {
        case RESERVATION_ACTIONS.CREATE:
          return await mockReservationsAPIV2.createReservation(reservationData);
        case RESERVATION_ACTIONS.UPDATE:
          return await mockReservationsAPIV2.updateReservation(reservationData.reserve_id, reservationData);
        case RESERVATION_ACTIONS.CANCEL:
          return await mockReservationsAPIV2.updateReservation(reservationData.reserve_id, { 
            ...reservationData, 
            status: RESERVATION_STATUSES.CANCELLED 
          });
        default:
          throw new Error(`Unsupported action in mock: ${action}`);
      }
    };

    return this.withFallback(apiCall, mockCall, `manageReservation.${action}`);
  }

  /**
   * 2. Obtener Reserva por ID - GET /reserve/{id}
   * @param {number} id - ID de la reserva
   * @returns {Promise<Reserve>}
   */
  async getReservationById(id) {
    if (!id || isNaN(id)) {
      throw new Error('Invalid reservation ID');
    }

    const apiCall = async () => {
      const response = await apiService.get(`${this.baseURL}/${id}`);
      return this._normalizeReservation(response.data);
    };

    const mockCall = async () => {
      return await mockReservationsAPIV2.getReservationById(id);
    };

    return this.withFallback(apiCall, mockCall, 'getReservationById');
  }

  /**
   * 3. Obtener Reservas por Producto - GET /reserve/product/{product_id}
   * @param {string} productId - ID del producto
   * @returns {Promise<ReserveRiched[]>}
   */
  async getReservationsByProduct(productId) {
    if (!productId) {
      throw new Error('Product ID is required');
    }

    const apiCall = async () => {
      const response = await apiService.get(`${this.baseURL}/product/${productId}`);
      return Array.isArray(response.data) ? 
        response.data.map(r => this._normalizeReservation(r)) : 
        [];
    };

    const mockCall = async () => {
      return await mockReservationsAPIV2.getReservationsByProduct(productId);
    };

    return this.withFallback(apiCall, mockCall, 'getReservationsByProduct');
  }

  /**
   * 4. Obtener Reservas por Cliente - GET /reserve/client/{client_id}
   * @param {string} clientId - ID del cliente
   * @returns {Promise<ReserveRiched[]>}
   */
  async getReservationsByClient(clientId) {
    if (!clientId) {
      throw new Error('Client ID is required');
    }

    const apiCall = async () => {
      const response = await apiService.get(`${this.baseURL}/client/${clientId}`);
      return Array.isArray(response.data) ? 
        response.data.map(r => this._normalizeReservation(r)) : 
        [];
    };

    const mockCall = async () => {
      return await mockReservationsAPIV2.getReservationsByClient(clientId);
    };

    return this.withFallback(apiCall, mockCall, 'getReservationsByClient');
  }

  /**
   * 5. Obtener Reporte de Reservas - GET /reserve/report
   * @param {Object} params - Parámetros de filtro
   * @returns {Promise<ReservationReport[]>}
   */
  async getReservationReport(params = {}) {
    const apiCall = async () => {
      const response = await apiService.get(`${this.baseURL}/report`, { params });
      return Array.isArray(response.data) ? response.data : [];
    };

    const mockCall = async () => {
      return await mockReservationsAPIV2.getReservationReport(params);
    };

    return this.withFallback(apiCall, mockCall, 'getReservationReport');
  }

  /**
   * 6. Verificar Consistencia - GET /reserve/consistency/check
   * @returns {Promise<ConsistencyIssue[]>}
   */
  async checkConsistency() {
    const apiCall = async () => {
      const response = await apiService.get(`${this.baseURL}/consistency/check`);
      return Array.isArray(response.data) ? response.data : [];
    };

    const mockCall = async () => {
      return await mockReservationsAPIV2.checkConsistency();
    };

    return this.withFallback(apiCall, mockCall, 'checkConsistency');
  }

  /**
   * 7. Obtener Horarios Disponibles - GET /reserve/available-schedules
   * @param {string} productId - ID del producto (requerido)
   * @param {string} date - Fecha en formato YYYY-MM-DD (requerido)
   * @param {number} [durationHours=1] - Duración deseada en horas
   * @returns {Promise<AvailableSchedule[]>}
   */
  async getAvailableSchedules(productId, date, durationHours = 1) {
    if (!productId || !date) {
      throw new Error('product_id and date are required');
    }

    const params = {
      product_id: productId,
      date: date,
      duration_hours: durationHours
    };

    const apiCall = async () => {
      const response = await apiService.get(`${this.baseURL}/available-schedules`, { params });
      return Array.isArray(response.data) ? response.data : [];
    };

    const mockCall = async () => {
      return await mockReservationsAPIV2.getAvailableSchedules(productId, date);
    };

    return this.withFallback(apiCall, mockCall, 'getAvailableSchedules');
  }

  // === MÉTODOS DE COMPATIBILIDAD CON VERSIÓN ANTERIOR ===

  /**
   * Crear reservación (método de compatibilidad)
   * @param {Object} reservationData - Datos de la reserva
   * @returns {Promise<Reserve>}
   */
  async createReservation(reservationData) {
    return this.manageReservation(RESERVATION_ACTIONS.CREATE, reservationData);
  }

  /**
   * Actualizar reservación (método de compatibilidad)
   * @param {number} id - ID de la reserva
   * @param {Object} reservationData - Datos actualizados
   * @returns {Promise<Reserve>}
   */
  async updateReservation(id, reservationData) {
    return this.manageReservation(RESERVATION_ACTIONS.UPDATE, {
      reserve_id: id,
      ...reservationData
    });
  }

  /**
   * Cancelar reservación (método de compatibilidad)
   * @param {number} id - ID de la reserva
   * @returns {Promise<Reserve>}
   */
  async cancelReservation(id) {
    return this.manageReservation(RESERVATION_ACTIONS.CANCEL, {
      reserve_id: id,
      status: RESERVATION_STATUSES.CANCELLED
    });
  }

  /**
   * Obtener lista de reservaciones (método de compatibilidad)
   * @param {Object} params - Parámetros de filtro
   * @returns {Promise<Reserve[]|ReserveRiched[]>}
   */
  async getReservations(params = {}) {
    // Si se especifica product_id o client_id, usar endpoints específicos
    if (params.product_id) {
      return this.getReservationsByProduct(params.product_id);
    }
    if (params.client_id) {
      return this.getReservationsByClient(params.client_id);
    }
    
    // De lo contrario, usar el reporte como listado general
    return this.getReservationReport(params);
  }

  // === UTILIDADES ===

  /**
   * Verificar si está usando API real o mock
   * @returns {boolean}
   */
  isUsingApi() {
    return this.useApi;
  }

  /**
   * Forzar uso de mock (para testing)
   */
  forceMockMode() {
    this.useApi = false;
  }

  /**
   * Intentar volver a usar API
   */
  retryApiMode() {
    this.useApi = true;
  }
}

// Exportar instancia singleton
const reservationServiceV2 = new ReservationServiceV2();
export default reservationServiceV2;
