import apiService from './api'
import { telemetry } from '../utils/telemetry'
import {
  summaryData,
  agingData,
  debtorsData,
  forecastData,
  masterListData,
  detailData,
  overdueData,
  clientProfileData,
  agingReportData,
} from './mocks/receivablesMock'

const API_PREFIX = '/receivables'
const USE_MOCK = import.meta.env.VITE_USE_DEMO === 'true' // Controlled by environment variable

// Helper for retries
const _fetchWithRetry = async (requestFn, maxRetries = 2) => {
  let lastError

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn()
    } catch (error) {
      lastError = error

      if (attempt < maxRetries) {
        const backoffMs = 500 * (attempt + 1)
        await new Promise(resolve => setTimeout(resolve, backoffMs))
        continue
      }
    }
  }

  throw lastError
}

// Helper to simulate API delay
const _mockRes = data =>
  new Promise(resolve =>
    setTimeout(() => resolve({ data, success: true }), 600),
  )

export const receivablesService = {
  /**
   * Get receivables summary KPIs
   * @param {string} period - 'today', 'week', 'month', 'year'
   */
  async getSummary(period = 'month') {
    const startTime = Date.now()
    try {
      if (USE_MOCK) return _mockRes(summaryData)

      const endpoint = `${API_PREFIX}/overview?period=${period}`
      const result = await _fetchWithRetry(async () => apiService.get(endpoint))
      telemetry.record('receivables.service.summary', {
        duration: Date.now() - startTime,
        period,
      })
      return result
    } catch (error) {
      telemetry.record('receivables.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'getSummary',
      })
      throw error
    }
  },

  /**
   * Get aging summary buckets (Endpoint 8)
   */
  async getAgingSummary() {
    const startTime = Date.now()
    try {
      if (USE_MOCK) return _mockRes(summaryData.aging_summary)

      const endpoint = `${API_PREFIX}/aging/summary`
      const result = await _fetchWithRetry(async () => apiService.get(endpoint))
      telemetry.record('receivables.service.agingSummary', {
        duration: Date.now() - startTime,
      })
      return result
    } catch (error) {
      telemetry.record('receivables.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'getAgingSummary',
      })
      throw error
    }
  },

  /**
   * Get aging report data
   */
  async getAging() {
    const startTime = Date.now()
    try {
      if (USE_MOCK) return _mockRes(agingData)

      const endpoint = `${API_PREFIX}/aging/report`
      const result = await _fetchWithRetry(async () => apiService.get(endpoint))
      telemetry.record('receivables.service.aging', {
        duration: Date.now() - startTime,
      })
      return result
    } catch (error) {
      telemetry.record('receivables.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'getAging',
      })
      throw error
    }
  },

  /**
   * Get detailed aging report (Endpoint 9)
   */
  async getDetailedAging() {
    const startTime = Date.now()
    try {
      if (USE_MOCK) {
        return _mockRes({
          generated_at: new Date().toISOString(),
          summary: summaryData.aging_summary,
          by_client: debtorsData.map(d => ({
            client_id: d.client_id,
            client_name: d.client_name,
            total: d.total_pending,
            over_90_days: d.total_overdue,
            behavior: d.payment_behavior,
            last_payment: d.last_payment_date
          })),
          total_amount: summaryData.total_pending,
        })
      }

      const endpoint = `${API_PREFIX}/aging/report`
      const result = await _fetchWithRetry(async () => apiService.get(endpoint))
      telemetry.record('receivables.service.detailedAging', {
        duration: Date.now() - startTime,
      })
      return result
    } catch (error) {
      telemetry.record('receivables.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'getDetailedAging',
      })
      throw error
    }
  },

  /**
   * Get collection statistics (Endpoint 12)
   * @param {string} period - 'today', 'week', 'month', 'year'
   */
  async getStatistics(period = 'month') {
    const startTime = Date.now()
    try {
      if (USE_MOCK) {
        return _mockRes({
          period: 'Último mes',
          total_billed: summaryData.total_pending * 1.2,
          total_collected: summaryData.total_pending * 0.8,
          collection_rate: summaryData.collection_rate,
          average_dso: summaryData.average_days_to_collect,
          overdue_percentage: (summaryData.total_overdue / summaryData.total_pending) * 100,
          collection_trend: [
            { date: 'Semana 1', billed: 150000000, collected: 120000000, balance: 30000000 },
            { date: 'Semana 2', billed: 180000000, collected: 140000000, balance: 40000000 },
            { date: 'Semana 3', billed: 120000000, collected: 110000000, balance: 10000000 },
            { date: 'Semana 4', billed: 200000000, collected: 160000000, balance: 40000000 },
          ],
        })
      }

      const endpoint = `${API_PREFIX}/statistics?period=${period}`
      const result = await _fetchWithRetry(async () => apiService.get(endpoint))
      telemetry.record('receivables.service.statistics', {
        duration: Date.now() - startTime,
        period,
      })
      return result
    } catch (error) {
      telemetry.record('receivables.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'getStatistics',
      })
      throw error
    }
  },

  /**
   * Get cash flow forecast
   * @param {number} weeks - default 4
   */
  async getForecast(weeks = 4) {
    const startTime = Date.now()
    try {
      if (USE_MOCK) return _mockRes(forecastData)

      const endpoint = `${API_PREFIX}/statistics?period=month` // Map forecast to stats for now if not ready
      const result = await _fetchWithRetry(async () => apiService.get(endpoint))
      telemetry.record('receivables.service.forecast', {
        duration: Date.now() - startTime,
        weeks,
      })
      return result
    } catch (error) {
      telemetry.record('receivables.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'getForecast',
      })
      throw error
    }
  },

  /**
   * Get top debtors list
   * @param {number} limit - default 10
   * @param {string} filter - optional text filter
   */
  async getTopDebtors(limit = 10, filter = '') {
    const startTime = Date.now()
    try {
      if (USE_MOCK) return _mockRes(debtorsData)

      const queryParams = new URLSearchParams({ limit })
      if (filter) queryParams.append('filter', filter)

      const endpoint = `${API_PREFIX}/top-debtors?${queryParams.toString()}`
      const result = await _fetchWithRetry(async () => apiService.get(endpoint))
      telemetry.record('receivables.service.topDebtors', {
        duration: Date.now() - startTime,
        filter,
      })
      return result
    } catch (error) {
      telemetry.record('receivables.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'getTopDebtors',
      })
      throw error
    }
  },

  /**
   * Get master list of receivables
   * @param {Object} filters
   * @param {Object} pagination - { page, pageSize }
   * @param {Object} sorting - { sortBy, sortOrder }
   */
  async getMasterList(filters = {}, pagination = {}, sorting = {}) {
    const startTime = Date.now()
    try {
      if (USE_MOCK) return _mockRes(masterListData)

      // Map frontend keys to API param names and strip empty/default values
      // Note: 'search' is not supported by API - filtering by client name is done client-side
      const keyMap = {
        dateStart: 'start_date',
        dateEnd: 'end_date',
        minAmount: 'min_amount',
        maxAmount: 'max_amount',
        daysOverdue: 'days_overdue',
      }

      const queryParams = new URLSearchParams()

      // Filters
      for (const [frontKey, apiKey] of Object.entries(keyMap)) {
        const val = filters[frontKey]
        if (val !== undefined && val !== null && val !== '') {
          queryParams.append(apiKey, val)
        }
      }
      if (filters.status && filters.status !== 'all') {
        queryParams.append('status', filters.status.toUpperCase())
      }

      // Pagination
      if (pagination.page) queryParams.append('page', pagination.page)
      if (pagination.pageSize)
        queryParams.append('page_size', pagination.pageSize)

      // Sorting
      if (sorting.sortBy) queryParams.append('sort_by', sorting.sortBy)
      if (sorting.sortOrder) queryParams.append('sort_order', sorting.sortOrder)

      const qs = queryParams.toString()
      const endpoint = `${API_PREFIX}${qs ? '?' + qs : ''}`
      const result = await _fetchWithRetry(async () => apiService.get(endpoint))
      telemetry.record('receivables.service.masterList', {
        duration: Date.now() - startTime,
        filters,
      })
      return result
    } catch (error) {
      telemetry.record('receivables.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'getMasterList',
      })
      throw error
    }
  },

  /**
   * Get transaction details
   * @param {string} id
   */
  async getTransactionDetail(id) {
    const startTime = Date.now()
    try {
      if (USE_MOCK) return _mockRes(detailData)

      const endpoint = `${API_PREFIX}/${id}`
      const result = await _fetchWithRetry(async () => apiService.get(endpoint))
      telemetry.record('receivables.service.detail', {
        duration: Date.now() - startTime,
        id,
      })
      return result
    } catch (error) {
      telemetry.record('receivables.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'getTransactionDetail',
      })
      throw error
    }
  },

  /**
   * Get overdue accounts for collection
   */
  async getOverdueAccounts() {
    const startTime = Date.now()
    try {
      if (USE_MOCK) return _mockRes(overdueData)

      const endpoint = `${API_PREFIX}/overdue`
      const result = await _fetchWithRetry(async () => apiService.get(endpoint))
      telemetry.record('receivables.service.overdue', {
        duration: Date.now() - startTime,
      })
      return result
    } catch (error) {
      telemetry.record('receivables.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'getOverdueAccounts',
      })
      throw error
    }
  },

  /**
   * Get client credit profile (Endpoint 6)
   * @param {string} clientId
   */
  async getClientProfile(clientId) {
    const startTime = Date.now()
    try {
      if (USE_MOCK) return _mockRes(clientProfileData.client)

      const endpoint = `${API_PREFIX}/client/${clientId}`
      const result = await _fetchWithRetry(async () => apiService.get(endpoint))
      telemetry.record('receivables.service.clientProfile', {
        duration: Date.now() - startTime,
        clientId,
      })
      return result
    } catch (error) {
      telemetry.record('receivables.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'getClientProfile',
      })
      throw error
    }
  },

  /**
   * Get client risk analysis (Endpoint 7)
   * @param {string} clientId
   */
  async getClientRiskAnalysis(clientId) {
    const startTime = Date.now()
    try {
      if (USE_MOCK) {
        return _mockRes({
          client_id: clientId,
          client_name: clientProfileData.client.name,
          risk_score: clientProfileData.risk.score,
          risk_level: clientProfileData.risk.level,
          payment_behavior: 'REGULAR',
          total_pending: summaryData.total_pending,
          total_overdue: summaryData.total_overdue,
          avg_days_to_pay: summaryData.average_days_to_collect,
          recommendations: [clientProfileData.risk.recommendation],
        })
      }

      const endpoint = `${API_PREFIX}/client/${clientId}/risk`
      const result = await _fetchWithRetry(async () => apiService.get(endpoint))
      telemetry.record('receivables.service.clientRisk', {
        duration: Date.now() - startTime,
        clientId,
      })
      return result
    } catch (error) {
      telemetry.record('receivables.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'getClientRiskAnalysis',
      })
      throw error
    }
  },

  /**
   * Get collection reminders (Endpoint 10)
   * @param {string} priority - Optional: 'HIGH', 'MEDIUM', 'LOW'
   */
  async getCollectionReminders(priority = '') {
    const startTime = Date.now()
    try {
      if (USE_MOCK) {
        const mockReminders = overdueData.items.map(item => ({
          receivable_id: item.id,
          client_id: 'client_001',
          client_name: item.client_name,
          client_phone: '+595 981 123 456',
          pending_amount: item.pending_amount,
          days_overdue: item.days_overdue,
          due_date: '2023-12-15T10:00:00Z',
          priority: item.status === 'CRITICAL' ? 'HIGH' : 'MEDIUM',
        }))

        // Filter by priority if provided
        const filtered = priority
          ? mockReminders.filter(r => r.priority === priority.toUpperCase())
          : mockReminders

        return _mockRes(filtered)
      }

      const queryParams = new URLSearchParams()
      if (priority) queryParams.append('priority', priority)

      const endpoint = `${API_PREFIX}/collection/reminders${queryParams.toString() ? '?' + queryParams.toString() : ''}`
      const result = await _fetchWithRetry(async () => apiService.get(endpoint))
      telemetry.record('receivables.service.reminders', {
        duration: Date.now() - startTime,
        priority,
      })
      return result
    } catch (error) {
      telemetry.record('receivables.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'getCollectionReminders',
      })
      throw error
    }
  },

  /**
   * Get high priority collection reminders (Endpoint 11)
   * Shortcut for reminders with >60 days overdue
   */
  async getHighPriorityReminders() {
    const startTime = Date.now()
    try {
      if (USE_MOCK) {
        return _mockRes(
          overdueData.items
            .filter(i => i.status === 'CRITICAL')
            .map(item => ({
              receivable_id: item.id,
              client_id: 'client_001',
              client_name: item.client_name,
              client_phone: '+595 981 123 456',
              pending_amount: item.pending_amount,
              days_overdue: item.days_overdue,
              due_date: '2023-12-15T10:00:00Z',
              priority: 'HIGH',
            }))
        )
      }

      const endpoint = `${API_PREFIX}/collection/high-priority`
      const result = await _fetchWithRetry(async () => apiService.get(endpoint))
      telemetry.record('receivables.service.highPriorityReminders', {
        duration: Date.now() - startTime,
      })
      return result
    } catch (error) {
      telemetry.record('receivables.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'getHighPriorityReminders',
      })
      throw error
    }
  },

  /**
   * Get statistics by date range (Endpoint 13)
   * @param {string} startDate - YYYY-MM-DD format
   * @param {string} endDate - YYYY-MM-DD format
   */
  async getStatisticsByDateRange(startDate, endDate) {
    const startTime = Date.now()
    try {
      if (USE_MOCK) {
        return _mockRes({
          period: `${startDate} - ${endDate}`,
          total_billed: summaryData.total_pending,
          total_collected: summaryData.total_pending * 0.7,
          collection_rate: summaryData.collection_rate,
          average_dso: summaryData.average_days_to_collect,
          overdue_percentage: 28.7,
          top_debtors: debtorsData.slice(0, 3),
          collection_trend: [
            {
              date: startDate,
              billed: 45000000,
              collected: 32000000,
              balance: 13000000,
            },
          ],
        })
      }

      const queryParams = new URLSearchParams({
        start_date: startDate,
        end_date: endDate,
      })

      const endpoint = `${API_PREFIX}/statistics/date-range?${queryParams.toString()}`
      const result = await _fetchWithRetry(async () => apiService.get(endpoint))
      telemetry.record('receivables.service.statisticsByDateRange', {
        duration: Date.now() - startTime,
        startDate,
        endDate,
      })
      return result
    } catch (error) {
      telemetry.record('receivables.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'getStatisticsByDateRange',
      })
      throw error
    }
  },
}
