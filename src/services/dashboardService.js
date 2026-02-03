// src/services/dashboardService.js
import apiService from './api';
import { telemetry } from '../utils/telemetry';

const API_PREFIX = '/dashboard';

// Helper for retries (consistent with clientService)
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
        continue;
      }
    }
  }
  
  throw lastError;
};

export const dashboardService = {
  /**
   * Get executive dashboard summary
   * @param {string} period - 'today', 'week', 'month', 'year'
   */
  async getSummary(period = 'today') {
    const startTime = Date.now();
    try {
      const endpoint = `${API_PREFIX}/summary?period=${period}`;
      const result = await _fetchWithRetry(async () => apiService.get(endpoint));
      telemetry.record('dashboard.service.summary', { duration: Date.now() - startTime, period });
      return result;
    } catch (error) {
      telemetry.record('dashboard.service.error', { duration: Date.now() - startTime, error: error.message, operation: 'getSummary' });
      throw error;
    }
  },

  /**
   * Get consolidated alerts
   * @param {string} severity - optional 'critical', 'warning', 'info'
   * @param {string} category - optional 'inventory', 'financial', 'sales'
   */
  async getAlerts({ severity, category } = {}) {
    const startTime = Date.now();
    try {
      const queryParams = new URLSearchParams();
      if (severity) queryParams.append('severity', severity);
      if (category) queryParams.append('category', category);
      
      const endpoint = `${API_PREFIX}/alerts?${queryParams.toString()}`;
      const result = await _fetchWithRetry(async () => apiService.get(endpoint));
      telemetry.record('dashboard.service.alerts', { duration: Date.now() - startTime });
      return result;
    } catch (error) {
      telemetry.record('dashboard.service.error', { duration: Date.now() - startTime, error: error.message, operation: 'getAlerts' });
      throw error;
    }
  },

  /**
   * Get business KPIs
   * @param {string} period - 'today', 'week', 'month', 'year'
   */
  async getKPIs(period = 'month') {
    const startTime = Date.now();
    try {
      const endpoint = `${API_PREFIX}/kpis?period=${period}`;
      const result = await _fetchWithRetry(async () => apiService.get(endpoint));
      telemetry.record('dashboard.service.kpis', { duration: Date.now() - startTime, period });
      return result;
    } catch (error) {
      telemetry.record('dashboard.service.error', { duration: Date.now() - startTime, error: error.message, operation: 'getKPIs' });
      throw error;
    }
  },

  /**
   * Get recent activity
   * @param {number} limit - default 20
   */
  async getRecentActivity(limit = 20) {
    const startTime = Date.now();
    try {
      const endpoint = `${API_PREFIX}/recent-activity?limit=${limit}`;
      const result = await _fetchWithRetry(async () => apiService.get(endpoint));
      telemetry.record('dashboard.service.activity', { duration: Date.now() - startTime, limit });
      return result;
    } catch (error) {
      telemetry.record('dashboard.service.error', { duration: Date.now() - startTime, error: error.message, operation: 'getRecentActivity' });
      throw error;
    }
  },

  /**
   * Get sales heatmap data
   * @param {number} weeks - default 4
   */
  async getSalesHeatmap(weeks = 4) {
    const startTime = Date.now();
    try {
      const endpoint = `${API_PREFIX}/sales-heatmap?weeks=${weeks}`;
      const result = await _fetchWithRetry(async () => apiService.get(endpoint));
      telemetry.record('dashboard.service.heatmap', { duration: Date.now() - startTime, weeks });
      return result;
    } catch (error) {
      telemetry.record('dashboard.service.error', { duration: Date.now() - startTime, error: error.message, operation: 'getSalesHeatmap' });
      throw error;
    }
  },

  /**
   * Get top products
   * @param {string} period - 'today', 'week', 'month'
   * @param {number} limit - default 10
   * @param {string} sortBy - 'revenue', 'quantity', 'profit'
   */
  async getTopProducts(period = 'week', limit = 10, sortBy = 'revenue') {
    const startTime = Date.now();
    try {
      const endpoint = `${API_PREFIX}/top-products?period=${period}&limit=${limit}&sort_by=${sortBy}`;
      const result = await _fetchWithRetry(async () => apiService.get(endpoint));
      telemetry.record('dashboard.service.topProducts', { duration: Date.now() - startTime, period });
      return result;
    } catch (error) {
      telemetry.record('dashboard.service.error', { duration: Date.now() - startTime, error: error.message, operation: 'getTopProducts' });
      throw error;
    }
  }
};
