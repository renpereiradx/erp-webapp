// src/services/clientService.js
import apiService from './api';
import { telemetry } from '../utils/telemetry';

// Según docs/api/CLIENT_API.md los endpoints usan prefijo singular `/client`
const API_PREFIX = '/client';

// Helper con retry simple (máx 2 reintentos)
const _fetchWithRetry = async (requestFn, maxRetries = 2) => {
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error;
      
      if (attempt < maxRetries) {
        // Backoff simple: 500ms * intento
        const backoffMs = 500 * (attempt + 1);
        await new Promise(resolve => setTimeout(resolve, backoffMs));
        continue;
      }
    }
  }
  
  throw lastError;
};

export const clientService = {
  async getAll(params = {}) {
    const startTime = Date.now();
    try {
      let endpoint;
      // Paginación documentada: /client/{page}/{pageSize}
      if (params.page && params.pageSize) {
        endpoint = `${API_PREFIX}/${params.page}/${params.pageSize}`;
      } else {
        endpoint = API_PREFIX; // fallback no paginado (si backend lo permite)
      }
      const result = await _fetchWithRetry(async () => apiService.get(endpoint));
      if (typeof window !== 'undefined') {
        // Debug: estructura cruda de la respuesta
        console.log('[clientService.getAll] endpoint:', endpoint, 'raw result:', result);
      }
      // Parsear si la respuesta es string JSON
      let parsedResult = result;
      if (typeof result === 'string') {
        try {
          parsedResult = JSON.parse(result);
          if (typeof window !== 'undefined') {
            console.log('[clientService.getAll] parsed result:', parsedResult);
          }
        } catch (e) {
          console.error('[clientService.getAll] JSON parse error:', e);
        }
      }
      telemetry.record('client.service.load', { duration: Date.now() - startTime });
      return parsedResult;
    } catch (error) {
      telemetry.record('client.service.error', { duration: Date.now() - startTime, error: error.message, operation: 'getAll' });
      throw error;
    }
  },

  async searchByName(name) {
    const startTime = Date.now();
    try {
      const endpoint = `${API_PREFIX}/name/${encodeURIComponent(name)}`;
      const result = await _fetchWithRetry(async () => apiService.get(endpoint));
      if (typeof window !== 'undefined') {
        console.log('[clientService.searchByName] endpoint:', endpoint, 'raw result:', result);
      }
      // Parsear si la respuesta es string JSON
      let parsedResult = result;
      if (typeof result === 'string') {
        try {
          parsedResult = JSON.parse(result);
          if (typeof window !== 'undefined') {
            console.log('[clientService.searchByName] parsed result:', parsedResult);
          }
        } catch (e) {
          console.error('[clientService.searchByName] JSON parse error:', e);
        }
      }
      telemetry.record('client.service.search', { duration: Date.now() - startTime, name });
      return parsedResult;
    } catch (error) {
      telemetry.record('client.service.error', { duration: Date.now() - startTime, error: error.message, operation: 'searchByName' });
      throw error;
    }
  },

  async getById(id) {
    const startTime = Date.now();
    try {
      const endpoint = `${API_PREFIX}/${id}`;
      const result = await _fetchWithRetry(async () => apiService.get(endpoint));
      if (typeof window !== 'undefined') {
        console.log('[clientService.getById] endpoint:', endpoint, 'raw result:', result);
      }
      // Parsear si la respuesta es string JSON
      let parsedResult = result;
      if (typeof result === 'string') {
        try {
          parsedResult = JSON.parse(result);
          if (typeof window !== 'undefined') {
            console.log('[clientService.getById] parsed result:', parsedResult);
          }
        } catch (e) {
          console.error('[clientService.getById] JSON parse error:', e);
        }
      }
      telemetry.record('client.service.getById', { duration: Date.now() - startTime });
      return parsedResult;
    } catch (error) {
      telemetry.record('client.service.error', { duration: Date.now() - startTime, error: error.message, operation: 'getById' });
      throw error;
    }
  },

  async create(data) {
    const startTime = Date.now();
    
    try {
      const result = await _fetchWithRetry(async () => {
        return await apiService.post(API_PREFIX, data);
      });
      
      telemetry.record('client.service.create', {
        duration: Date.now() - startTime
      });
      
      return result;
    } catch (error) {
      telemetry.record('client.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'create'
      });
      throw error;
    }
  },

  async update(id, data) {
    const startTime = Date.now();
    
    try {
      const result = await _fetchWithRetry(async () => {
        return await apiService.put(`${API_PREFIX}/${id}`, data);
      });
      
      telemetry.record('client.service.update', {
        duration: Date.now() - startTime
      });
      
      return result;
    } catch (error) {
      telemetry.record('client.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'update'
      });
      throw error;
    }
  },

  async delete(id) {
    const startTime = Date.now();
    try {
      // Documentado como PUT /client/delete/{id}
      const result = await _fetchWithRetry(async () => apiService.put(`${API_PREFIX}/delete/${id}`, {}));
      telemetry.record('client.service.delete', { duration: Date.now() - startTime });
      return result;
    } catch (error) {
      telemetry.record('client.service.error', { duration: Date.now() - startTime, error: error.message, operation: 'delete' });
      throw error;
    }
  },

  // No existe en docs actuales un endpoint de estadísticas estándar; se mantiene placeholder si se agrega luego
  async getStatistics() { return { success: false, message: 'Not implemented' }; }
};
