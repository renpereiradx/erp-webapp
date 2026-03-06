import apiService from './api'
import { telemetry } from '../utils/telemetry'
import { accountsPayableData } from '../features/accounts-payable/data/mockData'

const API_PREFIX = '/payables'
const USE_MOCK = import.meta.env.VITE_USE_DEMO === 'true'

// Helper to simulate API delay
const _mockRes = (data) =>
  new Promise((resolve) =>
    setTimeout(() => resolve({ data, success: true }), 600)
  )

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
        await new Promise((resolve) => setTimeout(resolve, backoffMs))
        continue
      }
    }
  }
  throw lastError
}

export const payablesService = {
  /**
   * Get payables summary KPIs
   */
  async getOverview() {
    const startTime = Date.now()
    try {
      if (USE_MOCK) {
        // Transform current mock data to match API schema if needed, 
        // but for demo we can return a structured object similar to the API.
        return _mockRes({
          total_pending: 4820150,
          total_overdue: 842300,
          total_count: 25,
          overdue_count: 18,
          due_this_week: 1250000,
          due_this_month: 2500000,
          average_days_to_pay: 42,
          payment_rate: 94.2,
          currency: "PYG",
          aging_summary: {
            current: { amount: 2540000, count: 12, percentage: 52 },
            days_30_60: { amount: 1100000, count: 7, percentage: 23 },
            days_60_90: { amount: 750000, count: 4, percentage: 15 },
            over_90_days: { amount: 430150, count: 2, percentage: 10 }
          }
        })
      }

      const endpoint = `${API_PREFIX}/overview`
      const result = await _fetchWithRetry(async () => apiService.get(endpoint))
      telemetry.record('payables.service.overview', {
        duration: Date.now() - startTime,
      })
      return result
    } catch (error) {
      telemetry.record('payables.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'getOverview',
      })
      throw error
    }
  },

  /**
   * Get top suppliers with highest debt
   */
  async getTopSuppliers(limit = 10) {
    const startTime = Date.now()
    try {
      if (USE_MOCK) {
        // Map from existing topVendors mock
        return _mockRes(accountsPayableData.topVendors.slice(0, limit).map(v => ({
          supplier_id: v.id,
          supplier_name: v.name,
          total_pending: v.totalBalance,
          total_overdue: v.overdueAmount,
          pending_count: 5,
          payment_history: "GOOD"
        })))
      }

      const endpoint = `${API_PREFIX}/top-suppliers?limit=${limit}`
      const result = await _fetchWithRetry(async () => apiService.get(endpoint))
      telemetry.record('payables.service.topSuppliers', {
        duration: Date.now() - startTime,
        limit,
      })
      return result
    } catch (error) {
      telemetry.record('payables.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'getTopSuppliers',
      })
      throw error
    }
  },

  /**
   * Get scheduled payment calendar
   */
  async getSchedule(days = 30) {
    const startTime = Date.now()
    try {
      if (USE_MOCK) {
        return _mockRes({
          start_date: "2024-05-24",
          end_date: "2024-06-24",
          total_due: 1250000,
          schedule: accountsPayableData.upcomingPayments.map(p => ({
            date: `2024-05-${p.date.day}`,
            day_of_week: "N/A",
            total_due: p.amount,
            item_count: 1,
            items: [{
              payable_id: p.id,
              supplier_name: p.vendor,
              amount: p.amount,
              priority: p.status === 'Urgente' ? 'HIGH' : 'MEDIUM',
              days_until_due: 2
            }]
          }))
        })
      }

      const endpoint = `${API_PREFIX}/schedule?days=${days}`
      const result = await _fetchWithRetry(async () => apiService.get(endpoint))
      telemetry.record('payables.service.schedule', {
        duration: Date.now() - startTime,
        days,
      })
      return result
    } catch (error) {
      telemetry.record('payables.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'getSchedule',
      })
      throw error
    }
  },

  /**
   * Rest of methods (simplified for demo/mvp)
   */
  async getPayables(filters = {}, pagination = {}, sorting = {}) {
    const endpoint = `${API_PREFIX}`
    return _fetchWithRetry(async () => apiService.get(endpoint))
  },

  async getPayableById(id) {
    return _fetchWithRetry(async () => apiService.get(`${API_PREFIX}/${id}`))
  },

  async getAgingSummary() {
    return this.getOverview().then(res => ({ success: true, data: res.data.aging_summary }))
  },

  async getStatistics(period = 'month') {
    if (USE_MOCK) {
      return _mockRes({
        period: "2024-05-01 - 2024-05-31",
        total_purchased: 15000000,
        total_paid: 12825000,
        payment_rate: 85.5,
        average_dpo: 32.5,
        overdue_percentage: 14.12
      })
    }
    return _fetchWithRetry(async () => apiService.get(`${API_PREFIX}/statistics?period=${period}`))
  }
}
