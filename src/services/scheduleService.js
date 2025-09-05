/**
 * Servicio para gestión de horarios (Schedule API)
 * Implementa la especificación completa de SCHEDULE_API.md
 * Separado de reservations para mejor arquitectura modular
 */

import { apiService } from '@/services/api';
import { telemetryService } from '@/services/telemetryService';
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
  async getSchedules(params = {}) {
    console.error('❌ Schedule generic endpoint not available');
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
    const startTime = Date.now();
    
    try {
      const result = await withRetry(async () => {
        return await apiService.post(`${API_PREFIX}/generate/daily`);
      });
      
      telemetry.record('schedules.service.generate_daily', {
        duration: Date.now() - startTime
      });
      
      return result;
    } catch (error) {
      telemetry.record('schedules.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'generateDaily'
      });
      throw error;
    }
  },

  async generateForDate(targetDate) {
    const startTime = Date.now();
    
    try {
      const result = await withRetry(async () => {
        return await apiService.post(`${API_PREFIX}/generate/date`, {
          target_date: targetDate
        });
      });
      
      telemetry.record('schedules.service.generate_for_date', {
        duration: Date.now() - startTime
      });
      
      return result;
    } catch (error) {
      telemetry.record('schedules.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'generateForDate'
      });
      throw error;
    }
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
      
      telemetry.record('schedules.service.load_available', {
        duration: Date.now() - startTime
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