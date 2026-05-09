import { apiClient } from './api';
import { telemetry } from '../utils/telemetry';

// Según docs/guides/multibranch-implementation/PARTY_API_GUIDE.md usamos la API unificada
const API_PREFIX = '/api/v1/parties';

// Opciones comunes para proveedores: no requieren contexto de sucursal
const SUPPLIER_OPTIONS = { skipBranchContext: true };

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
      if (params.page && params.pageSize) {
        endpoint = `${API_PREFIX}?party_type=SUPPLIER&page=${params.page}&page_size=${params.pageSize}`;
      } else {
        endpoint = `${API_PREFIX}?party_type=SUPPLIER&page=1&page_size=50`;
      }
      
      const result = await _fetchWithRetry(() => apiClient.get(endpoint, SUPPLIER_OPTIONS));
      telemetry.record('supplier.service.load', { duration: Date.now() - startTime });
      return result.data?.items || result.items || result;
    } catch (error) {
      telemetry.record('supplier.service.error', { duration: Date.now() - startTime, error: error.message, operation: 'getAll' });
      throw error;
    }
  },

  getById: async (id) => {
    const startTime = Date.now();
    try {
      const endpoint = `${API_PREFIX}/${id}`;
      const result = await _fetchWithRetry(() => apiClient.get(endpoint, SUPPLIER_OPTIONS));
      telemetry.record('supplier.service.getById', { duration: Date.now() - startTime });
      return result.data || result;
    } catch (error) {
      telemetry.record('supplier.service.error', { duration: Date.now() - startTime, error: error.message, operation: 'getById' });
      throw error;
    }
  },

  searchByName: async (name) => {
    const startTime = Date.now();
    try {
      const endpoint = `${API_PREFIX}?party_type=SUPPLIER&search=${encodeURIComponent(name)}`;
      const result = await _fetchWithRetry(() => apiClient.get(endpoint, SUPPLIER_OPTIONS));
      telemetry.record('supplier.service.search', { duration: Date.now() - startTime, name });
      return result.data?.items || result.items || result;
    } catch (error) {
      telemetry.record('supplier.service.error', { duration: Date.now() - startTime, error: error.message, operation: 'searchByName' });
      throw error;
    }
  },

  create: async (data) => {
    const startTime = Date.now();
    try {
      const endpoint = `${API_PREFIX}`;
      const payload = {
        ...data,
        party_type: 'SUPPLIER',
        first_name: data.first_name || data.name || '',
      };
      
      const result = await _fetchWithRetry(() => apiClient.post(endpoint, payload, SUPPLIER_OPTIONS));
      telemetry.record('supplier.service.create', { duration: Date.now() - startTime });
      return result.data || result;
    } catch (error) {
      telemetry.record('supplier.service.error', { duration: Date.now() - startTime, error: error.message, operation: 'create' });
      throw error;
    }
  },
  
  update: async (id, data) => {
    const startTime = Date.now();
    try {
      const payload = { ...data };
      if (payload.status === true) payload.status = 'active';
      if (payload.status === false) payload.status = 'inactive';
      
      if (payload.name && !payload.first_name) {
        payload.first_name = payload.name;
        delete payload.name;
      }

      const result = await _fetchWithRetry(() => apiClient.put(`${API_PREFIX}/${id}`, payload, SUPPLIER_OPTIONS));
      telemetry.record('supplier.service.update', { duration: Date.now() - startTime });
      return result.data || result;
    } catch (error) {
      telemetry.record('supplier.service.error', { duration: Date.now() - startTime, error: error.message, operation: 'update' });
      throw error;
    }
  },
  
  delete: async (id) => {
    const startTime = Date.now();
    try {
      const result = await _fetchWithRetry(() => apiClient.delete(`${API_PREFIX}/${id}`, SUPPLIER_OPTIONS));
      telemetry.record('supplier.service.delete', { duration: Date.now() - startTime });
      return result.data || result;
    } catch (error) {
      telemetry.record('supplier.service.error', { duration: Date.now() - startTime, error: error.message, operation: 'delete' });
      throw error;
    }
  }
};

export default supplierService;
