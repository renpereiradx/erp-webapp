/**
 * Servicio para gestión de horarios (Schedule API)
 * Implementa la especificación completa de SCHEDULE_API.md
 * Separado de reservations para mejor arquitectura modular
 */

import { apiService } from '@/services/api';
import { telemetry } from '@/utils/telemetry';
// Removed MockDataService import - using real API only

const API_PREFIX = '/schedules'; // Ajustar según API

// Utilidad para reintentos con backoff exponencial
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000;

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

export const scheduleService = {
  // Método genérico para obtener horarios - como no hay endpoint general, lanzamos error informativo
  async getSchedules() {
    throw new Error(
      'El listado general de horarios no está implementado en la API. ' +
      'Use getAvailableSchedules() para consultas específicas de producto y fecha.'
    );
  },

  async getScheduleById(id) {
    const startTime = Date.now();
    
    try {
      const result = await withRetry(async () => {
        return await apiService.get(`${API_PREFIX}/${id}`);
      });
      
      telemetry.record('schedules.service.load_by_id', {
        duration: Date.now() - startTime
      });
      
      return result;
    } catch (error) {
      telemetry.record('schedules.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'getScheduleById'
      });
      throw error;
    }
  },

  async updateAvailability(id, isAvailable) {
    const startTime = Date.now();
    
    try {
      const result = await withRetry(async () => {
        return await apiService.put(`${API_PREFIX}/${id}/availability`, {
          is_available: isAvailable
        });
      });
      
      telemetry.record('schedules.service.update_availability', {
        duration: Date.now() - startTime
      });
      
      return result;
    } catch (error) {
      telemetry.record('schedules.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'updateAvailability'
      });
      throw error;
    }
  },

  async generateDaily() {
    // generateDaily ahora usa la fecha de hoy con el endpoint correcto
    const today = new Date().toISOString().split('T')[0];
    return this.generateForDate(today);
  },

  // Generar horarios para fecha específica con parámetros flexibles (API v2 según documentación)
  async generateForDate(targetDate, options = {}) {
    const startTime = Date.now();
    
    try {
      const requestBody = {
        target_date: targetDate
      };
      
      // Agregar parámetros opcionales si se especifican
      if (options.startHour !== undefined && options.startHour !== null) {
        requestBody.start_hour = parseInt(options.startHour);
      }
      if (options.endHour !== undefined && options.endHour !== null) {
        requestBody.end_hour = parseInt(options.endHour);
      }
      if (options.productIds && Array.isArray(options.productIds) && options.productIds.length > 0) {
        requestBody.product_ids = options.productIds;
      }
      
      const result = await withRetry(async () => {
        return await apiService.post(`${API_PREFIX}/generate/date`, requestBody);
      });
      
      telemetry.record('schedules.service.generate_for_date_flexible', {
        duration: Date.now() - startTime,
        target_date: targetDate,
        has_custom_hours: !!(options.startHour || options.endHour),
        has_product_filter: !!(options.productIds && options.productIds.length > 0),
        auto_discovery: !options.productIds || options.productIds.length === 0
      });
      
      console.log('✅ Horarios generados para fecha:', targetDate, {
        autoDiscovery: result.auto_discovery,
        productsProcessed: result.validation?.products_requested,
        schedulesCreated: result.results?.schedules_created
      });
      return result;
    } catch (error) {
      telemetry.record('schedules.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'generateForDate',
        target_date: targetDate
      });
      console.error('❌ Error generando horarios para fecha:', targetDate, error);
      throw error;
    }
  },

  // Método deprecado - usar generateForDate con options
  async generateWithCustomRange(targetDate, startHour, endHour, productIds = []) {
    console.warn('⚠️ generateWithCustomRange está deprecado. Use generateForDate(targetDate, { startHour, endHour, productIds })');
    return this.generateForDate(targetDate, {
      startHour,
      endHour,
      productIds: productIds.length > 0 ? productIds : undefined
    });
  },

  // Métodos compatibles con la implementación anterior (deprecated pero mantenidos por compatibilidad)
  async generateToday() {
    const today = new Date().toISOString().split('T')[0];
    return this.generateForDate(today);
  },

  async generateTomorrow() {
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    return this.generateForDate(tomorrow);
  },

  // Método deprecado - usar generateForDate con options
  async generateForDateWithCustomRange(targetDate, startHour, endHour, productIds = null) {
    console.warn('⚠️ generateForDateWithCustomRange está deprecado. Use generateForDate(targetDate, { startHour, endHour, productIds })');
    return this.generateForDate(targetDate, {
      startHour,
      endHour,
      productIds: productIds && Array.isArray(productIds) && productIds.length > 0 ? productIds : undefined
    });
  },

  async generateForNextDays(days) {
    const startTime = Date.now();
    
    try {
      const result = await withRetry(async () => {
        return await apiService.post(`${API_PREFIX}/generate/next-days`, {
          days: days
        });
      });
      
      telemetry.record('schedules.service.generate_for_next_days', {
        duration: Date.now() - startTime
      });
      
      return result;
    } catch (error) {
      telemetry.record('schedules.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'generateForNextDays'
      });
      throw error;
    }
  },

  async getAvailableSchedules(productId, date) {
    const startTime = Date.now();
    
    try {
      const result = await withRetry(async () => {
        return await apiService.get(`${API_PREFIX}/product/${productId}/date/${date}/available`);
      });
      
      // Si no hay horarios disponibles, intentar generarlos automáticamente
      if ((!result.data || result.data.length === 0) && productId && date) {
        console.log('🔄 No schedules found, attempting to generate schedules for', { productId, date });
        
        try {
          // Usar siempre generateForDate para cualquier fecha (endpoint correcto)
          console.log('🔄 Intentando generar horarios para fecha:', date);
          
          const generationResult = await this.generateForDate(date);
          
          console.log('✅ Resultado de generación de horarios:', generationResult);
          
          // Reintentar la consulta después de la generación
          const retryResult = await apiService.get(`${API_PREFIX}/product/${productId}/date/${date}/available`);
          telemetry.record('schedules.service.load_available_after_generation', {
            duration: Date.now() - startTime,
            generated: true,
            count: retryResult.data?.length || 0
          });
          
          return retryResult;
        } catch (generationError) {
          console.warn('⚠️ Could not generate schedules:', generationError.message);
          // Continuar con resultado vacío original
        }
      }
      
      telemetry.record('schedules.service.load_available', {
        duration: Date.now() - startTime,
        count: result.data?.length || 0
      });
      
      return result;
    } catch (error) {
      telemetry.record('schedules.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'getAvailableSchedules'
      });
      throw error;
    }
  },

  // 🆕 Nuevos endpoints basados en SCHEDULE_API.md v2.1
  
  // Obtener horarios de servicios para HOY
  async getTodaySchedules() {
    const startTime = Date.now();
    
    try {
      const result = await withRetry(async () => {
        return await apiService.get(`${API_PREFIX}/today`);
      });
      
      telemetry.record('schedules.service.load_today', {
        duration: Date.now() - startTime,
        result_count: result.count || 0
      });
      
      return result;
    } catch (error) {
      telemetry.record('schedules.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'getTodaySchedules'
      });
      throw error;
    }
  },

  // Obtener horarios disponibles de todos los servicios
  async getAvailableSchedulesAll(params = {}) {
    const startTime = Date.now();
    const { date, limit = 50 } = params;
    
    try {
      const queryParams = new URLSearchParams();
      if (date) queryParams.append('date', date);
      if (limit) queryParams.append('limit', limit.toString());
      
      const url = queryParams.toString() 
        ? `${API_PREFIX}/available?${queryParams.toString()}`
        : `${API_PREFIX}/available`;
        
      const result = await withRetry(async () => {
        return await apiService.get(url);
      });
      
      telemetry.record('schedules.service.load_available_all', {
        duration: Date.now() - startTime,
        has_date_filter: !!date,
        result_count: result.count || 0
      });
      
      return result;
    } catch (error) {
      telemetry.record('schedules.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'getAvailableSchedulesAll'
      });
      throw error;
    }
  },

  // Obtener todos los horarios de un producto
  async getAllSchedulesByProduct(productId) {
    const startTime = Date.now();
    
    try {
      const result = await withRetry(async () => {
        return await apiService.get(`${API_PREFIX}/product/${productId}/all`);
      });
      
      telemetry.record('schedules.service.load_all_by_product', {
        duration: Date.now() - startTime,
        result_count: result.data?.length || 0
      });
      
      return result;
    } catch (error) {
      telemetry.record('schedules.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'getAllSchedulesByProduct'
      });
      throw error;
    }
  },

  // Obtener horarios de un producto con paginación
  async getSchedulesByProduct(productId, params = {}) {
    const startTime = Date.now();
    const { page = 1, pageSize = 50 } = params;
    
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('page', page.toString());
      queryParams.append('pageSize', pageSize.toString());
      
      const result = await withRetry(async () => {
        return await apiService.get(`${API_PREFIX}/product/${productId}?${queryParams.toString()}`);
      });
      
      telemetry.record('schedules.service.load_by_product_paginated', {
        duration: Date.now() - startTime,
        page,
        pageSize,
        result_count: result.data?.length || 0
      });
      
      return result;
    } catch (error) {
      telemetry.record('schedules.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'getSchedulesByProduct'
      });
      throw error;
    }
  },

  // Utilidad para verificar si existen horarios para una fecha
  async checkSchedulesForDate(date, productId = null) {
    const startTime = Date.now();
    
    try {
      if (productId) {
        // Verificar horarios específicos de un producto
        const result = await this.getAvailableSchedules(productId, date);
        return {
          hasSchedules: Array.isArray(result.data) && result.data.length > 0,
          count: result.data?.length || 0,
          schedules: result.data || []
        };
      } else {
        // Verificar horarios generales para la fecha
        const result = await this.getAvailableSchedulesAll({ date, limit: 1 });
        return {
          hasSchedules: result.data?.count > 0,
          count: result.data?.count || 0,
          message: result.data?.message || 'Sin información de horarios'
        };
      }
    } catch (error) {
      telemetry.record('schedules.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'checkSchedulesForDate'
      });
      
      // Si hay error, asumimos que no hay horarios
      return {
        hasSchedules: false,
        count: 0,
        message: `Error verificando horarios: ${error.message}`
      };
    }
  }
};

export default scheduleService;