// src/services/scheduleService.js
import { apiService } from '@/services/api';
import { telemetryService } from '@/services/telemetryService';
import { MockDataService, MOCK_CONFIG } from '@/config/mockData';

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
  async getSchedules(params = {}) {
    const startTime = Date.now();
    
    try {
      // Intentar API real si está habilitado
      if (!MOCK_CONFIG.useRealAPI) {
        throw new Error('Mock mode enabled - using mock data');
      }
      
      console.log('🌐 Schedules: Loading from API...');
      const result = await withRetry(async () => {
        return await apiService.get(`${API_PREFIX}/date-range`, { params });
      });
      
      telemetryService.recordMetric('schedules_fetched_api', result.data?.length || 0);
      return result;
      
    } catch (error) {
      console.warn('🔄 Schedules API unavailable, using modular mock data...');
      
      // Fallback a mock data modular
      const mockResult = await MockDataService.getSchedules({
        page: params.page || 1,
        pageSize: params.pageSize || 50,
        product_id: params.product_id,
        startDate: params.startDate,
        endDate: params.endDate
      });
      
      telemetryService.recordMetric('schedules_fetched_mock', mockResult.data?.length || 0);
      
      if (MOCK_CONFIG.development?.verbose) {
        console.log('✅ Schedules loaded from modular mock system:', mockResult.data.length);
      }
      
      return mockResult;
    } finally {
      const endTime = Date.now();
      telemetryService.recordMetric('get_schedules_duration', endTime - startTime);
    }
  },

  async getScheduleById(id) {
    const startTime = Date.now();
    
    try {
      const result = await _fetchWithRetry(async () => {
        return await apiClient.get(`${API_PREFIX}/${id}`);
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
      const result = await _fetchWithRetry(async () => {
        return await apiClient.put(`${API_PREFIX}/${id}/availability`, {
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
      const result = await _fetchWithRetry(async () => {
        return await apiClient.post(`${API_PREFIX}/generate/daily`);
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
      const result = await _fetchWithRetry(async () => {
        return await apiClient.post(`${API_PREFIX}/generate/date`, {
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
      const result = await _fetchWithRetry(async () => {
        return await apiClient.post(`${API_PREFIX}/generate/next-days`, {
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
      const result = await _fetchWithRetry(async () => {
        return await apiClient.get(`${API_PREFIX}/product/${productId}/date/${date}/available`);
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

  async getByDateRange(startDate, endDate, page = 1, pageSize = 20) {
    const startTime = Date.now();
    
    try {
      const params = {
        startDate,
        endDate,
        page,
        pageSize
      };

      const result = await _fetchWithRetry(async () => {
        return await apiClient.get(`${API_PREFIX}/date-range`, { params });
      });
      
      telemetry.record('schedules.service.load_by_date_range', {
        duration: Date.now() - startTime
      });
      
      return result;
    } catch (error) {
      telemetry.record('schedules.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'getByDateRange'
      });
      throw error;
    }
  },

  async getByProduct(productId, page = 1, pageSize = 20) {
    const startTime = Date.now();
    
    try {
      const params = {
        page,
        pageSize
      };

      const result = await _fetchWithRetry(async () => {
        return await apiClient.get(`${API_PREFIX}/product/${productId}`, { params });
      });
      
      telemetry.record('schedules.service.load_by_product', {
        duration: Date.now() - startTime
      });
      
      return result;
    } catch (error) {
      telemetry.record('schedules.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'getByProduct'
      });
      throw error;
    }
  }
};