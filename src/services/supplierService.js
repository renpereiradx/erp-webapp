import apiService from './api';
import { telemetry } from '../utils/telemetry';

const API_PREFIX = '/supplier';

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
      let endpoint;
      // Usar paginación según la documentación: /supplier/{page}/{pageSize}
      if (params.page && params.pageSize) {
        endpoint = `${API_PREFIX}/${params.page}/${params.pageSize}`;
      } else if (params.endpoint) {
        endpoint = `${API_PREFIX}${params.endpoint}`;
      } else {
        endpoint = `${API_PREFIX}/1/50`; // Default pagination
      }
      
      const result = await _fetchWithRetry(() => apiService.get(endpoint));
      telemetry.record('supplier.service.load', { duration: Date.now() - startTime });
      return result;
    } catch (error) {
      telemetry.record('supplier.service.error', { duration: Date.now() - startTime, error: error.message, operation: 'getAll' });
      throw error;
    }
  },

  getById: async (id) => {
    const startTime = Date.now();
    try {
      const endpoint = `${API_PREFIX}/${id}`;
      const result = await _fetchWithRetry(() => apiService.get(endpoint));
      telemetry.record('supplier.service.getById', { duration: Date.now() - startTime });
      return result;
    } catch (error) {
      telemetry.record('supplier.service.error', { duration: Date.now() - startTime, error: error.message, operation: 'getById' });
      throw error;
    }
  },

  searchByName: async (name) => {
    const startTime = Date.now();
    try {
      const endpoint = `${API_PREFIX}/name/${encodeURIComponent(name)}`;
      const result = await _fetchWithRetry(() => apiService.get(endpoint));
      telemetry.record('supplier.service.search', { duration: Date.now() - startTime, name });
      return result;
    } catch (error) {
      telemetry.record('supplier.service.error', { duration: Date.now() - startTime, error: error.message, operation: 'searchByName' });
      throw error;
    }
  },
  create: async (data) => {
    const startTime = Date.now();
    try {
      // Endpoint documentado: POST /supplier/
      const endpoint = `${API_PREFIX}/`;
      const result = await _fetchWithRetry(() => apiService.post(endpoint, data));
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
      // Endpoint documentado: PUT /supplier/delete/{id} (borrado lógico)
      const result = await _fetchWithRetry(() => apiService.put(`${API_PREFIX}/delete/${id}`, {}));
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
  },

  reactivate: async (id) => {
    const startTime = Date.now();
    try {
      // Intentar endpoint de reactivación (similar pattern a delete)
      // PUT /supplier/activate/{id} o POST /supplier/activate/{id}
      const result = await _fetchWithRetry(() => apiService.put(`${API_PREFIX}/activate/${id}`, {}));
      telemetry.record('supplier.service.reactivate', { duration: Date.now() - startTime });
      return result;
    } catch (error) {
      telemetry.record('supplier.service.error', { duration: Date.now() - startTime, error: error.message, operation: 'reactivate' });
      throw error;
    }
  }
};

export default supplierService;
