import { apiClient } from '@/services/api'

/**
 * Servicio para obtener datos de rentabilidad.
 */
const profitabilityService = {
  getDashboard: async (period = 'month') => {
    return apiClient.makeRequest('/profitability/dashboard', {
      method: 'GET',
      params: { period },
    })
  },

  getOverview: async (params = {}) => {
    return apiClient.makeRequest('/profitability/overview', {
      method: 'GET',
      params,
    })
  },

  getProducts: async params => {
    return apiClient.makeRequest('/profitability/products', {
      method: 'GET',
      params,
    })
  },

  getCustomers: async params => {
    return apiClient.makeRequest('/profitability/customers', {
      method: 'GET',
      params,
    })
  },

  getCategories: async (params = {}) => {
    return apiClient.makeRequest('/profitability/categories', {
      method: 'GET',
      params,
    })
  },

  getTrends: async params => {
    return apiClient.makeRequest('/profitability/trends', {
      method: 'GET',
      params,
    })
  },

  getSellers: async (params = {}) => {
    return apiClient.makeRequest('/profitability/sellers', {
      method: 'GET',
      params,
    })
  },
}

export default profitabilityService
