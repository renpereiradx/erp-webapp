import apiService from './api';
import { telemetry } from '../utils/telemetry';

const API_PREFIX = '/suppliers';

const _fetchWithRetry = async (requestFn, maxRetries = 2) => {
  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        const backoffMs = 500 * (attempt + 1);
        await new Promise(resolve => setTimeout(resolve, backoffMs));
      }
    }
  }
  throw lastError;
};

const supplierService = {
  getAll: async (params = {}) => {
    const startTime = Date.now();
    try {
      const query = new URLSearchParams(params).toString();
      const endpoint = query ? `${API_PREFIX}?${query}` : API_PREFIX;
      const result = await _fetchWithRetry(() => apiService.get(endpoint));
      telemetry.record('supplier.service.load', { duration: Date.now() - startTime });
      return result;
    } catch (error) {
      telemetry.record('supplier.service.error', { duration: Date.now() - startTime, error: error.message, operation: 'getAll' });
      throw error;
    }
  },
  create: async (data) => {
    const startTime = Date.now();
    try {
      const result = await _fetchWithRetry(() => apiService.post(API_PREFIX, data));
      telemetry.record('supplier.service.create', { duration: Date.now() - startTime });
      return result;
    } catch (error) {
      telemetry.record('supplier.service.error', { duration: Date.now() - startTime, error: error.message, operation: 'create' });
      throw error;
    }
  },
  
  update: async (id, data) => {
    const startTime = Date.now();
    try {
      const result = await _fetchWithRetry(() => apiService.put(`${API_PREFIX}/${id}`, data));
      telemetry.record('supplier.service.update', { duration: Date.now() - startTime });
      return result;
    } catch (error) {
      telemetry.record('supplier.service.error', { duration: Date.now() - startTime, error: error.message, operation: 'update' });
      throw error;
    }
  },
  
  delete: async (id) => {
    const startTime = Date.now();
    try {
      const result = await _fetchWithRetry(() => apiService.delete(`${API_PREFIX}/${id}`));
      telemetry.record('supplier.service.delete', { duration: Date.now() - startTime });
      return result;
    } catch (error) {
      telemetry.record('supplier.service.error', { duration: Date.now() - startTime, error: error.message, operation: 'delete' });
      throw error;
    }
  },
  
  getStatistics: async () => {
    const startTime = Date.now();
    try {
      const result = await _fetchWithRetry(() => apiService.get(`${API_PREFIX}/statistics`));
      telemetry.record('supplier.service.stats', { duration: Date.now() - startTime });
      return result;
    } catch (error) {
      telemetry.record('supplier.service.error', { duration: Date.now() - startTime, error: error.message, operation: 'getStatistics' });
      throw error;
    }
  }
};

export default supplierService;