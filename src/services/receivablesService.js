import apiService from './api';
import { telemetry } from '../utils/telemetry';
import { summaryData, agingData, debtorsData, forecastData, masterListData, detailData, overdueData, clientProfileData, agingReportData } from './mocks/receivablesMock';

const API_PREFIX = '/receivables';
const USE_MOCK = true; // Toggle this when backend is ready

// Helper for retries
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

// Helper to simulate API delay
const _mockRes = (data) => new Promise(resolve => setTimeout(() => resolve({ data, success: true }), 600));

export const receivablesService = {
  /**
   * Get receivables summary KPIs
   * @param {string} period - 'today', 'week', 'month', 'year'
   */
  async getSummary(period = 'month') {
    const startTime = Date.now();
    try {
      if (USE_MOCK) return _mockRes(summaryData);

      const endpoint = `${API_PREFIX}/summary?period=${period}`;
      const result = await _fetchWithRetry(async () => apiService.get(endpoint));
      telemetry.record('receivables.service.summary', { duration: Date.now() - startTime, period });
      return result;
    } catch (error) {
      telemetry.record('receivables.service.error', { duration: Date.now() - startTime, error: error.message, operation: 'getSummary' });
      throw error;
    }
  },

  /**
   * Get aging report data
   */
  async getAging() {
    const startTime = Date.now();
    try {
      if (USE_MOCK) return _mockRes(agingData);

      const endpoint = `${API_PREFIX}/aging`;
      const result = await _fetchWithRetry(async () => apiService.get(endpoint));
      telemetry.record('receivables.service.aging', { duration: Date.now() - startTime });
      return result;
    } catch (error) {
      telemetry.record('receivables.service.error', { duration: Date.now() - startTime, error: error.message, operation: 'getAging' });
      throw error;
    }
  },

  /**
   * Get cash flow forecast
   * @param {number} weeks - default 4
   */
  async getForecast(weeks = 4) {
    const startTime = Date.now();
    try {
      if (USE_MOCK) return _mockRes(forecastData);

      const endpoint = `${API_PREFIX}/forecast?weeks=${weeks}`;
      const result = await _fetchWithRetry(async () => apiService.get(endpoint));
      telemetry.record('receivables.service.forecast', { duration: Date.now() - startTime, weeks });
      return result;
    } catch (error) {
      telemetry.record('receivables.service.error', { duration: Date.now() - startTime, error: error.message, operation: 'getForecast' });
      throw error;
    }
  },

  /**
   * Get top debtors list
   * @param {number} limit - default 10
   * @param {string} filter - optional text filter
   */
  async getTopDebtors(limit = 10, filter = '') {
    const startTime = Date.now();
    try {
      if (USE_MOCK) return _mockRes(debtorsData);

      const queryParams = new URLSearchParams({ limit });
      if (filter) queryParams.append('filter', filter);
      
      const endpoint = `${API_PREFIX}/top-debtors?${queryParams.toString()}`;
      const result = await _fetchWithRetry(async () => apiService.get(endpoint));
      telemetry.record('receivables.service.topDebtors', { duration: Date.now() - startTime, filter });
      return result;
    } catch (error) {
      telemetry.record('receivables.service.error', { duration: Date.now() - startTime, error: error.message, operation: 'getTopDebtors' });
      throw error;
    }
  },

  /**
   * Get master list of receivables
   * @param {Object} filters
   */
  async getMasterList(filters = {}) {
    const startTime = Date.now();
    try {
      if (USE_MOCK) return _mockRes(masterListData);

      const queryParams = new URLSearchParams(filters);
      const endpoint = `${API_PREFIX}/list?${queryParams.toString()}`;
      const result = await _fetchWithRetry(async () => apiService.get(endpoint));
      telemetry.record('receivables.service.masterList', { duration: Date.now() - startTime, filters });
      return result;
    } catch (error) {
      telemetry.record('receivables.service.error', { duration: Date.now() - startTime, error: error.message, operation: 'getMasterList' });
      throw error;
    }
  },

  /**
   * Get transaction details
   * @param {string} id
   */
  async getTransactionDetail(id) {
    const startTime = Date.now();
    try {
      if (USE_MOCK) return _mockRes(detailData);

      const endpoint = `${API_PREFIX}/detail/${id}`;
      const result = await _fetchWithRetry(async () => apiService.get(endpoint));
      telemetry.record('receivables.service.detail', { duration: Date.now() - startTime, id });
      return result;
    } catch (error) {
      telemetry.record('receivables.service.error', { duration: Date.now() - startTime, error: error.message, operation: 'getTransactionDetail' });
      throw error;
    }
  },

  /**
   * Get overdue accounts for collection
   */
  async getOverdueAccounts() {
    const startTime = Date.now();
    try {
      if (USE_MOCK) return _mockRes(overdueData);

      const endpoint = `${API_PREFIX}/overdue`;
      const result = await _fetchWithRetry(async () => apiService.get(endpoint));
      telemetry.record('receivables.service.overdue', { duration: Date.now() - startTime });
      return result;
    } catch (error) {
      telemetry.record('receivables.service.error', { duration: Date.now() - startTime, error: error.message, operation: 'getOverdueAccounts' });
      throw error;
    }
  },

  /**
   * Get client credit profile
   * @param {string} clientId
   */
  async getClientProfile(clientId) {
    const startTime = Date.now();
    try {
      if (USE_MOCK) return _mockRes(clientProfileData);

      const endpoint = `${API_PREFIX}/client-profile/${clientId}`;
      const result = await _fetchWithRetry(async () => apiService.get(endpoint));
      telemetry.record('receivables.service.clientProfile', { duration: Date.now() - startTime, clientId });
      return result;
    } catch (error) {
      telemetry.record('receivables.service.error', { duration: Date.now() - startTime, error: error.message, operation: 'getClientProfile' });
      throw error;
    }
  },

  /**
   * Get detailed aging report
   */
  async getDetailedAging() {
    const startTime = Date.now();
    try {
      if (USE_MOCK) return _mockRes(agingReportData);

      const endpoint = `${API_PREFIX}/aging-report`;
      const result = await _fetchWithRetry(async () => apiService.get(endpoint));
      telemetry.record('receivables.service.detailedAging', { duration: Date.now() - startTime });
      return result;
    } catch (error) {
      telemetry.record('receivables.service.error', { duration: Date.now() - startTime, error: error.message, operation: 'getDetailedAging' });
      throw error;
    }
  }
};
