/**
 * Servicio para gestión de reservas de servicios
 * Implementa la especificación completa de RESERVES_API.md
 * Separado completamente de Sales y Schedules para mejor arquitectura
 */

import { apiService as apiClient } from '@/services/api';
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
  // Get service courts for reservations
  async getServiceCourts() {
    const startTime = Date.now();
    
    try {
      const result = await withRetry(async () => {
        return await apiClient.get('/products/enriched/service-courts');
      });
      
      telemetry.record('reservations.service.load_courts', {
        duration: Date.now() - startTime,
        count: Array.isArray(result) ? result.length : 0
      });
      
      return result;
    } catch (error) {
      telemetry.record('reservations.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'getServiceCourts'
      });
      
      // Fallback: try enriched/all and filter
      try {
        const allProducts = await withRetry(async () => {
          return await apiClient.get('/products/enriched/all');
        });
        
        if (Array.isArray(allProducts)) {
          const serviceCourts = allProducts.filter(product => 
            product.product_type === 'SERVICE' &&
            (product.name?.toLowerCase().includes('cancha') ||
             product.name?.toLowerCase().includes('court') ||
             product.category_name?.toLowerCase().includes('cancha') ||
             product.category_name?.toLowerCase().includes('alquiler'))
          );
          
          console.log('🏟️ Fallback: filtered service courts from all products:', serviceCourts.length);
          return serviceCourts;
        }
        return [];
      } catch (fallbackError) {
        console.warn('❌ Could not get service courts from fallback either');
        throw error;
      }
    }
  },
  // DEPRECATED: Usar getReservationReport() directamente 
  // Este método se mantiene por compatibilidad
  async getReservations(params = {}) {
    return this.getReservationReport(params);
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
      // Validar estructura ReserveRequest según API spec
      const reservationData = {
        action: 'create',
        product_id: data.product_id,
        client_id: data.client_id,
        start_time: data.start_time,
        duration: parseInt(data.duration) // Debe ser int
      };

      // Validaciones según API spec
      if (!reservationData.product_id || !reservationData.client_id || 
          !reservationData.start_time || !reservationData.duration) {
        throw new Error('Faltan campos obligatorios: product_id, client_id, start_time, duration');
      }

      if (reservationData.duration < 1) {
        throw new Error('La duración debe ser mayor o igual a 1 hora');
      }

      // Validar formato ISO 8601 para start_time
      try {
        new Date(reservationData.start_time).toISOString();
      } catch {
        throw new Error('start_time debe ser formato ISO 8601 válido');
      }

      console.log('🌐 Creating reservation:', reservationData);
      
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
      // Para update, reserve_id es OBLIGATORIO según API spec
      const reservationData = {
        action: 'update',
        reserve_id: parseInt(id), // int64 según spec
        product_id: data.product_id,
        client_id: data.client_id,
        start_time: data.start_time,
        duration: parseInt(data.duration) // int según spec
      };

      // Validaciones según API spec
      if (!reservationData.reserve_id || !reservationData.product_id || 
          !reservationData.client_id || !reservationData.start_time || 
          !reservationData.duration) {
        throw new Error('Para update son obligatorios: reserve_id, product_id, client_id, start_time, duration');
      }

      if (reservationData.duration < 1) {
        throw new Error('La duración debe ser mayor o igual a 1 hora');
      }

      console.log('🌐 Updating reservation:', reservationData);

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

  async cancelReservation(data) {
    const startTime = Date.now();
    
    try {
      // Para cancel, según API spec necesitamos TODOS los campos
      const reservationData = {
        action: 'cancel',
        reserve_id: parseInt(data.reserve_id || data.id), // int64 según spec
        product_id: data.product_id,
        client_id: data.client_id,
        start_time: data.start_time,
        duration: parseInt(data.duration) // int según spec
      };

      // Validaciones según API spec - todos los campos son obligatorios para cancel
      if (!reservationData.reserve_id || !reservationData.product_id || 
          !reservationData.client_id || !reservationData.start_time || 
          !reservationData.duration) {
        throw new Error('Para cancel son obligatorios: reserve_id, product_id, client_id, start_time, duration');
      }

      console.log('🌐 Canceling reservation:', reservationData);

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
      // Use the apiService method which has built-in fallback
      const result = await withRetry(async () => {
        return await apiClient.getReservationReport(params);
      });
      
      telemetry.record('reservations.service.report', {
        duration: Date.now() - startTime,
        count: Array.isArray(result) ? result.length : 0,
        hasMockData: result && result.length > 0 && result[0]?.created_by === 'Sistema Demo'
      });
      
      return result;
    } catch (error) {
      console.log('🔍 Reserve report error details:', error);
      
      telemetry.record('reservations.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'getReservationReport'
      });
      
      // Final fallback - return empty array
      console.warn('📝 Returning empty array as final fallback');
      return [];
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