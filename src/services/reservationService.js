/**
 * Servicio para gestión de reservas de servicios
 * Implementa la especificación completa de RESERVES_API.md
 * Separado completamente de Sales y Schedules para mejor arquitectura
 */

import { apiClient } from '@/services/api';
import { telemetryService } from '@/services/telemetryService';
// Removed MockDataService import - using real API only
import { telemetry } from '@/utils/telemetry';

const API_PREFIX = '/reserve'; // Según RESERVES_API.md
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000;

// Utilidad para reintentos con backoff exponencial
const withRetry = async (fn, attempts = RETRY_ATTEMPTS) => {
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === attempts - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * Math.pow(2, i)));
    }
  }
};

export const reservationService = {
  async getReservations(params = {}) {
    const startTime = Date.now();
    
    try {
      console.log('🌐 Reservations: Loading from API...');
      const result = await withRetry(async () => {
        return await apiClient.get(`${API_PREFIX}/report`, { params });
      });
      
      telemetryService.recordMetric('reservations_fetched_api', result.data?.length || 0);
      return result;
      
    } catch (error) {
      console.error('❌ Reservations API unavailable:', error.message);
      
      // En lugar de usar mock data, retornar error apropiado
      throw new Error(
        `No se pudieron cargar las reservas. Verifique la conexión a la API: ${error.message}`
      );
    } finally {
      const endTime = Date.now();
      telemetryService.recordMetric('get_reservations_duration', endTime - startTime);
    }
  },

  async getReservationById(id) {
    const startTime = Date.now();
    
    try {
      const result = await withRetry(async () => {
        return await apiClient.get(`${API_PREFIX}/${id}`);
      });
      
      telemetry.record('reservations.service.load_by_id', {
        duration: Date.now() - startTime
      });
      
      return result;
    } catch (error) {
      telemetry.record('reservations.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'getReservationById'
      });
      throw error;
    }
  },

  async createReservation(data) {
    const startTime = Date.now();
    
    try {
      const reservationData = {
        action: 'create',
        product_id: data.product_id || data.productId,
        client_id: data.client_id || data.clientId,
        start_time: data.start_time || data.startTime,
        duration: data.duration
      };

      const result = await withRetry(async () => {
        return await apiClient.post(`${API_PREFIX}/manage`, reservationData);
      });
      
      telemetry.record('reservations.service.create', {
        duration: Date.now() - startTime
      });
      
      return result;
    } catch (error) {
      telemetry.record('reservations.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'create'
      });
      throw error;
    }
  },

  async updateReservation(id, data) {
    const startTime = Date.now();
    
    try {
      const reservationData = {
        action: 'update',
        reserve_id: id,
        product_id: data.product_id || data.productId,
        client_id: data.client_id || data.clientId,
        start_time: data.start_time || data.startTime,
        duration: data.duration
      };

      const result = await withRetry(async () => {
        return await apiClient.post(`${API_PREFIX}/manage`, reservationData);
      });
      
      telemetry.record('reservations.service.update', {
        duration: Date.now() - startTime
      });
      
      return result;
    } catch (error) {
      telemetry.record('reservations.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'update'
      });
      throw error;
    }
  },

  async cancelReservation(id) {
    const startTime = Date.now();
    
    try {
      const reservationData = {
        action: 'cancel',
        reserve_id: id
      };

      const result = await withRetry(async () => {
        return await apiClient.post(`${API_PREFIX}/manage`, reservationData);
      });
      
      telemetry.record('reservations.service.cancel', {
        duration: Date.now() - startTime
      });
      
      return result;
    } catch (error) {
      telemetry.record('reservations.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'cancel'
      });
      throw error;
    }
  },

  async getReservationsByProduct(productId) {
    const startTime = Date.now();
    
    try {
      const result = await withRetry(async () => {
        return await apiClient.get(`${API_PREFIX}/product/${productId}`);
      });
      
      telemetry.record('reservations.service.load_by_product', {
        duration: Date.now() - startTime
      });
      
      return result;
    } catch (error) {
      telemetry.record('reservations.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'getReservationsByProduct'
      });
      throw error;
    }
  },

  async getReservationsByClient(clientId) {
    const startTime = Date.now();
    
    try {
      const result = await withRetry(async () => {
        return await apiClient.get(`${API_PREFIX}/client/${clientId}`);
      });
      
      telemetry.record('reservations.service.load_by_client', {
        duration: Date.now() - startTime
      });
      
      return result;
    } catch (error) {
      telemetry.record('reservations.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'getReservationsByClient'
      });
      throw error;
    }
  },

  async getReservationReport(params = {}) {
    const startTime = Date.now();
    
    try {
      const result = await withRetry(async () => {
        return await apiClient.get(`${API_PREFIX}/report`, { params });
      });
      
      telemetry.record('reservations.service.report', {
        duration: Date.now() - startTime
      });
      
      return result;
    } catch (error) {
      telemetry.record('reservations.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'getReservationReport'
      });
      throw error;
    }
  },

  async getAvailableSchedules(productId, date, duration) {
    const startTime = Date.now();
    
    try {
      const params = {
        product_id: productId,
        date: date,
        duration_hours: duration
      };

      const result = await withRetry(async () => {
        return await apiClient.get(`${API_PREFIX}/available-schedules`, { params });
      });
      
      telemetry.record('reservations.service.available_schedules', {
        duration: Date.now() - startTime
      });
      
      return result;
    } catch (error) {
      telemetry.record('reservations.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'getAvailableSchedules'
      });
      throw error;
    }
  },

  async checkConsistency() {
    const startTime = Date.now();
    
    try {
      const result = await withRetry(async () => {
        return await apiClient.get(`${API_PREFIX}/consistency/check`);
      });
      
      telemetry.record('reservations.service.check_consistency', {
        duration: Date.now() - startTime
      });
      
      return result;
    } catch (error) {
      telemetry.record('reservations.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'checkConsistency'
      });
      throw error;
    }
  }
};

export default reservationService;