import apiService from './api';
import { telemetry } from '../utils/telemetry';
import { summaryData, agingData, debtorsData, forecastData, masterListData, detailData, overdueData, clientProfileData, agingReportData } from './mocks/receivablesMock';

const API_PREFIX = '/receivables';
const USE_MOCK = import.meta.env.VITE_USE_DEMO === 'true'; // Controlled by environment variable

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

      const endpoint = `${API_PREFIX}/overview?period=${period}`;
      const result = await _fetchWithRetry(async () => apiService.get(endpoint));
      telemetry.record('receivables.service.summary', { duration: Date.now() - startTime, period });
      return result;
    } catch (error) {
      telemetry.record('receivables.service.error', { duration: Date.now() - startTime, error: error.message, operation: 'getSummary' });
      throw error;
    }
  },

  /**
   * Get aging summary buckets (Endpoint 8)
   */
  async getAgingSummary() {
    const startTime = Date.now();
    try {
      if (USE_MOCK) {
        return _mockRes({
          current: { amount: 8500000, count: 25, percentage: 55.92 },
          days_30_60: { amount: 3200000, count: 12, percentage: 21.05 },
          days_60_90: { amount: 2000000, count: 5, percentage: 13.16 },
          over_90_days: { amount: 1500000, count: 3, percentage: 9.87 }
        });
      }

      const endpoint = `${API_PREFIX}/aging/summary`;
      const result = await _fetchWithRetry(async () => apiService.get(endpoint));
      telemetry.record('receivables.service.agingSummary', { duration: Date.now() - startTime });
      return result;
    } catch (error) {
      telemetry.record('receivables.service.error', { duration: Date.now() - startTime, error: error.message, operation: 'getAgingSummary' });
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

      const endpoint = `${API_PREFIX}/aging/report`;
      const result = await _fetchWithRetry(async () => apiService.get(endpoint));
      telemetry.record('receivables.service.aging', { duration: Date.now() - startTime });
      return result;
    } catch (error) {
      telemetry.record('receivables.service.error', { duration: Date.now() - startTime, error: error.message, operation: 'getAging' });
      throw error;
    }
  },

  /**
   * Get detailed aging report (Endpoint 9)
   */
  async getDetailedAging() {
    const startTime = Date.now();
    try {
      if (USE_MOCK) {
        return _mockRes({
          generated_at: "2026-01-03T10:30:00Z",
          summary: {
            current: { amount: 8500000, count: 25, percentage: 55.92 },
            days_30_60: { amount: 3200000, count: 12, percentage: 21.05 },
            days_60_90: { amount: 2000000, count: 5, percentage: 13.16 },
            over_90_days: { amount: 1500000, count: 3, percentage: 9.87 }
          },
          by_client: [
            { client_id: "client_123", client_name: "Empresa ABC", current: 500000, days_30_60: 300000, days_60_90: 0, over_90_days: 0, total: 800000 },
            { client_id: "client_456", client_name: "Logística Nacional", current: 1200000, days_30_60: 450000, days_60_90: 200000, over_90_days: 100000, total: 1950000 },
            { client_id: "client_789", client_name: "Distribuidora del Este", current: 800000, days_30_60: 0, days_60_90: 0, over_90_days: 500000, total: 1300000 }
          ],
          total_amount: 15200000
        });
      }

      const endpoint = `${API_PREFIX}/aging/report`;
      const result = await _fetchWithRetry(async () => apiService.get(endpoint));
      telemetry.record('receivables.service.detailedAging', { duration: Date.now() - startTime });
      return result;
    } catch (error) {
      telemetry.record('receivables.service.error', { duration: Date.now() - startTime, error: error.message, operation: 'getDetailedAging' });
      throw error;
    }
  },

  /**
   * Get collection statistics (Endpoint 12)
   * @param {string} period - 'today', 'week', 'month', 'year'
   */
  async getStatistics(period = 'month') {
    const startTime = Date.now();
    try {
      if (USE_MOCK) {
        return _mockRes({
          period: "2025-12-01 - 2025-12-31",
          total_billed: 25000000,
          total_collected: 19625000,
          collection_rate: 78.5,
          average_dso: 28.5,
          overdue_percentage: 23.03,
          collection_trend: [
            { date: "2025-12-01", billed: 5000000, collected: 4000000, balance: 1000000 },
            { date: "2025-12-08", billed: 6000000, collected: 5500000, balance: 500000 },
            { date: "2025-12-15", billed: 7000000, collected: 4500000, balance: 2500000 },
            { date: "2025-12-22", billed: 7000000, collected: 5625000, balance: 1375000 }
          ]
        });
      }

      const endpoint = `${API_PREFIX}/statistics?period=${period}`;
      const result = await _fetchWithRetry(async () => apiService.get(endpoint));
      telemetry.record('receivables.service.statistics', { duration: Date.now() - startTime, period });
      return result;
    } catch (error) {
      telemetry.record('receivables.service.error', { duration: Date.now() - startTime, error: error.message, operation: 'getStatistics' });
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

      const endpoint = `${API_PREFIX}/statistics?period=month`; // Map forecast to stats for now if not ready
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
   * @param {Object} pagination - { page, pageSize }
   * @param {Object} sorting - { sortBy, sortOrder }
   */
  async getMasterList(filters = {}, pagination = {}, sorting = {}) {
    const startTime = Date.now();
    try {
      if (USE_MOCK) return _mockRes(masterListData);

      // Map frontend keys to API param names and strip empty/default values
      const keyMap = {
        search: 'search',
        dateStart: 'start_date',
        dateEnd: 'end_date',
        minAmount: 'min_amount',
        maxAmount: 'max_amount',
        daysOverdue: 'days_overdue',
      };

      const queryParams = new URLSearchParams();

      // Filters
      for (const [frontKey, apiKey] of Object.entries(keyMap)) {
        const val = filters[frontKey];
        if (val !== undefined && val !== null && val !== '') {
          queryParams.append(apiKey, val);
        }
      }
      if (filters.status && filters.status !== 'all') {
        queryParams.append('status', filters.status.toUpperCase());
      }

      // Pagination
      if (pagination.page) queryParams.append('page', pagination.page);
      if (pagination.pageSize) queryParams.append('page_size', pagination.pageSize);

      // Sorting
      if (sorting.sortBy) queryParams.append('sort_by', sorting.sortBy);
      if (sorting.sortOrder) queryParams.append('sort_order', sorting.sortOrder);

      const qs = queryParams.toString();
      const endpoint = `${API_PREFIX}${qs ? '?' + qs : ''}`;
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

      const endpoint = `${API_PREFIX}/${id}`;
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
   * Get client credit profile (Endpoint 6)
   * @param {string} clientId
   */
  async getClientProfile(clientId) {
    const startTime = Date.now();
    try {
      if (USE_MOCK) {
        // Return structured mock matching Endpoint 6
        return _mockRes({
          client_id: clientId,
          client_name: "Acme Corp Logistics",
          client_phone: "+1 (619) 555-0123",
          total_pending: 124500,
          total_overdue: 25000,
          pending_count: 4,
          oldest_debt: "2023-10-12T10:00:00Z",
          payment_behavior: "REGULAR",
          average_days_to_pay: 45,
          receivables: [
            { id: 'INV-2023-001', sale_date: '2023-10-12T10:00:00Z', due_date: '2023-11-12T10:00:00Z', original_amount: 10000, pending_amount: 10000, status: 'OVERDUE' },
            { id: 'INV-2023-045', sale_date: '2023-12-01T10:00:00Z', due_date: '2024-01-01T10:00:00Z', original_amount: 14940, pending_amount: 14940, status: 'OVERDUE' },
            { id: 'INV-2024-002', sale_date: '2024-01-15T10:00:00Z', due_date: '2024-02-15T10:00:00Z', original_amount: 45000, pending_amount: 31125, status: 'PARTIAL' },
            { id: 'INV-2024-012', sale_date: '2024-02-10T10:00:00Z', due_date: '2024-03-10T10:00:00Z', original_amount: 68475, pending_amount: 68475, status: 'PENDING' }
          ]
        });
      }

      const endpoint = `${API_PREFIX}/client/${clientId}`;
      const result = await _fetchWithRetry(async () => apiService.get(endpoint));
      telemetry.record('receivables.service.clientProfile', { duration: Date.now() - startTime, clientId });
      return result;
    } catch (error) {
      telemetry.record('receivables.service.error', { duration: Date.now() - startTime, error: error.message, operation: 'getClientProfile' });
      throw error;
    }
  },

  /**
   * Get client risk analysis (Endpoint 7)
   * @param {string} clientId
   */
  async getClientRiskAnalysis(clientId) {
    const startTime = Date.now();
    try {
      if (USE_MOCK) {
        return _mockRes({
          client_id: clientId,
          client_name: "Acme Corp Logistics",
          risk_score: 72,
          risk_level: "MEDIUM",
          payment_behavior: "REGULAR",
          total_pending: 124500,
          total_overdue: 25000,
          avg_days_to_pay: 45,
          recommendations: [
            "Monitorear de cerca",
            "Solicitar pago parcial antes de liberar el próximo envío"
          ]
        });
      }

      const endpoint = `${API_PREFIX}/client/${clientId}/risk`;
      const result = await _fetchWithRetry(async () => apiService.get(endpoint));
      telemetry.record('receivables.service.clientRisk', { duration: Date.now() - startTime, clientId });
      return result;
    } catch (error) {
      telemetry.record('receivables.service.error', { duration: Date.now() - startTime, error: error.message, operation: 'getClientRiskAnalysis' });
      throw error;
    }
  },

  /**
   * Get collection reminders (Endpoint 10)
   * @param {string} priority - Optional: 'HIGH', 'MEDIUM', 'LOW'
   */
  async getCollectionReminders(priority = '') {
    const startTime = Date.now();
    try {
      if (USE_MOCK) {
        const mockReminders = [
          {
            receivable_id: "sale_001",
            client_id: "client_123",
            client_name: "Juan Pérez",
            client_phone: "0981234567",
            pending_amount: 300000,
            days_overdue: 15,
            due_date: "2025-12-15T10:00:00Z",
            priority: "MEDIUM"
          },
          {
            receivable_id: "sale_045",
            client_id: "client_456",
            client_name: "María García",
            client_phone: "0991234567",
            pending_amount: 850000,
            days_overdue: 75,
            due_date: "2025-10-20T10:00:00Z",
            priority: "HIGH"
          },
          {
            receivable_id: "sale_089",
            client_id: "client_789",
            client_name: "Carlos López",
            client_phone: "0971234567",
            pending_amount: 125000,
            days_overdue: 8,
            due_date: "2026-01-05T10:00:00Z",
            priority: "LOW"
          }
        ];

        // Filter by priority if provided
        const filtered = priority
          ? mockReminders.filter(r => r.priority === priority.toUpperCase())
          : mockReminders;

        return _mockRes(filtered);
      }

      const queryParams = new URLSearchParams();
      if (priority) queryParams.append('priority', priority);

      const endpoint = `${API_PREFIX}/collection/reminders${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const result = await _fetchWithRetry(async () => apiService.get(endpoint));
      telemetry.record('receivables.service.reminders', { duration: Date.now() - startTime, priority });
      return result;
    } catch (error) {
      telemetry.record('receivables.service.error', { duration: Date.now() - startTime, error: error.message, operation: 'getCollectionReminders' });
      throw error;
    }
  },

  /**
   * Get high priority collection reminders (Endpoint 11)
   * Shortcut for reminders with >60 days overdue
   */
  async getHighPriorityReminders() {
    const startTime = Date.now();
    try {
      if (USE_MOCK) {
        return _mockRes([
          {
            receivable_id: "sale_045",
            client_id: "client_456",
            client_name: "María García",
            client_phone: "0991234567",
            pending_amount: 850000,
            days_overdue: 75,
            due_date: "2025-10-20T10:00:00Z",
            priority: "HIGH"
          }
        ]);
      }

      const endpoint = `${API_PREFIX}/collection/high-priority`;
      const result = await _fetchWithRetry(async () => apiService.get(endpoint));
      telemetry.record('receivables.service.highPriorityReminders', { duration: Date.now() - startTime });
      return result;
    } catch (error) {
      telemetry.record('receivables.service.error', { duration: Date.now() - startTime, error: error.message, operation: 'getHighPriorityReminders' });
      throw error;
    }
  },

  /**
   * Get statistics by date range (Endpoint 13)
   * @param {string} startDate - YYYY-MM-DD format
   * @param {string} endDate - YYYY-MM-DD format
   */
  async getStatisticsByDateRange(startDate, endDate) {
    const startTime = Date.now();
    try {
      if (USE_MOCK) {
        return _mockRes({
          period: `${startDate} - ${endDate}`,
          total_billed: 18500000,
          total_collected: 14200000,
          collection_rate: 76.8,
          average_dso: 32.5,
          overdue_percentage: 28.7,
          top_debtors: [
            {
              client_id: "client_123",
              client_name: "Empresa ABC",
              total_pending: 1850000,
              payment_behavior: "REGULAR"
            }
          ],
          collection_trend: [
            {
              date: startDate,
              billed: 4500000,
              collected: 3200000,
              balance: 1300000
            }
          ]
        });
      }

      const queryParams = new URLSearchParams({
        start_date: startDate,
        end_date: endDate
      });

      const endpoint = `${API_PREFIX}/statistics/date-range?${queryParams.toString()}`;
      const result = await _fetchWithRetry(async () => apiService.get(endpoint));
      telemetry.record('receivables.service.statisticsByDateRange', { duration: Date.now() - startTime, startDate, endDate });
      return result;
    } catch (error) {
      telemetry.record('receivables.service.error', { duration: Date.now() - startTime, error: error.message, operation: 'getStatisticsByDateRange' });
      throw error;
    }
  }
};
