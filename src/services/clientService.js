// src/services/clientService.js
import { apiClient } from './api';
import { telemetry } from '../utils/telemetry';
import { clientListData } from './mocks/clientMock';

// Según docs/api/CLIENT_API.md los endpoints usan prefijo singular `/client`
const API_PREFIX = '/client';
const USE_MOCK = import.meta.env.VITE_USE_DEMO === 'true';

// Opciones comunes para clientes: no requieren contexto de sucursal
const CLIENT_OPTIONS = { skipBranchContext: true };

// Helper to simulate API delay
const _mockRes = (data, delay = 500) =>
  new Promise(resolve =>
    setTimeout(() => resolve(data), delay),
  );

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
  async searchByName(name) {
    const startTime = Date.now();
    try {
      if (USE_MOCK) {
        const term = name.toLowerCase();
        const filtered = clientListData.filter(c => 
          (c.name || '').toLowerCase().includes(term) || 
          (c.last_name || '').toLowerCase().includes(term) ||
          (c.document_id || '').toLowerCase().includes(term)
        );
        return _mockRes(filtered);
      }
      const endpoint = `${API_PREFIX}/name/${encodeURIComponent(name)}`;
      const result = await _fetchWithRetry(async () => apiClient.get(endpoint, CLIENT_OPTIONS));
      
      telemetry.record('client.service.search', { duration: Date.now() - startTime, name });
      return result;
    } catch (error) {
      telemetry.record('client.service.error', { duration: Date.now() - startTime, error: error.message, operation: 'searchByName' });
      throw error;
    }
  },

  async getById(id) {
    const startTime = Date.now();
    try {
      if (USE_MOCK) {
        const client = clientListData.find(c => c.id === id);
        return _mockRes(client || null);
      }
      const endpoint = `${API_PREFIX}/${id}`;
      const result = await _fetchWithRetry(async () => apiClient.get(endpoint, CLIENT_OPTIONS));
      
      telemetry.record('client.service.getById', { duration: Date.now() - startTime });
      return result;
    } catch (error) {
      telemetry.record('client.service.error', { duration: Date.now() - startTime, error: error.message, operation: 'getById' });
      throw error;
    }
  },

  async getAll(page = 1, pageSize = 10) {
    const startTime = Date.now();
    try {
      if (USE_MOCK) {
        return _mockRes({
          clients: clientListData.slice((page - 1) * pageSize, page * pageSize),
          total: clientListData.length
        });
      }
      // Corregido: GET /client/{page}/{pageSize} según la guía
      const endpoint = `${API_PREFIX}/${page}/${pageSize}`;
      const result = await _fetchWithRetry(async () => apiClient.get(endpoint, CLIENT_OPTIONS));
      
      telemetry.record('client.service.getAll', { duration: Date.now() - startTime, page, pageSize });
      return result;
    } catch (error) {
      telemetry.record('client.service.error', { duration: Date.now() - startTime, error: error.message, operation: 'getAll' });
      throw error;
    }
  },

  async create(data) {
    const startTime = Date.now();
    
    try {
      // POST /client/
      const endpoint = `${API_PREFIX}/`;
      const result = await _fetchWithRetry(async () => {
        return await apiClient.post(endpoint, data, CLIENT_OPTIONS);
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
        return await apiClient.put(`${API_PREFIX}/${id}`, data, CLIENT_OPTIONS);
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
      // PUT /client/delete/{id}
      const result = await _fetchWithRetry(async () => apiClient.put(`${API_PREFIX}/delete/${id}`, {}, CLIENT_OPTIONS));
      telemetry.record('client.service.delete', { duration: Date.now() - startTime });
      return result;
    } catch (error) {
      telemetry.record('client.service.error', { duration: Date.now() - startTime, error: error.message, operation: 'delete' });
      throw error;
    }
  }
};

export default clientService;
