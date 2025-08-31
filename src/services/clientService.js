// src/services/clientService.js
import apiService from './api';
import { telemetry } from '../utils/telemetry';

const API_PREFIX = '/clients'; // Ajustado según docs/api/CLIENT_API.md

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
      const query = new URLSearchParams(params).toString();
      const endpoint = query ? `${API_PREFIX}?${query}` : API_PREFIX;

      const result = await _fetchWithRetry(async () => {
        return await apiService.get(endpoint);
      });
      
      telemetry.record('client.service.load', {
        duration: Date.now() - startTime
      });
      
      return result;
    } catch (error) {
      telemetry.record('client.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'getAll'
      });
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
      const result = await _fetchWithRetry(async () => {
        return await apiService.delete(`${API_PREFIX}/${id}`);
      });
      
      telemetry.record('client.service.delete', {
        duration: Date.now() - startTime
      });
      
      return result;
    } catch (error) {
      telemetry.record('client.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'delete'
      });
      throw error;
    }
  },

  async getStatistics() {
    const startTime = Date.now();
    try {
      const result = await _fetchWithRetry(async () => {
        return await apiService.get(`${API_PREFIX}/statistics`);
      });
      telemetry.record('client.service.stats', {
        duration: Date.now() - startTime
      });
      return result;
    } catch (error) {
      telemetry.record('client.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'getStatistics'
      });
      throw error;
    }
  }
};
